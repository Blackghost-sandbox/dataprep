"use client";

import {useEffect,useMemo,useState} from "react";
import {Activity,CheckCircle2,Circle,Clock3,Cpu,ListChecks,Pause,Play,RotateCcw,SkipForward} from "lucide-react";
import {CodeSync} from "@/components/airflow-lab-primitives";
import {DagGraph} from "@/components/airflow-dag-lab";
import {stateLabels,taskReason,taskVisualState,visualStateLabels,type VisualTaskState} from "@/lib/airflow-lab-model";
import {taskStateMeaning,type TaskState} from "@/lib/airflow-execution";
import {introScenario,introScenarioChoices,type IntroScenarioKey} from "@/lib/airflow-intro-simulation";
import type {AirflowLesson} from "@/lib/airflow-lessons";

type InspectorTab="overview"|"dependencies"|"logs"|"code";
type EventFilter="all"|"scheduler"|"tasks";

const compactState:Record<VisualTaskState,string>={
  none:"Waiting",
  eligible:"Eligible",
  scheduled:"Scheduled",
  queued:"Queued",
  running:"Running",
  success:"Success",
  failed:"Failed",
  up_for_retry:"Retrying",
  upstream_failed:"Blocked",
  skipped:"Skipped",
  up_for_reschedule:"Waiting",
};

function selectedCode(lines:string[],task:string){
  const hit=lines.findIndex(line=>line.includes(task));
  if(hit<0)return lines.slice(0,5);
  return lines.slice(Math.max(0,hit-2),Math.min(lines.length,hit+3));
}

function visualMeaning(state:VisualTaskState){
  if(state==="eligible")return "All dependency requirements shown in this teaching trace are satisfied. The scheduler can consider the task, but eligible does not mean running.";
  return taskStateMeaning[state];
}

function timelineRuns(trace:ReturnType<typeof introScenario>,nodeId:string,through:number){
  const states=trace.frames.map((_,index)=>taskVisualState(trace,index,nodeId));
  const runs:{state:VisualTaskState;start:number;end:number}[]=[];
  states.forEach((state,index)=>{
    const last=runs[runs.length-1];
    if(last&&last.state===state)last.end=index;
    else runs.push({state,start:index,end:index});
  });
  return runs.filter(run=>run.start<=through).map(run=>({...run,end:Math.min(run.end,through)}));
}

export function AirflowIntroControlRoom({lesson}:{lesson:AirflowLesson}){
  const [scenario,setScenario]=useState<IntroScenarioKey>("normal");
  const trace=useMemo(()=>introScenario(scenario),[scenario]);
  const [step,setStep]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [selectedTask,setSelectedTask]=useState<string|null>(null);
  const [inspectorTab,setInspectorTab]=useState<InspectorTab>("overview");
  const [eventFilter,setEventFilter]=useState<EventFilter>("all");

  const safeStep=Math.min(step,trace.frames.length-1);
  const frame=trace.frames[safeStep];
  const selected=selectedTask&&trace.nodes.some(node=>node.id===selectedTask)?selectedTask:frame.focus;
  const selectedNode=trace.nodes.find(node=>node.id===selected)!;
  const selectedState=frame.states[selected];
  const selectedVisualState=taskVisualState(trace,safeStep,selected);
  const parents=trace.edges.filter(([,to])=>to===selected).map(([from])=>from);
  const children=trace.edges.filter(([from])=>from===selected).map(([,to])=>to);
  const parentStates=parents.map(id=>({id,state:frame.states[id]}));

  useEffect(()=>{
    setStep(0);
    setPlaying(false);
    setSelectedTask(null);
    setInspectorTab("overview");
  },[scenario]);

  useEffect(()=>{
    if(!playing)return;
    if(safeStep>=trace.frames.length-1){setPlaying(false);return;}
    const timer=window.setTimeout(()=>setStep(value=>Math.min(value+1,trace.frames.length-1)),1250);
    return ()=>window.clearTimeout(timer);
  },[playing,safeStep,trace.frames.length]);

  const scenarioLabel=introScenarioChoices.find(item=>item.id===scenario)?.label??"Normal run (success)";
  const complete=safeStep===trace.frames.length-1;
  const successCount=trace.nodes.filter(node=>frame.states[node.id]==="success").length;
  const failureCount=trace.nodes.filter(node=>["failed","upstream_failed"].includes(frame.states[node.id])).length;
  const waitingCount=trace.nodes.length-successCount-failureCount;
  const terminalWaiting=complete&&trace.nodes.some(node=>["queued","up_for_reschedule","up_for_retry"].includes(frame.states[node.id]));
  const runStatus=!complete?"Run in progress":failureCount>0?"Run blocked":terminalWaiting?"Paused to inspect waiting":"DAG run completed";
  const codeLines=(scenario==="normal"||scenario==="worker-busy"?lesson.example.code:trace.code).split("\n");
  const activeCode=Math.max(0,codeLines.findIndex(line=>line.includes(frame.focus.replace(/process_\d+/,"process"))));
  const reason=scenario==="worker-busy"&&selectedState==="queued"
    ?"Dependencies are satisfied, but no execution slot is available. The task remains queued; its Python body has not started."
    :taskReason(trace,safeStep,selected);
  const schedulerText=frame.actor.includes("Scheduler")||frame.actor.includes("Run scheduling")
    ?frame.title
    :selectedState==="queued"
      ?"Waiting for execution capacity"
      :"Tracking task state";
  const focusedVisualState=taskVisualState(trace,safeStep,frame.focus);

  const filteredEvents=trace.frames.slice(0,safeStep+1).filter(event=>{
    if(eventFilter==="all")return true;
    const scheduler=event.actor.includes("Scheduler")||event.actor.includes("Run scheduling");
    return eventFilter==="scheduler"?scheduler:!scheduler;
  });

  function reset(){
    setPlaying(false);
    setStep(0);
    setSelectedTask(null);
    setInspectorTab("overview");
    setEventFilter("all");
  }

  function run(){
    if(complete)setStep(0);
    setPlaying(value=>!value||complete);
  }

  const logs=[
    `[state] task=${selected} state=${selectedVisualState}`,
    `[actor] ${frame.actor}`,
    selectedState==="failed"?"[error] Educational failure injected for this scenario.":selectedState==="queued"?"[info] Task body has not started; waiting for capacity.":"[info] Deterministic teaching trace; no live Airflow service is connected.",
  ];

  return <section className="af-cr" aria-label="Airflow DAG run simulation">
    <header className="af-cr-toolbar">
      <div className="af-cr-heading">
        <span className="af-cr-heading-icon"><Activity size={21}/></span>
        <div><h2>DAG Run Simulation</h2><p>Watch how a run is created, how the scheduler decides, and how task states unlock downstream work.</p></div>
      </div>
      <div className="af-cr-actions">
        <label className="af-cr-select">Scenario
          <select value={scenario} onChange={event=>setScenario(event.target.value as IntroScenarioKey)}>
            {introScenarioChoices.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <button className="af-primary" onClick={run}>{playing?<Pause size={14}/>:<Play size={14}/>} {playing?"Pause":complete?"Replay":"Run"}</button>
        <button disabled={complete} onClick={()=>{setPlaying(false);setStep(value=>Math.min(value+1,trace.frames.length-1));}}><SkipForward size={14}/>Step</button>
        <button onClick={reset}><RotateCcw size={14}/>Reset</button>
      </div>
    </header>

    <div className="af-cr-main">
      <div className="af-cr-left">
        <div className="af-cr-stage">
          <div className="af-cr-scheduler">
            <span><Cpu size={17}/></span>
            <div><strong>Scheduler</strong><small>{schedulerText}</small></div>
            <div className="af-cr-scheduler-state"><i className={playing?"is-live":""}/>{playing?"Evaluating…":complete?"Run settled":"Ready"}</div>
          </div>
          <div className="af-cr-dispatch" aria-live="polite">
            <span>Scheduler decision</span>
            <i className={playing?"is-live":""}/>
            <strong>{frame.focus}</strong>
            <em className={`af-state-${focusedVisualState}`}>{visualStateLabels[focusedVisualState]}</em>
          </div>
          <DagGraph trace={trace} step={safeStep} selected={selected} onSelect={id=>{setSelectedTask(id);setInspectorTab("overview");}} showEligibility/>
          <div className="af-cr-now">
            <span>Current decision</span>
            <strong>{frame.title}</strong>
            <p>{frame.explanation}</p>
          </div>
          <div className={`af-cr-run-summary${failureCount?" is-failed":terminalWaiting?" is-waiting":complete?" is-complete":""}`}>
            <strong>{runStatus}</strong>
            <span>{successCount}/{trace.nodes.length} success</span>
            {failureCount>0&&<span>{failureCount} blocked/failed</span>}
            {!complete&&waitingCount>0&&<span>{waitingCount} not settled</span>}
          </div>
        </div>

        <section className="af-cr-timeline">
          <header>
            <div><ListChecks size={17}/><span><strong>Execution Timeline</strong><small>Click an earlier bar to inspect that decision. Sequence only — not elapsed runtime.</small></span></div>
            <div className="af-cr-legend">
              <span><i className="af-cr-leg-wait"/>Waiting</span>
              <span><i className="af-cr-leg-eligible"/>Eligible</span>
              <span><i className="af-cr-leg-run"/>Running</span>
              <span><i className="af-cr-leg-success"/>Success</span>
              <span><i className="af-cr-leg-fail"/>Failed</span>
            </div>
          </header>
          <div className="af-cr-timeline-body">
            {trace.nodes.map(node=>{
              const current=taskVisualState(trace,safeStep,node.id);
              return <div className="af-cr-timeline-row" key={node.id}>
                <strong>{node.id.replace("process_","process[")}{node.id.startsWith("process_")?"]":""}</strong>
                <div className="af-cr-timeline-track" style={{gridTemplateColumns:`repeat(${trace.frames.length},minmax(8px,1fr))`}}>
                  {timelineRuns(trace,node.id,safeStep).map((run,index)=><button
                    type="button"
                    key={index}
                    className={`af-cr-bar af-state-${run.state}`}
                    style={{gridColumn:`${run.start+1} / ${run.end+2}`}}
                    title={`Steps ${run.start+1}–${run.end+1}: ${visualStateLabels[run.state]}`}
                    onClick={()=>{setPlaying(false);setStep(run.end);setSelectedTask(node.id);}}
                  ><span>{visualStateLabels[run.state]}</span></button>)}
                  <i className="af-cr-playhead" style={{left:`${((safeStep+.5)/trace.frames.length)*100}%`}}/>
                </div>
                <small className={`af-state-${current}`}>{compactState[current]}</small>
              </div>;
            })}
          </div>
        </section>
      </div>

      <aside className="af-cr-inspector">
        <header>
          <div><span className={`af-cr-state-icon af-state-${selectedState}`}>{selectedState==="success"?<CheckCircle2 size={18}/>:selectedState==="none"?<Clock3 size={18}/>:<Circle size={18}/>}</span><div><strong>{selected}</strong><small>Task instance</small></div></div>
          <span className={`af-cr-state-pill af-state-${selectedState}`}>{stateLabels[selectedState]}</span>
        </header>
        <nav aria-label="Task inspector views">
          {(["overview","dependencies","logs","code"] as InspectorTab[]).map(tab=><button key={tab} aria-pressed={inspectorTab===tab} onClick={()=>setInspectorTab(tab)}>{tab[0].toUpperCase()+tab.slice(1)}</button>)}
        </nav>
        <div className="af-cr-inspector-body">
          {inspectorTab==="overview"&&<>
            <div className="af-cr-facts"><span><small>State</small><strong>{stateLabels[selectedState]}</strong></span><span><small>Attempt</small><strong>{frame.attempt??1}</strong></span><span><small>Scenario</small><strong>{scenarioLabel}</strong></span></div>
            <div className="af-cr-why"><strong>Why this state?</strong><p>{reason}</p></div>
            <p className="af-cr-state-help">{taskStateMeaning[selectedState]}</p>
          </>}
          {inspectorTab==="dependencies"&&<div className="af-cr-deps">
            <div><strong>Upstream</strong>{parents.length?parents.map(id=><span key={id}><i className={`af-state-${frame.states[id]}`}/>{id} · {stateLabels[frame.states[id]]}</span>):<span>Root task · no upstream task dependency</span>}</div>
            <div><strong>Downstream</strong>{children.length?children.map(id=><span key={id}><i className={`af-state-${frame.states[id]}`}/>{id} · {stateLabels[frame.states[id]]}</span>):<span>No downstream task</span>}</div>
          </div>}
          {inspectorTab==="logs"&&<div className="af-cr-mini-log">{logs.map((line,index)=><code key={index}>{line}</code>)}</div>}
          {inspectorTab==="code"&&<pre className="af-cr-mini-code"><code>{selectedCode(codeLines,selected).join("\n")}</code></pre>}
        </div>
        <section className="af-cr-scenario-explorer">
          <strong>Scenario Explorer</strong><p>Change one condition and watch the same orchestration model react.</p>
          <div>{introScenarioChoices.map(item=><button key={item.id} aria-pressed={scenario===item.id} onClick={()=>setScenario(item.id)}>{item.short}</button>)}</div>
        </section>
      </aside>
    </div>

    <div className="af-cr-bottom">
      <CodeSync lines={codeLines} active={activeCode} label="DAG Code · Airflow 3.1 teaching example"/>
      <section className="af-cr-events">
        <header><strong>Execution Events</strong><div>{(["all","scheduler","tasks"] as EventFilter[]).map(filter=><button key={filter} aria-pressed={eventFilter===filter} onClick={()=>setEventFilter(filter)}>{filter[0].toUpperCase()+filter.slice(1)}</button>)}</div></header>
        <div className="af-cr-event-list">{filteredEvents.map((event,index)=><div className={event===frame?"is-current":""} key={index}><span>Step {String(trace.frames.indexOf(event)+1).padStart(2,"0")}</span><i/><div><strong>{event.title}</strong><small>{event.actor}</small></div></div>)}</div>
      </section>
      <aside className="af-cr-takeaways">
        <strong>Key Takeaways</strong>
        <ul>
          <li>A DAG defines tasks and dependencies; a DAG run creates task instances.</li>
          <li>The scheduler evaluates eligibility; queued does not mean running.</li>
          <li>Downstream work unlocks only when its dependency and trigger-rule requirements are satisfied.</li>
          <li>Task state is orchestration evidence, not proof that business data is correct.</li>
        </ul>
      </aside>
    </div>

    <p className="af-cr-caveat">Airflow 3.1 · deterministic educational simulation. No scheduler, executor, worker, credentials, or external service is running in DataPrep; event order and capacity are simplified to teach the mental model.</p>
  </section>;
}
