"use client";

import {useEffect,useMemo,useState} from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Code2,
  Copy,
  Database,
  Eye,
  HelpCircle,
  Lightbulb,
  LockKeyhole,
  Network,
  Pause,
  Play,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldCheck,
  SkipForward,
  TimerReset,
  XCircle,
} from "lucide-react";
import {motion,useReducedMotion} from "framer-motion";
import type {AirflowLesson} from "@/lib/airflow-lessons";

type Scenario="fail-once"|"success"|"exhaust"|"timeout";
type AttemptState="running"|"failed"|"up_for_retry"|"success"|"queued"|"timeout";

type AttemptEvent={
  id:string;
  label:string;
  state:AttemptState;
  time:string;
  detail:string;
  badge?:string;
  duration?:string;
};

const scenarioLabels:Record<Scenario,string>={
  "fail-once":"Fail once → succeed",
  success:"Success immediately",
  exhaust:"Exhaust retries",
  timeout:"Timeout",
};

function buildEvents(scenario:Scenario,retries:number,delay:number):AttemptEvent[]{
  if(scenario==="success"){
    return [
      {id:"a1-run",label:"Attempt 1",state:"running",time:"10:00:00",detail:"Processing task...",badge:"1 of "+(retries+1),duration:"2m 10s"},
      {id:"a1-ok",label:"Attempt 1",state:"success",time:"10:02:10",detail:"Task completed",badge:"1 of "+(retries+1)},
    ];
  }
  if(scenario==="exhaust"){
    const events:AttemptEvent[]=[];
    for(let attempt=1;attempt<=retries+1;attempt++){
      events.push({id:"a"+attempt+"-run",label:"Attempt "+attempt,state:"running",time:"10:"+String((attempt-1)*(delay+2)).padStart(2,"0")+":00",detail:"Processing task...",badge:attempt+" of "+(retries+1),duration:"1m 20s"});
      events.push({id:"a"+attempt+"-fail",label:"Attempt "+attempt,state:"failed",time:"10:"+String((attempt-1)*(delay+2)+1).padStart(2,"0")+":20",detail:attempt===retries+1?"Retries exhausted":"Task failed with error",badge:attempt+" of "+(retries+1)});
      if(attempt<=retries) events.push({id:"a"+attempt+"-wait",label:"Waiting to retry",state:"up_for_retry",time:"",detail:"Retry after "+delay+" min",badge:"retry "+attempt});
    }
    return events;
  }
  if(scenario==="timeout"){
    return [
      {id:"a1-run",label:"Attempt 1",state:"running",time:"10:00:00",detail:"Task still running...",badge:"1 of "+(retries+1),duration:"5m 00s"},
      {id:"a1-timeout",label:"Attempt 1",state:"timeout",time:"10:05:00",detail:"Execution timeout reached",badge:"1 of "+(retries+1)},
      ...(retries>0?[
        {id:"a1-wait",label:"Waiting to retry",state:"up_for_retry" as AttemptState,time:"",detail:"Retry after "+delay+" min",badge:"retry 1"},
        {id:"a2-run",label:"Attempt 2",state:"running" as AttemptState,time:"10:"+String(5+delay).padStart(2,"0")+":00",detail:"Retrying task...",badge:"2 of "+(retries+1),duration:"1m 10s"},
        {id:"a2-ok",label:"Attempt 2",state:"success" as AttemptState,time:"10:"+String(6+delay).padStart(2,"0")+":10",detail:"Task completed",badge:"2 of "+(retries+1)},
      ]:[]),
    ];
  }
  if(retries===0){
    return [
      {id:"a1-run",label:"Attempt 1",state:"running",time:"10:00:00",detail:"Processing data...",badge:"1 of 1",duration:"2m 15s"},
      {id:"a1-fail",label:"Attempt 1",state:"failed",time:"10:02:15",detail:"Task failed; no retries configured",badge:"1 of 1"},
    ];
  }
  return [
    {id:"a1-run",label:"Attempt 1",state:"running",time:"10:00:00",detail:"Processing data...",badge:"1 of "+(retries+1),duration:"2m 15s"},
    {id:"a1-fail",label:"Attempt 1",state:"failed",time:"10:02:15",detail:"Task failed with error",badge:"1 of "+(retries+1)},
    {id:"a1-wait",label:"Waiting to retry",state:"up_for_retry",time:"",detail:"Retry in progress...",badge:"retry 1"},
    {id:"a2-run",label:"Attempt 2",state:"running",time:"10:"+String(2+delay).padStart(2,"0")+":15",detail:"Retrying task...",badge:"2 of "+(retries+1),duration:"1m 10s"},
    {id:"a2-ok",label:"Attempt 2",state:"success",time:"10:"+String(3+delay).padStart(2,"0")+":25",detail:"Task completed",badge:"2 of "+(retries+1)},
  ];
}

function toneFor(state:AttemptState){
  if(state==="failed"||state==="timeout")return "red";
  if(state==="up_for_retry")return "amber";
  if(state==="success")return "green";
  if(state==="queued")return "blue";
  return "violet";
}

function iconFor(state:AttemptState){
  if(state==="failed"||state==="timeout")return <XCircle size={18}/>;
  if(state==="up_for_retry")return <Clock3 size={18}/>;
  if(state==="success")return <CheckCircle2 size={18}/>;
  if(state==="queued")return <Database size={17}/>;
  return <Play size={18}/>;
}

export function AirflowRetriesLab({lesson}:{lesson:AirflowLesson}){
  const reduce=useReducedMotion();
  const [scenario,setScenario]=useState<Scenario>("fail-once");
  const [retries,setRetries]=useState(2);
  const [delay,setDelay]=useState(5);
  const [backoff,setBackoff]=useState(false);
  const [step,setStep]=useState(2);
  const [playing,setPlaying]=useState(false);
  const [answer,setAnswer]=useState<number|null>(1);
  const [submitted,setSubmitted]=useState(true);
  const [safeWrite,setSafeWrite]=useState(true);
  const [copied,setCopied]=useState(false);

  const events=useMemo(()=>buildEvents(scenario,retries,delay),[scenario,retries,delay]);
  const current=events[Math.min(step,events.length-1)];
  const complete=step>=events.length-1;
  const maxAttempts=retries+1;
  const currentAttempt=Math.min(maxAttempts,Number(current?.badge?.match(/^(\d+)/)?.[1]||1));

  useEffect(()=>{
    const defaultStep=scenario==="fail-once"?Math.min(2,events.length-1):0;
    setStep(defaultStep);
    setPlaying(false);
    setAnswer(1);
    setSubmitted(true);
  },[scenario,retries,delay,events.length]);

  useEffect(()=>{
    if(!playing)return;
    if(complete){setPlaying(false);return;}
    const timer=window.setTimeout(()=>setStep(v=>Math.min(v+1,events.length-1)),reduce?0:950);
    return ()=>window.clearTimeout(timer);
  },[playing,complete,events.length,reduce]);

  const downstreamState=useMemo(()=>{
    if(!current)return {label:"WAITING",tone:"amber",detail:"Waiting for transform"};
    if(current.state==="success")return {label:"ELIGIBLE",tone:"blue",detail:"load can run now that transform succeeded"};
    if(current.state==="failed"&&complete)return {label:"UPSTREAM_FAILED",tone:"red",detail:"transform has no successful attempt remaining"};
    if(current.state==="up_for_retry")return {label:"WAITING (up_for_retry)",tone:"amber",detail:"load remains blocked during retry delay"};
    if(current.state==="running")return {label:"WAITING",tone:"slate",detail:"transform has not succeeded yet"};
    return {label:"WAITING (upstream failed)",tone:"red",detail:"load is blocked because transform failed"};
  },[current,scenario,complete]);

  const retryDue=useMemo(()=>{
    if(current?.state!=="up_for_retry")return "—";
    if(scenario==="fail-once")return "10:"+String(2+delay).padStart(2,"0")+":15";
    if(scenario==="timeout")return "10:"+String(5+delay).padStart(2,"0")+":00";
    return "after "+delay+" min";
  },[current,scenario,delay]);

  const codeLines=[
    "from datetime import timedelta",
    "from airflow.sdk import DAG",
    "from airflow.providers.standard.operators.python import PythonOperator",
    "",
    "transform = PythonOperator(",
    '    task_id="transform",',
    "    python_callable=transform_data,",
    "    retries="+retries+",",
    "    retry_delay=timedelta(minutes="+delay+"),",
    "    retry_exponential_backoff="+(backoff?"True":"False")+",",
    ")",
  ];

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
  function next(){
    setPlaying(false);
    setStep(v=>Math.min(v+1,events.length-1));
  }
  function reset(){
    setPlaying(false);
    setStep(scenario==="fail-once"?Math.min(2,events.length-1):0);
    setAnswer(1);
    setSubmitted(true);
  }

  const quickOptions=[String(Math.max(0,maxAttempts-1)),String(maxAttempts),String(maxAttempts+1),"Unlimited"];
  const correctIndex=1;

  return <section className="af-retry" aria-label={lesson.title+" visual retries lesson"}>
    <div className="af-retry-heading">
      <div><span><RefreshCcw size={18}/></span><div><h2>Failures & Retries</h2><p>Break a task, wait, retry it, and see why repeated external effects must be safe.</p></div></div>
      <aside><Lightbulb size={18}/><div><strong>Key takeaway</strong><p>Retries are bounded. Retry delay affects when the next attempt can happen, and retries do not make side effects automatically safe.</p></div></aside>
    </div>

    <div className="af-retry-controls">
      <section>
        <strong>Scenario</strong>
        <div className="af-retry-scenarios">
          {(Object.keys(scenarioLabels) as Scenario[]).map(key=><button key={key} aria-pressed={scenario===key} onClick={()=>setScenario(key)}>{scenarioLabels[key]}</button>)}
        </div>
      </section>
      <section>
        <strong>Retry policy</strong>
        <div className="af-retry-policy">
          <label><span>Retries</span><select value={retries} onChange={e=>setRetries(Number(e.target.value))}><option value={0}>0</option><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option></select></label>
          <label><span>Delay</span><select value={delay} onChange={e=>setDelay(Number(e.target.value))}><option value={1}>1 min</option><option value={5}>5 min</option><option value={10}>10 min</option></select></label>
          <label><span>Backoff</span><select value={backoff?"on":"off"} onChange={e=>setBackoff(e.target.value==="on")}><option value="off">Off</option><option value="on">On</option></select></label>
        </div>
      </section>
      <section className="af-retry-actions">
        <button className="af-primary" onClick={run}>{playing?<Pause size={14}/>:<Play size={14}/>} {playing?"Pause":complete?"Replay":"Run failure"}</button>
        <button disabled={complete} onClick={next}><SkipForward size={14}/>Next event</button>
        <button onClick={reset}><RotateCcw size={14}/>Reset</button>
        <span>{step+1} / {events.length} events</span>
      </section>
    </div>

    <div className="af-retry-main">
      <div className="af-retry-left">
        <section className="af-retry-attempts">
          <header><div><Eye size={17}/><strong>Task Attempt Timeline</strong><small>A single task instance (<b>transform</b>) with retries. Watch attempts change while the task instance remains the same.</small></div></header>

          <div className="af-retry-event-row">
            {events.map((event,index)=><div className="af-retry-event-wrap" key={event.id}>
              <motion.button
                type="button"
                className={"af-retry-event tone-"+toneFor(event.state)+(index===step?" is-current":"")+(index<step?" is-done":"")}
                onClick={()=>{setPlaying(false);setStep(index);}}
                initial={false}
                animate={{y:index===step&&!reduce?-2:0,opacity:index>step?.5:1}}
              >
                <header><strong>{event.label}</strong>{event.badge&&<span>{event.badge}</span>}</header>
                <div className="af-retry-event-state"><i>{iconFor(event.state)}</i><div><b>{event.state==="up_for_retry"?"UP_FOR_RETRY":event.state.toUpperCase()}</b><small>transform</small></div></div>
                <time>{event.time||"waiting"}</time>
                <p>{event.detail}</p>
                {event.duration&&<em>{event.duration}</em>}
                {event.state==="up_for_retry"&&<div className="af-retry-waitbar"><span style={{width:Math.min(100,32+step*7)+"%"}}/><b>{Math.max(0,delay*60-28*step)}s</b></div>}
              </motion.button>
              {index<events.length-1&&<div className={"af-retry-arrow "+(index<step?"is-done":"")}><span>→</span></div>}
            </div>)}
          </div>

          <div className="af-retry-downstream">
            <div><Network size={17}/><strong>Downstream task: load</strong></div>
            <article className={"tone-"+downstreamState.tone}><span>{downstreamState.label}</span><small>{downstreamState.detail}</small></article>
            <div className="af-retry-downstream-arrow">→</div>
            <article className="tone-blue"><span>{current?.state==="success"?"ELIGIBLE":"BLOCKED"}</span><small>{current?.state==="success"?"load can now be scheduled":"all_success is not satisfied yet"}</small></article>
          </div>
        </section>

        <div className="af-retry-bottom">
          <section className="af-retry-code">
            <header><div><Code2 size={15}/><strong>Python / retry policy sketch</strong></div><button onClick={copyCode}>{copied?<Check size={13}/>:<Copy size={13}/>} {copied?"Copied":"Copy"}</button></header>
            <pre><code>{codeLines.map((line,index)=><span key={index} className={index>=7&&index<=9?"is-active":""}><i>{index+1}</i><b>{line}</b>{"\n"}</span>)}</code></pre>
          </section>

          <section className="af-retry-effects">
            <header><Database size={16}/><strong>What already happened?</strong></header>
            <div className="af-retry-effect-steps">
              <span><b>1</b><div><strong>Attempt 1 failed</strong><p>The task may already have written some data before the process failed.</p></div></span>
              <span><b>2</b><div><strong>External effects must be safe</strong><p>A retry repeats the task body. Blind INSERT can duplicate business effects.</p></div></span>
              <span><b>3</b><div><strong>Attempt 2 retries the same work</strong><p>Use stable business keys, MERGE/upsert, or another idempotent write contract.</p></div></span>
            </div>
            <div className="af-retry-write-toggle"><button aria-pressed={!safeWrite} onClick={()=>setSafeWrite(false)}>Blind INSERT</button><button aria-pressed={safeWrite} onClick={()=>setSafeWrite(true)}>Idempotent UPSERT</button></div>
            <div className={"af-retry-write-result "+(safeWrite?"safe":"unsafe")}>{safeWrite?<><ShieldCheck size={15}/><span>Repeated attempt updates/replaces the same business keys instead of multiplying rows.</span></>:<><AlertTriangle size={15}/><span>Attempt 1 wrote 500 rows; retry inserts them again → 1,000 rows. Duplicate business effect.</span></>}</div>
          </section>

          <section className="af-retry-quick">
            <header><HelpCircle size={16}/><strong>Quick Check</strong></header>
            <p>With <code>retries = {retries}</code>, what is the maximum number of attempts from one normal initial execution?</p>
            <div>{quickOptions.map((option,index)=><button key={index} aria-pressed={answer===index} onClick={()=>{setAnswer(index);setSubmitted(false);}}><i>{answer===index?<Circle size={7}/>:null}</i><span>{option}</span>{submitted&&index===correctIndex&&answer===correctIndex&&<em>Correct!</em>}</button>)}</div>
            <button className="af-primary" disabled={answer===null} onClick={()=>setSubmitted(true)}>Check Answer</button>
            {submitted&&<small className={answer===correctIndex?"is-correct":"is-wrong"}>{answer===correctIndex?("Right! 1 initial attempt + "+retries+" retries = "+maxAttempts+" maximum attempts."):"Retries are additional attempts after the initial execution."}</small>}
          </section>
        </div>

        <section className="af-retry-takeaways">
          <div><Lightbulb size={16}/><strong>Key Takeaways</strong></div>
          <span><b>1</b><p><strong>Same task instance, multiple attempts</strong>Retries are additional attempts, not new DAG runs.</p></span>
          <span><b>2</b><p><strong>Retries do not guarantee safe side effects</strong>A failed task may already have written data.</p></span>
          <span><b>3</b><p><strong>Make retryable tasks idempotent</strong>Design writes to be safe on repeats.</p></span>
        </section>
      </div>

      <aside className="af-retry-inspector">
        <header><Search size={17}/><strong>Retry Inspector</strong></header>
        <div className={"af-retry-current tone-"+toneFor(current.state)}>
          <span>{iconFor(current.state)}</span><div><small>Current state</small><strong>{current.state==="up_for_retry"?"UP_FOR_RETRY":current.state.toUpperCase()}</strong></div>
        </div>
        <dl>
          <div><dt>Task</dt><dd>transform</dd></div>
          <div><dt>Attempt</dt><dd>{currentAttempt} of {maxAttempts}</dd></div>
          <div><dt>Retries configured</dt><dd>{retries}</dd></div>
          <div><dt>Attempts possible</dt><dd>{maxAttempts}<small>(1 initial + {retries} retries)</small></dd></div>
          <div><dt>Retry delay</dt><dd>{delay} min</dd></div>
          <div><dt>Backoff</dt><dd>{backoff?"On":"Off"}</dd></div>
          <div><dt>Next retry time</dt><dd>{retryDue}</dd></div>
        </dl>

        <section>
          <header><LockKeyhole size={15}/><strong>Why is load blocked?</strong></header>
          <p>load depends on transform. While transform is failed, running, or <b>up_for_retry</b>, downstream <code>all_success</code> work cannot run.</p>
        </section>

        {current.state==="up_for_retry"&&<section className="af-retry-insight"><TimerReset size={16}/><div><strong>Waiting is not success</strong><p>The task instance is waiting for another attempt. Downstream success requirements are still unsatisfied.</p></div></section>}
        {(current.state==="failed"||current.state==="timeout")&&<section className="af-retry-insight danger"><XCircle size={16}/><div><strong>Failure can leave external effects behind</strong><p>Airflow can retry the task, but it cannot automatically undo a remote database commit.</p></div></section>}
      </aside>
    </div>

    <p className="af-retry-caveat">Airflow 3.1 · deterministic educational simulation. Times and durations are illustrative. Actual retry timing depends on scheduling/executor capacity and configuration. External writes require their own idempotency or transactional guarantees.</p>
  </section>;
}
