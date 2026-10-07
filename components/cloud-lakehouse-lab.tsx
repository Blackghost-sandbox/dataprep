"use client";
import {useCloudMotion} from "@/components/cloud-motion";

import {useMemo,useRef,useState} from "react";
import {
  BarChart3, CheckCircle2, ChevronLeft, ChevronRight, Cloud, Database,
  FileJson, FileSpreadsheet, FileType2, FolderOpen, GraduationCap, Layers3,
  Play, Plus, RefreshCcw, Sparkles, TimerReset, Upload, Zap
} from "lucide-react";
import {
  addSampleLakehouseFile, defaultLakehouseOperations, lakehouseQuery,
  referenceLakehouseState, simulateLakehouse, tableFormatFeatures, tableFormats,
  uploadedFileToLakehouseFile,
  type LakehouseFile, type LakehouseOperationId, type TableFormatId
} from "@/lib/cloud-lakehouse-simulation";

function LakehouseHeroArtwork(){
  return <div className="lh-hero-art" aria-label="Object storage with an open table format layer serving analytics and BI">
    <div className="lh-source-card"><strong>Data Sources</strong><span><FileSpreadsheet size={15}/>Batch Files</span><span><Zap size={15}/>Streaming</span><span><Cloud size={15}/>Applications</span></div>
    <ChevronRight className="lh-a1" size={21}/>
    <div className="lh-object"><Database size={36}/><strong>Object Storage</strong><small>(S3 / ADLS / GCS)</small></div>
    <ChevronRight className="lh-a2" size={21}/>
    <div className="lh-format-layer"><strong>Table Format Layer</strong><div><span>△<small>Delta Lake</small></span><span>◉<small>Apache<br/>Iceberg</small></span><span>◒<small>Apache Hudi</small></span></div></div>
    <ChevronRight className="lh-a3" size={21}/>
    <div className="lh-bi-card"><strong>Analytics &amp; BI</strong><span><BarChart3 size={15}/>SQL Analytics</span><span><Layers3 size={15}/>BI Tools</span><span><Sparkles size={15}/>ML / AI</span></div>
  </div>;
}

export function CloudLakehouseHero({description,minutes,currentLesson,total,onPrevious,onNext}:{
  description:string;minutes:number;currentLesson:number;total:number;onPrevious:()=>void;onNext:()=>void;
}){
  return <section className="lh-hero">
    <div className="lh-breadcrumb"><span>Cloud Platforms</span><ChevronRight size={14}/><strong>Lakehouse &amp; Open Table Formats</strong></div>
    <div className="lh-hero-grid">
      <div>
        <div className="lh-title-row">
          <span className="lh-title-icon"><Zap size={31}/></span>
          <div><h1>Lakehouse &amp; Open Table Formats</h1><p>{description}</p></div>
        </div>
        <div className="lh-meta">
          <span><TimerReset size={14}/>{minutes} min</span>
          <span><GraduationCap size={14}/>Lesson {currentLesson+1}/{total}</span>
          <span className="is-intermediate"><Sparkles size={13}/>Intermediate</span>
        </div>
      </div>
      <div className="lh-hero-right">
        <div className="lh-hero-nav"><button onClick={onPrevious} disabled={currentLesson===0}><ChevronLeft size={16}/>Previous</button><button className="is-next" onClick={onNext} disabled={currentLesson===total-1}>Next<ChevronRight size={16}/></button></div>
        <LakehouseHeroArtwork/>
      </div>
    </div>
  </section>;
}

function FileIcon({file}:{file:LakehouseFile}){
  if(file.type==="Parquet")return <FileType2 size={16}/>;
  if(file.type==="JSON")return <FileJson size={16}/>;
  return <FileSpreadsheet size={16}/>;
}

export function CloudLakehouseLab(){
 const cloudMotion=useCloudMotion(".lh-stage-grid > .lh-card");
  const [format,setFormat]=useState<TableFormatId>("delta");
  const [state,setState]=useState(()=>referenceLakehouseState());
  const [operations,setOperations]=useState(()=>defaultLakehouseOperations());
  const [sampleIndex,setSampleIndex]=useState(0);
  const [running,setRunning]=useState(false);
  const inputRef=useRef<HTMLInputElement>(null);

  const meta=tableFormats[format];
  const results=state.results;
  const features=useMemo(()=>tableFormatFeatures(),[]);

  const run=()=>{
    setRunning(true);
    window.setTimeout(()=>{
      setState(simulateLakehouse({format,files:state.files,operations}));
      setRunning(false);
    },350);
  };

  const reset=()=>{
    setFormat("delta");
    setState(referenceLakehouseState());
    setOperations(defaultLakehouseOperations());
    setSampleIndex(0);
    setRunning(false);
  };

  const addSample=()=>{
    const files=addSampleLakehouseFile(state.files,sampleIndex);
    setSampleIndex(i=>i+1);
    setState(prev=>({...prev,files,status:"Sample object added. Run the simulation to commit a new snapshot."}));
  };

  const addUploadedFiles=(list:FileList|null)=>{
    if(!list?.length)return;
    const incoming=Array.from(list).map((file,index)=>uploadedFileToLakehouseFile(file.name,file.size,index+state.files.length));
    setState(prev=>({...prev,files:[...prev.files,...incoming],status:"Local file metadata added to the simulation. No file contents leave your browser."}));
  };

  const toggleOperation=(id:LakehouseOperationId)=>{
    if(id==="create-table"||id==="append"||id==="acid")return;
    setOperations(prev=>({...prev,[id]:!prev[id]}));
  };

  return <section {...cloudMotion} className="lh-lab" aria-label="Lakehouse and open table formats interactive simulation">
    <header className="lh-toolbar">
      <div className="lh-sim-title"><span><Play size={20} fill="currentColor"/></span><div><h2>Run Simulation</h2><p>See how a table format adds transactions, schema evolution, and consistent reads on top of object storage.</p></div></div>
      <div className="lh-toolbar-actions">
        <label><span>Table Format</span><select value={format} onChange={e=>setFormat(e.target.value as TableFormatId)}>{(Object.keys(tableFormats) as TableFormatId[]).map(id=><option key={id} value={id}>{tableFormats[id].label}{id==="delta"?" (Default)":""}</option>)}</select></label>
        <button className="lh-run" onClick={run} disabled={running}><Play size={15} fill="currentColor"/>{running?"Running...":"Run Simulation"}</button>
        <button onClick={reset}><RefreshCcw size={15}/>Reset</button>
      </div>
    </header>

    <div className="lh-stage-grid">
      <article className="lh-card ingest">
        <header><span>1</span><div><h3>Ingest Data (Object Storage)</h3><p>Upload data files to a data lake (S3/ADLS/GCS).</p></div></header>
        <div className="lh-upload-zone" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();addUploadedFiles(e.dataTransfer.files);}} onClick={()=>inputRef.current?.click()}>
          <Upload size={25}/><span>Drop files here or <b>choose a sample</b></span>
          <input ref={inputRef} type="file" multiple accept=".csv,.json,.parquet" onChange={e=>addUploadedFiles(e.target.files)} hidden/>
        </div>
        <div className="lh-file-list">{state.files.map(file=><div key={file.id}><FileIcon file={file}/><strong>{file.name}</strong><small>{file.sizeMb} MB</small><CheckCircle2 size={16}/></div>)}</div>
        <button className="lh-add-file" onClick={addSample}><Plus size={14}/>Add another file</button>
      </article>

      <div className="lh-arrow"><ChevronRight size={22}/></div>

      <article className="lh-card operations">
        <header><span>2</span><div><h3>Table Format Operations</h3><p>Add transactional table layer ({meta.short}).</p></div></header>
        <div className="lh-operation-list">
          <button className="is-fixed"><Database size={17}/><span>Create table</span><CheckCircle2 size={17}/></button>
          <button className="is-fixed"><FileType2 size={17}/><span>Write data (Append)</span><CheckCircle2 size={17}/></button>
          <button onClick={()=>toggleOperation("schema-evolution")}><Sparkles size={17}/><span>Schema evolution</span><i className={operations["schema-evolution"]?"is-on":""}/></button>
          <button onClick={()=>toggleOperation("time-travel")}><TimerReset size={17}/><span>Time travel (Versioning)</span><i className={operations["time-travel"]?"is-on":""}/></button>
          <button className="is-fixed"><Layers3 size={17}/><span>ACID transactions</span><CheckCircle2 size={17}/></button>
        </div>
      </article>

      <div className="lh-arrow"><ChevronRight size={22}/></div>

      <article className="lh-card query">
        <header><span>3</span><div><h3>Query the Table</h3><p>Run SQL queries on the table.</p></div></header>
        <pre><code>{lakehouseQuery}</code></pre>
        <button className="lh-primary" onClick={run}><Play size={13} fill="currentColor"/>Run Query</button>
      </article>

      <div className="lh-arrow"><ChevronRight size={22}/></div>

      <article className="lh-card results">
        <header><span>4</span><div><h3>Results (Consistent View)</h3><p>Get consistent, real-time results with table semantics.</p></div></header>
        <div className="lh-results-table"><table><thead><tr><th>date</th><th>product</th><th>total_sales</th><th>num_orders</th></tr></thead><tbody>{results.map((row,index)=><tr key={row.date+row.product+index}><td>{row.date}</td><td>{row.product}</td><td>{row.totalSales.toLocaleString("en-US")}</td><td>{row.numOrders.toLocaleString("en-US")}</td></tr>)}</tbody></table></div>
        <div className="lh-query-success"><CheckCircle2 size={22}/><span><strong>Query completed in {state.queryTimeSeconds.toFixed(1)} seconds</strong><small>Using {meta.label} table with optimized metadata</small></span></div>
      </article>
    </div>

    <div className="lh-bottom-grid">
      <section className="lh-comparison">
        <header><h3><Layers3 size={16}/>Table Format Comparison</h3><p>See how different formats provide table semantics on object storage.</p></header>
        <table><thead><tr><th>Feature</th><th>△ Delta Lake</th><th>◉ Apache Iceberg</th><th>◒ Apache Hudi</th></tr></thead><tbody>{features.map(row=><tr key={row.feature}><th>{row.feature}</th><td>✓</td><td>✓</td><td>✓</td></tr>)}<tr><th>Best For</th><td>General Purpose</td><td>Large Scale Analytics</td><td>Incremental Pipelines</td></tr></tbody></table>
      </section>

      <section className="lh-object-vs-table">
        <header><h3><FolderOpen size={16}/>Object Storage vs Table Format</h3><p>Files vs managed tables with metadata and transactions.</p></header>
        <div className="lh-compare-panels">
          <div className="raw"><strong>Raw Files (Object Storage)</strong><ul><li>✕ Just files (CSV, Parquet, JSON)</li><li>✕ No transactions</li><li>✕ No schema enforcement</li><li>✕ No concurrent writes</li><li>✕ Manual partitioning</li><li>✕ Hard to manage metadata</li></ul></div>
          <div className="table"><strong>With Table Format</strong><ul><li>✓ ACID transactions</li><li>✓ Schema evolution</li><li>✓ Concurrent reads/writes</li><li>✓ Time travel &amp; versioning</li><li>✓ Automatic metadata</li><li>✓ SQL table semantics</li></ul></div>
        </div>
      </section>

      <section className="lh-takeaways">
        <header><h3>💡 Key Takeaways</h3></header>
        <ol>
          <li><b>1</b><span>Table formats add transactional and metadata layers on top of object storage.</span></li>
          <li><b>2</b><span>Enable schema evolution and consistent reads across concurrent writers.</span></li>
          <li><b>3</b><span>Support time travel, upserts, and better data management.</span></li>
          <li><b>4</b><span>Delta Lake, Iceberg, and Hudi are open table formats with similar but different strengths.</span></li>
          <li><b>5</b><span>They power modern lakehouse architectures for analytics and ML.</span></li>
        </ol>
      </section>
    </div>

    <footer className="lh-status"><span><CheckCircle2 size={14}/>{state.status}</span><span>{meta.label} · {state.files.length} objects · {operations["schema-evolution"]?"schema evolution on":"schema evolution off"}</span></footer>
  </section>;
}
