"use client";

import {useEffect,useMemo,useState} from "react";
import {
  BarChart3, CheckCircle2, ChevronLeft, ChevronRight, Cloud, Database, FileCheck2,
  GraduationCap, Layers3, Play, RefreshCcw, ServerCog, Sparkles, TimerReset,
  Workflow, Zap
} from "lucide-react";
import {
  completedOrchestrationState, dagDefinition, orchestrators, referenceOrchestrationState,
  runningOrchestrationState, taskById,
  type OrchestratorId, type PipelineTaskId, type PipelineTaskStatus
} from "@/lib/cloud-orchestration-simulation";

function OrchestrationHeroArtwork(){
  return <div className="oi-hero-art" aria-label="Managed orchestration services">
    <div className="oi-provider airflow"><span>✦</span><strong>Apache<br/>Airflow</strong></div>
    <div className="oi-provider aws"><span>⌘</span><strong>AWS<br/>Step Functions</strong></div>
    <div className="oi-provider azure"><span>▥</span><strong>Azure<br/>Data Factory</strong></div>
    <div className="oi-provider gcp"><span>▤</span><strong>Google<br/>Cloud Composer</strong></div>
  </div>;
}

export function CloudOrchestrationHero({description,minutes,currentLesson,total,onPrevious,onNext}:{
  description:string;minutes:number;currentLesson:number;total:number;onPrevious:()=>void;onNext:()=>void;
}){
  return <section className="oi-hero">
    <div className="oi-breadcrumb"><span>Cloud Platforms</span><ChevronRight size={14}/><strong>Orchestration &amp; Managed Data Integration</strong></div>
    <div className="oi-hero-grid">
      <div>
        <div className="oi-title-row">
          <span className="oi-title-icon"><Zap size={31}/></span>
          <div><h1>Orchestration &amp; Managed Data Integration</h1><p>{description}</p></div>
        </div>
        <div className="oi-meta">
          <span><TimerReset size={14}/>{minutes} min</span>
          <span><GraduationCap size={14}/>Lesson {currentLesson+1}/{total}</span>
          <span className="is-intermediate"><Sparkles size={13}/>Intermediate</span>
        </div>
      </div>
      <div className="oi-hero-right">
        <div className="oi-hero-nav"><button onClick={onPrevious} disabled={currentLesson===0}><ChevronLeft size={16}/>Previous</button><button className="is-next" onClick={onNext} disabled={currentLesson===total-1}>Next<ChevronRight size={16}/></button></div>
        <OrchestrationHeroArtwork/>
      </div>
    </div>
  </section>;
}

function statusLabel(status:PipelineTaskStatus){
  return status==="success"?"Success":status==="running"?"Running":status==="failed"?"Failed":"Waiting";
}

function TaskIcon({id}:{id:PipelineTaskId}){
  if(id==="extract")return <Database size={26}/>;
  if(id==="transform")return <Sparkles size={26}/>;
  if(id==="load")return <Cloud size={26}/>;
  if(id==="quality")return <FileCheck2 size={26}/>;
  return <BarChart3 size={26}/>;
}

export function CloudOrchestrationLab(){
  const [orchestrator,setOrchestrator]=useState<OrchestratorId>("airflow");
  const [state,setState]=useState(()=>referenceOrchestrationState());
  const [autoRun,setAutoRun]=useState(true);
  const [running,setRunning]=useState(false);
  const [metadataTab,setMetadataTab]=useState<"task"|"run">("task");

  const selectedTask=useMemo(()=>taskById(state.tasks,state.selectedTask),[state.tasks,state.selectedTask]);
  const orchestratorMeta=orchestrators[orchestrator];

  useEffect(()=>{
    if(!autoRun)return;
    const timer=window.setInterval(()=>{
      setState(prev=>completedOrchestrationState(prev.runId+1,orchestrator));
    },5000);
    return ()=>window.clearInterval(timer);
  },[autoRun,orchestrator]);

  const runSimulation=()=>{
    if(running)return;
    const nextRun=state.runId+1;
    setRunning(true);
    setState(runningOrchestrationState(nextRun,state.selectedTask));
    window.setTimeout(()=>{
      setState(completedOrchestrationState(nextRun,orchestrator));
      setRunning(false);
    },520);
  };

  const reset=()=>{
    setOrchestrator("airflow");
    setState(referenceOrchestrationState());
    setAutoRun(true);
    setRunning(false);
    setMetadataTab("task");
  };

  return <section className="oi-lab">
    <header className="oi-toolbar">
      <div className="oi-sim-title"><span><Play size={20} fill="currentColor"/></span><div><h2>Run Simulation</h2><p>Execute a data pipeline and see how an orchestrator manages dependencies, retries, and integrations.</p></div></div>
      <div className="oi-toolbar-actions">
        <label><span>Orchestrator</span><select value={orchestrator} onChange={e=>setOrchestrator(e.target.value as OrchestratorId)}>{(Object.keys(orchestrators) as OrchestratorId[]).map(id=><option key={id} value={id}>{orchestrators[id].label}</option>)}</select></label>
        <button className="oi-run" onClick={runSimulation} disabled={running}><Play size={15} fill="currentColor"/>{running?"Running...":"Run Simulation"}</button>
        <button onClick={reset}><RefreshCcw size={15}/>Reset</button>
      </div>
    </header>

    <section className="oi-pipeline-board">
      <header className="oi-pipeline-head">
        <div><span className="oi-pipeline-icon"><Workflow size={18}/></span><strong>ETL Pipeline: Daily Sales Analytics</strong><em className={"is-"+state.pipelineStatus}>{statusLabel(state.pipelineStatus)}</em></div>
        <div className="oi-pipeline-controls">
          <label className="oi-auto"><Play size={13} fill="currentColor"/><span>Auto Run (5s)</span><button onClick={()=>setAutoRun(v=>!v)} aria-pressed={autoRun} className={autoRun?"is-on":""}><i/></button></label>
          <span className="oi-legend success"><i/>Success</span>
          <span className="oi-legend running"><i/>Running</span>
          <span className="oi-legend failed"><i/>Failed</span>
          <span className="oi-legend waiting"><i/>Waiting</span>
        </div>
      </header>
      <div className="oi-task-flow">
        {state.tasks.map((task,index)=><div className="oi-task-wrap" key={task.id}>
          <button className={`oi-task-card ${task.id} is-${task.status} ${state.selectedTask===task.id?"selected":""}`} onClick={()=>setState(prev=>({...prev,selectedTask:task.id}))}>
            <TaskIcon id={task.id}/>
            <strong>{task.order}. {task.title}</strong>
            <span>{task.subtitle}</span>
            <small><CheckCircle2 size={15}/>{task.duration}</small>
          </button>
          {index<state.tasks.length-1&&<ChevronRight className="oi-task-arrow" size={24}/>}
        </div>)}
      </div>
    </section>

    <div className="oi-detail-grid">
      <section className="oi-code">
        <header><h3>DAG Definition (Simplified)</h3><span>✦ Apache Airflow</span></header>
        <pre><code>{dagDefinition}</code></pre>
      </section>

      <section className="oi-logs">
        <header><h3>Execution Logs (Live)</h3><button onClick={()=>setState(prev=>({...prev,logs:[]}))}>Clear</button></header>
        <div>{state.logs.length===0?<p className="oi-empty">Logs cleared. Run the simulation to generate events.</p>:state.logs.map(entry=><p key={entry.id} className={"tone-"+entry.tone}><time>[{entry.time}]</time><span>{entry.text}</span></p>)}</div>
      </section>

      <section className="oi-metadata">
        <header><h3>Pipeline Metadata</h3></header>
        <div className="oi-meta-tabs"><button className={metadataTab==="task"?"active":""} onClick={()=>setMetadataTab("task")}>Task Details</button><button className={metadataTab==="run"?"active":""} onClick={()=>setMetadataTab("run")}>DAG Run Info</button></div>
        {metadataTab==="task"?<div className="oi-task-meta">
          <div className="oi-selected-task"><span><TaskIcon id={selectedTask.id}/></span><strong>{selectedTask.order}. {selectedTask.title}</strong><em className={"is-"+selectedTask.status}>{statusLabel(selectedTask.status)}</em></div>
          <dl>
            <div><dt>Task ID</dt><dd>{selectedTask.id}</dd></div>
            <div><dt>Operator</dt><dd>{selectedTask.operator}</dd></div>
            <div><dt>Start Time</dt><dd>{selectedTask.startTime}</dd></div>
            <div><dt>End Time</dt><dd>{selectedTask.endTime}</dd></div>
            <div><dt>Duration</dt><dd>{selectedTask.duration==="1 min"?"1m 7s":selectedTask.duration}</dd></div>
            <div><dt>Input Rows</dt><dd>{selectedTask.inputRows}</dd></div>
            <div><dt>Output Table</dt><dd>{selectedTask.output}</dd></div>
            <div><dt>Data Processed</dt><dd>{selectedTask.processed}</dd></div>
          </dl>
        </div>:<dl className="oi-run-meta">
          <div><dt>DAG ID</dt><dd>daily_sales_pipeline</dd></div>
          <div><dt>Run ID</dt><dd>scheduled__2026-10-01</dd></div>
          <div><dt>Orchestrator</dt><dd>{orchestratorMeta.short}</dd></div>
          <div><dt>Schedule</dt><dd>@daily</dd></div>
          <div><dt>Tasks</dt><dd>5</dd></div>
          <div><dt>Run Status</dt><dd>{statusLabel(state.pipelineStatus)}</dd></div>
          <div><dt>Retries</dt><dd>1 max / task</dd></div>
          <div><dt>Run #</dt><dd>{state.runId}</dd></div>
        </dl>}
      </section>
    </div>

    <section className="oi-takeaways">
      <header><h3>💡 Key Takeaways</h3></header>
      <ol>
        <li><b>1</b><span>Use orchestration to coordinate tasks, not implement business logic.</span></li>
        <li><b>2</b><span>Handle retries, dependencies, and scheduling in the orchestrator.</span></li>
        <li><b>3</b><span>Use managed integration services to move data between systems.</span></li>
        <li><b>4</b><span>Design for reliability, observability, and clear task boundaries.</span></li>
      </ol>
    </section>

    <footer className="oi-status"><span><CheckCircle2 size={14}/>{state.status}</span><span>{orchestratorMeta.label} · run #{state.runId} · auto run {autoRun?"on":"off"}</span></footer>
  </section>;
}
