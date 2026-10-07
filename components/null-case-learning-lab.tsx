"use client";
import {CodeEditor} from "@/components/syntax-editor";

import { useMemo, useState } from "react";
import { CheckCircle2, Copy, Database, Lightbulb, Play, RotateCcw, Sparkles, TriangleAlert } from "lucide-react";
import {
  evaluateNullCaseQuery,
  nullCaseRows,
  nullCaseScenarios,
  type NullCaseCell,
  type NullCaseResult,
  type NullCaseScenarioId,
} from "@/lib/null-case-lab";

type RunState="ready"|"running"|"success"|"error";

function Value({value}:{value:NullCaseCell}){
  if(value===null)return <span className="null-chip">NULL</span>;
  return <>{value}</>;
}

function SourceTable(){
  return <div className="null-table-wrap"><table>
    <caption><Database size={14}/> customers <span>({nullCaseRows.length} rows)</span></caption>
    <thead><tr><th>id</th><th>name</th><th>city</th><th>signup_date</th></tr></thead>
    <tbody>{nullCaseRows.map(row=><tr key={row.id}><td>{row.id}</td><th scope="row">{row.name}</th><td><Value value={row.city}/></td><td><Value value={row.signup_date}/></td></tr>)}</tbody>
  </table></div>;
}

function ResultTable({result}:{result:NullCaseResult}){
  if(result.error)return <div className="null-error" role="alert"><TriangleAlert size={20}/><div><strong>Query error</strong><p>{result.error}</p></div></div>;
  return <div className="null-table-wrap null-result-table"><table>
    <caption><CheckCircle2 size={14}/> Result <span>({result.rows.length} {result.rows.length===1?"row":"rows"})</span></caption>
    <thead><tr>{result.columns.map(column=><th key={column}>{column}</th>)}</tr></thead>
    <tbody>{result.rows.map((row,rowIndex)=><tr key={rowIndex}>{row.map((value,index)=><td key={result.columns[index]} className={index===result.columns.length-1?"null-derived":undefined}><Value value={value}/></td>)}</tr>)}</tbody>
  </table></div>;
}

export function NullCaseLearningLab(){
  const initial=nullCaseScenarios[0];
  const [scenarioId,setScenarioId]=useState<NullCaseScenarioId>(initial.id);
  const [query,setQuery]=useState(initial.query);
  const [result,setResult]=useState<NullCaseResult>(()=>evaluateNullCaseQuery(initial.query));
  const [runState,setRunState]=useState<RunState>("ready");
  const [copied,setCopied]=useState(false);
  const scenario=useMemo(()=>nullCaseScenarios.find(item=>item.id===scenarioId)||initial,[scenarioId,initial]);

  function chooseScenario(id:NullCaseScenarioId){
    const next=nullCaseScenarios.find(item=>item.id===id)||initial;
    setScenarioId(next.id);
    setQuery(next.query);
    setResult(evaluateNullCaseQuery(next.query));
    setRunState("ready");
  }

  function run(){
    setRunState("running");
    const next=evaluateNullCaseQuery(query);
    setResult(next);
    setRunState(next.error?"error":"success");
  }

  function reset(){chooseScenario(scenarioId);}

  async function copy(){
    try{
      await navigator.clipboard.writeText(query);
      setCopied(true);
      window.setTimeout(()=>setCopied(false),1200);
    }catch{setCopied(false);}
  }

  return <div className="null-case-lab">
    <section className="null-sim-card">
      <header className="null-sim-header">
        <div className="null-sim-title"><span><Database size={20}/></span><div><h2>Interactive Simulation</h2><p>Explore how NULL and CASE WHEN work. Modify the query and run it to see the results.</p></div></div>
        <div className="null-sim-actions">
          <label className="null-dataset">Dataset <select aria-label="Dataset"><option>Customers ({nullCaseRows.length} rows)</option></select></label>
          <button type="button" onClick={reset}><RotateCcw size={15}/> Reset</button>
          <button type="button" className="null-run" onClick={run} disabled={runState==="running"}><Play size={15} fill="currentColor"/> {runState==="running"?"Running…":"Run Query"}</button>
        </div>
      </header>

      <div className="null-stage-head">
        <div><span>1.</span><strong>Input data</strong><small>Explore the source table with NULL values.</small></div>
        <div><span>2.</span><strong>Write and run your query</strong><small>Use IS NULL and CASE WHEN to handle missing values.</small></div>
        <div><span>3.</span><strong>Query result</strong><small>See how NULL and CASE WHEN change the output.</small></div>
      </div>

      <div className="null-workspace">
        <section className="null-source"><SourceTable/></section>
        <section className="null-editor-panel">
          <div className="null-code-shell">
            <div className="null-code-bar"><span><Sparkles size={14}/> SQL Editor</span><button type="button" onClick={copy}><Copy size={14}/>{copied?"Copied":"Copy"}</button></div>
            <CodeEditor aria-label="NULL and CASE WHEN SQL editor" spellCheck={false} value={query} onChange={event=>{setQuery(event.target.value);setRunState("ready");}}/>
          </div>
          <div className="null-scenario-label">Try different queries</div>
          <div className="null-scenarios">{nullCaseScenarios.map(item=><button type="button" key={item.id} aria-pressed={scenarioId===item.id} onClick={()=>chooseScenario(item.id)}>{item.label}</button>)}</div>
          <p className="null-scenario-help">{scenario.description}</p>
        </section>
        <section className="null-result"><ResultTable result={result}/><div className={"null-status null-status-"+runState} aria-live="polite">{runState==="ready"&&"Ready · edit the query or choose a scenario, then run."}{runState==="running"&&"Evaluating CASE conditions…"}{runState==="success"&&result.explanation}{runState==="error"&&result.explanation}</div></section>
      </div>

      <div className="null-bottom-grid">
        <section className="null-how">
          <h3><Sparkles size={17}/> How it works</h3>
          <div className="null-how-flow">
            <article className="null-how-blue"><strong>Check for NULL</strong><code>city IS NULL</code></article><span>→</span>
            <article className="null-how-orange"><strong>Apply condition</strong><code>CASE WHEN ...<br/>THEN ... ELSE ...</code></article><span>→</span>
            <article className="null-how-purple"><strong>Add a label</strong><small>Replace NULL with a meaningful value</small></article>
          </div>
          <p><Lightbulb size={15}/> Try changing the THEN label or replacing <code>city</code> with <code>signup_date</code>.</p>
        </section>
        <section className="null-patterns">
          <h3><Lightbulb size={17}/> Common patterns</h3>
          <div className="null-pattern-grid">
            <article><strong>Label missing values</strong><code>CASE<br/>WHEN city IS NULL THEN 'Unknown'<br/>ELSE city<br/>END</code></article>
            <article><strong>Multiple conditions</strong><code>CASE<br/>WHEN city IS NULL THEN 'Missing'<br/>WHEN signup_date IS NULL THEN 'Pending'<br/>ELSE 'Complete'<br/>END</code></article>
            <article><strong>Count NULLs</strong><code>SUM(CASE WHEN city IS NULL<br/>THEN 1 ELSE 0 END)</code></article>
          </div>
        </section>
      </div>
    </section>
  </div>;
}
