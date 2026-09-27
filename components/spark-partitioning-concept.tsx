"use client";
import {useEffect,useState} from "react";
import {motion,useReducedMotion} from "framer-motion";
import {ArrowDown,BookOpen,CheckCircle2,Copy,Database,Lightbulb,Network,Pause,Play,RotateCcw,Shuffle,SlidersHorizontal} from "lucide-react";
import {toast} from "sonner";
import {GlossaryText} from "@/components/glossary";
import {initialPartitions,redistribute,partitionCode,partitionStages,type PartitionOperation,type PartitionRecord} from "@/lib/partitioning-simulation";

function PartitionCards({partitions,revealed,active}:{partitions:PartitionRecord[][];revealed:boolean;active:boolean}){
 const reduce=useReducedMotion();
 return <div className="pt-partitions">{partitions.map((rows,i)=><div className={"pt-partition pt-color-"+i+(active?" pt-active":"")} key={i}><header><strong>Partition {i+1} (P{i+1})</strong><small>{revealed?rows.length:"—"} records</small></header><div className="pt-table"><table aria-label={`Partition ${i+1}`}><tbody>{revealed?rows.map((row,j)=><motion.tr key={row.id} initial={reduce?false:{opacity:0,x:10}} animate={{opacity:1,x:0}} transition={{duration:reduce?0:.2,delay:reduce?0:j*.045}}><td><b>{row.id}</b></td><td>{row.name}</td><td>{row.age}</td><td>{row.city}</td></motion.tr>):<tr><td colSpan={4} className="pt-empty">Waiting for records</td></tr>}</tbody></table></div></div>)}</div>;
}
export function SparkPartitioningConcept(){
 const [count,setCount]=useState(6),[initial,setInitial]=useState(2),[target,setTarget]=useState(3);
 const [operation,setOperation]=useState<PartitionOperation>("repartition");
 const [scenario,setScenario]=useState("Normal distribution");
 const [stage,setStage]=useState(0),[running,setRunning]=useState(false);
 const reduce=useReducedMotion();
 const before=initialPartitions(count,initial,scenario==="Data skew");
 const after=redistribute(before,target,operation);
 const code=partitionCode(target,operation);
 const descriptions=[
  `${count} records across ${initial} logical partitions. A partition is not an executor or worker machine.`,
  `${operation}(${target}) describes a new partitioning. Spark waits for an action to process data.`,
  operation==="repartition"?"show() requests execution. An exchange redistributes data through a shuffle.":"show() requests execution. This coalesce example groups existing partitions with less movement.",
  operation==="repartition"?"Follow the record IDs through the shuffle. Redistribution can involve network and disk I/O.":"Existing partition groups are combined in this example—not a full all-to-all redistribution.",
  `${after.length} new partitions formed. Before: ${count} records. After: ${after.flat().length} records.`,
  "Data redistributed, not duplicated. Placement and ordering here are illustrative—not Spark guarantees.",
 ];
 useEffect(()=>{if(!running)return;const timer=setTimeout(()=>{if(stage===5)setRunning(false);else setStage(s=>s+1);},1100);return()=>clearTimeout(timer);},[running,stage]);
 function reset(){setRunning(false);setStage(0);}
 function chooseScenario(value:string){reset();setScenario(value);setOperation("repartition");setCount(value==="Data skew"?12:6);setInitial(value==="Data skew"||value==="Fewer partitions"?4:2);setTarget(value==="Fewer partitions"?2:value==="More partitions"?4:3);}
 const moving=stage===3;
 return <div className="pt-learning tx-learning">
  <section className="pt-intro tx-intro"><div><h2><BookOpen size={25}/>Partitioning Lab</h2><p>See how records are distributed, how repartition and coalesce behave, and why shuffle can become expensive.</p></div><aside><Lightbulb size={23}/><div><strong>Key takeaway</strong><p><GlossaryText>Partitions split data for parallel work. Changing partition count may require a shuffle.</GlossaryText></p></div></aside></section>
  <section className="pt-lab tx-workspace" aria-label="Live partitioning lab">
   <div className="pt-toolbar">
    <label>Dataset<select value={count} onChange={e=>{reset();setCount(Number(e.target.value));setScenario("Custom");}}><option value={6}>6 records</option><option value={12}>12 records</option></select></label>
    <label>Initial partitions<select value={initial} onChange={e=>{reset();const n=Number(e.target.value);setInitial(n);setScenario("Custom");if(operation==="coalesce")setTarget(Math.min(target,n));}}>{[2,3,4].map(n=><option key={n}>{n}</option>)}</select></label>
    <div className="pt-operation-toggle" role="group" aria-label="Partition operation">{(["repartition","coalesce"] as const).map(op=><button key={op} aria-pressed={operation===op} onClick={()=>{reset();setOperation(op);if(op==="coalesce")setTarget(Math.max(1,initial-1));}}>{op}()</button>)}</div>
    <label>Target<select value={target} onChange={e=>{reset();setTarget(Number(e.target.value));}}>{[1,2,3,4].filter(n=>operation!=="coalesce"||n<=initial).map(n=><option key={n}>{n}</option>)}</select></label>
    <button className="pt-primary" onClick={()=>{if(running){setRunning(false);return;}if(stage===5)setStage(0);setRunning(true);}}>{running?<Pause size={12}/>:<Play size={12}/>} {running?"Pause":"Run Animation"}</button>
    <button disabled={stage===5} onClick={()=>{setRunning(false);setStage(s=>Math.min(s+1,5));}}><SlidersHorizontal size={12}/> {stage===0?"Step Mode":"Next step"}</button><button onClick={reset}><RotateCcw size={12}/>Reset</button>
   </div>
   <div className="pt-columns">
    <section className={"pt-pane"+(moving?" pt-source-moving":"")}><h3><b>1</b>Before: {initial} partitions<span>{count} records</span></h3><PartitionCards partitions={before} revealed active={stage===1||stage===2}/></section>
    <section className={"pt-movement"+(moving?" pt-moving":"")}><h3><b>2</b>{operation==="repartition"?"Shuffle (repartition)":"Combine (coalesce)"}</h3><div className="pt-movement-label">{operation==="repartition"?"Records move between partitions":"Existing partitions are grouped"}</div>
     <div className="pt-route"><svg viewBox="0 0 240 160" preserveAspectRatio="none" aria-hidden="true">{[0,1,2,3,4,5].map((i)=><path key={i} d={operation==="repartition"?`M10 ${18+i*24} C80 ${18+i*24} 160 ${142-i*24} 230 ${142-i*24}`:`M10 ${18+i*24} C90 ${18+i*24} 150 ${i<3?48:112} 230 ${i<3?48:112}`} stroke={["#458bff","#08b783","#a66cff","#efa720","#e26899","#5d64f6"][i]}/>)}</svg>
      <div className="pt-shuffle-box">{operation==="repartition"?<Shuffle size={24}/>:<Network size={24}/>}<strong>{operation==="repartition"?"SHUFFLE":"COALESCE"}</strong><small>{moving?"Moving record IDs":stage>=4?"New partitions formed":"Educational movement model"}</small></div>
      {moving&&before.flat().map((row,i)=><motion.span className="pt-traveller" key={row.id} initial={{left:"0%",top:`${12+(i%6)*14}%`,opacity:0}} animate={{left:["0%","45%","94%"],top:operation==="repartition"?[`${12+(i%6)*14}%`,"50%",`${12+(row.id%target)*Math.min(28,70/target)}%`]:[`${12+(i%6)*14}%`,"50%","65%"],opacity:[0,1,1]}} transition={{duration:reduce?0:.65,delay:reduce?0:i*.035}}>{row.id}</motion.span>)}
     </div><div className="pt-cost"><Network size={15}/><span>{operation==="repartition"?"Shuffle can involve network and disk I/O.":"Coalesce commonly reduces partitions with less movement; it may preserve imbalance."}</span></div>
    </section>
    <section className="pt-pane"><h3><b>3</b>After: {after.length} partitions<span>{stage>=4?count:"—"} records</span></h3><PartitionCards partitions={after} revealed={stage>=4} active={stage===4}/></section>
   </div>
   <div className="pt-status" role="status" aria-live={running?"off":"polite"}><b>{stage+1}/6 · {partitionStages[stage]}</b><span>{descriptions[stage]}</span></div>
   <div className="pt-bottom">
    <section className="pt-code"><header><strong>PySpark Code <small>Python</small></strong><button aria-label="Copy partitioning code" onClick={async()=>{try{await navigator.clipboard.writeText(code.join("\n"));toast.success("Code copied");}catch{toast.error("Select the code to copy it.");}}}><Copy size={14}/></button></header><pre>{code.map((line,i)=><code key={line} className={stage===1&&i===1||stage>=2&&i===2?"pt-code-active":""}><span>{i+1}</span>{line}</code>)}</pre></section>
    <section className="pt-plan"><h4>Simplified execution plan</h4>{[`Scan df (${initial} partitions)`,operation==="repartition"?`Exchange · repartition to ${target}`:`Coalesce · group into ${target}`,`Output (${after.length} partitions)`].map((text,i)=><div key={text}><div className={Math.min(stage<2?0:stage<4?1:2,2)===i?"pt-plan-active":""}><Database size={14}/>{text}</div>{i<2&&<ArrowDown size={11}/>}</div>)}</section>
    <section className="pt-explanation"><h4>What’s happening?</h4>{["New partition count requested",operation==="repartition"?"Shuffle redistributes records":"Existing groups are combined","Records move to their destinations","New partitions are formed","Record count remains unchanged"].map((text,i)=><p className={stage===i+1?"pt-current":""} key={text}><b>{i+1}</b>{text}</p>)}<strong><CheckCircle2 size={14}/>{stage>=4?`${count} in · ${count} out · no duplicates`:"Partitioning does not duplicate records"}</strong></section>
   </div>
   <div className="pt-scenarios"><div><h4>Try different scenarios</h4><div>{["Normal distribution","Data skew","More partitions","Fewer partitions"].map(label=><button key={label} aria-pressed={scenario===label} onClick={()=>chooseScenario(label)}>{label}</button>)}</div></div><aside><Lightbulb size={21}/><p>A partition is a logical chunk of data. Typically one task processes one partition in a stage—not one executor per partition.</p></aside></div>
   {scenario==="Data skew"&&<section className="pt-skew"><h4>Uneven partitions → uneven task work</h4>{before.map((rows,i)=><div key={i}><span>Task P{i+1}</span><div><motion.i initial={false} animate={{width:`${rows.length/count*100}%`}}/></div><span>{stage<3?`${rows.length} records`:i===0&&stage<5?"Running… more work": "✓ Complete"}</span></div>)}<p>Illustrative task states, not measured durations. One large partition can keep a stage waiting; repartitioning by count is not a universal fix for key skew.</p></section>}
   <p className="pt-disclaimer">Deterministic teaching simulation, not a live Spark run. Exact row placement/order is illustrative. Transformations are lazy; the shown action requests processing. Coalesce is not a guarantee of zero data movement.</p>
  </section>
 </div>;
}
