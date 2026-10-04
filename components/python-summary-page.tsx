"use client";

import { PythonCodeLine } from "./python-code-line";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Code2,
  Copy,
  Database,
  FileText,
  GraduationCap,
  Lightbulb,
  Link2,
  MessageSquare,
  Pause,
  Sparkles,
  Target,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useCompanion } from "@/components/companion-context";
import { AICompanionService } from "@/lib/companion";

type Stage = {
  tone: "violet" | "blue" | "green" | "orange" | "pink" | "indigo" | "teal" | "amber";
  title: string;
  body: string;
  action: string;
  Icon: typeof Target;
  takeaway: string;
};

const stages: Stage[] = [
  { tone:"violet", Icon:Target, title:"Define the answer", body:"Valid rows, duplicates, expected totals.", action:"Set goals", takeaway:"Define what a correct output looks like" },
  { tone:"blue", Icon:Database, title:"Choose the right structure", body:"List, dict, set or tuple for the job.", action:"Store & organize", takeaway:"Choose the right data structure for the task" },
  { tone:"green", Icon:Code2, title:"Write reusable functions", body:"Small functions and modules.", action:"Keep it modular", takeaway:"Write reusable and well-structured functions" },
  { tone:"orange", Icon:FileText, title:"Read / write files safely", body:"Pick the right format (CSV, JSON, Parquet, etc.).", action:"Handle data", takeaway:"Work with files and the right data formats" },
  { tone:"pink", Icon:AlertTriangle, title:"Handle exceptions", body:"Add error handling and log failures.", action:"Make it robust", takeaway:"Handle exceptions and add meaningful logs" },
  { tone:"indigo", Icon:BarChart3, title:"Use pandas when it fits", body:"For tabular wrangling and analysis.", action:"Work with data", takeaway:"Use pandas for tabular data wrangling" },
  { tone:"teal", Icon:CheckCircle2, title:"Validate results", body:"Compare with expected outputs.", action:"Check correctness", takeaway:"Validate results against expected outputs" },
  { tone:"amber", Icon:Lightbulb, title:"Explain the trade-offs", body:"Justify choices and alternatives clearly.", action:"Be interview ready", takeaway:"Explain your design choices and trade-offs" },
];

const pipelineCode = [
  { stage:0, lines:["# 1. Read data",'df = pd.read_csv("data/sales.csv")'] },
  { stage:1, lines:["","# 2. Clean and deduplicate",'df = df.drop_duplicates(subset=["order_id"])','df = df.dropna(subset=["order_id", "amount"])'] },
  { stage:2, lines:["","# 3. Transform and aggregate","result = (",'    df.groupby("category")["amount"]','      .sum()','      .reset_index()',")"] },
  { stage:3, lines:["","# 4. Validate and log","expected_total = 125000.00",'assert abs(result["amount"].sum() - expected_total) < 1e-6','logger.info("Pipeline completed successfully")'] },
] as const;

const pythonFits = [
  "Custom data transformations and business logic",
  "Working with APIs, JSON, or semi-structured data",
  "Small to medium data volumes",
  "Prototyping and flexible workflows",
];

const sqlSparkFits = [
  "Very large datasets and complex joins",
  "Heavy aggregations and window functions",
  "Production-scale pipelines and orchestration",
  "When leveraging a data warehouse or data lake",
];

function SummaryHeroArt() {
  return (
    <div className="pysum-hero-art" aria-hidden="true">
      <span className="pysum-confetti c1">⌁</span><span className="pysum-confetti c2">✦</span><span className="pysum-confetti c3">⌁</span>
      <div className="pysum-chart-card"><BarChart3 size={31}/></div>
      <div className="pysum-window"><span/><span/><span/><div className="pysum-python">Py</div></div>
    </div>
  );
}

export function PythonSummaryHero({
  completedCount,
  totalLessons,
  isCurrentComplete,
  onToggleComplete,
  onPrevious,
  onNext,
}: {
  completedCount:number;
  totalLessons:number;
  isCurrentComplete:boolean;
  onToggleComplete:()=>void;
  onPrevious:()=>void;
  onNext:()=>void;
}) {
  const moduleComplete=completedCount===totalLessons;
  return (
    <section className="pysum-hero">
      <div className="pysum-hero-copy">
        <div className="pysum-breadcrumb"><span>Python for Data Engineering</span><span>›</span><strong>Summary</strong></div>
        <div className="pysum-hero-main">
          <div className="pysum-title-icon"><Zap size={30}/></div>
          <div>
            <h1>Summary</h1>
            <p>Connect the module's ideas and prepare to explain a complete, correct Python data pipeline.</p>
            <div className="pysum-meta"><span>◷ 10 min</span><span>▣ Lesson 10/10</span><span className="pysum-intermediate">◔ Intermediate</span></div>
          </div>
        </div>
      </div>
      <SummaryHeroArt/>
      <div className="pysum-hero-actions">
        <button
          type="button"
          className={"pysum-complete "+(moduleComplete?"is-complete":"")}
          aria-pressed={isCurrentComplete}
          onClick={onToggleComplete}
          title={isCurrentComplete?"Mark Summary incomplete":"Mark Summary complete"}
        >
          <GraduationCap size={14}/>{moduleComplete?"Module Complete!":isCurrentComplete?"Summary Complete":"Complete Summary"}
        </button>
        <div className="pysum-nav"><button type="button" aria-label="Previous lesson" onClick={onPrevious}><ChevronLeft size={18}/></button><button type="button" className="pysum-next" onClick={onNext}>Next <ChevronRight size={17}/></button></div>
      </div>
    </section>
  );
}

function PipelinePlayback() {
  const [active,setActive]=useState(0);
  const [playing,setPlaying]=useState(false);
  const timers=useRef<number[]>([]);
  const clearTimers=()=>{timers.current.forEach(timer=>window.clearTimeout(timer));timers.current=[];};
  useEffect(()=>()=>clearTimers(),[]);

  const playback=()=>{
    clearTimers();
    if(playing){setPlaying(false);return;}
    setPlaying(true);setActive(0);
    for(let i=1;i<stages.length;i++)timers.current.push(window.setTimeout(()=>setActive(i),560*i));
    timers.current.push(window.setTimeout(()=>setPlaying(false),560*stages.length));
  };

  return (
    <section className="pysum-playback">
      <header>
        <div className="pysum-play-title"><BookMark/><div><h2>Python Pipeline Playback</h2><p>Here’s how all the pieces fit together. Follow this flow to build, validate, and explain a complete Python data pipeline.</p></div></div>
        <button type="button" className="pysum-roadmap" aria-pressed={playing} onClick={playback}>{playing?<Pause size={13}/>:<Link2 size={13}/>}Your end-to-end Python roadmap</button>
      </header>
      <div className="pysum-stage-row">
        {stages.map(({tone,Icon,title,body,action},index)=><button
          key={title}
          type="button"
          aria-current={active===index?"step":undefined}
          className={"pysum-stage pysum-"+tone+(active===index?" is-active":"")+(active>index?" is-past":"")}
          disabled={playing}
          onClick={()=>setActive(index)}
        >
          <span className="pysum-stage-number">{index+1}</span>
          <span className="pysum-stage-icon"><Icon size={24}/></span>
          <strong>{title}</strong>
          <p>{body}</p>
          <b>{action}</b>
          {index<stages.length-1&&<i>→</i>}
        </button>)}
      </div>
      <p className="sr-only" role="status">Stage {active+1}: {stages[active].title}. {stages[active].takeaway}</p>
      <FitCards/>
      <div className="pysum-bottom-grid"><PipelineSketch activeStage={active}/><FinalTakeaways activeStage={active} onSelect={setActive}/></div>
    </section>
  );
}

function BookMark() {
  return <span className="pysum-bookmark"><FileText size={20}/></span>;
}

function FitCards() {
  return (
    <div className="pysum-fit-grid">
      <section className="pysum-fit-card pysum-fit-python">
        <header><CheckCircle2 size={22}/><strong>When Python fits best</strong></header>
        <ul>{pythonFits.map(item=><li key={item}><CheckCircle2 size={13}/>{item}</li>)}</ul>
        <span className="pysum-faded-python">Py</span>
      </section>
      <section className="pysum-fit-card pysum-fit-scale">
        <header><Database size={22}/><strong>When to reach for SQL or Spark</strong></header>
        <ul>{sqlSparkFits.map(item=><li key={item}><CheckCircle2 size={13}/>{item}</li>)}</ul>
        <span className="pysum-faded-db"><Database size={64}/></span>
      </section>
    </div>
  );
}

function PipelineSketch({activeStage}:{activeStage:number}) {
  const [copied,setCopied]=useState(false);
  const code=pipelineCode.flatMap(section=>section.lines).join("\n");
  const copy=async()=>{
    try{await navigator.clipboard.writeText(code);setCopied(true);window.setTimeout(()=>setCopied(false),1200);}
    catch{toast.error("Could not copy the pipeline sketch.");}
  };
  const sectionMap=[3,1,2,0,3,2,3,3] as const;
  const mappedSection=sectionMap[activeStage]??3;
  let lineNumber=0;
  return (
    <section className="pysum-code">
      <header><div><Code2 size={16}/><strong>End-to-end pipeline sketch</strong></div><div><span>Python</span><button type="button" onClick={copy}>{copied?<Check size={13}/>:<Copy size={13}/>}<span className="sr-only">{copied?"Copied":"Copy"}</span></button></div></header>
      <pre><code>{pipelineCode.map((section,sectionIndex)=>section.lines.map((line)=>{
        lineNumber+=1;
        return <span key={lineNumber} className={sectionIndex===mappedSection?"is-active":""}><i>{lineNumber}</i><b className={line.trim().startsWith("#")?"is-comment":""}><PythonCodeLine code={line || " "} /></b></span>;
      }))}</code></pre>
    </section>
  );
}

function FinalTakeaways({activeStage,onSelect}:{activeStage:number;onSelect:(stage:number)=>void}) {
  return (
    <section className="pysum-takeaways">
      <header><span><Lightbulb size={18}/></span><div><strong>Final takeaways</strong><p>You should now be able to do the following confidently:</p></div></header>
      <div>{stages.map((stage,index)=><button key={stage.takeaway} type="button" onClick={()=>onSelect(index)} className={"pysum-takeaway pysum-"+stage.tone+(activeStage===index?" is-active":"")}><CheckCircle2 size={13}/><span>{stage.takeaway}</span></button>)}</div>
    </section>
  );
}

export function PythonSummaryConcept() {
  return <PipelinePlayback/>;
}

export function PythonSummaryCompanion() {
  const companion=useCompanion();
  const service=useRef(new AICompanionService());
  const [mode,setMode]=useState<"idle"|"ask"|"example">("idle");
  const [question,setQuestion]=useState("");
  const [answer,setAnswer]=useState("");
  const [busy,setBusy]=useState(false);
  if(!companion)return null;

  const ask=async()=>{
    const q=question.trim();if(!q||busy)return;setBusy(true);
    const lower=q.toLowerCase();
    let local="";
    if(lower.includes("full pipeline")||lower.includes("pipeline")) local="A strong Python pipeline explanation starts with the required output, then covers input structure, reusable transformations, safe file access, specific error handling, tabular wrangling when pandas fits, validation against expected results, and the trade-offs behind the chosen tools.";
    else if(lower.includes("python")&&(lower.includes("sql")||lower.includes("spark"))) local="Use Python for glue logic, APIs, semi-structured data, flexible business rules, and small-to-medium in-memory transformations. Reach for SQL when set-based warehouse operations express the job better, and Spark when distributed processing is needed for larger-scale data.";
    else if(lower.includes("validate")||lower.includes("correct")) local="Define correctness before optimization: expected totals, types, missing-value rules, and duplicate handling. Validate a known sample before scaling the pipeline.";
    else if(lower.includes("exception")||lower.includes("logging")) local="Handle only expected exceptions you can recover from, log useful context, and let unexpected bugs surface. A pipeline that silently swallows failures is difficult to trust.";
    else if(lower.includes("interview")||lower.includes("trade-off")) local="For an interview answer, state the result first, explain the mechanism, give one concrete example, and finish with the main limitation or alternative you considered.";
    if(local)setAnswer(local);
    else {const reply=await service.current.respond("simply",companion.context,q);setAnswer(reply.text);}
    setBusy(false);
  };

  const example=async()=>{
    if(busy)return;setBusy(true);
    const reply=await service.current.respond("example",companion.context);
    setAnswer(reply.text);setMode("example");setBusy(false);
  };

  return (
    <section className="pysum-companion">
      <div className="pysum-companion-body">
        <div><strong>Need a recap of the full pipeline?</strong><p>I can explain any part of the walkthrough or show an example.</p></div>
        <Image src="/nila-avatar.png" alt="Mithoo learning companion" width={108} height={132}/>
      </div>
      <div className="pysum-companion-actions"><button type="button" onClick={()=>{setMode(mode==="ask"?"idle":"ask");setAnswer("");}}><MessageSquare size={14}/>Ask a Question</button><button type="button" onClick={example} disabled={busy}><Lightbulb size={14}/>{busy?"Loading…":"Explain with Example"}</button></div>
      {mode==="ask"&&<div className="pysum-companion-expand"><div><input aria-label="Ask Mithoo about the Python summary" value={question} onChange={event=>setQuestion(event.target.value)} onKeyDown={event=>{if(event.key==="Enter")void ask();}} placeholder="When should I use Python vs SQL?"/><button type="button" disabled={busy||!question.trim()} onClick={ask}>Ask</button></div>{answer&&<p>{answer}</p>}</div>}
      {mode==="example"&&answer&&<div className="pysum-companion-expand"><button type="button" className="pysum-expand-close" onClick={()=>setMode("idle")} aria-label="Close explanation"><X size={13}/></button><pre>{answer}</pre></div>}
      <footer><Sparkles size={14}/><span>Mithoo · Your learning companion</span></footer>
    </section>
  );
}
