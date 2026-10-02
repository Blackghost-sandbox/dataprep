"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  Database,
  Eye,
  Play,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";
import { DarkCodeCard } from "@/components/rdd-dataframe-experience";
import { useCompanion } from "@/components/companion-context";
import {
  distinctDatasets,
  distinctKey,
  distinctQuery,
  distinctRows,
  distinctScenarios,
  duplicateGroupCounts,
  type DistinctDataset,
  type DistinctRow,
} from "@/lib/distinct-lab";

function cellText(value:DistinctRow[string]){
  if(value===null)return <em>NULL</em>;
  if(typeof value==="boolean")return value?"TRUE":"FALSE";
  return String(value);
}

function groupClass(index:number,duplicate=false){
  return `distinct-group distinct-group-${index%5}${duplicate?" distinct-group-duplicate":""}`;
}

export function DistinctLearningLab(){
  const companion=useCompanion();
  const [datasetId,setDatasetId]=useState("customers");
  const dataset=useMemo(()=>distinctDatasets.find(item=>item.id===datasetId)??distinctDatasets[0],[datasetId]);
  const scenarios=useMemo(()=>distinctScenarios(datasetId),[datasetId]);
  const [scenarioIndex,setScenarioIndex]=useState(0);
  const [selected,setSelected]=useState<string[]>(()=>distinctScenarios("customers")[0].columns);
  const [executed,setExecuted]=useState<string[]>(()=>distinctScenarios("customers")[0].columns);
  const [running,setRunning]=useState(false);
  const [dirty,setDirty]=useState(false);
  const [error,setError]=useState("");

  const result=useMemo(()=>distinctRows(dataset,executed),[dataset,executed]);
  const counts=useMemo(()=>duplicateGroupCounts(dataset,executed),[dataset,executed]);
  const uniqueKeys=useMemo(()=>{
    const keys:string[]=[];
    for(const row of dataset.rows){
      const key=distinctKey(row,executed);
      if(!keys.includes(key))keys.push(key);
    }
    return keys;
  },[dataset,executed]);
  const query=distinctQuery(dataset,selected);
  const scenario=scenarioIndex>=0?scenarios[scenarioIndex]:null;

  function applyScenario(index:number){
    const columns=[...scenarios[index].columns];
    setScenarioIndex(index);setSelected(columns);setExecuted(columns);setDirty(false);setError("");setRunning(false);
  }

  function changeDataset(nextId:string){
    const nextScenarios=distinctScenarios(nextId);
    setDatasetId(nextId);setScenarioIndex(0);setSelected([...nextScenarios[0].columns]);setExecuted([...nextScenarios[0].columns]);setDirty(false);setError("");setRunning(false);
  }

  function toggleColumn(column:string){
    setSelected(current=>current.includes(column)?current.filter(item=>item!==column):[...current,column]);
    setScenarioIndex(-1);setDirty(true);setError("");
  }

  function run(){
    if(!selected.length){
      setError("Select at least one column before running DISTINCT.");
      companion?.emit({type:"exercise_error",lesson:"DISTINCT",source:"runner"});
      return;
    }
    setRunning(true);setError("");
    window.setTimeout(()=>{
      setExecuted([...selected]);setDirty(false);setRunning(false);
      companion?.emit({type:"exercise_correct",lesson:"DISTINCT",source:"runner"});
    },180);
  }

  function reset(){
    const index=scenarioIndex>=0?scenarioIndex:0;
    const columns=[...scenarios[index].columns];
    setSelected(columns);setExecuted(columns);setScenarioIndex(index);setDirty(false);setError("");setRunning(false);
  }

  function nextScenario(){
    applyScenario((Math.max(0,scenarioIndex)+1)%scenarios.length);
  }

  return <section className="distinct-simulator" aria-label="Interactive DISTINCT simulation">
    <header className="distinct-header">
      <div className="distinct-title"><span><Box size={24}/></span><div><h2>Interactive Simulation</h2><p>See how DISTINCT removes duplicate combinations based on the selected columns.</p></div></div>
      <div className="distinct-actions">
        <label><span>Dataset</span><select aria-label="DISTINCT dataset" value={datasetId} onChange={event=>changeDataset(event.target.value)}>{distinctDatasets.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <button type="button" className="distinct-run" disabled={running} onClick={run}><Play size={15} fill="currentColor"/>{running?"Running…":"Run Query"}</button>
        <button type="button" className="distinct-reset" onClick={reset}><RotateCcw size={15}/>Reset</button>
        <button type="button" className="distinct-next" onClick={nextScenario}>Next Scenario <ArrowRight size={15}/></button>
      </div>
    </header>

    <div className="distinct-grid">
      <section className="distinct-columns-card">
        <h3><span>1.</span> Select columns</h3><p>Choose the columns to apply DISTINCT on.</p>
        <div className="distinct-column-list">{dataset.columns.map(column=><label key={column.key} className={selected.includes(column.key)?"selected":""}><input type="checkbox" checked={selected.includes(column.key)} onChange={()=>toggleColumn(column.key)}/><strong>{column.label}</strong><small>{column.type}</small></label>)}</div>
        {dirty&&<small className="distinct-dirty" role="status">Selection changed · Run Query to update the result.</small>}
        {error&&<p className="distinct-error" role="alert">{error}</p>}
      </section>

      <section className="distinct-original-card">
        <div className="distinct-panel-heading"><h3><Database size={16}/><span>2.</span> Original data (with duplicates)</h3><small>{dataset.rows.length} rows</small></div>
        <div className="distinct-table-wrap" tabIndex={0} role="region" aria-label="Original data with duplicates"><table><thead><tr>{dataset.displayColumns.map(column=><th key={column}>{column}</th>)}</tr></thead><tbody>{dataset.rows.map((row,rowIndex)=>{
          const key=distinctKey(row,executed),index=Math.max(0,uniqueKeys.indexOf(key)),duplicate=(counts.get(key)??0)>1;
          return <tr key={String(row.id??rowIndex)}>{dataset.displayColumns.map(column=><td key={column} className={executed.includes(column)?groupClass(index,duplicate):undefined}>{cellText(row[column])}</td>)}</tr>;
        })}</tbody></table></div>
        <span className="distinct-arrow" aria-hidden="true"><ArrowRight size={18}/></span>
      </section>

      <section className="distinct-result-card">
        <div className="distinct-panel-heading"><h3><CheckCircle2 size={18}/><span>3.</span> Result after DISTINCT</h3></div>
        <p className="distinct-result-summary">{running?"Calculating unique combinations…":`${result.length} unique rows returned (from ${dataset.rows.length} original rows)`}</p>
        <div className="distinct-table-wrap distinct-result-table" tabIndex={0} role="region" aria-label="DISTINCT result"><table><thead><tr><th aria-label="Row number"></th>{executed.map(column=><th key={column}>{column}</th>)}</tr></thead><tbody>{result.map((row,rowIndex)=>{
          const key=distinctKey(row,executed),index=Math.max(0,uniqueKeys.indexOf(key));
          return <tr key={key}><td>{rowIndex+1}</td>{executed.map(column=><td key={column} className={groupClass(index)}>{cellText(row[column])}</td>)}</tr>;
        })}</tbody></table></div>
      </section>

      <section className="distinct-sql-card"><DarkCodeCard title="4. Generated SQL" code={query}/></section>

      <section className="distinct-visual-card">
        <div className="distinct-visual-heading"><Eye size={19}/><div><h3>Visual explanation</h3><p>DISTINCT removes duplicate combinations of the selected columns.</p></div></div>
        <div className="distinct-flow">
          <div><span className="distinct-mini-rows pink"><i/><i/><i/><i/><i/><i/></span><strong>Input rows</strong><small>{dataset.rows.length} rows</small></div>
          <ArrowRight size={20}/>
          <div><span className="distinct-mini-rows purple"><i/><i/><i/><i/></span><strong>DISTINCT</strong><small>{executed.join(", ")||"choose columns"}</small></div>
          <ArrowRight size={20}/>
          <div><span className="distinct-mini-rows green"><i/><i/><i/></span><strong>Unique rows</strong><small>{result.length} rows</small></div>
        </div>
      </section>
    </div>

    <div className="distinct-bottom">
      <section className="distinct-scenarios">
        <div className="distinct-scenario-title"><span><Target size={20}/></span><strong>Try different scenarios</strong></div>
        <div className="distinct-scenario-buttons">{scenarios.map((item,index)=><button type="button" key={item.id} aria-pressed={scenarioIndex===index} onClick={()=>applyScenario(index)}>{item.label}</button>)}</div>
        <p>{scenario?.description??"Choose columns above, run the query, and compare how the unique result changes."}</p>
      </section>
      <section className="distinct-takeaways">
        <h3><Sparkles size={17}/>Key takeaways</h3>
        <ul><li><CheckCircle2 size={14}/>DISTINCT removes duplicate combinations of the selected columns.</li><li><CheckCircle2 size={14}/>It does not remove duplicates from one column only unless that is the only selected column.</li><li><CheckCircle2 size={14}/>NULL values are also considered in DISTINCT results.</li><li><CheckCircle2 size={14}/>The original data is not modified.</li></ul>
      </section>
    </div>
  </section>;
}
