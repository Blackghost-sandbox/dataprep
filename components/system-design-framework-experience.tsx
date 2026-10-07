"use client";
import {useSystemDesignMotion} from "@/components/system-design-motion";

import {useMemo,useState} from "react";
import {
  Activity, BarChart3, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  Circle, Clock3, Database, Gauge, GraduationCap, HardDrive, Layers3, Lightbulb,
  Monitor, Play, RefreshCcw, Server, Settings2, ShieldCheck, Smartphone, Tv,
  Users, Video, Webhook, Zap,
} from "lucide-react";
import {Progress} from "@/components/ui/progress";
import {useCompanion} from "@/components/companion-context";
import {
  formatCompactNumber,
  getNextSystemScenario,
  getSystemScenario,
  simulateSystemDesign,
  systemDesignScenarios,
  type SystemDesignInputs,
  type SystemScenarioId,
  type SimulationResult,
} from "@/lib/system-design-framework-simulation";

export function SystemDesignFrameworkHero({
  description,minutes,currentLesson,total,onPrevious,onNext
}:{
  description:string;minutes:number;currentLesson:number;total:number;
  onPrevious:()=>void;onNext:()=>void;
}){
  return <section className="sdf-hero">
    <div>
      <div className="sdf-breadcrumb"><span>System Design</span><ChevronRight size={14}/><strong>System Design Framework</strong></div>
      <div className="sdf-title-row">
        <span className="sdf-hero-icon"><Zap size={29}/></span>
        <div><h1>System Design Framework</h1><p>{description}</p></div>
      </div>
      <div className="sdf-meta">
        <span><Clock3 size={14}/>{minutes} min</span>
        <span><GraduationCap size={14}/>Lesson {currentLesson+1}/{total}</span>
        <span className="sdf-level">Beginner</span>
      </div>
    </div>
    <div className="sdf-hero-actions">
      <button type="button" onClick={onPrevious} disabled={currentLesson===0} aria-label="Previous lesson"><ChevronLeft size={18}/></button>
      <button type="button" onClick={onNext} disabled={currentLesson===total-1}>Next <ChevronRight size={17}/></button>
    </div>
  </section>;
}

function NumberField({label,value,onChange,suffix,min=0,step=1}:{label:string;value:number;onChange:(value:number)=>void;suffix?:string;min?:number;step?:number}){
  return <label className="sdf-field"><span>{label}</span><div><input type="number" min={min} step={step} value={value} onChange={e=>onChange(Number(e.target.value)||0)}/>{suffix&&<small>{suffix}</small>}</div></label>;
}

function ArchitectureDiagram({result}:{result:SimulationResult|null}){
  const cache=result?.cacheHitRate??70;
  const latency=result?.averageLatencyMs??120;
  return <section className="sdf-architecture-card">
    <header>
      <strong>2. System Architecture (Live Simulation)</strong>
      <span className="sdf-live-pill"><i/>Live architecture</span>
    </header>
    <div className="sdf-architecture">
      <div className="sdf-node sdf-users">
        <strong>Users</strong>
        <span><Monitor size={16}/>Web</span>
        <span><Smartphone size={16}/>Mobile</span>
        <span><Tv size={16}/>TV App</span>
      </div>
      <div className="sdf-arrow">→</div>
      <div className="sdf-node sdf-lb"><Layers3 size={29}/><strong>Load<br/>Balancer</strong><small>Distributes traffic</small></div>
      <div className="sdf-arrow sdf-purple-arrow">→</div>
      <div className="sdf-node sdf-app"><Server size={31}/><strong>Application<br/>Servers</strong><small>Processes requests</small></div>
      <div className="sdf-split">
        <div className="sdf-split-row"><span>↗</span><div className="sdf-node sdf-cache"><Database size={26}/><strong>Cache (Redis)</strong><small>Hot data · hit {cache.toFixed(0)}%</small></div><span>→</span></div>
        <div className="sdf-split-row"><span>↘</span><div className="sdf-node sdf-db"><Database size={29}/><strong>Database</strong><small>User data + metadata</small></div><span>→</span></div>
      </div>
      <div className="sdf-node sdf-storage"><HardDrive size={32}/><strong>Object Storage (S3)</strong><small>Video, media, assets</small></div>
      <div className="sdf-monitoring">
        <strong>Monitoring &amp; Logging</strong>
        <span><Activity size={14}/>Metrics</span><span><Webhook size={14}/>Logs</span><span><ShieldCheck size={14}/>Alerts</span>
        <small>Observed latency: {latency} ms</small>
      </div>
    </div>
  </section>;
}

function Metric({icon,label,value,detail}:{icon:React.ReactNode;label:string;value:string;detail:string}){
  return <div className="sdf-metric"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{detail}</em></div></div>;
}

export function SystemDesignFrameworkLab(){
  const motion=useSystemDesignMotion("framework");
  const companion=useCompanion();
  const [scenarioId,setScenarioId]=useState<SystemScenarioId>("video-streaming");
  const scenario=useMemo(()=>getSystemScenario(scenarioId),[scenarioId]);
  const [inputs,setInputs]=useState<SystemDesignInputs>(()=>({...getSystemScenario("video-streaming").defaultInputs}));
  const [result,setResult]=useState<SimulationResult|null>(null);
  const [running,setRunning]=useState(false);
  const [advanced,setAdvanced]=useState(false);
  const [mode,setMode]=useState<"live"|"step">("live");
  const [visibleLogCount,setVisibleLogCount]=useState(0);

  const chooseScenario=(id:SystemScenarioId)=>{
    const next=getSystemScenario(id);
    setScenarioId(id);
    setInputs({...next.defaultInputs});
    setResult(null);
    setVisibleLogCount(0);
  };
  const patch=<K extends keyof SystemDesignInputs>(key:K,value:SystemDesignInputs[K])=>setInputs(current=>({...current,[key]:value}));
  const reset=()=>chooseScenario("video-streaming");
  const nextScenario=()=>chooseScenario(getNextSystemScenario(scenarioId));
  const run=()=>{
    setRunning(true);
    setResult(null);
    setVisibleLogCount(0);
    const calculated=simulateSystemDesign(scenario,inputs);
    window.setTimeout(()=>{
      setResult(calculated);
      setVisibleLogCount(mode==="step"?1:calculated.logs.length);
      setRunning(false);
      companion?.emit({type:"exercise_correct",lesson:"System Design Framework",source:"runner"});
    },360);
  };
  const nextStep=()=>{
    if(!result)return;
    setVisibleLogCount(count=>Math.min(result.logs.length,count+1));
  };

  const logs=result?.logs.slice(0,visibleLogCount)??["Ready. Configure the scenario, then run the simulation."];

  return <section {...motion} className="sdf-lab" aria-label="Interactive system design simulation">
    <header className="sdf-sim-header">
      <div className="sdf-sim-heading"><span><Play size={20} fill="currentColor"/></span><div><h2>Interactive Simulation</h2><p>Design and test a real-world system step by step. Modify inputs, run the simulation, and watch data flow through the architecture.</p></div></div>
      <div className="sdf-toolbar">
        <button type="button" className="sdf-reset" onClick={reset}><RefreshCcw size={15}/>Reset</button>
        <button type="button" className="sdf-run" onClick={run} disabled={running}><Play size={15} fill="currentColor"/>{running?"Running…":"Run Simulation"}</button>
        <label className="sdf-scenario-select"><span>{scenario.label}</span><select aria-label="Simulation scenario" value={scenarioId} onChange={e=>chooseScenario(e.target.value as SystemScenarioId)}>{systemDesignScenarios.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select><ChevronDown size={14}/></label>
        <button type="button" className="sdf-next-scenario" onClick={nextScenario}>Next Scenario <ChevronRight size={14}/></button>
      </div>
    </header>

    <div className="sdf-workspace">
      <section className="sdf-config-card">
        <header><span>1</span><strong>Configure Scenario</strong></header>
        <p>Choose a use case and set key parameters like traffic, data volume, and requirements.</p>
        <label className="sdf-usecase"><span>Use Case</span><div><Video size={16}/><select value={scenarioId} onChange={e=>chooseScenario(e.target.value as SystemScenarioId)}>{systemDesignScenarios.map(item=><option value={item.id} key={item.id}>{item.shortLabel}</option>)}</select><ChevronDown size={14}/></div></label>
        <NumberField label="Daily Active Users" value={inputs.dailyActiveUsers} onChange={value=>patch("dailyActiveUsers",value)} min={1}/>
        <div className="sdf-field-note">Current traffic profile: <b>{inputs.dailyActiveUsers>=8_000_000?"High traffic":inputs.dailyActiveUsers>=2_000_000?"Medium traffic":"Moderate traffic"}</b></div>
        <NumberField label="Avg Requests / User / Day" value={inputs.requestsPerUserPerDay} onChange={value=>patch("requestsPerUserPerDay",value)} min={1}/>
        <NumberField label="Avg Data per Request" value={inputs.dataPerRequestMb} onChange={value=>patch("dataPerRequestMb",value)} suffix="MB" min={0.001} step={0.01}/>
        <NumberField label="Read Traffic" value={inputs.readPercent} onChange={value=>patch("readPercent",Math.max(0,Math.min(100,value)))} suffix={"% · Write "+Math.max(0,100-inputs.readPercent)+"%"} min={0}/>
        <button type="button" className="sdf-advanced-toggle" onClick={()=>setAdvanced(value=>!value)} aria-expanded={advanced}><Settings2 size={15}/>Advanced Options<ChevronDown size={14}/></button>
        {advanced&&<div className="sdf-advanced"><NumberField label="Peak factor" value={inputs.peakFactor} onChange={value=>patch("peakFactor",value)} suffix="× avg" min={1} step={0.5}/><p>Peak factor models short bursts above average traffic.</p></div>}
      </section>

      <div className="sdf-simulation-column">
        <div className="sdf-mode-row">
          <button type="button" className={mode==="live"?"is-active":""} onClick={()=>setMode("live")}><i/>Live Mode</button>
          <button type="button" className={mode==="step"?"is-active":""} onClick={()=>setMode("step")}>Step Mode</button>
          {mode==="step"&&result&&visibleLogCount<result.logs.length&&<button type="button" className="sdf-step-next" onClick={nextStep}>Next Step <ChevronRight size={13}/></button>}
        </div>
        <ArchitectureDiagram result={result}/>
        <div className="sdf-bottom-grid">
          <section className="sdf-results-card">
            <header><strong>3. Simulation Results</strong>{result&&<span><CheckCircle2 size={14}/>Completed</span>}</header>
            <div className="sdf-metrics">
              <Metric icon={<Users size={16}/>} label="Total Requests" value={result?formatCompactNumber(result.totalRequestsPerDay):"—"} detail="per day"/>
              <Metric icon={<Gauge size={16}/>} label="Avg Latency" value={result?result.averageLatencyMs+" ms":"—"} detail={result?"derived from current load":"run simulation"}/>
              <Metric icon={<Database size={16}/>} label="Cache Hit Rate" value={result?result.cacheHitRate.toFixed(0)+"%":"—"} detail={result?"read traffic relief":"run simulation"}/>
              <Metric icon={<ShieldCheck size={16}/>} label="Error Rate" value={result?result.errorRate.toFixed(2)+"%":"—"} detail={result&&result.errorRate<0.1?"healthy":"watch capacity"}/>
            </div>
          </section>

          <section className="sdf-logs-card">
            <header><strong>4. Event Logs ({mode==="live"?"Live":"Step"})</strong><span>{result?visibleLogCount+"/"+result.logs.length:"All Events"}</span></header>
            <pre>{logs.map((line,index)=><span key={index}><time>10:24:{String(index+1).padStart(2,"0")}</time>{line}</span>)}</pre>
          </section>

          <section className="sdf-takeaways-card">
            <header><Lightbulb size={18}/><strong>Analysis &amp; Takeaways</strong></header>
            {(result?.takeaways??[
              "Run the scenario to calculate throughput, latency and cache behavior.",
              scenario.takeaway,
            ]).map(item=><div key={item}><Check size={14}/><span>{item}</span></div>)}
          </section>
        </div>
      </div>
    </div>
  </section>;
}

export function SystemDesignFrameworkRightRail({
  lessonTitles,currentLesson,completed,onLesson,onNotes
}:{
  lessonTitles:string[];currentLesson:number;completed:number[];
  onLesson:(lesson:string)=>void;onNotes:()=>void;
}){
  return <div className="sdf-right-rail">
    <section className="sdf-progress-card">
      <header><strong>Lesson Progress <ChevronDown size={14}/></strong><span>{completed.length} / {lessonTitles.length} done</span></header>
      <Progress value={completed.length/lessonTitles.length*100} className="sdf-progress"/>
      <div className="sdf-progress-list">{lessonTitles.map((lesson,index)=>{
        const done=completed.includes(index),current=index===currentLesson;
        return <button type="button" key={lesson} className={current?"is-current":""} onClick={()=>onLesson(lesson)}>
          {done?<CheckCircle2 size={17}/>:current?<Play size={17} fill="currentColor"/>:<Circle size={17}/>}
          <span>{index+1}. {lesson}</span>
          <small>{done?"Completed":current?"Learning":"Not started"}</small>
        </button>;
      })}</div>
    </section>
    <section className="sdf-notes-card">
      <header><Lightbulb size={18}/><strong>Quick Notes</strong><button type="button" onClick={onNotes}>+ Add Note</button></header>
      <p>Jot down key points, questions, or your own notes…</p>
      <div className="sdf-note-art"><BarChart3 size={29}/><span>Requirements → scale → data path → reliability</span></div>
      <button type="button" onClick={onNotes}>Open lesson notes <ChevronRight size={14}/></button>
    </section>
  </div>;
}
