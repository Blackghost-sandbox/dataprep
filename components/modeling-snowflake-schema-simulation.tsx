"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Database,
  GraduationCap,
  KeyRound,
  Lightbulb,
  Link2,
  Network,
  Play,
  RefreshCcw,
  Snowflake,
  Store,
  Table2,
  UserRound,
  Zap,
} from "lucide-react";
import { useCompanion } from "@/components/companion-context";

type ScenarioId="retail"|"ecommerce"|"subscriptions";
type TableId="fact"|"customer"|"segment"|"product"|"subcategory"|"category"|"date"|"store";
type Mode="schema"|"data";
type Phase="ready"|"fact"|"dimensions"|"subdimensions"|"query"|"complete";
type Row=Record<string,string|number>;

type TableDef={id:TableId;label:string;role:"fact"|"dimension"|"subdimension";columns:string[];rows:Row[]};
type Scenario={id:ScenarioId;name:string;tables:Record<TableId,TableDef>};

const retailTables:Record<TableId,TableDef>={
  fact:{id:"fact",label:"Fact Sales",role:"fact",columns:["order_id","customer_key","product_key","date_key","store_key","quantity","amount"],rows:[
    {order_id:1001,customer_key:1,product_key:101,date_key:20240101,store_key:1,quantity:2,amount:1200},
    {order_id:1002,customer_key:2,product_key:102,date_key:20240101,store_key:2,quantity:1,amount:980},
    {order_id:1003,customer_key:3,product_key:103,date_key:20240102,store_key:1,quantity:3,amount:720},
    {order_id:1004,customer_key:1,product_key:104,date_key:20240103,store_key:3,quantity:1,amount:450},
    {order_id:1005,customer_key:4,product_key:105,date_key:20240103,store_key:2,quantity:2,amount:320},
  ]},
  customer:{id:"customer",label:"Customer",role:"dimension",columns:["customer_key","name","city","segment_key"],rows:[
    {customer_key:1,name:"Alice",city:"New York",segment_key:1},
    {customer_key:2,name:"Bob",city:"Chicago",segment_key:2},
    {customer_key:3,name:"Carol",city:"San Francisco",segment_key:3},
    {customer_key:4,name:"David",city:"Austin",segment_key:1},
    {customer_key:5,name:"Emma",city:"Miami",segment_key:3},
  ]},
  segment:{id:"segment",label:"Customer Segment",role:"subdimension",columns:["segment_key","segment_name"],rows:[
    {segment_key:1,segment_name:"Retail"},{segment_key:2,segment_name:"Wholesale"},{segment_key:3,segment_name:"Online"},
  ]},
  product:{id:"product",label:"Product",role:"dimension",columns:["product_key","product_name","subcategory_key"],rows:[
    {product_key:101,product_name:"Laptop",subcategory_key:10},
    {product_key:102,product_name:"Phone",subcategory_key:11},
    {product_key:103,product_name:"Tablet",subcategory_key:12},
    {product_key:104,product_name:"Monitor",subcategory_key:13},
    {product_key:105,product_name:"Keyboard",subcategory_key:14},
  ]},
  subcategory:{id:"subcategory",label:"Product Subcategory",role:"subdimension",columns:["subcategory_key","subcategory_name","category_key"],rows:[
    {subcategory_key:10,subcategory_name:"Laptops",category_key:100},
    {subcategory_key:11,subcategory_name:"Phones",category_key:101},
    {subcategory_key:12,subcategory_name:"Tablets",category_key:102},
    {subcategory_key:13,subcategory_name:"Displays",category_key:103},
    {subcategory_key:14,subcategory_name:"Peripherals",category_key:104},
  ]},
  category:{id:"category",label:"Product Category",role:"subdimension",columns:["category_key","category_name"],rows:[
    {category_key:100,category_name:"Electronics"},
    {category_key:101,category_name:"Computers"},
    {category_key:102,category_name:"Accessories"},
    {category_key:103,category_name:"Home & Kitchen"},
    {category_key:104,category_name:"Furniture"},
  ]},
  date:{id:"date",label:"Date",role:"dimension",columns:["date_key","date","month","quarter","year"],rows:[
    {date_key:20240101,date:"2024-01-01",month:"Jan",quarter:"Q1",year:2024},
    {date_key:20240102,date:"2024-01-02",month:"Jan",quarter:"Q1",year:2024},
    {date_key:20240103,date:"2024-01-03",month:"Jan",quarter:"Q1",year:2024},
  ]},
  store:{id:"store",label:"Store",role:"dimension",columns:["store_key","store_name","city","region"],rows:[
    {store_key:1,store_name:"Downtown",city:"New York",region:"East"},
    {store_key:2,store_name:"North Mall",city:"Chicago",region:"Central"},
    {store_key:3,store_name:"Bay Center",city:"San Francisco",region:"West"},
  ]},
};

function cloneTables(tables:Record<TableId,TableDef>):Record<TableId,TableDef>{
  return Object.fromEntries(Object.entries(tables).map(([id,table])=>[id,{...table,rows:table.rows.map(row=>({...row}))}])) as Record<TableId,TableDef>;
}

function makeScenario(id:ScenarioId,name:string,customerPrefix:string,amounts:number[]):Scenario{
  const tables=cloneTables(retailTables);
  tables.customer.rows=tables.customer.rows.map((row,index)=>({...row,name:index===0?customerPrefix:row.name}));
  tables.fact.rows=tables.fact.rows.map((row,index)=>({...row,order_id:row.order_id+(id==="ecommerce"?1000:2000),amount:amounts[index]??row.amount}));
  if(id==="subscriptions"){
    tables.product.rows=[
      {product_key:101,product_name:"Starter Plan",subcategory_key:10},
      {product_key:102,product_name:"Pro Plan",subcategory_key:11},
      {product_key:103,product_name:"Seat Add-on",subcategory_key:12},
      {product_key:104,product_name:"Support",subcategory_key:13},
      {product_key:105,product_name:"Usage Pack",subcategory_key:14},
    ];
  }
  return {id,name,tables};
}

const SCENARIOS:Scenario[]=[
  {id:"retail",name:"Retail Sales",tables:retailTables},
  makeScenario("ecommerce","E-commerce Orders","Asha",[1400,760,610,420,280]),
  makeScenario("subscriptions","Subscription Sales","Nova Labs",[1490,980,720,450,320]),
];

const QUERY_SQL=`SELECT c.category_name,
       SUM(f.amount) AS total_sales
FROM fact_sales f
JOIN dim_product p
  ON f.product_key = p.product_key
JOIN dim_subcategory s
  ON p.subcategory_key = s.subcategory_key
JOIN dim_category c
  ON s.category_key = c.category_key
GROUP BY c.category_name
ORDER BY total_sales DESC;`;

function DataTable({table}:{table:TableDef}){
  return <div className="msnow-table"><table><thead><tr>{table.columns.map(column=><th key={column}>{column}</th>)}</tr></thead><tbody>{table.rows.map((row,index)=><tr key={index}>{table.columns.map(column=><td key={column}>{String(row[column])}</td>)}</tr>)}</tbody></table></div>;
}

function QueryResult({rows}:{rows:Array<{category_name:string;total_sales:number}>}){
  return <div className="msnow-result-table"><table><thead><tr><th>category_name</th><th>total_sales</th></tr></thead><tbody>{rows.map(row=><tr key={row.category_name}><td>{row.category_name}</td><td>{row.total_sales.toLocaleString()}</td></tr>)}</tbody></table></div>;
}

function CodePanel({copied,onCopy}:{copied:boolean;onCopy:()=>void}){
  return <div className="msnow-code"><button type="button" onClick={onCopy} aria-label="Copy snowflake analytical query">{copied?<Check size={13}/>:<Copy size={13}/>}<span>{copied?"Copied":"Copy"}</span></button><pre tabIndex={0}><code>{QUERY_SQL}</code></pre></div>;
}

export function ModelingSnowflakeSchemaHero({currentLesson,total,minutes,description,onPrevious,onNext}:{currentLesson:number;total:number;minutes:number;description:string;onPrevious:()=>void;onNext:()=>void;}){
  return <section className="msnow-hero" aria-labelledby="msnow-hero-title">
    <div className="msnow-hero-copy">
      <div className="msnow-breadcrumb"><span>Data Modeling</span><ChevronRight size={13}/><strong>Snowflake Schema</strong></div>
      <div className="msnow-title-row"><span className="msnow-hero-icon"><Zap size={24}/></span><div><h1 id="msnow-hero-title">Snowflake Schema</h1><p>{description}</p></div></div>
      <div className="msnow-meta"><span><Clock3 size={14}/>{minutes} min</span><span><GraduationCap size={14}/>Lesson {currentLesson+1}/{total}</span></div>
    </div>
    <div className="msnow-hero-art" aria-hidden="true">
      <div className="msnow-art-fact"><Table2 size={40}/><b>Fact<br/>Sales</b></div>
      <div className="msnow-art-snow"><Snowflake size={38}/></div>
      <div className="msnow-art-db customer"><Database size={38}/><small>Customer</small></div>
      <div className="msnow-art-db product"><Database size={38}/><small>Product</small></div>
      <div className="msnow-art-db date"><Database size={38}/><small>Date</small></div>
      <div className="msnow-art-db store"><Database size={38}/></div>
      <i className="msnow-art-line a"/><i className="msnow-art-line b"/><i className="msnow-art-line c"/><i className="msnow-art-line d"/>
    </div>
    <div className="msnow-hero-actions"><span className="msnow-difficulty">Intermediate</span><div><button type="button" aria-label="Previous lesson" onClick={onPrevious} disabled={currentLesson===0}><ChevronLeft size={18}/></button><button type="button" className="msnow-next" onClick={onNext} disabled={currentLesson===total-1}>Next <ChevronRight size={17}/></button></div></div>
  </section>;
}

export function ModelingSnowflakeSchemaSimulation(){
  const companion=useCompanion();
  const [scenarioId,setScenarioId]=useState<ScenarioId>("retail");
  const [tables,setTables]=useState<Record<TableId,TableDef>>(()=>cloneTables(retailTables));
  const [selected,setSelected]=useState<TableId>("product");
  const [mode,setMode]=useState<Mode>("schema");
  const [phase,setPhase]=useState<Phase>("complete");
  const [running,setRunning]=useState(false);
  const [copied,setCopied]=useState(false);
  const timers=useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const copyTimer=useRef<ReturnType<typeof setTimeout>|null>(null);

  const scenario=SCENARIOS.find(item=>item.id===scenarioId)??SCENARIOS[0];
  const phaseIndex=phase==="ready"?0:phase==="fact"?1:phase==="dimensions"?2:phase==="subdimensions"?3:phase==="query"?4:5;

  const resultRows=useMemo(()=>{
    const productByKey=new Map(tables.product.rows.map(row=>[Number(row.product_key),row]));
    const subByKey=new Map(tables.subcategory.rows.map(row=>[Number(row.subcategory_key),row]));
    const categoryByKey=new Map(tables.category.rows.map(row=>[Number(row.category_key),row]));
    const grouped=new Map<string,number>();
    for(const fact of tables.fact.rows){
      const product=productByKey.get(Number(fact.product_key));
      const sub=product?subByKey.get(Number(product.subcategory_key)):undefined;
      const category=sub?categoryByKey.get(Number(sub.category_key)):undefined;
      const name=String(category?.category_name??"Unknown");
      grouped.set(name,(grouped.get(name)??0)+Number(fact.amount));
    }
    return [...grouped.entries()].map(([category_name,total_sales])=>({category_name,total_sales})).sort((a,b)=>b.total_sales-a.total_sales);
  },[tables]);

  const clearTimers=()=>{timers.current.forEach(clearTimeout);timers.current=[];};
  useEffect(()=>()=>{clearTimers();if(copyTimer.current)clearTimeout(copyTimer.current);},[]);

  const resetScenario=(id:ScenarioId,complete=true)=>{
    clearTimers();
    const next=SCENARIOS.find(item=>item.id===id)??SCENARIOS[0];
    setScenarioId(id);
    setTables(cloneTables(next.tables));
    setSelected("product");
    setMode("schema");
    setPhase(complete?"complete":"ready");
    setRunning(false);
    setCopied(false);
  };

  const runSimulation=()=>{
    clearTimers();
    setTables(cloneTables(scenario.tables));
    setSelected("fact");
    setMode("schema");
    setPhase("ready");
    setRunning(true);
    const fact=setTimeout(()=>setPhase("fact"),260);
    const dims=setTimeout(()=>{setPhase("dimensions");setSelected("product");},620);
    const subs=setTimeout(()=>{setPhase("subdimensions");setSelected("subcategory");},980);
    const query=setTimeout(()=>setPhase("query"),1300);
    const complete=setTimeout(()=>{setPhase("complete");setRunning(false);companion?.emit({type:"exercise_correct",lesson:"Snowflake Schema",source:"runner"});},1600);
    timers.current.push(fact,dims,subs,query,complete);
  };

  const runQuery=()=>{
    clearTimers();
    setPhase("query");
    const timer=setTimeout(()=>{setPhase("complete");companion?.emit({type:"exercise_correct",lesson:"Snowflake Schema analytical query",source:"runner"});},320);
    timers.current.push(timer);
  };

  const copyQuery=async()=>{
    let ok=false;
    try{await navigator.clipboard.writeText(QUERY_SQL);ok=true;}catch{
      try{
        const area=document.createElement("textarea");area.value=QUERY_SQL;area.setAttribute("readonly","");area.style.position="fixed";area.style.opacity="0";document.body.appendChild(area);area.select();ok=document.execCommand("copy");document.body.removeChild(area);
      }catch{ok=false;}
    }
    if(ok){
      setCopied(true);
      if(copyTimer.current)clearTimeout(copyTimer.current);
      copyTimer.current=setTimeout(()=>setCopied(false),1600);
    }
  };

  const tableOrder:TableId[]=["segment","customer","fact","product","subcategory","category","date","store"];
  const selectTable=(id:TableId)=>{setSelected(id);};

  return <section className="msnow-simulation" aria-labelledby="msnow-simulation-title">
    <header className="msnow-simulation-head">
      <div><h2 id="msnow-simulation-title"><Network size={23}/>Interactive Simulation</h2><p>Explore how a snowflake schema breaks down dimension tables into related sub-dimensions. Click a table to view its data and relationships.</p></div>
      <div className="msnow-controls">
        <button type="button" className="msnow-run" onClick={runSimulation}><Play size={14}/>{running?"Running…":"Run Simulation"}</button>
        <button type="button" className="msnow-reset" onClick={()=>resetScenario("retail",true)}><RefreshCcw size={14}/>Reset</button>
        <select aria-label="Snowflake schema scenario" value={scenarioId} onChange={event=>resetScenario(event.target.value as ScenarioId,true)}>{SCENARIOS.map((item,index)=><option key={item.id} value={item.id}>{`Scenario ${index+1}: ${item.name}`}</option>)}</select>
      </div>
    </header>

    <div className="msnow-workbench">
      <aside className="msnow-tools">
        <div className="msnow-view-tabs" role="tablist" aria-label="Snowflake representation">
          <button type="button" role="tab" aria-selected={mode==="schema"} onClick={()=>setMode("schema")}>Schema View</button>
          <button type="button" role="tab" aria-selected={mode==="data"} onClick={()=>setMode("data")}>Data View</button>
        </div>
        <div className="msnow-legend">
          <span><i className="fact"/>Fact table</span>
          <span><i className="dimension"/>Dimension table</span>
          <span><i className="subdimension"/>Sub-dimension table</span>
          <span><KeyRound size={12}/>Primary key</span>
          <span><Link2 size={12}/>Foreign key</span>
        </div>
      </aside>

      <section className={`msnow-center ${phaseIndex>=1?"is-active":"is-future"}`}>
        {mode==="schema"?<div className="msnow-schema" aria-label="Snowflake schema diagram">
          <button type="button" className={`msnow-node segment sub ${selected==="segment"?"is-selected":""} ${phaseIndex>=3?"is-ready":""}`} onClick={()=>selectTable("segment")}><Database size={15}/><strong>Customer Segment</strong><small>segment_key · PK<br/>segment_name</small></button>
          <button type="button" className={`msnow-node customer dim ${selected==="customer"?"is-selected":""} ${phaseIndex>=2?"is-ready":""}`} onClick={()=>selectTable("customer")}><UserRound size={15}/><strong>Customer</strong><small>customer_key · PK<br/>name<br/>city<br/>segment_key · FK</small></button>
          <button type="button" className={`msnow-node category sub ${selected==="category"?"is-selected":""} ${phaseIndex>=3?"is-ready":""}`} onClick={()=>selectTable("category")}><Database size={15}/><strong>Product Category</strong><small>category_key · PK<br/>category_name</small></button>
          <button type="button" className={`msnow-node subcategory sub ${selected==="subcategory"?"is-selected":""} ${phaseIndex>=3?"is-ready":""}`} onClick={()=>selectTable("subcategory")}><Network size={15}/><strong>Product Subcategory</strong><small>subcategory_key · PK<br/>subcategory_name<br/>category_key · FK</small></button>
          <button type="button" className={`msnow-node product dim ${selected==="product"?"is-selected":""} ${phaseIndex>=2?"is-ready":""}`} onClick={()=>selectTable("product")}><ShoppingBagIcon/><strong>Product</strong><small>product_key · PK<br/>product_name<br/>subcategory_key · FK</small></button>
          <button type="button" className={`msnow-node date dim ${selected==="date"?"is-selected":""} ${phaseIndex>=2?"is-ready":""}`} onClick={()=>selectTable("date")}><Database size={15}/><strong>Date</strong><small>date_key · PK<br/>date<br/>month<br/>quarter<br/>year</small></button>
          <button type="button" className={`msnow-node store dim ${selected==="store"?"is-selected":""} ${phaseIndex>=2?"is-ready":""}`} onClick={()=>selectTable("store")}><Store size={15}/><strong>Store</strong><small>store_key · PK<br/>store_name<br/>city<br/>region</small></button>
          <button type="button" className={`msnow-node fact ${selected==="fact"?"is-selected":""} ${phaseIndex>=1?"is-ready":""}`} onClick={()=>selectTable("fact")}><BarChart3 size={16}/><strong>Fact Sales</strong><small>order_id · PK<br/>customer_key · FK<br/>product_key · FK<br/>date_key · FK<br/>store_key · FK<br/>quantity<br/>amount</small></button>
          <i className="msnow-link customer"/><i className="msnow-link segment"/><i className="msnow-link product"/><i className="msnow-link subcategory"/><i className="msnow-link category"/><i className="msnow-link date"/><i className="msnow-link store"/>
        </div>:<div className="msnow-data-browser">
          {tableOrder.map(id=><button type="button" key={id} className={`msnow-data-card ${tables[id].role} ${selected===id?"is-selected":""}`} onClick={()=>selectTable(id)}><strong>{tables[id].label}</strong><small>{tables[id].rows.length} rows · {tables[id].columns.length} columns</small><span>{tables[id].columns.slice(0,4).join(" · ")}</span></button>)}
        </div>}
      </section>

      <aside className="msnow-selected">
        <header><Database size={18}/><strong>Selected Table Data</strong></header>
        <select aria-label="Selected snowflake table" value={selected} onChange={event=>selectTable(event.target.value as TableId)}>{tableOrder.map(id=><option key={id} value={id}>{tables[id].label}</option>)}</select>
        <DataTable table={tables[selected]}/>
      </aside>
    </div>

    <div className={`msnow-bottom-grid ${phaseIndex>=4?"is-active":"is-future"}`}>
      <section className="msnow-query-card">
        <header><Table2 size={17}/><div><strong>Sample Analytical Query</strong><p>Total sales by product category (using snowflake joins)</p></div><button type="button" onClick={runQuery}><Play size={13}/>Run Query</button></header>
        <CodePanel copied={copied} onCopy={copyQuery}/>
      </section>
      <section className="msnow-result-card"><header><Database size={17}/><strong>Query Result</strong></header><QueryResult rows={resultRows}/></section>
      <section className="msnow-takeaways"><header><Lightbulb size={17}/><strong>Key Takeaways</strong></header><ul><li>Snowflake schema normalizes dimension tables.</li><li>Reduces repeated descriptive data.</li><li>Uses sub-dimensions (for example, category → subcategory).</li><li>Useful when dimensions have hierarchical relationships.</li></ul></section>
    </div>

    <span className="msnow-status" role="status">{phase==="ready"?"Ready to build the snowflake from the central fact.":phase==="fact"?"Fact Sales is active and references descriptive dimensions.":phase==="dimensions"?"Direct dimensions are active around the fact.":phase==="subdimensions"?"Normalized sub-dimensions are active and extend the hierarchy.":phase==="query"?"Analytical query is traversing Product → Subcategory → Category.":"Snowflake schema simulation complete."}</span>
  </section>;
}

function ShoppingBagIcon(){return <Table2 size={15}/>;}
