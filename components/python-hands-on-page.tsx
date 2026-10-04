"use client";

import { PythonCodeLine } from "./python-code-line";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Check,
  CheckCircle2,
  Copy,
  Database,
  FileCode2,
  Layers3,
  Lightbulb,
  Play,
  RotateCcw,
  ShieldCheck,
  Target,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

type Step = 0 | 1 | 2 | 3 | 4;

type Order = {
  order_id: number;
  country: "IN" | "US" | null;
  amount: number;
  note: "valid" | "duplicate" | "missing country" | "refund";
};

const orders: Order[] = [
  { order_id: 1, country: "IN", amount: 100, note: "valid" },
  { order_id: 1, country: "IN", amount: 100, note: "duplicate" },
  { order_id: 2, country: "US", amount: 50, note: "valid" },
  { order_id: 3, country: "IN", amount: 20, note: "valid" },
  { order_id: 4, country: null, amount: 10, note: "missing country" },
  { order_id: 5, country: "US", amount: -5, note: "refund" },
];

const solution = `# Messy input data
orders = [
    {"order_id": 1, "country": "IN", "amount": 100},
    {"order_id": 1, "country": "IN", "amount": 100},  # duplicate
    {"order_id": 2, "country": "US", "amount": 50},
    {"order_id": 3, "country": "IN", "amount": 20},
    {"order_id": 4, "country": None, "amount": 10},    # missing country
    {"order_id": 5, "country": "US", "amount": -5},    # refund
]

# 1) Deduplicate
seen = set()
unique = []
for o in orders:
    key = tuple(sorted(o.items()))
    if key not in seen:
        seen.add(key)
        unique.append(o)

# 2) Validate + 3) aggregate
totals = {}
for o in unique:
    if o["country"] and o["amount"] > 0:
        totals[o["country"]] = totals.get(o["country"], 0) + o["amount"]

for country in sorted(totals):
    print(country, totals[country])`;

const rules = [
  ["Keep one copy of identical orders", "Remove exact duplicate records (same order_id, country, amount)."],
  ["Remove missing country", "Exclude records with empty or missing country."],
  ["Remove non-positive amount", "Exclude zero or negative amounts (refunds)."],
  ["Sum valid totals by country", "Aggregate remaining records by country."],
] as const;

const pipeline = [
  ["Load", "Read 6 order records from input."],
  ["Validate", "Apply quality checks (missing country, non-positive amount)."],
  ["Deduplicate", "Keep one copy of identical orders."],
  ["Aggregate", "Sum valid orders by country."],
  ["Output", "Produce final totals for each country."],
] as const;

function AppMark() {
  return (
    <div className="pyhot-hero-art" aria-hidden="true">
      <div className="pyhot-report-card"><span/><span/><span/><span/></div>
      <div className="pyhot-python-badge">Py</div>
      <span className="pyhot-spark s1">âœ¦</span>
      <span className="pyhot-spark s2">âœ¦</span>
      <span className="pyhot-spark s3">âœ¦</span>
    </div>
  );
}

export function PythonHandsOnHero() {
  return (
    <section className="pyhot-hero">
      <div className="pyhot-hero-copy">
        <div className="pyhot-title-icon"><Zap size={31}/></div>
        <div>
          <h1>Hands-on Task</h1>
          <p>Build a small validation-and-aggregation script in plain Python: clean messy order records and total valid sales by country.</p>
          <div className="pyhot-meta">
            <span>â—· 40 min</span>
            <span>â—‰ Lesson 7/10</span>
            <span className="pyhot-intermediate">â™™ Intermediate</span>
          </div>
        </div>
      </div>
      <AppMark/>
    </section>
  );
}

function RawOrders({ step }: { step: Step }) {
  return (
    <section className="pyhot-card pyhot-raw">
      <header><span><Database size={17}/></span><strong>Raw Orders Input</strong><b>6 records</b></header>
      <table>
        <thead><tr><th>#</th><th>order_id</th><th>country</th><th>amount</th><th>note</th></tr></thead>
        <tbody>
          {orders.map((o,index)=>{
            const invalid = (o.note==="missing country" || o.note==="refund") && step>=1;
            const duplicate = o.note==="duplicate" && step>=2;
            return <tr key={index} className={(o.note!=="valid" ? "issue issue-"+o.note.replace(" ","-") : "") + (invalid||duplicate ? " is-rejected" : "")}>
              <td>{index+1}</td><td>{o.order_id}</td><td><span className={"pyhot-country "+(o.country||"none")}>{o.country||"None"}</span></td><td>{o.amount}</td><td><span className={"pyhot-note note-"+o.note.replace(" ","-")}>{o.note}</span></td>
            </tr>;
          })}
        </tbody>
      </table>
    </section>
  );
}

function Rules({ step }: { step: Step }) {
  return (
    <section className="pyhot-card pyhot-rules">
      <header><span><ShieldCheck size={17}/></span><strong>Validation Rules</strong></header>
      <div>{rules.map(([title,body],i)=><article key={title} className={(step>=Math.min(i+1,3) ? "is-active " : "")+"rule-"+(i+1)}>
        <span>{i+1}</span><div><strong>{title}</strong><p>{body}</p></div>{step>=Math.min(i+1,3)&&<CheckCircle2 size={16}/>}
      </article>)}</div>
    </section>
  );
}

function Expected({ step, totals }: { step: Step; totals: Record<string,number> }) {
  const ready = step>=4;
  return (
    <section className="pyhot-card pyhot-result">
      <header><span><BarChart3 size={18}/></span><strong>Expected Result</strong><b>3 valid unique records</b></header>
      <table>
        <thead><tr><th>country</th><th>total_amount</th></tr></thead>
        <tbody>
          <tr><td><span className="pyhot-country IN">IN</span></td><td><strong>{totals.IN}</strong></td></tr>
          <tr><td><span className="pyhot-country US">US</span></td><td><strong>{totals.US}</strong></td></tr>
        </tbody>
      </table>
      <div className={"pyhot-success "+(ready?"is-ready":"")}><CheckCircle2 size={22}/><p>These are the totals after applying all validation rules to the input data.</p></div>
    </section>
  );
}

function Pipeline({ step, running, onStep }: { step: Step; running:boolean; onStep:(s:Step)=>void }) {
  const icons = [Database,ShieldCheck,Layers3,BarChart3,FileCode2];
  return (
    <section className="pyhot-pipeline">
      <header><span><Target size={15}/></span><strong>Processing Pipeline</strong></header>
      <div>{pipeline.map(([title,body],index)=>{
        const Icon=icons[index];
        return <button key={title} type="button" disabled={running} onClick={()=>onStep(index as Step)} className={(step===index?"is-active ":"")+(step>=index?"is-complete ":"")+"pipe-"+(index+1)}>
          <span className="pyhot-pipe-number">{index+1}</span><span className="pyhot-pipe-icon"><Icon size={20}/></span><span><strong>{title}</strong><small>{body}</small></span>{step>=index&&<CheckCircle2 className="pyhot-pipe-check" size={14}/>}
          {index<pipeline.length-1&&<span className="pyhot-pipe-arrow">â†’</span>}
        </button>;
      })}</div>
    </section>
  );
}

function CodeSolution() {
  const [copied,setCopied]=useState(false);
  const copy=async()=>{
    try{await navigator.clipboard.writeText(solution);setCopied(true);window.setTimeout(()=>setCopied(false),1200);}
    catch{toast.error("Could not copy the solution.");}
  };
  return (
    <section className="pyhot-code">
      <header><div><span>&lt;/&gt;</span><strong>Python Solution (Standard Library Only)</strong></div><button type="button" onClick={copy}>{copied?<Check size={13}/>:<Copy size={13}/>} {copied?"Copied":"Copy"}</button></header>
      <pre><code>{solution.split("\n").map((line,index)=><span key={index}><i>{index+1}</i><b className={line.trim().startsWith("#")?"is-comment":""}><PythonCodeLine code={line || " "} /></b></span>)}</code></pre>
    </section>
  );
}

function Acceptance() {
  const items = [
    ["violet",Layers3,"Deduplicate before totals","Remove exact duplicates prior to aggregation."],
    ["orange",Target,"Missing country excluded","Exclude records with empty or missing country."],
    ["red",ShieldCheck,"Refund excluded","Non-positive amounts (â‰¤ 0) are excluded from the positive-sales metric."],
    ["green",BarChart3,"Expected totals","After cleaning and aggregation, the totals should be:","IN â†’ 120","US â†’ 50"],
  ] as const;
  return (
    <section className="pyhot-acceptance">
      <h3><Lightbulb size={16}/> Key Concepts &amp; Acceptance Criteria</h3>
      <div>{items.map(([tone,Icon,title,body,a,b])=><article key={title} className={"pyhot-accept pyhot-"+tone}><span><Icon size={19}/></span><div><strong>{title}</strong><p>{body}</p>{a&&<b>{a}<br/>{b}</b>}</div></article>)}</div>
    </section>
  );
}

export function PythonHandsOnConcept() {
  const [step,setStep]=useState<Step>(0);
  const [running,setRunning]=useState(false);
  const [started,setStarted]=useState(false);
  const timers=useRef<number[]>([]);

  const valid=useMemo(()=>orders.filter(o=>o.country && o.amount>0),[]);
  const unique=useMemo(()=>{
    const seen=new Set<string>();
    return valid.filter(o=>{
      const key=`${o.order_id}|${o.country}|${o.amount}`;
      if(seen.has(key))return false;
      seen.add(key);return true;
    });
  },[valid]);
  const totals=useMemo(()=>unique.reduce<Record<string,number>>((acc,o)=>{
    if(o.country)acc[o.country]=(acc[o.country]||0)+o.amount;
    return acc;
  },{}),[unique]);

  const clearTimers=()=>{timers.current.forEach(t=>window.clearTimeout(t));timers.current=[];};
  useEffect(()=>()=>clearTimers(),[]);
  const play=(from:Step)=>{
    clearTimers();setStarted(true);setStep(from);
    if(matchMedia("(prefers-reduced-motion: reduce)").matches){setRunning(false);return;}
    setRunning(true);
    for(let next=from+1;next<=4;next++)timers.current.push(window.setTimeout(()=>setStep(next as Step),5000*(next-from)));
    timers.current.push(window.setTimeout(()=>setRunning(false),5000*(5-from)));
  };
  const run=()=>{if(running){clearTimers();setRunning(false);}else play(started&&step<4?step:0);};
  const next=()=>{clearTimers();setStarted(true);setRunning(false);setStep(value=>Math.min(4,value+1) as Step);};
  const previous=()=>{clearTimers();setStarted(true);setRunning(false);setStep(value=>Math.max(0,value-1) as Step);};
  const reset=()=>{clearTimers();setRunning(false);setStep(0);setStarted(false);};

  return (
    <div className={"pyhot-concept"+(running?" is-running":"")}>
      <header className="pyhot-concept-header">
        <div className="pyhot-target"><Target size={24}/></div>
        <div><h2>Mini Project: Clean and Aggregate Orders</h2><p>Validate, deduplicate, and aggregate messy order records step by step.</p></div>
        <div className="pyhot-controls">
          <button type="button" className="pyhot-run" onClick={run}><Play size={15}/>{running?"Runningâ€¦":"Run"}</button>
          <button type="button" onClick={previous} disabled={step===0}>Previous step</button><button type="button" onClick={next} disabled={step===4}>Next step <span>â†’</span></button>
          <button type="button" onClick={reset}><RotateCcw size={14}/>Reset</button>
          <div className="pyhot-progress"><span>{step+1} / 5 steps</span><i>{[0,1,2,3,4].map(i=><b key={i} className={step>=i?"on":""}/>)}</i></div>
        </div>
      </header>

      <p className="python-native-explanation" aria-live="polite">Illustrative flow · {["Inspect six source records and their data quality issues.", "Exclude the missing country and non-positive amount.", "Remove the identical duplicate before aggregation.", "Add the remaining positive amounts by country: IN 120, US 50.", "Check the results against the existing acceptance criteria."][step]}</p>
      <div className="pyhot-top-grid"><RawOrders step={step}/><Rules step={step}/><Expected step={step} totals={totals}/></div>
      <Pipeline step={step} running={false} onStep={value=>{clearTimers();setRunning(false);setStarted(true);setStep(value);}}/>
      <div className="pyhot-bottom-grid"><CodeSolution/><Acceptance/></div>
    </div>
  );
}
