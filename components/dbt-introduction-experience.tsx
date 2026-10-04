"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Code2,
  Database,
  FileCode2,
  GitBranch,
  GraduationCap,
  Lightbulb,
  Network,
  NotebookPen,
  Play,
  RefreshCcw,
  ShoppingCart,
  Sparkles,
  Table2,
  Workflow,
  Zap,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  buildDbtExecutionLog,
  dbtIntroScenarios,
  getDbtIntroScenario,
  type DbtIntroScenarioId,
} from "@/lib/dbt-introduction-simulation";

const sourceItems = [
  ["CRM", "SF"],
  ["Application DB", "DB"],
  ["CSV / API", "API"],
  ["Third-party data", "3P"],
];

const warehouseItems = [
  ["Snowflake", "❄"],
  ["BigQuery", "BQ"],
  ["Redshift", "RS"],
  ["Databricks", "◆"],
];

const biItems = [
  ["Metabase", "▦"],
  ["Tableau", "✦"],
  ["Power BI", "▥"],
  ["Looker", "◉"],
];

function BrandDot({ children, tone }: { children: React.ReactNode; tone: "blue" | "orange" | "violet" | "green" | "red" | "dark" }) {
  return <span className={"dbti-brand-dot dbti-brand-dot-" + tone}>{children}</span>;
}

export function DbtIntroductionHero({
  description,
  minutes,
  currentLesson,
  total,
  onPrevious,
  onNext,
}: {
  description: string;
  minutes: number;
  currentLesson: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <section className="dbti-hero">
      <div className="dbti-hero-copy">
        <div className="dbti-breadcrumb"><span>dbt</span><ChevronRight size={14}/><strong>Introduction to dbt</strong></div>
        <div className="dbti-hero-title-row">
          <span className="dbti-hero-icon"><Zap size={31}/></span>
          <div>
            <h1>Introduction to dbt</h1>
            <p>{description}</p>
          </div>
        </div>
        <div className="dbti-meta">
          <span><Clock3 size={15}/>{minutes} min</span>
          <span><GraduationCap size={15}/>Lesson {currentLesson + 1}/{total}</span>
        </div>
      </div>
      <div className="dbti-hero-art" aria-hidden="true">
        <span className="dbti-pill">Beginner</span>
        <div className="dbti-art-orbit dbti-art-orbit-a"/>
        <div className="dbti-art-orbit dbti-art-orbit-b"/>
        <span className="dbti-art-db dbti-art-db-a"><Database size={22}/></span>
        <span className="dbti-art-db dbti-art-db-b"><Database size={20}/></span>
        <span className="dbti-art-code"><Code2 size={24}/></span>
        <span className="dbti-art-logo">✣</span>
        <div className="dbti-hero-nav">
          <button type="button" onClick={onPrevious} disabled={currentLesson === 0} aria-label="Previous lesson"><ChevronLeft size={17}/></button>
          <button type="button" onClick={onNext} disabled={currentLesson === total - 1}>Next <ChevronRight size={16}/></button>
        </div>
      </div>
    </section>
  );
}

function ArchitectureCard({
  step,
  title,
  tone,
  icon,
  children,
}: {
  step: number;
  title: string;
  tone: "blue" | "orange" | "violet" | "green";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article className={"dbti-architecture-card dbti-architecture-" + tone}>
      <div className="dbti-architecture-heading">
        <BrandDot tone={tone}>{icon}</BrandDot>
        <strong>{step}. {title}</strong>
      </div>
      <div className="dbti-architecture-body">{children}</div>
    </article>
  );
}

function ArchitectureList({ items, tone }: { items: string[][]; tone: "blue" | "violet" | "green" }) {
  return (
    <div className="dbti-architecture-list">
      {items.map(([label, badge]) => (
        <div key={label}><BrandDot tone={tone}>{badge}</BrandDot><span>{label}</span></div>
      ))}
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const className = value === "completed" || value === "active" || value === "fulfilled"
    ? "dbti-status dbti-status-green"
    : value === "shipped"
      ? "dbti-status dbti-status-blue"
      : value === "trialing"
        ? "dbti-status dbti-status-violet"
        : "dbti-status dbti-status-amber";
  return <span className={className}>{value}</span>;
}

function CodeView({ code }: { code: string }) {
  const lines = code.split("\n");
  return (
    <pre className="dbti-code-pre" aria-label="dbt model SQL">
      <code>
        {lines.map((line, index) => {
          const trimmed = line.trimStart();
          const keyword = trimmed.startsWith("select") || trimmed.startsWith("from") || trimmed.startsWith("where");
          return (
            <span className="dbti-code-line" key={index}>
              <span className="dbti-line-number">{index + 1}</span>
              <span className={keyword ? "dbti-code-keyword" : undefined}>{line}</span>
            </span>
          );
        })}
      </code>
    </pre>
  );
}

export function DbtIntroductionLab() {
  const [scenarioId, setScenarioId] = useState<DbtIntroScenarioId>("ecommerce");
  const [runState, setRunState] = useState<"idle" | "running" | "success">("idle");
  const [visibleLogs, setVisibleLogs] = useState(0);
  const timers = useRef<number[]>([]);
  const scenario = useMemo(() => getDbtIntroScenario(scenarioId), [scenarioId]);
  const logs = useMemo(() => buildDbtExecutionLog(scenario), [scenario]);

  const clearTimers = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const reset = () => {
    clearTimers();
    setRunState("idle");
    setVisibleLogs(0);
  };

  const run = () => {
    clearTimers();
    setRunState("running");
    setVisibleLogs(1);
    logs.slice(1).forEach((_, index) => {
      const timer = window.setTimeout(() => {
        const count = index + 2;
        setVisibleLogs(count);
        if (count === logs.length) setRunState("success");
      }, 260 * (index + 1));
      timers.current.push(timer);
    });
  };

  const changeScenario = (value: DbtIntroScenarioId) => {
    clearTimers();
    setScenarioId(value);
    setRunState("idle");
    setVisibleLogs(0);
  };

  return (
    <div className="dbti-experience">
      <section className="dbti-architecture-panel">
        <div className="dbti-section-head">
          <div>
            <h2><BookOpen size={21}/>What is dbt? <span>(Interactive Architecture)</span></h2>
            <p>Explore how dbt fits between your source systems, data warehouse, and analytics workflow.</p>
          </div>
          <label className="dbti-scenario">
            <ShoppingCart size={17}/>
            <span className="sr-only">Scenario</span>
            <select value={scenarioId} onChange={(event) => changeScenario(event.target.value as DbtIntroScenarioId)}>
              {dbtIntroScenarios.map((item) => <option value={item.id} key={item.id}>Scenario: {item.label}</option>)}
            </select>
            <ChevronDown size={15} aria-hidden="true"/>
          </label>
        </div>

        <div className="dbti-architecture-flow">
          <ArchitectureCard step={1} title="Source Data" tone="blue" icon={<Database size={17}/>}>
            <ArchitectureList items={sourceItems} tone="blue"/>
          </ArchitectureCard>
          <ArrowRight className="dbti-flow-arrow" size={28}/>
          <ArchitectureCard step={2} title="dbt" tone="orange" icon={<Workflow size={17}/>}>
            <div className="dbti-dbt-logo"><span>✣</span><b>dbt</b></div>
            <ul className="dbti-dbt-points">
              <li><Code2 size={14}/>Write SQL models</li>
              <li><Network size={14}/>Use ref() &amp; source()</li>
              <li><RefreshCcw size={14}/>Run transformations</li>
              <li><CheckCircle2 size={14}/>Test data quality</li>
              <li><FileCode2 size={14}/>Generate documentation</li>
            </ul>
          </ArchitectureCard>
          <ArrowRight className="dbti-flow-arrow" size={28}/>
          <ArchitectureCard step={3} title="Data Warehouse" tone="violet" icon={<Database size={17}/>}>
            <ArchitectureList items={warehouseItems} tone="violet"/>
          </ArchitectureCard>
          <ArrowRight className="dbti-flow-arrow" size={28}/>
          <ArchitectureCard step={4} title="Analytics & BI" tone="green" icon={<BarChart3 size={17}/>}>
            <ArchitectureList items={biItems} tone="green"/>
          </ArchitectureCard>
        </div>

        <div className="dbti-support-flow">
          <div className="dbti-support dbti-support-red">
            <BrandDot tone="red"><GitBranch size={18}/></BrandDot>
            <div><strong>Version Control</strong><b>Git</b><small>Track changes, collaborate</small></div>
          </div>
          <ArrowRight size={21}/>
          <div className="dbti-support dbti-support-blue">
            <BrandDot tone="dark"><GitBranch size={18}/></BrandDot>
            <div><strong>CI/CD (Optional)</strong><b>GitHub Actions</b><small>Run tests automatically</small></div>
          </div>
          <ArrowRight size={21}/>
          <div className="dbti-support dbti-support-violet">
            <BrandDot tone="violet"><Workflow size={18}/></BrandDot>
            <div><strong>Orchestration</strong><b>Airflow</b><small>Schedule dbt runs</small></div>
          </div>
          <ArrowRight size={21}/>
          <div className="dbti-support dbti-support-green">
            <BrandDot tone="green"><BarChart3 size={18}/></BrandDot>
            <div><strong>Production Analytics</strong><b>Trusted data for your team</b><small>Dashboards, reports, insights</small></div>
          </div>
        </div>
      </section>

      <section className="dbti-simulation">
        <div className="dbti-simulation-head">
          <div>
            <h2><Code2 size={22}/>Try a Simple dbt Model</h2>
            <p>Edit the scenario and run the model to see how dbt transforms warehouse data.</p>
          </div>
          <div className="dbti-run-actions">
            <button type="button" className="dbti-run" onClick={run} disabled={runState === "running"}>
              {runState === "running" ? <RefreshCcw className="dbti-spin" size={16}/> : <Play size={16} fill="currentColor"/>}
              {runState === "running" ? "Running..." : "Run Model"}
            </button>
            <button type="button" className="dbti-reset" onClick={reset}><RefreshCcw size={15}/>Reset</button>
          </div>
        </div>

        <div className="dbti-code-log-grid">
          <div className="dbti-dark-panel">
            <div className="dbti-dark-toolbar"><span><FileCode2 size={15}/>models/{scenario.modelName}.sql</span></div>
            <CodeView code={scenario.code}/>
          </div>
          <div className="dbti-dark-panel">
            <div className="dbti-dark-toolbar">
              <span><NotebookPen size={15}/>Execution Log</span>
              {runState === "success" && <span className="dbti-success-pill"><Check size={13}/>Success</span>}
            </div>
            <div className="dbti-log" aria-live="polite">
              {visibleLogs === 0 ? <span className="dbti-log-placeholder">Run the model to compile SQL and create the warehouse relation.</span> : logs.slice(0, visibleLogs).map((log, index) => (
                <div className={index === logs.length - 1 && runState === "success" ? "dbti-log-success" : ""} key={log}>{log}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="dbti-result-grid">
          <div className="dbti-result-card">
            <div className="dbti-result-title"><span><Table2 size={16}/>Query Results Preview <small>({scenario.rowCount.toLocaleString("en-US")} rows)</small></span><button type="button" onClick={run}>View full results →</button></div>
            <div className="dbti-table-wrap">
              <table>
                <thead><tr><th>order_id</th><th>customer_id</th><th>order_date</th><th>order_status</th><th>amount</th></tr></thead>
                <tbody>
                  {scenario.rows.slice(0, runState === "success" ? 4 : 3).map((row) => (
                    <tr key={row.id}><td>{row.id}</td><td>{row.customer}</td><td>{row.date}</td><td><StatusBadge value={row.status}/></td><td>{row.amount}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="dbti-result-card">
            <div className="dbti-result-title"><span><Database size={16}/>Model in Warehouse</span>{runState === "success" && <span className="dbti-table-created"><CheckCircle2 size={13}/>Table Created</span>}</div>
            <div className="dbti-schema">
              <div className="dbti-schema-tree">
                <strong>▾ analytics</strong>
                <span>└─ ▣ {scenario.modelName} (table)</span>
              </div>
              <div className="dbti-schema-fields">
                {scenario.fields.map((field) => <div key={field.name}><span>▦ {field.name}</span><b>{field.type}</b></div>)}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function DbtIntroductionRightRail({
  lessonTitles,
  currentLesson,
  completed,
  onLesson,
  onNotes,
}: {
  lessonTitles: string[];
  currentLesson: number;
  completed: number[];
  onLesson: (lesson: string) => void;
  onNotes: () => void;
}) {
  const takeaways = [
    "dbt is a SQL transformation framework.",
    "It runs in your existing data warehouse.",
    "You write modular, reusable SQL models.",
    "It adds testing, documentation and lineage.",
    "It does not replace ingestion or orchestration.",
  ];
  const why = [
    "Transform data using simple SQL",
    "Version control with Git",
    "Test data quality",
    "Modular and reusable models",
    "Automatic documentation",
    "Integrated with modern data stack",
  ];
  return (
    <aside className="dbti-right-rail">
      <section className="dbti-rail-card dbti-progress-card">
        <div className="dbti-rail-title"><strong>Lesson Progress</strong><span>{completed.length} / {lessonTitles.length} done</span></div>
        <Progress value={completed.length / lessonTitles.length * 100} className="dbti-progress"/>
        <div className="dbti-progress-list">
          {lessonTitles.map((lesson, index) => {
            const state = completed.includes(index) ? "Completed" : index === currentLesson ? "Learning" : "Not started";
            return (
              <button type="button" onClick={() => onLesson(lesson)} className={index === currentLesson ? "dbti-progress-row dbti-progress-row-current" : "dbti-progress-row"} key={lesson}>
                {completed.includes(index) ? <CheckCircle2 size={17}/> : index === currentLesson ? <Play size={17} fill="currentColor"/> : <Circle size={17}/>}
                <span>{index + 1}. {lesson}</span>
                <small>{state}</small>
              </button>
            );
          })}
        </div>
      </section>

      <section className="dbti-rail-card dbti-takeaways">
        <h3><Lightbulb size={20}/>Key Takeaways</h3>
        <ol>
          {takeaways.map((item, index) => <li key={item}><span>{index + 1}</span><p>{item}</p></li>)}
        </ol>
        <div className="dbti-why">
          <h3>Why Use dbt?</h3>
          {why.map((item) => <div key={item}><CheckCircle2 size={17}/><span>{item}</span></div>)}
        </div>
      </section>

      <button type="button" className="dbti-quick-note" onClick={onNotes}>
        <NotebookPen size={18}/>
        <span><strong>Quick Notes</strong><small>Capture a dbt takeaway or interview question.</small></span>
        <ChevronRight size={16}/>
      </button>
    </aside>
  );
}
