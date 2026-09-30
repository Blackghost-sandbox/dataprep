"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Database,
  GraduationCap,
  Link2,
  Minus,
  Network,
  Play,
  Plus,
  RefreshCcw,
  Table2,
  UserRound,
  UsersRound,
  Zap,
} from "lucide-react";
import { useCompanion } from "@/components/companion-context";

type RelationKind = "one-one" | "one-many" | "many-many";
type BottomView = "data" | "rows" | "sql";
type SimStatus = "idle" | "running" | "done";

type Row = Record<string, string | number>;

interface RelationConfig {
  id: RelationKind;
  notation: string;
  title: string;
  subtitle: string;
  leftLabel: string;
  rightLabel: string;
  leftUnit: string;
  rightUnit: string;
  description: string;
  minimum: string;
  maximum: string;
  foreignKey: string;
  why: string;
  rule: string;
  defaultLeft: number;
  defaultRight: number;
}

const RELATIONS: RelationConfig[] = [
  {
    id: "one-one",
    notation: "1 : 1",
    title: "One to One",
    subtitle: "Each row matches exactly one row",
    leftLabel: "Customer",
    rightLabel: "Profile",
    leftUnit: "Customers",
    rightUnit: "Profiles",
    description: "One row on the left can relate to at most one row on the right. Each profile belongs to exactly one customer.",
    minimum: "0 or 1",
    maximum: "One",
    foreignKey: "In Profile (customer_id UNIQUE)",
    why: "UNIQUE on Profile.customer_id prevents two profiles from referencing the same customer.",
    rule: "1 customer → 0 or 1 profile",
    defaultLeft: 3,
    defaultRight: 3,
  },
  {
    id: "one-many",
    notation: "1 : N",
    title: "One to Many",
    subtitle: "One row can match many rows",
    leftLabel: "Customer",
    rightLabel: "Order",
    leftUnit: "Customers",
    rightUnit: "Orders",
    description: "One row on the left can be related to many rows on the right. Each right row belongs to exactly one left row.",
    minimum: "0 or more",
    maximum: "Many",
    foreignKey: "In Order (customer_id)",
    why: "Multiple orders can reference the same customer.",
    rule: "1 customer → 0 or many orders",
    defaultLeft: 3,
    defaultRight: 6,
  },
  {
    id: "many-many",
    notation: "N : M",
    title: "Many to Many",
    subtitle: "Many rows can match many rows",
    leftLabel: "Student",
    rightLabel: "Course",
    leftUnit: "Students",
    rightUnit: "Courses",
    description: "Many rows on either side can be related. A bridge row records each valid student-course pairing.",
    minimum: "0 or more",
    maximum: "Many",
    foreignKey: "In Enrollment (student_id, course_id)",
    why: "Enrollment resolves the many-to-many relationship into two one-to-many relationships.",
    rule: "many students ↔ many courses via Enrollment",
    defaultLeft: 3,
    defaultRight: 4,
  },
];

const CUSTOMER_NAMES = ["Alice", "Bob", "Carol", "David", "Emma", "Farah", "Gabe", "Hana"];
const CITIES = ["New York", "Chicago", "Boston", "Seattle", "Austin", "Denver", "Miami", "Portland"];
const COURSE_NAMES = ["SQL Foundations", "Data Modeling", "Python ETL", "Apache Spark", "Airflow", "Kafka"];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function buildLeftRows(kind: RelationKind, count: number): Row[] {
  if (kind === "many-many") {
    return Array.from({ length: count }, (_, index) => ({
      student_id: index + 1,
      name: CUSTOMER_NAMES[index % CUSTOMER_NAMES.length],
      cohort: index % 2 === 0 ? "A" : "B",
    }));
  }
  return Array.from({ length: count }, (_, index) => ({
    customer_id: index + 1,
    name: CUSTOMER_NAMES[index % CUSTOMER_NAMES.length],
    city: CITIES[index % CITIES.length],
  }));
}

function buildRightRows(kind: RelationKind, leftCount: number, rightCount: number): Row[] {
  if (kind === "one-one") {
    return Array.from({ length: rightCount }, (_, index) => ({
      profile_id: 201 + index,
      customer_id: leftCount ? Math.min(leftCount, Math.floor(index * leftCount / Math.max(1, rightCount)) + 1) : "",
      tier: ["Gold", "Silver", "Bronze"][index % 3],
    }));
  }
  if (kind === "many-many") {
    return Array.from({ length: rightCount }, (_, index) => ({
      course_id: 301 + index,
      course: COURSE_NAMES[index % COURSE_NAMES.length],
      level: ["Beginner", "Intermediate", "Advanced"][index % 3],
    }));
  }
  const amounts = ["120.00", "75.00", "220.00", "90.00", "150.00", "60.00", "180.00", "95.00"];
  const dates = ["2024-01-10", "2024-01-12", "2024-01-15", "2024-01-18", "2024-01-20", "2024-01-22", "2024-01-25", "2024-01-28"];
  return Array.from({ length: rightCount }, (_, index) => ({
    order_id: 101 + index,
    customer_id: leftCount ? Math.min(leftCount, Math.floor(index * leftCount / Math.max(1, rightCount)) + 1) : "",
    order_date: dates[index % dates.length],
    amount: amounts[index % amounts.length],
  }));
}

function buildLinks(kind: RelationKind, leftCount: number, rightCount: number): Array<{ left: number; right: number }> {
  if (!leftCount || !rightCount) return [];
  if (kind === "one-one") {
    return Array.from({ length: Math.min(leftCount, rightCount) }, (_, index) => ({ left: index + 1, right: index + 1 }));
  }
  if (kind === "one-many") {
    return Array.from({ length: rightCount }, (_, index) => ({ left: Math.min(leftCount, Math.floor(index * leftCount / Math.max(1, rightCount)) + 1), right: index + 1 }));
  }
  const target = Math.min(leftCount * rightCount, Math.max(leftCount, rightCount) + Math.min(leftCount, rightCount));
  return Array.from({ length: target }, (_, index) => ({
    left: (index % leftCount) + 1,
    right: ((index * 2 + Math.floor(index / Math.max(1, leftCount))) % rightCount) + 1,
  })).filter((link, index, rows) => rows.findIndex((item) => item.left === link.left && item.right === link.right) === index);
}

function relationIsValid(kind: RelationKind, leftCount: number, rightCount: number) {
  if (kind === "one-one") return rightCount <= leftCount;
  if (kind === "one-many") return rightCount === 0 || leftCount > 0;
  return true;
}

function TableView({ rows, title }: { rows: Row[]; title: string }) {
  const columns = Object.keys(rows[0] ?? {});
  return (
    <div className="mcard-table-block">
      <strong>{title} ({rows.length} rows)</strong>
      {rows.length === 0 ? <div className="mcard-empty-table">0 rows generated · optional participation can be valid.</div> : <div><table>
        <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index}>{columns.map((column) => <td key={column}>{String(row[column])}</td>)}</tr>)}</tbody>
      </table></div>}
    </div>
  );
}

function CountControl({
  value,
  onChange,
  onGenerate,
}: {
  value: number;
  onChange: (value: number) => void;
  onGenerate: () => void;
}) {
  return (
    <div className="mcard-count-control">
      <button type="button" aria-label="Decrease row count" onClick={() => onChange(clamp(value - 1, 0, 12))}><Minus size={13}/></button>
      <output>{value}</output>
      <button type="button" aria-label="Increase row count" onClick={() => onChange(clamp(value + 1, 0, 12))}><Plus size={13}/></button>
      <button type="button" className="mcard-generate" onClick={onGenerate}><RefreshCcw size={12}/>Generate Data</button>
    </div>
  );
}

export function ModelingCardinalityHero({
  currentLesson,
  total,
  minutes,
  description,
  onPrevious,
  onNext,
}: {
  currentLesson: number;
  total: number;
  minutes: number;
  description: string;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <section className="mcard-hero" aria-labelledby="mcard-hero-title">
      <div className="mcard-hero-copy">
        <div className="mcard-breadcrumb"><span>Data Modeling</span><ChevronRight size={13}/><strong>Cardinality</strong></div>
        <div className="mcard-title-row"><span className="mcard-hero-icon"><Zap size={24}/></span><div><h1 id="mcard-hero-title">Cardinality</h1><p>{description}</p></div></div>
        <div className="mcard-meta"><span><Clock3 size={14}/>{minutes} min</span><span><GraduationCap size={14}/>Lesson {currentLesson + 1}/{total}</span></div>
      </div>
      <div className="mcard-hero-art" aria-hidden="true">
        <span className="mcard-art-label mcard-art-one">1:1</span>
        <span className="mcard-art-label mcard-art-many">1:N</span>
        <span className="mcard-art-label mcard-art-mm">N:M</span>
        <div className="mcard-art-db mcard-art-left"><Database size={55}/></div>
        <div className="mcard-art-db mcard-art-right"><Database size={63}/></div>
        <span className="mcard-art-arrow"><ArrowRight size={34}/></span>
        <span className="mcard-art-link"><Link2 size={27}/></span>
      </div>
      <div className="mcard-hero-actions">
        <span className="mcard-difficulty">Intermediate</span>
        <div><button type="button" aria-label="Previous lesson" onClick={onPrevious} disabled={currentLesson === 0}><ChevronLeft size={18}/></button><button type="button" className="mcard-next" onClick={onNext} disabled={currentLesson === total - 1}>Next <ChevronRight size={17}/></button></div>
      </div>
    </section>
  );
}

export function ModelingCardinalityPlayground() {
  const companion = useCompanion();
  const [kind, setKind] = useState<RelationKind>("one-many");
  const [draftLeft, setDraftLeft] = useState(3);
  const [draftRight, setDraftRight] = useState(6);
  const [appliedLeft, setAppliedLeft] = useState(3);
  const [appliedRight, setAppliedRight] = useState(6);
  const [bottomView, setBottomView] = useState<BottomView>("data");
  const [stepByStep, setStepByStep] = useState(false);
  const [status, setStatus] = useState<SimStatus>("done");
  const [step, setStep] = useState(3);
  const [copied, setCopied] = useState(false);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const config = RELATIONS.find((relation) => relation.id === kind)!;
  const leftRows = useMemo(() => buildLeftRows(kind, appliedLeft), [kind, appliedLeft]);
  const rightRows = useMemo(() => buildRightRows(kind, appliedLeft, appliedRight), [kind, appliedLeft, appliedRight]);
  const links = useMemo(() => buildLinks(kind, appliedLeft, appliedRight), [kind, appliedLeft, appliedRight]);
  const valid = relationIsValid(kind, appliedLeft, appliedRight);

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const markPending = () => {
    clearTimers();
    setStatus("idle");
    setStep(-1);
  };

  const selectKind = (nextKind: RelationKind) => {
    clearTimers();
    const next = RELATIONS.find((relation) => relation.id === nextKind)!;
    setKind(nextKind);
    setDraftLeft(next.defaultLeft);
    setDraftRight(next.defaultRight);
    setAppliedLeft(next.defaultLeft);
    setAppliedRight(next.defaultRight);
    setStatus("done");
    setStep(3);
    setBottomView("data");
    setCopied(false);
  };

  const applyLeft = () => {
    setAppliedLeft(draftLeft);
    setStatus("idle");
    setStep(-1);
  };

  const applyRight = () => {
    setAppliedRight(draftRight);
    setStatus("idle");
    setStep(-1);
  };

  const emitResult = (nextLeft: number, nextRight: number) => {
    companion?.emit({
      type: relationIsValid(kind, nextLeft, nextRight) ? "exercise_correct" : "exercise_error",
      lesson: "Cardinality",
      source: "runner",
    });
  };

  const runSimulation = () => {
    clearTimers();
    setAppliedLeft(draftLeft);
    setAppliedRight(draftRight);

    if (stepByStep) {
      const nextStep = status !== "running" || step >= 3 ? 0 : step + 1;
      setStep(nextStep);
      setStatus(nextStep === 3 ? "done" : "running");
      if (nextStep === 3) emitResult(draftLeft, draftRight);
      return;
    }

    setStatus("running");
    setStep(0);
    [0, 1, 2, 3].forEach((nextStep, index) => {
      const timer = setTimeout(() => {
        setStep(nextStep);
        if (nextStep === 3) {
          setStatus("done");
          emitResult(draftLeft, draftRight);
        }
      }, 120 + index * 260);
      timers.current.push(timer);
    });
  };

  const reset = () => {
    clearTimers();
    setKind("one-many");
    setDraftLeft(3);
    setDraftRight(6);
    setAppliedLeft(3);
    setAppliedRight(6);
    setBottomView("data");
    setStepByStep(false);
    setStatus("done");
    setStep(3);
    setCopied(false);
  };

  const sql = kind === "one-one"
    ? `CREATE TABLE customer_profile (\n  profile_id INTEGER PRIMARY KEY,\n  customer_id INTEGER NOT NULL UNIQUE\n    REFERENCES customer(customer_id)\n);`
    : kind === "many-many"
      ? `CREATE TABLE enrollment (\n  student_id INTEGER REFERENCES student(student_id),\n  course_id INTEGER REFERENCES course(course_id),\n  PRIMARY KEY (student_id, course_id)\n);`
      : `CREATE TABLE orders (\n  order_id INTEGER PRIMARY KEY,\n  customer_id INTEGER NOT NULL\n    REFERENCES customer(customer_id)\n);`;

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  const relationRows = links.map((link, index) => ({
    link: index + 1,
    [kind === "many-many" ? "student_id" : "customer_id"]: link.left,
    [kind === "one-one" ? "profile_id" : kind === "many-many" ? "course_id" : "order_id"]:
      kind === "one-one" ? 200 + link.right : kind === "many-many" ? 300 + link.right : 100 + link.right,
  }));

  return (
    <section className="mcard-playground" aria-labelledby="mcard-playground-title">
      <header className="mcard-playground-head">
        <div><h2 id="mcard-playground-title"><Network size={22}/>Cardinality Playground</h2><p>Adjust the number of records and run the simulation to see how cardinality rules work in practice.</p></div>
        <div className="mcard-controls">
          <button type="button" className="mcard-run" onClick={runSimulation}><Play size={15} fill="currentColor"/>{stepByStep && status === "running" ? "Next Step" : "Run Simulation"}</button>
          <label className="mcard-toggle"><input type="checkbox" checked={stepByStep} onChange={(event) => { clearTimers(); setStepByStep(event.target.checked); setStatus("idle"); setStep(-1); }}/><span/>Step by step</label>
          <button type="button" className="mcard-reset" onClick={reset}><RefreshCcw size={14}/>Reset</button>
        </div>
      </header>

      <div className="mcard-core-grid">
      <div className="mcard-relation-types" role="group" aria-label="Cardinality type">
        {RELATIONS.map((relation) => <button type="button" key={relation.id} aria-pressed={kind === relation.id} onClick={() => selectKind(relation.id)}>
          <span>{relation.id === "one-one" ? <UserRound size={23}/> : relation.id === "one-many" ? <UsersRound size={23}/> : <Network size={23}/>}</span>
          <div><strong>{relation.notation}</strong><b>{relation.title}</b><small>{relation.subtitle}</small></div>
        </button>)}
      </div>

        <section className="mcard-side-table mcard-left-card">
          <header><UserRound size={19}/><div><h3>{config.leftLabel} ({kind === "many-many" ? "N" : "1"})</h3><p>{kind === "many-many" ? "A student can take many courses" : kind === "one-one" ? "A customer may have one profile" : "Each customer can have many orders"}</p></div></header>
          <CountControl value={draftLeft} onChange={(value) => { setDraftLeft(value); markPending(); }} onGenerate={applyLeft}/>
          <TableView rows={leftRows} title=""/>
        </section>

        <section className={`mcard-diagram ${step >= 1 ? "is-linked" : ""} ${step >= 2 ? "is-resolved" : ""}`} aria-label="Relationship simulation">
          {kind === "many-many" ? <>
            <div className="mcard-node"><UserRound size={20}/><strong>Student</strong><b>N</b></div>
            <div className="mcard-link-label"><span>N : M</span><i/><small>via Enrollment</small></div>
            <div className="mcard-node mcard-bridge-node"><Link2 size={20}/><strong>Enrollment</strong><b>bridge</b></div>
            <ArrowRight className="mcard-mm-arrow" size={20}/>
            <div className="mcard-node mcard-node-right"><Database size={20}/><strong>Course</strong><b>M</b></div>
          </> : <>
            <div className="mcard-node"><UserRound size={20}/><strong>{config.leftLabel}</strong><b>1</b></div>
            <div className="mcard-link-label"><span>{config.notation}</span><i/><small>{kind === "one-one" ? "At most one profile" : "One customer → many orders"}</small></div>
            <div className="mcard-node mcard-node-right"><Database size={20}/><strong>{config.rightLabel}</strong><b>{kind === "one-one" ? "1" : "N"}</b></div>
          </>}
        </section>

        <section className="mcard-side-table mcard-right-card">
          <header><Database size={19}/><div><h3>{config.rightLabel} ({kind === "one-one" ? "1" : kind === "many-many" ? "M" : "N"})</h3><p>{kind === "one-one" ? "Each profile belongs to one customer" : kind === "many-many" ? "A course can have many students" : "Each order belongs to one customer"}</p></div></header>
          <CountControl value={draftRight} onChange={(value) => { setDraftRight(value); markPending(); }} onGenerate={applyRight}/>
          <TableView rows={rightRows} title=""/>
        </section>

        <aside className={`mcard-inspector ${step >= 2 ? "is-active" : ""}`}>
          <header><GraduationCap size={18}/><h3>Relationship Inspector</h3></header>
          <h4>Current Relationship</h4>
          <div className="mcard-inspector-pill"><strong>{config.notation}</strong><span>{config.title}</span></div>
          <p>{config.description}</p>
          <dl>
            <div><dt>Minimum participation</dt><dd>{config.minimum}</dd></div>
            <div><dt>Maximum participation</dt><dd>{config.maximum}</dd></div>
            <div><dt>Foreign key location</dt><dd>{config.foreignKey}</dd></div>
            <div><dt>Why valid?</dt><dd>{config.why}</dd></div>
          </dl>
        </aside>
      </div>

      <div className="mcard-stats">
        <article><span><UserRound size={18}/></span><div><small>Left side rows<br/>({config.leftUnit})</small><strong>{appliedLeft}</strong></div></article>
        <article><span><Database size={18}/></span><div><small>Right side rows<br/>({config.rightUnit})</small><strong>{appliedRight}</strong></div></article>
        <article><span><Link2 size={18}/></span><div><small>Matching links<br/>(Valid relationships)</small><strong>{links.length}</strong></div></article>
        <article className={valid ? "is-valid" : "is-invalid"}><span>{valid ? <Check size={20}/> : "!"}</span><div><small>Cardinality rule</small><strong>{config.rule}</strong></div><b>{valid ? "Valid" : "Invalid"}</b></article>
      </div>

      <section className={`mcard-data-panel ${step >= 3 ? "is-visible" : ""}`}>
        <nav role="tablist" aria-label="Cardinality data views">
          <button type="button" role="tab" aria-selected={bottomView === "data"} onClick={() => setBottomView("data")}><Table2 size={14}/>Data View</button>
          <button type="button" role="tab" aria-selected={bottomView === "rows"} onClick={() => setBottomView("rows")}><Network size={14}/>Relationship in Rows</button>
          <button type="button" role="tab" aria-selected={bottomView === "sql"} onClick={() => setBottomView("sql")}>&lt;/&gt; SQL Preview</button>
        </nav>
        {bottomView === "data" && <div className="mcard-data-grid"><TableView rows={leftRows} title={`${config.leftLabel.toLowerCase()}s`}/><TableView rows={rightRows} title={`${config.rightLabel.toLowerCase()}s`}/>{kind === "many-many" && <TableView rows={relationRows} title="enrollment"/>}</div>}
        {bottomView === "rows" && <div className="mcard-rows-view"><div><h3>{config.notation} relationships</h3><p>{config.description}</p></div><TableView rows={relationRows} title={kind === "many-many" ? "Enrollment bridge" : "Relationship rows"}/></div>}
        {bottomView === "sql" && <div className="mcard-sql-view"><header><strong>SQL representation</strong><button type="button" onClick={copySql}>{copied ? <CheckCircle2 size={13}/> : <Copy size={13}/>} {copied ? "Copied" : "Copy"}</button></header><pre><code>{sql}</code></pre></div>}
      </section>

      <span className="mcard-sim-status" role="status">{status === "running" ? `Simulation step ${Math.max(1, step + 1)} of 4` : status === "idle" ? "Changes pending — run the simulation to apply and inspect the relationship." : valid ? "Simulation complete — relationship satisfies the selected cardinality." : "Simulation complete — the selected counts violate this cardinality."}</span>
    </section>
  );
}
