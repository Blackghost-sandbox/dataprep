"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Database,
  Eye,
  FileText,
  Filter,
  GitBranch,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  Table2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useCompanion } from "@/components/companion-context";
import { AICompanionService } from "@/lib/companion";

type DemoStep = 0 | 1 | 2 | 3;

const sourceRows = [
  { date: "2024-01-01", country: "IN", amount: 120 },
  { date: "2024-01-02", country: "US", amount: 80 },
  { date: "2024-01-03", country: "IN", amount: 45 },
  { date: "2024-01-04", country: "US", amount: 60 },
] as const;

const exampleCode = [
  "import pandas as pd",
  "",
  "# Create a sample DataFrame",
  "df = pd.DataFrame({",
  '    "date": ["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04"],',
  '    "country": ["IN", "US", "IN", "US"],',
  '    "amount": [120, 80, 45, 60]',
  "})",
  "",
  "# Filter rows where amount > 50",
  "filtered_df = df[df['amount'] > 50]",
  "",
  "# Group by country and calculate total amount",
  "result = filtered_df.groupby('country')['amount'].sum().reset_index()",
  "print('Filtered DataFrame:')",
  "print(filtered_df)",
  "print('\\nTotal amount by country:')",
  "print(result)",
].join("\n");

const timeline = [
  { title: "Load DataFrame", body: "Read data with typed columns", time: "00:00", tone: "blue" },
  { title: "Filter rows", body: "amount > 50", time: "00:12", tone: "violet" },
  { title: "Group by country", body: "Split into country groups", time: "00:24", tone: "green" },
  { title: "Aggregate sum", body: "Calculate totals", time: "00:36", tone: "orange" },
] as const;

const concepts = [
  { tone: "violet", Icon: Database, title: "A DataFrame is columns of typed Series", body: "Each column in a pandas DataFrame is a Series with one dtype (int, float, string, datetime, etc.)." },
  { tone: "blue", Icon: Filter, title: "Filtering describes a boolean mask", body: "df[condition] keeps rows where the condition is True, similar to a SQL WHERE clause." },
  { tone: "green", Icon: GitBranch, title: "groupby splits, applies, combines", body: "df.groupby('col').sum() splits rows into groups, applies an aggregation, and combines the results." },
  { tone: "orange", Icon: Zap, title: "Avoid row-by-row loops", body: "Vectorized operations are much faster than iterrows(). Use pandas built-ins instead of Python loops whenever possible." },
] as const;

const decisions = [
  { tone: "pink", Icon: Filter, question: "Need row filtering?", action: "Use boolean masks", code: "df[df['col'] > x]" },
  { tone: "blue", Icon: GitBranch, question: "Need totals by category?", action: "Use groupby + sum", code: "df.groupby('col').sum()" },
  { tone: "violet", Icon: Sparkles, question: "Need column transformation?", action: "Use vectorized column operations", code: "df['new_col'] = df['col'] * 2" },
  { tone: "orange", Icon: Zap, question: "Need large loops?", action: "Use vectorized operations", code: "Avoid iterrows()" },
] as const;

function PandasMark() {
  return (
    <div className="pypd-pandas-mark" aria-label="pandas">
      <span/><span/><span/><span/><span/><span/>
    </div>
  );
}

export function PythonPandasHero() {
  return (
    <section className="pypd-hero">
      <div className="pypd-hero-copy">
        <div className="pypd-breadcrumb"><span>Python for Data Engineering</span><span>›</span><strong>pandas for Data Wrangling</strong></div>
        <div className="pypd-hero-main">
          <div className="pypd-hero-icon"><PandasMark/></div>
          <div>
            <h1>pandas for Data Wrangling</h1>
            <p>Use pandas' vectorized operations to filter, group, and aggregate tabular data without row-by-row loops.</p>
            <div className="pypd-meta">
              <span><Clock3 size={14}/>20 min</span>
              <span><BookOpen size={14}/>Lesson 6/10</span>
              <span className="pypd-intermediate"><Sparkles size={13}/>Intermediate</span>
            </div>
          </div>
        </div>
      </div>
      <div className="pypd-hero-art" aria-hidden="true">
        <span className="pypd-dot dot-a"/><span className="pypd-dot dot-b"/><span className="pypd-dot dot-c"/><span className="pypd-dot dot-d"/>
        <div className="pypd-logo-card"><PandasMark/><strong>pandas</strong></div>
        <div className="pypd-dataframe-card">
          <header>DataFrame</header>
          <div className="pypd-mini-table">{Array.from({length:12}).map((_,i)=><i key={i}/>)}</div>
        </div>
        <div className="pypd-chip chip-filter">filter()</div>
        <div className="pypd-chip chip-group">groupby()</div>
        <div className="pypd-chip chip-sum">sum()</div>
        <span className="pypd-dash dash-one"/><span className="pypd-dash dash-two"/><span className="pypd-dash dash-three"/>
      </div>
    </section>
  );
}

function DataTable({ rows }: { rows: readonly {date:string;country:string;amount:number}[] }) {
  return (
    <table className="pypd-table">
      <thead><tr><th>date</th><th>country</th><th>amount</th></tr></thead>
      <tbody>{rows.map(row=><tr key={row.date}><td>{row.date}</td><td>{row.country}</td><td>{row.amount}</td></tr>)}</tbody>
    </table>
  );
}

function StageCard({ step, index, filtered, grouped }: { step: DemoStep; index:number; filtered: typeof sourceRows[number][]; grouped: {country:string;total:number;count:number}[] }) {
  const active = step === index;
  const complete = step > index;
  const cls = ["blue","violet","green","orange"][index];
  return (
    <article className={"pypd-stage pypd-stage-"+cls+(active?" is-active":"")+(complete?" is-complete":"")}>
      <header><span className="pypd-stage-number">{index+1}</span><div>
        <strong>{index===0?"Load DataFrame":index===1?"Filter rows":index===2?"Group by country":"Aggregate sum"}</strong>
        <p>{index===0?"Read tabular data with typed columns":index===1?"Keep rows where amount > 50":index===2?"Split rows into groups":"Calculate total amount per country"}</p>
      </div></header>
      {index===0 && <><DataTable rows={sourceRows}/><p className="pypd-stage-note">A pandas DataFrame with typed columns (int, string, datetime, etc.).</p></>}
      {index===1 && <><DataTable rows={filtered}/><code className="pypd-inline-code">df[df['amount'] &gt; 50]</code><p className="pypd-stage-note">Creates a boolean mask and filters rows where amount is greater than 50.</p></>}
      {index===2 && <><div className="pypd-groups">{grouped.map(group=><div key={group.country}><span>{group.country}</span><p><strong>{group.count} {group.count===1?"row":"rows"}</strong><small>Total amount: {group.total}</small></p></div>)}</div><code className="pypd-inline-code">groupby('country')</code><p className="pypd-stage-note">splits rows into groups for each unique country.</p></>}
      {index===3 && <><table className="pypd-table pypd-result"><thead><tr><th>country</th><th>total_amount</th></tr></thead><tbody>{grouped.map(group=><tr key={group.country}><td>{group.country}</td><td><strong>{group.total}</strong></td></tr>)}</tbody></table><code className="pypd-inline-code">df.groupby('country')['amount'].sum()</code><p className="pypd-stage-note">Applies sum() within each group and combines the results.</p></>}
      {index<3 && <ArrowRight className="pypd-stage-arrow" size={22}/>}
    </article>
  );
}

function Timeline({ step, running, onStep }: { step: DemoStep; running:boolean; onStep:(step:DemoStep)=>void }) {
  return (
    <section className="pypd-timeline">
      <header><span><Zap size={13}/></span><strong>Execution Timeline</strong><small>(illustrative)</small></header>
      <div>{timeline.map((item,index)=><button key={item.title} type="button" disabled={running} onClick={()=>onStep(index as DemoStep)} className={"pypd-time tone-"+item.tone+(step===index?" is-active":"")+(step>=index?" is-complete":"")} aria-current={step===index?"step":undefined}>
        <span className="pypd-time-number">{index+1}</span>
        <span className="pypd-time-icon">{index===0?<Database size={20}/>:index===1?<Filter size={20}/>:index===2?<GitBranch size={20}/>:<BarChart3 size={20}/>}</span>
        <span><strong>{item.title}</strong><small>{item.body}<br/>{item.time}</small></span>
        {step>=index&&<CheckCircle2 className="pypd-time-check" size={14}/>}
        {index<3&&<ArrowRight className="pypd-time-arrow" size={17}/>}
      </button>)}</div>
    </section>
  );
}

function CodeExample() {
  const [copied,setCopied]=useState(false);
  const copy=async()=>{
    try{await navigator.clipboard.writeText(exampleCode);setCopied(true);window.setTimeout(()=>setCopied(false),1200);}
    catch{toast.error("Could not copy this example.");}
  };
  return (
    <section className="pypd-code">
      <header><div><span className="pypd-python-badge">Py</span><strong>Python example · pandas filter + groupby</strong></div><button type="button" onClick={copy}>{copied?<Check size={13}/>:<Copy size={13}/>} {copied?"Copied":"Copy"}</button></header>
      <pre><code>{exampleCode.split("\n").map((line,index)=><span key={index}><i>{index+1}</i><b className={line.trim().startsWith("#")?"is-comment":""}>{line||" "}</b></span>)}</code></pre>
    </section>
  );
}

function KeyConcepts() {
  return (
    <section className="pypd-concepts">
      <h3>Key Concepts</h3>
      <div className="pypd-concept-grid">{concepts.map(({tone,Icon,title,body})=><article key={title} className={"pypd-concept tone-"+tone}><span><Icon size={20}/></span><div><strong>{title}</strong><p>{body}</p></div></article>)}</div>
      <h4>When to use what?</h4>
      <div className="pypd-decision-grid">{decisions.map(({tone,Icon,question,action,code})=><article key={action} className={"pypd-decision tone-"+tone}><span><Icon size={14}/></span><div><small>{question}</small><strong>{action}</strong><code>{code}</code></div></article>)}</div>
    </section>
  );
}

export function PythonPandasConcept() {
  const [step,setStep]=useState<DemoStep>(0);
  const [running,setRunning]=useState(false);
  const timers=useRef<number[]>([]);

  const filtered=useMemo(()=>sourceRows.filter(row=>row.amount>50),[]);
  const grouped=useMemo(()=>{
    const map=new Map<string,{country:string;total:number;count:number}>();
    for(const row of filtered){
      const current=map.get(row.country)??{country:row.country,total:0,count:0};
      current.total+=row.amount;current.count+=1;map.set(row.country,current);
    }
    return Array.from(map.values());
  },[filtered]);

  const clearTimers=()=>{timers.current.forEach(timer=>window.clearTimeout(timer));timers.current=[];};
  useEffect(()=>()=>clearTimers(),[]);

  const run=()=>{
    clearTimers();setRunning(true);setStep(0);
    [1,2,3].forEach((next,index)=>timers.current.push(window.setTimeout(()=>setStep(next as DemoStep),650*(index+1))));
    timers.current.push(window.setTimeout(()=>setRunning(false),2700));
  };
  const next=()=>{clearTimers();setRunning(false);setStep(value=>Math.min(3,value+1) as DemoStep);};
  const reset=()=>{clearTimers();setRunning(false);setStep(0);};

  return (
    <div className="pypd-concept">
      <header className="pypd-concept-header">
        <div className="pypd-eye"><Eye size={21}/></div>
        <div><h2>pandas for Data Wrangling Simulator</h2><p>Watch a DataFrame be loaded, filtered, grouped, and aggregated step by step.</p></div>
        <div className="pypd-controls">
          <button type="button" className="pypd-run" onClick={run} disabled={running}><Play size={15}/>{running?"Running…":"Run"}</button>
          <button type="button" onClick={next} disabled={running||step===3}><Play size={14}/>Next step</button>
          <button type="button" onClick={reset}><RotateCcw size={14}/>Reset</button>
          <span>{step+1} / 4 steps</span>
        </div>
      </header>
      <div className="pypd-stage-grid">{[0,1,2,3].map(index=><StageCard key={index} step={step} index={index} filtered={filtered} grouped={grouped}/>)}</div>
      <Timeline step={step} running={running} onStep={setStep}/>
      <div className="pypd-bottom-grid"><CodeExample/><KeyConcepts/></div>
    </div>
  );
}

export function PythonPandasQuickNotes({ onNotes }: { onNotes:()=>void }) {
  return (
    <section className="pypd-quick-notes">
      <header><FileText size={21}/><strong>Quick Notes</strong></header>
      <p>Use pandas to quickly clean, filter, transform, and aggregate tabular data using vectorized operations.</p>
      <button type="button" onClick={onNotes}>+ Add your note →</button>
    </section>
  );
}

export function PythonPandasCompanion() {
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
    if(lower.includes("groupby")) local="groupby splits rows into groups based on one or more keys, applies an aggregation such as sum(), and combines the results.";
    else if(lower.includes("filter")||lower.includes("mask")) local="A boolean mask is a Series of True/False values. df[df['amount'] > 50] keeps only the rows where that mask is True.";
    else if(lower.includes("iterrows")||lower.includes("loop")) local="Prefer vectorized pandas operations because they run work in optimized array-oriented code and avoid Python-level per-row overhead.";
    else if(lower.includes("dataframe")||lower.includes("series")) local="A DataFrame is a table of columns. Each column is a Series with its own dtype, which lets pandas apply vectorized operations efficiently.";
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
    <section className="pypd-companion">
      <div className="pypd-companion-body"><div><strong>Learning pandas for Data Wrangling?</strong><p>I’m Mithoo. Let’s make it simple, one step at a time.</p></div><Image src="/nila-avatar.png" alt="Mithoo learning companion" width={108} height={132}/></div>
      <div className="pypd-companion-actions">
        <button type="button" onClick={()=>{setMode(mode==="ask"?"idle":"ask");setAnswer("");}}><span>◉</span>Ask a Question</button>
        <button type="button" onClick={example} disabled={busy}><Lightbulb size={14}/>{busy?"Loading…":"Explain with Example"}</button>
      </div>
      {mode==="ask"&&<div className="pypd-companion-expand"><div><input aria-label="Ask Mithoo about pandas" value={question} onChange={event=>setQuestion(event.target.value)} onKeyDown={event=>{if(event.key==="Enter")void ask();}} placeholder="How does groupby work?"/><button type="button" onClick={ask} disabled={busy||!question.trim()}>Ask</button></div>{answer&&<p>{answer}</p>}</div>}
      {mode==="example"&&answer&&<div className="pypd-companion-expand"><button type="button" className="pypd-expand-close" onClick={()=>setMode("idle")} aria-label="Close explanation"><X size={13}/></button><pre>{answer}</pre></div>}
    </section>
  );
}
