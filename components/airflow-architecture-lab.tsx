"use client";

import {useEffect,useMemo,useState} from "react";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Cog,
  Database,
  FileCode2,
  Monitor,
  Pause,
  Play,
  RotateCcw,
  ServerCog,
  ShieldCheck,
  SkipForward,
  Workflow,
  XCircle,
} from "lucide-react";
import {motion,useReducedMotion} from "framer-motion";
import type {AirflowLesson} from "@/lib/airflow-lessons";

type Scenario="Healthy dispatch"|"No worker capacity";
type ComponentId="dag_files"|"dag_processor"|"metadata_db"|"scheduler"|"executor"|"worker"|"state_ui";
type InspectorTab="overview"|"does"|"not";

type ComponentInfo={
  label:string;
  short:string;
  detail:string;
  tone:string;
  does:string[];
  not:string[];
};

const componentInfo:Record<ComponentId,ComponentInfo>={
  dag_files:{
    label:"DAG Files",
    short:"Your repo",
    detail:"Python files declare DAGs, tasks, dependencies and policies.",
    tone:"slate",
    does:["Declare workflow structure","Define tasks and dependencies","Provide lightweight configuration at parse time"],
    not:["Execute task bodies by being imported","Store business datasets","Guarantee a task will start immediately"],
  },
  dag_processor:{
    label:"DAG Processor",
    short:"Parse + serialize",
    detail:"Parses Python files, creates DAG objects in memory, and serializes discovered structure for the control plane.",
    tone:"orange",
    does:["Parse DAG Python files","Create DAG objects in memory","Serialize DAG structure","Detect code/import changes"],
    not:["Execute your task Python code","Decide task scheduling eligibility","Run on worker nodes as the task body"],
  },
  metadata_db:{
    label:"Metadata DB",
    short:"Orchestration state",
    detail:"Persists Airflow orchestration metadata such as DAG/task state, serialized definitions and scheduling information.",
    tone:"cyan",
    does:["Persist orchestration metadata","Store task and DAG-run state","Back the control plane and UI with state"],
    not:["Replace your data warehouse","Store the bulk business dataset","Run the task's transformation logic"],
  },
  scheduler:{
    label:"Scheduler",
    short:"Evaluate eligibility",
    detail:"Evaluates DAG runs, dependencies, schedules and limits to decide which task instances are eligible for execution.",
    tone:"pink",
    does:["Evaluate task eligibility","Apply dependency and scheduling rules","Coordinate eligible work with the executor"],
    not:["Execute every task's Python body","Provide unlimited worker capacity","Validate your business data automatically"],
  },
  executor:{
    label:"Executor",
    short:"Dispatch work",
    detail:"Defines how eligible task execution is dispatched to the configured execution environment.",
    tone:"violet",
    does:["Receive eligible work from scheduling","Dispatch work using the configured executor model","Represent execution capacity boundaries"],
    not:["Choose business dependencies","Act as your analytics warehouse","Make queued work equal running work"],
  },
  worker:{
    label:"Worker / Task Execution",
    short:"Run task code",
    detail:"The task execution process runs the task body in the configured execution environment.",
    tone:"green",
    does:["Execute task code","Produce task logs and outcomes","Interact with external systems using configured access"],
    not:["Decide whether upstream dependencies are satisfied","Replace the scheduler","Guarantee remote side effects are exactly-once"],
  },
  state_ui:{
    label:"State + UI",
    short:"Observe + operate",
    detail:"The API/UI reads orchestration state so operators can inspect runs, task states and logs.",
    tone:"coral",
    does:["Show DAG and task state","Expose operational controls through supported interfaces","Help inspect logs and run history"],
    not:["Become the source of truth for business data","Execute task bodies in the browser","Turn a green state into proof that data is correct"],
  },
};

const componentOrder:ComponentId[]=["dag_files","dag_processor","metadata_db","scheduler","executor","worker","state_ui"];

const positions:Record<ComponentId,{x:number;y:number;w:number}>={
  dag_files:{x:7,y:43,w:11},
  dag_processor:{x:28,y:21,w:21},
  metadata_db:{x:54,y:21,w:21},
  scheduler:{x:29,y:61,w:21},
  executor:{x:55,y:61,w:21},
  worker:{x:82,y:61,w:21},
  state_ui:{x:83,y:21,w:21},
};

const healthyFrames=[
  {focus:"dag_processor" as ComponentId,title:"Discover DAG",caption:"DAG processor parses and serializes the discovered workflow.",taskState:"none"},
  {focus:"scheduler" as ComponentId,title:"Scheduler evaluates",caption:"Scheduler reads orchestration metadata and decides the task is eligible.",taskState:"scheduled"},
  {focus:"executor" as ComponentId,title:"Submit to executor",caption:"Eligible work is submitted through the configured executor.",taskState:"queued"},
  {focus:"worker" as ComponentId,title:"Worker executes",caption:"Execution capacity is available, so the task body begins running.",taskState:"running"},
  {focus:"metadata_db" as ComponentId,title:"Record state & logs",caption:"The successful outcome is persisted as orchestration state.",taskState:"success"},
  {focus:"state_ui" as ComponentId,title:"Visible in UI",caption:"The UI reads the recorded state so operators can inspect the result.",taskState:"success"},
];

const blockedFrames=[
  {focus:"dag_processor" as ComponentId,title:"Discover DAG",caption:"DAG processor parses and serializes the discovered workflow.",taskState:"none"},
  {focus:"scheduler" as ComponentId,title:"Scheduler evaluates",caption:"Dependencies are satisfied; the scheduler makes the task eligible.",taskState:"scheduled"},
  {focus:"executor" as ComponentId,title:"Submit to executor",caption:"The task is submitted for execution and becomes queued.",taskState:"queued"},
  {focus:"executor" as ComponentId,title:"Capacity unavailable",caption:"No worker slot is available. Queued is not running; task code has not started.",taskState:"queued"},
  {focus:"metadata_db" as ComponentId,title:"Record queued state",caption:"The control plane persists that the task is still queued.",taskState:"queued"},
  {focus:"state_ui" as ComponentId,title:"UI shows queued",caption:"Operators can see the task waiting for execution capacity.",taskState:"queued"},
];

const timelineLabels=[
  ["Discover DAG","DAG file is parsed and serialized"],
  ["Scheduler evaluates","Checks dependencies and schedule"],
  ["Submit to executor","Task is eligible and submitted"],
  ["Worker executes","Task runs on available worker"],
  ["Record state & logs","State and logs written to metadata DB"],
  ["Visible in UI","UI reads latest orchestration state"],
];

function ComponentIcon({id,size=24}:{id:ComponentId;size?:number}){
  if(id==="dag_files")return <FileCode2 size={size}/>;
  if(id==="dag_processor")return <Cog size={size}/>;
  if(id==="metadata_db")return <Database size={size}/>;
  if(id==="scheduler")return <CalendarClock size={size}/>;
  if(id==="executor")return <Workflow size={size}/>;
  if(id==="worker")return <ServerCog size={size}/>;
  return <Monitor size={size}/>;
}

function edgeState(step:number,scenario:Scenario){
  const successful=scenario==="Healthy dispatch";
  return {
    filesProcessor:step>=0,
    processorDb:step>=0,
    dbScheduler:step>=1,
    schedulerExecutor:step>=2,
    executorWorker:step>=3&&successful,
    workerDb:step>=4&&successful,
    dbUi:step>=5,
  };
}

function eventLines(step:number,scenario:Scenario){
  const common=[
    "[DAG Processor] Found DAG file: example_dag.py",
    "[DAG Processor] Serialized DAG metadata",
    "[Scheduler] Evaluating task: example_task",
    "[Scheduler] Task is eligible to run",
    "[Executor] Submitted task for execution",
  ];
  const healthy=[
    ...common,
    "[Worker] Starting task execution",
    "[Worker] Task completed successfully",
    "[Metadata DB] Recorded task state: success",
    "[Web UI] Refreshed latest task state",
  ];
  const blocked=[
    ...common,
    "[Executor] No worker slot available; task remains queued",
    "[Metadata DB] Recorded task state: queued",
    "[Web UI] Refreshed latest task state: queued",
  ];
  const source=scenario==="Healthy dispatch"?healthy:blocked;
  const reveal=[2,4,5,6,8,9][step]??source.length;
  return source.slice(0,Math.min(reveal,source.length));
}

export function AirflowArchitectureLab({lesson}:{lesson:AirflowLesson}){
  const reduce=useReducedMotion();
  const [scenario,setScenario]=useState<Scenario>("Healthy dispatch");
  const frames=useMemo(()=>scenario==="Healthy dispatch"?healthyFrames:blockedFrames,[scenario]);
  const [step,setStep]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [selected,setSelected]=useState<ComponentId>("dag_processor");
  const [tab,setTab]=useState<InspectorTab>("overview");
  const frame=frames[Math.min(step,frames.length-1)];
  const complete=step===frames.length-1;
  const edges=edgeState(step,scenario);
  const info=componentInfo[selected];

  useEffect(()=>{
    setStep(0);
    setPlaying(false);
    setSelected("dag_processor");
    setTab("overview");
  },[scenario]);

  useEffect(()=>{
    if(!playing)return;
    if(complete){setPlaying(false);return;}
    const timer=window.setTimeout(()=>setStep(value=>Math.min(value+1,frames.length-1)),reduce?0:1250);
    return ()=>window.clearTimeout(timer);
  },[playing,complete,frames.length,reduce]);

  function run(){
    if(complete)setStep(0);
    setPlaying(value=>!value||complete);
  }
  function reset(){
    setPlaying(false);
    setStep(0);
    setSelected("dag_processor");
    setTab("overview");
  }
  function inspect(id:ComponentId){
    setSelected(id);
    setTab("overview");
  }

  const taskState=frame.taskState;
  const stateRows=[
    ["task_id","example_task"],
    ["dag_id","example_dag"],
    ["state",taskState],
    ["run_id","educational_run_01"],
    ["try_number","1"],
    ["execution",scenario==="No worker capacity"&&step>=3?"waiting for capacity":taskState==="running"?"task body running":taskState==="success"?"completed":"not started"],
    ["worker",scenario==="Healthy dispatch"&&step>=3?"teaching-worker-1":"—"],
    ["log_ref",scenario==="Healthy dispatch"&&step>=3?"/log/example_task/1":"—"],
  ];

  return <section className="af-arch" aria-label={lesson.title+" visual architecture lab"}>
    <header className="af-arch-toolbar">
      <div className="af-arch-title"><Activity size={21}/><div><h2>Follow a Task Through Airflow</h2><p>Watch one task move through each component. Click any component to inspect its responsibility, what it does, and what it does NOT do.</p></div></div>
      <div className="af-arch-controls">
        <span>Scenario:</span>
        <button aria-pressed={scenario==="Healthy dispatch"} onClick={()=>setScenario("Healthy dispatch")}>Healthy dispatch</button>
        <button aria-pressed={scenario==="No worker capacity"} onClick={()=>setScenario("No worker capacity")}>No worker capacity</button>
        <i/>
        <button className="af-primary" onClick={run}>{playing?<Pause size={14}/>:<Play size={14}/>} {playing?"Pause":complete?"Replay":"Run"}</button>
        <button disabled={complete} onClick={()=>{setPlaying(false);setStep(value=>Math.min(value+1,frames.length-1));}}><SkipForward size={14}/>Next step</button>
        <button onClick={reset}><RotateCcw size={14}/>Reset</button>
      </div>
    </header>

    <div className="af-arch-body">
      <div className="af-arch-left">
        <section className="af-arch-canvas">
          <div className="af-arch-control-plane"><span>Control Plane (Scheduling & Dispatching)</span></div>
          <svg className="af-arch-edges" viewBox="0 0 100 72" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <marker id="af-arch-arrow-muted" markerWidth="5" markerHeight="5" refX="4.5" refY="2.5" orient="auto"><path d="M0 0L5 2.5L0 5Z" fill="#b9c6dc"/></marker>
              <marker id="af-arch-arrow-live" markerWidth="5" markerHeight="5" refX="4.5" refY="2.5" orient="auto"><path d="M0 0L5 2.5L0 5Z" fill="#6d4cf5"/></marker>
              <marker id="af-arch-arrow-green" markerWidth="5" markerHeight="5" refX="4.5" refY="2.5" orient="auto"><path d="M0 0L5 2.5L0 5Z" fill="#0aa66a"/></marker>
            </defs>
            <path className={"af-arch-edge "+(edges.filesProcessor?"is-live":"")} d="M13 43 C16 43 15 28 17.5 24" markerEnd={edges.filesProcessor?"url(#af-arch-arrow-live)":"url(#af-arch-arrow-muted)"}/>
            <path className={"af-arch-edge "+(edges.processorDb?"is-live":"")} d="M38.5 21 L43.5 21" markerEnd={edges.processorDb?"url(#af-arch-arrow-live)":"url(#af-arch-arrow-muted)"}/>
            <path className={"af-arch-edge is-dashed "+(edges.dbUi?"is-live":"")} d="M64.5 21 L72.5 21" markerEnd={edges.dbUi?"url(#af-arch-arrow-live)":"url(#af-arch-arrow-muted)"}/>
            <path className={"af-arch-edge "+(edges.dbScheduler?"is-live":"")} d="M54 30 C54 41 43 46 39.5 55" markerEnd={edges.dbScheduler?"url(#af-arch-arrow-live)":"url(#af-arch-arrow-muted)"}/>
            <path className={"af-arch-edge "+(edges.schedulerExecutor?"is-live":"")} d="M39.5 61 L44.5 61" markerEnd={edges.schedulerExecutor?"url(#af-arch-arrow-live)":"url(#af-arch-arrow-muted)"}/>
            <path className={"af-arch-edge "+(edges.executorWorker?"is-live":"")} d="M65.5 61 L71.5 61" markerEnd={edges.executorWorker?"url(#af-arch-arrow-live)":"url(#af-arch-arrow-muted)"}/>
            <path className={"af-arch-edge is-dashed "+(edges.workerDb?"is-green":"")} d="M82 52 C82 40 66 38 60 30" markerEnd={edges.workerDb?"url(#af-arch-arrow-green)":"url(#af-arch-arrow-muted)"}/>
          </svg>

          <span className="af-arch-edge-label label-parse">Parse DAGs</span>
          <span className="af-arch-edge-label label-serialize">Writes serialized DAG<br/>and metadata</span>
          <span className="af-arch-edge-label label-read">Read DAGs<br/>& task metadata</span>
          <span className="af-arch-edge-label label-submit">Submits<br/>task to executor</span>
          <span className="af-arch-edge-label label-dispatch">Dispatches<br/>to available worker</span>
          <span className="af-arch-edge-label label-write">Write task state<br/>& logs</span>

          {componentOrder.map((id,index)=>{
            const pos=positions[id],item=componentInfo[id],active=frame.focus===id,visited=index===0?step>=0:
              id==="dag_processor"?step>=0:
              id==="metadata_db"?step>=0:
              id==="scheduler"?step>=1:
              id==="executor"?step>=2:
              id==="worker"?scenario==="Healthy dispatch"&&step>=3:
              step>=5;
            return <motion.button
              type="button"
              key={id}
              className={"af-arch-node tone-"+item.tone+(active?" is-active":"")+(visited?" is-visited":"")}
              style={{left:pos.x+"%",top:pos.y+"%",width:pos.w+"%"}}
              aria-pressed={selected===id}
              onClick={()=>inspect(id)}
              initial={false}
              animate={{y:active&&!reduce?-2:0}}
              transition={{duration:reduce?0:.18}}
            >
              <span className="af-arch-step">{index+1}</span>
              <span className="af-arch-node-icon"><ComponentIcon id={id}/></span>
              <div><strong>{item.label}</strong><small>{id==="dag_files"?"Python files with DAG definitions":item.short}</small></div>
              {active&&<em>{frame.title}</em>}
            </motion.button>;
          })}

          <div className="af-arch-now" role="status" aria-live={playing?"off":"polite"}>
            <span>{String(step+1).padStart(2,"0")}</span><div><strong>{frame.title}</strong><p>{frame.caption}</p></div>
            <b className={"state-"+taskState}>{taskState}</b>
          </div>
        </section>

        <div className="af-arch-lower">
          <section className="af-arch-timeline">
            <header><CalendarClock size={16}/><strong>Execution Timeline</strong></header>
            <div>
              {timelineLabels.map(([title,detail],index)=><button type="button" key={title} className={index===step?"is-current":index<step?"is-done":""} onClick={()=>{setPlaying(false);setStep(index);setSelected(frames[index].focus);}}>
                <span>{index<step?<CheckCircle2 size={13}/>:index+1}</span><i/><div><strong>{title}</strong><small>{scenario==="No worker capacity"&&index===3?"No execution slot available":detail}</small></div>
              </button>)}
            </div>
          </section>

          <section className="af-arch-log">
            <header><FileCode2 size={16}/><strong>Event Log</strong><span>educational trace</span></header>
            <pre>{eventLines(step,scenario).map((line,index)=><code key={index} className={line.includes("[Worker]")?"worker":line.includes("[Metadata DB]")?"db":line.includes("[Scheduler]")?"scheduler":""}><small>{String(index).padStart(2,"0")}:</small> {line}{"\n"}</code>)}</pre>
          </section>

          <section className="af-arch-dbstate">
            <header><Database size={16}/><strong>Task State in Metadata DB</strong></header>
            <div>{stateRows.map(([key,value])=><span key={key}><b>{key}</b><code className={key==="state"?"state-"+taskState:""}>{value}</code></span>)}</div>
          </section>
        </div>
      </div>

      <aside className="af-arch-side">
        <section className={"af-arch-inspector tone-"+info.tone}>
          <header><Database size={17}/><strong>Component Inspector</strong></header>
          <div className="af-arch-inspector-title"><span><ComponentIcon id={selected} size={26}/></span><div><strong>{info.label}</strong><small>{info.short}</small></div></div>
          <nav>
            <button aria-pressed={tab==="overview"} onClick={()=>setTab("overview")}>Overview</button>
            <button aria-pressed={tab==="does"} onClick={()=>setTab("does")}>Does</button>
            <button aria-pressed={tab==="not"} onClick={()=>setTab("not")}>Does NOT Do</button>
          </nav>
          <div className="af-arch-inspector-copy">
            {tab==="overview"&&<><p>{info.detail}</p><div className="af-arch-role-card"><ShieldCheck size={15}/><div><strong>Role in this lesson</strong><p>{selected===frame.focus?"This component owns the current phase.":frame.title+" is currently owned by "+componentInfo[frame.focus].label+"."}</p></div></div></>}
            {tab==="does"&&<div className="af-arch-list is-do"><strong><CheckCircle2 size={15}/>Key responsibilities</strong>{info.does.map(item=><span key={item}><CheckCircle2 size={14}/>{item}</span>)}</div>}
            {tab==="not"&&<div className="af-arch-list is-not"><strong><XCircle size={15}/>Does NOT do</strong>{info.not.map(item=><span key={item}><XCircle size={14}/>{item}</span>)}</div>}
          </div>
          {tab==="overview"&&<div className="af-arch-mini-panels">
            <div className="af-arch-list is-do"><strong><CheckCircle2 size={15}/>Key responsibilities</strong>{info.does.slice(0,4).map(item=><span key={item}><CheckCircle2 size={13}/>{item}</span>)}</div>
            <div className="af-arch-list is-not"><strong><XCircle size={15}/>Does NOT do</strong>{info.not.slice(0,3).map(item=><span key={item}><XCircle size={13}/>{item}</span>)}</div>
          </div>}
        </section>

        <section className="af-arch-takeaway">
          <CircleAlert size={20}/>
          <div><strong>Key Takeaway</strong><p>Airflow is a distributed orchestration system. The scheduler decides what should run, the executor dispatches it, task execution runs your code, the metadata DB records orchestration state, and the UI reads from that state.</p></div>
        </section>
      </aside>
    </div>

    <p className="af-arch-caveat">Airflow 3.1 · deterministic educational architecture trace. Deployment topology varies by executor and environment; DataPrep does not run real Airflow services or fabricate runtime timing.</p>
  </section>;
}
