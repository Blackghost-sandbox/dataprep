"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  Database,
  Eye,
  Lightbulb,
  Play,
  RotateCcw,
  Settings2,
  Target,
  Trophy,
} from "lucide-react";
import { DarkCodeCard } from "@/components/rdd-dataframe-experience";
import { useCompanion } from "@/components/companion-context";
import {
  limitDatasets,
  limitQuery,
  limitScenarios,
  sortedLimitRows,
  type LimitDataset,
  type LimitDirection,
  type LimitRow,
} from "@/lib/limit-lab";

function cellText(value:LimitRow[string]){
  if(value===null)return <em>NULL</em>;
  if(typeof value==="boolean")return value?"TRUE":"FALSE";
  return String(value);
}

function valueClass(dataset:LimitDataset,column:string,value:LimitRow[string]){
  if(column!=="age"&&column!=="amount")return "";
  const numeric=Number(value);
  if(!Number.isFinite(numeric))return "";
  if(dataset.id==="customers"){
    if(numeric<=29)return "limit-value-low";
    if(numeric<=36)return "limit-value-mid";
    return "limit-value-high";
  }
  if(numeric<200)return "limit-value-low";
  if(numeric<500)return "limit-value-mid";
  return "limit-value-high";
}

function DataTable({
  dataset,
  rows,
  highlightColumn,
  result=false,
}:{
  dataset:LimitDataset;
  rows:LimitRow[];
  highlightColumn:string;
  result?:boolean;
}){
  return <div className={"limit-table-wrap"+(result?" limit-result-table":"")} tabIndex={0} role="region" aria-label={result?"LIMIT query result":"Input table"}>
    <table>
      <thead><tr>{dataset.displayColumns.map(column=><th key={column}>{column}</th>)}</tr></thead>
      <tbody>{rows.map((row,index)=><tr key={String(row.id??index)}>{dataset.displayColumns.map(column=><td key={column} className={column===highlightColumn?valueClass(dataset,column,row[column]):""}>{cellText(row[column])}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}

export function LimitLearningLab(){
  const companion=useCompanion();
  const [datasetId,setDatasetId]=useState("customers");
  const dataset=useMemo(()=>limitDatasets.find(item=>item.id===datasetId)??limitDatasets[0],[datasetId]);
  const scenarios=useMemo(()=>limitScenarios(datasetId),[datasetId]);
  const [scenarioIndex,setScenarioIndex]=useState(0);
  const [column,setColumn]=useState("age");
  const [direction,setDirection]=useState<LimitDirection>("DESC");
  const [limit,setLimit]=useState(3);
  const [executedColumn,setExecutedColumn]=useState("age");
  const [executedDirection,setExecutedDirection]=useState<LimitDirection>("DESC");
  const [executedLimit,setExecutedLimit]=useState(3);
  const [running,setRunning]=useState(false);
  const [dirty,setDirty]=useState(false);

  const resultRows=useMemo(
    ()=>sortedLimitRows(dataset,executedColumn,executedDirection,executedLimit),
    [dataset,executedColumn,executedDirection,executedLimit],
  );
  const query=limitQuery(dataset,column,direction,limit);
  const currentScenario=scenarioIndex>=0?scenarios[scenarioIndex]:null;

  function setDraft(next:{column?:string;direction?:LimitDirection;limit?:number}){
    if(next.column!==undefined)setColumn(next.column);
    if(next.direction!==undefined)setDirection(next.direction);
    if(next.limit!==undefined)setLimit(Math.max(1,Math.min(dataset.rows.length,Math.floor(next.limit)||1)));
    setScenarioIndex(-1);
    setDirty(true);
  }

  function applyScenario(index:number){
    const next=scenarios[index];
    setScenarioIndex(index);
    setColumn(next.column);
    setDirection(next.direction);
    setLimit(next.limit);
    setExecutedColumn(next.column);
    setExecutedDirection(next.direction);
    setExecutedLimit(next.limit);
    setDirty(false);
    setRunning(false);
  }

  function changeDataset(nextId:string){
    const nextDataset=limitDatasets.find(item=>item.id===nextId)??limitDatasets[0];
    const next=limitScenarios(nextId)[0];
    setDatasetId(nextId);
    setScenarioIndex(0);
    setColumn(next.column);
    setDirection(next.direction);
    setLimit(Math.min(next.limit,nextDataset.rows.length));
    setExecutedColumn(next.column);
    setExecutedDirection(next.direction);
    setExecutedLimit(Math.min(next.limit,nextDataset.rows.length));
    setDirty(false);
    setRunning(false);
  }

  function run(){
    setRunning(true);
    companion?.emit({type:"exercise_started",lesson:"LIMIT / Top N",source:"runner"});
    window.setTimeout(()=>{
      setExecutedColumn(column);
      setExecutedDirection(direction);
      setExecutedLimit(limit);
      setDirty(false);
      setRunning(false);
      companion?.emit({type:"exercise_correct",lesson:"LIMIT / Top N",source:"runner"});
    },180);
  }

  function reset(){
    applyScenario(scenarioIndex>=0?scenarioIndex:0);
  }

  function nextScenario(){
    applyScenario((Math.max(0,scenarioIndex)+1)%scenarios.length);
  }

  const topLabel=dataset.id==="customers"
    ? `Top ${executedLimit} customers by ${executedColumn} (${executedDirection==="DESC"?"highest to lowest":"lowest to highest"})`
    : `Top ${executedLimit} orders by ${executedColumn} (${executedDirection==="DESC"?"highest to lowest":"lowest to highest"})`;

  return <section className="limit-simulator" aria-label="Interactive LIMIT Top N simulation">
    <header className="limit-header">
      <div className="limit-title"><span><Box size={24}/></span><div><h2>Interactive Simulation</h2><p>Explore how LIMIT works and how it combines with ORDER BY to control which rows are returned.</p></div></div>
      <div className="limit-actions">
        <label><span>Dataset</span><select aria-label="LIMIT dataset" value={datasetId} onChange={event=>changeDataset(event.target.value)}>{limitDatasets.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <button type="button" className="limit-run" disabled={running} onClick={run}><Play size={15} fill="currentColor"/>{running?"Running…":"Run Query"}</button>
        <button type="button" className="limit-reset" onClick={reset}><RotateCcw size={15}/>Reset</button>
        <button type="button" className="limit-next" onClick={nextScenario}>Next Scenario <ArrowRight size={15}/></button>
      </div>
    </header>

    <div className="limit-grid">
      <section className="limit-options-card">
        <h3><span>1.</span> Set query options</h3><p>Choose sorting and the number of rows to return.</p>
        <div className="limit-control-row">
          <label><span>Sort by</span><select value={column} onChange={event=>setDraft({column:event.target.value})}>{dataset.columns.filter(item=>item.key!=="id").map(item=><option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
          <fieldset><legend>Order</legend><div><button type="button" aria-pressed={direction==="ASC"} onClick={()=>setDraft({direction:"ASC"})}>ASC ↑</button><button type="button" aria-pressed={direction==="DESC"} onClick={()=>setDraft({direction:"DESC"})}>DESC ↓</button></div></fieldset>
          <label><span>Limit (Top N)</span><input aria-label="Limit Top N" type="number" min={1} max={dataset.rows.length} value={limit} onChange={event=>setDraft({limit:Number(event.target.value)})}/></label>
        </div>
        {dirty&&<small className="limit-dirty" role="status">Options changed · Run Query to update the result.</small>}
      </section>

      <section className="limit-input-card">
        <div className="limit-panel-heading"><h3><Database size={16}/>Input table ({dataset.table})</h3><small>{dataset.rows.length} rows</small></div>
        <DataTable dataset={dataset} rows={dataset.rows} highlightColumn={executedColumn}/>
      </section>

      <section className="limit-result-card">
        <div className="limit-panel-heading"><h3><CheckCircle2 size={18}/>Query result (Top {executedLimit} by {executedColumn})</h3><small>{resultRows.length} rows</small></div>
        <DataTable dataset={dataset} rows={resultRows} highlightColumn={executedColumn} result/>
        <div className="limit-result-note"><Trophy size={18}/><div><strong>{topLabel}</strong><p>LIMIT {executedLimit} returns only the first {resultRows.length} rows after sorting by {executedColumn} in {executedDirection==="DESC"?"descending":"ascending"} order.</p></div></div>
      </section>

      <section className="limit-sql-card">
        <div className="limit-sql-title"><Settings2 size={17}/><strong>Generated SQL</strong></div>
        <DarkCodeCard title="SQL" code={query}/>
      </section>

      <section className="limit-visual-card">
        <div className="limit-visual-heading"><Eye size={20}/><div><h3>Visual explanation</h3><p>See how ORDER BY and LIMIT work together.</p></div></div>
        <div className="limit-flow">
          <div><span className="limit-flow-icon"><Database size={23}/></span><strong>All rows</strong><small>({dataset.rows.length} {dataset.id==="customers"?"customers":"orders"})</small><p>Unordered data</p></div>
          <ArrowRight size={22}/>
          <div><span className="limit-flow-icon pink"><Target size={22}/></span><strong>ORDER BY</strong><small>{executedColumn} {executedDirection}</small><p>Sort rows by {executedColumn}</p></div>
          <ArrowRight size={22}/>
          <div><span className="limit-flow-icon green"><Database size={23}/></span><strong>LIMIT {executedLimit}</strong><small>Return only first {executedLimit} rows</small><p>from the sorted result</p></div>
        </div>
      </section>

      <section className="limit-scenarios-card">
        <div className="limit-scenario-heading"><Settings2 size={19}/><div><strong>Try different scenarios</strong><span>See how the result changes.</span></div></div>
        <div className="limit-scenario-buttons">{scenarios.map((scenario,index)=><button type="button" key={scenario.id} aria-pressed={scenarioIndex===index} onClick={()=>applyScenario(index)}>{scenario.label}</button>)}</div>
        <div className="limit-questions"><strong><Lightbulb size={15}/>Questions to try:</strong><ul><li>What happens if you change the order to {direction==="DESC"?"ASC":"DESC"}?</li><li>What if you use LIMIT {Math.min(dataset.rows.length,limit+2)} instead of {limit}?</li><li>Try sorting by signup_date. Which rows are returned?</li></ul></div>
        <p>{currentScenario?.description??`Sort by ${column} ${direction}, then keep only ${limit} rows.`}</p>
      </section>
    </div>
  </section>;
}
