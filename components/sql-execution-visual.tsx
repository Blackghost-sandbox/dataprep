"use client";
import {useEffect,useRef,useState,type ReactNode,type MouseEvent} from "react";
import {ArrowRight,CheckCircle2,Database,Workflow,Table2} from "lucide-react";

type Frame={headers:string[];rows:string[][];label:string};
type Phase='idle'|'read'|'transform'|'return'|'complete'|'error';
const operations:Record<string,[string,string]>={
 introduction:['Choose columns','Copy the requested fields. Reading does not change the source table.'],
 where:['Test each row','Keep TRUE conditions; exclude FALSE and UNKNOWN.'],
 'order-by':['Reorder records','Move rows into the requested sort order; values stay unchanged.'],
 distinct:['Collapse repeated combinations','Compare the selected values together and keep each unique combination once.'],
 limit:['Take the first N','Use the defined ordering, then keep at most the requested row count.'],
 aggregates:['Calculate the summary','Apply COUNT, SUM, AVG, MIN, or MAX to the input values.'],
 'group-by':['Form groups and summarize','Put equal grouping keys together, then calculate one summary per group.'],
 having:['Evaluate grouped totals','Calculate the groups, then keep those whose HAVING condition is true.'],
 joins:['Match related records','Each matching pair becomes a result row; unmatched rows depend on the join type.'],
 'subqueries-ctes':['Resolve the intermediate query','Use the subquery or named CTE result as input to the outer query.'],
 'window-functions':['Calculate over related rows','Use the window partition to attach calculations without collapsing records.'],
 'null-case':['Evaluate conditions','Test missing values with IS NULL and choose the matching CASE branch.'],
 'query-execution':['Trace the logical clauses','FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT.'],
};
function readTable(table:HTMLTableElement,label:string):Frame{
 return {label,headers:Array.from(table.querySelectorAll('thead th')).map(cell=>cell.textContent?.trim()||''),rows:Array.from(table.querySelectorAll('tbody tr')).filter(row=>!row.querySelector('[colspan]')).map(row=>Array.from(row.querySelectorAll('td')).map(cell=>cell.textContent?.trim()||''))};
}
export function SqlExecutionVisual({lessonId,children}:{lessonId:string;children:ReactNode}){
 const root=useRef<HTMLDivElement>(null);
 const timers=useRef<ReturnType<typeof setTimeout>[]>([]);
 const generation=useRef(0);
 const [phase,setPhase]=useState<Phase>('idle');
 const [inputs,setInputs]=useState<Frame[]>([]);
 const [output,setOutput]=useState<Frame|null>(null);
 const [cursor,setCursor]=useState(0);
 const [delivered,setDelivered]=useState(0);
 const [cycle,setCycle]=useState(0);
 const [error,setError]=useState('');
 const operation=operations[lessonId]??['Apply the query','Compare the source records with the returned result.'];
 const clear=()=>{generation.current++;timers.current.forEach(clearTimeout);timers.current=[];root.current?.querySelectorAll('[data-sql-flow],[data-sql-reading]').forEach(el=>{el.removeAttribute('data-sql-flow');el.removeAttribute('data-sql-reading');});};
 useEffect(()=>()=>{timers.current.forEach(clearTimeout);},[]);
 useEffect(()=>{if(phase==='read'){const lesson=root.current?.closest<HTMLElement>('.lesson-content');lesson?.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}},[phase]);
 const cancel=()=>{clear();setPhase('idle');};
 const schedule=(fn:()=>void,delay:number)=>{timers.current.push(setTimeout(fn,delay));};
 const tables=()=>Array.from(root.current?.querySelectorAll<HTMLTableElement>('table')??[]).filter(table=>!table.closest('.sql-run-visual,.sql-basics-roll'));
 const isResult=(table:HTMLTableElement)=>Boolean(table.closest('[class*=result],[aria-label*=result],[aria-label*=Result]'));
 const begin=(button:HTMLButtonElement)=>{
  clear();const token=generation.current;
  const initial=tables();
  const source=initial.filter(table=>!isResult(table)&&!table.closest('[class*=summary],[class*=compare],.where-evaluation-card,.order-preview-table'));
  const sourceTables=source.length?source:[initial[0]].filter(Boolean);
  sourceTables.forEach(table=>table.dataset.sqlFlow='source');
  const frames=sourceTables.map((table,index)=>readTable(table,table.closest('section,article')?.querySelector('h3,h4')?.textContent?.trim()||`Source ${index+1}`));
  setInputs(frames);setOutput(null);setError('');setCursor(0);setDelivered(0);setCycle(value=>value+1);setPhase('read');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const count=Math.max(...frames.map(frame=>frame.rows.length),1);
  const scan=(index:number)=>{if(generation.current!==token)return;setCursor(index);sourceTables.forEach(table=>{table.querySelectorAll('tbody tr').forEach((row,i)=>{row.removeAttribute('data-sql-reading');if(i===index)row.setAttribute('data-sql-reading','true');});});};
  if(!reduced)for(let index=0;index<count;index++)schedule(()=>scan(index),index*75);
  let attempts=0;
  const finish=()=>{
   if(generation.current!==token||!button.isConnected)return;
   if(button.disabled){if(++attempts>125){setError('The exercise is still running. Reset it and try again.');setPhase('error');return;}schedule(finish,80);return;}
   const errors=Array.from(root.current?.querySelectorAll<HTMLElement>('[class*=error]')??[]).filter(el=>!el.closest('.sql-run-visual,.sql-basics-roll')&&el.offsetHeight>0&&el.textContent?.trim());
   if(errors.length){setError(errors[0].textContent?.trim()||'Check the query.');setPhase('error');return;}
   const current=tables();
   const result=current.filter(isResult).at(-1);
   const scalar=root.current?.querySelector<HTMLElement>('.aggregate-result-box');
   const empty=root.current?.querySelector('.where-empty-result');
   const frame=result?readTable(result,'Actual query result'):scalar?{label:'Actual aggregate result',headers:[scalar.querySelector('div>span')?.textContent?.trim()||'Aggregate'],rows:[[scalar.querySelector('strong')?.textContent?.trim()||'']]}:empty?{label:'Actual query result',headers:frames[0]?.headers??[],rows:[]}:null;
   if(!frame){setError('No table result is available for this query.');setPhase('error');return;}
   if(result)result.dataset.sqlFlow='result';else if(scalar)scalar.dataset.sqlFlow='result';setOutput(frame);setPhase(reduced?'complete':'transform');
   if(reduced){setDelivered(frame.rows.length);return;}
   schedule(()=>{setPhase('return');const rows=Array.from(result?.querySelectorAll('tbody tr')??[]);rows.forEach((row,index)=>{(row as HTMLElement).style.setProperty('--delivery-index',String(index));});},700);
   frame.rows.forEach((_,index)=>schedule(()=>setDelivered(index+1),700+index*85));
   schedule(()=>{setPhase('complete');sourceTables.forEach(table=>table.querySelectorAll('[data-sql-reading]').forEach(row=>row.removeAttribute('data-sql-reading')));},900+frame.rows.length*85);
  };
  // Let the lesson evaluator produce its real result before illustrating the transformation.
  schedule(finish,reduced?50:Math.max(850,count*75+100));
 };
 const capture=(event:MouseEvent<HTMLDivElement>)=>{
  const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button');
  if(!button||button.closest('.sql-basics-roll,.sql-run-visual'))return;
  if(/^run query$/i.test(button.textContent?.trim()||'')){begin(button);return;}
  if(!/copy|full data/i.test(button.textContent||''))cancel();
 };
 return <div ref={root} className={`sql-execution-wrapper flow-${phase}`} onClickCapture={capture} onChangeCapture={cancel}>
 {phase!=='idle'&&<section key={cycle} className="sql-run-visual" aria-label="Visual query execution" aria-live="polite">
 <header><Workflow size={19}/><strong>Watch the query work</strong><small>Illustrated logical flow · using this exercise’s result</small></header>
 <nav aria-label="Execution stages">{['Read records',operation[0],'Build result'].map((label,index)=><span key={label} className={(['read','transform','return'] as Phase[])[index]===phase?'active':phase==='complete'?'finished':''}><b>{index+1}</b>{label}</span>)}</nav>
 <p className="sql-run-message">{phase==='read'?`Inspecting the source records, row ${cursor+1}.`:phase==='transform'?operation[1]:phase==='return'?`Returning ${delivered} of ${output?.rows.length??0} rows.`:phase==='error'?error:`Complete: ${output?.rows.length??0} rows. Source records unchanged.`}</p>
 <div className="sql-run-diagram"><div className="sql-run-inputs">{inputs.map((frame,index)=><div key={index}><strong><Database size={15}/>{frame.label}</strong>{frame.rows.slice(0,3).map((row,i)=><div key={i} className={`sql-run-record ${phase==='read'&&cursor===i?'is-reading':''}`}><span>{row.slice(0,3).join(' · ')}</span></div>)}<small>{frame.rows.length} source rows · preview</small></div>)}</div><div className="sql-run-operation"><ArrowRight size={21}/><span><Workflow size={27}/><b>{operation[0]}</b></span><ArrowRight size={21}/><i/><i/><i/></div><div className="sql-run-output"><strong><Table2 size={15}/>Query result</strong>{output&&(phase==='return'||phase==='complete')?<>{output.rows.slice(0,3).map((row,index)=><div key={index} className={`sql-run-record ${index<delivered?'is-delivered':'is-waiting'}`}><CheckCircle2 size={13}/><span>{row.slice(0,3).join(' · ')}</span></div>)}<small>{output.rows.length===0?'No rows matched.':`${output.rows.length} rows · ${output.headers.length} columns · preview`}</small></>:<div className="sql-run-awaiting">{phase==='error'?'Fix the query to continue.':'Follow the transformation →'}</div>}</div></div>
 </section>}
 {children}
 </div>;
}
