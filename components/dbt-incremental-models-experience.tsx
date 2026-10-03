"use client";

import {useMemo,useState} from "react";
import {
  ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, ChevronLeft,
  ChevronRight, Circle, Clock3, Database, Edit3, GraduationCap, KeyRound,
  Lightbulb, Merge, Play, RefreshCcw, Rows3, Settings2, Table2, Upload,
  Zap
} from "lucide-react";
import {Progress} from "@/components/ui/progress";
import {useCompanion} from "@/components/companion-context";
import {
  buildIncrementalSql,
  cloneIncrementalRows,
  dbtIncrementalDatasets,
  getChangeType,
  getDbtIncrementalDataset,
  runDbtIncrementalMerge,
  type DbtIncrementalDatasetId,
  type DbtIncrementalRow,
  type DbtIncrementalRunResult,
} from "@/lib/dbt-incremental-models-simulation";

export function DbtIncrementalHero({
  description,minutes,currentLesson,total,onPrevious,onNext
}:{
  description:string;minutes:number;currentLesson:number;total:number;
  onPrevious:()=>void;onNext:()=>void;
}){
  return <section className="dbti-hero">
    <div className="dbti-hero-copy">
      <div className="dbti-breadcrumb"><span>dbt</span><ChevronRight size={14}/><strong>Incremental Models</strong></div>
      <div className="dbti-title-row">
        <span className="dbti-hero-icon"><Zap size={30}/></span>
        <div><h1>Incremental Models</h1><p>{description}</p></div>
      </div>
      <div className="dbti-meta"><span><Clock3 size={15}/>{minutes} min</span><span><GraduationCap size={15}/>Lesson {currentLesson+1}/{total}</span></div>
    </div>
    <div className="dbti-hero-side">
      <span className="dbti-level">Intermediate</span>
      <div className="dbti-watermark" aria-hidden="true">M</div>
      <div className="dbti-nav">
        <button onClick={onPrevious} disabled={currentLesson===0} aria-label="Previous lesson"><ChevronLeft size={18}/></button>
        <button onClick={onNext} disabled={currentLesson===total-1}>Next <ChevronRight size={17}/></button>
      </div>
    </div>
  </section>;
}

function MiniTable({
  rows,
  statusByKey,
}:{
  rows:DbtIncrementalRow[];
  statusByKey?:Map<string,"updated"|"inserted">;
}){
  return <div className="dbti-mini-table"><table>
    <thead><tr><th>order_id</th><th>customer_id</th><th>order_date</th><th>amount</th></tr></thead>
    <tbody>{rows.map(row=>{
      const status=statusByKey?.get(row.order_id);
      return <tr key={row.order_id} className={status?"is-"+status:""}>
        <td>{row.order_id}</td><td>{row.customer_id}</td><td>{row.order_date}</td><td>{row.amount}</td>
        {status==="inserted"&&<td className="dbti-new-tag">NEW</td>}
      </tr>;
    })}</tbody>
  </table></div>;
}

function EditableIncomingTable({
  rows,onRows,existing,editing
}:{
  rows:DbtIncrementalRow[];
  onRows:(rows:DbtIncrementalRow[])=>void;
  existing:DbtIncrementalRow[];
  editing:boolean;
}){
  const update=(index:number,key:"order_id"|"customer_id"|"order_date"|"amount",value:string)=>{
    onRows(rows.map((row,rowIndex)=>rowIndex===index?{...row,[key]:value}:row));
  };
  return <div className="dbti-edit-table"><table>
    <thead><tr><th>order_id</th><th>customer_id</th><th>order_date</th><th>amount</th><th>type</th></tr></thead>
    <tbody>{rows.map((row,index)=>{
      const kind=getChangeType(existing,row);
      return <tr key={index} className={"is-"+kind}>
        {(["order_id","customer_id","order_date","amount"] as const).map(key=><td key={key}>
          {editing?<input value={row[key]} onChange={e=>update(index,key,e.target.value)} aria-label={key+" incoming row "+(index+1)}/>:<span>{row[key]||"NULL"}</span>}
        </td>)}
        <td><small>{kind==="update"?"UPDATE":kind==="insert"?"NEW":"UNCHANGED"}</small></td>
      </tr>;
    })}</tbody>
  </table></div>;
}

function IncrementalFlow({
  dataset,
}:{
  dataset:ReturnType<typeof getDbtIncrementalDataset>;
}){
  const defaultResult=runDbtIncrementalMerge(dataset,dataset.incoming);
  const statuses=new Map(defaultResult.rows.filter(row=>row.status!=="unchanged").map(row=>[row.order_id,row.status as "updated"|"inserted"]));

  return <section className="dbti-explainer">
    <header className="dbti-section-head">
      <h2><BookOpen size={21}/>How incremental models work in the dbt flow</h2>
      <p>Incremental models only process new or changed records and merge them into the existing table using a unique key.</p>
    </header>

    <div className="dbti-flow">
      <div className="dbti-left-stack">
        <article className="dbti-flow-card dbti-source-card">
          <header><span><Table2 size={18}/></span><strong>Source ({dataset.sourceName})</strong></header>
          <MiniTable rows={dataset.existing}/>
        </article>
        <article className="dbti-flow-card dbti-change-card">
          <header><span><Upload size={18}/></span><strong>New / Changed Data</strong></header>
          <MiniTable rows={dataset.incoming}/>
        </article>
      </div>

      <div className="dbti-merge-arrow"><Merge size={28}/><ArrowRight size={27}/></div>

      <article className="dbti-incremental-card">
        <header><span><Database size={20}/></span><strong>Incremental Model<br/>({dataset.modelName})</strong></header>
        <div className="dbti-rules">
          <div><KeyRound size={17}/><span>Unique key: <b>{dataset.uniqueKey}</b></span></div>
          <div><Settings2 size={17}/><span>Process only new/changed rows</span></div>
          <div><Merge size={17}/><span>Merge into existing table</span></div>
          <div><Clock3 size={17}/><span>Handle late-arriving data</span></div>
        </div>
      </article>

      <ArrowRight className="dbti-final-arrow" size={30}/>

      <article className="dbti-flow-card dbti-final-card">
        <header><span><Table2 size={18}/></span><strong>Final Table ({dataset.modelName})</strong></header>
        <MiniTable rows={defaultResult.rows} statusByKey={statuses}/>
        <div className="dbti-legend"><span><i className="updated"/>Updated row (merged)</span><span><i className="inserted"/>New row (inserted)</span></div>
      </article>
    </div>
  </section>;
}

export function DbtIncrementalModelsLab(){
  const companion=useCompanion();
  const [datasetId,setDatasetId]=useState<DbtIncrementalDatasetId>("ecommerce");
  const dataset=useMemo(()=>getDbtIncrementalDataset(datasetId),[datasetId]);
  const [incoming,setIncoming]=useState<DbtIncrementalRow[]>(()=>cloneIncrementalRows(getDbtIncrementalDataset("ecommerce").incoming));
  const [editing,setEditing]=useState(false);
  const [running,setRunning]=useState(false);
  const [result,setResult]=useState<DbtIncrementalRunResult|null>(null);
  const sql=useMemo(()=>buildIncrementalSql(dataset),[dataset]);

  const changeDataset=(id:DbtIncrementalDatasetId)=>{
    const next=getDbtIncrementalDataset(id);
    setDatasetId(id);
    setIncoming(cloneIncrementalRows(next.incoming));
    setEditing(false);
    setResult(null);
    setRunning(false);
  };
  const reset=()=>{
    setIncoming(cloneIncrementalRows(dataset.incoming));
    setEditing(false);
    setResult(null);
    setRunning(false);
  };
  const run=()=>{
    setRunning(true);
    setResult(null);
    window.setTimeout(()=>{
      const next=runDbtIncrementalMerge(dataset,incoming);
      setResult(next);
      setRunning(false);
      companion?.emit({type:"exercise_correct",lesson:"Incremental Models",source:"runner"});
    },460);
  };

  return <section className="dbti-lab" aria-label="dbt incremental models interactive simulation">
    <IncrementalFlow dataset={dataset}/>

    <section className="dbti-simulation">
      <header className="dbti-sim-head">
        <div className="dbti-sim-title">
          <span><Play size={19} fill="currentColor"/></span>
          <div><h2>Run Simulation: See incremental model in action</h2><p>Modify the input data and run the simulation to see how only new or changed rows are processed.</p></div>
        </div>
        <div className="dbti-controls">
          <label><span>Dataset</span><select value={datasetId} onChange={e=>changeDataset(e.target.value as DbtIncrementalDatasetId)}>{dbtIncrementalDatasets.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select><ChevronDown size={14}/></label>
          <button className="dbti-run-top" onClick={run} disabled={running}><Play size={14} fill="currentColor"/>{running?"Running…":"Run Simulation"}</button>
          <button onClick={reset}><RefreshCcw size={15}/>Reset</button>
        </div>
      </header>

      <div className="dbti-sim-grid">
        <section className="dbti-panel dbti-existing-panel">
          <header><div><span className="dbti-panel-icon"><Table2 size={16}/></span><strong>Existing Table (current state)</strong></div></header>
          <MiniTable rows={dataset.existing}/>
          <div className="dbti-panel-foot"><span>{dataset.existing.length} existing rows</span><span>unique key: {dataset.uniqueKey}</span></div>
        </section>

        <section className="dbti-panel dbti-input-panel">
          <header>
            <div><span className="dbti-panel-icon dbti-upload"><Upload size={16}/></span><strong>New / Changed Input Data</strong></div>
            <button onClick={()=>setEditing(value=>!value)}><Edit3 size={14}/>{editing?"Done":"Edit Data"}</button>
          </header>
          <EditableIncomingTable rows={incoming} onRows={rows=>{setIncoming(rows);setResult(null);}} existing={dataset.existing} editing={editing}/>
          <div className="dbti-panel-foot"><span>{incoming.length} input rows</span><span>red = update · green = insert</span></div>
        </section>

        <section className="dbti-panel dbti-run-panel">
          <header>
            <div><span className="dbti-step">3</span><strong>Run dbt Incremental Model</strong></div>
            <button className="dbti-run-inline" onClick={run} disabled={running}><Play size={13} fill="currentColor"/>{running?"Running…":"Run Simulation"}</button>
          </header>
          <pre className="dbti-terminal">{(result?.terminal??[
            "$ dbt run --select "+dataset.modelName,
            "Ready. Run the simulation to merge new and changed rows.",
          ]).map((line,index)=><span key={index} className={line.includes("PASS")||line.includes("successfully")?"is-pass":line.includes("Processed")?"is-highlight":""}>{line}</span>)}</pre>
          <div className="dbti-summary">
            <div><b>{result?.processedRows??0}</b><span>Processed</span></div>
            <div><b>{result?.updatedRows??0}</b><span>Updated</span></div>
            <div><b>{result?.insertedRows??0}</b><span>Inserted</span></div>
          </div>
        </section>
      </div>

      <details className="dbti-sql-details">
        <summary>View incremental SQL</summary>
        <pre>{sql}</pre>
      </details>
    </section>
  </section>;
}

export function DbtIncrementalRightRail({
  lessonTitles,currentLesson,completed,onLesson,onNotes
}:{
  lessonTitles:string[];
  currentLesson:number;
  completed:number[];
  onLesson:(lesson:string)=>void;
  onNotes:()=>void;
}){
  const takeaways=[
    "Processes only new or changed rows",
    "Uses a unique key to merge data",
    "Handles late-arriving data deliberately",
    "Avoids full refresh for better performance",
  ];
  return <div className="dbti-right-rail">
    <section className="dbti-progress-card">
      <header><strong>Lesson Progress <ChevronDown size={14}/></strong><span>{completed.length} / {lessonTitles.length} done</span></header>
      <Progress value={completed.length/lessonTitles.length*100} className="dbti-progress"/>
      <div className="dbti-progress-list">{lessonTitles.map((lesson,index)=>{
        const done=completed.includes(index),current=index===currentLesson;
        return <button key={lesson} onClick={()=>onLesson(lesson)} className={current?"is-current":""}>
          {done?<CheckCircle2 size={17}/>:current?<Play size={17} fill="currentColor"/>:<Circle size={17}/>}
          <span>{index+1}. {lesson}</span>
          <small>{done?"Completed":current?"Learning":"Not started"}</small>
        </button>;
      })}</div>
    </section>

    <section className="dbti-takeaways">
      <h3><Lightbulb size={21}/>Key Takeaways</h3>
      {takeaways.map(item=><div key={item}><Check size={15}/><span>{item}</span></div>)}
      <button type="button" className="dbti-notes-link" onClick={onNotes}>Quick Notes <ChevronRight size={14}/></button>
    </section>
  </div>;
}
