"use client";

import Image from "next/image";
import {useMemo,useState} from "react";
import {
  BarChart3, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Circle,
  Clock3, Database, Gauge, GraduationCap, HardDrive, Layers3, Lightbulb,
  Monitor, Network, Play, RefreshCcw, Server, Settings2, Smartphone, Sparkles,
  Tv, Users, Video, Zap
} from "lucide-react";
import {Progress} from "@/components/ui/progress";
import {useCompanion} from "@/components/companion-context";
import {
  calculateScale, compact, formatPb, getScaleScenario, scaleScenarios,
  type ScaleInputs, type ScaleResult, type ScaleScenarioId
} from "@/lib/system-design-scale-estimation-simulation";

export function SystemScaleEstimationHero({
  description,minutes,currentLesson,total,onPrevious,onNext
}:{description:string;minutes:number;currentLesson:number;total:number;onPrevious:()=>void;onNext:()=>void}){
  return <section className="sdse-hero">
    <div>
      <div className="sdse-breadcrumb"><span>System Design</span><ChevronRight size={14}/><strong>Requirements &amp; Scale Estimation</strong></div>
      <div className="sdse-title-row">
        <span className="sdse-hero-icon"><Zap size={28}/></span>
        <div><h1>Requirements &amp; Scale Estimation</h1><p>{description}</p></div>
      </div>
      <div className="sdse-meta">
        <span><Clock3 size={14}/>{minutes} min</span>
        <span><GraduationCap size={14}/>Lesson {currentLesson+1}/{total}</span>
        <span className="sdse-level">Intermediate</span>
      </div>
    </div>
    <div className="sdse-hero-actions">
      <button type="button" onClick={onPrevious} aria-label="Previous lesson"><ChevronLeft size={18}/></button>
      <button type="button" onClick={onNext} disabled={currentLesson===total-1}>Next <ChevronRight size={17}/></button>
    </div>
  </section>;
}

function NumberInput({label,value,onChange,suffix,step=1,min=0}:{label:string;value:number;onChange:(n:number)=>void;suffix?:string;step?:number;min?:number}){
  return <label className="sdse-field"><span>{label}</span><div><input type="number" value={value} min={min} step={step} onChange={e=>onChange(Number(e.target.value)||0)}/>{suffix&&<small>{suffix}</small>}</div></label>;
}

function ArchitectureFlow({result}:{result:ScaleResult}){
  return <section className="sdse-architecture">
    <header><strong>2. Architecture Flow (Simulated)</strong></header>
    <div className="sdse-flow">
      <div className="sdse-node sdse-clients"><Users size={25}/><strong>Clients</strong><span><Monitor size={14}/>Web</span><span><Smartphone size={14}/>Mobile</span><span><Tv size={14}/>TV App</span><span><Monitor size={14}/>Smart TV</span></div>
      <div className="sdse-flow-arrow"><small>Requests</small><b>→</b><em>~{compact(result.roundedPeakQps)} req/sec<br/>(peak)</em></div>
      <div className="sdse-node sdse-lb"><Network size={29}/><strong>Load Balancer</strong><small>Distributes traffic<br/>across servers</small></div>
      <div className="sdse-arrow">→</div>
      <div className="sdse-node sdse-app"><Server size={31}/><strong>Application<br/>Servers</strong><small>Handles business<br/>logic &amp; APIs</small></div>
      <div className="sdse-branch">
        <div className="sdse-branch-row"><span>↗</span><div className="sdse-node sdse-cache"><Database size={25}/><strong>Cache<br/>(Redis)</strong><small>Hot data<br/>(e.g. metadata)</small></div></div>
        <div className="sdse-branch-row"><span>↘</span><div className="sdse-node sdse-db"><Database size={27}/><strong>Database<br/>(Production)</strong><small>User data,<br/>metadata, transactions</small></div></div>
      </div>
      <div className="sdse-arrow">→</div>
      <div className="sdse-node sdse-storage"><HardDrive size={31}/><strong>Object Storage<br/>(S3)</strong><small>Video files,<br/>media assets</small></div>
    </div>
  </section>;
}

function ResultCard({icon,label,value,detail,tone}:{icon:React.ReactNode;label:string;value:string;detail:string;tone:string}){
  return <article className={"sdse-result "+tone}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{detail}</em></div></article>;
}

export function SystemScaleEstimationLab(){
  const companion=useCompanion();
  const [scenarioId,setScenarioId]=useState<ScaleScenarioId>("video-streaming");
  const scenario=useMemo(()=>getScaleScenario(scenarioId),[scenarioId]);
  const [inputs,setInputs]=useState<ScaleInputs>(()=>({...getScaleScenario("video-streaming").inputs}));
  const [result,setResult]=useState<ScaleResult>(()=>calculateScale(getScaleScenario("video-streaming"),getScaleScenario("video-streaming").inputs));
  const [running,setRunning]=useState(false);
  const [advanced,setAdvanced]=useState(false);
  const [breakdownMode,setBreakdownMode]=useState<"storage"|"daily">("storage");

  const patch=<K extends keyof ScaleInputs>(key:K,value:ScaleInputs[K])=>setInputs(current=>({...current,[key]:value}));
  const chooseScenario=(id:ScaleScenarioId)=>{
    const next=getScaleScenario(id);
    setScenarioId(id);
    setInputs({...next.inputs});
    setResult(calculateScale(next,next.inputs));
  };
  const reset=()=>chooseScenario("video-streaming");
  const run=()=>{
    setRunning(true);
    window.setTimeout(()=>{
      const next=calculateScale(scenario,inputs);
      setResult(next);
      setRunning(false);
      companion?.emit({type:"exercise_correct",lesson:"Requirements & Scale Estimation",source:"runner"});
    },320);
  };

  const total=breakdownMode==="storage"?result.annualRawPb:result.dailyIngestPb;
  const donutSegments=result.breakdown.map((item,index)=>{
    const colors=["#2d7ff0","#7548ee","#f5a019","#14b86a","#f14982"];
    const start=result.breakdown.slice(0,index).reduce((sum,x)=>sum+x.percent,0);
    const end=start+item.percent;
    return `${colors[index]} ${start}% ${end}%`;
  }).join(",");

  return <section className="sdse-lab" aria-label="Requirements and scale estimation interactive simulation">
    <header className="sdse-sim-header">
      <div className="sdse-sim-heading"><span><Play size={20} fill="currentColor"/></span><div><h2>Interactive Simulation</h2><p>Configure your system and see how traffic, storage, and concurrency numbers are estimated step by step.</p></div></div>
      <div className="sdse-toolbar">
        <button className="sdse-reset" type="button" onClick={reset}><RefreshCcw size={15}/>Reset</button>
        <button className="sdse-run" type="button" onClick={run} disabled={running}><Play size={15} fill="currentColor"/>{running?"Calculating…":"Run Simulation"}</button>
        <label className="sdse-scenario"><span>{scenario.label}</span><select value={scenarioId} onChange={e=>chooseScenario(e.target.value as ScaleScenarioId)} aria-label="Scale estimation scenario">{scaleScenarios.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select><ChevronDown size={14}/></label>
      </div>
    </header>

    <div className="sdse-workspace">
      <section className="sdse-config">
        <header><Settings2 size={16}/><strong>1. Configure Your System</strong></header>
        <p>Adjust the inputs below to model your use case.</p>

        <label className="sdse-usecase"><span>Use Case</span><div><Video size={15}/><select value={scenarioId} onChange={e=>chooseScenario(e.target.value as ScaleScenarioId)}>{scaleScenarios.map(item=><option key={item.id} value={item.id}>{item.shortLabel}</option>)}</select><ChevronDown size={14}/></div></label>

        <NumberInput label="Daily Active Users (DAU)" value={inputs.dailyActiveUsers} onChange={v=>patch("dailyActiveUsers",v)} min={1}/>
        <span className="sdse-traffic-badge">{inputs.dailyActiveUsers>=8_000_000?"High traffic":inputs.dailyActiveUsers>=2_000_000?"Medium traffic":"Moderate traffic"}</span>
        <NumberInput label="Avg Requests per User / Day" value={inputs.requestsPerUserPerDay} onChange={v=>patch("requestsPerUserPerDay",v)} min={1}/>

        <label className="sdse-field"><span>Avg Data per Request</span><div><select value={inputs.dataPerRequestMb} onChange={e=>patch("dataPerRequestMb",Number(e.target.value))}><option value={.1}>0.1 MB</option><option value={.5}>0.5 MB</option><option value={1}>1 MB</option><option value={2}>2 MB</option><option value={5}>5 MB</option></select><ChevronDown size={14}/></div></label>
        <label className="sdse-field"><span>Data Retention</span><div><select value={inputs.retentionDays} onChange={e=>patch("retentionDays",Number(e.target.value))}><option value={30}>30 days</option><option value={90}>90 days</option><option value={180}>6 months</option><option value={365}>1 year</option><option value={730}>2 years</option></select><ChevronDown size={14}/></div></label>
        <NumberInput label="Peak Traffic Multiplier" value={inputs.peakMultiplier} onChange={v=>patch("peakMultiplier",v)} suffix="(e.g. 10× for peak hours)" min={1}/>

        <button className="sdse-advanced-toggle" type="button" onClick={()=>setAdvanced(x=>!x)} aria-expanded={advanced}><Settings2 size={15}/>Advanced Options<ChevronDown size={14}/></button>
        {advanced&&<div className="sdse-advanced">
          <NumberInput label="Compression Ratio" value={inputs.compressionRatio} onChange={v=>patch("compressionRatio",v)} suffix="× raw" min={.05} step={.05}/>
          <NumberInput label="Replication Factor" value={inputs.replicationFactor} onChange={v=>patch("replicationFactor",v)} suffix="copies" min={1} step={1}/>
          <p>Planning storage after compression and replication: <b>{formatPb(result.replicatedPb)}</b>.</p>
        </div>}
      </section>

      <div className="sdse-main">
        <ArchitectureFlow result={result}/>

        <section className="sdse-results">
          <h3>3. Estimated Numbers (Results)</h3>
          <div className="sdse-results-grid">
            <ResultCard tone="blue" icon={<Gauge size={19}/>} label="Throughput" value={result.roundedPeakQps.toLocaleString()} detail={"requests / second · "+inputs.peakMultiplier+"× peak"}/>
            <ResultCard tone="purple" icon={<BarChart3 size={19}/>} label="Daily Requests" value={compact(result.dailyRequests)} detail="requests / day"/>
            <ResultCard tone="green" icon={<Database size={19}/>} label="Daily Data Ingest" value={formatPb(result.dailyIngestPb)} detail="per day"/>
            <ResultCard tone="orange" icon={<HardDrive size={19}/>} label="Total Storage" value={formatPb(result.annualRawPb)} detail={"for "+(inputs.retentionDays===365?"1 year":inputs.retentionDays+" days")}/>
          </div>
        </section>

        <div className="sdse-bottom">
          <section className="sdse-calculation">
            <h3>4. Step-by-Step Calculation</h3>
            <ol>
              <li><b>1</b><strong>Daily Requests</strong><span>{inputs.dailyActiveUsers.toLocaleString()} users × {inputs.requestsPerUserPerDay.toLocaleString()} requests = {result.dailyRequests.toLocaleString()} requests/day</span></li>
              <li><b>2</b><strong>Peak QPS</strong><span>{result.dailyRequests.toLocaleString()} ÷ 86,400 × {inputs.peakMultiplier} (peak) ≈ {Math.round(result.peakQps).toLocaleString()} → ~{result.roundedPeakQps.toLocaleString()} req/sec</span></li>
              <li><b>3</b><strong>Daily Data Ingest</strong><span>{result.dailyRequests.toLocaleString()} × {inputs.dataPerRequestMb} MB ≈ {formatPb(result.dailyIngestPb)}/day</span></li>
              <li><b>4</b><strong>Annual Storage</strong><span>{formatPb(result.dailyIngestPb)} × {inputs.retentionDays} days = {formatPb(result.annualRawPb)} (before replication)</span></li>
            </ol>
          </section>

          <section className="sdse-breakdown">
            <header><h3>5. Visual Breakdown</h3><label><select value={breakdownMode} onChange={e=>setBreakdownMode(e.target.value as "storage"|"daily")}><option value="storage">Storage Breakdown</option><option value="daily">Daily Breakdown</option></select><ChevronDown size={13}/></label></header>
            <div className="sdse-breakdown-body">
              <div className="sdse-donut" style={{background:`conic-gradient(${donutSegments})`}}><span><strong>{formatPb(total)}</strong><small>Total</small></span></div>
              <div className="sdse-legend">{result.breakdown.map((item,index)=>{
                const colors=["#2d7ff0","#7548ee","#f5a019","#14b86a","#f14982"];
                const amount=(breakdownMode==="storage"?result.annualRawPb:result.dailyIngestPb)*item.percent/100;
                return <div key={item.label}><i style={{background:colors[index]}}/><span>{item.label}</span><b>{item.percent}% ({formatPb(amount)})</b></div>;
              })}</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </section>;
}

export function SystemScaleEstimationRightRail({
  lessonTitles,currentLesson,completed,onLesson,onNotes
}:{lessonTitles:string[];currentLesson:number;completed:number[];onLesson:(lesson:string)=>void;onNotes:()=>void}){
  return <div className="sdse-right-rail">
    <section className="sdse-progress-card">
      <header><strong>Lesson Progress <ChevronDown size={14}/></strong><span>{completed.length} / {lessonTitles.length} done</span></header>
      <Progress value={completed.length/lessonTitles.length*100} className="sdse-progress"/>
      <div className="sdse-progress-list">{lessonTitles.map((lesson,index)=>{
        const done=completed.includes(index),current=index===currentLesson;
        return <button type="button" key={lesson} className={current?"is-current":""} onClick={()=>onLesson(lesson)}>
          {done?<CheckCircle2 size={17}/>:current?<Play size={17} fill="currentColor"/>:<Circle size={17}/>}
          <span>{index+1}. {lesson}</span><small>{done?"Completed":current?"Learning":"Not started"}</small>
        </button>;
      })}</div>
    </section>

    <section className="sdse-notes-card">
      <header><Lightbulb size={18}/><strong>Quick Notes</strong><button type="button" onClick={onNotes}>+ Add Note</button></header>
      <p>Jot down key points, questions, or your own notes…</p>
      <div className="sdse-notes-visual"><div><Sparkles size={18}/><span>Estimate first. Choose architecture second.</span></div><Image src="/nila-avatar.png" alt="Mithoo learning companion" width={86} height={104}/></div>
    </section>
  </div>;
}
