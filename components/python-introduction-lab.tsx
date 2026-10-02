"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  CheckCircle2,
  Cloud,
  Code2,
  Copy,
  Database,
  Eye,
  File,
  FileText,
  Folder,
  GitBranch,
  HardDrive,
  Layers3,
  Play,
  RotateCcw,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Wand2,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";

type StageKey = "extract" | "transform" | "load";

type PipelineItem = {
  label: string;
  detail: string;
  icon: LucideIcon;
  tone: string;
};

const extractItems: PipelineItem[] = [
  { label: "Databases", detail: "PostgreSQL, MySQL, etc.", icon: Database, tone: "blue" },
  { label: "Files", detail: "CSV, JSON, Parquet, Excel", icon: File, tone: "green" },
  { label: "APIs", detail: "REST, GraphQL, etc.", icon: Cloud, tone: "sky" },
  { label: "Others", detail: "S3, Cloud Storage, etc.", icon: HardDrive, tone: "orange" },
];

const transformItems: PipelineItem[] = [
  { label: "Data Cleaning", detail: "Handle missing values, remove duplicates", icon: Wand2, tone: "violet" },
  { label: "Data Transformation", detail: "Filter, aggregate, reshape", icon: SlidersHorizontal, tone: "purple" },
  { label: "Business Logic", detail: "Apply rules and calculations", icon: Code2, tone: "indigo" },
  { label: "Data Validation", detail: "Check data quality", icon: ShieldCheck, tone: "emerald" },
];

const loadItems: PipelineItem[] = [
  { label: "Data Warehouse", detail: "Snowflake, BigQuery, etc.", icon: Sparkles, tone: "cyan" },
  { label: "Databases", detail: "PostgreSQL, MySQL, etc.", icon: Database, tone: "blue" },
  { label: "Data Lake", detail: "S3, ADLS, GCS, etc.", icon: Cloud, tone: "sky" },
  { label: "Files", detail: "CSV, Parquet, etc.", icon: Folder, tone: "amber" },
];

const businessItems: PipelineItem[] = [
  { label: "Analytics Dashboards", detail: "BI and decision support", icon: BarChart3, tone: "orange" },
  { label: "Machine Learning", detail: "Features and model inputs", icon: Brain, tone: "rose" },
  { label: "Reports", detail: "Scheduled business reporting", icon: FileText, tone: "amber" },
  { label: "Operational Systems", detail: "Apps and downstream services", icon: Server, tone: "red" },
];

const codeLines = [
  "# 1. Extract — read data from a CSV file",
  "import pandas as pd",
  "",
  'df = pd.read_csv("sales_data.csv")',
  "",
  "# 2. Transform — clean and aggregate",
  "df_clean = df.dropna()",
  'df_summary = df_clean.groupby("product")["sales"].sum().reset_index()',
  "",
  "# 3. Load — save to a new file (or database)",
  'df_summary.to_parquet("sales_summary.parquet")',
];

const stageLines: Record<StageKey, number[]> = {
  extract: [0, 1, 3],
  transform: [5, 6, 7],
  load: [9, 10],
};

const sampleOutput = [
  ["A", "1250"],
  ["B", "980"],
  ["C", "760"],
];

function ItemCard({ item, selected, onSelect }: { item: PipelineItem; selected: boolean; onSelect: () => void }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      className={"py-intro-item " + (selected ? "is-selected" : "")}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className={"py-intro-item-icon tone-" + item.tone}><Icon size={19} /></span>
      <span>
        <strong>{item.label}</strong>
        <small>{item.detail}</small>
      </span>
    </button>
  );
}

function StageColumn({
  number,
  title,
  subtitle,
  items,
  tone,
  selected,
  onSelect,
}: {
  number: number;
  title: string;
  subtitle: string;
  items: PipelineItem[];
  tone: "extract" | "transform" | "load";
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <section className={"py-intro-stage py-intro-stage-" + tone}>
      <header>
        <span className="py-intro-stage-number">{number}</span>
        <span><strong>{title}</strong><small>{subtitle}</small></span>
      </header>
      <div className="py-intro-stage-items">
        {items.map((item) => (
          <ItemCard
            key={item.label}
            item={item}
            selected={selected === title + ":" + item.label}
            onSelect={() => onSelect(title + ":" + item.label)}
          />
        ))}
      </div>
    </section>
  );
}

function BusinessColumn({ selected, onSelect }: { selected: string; onSelect: (key: string) => void }) {
  return (
    <section className="py-intro-business">
      <header><Sparkles size={17} /><strong>Business<br />Use Cases</strong></header>
      <div>
        {businessItems.map((item) => (
          <ItemCard
            key={item.label}
            item={item}
            selected={selected === "Business:" + item.label}
            onSelect={() => onSelect("Business:" + item.label)}
          />
        ))}
      </div>
    </section>
  );
}

function PipelineConnector({ tone }: { tone: "blue" | "purple" | "green" }) {
  return (
    <div className={"py-intro-connector py-intro-connector-" + tone} aria-hidden="true">
      <span className="py-intro-connector-lines" />
      <span className="py-intro-connector-node"><ArrowRight size={18} /></span>
    </div>
  );
}

function ArchitectureView() {
  return (
    <div className="py-intro-architecture">
      <div className="py-intro-arch-source">
        <span><Database size={20} />Databases</span>
        <span><File size={20} />Files</span>
        <span><Cloud size={20} />APIs</span>
      </div>
      <ArrowRight className="py-intro-arch-arrow" size={24} />
      <div className="py-intro-arch-python">
        <span className="py-intro-python-mark">Py</span>
        <strong>Python processing layer</strong>
        <small>connect · clean · validate · orchestrate</small>
        <div><Workflow size={17} /> ETL / ELT job</div>
      </div>
      <ArrowRight className="py-intro-arch-arrow" size={24} />
      <div className="py-intro-arch-destinations">
        <span><Layers3 size={20} />Warehouse</span>
        <span><HardDrive size={20} />Data lake</span>
        <span><Server size={20} />Operational store</span>
      </div>
      <div className="py-intro-arch-consumers">
        <GitBranch size={20} />
        <span><strong>Downstream consumers</strong><small>analytics · ML · reporting · apps</small></span>
      </div>
    </div>
  );
}

export function PythonIntroductionLab() {
  const [view, setView] = useState<"interactive" | "architecture">("interactive");
  const [selected, setSelected] = useState("Transform:Data Cleaning");
  const [codeStage, setCodeStage] = useState<StageKey>("extract");
  const [copied, setCopied] = useState(false);
  const [runnerStep, setRunnerStep] = useState(0);
  const [running, setRunning] = useState(false);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const runExample = () => {
    clearTimers();
    setRunning(true);
    setRunnerStep(0);
    timers.current.push(window.setTimeout(() => setRunnerStep(1), 420));
    timers.current.push(window.setTimeout(() => setRunnerStep(2), 840));
    timers.current.push(window.setTimeout(() => {
      setRunning(false);
      toast.success("Example completed — sample output is ready.");
    }, 1180));
  };

  const resetExample = () => {
    clearTimers();
    setRunning(false);
    setRunnerStep(0);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeLines.join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error("Could not copy the example. Select the code and copy it manually.");
    }
  };

  return (
    <section className="python-pipeline-lab" aria-label="Python in a data engineering pipeline">
      <header className="py-intro-lab-header">
        <div className="py-intro-lab-title">
          <span className="py-intro-eye"><Eye size={22} /></span>
          <div>
            <h2>The Big Picture: Python in a Data Engineering Pipeline</h2>
            <p>See how Python connects data sources, transforms data, and loads it to destinations. Explore each step to understand what Python typically does.</p>
          </div>
        </div>
        <div className="py-intro-view-toggle" role="group" aria-label="Pipeline view">
          <button type="button" className={view === "interactive" ? "is-active" : ""} onClick={() => setView("interactive")}>
            <Sparkles size={16} /> Interactive View
          </button>
          <button type="button" className={view === "architecture" ? "is-active" : ""} onClick={() => setView("architecture")}>
            <GitBranch size={16} /> Architecture View
          </button>
        </div>
      </header>

      {view === "interactive" ? (
        <div className="py-intro-pipeline">
          <StageColumn number={1} title="Extract" subtitle="Read data from various sources" items={extractItems} tone="extract" selected={selected} onSelect={setSelected} />
          <PipelineConnector tone="blue" />
          <StageColumn number={2} title="Transform" subtitle="Clean, validate, and reshape" items={transformItems} tone="transform" selected={selected} onSelect={setSelected} />
          <PipelineConnector tone="purple" />
          <StageColumn number={3} title="Load" subtitle="Store the processed data" items={loadItems} tone="load" selected={selected} onSelect={setSelected} />
          <div className="py-intro-business-link" aria-hidden="true"><ArrowRight size={18} /></div>
          <BusinessColumn selected={selected} onSelect={setSelected} />
        </div>
      ) : <ArchitectureView />}

      <div className="py-intro-example-grid">
        <section className="py-intro-code-card" aria-label="Python ETL example">
          <header>
            <div className="py-intro-code-title"><span className="py-intro-python-mark small">Py</span><strong>Python Example: A Simple ETL Pipeline</strong></div>
            <div className="py-intro-code-actions">
              <div className="py-intro-code-tabs" role="tablist" aria-label="Highlight pipeline stage">
                {(["extract", "transform", "load"] as StageKey[]).map((stage) => (
                  <button key={stage} type="button" role="tab" aria-selected={codeStage === stage} className={codeStage === stage ? "is-active" : ""} onClick={() => setCodeStage(stage)}>
                    {stage[0].toUpperCase() + stage.slice(1)}
                  </button>
                ))}
              </div>
              <button type="button" className="py-intro-copy" onClick={copyCode}>
                {copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy"}
              </button>
            </div>
          </header>
          <pre><code>{codeLines.map((line, index) => (
            <span key={index} className={"py-intro-code-line " + (stageLines[codeStage].includes(index) ? "is-highlighted" : "")}>
              <span className="py-intro-code-number">{index + 1}</span>
              <span className={line.trim().startsWith("#") ? "py-intro-comment" : ""}>{line || " "}</span>
            </span>
          ))}</code></pre>
        </section>

        <section className="py-intro-runner" aria-label="Run the Python ETL example">
          <header><Play size={15} /><strong>Run This Example</strong></header>
          <div className="py-intro-run-steps">
            {[
              ["Load sample data", "Read 3 product rows"],
              ["Clean and aggregate", "Group by product and sum sales"],
              ["Save the result", "Write sales_summary.parquet"],
            ].map(([label, detail], index) => {
              const complete = runnerStep > index || (!running && runnerStep === 2 && index <= 2);
              const active = running ? runnerStep === index : runnerStep === index;
              return (
                <div key={label} className={(active ? "is-active " : "") + (complete ? "is-complete" : "")}>
                  <span>{complete && !active ? <CheckCircle2 size={14} /> : index + 1}</span>
                  <span><strong>{label}</strong><small>{detail}</small></span>
                </div>
              );
            })}
          </div>
          <div className="py-intro-run-actions">
            <button type="button" className="py-intro-run-primary" onClick={runExample} disabled={running}><Play size={14} />{running ? "Running…" : "Run Example"}</button>
            <button type="button" className="py-intro-run-reset" onClick={resetExample}><RotateCcw size={14} />Reset</button>
          </div>
          <div className="py-intro-output">
            <div className="py-intro-output-title"><Database size={14} /> Sample Output</div>
            <table>
              <thead><tr><th>product</th><th>sales</th></tr></thead>
              <tbody>{sampleOutput.map(([product, sales]) => <tr key={product}><td>{product}</td><td>{sales}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}
