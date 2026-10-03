"use client";

import Image from "next/image";
import {useMemo,useState} from "react";
import {
  Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Circle, Clock3,
  Cloud, Database, FileText, Gauge, GraduationCap, HardDrive, Lightbulb, Network,
  Play, RefreshCcw, Server, Settings2, ShieldCheck, Smartphone, Sparkles, Upload,
  Users, Zap
} from "lucide-react";
import {Progress} from "@/components/ui/progress";
import {useCompanion} from "@/components/companion-context";
import {
  defaultIngestionState,getIngestionScenario,ingestionScenarios,runIngestionSimulation,
  type IngestionMode,type IngestionResult,type IngestionScenarioId,type SourceId
} from "@/lib/system-design-ingestion-simulation";

const sourceMeta:Record<SourceId,{title:string;subtitle:string;icon:React.ReactNode;tone:string}> = {
  oltp:{title:"OLTP Database",subtitle:"(Orders, Customers)",icon:<Database size={20}/>,tone:"blue"},
  logs:{title:"Application Logs",subtitle:"(Web, Mobile)",icon:<FileText size={20}/>,tone:"green"},
  saas:{title:"SaaS API",subtitle:"(Payments)",icon:<Cloud size={20}/>,tone:"slate"},
  events:{title:"Event Stream",subtitle:"(Clickstream)",icon:<Network size={20}/>,tone:"pink"},
};

export function SystemIngestionHero({
  description,minutes,currentLesson,total,onPrevious,onNext
}:{description:string;minutes:number;currentLesson:number;total:number;onPrevious:()=>void;onNext:()=>void}){
  return <section className="sdi-hero">
    <div>
      <div className="sdi-breadcrumb"><span>System Design</span><ChevronRight size={14}/><strong>Ingestion: Batch, CDC &amp; Events</strong></div>
      <div className="sdi-title-row"><span className="sdi-hero-icon"><Zap size={28}/></span><div><h1>Ingestion: Batch, CDC &amp; Events</h1><p>{description}</p></div></div>
      <div className="sdi-meta"><span><Clock3 size={14}/>{minutes} min</span><span><GraduationCap size={14}/>Lesson {currentLesson+1}/{total}</span><span className="sdi-level">Intermediate</span></div>
    </div>
    <div className="sdi-hero-actions"><button type="button" onClick={onPrevious}><ChevronLeft size={18}/></button><button type="button" onClick={onNext} disabled={currentLesson===total-1}>Next <ChevronRight size={17}/></button></div>
  </section>;
}

function SourceRow({id,checked,onToggle}:{id:SourceId;checked:boolean;onToggle:()=>void}){
  const meta=sourceMeta[id];
  return <button type="button" className={"sdi-source-row "+meta.tone+(checked?" is-on":"")} onClick={onToggle}>
    <span className="sdi-check">{checked?<Check size={14}/>:null}</span><span className="sdi-source-icon">{meta.icon}</span><span><strong>{meta.title}</strong><small>{meta.subtitle}</small></span><Settings2 size={14}/>
  </button>;
}

function Pipeline({result}:{result:IngestionResult}){
  return <section className="sdi-pipeline">
    <h3>2. Ingestion Pipeline (Live Simulation)</h3>
    <div className="sdi-pipe-grid">
      <div className="sdi-stage source-stage"><header>Sources</header><div><Database size={20}/><b>OLTP DB</b><small>(Orders)</small></div><div><FileText size={20}/><b>App Logs</b><small>(Web/Mobile)</small></div><div><Cloud size={20}/><b>SaaS API</b><small>(Payments)</small></div><div><Network size={20}/><b>Events</b><small>(Clicks)</small></div></div>
      <div className="sdi-route-labels"><span>Batch<br/><small>(Periodic)</small></span><span>CDC<br/><small>(Incremental)</small></span><span>API Pull<br/><small>(Scheduled)</small></span><span>Event Stream<br/><small>(Real-time)</small></span></div>
      <div className="sdi-stage ingest-stage"><header>Ingestion Layer</header><div><Clock3 size={20}/><b>Scheduler</b><small>(Cron / Orchestrator)</small></div><div><RefreshCcw size={20}/><b>CDC Connector</b><small>(Debezium)</small></div><div><Cloud size={20}/><b>API Ingestor</b><small>(Retries &amp; Backoff)</small></div><div><Network size={20}/><b>Stream Ingestor</b><small>(Kafka / Kinesis)</small></div></div>
      <div className="sdi-arrow-col">→<br/>→<br/>→</div>
      <div className="sdi-stage landing-stage"><header>Landing Zone</header><div><HardDrive size={21}/><b>Raw Data</b><small>(Data Lake)</small></div><div><Database size={21}/><b>Staging</b><small>(Cleaned)</small></div><div><FileText size={21}/><b>Metadata</b><small>(Schema, Checkpoints)</small></div></div>
      <div className="sdi-arrow-col">→<br/>→<br/>→</div>
      <div className="sdi-stage processing-stage"><header>Processing</header><div><Settings2 size={21}/><b>Transform</b><small>(ETL / ELT)</small></div><div><ShieldCheck size={21}/><b>Validate</b><small>(Data Quality)</small></div><div><Network size={21}/><b>Route</b><small>(To Analytics)</small></div></div>
    </div>
    <div className="sdi-live-note"><span>Current throughput</span><b>{(result.throughput/1000).toFixed(1)}K rec/sec</b></div>
  </section>;
}

function ResultCard({icon,label,value,detail,tone}:{icon:React.ReactNode;label:string;value:string;detail:string;tone:string}){
  return <article className={"sdi-result "+tone}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{detail}</em></div></article>;
}

const previewRows=[
  ["1001","C123","299.00","2026-10-01 10:24:01"],
  ["1002","C456","149.00","2026-10-01 10:24:01"],
  ["1003","C789","499.00","2026-10-01 10:24:02"],
  ["1004","C123","89.00","2026-10-01 10:24:02"],
  ["1005","C321","159.00","2026-10-01 10:24:03"],
];

export function SystemIngestionLab(){
  const companion=useCompanion();
  const [scenarioId,setScenarioId]=useState<IngestionScenarioId>("ecommerce");
  const scenario=useMemo(()=>getIngestionScenario(scenarioId),[scenarioId]);
  const [enabled,setEnabled]=useState({...defaultIngestionState.enabled});
  const [mode,setMode]=useState<IngestionMode>("batch");
  const [result,setResult]=useState(()=>runIngestionSimulation(getIngestionScenario("ecommerce"),defaultIngestionState));
  const [running,setRunning]=useState(false);
  const [preview,setPreview]=useState<"raw"|"staging"|"schema">("raw");
  const [logFilter,setLogFilter]=useState<"all"|"errors">("all");

  const toggle=(id:SourceId)=>setEnabled(v=>({...v,[id]:!v[id]}));
  const reset=()=>{setScenarioId("ecommerce");setEnabled({...defaultIngestionState.enabled});setMode("batch");setResult(runIngestionSimulation(getIngestionScenario("ecommerce"),defaultIngestionState));setPreview("raw");setLogFilter("all");};
  const run=()=>{setRunning(true);setTimeout(()=>{const next=runIngestionSimulation(scenario,{enabled,mode});setResult(next);setRunning(false);companion?.emit({type:"exercise_correct",lesson:"Ingestion: Batch, CDC & Events",source:"runner"});},320);};
  const filteredLogs=logFilter==="errors"?result.logLines.filter(x=>x.includes("[DQ]")):result.logLines;

  return <section className="sdi-lab">
    <header className="sdi-sim-header">
      <div className="sdi-sim-heading"><span><Play size={20} fill="currentColor"/></span><div><h2>Interactive Simulation</h2><p>See how batch, CDC, and event ingestion bring data from source systems into a data platform.</p></div></div>
      <div className="sdi-toolbar"><button type="button" className="sdi-reset" onClick={reset}><RefreshCcw size={15}/>Reset</button><button type="button" className="sdi-run" onClick={run} disabled={running}><Play size={15} fill="currentColor"/>{running?"Running…":"Run Simulation"}</button><label className="sdi-scenario"><span>{scenario.label}</span><select value={scenarioId} onChange={e=>setScenarioId(e.target.value as IngestionScenarioId)}>{ingestionScenarios.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select><ChevronDown size={14}/></label></div>
    </header>

    <div className="sdi-workspace">
      <section className="sdi-config">
        <h3>1. Choose Data Sources</h3><p>Select one or more sources to simulate ingestion.</p>
        {(Object.keys(sourceMeta) as SourceId[]).map(id=><SourceRow key={id} id={id} checked={enabled[id]} onToggle={()=>toggle(id)}/>)}
        <h4>Ingestion Options</h4>
        {([["batch","Batch (Scheduled Extract)"],["cdc","CDC (Change Data Capture)"],["events","Event Streaming (Real-time)"]] as const).map(([id,label])=><label key={id} className="sdi-mode"><input type="radio" name="mode" checked={mode===id} onChange={()=>setMode(id)}/><span/>{label}</label>)}
      </section>

      <div className="sdi-main">
        <Pipeline result={result}/>
        <div className="sdi-bottom">
          <section className="sdi-results-panel"><header><h3>3. Simulation Results</h3><span><CheckCircle2 size={14}/>Completed</span></header><div className="sdi-result-grid">
            <ResultCard tone="blue" icon={<Database size={18}/>} label="Total Records Ingested" value={(result.records/1_000_000).toFixed(1)+"M"} detail="↑ 12% vs last run"/>
            <ResultCard tone="purple" icon={<Zap size={18}/>} label="Ingestion Latency" value={result.latencyMin.toFixed(1)+" min"} detail="↓ 40%"/>
            <ResultCard tone="red" icon={<Circle size={18}/>} label="Failed Records" value={result.failed.toLocaleString()} detail="↓ 82%"/>
            <ResultCard tone="cyan" icon={<Gauge size={18}/>} label="Throughput" value={(result.throughput/1000).toFixed(1)+"K"} detail="rec/sec · ↑ 28%"/>
          </div></section>

          <section className="sdi-logs"><header><h3>4. Event Log (Live)</h3><label><select value={logFilter} onChange={e=>setLogFilter(e.target.value as "all"|"errors")}><option value="all">All Events</option><option value="errors">Errors</option></select><ChevronDown size={13}/></label></header><pre>{filteredLogs.map((line,i)=><span key={i}><time>10:24:{String(i+1).padStart(2,"0")}</time>{line}</span>)}</pre></section>

          <section className="sdi-preview"><header><h3>5. Data Preview (Landing Zone)</h3></header><div className="sdi-preview-tabs"><button className={preview==="raw"?"is-active":""} onClick={()=>setPreview("raw")}>Raw Data</button><button className={preview==="staging"?"is-active":""} onClick={()=>setPreview("staging")}>Staging</button><button className={preview==="schema"?"is-active":""} onClick={()=>setPreview("schema")}>Schema</button></div>{preview==="schema"?<div className="sdi-schema"><b>order_id</b> integer<br/><b>customer_id</b> string<br/><b>amount</b> decimal<br/><b>event_time</b> timestamp</div>:<table><thead><tr><th>order_id</th><th>customer_id</th><th>amount</th><th>event_time</th></tr></thead><tbody>{previewRows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{preview==="staging"&&j===1?cell.toLowerCase():cell}</td>)}</tr>)}</tbody></table>}</section>
        </div>
      </div>
    </div>
  </section>;
}

export function SystemIngestionRightRail({lessonTitles,currentLesson,completed,onLesson,onNotes}:{lessonTitles:string[];currentLesson:number;completed:number[];onLesson:(lesson:string)=>void;onNotes:()=>void}){
  return <div className="sdi-right-rail">
    <section className="sdi-progress-card"><header><strong>Lesson Progress <ChevronDown size={14}/></strong><span>{completed.length} / {lessonTitles.length} done</span></header><Progress value={completed.length/lessonTitles.length*100} className="sdi-progress"/><div className="sdi-progress-list">{lessonTitles.map((lesson,index)=>{const done=completed.includes(index),current=index===currentLesson;return <button type="button" key={lesson} className={current?"is-current":""} onClick={()=>onLesson(lesson)}>{done?<CheckCircle2 size={17}/>:current?<Play size={17} fill="currentColor"/>:<Circle size={17}/>}<span>{index+1}. {lesson}</span><small>{done?"Completed":current?"Learning":"Not started"}</small></button>;})}</div></section>
    <section className="sdi-notes-card"><header><Lightbulb size={18}/><strong>Quick Notes</strong><button type="button" onClick={onNotes}>+ Add Note</button></header><p>Jot down key points, questions, or your own notes…</p><div className="sdi-notes-visual"><div><Sparkles size={18}/><span>Batch, CDC and events can coexist in one platform.</span></div><Image src="/nila-avatar.png" alt="Mithoo learning companion" width={88} height={108}/></div></section>
  </div>;
}
