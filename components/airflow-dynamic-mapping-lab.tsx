"use client";

import {useEffect,useMemo,useState} from "react";
import {
  Check,
  CheckCircle2,
  Circle,
  Code2,
  Copy,
  FileText,
  Gauge,
  Layers3,
  ListTree,
  PackageOpen,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Sparkles,
  Workflow,
} from "lucide-react";
import type {AirflowLesson} from "@/lib/airflow-lessons";

type InstanceState="waiting"|"queued"|"running"|"success";
type FileItem={name:string;state:InstanceState};

const files=["sales_2026-01.csv","sales_2026-02.csv","sales_2026-03.csv","sales_2026-04.csv"];

function instanceStates(step:number):InstanceState[]{
  if(step<=1)return ["waiting","waiting","waiting","waiting"];
  if(step===2)return ["queued","queued","queued","queued"];
  if(step===3)return ["running","queued","queued","queued"];
  if(step===4)return ["success","running","queued","queued"];
  if(step===5)return ["success","success","running","queued"];
  if(step===6)return ["success","success","success","running"];
  return ["success","success","success","success"];
}

export function AirflowDynamicMappingLab({lesson}:{lesson:AirflowLesson}){
  const [step,setStep]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [copied,setCopied]=useState(false);

  const states=useMemo(()=>instanceStates(step),[step]);
  const listState=step===0?"running":"success";
  const expanded=step>=2;
  const summarizeState=step>=7?"success":"waiting";
  const complete=step>=7;

  useEffect(()=>{
    if(!playing)return;
    if(complete){setPlaying(false);return;}
    const timer=window.setTimeout(()=>setStep(value=>Math.min(7,value+1)),900);
    return ()=>window.clearTimeout(timer);
  },[playing,complete]);

  const codeLines=[
    "from airflow.sdk import dag, task",
    "import pendulum",
    "",
    "@dag(",
    '    start_date=pendulum.datetime(2026, 1, 1, tz="UTC"),',
    "    schedule=None,",
    "    catchup=False,",
    ")",
    "def mapped_files_demo():",
    "    @task",
    "    def list_files():",
    "        return [",
    ...files.map(name=>'            "'+name+'",'),
    "        ]",
    "",
    "    @task",
    "    def process_file(path: str):",
    '        return f"would process {path}"',
    "",
    "    @task",
    "    def summarize(results):",
    "        print(list(results))",
    "",
    "    parts = process_file.expand(path=list_files())",
    "    summarize(parts)",
    "",
    "mapped_files_demo()",
  ];

  const activeLine=step<=1?10:step===2?24:step<7?18:25;

  async function copyCode(){
    try{
      await navigator.clipboard.writeText(codeLines.join("\n"));
      setCopied(true);
      window.setTimeout(()=>setCopied(false),1200);
    }catch{setCopied(false);}
  }

  function run(){
    if(complete)setStep(0);
    setPlaying(value=>!value||complete);
  }

  function reset(){
    setPlaying(false);
    setStep(0);
  }

  const timeline=[
    {title:"list_files runs",detail:"Returns 4 file paths",tone:"blue",done:step>=1},
    {title:"process_file expands",detail:"Creates 4 mapped task instances",tone:"violet",done:step>=2},
    {title:"Mapped tasks run",detail:"Each index processes one input item",tone:"cyan",done:step>=6},
    {title:"summarize runs",detail:"Waits for mapped upstream success",tone:"green",done:step>=7},
  ];

  return <section className="af-map" aria-label={lesson.title+" visual dynamic mapping lesson"}>
    <section className="af-map-toolbar">
      <div className="af-map-toolbar-title">
        <span><Sparkles size={19}/></span>
        <div><strong>Dynamic Task Mapping Visualizer</strong><small>See how one mapped task definition creates multiple task instances, each with its own index and state.</small></div>
      </div>
      <div className="af-map-actions">
        <button className="af-primary" onClick={run}>{playing?<Pause size={14}/>:<Play size={14}/>} {playing?"Pause":complete?"Replay":"Run"}</button>
        <button disabled={complete} onClick={()=>{setPlaying(false);setStep(value=>Math.min(7,value+1));}}><SkipForward size={14}/>Next step</button>
        <button onClick={reset}><RotateCcw size={14}/>Reset</button>
        <b>{step+1} / 8 steps</b>
      </div>
    </section>

    <section className="af-map-flow">
      <svg className="af-map-wires" viewBox="0 0 1000 270" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <marker id="af-map-arrow-violet" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#6e47ef"/></marker>
          <marker id="af-map-arrow-green" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#0ca66b"/></marker>
        </defs>
        <path className={step>=2?"is-live":""} d="M244,135 C275,135 285,135 315,135" markerEnd="url(#af-map-arrow-violet)"/>
        <path className={step>=6?"is-live green":""} d="M700,135 C735,135 748,135 785,135" markerEnd={step>=6?"url(#af-map-arrow-green)":"url(#af-map-arrow-violet)"}/>
      </svg>

      <article className={"af-map-source state-"+listState}>
        <header><span><FileText size={22}/></span><div><strong>list_files</strong><small>Returns a list of files to process</small></div><em>{listState==="success"?"Success":"Running"}</em></header>
        <label>Output (list)</label>
        <pre>{JSON.stringify(files,null,2)}</pre>
      </article>

      <article className={"af-map-expanded "+(expanded?"is-expanded":"")}>
        <header><span><Layers3 size={22}/></span><div><strong>Mapped Task <b>(process_file.expand)</b></strong><small>{expanded?"Creates one task instance per input item":"Waiting for runtime input collection"}</small></div></header>
        <div className="af-map-instances">
          {files.map((name,index)=>{
            const state=states[index];
            return <div className={"af-map-instance state-"+state} key={name}>
              <strong>process_file<br/>[{index}]</strong>
              <i>{state==="success"?<Check size={12}/>:state==="running"?<Circle size={8}/>:<Circle size={6}/>}</i>
              <small>{name}</small>
              <em>{state==="waiting"?"Not expanded":state[0].toUpperCase()+state.slice(1)}</em>
            </div>;
          })}
        </div>
      </article>

      <article className={"af-map-summary state-"+summarizeState}>
        <header><span><Gauge size={22}/></span><div><strong>summarize</strong><small>Runs after all mapped tasks complete</small></div></header>
        <em>{summarizeState==="success"?"Success":"Not ready"}</em>
      </article>
    </section>

    <section className="af-map-timeline">
      <header><Workflow size={15}/><strong>Execution Timeline</strong><small>illustrative state sequence, not elapsed runtime</small></header>
      <div>
        {timeline.map((item,index)=><button key={item.title} className={"tone-"+item.tone+(item.done?" is-done":step===Math.min(7,index*2)?" is-current":"")}>
          <span>{index+1}</span>
          <div><strong>{item.title}</strong><small>{item.detail}</small></div>
          {item.done?<CheckCircle2 size={14}/>:<Circle size={8}/>}
          {index<timeline.length-1&&<i>→</i>}
        </button>)}
      </div>
    </section>

    <div className="af-map-bottom">
      <section className="af-map-code">
        <header><div><Code2 size={15}/><strong>Python (TaskFlow) · Dynamic Task Mapping</strong></div><button onClick={copyCode}>{copied?<Check size={13}/>:<Copy size={13}/>} {copied?"Copied":"Copy"}</button></header>
        <pre><code>{codeLines.map((line,index)=><span key={index} className={index===activeLine?"is-active":""}><i>{index+1}</i><b>{line}</b>{"\n"}</span>)}</code></pre>
      </section>

      <section className="af-map-concepts">
        <header><strong>Key Concepts</strong></header>
        <div>
          <article className="violet"><span><Layers3 size={20}/></span><p><strong>One task, many instances</strong><small>A mapped task creates one indexed task instance for each input element.</small></p></article>
          <article className="blue"><span><PackageOpen size={20}/></span><p><strong>Input must be iterable</strong><small><code>expand()</code> receives a runtime collection such as a small list from an upstream task.</small></p></article>
          <article className="green"><span><Gauge size={20}/></span><p><strong>Parallelism has limits</strong><small>Mapped siblings may run concurrently, but pools, limits and worker capacity still apply.</small></p></article>
          <article className="orange"><span><ListTree size={20}/></span><p><strong>Same code, different data</strong><small>Each mapped index executes the same task definition with its own input value.</small></p></article>
        </div>
      </section>
    </div>

    <p className="af-map-caveat">Airflow 3.1 · deterministic educational simulation. Mapping creates task instances from runtime input; it does not guarantee unlimited parallel execution or a specific sibling completion order.</p>
  </section>;
}
