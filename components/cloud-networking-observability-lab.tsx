"use client";
import {useCloudMotion} from "@/components/cloud-motion";

import {useMemo,useState} from "react";
import {
  Activity, AlertTriangle, BarChart3, BellRing, CheckCircle2, ChevronLeft,
  ChevronRight, Database, FileText, GraduationCap, Layers3, LockKeyhole,
  Play, RefreshCcw, Route, ServerCog, ShieldCheck, Sparkles, TimerReset, Zap
} from "lucide-react";
import {
  computeObservability, dataServices, defaultObservabilityControls,
  observabilityScenarios, referenceObservabilityState, retentionOptions,
  type DataServiceId, type NetworkIssueId, type ObservabilityControls,
  type ObservabilityScenarioId, type RegionId, type RetentionId
} from "@/lib/cloud-networking-observability-simulation";

function NetworkingHeroArtwork(){
  return <div className="no-hero-art" aria-label="Private network and observability flow">
    <div className="no-hero-node source"><Database size={30}/><strong>Data<br/>Sources</strong></div>
    <ChevronRight size={22}/>
    <div className="no-hero-node network"><ShieldCheck size={30}/><strong>VPC / Private<br/>Network</strong></div>
    <ChevronRight size={22}/>
    <div className="no-hero-node service"><Layers3 size={30}/><strong>Data Services</strong></div>
    <ChevronRight size={22}/>
    <div className="no-observe-stack">
      <span><BarChart3 size={17}/>Metrics</span>
      <span><FileText size={17}/>Logs</span>
      <span><Route size={17}/>Traces</span>
      <span><BellRing size={17}/>Alerts</span>
    </div>
  </div>;
}

export function CloudNetworkingObservabilityHero({description,minutes,currentLesson,total,onPrevious,onNext}:{
  description:string;minutes:number;currentLesson:number;total:number;onPrevious:()=>void;onNext:()=>void;
}){
  return <section className="no-hero">
    <div className="no-breadcrumb"><span>Cloud Platforms</span><ChevronRight size={14}/><strong>Networking, Reliability &amp; Observability</strong></div>
    <div className="no-hero-grid">
      <div>
        <div className="no-title-row">
          <span className="no-title-icon"><Zap size={31}/></span>
          <div><h1>Networking, Reliability &amp; Observability</h1><p>{description}</p></div>
        </div>
        <div className="no-meta">
          <span><TimerReset size={14}/>{minutes} min</span>
          <span><GraduationCap size={14}/>Lesson {currentLesson+1}/{total}</span>
          <span className="is-intermediate"><Sparkles size={13}/>Intermediate</span>
        </div>
      </div>
      <div className="no-hero-right">
        <div className="no-hero-nav"><button onClick={onPrevious} disabled={currentLesson===0}><ChevronLeft size={16}/>Previous</button><button className="is-next" onClick={onNext} disabled={currentLesson===total-1}>Next<ChevronRight size={16}/></button></div>
        <NetworkingHeroArtwork/>
      </div>
    </div>
  </section>;
}

function Toggle({on,onClick}:{on:boolean;onClick:()=>void}){
  return <button type="button" className={`no-toggle ${on?"is-on":""}`} onClick={onClick} aria-pressed={on}><i/></button>;
}

export function CloudNetworkingObservabilityLab(){
 const cloudMotion=useCloudMotion(".no-stage-grid > .no-card");
  const [controls,setControls]=useState<ObservabilityControls>(()=>defaultObservabilityControls());
  const [state,setState]=useState(()=>referenceObservabilityState());
  const [running,setRunning]=useState(false);
  const [logFilter,setLogFilter]=useState<"all"|"info"|"warn"|"error">("all");

  const preview=useMemo(()=>computeObservability(controls),[controls]);
  const service=dataServices[controls.dataService];

  const patch=<K extends keyof ObservabilityControls>(key:K,value:ObservabilityControls[K])=>{
    setControls(prev=>({...prev,[key]:value}));
  };

  const run=()=>{
    setRunning(true);
    window.setTimeout(()=>{
      setState(computeObservability(controls));
      setRunning(false);
    },360);
  };

  const reset=()=>{
    const defaults=defaultObservabilityControls();
    setControls(defaults);
    setState(referenceObservabilityState());
    setRunning(false);
    setLogFilter("all");
  };

  const visibleLogs=state.logs.filter(log=>logFilter==="all"||log.level.toLowerCase()===logFilter);

  return <section {...cloudMotion} className="no-lab" aria-label="Networking reliability and observability interactive simulation">
    <header className="no-toolbar">
      <div className="no-sim-title"><span><Play size={20} fill="currentColor"/></span><div><h2>Run Simulation</h2><p>See how networking, reliability, and observability work together in a data pipeline. Introduce failures and watch the system recover.</p></div></div>
      <div className="no-toolbar-actions">
        <label><span>Scenario</span><select value={controls.scenario} onChange={e=>patch("scenario",e.target.value as ObservabilityScenarioId)}>{(Object.keys(observabilityScenarios) as ObservabilityScenarioId[]).map(id=><option key={id} value={id}>{observabilityScenarios[id].label}</option>)}</select></label>
        <button className="no-run" onClick={run} disabled={running}><Play size={15} fill="currentColor"/>{running?"Running...":"Run Simulation"}</button>
        <button onClick={reset}><RefreshCcw size={15}/>Reset</button>
      </div>
    </header>

    <div className="no-stage-grid">
      <article className="no-card source">
        <header><span><Database size={18}/></span><div><h3>1. Data Source</h3><p>Generate sample events</p></div></header>
        <div className="no-card-body">
          <label className="no-slider"><span>Events/sec <b>{controls.eventsPerSecond}</b></span><input type="range" min="10" max="500" step="10" value={controls.eventsPerSecond} onChange={e=>patch("eventsPerSecond",Number(e.target.value))}/></label>
          <label>Region<select value={controls.region} onChange={e=>patch("region",e.target.value as RegionId)}><option>us-east-1</option><option>us-west-2</option><option>eu-west-1</option></select></label>
        </div>
      </article>

      <div className="no-arrow"><ChevronRight size={22}/></div>

      <article className="no-card network">
        <header><span><LockKeyhole size={18}/></span><div><h3>2. Network Layer</h3><p>VPC, subnets, security groups</p></div></header>
        <div className="no-card-body">
          <label>Simulate issue<select value={controls.networkIssue} onChange={e=>patch("networkIssue",e.target.value as NetworkIssueId)}><option value="none">No issue</option><option value="latency">High latency</option><option value="timeout">Network timeout</option><option value="blocked">Security rule blocked</option></select></label>
          <div className="no-inline-toggle"><span>Inject selected issue</span><Toggle on={controls.simulateNetworkIssue} onClick={()=>patch("simulateNetworkIssue",!controls.simulateNetworkIssue)}/></div>
        </div>
      </article>

      <div className="no-arrow"><ChevronRight size={22}/></div>

      <article className="no-card service">
        <header><span><Layers3 size={18}/></span><div><h3>3. Data Service</h3><p>(Managed)</p></div></header>
        <div className="no-card-body">
          <label>Service<select value={controls.dataService} onChange={e=>patch("dataService",e.target.value as DataServiceId)}>{(Object.keys(dataServices) as DataServiceId[]).map(id=><option key={id} value={id}>{dataServices[id].label}</option>)}</select></label>
          <label>Retention<select value={controls.retention} onChange={e=>patch("retention",e.target.value as RetentionId)}>{(Object.keys(retentionOptions) as RetentionId[]).map(id=><option key={id} value={id}>{retentionOptions[id]}</option>)}</select></label>
        </div>
      </article>

      <div className="no-arrow"><ChevronRight size={22}/></div>

      <article className="no-card consumer">
        <header><span><ServerCog size={18}/></span><div><h3>4. Consumer</h3><p>Process events</p></div></header>
        <div className="no-card-body">
          <label className="no-slider"><span>Worker count <b>{controls.workerCount}</b></span><input type="range" min="1" max="10" value={controls.workerCount} onChange={e=>patch("workerCount",Number(e.target.value))}/></label>
          <label className="no-slider"><span>Processing time (sec) <b>{controls.processingTimeSeconds}</b></span><input type="range" min="1" max="8" value={controls.processingTimeSeconds} onChange={e=>patch("processingTimeSeconds",Number(e.target.value))}/></label>
        </div>
      </article>

      <div className="no-arrow"><ChevronRight size={22}/></div>

      <article className="no-card monitor">
        <header><span><BarChart3 size={18}/></span><div><h3>5. Monitoring &amp; Alerts</h3><p>Observe metrics, logs, traces</p></div></header>
        <div className="no-monitor-list">
          <div><CheckCircle2 size={15}/><span>Show metrics</span><Toggle on={controls.showMetrics} onClick={()=>patch("showMetrics",!controls.showMetrics)}/></div>
          <div><CheckCircle2 size={15}/><span>Show logs</span><Toggle on={controls.showLogs} onClick={()=>patch("showLogs",!controls.showLogs)}/></div>
          <div><CheckCircle2 size={15}/><span>Show traces</span><Toggle on={controls.showTraces} onClick={()=>patch("showTraces",!controls.showTraces)}/></div>
          <div><CheckCircle2 size={15}/><span>Enable alert (error &gt; 5%)</span><Toggle on={controls.alertsEnabled} onClick={()=>patch("alertsEnabled",!controls.alertsEnabled)}/></div>
        </div>
      </article>
    </div>

    <div className="no-lower-grid">
      <section className="no-metrics">
        <header><h3><Activity size={16}/>Live Metrics</h3><label><span>Auto refresh</span><Toggle on={controls.showMetrics} onClick={()=>patch("showMetrics",!controls.showMetrics)}/></label></header>
        {controls.showMetrics?<div className="no-metric-cards">
          <div><BarChart3 size={20}/><span><small>Incoming Events</small><strong>{state.metrics.incomingEvents}<em>/sec</em></strong></span></div>
          <div><CheckCircle2 size={20}/><span><small>Processed Events</small><strong>{state.metrics.processedEvents}<em>/sec</em></strong></span></div>
          <div><AlertTriangle size={20}/><span><small>Error Rate</small><strong>{state.metrics.errorRatePct}%</strong></span></div>
          <div><TimerReset size={20}/><span><small>End-to-End Latency</small><strong>{state.metrics.latencyMs}<em>ms</em></strong></span></div>
          <div><RefreshCcw size={20}/><span><small>Retries</small><strong>{state.metrics.retries}</strong></span></div>
          <div><BarChart3 size={20}/><span><small>Consumer Lag</small><strong>{state.metrics.consumerLag}<em>events</em></strong></span></div>
        </div>:<div className="no-hidden-state">Metrics hidden by monitoring controls.</div>}
      </section>

      <section className="no-logs">
        <header><h3>Logs (Live)</h3><div><select value={logFilter} onChange={e=>setLogFilter(e.target.value as typeof logFilter)}><option value="all">All Logs</option><option value="info">INFO</option><option value="warn">WARN</option><option value="error">ERROR</option></select><button onClick={()=>setState(prev=>({...prev,logs:[]}))}>Clear</button></div></header>
        {controls.showLogs?<div>{visibleLogs.length===0?<p className="no-empty">No logs to display.</p>:visibleLogs.map(log=><p key={log.id} className={`level-${log.level.toLowerCase()}`}><time>[{log.time}]</time><b>{log.level}</b><span>{log.text}</span></p>)}</div>:<div className="no-hidden-state dark">Logs hidden by monitoring controls.</div>}
      </section>

      <section className="no-traces">
        <header><h3><Route size={16}/>Traces (Sample Event)</h3><button>View Full Trace →</button></header>
        {controls.showTraces?<div className="no-trace-list">{state.traces.map(span=><div key={span.id} className={span.tone}><i/><strong>{span.label}</strong><small>{span.durationMs} ms</small></div>)}</div>:<div className="no-hidden-state">Traces hidden by monitoring controls.</div>}
      </section>
    </div>

    <section className="no-takeaways">
      <header><h3>💡 Key Takeaways</h3></header>
      <ol>
        <li><b>1</b><span>Design secure networking with VPCs, subnets, and private endpoints.</span></li>
        <li><b>2</b><span>Build for failure with retries, dead-letter queues, and multi-AZ architectures.</span></li>
        <li><b>3</b><span>Monitor with metrics, logs, traces, and alerts.</span></li>
        <li><b>4</b><span>Use observability to quickly identify and resolve pipeline issues.</span></li>
      </ol>
    </section>

    <footer className={`no-status ${state.alertTriggered?"is-alert":""}`}>
      <span>{state.alertTriggered?<BellRing size={14}/>:<CheckCircle2 size={14}/>} {state.status}</span>
      <span>{service.label} · {controls.region} · preview {preview.metrics.processedEvents}/sec</span>
    </footer>
  </section>;
}
