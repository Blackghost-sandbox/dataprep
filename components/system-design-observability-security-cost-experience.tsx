"use client";

import Image from "next/image";
import {useMemo,useState} from "react";
import {
  AlertTriangle, BarChart3, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  Circle, Clock3, Database, DollarSign, Eye, Gauge, GraduationCap, KeyRound,
  Lightbulb, LockKeyhole, Network, Play, RefreshCcw, Server, Settings2,
  ShieldCheck, Sparkles, Smartphone, Store, TriangleAlert, Users, Zap
} from "lucide-react";
import {Progress} from "@/components/ui/progress";
import {useCompanion} from "@/components/companion-context";
import {
  defaultOpsControls,getOpsScenario,opsScenarios,simulateOps,
  type OpsControls,type OpsResult,type OpsScenarioId
} from "@/lib/system-design-observability-security-cost-simulation";

export function SystemObservabilitySecurityCostHero({
  description,minutes,currentLesson,total,onPrevious,onNext
}:{description:string;minutes:number;currentLesson:number;total:number;onPrevious:()=>void;onNext:()=>void}) {
  return <section className="sdoc-hero">
    <div>
      <div className="sdoc-breadcrumb"><span>System Design</span><ChevronRight size={14}/><strong>Observability, Security &amp; Cost</strong></div>
      <div className="sdoc-title-row"><span className="sdoc-hero-icon"><Zap size={28}/></span><div><h1>Observability, Security &amp; Cost</h1><p>{description}</p></div></div>
      <div className="sdoc-meta"><span><Clock3 size={14}/>{minutes} min</span><span><GraduationCap size={14}/>Lesson {currentLesson+1}/{total}</span><span className="sdoc-level">Intermediate</span></div>
    </div>
    <div className="sdoc-hero-actions"><button type="button" onClick={onPrevious}><ChevronLeft size={18}/></button><button type="button" onClick={onNext} disabled={currentLesson===total-1}>Next <ChevronRight size={17}/></button></div>
  </section>;
}

function Toggle({checked,onChange}:{checked:boolean;onChange:()=>void}) {
  return <button type="button" aria-pressed={checked} className={"sdoc-switch "+(checked?"is-on":"")} onClick={onChange}><i/></button>;
}

function LayerCard({title,tone,children}:{title:string;tone:string;children:React.ReactNode}) {
  return <section className={"sdoc-stage "+tone}><header>{title}</header>{children}</section>;
}

function Metric({icon,label,value,detail,tone}:{icon:React.ReactNode;label:string;value:string;detail:string;tone:string}) {
  return <article className={"sdoc-metric "+tone}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{detail}</em></div></article>;
}

export function SystemObservabilitySecurityCostLab() {
  const companion=useCompanion();
  const [scenarioId,setScenarioId]=useState<OpsScenarioId>("ecommerce");
  const scenario=useMemo(()=>getOpsScenario(scenarioId),[scenarioId]);
  const [events,setEvents]=useState(10_000);
  const [dataGb,setDataGb]=useState(500);
  const [errorRate,setErrorRate]=useState(.7);
  const [qualityMode,setQualityMode]=useState<"late-duplicates"|"schema-drift"|"clean">("late-duplicates");
  const [controls,setControls]=useState<OpsControls>({...defaultOpsControls});
  const [result,setResult]=useState<OpsResult>(()=>simulateOps(getOpsScenario("ecommerce"),10_000,500,.7,"late-duplicates",defaultOpsControls));
  const [running,setRunning]=useState(false);
  const [advanced,setAdvanced]=useState(false);
  const [logFilter,setLogFilter]=useState<"all"|"info"|"warn"|"error">("all");
  const [costView,setCostView]=useState<"daily"|"monthly">("daily");

  const chooseScenario=(id:OpsScenarioId)=>{
    const next=getOpsScenario(id);
    setScenarioId(id);
    setEvents(next.eventsPerSecond);
    setDataGb(next.dataVolumeGbPerDay);
    setErrorRate(next.errorRatePct);
    setQualityMode(next.dataQualityMode);
    setControls({...defaultOpsControls});
    setResult(simulateOps(next,next.eventsPerSecond,next.dataVolumeGbPerDay,next.errorRatePct,next.dataQualityMode,defaultOpsControls));
  };
  const patchControl=(key:keyof OpsControls)=>setControls(current=>({...current,[key]:!current[key]}));
  const reset=()=>chooseScenario("ecommerce");
  const run=()=>{
    setRunning(true);
    window.setTimeout(()=>{
      setResult(simulateOps(scenario,events,dataGb,errorRate,qualityMode,controls));
      setRunning(false);
      companion?.emit({type:"exercise_correct",lesson:"Observability, Security & Cost",source:"runner"});
    },320);
  };
  const logs=result.logs.filter(line=>logFilter==="all"||line.includes("["+logFilter.toUpperCase()+"]"));
  const totalDisplay=costView==="daily"?result.dailyCost:result.dailyCost*30;

  return <section className="sdoc-lab">
    <header className="sdoc-sim-header">
      <div className="sdoc-sim-heading"><span><Play size={20} fill="currentColor"/></span><div><h2>Interactive Simulation</h2><p>Explore how observability, security, and cost controls work together. Adjust parameters and see real-time impact on metrics, cost, and alerts.</p></div></div>
      <div className="sdoc-toolbar"><button type="button" className="sdoc-reset" onClick={reset}><RefreshCcw size={15}/>Reset</button><button type="button" className="sdoc-run" onClick={run} disabled={running}><Play size={15} fill="currentColor"/>{running?"Running…":"Run Simulation"}</button><label className="sdoc-scenario"><span>{scenario.label}</span><select value={scenarioId} onChange={e=>chooseScenario(e.target.value as OpsScenarioId)}>{opsScenarios.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select><ChevronDown size={14}/></label></div>
    </header>

    <div className="sdoc-workspace">
      <section className="sdoc-config">
        <h3>1. Configure Workload &amp; Controls</h3><p>Adjust workload, failure rate, and control settings to see how it affects observability, security and cost.</p>

        <div className="sdoc-config-card">
          <header><Store size={19}/><strong>Workload Profile</strong></header>
          <label className="sdoc-slider"><span>Events per second</span><b>{Math.round(events/1000)}K</b><input type="range" min={1000} max={100000} step={1000} value={events} onChange={e=>setEvents(Number(e.target.value))}/><small><i>1K</i><i>10K</i><i>100K</i></small></label>
          <label className="sdoc-select-field"><span>Data volume per day</span><div><select value={dataGb} onChange={e=>setDataGb(Number(e.target.value))}><option value={250}>250 GB</option><option value={500}>500 GB</option><option value={750}>750 GB</option><option value={1000}>1 TB</option></select><ChevronDown size={13}/></div></label>
        </div>

        <div className="sdoc-config-card">
          <header><Settings2 size={19}/><strong>Failure &amp; Data Quality</strong></header>
          <label className="sdoc-slider"><span>Error rate</span><b>{errorRate.toFixed(1)}%</b><input type="range" min={0} max={5} step={.1} value={errorRate} onChange={e=>setErrorRate(Number(e.target.value))}/><small><i>0%</i><i>1%</i><i>5%</i></small></label>
          <label className="sdoc-select-field"><span>Data quality issues</span><div><select value={qualityMode} onChange={e=>setQualityMode(e.target.value as typeof qualityMode)}><option value="late-duplicates">Include late &amp; duplicate records</option><option value="schema-drift">Include schema drift</option><option value="clean">Mostly clean data</option></select><ChevronDown size={13}/></div></label>
        </div>

        <div className="sdoc-toggle-list">
          <div><span><Eye size={17}/>Enable Observability (Metrics/Logs/Traces)</span><Toggle checked={controls.observability} onChange={()=>patchControl("observability")}/></div>
          <div><span><ShieldCheck size={17}/>Enable Data Quality Checks</span><Toggle checked={controls.quality} onChange={()=>patchControl("quality")}/></div>
          <div><span><KeyRound size={17}/>Enable Access Controls (RBAC)</span><Toggle checked={controls.accessControls} onChange={()=>patchControl("accessControls")}/></div>
          <div><span><DollarSign size={17}/>Enable Cost Alerts</span><Toggle checked={controls.costAlerts} onChange={()=>patchControl("costAlerts")}/></div>
        </div>

        <button type="button" className="sdoc-advanced" onClick={()=>setAdvanced(v=>!v)}><Settings2 size={15}/>Advanced Options<ChevronRight size={14}/></button>
        {advanced&&<div className="sdoc-advanced-panel"><span>Recovery objective: <b>RPO 5 min</b></span><span>Encryption: <b>at-rest + in-transit</b></span><span>Audit retention: <b>90 days</b></span></div>}
      </section>

      <div className="sdoc-main">
        <section className="sdoc-pipeline">
          <h3>2. Pipeline with Observability, Security &amp; Cost Controls</h3><p>See how signals, access boundaries, and cost monitoring fit into the data pipeline.</p>
          <div className="sdoc-pipeline-grid">
            <LayerCard title="Data Sources" tone="blue"><div><Server size={18}/><strong>Web App</strong><small>(Events)</small></div><div><Smartphone size={18}/><strong>Mobile App</strong><small>(Events)</small></div><div><Database size={18}/><strong>Payment DB</strong><small>(CDC)</small></div></LayerCard>
            <span>→</span>
            <LayerCard title="Ingestion" tone="orange"><div><Network size={18}/><strong>Kafka</strong><small>(Event Stream)</small></div><div><Network size={18}/><strong>Pulsar</strong><small>(Alternative)</small></div></LayerCard>
            <span>→</span>
            <LayerCard title="Processing" tone="purple"><div><Sparkles size={18}/><strong>Spark</strong><small>(Stream + Batch)</small></div><div><ShieldCheck size={18}/><strong>Data Quality</strong><small>Checks</small></div></LayerCard>
            <span>→</span>
            <LayerCard title="Storage" tone="cyan"><div><Database size={18}/><strong>Data Warehouse</strong><small>(Snowflake)</small></div><div><Database size={18}/><strong>Data Lake</strong><small>(S3 / Delta)</small></div></LayerCard>
            <span>→</span>
            <LayerCard title="Serving" tone="green"><div><BarChart3 size={18}/><strong>BI Dashboard</strong></div><div><Server size={18}/><strong>Product API</strong></div><div><Sparkles size={18}/><strong>ML Feature Store</strong></div></LayerCard>
          </div>
          <div className={"sdoc-control-band observability "+(controls.observability?"is-on":"")}><Eye size={15}/>Observability (Metrics · Logs · Traces · Alerts)</div>
          <div className={"sdoc-control-band security "+(controls.accessControls?"is-on":"")}><LockKeyhole size={15}/>Security (Authentication · Authorization · Encryption · Audit Logs)</div>
          <div className={"sdoc-control-band cost "+(controls.costAlerts?"is-on":"")}><DollarSign size={15}/>Cost Monitoring (Usage Tracking · Budgets · Alerts)</div>
        </section>

        <div className="sdoc-bottom">
          <section className="sdoc-results"><header><h3>3. Real-time Metrics (Live)</h3><span><CheckCircle2 size={14}/>Running</span></header><div className="sdoc-metrics-grid">
            <Metric tone="blue" icon={<Gauge size={18}/>} label="Throughput" value={result.throughput.toLocaleString()} detail="events/sec · ↑ 12%"/>
            <Metric tone="pink" icon={<TriangleAlert size={18}/>} label="Error Rate" value={result.errorRatePct.toFixed(1)+"%"} detail={result.errorsPerMinute+" errors/min · ↑ 0.2%"}/>
            <Metric tone="cyan" icon={<Clock3 size={18}/>} label="Processing Latency" value={result.latencyMs+" ms"} detail="(p95) · ↓ 18%"/>
            <Metric tone="pink" icon={<AlertTriangle size={18}/>} label="Data Quality Issues" value={result.dataQualityIssues.toString()} detail="late/duplicate/min · ↑ 9%"/>
            <Metric tone="green" icon={<Users size={18}/>} label="Active Consumers" value={result.activeConsumers.toString()} detail="(healthy) · → 0%"/>
            <Metric tone="gold" icon={<DollarSign size={18}/>} label="Estimated Cost" value={"$"+result.dailyCost} detail="/day · ↑ 6%"/>
          </div></section>

          <section className="sdoc-logs"><header><h3>4. Live Logs &amp; Alerts</h3><div>{(["all","info","warn","error"] as const).map(filter=><button key={filter} className={logFilter===filter?"is-active":""} onClick={()=>setLogFilter(filter)}>{filter==="all"?"All":filter[0].toUpperCase()+filter.slice(1)}</button>)}</div></header><pre>{logs.map((line,index)=><span key={index}><time>10:24:{String(index+1).padStart(2,"0")}</time>{line}</span>)}</pre></section>

          <section className="sdoc-cost"><header><h3>5. Cost Breakdown</h3><label><select value={costView} onChange={e=>setCostView(e.target.value as "daily"|"monthly")}><option value="daily">Daily</option><option value="monthly">Monthly</option></select><ChevronDown size={13}/></label></header><div className="sdoc-cost-body"><div className="sdoc-donut" style={{background:"conic-gradient(#7255f5 0 43%,#2188f6 43% 72%,#ff8a12 72% 86%,#13b96c 86% 96%,#94a3b8 96% 100%)"}}><span><strong>{"$"+totalDisplay.toLocaleString()}</strong><small>/{costView==="daily"?"day":"month"}</small></span></div><div className="sdoc-cost-legend">{result.costBreakdown.map((item,index)=>{const colors=["#7255f5","#2188f6","#ff8a12","#13b96c","#94a3b8"];const amount=costView==="daily"?item.amount:item.amount*30;return <div key={item.label}><i style={{background:colors[index]}}/><span>{item.label}</span><b>{"$"+amount.toLocaleString()} ({item.percent}%)</b></div>;})}</div></div></section>
        </div>
      </div>
    </div>
  </section>;
}

export function SystemObservabilitySecurityCostRightRail({
  lessonTitles,currentLesson,completed,onLesson,onNotes
}:{lessonTitles:string[];currentLesson:number;completed:number[];onLesson:(lesson:string)=>void;onNotes:()=>void}) {
  return <div className="sdoc-right-rail">
    <section className="sdoc-progress-card"><header><strong>Lesson Progress <ChevronDown size={14}/></strong><span>{completed.length} / {lessonTitles.length} done</span></header><Progress value={completed.length/lessonTitles.length*100} className="sdoc-progress"/><div className="sdoc-progress-list">{lessonTitles.map((lesson,index)=>{const done=completed.includes(index),current=index===currentLesson;return <button type="button" key={lesson} className={current?"is-current":""} onClick={()=>onLesson(lesson)}>{done?<CheckCircle2 size={17}/>:current?<Play size={17} fill="currentColor"/>:<Circle size={17}/>}<span>{index+1}. {lesson}</span><small>{done?"Completed":current?"Learning":"Not started"}</small></button>;})}</div></section>
    <section className="sdoc-notes-card"><header><Lightbulb size={18}/><strong>Quick Notes</strong><button type="button" onClick={onNotes}>+ Add Note</button></header><p>Jot down key points, questions, or your own notes…</p><div className="sdoc-notes-visual"><div><Sparkles size={18}/><span>Observe outcomes, secure boundaries, and track cost drivers together.</span></div><Image src="/nila-avatar.png" alt="Mithoo learning companion" width={88} height={108}/></div></section>
  </div>;
}
