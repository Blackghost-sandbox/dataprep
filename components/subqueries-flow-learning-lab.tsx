"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  Database,
  Eye,
  FileCode2,
  Filter,
  Hash,
  Lightbulb,
  Play,
  RotateCcw,
  Sigma,
  Table2,
  Trophy,
  UserRound,
} from "lucide-react";
import { DarkCodeCard } from "@/components/rdd-dataframe-experience";
import { useCompanion } from "@/components/companion-context";
import {
  formatSubqueryFlowNumber,
  subqueryFlowCustomerIds,
  subqueryFlowDatasets,
  subqueryFlowInnerSql,
  subqueryFlowResult,
  subqueryFlowSql,
  type SubqueryFlowOrder,
  type SubqueryFlowSort,
} from "@/lib/subqueries-flow-lab";

const nextScenarios=[
  {threshold:500,sortBy:"total_amount" as const,sortOrder:"DESC" as const},
  {threshold:300,sortBy:"total_amount" as const,sortOrder:"DESC" as const},
  {threshold:800,sortBy:"total_amount" as const,sortOrder:"ASC" as const},
  {threshold:100,sortBy:"name" as const,sortOrder:"ASC" as const},
];

function amountClass(value:number){
  if(value<200)return "subflow-amount-low";
  if(value<400)return "subflow-amount-mid";
  if(value<700)return "subflow-amount-high";
  return "subflow-amount-max";
}

export function SubqueriesFlowLearningLab(){
  const companion=useCompanion();
  const [datasetId,setDatasetId]=useState("orders");
  const dataset=useMemo(()=>subqueryFlowDatasets.find(item=>item.id===datasetId)??subqueryFlowDatasets[0],[datasetId]);

  const [threshold,setThreshold]=useState(500);
  const [sortBy,setSortBy]=useState<SubqueryFlowSort>("total_amount");
  const [sortOrder,setSortOrder]=useState<SubqueryFlowOrder>("DESC");

  const [executedThreshold,setExecutedThreshold]=useState(500);
  const [executedSortBy,setExecutedSortBy]=useState<SubqueryFlowSort>("total_amount");
  const [executedSortOrder,setExecutedSortOrder]=useState<SubqueryFlowOrder>("DESC");
  const [running,setRunning]=useState(false);
  const [dirty,setDirty]=useState(false);
  const [scenarioIndex,setScenarioIndex]=useState(0);

  const rows=useMemo(
    ()=>subqueryFlowResult(dataset,executedThreshold,executedSortBy,executedSortOrder),
    [dataset,executedThreshold,executedSortBy,executedSortOrder],
  );
  const ids=useMemo(()=>subqueryFlowCustomerIds(dataset,executedThreshold),[dataset,executedThreshold]);
  const generatedSql=subqueryFlowSql(threshold,sortBy,sortOrder);
  const innerSql=subqueryFlowInnerSql(executedThreshold);

  function markDirty(){
    setDirty(
      threshold!==executedThreshold ||
      sortBy!==executedSortBy ||
      sortOrder!==executedSortOrder
    );
  }

  function updateThreshold(value:number){
    const normalized=Math.max(0,Math.floor(value||0));
    setThreshold(normalized);
    setDirty(
      normalized!==executedThreshold ||
      sortBy!==executedSortBy ||
      sortOrder!==executedSortOrder
    );
  }

  function updateSortBy(value:SubqueryFlowSort){
    setSortBy(value);
    setDirty(
      threshold!==executedThreshold ||
      value!==executedSortBy ||
      sortOrder!==executedSortOrder
    );
  }

  function updateSortOrder(value:SubqueryFlowOrder){
    setSortOrder(value);
    setDirty(
      threshold!==executedThreshold ||
      sortBy!==executedSortBy ||
      value!==executedSortOrder
    );
  }

  function run(){
    setRunning(true);
    companion?.emit({type:"exercise_started",lesson:"Subqueries & CTEs",source:"runner"});
    window.setTimeout(()=>{
      setExecutedThreshold(threshold);
      setExecutedSortBy(sortBy);
      setExecutedSortOrder(sortOrder);
      setDirty(false);
      setRunning(false);
      companion?.emit({type:"exercise_correct",lesson:"Subqueries & CTEs",source:"runner"});
    },180);
  }

  function reset(){
    setThreshold(500);
    setSortBy("total_amount");
    setSortOrder("DESC");
    setExecutedThreshold(500);
    setExecutedSortBy("total_amount");
    setExecutedSortOrder("DESC");
    setScenarioIndex(0);
    setDirty(false);
    setRunning(false);
  }

  function nextScenario(){
    const nextIndex=(scenarioIndex+1)%nextScenarios.length;
    const next=nextScenarios[nextIndex];
    setScenarioIndex(nextIndex);
    setThreshold(next.threshold);
    setSortBy(next.sortBy);
    setSortOrder(next.sortOrder);
    setExecutedThreshold(next.threshold);
    setExecutedSortBy(next.sortBy);
    setExecutedSortOrder(next.sortOrder);
    setDirty(false);
  }

  function changeDataset(nextId:string){
    setDatasetId(nextId);
    setThreshold(500);
    setSortBy("total_amount");
    setSortOrder("DESC");
    setExecutedThreshold(500);
    setExecutedSortBy("total_amount");
    setExecutedSortOrder("DESC");
    setScenarioIndex(0);
    setDirty(false);
    setRunning(false);
  }

  const resultSummary=rows.length===1?"1 row":`${rows.length} rows`;

  return <section className="subflow-simulator" aria-label="Interactive subquery simulation">
    <header className="subflow-header">
      <div className="subflow-title">
        <span><Box size={24}/></span>
        <div>
          <h2>Interactive Simulation</h2>
          <p>Explore how a subquery and a CTE work together to get customers with total orders &gt; {executedThreshold}.</p>
        </div>
      </div>
      <div className="subflow-actions">
        <label><span>Dataset</span><select value={datasetId} onChange={event=>changeDataset(event.target.value)}>{subqueryFlowDatasets.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <button type="button" className="subflow-run" disabled={running} onClick={run}><Play size={15} fill="currentColor"/>{running?"Running…":"Run Query"}</button>
        <button type="button" className="subflow-reset" onClick={reset}><RotateCcw size={15}/>Reset</button>
        <button type="button" className="subflow-next" onClick={nextScenario}>Next Scenario <ArrowRight size={15}/></button>
      </div>
    </header>

    <div className="subflow-top-grid">
      <section className="subflow-input-card">
        <div className="subflow-panel-heading"><h3><Table2 size={17}/><span>1.</span> Input data (orders)</h3><small>{dataset.orders.length} rows</small></div>
        <div className="subflow-table-wrap" role="region" aria-label="Orders input data" tabIndex={0}>
          <table>
            <thead><tr><th>id</th><th>customer_id</th><th>amount</th><th>order_date</th></tr></thead>
            <tbody>{dataset.orders.map(order=><tr key={order.id}><td>{order.id}</td><td>{order.customer_id}</td><td className={amountClass(order.amount)}>{order.amount}</td><td>{order.order_date}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <div className="subflow-top-arrow" aria-hidden="true"><ArrowRight size={22}/></div>

      <section className="subflow-process-card">
        <div className="subflow-query-box pink">
          <div className="subflow-query-box-title"><span><Database size={18}/></span><strong>Subquery</strong></div>
          <pre>{innerSql}</pre>
        </div>
        <div className="subflow-process-arrow" aria-hidden="true">↓</div>
        <div className="subflow-query-box purple">
          <div className="subflow-query-box-title"><span><Table2 size={18}/></span><strong>Use in main query</strong></div>
          <pre>{`SELECT id, name, city\nFROM customers\nWHERE id IN (\n  -- subquery here\n)`}</pre>
        </div>
      </section>

      <div className="subflow-top-arrow second" aria-hidden="true"><ArrowRight size={22}/></div>

      <section className="subflow-result-card">
        <div className="subflow-panel-heading"><h3><CheckCircle2 size={18}/><span>3.</span> Result (customers with total &gt; {executedThreshold})</h3><small>{resultSummary}</small></div>
        <div className="subflow-result-table" role="region" aria-label="Subquery result" tabIndex={0}>
          <table>
            <thead><tr><th>id</th><th>name</th><th>city</th><th>total_amount</th></tr></thead>
            <tbody>{rows.map(row=><tr key={row.id}><td>{row.id}</td><td>{row.name}</td><td>{row.city}</td><td>{formatSubqueryFlowNumber(row.total_amount)}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="subflow-what">
          <div className="subflow-what-title"><Lightbulb size={17}/><strong>What happened?</strong></div>
          <ul>
            <li><CheckCircle2 size={14}/>We calculated total order amount per customer.</li>
            <li><CheckCircle2 size={14}/>Filtered customers with total &gt; {executedThreshold} using a subquery.</li>
            <li><CheckCircle2 size={14}/>Used the result in the main query to get customer details.</li>
          </ul>
        </div>
      </section>
    </div>

    <div className="subflow-middle-grid">
      <section className="subflow-sql-card">
        <div className="subflow-sql-title"><FileCode2 size={17}/><strong>Generated SQL</strong></div>
        <DarkCodeCard title="SQL" code={generatedSql}/>
      </section>

      <section className="subflow-visual-card">
        <div className="subflow-visual-heading"><Eye size={19}/><div><h3>Visual explanation</h3><p>See how the subquery works step by step.</p></div></div>
        <div className="subflow-flow">
          <div><span><Table2 size={22}/></span><strong>Orders</strong><small>{dataset.orders.length} rows<br/>Raw data</small></div>
          <ArrowRight size={20}/>
          <div className="subflow-flow-subquery"><span><Sigma size={22}/></span><strong>Subquery</strong><small>Group by customer_id<br/>HAVING SUM &gt; {executedThreshold}<br/>({ids.length} customer_ids)</small></div>
          <ArrowRight size={20}/>
          <div className="subflow-flow-main"><span><UserRound size={22}/></span><strong>Main Query</strong><small>Get customer details using IN<br/>({rows.length} rows)</small></div>
        </div>
      </section>
    </div>

    <div className="subflow-bottom-grid">
      <section className="subflow-scenarios-card">
        <div className="subflow-scenario-heading"><Hash size={18}/><div><h3>Try different scenarios</h3><p>Change the condition and see how the result changes.</p></div></div>
        <div className="subflow-controls">
          <label><span>Minimum total amount</span><input type="number" min={0} value={threshold} onChange={event=>updateThreshold(Number(event.target.value))}/></label>
          <label><span>Sort by</span><select value={sortBy} onChange={event=>updateSortBy(event.target.value as SubqueryFlowSort)}><option value="total_amount">total_amount</option><option value="name">name</option><option value="city">city</option><option value="id">id</option></select></label>
          <fieldset><legend>Sort order</legend><div><button type="button" aria-pressed={sortOrder==="DESC"} onClick={()=>updateSortOrder("DESC")}>DESC</button><button type="button" aria-pressed={sortOrder==="ASC"} onClick={()=>updateSortOrder("ASC")}>ASC</button></div></fieldset>
          <button type="button" className="subflow-run bottom" disabled={running} onClick={run}><Play size={15} fill="currentColor"/>{running?"Running…":"Run Query"}</button>
        </div>
        {dirty&&<small className="subflow-dirty" role="status">Scenario settings changed · Run Query to update the result.</small>}
      </section>

      <section className="subflow-takeaways">
        <h3><Trophy size={17}/>Key takeaways</h3>
        <ul>
          <li><CheckCircle2 size={14}/>A subquery is a query inside another query.</li>
          <li><CheckCircle2 size={14}/>A CTE gives a name to an intermediate query using WITH.</li>
          <li><CheckCircle2 size={14}/>Use subqueries or CTEs to break complex queries into steps.</li>
          <li><CheckCircle2 size={14}/>Both can improve readability and modularity.</li>
        </ul>
      </section>
    </div>
  </section>;
}
