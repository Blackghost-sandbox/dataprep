"use client";

import {useMemo,useState} from "react";
import {
  ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, ChevronLeft,
  ChevronRight, Circle, Clock3, Database, FileCode2, FileText, Folder,
  FolderOpen, GraduationCap, Lightbulb, Play, RefreshCcw, Settings2,
  ShieldCheck, Sparkles, Table2, Zap
} from "lucide-react";
import {Progress} from "@/components/ui/progress";
import {useCompanion} from "@/components/companion-context";
import {
  buildDocsPreview,
  dbtProjectScenarios,
  getDbtProjectNode,
  getDbtProjectScenario,
  validateDbtProject,
  type DbtProjectNode,
  type DbtProjectScenarioId,
  type DbtProjectValidation,
} from "@/lib/dbt-project-structure-simulation";

export function DbtProjectStructureHero({
  description,minutes,currentLesson,total,onPrevious,onNext
}:{
  description:string;minutes:number;currentLesson:number;total:number;
  onPrevious:()=>void;onNext:()=>void;
}){
  return <section className="dbtp-hero">
    <div className="dbtp-hero-copy">
      <div className="dbtp-breadcrumb"><span>dbt</span><ChevronRight size={14}/><strong>Project Structure &amp; Documentation</strong></div>
      <div className="dbtp-title-row">
        <span className="dbtp-hero-icon"><Zap size={30}/></span>
        <div><h1>Project Structure &amp; Documentation</h1><p>{description}</p></div>
      </div>
      <div className="dbtp-meta"><span><Clock3 size={15}/>{minutes} min</span><span><GraduationCap size={15}/>Lesson {currentLesson+1}/{total}</span></div>
    </div>
    <div className="dbtp-hero-side">
      <span className="dbtp-level">Intermediate</span>
      <div className="dbtp-watermark" aria-hidden="true">M</div>
      <div className="dbtp-nav">
        <button onClick={onPrevious} disabled={currentLesson===0} aria-label="Previous lesson"><ChevronLeft size={18}/></button>
        <button onClick={onNext} disabled={currentLesson===total-1}>Next <ChevronRight size={17}/></button>
      </div>
    </div>
  </section>;
}

function TreeRow({
  node,depth,selected,onSelect
}:{
  node:DbtProjectNode;
  depth:number;
  selected:boolean;
  onSelect:()=>void;
}){
  const icon=node.kind==="folder"
    ? <Folder size={15}/>
    : node.kind==="yaml"
      ? <Settings2 size={14}/>
      : node.kind==="markdown"
        ? <FileText size={14}/>
        : node.kind==="csv"
          ? <Table2 size={14}/>
          : <FileCode2 size={14}/>;
  return <button type="button" onClick={onSelect} className={selected?"dbtp-tree-row is-selected":"dbtp-tree-row"} style={{paddingLeft:12+depth*21}}>
    <span className={"dbtp-tree-icon is-"+node.kind}>{icon}</span>
    <span>{node.label}</span>
  </button>;
}

function ProjectTree({
  scenarioId,selectedId,onSelect
}:{
  scenarioId:DbtProjectScenarioId;
  selectedId:string;
  onSelect:(id:string)=>void;
}){
  const scenario=getDbtProjectScenario(scenarioId);
  const byId=new Map(scenario.nodes.map(node=>[node.id,node]));
  const row=(id:string,depth:number)=><TreeRow key={id} node={byId.get(id)!} depth={depth} selected={selectedId===id} onSelect={()=>onSelect(id)}/>;
  return <div className="dbtp-tree">
    {row("project",0)}
    {row("config",1)}
    {row("models",1)}
    {row("staging",2)}
    {row("stg-orders",3)}
    {row("stg-customers",3)}
    {row("marts",2)}
    {row("fct-orders",3)}
    {row("fct-customers",3)}
    {row("macros",1)}
    {row("date-utils",2)}
    {row("tests",1)}
    {row("schema",2)}
    {row("seeds",1)}
    {row("countries",2)}
    {row("docs",1)}
    {row("readme",2)}
  </div>;
}

function StructureCallout({
  tone,icon,title,description,onClick
}:{
  tone:"blue"|"violet"|"orange"|"green"|"pink"|"purple";
  icon:React.ReactNode;
  title:string;
  description:string;
  onClick:()=>void;
}){
  return <button type="button" className={"dbtp-callout dbtp-callout-"+tone} onClick={onClick}>
    <span className="dbtp-callout-icon">{icon}</span>
    <div><strong>{title}</strong><p>{description}</p></div>
  </button>;
}

function ValidationSummary({validation}:{validation:DbtProjectValidation|null}){
  if(!validation) return <div className="dbtp-validation-empty"><Circle size={15}/>Run the simulation to validate the project structure.</div>;
  return <div className="dbtp-validation-summary">
    <div className="dbtp-score"><strong>{validation.score}%</strong><span>Maintainability</span></div>
    <div className="dbtp-issues">
      {validation.issues.length===0?<div className="is-pass"><CheckCircle2 size={15}/>No issues found</div>:validation.issues.map(issue=><div key={issue.id} className={issue.severity==="error"?"is-error":"is-warning"}><ShieldCheck size={14}/><span><b>{issue.path}</b>{issue.message}</span></div>)}
    </div>
  </div>;
}

export function DbtProjectStructureLab(){
  const companion=useCompanion();
  const [scenarioId,setScenarioId]=useState<DbtProjectScenarioId>("healthy");
  const [selectedId,setSelectedId]=useState("project");
  const [validation,setValidation]=useState<DbtProjectValidation|null>(null);
  const [running,setRunning]=useState(false);
  const scenario=useMemo(()=>getDbtProjectScenario(scenarioId),[scenarioId]);
  const selected=useMemo(()=>getDbtProjectNode(scenario,selectedId),[scenario,selectedId]);
  const docs=useMemo(()=>buildDocsPreview(selected),[selected]);

  const selectScenario=(id:DbtProjectScenarioId)=>{
    setScenarioId(id);
    setSelectedId("project");
    setValidation(null);
  };
  const reset=()=>{
    setScenarioId("healthy");
    setSelectedId("project");
    setValidation(null);
    setRunning(false);
  };
  const run=()=>{
    setRunning(true);
    setValidation(null);
    window.setTimeout(()=>{
      const next=validateDbtProject(scenario);
      setValidation(next);
      setRunning(false);
      companion?.emit({type:next.issues.length?"exercise_error":"exercise_correct",lesson:"Project Structure & Documentation",source:"runner"});
    },420);
  };

  return <section className="dbtp-lab" aria-label="dbt project structure and documentation interactive lesson">
    <section className="dbtp-explainer">
      <header className="dbtp-section-head">
        <h2><BookOpen size={21}/>How a dbt project is structured</h2>
        <p>A dbt project follows a standard directory structure. Each part has a clear purpose and works together to deliver reliable analytics code to production.</p>
      </header>

      <div className="dbtp-structure-grid">
        <div className="dbtp-tree-panel">
          <ProjectTree scenarioId={scenarioId} selectedId={selectedId} onSelect={setSelectedId}/>
        </div>

        <div className="dbtp-connectors" aria-hidden="true">
          <span/><span/><span/><span/><span/><span/>
        </div>

        <div className="dbtp-callouts">
          <StructureCallout tone="blue" icon={<Settings2 size={22}/>} title="dbt_project.yml" description="Project configuration (name, profile, paths, models, etc.)." onClick={()=>setSelectedId("config")}/>
          <StructureCallout tone="violet" icon={<Database size={22}/>} title="models/" description="SQL models organized by layers (staging, intermediate, marts)." onClick={()=>setSelectedId("models")}/>
          <StructureCallout tone="orange" icon={<Sparkles size={22}/>} title="macros/" description="Reusable Jinja macros to reduce repetition." onClick={()=>setSelectedId("macros")}/>
          <StructureCallout tone="green" icon={<ShieldCheck size={22}/>} title="tests/" description="Data tests and schema documentation (schema.yml)." onClick={()=>setSelectedId("tests")}/>
          <StructureCallout tone="pink" icon={<Table2 size={22}/>} title="seeds/" description="Static data files (CSV) to be loaded into the warehouse." onClick={()=>setSelectedId("seeds")}/>
          <StructureCallout tone="purple" icon={<BookOpen size={22}/>} title="docs/" description="Project documentation and README." onClick={()=>setSelectedId("docs")}/>
        </div>
      </div>
    </section>

    <section className="dbtp-simulation">
      <header className="dbtp-sim-head">
        <div className="dbtp-sim-title">
          <span><Play size={19} fill="currentColor"/></span>
          <div><h2>Run Simulation: Validate a dbt project</h2><p>Explore the project tree, switch scenarios, and run validation to see how structure and documentation affect maintainability.</p></div>
        </div>
        <div className="dbtp-controls">
          <label><span>Scenario</span><select value={scenarioId} onChange={e=>selectScenario(e.target.value as DbtProjectScenarioId)}>{dbtProjectScenarios.map(item=><option value={item.id} key={item.id}>{item.label}</option>)}</select><ChevronDown size={14}/></label>
          <button className="dbtp-run-top" onClick={run} disabled={running}><Play size={14} fill="currentColor"/>{running?"Validating…":"Run Simulation"}</button>
          <button onClick={reset}><RefreshCcw size={15}/>Reset</button>
        </div>
      </header>

      <div className="dbtp-sim-grid">
        <section className="dbtp-panel dbtp-inspector">
          <header><span className="dbtp-step">1</span><strong>Inspect Project Node</strong></header>
          <div className="dbtp-inspector-body">
            <div className={"dbtp-selected-icon is-"+selected.kind}>
              {selected.kind==="folder"?<FolderOpen size={25}/>:selected.kind==="yaml"?<Settings2 size={25}/>:selected.kind==="markdown"?<FileText size={25}/>:selected.kind==="csv"?<Table2 size={25}/>:<FileCode2 size={25}/>}
            </div>
            <strong>{selected.label}</strong>
            <span>{selected.path}</span>
            <p>{selected.description}</p>
            <div className="dbtp-inspector-meta"><span>Role <b>{selected.role}</b></span><span>Docs <b>{selected.documented?"Documented":"Missing"}</b></span></div>
          </div>
        </section>

        <section className="dbtp-panel dbtp-docs-preview">
          <header><span className="dbtp-step">2</span><strong>Documentation Preview</strong></header>
          <pre>{docs.join("\n")}</pre>
        </section>

        <section className="dbtp-panel dbtp-validation-panel">
          <header><span className="dbtp-step">3</span><strong>Project Validation</strong></header>
          <pre className="dbtp-terminal">{(validation?.terminal??["$ dbt parse","Ready. Run the simulation to validate project structure."]).map((line,index)=><span key={index} className={line.includes("passed")||line.includes("100%")?"is-pass":line.includes("issue")?"is-warning":""}>{line}</span>)}</pre>
          <ValidationSummary validation={validation}/>
        </section>
      </div>
    </section>
  </section>;
}

export function DbtProjectStructureRightRail({
  lessonTitles,currentLesson,completed,onLesson,onNotes
}:{
  lessonTitles:string[];
  currentLesson:number;
  completed:number[];
  onLesson:(lesson:string)=>void;
  onNotes:()=>void;
}){
  const takeaways=[
    "dbt projects follow a clear, modular structure.",
    "Organize models by layers (staging, marts, etc.).",
    "Use schema.yml to document models and tests.",
    "Macros and seeds improve reusability.",
    "Good documentation helps teams collaborate and scale.",
  ];
  return <div className="dbtp-right-rail">
    <section className="dbtp-progress-card">
      <header><strong>Lesson Progress <ChevronDown size={14}/></strong><span>{completed.length} / {lessonTitles.length} done</span></header>
      <Progress value={completed.length/lessonTitles.length*100} className="dbtp-progress"/>
      <div className="dbtp-progress-list">{lessonTitles.map((lesson,index)=>{
        const done=completed.includes(index),current=index===currentLesson;
        return <button key={lesson} onClick={()=>onLesson(lesson)} className={current?"is-current":""}>
          {done?<CheckCircle2 size={17}/>:current?<Play size={17} fill="currentColor"/>:<Circle size={17}/>}
          <span>{index+1}. {lesson}</span>
          <small>{done?"Completed":current?"Learning":"Not started"}</small>
        </button>;
      })}</div>
    </section>

    <section className="dbtp-takeaways">
      <h3><Lightbulb size={21}/>Key Takeaways</h3>
      {takeaways.map(item=><div key={item}><Check size={15}/><span>{item}</span></div>)}
      <button type="button" className="dbtp-notes-link" onClick={onNotes}>Quick Notes <ChevronRight size={14}/></button>
    </section>
  </div>;
}
