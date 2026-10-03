"use client";

import {useMemo,useState} from "react";
import {
  CheckCircle2, ChevronLeft, ChevronRight, Cloud, Container, Database,
  FileOutput, Gauge, GraduationCap, Play, RefreshCcw, Server,
  Sparkles, TimerReset, Zap
} from "lucide-react";
import {
  computeScenarios, defaultComputeControls, serverlessMemories, simulateCompute, vmTypes,
  type ComputeControls, type ComputeScenarioId, type ContainerOrchestrator,
  type ServerlessMemory, type VmInstanceType, type VmScalingMode
} from "@/lib/cloud-compute-simulation";

function ComputeHeroArtwork(){
  return <div className="cc-hero-art" aria-label="Virtual machines, containers, and serverless execution models">
    <div className="cc-model-tile vm"><span><Server size={36}/></span><strong>Virtual Machines</strong><small>(Full Control)</small></div>
    <div className="cc-model-tile container"><span><Container size={36}/></span><strong>Containers</strong><small>(Portable &amp; Scalable)</small></div>
    <div className="cc-model-tile serverless"><span><Zap size={39}/></span><strong>Serverless</strong><small>(Event Driven)</small></div>
  </div>;
}

export function CloudComputeHero({description,minutes,currentLesson,total,onPrevious,onNext}:{
  description:string;minutes:number;currentLesson:number;total:number;onPrevious:()=>void;onNext:()=>void;
}){
  return <section className="cc-hero">
    <div className="cc-breadcrumb"><span>Cloud Platforms</span><ChevronRight size={14}/><strong>Compute: VMs, Containers &amp; Serverless</strong></div>
    <div className="cc-hero-grid">
      <div className="cc-hero-copy">
        <div className="cc-title-row">
          <span className="cc-title-icon"><Cloud size={30}/></span>
          <div><h1>Compute: VMs, Containers &amp; Serverless</h1><p>{description}</p></div>
        </div>
        <div className="cc-meta">
          <span><TimerReset size={14}/>{minutes} min</span>
          <span><GraduationCap size={14}/>Lesson {currentLesson+1}/{total}</span>
          <span className="is-intermediate"><Sparkles size={13}/>Intermediate</span>
        </div>
      </div>
      <div className="cc-hero-right">
        <div className="cc-hero-nav"><button onClick={onPrevious} disabled={currentLesson===0}><ChevronLeft size={16}/>Previous</button><button className="is-next" onClick={onNext} disabled={currentLesson===total-1}>Next<ChevronRight size={16}/></button></div>
        <ComputeHeroArtwork/>
      </div>
    </div>
  </section>;
}

function CardHeader({kind,title,subtitle}:{kind:"vm"|"container"|"serverless";title:string;subtitle:string}){
  const Icon=kind==="vm"?Server:kind==="container"?Container:Zap;
  return <header><span className="cc-card-icon"><Icon size={18}/></span><div><h3>{title}</h3><p>{subtitle}</p></div><i aria-label="ready"/></header>;
}

function formatCost(cost:number){return "$"+cost.toFixed(3);}

export function CloudComputeLab(){
  const [scenario,setScenario]=useState<ComputeScenarioId>("daily-sales");
  const [controls,setControls]=useState<ComputeControls>(()=>defaultComputeControls());
  const [result,setResult]=useState(()=>simulateCompute(defaultComputeControls(),"daily-sales"));
  const [running,setRunning]=useState(false);

  const preview=useMemo(()=>simulateCompute(controls,scenario),[controls,scenario]);
  const scenarioMeta=computeScenarios.find(item=>item.id===scenario)??computeScenarios[0];

  const patch=<K extends keyof ComputeControls>(key:K,value:ComputeControls[K])=>{
    setControls(previous=>({...previous,[key]:value}));
  };

  const run=()=>{
    setRunning(true);
    window.setTimeout(()=>{
      setResult(simulateCompute(controls,scenario));
      setRunning(false);
    },360);
  };

  const reset=()=>{
    const defaults=defaultComputeControls();
    setScenario("daily-sales");
    setControls(defaults);
    setResult(simulateCompute(defaults,"daily-sales"));
    setRunning(false);
  };

  return <section className="cc-lab" aria-label="Compute VMs containers and serverless interactive simulation">
    <header className="cc-toolbar">
      <div className="cc-sim-title"><span><Play size={20} fill="currentColor"/></span><div><h2>Run Simulation</h2><p>Compare VMs, Containers, and Serverless for the same data processing workload and see how they behave.</p></div></div>
      <div className="cc-toolbar-actions">
        <label><span>Scenario</span><select value={scenario} onChange={e=>setScenario(e.target.value as ComputeScenarioId)}>{computeScenarios.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <button className="cc-run" onClick={run} disabled={running}><Play size={15} fill="currentColor"/>{running?"Running...":"Run Simulation"}</button>
        <button onClick={reset}><RefreshCcw size={15}/>Reset</button>
      </div>
    </header>

    <div className="cc-model-grid">
      <article className="cc-compute-card vm">
        <CardHeader kind="vm" title="Virtual Machines (VMs)" subtitle="Full control, dedicated resources"/>
        <div className="cc-card-body">
          <label>Instance Type<select value={controls.vmInstanceType} onChange={e=>patch("vmInstanceType",e.target.value as VmInstanceType)}>{(Object.keys(vmTypes) as VmInstanceType[]).map(id=><option key={id} value={id}>{vmTypes[id].label}</option>)}</select></label>
          <label>Auto Scaling<select value={controls.vmScaling} onChange={e=>patch("vmScaling",e.target.value as VmScalingMode)}><option>Manual</option><option>Auto Scaling Group</option></select></label>
          <label className="cc-slider"><span>Number of Instances <b>{controls.vmInstances}</b></span><input type="range" min="1" max="8" value={controls.vmInstances} onChange={e=>patch("vmInstances",Number(e.target.value))}/></label>
        </div>
        <footer><span>Estimated Cost (1 hour)</span><strong>{formatCost(preview.vm.cost)}</strong></footer>
      </article>

      <article className="cc-compute-card container">
        <CardHeader kind="container" title="Containers (Docker + Orchestration)" subtitle="Portable, scalable, good for microservices"/>
        <div className="cc-card-body">
          <label>Container Image<input value={controls.containerImage} onChange={e=>patch("containerImage",e.target.value)}/></label>
          <label>Orchestration<select value={controls.orchestrator} onChange={e=>patch("orchestrator",e.target.value as ContainerOrchestrator)}><option>Kubernetes (EKS/GKE/AKS)</option><option>Managed Container Jobs</option><option>ECS / Cloud Run Jobs</option></select></label>
          <label className="cc-slider"><span>Replicas <b>{controls.replicas}</b></span><input type="range" min="1" max="10" value={controls.replicas} onChange={e=>patch("replicas",Number(e.target.value))}/></label>
        </div>
        <footer><span>Estimated Cost (1 hour)</span><strong>{formatCost(preview.container.cost)}</strong></footer>
      </article>

      <article className="cc-compute-card serverless">
        <CardHeader kind="serverless" title="Serverless (Functions)" subtitle="Event-driven, auto-scaling, pay per use"/>
        <div className="cc-card-body">
          <label>Function<select value={controls.functionName} onChange={e=>patch("functionName",e.target.value)}><option>ETL Processor</option><option>File Validator</option><option>Event Enricher</option></select></label>
          <label>Memory<select value={controls.memoryMb} onChange={e=>patch("memoryMb",Number(e.target.value) as ServerlessMemory)}>{serverlessMemories.map(value=><option key={value} value={value}>{value} MB</option>)}</select></label>
          <label className="cc-slider"><span>Expected Invocations <b>{controls.invocations.toLocaleString("en-US")}</b></span><input type="range" min="100" max="5000" step="100" value={controls.invocations} onChange={e=>patch("invocations",Number(e.target.value))}/></label>
        </div>
        <footer><span>Estimated Cost (per run)</span><strong>{formatCost(preview.serverless.cost)}</strong></footer>
      </article>
    </div>

    <div className="cc-middle-grid">
      <section className="cc-flow">
        <header><h3>Execution Flow</h3></header>
        <div className="cc-flow-row">
          <div className="input"><Database size={21}/><span><strong>Input Data</strong><small>{scenarioMeta.input.replace("Input Data ","")}</small></span></div>
          <ChevronRight size={22}/>
          <div className="process"><Gauge size={21}/><span><strong>Processing</strong><small>{scenarioMeta.transform.replace("Processing ","")}</small></span></div>
          <ChevronRight size={22}/>
          <div className="output"><FileOutput size={21}/><span><strong>Write Output</strong><small>{scenarioMeta.output.replace("Write Output ","")}</small></span></div>
        </div>
      </section>

      <section className="cc-results">
        <header><h3>Simulation Results</h3></header>
        <table>
          <thead><tr><th>Metric</th><th className="vm">VMs</th><th className="container">Containers</th><th className="serverless">Serverless</th></tr></thead>
          <tbody>
            <tr><th>Startup Time</th><td>{result.vm.startup}</td><td>{result.container.startup}</td><td>{result.serverless.startup}</td></tr>
            <tr><th>Processing Time</th><td>{result.vm.processingMinutes} min</td><td>{result.container.processingMinutes} min</td><td>{result.serverless.processingMinutes} min</td></tr>
            <tr><th>Scalability</th><td>{result.vm.scalability}</td><td>{result.container.scalability}</td><td>{result.serverless.scalability}</td></tr>
            <tr><th>Isolation</th><td>{result.vm.isolation}</td><td>{result.container.isolation}</td><td>{result.serverless.isolation}</td></tr>
            <tr><th>Estimated Cost</th><td>{formatCost(result.vm.cost)}</td><td>{formatCost(result.container.cost)}</td><td>{formatCost(result.serverless.cost)}</td></tr>
          </tbody>
        </table>
      </section>

      <section className="cc-logs">
        <header><h3>Execution Logs</h3><button onClick={()=>setResult(previous=>({...previous,logs:[]}))}>Clear</button></header>
        <div>{result.logs.length===0?<p className="cc-log-empty">Logs cleared. Run the simulation to generate events.</p>:result.logs.map(log=><p className={`tone-${log.tone}`} key={log.id}><time>[{log.time}]</time><span>{log.text}</span></p>)}</div>
      </section>
    </div>

    <div className="cc-bottom-grid">
      <section className="cc-characteristics">
        <header><h3>Compare Key Characteristics</h3></header>
        <div className="cc-character-row"><strong>Startup Time</strong><span className="vm"><i/>Slow <small>(2–3 min)</small></span><span className="container"><i/>Medium <small>(10–30 sec)</small></span><span className="serverless"><i/>Very Fast <small>(100 ms)</small></span></div>
        <div className="cc-character-row"><strong>Scaling</strong><span className="vm"><i/>Manual</span><span className="container"><i/>Automatic</span><span className="serverless"><i/>Automatic</span></div>
        <div className="cc-character-row"><strong>Best For</strong><span className="vm"><i/>Long-running</span><span className="container"><i/>Microservices</span><span className="serverless"><i/>Event-driven</span></div>
      </section>

      <section className="cc-takeaways">
        <header><h3>Key Takeaways</h3></header>
        <ol>
          <li><b>1</b><span>VMs give full control but require more operational management.</span></li>
          <li><b>2</b><span>Containers provide a portable and scalable way to run applications.</span></li>
          <li><b>3</b><span>Serverless is ideal for intermittent, event-driven workloads.</span></li>
          <li><b>4</b><span>Choose based on workload duration, scaling needs, and operational overhead.</span></li>
        </ol>
      </section>
    </div>

    <footer className="cc-status"><span><CheckCircle2 size={14}/>{result.status}</span><span>{scenarioMeta.label}</span></footer>
  </section>;
}
