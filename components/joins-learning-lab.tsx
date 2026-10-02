"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  CircleDot,
  Database,
  FileText,
  Link2,
  Play,
  RotateCcw,
  Sparkles,
  Table2,
  UserRound,
  UsersRound,
} from "lucide-react";
import { DarkCodeCard } from "@/components/rdd-dataframe-experience";
import { useCompanion } from "@/components/companion-context";
import {
  joinDatasets,
  joinParts,
  joinQuery,
  joinScenarios,
  runJoin,
  type JoinDataset,
  type JoinedRow,
  type JoinScenario,
} from "@/lib/joins-lab";

function text(value:string|number|null){
  return value===null?<em>NULL</em>:String(value);
}

function CustomersTable({dataset,matchedIds}:{dataset:JoinDataset;matchedIds:Set<number>}){
  return <div className="joins-table-wrap" role="region" aria-label="Customers table" tabIndex={0}>
    <table>
      <thead><tr><th>id</th><th>name</th><th>city</th></tr></thead>
      <tbody>{dataset.customers.map(customer=><tr key={customer.id}>
        <td className={matchedIds.has(customer.id)?"joins-key-match":""}>{customer.id}</td>
        <td>{customer.name}</td><td>{customer.city}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}

function OrdersTable({dataset,matchedIds}:{dataset:JoinDataset;matchedIds:Set<number>}){
  return <div className="joins-table-wrap" role="region" aria-label="Orders table" tabIndex={0}>
    <table>
      <thead><tr><th>order_id</th><th>customer_id</th><th>amount</th><th>order_date</th></tr></thead>
      <tbody>{dataset.orders.map(order=><tr key={order.order_id}>
        <td>{order.order_id}</td>
        <td className={matchedIds.has(order.customer_id)?"joins-key-match purple":""}>{order.customer_id}</td>
        <td>{order.amount}</td><td>{order.order_date}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}

function ResultTable({rows}:{rows:JoinedRow[]}){
  return <div className="joins-result-table" role="region" aria-label="JOIN result" tabIndex={0}>
    <table>
      <thead><tr><th>name</th><th>order_id</th><th>amount</th><th>order_date</th></tr></thead>
      <tbody>{rows.map((row,index)=><tr key={`${row.customer_id}-${row.order_id}-${index}`}>
        <td>{text(row.name)}</td><td>{text(row.order_id)}</td><td>{text(row.amount)}</td><td>{text(row.order_date)}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}

function scenarioIcon(index:number){
  return [Link2,Link2,Link2,UserRound,FileText][index]??Link2;
}

export function JoinsLearningLab(){
  const companion=useCompanion();
  const [datasetId,setDatasetId]=useState("orders");
  const dataset=useMemo(()=>joinDatasets.find(item=>item.id===datasetId)??joinDatasets[0],[datasetId]);
  const [scenarioIndex,setScenarioIndex]=useState(0);
  const [executedScenarioIndex,setExecutedScenarioIndex]=useState(0);
  const [running,setRunning]=useState(false);
  const [dirty,setDirty]=useState(false);

  const scenario=joinScenarios[scenarioIndex];
  const executedScenario=joinScenarios[executedScenarioIndex];
  const rows=useMemo(()=>runJoin(dataset,executedScenario),[dataset,executedScenario]);
  const query=joinQuery(scenario);
  const parts=joinParts(scenario);
  const matchedIds=useMemo(()=>new Set(rows.filter(row=>row.order_id!==null&&row.customer_id!==null).map(row=>row.customer_id as number)),[rows]);

  function selectScenario(index:number,execute=false){
    setScenarioIndex(index);
    setDirty(!execute);
    if(execute)setExecutedScenarioIndex(index);
  }

  function changeDataset(nextId:string){
    setDatasetId(nextId);
    setScenarioIndex(0);
    setExecutedScenarioIndex(0);
    setDirty(false);
    setRunning(false);
  }

  function run(){
    setRunning(true);
    companion?.emit({type:"exercise_started",lesson:"JOINs",source:"runner"});
    window.setTimeout(()=>{
      setExecutedScenarioIndex(scenarioIndex);
      setDirty(false);
      setRunning(false);
      companion?.emit({type:"exercise_correct",lesson:"JOINs",source:"runner"});
    },180);
  }

  function reset(){
    setScenarioIndex(0);
    setExecutedScenarioIndex(0);
    setDirty(false);
    setRunning(false);
  }

  function nextScenario(){
    const next=(scenarioIndex+1)%joinScenarios.length;
    setScenarioIndex(next);
    setExecutedScenarioIndex(next);
    setDirty(false);
  }

  const matchingPairs=rows.filter(row=>row.name!==null&&row.order_id!==null).length;

  return <section className="joins-simulator" aria-label="Interactive JOINs simulation">
    <header className="joins-header">
      <div className="joins-title"><span><Box size={24}/></span><div><h2>Interactive Simulation</h2><p>See how different JOIN types match rows from customers and orders tables.</p></div></div>
      <div className="joins-actions">
        <label><span>Dataset</span><select aria-label="JOIN dataset" value={datasetId} onChange={event=>changeDataset(event.target.value)}>{joinDatasets.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <button type="button" className="joins-run" disabled={running} onClick={run}><Play size={15} fill="currentColor"/>{running?"Running…":"Run Query"}</button>
        <button type="button" className="joins-reset" onClick={reset}><RotateCcw size={15}/>Reset</button>
        <button type="button" className="joins-next" onClick={nextScenario}>Next Scenario <ArrowRight size={15}/></button>
      </div>
    </header>

    <div className="joins-scenario-row" role="group" aria-label="JOIN scenarios">
      {joinScenarios.map((item,index)=>{
        const Icon=scenarioIcon(index);
        return <button type="button" key={item.id} aria-pressed={scenarioIndex===index} onClick={()=>selectScenario(index,false)}>
          <span className={"joins-scenario-icon type-"+item.id}><Icon size={19}/></span>
          <span><strong>{item.label}</strong><small>{item.subtitle}</small></span>
        </button>;
      })}
    </div>
    {dirty&&<div className="joins-dirty" role="status">JOIN scenario selected · Run Query to update the match result.</div>}

    <div className="joins-main-grid">
      <section className="joins-source-card customers">
        <div className="joins-panel-heading"><h3><Table2 size={17}/>customers <span>({dataset.customers.length} rows)</span></h3></div>
        <CustomersTable dataset={dataset} matchedIds={matchedIds}/>
        <div className="joins-link-lines" aria-hidden="true"><i/><i/><i/></div>
      </section>

      <section className="joins-source-card orders">
        <div className="joins-panel-heading"><h3><Table2 size={17}/>orders <span>({dataset.orders.length} rows)</span></h3></div>
        <OrdersTable dataset={dataset} matchedIds={matchedIds}/>
      </section>

      <section className="joins-result-card">
        <div className="joins-panel-heading"><h3><CheckCircle2 size={18}/>Result <span>({rows.length} rows)</span></h3></div>
        <p>{executedScenario.description}</p>
        <ResultTable rows={rows}/>
        {!rows.length&&<div className="joins-empty"><CircleDot size={26}/><strong>No joined rows</strong><span>This condition produced no matching pairs.</span></div>}
      </section>
    </div>

    <div className="joins-mid-grid">
      <section className="joins-sql-card">
        <div className="joins-sql-title"><Database size={17}/><strong>Generated SQL</strong></div>
        <DarkCodeCard title="SQL" code={query}/>
      </section>
      <section className="joins-parts-card">
        <h3>What each part means</h3>
        <div>{parts.map(([term,meaning])=><div key={term}><code>{term}</code><span>{meaning}</span></div>)}</div>
      </section>
    </div>

    <div className="joins-bottom-grid">
      <section className="joins-visual-card">
        <div className="joins-visual-heading"><span><Sparkles size={18}/></span><div><h3>Visual explanation</h3><p>A JOIN matches rows from two tables using a key and creates one row per matching pair.</p></div></div>
        <div className="joins-flow">
          <div><span><UsersRound size={22}/></span><strong>Customers table</strong><small>{dataset.customers.length} rows<br/>(id, name, city)</small></div>
          <b>+</b>
          <div><span className="purple"><FileText size={22}/></span><strong>Orders table</strong><small>{dataset.orders.length} rows<br/>(order_id, customer_id, …)</small></div>
          <ArrowRight size={20}/>
          <div><span className="violet"><Link2 size={22}/></span><strong>Match on key</strong><small>c.id = o.customer_id<br/>({Array.from(matchedIds).slice(0,3).join(", ")}{matchedIds.size>3?", …":""})</small></div>
          <ArrowRight size={20}/>
          <div><span className="green"><Table2 size={22}/></span><strong>One row per matching pair</strong><small>{matchingPairs} matching {matchingPairs===1?"row":"rows"}</small></div>
        </div>
      </section>

      <section className="joins-takeaways">
        <h3><LightTakeawayIcon/>Key takeaways</h3>
        <ul>
          <li><CheckCircle2 size={14}/>JOIN matches rows from two tables using a condition.</li>
          <li><CheckCircle2 size={14}/>Creates one row for each matching pair.</li>
          <li><CheckCircle2 size={14}/>INNER JOIN keeps only matching rows.</li>
          <li><CheckCircle2 size={14}/>LEFT JOIN keeps all rows from the left table.</li>
          <li><CheckCircle2 size={14}/>Use table aliases and ON to match key columns.</li>
        </ul>
      </section>
    </div>
  </section>;
}

function LightTakeawayIcon(){
  return <Link2 size={17}/>;
}
