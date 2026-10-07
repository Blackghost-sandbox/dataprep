"use client";
import {useEffect,useRef,useState,type ReactNode,type MouseEvent} from "react";

type Frame={headers:string[];rows:string[][];label:string};
type Phase='idle'|'read'|'transform'|'return'|'complete'|'error';
function readTable(table:HTMLTableElement,label:string):Frame{
 return {label,headers:Array.from(table.querySelectorAll('thead th')).map(cell=>cell.textContent?.trim()||''),rows:Array.from(table.querySelectorAll('tbody tr')).filter(row=>!row.querySelector('[colspan]')).map(row=>Array.from(row.querySelectorAll('td')).map(cell=>cell.textContent?.trim()||''))};
}
export function SqlExecutionVisual({children}:{lessonId:string;children:ReactNode}){
 const root=useRef<HTMLDivElement>(null);
 const timers=useRef<ReturnType<typeof setTimeout>[]>([]);
 const generation=useRef(0);
 const [phase,setPhase]=useState<Phase>('idle');
 const clear=()=>{generation.current++;timers.current.forEach(clearTimeout);timers.current=[];root.current?.querySelectorAll('[data-sql-flow],[data-sql-reading]').forEach(el=>{el.removeAttribute('data-sql-flow');el.removeAttribute('data-sql-reading');});};
 useEffect(()=>()=>{timers.current.forEach(clearTimeout);},[]);
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
  setPhase('read');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const count=Math.max(...frames.map(frame=>frame.rows.length),1);
  const scan=(index:number)=>{if(generation.current!==token)return;sourceTables.forEach(table=>{table.querySelectorAll('tbody tr').forEach((row,i)=>{row.removeAttribute('data-sql-reading');if(i===index)row.setAttribute('data-sql-reading','true');});});};
  if(!reduced)for(let index=0;index<count;index++)schedule(()=>scan(index),index*75);
  let attempts=0;
  const finish=()=>{
   if(generation.current!==token||!button.isConnected)return;
   if(button.disabled){if(++attempts>125){setPhase('error');return;}schedule(finish,80);return;}
   const errors=Array.from(root.current?.querySelectorAll<HTMLElement>('[class*=error]')??[]).filter(el=>!el.closest('.sql-run-visual,.sql-basics-roll')&&el.offsetHeight>0&&el.textContent?.trim());
   if(errors.length){setPhase('error');return;}
   const current=tables();
   const result=current.filter(isResult).at(-1);
   const scalar=root.current?.querySelector<HTMLElement>('.aggregate-result-box');
   const empty=root.current?.querySelector('.where-empty-result');
   const frame=result?readTable(result,'Actual query result'):scalar?{label:'Actual aggregate result',headers:[scalar.querySelector('div>span')?.textContent?.trim()||'Aggregate'],rows:[[scalar.querySelector('strong')?.textContent?.trim()||'']]}:empty?{label:'Actual query result',headers:frames[0]?.headers??[],rows:[]}:null;
   if(!frame){setPhase('error');return;}
   if(result)result.dataset.sqlFlow='result';else if(scalar)scalar.dataset.sqlFlow='result';setPhase(reduced?'complete':'transform');
   if(reduced)return;
   schedule(()=>{setPhase('return');const rows=Array.from(result?.querySelectorAll('tbody tr')??[]);rows.forEach((row,index)=>{(row as HTMLElement).style.setProperty('--delivery-index',String(index));});},700);
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
 {children}
 </div>;
}
