"use client";

import {useEffect,useMemo,useState} from "react";
import {
  BookOpen,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Code2,
  Copy,
  Database,
  Eye,
  FileText,
  GitBranch,
  HelpCircle,
  Lightbulb,
  Network,
  Pause,
  Play,
  RotateCcw,
  Share2,
  SkipForward,
} from "lucide-react";
import {motion,useReducedMotion} from "framer-motion";
import type {AirflowLesson} from "@/lib/airflow-lessons";

type BranchChoice="load"|"no_data";
type TriggerRule="all_success"|"none_failed"|"none_failed_min_one_success"|"all_done"|"one_success";
type TaskId="choose"|"load"|"no_data"|"join";
type TaskState="not_ready"|"running"|"success"|"skipped";

const triggerRules:{id:TriggerRule;label:string;detail:string}[]=[
  {id:"all_success",label:"all_success",detail:"Run only if every direct upstream task succeeds."},
  {id:"none_failed",label:"none_failed",detail:"Run when no upstream task failed or is upstream_failed; skipped is allowed."},
  {id:"none_failed_min_one_success",label:"none_failed_min_one_success",detail:"Run when none failed and at least one upstream task succeeded."},
  {id:"all_done",label:"all_done",detail:"Run after all direct upstream tasks finish, regardless of success, failure or skip."},
  {id:"one_success",label:"one_success",detail:"Run once at least one upstream task succeeds."},
];

const taskMeta:Record<TaskId,{label:string;operator:string;tone:string;icon:"branch"|"db"|"file"|"join"}>={
  choose:{label:"choose",operator:"BranchPythonOperator",tone:"green",icon:"branch"},
  load:{label:"load",operator:"PythonOperator",tone:"blue",icon:"db"},
  no_data:{label:"no_data",operator:"PythonOperator",tone:"pink",icon:"file"},
  join:{label:"join",operator:"EmptyOperator",tone:"orange",icon:"join"},
};

function allowsJoin(rule:TriggerRule){
  return rule!=="all_success";
}

function stateLabel(state:TaskState){
  if(state==="not_ready")return "NOT READY";
  return state.toUpperCase();
}

function stateIcon(state:TaskState){
  if(state==="success")return <CheckCircle2 size={17}/>;
  if(state==="running")return <Play size={16}/>;
  if(state==="skipped")return <Circle size={14}/>;
  return <Clock3 size={16}/>;
}

function taskIcon(id:TaskId){
  const icon=taskMeta[id].icon;
  if(icon==="branch")return <Play size={18}/>;
  if(icon==="db")return <Database size={18}/>;
  if(icon==="file")return <FileText size={18}/>;
  return <GitBranch size={18}/>;
}

function statesAt(step:number,choice:BranchChoice,rule:TriggerRule):Record<TaskId,TaskState>{
  const selected=choice;
  const other=choice==="load"?"no_data":"load";
  const states:Record<TaskId,TaskState>={choose:"running",load:"not_ready",no_data:"not_ready",join:"not_ready"};
  if(step>=1){
    states.choose="success";
    states[selected]="running";
    states[other]="skipped";
  }
  if(step>=2){
    states[selected]="success";
    states[other]="skipped";
    states.join=allowsJoin(rule)?"running":"not_ready";
  }
  if(step>=3){
    states.join=allowsJoin(rule)?"success":"skipped";
  }
  return states;
}

export function AirflowTriggerRulesLab({lesson}:{lesson:AirflowLesson}){
  const reduce=useReducedMotion();
  const [choice,setChoice]=useState<BranchChoice>("load");
  const [rule,setRule]=useState<TriggerRule>("all_success");
  const [step,setStep]=useState(1);
  const [playing,setPlaying]=useState(false);
  const [selected,setSelected]=useState<TaskId>("load");
  const [copied,setCopied]=useState(false);

  const states=useMemo(()=>statesAt(step,choice,rule),[step,choice,rule]);
  const complete=step===3;
  const joinAllowed=allowsJoin(rule);
  const selectedMeta=taskMeta[selected];
  const selectedState=states[selected];
  const other=choice==="load"?"no_data":"load";
  const ruleInfo=triggerRules.find(item=>item.id===rule)!;

  useEffect(()=>{
    setStep(1);
    setPlaying(false);
    setSelected(choice);
  },[choice]);

  useEffect(()=>{
    setPlaying(false);
  },[rule]);

  useEffect(()=>{
    if(!playing)return;
    if(complete){setPlaying(false);return;}
    const timer=window.setTimeout(()=>setStep(value=>Math.min(3,value+1)),reduce?0:1100);
    return ()=>window.clearTimeout(timer);
  },[playing,complete,reduce]);

  function run(){
    if(complete)setStep(0);
    setPlaying(value=>!value||complete);
  }

  function reset(){
    setPlaying(false);
    setStep(0);
    setSelected("choose");
  }

  const codeLines=[
    "from airflow.sdk import dag, task",
    "from airflow.providers.standard.operators.empty import EmptyOperator",
    "import pendulum",
    "",
    '@dag(start_date=pendulum.datetime(2026, 1, 1, tz="UTC"), schedule=None, catchup=False)',
    "def branching_example():",
    "    @task.branch",
    "    def choose():",
    '        return "'+choice+'"  # simulator-selected branch',
    "",
    "    @task",
    "    def load():",
    '        print("Loading data...")',
    "",
    "    @task",
    "    def no_data():",
    '        print("No data to load")',
    "",
    "    branch = choose()",
    "    load_task = load()",
    "    no_data_task = no_data()",
    '    join = EmptyOperator(task_id="join", trigger_rule="'+rule+'")',
    "    branch >> [load_task, no_data_task]",
    "    [load_task, no_data_task] >> join",
    "",
    "branching_example()",
  ];

  async function copyCode(){
    try{
      await navigator.clipboard.writeText(codeLines.join("\n"));
      setCopied(true);
      window.setTimeout(()=>setCopied(false),1200);
    }catch{setCopied(false);}
  }

  const timeline:TaskId[]=["choose","load","no_data","join"];

  return <section className="af-branch" aria-label={lesson.title+" visual branching lesson"}>
    <header className="af-branch-intro">
      <div className="af-branch-title">
        <span><BookOpen size={21}/></span>
        <div><h2>Branching & Trigger Rules</h2><p>Choose a branch, watch the other path skip, then change the join rule to see whether downstream work can continue.</p></div>
      </div>
      <aside><Lightbulb size={20}/><div><strong>Key takeaway</strong><p>Choose a join rule for the intended success, skip and failure semantics.</p></div></aside>
    </header>

    <section className="af-branch-controls">
      <label className="decision"><span><Share2 size={16}/>Branch decision</span><select value={choice} onChange={e=>setChoice(e.target.value as BranchChoice)}><option value="load">Load path (with data)</option><option value="no_data">No data path</option></select><small>choose → {choice}; skip {other}</small></label>
      <label className="rule"><span><GitBranch size={16}/>Join trigger rule</span><select value={rule} onChange={e=>setRule(e.target.value as TriggerRule)}>{triggerRules.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select><small>Change the join rule to see different behavior.</small></label>
      <div className="af-branch-actions">
        <button className="af-primary" onClick={run}>{playing?<Pause size={14}/>:<Play size={14}/>} {playing?"Pause":complete?"Replay":"Run"}</button>
        <button disabled={complete} onClick={()=>{setPlaying(false);setStep(value=>Math.min(3,value+1));}}><SkipForward size={14}/>Next step</button>
        <button onClick={reset}><RotateCcw size={14}/>Reset</button>
        <b>{step+1} / 4 steps</b>
      </div>
    </section>

    <div className="af-branch-main">
      <div className="af-branch-left">
        <section className="af-branch-visual">
          <header><div><Eye size={18}/><strong>DAG Visualization & Execution</strong></div><div className="af-branch-legend"><span><i className="running"/>Running</span><span><i className="success"/>Success</span><span><i className="skipped"/>Skipped</span><span><i className="waiting"/>Not ready</span></div></header>

          <div className="af-branch-canvas">
            <svg viewBox="0 0 1000 280" preserveAspectRatio="none" aria-hidden="true">
              <defs><marker id="af-branch-arrow-blue" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#2563eb"/></marker><marker id="af-branch-arrow-pink" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#ff3d97"/></marker><marker id="af-branch-arrow-gray" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#9eb0c8"/></marker><marker id="af-branch-arrow-orange" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#ee8b13"/></marker></defs>
              <path className={"af-branch-edge selected "+(choice==="load"?"to-load":"to-no-data")} d={choice==="load"?"M225,140 C315,140 315,72 405,72":"M225,140 C315,140 315,208 405,208"} markerEnd="url(#af-branch-arrow-blue)"/>
              <path className={"af-branch-edge skipped "+(choice==="load"?"to-no-data":"to-load")} d={choice==="load"?"M225,140 C315,140 315,208 405,208":"M225,140 C315,140 315,72 405,72"} markerEnd="url(#af-branch-arrow-pink)"/>
              <path className={"af-branch-edge join-edge "+(states.load==="success"?"is-done":"")} d="M595,72 C695,72 690,140 785,140" markerEnd={states.load==="success"?"url(#af-branch-arrow-orange)":"url(#af-branch-arrow-gray)"}/>
              <path className={"af-branch-edge join-edge "+(states.no_data==="success"?"is-done":"")} d="M595,208 C695,208 690,140 785,140" markerEnd={states.no_data==="success"?"url(#af-branch-arrow-orange)":"url(#af-branch-arrow-gray)"}/>
            </svg>

            <span className="af-branch-path-label">{choice==="load"?"Selected path":"Selected no-data path"}</span>

            {(["choose","load","no_data","join"] as TaskId[]).map(id=>{
              const meta=taskMeta[id],state=states[id];
              return <motion.button key={id} type="button" className={"af-branch-node node-"+id+" tone-"+meta.tone+" state-"+state+(selected===id?" is-selected":"")} onClick={()=>setSelected(id)} initial={false} animate={{scale:state==="running"&&!reduce?1.02:1}}>
                <span className="af-branch-node-icon">{taskIcon(id)}</span>
                <div><strong>{meta.label}</strong><small>{meta.operator}</small><em>{stateLabel(state)}</em></div>
                {state==="success"&&<b className="af-branch-node-corner"><Check size={13}/></b>}
                {state==="skipped"&&<b className="af-branch-node-corner skipped">×</b>}
                {state==="running"&&<b className="af-branch-node-corner running"><Circle size={9}/></b>}
              </motion.button>;
            })}
          </div>

          <div className="af-branch-timeline">
            <header><Play size={14}/><strong>Execution Timeline</strong><small>illustrative sequence, not elapsed runtime</small></header>
            <div>
              {timeline.map((id,index)=>{
                const meta=taskMeta[id],state=states[id];
                return <div className={"af-branch-time-card tone-"+meta.tone+" state-"+state} key={id}>
                  <span>{index+1}</span><div><strong>{meta.label}</strong><small>{meta.operator}</small></div><em>{stateLabel(state)}</em>
                  {index<timeline.length-1&&<i>→</i>}
                </div>;
              })}
            </div>
          </div>
        </section>

        <div className="af-branch-bottom">
          <section className="af-branch-code">
            <header><div><Code2 size={15}/><strong>Python · branching & trigger rule (TaskFlow)</strong></div><button onClick={copyCode}>{copied?<Check size={13}/>:<Copy size={13}/>} {copied?"Copied":"Copy"}</button></header>
            <pre><code>{codeLines.map((line,index)=><span key={index} className={line.includes('return "'+choice+'"')||line.includes('trigger_rule="'+rule+'"')?"is-active":""}><i>{index+1}</i><b>{line}</b>{"\n"}</span>)}</code></pre>
          </section>

          <section className="af-branch-rules">
            <header><GitBranch size={16}/><div><strong>Join Trigger Rule Behavior</strong><small>Choose how the join task should evaluate upstream states.</small></div><HelpCircle size={15}/></header>
            <div>{triggerRules.map(item=><button key={item.id} aria-pressed={rule===item.id} onClick={()=>setRule(item.id)}><i>{rule===item.id?<Circle size={7}/>:null}</i><p><strong>{item.label}</strong><small>{item.detail}</small></p></button>)}</div>
          </section>
        </div>
      </div>

      <aside className="af-branch-inspector">
        <header><strong>Task Inspector</strong></header>
        <div className="af-branch-inspected-task"><span className={"tone-"+selectedMeta.tone}>{taskIcon(selected)}</span><div><strong>{selectedMeta.label}</strong><small>{selectedMeta.operator}</small></div></div>

        <dl>
          <div><dt>Current state</dt><dd className={"state-"+selectedState}>{stateLabel(selectedState)}</dd></div>
          <div><dt>Selected branch</dt><dd>{choice}</dd></div>
          <div><dt>Join trigger rule</dt><dd className="rule">{rule}</dd></div>
        </dl>

        <section className="af-branch-upstreams">
          <strong>Upstream states</strong>
          <span><b>choose</b><em className={"state-"+states.choose}>{stateLabel(states.choose)}</em></span>
          <span><b>load</b><em className={"state-"+states.load}>{stateLabel(states.load)}</em></span>
          <span><b>no_data</b><em className={"state-"+states.no_data}>{stateLabel(states.no_data)}</em></span>
        </section>

        <section className={"af-branch-verdict "+(step>=2&&joinAllowed?"is-yes":"is-no")}>
          <header><Network size={15}/><strong>Will join run?</strong><b>{step<2?"Waiting":joinAllowed?"Yes":"No"}</b></header>
          <p>{step<2?"The selected branch has not reached a terminal success state yet.":joinAllowed?ruleInfo.detail:"With all_success, the intentionally skipped branch prevents the join from running."}</p>
        </section>

        <section className="af-branch-insight"><Lightbulb size={15}/><div><strong>Branching mental model</strong><p>A skipped alternative is intentional control flow, not a failure. Your join rule decides whether that skip should block downstream work.</p></div></section>
      </aside>
    </div>

    <p className="af-branch-caveat">Airflow 3.1 · deterministic educational simulation. No real scheduler or worker is running. Branch choice, task states and execution order are simplified to teach trigger-rule semantics.</p>
  </section>;
}
