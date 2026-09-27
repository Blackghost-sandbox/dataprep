"use client";

import {useEffect,useMemo,useState} from "react";
import {
  AlertTriangle,
  Ban,
  CalendarClock,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Code2,
  Copy,
  Eye,
  HelpCircle,
  Pause,
  Play,
  RefreshCcw,
  RotateCcw,
  Search,
  SkipForward,
  TimerReset,
  Users,
  XCircle,
} from "lucide-react";
import {motion,useReducedMotion} from "framer-motion";
import type {AirflowLesson} from "@/lib/airflow-lessons";

type Scenario="normal"|"queue-delay"|"retry"|"failure";
type LifecycleState="none"|"scheduled"|"queued"|"running"|"success"|"failed"|"up_for_retry"|"skipped"|"upstream_failed";

type StateInfo={
  label:string;
  subtitle:string;
  tone:string;
  meaning:string;
  owner:string;
  inspect:string[];
};

const stateInfo:Record<LifecycleState,StateInfo>={
  none:{label:"NONE",subtitle:"Task instance created",tone:"slate",meaning:"The task instance exists in this DAG run, but the scheduler has not assigned an execution state yet.",owner:"Scheduler",inspect:["DAG run exists","Task instance identity","Upstream task states","Scheduling constraints"]},
  scheduled:{label:"SCHEDULED",subtitle:"Selected for execution",tone:"blue",meaning:"The scheduler has decided this task is eligible to execute and has scheduled it for submission.",owner:"Scheduler",inspect:["Dependencies satisfied","Pools and limits","Priority / queue configuration","Executor availability"]},
  queued:{label:"QUEUED",subtitle:"Waiting for a worker slot",tone:"violet",meaning:"The task has been submitted for execution, but its Python task body has not started yet.",owner:"Scheduler → Executor",inspect:["Worker capacity","Pool / pool slots","DAG and task concurrency","Queue name and executor health"]},
  running:{label:"RUNNING",subtitle:"Task code is executing",tone:"green",meaning:"A worker is actively executing this task attempt. Business logic and external side effects may now be happening.",owner:"Executor → Worker",inspect:["Current attempt logs","External system health","Task duration","Heartbeats / worker status"]},
  success:{label:"SUCCESS",subtitle:"Task finished successfully",tone:"green",meaning:"This task attempt completed successfully. Downstream tasks may now become eligible, subject to their own dependencies and limits.",owner:"Task instance",inspect:["Expected outputs","Downstream eligibility","Row counts / validation","External side effects"]},
  failed:{label:"FAILED",subtitle:"Task failed permanently",tone:"red",meaning:"The current task instance has exhausted its allowed attempts or reached a terminal failure state.",owner:"Task instance",inspect:["Attempt logs","Root cause","Partial side effects","Safe rerun scope"]},
  up_for_retry:{label:"UP_FOR_RETRY",subtitle:"Will retry after delay",tone:"amber",meaning:"An attempt failed, but retry policy allows another attempt after the configured delay.",owner:"Retry policy",inspect:["Attempt number","Retry delay","Idempotency of side effects","Whether the error is transient"]},
  skipped:{label:"SKIPPED",subtitle:"Not executed by design",tone:"slate",meaning:"The task was deliberately not selected for execution, such as an unchosen branch.",owner:"Branch / trigger rule",inspect:["Branch choice","Trigger rules","Expected skip semantics","Join behavior"]},
  upstream_failed:{label:"UPSTREAM_FAILED",subtitle:"Required upstream failed",tone:"red",meaning:"This task did not run because an upstream dependency failed and its trigger rule could not be satisfied.",owner:"Dependency evaluation",inspect:["Which upstream failed","Trigger rule","Whether skip vs failure is expected","Recovery scope"]},
};

const mainStates:LifecycleState[]=["none","scheduled","queued","running","success"];
const branchStates:LifecycleState[]=["failed","up_for_retry","skipped","upstream_failed"];

const scenarioPaths:Record<Scenario,LifecycleState[]>={
  normal:["none","scheduled","queued","running","success"],
  "queue-delay":["none","scheduled","queued"],
  retry:["none","scheduled","queued","running","up_for_retry","queued","running","success"],
  failure:["none","scheduled","queued","running","failed"],
};

const scenarioNames:Record<Scenario,string>={
  normal:"Normal success (happy path)",
  "queue-delay":"Queue delay",
  retry:"Retry then success",
  failure:"Permanent failure",
};

const codeLines=[
  "from airflow.sdk import DAG",
  "from airflow.providers.standard.operators.python import PythonOperator",
  "",
  "def transform():",
  '    print("Transforming data...")',
  "",
  'with DAG("sales_pipeline", schedule=None, catchup=False) as dag:',
  '    transform_task = PythonOperator(',
  '        task_id="transform",',
  "        python_callable=transform,",
  "    )",
];

function stateIcon(state:LifecycleState){
  if(state==="success")return <CheckCircle2 size={19}/>;
  if(state==="running")return <Play size={18}/>;
  if(state==="failed")return <XCircle size={18}/>;
  if(state==="up_for_retry")return <RefreshCcw size={18}/>;
  if(state==="skipped")return <SkipForward size={18}/>;
  if(state==="upstream_failed")return <Ban size={18}/>;
  if(state==="scheduled")return <CalendarClock size={18}/>;
  if(state==="queued")return <Clock3 size={18}/>;
  return <Circle size={14}/>;
}

export function AirflowTaskLifecycleLab({lesson}:{lesson:AirflowLesson}){
  const reduce=useReducedMotion();
  const [scenario,setScenario]=useState<Scenario>("normal");
  const [step,setStep]=useState(2);
  const [playing,setPlaying]=useState(false);
  const [selected,setSelected]=useState<LifecycleState>("queued");
  const [answer,setAnswer]=useState<number|null>(0);
  const [submitted,setSubmitted]=useState(true);
  const [copied,setCopied]=useState(false);

  const path=scenarioPaths[scenario];
  const current=path[Math.min(step,path.length-1)];
  const info=stateInfo[selected];
  const complete=step>=path.length-1;

  useEffect(()=>{
    const start=scenario==="normal"?2:0;
    setStep(start);
    setSelected(scenarioPaths[scenario][start]);
    setPlaying(false);
    setAnswer(0);
    setSubmitted(true);
  },[scenario]);

  useEffect(()=>{
    if(!playing)return;
    if(complete){setPlaying(false);return;}
    const timer=window.setTimeout(()=>{
      setStep(value=>{
        const next=Math.min(value+1,path.length-1);
        setSelected(path[next]);
        return next;
      });
    },reduce?0:1000);
    return ()=>window.clearTimeout(timer);
  },[playing,complete,path,reduce]);

  const timeline=useMemo(()=>{
    const base=[
      {time:"12:00",state:"none" as LifecycleState,label:"Task instance created"},
      {time:"12:01",state:"scheduled" as LifecycleState,label:"Selected for execution"},
      {time:"12:02",state:"queued" as LifecycleState,label:"Waiting for worker"},
      {time:"12:07",state:"running" as LifecycleState,label:"Task code executing"},
      {time:"12:10",state:"success" as LifecycleState,label:"Task completed"},
    ];
    if(scenario==="queue-delay")return base.slice(0,3);
    if(scenario==="failure")return [...base.slice(0,4),{time:"12:10",state:"failed" as LifecycleState,label:"Attempt failed terminally"}];
    if(scenario==="retry")return [
      ...base.slice(0,4),
      {time:"12:10",state:"up_for_retry" as LifecycleState,label:"Attempt 1 failed; retry allowed"},
      {time:"12:15",state:"queued" as LifecycleState,label:"Retry submitted"},
      {time:"12:17",state:"running" as LifecycleState,label:"Attempt 2 executing"},
      {time:"12:20",state:"success" as LifecycleState,label:"Attempt 2 succeeded"},
    ];
    return base;
  },[scenario]);

  const activeMain=mainStates.includes(current)?current:"running";
  const activeBranch=branchStates.includes(current)?current:null;

  async function copyCode(){
    try{
      await navigator.clipboard.writeText(codeLines.join("\n"));
      setCopied(true);
      window.setTimeout(()=>setCopied(false),1200);
    }catch{setCopied(false);}
  }

  function run(){
    if(complete){
      setStep(0);
      setSelected(path[0]);
    }
    setPlaying(value=>!value||complete);
  }

  function next(){
    setPlaying(false);
    setStep(value=>{
      const nextStep=Math.min(value+1,path.length-1);
      setSelected(path[nextStep]);
      return nextStep;
    });
  }

  function reset(){
    setPlaying(false);
    const start=scenario==="normal"?2:0;
    setStep(start);
    setSelected(path[start]);
    setAnswer(0);
    setSubmitted(true);
  }

  return <section className="af-life" aria-label={lesson.title+" visual lifecycle lesson"}>
    <div className="af-life-heading">
      <div><span><Play size={18}/></span><div><h2>Trace One Task</h2><p>Watch a single task instance move through execution states. Select a state to inspect what it means and what to debug next.</p></div></div>
      <aside><Lightbulb size={18}/><div><strong>Key takeaway</strong><p>A task state tells you where execution is currently blocked or progressing. Debug the state before debugging the business logic.</p></div></aside>
    </div>

    <div className="af-life-main">
      <div className="af-life-left">
        <section className="af-life-sim">
          <header>
            <label><span>Scenario</span><select value={scenario} onChange={e=>setScenario(e.target.value as Scenario)}>{(Object.keys(scenarioNames) as Scenario[]).map(key=><option key={key} value={key}>{scenarioNames[key]}</option>)}</select></label>
            <div className="af-life-controls">
              <button className="af-primary" onClick={run}>{playing?<Pause size={14}/>:<Play size={14}/>} {playing?"Pause":complete?"Replay":"Run lifecycle"}</button>
              <button disabled={complete} onClick={next}><SkipForward size={14}/>Next state</button>
              <button onClick={reset}><RotateCcw size={14}/>Reset</button>
              <span>{step+1} / {path.length} states</span>
            </div>
          </header>

          <div className="af-life-graph">
            <div className="af-life-main-row">
              {mainStates.map((state,index)=><div className="af-life-node-wrap" key={state}>
                <motion.button
                  type="button"
                  className={"af-life-node tone-"+stateInfo[state].tone+(selected===state?" is-selected":"")+(activeMain===state?" is-current":"")}
                  onClick={()=>setSelected(state)}
                  initial={false}
                  animate={{y:activeMain===state&&!reduce?-2:0}}
                >
                  <span>{stateIcon(state)}</span>
                  <strong>{stateInfo[state].label}</strong>
                  <small>{stateInfo[state].subtitle}</small>
                </motion.button>
                {index<mainStates.length-1&&<div className={"af-life-arrow "+(mainStates.indexOf(activeMain)>index?"is-done":"")}><span>→</span><small>{index===0?"Scheduler decides":index===1?"Executor accepts":index===2?"Worker available":"Task completes"}</small></div>}
              </div>)}
            </div>

            <div className="af-life-branches">
              {branchStates.map((state,index)=><div className="af-life-branch" key={state}>
                <span className="af-life-branch-label">{index===0?"Task fails":index===1?"Retry allowed":index===2?"Branch skipped":"Upstream failure"}</span>
                <button type="button" className={"af-life-branch-node tone-"+stateInfo[state].tone+(selected===state?" is-selected":"")+(activeBranch===state?" is-current":"")} onClick={()=>setSelected(state)}>
                  <span>{stateIcon(state)}</span>
                  <strong>{stateInfo[state].label}</strong>
                  <small>{stateInfo[state].subtitle}</small>
                </button>
              </div>)}
            </div>
          </div>

          <div className="af-life-timeline">
            <header><Clock3 size={16}/><strong>Task Timeline</strong><small>illustrative timestamps</small></header>
            <div>
              {timeline.map((item,index)=>{
                const reached=index<=step;
                const currentIndex=Math.min(step,timeline.length-1);
                return <button type="button" key={index} className={(reached?"is-reached ":"")+(index===currentIndex?"is-current":"")} onClick={()=>{setPlaying(false);setStep(Math.min(index,path.length-1));setSelected(item.state);}}>
                  <i/><span>{item.time}</span><strong>{stateInfo[item.state].label}</strong><small>{item.label}</small>
                </button>;
              })}
            </div>
          </div>
        </section>

        <div className="af-life-bottom">
          <section className="af-life-code">
            <header><strong>Python · lifecycle context</strong><button onClick={copyCode}>{copied?<Check size={13}/>:<Copy size={13}/>} {copied?"Copied":"Copy"}</button></header>
            <pre><code>{codeLines.map((line,index)=><span key={index} className={index===7||index===8||index===9?"is-active":""}><i>{index+1}</i><b>{line}</b>{"\n"}</span>)}</code></pre>
          </section>

          <section className="af-life-why">
            <header><HelpCircle size={17}/><strong>Why this state?</strong></header>
            <p>{stateInfo[current].meaning}</p>
            <div><strong>Common causes</strong>{stateInfo[current].inspect.slice(0,4).map(item=><span key={item}><Circle size={7}/>{item}</span>)}</div>
          </section>

          <section className="af-life-check">
            <header><CheckCircle2 size={17}/><strong>Check Your Understanding</strong></header>
            <p>A task has been queued for 10 minutes. What should you inspect first?</p>
            <div>
              {["Worker capacity and available slots","The task's Python code for errors","Whether upstream tasks succeeded","The DAG schedule and data interval"].map((option,index)=><button key={option} aria-pressed={answer===index} onClick={()=>{setAnswer(index);setSubmitted(false);}}><i>{answer===index?<Circle size={7}/>:null}</i><span>{option}</span></button>)}
            </div>
            <button className="af-primary" disabled={answer===null} onClick={()=>setSubmitted(true)}>Check Answer</button>
            {submitted&&<small className={answer===0?"is-correct":"is-wrong"}>{answer===0?"Correct. Queued means task code has not started; inspect execution capacity first.":"Queued is before running. Start with executor/worker capacity, pools and limits."}</small>}
          </section>
        </div>
      </div>

      <aside className="af-life-inspector">
        <header><Eye size={17}/><strong>State Inspector</strong></header>

        <div className={"af-life-state-card tone-"+info.tone}>
          <span>{stateIcon(selected)}</span>
          <div><small>Current state</small><strong>{info.label}</strong><p>Order in lifecycle: {mainStates.includes(selected)?mainStates.indexOf(selected)+1:"alternate state"}</p></div>
        </div>

        <section>
          <header><Code2 size={16}/><strong>Meaning</strong></header>
          <p>{info.meaning}</p>
        </section>

        <section>
          <header><Users size={16}/><strong>Who owns this transition?</strong></header>
          <b>{info.owner}</b>
          <p>{selected==="queued"?"The scheduler/executor path has accepted the task, but execution waits until a worker slot is available.":selected==="running"?"A worker owns the active attempt while the scheduler continues tracking state.":"Ownership depends on the state transition shown above."}</p>
        </section>

        <section className="af-life-inspect-list">
          <header><Search size={16}/><strong>What should you inspect?</strong></header>
          {info.inspect.map(item=><span key={item}><Circle size={7}/>{item}</span>)}
        </section>

        {selected==="queued"&&<div className="af-life-warning"><AlertTriangle size={16}/><div><strong>Do not debug Python first</strong><p>Queued means the business task body may never have started.</p></div></div>}
        {selected==="up_for_retry"&&<div className="af-life-warning"><TimerReset size={16}/><div><strong>Task instance ≠ attempt</strong><p>The same task instance can make multiple attempts.</p></div></div>}
      </aside>
    </div>

    <p className="af-life-caveat">Airflow 3.1 · deterministic educational lifecycle. Timestamps are illustrative, not performance measurements. Real state transitions depend on executor, worker, pool, trigger-rule and retry configuration.</p>
  </section>;
}
