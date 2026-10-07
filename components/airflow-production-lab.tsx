"use client";
import {SyntaxText} from "@/components/syntax-editor";

import {useEffect,useState} from "react";
import {
  CheckCircle2,
  CircleCheck,
  Copy,
  Database,
  Eye,
  Play,
  RefreshCcw,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  SkipForward,
} from "lucide-react";
import type {AirflowLesson} from "@/lib/airflow-lessons";

const stages = [
  {title:"Interval input",subtitle:"Business key: order 501"},
  {title:"Attempt 1",subtitle:"Write then lose acknowledgement"},
  {title:"Retry",subtitle:"Same input · same business key"},
  {title:"Warehouse result",subtitle:"One business row"},
];

export function AirflowProductionLab({lesson}:{lesson:AirflowLesson}){
  const [step,setStep]=useState(0);
  const [running,setRunning]=useState(false);
  const [copied,setCopied]=useState(false);

  useEffect(()=>{
    if(!running || step>=3){setRunning(false);return;}
    const t=window.setTimeout(()=>setStep(v=>Math.min(v+1,3)),900);
    return ()=>window.clearTimeout(t);
  },[running,step]);

  const active=Math.min(step,3);
  const reset=()=>{setRunning(false);setStep(0);};
  const next=()=>{setRunning(false);setStep(v=>Math.min(v+1,3));};
  const rows=[
    {id:500,amount:"120.00"},
    {id:501,amount:"340.00"},
    {id:502,amount:"210.00"},
  ];
  const code = `# Idempotent write using business key (order_id)
from airflow.decorators import dag, task
from datetime import datetime

@task
def write_orders(order_id: int, amount: float):
    # Upsert based on business key to make reruns safe
    sql = """
        MERGE INTO orders t
        USING (SELECT {{ params.order_id }} AS order_id,
                      {{ params.amount }} AS amount) s
        ON t.order_id = s.order_id
        WHEN MATCHED THEN UPDATE SET amount = s.amount
        WHEN NOT MATCHED THEN INSERT (order_id, amount)
        VALUES (s.order_id, s.amount)
    """
    return "one business row"`;

  return <section className="af-prod" aria-label={lesson.title+" visualizer"}>
    <header className="af-prod-head">
      <div className="af-prod-title">
        <span className="af-prod-eye"><Eye size={21}/></span>
        <div><h2>Production Practices Visualizer</h2><p>See how idempotent writes and proper design make Airflow pipelines safe to rerun after partial failures.</p></div>
      </div>
      <div className="af-prod-controls">
        <button className="primary" onClick={()=>setRunning(v=>!v)}><Play size={14}/>{running?"Pause":"Run"}</button>
        <button onClick={next} disabled={step>=3}><SkipForward size={14}/>Next step</button>
        <button onClick={reset}><RotateCcw size={14}/>Reset</button>
        <span>{active+1} / 4 steps</span>
      </div>
    </header>

    <div className="af-prod-flow">
      <article className={"af-prod-stage blue "+(active>=0?"is-on":"")}>
        <div className="af-prod-stage-head"><b>1</b><div><h3>{stages[0].title}</h3><p>{stages[0].subtitle}</p></div></div>
        <div className="af-prod-card">
          <label>Processing date<input readOnly value="2024-01-15"/></label>
          <label>Order ID (business key)<input readOnly value="501"/></label>
          <small>This run will process data for order 501.</small>
        </div>
      </article>

      <span className="af-prod-arrow">→</span>

      <article className={"af-prod-stage violet "+(active>=1?"is-on":"")}>
        <div className="af-prod-stage-head"><b>2</b><div><h3>{stages[1].title}</h3><p>{stages[1].subtitle}</p></div></div>
        <div className="af-prod-card">
          <div className="af-prod-status"><span><Settings2 size={16}/>Task instance</span><strong>Failed</strong></div>
          <dl>
            <div><dt>Run ID</dt><dd>manual__2024-01-15...</dd></div>
            <div><dt>Start</dt><dd>2024-01-15 10:00:21</dd></div>
            <div><dt>End</dt><dd>2024-01-15 10:01:05</dd></div>
            <div><dt>Duration</dt><dd>44s</dd></div>
            <div><dt>Error</dt><dd>Connection lost<br/>after write</dd></div>
          </dl>
        </div>
      </article>

      <span className="af-prod-arrow">→</span>

      <article className={"af-prod-stage orange "+(active>=2?"is-on":"")}>
        <div className="af-prod-stage-head"><b>3</b><div><h3>{stages[2].title}</h3><p>{stages[2].subtitle}</p></div></div>
        <div className="af-prod-card af-prod-checklist">
          <p><CircleCheck size={17}/>Rerun with same inputs</p>
          <p><CircleCheck size={17}/>Detect existing data<br/><span>(using business key)</span></p>
          <p><CircleCheck size={17}/>Skip or upsert safely</p>
          <p><CircleCheck size={17}/>No duplicates created</p>
        </div>
      </article>

      <span className="af-prod-arrow">→</span>

      <article className={"af-prod-stage green "+(active>=3?"is-on":"")}>
        <div className="af-prod-stage-head"><b>4</b><div><h3>{stages[3].title}</h3><p>{stages[3].subtitle}</p></div></div>
        <div className="af-prod-card af-prod-warehouse">
          <div className="af-prod-table">
            <div className="head"><span>order_id</span><span>amount</span><span>status</span></div>
            {rows.map(r=><div key={r.id} className={r.id===501?"highlight":""}><span>{r.id}</span><span>{r.amount}</span><span><CheckCircle2 size={15}/></span></div>)}
          </div>
          <div className="af-prod-success"><CheckCircle2 size={22}/><span><b>Idempotent write successful</b><small>Order 501 processed once</small></span></div>
        </div>
      </article>
    </div>

    <section className="af-prod-timeline">
      <h3><span>⌾</span> Execution Timeline <small>(illustrative)</small></h3>
      <div>
        {[
          ["1","Process interval","Start run with order 501","00:00",Search],
          ["2","Attempt 1 fails","Write succeeds but ack lost","00:44",Database],
          ["3","Retry run","Same input, deduplicate","01:10",RefreshCcw],
          ["4","Final result","One row in warehouse","01:30",ShieldCheck],
        ].map(([n,t,d,time,Icon],i)=><article key={String(n)} className={active>=i?"active":""}>
          <b>{n as string}</b><span className="af-prod-timeline-icon"><Icon size={24}/></span>
          <div><strong>{t as string}</strong><p>{d as string}</p><small>{time as string}</small></div>
          {i<3&&<em>→</em>}
        </article>)}
      </div>
    </section>

    <div className="af-prod-bottom">
      <section className="af-prod-code">
        <header><strong>Python / configuration · idempotent write pattern</strong><button onClick={()=>{navigator.clipboard?.writeText(code);setCopied(true);window.setTimeout(()=>setCopied(false),1200)}}><Copy size={15}/>{copied?"Copied":"Copy"}</button></header>
        <pre><code><SyntaxText code={code}/></code></pre>
      </section>
      <section className="af-prod-concepts">
        <h3>Key Concepts</h3>
        <div>
          <article className="violet"><Database size={24}/><span><b>Idempotent writes</b><p>Use a business key (e.g., order_id) so reruns don't create duplicates.</p></span></article>
          <article className="blue"><ShieldCheck size={24}/><span><b>Handle partial failures</b><p>Design tasks to be safe even if they fail after writing.</p></span></article>
          <article className="green"><Play size={24}/><span><b>Test business outputs</b><p>Validate final data, not just task success.</p></span></article>
          <article className="orange"><Settings2 size={24}/><span><b>Use upserts / MERGE</b><p>Insert or update based on the business key for consistent results.</p></span></article>
        </div>
      </section>
    </div>
  </section>;
}
