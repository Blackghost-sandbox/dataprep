"use client";
import {useCloudMotion} from "@/components/cloud-motion";

import {useMemo,useState} from "react";
import {
  BarChart3, CheckCircle2, ChevronLeft, ChevronRight, Cloud, Database, FileJson,
  FileSpreadsheet, FileType2, Gauge, GraduationCap, HardDrive, Layers3, Play,
  RefreshCcw, ServerCog, Sparkles, TimerReset, Zap
} from "lucide-react";
import {
  computeSparkMetrics, defaultSparkControls, formatDuration, referenceSparkState,
  simulateSpark, sparkDataSources, sparkOutputPath, sparkScenarios, workerTypes,
  type SparkClusterType, type SparkControls, type SparkDataSourceId,
  type SparkFileFormat, type SparkScenarioId, type SparkWorkerType
} from "@/lib/cloud-managed-spark-simulation";

function SparkHeroArtwork(){
  return <div className="ms-hero-art" aria-label="Files and data processed by Spark into transformed scalable output">
    <div className="ms-files">
      <span className="csv"><FileSpreadsheet size={24}/><small>CSV</small></span>
      <span className="json"><FileJson size={24}/><small>JSON</small></span>
      <span className="parquet"><FileType2 size={24}/><small>Parquet</small></span>
    </div>
    <div className="ms-data"><Database size={34}/><small>Data</small></div>
    <div className="ms-spark"><Zap size={37}/><strong>Spark</strong></div>
    <div className="ms-art-lines" aria-hidden="true"><i/><i/><i/></div>
    <div className="ms-art-actions">
      <span><ServerCog size={22}/><strong>Transform</strong></span>
      <span><BarChart3 size={22}/><strong>Scale</strong></span>
      <span><Database size={22}/><strong>Write Output</strong></span>
    </div>
  </div>;
}

export function CloudManagedSparkHero({description,minutes,currentLesson,total,onPrevious,onNext}:{
  description:string;minutes:number;currentLesson:number;total:number;onPrevious:()=>void;onNext:()=>void;
}){
  return <section className="ms-hero">
    <div className="ms-breadcrumb"><span>Cloud Platforms</span><ChevronRight size={14}/><strong>Managed Batch &amp; Spark Processing</strong></div>
    <div className="ms-hero-grid">
      <div>
        <div className="ms-title-row"><span className="ms-title-icon"><Zap size={31}/></span><div><h1>Managed Batch &amp; Spark Processing</h1><p>{description}</p></div></div>
        <div className="ms-meta"><span><TimerReset size={14}/>{minutes} min</span><span><GraduationCap size={14}/>Lesson {currentLesson+1}/{total}</span><span className="is-intermediate"><Sparkles size={13}/>Intermediate</span></div>
      </div>
      <div className="ms-hero-right">
        <div className="ms-hero-nav"><button onClick={onPrevious} disabled={currentLesson===0}><ChevronLeft size={16}/>Previous</button><button className="is-next" onClick={onNext} disabled={currentLesson===total-1}>Next<ChevronRight size={16}/></button></div>
        <SparkHeroArtwork/>
      </div>
    </div>
  </section>;
}

function StageStatus({status}:{status:"complete"|"running"|"waiting"}){
  return status==="complete"?<CheckCircle2 size={18}/>:status==="running"?<span className="ms-ring"/>:<span className="ms-wait"/>;
}

function formatRecords(value:number){
  if(value>=1_000_000)return (value/1_000_000).toFixed(value%1_000_000===0?0:1)+" M";
  if(value>=1_000)return (value/1_000).toFixed(0)+" K";
  return String(value);
}

export function CloudManagedSparkLab(){
 const cloudMotion=useCloudMotion(".ms-stage-grid > .ms-card");
  const [controls,setControls]=useState<SparkControls>(()=>defaultSparkControls());
  const [state,setState]=useState(()=>referenceSparkState());
  const [running,setRunning]=useState(false);

  const liveMetrics=useMemo(()=>computeSparkMetrics(controls),[controls]);
  const outputPath=useMemo(()=>sparkOutputPath(controls),[controls]);

  const patch=<K extends keyof SparkControls>(key:K,value:SparkControls[K])=>setControls(prev=>({...prev,[key]:value}));

  const run=()=>{
    setRunning(true);
    setState(prev=>({...prev,status:"Submitting managed Spark job...",stages:[
      {id:"read",label:"Read Data",status:"running",duration:"Running..."},
      {id:"transform",label:"Transform",status:"waiting",duration:"Waiting"},
      {id:"shuffle",label:"Shuffle",status:"waiting",duration:"Waiting"},
      {id:"write",label:"Write Output",status:"waiting",duration:"Waiting"},
    ]}));
    window.setTimeout(()=>{setState(simulateSpark(controls));setRunning(false);},420);
  };

  const reset=()=>{
    const defaults=defaultSparkControls();
    setControls(defaults);
    setState(referenceSparkState());
    setRunning(false);
  };

  return <section {...cloudMotion} className="ms-lab" aria-label="Managed batch and Spark processing interactive simulation">
    <header className="ms-toolbar">
      <div className="ms-sim-title"><span><Play size={20} fill="currentColor"/></span><div><h2>Run Simulation</h2><p>See how a managed Spark job processes data, scales automatically, and writes the output.</p></div></div>
      <div className="ms-toolbar-actions">
        <label><span>Scenario</span><select value={controls.scenario} onChange={e=>patch("scenario",e.target.value as SparkScenarioId)}>{sparkScenarios.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <button className="ms-run" onClick={run} disabled={running}><Play size={15} fill="currentColor"/>{running?"Running...":"Run Simulation"}</button>
        <button onClick={reset}><RefreshCcw size={15}/>Reset</button>
      </div>
    </header>

    <div className="ms-stage-grid">
      <article className="ms-card input">
        <header><span><Database size={18}/></span><div><h3>Input Data (Storage)</h3><p>Choose data source and format</p></div></header>
        <div className="ms-card-body">
          <label>Data Source<select value={controls.dataSource} onChange={e=>patch("dataSource",e.target.value as SparkDataSourceId)}>{(Object.keys(sparkDataSources) as SparkDataSourceId[]).map(id=><option key={id} value={id}>{sparkDataSources[id].label}</option>)}</select></label>
          <label>File Format<select value={controls.fileFormat} onChange={e=>patch("fileFormat",e.target.value as SparkFileFormat)}><option>Parquet</option><option>JSON</option><option>CSV</option></select></label>
          <label className="ms-slider"><span>Data Size <b>{controls.dataSizeGb} GB</b></span><input type="range" min="1" max="20" value={controls.dataSizeGb} onChange={e=>patch("dataSizeGb",Number(e.target.value))}/></label>
        </div>
      </article>

      <article className="ms-card spark">
        <header><span><ServerCog size={18}/></span><div><h3>Managed Spark Job</h3><p>Configure cluster and job behavior</p></div></header>
        <div className="ms-card-body">
          <label>Cluster Type<select value={controls.clusterType} onChange={e=>patch("clusterType",e.target.value as SparkClusterType)}><option>Serverless (EMR Serverless)</option><option>Ephemeral Job Cluster</option><option>Long-lived Cluster</option></select></label>
          <label>Worker Type<select value={controls.workerType} onChange={e=>patch("workerType",e.target.value as SparkWorkerType)}>{(Object.keys(workerTypes) as SparkWorkerType[]).map(id=><option key={id}>{id}</option>)}</select></label>
          <label className="ms-toggle"><span>Auto Scaling</span><button className={controls.autoScaling?"is-on":""} onClick={()=>patch("autoScaling",!controls.autoScaling)} aria-pressed={controls.autoScaling}><i/></button></label>
          <div className="ms-worker-sliders"><label><span>Min Workers <b>{controls.minWorkers}</b></span><input type="range" min="1" max="6" value={controls.minWorkers} onChange={e=>patch("minWorkers",Math.min(Number(e.target.value),controls.maxWorkers))}/></label><label><span>Max Workers <b>{controls.maxWorkers}</b></span><input type="range" min="4" max="20" value={controls.maxWorkers} onChange={e=>patch("maxWorkers",Math.max(Number(e.target.value),controls.minWorkers))}/></label></div>
        </div>
      </article>

      <article className="ms-card stages">
        <header><span><Layers3 size={18}/></span><div><h3>Processing (Spark Stages)</h3><p>Watch the pipeline execution</p></div></header>
        <div className="ms-stage-list">{state.stages.map(stage=><div key={stage.id} className={`stage-${stage.status}`}><StageStatus status={stage.status}/><strong>{stage.label}</strong><small>{stage.duration}</small></div>)}</div>
      </article>

      <article className="ms-card output">
        <header><span><HardDrive size={18}/></span><div><h3>Output (Data Lake)</h3><p>Result written to storage</p></div></header>
        <div className="ms-card-body">
          <label>Target<select value={controls.target} onChange={e=>patch("target",e.target.value as SparkDataSourceId)}>{(Object.keys(sparkDataSources) as SparkDataSourceId[]).map(id=><option key={id} value={id}>{sparkDataSources[id].short} (data-lake)</option>)}</select></label>
          <label>Output Format<select value={controls.outputFormat} onChange={e=>patch("outputFormat",e.target.value as SparkFileFormat)}><option>Parquet</option><option>JSON</option><option>CSV</option></select></label>
          <label>Partition By<select value={controls.partitionBy} onChange={e=>patch("partitionBy",e.target.value as SparkControls["partitionBy"])}><option value="date">date</option><option value="region">region</option><option value="none">none</option></select></label>
          <div className="ms-output-path"><Database size={27}/><code>{outputPath}</code></div>
        </div>
      </article>
    </div>

    <div className="ms-lower-grid">
      <section className="ms-cluster">
        <header><h3><Gauge size={16}/>Cluster Details (Live)</h3></header>
        <div className="ms-cluster-cards">
          <div><strong>Workers</strong><span>♟</span><b>{liveMetrics.workers} / {controls.maxWorkers}</b><small>{controls.autoScaling?"Auto scaling":"Fixed"}</small></div>
          <div><strong>Total vCPU</strong><span>⚙</span><b>{liveMetrics.totalVcpu}</b><small>({liveMetrics.workers} × {workerTypes[controls.workerType].vcpu})</small></div>
          <div><strong>Total Memory</strong><span>▣</span><b>{liveMetrics.totalMemoryGb} GB</b><small>({liveMetrics.workers} × {workerTypes[controls.workerType].memory} GB)</small></div>
          <div><strong>Cluster State</strong><span>〽</span><b className="running">Running</b><small>Healthy</small></div>
        </div>
      </section>

      <section className="ms-logs">
        <header><h3>Execution Logs</h3><button onClick={()=>setState(prev=>({...prev,logs:[]}))}>Clear</button></header>
        <div>{state.logs.length===0?<p className="ms-empty">Logs cleared. Run the simulation to generate events.</p>:state.logs.map(log=><p className={`tone-${log.tone}`} key={log.id}><time>[{log.time}]</time><span>{log.text}</span></p>)}</div>
      </section>

      <section className="ms-metrics">
        <header><h3><BarChart3 size={16}/>Job Metrics</h3></header>
        <dl>
          <div><dt>Total Records</dt><dd>{formatRecords(state.metrics.totalRecords)}</dd></div>
          <div><dt>Processing Time</dt><dd>{formatDuration(state.metrics.processingSeconds)}</dd></div>
          <div><dt>Throughput</dt><dd>{Math.round(state.metrics.throughput/1000)}K records/sec</dd></div>
          <div><dt>Data Read</dt><dd>{state.metrics.dataReadGb.toFixed(1)} GB</dd></div>
          <div><dt>Data Written</dt><dd>{Math.round(state.metrics.dataWrittenGb*1000)} MB</dd></div>
          <div><dt>Cost (estimated)</dt><dd className="cost">{"$"+state.metrics.estimatedCost.toFixed(3)}</dd></div>
        </dl>
      </section>
    </div>

    <section className="ms-takeaways">
      <header><h3>💡 Key Takeaways</h3></header>
      <ol>
        <li><b>1</b><span>Managed Spark removes infrastructure management overhead.</span></li>
        <li><b>2</b><span>Choose the right cluster type based on workload and cost.</span></li>
        <li><b>3</b><span>Auto scaling handles variable data sizes and improves cost efficiency.</span></li>
        <li><b>4</b><span>Use partitioning and optimized formats (Parquet) for better performance.</span></li>
      </ol>
    </section>

    <footer className="ms-status"><span><CheckCircle2 size={14}/>{state.status}</span><span>{sparkScenarios.find(item=>item.id===controls.scenario)?.label}</span></footer>
  </section>;
}
