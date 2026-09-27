"use client";

import {useEffect,useMemo,useState} from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Database,
  Eye,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  SkipForward,
  Sparkles,
  Workflow,
  Wrench,
} from "lucide-react";
import type {AirflowLesson} from "@/lib/airflow-lessons";

export function AirflowProductionLab({lesson}:{lesson:AirflowLesson}){
  const [step,setStep]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [copied,setCopied]=useState(false);

  useEffect(()=>{
    if(!playing)return;
    if(step>=3){setPlaying(false);return;}
    const timer=window.setTimeout(()=>setStep(s=>Math.min(3,s+1)),950);
    return ()=>window.clearTimeout(timer);
  },[playing,step]);

  const complete=step>=3;

  const codeLines=useMemo(()=>[
    "# Idempotent write using business key (order_id)",
    "from airflow.sdk import dag, task",
    "import pendulum",
    "",
    "@dag(",
    '    start_date=pendulum.datetime(2026, 1, 1, tz="UTC"),',
    "    schedule=None,",
    "    catchup=False,",
    ")",
    "def production_write():",
    "    @task",
    "    def write_order(order_id: int, amount: float):",
    "        # Same business key -> one intended business effect.",
    "        sql = \"\"\"",
    "        MERGE INTO orders AS t",
    "        USING (SELECT :order_id AS order_id, :amount AS amount) AS s",
    "          ON t.order_id = s.order_id",
    "        WHEN MATCHED THEN UPDATE SET amount = s.amount",
    "        WHEN NOT MATCHED THEN INSERT (order_id, amount)",
    "        VALUES (s.order_id, s.amount)",
    "        \"\"\"",
    "        execute_parameterized(sql, order_id=order_id, amount=amount)",
    "",
    "    write_order(order_id=501, amount=340.00)",
    "",
    "production_write()",
  ],[]);

  async function copyCode(){
    try{
      await navigator.clipboard.writeText(codeLines.join("\n"));
      setCopied(true);
      window.setTimeout(()=>setCopied(false),1200);
    }catch{setCopied(false);}
  }

  function run(){
    if(complete)setStep(0);
    setPlaying(v=>!v||complete);
  }

  function reset(){
    setPlaying(false);
    setStep(0);
  }

  return <section className="af-prod" aria-label={lesson.title+" visual production practices lesson"}>
    <header className="af-prod-toolbar">
      <div className="af-prod-toolbar-title">
        <span><Eye size={20}/></span>
        <div><strong>Production Practices Visualizer</strong><small>See how idempotent writes and proper design make Airflow pipelines safe to rerun after partial failures.</small></div>
      </div>
      <div className="af-prod-actions">
        <button className="af-primary" onClick={run}><Play size={14}/>{playing?"Pause":complete?"Replay":"Run"}</button>
        <button disabled={complete} onClick={()=>{setPlaying(false);setStep(s=>Math.min(3,s+1));}}><SkipForward size={14}/>Next step</button>
        <button onClick={reset}><RotateCcw size={14}/>Reset</button>
        <b>{step+1} / 4 steps</b>
      </div>
    </header>

    <section className="af-prod-flow">
      <article className={"af-prod-card input "+(step===0?"is-current":"")}>
        <header><span>1</span><div><strong>Interval input</strong><small>Business key: order 501</small></div></header>
        <div className="af-prod-inputbox">
          <label>Processing date</label>
          <div><b>2026-09-27</b><CalendarDays size={13}/></div>
          <label>Order ID (business key)</label>
          <div><b>501</b></div>
          <p>This run addresses the same logical input and business identity on every controlled rerun.</p>
        </div>
      </article>

      <article className={"af-prod-card attempt "+(step===1?"is-current":"")}>
        <header><span>2</span><div><strong>Attempt 1</strong><small>Write then lose acknowledgment</small></div></header>
        <div className="af-prod-attemptbox">
          <div className="af-prod-attempt-title"><span><Workflow size={15}/></span><strong>Task instance</strong><em>Failed</em></div>
          <dl>
            <div><dt>Run ID</dt><dd>manual_2026-09-27...</dd></div>
            <div><dt>Start</dt><dd>16:00:21</dd></div>
            <div><dt>End</dt><dd>16:01:05</dd></div>
            <div><dt>Duration</dt><dd>44s</dd></div>
            <div><dt>Error</dt><dd>Connection lost after write</dd></div>
          </dl>
        </div>
      </article>

      <article className={"af-prod-card retry "+(step===2?"is-current":"")}>
        <header><span>3</span><div><strong>Retry</strong><small>Same input · same business key</small></div></header>
        <ul>
          <li><CheckCircle2 size={15}/><span>Rerun with same inputs</span></li>
          <li><CheckCircle2 size={15}/><span>Detect existing row using business key</span></li>
          <li><CheckCircle2 size={15}/><span>Skip or upsert safely</span></li>
          <li><ShieldCheck size={15}/><span>No duplicates created</span></li>
        </ul>
      </article>

      <article className={"af-prod-card warehouse "+(step===3?"is-current":"")}>
        <header><span>4</span><div><strong>Warehouse result</strong><small>One business row</small></div></header>
        <div className="af-prod-table">
          <div className="head"><b>order_id</b><b>amount</b><b>status</b></div>
          <div><span>500</span><span>120.00</span><CheckCircle2 size={13}/></div>
          <div className="highlight"><strong>501</strong><strong>340.00</strong><CheckCircle2 size={13}/></div>
          <div><span>502</span><span>210.00</span><CheckCircle2 size={13}/></div>
        </div>
        <div className="af-prod-success"><CheckCircle2 size={19}/><div><strong>Idempotent write successful</strong><small>Order 501 processed once</small></div></div>
      </article>

      <span className="af-prod-arrow a1">→</span>
      <span className="af-prod-arrow a2">→</span>
      <span className="af-prod-arrow a3">→</span>
    </section>

    <section className="af-prod-timeline">
      <header><Sparkles size={15}/><strong>Execution Timeline</strong><small>illustrative sequence, not elapsed runtime</small></header>
      <div>
        {[
          ["Process interval","Start run with order 501","blue","00:00"],
          ["Attempt 1 fails","Write succeeds but ack lost","violet","00:44"],
          ["Retry run","Same input, deduplicate","orange","01:10"],
          ["Final result","One row in warehouse","green","01:30"],
        ].map(([title,detail,tone,time],index)=><article key={title} className={"tone-"+tone+(index<=step?" is-done":"")}>
          <span>{index+1}</span>
          <div><strong>{title}</strong><small>{detail}</small><em>{time}</em></div>
          {index<=step?<CheckCircle2 size={14}/>:null}
          {index<3&&<i>→</i>}
        </article>)}
      </div>
    </section>

    <div className="af-prod-bottom">
      <section className="af-prod-code">
        <header><div><Code2 size={15}/><strong>Python / configuration · idempotent write pattern</strong></div><button onClick={copyCode}>{copied?<Check size={13}/>:<Copy size={13}/>} {copied?"Copied":"Copy"}</button></header>
        <pre><code>{codeLines.map((line,index)=><span key={index} className={index===12||index===14||index===16?"is-active":""}><i>{index+1}</i><b>{line}</b>{"\n"}</span>)}</code></pre>
      </section>

      <section className="af-prod-concepts">
        <header><strong>Key Concepts</strong></header>
        <div>
          <article className="violet"><span><Database size={19}/></span><p><strong>Idempotent writes</strong><small>Use a business key so reruns do not create duplicates.</small></p></article>
          <article className="blue"><span><ShieldCheck size={19}/></span><p><strong>Handle partial failures</strong><small>Design tasks to be safe even if they fail after writing.</small></p></article>
          <article className="green"><span><Play size={19}/></span><p><strong>Test business outputs</strong><small>Validate final data, not just task success.</small></p></article>
          <article className="orange"><span><Wrench size={19}/></span><p><strong>Use upserts / MERGE</strong><small>Insert or update based on the business key for consistent results.</small></p></article>
        </div>
      </section>
    </div>

    <p className="af-prod-caveat">Airflow 3.1 · deterministic educational simulation. Timestamps, run IDs and SQL execution are illustrative. Real idempotency depends on target-system constraints, transaction semantics and a stable business identity.</p>
  </section>;
}
