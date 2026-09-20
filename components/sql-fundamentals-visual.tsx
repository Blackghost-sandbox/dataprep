"use client";
import { Eye, ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { sqlVisuals, customerTable, orderTable, type SqlTable } from "@/lib/sql-lessons";
import { useWalkthrough, WalkthroughControls } from "@/components/walkthrough-controls";
import { DarkCodeCard } from "@/components/rdd-dataframe-experience";

export function SqlSampleTable({table,highlight=[],dimRows=[]}:{table:SqlTable;highlight?:string[];dimRows?:number[]}){
  const reduced=useReducedMotion();
  return <div className="sql-table-scroll" tabIndex={0} role="region" aria-label={table.title}><table><caption>{table.title}</caption><thead><tr>{table.columns.map(column=><th scope="col" key={column} className={highlight.includes(column)?"sql-cell-selected":undefined}>{column}</th>)}</tr></thead><tbody>{table.rows.map((row,i)=><motion.tr layout={!reduced} transition={{duration:reduced?0:.3}} key={row.join("|")+"-"+table.rows.slice(0,i).filter(other=>other.join("|")===row.join("|")).length} className={dimRows.includes(i)?"sql-row-excluded":undefined}>{row.map((value,j)=><td key={table.columns[j]} className={highlight.length?(highlight.includes(table.columns[j])?"sql-cell-selected":"sql-cell-muted"):undefined}>{value===null?<em>NULL</em>:value}</td>)}</motion.tr>)}</tbody></table></div>;
}

export function SqlOperationVisual({id}:{id:string}){
  const result=sqlVisuals[id].result;
  if(id==="select"||id==="introduction")return <><p className="spark-caption">Selected columns are highlighted; faded columns are not returned.</p><SqlSampleTable table={customerTable} highlight={id==="select"?["name","city"]:["id","name"]}/></>;
  if(id==="where")return <><p>Keep age &gt; 25. Bob and Dan fail the condition.</p><SqlSampleTable table={customerTable} highlight={["age"]} dimRows={[1,3]}/></>;
  if(id==="order-by"||id==="limit")return <><p>{id==="limit"?"After sorting, keep the first two rows.":"Reorder from oldest to youngest; keep all rows."}</p><SqlSampleTable table={{...customerTable,title:"Sorted by age DESC, id",rows:[...customerTable.rows].sort((a,b)=>Number(b[3])-Number(a[3]))}} highlight={["age"]} dimRows={id==="limit"?[2,3]:[]}/></>;
  if(id==="distinct")return <><p>Remove the repeated Chennai; WHERE excludes NULL.</p><SqlSampleTable table={{title:"Projected city values",columns:["city"],rows:customerTable.rows.map(row=>[row[2]])}} dimRows={[2,3]}/></>;
  if(id==="aggregates")return <><SqlSampleTable table={orderTable} highlight={["amount"]}/><div className="sql-operation-summary">3 rows → COUNT = 3<br/>500 + 300 + 200 → SUM = 1000<br/>MIN = 200 · MAX = 500</div></>;
  if(id==="group-by"||id==="having")return <><p>{id==="having"?"Filter completed group totals, not individual orders.":"Move orders with the same customer_id into a group."}</p><div className="walkthrough-groups">{[1,3].map(key=><div key={key} className={id==="having"&&key===3?"sql-row-excluded":undefined}><h5>customer_id = {key}</h5><span>{orderTable.rows.filter(row=>row[1]===key).map(row=>row[2]).join(" + ")} = {key===1?800:200}</span>{id==="having"&&<span>{key===1?"Keep: 800 > 500":"Remove: 200 ≤ 500"}</span>}</div>)}</div></>;
  if(id==="joins")return <><div className="sql-sample-tables"><SqlSampleTable table={customerTable} highlight={["id"]} dimRows={[1,3]}/><SqlSampleTable table={orderTable} highlight={["customer_id"]}/></div><ol className="sql-match-list">{orderTable.rows.map(order=><li key={String(order[0])}><span>{customerTable.rows.find(c=>c[0]===order[1])?.[1]} · id {order[1]}</span><ArrowRight size={16} aria-label="matches"/><span>Order {order[0]} · {order[2]}</span></li>)}</ol><p>Bob and Dan have no matching order; INNER JOIN excludes them.</p></>;
  if(id==="subqueries-ctes")return <><SqlSampleTable table={{title:"Intermediate CTE: totals",columns:["customer_id","total"],rows:[[1,800],[3,200]]}} highlight={["total"]} dimRows={[1]}/><p>The outer WHERE reads this intermediate result and keeps total &gt; 500.</p></>;
  if(id==="window-functions")return <><p>Keep all three orders and add a customer total to each row.</p><SqlSampleTable table={{...result,title:"Original rows + calculated column"}} highlight={["customer_total"]}/></>;
  if(id==="null-case")return <><SqlSampleTable table={{title:"Evaluate CASE for each row",columns:["name","city","city IS NULL","city_label"],rows:customerTable.rows.map(row=>[row[1],row[2],row[2]===null?"true":"false",row[2]??"Unknown"])}} highlight={["city IS NULL","city_label"]}/><p>Dan takes THEN &apos;Unknown&apos;; other rows keep their city through ELSE.</p></>;
  return <><ol className="sql-mental-model">{["FROM orders","WHERE amount > 200","GROUP BY customer_id","HAVING total > 500","SELECT","ORDER BY","LIMIT 1"].map(item=><li key={item}><span>{item}</span></li>)}</ol><SqlSampleTable table={orderTable} highlight={["amount"]} dimRows={[2]}/><p>200 fails WHERE. Customer 1’s remaining orders total 800, pass HAVING, and become the top result.</p></>;
}

export function SqlFundamentalsVisual({id,query,explanation}:{id:string;query:string;explanation:string}){
  const state=useWalkthrough(3);
  const reduced=useReducedMotion();
  const visual=sqlVisuals[id];
  return <section className="visual-comparison-card sql-fundamentals-visual"><header className="visual-comparison-header"><div className="visual-title"><span><Eye size={21}/></span><div><h3>Follow the data</h3><p>See how the query changes the input data.</p></div></div><ol className="sql-flow-stepper" aria-label="Query flow">{["Input table","Apply query","Result"].map((label,index)=><li key={label} aria-current={state.step===index?"step":undefined}><button type="button" onClick={()=>state.change(index)}><span>{index+1}</span>{label}</button></li>)}</ol></header>
    <div className="sql-flow-toolbar" aria-label="Walkthrough controls"><WalkthroughControls state={state} stableNavigation/></div>
    <p aria-live="polite" className="spark-caption">Step {state.step+1} / 3 · {state.step===0?"This is the source data before the query runs.":state.step===1?explanation:"Only the result columns and rows remain. Defined sample output—not live execution."}</p>
    <div className="sql-flow-workspace"><motion.div key={state.step} initial={{opacity:reduced?1:0}} animate={{opacity:1}} transition={{duration:reduced?0:.22}}>{state.step===0?<div className="sql-sample-tables">{visual.inputs.map(table=><SqlSampleTable key={table.title} table={table}/>)}</div>:state.step===1?<><DarkCodeCard title="SQL · operation" code={query}/><SqlOperationVisual id={id}/></>:<><SqlSampleTable table={visual.result}/>{id==="select"&&<p className="spark-caption">Without ORDER BY, SQL does not guarantee row order. This illustration retains input order for readability.</p>}</>}</motion.div><aside className="sql-flow-explainer"><h4>{state.step===0?"This is the source data":state.step===1?"Apply the SQL operation":"This is the result"}</h4><p>{state.step===0?"Each row is one record. Each column stores one piece of information.":state.step===1?explanation:"Compare these columns and rows with the input. Only the requested information is returned."}</p><div>{state.step===0?"Read the input, then choose Next to see the query.":state.step===1?"Highlights show what is selected or kept; faded values are excluded.":"Illustrative sample output, not a live database query."}</div></aside></div>
  </section>;
}
