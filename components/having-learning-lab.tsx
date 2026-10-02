"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Box,
  CheckCircle2,
  Database,
  Filter,
  Hash,
  Lightbulb,
  Play,
  RotateCcw,
  Sigma,
  Sparkles,
  Star,
  Table2,
  UserRound,
} from "lucide-react";
import { DarkCodeCard } from "@/components/rdd-dataframe-experience";
import { useCompanion } from "@/components/companion-context";
import {
  filteredHavingGroups,
  formatHavingValue,
  groupForHaving,
  havingAggregateExpression,
  havingDatasets,
  havingQuery,
  havingResultAlias,
  havingScenarios,
  matchesHaving,
  type HavingAggregate,
  type HavingDataset,
  type HavingOperator,
  type HavingRow,
  type HavingScenario,
} from "@/lib/having-lab";

function cellText(value:HavingRow[string]){
  if(value===null)return <em>NULL</em>;
  return String(value);
}

function amountClass(value:HavingRow[string]){
  const numeric=Number(value);
  if(!Number.isFinite(numeric))return "";
  if(numeric<250)return "having-value-low";
  if(numeric<500)return "having-value-mid";
  if(numeric<750)return "having-value-high";
  return "having-value-max";
}

function failText(operator:HavingOperator,threshold:number){
  if(operator===">")return `≤ ${threshold}`;
  if(operator===">=")return `< ${threshold}`;
  if(operator==="<")return `≥ ${threshold}`;
  if(operator==="<=")return `> ${threshold}`;
  return `≠ ${threshold}`;
}

function SourceTable({dataset,highlightColumn}:{dataset:HavingDataset;highlightColumn:string}){
  return <div className="having-table-wrap" tabIndex={0} role="region" aria-label={"Input table "+dataset.table}>
    <table>
      <thead><tr>{dataset.displayColumns.map(column=><th key={column}>{column}</th>)}</tr></thead>
      <tbody>{dataset.rows.map((row,index)=><tr key={String(row.id??index)}>{dataset.displayColumns.map(column=><td key={column} className={column===highlightColumn&&typeof row[column]==="number"?amountClass(row[column]):""}>{cellText(row[column])}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}

function aggregateChoices(dataset:HavingDataset){
  const amountColumn=dataset.id==="orders"?"amount":"total_spend";
  const avgColumn=dataset.id==="orders"?"amount":"age";
  return [
    {fn:"SUM" as const,column:amountColumn,label:`SUM(${amountColumn})`},
    {fn:"COUNT" as const,column:"*" as const,label:"COUNT(*)"},
    {fn:"AVG" as const,column:avgColumn,label:`AVG(${avgColumn})`},
  ];
}

export function HavingLearningLab(){
  const companion=useCompanion();
  const [datasetId,setDatasetId]=useState("orders");
  const dataset=useMemo(()=>havingDatasets.find(item=>item.id===datasetId)??havingDatasets[0],[datasetId]);
  const scenarios=useMemo(()=>havingScenarios(datasetId),[datasetId]);
  const [scenarioIndex,setScenarioIndex]=useState(0);
  const [draft,setDraft]=useState<HavingScenario>(()=>havingScenarios("orders")[0]);
  const [executed,setExecuted]=useState<HavingScenario>(()=>havingScenarios("orders")[0]);
  const [running,setRunning]=useState(false);
  const [dirty,setDirty]=useState(false);

  const groups=useMemo(()=>groupForHaving(dataset,executed),[dataset,executed]);
  const passed=useMemo(()=>filteredHavingGroups(dataset,executed),[dataset,executed]);
  const failed=useMemo(()=>groups.filter(group=>!matchesHaving(group.aggregate,executed.operator,executed.threshold)),[groups,executed]);
  const query=havingQuery(dataset,draft);
  const alias=havingResultAlias(dataset,executed);
  const aggregateExpression=havingAggregateExpression(executed);
  const aggChoices=aggregateChoices(dataset);

  function applyScenario(index:number,execute=true){
    const next={...scenarios[index]};
    setScenarioIndex(index);
    setDraft(next);
    setDirty(!execute);
    if(execute)setExecuted(next);
  }

  function changeDataset(nextId:string){
    const next=havingScenarios(nextId)[0];
    setDatasetId(nextId);
    setScenarioIndex(0);
    setDraft({...next});
    setExecuted({...next});
    setDirty(false);
    setRunning(false);
  }

  function updateDraft(patch:Partial<HavingScenario>){
    setDraft(current=>({...current,...patch,id:"custom",label:"Custom"}));
    setScenarioIndex(-1);
    setDirty(true);
  }

  function changeAggregate(value:string){
    const choice=aggChoices.find(item=>item.label===value)??aggChoices[0];
    updateDraft({aggregate:choice.fn,aggregateColumn:choice.column});
  }

  function run(){
    setRunning(true);
    companion?.emit({type:"exercise_started",lesson:"HAVING",source:"runner"});
    window.setTimeout(()=>{
      setExecuted({...draft});
      setDirty(false);
      setRunning(false);
      companion?.emit({type:"exercise_correct",lesson:"HAVING",source:"runner"});
    },180);
  }

  function reset(){
    const next=scenarios[scenarioIndex>=0?scenarioIndex:0];
    setScenarioIndex(scenarioIndex>=0?scenarioIndex:0);
    setDraft({...next});
    setExecuted({...next});
    setDirty(false);
    setRunning(false);
  }

  function nextScenario(){
    const nextIndex=(Math.max(0,scenarioIndex)+1)%scenarios.length;
    applyScenario(nextIndex,true);
  }

  const groupColumns=dataset.columns.filter(column=>column.key!=="id"&&column.type!=="date");

  return <section className="having-simulator" aria-label="Interactive HAVING simulation">
    <header className="having-header">
      <div className="having-title"><span><Box size={24}/></span><div><h2>Interactive Simulation</h2><p>See how GROUP BY creates groups and how HAVING filters those groups using aggregate conditions.</p></div></div>
      <div className="having-actions">
        <label><span>Dataset</span><select aria-label="HAVING dataset" value={datasetId} onChange={event=>changeDataset(event.target.value)}>{havingDatasets.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <button type="button" className="having-run" disabled={running} onClick={run}><Play size={15} fill="currentColor"/>{running?"Running…":"Run Query"}</button>
        <button type="button" className="having-reset" onClick={reset}><RotateCcw size={15}/>Reset</button>
        <button type="button" className="having-next" onClick={nextScenario}>Next Scenario <ArrowRight size={15}/></button>
      </div>
    </header>

    <div className="having-scenario-row">
      <strong>Try a scenario:</strong>
      {scenarios.map((scenario,index)=>{
        const Icon=index===0?Sparkles:index===1?UserRound:index===2?BarChart3:Star;
        return <button key={scenario.id} type="button" aria-pressed={scenarioIndex===index} onClick={()=>applyScenario(index,true)}><Icon size={15}/>{scenario.label}</button>;
      })}
    </div>

    <section className="having-builder">
      <label><span><b>1.</b> Group by column</span><div><Table2 size={17}/><select value={draft.groupBy} onChange={event=>updateDraft({groupBy:event.target.value})}>{groupColumns.map(column=><option key={column.key} value={column.key}>{column.label}</option>)}</select></div></label>
      <label><span><b>2.</b> Aggregate function</span><div><Sigma size={17}/><select value={`${draft.aggregate}(${draft.aggregateColumn})`} onChange={event=>changeAggregate(event.target.value)}>{aggChoices.map(choice=><option key={choice.label} value={choice.label}>{choice.label}</option>)}</select></div></label>
      <label><span><b>3.</b> Condition</span><div><Filter size={17}/><select value={draft.operator} onChange={event=>updateDraft({operator:event.target.value as HavingOperator})}>{[">",">=","<","<=","="].map(operator=><option key={operator}>{operator}</option>)}</select></div></label>
      <label><span><b>4.</b> Threshold value</span><div><Hash size={17}/><input type="number" value={draft.threshold} onChange={event=>updateDraft({threshold:Number(event.target.value)})}/></div></label>
    </section>
    {dirty&&<div className="having-dirty" role="status">Condition changed · Run Query to update the grouped and filtered results.</div>}

    <div className="having-main-grid">
      <section className="having-input-card">
        <div className="having-panel-heading"><h3><Table2 size={17}/><span>1.</span> Input table ({dataset.table})</h3><small>{dataset.rows.length} rows</small></div>
        <SourceTable dataset={dataset} highlightColumn={executed.aggregateColumn==="*"?"":executed.aggregateColumn}/>
        <span className="having-transfer-arrow first" aria-hidden="true"><ArrowRight size={18}/></span>
      </section>

      <section className="having-summary-card">
        <div className="having-panel-heading"><h3><Table2 size={17}/><span>2.</span> After GROUP BY (summary)</h3></div>
        <div className="having-summary-table"><table><thead><tr><th>{executed.groupBy}</th><th>{alias}</th><th>{dataset.id==="orders"?"order_count":"row_count"}</th></tr></thead><tbody>{groups.map(group=><tr key={String(group.key)}><td>{String(group.key)}</td><td className={matchesHaving(group.aggregate,executed.operator,executed.threshold)?"having-pass-value":"having-fail-value"}>{formatHavingValue(group.aggregate,executed.aggregate)}</td><td>{group.count}</td></tr>)}</tbody></table></div>
        <div className="having-filtered-out"><strong><Filter size={14}/>Groups filtered out by HAVING</strong>{failed.map(group=><div key={String(group.key)}><span>{String(group.key)}</span><b>{formatHavingValue(group.aggregate,executed.aggregate)} ({failText(executed.operator,executed.threshold)})</b></div>)}</div>
        <span className="having-transfer-arrow second" aria-hidden="true"><ArrowRight size={18}/></span>
      </section>

      <section className="having-result-card">
        <div className="having-panel-heading"><h3><Filter size={17}/><span>3.</span> After HAVING (filtered groups)</h3><small>{passed.length} {passed.length===1?"group":"groups"}</small></div>
        <div className="having-result-table"><table><thead><tr><th>{executed.groupBy}</th><th>{alias}</th><th>{dataset.id==="orders"?"order_count":"row_count"}</th></tr></thead><tbody>{passed.map(group=><tr key={String(group.key)}><td>{String(group.key)}</td><td>{formatHavingValue(group.aggregate,executed.aggregate)}</td><td>{group.count}</td></tr>)}</tbody></table></div>
        {!passed.length&&<div className="having-empty"><Filter size={24}/><strong>No groups match</strong><span>Try a different threshold or operator.</span></div>}
      </section>
    </div>

    <div className="having-bottom-grid">
      <section className="having-sql-card">
        <div className="having-sql-title"><Database size={17}/><strong>Generated SQL</strong></div>
        <DarkCodeCard title="SQL" code={query}/>
      </section>

      <section className="having-visual-card">
        <div className="having-visual-heading"><span><Sparkles size={18}/></span><h3>Visual explanation</h3></div>
        <div className="having-flow">
          <div><span><Table2 size={22}/></span><strong>1. Group</strong><b>GROUP BY {executed.groupBy}</b><small>Creates one group per {executed.groupBy}</small></div>
          <ArrowRight size={21}/>
          <div><span className="orange"><Sigma size={22}/></span><strong>2. Compute</strong><b>{aggregateExpression}</b><small>Calculates the aggregate for each group</small></div>
          <ArrowRight size={21}/>
          <div><span className="green"><Filter size={22}/></span><strong>3. Filter</strong><b>HAVING {aggregateExpression} {executed.operator} {executed.threshold}</b><small>Keeps only groups that match condition</small></div>
        </div>
      </section>

      <section className="having-where-card">
        <div className="having-where-heading"><Lightbulb size={17}/><strong>WHERE vs HAVING</strong></div>
        <div className="having-compare-line"><span>WHERE</span><ul><li>Filters individual rows</li><li>Applied before GROUP BY</li><li>Used for non-aggregate conditions</li></ul></div>
        <code>WHERE amount &gt; 1000</code>
        <div className="having-compare-line purple"><span>HAVING</span><ul><li>Filters groups (aggregated results)</li><li>Applied after GROUP BY</li><li>Used for aggregate conditions</li></ul></div>
        <code className="purple-code">HAVING SUM(amount) &gt; 1000</code>
      </section>
    </div>
  </section>;
}
