"use client";

import {useEffect,useMemo,useState} from "react";
import {
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Code2,
  Copy,
  Database,
  FileText,
  HelpCircle,
  Lightbulb,
  LockKeyhole,
  Pause,
  Play,
  RefreshCcw,
  RotateCcw,
  Settings2,
  ShieldCheck,
  SkipForward,
  TimerReset,
} from "lucide-react";
import {motion,useReducedMotion} from "framer-motion";
import type {AirflowLesson} from "@/lib/airflow-lessons";

type SensorMode="poke"|"reschedule";

const path="/data/input.csv";
const checks=["12:00","12:01","12:02","12:03","12:04"];

export function AirflowSensorsLab({lesson}:{lesson:AirflowLesson}){
  const reduce=useReducedMotion();
  const [mode,setMode]=useState<SensorMode>("reschedule");
  const [fileExists,setFileExists]=useState(false);
  const [step,setStep]=useState(2);
  const [playing,setPlaying]=useState(false);
  const [answer,setAnswer]=useState<number|null>(2);
  const [submitted,setSubmitted]=useState(true);
  const [copied,setCopied]=useState(false);

  const found=fileExists && step>=3;
  const sensorState=found?"success":mode==="reschedule"&&step>0?"up_for_reschedule":step===0?"running":"waiting";
  const loadReady=found;
  const complete=found&&step>=4;

  useEffect(()=>{
    if(!playing||complete)return;
    const timer=window.setTimeout(()=>{
      const next=Math.min(4,step+1);
      setStep(next);
      if(next>=4)setPlaying(false);
    },reduce?0:950);
    return ()=>window.clearTimeout(timer);
  },[playing,complete,reduce,step]);

  const codeLines=useMemo(()=>[
    "from airflow.providers.standard.sensors.filesystem import FileSensor",
    "from airflow.providers.standard.operators.python import PythonOperator",
    "",
    'wait_file = FileSensor(',
    '    task_id="wait_file",',
    '    filepath="input.csv",',
    '    fs_conn_id="fs_default",',
    "    poke_interval=60,",
    "    timeout=3600,",
    '    mode="'+mode+'",',
    ")",
    "",
    "load = PythonOperator(",
    '    task_id="load",',
    "    python_callable=load_data,",
    ")",
    "",
    "wait_file >> load",
  ],[mode]);

  function selectMode(next:SensorMode){
    setMode(next);
    setPlaying(false);
    setStep(fileExists?3:2);
  }

  async function copyCode(){
    try{
      await navigator.clipboard.writeText(codeLines.join("\n"));
      setCopied(true);
      window.setTimeout(()=>setCopied(false),1200);
    }catch{setCopied(false);}
  }

  function run(){
    if(complete){
      setFileExists(false);
      setStep(0);
    }
    setPlaying(value=>!value||complete);
  }

  function reset(){
    setPlaying(false);
    setFileExists(false);
    setStep(2);
    setAnswer(2);
    setSubmitted(true);
  }

  const currentCheck=Math.min(step,checks.length-1);
  const answerOptions=["1 check","2 checks","3 checks","4 checks"];

  return <section className="af-sensor" aria-label={lesson.title+" visual sensor lesson"}>
    <header className="af-sensor-intro">
      <div>
        <span><FileText size={21}/></span>
        <div><h2>Sensors & Waiting</h2><p>Watch a sensor check repeatedly, release capacity between checks, and continue only when the condition becomes true.</p></div>
      </div>
      <aside><Lightbulb size={19}/><div><strong>Key takeaway</strong><p>Match waiting behavior to check frequency, available operators and timeout requirements.</p></div></aside>
    </header>

    <section className="af-sensor-toolbar">
      <div className="af-sensor-toolbar-title">
        <span><Play size={17}/></span>
        <div><strong>Watch Execution</strong><small>See how a sensor repeatedly checks for a file and proceeds when it becomes available.</small></div>
      </div>

      <div className="af-sensor-toolbar-controls">
        <label><span>Sensor mode</span><div className="af-sensor-segment"><button aria-pressed={mode==="poke"} onClick={()=>selectMode("poke")}>Poke</button><button aria-pressed={mode==="reschedule"} onClick={()=>selectMode("reschedule")}>Reschedule</button></div></label>
        <i/>
        <label className="af-sensor-switch"><span>File exists</span><button aria-pressed={fileExists} onClick={()=>{setFileExists(v=>!v);setPlaying(false);}}><b/></button></label>
        <i/>
        <button className="af-primary" onClick={run}>{playing?<Pause size={14}/>:<Play size={14}/>} {playing?"Pause":complete?"Replay":"Run"}</button>
        <button disabled={complete} onClick={()=>{setPlaying(false);setStep(value=>Math.min(4,value+1));}}><SkipForward size={14}/>Next step</button>
        <button onClick={reset}><RotateCcw size={14}/>Reset</button>
        <b>{step+1} / 5 steps</b>
      </div>
    </section>

    <section className="af-sensor-visual">
      <div className="af-sensor-canvas">
        <svg viewBox="0 0 1000 220" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id="af-sensor-pink-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#f43f76"/></marker>
            <marker id="af-sensor-slate-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#8ea1bb"/></marker>
            <marker id="af-sensor-green-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#0ca66b"/></marker>
          </defs>
          <path className={"file-edge "+(fileExists?"is-ready":"")} d="M205,110 C285,110 300,110 365,110" markerEnd="url(#af-sensor-pink-arrow)"/>
          <path className={"load-edge "+(loadReady?"is-ready":"")} d="M635,110 C720,110 735,110 805,110" markerEnd={loadReady?"url(#af-sensor-green-arrow)":"url(#af-sensor-slate-arrow)"}/>
        </svg>

        <article className={"af-sensor-node file "+(fileExists?"is-ready":"")}>
          <header><span><FileText size={22}/></span><div><strong>File to check</strong><small>{path}</small></div></header>
          <em>{fileExists?<><CheckCircle2 size={12}/>Found</>:<><Circle size={10}/>Not found</>}</em>
        </article>

        <motion.article className={"af-sensor-node sensor state-"+sensorState} initial={false} animate={{scale:!found&&!reduce?1.01:1}}>
          <header><span><Clock3 size={22}/></span><div><strong>wait_file</strong><small>FileSensor</small></div><RefreshCcw size={21}/></header>
          <div className="af-sensor-live-pill">{found?"Condition met":"Checking for file..."}</div>
          <p>{found?"SUCCESS":mode==="reschedule"?"UP_FOR_RESCHEDULE":"RUNNING / WAITING"}</p>
        </motion.article>

        <article className={"af-sensor-node load "+(loadReady?"is-ready":"")}>
          <header><span><Database size={22}/></span><div><strong>load</strong><small>PythonOperator</small></div></header>
          <em>{loadReady?<><CheckCircle2 size={12}/>Eligible</>:<><LockKeyhole size={11}/>Not ready</>}</em>
        </article>
      </div>

      <div className="af-sensor-under">
        <section className="af-sensor-timeline">
          <header><TimerReset size={16}/><strong>Execution Timeline (Sensor Checks)</strong></header>
          <div>
            {checks.map((time,index)=>{
              const past=index<currentCheck;
              const current=index===currentCheck;
              const success=fileExists&&index===currentCheck&&found;
              return <button key={time} className={(past?"is-past ":"")+(current?"is-current ":"")+(success?"is-success":"")} onClick={()=>{setPlaying(false);setStep(index);}}>
                <i>{success?<Check size={11}/>:past?<Check size={11}/>:current?<Circle size={8}/>:null}</i>
                <strong>Check {index+1}</strong>
                <span>{success?"Found":index<=currentCheck?"Not found":"Waiting"}</span>
                <small>{time}</small>
              </button>;
            })}
            <div className={"af-sensor-found "+(found?"is-success":"")}><span><CheckCircle2 size={15}/></span><strong>File found</strong><small>{found?"then load becomes eligible":"waiting for condition"}</small></div>
          </div>
        </section>

        <aside className={"af-sensor-now "+(found?"is-success":"")}>
          <header><span><Clock3 size={18}/></span><strong>What's happening now?</strong><b>{found?"Condition met":"Sensor is waiting"}</b></header>
          <p>{found
            ?<>The sensor sees <b>{path}</b>. It can succeed, so <b>load</b> becomes eligible subject to normal scheduling and capacity.</>
            :<>The <b>wait_file</b> sensor is checking for <b>{path}</b>. The file is not found yet, so the task keeps waiting and will check again after the configured interval.</>}</p>
        </aside>
      </div>
    </section>

    <section className="af-sensor-concepts">
      <article className="blue"><span><Settings2 size={19}/></span><div><strong>Poke mode</strong><em>Simple</em><p>Keeps the task running and repeatedly checks for the condition. It occupies a worker slot while waiting.</p></div></article>
      <article className="violet"><span><Clock3 size={19}/></span><div><strong>Reschedule mode</strong><em>Recommended for spaced checks</em><p>Releases the worker slot between checks. The task becomes up_for_reschedule until the next check.</p></div></article>
      <article className="amber"><span><CheckCircle2 size={19}/></span><div><strong>Waiting is not failure</strong><p>A false check does not mean failure. The sensor continues until the condition is met or timeout is reached.</p></div></article>
      <article className="green"><span><ShieldCheck size={19}/></span><div><strong>Trigger when condition is met</strong><p>Once readiness is confirmed, the sensor succeeds and downstream tasks can become eligible.</p></div></article>
    </section>

    <div className="af-sensor-bottom">
      <section className="af-sensor-code">
        <header><div><Code2 size={15}/><strong>Python · sensor policy sketch</strong></div><button onClick={copyCode}>{copied?<Check size={13}/>:<Copy size={13}/>} {copied?"Copied":"Copy"}</button></header>
        <pre><code>{codeLines.map((line,index)=><span key={index} className={line.includes('mode="'+mode+'"')||line.includes("poke_interval")?"is-active":""}><i>{index+1}</i><b>{line}</b>{"\n"}</span>)}</code></pre>
      </section>

      <section className="af-sensor-predict">
        <header><HelpCircle size={16}/><strong>Predict & Explain</strong></header>
        <p>If the sensor checks once per minute and the file becomes visible just before the third scheduled check, which check can first observe it?</p>
        <div>{answerOptions.map((option,index)=><button key={option} aria-pressed={answer===index} onClick={()=>{setAnswer(index);setSubmitted(false);}}><i>{String.fromCharCode(65+index)}</i><span>{option}</span></button>)}</div>
        <button className="af-primary" disabled={answer===null} onClick={()=>setSubmitted(true)}>Check Answer</button>
        {submitted&&<small className={answer===2?"is-correct":"is-wrong"}>{answer===2?"Correct. With checks at one-minute intervals, the third scheduled check can first observe a file that appears just before it.":"The sensor only observes the condition when a scheduled check runs."}</small>}
      </section>
    </div>

    <p className="af-sensor-caveat">Airflow 3.1 · deterministic educational simulation. Times shown in the timeline are illustrative. Poke mode and reschedule mode have different worker-slot behavior; deferrable sensors use a different mechanism with triggerer support.</p>
  </section>;
}
