"use client";
import {useKafkaMotion} from "@/components/kafka-motion";
import {useEffect,useState} from "react";
import {motion,useReducedMotion} from "framer-motion";
import {ArrowRight,BookOpen,Boxes,Check,Lightbulb,Pause,Play,RotateCcw,Send,Store,Trash2,Truck,Warehouse} from "lucide-react";
import {GlossaryText} from "@/components/glossary";
import {advanceIntro,defaultIntroConfig,introFinished,introLimit,newIntroState,readerLag,type IntroConfig,type IntroSpeed,type IntroState} from "@/lib/kafka-intro-simulation";
const speedName=["","Slow","Normal","Fast"];
function OrderJson({event}:{event:Record<string,string|number>}){
 const entries=Object.entries(event);
 return <pre className="ki-json" aria-label="Order event preview"><code>{"{\n"}{entries.map(([key,value],index)=><span key={key}>{"  "}<span className="ki-json-key">{JSON.stringify(key)}</span>{": "}<span className={typeof value==="number"?"ki-json-number":"ki-json-string"}>{JSON.stringify(value)}</span>{index<entries.length-1?",\n":"\n"}</span>)}{"}"}</code></pre>;
}
function Consumer({reader,state,speed}:{reader:"a"|"b";state:IntroState;speed:IntroSpeed}){
 const info=state[reader],lag=readerLag(state,reader),read=info.next.reduce((a,b)=>a+b,0),total=state.logs.flat().length;
 return <section className={"ki-consumer ki-consumer-"+reader+(state.active===reader?" ki-active":"")}><header><strong>Consumer {reader.toUpperCase()}<small>{reader==="a"?"Analytics":"Fraud Detection"}</small></strong><span>{state.active===reader?<Play size={12}/>:lag?<Pause size={12}/>:<Check size={12}/>} {lag?speedName[speed]:total?"Caught up":"Ready"}</span></header><div className="ki-reader-metrics"><span>Last read <b>{info.last?`P${info.last.partition} : ${info.last.offset}`:"—"}</b></span><span>Lag <b>{lag}</b></span></div><progress max={Math.max(total,1)} value={read} aria-label={`Consumer ${reader.toUpperCase()} read progress`}/><div className="ki-offsets">{info.next.map((offset,p)=><span key={p}>P{p} next: <b>{offset}</b></span>)}</div><small>{read}/{total} read · independent application</small></section>;
}
export function KafkaIntroLab(){
 const kafkaMotion=useKafkaMotion();
 const [config,setConfig]=useState<IntroConfig>(defaultIntroConfig);
 const [state,setState]=useState(()=>newIntroState());
 const [running,setRunning]=useState(false),[speed,setSpeed]=useState(2);
 const [sending,setSending]=useState(false);
 const [custom,setCustom]=useState(false),[item,setItem]=useState("Laptop"),[amount,setAmount]=useState("1200");
 const reduce=useReducedMotion(),done=introFinished(state);
 const valid=item.trim().length>0&&item.length<=32&&amount.trim()!==""&&Number.isFinite(Number(amount))&&Number(amount)>=0;
 useEffect(()=>{if((!running&&!sending)||done)return;const timer=setTimeout(()=>{if(sending){setSending(false);if(!state.pending)return;}setState(s=>advanceIntro(s,config,false,item.trim(),Number(amount)));},speed===1?1200:speed===2?700:350);return()=>clearTimeout(timer);},[running,sending,done,state,config,speed,item,amount]);
 function updateConfig(key:keyof IntroConfig,value:number){setRunning(false);setConfig(c=>({...c,[key]:value}));setState(newIntroState(key==="partitions"?value:config.partitions));}
 const event=state.pending?.event??{order_id:1001+Math.min(state.created,introLimit-1),item:item.trim(),amount:Number(amount),event_type:"order"};
 return <div {...kafkaMotion} className="ki-learning">
  <section className="ki-intro"><div><h2><BookOpen size={23}/>See Kafka in action</h2><p>Follow an event from a producer into a partitioned topic, then watch two applications read independently.</p></div><aside><Lightbulb size={23}/><div><strong>Key takeaway</strong><p><GlossaryText>Kafka retains events in topics. Independent consumers can process them at different speeds.</GlossaryText></p></div></aside></section>
  <section className="ki-workspace">
   <div className="ki-grid">
    <section className="ki-producer"><h3><b>1</b><span>Producer<small>Publishes events to orders</small></span></h3><div className={"ki-producer-card"+(state.active==="producer"?" ki-active":"")}><div className="ki-source-tabs"><button aria-pressed={!custom} onClick={()=>setCustom(false)}>Live data</button><button aria-pressed={custom} onClick={()=>{setRunning(false);setCustom(true);}}>Custom</button></div>
      {custom?<div className="ki-custom"><label>Item<input maxLength={32} value={item} onChange={e=>{setRunning(false);setItem(e.target.value);}}/></label><label>Amount<input type="number" min="0" value={amount} onChange={e=>{setRunning(false);setAmount(e.target.value);}}/></label><small>Order IDs are assigned by the demo.</small>{!valid&&<p role="alert">Enter an item and a non-negative amount.</p>}</div>:<OrderJson event={event}/>}
      <button className="ki-primary ki-send" disabled={!valid||!!state.pending||state.created>=introLimit} onClick={()=>{setRunning(false);setSending(true);setState(s=>advanceIntro(s,config,true,item.trim(),Number(amount)));}}><Send size={13}/>Send Event</button>
      <small>{state.created}/{introLimit} demo orders · finite simulation</small>
    </div></section>
    <section className="ki-topic"><h3><b>2</b><span>Kafka Topic<small>Retained, partitioned event log</small></span></h3><div className={"ki-topic-card"+(state.active==="topic"?" ki-active":"")}><header><Boxes size={19}/><strong>orders</strong><small>{state.logs.flat().length} stored</small></header>{state.logs.map((records,p)=><div className={"ki-partition ki-partition-"+p} key={p}><header><strong>Partition {p}</strong><small>{records.length} events</small></header><div className="ki-records">{records.length?records.map(record=><motion.span key={record.order_id} initial={reduce?false:{opacity:0,x:-14}} animate={{opacity:1,x:0}} transition={{duration:reduce?0:.25}} title={`Partition ${p}, offset ${record.offset}, order ${record.order_id}`}>{record.offset}: <b>{record.order_id}</b></motion.span>):<span className="ki-empty">Waiting for events</span>}</div></div>)}<p>offset : order ID · reading does not delete</p></div>
     {state.pending?.phase==="sent"&&<motion.div className="ki-flight" key={state.pending.event.order_id} aria-hidden="true" initial={{x:-45,opacity:0}} animate={{x:8,opacity:1}} transition={{duration:reduce?0:.4}}><Send size={12}/> {state.pending.event.order_id} →</motion.div>}
    </section>
    <section className="ki-readers"><h3><b>3</b><span>Consumers<small>Separate read positions</small></span></h3><Consumer reader="a" state={state} speed={config.a}/><Consumer reader="b" state={state} speed={config.b}/><div className="ki-reader-note">One slow reader does not block the other.</div></section>
    <section className="ki-log"><header><h3>Event Log</h3><button aria-label="Clear event log" onClick={()=>setState(s=>({...s,history:[]}))}><Trash2 size={11}/>Clear</button></header><ol aria-label="Simulation event log">{state.history.length?state.history.slice().reverse().map((entry,i)=><li key={entry.tick+"-"+i} className={"ki-log-"+entry.role}><span/><small>#{entry.tick}</small><p>{entry.text}</p></li>):<li className="ki-log-empty">Your event trail appears here. Send an order to begin.</li>}</ol></section>
   </div>
   <div className="ki-controls"><button className="ki-primary" disabled={!valid||done} onClick={()=>setRunning(r=>!r)}>{running&&!done?<Pause size={13}/>:<Play size={13}/>} {running&&!done?"Pause":"Auto Run"}</button><button disabled={!valid||done} onClick={()=>{setRunning(false);setState(s=>advanceIntro(s,config,false,item.trim(),Number(amount)));}}><Play size={13}/>Step</button><button onClick={()=>{setRunning(false);setState(newIntroState(config.partitions));}}><RotateCcw size={13}/>Reset</button><label>Playback speed<input type="range" min="1" max="3" step="1" value={speed} onChange={e=>setSpeed(Number(e.target.value))}/><span>{speedName[speed]}</span></label></div>
   <p className="ki-status" role="status" aria-live={running&&!done?"off":"polite"}>{done?"Demo complete. Both consumers caught up; all 12 records are still stored. Reset to replay.":state.message}</p>
  </section>
  <div className="ki-bottom">
   <section className="ki-how"><h3><BookOpen size={15}/>How it works</h3>{[["Producer sends event","Your application publishes to a topic."],["Event stored in partition","Append a record with a partition-local offset."],["Consumers read independently","Each app advances its own read positions."]].map(([title,description],i)=><div key={title} className={"ki-how-"+i}><b>{i+1}</b><span><strong>{title}</strong><p>{description}</p></span></div>)}</section>
   <section className="ki-analogy"><h3><Truck size={17}/>Visual analogy</h3><strong>A delivery system</strong><p>A truck brings events to warehouse lanes. Independent shops collect at their own pace.</p><div className="ki-analogy-flow"><span><Truck size={32}/><b>Producer</b></span><ArrowRight size={15}/><span><Warehouse size={40}/><b>Topic</b><small>partition lanes</small></span><ArrowRight size={15}/><div><span><Store size={25}/><b>Analytics</b></span><span><Store size={25}/><b>Fraud checks</b></span></div></div><small>Offsets = each shop’s pickup position. Unlike physical goods, reading an event leaves it available.</small></section>
   <section className="ki-scenarios"><h3><Boxes size={15}/>Try different scenarios</h3>{([["partitions","Partitions"],["producer","Producer speed"],["a","Consumer A speed"],["b","Consumer B speed"]] as const).map(([key,label])=><label key={key}>{label}<div><input aria-label={label} type="range" min="1" max={key==="partitions"?4:3} step="1" value={config[key]} onChange={e=>updateConfig(key,Number(e.target.value))}/><span>{key==="partitions"?config[key]:speedName[config[key]]}</span></div></label>)}<small>Changing a scenario resets the demo. Try Fast producer + Slow B to build lag.</small></section>
  </div>
  <p className="ki-disclaimer">Educational deterministic simulation—not a Kafka cluster. Demo routing is round-robin, not a claim about the default partitioner. Ordering and offsets are per partition; “next” is a read position, not a durable commit. Retention governs availability; no expiry is simulated in this short demo. Log numbers are teaching steps, not timestamps.</p>
 </div>;
}
