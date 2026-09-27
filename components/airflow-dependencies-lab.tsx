"use client";

import {useEffect,useMemo,useState} from "react";
import {CheckCircle2,Circle,HelpCircle,Lightbulb,LockKeyhole,Network,Pause,Play,RotateCcw,SkipForward} from "lucide-react";
import {motion,useReducedMotion} from "framer-motion";
import {CodeSync} from "@/components/airflow-lab-primitives";
import {dagTrace,taskVisualState,visualStateLabels,type VisualTaskState} from "@/lib/airflow-lab-model";
import type {AirflowLesson} from "@/lib/airflow-lessons";

type Variant="Branch and join"|"Linear chain";

const taskTone:Record<string,string>={
  extract:"orange",
  validate:"pink",
  enrich:"violet",
  transform:"pink",
  load:"coral",
};

const compactState:Record<VisualTaskState,string>={
  none:"Waiting",eligible:"Eligible",scheduled:"Scheduled",queued:"Queued",running:"Running",
  success:"Success",failed:"Failed",up_for_retry:"Retrying",upstream_failed:"Blocked",
  skipped:"Skipped",up_for_reschedule:"Waiting",
};

function phaseFrames(variant:Variant,frameCount:number){
  const preferred=variant==="Branch and join"?[0,4,12,17]:[0,4,8,12];
  return preferred.map(index=>Math.min(index,frameCount-1)).filter((index,i,arr)=>i===0||arr[i-1]!==index);
}

function stateIcon(state:VisualTaskState){
  if(state==="success")return <CheckCircle2 size={18}/>;
  if(state==="none"||state==="upstream_failed")return <LockKeyhole size={17}/>;
  return <Circle size={17}/>;
}

export function AirflowDependenciesLab({lesson}:{lesson:AirflowLesson}){
  const reduce=useReducedMotion();
  const [variant,setVariant]=useState<Variant>("Branch and join");
  const trace=useMemo(()=>dagTrace(lesson,variant),[lesson,variant]);
  const phases=useMemo(()=>phaseFrames(variant,trace.frames.length),[variant,trace.frames.length]);
  const [phase,setPhase]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [prediction,setPrediction]=useState<string|null>(null);
  const frameIndex=phases[Math.min(phase,phases.length-1)];
  const frame=trace.frames[frameIndex];
  const complete=phase===phases.length-1;
  const branch=variant==="Branch and join";

  useEffect(()=>{
    setPhase(0);
    setPlaying(false);
    setPrediction(null);
  },[variant]);

  useEffect(()=>{
    if(!playing)return;
    if(complete){setPlaying(false);return;}
    const timer=window.setTimeout(()=>setPhase(value=>Math.min(value+1,phases.length-1)),reduce?0:1350);
    return ()=>window.clearTimeout(timer);
  },[playing,complete,phases.length,reduce]);

  const states=Object.fromEntries(trace.nodes.map(node=>[node.id,taskVisualState(trace,frameIndex,node.id)])) as Record<string,VisualTaskState>;
  const loadParents=trace.edges.filter(([,to])=>to==="load").map(([from])=>from);
  const loadComplete=loadParents.filter(id=>frame.states[id]==="success").length;
  const loadState=states.load;
  const loadReady=loadState!=="none"&&loadState!=="upstream_failed";
  const activeLine=branch?(loadComplete===loadParents.length&&loadParents.length?3:1):Math.min(3,phase+1);

  const predictionQuestion=branch?"extract just succeeded. What becomes eligible?":"extract just succeeded. What becomes eligible next?";
  const predictionOptions=branch?["validate","enrich","both","load"]:["transform","load","both","none"];
  const predictionCorrect=branch?"both":"transform";
  const predictionResolved=prediction!==null;
  const predictionIsCorrect=prediction===predictionCorrect;

  function run(){
    if(complete)setPhase(0);
    setPlaying(value=>!value||complete);
  }
  function reset(){setPlaying(false);setPhase(0);setPrediction(null);}

  const positions:Record<string,[number,number]>=branch
    ?{extract:[12,50],validate:[48,25],enrich:[48,74],load:[83,50]}
    :{extract:[12,50],transform:[48,50],load:[83,50]};

  return <section className="af-dep" aria-label="Interactive Airflow dependency lesson">
    <header className="af-dep-head">
      <div><span className="af-dep-head-icon"><Network size={21}/></span><div><h2>DAGs, Tasks & Dependencies</h2><p>Watch dependencies unlock downstream work. Siblings can become eligible independently; joins wait for every required parent.</p></div></div>
      <div className="af-dep-actions">
        <span>Visualize:</span>
        <button aria-pressed={variant==="Branch and join"} onClick={()=>setVariant("Branch and join")}>Branch + Join</button>
        <button aria-pressed={variant==="Linear chain"} onClick={()=>setVariant("Linear chain")}>Linear Chain</button>
        <i/>
        <button className="af-primary" onClick={run}>{playing?<Pause size={14}/>:<Play size={14}/>} {playing?"Pause":complete?"Replay":"Run"}</button>
        <button disabled={complete} onClick={()=>{setPlaying(false);setPhase(value=>Math.min(value+1,phases.length-1));}}><SkipForward size={14}/>Next step</button>
        <button onClick={reset}><RotateCcw size={14}/>Reset</button>
        <b>Step {phase+1} / {phases.length}</b>
      </div>
    </header>

    <section className="af-dep-predict">
      <div className="af-dep-question"><HelpCircle size={18}/><strong>{predictionQuestion}</strong></div>
      <div className="af-dep-options">
        {predictionOptions.map(option=><button key={option} aria-pressed={prediction===option} onClick={()=>setPrediction(option)}>{prediction===option&&<CheckCircle2 size={14}/>} {option}</button>)}
      </div>
      <div className={"af-dep-feedback"+(predictionResolved?(predictionIsCorrect?" is-correct":" is-wrong"):"")}>
        {predictionResolved?<><CheckCircle2 size={20}/><div><strong>{predictionIsCorrect?"Correct!":"Try the dependency graph."}</strong><p>{branch?"Both validate and enrich depend only on extract, so they can become eligible together.":"Only transform is directly downstream of extract in the linear chain."}</p></div></>:<><Lightbulb size={20}/><div><strong>Predict before you run</strong><p>Choose what becomes eligible, then watch the graph prove or correct your answer.</p></div></>}
      </div>
    </section>

    <div className="af-dep-workspace">
      <div className="af-dep-graph">
        <svg viewBox="0 0 1000 320" preserveAspectRatio="none" aria-hidden="true">
          <defs><marker id="af-dep-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="currentColor"/></marker></defs>
          {trace.edges.map(([from,to])=>{
            const [fx,fy]=positions[from]??[0,0];
            const [tx,ty]=positions[to]??[0,0];
            const fromSuccess=frame.states[from]==="success";
            const active=fromSuccess&&(states[to]==="eligible"||frame.focus===to||frame.states[to]==="running");
            const x1=fx*10+95,x2=tx*10-95,y1=fy*3.2,y2=ty*3.2;
            return <motion.path key={from+to} d={"M"+x1+","+y1+" C"+((x1+x2)/2)+","+y1+" "+((x1+x2)/2)+","+y2+" "+x2+","+y2} className={"af-dep-edge"+(active?" is-active":fromSuccess?" is-complete":"")} markerEnd="url(#af-dep-arrow)" initial={false} animate={{pathLength:1}} transition={{duration:reduce?0:.3}}/>;
          })}
        </svg>

        {trace.nodes.map(node=>{
          const state=states[node.id];
          const [left,top]=positions[node.id]??[50,50];
          const tone=taskTone[node.id]??"violet";
          const isLoad=node.id==="load";
          return <motion.button
            key={node.id}
            className={"af-dep-node tone-"+tone+" state-"+state+(frame.focus===node.id?" is-focus":"")}
            style={{left:left+"%",top:top+"%"}}
            initial={false}
            animate={{scale:frame.focus===node.id&&!reduce?1.025:1}}
          >
            <span className="af-dep-node-icon">{stateIcon(state)}</span>
            <div><strong>{node.id}</strong><small>{visualStateLabels[state]}</small></div>
            {isLoad&&loadParents.length>0&&<div className="af-dep-meter"><span>{"Upstream "+loadComplete+" / "+loadParents.length}</span><i><b style={{width:(loadComplete/loadParents.length*100)+"%"}}/></i></div>}
          </motion.button>;
        })}

        <div className="af-dep-phase">
          <span>{frame.actor}</span><strong>{frame.title}</strong><p>{frame.explanation}</p>
        </div>
      </div>

      <aside className={"af-dep-why"+(loadReady?" is-ready":"")}>
        <header><Lightbulb size={19}/><strong>{loadReady?"Why can load run?":"Why is load blocked?"}</strong></header>
        {loadParents.length?<div className="af-dep-checks">
          {loadParents.map((id,index)=>{
            const ok=frame.states[id]==="success";
            return <span key={id} className={ok?"is-ok":frame.states[id]==="running"?"is-running":""}><i>{ok?"✓":index+1}</i><p><b>{id}</b> {ok?"has succeeded":frame.states[id]==="running"?"is still running":"has not succeeded yet"}</p></span>;
          })}
          <span className="is-rule"><i>{loadParents.length+1}</i><p>Trigger rule is <b>all_success</b> — every direct upstream task must succeed.</p></span>
        </div>:<p className="af-dep-no-parents">This topology has no multi-parent join at load.</p>}
        <div className={"af-dep-upstream"+(loadReady?" is-ready":"")}><LockKeyhole size={16}/><div><strong>{loadParents.length?"Upstream "+loadComplete+" / "+loadParents.length+" complete":"Single upstream path"}</strong><p>{loadReady?"Dependency requirements are satisfied; load can be considered for scheduling.":loadParents.length?"load remains blocked until every required parent succeeds.":"Follow the chain one task at a time."}</p></div></div>
      </aside>
    </div>

    <div className="af-dep-bottom">
      <section className="af-dep-timeline">
        <header><strong>Task Execution Timeline</strong><span><i className="success"/>Success <i className="running"/>Running <i className="waiting"/>Waiting</span></header>
        <p>Sequence is illustrative, not elapsed runtime.</p>
        <div>
          {trace.nodes.map(node=>{
            const state=states[node.id];
            const start=Math.max(0,trace.frames.findIndex(f=>f.states[node.id]!=="none"));
            const done=trace.frames.findIndex(f=>f.states[node.id]==="success");
            const width=done>=0?Math.max(14,((Math.min(done,frameIndex)-start+1)/Math.max(1,trace.frames.length))*160):state==="running"?38:state==="none"?0:24;
            return <div className={"af-dep-timeline-row tone-"+(taskTone[node.id]??"violet")} key={node.id}><strong>{node.id}</strong><span><i style={{width:width+"%"}} className={"state-"+state}/></span><small>{compactState[state]}</small></div>;
          })}
        </div>
      </section>
      <CodeSync lines={["# fan-out: siblings depend on extract","extract >> [validate, enrich]","# join: load waits for both","[validate, enrich] >> load"]} active={activeLine} label="DAG Dependency Code"/>
    </div>

    <aside className="af-dep-takeaway"><Lightbulb size={18}/><div><strong>Key takeaway</strong><p>Dependencies unlock downstream work. Siblings can become eligible independently, while join tasks wait for every parent required by their trigger rule.</p></div></aside>
    <p className="af-dep-caveat">Airflow 3.1 · deterministic educational simulation. No real scheduler or worker is running; timing and concurrency are intentionally simplified.</p>
  </section>;
}
