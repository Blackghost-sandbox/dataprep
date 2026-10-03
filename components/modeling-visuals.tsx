"use client";

import { useState } from "react";
import { ModelingHistorySimulation, ModelingAnalyticsSimulation } from "@/components/modeling-history-analytics";
import { ArrowRight, BookOpen, CheckCircle2, Eye, KeyRound, Lightbulb, Link2, Network, TriangleAlert } from "lucide-react";
import { GlossaryTerm, GlossaryText } from "@/components/glossary";
import { SqlSampleTable } from "@/components/sql-fundamentals-visual";
import { DarkCodeCard } from "@/components/rdd-dataframe-experience";
import { useWalkthrough, WalkthroughControls } from "@/components/walkthrough-controls";
import { modelTables as t, type ModelingLesson } from "@/lib/data-modeling";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const entities=[
  {name:"Customer",fields:["PK customer_id","name","city"],detail:"One customer row. Name and city are attributes. A customer can exist before placing any orders.",table:t.customers},
  {name:"Order",fields:["PK order_id","FK customer_id","order_date"],detail:"One purchase order. customer_id references one Customer; repeated customer IDs across orders are allowed.",table:t.orders},
  {name:"OrderLine",fields:["PK/FK order_id","PK line_no","FK product_id","quantity · unit_price"],detail:"One purchased line. The composite key is (order_id, line_no); product_id connects to Product.",table:t.lines},
  {name:"Product",fields:["PK product_id","product","category"],detail:"One product description. Purchase price stays on OrderLine so catalog changes do not rewrite past sales.",table:t.products},
];
function EntityDiagram({extended=false,keys=false}:{extended?:boolean;keys?:boolean}){
  const [selected,setSelected]=useState(0);
  const nodes=extended?entities:entities.slice(0,2);
  return <div><p className="model-caption">Select a table to trace its role and sample rows. PK = <GlossaryTerm term="Primary Key"/> · FK = <GlossaryTerm term="Foreign Key"/>.</p>
    <div className="model-er" role="group" aria-label="Customer order relationships">{nodes.map((node,index)=><div className="model-er-part" key={node.name}>
      <button className="model-node" aria-pressed={selected===index} onClick={()=>setSelected(index)}><strong><Network size={15}/>{node.name}</strong>{node.fields.map(field=><span key={field} className={field.startsWith("PK")?"model-key":field.startsWith("FK")?"model-reference":""}>{field.startsWith("PK")?<KeyRound size={12}/>:field.startsWith("FK")?<Link2 size={12}/>:null}{field}</span>)}</button>
      {index<nodes.length-1&&<div className="model-relationship"><span>{index===2?"0..many → 1":"1 → 0..many"}</span><ArrowRight size={20}/><small>{index===0?"places":index===1?"contains":"references"}</small></div>}
    </div>)}</div>
    <p className="model-selection" role="status">{nodes[selected].detail}</p><SqlSampleTable table={nodes[selected].table} highlight={keys?[selected===0?"customer_id":"order_id","customer_id"]:[]}/>
    {extended&&<p className="model-caption">The diagram permits draft orders with zero lines. A checkout rule can require at least one line before confirmation; a foreign key alone cannot enforce that parent-side minimum.</p>}
  </div>;
}
const relationships=[
  {name:"One to one",left:"Customer",right:"Profile",notation:"1 ↔ 0..1",text:"A customer may have no profile or one profile in this example. Every profile belongs to one customer. Profile.customer_id must be UNIQUE and NOT NULL as well as a foreign key.",rows:{title:"profile · customer_id is unique",columns:["profile_id","customer_id"],rows:[[81,1],[82,2]]}},
  {name:"One to many",left:"Customer",right:"Orders",notation:"1 → 0..many",text:"Alice is one customer with two orders. Every order has one customer, but a customer may have no orders.",rows:t.orders},
  {name:"Many to many",left:"Student",right:"Course",notation:"many ↔ many",text:"An Enrollment bridge resolves the relationship into two one-to-many relationships. The pair is unique for a single course instance.",rows:{title:"enrollment · unique student/course pair",columns:["student_id","course_id"],rows:[[1,10],[1,20],[2,10]]}},
];
function CardinalityVisual(){
  const [index,setIndex]=useState(1);const r=relationships[index];
  return <div><div className="model-options" role="group" aria-label="Relationship type">{relationships.map((r,i)=><button key={r.name} aria-pressed={i===index} onClick={()=>setIndex(i)}>{r.name}</button>)}</div><div className="model-cardinality"><strong>{r.left}</strong><span>{r.notation}{index===2&&<small>via Enrollment</small>}</span><strong>{r.right}</strong></div><p className="model-selection" role="status">{r.text}</p><SqlSampleTable table={r.rows}/></div>;
}
const starNodes=[
  {id:"customer",label:"DIM_CUSTOMER",role:"Who bought?",fields:"customer_key · name · city",table:t.dimCustomer},
  {id:"product",label:"DIM_PRODUCT",role:"What was bought?",fields:"product_key · product · category",table:t.dimProduct},
  {id:"fact",label:"FACT_SALES",role:"One row per order line",fields:"customer_key · product_key · date_key · store_key | quantity · revenue",table:t.fact},
  {id:"date",label:"DIM_DATE",role:"When was it bought?",fields:"date_key · calendar_date · month",table:t.dimDate},
  {id:"store",label:"DIM_STORE",role:"Where was it sold?",fields:"store_key · store · region",table:t.dimStore},
];
function StarVisual(){
  const [selected,setSelected]=useState("fact");const node=starNodes.find(n=>n.id===selected)!;
  return <div><p className="model-caption">Select a table. Each spoke represents many facts referencing one dimension row.</p><div className="model-star" aria-label="Star schema: sales fact surrounded by four dimensions">
    <div className="model-spoke model-spoke-v" aria-hidden/><div className="model-spoke model-spoke-h" aria-hidden/>
    {starNodes.map(n=><button key={n.id} className={"model-star-node model-star-"+n.id} aria-pressed={selected===n.id} onClick={()=>setSelected(n.id)}><strong>{n.label}</strong><span>{n.role}</span><small>{n.id==="fact"?"N:1 to each dimension":"1:N to sales"}</small></button>)}
  </div><p className="model-selection" role="status"><b>{node.label}</b> · {node.fields}</p><SqlSampleTable table={node.table}/></div>;
}
function SnowflakeVisual(){
  const [snowflake,setSnowflake]=useState(false);
  return <div><div className="model-options" role="group" aria-label="Dimension structure"><button aria-pressed={!snowflake} onClick={()=>setSnowflake(false)}>Star dimension</button><button aria-pressed={snowflake} onClick={()=>setSnowflake(true)}>Snowflake dimension</button></div><div className="model-chain"><div><b>FACT_SALES</b><small>product_key</small></div><span>N → 1</span><div><b>DIM_PRODUCT</b><small>{snowflake?"product_key · category_key":"product_key · category"}</small></div>{snowflake&&<><span>N → 1</span><div><b>DIM_CATEGORY</b><small>category_key · category</small></div></>}</div><p className="model-selection" role="status">{snowflake?"Category descriptions live in a shared table. A report follows one extra relationship; validate membership and measure the workload.":"Category descriptions repeat within the product dimension. The report reads one product dimension directly."}</p><SqlSampleTable table={snowflake?{title:"Normalized product hierarchy",columns:["product_key","product","category_key"],rows:[[10,"Notebook",7],[20,"Pen",7]]}:t.dimProduct}/>{snowflake&&<SqlSampleTable table={{title:"dim_category",columns:["category_key","category"],rows:[[7,"Stationery"]]}}/>}</div>;
}
function SCDVisual(){ return <ModelingHistorySimulation/>; }
function WorkloadVisual(){return <div className="model-workloads"><article><h4>OLTP · record the purchase</h4><div className="model-event">Order 501 → check → commit</div><ul><li>Small, frequent transactions</li><li>Current operational state</li><li>Reliable inserts and updates</li></ul><p>Example: confirm two purchased items without losing either line.</p></article><article><h4>OLAP · understand sales</h4><div className="model-event">Many events → group → report</div><ul><li>Scans and aggregations</li><li>Historical analysis</li><li>Clear measures and dimensions</li></ul><p>Example: compare monthly category revenue across stores.</p></article></div>;}
function AnalyticsVisual(){ return <ModelingAnalyticsSimulation/>; }
export function ModelingWalkthrough({lesson}:{lesson:ModelingLesson}){
  const state=useWalkthrough(lesson.frames.length);
  return <section className="model-walkthrough"><header><h3><Eye size={19}/> Follow the Model</h3><span>Step {state.step+1} / {state.total}</span></header>
    <div className="model-frame-stack">{lesson.frames.map((frame,index)=><div key={frame.title} className="model-frame" style={{visibility:state.step===index?"visible":"hidden"}} aria-hidden={state.step!==index} inert={state.step!==index}><h4>{frame.title}</h4><p><GlossaryText>{frame.description}</GlossaryText></p><div className="model-tables">{frame.tables.map(table=><SqlSampleTable key={table.title} table={table}/>)}</div></div>)}</div>
    <div className="model-navigation"><WalkthroughControls state={state} stableNavigation/></div>
  </section>;
}
export function ModelingVisual({lesson}:{lesson:ModelingLesson}){
  const kind=lesson.visual;
  return <section className="model-visual"><h3><Network size={19}/> {kind==="scd"?"See the history":kind==="workloads"?"Two different jobs":kind==="analytics"?"From question to model":"See the model"}</h3>
    {kind==="entities"||kind==="keys"||kind==="er"?<EntityDiagram extended={kind==="er"} keys={kind==="keys"}/>:kind==="cardinality"?<CardinalityVisual/>:kind==="facts"||kind==="star"?<StarVisual/>:kind==="snowflake"?<SnowflakeVisual/>:kind==="scd"?<SCDVisual/>:kind==="workloads"?<WorkloadVisual/>:kind==="analytics"?<AnalyticsVisual/>:<ModelingWalkthrough lesson={lesson}/>}
  </section>;
}
export function ModelingConcept({lesson,onTab}:{lesson:ModelingLesson;onTab?:(tab:string)=>void}){
  return <div className="sql-concept-sequence model-concept"><section className="sql-concept-intro"><div className="sql-intro-copy"><h3><BookOpen size={19}/> {lesson.title}</h3><p><GlossaryText>{lesson.concepts[0][1]}</GlossaryText></p><p className="sql-mental-question"><Lightbulb size={18}/><span>Think: “{lesson.question}”</span></p></div><div className="sql-model-panel"><h4>Mental model</h4><ol className="sql-mental-model">{lesson.frames.slice(0,3).map((f,i)=><li key={f.title}><span><Network size={22}/><b>{f.title.split(":")[0]}</b></span>{i<2&&<ArrowRight size={15}/>}</li>)}</ol></div></section>
    <ModelingVisual lesson={lesson}/>
    {!["normalization","denormalization"].includes(lesson.visual)&&<details className="model-worked-details"><summary>Follow the Model · trace the sample rows</summary><ModelingWalkthrough lesson={lesson}/></details>}
    <div className="sql-callout-pair"><section className="sql-compact-callout"><h3><Lightbulb size={18}/>Why it matters</h3><p><GlossaryText>{lesson.why}</GlossaryText></p></section><section className="sql-compact-callout sql-remember"><h3><TriangleAlert size={18}/>Remember</h3><p><GlossaryText>{lesson.remember}</GlossaryText></p></section></div>
    <section className="sql-compact-callout sql-takeaway"><h3><CheckCircle2 size={18}/>Key Takeaway</h3><p><GlossaryText>{lesson.takeaway}</GlossaryText></p>{onTab&&<nav className="spark-actions" aria-label="Continue learning"><button onClick={()=>onTab("Examples")}>Explore Examples →</button><button onClick={()=>onTab("Hands-on")}>Practice this model →</button></nav>}</section>
  </div>;
}
export function ModelingExample({lesson}:{lesson:ModelingLesson}){return <><h2>{lesson.title} · worked example</h2><p className="spark-caption">One retail dataset throughout: Alice, Bob, Notebook and Pen. Sales total 200 in one currency.</p><ModelingWalkthrough lesson={lesson}/>{lesson.example.code&&<><h3>How the model appears in SQL</h3><DarkCodeCard title="SQL · illustrative model" code={lesson.example.code}/><p className="spark-caption">Schema fragments and queries are illustrative, not executed in the browser. Use a scratch database with the displayed model.</p></>}</>;}
export function ModelingPractice({lesson,choice,onChoice,rationale,onRationale}:{lesson:ModelingLesson;choice:string;onChoice:(value:string)=>void;rationale:string;onRationale:(value:string)=>void}){
  const [checked,setChecked]=useState(false);
  const correct=choice===String(lesson.decision.correct);
  return <div className="model-practice"><SqlSampleTable table={lesson.frames[0].tables[0]}/><fieldset className="spark-question"><legend>Choose the model you would defend</legend><RadioGroup aria-label={lesson.decision.question} value={choice} onValueChange={value=>{setChecked(false);onChoice(value);}}>{lesson.decision.options.map((option,index)=><label key={option}><RadioGroupItem value={String(index)}/>{option}</label>)}</RadioGroup></fieldset><label htmlFor={lesson.id+"-reasoning"}>Explain your choice: grain, keys, relationships and one trade-off.</label><textarea id={lesson.id+"-reasoning"} value={rationale} onChange={e=>onRationale(e.target.value)} placeholder="I would choose this because…"/><button className="spark-primary" disabled={!choice} onClick={()=>setChecked(true)}>Check design choice</button>{checked&&<p role="status" className={correct?"spark-answer":"spark-warning"}>{correct?`Good choice. ${lesson.decision.explanation}`:`Revisit the rule: ${lesson.practice.hint} Try another model before revealing the worked solution.`}</p>}<p className="spark-caption">The selection is checked locally. Your written reasoning is saved on this device, not automatically graded.</p></div>;
}

