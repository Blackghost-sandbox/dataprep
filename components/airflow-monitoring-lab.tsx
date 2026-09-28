"use client";

import {useEffect,useMemo,useState} from "react";
import {
  Check,
  CheckCircle2,
  Clock3,
  Code2,
  Copy,
  FileSearch,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  SkipForward,
  Wrench,
  XCircle,
} from "lucide-react";
import type {AirflowLesson} from "@/lib/airflow-lessons";

type Scenario="invalid"|"denied"|"queued";

const scenarios={
  invalid:{
    label:"Invalid input",
    task:"validate_data",
    state:"Failed",
    error:"ValueError: missing required field 'amount' in record",
    cause:"Input schema does not satisfy the validation contract.",
    fix:"Add missing-field validation and reject/route malformed records safely.",
  },
  denied:{
    label:"Access denied",
    task:"load_warehouse",
    state:"Failed",
    error:"PermissionError: warehouse access denied",
    cause:"The task reached the service but its configured identity lacks required permission.",
    fix:"Repair the Connection / secret-backed identity and least-privilege permissions.",
  },
  queued:{
    label:"Queued task",
    task:"publish_report",
    state:"Queued",
    error:"Task remains queued; no worker attempt log exists yet.",
    cause:"Capacity, pool, executor or concurrency constraints may be preventing a worker slot.",
    fix:"Inspect pools, executor/worker capacity and concurrency limits before retrying.",
  },
} as const;

export function AirflowMonitoringLab({lesson}:{lesson:AirflowLesson}){
  const [scenario,setScenario]=useState<Scenario>("invalid");
  const [step,setStep]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [copied,setCopied]=useState(false);
  const current=scenarios[scenario];

  useEffect(()=>{setStep(0);setPlaying(false);},[scenario]);
  useEffect(()=>{
    if(!playing)return;
    if(step>=3){setPlaying(false);return;}
    const t=window.setTimeout(()=>setStep(s=>Math.min(3,s+1)),950);
    return()=>window.clearTimeout(t);
  },[playing,step]);

  const rerunSuccess=step>=3;
  const codeLines=useMemo(()=>scenario==="invalid"?[
    "from airflow.sdk import task",
    "",
    "@task",
    "def validate_data(record: dict):",
    "    if \"amount\" not in record:",
    "        raise ValueError(",
    "            \"missing required field 'amount' in record\"",
    "        )",
    "    return record",
  ]:scenario==="denied"?[
    "from airflow.sdk import Connection, task",
    "",
    "@task",
    "def load_warehouse():",
    '    warehouse = Connection.get("warehouse")',
    "    # Repair identity / permissions; never print secrets.",
    "    return warehouse.conn_type",
  ]:[
    "# Queued tasks may not have a worker attempt log yet.",
    "# Inspect pool slots, executor/worker capacity,",
    "# task concurrency and DAG-level limits first.",
    "",
    "publish_report()",
  ],[scenario]);

  async function copyCode(){
    try{await navigator.clipboard.writeText(codeLines.join("\n"));setCopied(true);window.setTimeout(()=>setCopied(false),1200);}catch{setCopied(false);}
  }

  const timeline=[
    {title:"Detect failure",detail:scenario==="queued"?"Task stays queued":"Run shows 1 failed task",tone:"blue"},
    {title:scenario==="queued"?"Inspect capacity":"Inspect logs",detail:scenario==="queued"?"Check pools / executor":"Find the root cause",tone:"violet"},
    {title:"Apply fix",detail:scenario==="invalid"?"Update validation logic":scenario==="denied"?"Repair access policy":"Free / increase capacity",tone:"orange"},
    {title:"Rerun & validate",detail:"Confirm task and output behavior",tone:"green"},
  ];

  return <section className="af-monitor" aria-label={lesson.title+" visual monitoring and debugging lesson"}>
    <header className="af-monitor-toolbar">
      <div className="af-monitor-toolbar-title">
        <span><Search size={20}/></span>
        <div><strong>Monitoring & Debugging Visualizer</strong><small>Follow a task from detection to evidence, root cause, safe fix, controlled rerun and output validation.</small></div>
      </div>
      <div className="af-monitor-actions">
        <button className="af-primary" onClick={()=>{if(step>=3)setStep(0);setPlaying(v=>!v||step>=3);}}><Play size={14}/>{playing?"Pause":step>=3?"Replay":"Run"}</button>
        <button disabled={step>=3} onClick={()=>{setPlaying(false);setStep(s=>Math.min(3,s+1));}}><SkipForward size={14}/>Next step</button>
        <button onClick={()=>{setPlaying(false);setStep(0);}}><RotateCcw size={14}/>Reset</button>
        <b>{step+1} / 4 steps</b>
      </div>
    </header>

    <div className="af-monitor-scenarios">
      {(Object.keys(scenarios) as Scenario[]).map(key=><button key={key} aria-pressed={scenario===key} onClick={()=>setScenario(key)}>{scenarios[key].label}</button>)}
    </div>

    <section className="af-monitor-flow">
      <article className={"af-monitor-card run "+(step===0?"is-current":"")}>
        <header><span>1</span><div><strong>Run overview</strong><small>DAG run summary & task states</small></div></header>
        <div className="af-monitor-runbox">
          <div><Play size={12}/><strong>DAG run</strong><em className={scenario==="queued"?"queued":"failed"}>{scenario==="queued"?"Active":"Failed"}</em></div>
          <small>run_id: manual_2026-09-27T16:00</small>
          <small>logical_date: 2026-09-27 16:00</small>
          <div className="af-monitor-counts"><span><b>3</b>Success</span><span><b>1</b>{scenario==="queued"?"Queued":"Failed"}</span><span><b>0</b>Upstream</span><span><b>0</b>Running</span><span><b>0</b>Skipped</span><span><b>0</b>None</span></div>
        </div>
      </article>

      <article className={"af-monitor-card instance "+(step===1?"is-current":"")}>
        <header><span>2</span><div><strong>{scenario==="queued"?"Queued task instance":"Failed task instance"}</strong><small>Select the task instance to inspect</small></div></header>
        <div className="af-monitor-instance">
          <label>task_id</label><b>{current.task}</b>
          <div className="af-monitor-state"><XCircle size={15}/><strong>{current.state}</strong><em>{scenario==="queued"?"Waiting for worker":"TRY 1 of 3"}</em></div>
          <dl><div><dt>Start</dt><dd>{scenario==="queued"?"—":"16:03:12"}</dd></div><div><dt>End</dt><dd>{scenario==="queued"?"—":"16:03:45"}</dd></div><div><dt>Duration</dt><dd>{scenario==="queued"?"—":"33s"}</dd></div><div><dt>Operator</dt><dd>PythonOperator</dd></div></dl>
        </div>
      </article>

      <article className={"af-monitor-card evidence "+(step===2?"is-current":"")}>
        <header><span>3</span><div><strong>Log & error evidence</strong><small>{scenario==="queued"?"Inspect scheduler/capacity evidence":"Inspect task logs to find the cause"}</small></div></header>
        <div className="af-monitor-evidence-tabs"><b>Log output</b><span>Error details</span><span>Rendered</span></div>
        <pre>{scenario==="queued"?[
          "Task queued: publish_report",
          "No worker attempt has started",
          "Pool slots available: 0",
          "Inspect executor / worker capacity",
        ].join("\n"):[
          "*** Running task: "+current.task,
          "Loading input file...",
          "Validating records...",
          current.error,
          "Inspect input / configuration contract",
        ].join("\n")}</pre>
      </article>

      <article className={"af-monitor-card fix "+(step===3?"is-current":"")}>
        <header><span>4</span><div><strong>Fix & rerun</strong><small>Apply the repair and run the intended scope again</small></div></header>
        <div className="af-monitor-fixbox">
          <label>Apply fix</label>
          <p><Check size={11}/>{current.fix}</p>
          <pre>{scenario==="invalid"?"if 'amount' not in record:\n    raise ValueError('missing required field amount')":scenario==="denied"?"# Repair Connection / permissions\n# Keep credentials out of logs":"# Free pool capacity or scale workers\n# Then rerun the intended task scope"}</pre>
          <button><Play size={12}/>Rerun task</button>
          <div className={rerunSuccess?"is-success":""}><CheckCircle2 size={14}/><strong>{rerunSuccess?"Success":"Ready to rerun"}</strong><span>{rerunSuccess?"validated after fix":"apply a safe repair first"}</span></div>
        </div>
      </article>
    </section>

    <section className="af-monitor-timeline">
      <header><Clock3 size={15}/><strong>Task Execution Timeline</strong><small>illustrative sequence, not elapsed runtime</small></header>
      <div>{timeline.map((item,index)=><article key={item.title} className={"tone-"+item.tone+(index<=step?" is-done":"")}>
        <span>{index+1}</span><div><strong>{item.title}</strong><small>{item.detail}</small></div>{index<=step?<CheckCircle2 size={14}/>:null}{index<3&&<i>→</i>}
      </article>)}</div>
    </section>

    <div className="af-monitor-bottom">
      <section className="af-monitor-code">
        <header><div><Code2 size={15}/><strong>Python · task with validation / safe repair</strong></div><button onClick={copyCode}>{copied?<Check size={13}/>:<Copy size={13}/>} {copied?"Copied":"Copy"}</button></header>
        <pre><code>{codeLines.map((line,index)=><span key={index} className={index===4||index===5?"is-active":""}><i>{index+1}</i><b>{line}</b>{"\n"}</span>)}</code></pre>
      </section>

      <section className="af-monitor-fixes">
        <header><LightbulbIcon/><strong>Common Fixes</strong></header>
        <div>
          <article className="red"><span><XCircle size={17}/></span><p><strong>Validate inputs</strong><small>Check required fields before processing.</small></p></article>
          <article className="blue"><span><ShieldCheck size={17}/></span><p><strong>Handle missing data</strong><small>Use defaults or route invalid records deliberately.</small></p></article>
          <article className="green"><span><FileSearch size={17}/></span><p><strong>Improve logging</strong><small>Log safe context that makes failures diagnosable.</small></p></article>
          <article className="orange"><span><RefreshCw size={17}/></span><p><strong>Use retries carefully</strong><small>Retries help transient failures, not deterministic code bugs.</small></p></article>
        </div>
      </section>
    </div>

    <p className="af-monitor-caveat">Airflow 3.1 · deterministic educational debugging simulation. Logs, timestamps and run IDs are illustrative; no real scheduler, worker or external service is used here.</p>
  </section>;
}

function LightbulbIcon(){return <Wrench size={16}/>;}
