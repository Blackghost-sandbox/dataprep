"use client";
import {useCloudMotion} from "@/components/cloud-motion";

import {useMemo,useState} from "react";
import {BarChart3,Check,CheckCircle2,ChevronLeft,Cloud,Coins,Database,Gauge,GraduationCap,Layers3,Network,Play,RefreshCcw,Search,ServerCog,ShieldCheck,Sparkles,TimerReset,WalletCards,Zap} from "lucide-react";
import {
  computeModes,costScenarios,defaultCostControls,referenceCostState,servingModes,
  simulateCostReview,storageTiers,type ComputeModeId,type CostControls,
  type CostScenarioId,type OptimizationLeverId,type ServingModeId,type StorageTierId
} from "@/lib/cloud-cost-architecture-simulation";

function CostHeroArtwork(){
  return <div className="ca-hero-art">
    <div className="ca-cloud-dollar"><Cloud size={72}/><span>$</span></div>
    <BarChart3 className="ca-chart" size={74}/>
    <div className="ca-hero-scorecard">
      <span><Coins size={16}/>Cost</span><span><Gauge size={16}/>Performance</span>
      <span><ShieldCheck size={16}/>Reliability</span><span><Layers3 size={16}/>Scalability</span>
    </div>
  </div>;
}

export function CloudCostArchitectureHero({description,minutes,currentLesson,total,onPrevious}:{
  description:string;minutes:number;currentLesson:number;total:number;onPrevious:()=>void;
}){
  return <section className="ca-hero">
    <div className="ca-breadcrumb"><span>Cloud Platforms</span><span>›</span><strong>Cost Optimization &amp; Architecture Review</strong></div>
    <div className="ca-hero-grid">
      <div>
        <div className="ca-title-row"><span className="ca-title-icon"><Zap size={31}/></span><div><h1>Cost Optimization &amp; Architecture Review</h1><p>{description}</p></div></div>
        <div className="ca-meta"><span><TimerReset size={14}/>{minutes} min</span><span><GraduationCap size={14}/>Lesson {currentLesson+1}/{total}</span><span className="is-intermediate"><Sparkles size={13}/>Intermediate</span></div>
      </div>
      <div className="ca-hero-right"><CostHeroArtwork/><button className="ca-previous" onClick={onPrevious}><ChevronLeft size={17}/></button></div>
    </div>
  </section>;
}

const stages=[
  ["green",<Database size={30}/>,"1. Ingest","Right data, right frequency","Optimize input"],
  ["blue",<Database size={30}/>,"2. Store","Lifecycle & right storage tier","Optimize storage"],
  ["violet",<ServerCog size={30}/>,"3. Process","Right compute for workload","Optimize compute"],
  ["orange",<BarChart3 size={30}/>,"4. Serve","Efficient access & caching","Optimize serving"],
  ["cyan",<Search size={30}/>,"5. Observe & Optimize","Monitor, review and iterate","Optimize continuously"],
] as const;

const leverMeta:{id:OptimizationLeverId;title:string;items:string[];tone:string;icon:React.ReactNode}[]=[
  {id:"right-size",title:"Right-size compute",tone:"green",icon:<ServerCog size={23}/>,items:["Match instance type","Use autoscaling","Use serverless where suitable"]},
  {id:"storage",title:"Optimize storage",tone:"violet",icon:<Database size={23}/>,items:["Use tiered storage","Set lifecycle policies","Remove unused data"]},
  {id:"movement",title:"Minimize data movement",tone:"orange",icon:<Network size={23}/>,items:["Keep data in the same region","Join/filter early","Use efficient formats (Parquet)"]},
  {id:"operations",title:"Manage operational cost",tone:"blue",icon:<Gauge size={23}/>,items:["Use managed services","Automate and monitor","Eliminate idle resources"]},
];

function Switch({on,onClick}:{on:boolean;onClick:()=>void}){
  return <button type="button" className={"ca-switch "+(on?"is-on":"")} onClick={onClick}><i/></button>;
}

export function CloudCostArchitectureLab(){
 const cloudMotion=useCloudMotion(".ca-stage");
  const [controls,setControls]=useState<CostControls>(()=>defaultCostControls());
  const [state,setState]=useState(()=>referenceCostState());
  const [running,setRunning]=useState(false);
  const preview=useMemo(()=>simulateCostReview(controls),[controls]);
  const patch=<K extends keyof CostControls>(key:K,value:CostControls[K])=>setControls(prev=>({...prev,[key]:value}));
  const run=()=>{setRunning(true);window.setTimeout(()=>{setState(simulateCostReview(controls));setRunning(false);},360);};
  const reset=()=>{setControls(defaultCostControls());setState(referenceCostState());setRunning(false);};
  const toggleReview=(id:string)=>setState(prev=>({...prev,reviewItems:prev.reviewItems.map(item=>item.id===id?{...item,checked:!item.checked}:item)}));

  return <section {...cloudMotion} className="ca-lab">
    <h2 className="ca-understand"><span>▣</span>Understand Cost Optimization &amp; Architecture Review</h2>

    <section className="ca-map">
      <header className="ca-map-head">
        <div><span className="ca-map-icon">✉</span><div><h3>MAP THE ARCHITECTURE</h3><p>Follow the responsibility from source to storage, compute, serving, and control-plane concerns.</p></div></div>
        <div className="ca-map-actions">
          <label><span>Scenario</span><select value={controls.scenario} onChange={e=>patch("scenario",e.target.value as CostScenarioId)}>{(Object.keys(costScenarios) as CostScenarioId[]).map(id=><option key={id} value={id}>{costScenarios[id].label}</option>)}</select></label>
          <button className="ca-run" onClick={run} disabled={running}><Play size={14} fill="currentColor"/>{running?"Running...":"Run Simulation"}</button>
          <button onClick={reset}><RefreshCcw size={14}/>Reset</button>
        </div>
      </header>

      <div className="ca-stage-flow">{stages.map((stage,index)=><div className="ca-stage-wrap" key={stage[2]}>
        <article className={"ca-stage "+stage[0]}><span className="ca-stage-icon">{stage[1]}</span><strong>{stage[2]}</strong><p>{stage[3]}</p><b>{stage[4]}</b></article>
        {index<stages.length-1&&<span className="ca-flow-arrow">→</span>}
      </div>)}</div>

      <div className="ca-sim-strip">
        <label>Daily Data<input type="range" min="50" max="2000" step="50" value={controls.dailyDataGb} onChange={e=>patch("dailyDataGb",Number(e.target.value))}/><b>{controls.dailyDataGb} GB/day</b></label>
        <label>Retention<input type="range" min="7" max="365" step="7" value={controls.retentionDays} onChange={e=>patch("retentionDays",Number(e.target.value))}/><b>{controls.retentionDays} days</b></label>
        <label>Storage<select value={controls.storageTier} onChange={e=>patch("storageTier",e.target.value as StorageTierId)}>{(Object.keys(storageTiers) as StorageTierId[]).map(id=><option key={id} value={id}>{storageTiers[id].label}</option>)}</select></label>
        <label>Compute<select value={controls.computeMode} onChange={e=>patch("computeMode",e.target.value as ComputeModeId)}>{(Object.keys(computeModes) as ComputeModeId[]).map(id=><option key={id} value={id}>{computeModes[id].label}</option>)}</select></label>
        <label>Serving<select value={controls.servingMode} onChange={e=>patch("servingMode",e.target.value as ServingModeId)}>{(Object.keys(servingModes) as ServingModeId[]).map(id=><option key={id} value={id}>{servingModes[id].label}</option>)}</select></label>
      </div>

      <div className="ca-result-strip">
        <div><WalletCards size={18}/><span><small>Est. Monthly Cost</small><strong>{"$"+state.metrics.monthlyCost.toLocaleString("en-US")}</strong></span></div>
        <div><Coins size={18}/><span><small>Cost / Ingested TB</small><strong>{"$"+state.metrics.costPerTb}</strong></span></div>
        <div><Gauge size={18}/><span><small>Performance</small><strong>{state.metrics.performanceScore}/100</strong></span></div>
        <div><ShieldCheck size={18}/><span><small>Reliability</small><strong>{state.metrics.reliabilityScore}/100</strong></span></div>
        <div><Sparkles size={18}/><span><small>Optimization</small><strong>{state.metrics.optimizationScore}/100</strong></span></div>
      </div>
    </section>

    <div className="ca-bottom-grid">
      <section className="ca-levers">
        <header><h3>▣ Cost Optimization Levers</h3></header>
        <div className="ca-lever-grid">{leverMeta.map(lever=><button key={lever.id} className={"ca-lever "+lever.tone+(state.selectedLever===lever.id?" selected":"")} onClick={()=>setState(prev=>({...prev,selectedLever:lever.id}))}>
          <div>{lever.icon}<strong>{lever.title}</strong></div><ul>{lever.items.map(item=><li key={item}><CheckCircle2 size={14}/>{item}</li>)}</ul>
        </button>)}</div>
        <div className="ca-toggle-row">
          <label><span>Autoscaling</span><Switch on={controls.autoScaling} onClick={()=>patch("autoScaling",!controls.autoScaling)}/></label>
          <label><span>Lifecycle policy</span><Switch on={controls.lifecyclePolicy} onClick={()=>patch("lifecyclePolicy",!controls.lifecyclePolicy)}/></label>
          <label><span>Prune scans</span><Switch on={controls.pruneScans} onClick={()=>patch("pruneScans",!controls.pruneScans)}/></label>
          <label><span>Cross-region traffic</span><Switch on={controls.crossRegion} onClick={()=>patch("crossRegion",!controls.crossRegion)}/></label>
          <label><span>Managed services</span><Switch on={controls.managedServices} onClick={()=>patch("managedServices",!controls.managedServices)}/></label>
          <label><span>Serving cache</span><Switch on={controls.cacheServing} onClick={()=>patch("cacheServing",!controls.cacheServing)}/></label>
        </div>
      </section>

      <section className="ca-review">
        <header><h3>Architecture Review Checklist</h3></header>
        <div className="ca-checklist">{state.reviewItems.map(item=><button key={item.id} onClick={()=>toggleReview(item.id)} className={item.checked?"checked":""}><span>{item.checked?<Check size={13}/>:null}</span>{item.label}</button>)}</div>
        <div className="ca-review-summary"><strong>{state.reviewItems.filter(item=>item.checked).length}/{state.reviewItems.length} reviewed</strong><small>{preview.metrics.scanTb} TB scanned · {preview.metrics.storageTb} TB retained · {preview.metrics.networkGb} GB network</small></div>
      </section>
    </div>

    <section className="ca-recommendations"><header><h3><Sparkles size={15}/>Simulation Recommendations</h3></header><div>{state.recommendations.map((item,index)=><p key={item}><b>{index+1}</b><span>{item}</span></p>)}</div></section>
    <footer className="ca-status"><span><CheckCircle2 size={14}/>{state.status}</span><span>{costScenarios[controls.scenario].label} · {controls.dailyDataGb} GB/day</span></footer>
  </section>;
}
