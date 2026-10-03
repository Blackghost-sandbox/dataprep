"use client";

import {useMemo,useState} from "react";
import {
  BarChart3, Box, Check, ChevronDown, ChevronLeft, ChevronRight, Cloud, Code2,
  Database, Download, FileJson2, FileText, Folder, FolderOpen, GraduationCap,
  Lightbulb, Play, RotateCcw, Rows3, Server, SlidersHorizontal, Zap
} from "lucide-react";
import {
  generateObjectStorageData, newObjectStorageSimulationState, objectStorageDataSources,
  objectStorageFiles, objectStorageFormats, objectStoragePath, objectStorageProviders,
  objectStorageQuery, objectStorageResult, queryEngines, runObjectStorageSimulation,
  type ObjectStorageDataSourceId, type ObjectStorageFormatId, type ObjectStorageProviderId,
  type QueryEngineId
} from "@/lib/cloud-object-storage-simulation";

function CloudLakeArtwork(){
  return <div className="os-hero-art" aria-label="Cloud object storage services feeding a shared data lake">
    <div className="os-cloud os-aws"><Cloud size={58}/><strong>aws</strong></div>
    <div className="os-cloud os-gcp"><Cloud size={58}/><strong>G</strong></div>
    <div className="os-cloud os-azure"><Cloud size={58}/><strong>A</strong></div>
    <div className="os-art-lines" aria-hidden="true"><i/><i/><i/><b/><b/></div>
    <div className="os-art-lake"><Database size={44}/></div>
    <span className="os-doc d1"><FileJson2 size={19}/></span>
    <span className="os-doc d2"><FileText size={18}/></span>
    <span className="os-doc d3"><FileJson2 size={18}/></span>
    <span className="os-doc d4"><FileText size={17}/></span>
  </div>;
}

export function CloudObjectStorageHero({description,minutes,currentLesson,total,onPrevious,onNext}:{
  description:string;minutes:number;currentLesson:number;total:number;onPrevious:()=>void;onNext:()=>void;
}){
  return <section className="os-hero">
    <div className="os-breadcrumb"><span>Cloud Platforms</span><ChevronRight size={14}/><strong>Object Storage & Data Lakes</strong></div>
    <div className="os-hero-grid">
      <div className="os-hero-copy">
        <div className="os-title-row">
          <span className="os-title-icon"><Zap size={31}/></span>
          <div><h1>Object Storage & Data Lakes</h1><p>{description}</p></div>
        </div>
        <div className="os-meta">
          <span><SlidersHorizontal size={14}/>{minutes} min</span>
          <span><GraduationCap size={14}/>Lesson {currentLesson+1}/{total}</span>
          <span className="os-intermediate"><Box size={13}/>Intermediate</span>
        </div>
      </div>
      <div className="os-hero-right">
        <div className="os-hero-nav"><button onClick={onPrevious} disabled={currentLesson===0}><ChevronLeft size={16}/>Previous</button><button className="is-next" onClick={onNext} disabled={currentLesson===total-1}>Next<ChevronRight size={16}/></button></div>
        <CloudLakeArtwork/>
      </div>
    </div>
  </section>;
}

function FileTree({path,files}:{path:string;files:Array<{name:string;path:string}>}){
  const folders=path.split("/").filter(Boolean);
  return <div className="os-file-tree" aria-label="Data lake folder layout">
    <div className="tree-root"><Folder size={15}/><strong>dataprep-lake</strong></div>
    {folders.map((folder,index)=><div className="tree-folder" style={{paddingLeft:8+index*17}} key={folder+"-"+index}><ChevronDown size={12}/><FolderOpen size={14}/><span>{folder}/</span></div>)}
    {files.map(file=><div className="tree-file" style={{paddingLeft:18+folders.length*17}} key={file.name}><FileJson2 size={13}/><span>{file.name}</span></div>)}
    <div className="tree-more" style={{paddingLeft:18+folders.length*17}}>...</div>
  </div>;
}

function money(value:number){
  return value===0?"—":value.toLocaleString("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2});
}

export function CloudObjectStorageLab(){
  const [provider,setProvider]=useState<ObjectStorageProviderId>("aws");
  const [dataSource,setDataSource]=useState<ObjectStorageDataSourceId>("ecommerce");
  const [format,setFormat]=useState<ObjectStorageFormatId>("json");
  const [volumeMb,setVolumeMb]=useState(100);
  const [bucket,setBucket]=useState("dataprep-lake");
  const [storageClass,setStorageClass]=useState(objectStorageProviders.aws.defaultStorageClass);
  const [pathPrefix,setPathPrefix]=useState("raw");
  const [partitionByDate,setPartitionByDate]=useState(true);
  const [engine,setEngine]=useState<QueryEngineId>("athena");
  const [state,setState]=useState(()=>newObjectStorageSimulationState());

  const providerMeta=objectStorageProviders[provider];
  const sourceMeta=objectStorageDataSources[dataSource];
  const files=useMemo(()=>objectStorageFiles({dataSource,format,partitionByDate,pathPrefix}),[dataSource,format,partitionByDate,pathPrefix]);
  const path=useMemo(()=>objectStoragePath({dataSource,partitionByDate,pathPrefix}),[dataSource,partitionByDate,pathPrefix]);
  const query=useMemo(()=>objectStorageQuery(dataSource),[dataSource]);
  const result=useMemo(()=>objectStorageResult(volumeMb,dataSource),[volumeMb,dataSource]);

  const changeProvider=(next:ObjectStorageProviderId)=>{
    setProvider(next);
    const meta=objectStorageProviders[next];
    setStorageClass(meta.defaultStorageClass);
    setEngine(meta.queryEngine);
    setState(newObjectStorageSimulationState());
  };
  const generate=()=>setState(generateObjectStorageData({dataSource,format,volumeMb}));
  const run=()=>setState(runObjectStorageSimulation({provider,dataSource,format,volumeMb,partitionByDate,pathPrefix,bucket}));
  const reset=()=>{
    setDataSource("ecommerce");setFormat("json");setVolumeMb(100);setBucket("dataprep-lake");
    setStorageClass(objectStorageProviders[provider].defaultStorageClass);setPathPrefix("raw");setPartitionByDate(true);
    setEngine(objectStorageProviders[provider].queryEngine);setState(newObjectStorageSimulationState());
  };
  const runQuery=()=>{
    if(!state.uploaded){
      setState(runObjectStorageSimulation({provider,dataSource,format,volumeMb,partitionByDate,pathPrefix,bucket}));
      return;
    }
    setState(previous=>({...previous,queried:true,status:`${queryEngines[engine].label} returned 1 row from the stored objects.`,logs:[
      ...previous.logs,
      {id:"manual-query-"+previous.logs.length,time:"10:24:19",text:`Running ${queryEngines[engine].label} query...`,tone:"muted"},
      {id:"manual-result-"+previous.logs.length,time:"10:24:21",text:"Query completed successfully ✓",tone:"success"},
    ].slice(-14)}));
  };
  const download=()=>{
    const csv=`date,total_orders,total_revenue\n${result.date},${result.total_orders},${result.total_revenue.toFixed(2)}\n`;
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download="object-storage-query-results.csv";a.click();URL.revokeObjectURL(url);
  };

  return <section className="os-lab" aria-label="Object storage and data lakes interactive simulation">
    <header className="os-toolbar">
      <div className="os-sim-title"><span><Play size={20} fill="currentColor"/></span><div><h2>Run Simulation</h2><p>See how data is ingested, stored and organized in a data lake using object storage (S3, GCS, Azure Blob).</p></div></div>
      <div className="os-toolbar-actions">
        <label><span>Cloud Provider</span><select value={provider} onChange={e=>changeProvider(e.target.value as ObjectStorageProviderId)}>{(Object.keys(objectStorageProviders) as ObjectStorageProviderId[]).map(id=><option key={id} value={id}>{objectStorageProviders[id].label}</option>)}</select></label>
        <button className="os-run" onClick={run}><Play size={15} fill="currentColor"/>Run Simulation</button>
        <button onClick={reset}><RotateCcw size={15}/>Reset</button>
      </div>
    </header>

    <div className="os-stage-grid">
      <article className="os-stage ingest">
        <h3><span>1</span>Ingest Data</h3><p>Simulate data from different sources and formats.</p>
        <label>Data Source<select value={dataSource} onChange={e=>{setDataSource(e.target.value as ObjectStorageDataSourceId);setState(newObjectStorageSimulationState());}}>{(Object.keys(objectStorageDataSources) as ObjectStorageDataSourceId[]).map(id=><option key={id} value={id}>{objectStorageDataSources[id].label}</option>)}</select></label>
        <label>File Format<select value={format} onChange={e=>{setFormat(e.target.value as ObjectStorageFormatId);setState(newObjectStorageSimulationState());}}>{(Object.keys(objectStorageFormats) as ObjectStorageFormatId[]).map(id=><option key={id} value={id}>{objectStorageFormats[id].label}</option>)}</select></label>
        <label className="os-range"><span>Daily Volume <b>{volumeMb} MB</b></span><input type="range" min="50" max="500" step="50" value={volumeMb} onChange={e=>{setVolumeMb(Number(e.target.value));setState(newObjectStorageSimulationState());}}/></label>
        <button className="os-stage-primary" onClick={generate}><Database size={14}/>Generate Data</button>
      </article>

      <div className="os-arrow"><span/><ChevronRight size={22}/></div>

      <article className="os-stage storage">
        <h3><span><Box size={15}/></span>Object Storage</h3><p>Data is stored as objects in a bucket/container.</p>
        <label>{providerMeta.bucketLabel} / Container<select value={bucket} onChange={e=>setBucket(e.target.value)}><option value="dataprep-lake">dataprep-lake</option><option value="analytics-lake">analytics-lake</option></select></label>
        <label>Storage Class<select value={storageClass} onChange={e=>setStorageClass(e.target.value)}>{providerMeta.storageClasses.map(item=><option key={item}>{item}</option>)}</select></label>
        <label>Path Prefix<input value={pathPrefix} onChange={e=>setPathPrefix(e.target.value)} placeholder="raw"/></label>
        <label className="os-check"><input type="checkbox" checked={partitionByDate} onChange={e=>setPartitionByDate(e.target.checked)}/><span><Check size={11}/></span>Partition by date <small title="Organize objects into date prefixes">?</small></label>
      </article>

      <div className="os-arrow"><span/><ChevronRight size={22}/></div>

      <article className="os-stage layout">
        <h3><span><Folder size={15}/></span>Data Lake Layout</h3><p>See how objects are organized in folders (prefixes).</p>
        <FileTree path={path} files={files}/>
      </article>

      <div className="os-arrow"><span/><ChevronRight size={22}/></div>

      <article className="os-stage analyze">
        <h3><span><BarChart3 size={15}/></span>Analyze Data</h3><p>Query the stored data using different tools.</p>
        <div className="os-engine-tabs" role="tablist">{(Object.keys(queryEngines) as QueryEngineId[]).map(id=><button key={id} role="tab" aria-selected={engine===id} className={engine===id?"is-active":""} onClick={()=>setEngine(id)}>{queryEngines[id].label}</button>)}</div>
        <pre className="os-query"><code>{query}</code></pre>
        <button className="os-query-run" onClick={runQuery}><Play size={13} fill="currentColor"/>Run Query</button>
      </article>
    </div>

    <div className="os-lower-grid">
      <section className="os-logs">
        <header><h3>Execution Logs</h3><button onClick={()=>setState(previous=>({...previous,logs:[]}))}>Clear</button></header>
        <div>{state.logs.length===0?<p className="os-empty-log">Logs cleared. Run the simulation to generate new events.</p>:state.logs.map(log=><p className={`tone-${log.tone}`} key={log.id}><time>[{log.time}]</time><span>{log.text}</span></p>)}</div>
      </section>

      <section className="os-results">
        <header><h3>Query Results</h3><button onClick={download}><Download size={13}/>Download</button></header>
        <table><thead><tr><th>date</th><th>total_orders</th><th>total_revenue</th></tr></thead><tbody>{state.queried?<tr><td>{result.date}</td><td>{result.total_orders.toLocaleString("en-US")}</td><td>{money(result.total_revenue)}</td></tr>:<tr className="is-placeholder"><td colSpan={3}>Run the query to see results</td></tr>}</tbody></table>
      </section>

      <section className="os-takeaways">
        <header><h3>Key Takeaways</h3></header>
        <ol>
          <li><b>1</b><span><strong>Object storage is durable, scalable, and cost-effective.</strong></span></li>
          <li><b>2</b><span><strong>Data lakes use folders (prefixes) to organize data.</strong><small>(e.g., year/month/day).</small></span></li>
          <li><b>3</b><span><strong>File format and partitioning significantly impact query performance.</strong></span></li>
          <li><b>4</b><span><strong>The same storage can be used with multiple query engines.</strong><small>(Athena, BigQuery, Synapse).</small></span></li>
        </ol>
      </section>
    </div>

    <footer className="os-status"><span><Rows3 size={14}/>{state.status}</span><span>{providerMeta.service} · {sourceMeta.label} · {objectStorageFormats[format].label}</span><span className={state.queried?"is-ok":""}>{state.queried?"Query complete":"Waiting"}</span></footer>
  </section>;
}
