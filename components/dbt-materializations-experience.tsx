"use client";

import {useMemo,useState} from "react";
import {
  ArrowRight, BarChart3, BookOpen, CheckCircle2, ChevronDown, ChevronLeft,
  ChevronRight, Circle, Clock3, Code2, Database, Eye, FileCode2,
  GraduationCap, Layers3, Lightbulb, Play, RefreshCcw, Table2, Zap
} from "lucide-react";
import {Progress} from "@/components/ui/progress";
import {
  buildDbtMaterializationSql, dbtMaterializationDatasets, dbtMaterializationOptions,
  getDbtMaterializationDataset, getDbtMaterializationOption, runDbtMaterialization,
  type DbtMaterializationDatasetId, type DbtMaterializationId,
  type DbtMaterializationRunResult,
} from "@/lib/dbt-materializations-simulation";

export function DbtMaterializationsHero({
  description,minutes,currentLesson,total,onPrevious,onNext
}:{
  description:string;minutes:number;currentLesson:number;total:number;
  onPrevious:()=>void;onNext:()=>void;
}){
  return <section className="dbtmz-hero">
    <div className="dbtmz-hero-copy">
      <div className="dbtmz-breadcrumb"><span>dbt</span><ChevronRight size={14}/><strong>Materializations</strong></div>
      <div className="dbtmz-title-row">
        <span className="dbtmz-hero-icon"><Zap size={30}/></span>
        <div><h1>Materializations</h1><p>{description}</p></div>
      </div>
      <div className="dbtmz-meta"><span><Clock3 size={15}/>{minutes} min</span><span><GraduationCap size={15}/>Lesson {currentLesson+1}/{total}</span></div>
    </div>
    <div className="dbtmz-hero-side">
      <span className="dbtmz-level">Intermediate</span>
      <div className="dbtmz-watermark" aria-hidden="true">M</div>
      <div className="dbtmz-nav">
        <button onClick={onPrevious} disabled={currentLesson===0} aria-label="Previous lesson"><ChevronLeft size={18}/></button>
        <button onClick={onNext} disabled={currentLesson===total-1}>Next <ChevronRight size={17}/></button>
      </div>
    </div>
  </section>;
}

function MaterializationIcon({id}:{id:DbtMaterializationId}){
  if(id==="view")return <Eye size={20}/>;
  if(id==="table")return <Table2 size={20}/>;
  if(id==="incremental")return <RefreshCcw size={20}/>;
  return <FileCode2 size={20}/>;
}

function ObjectCard({id,selected,onSelect}:{id:DbtMaterializationId;selected:boolean;onSelect:()=>void}){
  const option=getDbtMaterializationOption(id);
  return <button type="button" onClick={onSelect} aria-pressed={selected} className={"dbtmz-object dbtmz-object-"+id+(selected?" is-selected":"")}>
    <span><MaterializationIcon id={id}/></span>
    <strong>{option.label}</strong>
    <small>{option.objectSummary}</small>
  </button>;
}

function CodeEditor({code}:{code:string}){
  return <pre className="dbtmz-code"><code>{code.split("\n").map((line,index)=><span className="dbtmz-code-line" key={index}><b>{index+1}</b><span>{line}</span></span>)}</code></pre>;
}

function QueryTable({rows}:{rows:ReturnType<typeof getDbtMaterializationDataset>["rows"]}){
  return <div className="dbtmz-table-wrap"><table><thead><tr><th>order_id</th><th>customer_id</th><th>order_date</th><th>total_amount</th></tr></thead><tbody>{rows.map(row=><tr key={row.order_id}><td>{row.order_id}</td><td>{row.customer_id}</td><td>{row.order_date}</td><td>{row.total_amount}</td></tr>)}</tbody></table></div>;
}

function WarehouseObject({
  result,dataset
}:{
  result:DbtMaterializationRunResult|null;
  dataset:ReturnType<typeof getDbtMaterializationDataset>;
}){
  const materialization=result?.materialization??"table";
  const option=getDbtMaterializationOption(materialization);
  return <div className="dbtmz-warehouse-object">
    <div className={"dbtmz-warehouse-icon dbtmz-warehouse-"+materialization}><MaterializationIcon id={materialization}/></div>
    <div className="dbtmz-warehouse-copy">
      <strong>{result?.relationName??(materialization==="ephemeral"?"No warehouse relation":"analytics."+dataset.modelName)}</strong>
      <span>Materialization: {option.label}</span>
      <span>Relation type: {result?.relationType??(materialization==="table"?"table":"preview")}</span>
      <span>Processed rows: {(result?.processedRows??dataset.totalRows).toLocaleString("en-US")}</span>
      <span>Stored rows: {(result?.storedRows??dataset.totalRows).toLocaleString("en-US")}</span>
    </div>
  </div>;
}

export function DbtMaterializationsLab(){
  const [datasetId,setDatasetId]=useState<DbtMaterializationDatasetId>("ecommerce");
  const [materialization,setMaterialization]=useState<DbtMaterializationId>("table");
  const [result,setResult]=useState<DbtMaterializationRunResult|null>(null);
  const [activeResultTab,setActiveResultTab]=useState<"query"|"warehouse">("query");
  const [running,setRunning]=useState(false);

  const dataset=useMemo(()=>getDbtMaterializationDataset(datasetId),[datasetId]);
  const sql=useMemo(()=>buildDbtMaterializationSql(dataset,materialization),[dataset,materialization]);

  const reset=()=>{
    setDatasetId("ecommerce");
    setMaterialization("table");
    setResult(null);
    setActiveResultTab("query");
    setRunning(false);
  };
  const run=()=>{
    setRunning(true);
    window.setTimeout(()=>{
      setResult(runDbtMaterialization(dataset,materialization));
      setRunning(false);
    },420);
  };
  const choose=(id:DbtMaterializationId)=>{
    setMaterialization(id);
    setResult(null);
  };
  const changeDataset=(id:DbtMaterializationDatasetId)=>{
    setDatasetId(id);
    setResult(null);
  };

  return <section className="dbtmz-lab" aria-label="dbt materializations interactive simulation">
    <section className="dbtmz-explainer">
      <header className="dbtmz-section-head">
        <h2><BookOpen size={21}/>How materializations change the final object</h2>
        <p>The same model SQL can be materialized in different ways. Each materialization creates a different type of object in the warehouse with different performance and storage characteristics.</p>
      </header>

      <div className="dbtmz-object-flow">
        <article className="dbtmz-model-card">
          <header><span><FileCode2 size={20}/></span><div><strong>Model SQL</strong><small>({dataset.modelName}.sql)</small></div></header>
          <pre>{"select\n  order_id,\n  customer_id,\n  order_date,\n  total_amount\nfrom {{ ref('"+dataset.sourceModel+"') }}"}</pre>
        </article>
        <ArrowRight size={26}/>
        <article className="dbtmz-materialize-card">
          <header><span><Layers3 size={20}/></span><strong>dbt Materialization</strong></header>
          <label><span className="sr-only">Materialization</span><select value={materialization} onChange={e=>choose(e.target.value as DbtMaterializationId)}>{dbtMaterializationOptions.map(item=><option value={item.id} key={item.id}>{item.label.toLowerCase()}</option>)}</select><ChevronDown size={15}/></label>
          <button type="button" onClick={run} className="dbtmz-run-main" disabled={running}><Play size={15} fill="currentColor"/>{running?"Running…":"Run Simulation"}</button>
          <p>Try different materializations<br/>to see the result</p>
        </article>
        <div className="dbtmz-branch-lines" aria-hidden="true"/>
        <div className="dbtmz-object-list">
          {dbtMaterializationOptions.map(option=><ObjectCard key={option.id} id={option.id} selected={materialization===option.id} onSelect={()=>choose(option.id)}/>)}
        </div>
      </div>
    </section>

    <section className="dbtmz-simulation">
      <header className="dbtmz-sim-head">
        <div className="dbtmz-sim-title"><span><Play size={19} fill="currentColor"/></span><div><h2>Run Simulation: Try different materializations</h2><p>Choose a materialization, run the model, and compare the query output with the warehouse object that dbt creates.</p></div></div>
        <div className="dbtmz-controls">
          <label><span>Dataset</span><select value={datasetId} onChange={e=>changeDataset(e.target.value as DbtMaterializationDatasetId)}>{dbtMaterializationDatasets.map(item=><option value={item.id} key={item.id}>{item.label}</option>)}</select><ChevronDown size={14}/></label>
          <button className="dbtmz-run-top" onClick={run} disabled={running}><Play size={14} fill="currentColor"/>{running?"Running…":"Run Simulation"}</button>
          <button onClick={reset}><RefreshCcw size={15}/>Reset</button>
        </div>
      </header>

      <div className="dbtmz-sim-grid">
        <section className="dbtmz-step-card dbtmz-code-card">
          <header><span className="dbtmz-step-number">1</span><strong>Model SQL ({dataset.modelName}.sql)</strong></header>
          <CodeEditor code={sql}/>
        </section>

        <section className="dbtmz-step-card dbtmz-choose-card">
          <header><span className="dbtmz-step-number">2</span><strong>Choose Materialization</strong></header>
          <div className="dbtmz-choice-list">
            {dbtMaterializationOptions.map(option=><button type="button" key={option.id} onClick={()=>choose(option.id)} aria-pressed={materialization===option.id} className={materialization===option.id?"is-selected":""}>
              <span className={"dbtmz-choice-icon dbtmz-choice-"+option.id}><MaterializationIcon id={option.id}/></span>
              <b>{option.label.toLowerCase()}</b>
              <small>{option.description}</small>
            </button>)}
          </div>
        </section>

        <section className="dbtmz-step-card dbtmz-result-card">
          <header>
            <div><span className="dbtmz-step-number">3</span><strong>Simulation Result</strong></div>
            <div className="dbtmz-result-tabs">
              <button className={activeResultTab==="query"?"is-active":""} onClick={()=>setActiveResultTab("query")}>Query Result</button>
              <button className={activeResultTab==="warehouse"?"is-active":""} onClick={()=>setActiveResultTab("warehouse")}>Warehouse Object</button>
            </div>
          </header>
          {activeResultTab==="query"?<QueryTable rows={dataset.rows}/>:<WarehouseObject result={result} dataset={dataset}/>}
          <div className={"dbtmz-result-status "+(result?"is-ready":"")}>
            {result?<><CheckCircle2 size={16}/><span>{result.status}</span></>:<><Circle size={16}/><span>Choose a materialization and run the simulation.</span></>}
          </div>
        </section>
      </div>
    </section>
  </section>;
}

export function DbtMaterializationsRightRail({
  lessonTitles,currentLesson,completed,onLesson
}:{
  lessonTitles:string[];currentLesson:number;completed:number[];onLesson:(lesson:string)=>void;
}){
  const takeaways=[
    "Materialization controls how dbt creates the final object in the warehouse.",
    "View → no storage, always fresh.",
    "Table → full data stored, fastest queries.",
    "Incremental → processes only new data.",
    "Ephemeral → not a real table, inlined.",
  ];
  return <div className="dbtmz-right-rail">
    <section className="dbtmz-progress-card">
      <header><strong>Lesson Progress <ChevronDown size={14}/></strong><span>{completed.length} / {lessonTitles.length} done</span></header>
      <Progress value={completed.length/lessonTitles.length*100} className="dbtmz-progress"/>
      <div className="dbtmz-progress-list">{lessonTitles.map((lesson,index)=>{
        const done=completed.includes(index),current=index===currentLesson;
        return <button key={lesson} onClick={()=>onLesson(lesson)} className={current?"is-current":""}>
          {done?<CheckCircle2 size={17}/>:current?<Play size={17} fill="currentColor"/>:<Circle size={17}/>}
          <span>{index+1}. {lesson}</span>
          <small>{done?"Completed":current?"Learning":"Not started"}</small>
        </button>;
      })}</div>
    </section>
    <section className="dbtmz-takeaways">
      <h3><Lightbulb size={21}/>Key Takeaways</h3>
      {takeaways.map(item=><div key={item}><CheckCircle2 size={15}/><span>{item}</span></div>)}
    </section>
  </div>;
}
