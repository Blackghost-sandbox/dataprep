"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  GraduationCap,
  Info,
  KeyRound,
  Lightbulb,
  Play,
  RefreshCcw,
  Table2,
  Zap,
} from "lucide-react";
import { useCompanion } from "@/components/companion-context";

type StageIndex = 0 | 1 | 2 | 3;
type RunStatus = "ready" | "running" | "done";

type TableSpec = {
  title: string;
  columns: string[];
  rows: Array<Array<string | number>>;
};

const UNNORMALIZED: TableSpec = {
  title: "Unnormalized Orders (Repeating Groups)",
  columns: ["order_id", "customer_name", "customer_city", "products", "quantities"],
  rows: [
    [101, "Alice", "New York", "Notebook, Pen", "2, 3"],
    [102, "Bob", "Chicago", "Pencil, Notebook", "5, 1"],
    [103, "Alice", "New York", "Pen, Marker", "2, 4"],
    [104, "Carol", "Boston", "Notebook, Pencil", "1, 2"],
  ],
};

const ONE_NF: TableSpec = {
  title: "1NF – Atomic Values",
  columns: ["order_id", "customer_name", "customer_city", "product", "quantity"],
  rows: [
    [101, "Alice", "New York", "Notebook", 2],
    [101, "Alice", "New York", "Pen", 3],
    [102, "Bob", "Chicago", "Pencil", 5],
    [102, "Bob", "Chicago", "Notebook", 1],
    [103, "Alice", "New York", "Pen", 2],
    [103, "Alice", "New York", "Marker", 4],
    [104, "Carol", "Boston", "Notebook", 1],
    [104, "Carol", "Boston", "Pencil", 2],
  ],
};

const ORDERS_2NF: TableSpec = {
  title: "Orders (order_id → customer)",
  columns: ["order_id", "customer_id", "order_date"],
  rows: [
    [101, 1, "2024-01-10"],
    [102, 2, "2024-01-11"],
    [103, 1, "2024-01-12"],
    [104, 3, "2024-01-13"],
  ],
};

const ITEMS_2NF: TableSpec = {
  title: "Order Items (order_id + product_id)",
  columns: ["order_id", "product_id", "quantity"],
  rows: [
    [101, 1, 2],
    [101, 2, 3],
    [102, 3, 5],
    [102, 1, 1],
    [103, 2, 2],
    [103, 4, 4],
    [104, 1, 1],
    [104, 3, 2],
  ],
};

const CUSTOMERS_3NF: TableSpec = {
  title: "Customers (customer_id)",
  columns: ["customer_id", "name", "city"],
  rows: [
    [1, "Alice", "New York"],
    [2, "Bob", "Chicago"],
    [3, "Carol", "Boston"],
  ],
};

const PRODUCTS_3NF: TableSpec = {
  title: "Products (product_id)",
  columns: ["product_id", "product_name", "category", "price"],
  rows: [
    [1, "Notebook", "Stationery", "5.00"],
    [2, "Pen", "Stationery", "1.00"],
    [3, "Pencil", "Stationery", "0.50"],
    [4, "Marker", "Stationery", "1.50"],
  ],
};

const STAGES = [
  {
    title: "Before",
    subtitle: "(Unnormalized)",
    tone: "red",
    note: "Repeating groups and redundant customer data create update anomalies.",
  },
  {
    title: "1NF",
    subtitle: "(Remove repeating groups)",
    tone: "violet",
    note: "Each cell becomes atomic and each purchased product occupies its own row.",
  },
  {
    title: "2NF",
    subtitle: "(Remove partial dependencies)",
    tone: "blue",
    note: "Order-level facts separate from line-level quantity so attributes depend on the full key.",
  },
  {
    title: "3NF",
    subtitle: "(Remove transitive dependencies)",
    tone: "green",
    note: "Customer and product descriptions move to entities identified by their own keys.",
  },
] as const;

const DEPENDENCIES = [
  {
    label: "Unnormalized",
    tone: "red",
    lines: ["order_id", "customer_name, customer_city", "product, quantity"],
    foot: "Update anomalies",
  },
  {
    label: "1NF",
    tone: "violet",
    lines: ["order_id", "customer_name, customer_city", "product, quantity"],
    foot: "Atomic values only",
  },
  {
    label: "2NF",
    tone: "blue",
    lines: ["order_id → customer_id, order_date", "(order_id, product_id) → quantity"],
    foot: "No partial dependencies",
  },
  {
    label: "3NF",
    tone: "green",
    lines: ["customer_id → name, city", "product_id → name, category, price"],
    foot: "No transitive dependencies",
  },
] as const;

function DataTable({ spec, compact = false }: { spec: TableSpec; compact?: boolean }) {
  return (
    <div className={compact ? "mnorm-table mnorm-table-compact" : "mnorm-table"}>
      <strong>{spec.title}</strong>
      <div>
        <table>
          <thead><tr>{spec.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>{spec.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, columnIndex) => <td key={columnIndex}>{String(value)}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

function StageColumn({
  stage,
  activeStage,
  children,
}: {
  stage: StageIndex;
  activeStage: StageIndex;
  children: ReactNode;
}) {
  return <section className={`mnorm-stage-column mnorm-stage-${stage} ${activeStage < stage ? "is-future" : ""} ${activeStage === stage ? "is-active" : ""}`}>{children}</section>;
}

export function ModelingNormalizationHero({
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
    <section className="mnorm-hero" aria-labelledby="mnorm-hero-title">
      <div className="mnorm-hero-copy">
        <div className="mnorm-breadcrumb"><span>Data Modeling</span><ChevronRight size={13}/><strong>Normalization</strong></div>
        <div className="mnorm-title-row"><span className="mnorm-hero-icon"><Zap size={24}/></span><div><h1 id="mnorm-hero-title">Normalization</h1><p>{description}</p></div></div>
        <div className="mnorm-meta"><span><Clock3 size={14}/>{minutes} min</span><span><GraduationCap size={14}/>Lesson {currentLesson + 1}/{total}</span></div>
      </div>
      <div className="mnorm-hero-art" aria-hidden="true">
        <div className="mnorm-db mnorm-db-small"><Database size={48}/></div>
        <div className="mnorm-db mnorm-db-main"><Database size={74}/></div>
        <div className="mnorm-grid-card"><Table2 size={48}/></div>
        <span className="mnorm-split-arrow"><ArrowRight size={30}/></span>
        <div className="mnorm-mini-cols"><i/><i/></div>
      </div>
      <div className="mnorm-hero-actions">
        <span className="mnorm-difficulty">Intermediate</span>
        <div><button type="button" aria-label="Previous lesson" onClick={onPrevious} disabled={currentLesson === 0}><ChevronLeft size={18}/></button><button type="button" className="mnorm-next" onClick={onNext} disabled={currentLesson === total - 1}>Next <ChevronRight size={17}/></button></div>
      </div>
    </section>
  );
}

export function ModelingNormalizationPlayground({ labMode = false }: { labMode?: boolean }) {
  const companion = useCompanion();
  const [activeStage, setActiveStage] = useState<StageIndex>(labMode ? 0 : 3);
  const [stepByStep, setStepByStep] = useState(labMode);
  const [status, setStatus] = useState<RunStatus>(labMode ? "ready" : "done");
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const emitComplete = () => {
    companion?.emit({ type: "exercise_correct", lesson: "Normalization", source: "runner" });
  };

  const setStage = (next: StageIndex) => {
    clearTimers();
    setActiveStage(next);
    setStatus(next === 3 ? "done" : "ready");
    if (next === 3) emitComplete();
  };

  const run = () => {
    clearTimers();
    if (stepByStep) {
      const next = status !== "running" ? 0 : Math.min(3, activeStage + 1) as StageIndex;
      setActiveStage(next);
      if (next === 3) {
        setStatus("done");
        emitComplete();
      } else {
        setStatus("running");
      }
      return;
    }

    setStatus("running");
    setActiveStage(0);
    [1, 2, 3].forEach((stage, index) => {
      const timer = setTimeout(() => {
        setActiveStage(stage as StageIndex);
        if (stage === 3) {
          setStatus("done");
          emitComplete();
        }
      }, 330 + index * 460);
      timers.current.push(timer);
    });
  };

  const reset = () => {
    clearTimers();
    setActiveStage(0);
    setStatus("ready");
    setStepByStep(false);
  };

  const activeDependency = useMemo(() => DEPENDENCIES[activeStage], [activeStage]);

  return (
    <section className="mnorm-playground" aria-labelledby="mnorm-playground-title">
      <header className="mnorm-playground-head">
        <div><h2 id="mnorm-playground-title"><Database size={24}/>Normalization Playground</h2><p>Decompose the order management data from unnormalized form to 1NF, 2NF and 3NF.</p></div>
        <div className="mnorm-controls">
          <button type="button" className="mnorm-run" onClick={run}><Play size={15} fill="currentColor"/>{stepByStep && status === "running" ? "Next Step" : "Run Decomposition"}</button>
          <label className="mnorm-toggle"><input type="checkbox" checked={stepByStep} onChange={(event) => { clearTimers(); setStepByStep(event.target.checked); setStatus("ready"); if (event.target.checked) setActiveStage(0); }}/><span/>Step by step</label>
          <button type="button" className="mnorm-reset" onClick={reset}><RefreshCcw size={14}/>Reset</button>
        </div>
      </header>

      <div className="mnorm-stage-strip" aria-label="Normalization stages">
        {STAGES.map((stage, index) => <button type="button" key={stage.title} className={`mnorm-strip-${stage.tone} ${activeStage === index ? "is-active" : ""} ${activeStage > index ? "is-complete" : ""}`} onClick={() => setStage(index as StageIndex)} aria-current={activeStage === index ? "step" : undefined}>
          <span>{index + 1}</span><div><strong>{stage.title}</strong><small>{stage.subtitle}</small></div>
        </button>)}
      </div>

      <div className="mnorm-stage-grid">
        <StageColumn stage={0} activeStage={activeStage}>
          <header><span><AlertCircle size={15}/></span><strong>Unnormalized Orders (Repeating Groups)</strong></header>
          <DataTable spec={UNNORMALIZED}/>
          <div className="mnorm-problem-box">
            <h3><AlertCircle size={15}/>Problems in this table</h3>
            <ul><li>Repeating groups (multiple products in one row)</li><li>Redundant data (Alice, New York repeated)</li><li>Update anomalies (change city in many places)</li></ul>
          </div>
        </StageColumn>

        <div className="mnorm-stage-arrow" aria-hidden="true"><ArrowRight size={23}/></div>

        <StageColumn stage={1} activeStage={activeStage}>
          <header><span><CheckCircle2 size={15}/></span><strong>1NF – Atomic Values</strong></header>
          <DataTable spec={ONE_NF}/>
          <div className="mnorm-insight mnorm-insight-violet"><Info size={15}/><div><strong>Repeating groups removed</strong><ul><li>Each cell has a single value</li><li>One row per product in an order</li></ul></div></div>
        </StageColumn>

        <div className="mnorm-stage-arrow" aria-hidden="true"><ArrowRight size={23}/></div>

        <StageColumn stage={2} activeStage={activeStage}>
          <header><span><CheckCircle2 size={15}/></span><strong>2NF – Remove Partial Dependencies</strong></header>
          <DataTable spec={ORDERS_2NF} compact/>
          <DataTable spec={ITEMS_2NF} compact/>
          <div className="mnorm-insight mnorm-insight-blue"><Info size={15}/><div><strong>Partial dependency removed</strong><ul><li>Product details no longer depend only on part of the composite key</li></ul></div></div>
        </StageColumn>

        <div className="mnorm-stage-arrow" aria-hidden="true"><ArrowRight size={23}/></div>

        <StageColumn stage={3} activeStage={activeStage}>
          <header><span><CheckCircle2 size={15}/></span><strong>3NF – Remove Transitive Dependencies</strong></header>
          <DataTable spec={CUSTOMERS_3NF} compact/>
          <DataTable spec={PRODUCTS_3NF} compact/>
          <div className="mnorm-insight mnorm-insight-green"><CheckCircle2 size={15}/><div><strong>Transitive dependency removed</strong><ul><li>Customer city stored only in Customers</li><li>Product details stored only in Products</li></ul></div></div>
        </StageColumn>
      </div>

      <div className="mnorm-bottom">
        <section className="mnorm-dependency">
          <header><Database size={17}/><strong>Dependency View</strong></header>
          <div>
            {DEPENDENCIES.map((item, index) => <button type="button" key={item.label} className={`mnorm-dependency-card mnorm-dependency-${item.tone} ${activeStage === index ? "is-active" : ""} ${activeStage < index ? "is-future" : ""}`} onClick={() => setStage(index as StageIndex)}>
              <strong>{item.label}</strong>
              {item.lines.map((line) => <span key={line}><KeyRound size={9}/>{line}</span>)}
              <small>{item.foot}</small>
            </button>)}
          </div>
          <p><b>{activeDependency.label}:</b> {STAGES[activeStage].note}</p>
        </section>

        <section className="mnorm-takeaways">
          <header><Lightbulb size={18}/><strong>Key Takeaways</strong></header>
          <ul>
            <li className={activeStage >= 1 ? "is-active" : ""}><CheckCircle2 size={14}/>1NF removes repeating groups.</li>
            <li className={activeStage >= 2 ? "is-active" : ""}><CheckCircle2 size={14}/>2NF removes partial dependencies (depend on part of a composite key).</li>
            <li className={activeStage >= 3 ? "is-active" : ""}><CheckCircle2 size={14}/>3NF removes transitive dependencies (non-key attributes depending on other non-key attributes).</li>
          </ul>
        </section>
      </div>

      <span className="mnorm-status" role="status">{status === "running" ? `Decomposition stage ${activeStage + 1} of 4` : status === "done" ? "Normalization decomposition complete through 3NF." : `Ready at ${STAGES[activeStage].title}. Run or select a stage to continue.`}</span>
    </section>
  );
}
