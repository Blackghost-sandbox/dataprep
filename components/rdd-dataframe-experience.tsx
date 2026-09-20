"use client";

import { useEffect, useState, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown, ArrowLeft, ArrowRight, Check, ChevronDown, Copy, Eye,
  Lightbulb, Pause, Play, RefreshCcw, Network, Layers3, Code2, Table2, Terminal, Shuffle,
} from "lucide-react";
import { toast } from "sonner";
import { GlossaryTerm } from "@/components/glossary";
import { LearningTerm } from "@/components/learning-term";
import { DetailedExecution } from "@/components/detailed-execution";
import { CodeLine } from "@/components/learning-examples";
import { TooltipProvider } from "@/components/ui/tooltip";

type Stage = { title: string; detail: string; explanation: string };

const rddStages: Stage[] = [
  { title: "Your Code", detail: "User-defined functions", explanation: "You describe record-level work with Python functions." },
  { title: "Transformations", detail: "filter, map, reduceByKey", explanation: "Spark records the transformations without changing the source RDD." },
  { title: "DAG / Lineage", detail: "Tracks transformations", explanation: "Spark builds a dependency graph it can use to plan work and recover lost partitions." },
  { title: "Spark Core", detail: "Execution", explanation: "Spark Core turns the dependency graph into executable work." },
  { title: "Stages & Tasks", detail: "Distributed across the cluster", explanation: "Tasks process partitions across available executors." },
];

const dataframeStages: Stage[] = [
  { title: "Your Code", detail: "Declarative DataFrame expressions", explanation: "You describe the result using columns and built-in expressions." },
  { title: "Logical Plan", detail: "Unresolved", explanation: "Spark first records what the query means before choosing how to run it." },
  { title: "Catalyst Optimizer", detail: "Optimizes the plan", explanation: "Catalyst analyzes the schema and expressions, then rewrites the plan when useful." },
  { title: "Physical Plan", detail: "Chooses execution strategy", explanation: "Spark selects concrete operators and an execution strategy." },
  { title: "Spark Core", detail: "Execution", explanation: "Spark Core schedules the selected physical operators." },
  { title: "Stages & Tasks", detail: "Distributed across the cluster", explanation: "Tasks process partitions across available executors." },
];

const characteristics = {
  rdd: ["Works with any object", "Immutable collection", "More control", "No built-in query optimizer", "Often slower for structured workloads"],
  dataframe: ["Structured data with schema", "Catalyst optimized", "Schema enforced", "Higher-level API", "Often faster for structured workloads"],
};

const characteristicTerms: Record<string, string> = {
  "Works with any object": "Any object",
  "Structured data with schema": "Structured Data",
  "Higher-level API": "Structured API",
  "Often slower for structured workloads": "Slower",
  "Often faster for structured workloads": "Faster",
};

const codeSamples: Record<string, { rdd: string; dataframe: string }> = {
  PySpark: {
    rdd: `# city, age
rdd = sc.parallelize([
    ("Delhi", 31), ("Pune", 22), ("Delhi", 28)
])
counts = (
    rdd.filter(lambda row: row[1] > 25)
       .map(lambda row: (row[0], 1))
       .reduceByKey(lambda a, b: a + b)
)
print(sorted(counts.collect()))`,
    dataframe: `from pyspark.sql import functions as F

df = spark.createDataFrame(
    [("Delhi", 31), ("Pune", 22), ("Delhi", 28)],
    "city STRING, age INT"
)
counts = (
    df.filter(F.col("age") > 25)
      .groupBy("city")
      .count()
)
counts.orderBy("city").show()`,
  },
  Scala: {
    rdd: `val rdd = sc.parallelize(Seq(
  ("Delhi", 31), ("Pune", 22), ("Delhi", 28)
))
val counts = rdd
  .filter(row => row._2 > 25)
  .map(row => (row._1, 1))
  .reduceByKey(_ + _)
counts.collect.sorted.foreach(println)`,
    dataframe: `import spark.implicits._
import org.apache.spark.sql.functions.col

val df = Seq(
  ("Delhi", 31), ("Pune", 22), ("Delhi", 28)
).toDF("city", "age")
df.filter(col("age") > 25)
  .groupBy("city")
  .count()
  .orderBy("city")
  .show()`,
  },
  SQL: {
    rdd: `-- RDDs do not have a SQL syntax.
-- Use the PySpark or Scala tab for the
-- equivalent low-level RDD operation.`,
    dataframe: `SELECT city, COUNT(*) AS count
FROM people
WHERE age > 25
GROUP BY city
ORDER BY city;`,
  },
};

export function ExpandingContent({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => setHeight(entry.contentRect.height));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <motion.div animate={{height:height ?? "auto"}} transition={{duration:reduced?0:.35,ease:"easeOut"}} style={{overflow:"hidden"}}><div ref={ref}>{children}</div></motion.div>;
}

function Pipeline({ kind, stages, step, viewMode, selected, onSelect, playing }: { kind: "rdd" | "dataframe"; stages: Stage[]; step: number; playing:boolean; viewMode:"overview"|"detailed"; selected:number; onSelect:(index:number)=>void }) {
  const adjusted = kind === "rdd" ? [-1, 0, 1, 2, 2, 3, 4][step + 1] : step;
  return <div className={`execution-pipeline execution-${kind}`}>
    <header><i className="pipeline-emblem">{kind === "rdd" ? <Network size={21}/> : <Layers3 size={21}/>}</i><div><span><GlossaryTerm term={kind === "rdd" ? "RDD" : "DataFrame"}/> Execution</span><small> (<LearningTerm term={kind === "rdd" ? "Low-level API" : "Structured API"} label={kind === "rdd" ? "Low-level API" : "Higher-level API"}/>)</small></div></header>
    <ExpandingContent>{viewMode === "detailed" ? <DetailedExecution playing={playing} kind={kind} stages={stages} selected={selected} onSelect={onSelect}/> : <div className="execution-body">
      <ol>{stages.map((stage, index) => {
        const state = step < 0 ? "idle" : index < adjusted ? "complete" : index === adjusted ? "active" : "upcoming";
        return <li key={stage.title} className={state}>
          <div className="execution-stage"><strong><LearningTerm term={stage.title} deepDive/></strong><span>{stage.detail}</span></div>
          {index < stages.length - 1 && <ArrowDown className="execution-arrow" size={16} aria-hidden="true"/>}
        </li>;
      })}</ol>
      <aside><h4>Key characteristics</h4>{characteristics[kind].map(item => <p key={item}><Check size={14}/><LearningTerm term={characteristicTerms[item] ?? item} label={item}/></p>)}</aside>
    </div>}</ExpandingContent>
  </div>;
}

function CopyButton({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1400); }
    catch { toast.error("Copy is unavailable. Select the code and copy it manually."); }
  }
  return <button type="button" onClick={copy} aria-label={`Copy ${label}`}>{copied ? <Check size={14}/> : <Copy size={14}/>}<span aria-live="polite">{copied ? "Copied" : "Copy"}</span></button>;
}

export function DarkCodeCard({ title, code }: { title: string; code: string }) {
  return <TooltipProvider delayDuration={180}><article className="comparison-code-card"><header><h4><Check size={13}/>{title}</h4><CopyButton code={code} label={title}/></header><div className="comparison-code-scroll" tabIndex={0} role="region" aria-label={title}><code>{code.split("\n").map((line,i)=><div className="comparison-code-line" key={i}><span aria-hidden="true">{i+1}</span><span><CodeLine line={line}/></span></div>)}</code></div></article></TooltipProvider>;
}

export function VisualExecutionComparison() {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState<"side" | "step">("side");
  const [viewMode, setViewMode] = useState<"overview"|"detailed">("overview");
  const [rddSelected, setRddSelected] = useState(2);
  const [dfSelected, setDfSelected] = useState(2);
  const maxStep = dataframeStages.length - 1;

  useEffect(() => {
    if (viewMode === "detailed" && step >= 0) {
      setRddSelected([0,1,2,2,3,4][step]);
      setDfSelected(step);
    }
  }, [step, viewMode]);

  useEffect(() => {
    if (!playing) return;
    if (reduced) { setPlaying(false); return; }
    if (step >= maxStep) { setPlaying(false); return; }
    const timer = window.setTimeout(() => setStep(current => current + 1), viewMode === "detailed" ? 5200 : 1100);
    return () => window.clearTimeout(timer);
  }, [playing, step, maxStep, reduced, viewMode]);

  const explanation = dataframeStages[Math.max(0,step)].explanation;

  function play() {
    if (reduced) { setStep(current => current >= maxStep ? 0 : Math.min(current + 1, maxStep)); return; }
    if (step < 0 || step >= maxStep) setStep(0);
    setPlaying(true);
  }

  return <section className="visual-comparison-card">
    <header className="visual-comparison-header">
      <div className="visual-title"><span><Eye size={21}/></span><div><h2>Visual Comparison: Same Operation, Different Execution</h2><p>See how the same transformation runs on RDD vs DataFrame.</p></div></div>
      <div className="visual-header-controls"><button type="button" className="execution-play" onClick={playing ? () => setPlaying(false) : play}>{playing ? <Pause size={14}/> : <Play size={14}/>} {playing ? "Pause" : step >= maxStep ? "Replay Execution" : "Animate Execution"}</button><button type="button" className="execution-detail-toggle" aria-expanded={viewMode === "detailed"} onClick={() => {setPlaying(false);setStep(-1);setRddSelected(2);setDfSelected(2);setViewMode(value=>value === "overview" ? "detailed" : "overview");}}>{viewMode === "overview" ? <Eye size={14}/> : <ArrowLeft size={14}/>} {viewMode === "overview" ? "View Detailed Execution" : "Back to Overview"}</button><div className="visual-mode" role="group" aria-label="Comparison view">
        <button type="button" aria-pressed={mode === "side"} className={mode === "side" ? "selected" : ""} onClick={() => setMode("side")}>Side by side</button>
        <button type="button" aria-pressed={mode === "step"} className={mode === "step" ? "selected" : ""} onClick={() => {setMode("step");setPlaying(false);if(step<0)setStep(0);}}>Step by step</button>
      </div></div>
    </header>
    <div className="operation-bar"><label>Operation<select aria-label="Choose comparison operation" defaultValue="filter-count"><option value="filter-count">Filter → GroupBy → Count</option></select><ChevronDown size={14} aria-hidden="true"/></label><code>filter(age &gt; 25) → groupBy(city) → count</code></div>
    <div className={`execution-grid ${mode === "step" ? "step-view" : ""}`}><Pipeline playing={playing} kind="rdd" stages={rddStages} step={step} viewMode={viewMode} selected={rddSelected} onSelect={index=>{setPlaying(false);setRddSelected(index);}}/><div className="execution-vs">VS</div><Pipeline playing={playing} kind="dataframe" stages={dataframeStages} step={step} viewMode={viewMode} selected={dfSelected} onSelect={index=>{setPlaying(false);setDfSelected(index);}}/></div>
    {step >= 0 && <div className="execution-walkthrough"><div className="execution-status" aria-live="polite"><strong>Step {step + 1} of {maxStep + 1}</strong><span>{explanation}</span></div>
    {mode === "step" && <p className="rdd-step-detail"><strong>RDD:</strong> {rddStages[[0,1,2,2,3,4][step]].explanation}</p>}
    <div className="execution-controls">
      <button type="button" disabled={step <= 0} onClick={() => { setPlaying(false); setStep(value => Math.max(0, value - 1)); }}><ArrowLeft size={15}/> Previous</button>
      <button type="button" disabled={step === maxStep} onClick={() => { setPlaying(false); setStep(value => Math.min(maxStep, value + 1)); }}>Next <ArrowRight size={15}/></button>
      <button type="button" onClick={() => { setStep(0); setPlaying(!reduced && mode === "side"); }}><RefreshCcw size={14}/> Replay</button>
    </div></div>}
    <WhyDataFramePanel/>
  </section>;
}

export function WhyDataFramePanel() {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  return <section className="why-panel"><span className="why-icon"><Lightbulb size={20}/></span><div><h3>Why is DataFrame generally faster?</h3><p>Spark can understand the schema and optimize the query using Catalyst, while RDD functions offer fewer query-optimization opportunities.</p></div><button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Hide explanation" : "See detailed explanation"} <ArrowRight size={15}/></button>{open && <motion.div initial={{opacity:reduced?1:0}} animate={{opacity:1}} className="why-detail"><p>Spark understands a DataFrame’s schema and expressions, allowing Catalyst to analyze and optimize its query plan. RDD transformations expose lower-level operations and arbitrary functions, providing fewer opportunities for query-plan optimization.</p><p>Catalyst can simplify expressions, move safe filters earlier, and remove unused columns. RDDs remain useful for custom structures and fine-grained transformations. Performance is workload-dependent: inspect the actual plan and measure the complete action.</p></motion.div>}</section>;
}

export function SameOperationCodeComparison() {
  const [language, setLanguage] = useState("PySpark");
  const [panel, setPanel] = useState<"sample" | "output" | "variation" | "run" | null>(null);
  const sample = codeSamples[language];
  return <TooltipProvider delayDuration={180}><section className="code-comparison">
    <header><span className="code-title-icon"><Code2 size={22}/></span><h2>Code Example: Same Operation in RDD and DataFrame</h2></header>
    <div className="code-language" role="group" aria-label="Code language">{Object.keys(codeSamples).map(item => <button type="button" key={item} aria-pressed={language === item} onClick={() => setLanguage(item)}>{item}</button>)}</div>
    <div className="comparison-code-grid"><DarkCodeCard title="RDD example" code={sample.rdd}/><DarkCodeCard title="DataFrame example" code={sample.dataframe}/></div>
    <div className="code-actions">
      <button type="button" onClick={() => setPanel("run")}><i><Play size={19}/></i><span>Run Code<small>Open run instructions</small></span></button>
      <button type="button" onClick={() => setPanel("sample")}><i><Table2 size={19}/></i><span>Sample Data<small>Preview input data</small></span></button>
      <button type="button" onClick={() => setPanel("output")}><i><Terminal size={20}/></i><span>Output<small>See expected output</small></span></button>
      <button type="button" onClick={() => setPanel("variation")}><i><Shuffle size={19}/></i><span>Try Variations<small>Modify and experiment</small></span></button>
    </div>
    {panel && <div className="code-action-panel" aria-live="polite">{panel === "run" && <p>This lesson does not execute Spark. Copy either example into a Spark notebook or shell to run it.</p>}{panel === "sample" && <pre>city   age{"\n"}Delhi 31{"\n"}Pune   22{"\n"}Delhi 28</pre>}{panel === "output" && <pre>city   count{"\n"}Delhi 2</pre>}{panel === "variation" && <p>Change the age threshold to 20. Predict the city counts before running the code, then compare both implementations.</p>}</div>}
  </section></TooltipProvider>;
}

export function RddDataFrameConceptExperience() {
  return <><VisualExecutionComparison/><SameOperationCodeComparison/></>;
}
