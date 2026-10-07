"use client";
import {CodeEditor} from "@/components/syntax-editor";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Database,
  Filter,
  Group,
  Layers3,
  Lightbulb,
  ListFilter,
  ListOrdered,
  Play,
  RotateCcw,
  Rows3,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import {
  evaluateQueryExecution,
  executionCustomers,
  executionOrders,
  queryExecutionVariations,
  type QueryCell,
  type QueryExecutionResult,
  type QueryStageId,
  type QueryTable,
  type QueryVariationId,
} from "@/lib/query-execution-lab";

type RunState="ready"|"running"|"success"|"error";
type SourceTab="orders"|"customers";

const stageMeta = {
  from:{Icon:Database,tone:"blue"},
  where:{Icon:Filter,tone:"orange"},
  group:{Icon:Group,tone:"green"},
  having:{Icon:ListFilter,tone:"pink"},
  select:{Icon:Layers3,tone:"purple"},
  order:{Icon:ListOrdered,tone:"amber"},
  limit:{Icon:Rows3,tone:"cyan"},
} as const;

function Value({value}:{value:QueryCell}){return value===null?<em>NULL</em>:<>{value}</>;}

function DataTable({table,caption}:{table:QueryTable;caption?:string}){
  return <div className="qe-table-wrap"><table>
    {caption&&<caption>{caption}</caption>}
    <thead><tr>{table.columns.map(column=><th key={column}>{column}</th>)}</tr></thead>
    <tbody>{table.rows.map((row,rowIndex)=><tr key={rowIndex}>{row.map((value,index)=><td key={table.columns[index]}><Value value={value}/></td>)}</tr>)}</tbody>
  </table></div>;
}

export function QueryExecutionLearningLab(){
  const initial=queryExecutionVariations[0];
  const initialResult=evaluateQueryExecution(initial.query);
  const [variationId,setVariationId]=useState<QueryVariationId>(initial.id);
  const [query,setQuery]=useState(initial.query);
  const [result,setResult]=useState<QueryExecutionResult>(initialResult);
  const [runState,setRunState]=useState<RunState>("ready");
  const [activeStage,setActiveStage]=useState<QueryStageId>("limit");
  const [stepMode,setStepMode]=useState(false);
  const [sourceTab,setSourceTab]=useState<SourceTab>("orders");
  const [copied,setCopied]=useState(false);
  const [elapsed,setElapsed]=useState<number|null>(null);

  const variation=useMemo(()=>queryExecutionVariations.find(item=>item.id===variationId)||initial,[variationId,initial]);
  const stage=result.stages.find(item=>item.id===activeStage)||result.stages[result.stages.length-1];

  const orderTable:QueryTable={columns:["id","customer_id","order_date","amount"],rows:executionOrders.map(row=>[row.id,row.customer_id,row.order_date,row.amount])};
  const customerTable:QueryTable={columns:["customer_id","name","segment"],rows:executionCustomers.map(row=>[row.customer_id,row.name,row.segment])};

  function chooseVariation(id:QueryVariationId){
    const next=queryExecutionVariations.find(item=>item.id===id)||initial;
    const nextResult=evaluateQueryExecution(next.query);
    setVariationId(next.id);setQuery(next.query);setResult(nextResult);setRunState("ready");setStepMode(false);setActiveStage(nextResult.stages.at(-1)?.id||"from");setElapsed(null);
  }

  function run(){
    setRunState("running");
    const start=performance.now();
    const next=evaluateQueryExecution(query);
    const duration=performance.now()-start;
    setResult(next);setElapsed(duration);setRunState(next.error?"error":"success");setStepMode(false);setActiveStage(next.stages.at(-1)?.id||"from");
  }

  function reset(){chooseVariation(variationId);}

  function stepThrough(){
    const next=evaluateQueryExecution(query);
    if(next.error){setResult(next);setRunState("error");setStepMode(false);return;}
    setResult(next);setRunState("success");
    const ids=next.stages.map(item=>item.id);
    if(!stepMode){setStepMode(true);setActiveStage(ids[0]);return;}
    const current=Math.max(0,ids.indexOf(activeStage));
    setActiveStage(ids[(current+1)%ids.length]);
  }

  async function copy(){
    try{await navigator.clipboard.writeText(query);setCopied(true);window.setTimeout(()=>setCopied(false),1200);}catch{setCopied(false);}
  }

  return <div className="qe-lab">
    <section className="qe-card">
      <header className="qe-header">
        <div className="qe-title"><span><Database size={21}/></span><div><h2>Interactive Query Simulation</h2><p>Run a query and see how each clause is executed step by step. Observe how the result changes after each stage.</p></div></div>
        <div className="qe-actions">
          <label>Dataset<select aria-label="Dataset" value={sourceTab} onChange={event=>setSourceTab(event.target.value as SourceTab)}><option value="orders">Orders ({executionOrders.length} rows)</option><option value="customers">Customers ({executionCustomers.length} rows)</option></select></label>
          <button type="button" onClick={reset}><RotateCcw size={15}/> Reset</button>
          <button className="qe-run" type="button" onClick={run} disabled={runState==="running"}><Play size={15} fill="currentColor"/> {runState==="running"?"Running…":"Run Query"}</button>
        </div>
      </header>

      <nav className="qe-stage-strip" aria-label="Logical query execution stages">
        {result.stages.length?result.stages.map((item,index)=>{
          const meta=stageMeta[item.id],Icon=meta.Icon;
          return <button type="button" key={item.id} data-tone={meta.tone} aria-current={activeStage===item.id?"step":undefined} onClick={()=>setActiveStage(item.id)}>
            <span>{index+1}</span><div><strong>{item.label}</strong><small>{item.skipped?"Skipped":item.short}</small></div><Icon size={15}/>
          </button>;
        }):(["from","where","group","having","select","order","limit"] as QueryStageId[]).map((id,index)=>{
          const meta=stageMeta[id],Icon=meta.Icon;
          return <button type="button" key={id} data-tone={meta.tone} disabled><span>{index+1}</span><div><strong>{id.toUpperCase()}</strong><small>Unavailable</small></div><Icon size={15}/></button>;
        })}
      </nav>

      <div className="qe-workspace">
        <section className="qe-source-panel">
          <h3>Source Tables</h3>
          <div className="qe-source-tabs" role="tablist"><button type="button" role="tab" aria-selected={sourceTab==="orders"} onClick={()=>setSourceTab("orders")}>Orders</button><button type="button" role="tab" aria-selected={sourceTab==="customers"} onClick={()=>setSourceTab("customers")}>Customers</button></div>
          <DataTable table={sourceTab==="orders"?orderTable:customerTable}/>
        </section>

        <section className="qe-editor-panel">
          <h3><Sparkles size={16}/> SQL Editor</h3>
          <div className="qe-code-shell">
            <div className="qe-code-bar"><span>SQL</span><button type="button" onClick={copy}><Copy size={14}/>{copied?"Copied":"Copy"}</button></div>
            <CodeEditor aria-label="Query execution SQL editor" spellCheck={false} value={query} onChange={event=>{setQuery(event.target.value);setRunState("ready");setStepMode(false);}}/>
          </div>
          <div className="qe-try-label">Try different queries</div>
          <div className="qe-variations">
            <button type="button" className={stepMode?"qe-step-active":undefined} onClick={stepThrough}>{stepMode?"Next: "+(result.stages[(result.stages.findIndex(item=>item.id===activeStage)+1)%result.stages.length]?.label||"FROM"):"Step by step"}</button>
            {queryExecutionVariations.filter(item=>item.id!=="full").map(item=><button type="button" key={item.id} aria-pressed={variationId===item.id} onClick={()=>chooseVariation(item.id)}>{item.label}</button>)}
          </div>
          <p className="qe-variation-note">{variation.note}</p>
        </section>

        <section className="qe-result-panel">
          <h3>{stepMode?"Stage Preview":"Query Result"}</h3>
          {result.error?<div className="qe-error" role="alert"><TriangleAlert size={20}/><div><strong>Query error</strong><p>{result.error}</p></div></div>:stage?<DataTable table={stepMode?stage.table:result.final}/>:null}
          <div className={"qe-status qe-status-"+runState} aria-live="polite">
            {result.error?<><TriangleAlert size={15}/><span>{result.explanation}</span></>:<>
              <CheckCircle2 size={15}/>
              <span><strong>{stepMode?stage?.table.rows.length:result.final.rows.length} rows {stepMode?"at this stage":"returned"}</strong><small>{stepMode?stage?.description:result.explanation}</small></span>
              {!stepMode&&elapsed!==null&&<b>{elapsed.toFixed(1)} ms</b>}
            </>}
          </div>
        </section>
      </div>

      <div className="qe-bottom">
        <section className="qe-flow-panel">
          <h3><Sparkles size={16}/> Query Execution Order (Visual Flow)</h3>
          <div className="qe-flow">
            {result.stages.map((item,index)=>{
              const meta=stageMeta[item.id],Icon=meta.Icon;
              return <div className="qe-flow-wrap" key={item.id}>
                <button type="button" data-tone={meta.tone} className={activeStage===item.id?"qe-flow-active":undefined} onClick={()=>setActiveStage(item.id)}>
                  <Icon size={17}/><strong>{item.label}</strong><small>{item.skipped?"No clause · pass through":item.short}</small>
                </button>
                {index<result.stages.length-1&&<span>→</span>}
              </div>;
            })}
          </div>
        </section>

        <section className="qe-examples">
          <h3><Lightbulb size={16}/> Example Variations</h3>
          <ol>
            <li><button type="button" onClick={()=>chooseVariation("where")}><Play size={11} fill="currentColor"/> Add a WHERE condition</button></li>
            <li><button type="button" onClick={()=>chooseVariation("group")}><Play size={11} fill="currentColor"/> Add GROUP BY</button></li>
            <li><button type="button" onClick={()=>chooseVariation("having")}><Play size={11} fill="currentColor"/> Add GROUP BY and HAVING</button></li>
            <li><button type="button" onClick={()=>chooseVariation("order")}><Play size={11} fill="currentColor"/> Change ORDER BY</button></li>
            <li><button type="button" onClick={()=>chooseVariation("limit")}><Play size={11} fill="currentColor"/> Add LIMIT</button></li>
          </ol>
        </section>
      </div>
    </section>
  </div>;
}
