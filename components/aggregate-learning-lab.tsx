"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Box,
  CheckCircle2,
  Database,
  Eye,
  Lightbulb,
  Play,
  RotateCcw,
  Settings2,
  Sigma,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { DarkCodeCard } from "@/components/rdd-dataframe-experience";
import { useCompanion } from "@/components/companion-context";
import {
  aggregateDatasets,
  aggregateFunctions,
  aggregateQuery,
  aggregateScenarios,
  aggregateSteps,
  aggregateValue,
  formatAggregateValue,
  selectableColumns,
  type AggregateDataset,
  type AggregateFunction,
  type AggregateRow,
} from "@/lib/aggregate-lab";

const functionIcons:Record<AggregateFunction,typeof BarChart3>={
  COUNT:BarChart3,
  SUM:Sigma,
  AVG:TrendingUp,
  MIN:ArrowDown,
  MAX:ArrowUp,
};

function cellText(value:AggregateRow[string]){
  if(value===null)return <em>NULL</em>;
  if(typeof value==="boolean")return value?"TRUE":"FALSE";
  return String(value);
}

function amountClass(value:AggregateRow[string]){
  const numeric=Number(value);
  if(!Number.isFinite(numeric))return "";
  if(numeric<300)return "aggregate-value-low";
  if(numeric<600)return "aggregate-value-mid";
  if(numeric<800)return "aggregate-value-high";
  return "aggregate-value-max";
}

function DataTable({dataset,highlightColumn}:{dataset:AggregateDataset;highlightColumn:string}){
  return <div className="aggregate-table-wrap" tabIndex={0} role="region" aria-label={"Input table "+dataset.table}>
    <table>
      <thead><tr>{dataset.displayColumns.map(column=><th key={column}>{column}</th>)}</tr></thead>
      <tbody>{dataset.rows.map((row,index)=><tr key={String(row.id??index)}>{dataset.displayColumns.map(column=><td key={column} className={column===highlightColumn&&typeof row[column]==="number"?amountClass(row[column]):""}>{cellText(row[column])}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}

export function AggregateLearningLab(){
  const companion=useCompanion();
  const [datasetId,setDatasetId]=useState("orders");
  const dataset=useMemo(()=>aggregateDatasets.find(item=>item.id===datasetId)??aggregateDatasets[0],[datasetId]);
  const scenarios=useMemo(()=>aggregateScenarios(datasetId),[datasetId]);
  const [scenarioIndex,setScenarioIndex]=useState(0);
  const [fn,setFn]=useState<AggregateFunction>("COUNT");
  const [column,setColumn]=useState<string|"*">("amount");
  const [executedFn,setExecutedFn]=useState<AggregateFunction>("COUNT");
  const [executedColumn,setExecutedColumn]=useState<string|"*">("amount");
  const [running,setRunning]=useState(false);
  const [dirty,setDirty]=useState(false);

  const result=useMemo(()=>aggregateValue(dataset,executedFn,executedColumn),[dataset,executedFn,executedColumn]);
  const resultText=formatAggregateValue(result,executedFn);
  const query=aggregateQuery(dataset,fn,column);
  const steps=aggregateSteps(dataset,executedFn,executedColumn);
  const availableColumns=selectableColumns(dataset,fn);
  const executedLabel=`${executedFn}(${executedColumn})`;

  function normalizeColumn(nextFn:AggregateFunction,current:string|"*"){
    const allowed=selectableColumns(dataset,nextFn);
    return allowed.some(item=>item.key===current)?current:(allowed.find(item=>item.key==="amount")?.key??allowed[0].key);
  }

  function changeFunction(next:AggregateFunction){
    const nextColumn=normalizeColumn(next,column);
    setFn(next);
    setColumn(nextColumn);
    setScenarioIndex(-1);
    setDirty(true);
  }

  function changeColumn(next:string){
    setColumn(next);
    setScenarioIndex(-1);
    setDirty(true);
  }

  function applyScenario(index:number,execute=true){
    const next=scenarios[index];
    setScenarioIndex(index);
    setFn(next.fn);
    setColumn(next.column);
    setDirty(!execute);
    if(execute){
      setExecutedFn(next.fn);
      setExecutedColumn(next.column);
    }
  }

  function changeDataset(nextId:string){
    const nextDataset=aggregateDatasets.find(item=>item.id===nextId)??aggregateDatasets[0];
    const next=aggregateScenarios(nextId)[0];
    setDatasetId(nextId);
    setScenarioIndex(0);
    setFn(next.fn);
    setColumn(next.column);
    setExecutedFn(next.fn);
    setExecutedColumn(next.column);
    setRunning(false);
    setDirty(false);
    void nextDataset;
  }

  function run(){
    setRunning(true);
    companion?.emit({type:"exercise_started",lesson:"Aggregate Functions",source:"runner"});
    window.setTimeout(()=>{
      setExecutedFn(fn);
      setExecutedColumn(column);
      setDirty(false);
      setRunning(false);
      companion?.emit({type:"exercise_correct",lesson:"Aggregate Functions",source:"runner"});
    },180);
  }

  function reset(){
    const next=scenarios[scenarioIndex>=0?scenarioIndex:0];
    setScenarioIndex(scenarioIndex>=0?scenarioIndex:0);
    setFn(next.fn);
    setColumn(next.column);
    setExecutedFn(next.fn);
    setExecutedColumn(next.column);
    setRunning(false);
    setDirty(false);
  }

  function nextScenario(){
    applyScenario((Math.max(0,scenarioIndex)+1)%scenarios.length,true);
  }

  const summaryCards=aggregateFunctions.map(item=>{
    const target=item==="COUNT"?"*":dataset.id==="orders"?"amount":item==="SUM"||item==="MAX"?"total_spend":"age";
    const value=aggregateValue(dataset,item,target);
    return {fn:item,column:target,value:formatAggregateValue(value,item)};
  });

  return <section className="aggregate-simulator" aria-label="Interactive aggregate function simulation">
    <header className="aggregate-header">
      <div className="aggregate-title"><span><Box size={24}/></span><div><h2>Interactive Simulation</h2><p>Choose an aggregate function, run the query, and see how the result is calculated step by step.</p></div></div>
      <div className="aggregate-actions">
        <label><span>Dataset</span><select aria-label="Aggregate dataset" value={datasetId} onChange={event=>changeDataset(event.target.value)}>{aggregateDatasets.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <button type="button" className="aggregate-run" disabled={running} onClick={run}><Play size={15} fill="currentColor"/>{running?"Running…":"Run Query"}</button>
        <button type="button" className="aggregate-reset" onClick={reset}><RotateCcw size={15}/>Reset</button>
        <button type="button" className="aggregate-next" onClick={nextScenario}>Next Scenario <ArrowRight size={15}/></button>
      </div>
    </header>

    <div className="aggregate-grid">
      <section className="aggregate-controls-card">
        <h3><span>1.</span> Select aggregate function</h3><p>Choose a function to see how it works.</p>
        <div className="aggregate-function-row">{aggregateFunctions.map(item=>{
          const Icon=functionIcons[item];
          return <button type="button" key={item} aria-pressed={fn===item} onClick={()=>changeFunction(item)}><Icon size={21}/><strong>{item}</strong></button>;
        })}</div>
        <div className="aggregate-column-block"><h3><span>2.</span> Choose column (if needed)</h3><select aria-label="Aggregate column" value={column} onChange={event=>changeColumn(event.target.value)}>{availableColumns.map(item=><option key={item.key} value={item.key}>{item.label}{item.key!=="*"?" ("+item.sqlType+")":""}</option>)}</select></div>
        <div className="aggregate-hint"><Lightbulb size={16}/><span>COUNT(*) counts all rows, while COUNT(column) counts non-null values.</span></div>
        {dirty&&<small className="aggregate-dirty" role="status">Aggregation changed · Run Query to update the result.</small>}
      </section>

      <section className="aggregate-input-card">
        <div className="aggregate-panel-heading"><h3><Database size={17}/>Input table ({dataset.table})</h3><small>{dataset.rows.length} rows</small></div>
        <DataTable dataset={dataset} highlightColumn={executedColumn==="*"?"":executedColumn}/>
      </section>

      <section className="aggregate-result-card">
        <div className="aggregate-panel-heading"><h3><CheckCircle2 size={18}/>Result</h3></div>
        <p className="aggregate-result-subtitle">Aggregate result for the entire table.</p>
        <div className="aggregate-result-box"><div><span>{executedLabel}</span><span>Result</span></div><div><small>{dataset.rows.length}</small><strong>{resultText}</strong></div></div>
        <div className="aggregate-calc-card"><div className="aggregate-calc-title"><Settings2 size={18}/><div><h3>How it’s calculated</h3><p>Step-by-step for {executedLabel}:</p></div></div><ol>{steps.map((step,index)=><li key={step}><span>{index+1}</span>{step}</li>)}</ol></div>
      </section>

      <section className="aggregate-sql-card">
        <div className="aggregate-sql-title"><Settings2 size={17}/><strong>Generated SQL</strong></div>
        <DarkCodeCard title="SQL" code={query}/>
      </section>

      <section className="aggregate-try-card">
        <div className="aggregate-try-heading"><span><Sparkles size={18}/></span><div><h3>Try different aggregations</h3><p>See how different functions work on the same data.</p></div></div>
        <div className="aggregate-summary-row">{summaryCards.map(card=><button type="button" key={card.fn} onClick={()=>{
          const index=scenarios.findIndex(item=>item.fn===card.fn);
          if(index>=0)applyScenario(index,true);
          else{
            setFn(card.fn);
            setColumn(card.column);
            setExecutedFn(card.fn);
            setExecutedColumn(card.column);
            setScenarioIndex(-1);
            setDirty(false);
          }
        }}><span>{card.fn}({card.column})</span><strong>{card.value}</strong></button>)}</div>
      </section>

      <section className="aggregate-visual-card">
        <div className="aggregate-visual-heading"><Eye size={19}/><div><h3>Visual explanation</h3><p>An aggregate scans all rows and produces a single summary value.</p></div></div>
        <div className="aggregate-flow">
          <div><span className="aggregate-flow-icon"><Database size={23}/></span><strong>{dataset.id==="orders"?"Orders":"Customers"} table</strong><small>{dataset.rows.length} rows</small></div>
          <ArrowRight size={22}/>
          <div><span className="aggregate-flow-icon pink"><Sigma size={22}/></span><strong>{executedLabel}</strong><small>{executedFn==="COUNT"?"Count non-null values":"Summarize values"}</small></div>
          <ArrowRight size={22}/>
          <div><span className="aggregate-flow-icon green"><Database size={23}/></span><strong>Single result</strong><small>{resultText}</small></div>
        </div>
      </section>

      <section className="aggregate-takeaways">
        <h3><Database size={17}/>Key takeaways</h3>
        <ul><li><CheckCircle2 size={14}/>COUNT counts rows (or non-null values).</li><li><CheckCircle2 size={14}/>SUM adds numeric values.</li><li><CheckCircle2 size={14}/>AVG returns the average of numeric values.</li><li><CheckCircle2 size={14}/>MIN / MAX find the smallest or largest value.</li><li><CheckCircle2 size={14}/>Aggregates return a single row.</li></ul>
      </section>
    </div>
  </section>;
}
