"use client";

import {useMemo,useState} from "react";
import {
  ArrowRight, BarChart3, BookOpen, Check, CheckCircle2, ChevronDown,
  ChevronLeft, ChevronRight, Circle, Clock3, Code2, Database, Edit3,
  GraduationCap, Lightbulb, PackageCheck, Play, RefreshCcw, ShieldCheck,
  Table2, TestTube2, Zap
} from "lucide-react";
import {Progress} from "@/components/ui/progress";
import {
  buildDbtTestTerminal, cloneDataset, dbtTestDatasets, dbtTestsYaml,
  runDbtDataTests, type DbtTestDatasetId, type DbtTestFailure, type DbtTestRow
} from "@/lib/dbt-tests-data-quality-simulation";

export function DbtTestsHero({
  description,minutes,currentLesson,total,onPrevious,onNext
}:{
  description:string;minutes:number;currentLesson:number;total:number;
  onPrevious:()=>void;onNext:()=>void;
}){
  return <section className="dbtt-hero">
    <div className="dbtt-hero-copy">
      <div className="dbtt-breadcrumb"><span>dbt</span><ChevronRight size={14}/><strong>Tests &amp; Data Quality</strong></div>
      <div className="dbtt-title-row">
        <span className="dbtt-hero-icon"><Zap size={30}/></span>
        <div><h1>Tests &amp; Data Quality</h1><p>{description}</p></div>
      </div>
      <div className="dbtt-meta"><span><Clock3 size={14}/>{minutes} min</span><span><GraduationCap size={14}/>Lesson {currentLesson+1}/{total}</span></div>
    </div>
    <div className="dbtt-hero-side">
      <span className="dbtt-level">Intermediate</span>
      <div className="dbtt-watermark" aria-hidden="true">M</div>
      <div className="dbtt-nav">
        <button onClick={onPrevious} disabled={currentLesson===0} aria-label="Previous lesson"><ChevronLeft size={17}/></button>
        <button onClick={onNext} disabled={currentLesson===total-1}>Next <ChevronRight size={16}/></button>
      </div>
    </div>
  </section>;
}

function PipelineCard({
  tone,title,icon,node,sub,testTitle,testDetail
}:{
  tone:"blue"|"orange"|"violet"|"green";title:string;icon:React.ReactNode;
  node:string;sub:string;testTitle:string;testDetail:string;
}){
  return <div className={"dbtt-pipe-group dbtt-"+tone}>
    <article className="dbtt-pipe-card">
      <header>{icon}<strong>{title}</strong></header>
      <div className="dbtt-pipe-node"><span>{icon}</span><div><b>{node}</b><small>{sub}</small></div></div>
    </article>
    <div className="dbtt-test-link"/>
    <div className="dbtt-test-chip"><ShieldCheck size={15}/><span><b>{testTitle}</b><small>{testDetail}</small></span></div>
  </div>;
}

function EditableTable({
  rows,setRows,editing,failures
}:{
  rows:DbtTestRow[];
  setRows:(rows:DbtTestRow[])=>void;
  editing:boolean;
  failures:DbtTestFailure[];
}){
  const badCells=useMemo(()=>{
    const map=new Map<string,boolean>();
    failures.forEach(failure=>failure.rowIndexes.forEach(index=>{
      if(failure.id==="not-null-order"||failure.id==="unique-order")map.set(index+":order_id",true);
      if(failure.id==="not-null-customer")map.set(index+":customer_id",true);
      if(failure.id==="not-null-amount"||failure.id==="accepted-amount")map.set(index+":total_amount",true);
    }));
    return map;
  },[failures]);

  const update=(index:number,key:"order_id"|"customer_id"|"order_date"|"total_amount",value:string)=>{
    setRows(rows.map((row,rowIndex)=>rowIndex===index?{...row,[key]:value}:row));
  };

  return <div className="dbtt-data-table-wrap">
    <table className="dbtt-data-table">
      <thead><tr><th></th><th>order_id</th><th>customer_id</th><th>order_date</th><th>total_amount</th></tr></thead>
      <tbody>{rows.slice(0,8).map((row,index)=><tr key={row.row}>
        <td>{row.row}</td>
        {(["order_id","customer_id","order_date","total_amount"] as const).map(key=>{
          const value=row[key];
          const bad=badCells.has(index+":"+key) || ((key==="order_id"||key==="customer_id"||key==="total_amount") && value.trim()==="") || (key==="total_amount" && Number(value)<0);
          return <td className={bad?"is-bad":""} key={key}>
            {editing?<input value={value} onChange={e=>update(index,key,e.target.value)} aria-label={key+" row "+row.row}/>:<span>{value||"NULL"}</span>}
          </td>;
        })}
      </tr>)}</tbody>
    </table>
  </div>;
}

function YamlEditor(){return <pre className="dbtt-yaml"><code>{dbtTestsYaml.split("\n").map((line,index)=><span className="dbtt-yaml-line" key={index}><b>{index+1}</b><span>{line}</span></span>)}</code></pre>;}

function TestResults({failures}:{failures:DbtTestFailure[]}){
  const visible=failures.filter(f=>["not-null-order","unique-order","not-null-customer","accepted-amount","not-null-amount"].includes(f.id));
  const failed=Math.min(4,visible.length);
  const passed=Math.max(0,4-failed);
  const success=Math.round(passed/4*100);
  return <section className="dbtt-results-card">
    <header><TestTube2 size={15}/><strong>Test Results</strong></header>
    <div className="dbtt-result-stats">
      <div className="failed"><span><Circle size={14} fill="currentColor"/></span><b>{failed}</b><small>Failed</small></div>
      <div className="passed"><span><CheckCircle2 size={14}/></span><b>{passed}</b><small>Passed</small></div>
      <div><b>{success}%</b><small>Success Rate</small></div>
    </div>
    <div className="dbtt-failure-list">
      {visible.length===0?<div className="dbtt-all-pass"><CheckCircle2 size={15}/>All configured tests passed.</div>:visible.slice(0,4).map(failure=><div key={failure.id}><span>⊗</span><b>{failure.test}</b><em>{failure.detail}</em><ChevronRight size={12}/></div>)}
    </div>
  </section>;
}

export function DbtTestsDataQualityLab(){
  const [datasetId,setDatasetId]=useState<DbtTestDatasetId>("ecommerce");
  const [rows,setRows]=useState<DbtTestRow[]>(()=>cloneDataset("ecommerce"));
  const [editing,setEditing]=useState(false);
  const [ran,setRan]=useState(false);
  const [running,setRunning]=useState(false);

  const failures=useMemo(()=>ran?runDbtDataTests(rows):[],[ran,rows]);
  const terminal=useMemo(()=>ran?buildDbtTestTerminal(failures):["$ dbt test --select stg_orders","Ready. Run tests to validate stg_orders."],[ran,failures]);

  const reset=()=>{
    setRows(cloneDataset(datasetId));
    setEditing(false);
    setRan(false);
    setRunning(false);
  };
  const changeDataset=(id:DbtTestDatasetId)=>{
    setDatasetId(id);
    setRows(cloneDataset(id));
    setEditing(false);
    setRan(false);
    setRunning(false);
  };
  const runTests=()=>{
    setRunning(true);
    setRan(false);
    window.setTimeout(()=>{setRan(true);setRunning(false);},500);
  };

  return <section className="dbtt-lab" aria-label="dbt tests and data quality interactive simulation">
    <section className="dbtt-flow-section">
      <header className="dbtt-section-head"><div><h2><BookOpen size={20}/>Where tests fit in the dbt flow</h2><p>dbt tests run after models are built and validate assumptions about your data. They catch issues like nulls, duplicates, and invalid values early.</p></div></header>
      <div className="dbtt-pipeline">
        <PipelineCard tone="blue" title="Sources" icon={<Database size={24}/>} node="raw.orders" sub="source()" testTitle="not_null" testDetail="on primary key"/>
        <ArrowRight size={24}/>
        <PipelineCard tone="orange" title="Staging Models" icon={<Database size={24}/>} node="stg_orders" sub="ref()" testTitle="unique" testDetail="on order_id"/>
        <ArrowRight size={24}/>
        <PipelineCard tone="violet" title="Intermediate Models" icon={<PackageCheck size={24}/>} node="int_order_payments" sub="ref()" testTitle="accepted_values" testDetail="on status"/>
        <ArrowRight size={24}/>
        <PipelineCard tone="green" title="Fact Models" icon={<BarChart3 size={24}/>} node="fct_orders" sub="ref()" testTitle="not_null" testDetail="on total_amount"/>
      </div>
    </section>

    <section className="dbtt-simulation">
      <header className="dbtt-sim-head">
        <div className="dbtt-sim-title"><span><Play size={19} fill="currentColor"/></span><div><h2>Run Simulation: See dbt tests in action</h2><p>Modify the data to introduce quality issues and run dbt tests to see how they catch them.</p></div></div>
        <div className="dbtt-sim-controls">
          <label><span>Dataset</span><select value={datasetId} onChange={e=>changeDataset(e.target.value as DbtTestDatasetId)}>{dbtTestDatasets.map(item=><option value={item.id} key={item.id}>{item.label}</option>)}</select><ChevronDown size={13}/></label>
          <button onClick={reset}><RefreshCcw size={14}/>Reset</button>
        </div>
      </header>

      <div className="dbtt-sim-grid">
        <section className="dbtt-input-card">
          <header><span><Table2 size={16}/><strong>Input Data (stg_orders)</strong></span><small>{rows.length} rows</small></header>
          <EditableTable rows={rows} setRows={setRows} editing={editing} failures={ran?runDbtDataTests(rows):runDbtDataTests(rows)}/>
          <button className="dbtt-edit" onClick={()=>setEditing(v=>!v)}><Edit3 size={14}/>{editing?"Done Editing":"Edit Data"}</button>
        </section>

        <section className="dbtt-config-card">
          <header><span><Code2 size={16}/><strong>dbt Test Configuration (schema.yml)</strong></span><small>YAML</small></header>
          <YamlEditor/>
          <button onClick={()=>{setRows(cloneDataset(datasetId));setRan(false);}}><RefreshCcw size={14}/>Reset to default</button>
        </section>

        <section className="dbtt-run-card">
          <header><span><TestTube2 size={16}/><strong>Run dbt Tests</strong></span><button className="dbtt-run-tests" onClick={runTests} disabled={running}><Play size={13}/>{running?"Running…":"Run Tests"}</button></header>
          <pre className="dbtt-terminal">{terminal.map((line,index)=><span className={line.includes("FAIL")||line.includes("error")?"is-fail":line.includes("PASS")||line.includes("successfully")?"is-pass":""} key={index}>{line}</span>)}</pre>
          <TestResults failures={failures}/>
        </section>
      </div>
    </section>
  </section>;
}

export function DbtTestsRightRail({
  lessonTitles,currentLesson,completed,onLesson
}:{
  lessonTitles:string[];currentLesson:number;completed:number[];onLesson:(lesson:string)=>void;
}){
  const takeaways=[
    "dbt tests validate assumptions about your data.",
    "Catch issues like nulls, duplicates, and invalid values.",
    "Tests run after models are built.",
    "They improve data reliability and trust.",
  ];
  return <div className="dbtt-right-rail">
    <section className="dbtt-progress-card">
      <header><strong>Lesson Progress <ChevronDown size={13}/></strong><span>{completed.length} / {lessonTitles.length} done</span></header>
      <Progress value={completed.length/lessonTitles.length*100} className="dbtt-progress"/>
      <div className="dbtt-progress-list">{lessonTitles.map((lesson,index)=>{
        const done=completed.includes(index),current=index===currentLesson;
        return <button key={lesson} onClick={()=>onLesson(lesson)} className={current?"is-current":""}>
          {done?<CheckCircle2 size={16}/>:current?<Play size={16} fill="currentColor"/>:<Circle size={16}/>}
          <span>{index+1}. {lesson}</span>
          <small>{done?"Completed":current?"Learning":"Not started"}</small>
        </button>;
      })}</div>
    </section>
    <section className="dbtt-takeaways">
      <h3><Lightbulb size={20}/>Key Takeaways</h3>
      {takeaways.map(item=><div key={item}><CheckCircle2 size={14}/><span>{item}</span></div>)}
    </section>
  </div>;
}
