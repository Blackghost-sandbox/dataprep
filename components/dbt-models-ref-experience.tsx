"use client";
import {useDbtMotion} from "@/components/dbt-motion";

import {useEffect,useMemo,useRef,useState} from "react";
import {
  ArrowRight, BarChart3, BookOpen, CheckCircle2, ChevronDown, ChevronLeft,
  ChevronRight, Circle, Clock3, Code2, Database, FileCode2, Folder,
  FolderOpen, GitBranch, GraduationCap, Link2, Play, RefreshCcw, Table2,
  Zap
} from "lucide-react";
import {Progress} from "@/components/ui/progress";
import {
  advanceDbtModelsRun, dbtModelsScenarios, getDbtModelsScenario,
  newDbtModelsRunState, type DbtModelsScenarioId
} from "@/lib/dbt-models-ref-simulation";

export function DbtModelsHero({
  description,minutes,currentLesson,total,onPrevious,onNext
}:{
  description:string;minutes:number;currentLesson:number;total:number;
  onPrevious:()=>void;onNext:()=>void;
}){
  return <section className="dbtm-hero">
    <div className="dbtm-hero-copy">
      <div className="dbtm-breadcrumb"><span>dbt</span><ChevronRight size={14}/><strong>Models &amp; ref()</strong></div>
      <div className="dbtm-title-row">
        <span className="dbtm-hero-icon"><Zap size={30}/></span>
        <div><h1>Models &amp; ref()</h1><p>{description}</p></div>
      </div>
      <div className="dbtm-meta"><span><Clock3 size={14}/>{minutes} min</span><span><GraduationCap size={14}/>Lesson {currentLesson+1}/{total}</span></div>
    </div>
    <div className="dbtm-hero-side">
      <span className="dbtm-level">Intermediate</span>
      <div className="dbtm-watermark" aria-hidden="true">M</div>
      <div className="dbtm-nav">
        <button onClick={onPrevious} disabled={currentLesson===0} aria-label="Previous lesson"><ChevronLeft size={17}/></button>
        <button onClick={onNext} disabled={currentLesson===total-1}>Next <ChevronRight size={16}/></button>
      </div>
    </div>
  </section>;
}

function StageCard({tone,icon,title,badge,children,footer,active}:{tone:string;icon:React.ReactNode;title:string;badge:string;children:React.ReactNode;footer:string;active:boolean}){
  return <article className={"dbtm-stage dbtm-"+tone+(active?" is-active":"")}>
    <header><span className="dbtm-stage-icon">{icon}</span><div><h3>{title}</h3><small>{badge}</small></div></header>
    <div className="dbtm-stage-copy">{children}</div>
    <div className="dbtm-stage-footer">{footer}<ChevronRight size={14}/></div>
  </article>;
}

function CodePanel({code,onRun,onReset,running}:{code:string;onRun:()=>void;onReset:()=>void;running:boolean}){
  return <section className="dbtm-code-panel">
    <header>
      <span><FileCode2 size={16}/>stg_orders.sql</span>
      <div>
        <button className="dbtm-run" onClick={onRun} disabled={running}><Play size={14} fill="currentColor"/>{running?"Running…":"Run Model"}</button>
        <button onClick={onReset}><RefreshCcw size={14}/>Reset</button>
      </div>
    </header>
    <pre><code>{code.split("\n").map((line,i)=><span className="dbtm-code-line" key={i}><b>{i+1}</b><span>{line}</span></span>)}</code></pre>
  </section>;
}

export function DbtModelsRefLab(){
 const dbtMotion=useDbtMotion(".dbtm-dag > button");
  const [scenarioId,setScenarioId]=useState<DbtModelsScenarioId>("ecommerce");
  const [run,setRun]=useState(()=>newDbtModelsRunState());
  const [selectedStage,setSelectedStage]=useState(0);
  const timers=useRef<number[]>([]);
  const scenario=useMemo(()=>getDbtModelsScenario(scenarioId),[scenarioId]);

  const clearTimers=()=>{timers.current.forEach(id=>window.clearTimeout(id));timers.current=[];};
  useEffect(()=>()=>clearTimers(),[]);

  const reset=()=>{clearTimers();setRun(newDbtModelsRunState());setSelectedStage(0);};
  const selectScenario=(id:DbtModelsScenarioId)=>{clearTimers();setScenarioId(id);setRun(newDbtModelsRunState());setSelectedStage(0);};
  const execute=()=>{
    clearTimers();
    let state=newDbtModelsRunState();
    setRun(state);
    for(let i=0;i<6;i++){
      const timer=window.setTimeout(()=>{
        state=advanceDbtModelsRun(state,scenario);
        setRun(state);
        setSelectedStage(Math.min(3,Math.floor((state.step-1)/2)+1));
      },220*(i+1));
      timers.current.push(timer);
    }
  };

  const success=run.status==="success";
  return <section {...dbtMotion} className="dbtm-lab" aria-label="dbt Models and ref interactive simulation">
    <header className="dbtm-lab-head">
      <div><h2><BookOpen size={20}/>Understand Models &amp; ref()</h2><p>See how dbt models are defined in SQL files and how <strong>ref()</strong> creates an ordered dependency graph between them.</p></div>
      <label><span>Scenario</span><select value={scenarioId} onChange={e=>selectScenario(e.target.value as DbtModelsScenarioId)}>{dbtModelsScenarios.map(item=><option value={item.id} key={item.id}>{item.label}</option>)}</select><ChevronDown size={14}/></label>
    </header>

    <div className="dbtm-stage-flow">
      <button onClick={()=>setSelectedStage(0)}><StageCard tone="blue" icon={<Table2 size={18}/>} title={scenario.stagingModel} badge="Model" footer={scenario.stagingModel+".sql"} active={selectedStage===0}><><span>✦ Clean and standardize</span><b>raw order data</b></></StageCard></button>
      <ArrowRight size={24}/>
      <button onClick={()=>setSelectedStage(1)}><StageCard tone="amber" icon={<Link2 size={18}/>} title="ref()" badge="Function" footer={"ref('"+scenario.stagingModel+"')"} active={selectedStage===1}><><span>✦ Create dependency</span><b>between models</b></></StageCard></button>
      <ArrowRight size={24}/>
      <button onClick={()=>setSelectedStage(2)}><StageCard tone="violet" icon={<Database size={18}/>} title={scenario.factModel} badge="Model" footer={scenario.factModel+".sql"} active={selectedStage===2}><><span>✦ Build fact table using</span><b>{scenario.stagingModel}</b></></StageCard></button>
      <ArrowRight size={24}/>
      <button onClick={()=>setSelectedStage(3)}><StageCard tone="green" icon={<BarChart3 size={18}/>} title="Downstream" badge="Analytics" footer="analytical models" active={selectedStage===3}><><span>✦ Used in dashboards</span><b>and BI tools</b></></StageCard></button>
    </div>

    <div className="dbtm-mid-grid">
      <CodePanel code={scenario.sourceCode} onRun={execute} onReset={reset} running={run.status==="running"}/>
      <section className="dbtm-lineage">
        <header><GitBranch size={17}/><strong>Model Lineage (DAG)</strong></header>
        <div className="dbtm-dag">
          <button className={run.step>=2?"is-lit":""} onClick={()=>setSelectedStage(0)}><span><Table2 size={20}/></span><b>{scenario.stagingModel}</b><small>Cleans &amp; standardizes<br/>raw data</small></button>
          <ArrowRight size={25}/>
          <button className={run.step>=4?"is-lit":""} onClick={()=>setSelectedStage(2)}><span><Table2 size={20}/></span><b>{scenario.factModel}</b><small>Builds fact table<br/>using ref()</small></button>
          <ArrowRight size={25}/>
          <button className={success?"is-lit":""} onClick={()=>setSelectedStage(3)}><span><BarChart3 size={20}/></span><b>{scenario.downstreamLabel}</b><small>Used in analytics<br/>dashboards</small></button>
        </div>
        <div className="dbtm-run-log" aria-live="polite">
          {run.log.length===0?<span>Run the model to watch dbt resolve the graph.</span>:run.log.slice(-2).map(item=><span key={item}><CheckCircle2 size={12}/>{item}</span>)}
        </div>
      </section>
    </div>

    <div className="dbtm-bottom-grid">
      <section className="dbtm-results">
        <header><span><Table2 size={16}/><strong>Query Results (Preview)</strong></span><div>Rows: {scenario.rowCount.toLocaleString("en-US")} <button onClick={execute}>View Full Results <ChevronRight size={12}/></button></div></header>
        <div className="dbtm-table-scroll"><table><thead><tr><th>order_id</th><th>customer_id</th><th>order_date</th><th>total_amount</th></tr></thead><tbody>{scenario.rows.map(row=><tr key={row.id}><td>{row.id}</td><td>{row.customer}</td><td>{row.date}</td><td>{row.amount}</td></tr>)}</tbody></table></div>
      </section>
      <section className="dbtm-tree">
        <header><Folder size={17}/><strong>Project Structure</strong></header>
        <div className="dbtm-tree-body">
          <div><ChevronDown size={13}/><FolderOpen size={15}/><b>models/</b></div>
          <div className="level1"><ChevronDown size={13}/><FolderOpen size={15}/><b>staging/</b></div>
          <div className="level2"><FileCode2 size={14}/><span>{scenario.stagingModel}.sql</span><small>SQL</small></div>
          <div className="level1"><ChevronDown size={13}/><FolderOpen size={15}/><b>marts/</b></div>
          <div className="level2"><FileCode2 size={14}/><span>{scenario.factModel}.sql</span><small>SQL</small></div>
          <div className="level2"><FileCode2 size={14}/><span>dim_customers.sql</span><small>SQL</small></div>
        </div>
      </section>
    </div>
  </section>;
}

export function DbtModelsRightRail({lessonTitles,currentLesson,completed,onLesson}:{lessonTitles:string[];currentLesson:number;completed:number[];onLesson:(lesson:string)=>void;}){
  return <section className="dbtm-progress-card">
    <header><strong>Lesson Progress <ChevronDown size={13}/></strong><span>{completed.length} / {lessonTitles.length} done</span></header>
    <Progress value={completed.length/lessonTitles.length*100} className="dbtm-progress"/>
    <div className="dbtm-progress-list">{lessonTitles.map((lesson,index)=>{
      const done=completed.includes(index), current=index===currentLesson;
      return <button key={lesson} onClick={()=>onLesson(lesson)} className={current?"is-current":""}>
        {done?<CheckCircle2 size={16}/>:current?<Play size={16} fill="currentColor"/>:<Circle size={16}/>}
        <span>{index+1}. {lesson}</span>
        <small>{done?"Completed":current?"Learning":"Not started"}</small>
      </button>;
    })}</div>
  </section>;
}
