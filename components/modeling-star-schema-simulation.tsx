"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Database,
  GraduationCap,
  Lightbulb,
  Network,
  Play,
  Plus,
  RefreshCcw,
  ShoppingBag,
  Store,
  Table2,
  UserRound,
  Zap,
} from "lucide-react";
import { useCompanion } from "@/components/companion-context";

type DimensionId = "customer" | "product" | "date" | "store";
type ViewTab = "query" | "result";
type SimulationPhase = "ready" | "dimensions" | "fact" | "query" | "complete";
type ScenarioId = "retail" | "ecommerce" | "subscriptions";

type CustomerRow = { customer_key:number; name:string; city:string; segment:string };
type ProductRow = { product_key:number; product_name:string; category:string; subcategory:string; brand:string };
type DateRow = { date_key:number; date:string; month:string; quarter:string; year:number };
type StoreRow = { store_key:number; store_name:string; city:string; region:string };
type FactRow = { order_id:number; customer_key:number; product_key:number; date_key:number; store_key:number; quantity:number; amount:number };

type Model = {
  customer: CustomerRow[];
  product: ProductRow[];
  date: DateRow[];
  store: StoreRow[];
  facts: FactRow[];
};

type Scenario = { id:ScenarioId; name:string; model:Model };

const SCENARIOS: Scenario[] = [
  {
    id:"retail",
    name:"Retail Sales",
    model:{
      customer:[
        {customer_key:1,name:"Alice",city:"New York",segment:"Retail"},
        {customer_key:2,name:"Bob",city:"Chicago",segment:"Wholesale"},
        {customer_key:3,name:"Carol",city:"San Francisco",segment:"Online"},
        {customer_key:4,name:"David",city:"Austin",segment:"Retail"},
        {customer_key:5,name:"Emma",city:"Miami",segment:"Online"},
      ],
      product:[
        {product_key:10,product_name:"Laptop",category:"Electronics",subcategory:"Computers",brand:"Aster"},
        {product_key:11,product_name:"Blender",category:"Home & Kitchen",subcategory:"Appliances",brand:"Nest"},
        {product_key:12,product_name:"Notebook",category:"Stationery",subcategory:"Paper",brand:"WriteCo"},
        {product_key:13,product_name:"Chair",category:"Furniture",subcategory:"Office",brand:"Form"},
      ],
      date:[
        {date_key:20240101,date:"2024-01-01",month:"Jan",quarter:"Q1",year:2024},
        {date_key:20240102,date:"2024-01-02",month:"Jan",quarter:"Q1",year:2024},
        {date_key:20240103,date:"2024-01-03",month:"Jan",quarter:"Q1",year:2024},
      ],
      store:[
        {store_key:1,store_name:"Downtown",city:"New York",region:"East"},
        {store_key:2,store_name:"North Mall",city:"Chicago",region:"Central"},
        {store_key:3,store_name:"Bay Center",city:"San Francisco",region:"West"},
      ],
      facts:[
        {order_id:1001,customer_key:1,product_key:10,date_key:20240101,store_key:1,quantity:2,amount:200},
        {order_id:1002,customer_key:2,product_key:11,date_key:20240101,store_key:2,quantity:1,amount:150},
        {order_id:1003,customer_key:3,product_key:10,date_key:20240102,store_key:1,quantity:3,amount:300},
        {order_id:1004,customer_key:1,product_key:12,date_key:20240103,store_key:3,quantity:1,amount:120},
        {order_id:1005,customer_key:4,product_key:11,date_key:20240103,store_key:2,quantity:2,amount:240},
        {order_id:1006,customer_key:5,product_key:10,date_key:20240103,store_key:1,quantity:7,amount:700},
        {order_id:1007,customer_key:2,product_key:13,date_key:20240103,store_key:3,quantity:5,amount:450},
      ],
    },
  },
  {
    id:"ecommerce",
    name:"E-commerce Orders",
    model:{
      customer:[
        {customer_key:1,name:"Asha",city:"Chennai",segment:"Consumer"},
        {customer_key:2,name:"Ravi",city:"Mumbai",segment:"Consumer"},
        {customer_key:3,name:"Mina",city:"Pune",segment:"SMB"},
        {customer_key:4,name:"Kabir",city:"Delhi",segment:"Consumer"},
      ],
      product:[
        {product_key:20,product_name:"Phone",category:"Electronics",subcategory:"Mobile",brand:"Orbit"},
        {product_key:21,product_name:"Headset",category:"Accessories",subcategory:"Audio",brand:"Pulse"},
        {product_key:22,product_name:"Desk",category:"Furniture",subcategory:"Office",brand:"Form"},
      ],
      date:[
        {date_key:20240201,date:"2024-02-01",month:"Feb",quarter:"Q1",year:2024},
        {date_key:20240202,date:"2024-02-02",month:"Feb",quarter:"Q1",year:2024},
        {date_key:20240203,date:"2024-02-03",month:"Feb",quarter:"Q1",year:2024},
      ],
      store:[
        {store_key:1,store_name:"Web",city:"Online",region:"Digital"},
        {store_key:2,store_name:"Marketplace",city:"Online",region:"Digital"},
      ],
      facts:[
        {order_id:2001,customer_key:1,product_key:20,date_key:20240201,store_key:1,quantity:1,amount:700},
        {order_id:2002,customer_key:2,product_key:21,date_key:20240201,store_key:1,quantity:2,amount:160},
        {order_id:2003,customer_key:3,product_key:22,date_key:20240202,store_key:2,quantity:1,amount:500},
        {order_id:2004,customer_key:4,product_key:20,date_key:20240203,store_key:1,quantity:1,amount:700},
        {order_id:2005,customer_key:1,product_key:21,date_key:20240203,store_key:2,quantity:1,amount:80},
      ],
    },
  },
  {
    id:"subscriptions",
    name:"Subscription Sales",
    model:{
      customer:[
        {customer_key:1,name:"Nova Labs",city:"Boston",segment:"SMB"},
        {customer_key:2,name:"Acme Co",city:"Denver",segment:"Enterprise"},
        {customer_key:3,name:"Orbit Inc",city:"Austin",segment:"SMB"},
      ],
      product:[
        {product_key:30,product_name:"Starter Plan",category:"Subscription",subcategory:"Core",brand:"DataPrep"},
        {product_key:31,product_name:"Pro Plan",category:"Subscription",subcategory:"Core",brand:"DataPrep"},
        {product_key:32,product_name:"Seat Add-on",category:"Add-on",subcategory:"Expansion",brand:"DataPrep"},
      ],
      date:[
        {date_key:20240301,date:"2024-03-01",month:"Mar",quarter:"Q1",year:2024},
        {date_key:20240302,date:"2024-03-02",month:"Mar",quarter:"Q1",year:2024},
        {date_key:20240303,date:"2024-03-03",month:"Mar",quarter:"Q1",year:2024},
      ],
      store:[
        {store_key:1,store_name:"Direct",city:"Online",region:"Digital"},
        {store_key:2,store_name:"Partner",city:"Online",region:"Channel"},
      ],
      facts:[
        {order_id:3001,customer_key:1,product_key:30,date_key:20240301,store_key:1,quantity:1,amount:49},
        {order_id:3002,customer_key:2,product_key:31,date_key:20240301,store_key:1,quantity:1,amount:149},
        {order_id:3003,customer_key:1,product_key:32,date_key:20240302,store_key:2,quantity:5,amount:75},
        {order_id:3004,customer_key:3,product_key:31,date_key:20240303,store_key:1,quantity:1,amount:149},
      ],
    },
  },
];

const QUERY_SQL=`SELECT dp.category,
       SUM(f.amount) AS total_sales,
       SUM(f.quantity) AS total_quantity
FROM fact_sales f
JOIN dim_product dp ON f.product_key = dp.product_key
GROUP BY dp.category
ORDER BY total_sales DESC;`;

function copyModel(model:Model):Model{
  return {
    customer:model.customer.map(row=>({...row})),
    product:model.product.map(row=>({...row})),
    date:model.date.map(row=>({...row})),
    store:model.store.map(row=>({...row})),
    facts:model.facts.map(row=>({...row})),
  };
}

function QueryTable({rows}:{rows:Array<{category:string;total_sales:number;total_quantity:number}>}){
  return <div className="mstar-result-table"><table><thead><tr><th>category</th><th>total_sales</th><th>total_quantity</th></tr></thead><tbody>{rows.map(row=><tr key={row.category}><td>{row.category}</td><td>{row.total_sales.toLocaleString()}</td><td>{row.total_quantity}</td></tr>)}</tbody></table></div>;
}

function DimTable({dimension,model}:{dimension:DimensionId;model:Model}){
  if(dimension==="customer")return <div className="mstar-table"><table><thead><tr><th>customer_key</th><th>name</th><th>city</th><th>segment</th></tr></thead><tbody>{model.customer.map(row=><tr key={row.customer_key}><td>{row.customer_key}</td><td>{row.name}</td><td>{row.city}</td><td>{row.segment}</td></tr>)}</tbody></table></div>;
  if(dimension==="product")return <div className="mstar-table"><table><thead><tr><th>product_key</th><th>product</th><th>category</th><th>brand</th></tr></thead><tbody>{model.product.map(row=><tr key={row.product_key}><td>{row.product_key}</td><td>{row.product_name}</td><td>{row.category}</td><td>{row.brand}</td></tr>)}</tbody></table></div>;
  if(dimension==="date")return <div className="mstar-table"><table><thead><tr><th>date_key</th><th>date</th><th>month</th><th>year</th></tr></thead><tbody>{model.date.map(row=><tr key={row.date_key}><td>{row.date_key}</td><td>{row.date}</td><td>{row.month}</td><td>{row.year}</td></tr>)}</tbody></table></div>;
  return <div className="mstar-table"><table><thead><tr><th>store_key</th><th>store_name</th><th>city</th><th>region</th></tr></thead><tbody>{model.store.map(row=><tr key={row.store_key}><td>{row.store_key}</td><td>{row.store_name}</td><td>{row.city}</td><td>{row.region}</td></tr>)}</tbody></table></div>;
}

function FactTable({rows}:{rows:FactRow[]}){
  return <div className="mstar-table mstar-fact-table"><table><thead><tr><th>order_id</th><th>customer_key</th><th>product_key</th><th>date_key</th><th>store_key</th><th>quantity</th><th>amount</th></tr></thead><tbody>{rows.map(row=><tr key={row.order_id}><td>{row.order_id}</td><td>{row.customer_key}</td><td>{row.product_key}</td><td>{row.date_key}</td><td>{row.store_key}</td><td>{row.quantity}</td><td>{row.amount}</td></tr>)}</tbody></table></div>;
}

function CodeBlock({copied,onCopy}:{copied:boolean;onCopy:()=>void}){
  return <div className="mstar-code"><button type="button" onClick={onCopy} aria-label="Copy analytical query">{copied?<Check size={13}/>:<Copy size={13}/>}<span>{copied?"Copied":"Copy"}</span></button><pre tabIndex={0}><code>{QUERY_SQL}</code></pre></div>;
}

export function ModelingStarSchemaHero({
  currentLesson,total,minutes,description,onPrevious,onNext,
}:{
  currentLesson:number;total:number;minutes:number;description:string;onPrevious:()=>void;onNext:()=>void;
}){
  return <section className="mstar-hero" aria-labelledby="mstar-hero-title">
    <div className="mstar-hero-copy">
      <div className="mstar-breadcrumb"><span>Data Modeling</span><ChevronRight size={13}/><strong>Star Schema</strong></div>
      <div className="mstar-title-row"><span className="mstar-hero-icon"><Zap size={24}/></span><div><h1 id="mstar-hero-title">Star Schema</h1><p>{description}</p></div></div>
      <div className="mstar-meta"><span><Clock3 size={14}/>{minutes} min</span><span><GraduationCap size={14}/>Lesson {currentLesson+1}/{total}</span></div>
    </div>
    <div className="mstar-hero-art" aria-hidden="true">
      <div className="mstar-hero-fact"><Table2 size={41}/><b>Fact</b></div>
      <div className="mstar-hero-dim mstar-hero-customer"><Database size={38}/><small>Customer</small></div>
      <div className="mstar-hero-dim mstar-hero-product"><Database size={38}/><small>Product</small></div>
      <div className="mstar-hero-dim mstar-hero-date"><Database size={38}/><small>Date</small></div>
      <div className="mstar-hero-dim mstar-hero-store"><Database size={38}/><small>Store</small></div>
      <i className="mstar-hero-spoke a"/><i className="mstar-hero-spoke b"/><i className="mstar-hero-spoke c"/><i className="mstar-hero-spoke d"/>
    </div>
    <div className="mstar-hero-actions"><span className="mstar-difficulty">Intermediate</span><div><button type="button" aria-label="Previous lesson" onClick={onPrevious} disabled={currentLesson===0}><ChevronLeft size={18}/></button><button type="button" className="mstar-next" onClick={onNext} disabled={currentLesson===total-1}>Next <ChevronRight size={17}/></button></div></div>
  </section>;
}

export function ModelingStarSchemaSimulation(){
  const companion=useCompanion();
  const [scenarioId,setScenarioId]=useState<ScenarioId>("retail");
  const [model,setModel]=useState<Model>(()=>copyModel(SCENARIOS[0].model));
  const [dimension,setDimension]=useState<DimensionId>("customer");
  const [viewTab,setViewTab]=useState<ViewTab>("query");
  const [phase,setPhase]=useState<SimulationPhase>("complete");
  const [running,setRunning]=useState(false);
  const [copied,setCopied]=useState(false);
  const timers=useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const copyTimer=useRef<ReturnType<typeof setTimeout>|null>(null);

  const scenario=SCENARIOS.find(item=>item.id===scenarioId)??SCENARIOS[0];
  const phaseIndex=phase==="ready"?0:phase==="dimensions"?1:phase==="fact"?2:phase==="query"?3:4;

  const queryRows=useMemo(()=>{
    const productByKey=new Map(model.product.map(row=>[row.product_key,row]));
    const grouped=new Map<string,{category:string;total_sales:number;total_quantity:number}>();
    for(const fact of model.facts){
      const product=productByKey.get(fact.product_key);
      const category=product?.category??"Unknown";
      const current=grouped.get(category)??{category,total_sales:0,total_quantity:0};
      current.total_sales+=fact.amount;
      current.total_quantity+=fact.quantity;
      grouped.set(category,current);
    }
    return [...grouped.values()].sort((a,b)=>b.total_sales-a.total_sales);
  },[model]);

  const clearTimers=()=>{timers.current.forEach(clearTimeout);timers.current=[];};
  useEffect(()=>()=>{clearTimers();if(copyTimer.current)clearTimeout(copyTimer.current);},[]);

  const resetTo=(id:ScenarioId,completed=true)=>{
    const next=SCENARIOS.find(item=>item.id===id)??SCENARIOS[0];
    clearTimers();
    setScenarioId(id);
    setModel(copyModel(next.model));
    setDimension("customer");
    setViewTab("query");
    setPhase(completed?"complete":"ready");
    setRunning(false);
    setCopied(false);
  };

  const runSimulation=()=>{
    clearTimers();
    setModel(copyModel(scenario.model));
    setDimension("customer");
    setViewTab("query");
    setPhase("ready");
    setRunning(true);
    const dims=setTimeout(()=>setPhase("dimensions"),300);
    const fact=setTimeout(()=>setPhase("fact"),720);
    const query=setTimeout(()=>{setPhase("query");setViewTab("result");},1120);
    const complete=setTimeout(()=>{
      setPhase("complete");
      setRunning(false);
      companion?.emit({type:"exercise_correct",lesson:"Star Schema",source:"runner"});
    },1500);
    timers.current.push(dims,fact,query,complete);
  };

  const addDimensionRow=()=>{
    setModel(current=>{
      const next=copyModel(current);
      if(dimension==="customer"){
        const key=Math.max(0,...next.customer.map(row=>row.customer_key))+1;
        next.customer.push({customer_key:key,name:"Nora",city:"Denver",segment:"Online"});
      }else if(dimension==="product"){
        const key=Math.max(0,...next.product.map(row=>row.product_key))+1;
        next.product.push({product_key:key,product_name:"Mouse",category:"Accessories",subcategory:"Computer Accessories",brand:"Orbit"});
      }else if(dimension==="date"){
        const latest=next.date.reduce((max,row)=>row.date>max?row.date:max,"2024-01-01");
        const parsed=new Date(latest+"T00:00:00Z");
        parsed.setUTCDate(parsed.getUTCDate()+1);
        const date=parsed.toISOString().slice(0,10);
        const monthIndex=Number(date.slice(5,7))-1;
        const month=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][monthIndex];
        const quarter="Q"+(Math.floor(monthIndex/3)+1);
        const key=Number(date.replace(/-/g,""));
        next.date.push({date_key:key,date,month,quarter,year:Number(date.slice(0,4))});
      }else{
        const key=Math.max(0,...next.store.map(row=>row.store_key))+1;
        next.store.push({store_key:key,store_name:"South Point",city:"Denver",region:"West"});
      }
      return next;
    });
    setPhase("dimensions");
  };

  const addFactRow=()=>{
    setModel(current=>{
      const next=copyModel(current);
      const orderId=Math.max(0,...next.facts.map(row=>row.order_id))+1;
      const customer=next.customer[(next.facts.length+1)%next.customer.length];
      const product=next.product[(next.facts.length+1)%next.product.length];
      const date=next.date[(next.facts.length+1)%next.date.length];
      const store=next.store[(next.facts.length+1)%next.store.length];
      const quantity=(next.facts.length%3)+1;
      const amount=120+next.facts.length*20;
      next.facts.push({order_id:orderId,customer_key:customer.customer_key,product_key:product.product_key,date_key:date.date_key,store_key:store.store_key,quantity,amount});
      return next;
    });
    setPhase("fact");
  };

  const runQuery=()=>{
    setPhase("query");
    setViewTab("result");
    const timer=setTimeout(()=>{
      setPhase("complete");
      companion?.emit({type:"exercise_correct",lesson:"Star Schema analytical query",source:"runner"});
    },320);
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

  const dimensionCount=dimension==="customer"?model.customer.length:dimension==="product"?model.product.length:dimension==="date"?model.date.length:model.store.length;

  return <section className="mstar-simulation" aria-labelledby="mstar-simulation-title">
    <header className="mstar-simulation-head">
      <div><h2 id="mstar-simulation-title"><Network size={23}/>Interactive Simulation</h2><p>Explore how a star schema organizes data. Add records to see how fact and dimension tables connect and support analytical queries.</p></div>
      <div className="mstar-controls">
        <button type="button" className="mstar-run" onClick={runSimulation}><Play size={14}/>{running?"Running…":"Run Simulation"}</button>
        <button type="button" className="mstar-reset" onClick={()=>resetTo("retail",true)}><RefreshCcw size={14}/>Reset</button>
        <select aria-label="Star schema scenario" value={scenarioId} onChange={event=>resetTo(event.target.value as ScenarioId,true)}>{SCENARIOS.map((item,index)=><option key={item.id} value={item.id}>{`Scenario ${index+1}: ${item.name}`}</option>)}</select>
      </div>
    </header>

    <div className="mstar-main-grid">
      <section className={`mstar-dimensions ${phaseIndex>=1?"is-active":"is-future"}`}>
        <header><span><Database size={20}/></span><div><h3>Dimension Tables</h3><p>Descriptive context (Who, What, When, Where)</p></div></header>
        <div className="mstar-dim-tabs" role="tablist" aria-label="Dimension tables">
          {([
            ["customer","Customer"],
            ["product","Product"],
            ["date","Date"],
            ["store","Store"],
          ] as const).map(([id,label])=><button key={id} type="button" role="tab" aria-selected={dimension===id} onClick={()=>setDimension(id)}>{label}</button>)}
        </div>
        <div className="mstar-dim-toolbar"><span>{dimensionCount} rows</span><button type="button" onClick={addDimensionRow}><Plus size={13}/>Add Row</button></div>
        <DimTable dimension={dimension} model={model}/>
      </section>

      <section className={`mstar-center ${phaseIndex>=1?"is-active":"is-future"}`} aria-label="Interactive star schema">
        <button type="button" className={`mstar-schema-node customer ${dimension==="customer"?"is-selected":""}`} onClick={()=>setDimension("customer")}><UserRound size={15}/><strong>Dim Customer</strong><small>customer_key · PK<br/>name<br/>city<br/>segment</small></button>
        <button type="button" className={`mstar-schema-node date ${dimension==="date"?"is-selected":""}`} onClick={()=>setDimension("date")}><Database size={15}/><strong>Dim Date</strong><small>date_key · PK<br/>date<br/>month<br/>quarter<br/>year</small></button>
        <button type="button" className={`mstar-schema-node product ${dimension==="product"?"is-selected":""}`} onClick={()=>setDimension("product")}><ShoppingBag size={15}/><strong>Dim Product</strong><small>product_key · PK<br/>product_name<br/>category<br/>subcategory<br/>brand</small></button>
        <button type="button" className={`mstar-schema-node store ${dimension==="store"?"is-selected":""}`} onClick={()=>setDimension("store")}><Store size={15}/><strong>Dim Store</strong><small>store_key · PK<br/>store_name<br/>city<br/>region</small></button>
        <div className={`mstar-schema-node fact ${phaseIndex>=2?"is-selected":""}`}><BarChart3 size={16}/><strong>Fact Sales</strong><small>order_id<br/>customer_key · FK<br/>product_key · FK<br/>date_key · FK<br/>store_key · FK<br/>quantity<br/>amount</small></div>
        <i className="mstar-link customer"/><i className="mstar-link date"/><i className="mstar-link product"/><i className="mstar-link store"/>
      </section>

      <section className={`mstar-fact ${phaseIndex>=2?"is-active":"is-future"}`}>
        <header><span><BarChart3 size={20}/></span><div><h3>Fact Table</h3><p>Quantitative measurements</p></div><button type="button" onClick={addFactRow}><Plus size={13}/>Add Row</button></header>
        <FactTable rows={model.facts}/>
      </section>
    </div>

    <div className={`mstar-bottom-grid ${phaseIndex>=3?"is-active":"is-future"}`}>
      <section className="mstar-query-card">
        <header><Table2 size={17}/><div><strong>Sample Analytical Query</strong><p>Total sales by product category using the star schema.</p></div><button type="button" className="mstar-query-run" onClick={runQuery}><Play size={13}/>Run Query</button></header>
        <div className="mstar-query-tabs" role="tablist" aria-label="Analytical query view"><button type="button" role="tab" aria-selected={viewTab==="query"} onClick={()=>setViewTab("query")}>Query</button><button type="button" role="tab" aria-selected={viewTab==="result"} onClick={()=>setViewTab("result")}>Result</button></div>
        {viewTab==="query"?<CodeBlock copied={copied} onCopy={copyQuery}/>:<QueryTable rows={queryRows}/>}
      </section>

      <section className="mstar-result-card">
        <header><Database size={17}/><strong>Query Result</strong></header>
        <QueryTable rows={queryRows}/>
      </section>

      <section className="mstar-takeaways">
        <header><Lightbulb size={17}/><strong>Key Takeaways</strong></header>
        <ul><li>Fact table stores measurable events (e.g., sales).</li><li>Dimension tables provide descriptive context.</li><li>Star schema uses a single fact table.</li><li>Optimized for analytical queries and reporting.</li></ul>
      </section>
    </div>

    <span className="mstar-status" role="status">{phase==="ready"?"Ready to trace dimensions into the central fact.":phase==="dimensions"?"Dimension tables are active. Select a dimension or add a descriptive row.":phase==="fact"?"Fact rows reference dimension keys at the declared sales grain.":phase==="query"?"Analytical query is aggregating fact measures by product category.":"Star schema simulation complete."}</span>
  </section>;
}
