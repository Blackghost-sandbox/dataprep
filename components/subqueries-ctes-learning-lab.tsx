"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  Database,
  Eye,
  FileCode2,
  Hash,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  Table2,
  Trophy,
} from "lucide-react";
import { DarkCodeCard } from "@/components/rdd-dataframe-experience";
import { useCompanion } from "@/components/companion-context";
import {
  customerTotals,
  formatSubqueryNumber,
  subqueryDatasets,
  subqueryIds,
  subqueryResult,
  subqueryScenarios,
  subquerySql,
  type SubqueryDataset,
  type SubqueryMode,
} from "@/lib/subqueries-ctes-lab";

function CustomerTable({dataset}:{dataset:SubqueryDataset}){
  return <div className="subq-table-wrap" role="region" aria-label="Customers table" tabIndex={0}>
    <table>
      <thead><tr><th>id</th><th>name</th><th>city</th></tr></thead>
      <tbody>{dataset.customers.map(row=><tr key={row.id}><td>{row.id}</td><td>{row.name}</td><td>{row.city}</td></tr>)}</tbody>
    </table>
  </div>;
}

function amountClass(amount:number){
  if(amount<0)return "subq-amount-negative";
  if(amount<300)return "subq-amount-low";
  if(amount<600)return "subq-amount-mid";
  return "subq-amount-high";
}

function OrdersTable({dataset}:{dataset:SubqueryDataset}){
  return <div className="subq-table-wrap" role="region" aria-label="Orders table" tabIndex={0}>
    <table>
      <thead><tr><th>id</th><th>customer_id</th><th>amount</th><th>order_date</th></tr></thead>
      <tbody>{dataset.orders.slice(0,5).map(row=><tr key={row.id}><td>{row.id}</td><td>{row.customer_id}</td><td className={amountClass(row.amount)}>{row.amount}</td><td>{row.order_date}</td></tr>)}</tbody>
    </table>
    {dataset.orders.length>5&&<div className="subq-more">+ {dataset.orders.length-5} more rows...</div>}
  </div>;
}

export function SubqueriesCtesLearningLab(){
  const companion=useCompanion();
  const [datasetId,setDatasetId]=useState("customers-orders");
  const dataset=useMemo(()=>subqueryDatasets.find(item=>item.id===datasetId)??subqueryDatasets[0],[datasetId]);
  const [mode,setMode]=useState<SubqueryMode>("subquery");
  const [executedMode,setExecutedMode]=useState<SubqueryMode>("subquery");
  const [threshold,setThreshold]=useState(500);
  const [executedThreshold,setExecutedThreshold]=useState(500);
  const [running,setRunning]=useState(false);
  const [dirty,setDirty]=useState(false);

  const rows=useMemo(()=>subqueryResult(dataset,executedMode,executedThreshold),[dataset,executedMode,executedThreshold]);
  const ids=useMemo(()=>subqueryIds(dataset,executedThreshold),[dataset,executedThreshold]);
  const totals=useMemo(()=>customerTotals(dataset),[dataset]);
  const sql=subquerySql(mode,threshold);
  const executedScenario=subqueryScenarios.find(item=>item.id===executedMode)??subqueryScenarios[0];

  function changeDataset(nextId:string){
    setDatasetId(nextId);
    setMode("subquery");
    setExecutedMode("subquery");
    setThreshold(500);
    setExecutedThreshold(500);
    setRunning(false);
    setDirty(false);
  }

  function changeMode(next:SubqueryMode){
    setMode(next);
    setDirty(next!==executedMode || threshold!==executedThreshold);
  }

  function setThresholdValue(value:number){
    const normalized=Math.max(0,Math.floor(value||0));
    setThreshold(normalized);
    setDirty(mode!==executedMode || normalized!==executedThreshold);
  }

  function run(){
    setRunning(true);
    companion?.emit({type:"exercise_started",lesson:"Subqueries & CTEs",source:"runner"});
    window.setTimeout(()=>{
      setExecutedMode(mode);
      setExecutedThreshold(threshold);
      setDirty(false);
      setRunning(false);
      companion?.emit({type:"exercise_correct",lesson:"Subqueries & CTEs",source:"runner"});
    },180);
  }

  function reset(){
    setMode("subquery");
    setExecutedMode("subquery");
    setThreshold(500);
    setExecutedThreshold(500);
    setRunning(false);
    setDirty(false);
  }

  function nextScenario(){
    const current=Math.max(0,subqueryScenarios.findIndex(item=>item.id===mode));
    const next=subqueryScenarios[(current+1)%subqueryScenarios.length];
    setMode(next.id);
    setExecutedMode(next.id);
    setDirty(false);
  }

  const resultTitle=executedMode==="select"?"Customers with average order amount":`Top customers with total orders > ${executedThreshold}`;

  return <section className="subq-simulator" aria-label="Interactive Subqueries and CTEs simulation">
    <header className="subq-header">
      <div className="subq-title"><span><Box size={24}/></span><div><h2>Interactive Simulation</h2><p>See how a subquery and a CTE work step by step. Modify the query and run to see the result change.</p></div></div>
      <div className="subq-actions">
        <label><span>Dataset</span><select value={datasetId} onChange={event=>changeDataset(event.target.value)}>{subqueryDatasets.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <button className="subq-run" type="button" disabled={running} onClick={run}><Play size={15} fill="currentColor"/>{running?"Running…":"Run Query"}</button>
        <button className="subq-reset" type="button" onClick={reset}><RotateCcw size={15}/>Reset</button>
        <button className="subq-next" type="button" onClick={nextScenario}>Next Scenario <ArrowRight size={15}/></button>
      </div>
    </header>

    <div className="subq-main-grid">
      <section className="subq-data-card">
        <h3><span>1.</span> Explore the data</h3><p>We have two tables: customers and orders.</p>
        <div className="subq-data-split">
          <div><div className="subq-mini-title"><Table2 size={16}/>customers ({dataset.customers.length} rows)</div><CustomerTable dataset={dataset}/></div>
          <div><div className="subq-mini-title green"><Database size={16}/>orders ({dataset.orders.length} rows)</div><OrdersTable dataset={dataset}/></div>
        </div>
      </section>

      <section className="subq-chooser-card">
        <h3><span>2.</span> Choose query type</h3><p>Select a query to see how it works.</p>
        <div className="subq-query-options">{subqueryScenarios.map((item,index)=>{
          const Icon=index===0?FileCode2:index===1?Table2:Sparkles;
          return <button type="button" key={item.id} aria-pressed={mode===item.id} onClick={()=>changeMode(item.id)}>
            <span className={"subq-query-icon mode-"+item.id}><Icon size={18}/></span>
            <span><strong>{item.label}</strong><small>{item.subtitle}</small></span>
            <i aria-hidden="true"/>
          </button>;
        })}</div>
        {dirty&&<div className="subq-dirty" role="status">Query settings changed · Run Query to update the result.</div>}
      </section>

      <section className="subq-result-card">
        <div className="subq-panel-heading"><h3><CheckCircle2 size={18}/><span>3.</span> Query result</h3></div>
        <p>{resultTitle}</p>
        <div className="subq-result-table"><table><thead><tr><th>id</th><th>name</th><th>city</th><th>{executedMode==="select"?"avg_amount":"total_amount"}</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{row.id}</td><td>{row.name}</td><td>{row.city}</td><td className="subq-result-value">{formatSubqueryNumber(executedMode==="select"?row.avg_amount:row.total_amount)}</td></tr>)}</tbody></table></div>
        <div className="subq-explanation"><Trophy size={19}/><div><strong>Result explanation</strong><p>{executedScenario.description}</p></div></div>
      </section>
    </div>

    <div className="subq-bottom-grid">
      <section className="subq-sql-card">
        <div className="subq-sql-title"><FileCode2 size={17}/><strong>Generated SQL</strong></div>
        <DarkCodeCard title="SQL" code={sql}/>
      </section>

      <section className="subq-visual-card">
        <div className="subq-visual-heading"><Eye size={19}/><div><h3>Visual explanation</h3><p>See how the subquery works step by step.</p></div></div>
        {executedMode==="subquery"&&<div className="subq-flow">
          <div><span><Database size={22}/></span><strong>orders</strong><small>Group by customer_id<br/>SUM(amount) &gt; {executedThreshold}</small></div>
          <ArrowRight size={20}/>
          <div className="subq-flow-mid"><b>Subquery result</b><small>(customer_ids)</small><strong>[{ids.join(", ")}]</strong></div>
          <ArrowRight size={20}/>
          <div><span className="blue"><Table2 size={22}/></span><strong>customers</strong><small>Filter customers<br/>WHERE id IN (subquery)</small></div>
          <ArrowRight size={20}/>
          <div className="subq-flow-final"><b>Final result</b><strong>{rows.length} customers</strong></div>
        </div>}
        {executedMode==="cte"&&<div className="subq-flow cte">
          <div><span><Database size={22}/></span><strong>orders</strong><small>GROUP BY customer_id</small></div><ArrowRight size={20}/>
          <div className="subq-flow-mid"><b>WITH totals</b><small>Named intermediate result</small><strong>{totals.length} rows</strong></div><ArrowRight size={20}/>
          <div><span className="blue"><Table2 size={22}/></span><strong>JOIN customers</strong><small>Match customer_id to id</small></div><ArrowRight size={20}/>
          <div className="subq-flow-final"><b>Filter totals</b><strong>{rows.length} customers</strong></div>
        </div>}
        {executedMode==="select"&&<div className="subq-flow select">
          <div><span className="blue"><Table2 size={22}/></span><strong>customers</strong><small>Read one customer row</small></div><ArrowRight size={20}/>
          <div className="subq-flow-mid"><b>Scalar subquery</b><small>AVG(order amount) for that customer</small><strong>1 value</strong></div><ArrowRight size={20}/>
          <div className="subq-flow-final"><b>Attach value</b><strong>{rows.length} result rows</strong></div>
        </div>}
      </section>

      <section className="subq-scenarios-card">
        <div className="subq-scenarios-heading"><Hash size={18}/><div><h3>Try different scenarios</h3><p>Change the amount threshold and see the result.</p></div></div>
        <label><span>Minimum total amount</span><input type="number" min={0} value={threshold} disabled={mode==="select"} onChange={event=>setThresholdValue(Number(event.target.value))}/></label>
        <div className="subq-threshold-buttons">{[100,300,500,800].map(value=><button type="button" disabled={mode==="select"} aria-pressed={threshold===value} key={value} onClick={()=>setThresholdValue(value)}>{value}</button>)}</div>
        <div className="subq-questions"><strong><Lightbulb size={15}/>Questions to try:</strong><ul><li>What happens if you change the threshold to 300?</li><li>Can you use a CTE instead of a subquery?</li><li>Try showing the total amount in the result.</li></ul></div>
        {mode==="select"&&<small className="subq-threshold-note">Threshold is not used by the Subquery in SELECT scenario.</small>}
      </section>
    </div>
  </section>;
}
