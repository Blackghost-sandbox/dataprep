"use client";

import {useEffect, useState} from "react";
import {motion, useReducedMotion} from "framer-motion";
import {ArrowRight, BookOpen, CheckCircle2, Copy, Database, Filter, Lightbulb, Pause, Play, RotateCcw, SkipForward, Table2} from "lucide-react";
import {toast} from "sonner";
import {GlossaryText} from "@/components/glossary";
import {nodeHelp, performanceSnapshot, performanceSteps, retainedRows, sampleRows, type PerformanceNode} from "@/lib/performance-simulation";

function CacheLane({cached,step,onInspect}:{cached:boolean;step:number;onInspect:(node:PerformanceNode)=>void}){
  const state=performanceSnapshot(step,cached);
  const reduce=useReducedMotion();
  const lines=['filtered = df.filter(col("age") > 25)'+(cached?'.cache()':''),'filtered.count()','filtered.agg(sum("salary")).collect()'];
  const nodes:PerformanceNode[]=cached?['read','filter','cache']:['read','filter'];
  const label={read:'Read Data',filter:'Filter',cache:'cache()',count:'count()',sum:'sum()'};
  function node(id:PerformanceNode){
    const Icon=id==='read'?Database:id==='filter'?Filter:id==='cache'?Table2:null;
    return <button type="button" className={'perf-node '+(state.active===id?'is-active ':'')+(id==='cache'&&state.populated?'is-stored':'')} onClick={()=>onInspect(id)} aria-label={'Explain '+label[id]} aria-current={state.active===id?'step':undefined}>
      {Icon&&<Icon size={30} strokeWidth={1.65}/>}<strong>{label[id]}</strong>
      <small>{id==='read'?'5 input rows':id==='filter'?'age > 25':id==='cache'?(state.populated?'3 rows stored':step>=6?'Marked · empty':'Mark for reuse'):id==='count'?(state.countReady?'= 3':'Count rows'):(state.sumReady?'= 225,000':'Total salary')}</small>
      {id==='cache'&&state.populated&&<span className="perf-stored">{retainedRows.map(r=><span key={r.age}>{r.age}</span>)}</span>}
    </button>;
  }
  const filtering=state.active==='filter';
  const source=state.active==='read';
  const visibleRows=source||filtering||state.reads===0?sampleRows:retainedRows;
  return <article className={'perf-lane '+(cached?'perf-cached':'perf-plain')}>
    <h3>{cached?<CheckCircle2 size={16}/>:<RotateCcw size={16}/>} {cached?'With cache':'Without cache'} <span>{cached?'reuse data':'recompute for each action'}</span></h3>
    <div className="perf-pipeline">
      {nodes.map((id,i)=><div className="perf-link" key={id}>{node(id)}{i<nodes.length-1&&<ArrowRight size={17} aria-hidden="true"/>}</div>)}
      <div className="perf-branch"><svg className="perf-fork" viewBox="0 0 28 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 50 H6 Q12 50 12 42 V17 Q12 10 19 10 H26 M21 6 L26 10 L21 14 M6 50 Q12 50 12 58 V83 Q12 90 19 90 H26 M21 86 L26 90 L21 94"/></svg>{node('count')}{node('sum')}</div>
      {state.active&&!(cached&&state.active==='cache'&&!state.populated)&&<motion.div aria-hidden="true" className="perf-flowing-rows" animate={{left:state.active==='read'?'14%':state.active==='filter'?(cached?'40%':'48%'):state.active==='cache'?'65%':'85%'}} transition={{duration:reduce?0:.32}}>
        {(state.active==='read'||state.active==='filter'?sampleRows:retainedRows).map(row=><motion.span key={row.age} animate={{opacity:state.active==='filter'&&row.age<=25?0:1,y:state.active==='filter'&&row.age<=25?9:0}} transition={{duration:reduce?0:.3}}>{row.age}</motion.span>)}
      </motion.div>}
    </div>
    <div className="perf-data" aria-label={(cached?'Cached':'Uncached')+' sample rows'}>
      <span>age / salary</span><div className="perf-tokens">
        {visibleRows.map((r,i)=><motion.span key={(source?'read-'+step:'rows')+'-'+r.age} initial={reduce?false:{opacity:0,x:-12}} animate={{opacity:filtering&&r.age<=25?.22:1,x:0,y:filtering&&r.age<=25?6:0}} transition={{duration:reduce?0:.25,delay:reduce?0:i*.035}} className={filtering&&r.age<=25?'perf-rejected':''}>{r.age} / {r.salary/1000}k{filtering&&r.age<=25?' ×':''}</motion.span>)}
      </div><small>{source?(state.reads===2?'Input recreated · read 2':'Reading input'):filtering?'22 and 19 rejected':state.populated?'Retained in cache':state.reads?'Filtered rows':'Preview · not executed'}</small>
    </div>
    <div className="perf-code"><button aria-label={'Copy '+(cached?'cached':'uncached')+' PySpark code'} onClick={async()=>{try{await navigator.clipboard.writeText('from pyspark.sql.functions import col, sum\n'+lines.join('\n'));toast.success('PySpark copied');}catch{toast.error('Copy unavailable. Select the code to copy it.');}}}><Copy size={14}/></button>
      <pre>{lines.map((line,i)=><code key={line} className={state.line===i?'is-current':''}><span className="perf-line-number">{i+1}</span>{line.split(/(".*?"|\b25\b|\b(?:cache|count|sum|filter|collect)\b)/g).map((part,j)=><span key={j} className={part.startsWith('"')?'perf-code-string':part==='25'?'perf-code-number':/^(cache|count|sum|filter|collect)$/.test(part)?'perf-code-method':undefined}>{part}</span>)}</code>)}</pre>
    </div>
    <div className="perf-outcome"><strong>Read + filter: {state.filters} execution{state.filters===1?'':'s'}</strong><span>{state.sumReady?(cached?'✓ Reused cached data':'↻ Recomputed upstream work'):'Run or step through the comparison'}</span></div>
  </article>;
}

export function SparkPerformanceConcept(){
  const [step,setStep]=useState(-1);
  const [running,setRunning]=useState(false);
  const [help,setHelp]=useState<PerformanceNode|null>(null);
  const reduce=useReducedMotion();
  useEffect(()=>{
    if(!running)return;
    const timer=setTimeout(()=>{if(step>=performanceSteps.length-1)setRunning(false);else setStep(s=>s+1);},850);
    return ()=>clearTimeout(timer);
  },[running,step]);
  const finished=step===performanceSteps.length-1;
  return <div className="perf-learning">
    <div className="perf-heading"><div><h2><BookOpen size={23}/>Understand Performance</h2><span className="perf-eyebrow">SEE THE IDEA</span><h3>Compute once, reuse when useful</h3><p>Two actions. The same filtered data. Watch what gets repeated.</p></div>
      <aside className="perf-takeaway"><Lightbulb size={23}/><div><strong>Key takeaway</strong><p><GlossaryText>Caching can help when the same expensive result is reused.</GlossaryText> It costs memory/storage and setup work.</p></div></aside>
    </div>
    <div className="perf-toolbar"><div className="perf-controls"><button className="perf-primary" onClick={()=>{setHelp(null);if(running){setRunning(false);return;}if(finished||step===-1)setStep(0);setRunning(true);}}>{running?<Pause size={15}/>:<Play size={15}/>} {running?'Pause':finished?'Replay comparison':step>=0?'Resume comparison':'Run comparison'}</button>
      <button disabled={finished} onClick={()=>{setRunning(false);setHelp(null);setStep(s=>Math.min(s+1,performanceSteps.length-1));}}><SkipForward size={15}/>Next step</button>
      <button onClick={()=>{setRunning(false);setStep(-1);setHelp(null);}}><RotateCcw size={15}/>Reset</button><span>{step<0?'Ready · click any node to explore':`Step ${step+1} / ${performanceSteps.length}`}</span>
    </div>
    <div className="perf-status" role="status" aria-live={running?'off':'polite'}>{step<0?'Filter age > 25 → count rows → total salaries. Click any node to explore.':performanceSteps[step].text}</div></div>
    <div className="perf-lanes"><CacheLane cached={false} step={step} onInspect={node=>{setHelp(node);setRunning(false);}}/><CacheLane cached step={step} onInspect={node=>{setHelp(node);setRunning(false);}}/></div>
    {help&&<div className="perf-help" role="status"><Lightbulb size={18}/><p>{nodeHelp[help]}</p><button onClick={()=>setHelp(null)} aria-label="Close node explanation">×</button></div>}
    <section className="perf-comparison"><h3>Visual execution comparison</h3>
      <div><strong>Without cache</strong><span>Read + filter</span><span>count</span><span>Read + filter again</span><span>sum</span><b>2 upstream passes</b></div>
      <div><strong>With cache</strong><span>Read + filter</span><span className="perf-cache-segment">Populate cache</span><span>count</span><span>Reuse → sum</span><b>1 upstream pass</b></div>
      <p>Illustrative simulation, not a live Spark run. Repeated upstream computation avoided — not benchmark timing or a speedup guarantee.</p>
    </section>
    <div className="perf-analogy"><span aria-hidden="true">🍚</span><div><strong>Cook once, eat twice.</strong><p>Without cache: cook → lunch; cook again → dinner.<br/>With cache: cook → store → lunch + dinner.</p></div></div>
    <details className="perf-caveat"><summary>What this simulation assumes</summary><p>Educational, deterministic simulation — no Spark cluster or PySpark execution. Cached partitions stay available here; eviction or executor loss may require recomputation. Spark may optimize scans and aggregates. Use the Spark UI and execution plan to measure real work. Release persisted data with <code>filtered.unpersist()</code> when finished.</p><p>Sample salaries are stored as full integers. <code>agg(sum(...))</code> builds a DataFrame; <code>collect()</code> triggers the second action. This tiny example teaches reuse, not a recommendation to cache small datasets.</p></details>
    {reduce&&<p className="perf-footnote">Reduced motion enabled. Steps still advance; moving-token effects are disabled.</p>}
  </div>;
}
