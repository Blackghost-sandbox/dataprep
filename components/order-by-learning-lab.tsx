"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  Database,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";
import { DarkCodeCard } from "@/components/rdd-dataframe-experience";
import { useCompanion } from "@/components/companion-context";
import {
  orderDatasets,
  orderQuery,
  orderScenarios,
  sortRows,
  type OrderDataset,
  type OrderRow,
  type SortDirection,
} from "@/lib/order-by-lab";

function cellText(value:OrderRow[string]){
  if(value===null)return <em>NULL</em>;
  if(typeof value==="boolean")return value?"TRUE":"FALSE";
  return String(value);
}

function valueClass(dataset:OrderDataset,column:string,value:OrderRow[string]){
  if(column!=="age"&&column!=="amount")return "";
  const numeric=Number(value);
  if(!Number.isFinite(numeric))return "";
  if(dataset.id==="customers"){
    if(numeric<=29)return "order-value-low";
    if(numeric<=36)return "order-value-mid";
    return "order-value-high";
  }
  if(numeric<200)return "order-value-low";
  if(numeric<500)return "order-value-mid";
  return "order-value-high";
}

function DataTable({
  dataset,
  rows,
  highlightColumn,
  result=false,
}:{
  dataset:OrderDataset;
  rows:OrderRow[];
  highlightColumn:string;
  result?:boolean;
}){
  return <div className={"order-table-wrap"+(result?" order-result-table":"")} tabIndex={0} role="region" aria-label={result?"Sorted ORDER BY result":"Original unsorted data"}>
    <table>
      <thead><tr>{dataset.displayColumns.map(column=><th key={column}>{column}</th>)}</tr></thead>
      <tbody>{rows.map((row,index)=><tr key={String(row.id??index)}>{dataset.displayColumns.map(column=><td key={column} className={column===highlightColumn?valueClass(dataset,column,row[column]):""}>{cellText(row[column])}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}

export function OrderByLearningLab(){
  const companion=useCompanion();
  const [datasetId,setDatasetId]=useState("customers");
  const dataset=useMemo(()=>orderDatasets.find(item=>item.id===datasetId)??orderDatasets[0],[datasetId]);
  const scenarios=useMemo(()=>orderScenarios(datasetId),[datasetId]);
  const [scenarioIndex,setScenarioIndex]=useState(0);
  const [column,setColumn]=useState("age");
  const [direction,setDirection]=useState<SortDirection>("ASC");
  const [executedColumn,setExecutedColumn]=useState("age");
  const [executedDirection,setExecutedDirection]=useState<SortDirection>("ASC");
  const [running,setRunning]=useState(false);
  const [dirty,setDirty]=useState(false);

  const sortedRows=useMemo(()=>sortRows(dataset,executedColumn,executedDirection),[dataset,executedColumn,executedDirection]);
  const query=orderQuery(dataset,column,direction);
  const currentScenario=scenarioIndex>=0?scenarios[scenarioIndex]:null;

  function selectScenario(index:number,execute=true){
    const next=scenarios[index];
    setScenarioIndex(index);
    setColumn(next.column);
    setDirection(next.direction);
    setDirty(!execute);
    if(execute){
      setExecutedColumn(next.column);
      setExecutedDirection(next.direction);
    }
  }

  function changeDataset(nextId:string){
    const nextScenarios=orderScenarios(nextId);
    const next=nextScenarios[0];
    setDatasetId(nextId);
    setScenarioIndex(0);
    setColumn(next.column);
    setDirection(next.direction);
    setExecutedColumn(next.column);
    setExecutedDirection(next.direction);
    setDirty(false);
    setRunning(false);
  }

  function changeColumn(next:string){
    setColumn(next);
    setScenarioIndex(-1);
    setDirty(true);
  }

  function changeDirection(next:SortDirection){
    setDirection(next);
    setScenarioIndex(-1);
    setDirty(true);
  }

  function run(){
    setRunning(true);
    companion?.emit({type:"exercise_started",lesson:"ORDER BY",source:"runner"});
    window.setTimeout(()=>{
      setExecutedColumn(column);
      setExecutedDirection(direction);
      setDirty(false);
      setRunning(false);
      companion?.emit({type:"exercise_correct",lesson:"ORDER BY",source:"runner"});
    },180);
  }

  function reset(){
    const next=scenarios[scenarioIndex>=0?scenarioIndex:0];
    setScenarioIndex(scenarioIndex>=0?scenarioIndex:0);
    setColumn(next.column);
    setDirection(next.direction);
    setExecutedColumn(next.column);
    setExecutedDirection(next.direction);
    setDirty(false);
    setRunning(false);
  }

  function nextScenario(){
    selectScenario((Math.max(0,scenarioIndex)+1)%scenarios.length,true);
  }

  const previewRows=sortedRows.slice(0,4);

  return <section className="order-simulator" aria-label="Interactive ORDER BY simulation">
    <header className="order-header">
      <div className="order-title"><span><Box size={24}/></span><div><h2>Interactive Simulation</h2><p>Choose a column and sort order, then run the query to see how ORDER BY changes the result.</p></div></div>
      <div className="order-actions">
        <label><span>Dataset</span><select aria-label="ORDER BY dataset" value={datasetId} onChange={event=>changeDataset(event.target.value)}>{orderDatasets.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <button type="button" className="order-run" disabled={running} onClick={run}><Play size={15} fill="currentColor"/>{running?"Running…":"Run Query"}</button>
        <button type="button" className="order-reset" onClick={reset}><RotateCcw size={15}/>Reset</button>
        <button type="button" className="order-next" onClick={nextScenario}>Next Scenario <ArrowRight size={15}/></button>
      </div>
    </header>

    <div className="order-grid">
      <section className="order-options-card">
        <h3><span>1.</span> Choose sorting options</h3><p>Select a column and sort order.</p>
        <label className="order-select"><span>Sort by</span><select value={column} onChange={event=>changeColumn(event.target.value)}>{dataset.columns.filter(item=>item.key!=="id").map(item=><option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
        <fieldset className="order-direction"><legend>Order</legend><button type="button" aria-pressed={direction==="ASC"} onClick={()=>changeDirection("ASC")}>Ascending (ASC)</button><button type="button" aria-pressed={direction==="DESC"} onClick={()=>changeDirection("DESC")}>Descending (DESC)</button></fieldset>
        <div className="order-hint"><Lightbulb size={16}/><span>Try different columns like name, city, or total_spend.</span></div>
        {dirty&&<small className="order-dirty" role="status">Sorting changed · Run Query to update the result.</small>}
        <div className="order-syntax"><strong>ORDER BY syntax</strong><DarkCodeCard title="SQL" code={query}/></div>
      </section>

      <section className="order-original-card">
        <div className="order-panel-heading"><h3><Database size={16}/><span>2.</span> Original data (unsorted)</h3><small>{dataset.rows.length} rows</small></div>
        <DataTable dataset={dataset} rows={dataset.rows} highlightColumn={executedColumn}/>
      </section>

      <section className="order-result-card">
        <div className="order-panel-heading"><h3><CheckCircle2 size={18}/><span>3.</span> Result after ORDER BY {executedColumn} {executedDirection}</h3><small>{sortedRows.length} rows</small></div>
        <DataTable dataset={dataset} rows={sortedRows} highlightColumn={executedColumn} result/>
      </section>

      <section className="order-visual-card">
        <div className="order-visual-heading"><span><Sparkles size={18}/></span><div><h3>Visual explanation</h3><p>See how rows are rearranged based on the selected column and order.</p></div></div>
        <div className="order-flow">
          <div><span className="order-flow-icon"><Database size={23}/></span><strong>Input rows</strong><small>(unsorted)</small><p>1&nbsp; 2&nbsp; 3&nbsp; ...&nbsp; {dataset.rows.length}</p></div>
          <ArrowRight size={22}/>
          <div><span className="order-flow-icon pink"><Target size={22}/></span><strong>ORDER BY</strong><small>{executedColumn} {executedDirection}</small></div>
          <ArrowRight size={22}/>
          <div><span className="order-flow-icon green"><Database size={23}/></span><strong>Output rows</strong><small>(sorted by {executedColumn})</small><p>{sortedRows.slice(0,3).map(row=>String(row[executedColumn])).join("  ")} ... {String(sortedRows[sortedRows.length-1]?.[executedColumn]??"")}</p></div>
        </div>
      </section>

      <section className="order-scenarios-card">
        <div className="order-scenario-heading"><span><Target size={19}/></span><strong>Try different scenarios</strong></div>
        <div className="order-scenario-buttons">{scenarios.slice(1).map((scenario,index)=><button type="button" key={scenario.id} aria-pressed={scenarioIndex===index+1} onClick={()=>selectScenario(index+1,true)}>{scenario.label}</button>)}</div>
        <div className="order-preview-table"><table><thead><tr><th>name</th><th>city</th><th>{dataset.id==="customers"?"age":"amount"}</th></tr></thead><tbody>{previewRows.map((row,index)=><tr key={String(row.id??index)}><td>{cellText(row.name??row.id)}</td><td>{cellText(row.city??row.status)}</td><td className={valueClass(dataset,dataset.id==="customers"?"age":"amount",row[dataset.id==="customers"?"age":"amount"])}>{cellText(row[dataset.id==="customers"?"age":"amount"])}</td></tr>)}</tbody></table></div>
        <p>{currentScenario?.description??`Sorting by ${column} ${direction}. Run the query to apply this order.`}</p>
      </section>
    </div>
  </section>;
}
