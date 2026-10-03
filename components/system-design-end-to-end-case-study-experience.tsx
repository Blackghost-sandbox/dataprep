"use client";

import Image from "next/image";
import {useMemo,useState} from "react";
import {BarChart3,Boxes,CheckCircle2,ChevronDown,ChevronLeft,ChevronRight,Circle,Clock3,Database,DollarSign,Gauge,GraduationCap,Lightbulb,Network,Play,RefreshCcw,Server,ShieldCheck,Sparkles,Smartphone,Users,Zap} from "lucide-react";
import {Progress} from "@/components/ui/progress";
import {useCompanion} from "@/components/companion-context";
import {endToEndScenarios,getEndToEndScenario,simulateEndToEnd,type ArchitectureSelection,type EndToEndResult,type EndToEndScenarioId} from "@/lib/system-design-end-to-end-case-study-simulation";

export function SystemEndToEndCaseStudyHero({description,minutes,currentLesson,total,onPrevious,onNext}:{description:string;minutes:number;currentLesson:number;total:number;onPrevious:()=>void;onNext:()=>void}) {
  return <section className="sde2e-hero"><div><div className="sde2e-breadcrumb"><span>System Design</span><ChevronRight size={14}/><strong>End-to-End Design Case Study</strong></div><div className="sde2e-title-row"><span className="sde2e-hero-icon"><Zap size={28}/></span><div><h1>End-to-End Design Case Study</h1><p>{description}</p></div></div><div className="sde2e-meta"><span><Clock3 size={14}/>{minutes} min</span><span><GraduationCap size={14}/>Lesson {currentLesson+1}/{total}</span><span className="sde2e-level">Intermediate</span></div></div><div className="sde2e-hero-actions"><button type="button" onClick={onPrevious}><ChevronLeft size={18}/></button><button type="button" onClick={onNext} disabled={currentLesson===total-1}>Next <ChevronRight size={17}/></button></div></section>;
}

function ArchNode({id,title,tone,selected,onSelect,children}:{id:ArchitectureSelection;title:string;tone:string;selected:boolean;onSelect:(id:ArchitectureSelection)=>void;children:React.ReactNode}) {
  return <button type="button" className={"sde2e-arch-node "+tone+(selected?" is-selected":"")} onClick={()=>onSelect(id)}><strong>{title}</strong>{children}</button>;
}
function Metric({icon,label,value,detail,tone}:{icon:React.ReactNode;label:string;value:string;detail:string;tone:string}) {
  return <article className={"sde2e-metric "+tone}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{detail}</em></div></article>;
}
function LineChart({values}:{values:number[]}) {
  const w=280,h=82,max=Math.max(...values,1),min=Math.min(...values,0);
  const p=values.map((v,i)=>{const x=5+i/(values.length-1)*(w-10);const y=h-8-(v-min)/Math.max(1,max-min)*(h-20);return x.toFixed(1)+","+y.toFixed(1)}).join(" ");
  return <svg viewBox={"0 0 "+w+" "+h} role="img" aria-label="Events over time">{[20,42,64].map(y=><line key={y} x1="0" x2={w} y1={y} y2={y} className="grid"/>)}<polyline points={p} className="line"/></svg>;
}

export function SystemEndToEndCaseStudyLab() {
  const companion=useCompanion();
  const [scenarioId,setScenarioId]=useState<EndToEndScenarioId>("marketplace");
  const scenario=useMemo(()=>getEndToEndScenario(scenarioId),[scenarioId]);
  const [events,setEvents]=useState(100_000),[eventSize,setEventSize]=useState(2),[retention,setRetention]=useState(2);
  const [mixes,setMixes]=useState({realTime:60,adhoc:30,ml:10});
  const [selected,setSelected]=useState<ArchitectureSelection>("processing");
  const [running,setRunning]=useState(false);
  const [result,setResult]=useState<EndToEndResult>(()=>simulateEndToEnd(getEndToEndScenario("marketplace"),100_000,2,2,{realTime:60,adhoc:30,ml:10}));
  const chooseScenario=(id:EndToEndScenarioId)=>{const n=getEndToEndScenario(id),m={realTime:n.realTimeMix,adhoc:n.adhocMix,ml:n.mlMix};setScenarioId(id);setEvents(n.eventsPerMinute);setEventSize(n.eventSizeKb);setRetention(n.retentionYears);setMixes(m);setSelected("processing");setResult(simulateEndToEnd(n,n.eventsPerMinute,n.eventSizeKb,n.retentionYears,m));};
  const reset=()=>chooseScenario("marketplace");
  const run=()=>{setRunning(true);window.setTimeout(()=>{setResult(simulateEndToEnd(scenario,events,eventSize,retention,mixes));setRunning(false);companion?.emit({type:"exercise_correct",lesson:"End-to-End Design Case Study",source:"runner"});},320)};
  const fmt=(n:number)=>n>=1000?Math.round(n/1000)+"K":String(n);
  const mix=(key:keyof typeof mixes,v:number)=>setMixes(c=>({...c,[key]:v}));

  return <section className="sde2e-lab">
    <header className="sde2e-sim-header"><div className="sde2e-sim-heading"><span><Play size={20} fill="currentColor"/></span><div><h2>Interactive End-to-End Simulation</h2><p>Explore the complete data journey. Adjust parameters, run the simulation, and see how data flows, metrics, and trade-offs change.</p></div></div><div className="sde2e-toolbar"><button className="sde2e-reset" onClick={reset}><RefreshCcw size={15}/>Reset</button><button className="sde2e-run" onClick={run} disabled={running}><Play size={15} fill="currentColor"/>{running?"Running…":"Run Simulation"}</button><label className="sde2e-scenario"><span>{scenario.label}</span><select value={scenarioId} onChange={e=>chooseScenario(e.target.value as EndToEndScenarioId)}>{endToEndScenarios.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select><ChevronDown size={14}/></label></div></header>

    <section className="sde2e-architecture"><h3>1. End-to-End Architecture (Interactive)</h3><p>Click on each component to see details and configure parameters.</p><div className="sde2e-arch-flow">
      <ArchNode id="producers" title="Producers" tone="blue" selected={selected==="producers"} onSelect={setSelected}><span><Server size={17}/>Web App</span><span><Smartphone size={17}/>Mobile App</span><span><Server size={17}/>Partner APIs</span></ArchNode><b>→</b>
      <ArchNode id="ingestion" title="Ingestion" tone="orange" selected={selected==="ingestion"} onSelect={setSelected}><span><Network size={22}/>Kafka</span><small>{fmt(events)} events/min</small></ArchNode><b>→</b>
      <ArchNode id="processing" title="Processing" tone="purple" selected={selected==="processing"} onSelect={setSelected}><span><Sparkles size={22}/>Spark</span><small>Stream + Batch</small><div className="sde2e-pills"><i>Streaming</i><i>Batch</i></div></ArchNode><b>→</b>
      <ArchNode id="storage" title="Storage" tone="cyan" selected={selected==="storage"} onSelect={setSelected}><span><Database size={18}/>Data Lake (S3/Delta)</span><span><Database size={18}/>Data Warehouse (Snowflake)</span></ArchNode><b>→</b>
      <ArchNode id="serving" title="Serving" tone="green" selected={selected==="serving"} onSelect={setSelected}><span><BarChart3 size={17}/>BI Dashboard</span><span><Server size={17}/>Product API</span><span><Sparkles size={17}/>ML Feature Store</span></ArchNode><b>→</b>
      <ArchNode id="consumers" title="Consumers" tone="pink" selected={selected==="consumers"} onSelect={setSelected}><span><Users size={17}/>Analysts (BI)</span><span><Server size={17}/>Product (API)</span><span><Sparkles size={17}/>ML Engineers</span></ArchNode>
    </div><div className="sde2e-cross observability"><ShieldCheck size={14}/>Monitoring &amp; Observability (Metrics · Logs · Traces)</div><div className="sde2e-cross security"><ShieldCheck size={14}/>Security &amp; Governance (Access · Encryption · Audit)</div><div className="sde2e-selection"><strong>{selected[0].toUpperCase()+selected.slice(1)}</strong><span>{result.architectureNotes[selected]}</span></div></section>

    <div className="sde2e-mid">
      <section className="sde2e-config"><h3>2. Configure Workload</h3>
        <label><span>Events per minute</span><b>{events.toLocaleString()}</b><input type="range" min={1000} max={1000000} step={1000} value={events} onChange={e=>setEvents(Number(e.target.value))}/><small><i>1K</i><i>10K</i><i>100K</i><i>1M</i></small></label>
        <label><span>Event size (KB)</span><b>{eventSize} KB</b><input type="range" min={.5} max={10} step={.5} value={eventSize} onChange={e=>setEventSize(Number(e.target.value))}/><small><i>0.5</i><i>2</i><i>10</i></small></label>
        <label className="sde2e-select"><span>Historical retention</span><div><select value={retention} onChange={e=>setRetention(Number(e.target.value))}><option value={1}>1 year</option><option value={2}>2 years</option><option value={3}>3 years</option><option value={5}>5 years</option></select><ChevronDown size={13}/></div></label>
        <div className="sde2e-mix"><strong>Query pattern mix</strong>{([["realTime","Real-time (dashboards)"],["adhoc","Ad-hoc analytics"],["ml","ML training"]] as const).map(([k,label])=><label key={k}><span>{label}</span><input type="range" min={0} max={100} value={mixes[k]} onChange={e=>mix(k,Number(e.target.value))}/><b>{mixes[k]}%</b></label>)}</div>
      </section>

      <section className="sde2e-flow"><header><h3>3. Live Data Flow (Simulation)</h3><span><CheckCircle2 size={14}/>Running</span></header><div className="sde2e-flow-grid"><div className="sources"><article><Server size={18}/><strong>Web App</strong><span>{fmt(result.sourceRates.web)}/min</span></article><article><Smartphone size={18}/><strong>Mobile App</strong><span>{fmt(result.sourceRates.mobile)}/min</span></article><article><Server size={18}/><strong>Partner API</strong><span>{fmt(result.sourceRates.partner)}/min</span></article></div><div className="streams"><i/><i/><i/></div><article className="kafka"><Network size={28}/><strong>Kafka</strong><span>{fmt(events)}/min</span></article><div className="streams split"><i/><i/></div><div className="processing"><article><Sparkles size={22}/><strong>Spark Streaming</strong><span>{fmt(result.processingRates.streaming)}/min</span></article><article><Clock3 size={22}/><strong>Batch Jobs</strong><span>{fmt(result.processingRates.batch)}/min</span></article></div><div className="streams split"><i/><i/></div><div className="targets"><article><Database size={22}/><strong>S3 / Delta</strong><span>{fmt(result.storageRates.lake)}/min</span></article><article><Database size={22}/><strong>Snowflake</strong><span>{fmt(result.storageRates.warehouse)}/min</span></article></div></div></section>

      <section className="sde2e-metrics"><h3>4. Real-time Metrics</h3><div><Metric tone="green" icon={<Gauge size={19}/>} label="Throughput" value={result.throughput.toLocaleString()} detail="events/min · ↑ 0%"/><Metric tone="blue" icon={<Clock3 size={19}/>} label="End-to-end Latency" value={result.latencySec.toFixed(1)+" sec"} detail="↓ 35%"/><Metric tone="purple" icon={<BarChart3 size={19}/>} label="Consumer Queries" value={result.consumerQueries.toLocaleString()} detail="queries/min · ↑ 20%"/><Metric tone="orange" icon={<DollarSign size={19}/>} label="Processing Cost" value={"$"+result.processingCost} detail="/day · ↓ 18%"/></div></section>
    </div>

    <div className="sde2e-bottom">
      <section className="sde2e-dashboard"><h3>5. Sample Output (Analytics Dashboard)</h3><div className="sde2e-dash-grid"><article className="trend"><header><strong>Events Over Time</strong><span>Last 15 minutes⌄</span></header><LineChart values={result.eventSeries}/><footer><span>10:00</span><span>10:05</span><span>10:10</span><span>10:15</span></footer></article><article className="types"><strong>Top Event Types</strong>{result.eventTypes.map((x,i)=><div key={x.label}><span>{x.label}</span><i><b style={{width:x.percent+"%"}}/></i><em>{x.percent}%</em></div>)}</article><article className="regions"><strong>User Traffic by Region</strong><div className="sde2e-map">{result.regions.map((r,i)=><i key={r.label} style={{left:r.x+"%",top:r.y+"%"}}/>)}</div><div className="sde2e-region-legend">{result.regions.map(r=><span key={r.label}>{r.label}<b>{r.percent}%</b></span>)}</div></article></div></section>
      <section className="sde2e-takeaways"><h3>6. Key Takeaways</h3><div><CheckCircle2 size={16}/>Start with clear consumer requirements.</div><div><CheckCircle2 size={16}/>Design for both real-time and batch needs.</div><div><CheckCircle2 size={16}/>Ensure correctness with idempotency and checkpoints.</div><div><CheckCircle2 size={16}/>Plan for observability, security, and cost from day 1.</div><div><Circle size={16}/>Choose serving patterns based on access and latency needs.</div></section>
    </div>
  </section>;
}

export function SystemEndToEndCaseStudyRightRail({lessonTitles,currentLesson,completed,onLesson,onNotes}:{lessonTitles:string[];currentLesson:number;completed:number[];onLesson:(lesson:string)=>void;onNotes:()=>void}) {
  return <div className="sde2e-right-rail"><section className="sde2e-progress-card"><header><strong>Lesson Progress <ChevronDown size={14}/></strong><span>{completed.length} / {lessonTitles.length} done</span></header><Progress value={completed.length/lessonTitles.length*100} className="sde2e-progress"/><div className="sde2e-progress-list">{lessonTitles.map((lesson,index)=>{const done=completed.includes(index),current=index===currentLesson;return <button type="button" key={lesson} className={current?"is-current":""} onClick={()=>onLesson(lesson)}>{done?<CheckCircle2 size={17}/>:current?<Play size={17} fill="currentColor"/>:<Circle size={17}/>}<span>{index+1}. {lesson}</span><small>{done?"Completed":current?"Learning":"Not started"}</small></button>})}</div></section><section className="sde2e-notes-card"><header><Lightbulb size={18}/><strong>Quick Notes</strong><button type="button" onClick={onNotes}>+ Add Note</button></header><p>Jot down key points, questions, or your own notes…</p><div className="sde2e-notes-visual"><div><Sparkles size={18}/><span>Connect each design choice back to SLA, recovery, security, and cost.</span></div><Image src="/nila-avatar.png" alt="Mithoo learning companion" width={88} height={108}/></div></section></div>;
}
