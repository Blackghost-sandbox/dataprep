"use client";
import {useCloudMotion} from "@/components/cloud-motion";

import {useEffect,useMemo,useState} from "react";
import {
  Activity, BarChart3, Brain, CheckCircle2, ChevronLeft, ChevronRight, CircleDot,
  Clock3, Cloud, Database, FileText, GraduationCap, Info, Layers3, Lightbulb,
  LoaderCircle, Monitor, Network, Play, RotateCcw, Server, ShoppingCart, Users
} from "lucide-react";
import {
  advanceCloudSimulation, cloudScenarios, cloudStages, newCloudSimulationState,
  providerLabels, providerServices, scenarioById,
  type CloudProviderId, type CloudScenarioId, type CloudStageId
} from "@/lib/cloud-introduction-simulation";

const stageTone:Record<CloudStageId,string>={
  sources:"blue", ingestion:"violet", storage:"sky", processing:"orange", analytics:"pink", consumers:"green"
};

const stageIcons:Record<CloudStageId,typeof Database>={
  sources:ShoppingCart, ingestion:Network, storage:Database, processing:Server, analytics:BarChart3, consumers:Users
};

const neutralConsumerItems=[
  {label:"Dashboard",Icon:BarChart3},
  {label:"Data Analysts",Icon:Users},
  {label:"ML Models",Icon:Brain},
  {label:"Business Apps",Icon:Monitor},
];

function providerMark(provider:CloudProviderId){
  return provider==="aws"?"AWS":provider==="gcp"?"GCP":"AZ";
}

function stageItems(stage:CloudStageId,scenarioId:CloudScenarioId){
  const scenario=scenarioById(scenarioId);
  if(stage==="sources")return scenario.sources.map((label,index)=>({label,provider:null as CloudProviderId|null,icon:index===0?"db":index===1?"file":"crm"}));
  if(stage==="consumers")return neutralConsumerItems.map(item=>({label:item.label,provider:null as CloudProviderId|null,icon:"consumer"}));
  return (["aws","gcp","azure"] as CloudProviderId[]).map(provider=>({
    label:providerServices[provider][stage].name,
    provider,
    icon:providerMark(provider),
  }));
}

function SourceIcon({kind}:{kind:string}){
  if(kind==="file")return <FileText size={17}/>;
  if(kind==="crm")return <Layers3 size={17}/>;
  return <Database size={17}/>;
}

function CloudStageCard({stage,scenarioId,completed,active,selected,onSelect,onProvider}:{
  stage:CloudStageId;scenarioId:CloudScenarioId;completed:boolean;active:boolean;selected:boolean;
  onSelect:()=>void;onProvider:(provider:CloudProviderId)=>void;
}){
  const meta=cloudStages.find(item=>item.id===stage)!;
  const Icon=stageIcons[stage];
  const items=stageItems(stage,scenarioId);
  return <article className={`cloud-stage-card tone-${stageTone[stage]} ${completed?"is-complete":""} ${selected?"is-selected":""}`}>
    <button className="cloud-stage-heading" onClick={onSelect} aria-pressed={selected}>
      <span><Icon size={15}/>{meta.label}</span>
      {active?<LoaderCircle className="cloud-stage-spinner" size={14}/>:completed?<CheckCircle2 size={14}/>:<CircleDot size={13}/>}
    </button>
    <div className="cloud-stage-items">
      {items.map(item=>{
        const body=<><span className={`cloud-service-icon ${item.provider?"provider-"+item.provider:""}`}>{item.provider?item.icon:<SourceIcon kind={item.icon}/>}</span><span>{item.label}</span></>;
        return item.provider?<button key={item.label} onClick={()=>{onProvider(item.provider!);onSelect();}}>{body}</button>:<div key={item.label}>{body}</div>;
      })}
    </div>
  </article>;
}

function CloudProviderArtwork(){
  return <div className="cloud-hero-art" aria-label="AWS, Google Cloud and Azure map into the same data engineering responsibilities">
    <div className="cloud-provider cloud-provider-aws"><Cloud size={58}/><strong>aws</strong><i/></div>
    <div className="cloud-provider cloud-provider-gcp"><Cloud size={58}/><strong>G</strong><i/></div>
    <div className="cloud-provider cloud-provider-azure"><Cloud size={58}/><strong>A</strong><i/></div>
    <div className="cloud-provider-connectors" aria-hidden="true"><span/><span/><span/></div>
    <div className="cloud-data-engineering-pill">Data Engineering</div>
  </div>;
}

export function CloudIntroductionHero({description,minutes,currentLesson,total,onPrevious,onNext}:{
  description:string;minutes:number;currentLesson:number;total:number;onPrevious:()=>void;onNext:()=>void;
}){
  return <section className="cloud-intro-hero">
    <div className="cloud-intro-breadcrumb"><span>Cloud Platforms</span><ChevronRight size={14}/><strong>Cloud Platforms for Data Engineering</strong></div>
    <div className="cloud-intro-hero-grid">
      <div className="cloud-intro-copy">
        <div className="cloud-title-line"><span className="cloud-title-icon"><Cloud size={34}/></span><div><h1>Cloud Platforms for Data Engineering</h1><p>{description}</p></div></div>
        <div className="cloud-hero-meta"><span><Clock3 size={14}/>{minutes} min</span><span><GraduationCap size={14}/>Lesson {currentLesson+1}/{total}</span><span className="is-beginner"><CircleDot size={12}/>Beginner</span></div>
      </div>
      <div className="cloud-intro-hero-right">
        <div className="cloud-hero-nav"><button onClick={onPrevious} disabled={currentLesson===0}><ChevronLeft size={16}/>Previous</button><button className="is-next" onClick={onNext} disabled={currentLesson===total-1}>Next<ChevronRight size={16}/></button></div>
        <CloudProviderArtwork/>
      </div>
    </div>
  </section>;
}

export function CloudIntroductionLab(){
 const cloudMotion=useCloudMotion(".cloud-pipeline-slot");
  const [scenario,setScenario]=useState<CloudScenarioId>("retail");
  const [provider,setProvider]=useState<CloudProviderId>("aws");
  const [selectedStage,setSelectedStage]=useState<Exclude<CloudStageId,"sources"|"consumers">>("storage");
  const [state,setState]=useState(()=>newCloudSimulationState());
  const [running,setRunning]=useState(false);

  useEffect(()=>{
    if(!running)return;
    if(state.nextStage>=cloudStages.length){setRunning(false);return;}
    const timer=window.setTimeout(()=>setState(previous=>advanceCloudSimulation(previous,scenario,provider)),430);
    return()=>window.clearTimeout(timer);
  },[running,state.nextStage,scenario,provider]);

  const scenarioMeta=useMemo(()=>scenarioById(scenario),[scenario]);
  const detail=providerServices[provider][selectedStage];
  const selectScenario=(value:CloudScenarioId)=>{setScenario(value);setState(newCloudSimulationState());setRunning(false);};
  const reset=()=>{setRunning(false);setState(newCloudSimulationState());};
  const run=()=>{
    if(state.nextStage>=cloudStages.length)setState(newCloudSimulationState());
    setRunning(true);
  };
  const selectStage=(stage:CloudStageId)=>{if(stage!=="sources"&&stage!=="consumers")setSelectedStage(stage);};
  const clearLogs=()=>setState(previous=>({...previous,logs:[]}));

  return <section {...cloudMotion} className="cloud-sim" aria-label="Cloud platforms for data engineering interactive simulation">
    <header className="cloud-sim-toolbar">
      <div className="cloud-sim-title"><span><Play size={21} fill="currentColor"/></span><div><h2>Run Simulation</h2><p>See how a typical data pipeline maps to core cloud services across AWS, Google Cloud, and Azure.</p></div></div>
      <div className="cloud-sim-actions">
        <label><span>Scenario</span><select value={scenario} onChange={e=>selectScenario(e.target.value as CloudScenarioId)}>{cloudScenarios.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <button className="cloud-run" onClick={run} disabled={running}><Play size={15} fill="currentColor"/>{running?"Running...":"Run Simulation"}</button>
        <button onClick={reset}><RotateCcw size={15}/>Reset</button>
      </div>
    </header>

    <div className="cloud-pipeline" role="group" aria-label="Cloud data pipeline stages">
      {cloudStages.map((meta,index)=><div className="cloud-pipeline-slot" key={meta.id}>
        <CloudStageCard stage={meta.id} scenarioId={scenario} completed={state.completed.includes(meta.id)} active={running&&state.nextStage===index} selected={selectedStage===meta.id} onSelect={()=>selectStage(meta.id)} onProvider={setProvider}/>
        {index<cloudStages.length-1&&<div className="cloud-stage-arrow" aria-hidden="true"><span/><ChevronRight size={23}/></div>}
      </div>)}
    </div>

    <div className="cloud-sim-lower">
      <section className="cloud-execution-log">
        <header><h3><Activity size={16}/>Execution Logs</h3><span className={running?"is-live":""}><CircleDot size={10}/>{running?"Live":"Ready"}</span><button onClick={clearLogs}>Clear</button></header>
        <div className="cloud-log-body" aria-live="polite">
          {state.logs.length===0?<p className="cloud-log-empty">Logs cleared. Run the simulation to generate new events.</p>:state.logs.map(log=><p key={log.id} className={`tone-${log.tone}`}><time>[{log.time}]</time><span>{log.text}</span></p>)}
        </div>
      </section>

      <section className="cloud-service-details">
        <header><h3><Info size={16}/>Service Details</h3></header>
        <div className="cloud-provider-tabs" role="tablist" aria-label="Cloud provider">
          {(["aws","gcp","azure"] as CloudProviderId[]).map(id=><button key={id} role="tab" aria-selected={provider===id} className={provider===id?"is-active":""} onClick={()=>setProvider(id)}>{providerLabels[id]}</button>)}
        </div>
        <article className={`cloud-service-detail provider-${provider}`}>
          <div className="cloud-detail-title"><span>{providerMark(provider)}</span><div><h4>{detail.name}</h4><p>{detail.category}</p></div><em>{detail.category}</em></div>
          <p>{detail.description}</p><strong>Common Use Cases:</strong>
          <ul>{detail.uses.map(item=><li key={item}>{item}</li>)}</ul>
        </article>
      </section>

      <section className="cloud-takeaways">
        <header><h3><Lightbulb size={16}/>Key Takeaways</h3></header>
        <ol>
          <li><b>1</b><span><strong>Same Responsibilities, Different Names</strong><small>Storage, compute, networking, security, monitoring exist in all clouds.</small></span></li>
          <li><b>2</b><span><strong>Think in Capabilities, Not Vendors</strong><small>Understand what each service does before memorizing cloud-specific names.</small></span></li>
          <li><b>3</b><span><strong>Data Engineering Core Building Blocks</strong><small>Ingestion → Storage → Processing → Analytics → Consumption.</small></span></li>
          <li><b>4</b><span><strong>Vendor-Neutral Mental Model First</strong><small>Makes it easier to switch between AWS, GCP and Azure.</small></span></li>
        </ol>
      </section>
    </div>

    <footer className="cloud-sim-status"><span><Cloud size={14}/>{state.status}</span><span>{scenarioMeta.volume} · {scenarioMeta.cadence}</span><button onClick={()=>setSelectedStage("storage")}><Database size={13}/>Inspect storage</button></footer>
  </section>;
}
