"use client";

import {useMemo,useState} from "react";
import {
  ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, ChevronLeft,
  ChevronRight, Circle, Clock3, Code2, Copy, Database, FileCode2,
  GraduationCap, Lightbulb, Play, RefreshCcw, Settings2, Sparkles, Zap
} from "lucide-react";
import {Progress} from "@/components/ui/progress";
import {useCompanion} from "@/components/companion-context";
import {
  buildJinjaRunLog,
  compileDbtJinja,
  dbtJinjaDatasets,
  defaultJinjaModel,
  defaultMacro,
  defaultProjectVars,
  getDbtJinjaDataset,
  previewCompiledSql,
  type DbtJinjaDatasetId,
} from "@/lib/dbt-jinja-macros-simulation";

export function DbtJinjaHero({
  description,minutes,currentLesson,total,onPrevious,onNext
}:{
  description:string;minutes:number;currentLesson:number;total:number;
  onPrevious:()=>void;onNext:()=>void;
}){
  return <section className="dbtj-hero">
    <div className="dbtj-hero-copy">
      <div className="dbtj-breadcrumb"><span>dbt</span><ChevronRight size={14}/><strong>Jinja, Variables &amp; Macros</strong></div>
      <div className="dbtj-title-row">
        <span className="dbtj-hero-icon"><Zap size={30}/></span>
        <div><h1>Jinja, Variables &amp; Macros</h1><p>{description}</p></div>
      </div>
      <div className="dbtj-meta"><span><Clock3 size={15}/>{minutes} min</span><span><GraduationCap size={15}/>Lesson {currentLesson+1}/{total}</span></div>
    </div>
    <div className="dbtj-hero-side">
      <span className="dbtj-level">Intermediate</span>
      <div className="dbtj-watermark" aria-hidden="true">M</div>
      <div className="dbtj-nav">
        <button onClick={onPrevious} disabled={currentLesson===0} aria-label="Previous lesson"><ChevronLeft size={18}/></button>
        <button onClick={onNext} disabled={currentLesson===total-1}>Next <ChevronRight size={17}/></button>
      </div>
    </div>
  </section>;
}

function FlowCard({
  tone,title,icon,children
}:{
  tone:"blue"|"violet"|"orange"|"green";
  title:string;
  icon:React.ReactNode;
  children:React.ReactNode;
}){
  return <article className={"dbtj-flow-card dbtj-flow-"+tone}>
    <header><span>{icon}</span><strong>{title}</strong></header>
    <div className="dbtj-flow-content">{children}</div>
  </article>;
}

function CopyButton({value,label}:{value:string;label:string}){
  const [copied,setCopied]=useState(false);
  const copy=async()=>{
    try{
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(()=>setCopied(false),1200);
    }catch{
      setCopied(false);
    }
  };
  return <button type="button" onClick={copy} aria-label={"Copy "+label}>{copied?<Check size={14}/>:<Copy size={14}/>}</button>;
}

function CodeEditor({
  value,onChange,label,readOnly=false
}:{
  value:string;
  onChange?:(value:string)=>void;
  label:string;
  readOnly?:boolean;
}){
  return <div className="dbtj-editor">
    <textarea
      value={value}
      onChange={e=>onChange?.(e.target.value)}
      readOnly={readOnly}
      aria-label={label}
      spellCheck={false}
    />
  </div>;
}

export function DbtJinjaMacrosLab(){
  const companion=useCompanion();
  const [datasetId,setDatasetId]=useState<DbtJinjaDatasetId>("ecommerce");
  const [model,setModel]=useState(defaultJinjaModel);
  const [vars,setVars]=useState(defaultProjectVars);
  const [macro,setMacro]=useState(defaultMacro);
  const [activeResult,setActiveResult]=useState<"compiled"|"rows">("compiled");
  const [hasRun,setHasRun]=useState(false);
  const [running,setRunning]=useState(false);

  const dataset=useMemo(()=>getDbtJinjaDataset(datasetId),[datasetId]);
  const liveCompile=useMemo(()=>compileDbtJinja({model,vars,macro,dataset}),[model,vars,macro,dataset]);
  const result=hasRun?liveCompile:null;
  const runLog=useMemo(()=>result?buildJinjaRunLog(result,dataset):[],[result,dataset]);

  const reset=()=>{
    setDatasetId("ecommerce");
    setModel(defaultJinjaModel);
    setVars(defaultProjectVars);
    setMacro(defaultMacro);
    setActiveResult("compiled");
    setHasRun(false);
    setRunning(false);
  };
  const run=()=>{
    setRunning(true);
    setHasRun(false);
    window.setTimeout(()=>{
      setHasRun(true);
      setRunning(false);
      const unresolved=liveCompile.compiledSql.includes("{{")||liveCompile.compiledSql.includes("{%");
      companion?.emit({type:unresolved?"exercise_error":"exercise_correct",lesson:"Jinja, Variables & Macros",source:"runner"});
    },420);
  };
  const changeDataset=(id:DbtJinjaDatasetId)=>{
    setDatasetId(id);
    setHasRun(false);
  };

  return <section className="dbtj-lab" aria-label="dbt Jinja variables and macros interactive simulation">
    <section className="dbtj-explainer">
      <header className="dbtj-section-head">
        <h2><BookOpen size={21}/>How Jinja, Variables &amp; Macros fit in the dbt flow</h2>
        <p>Jinja is rendered during compilation. Variables and macros help you write reusable SQL, reduce repetition, and keep your project maintainable.</p>
      </header>

      <div className="dbtj-flow">
        <FlowCard tone="blue" title="Jinja Template" icon={<FileCode2 size={22}/>}>
          <div className="dbtj-jinja-mark">{"{{ ... }}"}</div>
          <p>Write dynamic SQL<br/>using Jinja, variables<br/>and macros</p>
        </FlowCard>
        <ArrowRight size={27}/>
        <FlowCard tone="violet" title={"dbt Compile\n(Jinja Rendering)"} icon={<Settings2 size={22}/>}>
          <p><b>dbt</b> renders Jinja into<br/>pure SQL using project<br/>variables and macros</p>
        </FlowCard>
        <ArrowRight size={27}/>
        <FlowCard tone="orange" title="Compiled SQL" icon={<Code2 size={22}/>}>
          <pre>{previewCompiledSql(liveCompile)}</pre>
          <small>Final SQL after Jinja is rendered</small>
        </FlowCard>
        <ArrowRight size={27}/>
        <FlowCard tone="green" title="Warehouse Execution" icon={<Database size={22}/>}>
          <p>Run the compiled SQL<br/>on your data platform</p>
        </FlowCard>
      </div>
    </section>

    <section className="dbtj-simulation">
      <header className="dbtj-sim-head">
        <div className="dbtj-sim-title">
          <span><Play size={19} fill="currentColor"/></span>
          <div><h2>Run Simulation: See Jinja in action</h2><p>Modify variables or macros and run the simulation to see the compiled SQL and results.</p></div>
        </div>
        <div className="dbtj-controls">
          <label><span>Dataset</span><select value={datasetId} onChange={e=>changeDataset(e.target.value as DbtJinjaDatasetId)}>{dbtJinjaDatasets.map(item=><option value={item.id} key={item.id}>{item.label}</option>)}</select><ChevronDown size={14}/></label>
          <button className="dbtj-run-top" onClick={run} disabled={running}><Play size={14} fill="currentColor"/>{running?"Running…":"Run Simulation"}</button>
          <button onClick={reset}><RefreshCcw size={15}/>Reset</button>
        </div>
      </header>

      <div className="dbtj-sim-grid">
        <section className="dbtj-panel dbtj-model-panel">
          <header><div><span className="dbtj-step">1</span><strong>Jinja Model (orders.sql)</strong></div><CopyButton value={model} label="Jinja model"/></header>
          <CodeEditor value={model} onChange={value=>{setModel(value);setHasRun(false);}} label="Editable Jinja model"/>
        </section>

        <div className="dbtj-middle-stack">
          <section className="dbtj-panel dbtj-vars-panel">
            <header><div><span className="dbtj-step">2</span><strong>Project Variables (dbt_project.yml)</strong></div><div className="dbtj-panel-actions"><small>YAML</small><CopyButton value={vars} label="project variables"/></div></header>
            <CodeEditor value={vars} onChange={value=>{setVars(value);setHasRun(false);}} label="Editable dbt project variables"/>
          </section>
          <section className="dbtj-panel dbtj-macro-panel">
            <header><div><span className="dbtj-step">3</span><strong>Macro Example (macros/date_filter.sql)</strong></div><div className="dbtj-panel-actions"><small>SQL</small><CopyButton value={macro} label="macro"/></div></header>
            <CodeEditor value={macro} onChange={value=>{setMacro(value);setHasRun(false);}} label="Editable Jinja macro"/>
          </section>
        </div>

        <section className="dbtj-panel dbtj-results-panel">
          <header>
            <div><span className="dbtj-results-icon"><Sparkles size={15}/></span><strong>Run &amp; Results</strong></div>
            <button className="dbtj-run-inline" onClick={run} disabled={running}><Play size={13} fill="currentColor"/>{running?"Running…":"Run Simulation"}</button>
          </header>
          <div className="dbtj-result-tabs">
            <button className={activeResult==="compiled"?"is-active":""} onClick={()=>setActiveResult("compiled")}>Compiled SQL</button>
            <button className={activeResult==="rows"?"is-active":""} onClick={()=>setActiveResult("rows")}>Query Results</button>
          </div>

          {activeResult==="compiled"?<div className="dbtj-compiled-wrap">
            <CodeEditor value={(result??liveCompile).compiledSql} label="Compiled SQL" readOnly/>
            <div className="dbtj-compile-meta">
              <span>start_date <b>{(result??liveCompile).startDate}</b></span>
              <span>region <b>{(result??liveCompile).region}</b></span>
              <span>rows <b>{(result??liveCompile).rowCount}</b></span>
            </div>
          </div>:<div className="dbtj-query-wrap">
            <div className="dbtj-query-head"><strong>Query Results (First 5 rows)</strong><small>{(result??liveCompile).rowCount} rows</small></div>
            <div className="dbtj-table-wrap"><table><thead><tr><th>order_id</th><th>customer_id</th><th>order_date</th><th>total_amount</th></tr></thead><tbody>{(result??liveCompile).rows.slice(0,5).map(row=><tr key={row.order_id}><td>{row.order_id}</td><td>{row.customer_id}</td><td>{row.order_date}</td><td>{row.total_amount}</td></tr>)}</tbody></table></div>
          </div>}

          <div className={hasRun?"dbtj-run-log is-ready":"dbtj-run-log"}>
            {hasRun?runLog.slice(-3).map(line=><span key={line}><CheckCircle2 size={13}/>{line}</span>):<span><Circle size={13}/>Edit the Jinja, variables, or macro, then run the simulation.</span>}
          </div>
        </section>
      </div>
    </section>
  </section>;
}

export function DbtJinjaRightRail({
  lessonTitles,currentLesson,completed,onLesson,onNotes
}:{
  lessonTitles:string[];
  currentLesson:number;
  completed:number[];
  onLesson:(lesson:string)=>void;
  onNotes:()=>void;
}){
  const takeaways=[
    "Jinja is rendered at compile time.",
    "Variables allow environment-specific values (e.g., dates, schemas).",
    "Macros let you package reusable SQL logic.",
    "Keep logic reusable and avoid complex business logic in models.",
  ];
  return <div className="dbtj-right-rail">
    <section className="dbtj-progress-card">
      <header><strong>Lesson Progress <ChevronDown size={14}/></strong><span>{completed.length} / {lessonTitles.length} done</span></header>
      <Progress value={completed.length/lessonTitles.length*100} className="dbtj-progress"/>
      <div className="dbtj-progress-list">{lessonTitles.map((lesson,index)=>{
        const done=completed.includes(index),current=index===currentLesson;
        return <button key={lesson} onClick={()=>onLesson(lesson)} className={current?"is-current":""}>
          {done?<CheckCircle2 size={17}/>:current?<Play size={17} fill="currentColor"/>:<Circle size={17}/>}
          <span>{index+1}. {lesson}</span>
          <small>{done?"Completed":current?"Learning":"Not started"}</small>
        </button>;
      })}</div>
    </section>

    <section className="dbtj-takeaways">
      <h3><Lightbulb size={21}/>Key Takeaways</h3>
      {takeaways.map(item=><div key={item}><Check size={15}/><span>{item}</span></div>)}
      <button type="button" className="dbtj-notes-link" onClick={onNotes}>Quick Notes <ChevronRight size={14}/></button>
    </section>
  </div>;
}
