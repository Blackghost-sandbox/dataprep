"use client";

import { useEffect, useState } from "react";
import { Eye, Play, Pause, ArrowLeft, ArrowDown, Check, Layers3, Code2, Lightbulb } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { LearningTerm } from "@/components/learning-term";
import { ExpandingContent, DarkCodeCard } from "@/components/rdd-dataframe-experience";
import { SqlDataStep } from "@/components/sql-data-step";
import { useWalkthrough, WalkthroughControls } from "@/components/walkthrough-controls";
import { sqlSteps, sqlQuery, dataframeQuery, sqlSetup } from "@/lib/spark-sql-example";

const common=[
  ["Logical Plan","Describe the required result"],
  ["Catalyst Optimizer","Analyze columns and optimize expressions"],
  ["Physical Plan","Choose concrete execution operators"],
  ["Spark Core","Schedule stages and tasks"],
  ["Result","IN: 120 · US: 50"],
];
const descriptions=[
  "SQL expresses the request as text; the DataFrame API expresses it with method calls.",
  "Both describe filtering positive amounts and adding sales by country.",
  "Catalyst resolves names and types, then optimizes the structured query.",
  "Spark chooses scan, filter, aggregation, and shuffle operators as needed.",
  "An action requests execution. Tasks run across data partitions.",
  "Both return the same totals: IN = 120 and US = 50.",
];

const technicalFlows=[
 ["SQL text or DataFrame expressions","Resolve the sales input"],
 ["Aggregate country + sum(amount)","Filter amount > 0","Relation sales"],
 ["Resolve country and amount types","Keep required columns: country, amount","Optimize structured expressions; no extra column-pruning gain in this two-column input"],
 ["Final aggregate","Exchange by country (if needed)","Partial aggregate","Filter + scan"],
 ["Create tasks for partitions","Schedule on available executors","Shuffle matching country keys","Merge partial totals"],
 ["IN: 120","US: 50"],
];
export function SparkSqlComparison(){
  const [detailed,setDetailed]=useState(false);
  const [mode,setMode]=useState<"side"|"step">("side");
  const [step,setStep]=useState(-1);
  const [playing,setPlaying]=useState(false);
  const [selected,setSelected]=useState([2,2]);
  const [copied,setCopied]=useState(-1);
  const [why,setWhy]=useState(false);
  const reduced=useReducedMotion();
  const walkthrough=useWalkthrough(4);
  useEffect(()=>{
    if(!playing)return;
    if(step>=5||reduced){setPlaying(false);return;}
    const timer=window.setTimeout(()=>{setStep(value=>value+1);setSelected([step+1,step+1]);},detailed?4500:1500);
    return ()=>window.clearTimeout(timer);
  },[playing,step,detailed,reduced]);
  function advance(value:number){setPlaying(false);setStep(value);setSelected([value,value]);}
  return <section className="visual-comparison-card">
    <header className="visual-comparison-header"><div className="visual-title"><span><Eye size={21}/></span><div><h2>Visual Comparison: SQL Query vs DataFrame API</h2><p>Two ways to ask the same question. One Spark SQL execution engine.</p></div></div>
    <div className="visual-header-controls"><button className="execution-play" onClick={()=>{if(detailed){walkthrough.toggle();return;}if(playing){setPlaying(false);return;}if(step<0||step===5)advance(0);if(!reduced)setPlaying(true);else advance(Math.min(step+1,5));}}>{(detailed?walkthrough.auto:playing)?<Pause size={14}/>:<Play size={14}/>} {(detailed?walkthrough.auto:playing)?"Pause":detailed?"Auto-play data flow":"Animate Execution"}</button>
    <button className="execution-detail-toggle" aria-expanded={detailed} onClick={()=>{walkthrough.change(0);setDetailed(!detailed);setPlaying(false);setStep(-1);setSelected([2,2]);}}>{detailed?<ArrowLeft size={14}/>:<Eye size={14}/>} {detailed?"Back to Overview":"View Detailed Execution"}</button>
    <div className="visual-mode" role="group" aria-label="Comparison view">{(["side","step"] as const).map(value=><button key={value} className={mode===value?"selected":""} aria-pressed={mode===value} onClick={()=>{setMode(value);if(value==="step"){advance(0);walkthrough.change(0);setDetailed(true);}}}>{value==="side"?"Side by side":"Step by step"}</button>)}</div></div></header>
    <div className="operation-bar"><label>Operation<select aria-label="SQL operation"><option>Filter → GroupBy → Sum</option></select></label><code>WHERE amount &gt; 0 → GROUP BY country → SUM(amount)</code></div>
    <div className="execution-grid">{(["SQL Query","DataFrame API"] as const).map((title,index)=><div key={title} className={"execution-pipeline execution-"+(index===0?"rdd":"dataframe")}>
      <header><i className="pipeline-emblem">{index===0?<Code2 size={21}/>:<Layers3 size={21}/>}</i><div><span>{title}</span><small> {index===0?"(Declarative SQL)":"(Structured expressions)"}</small></div></header>
      <ExpandingContent>{detailed ? <><SqlDataStep step={walkthrough.step} api={index===0?"sql":"df"}/><details className="execution-technical"><summary>Explore execution stages</summary><div className="detailed-execution"><nav aria-label={title+" stages"}>{[["Your Query",""],...common].map(([name],i)=><button key={name} aria-current={selected[index]===i?"step":undefined} onClick={()=>{walkthrough.change(walkthrough.step);setPlaying(false);setSelected(values=>values.map((v,j)=>j===index?i:v));}}><span>{i+1}</span>{name}</button>)}</nav><div className="detail-canvas"><h4>{[["Your Query"],...common][selected[index]][0]}</h4><p>{descriptions[selected[index]]}</p><div className="detail-flow">{technicalFlows[selected[index]].map((text,i)=><div key={text}><code>{text}</code>{i<technicalFlows[selected[index]].length-1&&<ArrowDown size={14}/>}</div>)}</div><small>Conceptual flow; inspect explain() for the actual physical plan.</small></div></div></details></> :
      <div className="execution-body"><ol>{[[index===0?"SQL query":"Your Code",index===0?"SELECT country, SUM(amount)":"filter → groupBy → sum"],...common].map(([name,detail],i)=><li key={name} className={step<0?"idle":i===step?"active":i<step?"complete":"upcoming"}><div className="execution-stage"><strong><LearningTerm term={name} deepDive/></strong><span>{detail}</span></div>{i<5&&<ArrowDown className="execution-arrow" size={16}/>}</li>)}</ol><aside><h4>Key characteristics</h4>{(index===0?["SQL text","Temporary view","Named columns","Catalyst optimized","Same result"]:["Structured API","DataFrame","Schema enforced","Catalyst optimized","Same result"]).map(term=><p key={term}><Check size={14}/><LearningTerm term={term}/></p>)}</aside></div>}</ExpandingContent>
    </div>)}<div className="execution-vs">VS</div></div>
    {detailed&&<div className="execution-walkthrough"><p aria-live="polite">{sqlSteps[walkthrough.step].explanation}</p><WalkthroughControls state={walkthrough}/></div>}
    {step>=0&&!detailed&&<div className="execution-walkthrough"><p aria-live="polite">{descriptions[step]}</p><div className="execution-controls"><button disabled={step===0} onClick={()=>advance(step-1)}>← Back</button><span>Step {step+1} / 6</span><button onClick={()=>advance(step===5?0:step+1)}>{step===5?"Restart":"Next →"}</button></div></div>}
    <p className="spark-caption">Both examples need the same sales input. Open setup before running them in your Spark notebook.</p><details className="execution-technical"><summary>Shared input setup · five sales</summary><DarkCodeCard title="PySpark setup" code={sqlSetup}/></details><div className="comparison-code-grid"><DarkCodeCard title="Equivalent SQL · run in a SQL cell" code={sqlQuery}/><DarkCodeCard title="Equivalent DataFrame · PySpark" code={dataframeQuery}/></div>
    <section className="why-panel"><span className="why-icon"><Lightbulb size={20}/></span><div><h3>Do SQL and DataFrame use different engines?</h3><p>No. Both use Spark SQL and Catalyst for structured queries.</p></div><button aria-expanded={why} onClick={()=>setWhy(!why)}>{why?"Hide explanation":"See detailed explanation"}</button>{why&&<div className="why-detail">Equivalent expressions can produce equivalent plans. Choose the interface that suits your team; compare actual plans and workloads rather than assuming SQL or DataFrames are always faster.</div>}</section>
  </section>;
}
