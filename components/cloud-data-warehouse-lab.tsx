"use client";
import {useCloudMotion} from "@/components/cloud-motion";

import {useMemo,useState} from "react";
import {
  BarChart3, CheckCircle2, ChevronLeft, ChevronRight, Cloud, Copy, Database,
  FileSpreadsheet, GraduationCap, Layers3, Play, RefreshCcw, Server, Sparkles,
  TimerReset, Zap
} from "lucide-react";
import {
  computeWarehouseMetrics, defaultWarehouseControls, loadWarehouseOnly,
  referenceWarehouseState, simulateWarehouse, warehouseProviders, warehouseQuery,
  warehouseResults, warehouseSizes, warehouseSources,
  type WarehouseControls, type WarehouseProviderId, type WarehouseSize,
  type WarehouseSourceId
} from "@/lib/cloud-data-warehouse-simulation";

function WarehouseHeroArtwork(){
  return <div className="dw-hero-art" aria-label="Cloud data warehouse providers connected to a shared analytical warehouse concept">
    <div className="dw-provider redshift"><span>▮▮</span><strong>Amazon<br/>Redshift</strong></div>
    <div className="dw-provider bigquery"><span>Q</span><strong>BigQuery</strong></div>
    <div className="dw-provider snowflake"><span>❄</span><strong>Snowflake</strong></div>
    <div className="dw-provider synapse"><span>⬡</span><strong>Azure<br/>Synapse</strong></div>
    <div className="dw-hero-lines" aria-hidden="true"><i/><i/><i/><i/></div>
    <div className="dw-warehouse-core"><Database size={34}/><strong>Data Warehouse</strong></div>
    <span className="dw-chart c1"><BarChart3 size={20}/></span>
    <span className="dw-chart c2"><BarChart3 size={20}/></span>
  </div>;
}

export function CloudDataWarehouseHero({description,minutes,currentLesson,total,onPrevious,onNext}:{
  description:string;minutes:number;currentLesson:number;total:number;onPrevious:()=>void;onNext:()=>void;
}){
  return <section className="dw-hero">
    <div className="dw-breadcrumb"><span>Cloud Platforms</span><ChevronRight size={14}/><strong>Cloud Data Warehouses</strong></div>
    <div className="dw-hero-grid">
      <div>
        <div className="dw-title-row">
          <span className="dw-title-icon"><Zap size={31}/></span>
          <div><h1>Cloud Data Warehouses</h1><p>{description}</p></div>
        </div>
        <div className="dw-meta">
          <span><TimerReset size={14}/>{minutes} min</span>
          <span><GraduationCap size={14}/>Lesson {currentLesson+1}/{total}</span>
          <span className="is-intermediate"><Sparkles size={13}/>Intermediate</span>
        </div>
      </div>
      <div className="dw-hero-right">
        <div className="dw-hero-nav"><button onClick={onPrevious} disabled={currentLesson===0}><ChevronLeft size={16}/>Previous</button><button className="is-next" onClick={onNext} disabled={currentLesson===total-1}>Next<ChevronRight size={16}/></button></div>
        <WarehouseHeroArtwork/>
      </div>
    </div>
  </section>;
}

function currency(value:number){
  return value.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0});
}

export function CloudDataWarehouseLab(){
 const cloudMotion=useCloudMotion(".dw-stage-grid > .dw-card");
  const [controls,setControls]=useState<WarehouseControls>(()=>defaultWarehouseControls());
  const [state,setState]=useState(()=>referenceWarehouseState());
  const [running,setRunning]=useState(false);
  const [copied,setCopied]=useState(false);

  const provider=warehouseProviders[controls.provider];
  const previewMetrics=useMemo(()=>computeWarehouseMetrics(controls),[controls]);
  const previewResults=useMemo(()=>warehouseResults(controls),[controls]);

  const patch=<K extends keyof WarehouseControls>(key:K,value:WarehouseControls[K])=>{
    setControls(prev=>({...prev,[key]:value}));
  };

  const changeSource=(value:WarehouseSourceId)=>{
    const source=warehouseSources[value];
    setControls(prev=>({...prev,source:value,table:source.table}));
    setState(prev=>({...prev,status:"Source changed. Load the selected data before querying."}));
  };

  const run=()=>{
    setRunning(true);
    window.setTimeout(()=>{
      setState(simulateWarehouse(controls));
      setRunning(false);
    },360);
  };

  const reset=()=>{
    const defaults=defaultWarehouseControls();
    setControls(defaults);
    setState(referenceWarehouseState());
    setRunning(false);
    setCopied(false);
  };

  const copyQuery=async()=>{
    try{
      await navigator.clipboard.writeText(warehouseQuery);
      setCopied(true);
      window.setTimeout(()=>setCopied(false),1200);
    }catch{
      setCopied(false);
    }
  };

  return <section {...cloudMotion} className="dw-lab" aria-label="Cloud data warehouses interactive simulation">
    <header className="dw-toolbar">
      <div className="dw-sim-title"><span><Play size={20} fill="currentColor"/></span><div><h2>Run Simulation</h2><p>See how a cloud data warehouse separates storage and compute, scales for concurrency, and runs analytical queries.</p></div></div>
      <div className="dw-toolbar-actions">
        <label><span>Warehouse Provider</span><select value={controls.provider} onChange={e=>patch("provider",e.target.value as WarehouseProviderId)}>{(Object.keys(warehouseProviders) as WarehouseProviderId[]).map(id=><option key={id} value={id}>{warehouseProviders[id].label}</option>)}</select></label>
        <button className="dw-run" onClick={run} disabled={running}><Play size={15} fill="currentColor"/>{running?"Running...":"Run Simulation"}</button>
        <button onClick={reset}><RefreshCcw size={15}/>Reset</button>
      </div>
    </header>

    <div className="dw-stage-grid">
      <article className="dw-card load">
        <header><span>1</span><div><h3>Load Data</h3><p>Data is loaded from source into the warehouse.</p></div></header>
        <div className="dw-card-body">
          <label>Source<select value={controls.source} onChange={e=>changeSource(e.target.value as WarehouseSourceId)}>{(Object.keys(warehouseSources) as WarehouseSourceId[]).map(id=><option key={id} value={id}>{warehouseSources[id].label}</option>)}</select></label>
          <label>Table<select value={controls.table} onChange={e=>patch("table",e.target.value)}><option value={controls.table}>{controls.table}</option><option value="analytics_orders">analytics_orders</option><option value="warehouse_events">warehouse_events</option></select></label>
          <label className="dw-slider"><span>Rows to load <b>{controls.rowsToLoad.toLocaleString("en-US")}</b></span><input type="range" min="100000" max="3000000" step="100000" value={controls.rowsToLoad} onChange={e=>patch("rowsToLoad",Number(e.target.value))}/></label>
          <button className="dw-primary" onClick={()=>setState(loadWarehouseOnly(controls))}><Layers3 size={14}/>Load Data</button>
        </div>
      </article>

      <div className="dw-arrow"><ChevronRight size={23}/></div>

      <article className="dw-card compute">
        <header><span>2</span><div><h3>Warehouse Compute</h3><p>Separate compute cluster processes the query.</p></div></header>
        <div className="dw-card-body">
          <label>Warehouse Size<select value={controls.warehouseSize} onChange={e=>patch("warehouseSize",e.target.value as WarehouseSize)}>{(Object.keys(warehouseSizes) as WarehouseSize[]).map(size=><option key={size}>{size}</option>)}</select></label>
          <label className="dw-toggle"><span>Auto Scaling</span><button className={controls.autoScaling?"is-on":""} onClick={()=>patch("autoScaling",!controls.autoScaling)} aria-pressed={controls.autoScaling}><i/></button></label>
          <label className="dw-slider"><span>Max Clusters <b>{controls.maxClusters}</b></span><input type="range" min="1" max="8" value={controls.maxClusters} onChange={e=>patch("maxClusters",Number(e.target.value))}/></label>
          <div className="dw-compute-note"><Server size={26}/><span>{provider.computeName} scales {controls.autoScaling?"automatically":"manually"} based on workload</span></div>
        </div>
      </article>

      <div className="dw-arrow"><ChevronRight size={23}/></div>

      <article className="dw-card query">
        <header><span>3</span><div><h3>Execute Analytical Query</h3><p>Run a query on the loaded data.</p></div></header>
        <div className="dw-query-wrap">
          <button className="dw-copy" onClick={copyQuery} title="Copy query"><Copy size={13}/>{copied?"Copied":""}</button>
          <pre><code>{warehouseQuery.replaceAll("sales_raw",controls.table)}</code></pre>
        </div>
        <button className="dw-primary" onClick={run}><Play size={13} fill="currentColor"/>Run Query<ChevronRight size={13}/></button>
      </article>

      <div className="dw-arrow"><ChevronRight size={23}/></div>

      <article className="dw-card results">
        <header><span>4</span><div><h3>View Results</h3><p>Query results and performance metrics.</p></div></header>
        <div className="dw-results-table"><table><thead><tr><th>region</th><th>month</th><th>total_orders</th><th>total_revenue</th></tr></thead><tbody>{(state.queried?state.results:previewResults).map((row,index)=><tr key={row.region+row.month+index}><td>{row.region}</td><td>{row.month}</td><td>{row.totalOrders.toLocaleString("en-US")}</td><td>{currency(row.totalRevenue)}</td></tr>)}</tbody></table></div>
        <div className="dw-result-metrics">
          <div><Zap size={18}/><strong>{(state.queried?state.metrics.queryTimeSeconds:previewMetrics.queryTimeSeconds).toFixed(1)}s</strong><small>Query Time</small></div>
          <div><Database size={18}/><strong>{state.queried?state.metrics.dataScannedMb:previewMetrics.dataScannedMb} MB</strong><small>Data Scanned</small></div>
          <div><Layers3 size={18}/><strong>{state.queried?state.metrics.computeUnits:previewMetrics.computeUnits}</strong><small>{provider.computeMetric}</small></div>
        </div>
      </article>
    </div>

    <div className="dw-lower-grid">
      <section className="dw-separation">
        <header><h3>Storage vs Compute Separation</h3></header>
        <div className="dw-separation-body">
          <div className="dw-layer storage"><strong>Storage Layer</strong><small>Durable, scalable, low cost</small><div><Database size={28}/><FileSpreadsheet size={22}/><FileSpreadsheet size={22}/></div><b>S3 / Blob / GCS</b><em>(Managed by provider)</em></div>
          <div className="dw-independent"><ChevronLeft size={18}/><span>Separate &amp; scale<br/>independently</span><ChevronRight size={18}/></div>
          <div className="dw-layer compute"><strong>Compute Layer</strong><small>Query processing, elastic</small><div><Server size={27}/><Server size={27}/><Server size={27}/></div><b>{provider.computeName}</b><em>{controls.autoScaling?"(Auto-scaling)":"(Manual scaling)"}</em></div>
        </div>
      </section>

      <section className="dw-logs">
        <header><h3>Execution Logs</h3><button onClick={()=>setState(prev=>({...prev,logs:[]}))}>Clear</button></header>
        <div>{state.logs.length===0?<p className="dw-empty">Logs cleared. Run the simulation to generate events.</p>:state.logs.map(log=><p className={`tone-${log.tone}`} key={log.id}><time>[{log.time}]</time><span>{log.text}</span></p>)}</div>
      </section>

      <section className="dw-takeaways">
        <header><h3>Key Takeaways</h3></header>
        <ol>
          <li><b>1</b><span>Separate storage and compute for independent scaling.</span></li>
          <li><b>2</b><span>Optimized for large-scale analytical queries (not OLTP).</span></li>
          <li><b>3</b><span>Concurrency is handled via multiple compute clusters.</span></li>
          <li><b>4</b><span>Partitioning and clustering improve query performance.</span></li>
          <li><b>5</b><span>Costs depend on data scanned and compute usage.</span></li>
        </ol>
      </section>
    </div>

    <footer className="dw-status"><span><CheckCircle2 size={14}/>{state.status}</span><span>{provider.label} · {controls.warehouseSize} · {controls.rowsToLoad.toLocaleString("en-US")} rows</span></footer>
  </section>;
}
