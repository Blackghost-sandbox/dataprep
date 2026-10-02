"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Box,
  CheckCircle2,
  Database,
  FileText,
  Lightbulb,
  Play,
  RotateCcw,
  Settings2,
  Sparkles,
  Table2,
  UserRound,
} from "lucide-react";
import { DarkCodeCard } from "@/components/rdd-dataframe-experience";
import { useCompanion } from "@/components/companion-context";
import {
  formatGroupValue,
  groupAggregateAlias,
  groupDatasets,
  groupQuery,
  groupRows,
  groupScenarios,
  type GroupDataset,
  type GroupResult,
  type GroupRow,
  type GroupScenario,
} from "@/lib/group-by-lab";

function cellText(value:GroupRow[string]){
  if(value===null)return <em>NULL</em>;
  return String(value);
}

function amountClass(value:GroupRow[string]){
  const numeric=Number(value);
  if(!Number.isFinite(numeric))return "";
  if(numeric<300)return "group-value-low";
  if(numeric<500)return "group-value-mid";
  if(numeric<750)return "group-value-high";
  return "group-value-max";
}

function sourceGroupIndex(groups:GroupResult[],scenario:GroupScenario,row:GroupRow){
  return Math.max(0,groups.findIndex(group=>group.key===row[scenario.groupBy]));
}

function SourceTable({dataset,groups,scenario}:{dataset:GroupDataset;groups:GroupResult[];scenario:GroupScenario}){
  return <div className="group-table-wrap" tabIndex={0} role="region" aria-label={"Source data "+dataset.table}>
    <table>
      <thead><tr>{dataset.displayColumns.map(column=><th key={column}>{column}</th>)}</tr></thead>
      <tbody>{dataset.rows.map((row,index)=>{
        const groupIndex=sourceGroupIndex(groups,scenario,row);
        return <tr key={String(row.id??index)}>{dataset.displayColumns.map(column=><td key={column} className={column===scenario.groupBy?"group-key-cell group-band-"+groupIndex:column===scenario.aggregateColumn&&typeof row[column]==="number"?amountClass(row[column]):""}>{cellText(row[column])}</td>)}</tr>;
      })}</tbody>
    </table>
  </div>;
}

function groupLabel(group:GroupResult){
  return group.key===null?"NULL":String(group.key);
}

export function GroupByLearningLab(){
  const companion=useCompanion();
  const [datasetId,setDatasetId]=useState("orders");
  const dataset=useMemo(()=>groupDatasets.find(item=>item.id===datasetId)??groupDatasets[0],[datasetId]);
  const scenarios=useMemo(()=>groupScenarios(datasetId),[datasetId]);
  const [scenarioIndex,setScenarioIndex]=useState(0);
  const [executedScenario,setExecutedScenario]=useState<GroupScenario>(()=>groupScenarios("orders")[0]);
  const [running,setRunning]=useState(false);
  const [dirty,setDirty]=useState(false);

  const draftScenario=scenarioIndex>=0?scenarios[scenarioIndex]:executedScenario;
  const groups=useMemo(()=>groupRows(dataset,executedScenario),[dataset,executedScenario]);
  const query=groupQuery(dataset,draftScenario);
  const alias=groupAggregateAlias(executedScenario);

  function selectScenario(index:number,execute=false){
    const next=scenarios[index];
    setScenarioIndex(index);
    setDirty(!execute);
    if(execute)setExecutedScenario(next);
  }

  function changeDataset(nextId:string){
    const next=groupScenarios(nextId)[0];
    setDatasetId(nextId);
    setScenarioIndex(0);
    setExecutedScenario(next);
    setRunning(false);
    setDirty(false);
  }

  function run(){
    const next=scenarios[Math.max(0,scenarioIndex)];
    setRunning(true);
    companion?.emit({type:"exercise_started",lesson:"GROUP BY",source:"runner"});
    window.setTimeout(()=>{
      setExecutedScenario(next);
      setDirty(false);
      setRunning(false);
      companion?.emit({type:"exercise_correct",lesson:"GROUP BY",source:"runner"});
    },180);
  }

  function reset(){
    setScenarioIndex(0);
    setExecutedScenario(scenarios[0]);
    setRunning(false);
    setDirty(false);
  }

  function nextScenario(){
    const nextIndex=(Math.max(0,scenarioIndex)+1)%scenarios.length;
    setScenarioIndex(nextIndex);
    setExecutedScenario(scenarios[nextIndex]);
    setDirty(false);
  }

  return <section className="group-simulator" aria-label="Interactive GROUP BY simulation">
    <header className="group-header">
      <div className="group-title"><span><Box size={24}/></span><div><h2>Interactive Simulation</h2><p>See how GROUP BY collects rows into groups and applies an aggregate function to each group.</p></div></div>
      <div className="group-actions">
        <label><span>Dataset</span><select aria-label="GROUP BY dataset" value={datasetId} onChange={event=>changeDataset(event.target.value)}>{groupDatasets.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <button type="button" className="group-run" disabled={running} onClick={run}><Play size={15} fill="currentColor"/>{running?"Running…":"Run Query"}</button>
        <button type="button" className="group-reset" onClick={reset}><RotateCcw size={15}/>Reset</button>
        <button type="button" className="group-next" onClick={nextScenario}>Next Scenario <ArrowRight size={15}/></button>
      </div>
    </header>

    <div className="group-scenario-row" role="group" aria-label="GROUP BY scenarios">
      {scenarios.map((scenario,index)=>{
        const Icon=index===0?BarChart3:index===1?UserRound:index===2?FileText:Sparkles;
        return <button type="button" key={scenario.id} aria-pressed={scenarioIndex===index} onClick={()=>selectScenario(index,false)}><Icon size={16}/><span>{scenario.label}</span></button>;
      })}
    </div>
    {dirty&&<div className="group-dirty" role="status">Scenario selected · Run Query to update the grouping.</div>}

    <div className="group-main-grid">
      <section className="group-source-card">
        <div className="group-panel-heading"><h3><Table2 size={17}/><span>1.</span> Source Data ({dataset.table})</h3><small>{dataset.rows.length} rows</small></div>
        <SourceTable dataset={dataset} groups={groups} scenario={executedScenario}/>
      </section>

      <section className="group-buckets-card">
        <div className="group-panel-heading"><h3><Settings2 size={18}/><span>2.</span> Grouping (by {executedScenario.groupBy})</h3></div>
        <p className="group-panel-copy">Rows with the same {executedScenario.groupBy} are collected together into groups.</p>
        <div className="group-bucket-list">{groups.map((group,index)=><div key={String(group.key)} className={"group-bucket group-band-"+index}>
          <div><strong>{groupLabel(group)}</strong><span>({group.count} {group.count===1?"row":"rows"})</span>{executedScenario.aggregateColumn!=="*"&&<small>{group.sourceRows.map(row=>String(row[executedScenario.aggregateColumn])).join(", ")}</small>}</div>
          <div className="group-row-chips">{group.rowIds.map(id=><span key={id}>#{id}</span>)}</div>
          <ArrowRight size={19}/>
        </div>)}</div>
      </section>

      <section className="group-result-card">
        <div className="group-panel-heading"><h3><CheckCircle2 size={18}/><span>3.</span> Grouped Result ({executedScenario.aggregate} {executedScenario.aggregateColumn})</h3></div>
        <div className="group-result-table"><table><thead><tr><th>{executedScenario.groupBy}</th><th>{alias}</th>{executedScenario.includeCount&&<th>order_count</th>}</tr></thead><tbody>{groups.map((group,index)=><tr key={String(group.key)}><td className={"group-result-key group-band-"+index}>{groupLabel(group)}</td><td className={"group-result-value group-band-"+index}>{formatGroupValue(group.aggregate,executedScenario.aggregate)}</td>{executedScenario.includeCount&&<td>{group.count}</td>}</tr>)}</tbody></table></div>
      </section>
    </div>

    <div className="group-bottom-grid">
      <section className="group-sql-card">
        <div className="group-sql-title"><Settings2 size={17}/><strong>Generated SQL</strong></div>
        <DarkCodeCard title="SQL" code={query}/>
      </section>

      <section className="group-how-card">
        <div className="group-how-heading"><Settings2 size={19}/><strong>How it works</strong></div>
        <div className="group-how-flow">
          <div><span><Table2 size={22}/></span><strong>1. Input rows</strong><small>(from {dataset.table})</small></div>
          <ArrowRight size={20}/>
          <div><span><Settings2 size={22}/></span><strong>2. Rows are</strong><small>bucketed by {executedScenario.groupBy}</small></div>
          <ArrowRight size={20}/>
          <div><span><BarChart3 size={22}/></span><strong>3. Apply {executedScenario.aggregate}</strong><small>to each group</small></div>
          <ArrowRight size={20}/>
          <div><span><Table2 size={22}/></span><strong>4. One summary</strong><small>row per group</small></div>
        </div>
      </section>

      <section className="group-changed-card">
        <div className="group-changed-heading"><Lightbulb size={19}/><strong>What changed?</strong></div>
        <p>Instead of one result for the whole table, GROUP BY creates a separate result for each unique value in the selected column and applies the aggregate function to rows in that group.</p>
      </section>

      <section className="group-takeaways">
        <h3><Database size={17}/>Key takeaways</h3>
        <ul><li><CheckCircle2 size={14}/>GROUP BY groups rows with the same values in one or more columns.</li><li><CheckCircle2 size={14}/>You can use COUNT, SUM, AVG, MIN, MAX on each group.</li><li><CheckCircle2 size={14}/>The result has one row per group.</li><li><CheckCircle2 size={14}/>You can group by multiple columns.</li></ul>
      </section>
    </div>
  </section>;
}
