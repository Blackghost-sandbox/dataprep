"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import {
  ArrowRight, BarChart3, BookOpen, Check, CheckCircle2, ChevronDown,
  ChevronLeft, ChevronRight, Circle, Clock3, Code2, Copy, Database,
  FileCode2, GraduationCap, Lightbulb, Play, RefreshCcw, Table2, Zap
} from "lucide-react";
import {Progress} from "@/components/ui/progress";
import {
  advanceDbtSourceRun, dbtSourceScenarios, getDbtSourceScenario,
  newDbtSourceRunState, type DbtSourceScenarioId
} from "@/lib/dbt-sources-source-simulation";

export function DbtSourcesHero({
  description,minutes,currentLesson,total,onPrevious,onNext
}:{
  description:string;minutes:number;currentLesson:number;total:number;
  onPrevious:()=>void;onNext:()=>void;
}){
  return <section className="dbts-hero">
    <div className="dbts-hero-copy">
      <div className="dbts-breadcrumb"><span>dbt</span><ChevronRight size={14}/><strong>Sources &amp; source()</strong></div>
      <div className="dbts-title-row">
        <span className="dbts-hero-icon"><Database size={31}/></span>
        <div><h1>Sources &amp; source()</h1><p>{description}</p></div>
      </div>
      <div className="dbts-meta"><span><Clock3 size={14}/>{minutes} min</span><span><GraduationCap size={14}/>Lesson {currentLesson+1}/{total}</span></div>
    </div>
    <div className="dbts-hero-side">
      <span className="dbts-level">Intermediate</span>
      <div className="dbts-watermark" aria-hidden="true">A</div>
      <div className="dbts-nav">
        <button onClick={onPrevious} disabled={currentLesson===0} aria-label="Previous lesson"><ChevronLeft size={17}/></button>
        <button onClick={onNext} disabled={currentLesson===total-1}>Next <ChevronRight size={16}/></button>
      </div>
    </div>
  </section>;
}

function FlowCard({
  step,tone,title,icon,children,active,onClick
}:{
  step:number;tone:"blue"|"violet"|"orange"|"green";title:string;icon:React.ReactNode;
  children:React.ReactNode;active:boolean;onClick:()=>void;
}){
  return <button type="button" className={"dbts-flow-card dbts-"+tone+(active?" is-active":"")} onClick={onClick}>
    <div className="dbts-flow-title"><span>{step}</span><strong>{title}</strong></div>
    <div className="dbts-flow-icon">{icon}</div>
    <div className="dbts-flow-body">{children}</div>
  </button>;
}

function CheckList({items}:{items:string[]}){
  return <div className="dbts-check-list">{items.map(item=><span key={item}><CheckCircle2 size={14}/>{item}</span>)}</div>;
}

function SqlPanel({
  sql,running,onRun,onReset
}:{
  sql:string;running:boolean;onRun:()=>void;onReset:()=>void;
}){
  return <section className="dbts-sql-panel">
    <header>
      <span><Code2 size={16}/><strong>Example: Use source() in a model</strong></span>
      <div>
        <button className="dbts-run" onClick={onRun} disabled={running}><Play size={14} fill="currentColor"/>{running?"Running…":"Run Model"}</button>
        <button onClick={onReset}><RefreshCcw size={14}/>Reset</button>
      </div>
    </header>
    <div className="dbts-filebar"><FileCode2 size={14}/>models/stg_orders.sql</div>
    <pre><code>{sql.split("\n").map((line,i)=><span className="dbts-code-line" key={i}><b>{i+1}</b><span>{line}</span></span>)}</code></pre>
  </section>;
}

function YamlPanel({yaml}:{yaml:string}){
  const [copied,setCopied]=useState(false);
  const copy=async()=>{
    try{
      await navigator.clipboard.writeText(yaml);
      setCopied(true);
      window.setTimeout(()=>setCopied(false),1200);
    }catch{
      setCopied(false);
    }
  };
  return <section className="dbts-yaml-panel">
    <header><span><Table2 size={16}/><strong>schema.yml definition (Source)</strong></span><div><small>YAML</small><button onClick={copy}><Copy size={13}/>{copied?"Copied":"Copy"}</button></div></header>
    <pre><code>{yaml.split("\n").map((line,i)=><span className="dbts-yaml-line" key={i}><b>{i+1}</b><span>{line}</span></span>)}</code></pre>
  </section>;
}

export function DbtSourcesSourceLab(){
  const [scenarioId,setScenarioId]=useState<DbtSourceScenarioId>("ecommerce");
  const [run,setRun]=useState(()=>newDbtSourceRunState());
  const [activeStep,setActiveStep]=useState(0);
  const timers=useRef<number[]>([]);
  const scenario=useMemo(()=>getDbtSourceScenario(scenarioId),[scenarioId]);

  const clearTimers=()=>{timers.current.forEach(id=>window.clearTimeout(id));timers.current=[];};
  useEffect(()=>()=>clearTimers(),[]);
  const reset=()=>{clearTimers();setRun(newDbtSourceRunState());setActiveStep(0);};
  const changeScenario=(id:DbtSourceScenarioId)=>{clearTimers();setScenarioId(id);setRun(newDbtSourceRunState());setActiveStep(0);};
  const execute=()=>{
    clearTimers();
    let state=newDbtSourceRunState();
    setRun(state);
    for(let i=0;i<6;i++){
      const timer=window.setTimeout(()=>{
        state=advanceDbtSourceRun(state,scenario);
        setRun(state);
        setActiveStep(Math.min(3,Math.floor((state.step-1)/2)+1));
      },230*(i+1));
      timers.current.push(timer);
    }
  };

  const sourceSnippet="select *\nfrom {{ source('"+scenario.sourceGroup+"',\n    '"+scenario.tableName+"') }}";

  return <section className="dbts-lab" aria-label="dbt Sources and source interactive simulation">
    <header className="dbts-lab-head">
      <div><h2><BookOpen size={20}/>How source() works <span>(End-to-End Flow)</span></h2><p>A source represents a table loaded outside dbt (e.g., by an ingestion pipeline). You query it using source() in your models.</p></div>
      <label><span>Scenario</span><select value={scenarioId} onChange={e=>changeScenario(e.target.value as DbtSourceScenarioId)}>{dbtSourceScenarios.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select><ChevronDown size={14}/></label>
    </header>

    <div className="dbts-flow">
      <FlowCard step={1} tone="blue" title="External Source" icon={<Database size={28}/>} active={activeStep===0} onClick={()=>setActiveStep(0)}>
        <div className="dbts-bullet-list">
          <span>◉ {scenario.sourceSystem}</span>
          <span>◉ CRM / ERP</span>
          <span>◉ CSV / API</span>
          <span>◉ Third-party data</span>
        </div>
      </FlowCard>
      <ArrowRight size={25}/>
      <FlowCard step={2} tone="violet" title="Define in schema.yml" icon={<FileCode2 size={28}/>} active={activeStep===1} onClick={()=>setActiveStep(1)}>
        <CheckList items={["Give a name","Add description","Add tests (optional)","Configure freshness","Document columns"]}/>
      </FlowCard>
      <ArrowRight size={25}/>
      <FlowCard step={3} tone="orange" title="Use source() in model" icon={<Code2 size={31}/>} active={activeStep===2} onClick={()=>setActiveStep(2)}>
        <pre className="dbts-source-snippet">{sourceSnippet}</pre>
      </FlowCard>
      <ArrowRight size={25}/>
      <FlowCard step={4} tone="green" title="Downstream Models" icon={<span className="dbts-dbt-mark">✣</span>} active={activeStep===3} onClick={()=>setActiveStep(3)}>
        <CheckList items={["Transform data","Apply business logic","Add tests","Build analytics models"]}/>
      </FlowCard>
    </div>

    <div className="dbts-middle">
      <SqlPanel sql={scenario.sql} running={run.status==="running"} onRun={execute} onReset={reset}/>
      <section className="dbts-results">
        <header><span><Table2 size={16}/><strong>Query Results (Preview)</strong></span><div>Rows: {scenario.rowCount.toLocaleString("en-US")} <button onClick={execute}>View Full Results <ChevronRight size={12}/></button></div></header>
        <div className="dbts-table-wrap"><table><thead><tr><th>order_id</th><th>customer_id</th><th>order_date</th><th>total_amount</th></tr></thead><tbody>{scenario.rows.map(row=><tr key={row.orderId}><td>{row.orderId}</td><td>{row.customerId}</td><td>{row.orderDate}</td><td>{row.totalAmount}</td></tr>)}</tbody></table></div>
        <div className="dbts-run-state" aria-live="polite">{run.log.length===0?<span>Run the model to resolve source metadata and lineage.</span>:run.log.slice(-2).map(item=><span key={item}><Check size={12}/>{item}</span>)}</div>
      </section>
    </div>

    <div className="dbts-bottom">
      <YamlPanel yaml={scenario.yaml}/>
      <section className="dbts-lineage">
        <header><span><Zap size={16}/><strong>Model Lineage (DAG)</strong></span></header>
        <div className="dbts-dag">
          <button className={run.step>=1?"is-lit":""} onClick={()=>setActiveStep(0)}><span><Database size={22}/></span><b>{scenario.sourceGroup}.{scenario.tableName}</b><em>(source)</em><small>External table<br/>(Outside dbt)</small></button>
          <ArrowRight size={23}/>
          <button className={run.step>=3?"is-lit":""} onClick={()=>setActiveStep(2)}><span><Code2 size={22}/></span><b>{scenario.modelName}</b><em>(model)</em><small>Cleans &amp; standardizes<br/>raw data</small></button>
          <ArrowRight size={23}/>
          <button className={run.step>=5?"is-lit":""} onClick={()=>setActiveStep(3)}><span><Code2 size={22}/></span><b>{scenario.intermediateModel}</b><em>(model)</em><small>Applies business<br/>logic</small></button>
          <ArrowRight size={23}/>
          <button className={run.status==="success"?"is-lit":""} onClick={()=>setActiveStep(3)}><span><BarChart3 size={22}/></span><b>{scenario.martModel}</b><em>(model)</em><small>Used in dashboards<br/>and analytics</small></button>
        </div>
      </section>
    </div>
  </section>;
}

export function DbtSourcesRightRail({
  lessonTitles,currentLesson,completed,onLesson
}:{
  lessonTitles:string[];currentLesson:number;completed:number[];onLesson:(lesson:string)=>void;
}){
  const takeaways=[
    "source() represents an external table.",
    "Define sources in schema.yml.",
    "Use source() in models to query raw data.",
    "Add tests and freshness for reliability.",
    "Helps with lineage and documentation.",
  ];
  return <div className="dbts-right-rail">
    <section className="dbts-progress-card">
      <header><strong>Lesson Progress <ChevronDown size={13}/></strong><span>{completed.length} / {lessonTitles.length} done</span></header>
      <Progress value={completed.length/lessonTitles.length*100} className="dbts-progress"/>
      <div className="dbts-progress-list">{lessonTitles.map((lesson,index)=>{
        const done=completed.includes(index),current=index===currentLesson;
        return <button key={lesson} onClick={()=>onLesson(lesson)} className={current?"is-current":""}>
          {done?<CheckCircle2 size={16}/>:current?<Play size={16} fill="currentColor"/>:<Circle size={16}/>}
          <span>{index+1}. {lesson}</span>
          <small>{done?"Completed":current?"Learning":"Not started"}</small>
        </button>;
      })}</div>
    </section>
    <section className="dbts-takeaways">
      <h3><Lightbulb size={20}/>Key Takeaways</h3>
      {takeaways.map(item=><div key={item}><Check size={15}/><span>{item}</span></div>)}
    </section>
  </div>;
}
