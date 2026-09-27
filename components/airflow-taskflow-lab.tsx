"use client";

import {useEffect,useMemo,useState} from "react";
import {
  Check,
  CheckCircle2,
  Circle,
  Code2,
  Copy,
  Database,
  Lightbulb,
  Network,
  Play,
  RotateCcw,
  Settings2,
  Sparkles,
  Workflow,
} from "lucide-react";
import {motion,useReducedMotion} from "framer-motion";
import type {AirflowLesson} from "@/lib/airflow-lessons";

type AuthoringStyle="taskflow"|"operator";
type TaskId="extract"|"transform"|"load";

const taskflowCode=[
  "from airflow.sdk import dag, task",
  "import pendulum",
  "",
  "@dag(",
  '    dag_id="taskflow_example",',
  '    start_date=pendulum.datetime(2026, 1, 1, tz="UTC"),',
  "    schedule=None,",
  "    catchup=False,",
  ")",
  "def etl():",
  "    @task",
  "    def extract():",
  "        return 150",
  "",
  "    @task",
  "    def transform(amount: int):",
  "        return amount + 20",
  "",
  "    @task",
  "    def load(amount: int):",
  "        print(amount)",
  "",
  "    load(transform(extract()))",
  "",
  "etl()",
];

const operatorCode=[
  "from airflow.sdk import DAG",
  "import pendulum",
  "from airflow.providers.standard.operators.python import PythonOperator",
  "",
  'with DAG("operator_example",',
  '    start_date=pendulum.datetime(2026, 1, 1, tz="UTC"),',
  "    schedule=None,",
  "    catchup=False,",
  ") as dag:",
  '    extract = PythonOperator(task_id="extract", python_callable=extract_fn)',
  '    transform = PythonOperator(task_id="transform", python_callable=transform_fn)',
  '    load = PythonOperator(task_id="load", python_callable=load_fn)',
  "",
  "    extract >> transform >> load",
];

const taskMeta:Record<TaskId,{label:string;accent:string;definition:string;runtime:string}>={
  extract:{
    label:"extract()",
    accent:"violet",
    definition:"Calling extract() creates a task and an output reference. The Python body has not run yet.",
    runtime:"The task instance executes extract() and produces the runtime value 150.",
  },
  transform:{
    label:"transform()",
    accent:"blue",
    definition:"transform(extract_output) creates another task and a dependency on extract's future output.",
    runtime:"The task instance receives 150, adds 20, and produces 170.",
  },
  load:{
    label:"load()",
    accent:"green",
    definition:"load(transform_output) creates the final task and dependency. No value has been printed yet.",
    runtime:"The task instance receives 170 and prints it. The task does not return a useful downstream value here.",
  },
};

function stateFor(task:TaskId,runtimeStep:number){
  if(runtimeStep<0)return "pending";
  const index=task==="extract"?0:task==="transform"?1:2;
  if(runtimeStep===index)return "running";
  if(runtimeStep>index)return "success";
  return "pending";
}

function stateLabel(state:string){
  if(state==="success")return "Success";
  if(state==="running")return "Running";
  return "Pending";
}

function taskOutput(task:TaskId,runtimeStep:number){
  if(task==="extract")return runtimeStep>=1?"150":"—";
  if(task==="transform")return runtimeStep>=2?"170":"—";
  return runtimeStep>=3?"printed 170":"—";
}

export function AirflowTaskflowLab({lesson}:{lesson:AirflowLesson}){
  const reduce=useReducedMotion();
  const [style,setStyle]=useState<AuthoringStyle>("taskflow");
  const [built,setBuilt]=useState(false);
  const [runtimeStep,setRuntimeStep]=useState(-1);
  const [playing,setPlaying]=useState(false);
  const [selectedTask,setSelectedTask]=useState<TaskId>("extract");
  const [answer,setAnswer]=useState<number|null>(1);
  const [submitted,setSubmitted]=useState(true);
  const [copied,setCopied]=useState(false);

  const code=style==="taskflow"?taskflowCode:operatorCode;
  const complete=runtimeStep>=3;
  const phase=runtimeStep>=0?"runtime":"definition";
  const activeLine=style==="taskflow"
    ? runtimeStep<0?(built?22:11):runtimeStep===0?11:runtimeStep===1?15:runtimeStep>=2?19:22
    : runtimeStep<0?(built?13:9):runtimeStep===0?9:runtimeStep===1?10:11;

  useEffect(()=>{
    if(!playing)return;
    if(complete){setPlaying(false);return;}
    const timer=window.setTimeout(()=>setRuntimeStep(value=>Math.min(value+1,3)),reduce?0:950);
    return ()=>window.clearTimeout(timer);
  },[playing,complete,reduce]);

  useEffect(()=>{
    setBuilt(false);
    setRuntimeStep(-1);
    setPlaying(false);
    setSelectedTask("extract");
    setSubmitted(true);
    setAnswer(1);
  },[style]);

  const prediction=useMemo(()=>style==="taskflow"?{
    question:"extract() is called while Airflow is constructing the DAG. What happens?",
    options:[
      "Python immediately runs and returns 150",
      "A task/output reference is created; the function body does not run yet",
      "A worker starts executing extract immediately",
      "The scheduler runs the task during parsing",
    ],
    correct:1,
    explanation:"Correct. The decorated call builds a task/output reference at definition time. The Python body runs later in a task instance.",
  }:{
    question:"PythonOperator(...) is instantiated while the DAG is being defined. What happens?",
    options:[
      "The callable executes immediately",
      "A task/operator definition is added to the DAG; execution happens later",
      "A worker process is launched immediately",
      "The operator automatically completes successfully",
    ],
    correct:1,
    explanation:"Correct. Instantiating the operator defines work in the DAG. Its callable executes later when a task instance runs.",
  },[style]);

  async function copyCode(){
    try{
      await navigator.clipboard.writeText(code.join("\n"));
      setCopied(true);
      window.setTimeout(()=>setCopied(false),1200);
    }catch{
      setCopied(false);
    }
  }

  function buildDag(){
    setPlaying(false);
    setRuntimeStep(-1);
    setBuilt(true);
  }

  function runDag(){
    if(!built)setBuilt(true);
    if(complete)setRuntimeStep(-1);
    setRuntimeStep(0);
    setPlaying(true);
  }

  function reset(){
    setBuilt(false);
    setRuntimeStep(-1);
    setPlaying(false);
    setSelectedTask("extract");
    setAnswer(1);
    setSubmitted(true);
  }

  const selected=taskMeta[selectedTask];

  return <section className="af-tf" aria-label={lesson.title+" visual TaskFlow lesson"}>
    <div className="af-tf-phase-strip">
      <article className={"definition "+(phase==="definition"?"is-active":"")}>
        <span><strong>1</strong></span>
        <div><h3>Definition time</h3><p>You write Python code. Calls create tasks, output references and dependencies. <b>No task body is executed yet.</b></p></div>
      </article>
      <div className="af-tf-phase-arrow"><span>→</span><small>different phases</small></div>
      <article className={"runtime "+(phase==="runtime"?"is-active":"")}>
        <span><strong>2</strong></span>
        <div><h3>Runtime</h3><p>A DAG run creates task instances. Workers execute Python bodies and runtime values become available.</p></div>
      </article>
    </div>

    <div className="af-tf-authoring-grid">
      <section className="af-tf-code-panel">
        <header>
          <div><Code2 size={17}/><strong>Authoring code</strong><small>(definition time)</small></div>
          <div className="af-tf-style-switch">
            <button aria-pressed={style==="taskflow"} onClick={()=>setStyle("taskflow")}>TaskFlow API</button>
            <button aria-pressed={style==="operator"} onClick={()=>setStyle("operator")}>Operator style</button>
          </div>
        </header>
        <div className="af-tf-code-head"><span>{style==="taskflow"?"taskflow_example.py":"operator_example.py"}</span><button onClick={copyCode}>{copied?<Check size={13}/>:<Copy size={13}/>} {copied?"Copied":"Copy"}</button></div>
        <pre className="af-tf-code"><code>{code.map((line,index)=><span key={index} className={index===activeLine?"is-active":""}><i>{index+1}</i><b>{line}</b>{"\n"}</span>)}</code></pre>
      </section>

      <section className="af-tf-dag-panel">
        <header>
          <div><Workflow size={17}/><strong>Live DAG</strong><small>({phase==="definition"?"definition time view":"runtime view"})</small></div>
          <div className="af-tf-phase-pills"><button aria-pressed={phase==="definition"} onClick={()=>{setPlaying(false);setRuntimeStep(-1);}}>Definition time</button><button aria-pressed={phase==="runtime"} onClick={()=>{if(runtimeStep<0)setRuntimeStep(0);setPlaying(false);}}>Runtime</button></div>
        </header>

        <div className={"af-tf-notice "+(phase==="runtime"?"runtime":"definition")}>
          {phase==="definition"?<><Sparkles size={15}/><div><strong>These are task references, not executed results.</strong><p>{style==="taskflow"?"Calling extract(), transform() and load() builds the graph.":"Instantiating operators and declaring edges builds the graph."}</p></div></>:<><Play size={15}/><div><strong>These are task instances inside a DAG run.</strong><p>Runtime values appear only after the upstream task body actually executes.</p></div></>}
        </div>

        <div className="af-tf-dag-canvas">
          {(["extract","transform","load"] as TaskId[]).map((task,index)=>{
            const meta=taskMeta[task];
            const state=phase==="definition"?"definition":stateFor(task,runtimeStep);
            return <div className="af-tf-dag-item" key={task}>
              <motion.button
                type="button"
                className={"af-tf-dag-node tone-"+meta.accent+" state-"+state+(selectedTask===task?" is-selected":"")}
                onClick={()=>setSelectedTask(task)}
                initial={false}
                animate={{y:state==="running"&&!reduce?-2:0}}
              >
                <span className="af-tf-node-icon">{task==="extract"?<Database size={20}/>:task==="transform"?<Settings2 size={20}/>:<Network size={20}/>}</span>
                <strong>{meta.label}</strong>
                <small>{phase==="definition"?(style==="taskflow"?"Task reference":"Operator task"):"Task instance"}</small>
                <em>{phase==="definition"?"Not executed":stateLabel(state)}</em>
              </motion.button>
              {index<2&&<div className={"af-tf-dag-edge "+(built||phase==="runtime"?"is-built":"")}><span>→</span><small>{style==="taskflow"?"output reference":"dependency"}</small></div>}
            </div>;
          })}
        </div>

        <div className="af-tf-task-inspector">
          <div><strong>{selected.label}</strong><span>{phase==="definition"?"Definition":"Runtime"}</span></div>
          <p>{phase==="definition"?selected.definition:selected.runtime}</p>
          <small>{phase==="definition"&&selectedTask==="extract"?"No value 150 exists yet.":phase==="runtime"?"Current output: "+taskOutput(selectedTask,runtimeStep):"Dependency is represented before runtime values exist."}</small>
        </div>

        <div className="af-tf-dag-bottom">
          <section className="af-tf-try">
            <header><Play size={15}/><strong>Try it yourself</strong></header>
            <p>Build the DAG from the code, then run it to watch definition-time references become runtime task instances.</p>
            <div><button className="af-primary" onClick={buildDag}><Workflow size={13}/>Build DAG</button><button disabled={!built} onClick={runDag}><Play size={13}/>Run DAG</button><button onClick={reset}><RotateCcw size={13}/>Reset</button></div>
          </section>

          <section className="af-tf-predict">
            <header><Lightbulb size={15}/><strong>Predict before you run</strong></header>
            <p>{prediction.question}</p>
            <div>{prediction.options.map((option,index)=><button key={option} aria-pressed={answer===index} onClick={()=>{setAnswer(index);setSubmitted(false);}}><i>{answer===index?<Circle size={7}/>:null}</i><span>{option}</span></button>)}</div>
            <button className="af-primary" disabled={answer===null} onClick={()=>setSubmitted(true)}>Submit Answer</button>
            {submitted&&<small className={answer===prediction.correct?"is-correct":"is-wrong"}>{answer===prediction.correct?prediction.explanation:"Compare definition time with runtime: no task body should execute during DAG construction."}</small>}
          </section>
        </div>
      </section>
    </div>

    <section className="af-tf-runtime">
      <header>
        <div><Play size={18}/><div><strong>Runtime execution</strong><small>(task instances)</small><p>When the DAG runs, values become concrete only as task instances execute.</p></div></div>
        <button onClick={()=>{if(!built)setBuilt(true);runDag();}}><Play size={13}/>{complete?"Replay runtime":"Run DAG"}</button>
      </header>

      <div className="af-tf-runtime-body">
        <div className="af-tf-runtime-flow">
          {(["extract","transform","load"] as TaskId[]).map((task,index)=>{
            const state=stateFor(task,runtimeStep);
            const output=taskOutput(task,runtimeStep);
            return <div className="af-tf-runtime-item" key={task}>
              <article className={"tone-"+taskMeta[task].accent+" state-"+state}>
                <header><span>{index+1}</span><strong>{task==="extract"?"extract()":task==="transform"?"transform(150)":"load(170)"}</strong><em>{stateLabel(state)}</em></header>
                <div><b>{task==="load"?"Effect":"Output"}</b><code>{output}</code></div>
                <p>{task==="extract"?"Returns 150. This value becomes available to the downstream task.":task==="transform"?"Receives 150, adds 20, and returns 170.":"Receives 170 and prints it. No downstream value is required."}</p>
              </article>
              {index<2&&<div className="af-tf-runtime-arrow"><span>→</span><small>{index===0?"150":"170"}</small></div>}
            </div>;
          })}
        </div>

        <aside className="af-tf-state-legend">
          <strong>Task instance states</strong>
          <span><i className="pending"/>Pending<small>Waiting to run</small></span>
          <span><i className="running"/>Running<small>Task body executing</small></span>
          <span><i className="success"/>Success<small>Task completed</small></span>
        </aside>
      </div>
    </section>

    <div className="af-tf-compare">
      <article className="taskflow">
        <header><span><Code2 size={18}/></span><div><strong>TaskFlow API</strong><small>recommended for Python-native DAG authoring</small></div><em>Recommended</em></header>
        <div><span><CheckCircle2 size={13}/>Decorated Python functions become tasks.</span><span><CheckCircle2 size={13}/>Function arguments express data dependencies.</span><span><CheckCircle2 size={13}/>Small returned values can flow through task outputs/XCom.</span><span><CheckCircle2 size={13}/>Keeps custom Python DAGs concise and readable.</span></div>
      </article>
      <article className="operator">
        <header><span><Settings2 size={18}/></span><div><strong>Operator style</strong><small>explicit packaged task classes</small></div></header>
        <div><span><Circle size={10}/>Instantiate operator classes.</span><span><Circle size={10}/>Dependencies are commonly declared explicitly.</span><span><Circle size={10}/>Provider operators integrate Bash, SQL, Docker and other systems.</span><span><Circle size={10}/>Useful when a packaged operator fits the integration.</span></div>
      </article>
    </div>

    <p className="af-tf-caveat">Airflow 3.1 · deterministic educational simulation. DataPrep does not run real Airflow workers here. Small scalar task outputs are shown for teaching; bulk datasets should normally live in external storage and move between tasks by reference.</p>
  </section>;
}
