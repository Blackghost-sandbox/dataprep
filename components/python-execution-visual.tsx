"use client";
import {useEffect,useRef,useState} from 'react';
import {Play,RotateCcw,ArrowRight} from 'lucide-react';
import recordings from '@/lib/python-execution-traces.json';

type Frame={line:number;event:string;scope:string;variables:Record<string,string>;detail:string;stdout:string;stderr:string};
type Recording={code:string;frames:Frame[];stdout:string;stderr:string;error:string};
const traces=recordings as unknown as Record<string,Record<string,Recording>>;
function explanation(frame:Frame,code:string){
 if(frame.event==='exception')return `Exception raised: ${frame.detail}. Follow the next trace event to see whether it is caught.`;
 if(frame.event==='call')return `Enter ${frame.scope}; the displayed values are its local arguments.`;
 if(frame.event==='return')return `Leave ${frame.scope}; returned value: ${frame.detail}.`;
 const line=code.split('\n')[frame.line-1]?.trim()??'';
 const action=line.startsWith('for ')?'Begin the next loop iteration':line.startsWith('if ')?'Test this condition':line.startsWith('return ')?'Evaluate the return value':line.startsWith('except ')?'Check the exception handler':line.includes('open(')||line.includes('read_text')?'Access the fixture file':line.includes('groupby')?'Group the source records and aggregate':line.includes('print(')?'Write to standard output':line.includes('=')?'Evaluate and assign the value':line.includes('append(')?'Append to the collection':'Execute this statement';
 return `${action}. Values shown are the state before this line; the following event shows its changes.`;
}
export function PythonExecutionVisual({lessonId,code,variant='example',compact=false}:{lessonId:string;code:string;variant?:'example'|'solution';compact?:boolean}){
 const recording=traces[lessonId]?.[variant];
 const supported=recording?.code===code;
 const root=useRef<HTMLDivElement>(null),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),generation=useRef(0);
 const [index,setIndex]=useState(-1),[phase,setPhase]=useState<'idle'|'playing'|'paused'|'done'|'error'>('idle');
 const cancel=()=>{generation.current++;clearTimeout(timer.current);setIndex(-1);setPhase('idle');};
 useEffect(()=>{
  const scope=root.current?.closest('.lesson-content');
  const reset=()=>{generation.current++;clearTimeout(timer.current);setIndex(-1);setPhase('idle');};
  const clicked=(event:Event)=>{const target=event.target as HTMLElement;if(target.closest('button')&&!root.current?.contains(target)&&!/copy/i.test(target.closest('button')?.textContent??''))reset();};
  scope?.addEventListener('click',clicked,true);scope?.addEventListener('input',reset);scope?.addEventListener('change',reset);window.addEventListener('hashchange',reset);
  // The generation ref is a cancellation counter, not a DOM reference.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return ()=>{generation.current++;clearTimeout(timer.current);scope?.removeEventListener('click',clicked,true);scope?.removeEventListener('input',reset);scope?.removeEventListener('change',reset);window.removeEventListener('hashchange',reset);};
 },[]);
 const run=()=>{
  const from=phase==="paused"?index+1:0;
  if(phase==="paused"){generation.current++;clearTimeout(timer.current);}else cancel();if(!supported)return;
  const token=generation.current;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){setIndex(recording.frames.length-1);setPhase(recording.error?'error':'done');return;}
  setPhase('playing');
  const next=(i:number)=>{if(token!==generation.current)return;if(i>=recording.frames.length){setPhase(recording.error?'error':'done');return;}setIndex(i);timer.current=setTimeout(()=>next(i+1),recording.frames[i].event==='exception'?1400:1000);};next(from);
 };
 const pause=()=>{generation.current++;clearTimeout(timer.current);setPhase("paused");};
 const seek=(direction:number)=>{generation.current++;clearTimeout(timer.current);const target=Math.max(0,Math.min((recording?.frames.length??1)-1,index+direction));setIndex(target);setPhase(target===(recording?.frames.length??1)-1?(recording?.error?"error":"done"):"paused");};
 const frame=index>=0?recording?.frames[index]:undefined;
 const previous=recording?.frames[index-1]?.variables??{};
 const variables=Object.entries(frame?.variables??{}).filter(([key])=>key!=='.0').sort(([a,av],[b,bv])=>Number(previous[b]!==bv)-Number(previous[a]!==av));
 const preview=(value:string)=>value.length>115?value.slice(0,112)+'… (preview)':value;
 const source=recording?.frames.find(f=>['orders','raw_amounts','prices','data'].some(k=>k in f.variables));
 const input=source&&Object.entries(source.variables).find(([k])=>['orders','raw_amounts','prices','data'].includes(k));
 const finished=phase==='done'||phase==='error';
 return <div ref={root} className={`py-execution execution-${phase}${compact?" py-execution-compact":""}`}>
  <header><strong>{compact?"Lesson execution · ":"Python · "}{variant==='solution'?'worked solution':'worked example'}</strong><div><button onClick={run} disabled={!supported}><Play size={14}/>Run Code</button><button onClick={phase==="paused"?run:pause} disabled={phase!=="playing"&&phase!=="paused"}>{phase==="paused"?"Resume":"Pause"}</button><button onClick={()=>seek(-1)} disabled={index<=0}>Previous step</button><button onClick={()=>seek(1)} disabled={!supported||finished}>Next step</button><button onClick={cancel}><RotateCcw size={14}/>Reset</button></div></header>
  <p className="py-execution-provenance">Recorded CPython execution · exact shipped code · File fixtures, when used: three orders, amounts 100, 50, 20. Record motion illustrates data flow; line events and values are recorded.</p>
  <pre className="py-execution-code"><code>{code.split('\n').map((line,i)=>compact&&(i<Math.max(0,(frame?.line??2)-2)||i>Math.max(0,(frame?.line??2)-2)+2)?null:<span key={i} className={frame?.line===i+1?'executing':''} aria-current={frame?.line===i+1?'step':undefined}><small>{i+1}</small>{line||' '}{'\n'}</span>)}</code></pre>
  <section className="py-execution-strip" aria-label="Python execution visualization">
   <p aria-live="polite">{!supported?'No verified trace matches this code. Run it in your Python environment.':phase==='idle'?'Run to follow assignments, calls, branches and collection changes.':finished?phase==='error'?recording.error:'Execution finished. The evaluator output is shown below.':frame?explanation(frame,code):'Starting…'}</p>
   <div className="py-execution-flow"><article><strong>Source records</strong><span>{input?`${input[0]} = ${preview(input[1])}`:'File or function inputs appear in the trace.'}</span></article><ArrowRight className="py-execution-arrow"/><article><strong>{frame?`${frame.scope} · ${frame.event} · line ${frame.line}`:'Variables / processing'}</strong><span key={index}>{variables.length?variables.slice(0,2).map(([name,value])=><span className="py-execution-variable" key={name}><b>{name}</b> = {preview(value)}</span>):'Values appear as they become available.'}{frame?.event==='return'&&<span>return = {frame.detail}</span>}</span></article><ArrowRight className="py-execution-arrow"/><article><strong>Actual evaluator output</strong><span>{finished?<>{recording.stderr&&<span className="py-execution-warning">{recording.stderr}</span>}{recording.stdout||'(no standard output)'}{recording.error&&<span className="py-execution-warning">{recording.error}</span>}</>:phase==='playing'?'Executing… output revealed on completion.':'Waiting for Run Code.'}</span></article></div>
   <div className="py-execution-record-route" aria-hidden="true">{phase==='playing'&&<span>{input?input[1].slice(0,35):'Source → processing → output'}</span>}</div>
   <small>{frame?`Event ${index+1} / ${recording.frames.length}. Local state before each line; call/return and caught exceptions included.`:'No trace of pandas internals or operating-system file operations is claimed.'}</small>
  </section>
 </div>;
}





