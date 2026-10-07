"use client";
import {useCloudMotion} from "@/components/cloud-motion";

import {useMemo,useState} from "react";
import {
  Activity, Boxes, CheckCircle2, ChevronLeft, ChevronRight, CloudCog,
  GraduationCap, Play, RefreshCcw, Send, Sparkles, TimerReset, XCircle, Zap
} from "lucide-react";
import {
  defaultStreamingControls, deliverySemantics, eventTypes, partitionKeys,
  referenceStreamingState, sendPartitionedEvent, simulateStreaming, stablePartition,
  streamingPlatforms,
  type EventTypeId, type PartitionKeyId, type StreamingControls, type StreamingPlatformId
} from "@/lib/cloud-streaming-simulation";

function StreamingHeroArtwork(){
  return <div className="sm-hero-art">
    <div className="sm-hero-box producer"><span><Boxes size={26}/></span><strong>Producers</strong><small>Apps, Services<br/>Sensors, DBs</small></div>
    <ChevronRight size={24}/>
    <div className="sm-hero-platform"><div><span>✣</span><span>◈</span><span>⬢</span></div><strong>Streaming Platform</strong><small>Ingest • Partition • Retain<br/>Deliver • Scale</small></div>
    <ChevronRight size={24}/>
    <div className="sm-hero-box consumer"><span><CloudCog size={28}/></span><strong>Consumers</strong><small>Stream Processing<br/>Analytics • Apps<br/>Data Lake</small></div>
  </div>;
}

export function CloudStreamingHero({description,minutes,currentLesson,total,onPrevious,onNext}:{
  description:string;minutes:number;currentLesson:number;total:number;onPrevious:()=>void;onNext:()=>void;
}){
  return <section className="sm-hero">
    <div className="sm-breadcrumb"><span>Cloud Platforms</span><ChevronRight size={14}/><strong>Streaming &amp; Messaging</strong></div>
    <div className="sm-hero-grid">
      <div>
        <div className="sm-title-row"><span className="sm-title-icon"><Zap size={31}/></span><div><h1>Streaming &amp; Messaging</h1><p>{description}</p></div></div>
        <div className="sm-meta"><span><TimerReset size={14}/>{minutes} min</span><span><GraduationCap size={14}/>Lesson {currentLesson+1}/{total}</span><span className="is-intermediate"><Sparkles size={13}/>Intermediate</span></div>
      </div>
      <div className="sm-hero-right">
        <div className="sm-hero-nav"><button onClick={onPrevious} disabled={currentLesson===0}><ChevronLeft size={16}/>Previous</button><button className="is-next" onClick={onNext} disabled={currentLesson===total-1}>Next<ChevronRight size={16}/></button></div>
        <StreamingHeroArtwork/>
      </div>
    </div>
  </section>;
}

function EventJson({events}:{events:ReturnType<typeof referenceStreamingState>["events"]}){
  return <pre className="sm-json"><code>{events.map(event=>JSON.stringify(event,null,2)).join("\n")}</code></pre>;
}

export function CloudStreamingLab(){
 const cloudMotion=useCloudMotion(".sm-stage-grid > .sm-card");
  const [controls,setControls]=useState<StreamingControls>(()=>defaultStreamingControls());
  const [state,setState]=useState(()=>referenceStreamingState());
  const [running,setRunning]=useState(false);
  const [outputTab,setOutputTab]=useState<"events"|"metrics">("events");
  const [testKey,setTestKey]=useState("user_1001");
  const [lastPartition,setLastPartition]=useState(1);

  const platform=streamingPlatforms[controls.platform];
  const keyPreview=useMemo(()=>stablePartition(testKey,controls.partitions),[testKey,controls.partitions]);
  const patch=<K extends keyof StreamingControls>(key:K,value:StreamingControls[K])=>setControls(prev=>({...prev,[key]:value}));

  const run=()=>{
    setRunning(true);
    window.setTimeout(()=>{setState(simulateStreaming(controls));setRunning(false);},320);
  };

  const reset=()=>{
    setControls(defaultStreamingControls());
    setState(referenceStreamingState());
    setOutputTab("events");setTestKey("user_1001");setLastPartition(1);setRunning(false);
  };

  const sendEvent=()=>{
    const next=sendPartitionedEvent(state,testKey,controls.partitions);
    setLastPartition(next.target);
    setState(prev=>({...prev,partitions:next.partitions,status:`Key ${testKey} routed to partition ${next.target}; same key preserves the same ordering scope.`}));
  };

  return <section {...cloudMotion} className="sm-lab">
    <header className="sm-toolbar">
      <div className="sm-sim-title"><span><Play size={20} fill="currentColor"/></span><div><h2>Run Simulation</h2><p>Send events from multiple producers through a streaming platform and see how partitions, consumers, and delivery semantics work.</p></div></div>
      <div className="sm-toolbar-actions">
        <label><span>Streaming Platform</span><select value={controls.platform} onChange={e=>patch("platform",e.target.value as StreamingPlatformId)}>{(Object.keys(streamingPlatforms) as StreamingPlatformId[]).map(id=><option key={id} value={id}>{streamingPlatforms[id].label}</option>)}</select></label>
        <button className="sm-run" onClick={run} disabled={running}><Play size={15}/>{running?"Running...":"Run Simulation"}</button>
        <button onClick={reset}><RefreshCcw size={15}/>Reset</button>
      </div>
    </header>

    <div className="sm-stage-grid">
      <article className="sm-card produce">
        <header><span>1</span><div><h3>Produce Events</h3><p>Generate events from multiple producers.</p></div></header>
        <div className="sm-card-body">
          <label>Event Type<select value={controls.eventType} onChange={e=>patch("eventType",e.target.value as EventTypeId)}>{(Object.keys(eventTypes) as EventTypeId[]).map(id=><option key={id} value={id}>{eventTypes[id].label}</option>)}</select></label>
          <label className="sm-slider"><span>Events per second <b>{controls.eventsPerSecond}</b></span><input type="range" min="1" max="50" value={controls.eventsPerSecond} onChange={e=>patch("eventsPerSecond",Number(e.target.value))}/></label>
          <label>Event Key (Partition Key)<select value={controls.partitionKey} onChange={e=>patch("partitionKey",e.target.value as PartitionKeyId)}>{(Object.keys(partitionKeys) as PartitionKeyId[]).map(id=><option key={id} value={id}>{partitionKeys[id]}</option>)}</select></label>
          <button className="sm-primary" onClick={run}><Play size={13} fill="currentColor"/>Start Producing</button>
        </div>
      </article>

      <div className="sm-arrow"><ChevronRight size={22}/></div>

      <article className="sm-card platform">
        <header><span>2</span><div><h3>Streaming Platform</h3><p>Events are partitioned and stored in a durable log.</p></div></header>
        <div className="sm-platform-head"><strong>{platform.short}</strong><em>{state.running?"Running":"Stopped"}</em></div>
        <label className="sm-slider sm-partitions"><span>{platform.partitionWord} <b>{controls.partitions}</b></span><input type="range" min="1" max="8" value={controls.partitions} onChange={e=>patch("partitions",Number(e.target.value))}/></label>
        <div className="sm-partition-list">{state.partitions.map(partition=><div key={partition.id} className={"p"+(partition.id%3)}><strong>Partition {partition.id}</strong><span>{Array.from({length:Math.min(5,Math.max(3,Math.round(partition.events/3)))},(_,i)=><i key={i}/>)}</span><small>{partition.events} events</small></div>)}</div>
      </article>

      <div className="sm-arrow"><ChevronRight size={22}/></div>

      <article className="sm-card consumers">
        <header><span>3</span><div><h3>Consumers</h3><p>Scale consumers and process events.</p></div></header>
        <div className="sm-card-body">
          <label>Consumer Group<select value={controls.consumerGroup} onChange={e=>patch("consumerGroup",e.target.value)}><option>order-processor</option><option>analytics-consumer</option><option>lake-sink</option></select></label>
          <label className="sm-slider"><span>Number of Consumers <b>{controls.consumers}</b></span><input type="range" min="1" max="8" value={controls.consumers} onChange={e=>patch("consumers",Number(e.target.value))}/></label>
          <div className="sm-consumer-grid">{state.consumers.map(consumer=><div key={consumer.id}><strong><i/>Consumer {consumer.id}</strong><small>Processing...</small><b>{consumer.rate} events/sec</b><em>Lag: {consumer.lag}</em></div>)}</div>
        </div>
      </article>

      <div className="sm-arrow"><ChevronRight size={22}/></div>

      <article className="sm-card output">
        <header><span>4</span><div><h3>Output (Processed Events)</h3><p>View processed events and metrics.</p></div></header>
        <div className="sm-output-tabs"><button className={outputTab==="events"?"active":""} onClick={()=>setOutputTab("events")}>Events</button><button className={outputTab==="metrics"?"active":""} onClick={()=>setOutputTab("metrics")}>Metrics</button></div>
        {outputTab==="events"?<EventJson events={state.events}/>:<div className="sm-metric-grid"><div><strong>{state.metrics.ingressRate}/s</strong><small>Ingress</small></div><div><strong>{state.metrics.processingRate}/s</strong><small>Processing</small></div><div><strong>{state.metrics.totalLag}</strong><small>Total Lag</small></div><div><strong>{state.metrics.retentionHours}h</strong><small>Retention</small></div></div>}
      </article>
    </div>

    <div className="sm-bottom-grid">
      <section className="sm-semantics">
        <header><h3>⚖ Delivery Semantics Comparison</h3><p>See how different delivery guarantees affect processing.</p></header>
        <div className="sm-semantic-grid">{deliverySemantics.map(item=><div key={item.id} className={item.tone}><strong>{item.label}</strong><ul>{item.bullets.map((bullet,index)=><li key={bullet}>{index===2&&item.id!=="exactly-once"?<XCircle size={14}/>:<CheckCircle2 size={14}/>}<span>{bullet}</span></li>)}</ul><small>Use case: {item.useCase}</small></div>)}</div>
      </section>

      <section className="sm-ordering">
        <header><h3>⬡ Partitioning &amp; Ordering</h3><p>Events with the same key go to the same partition, preserving order.</p></header>
        <div className="sm-order-body">
          <div><label>Key to test<input value={testKey} onChange={e=>setTestKey(e.target.value)}/></label><button className="sm-primary" onClick={sendEvent}><Send size={13}/>Send Event</button></div>
          <div className="sm-order-partitions">{Array.from({length:Math.min(3,controls.partitions)},(_,id)=><div key={id} className={lastPartition===id||keyPreview===id?"hit":""}><strong>Partition {id}</strong><span>{Array.from({length:5},(_,i)=><i key={i}>{(lastPartition===id||keyPreview===id)&&i<3?testKey:""}</i>)}</span></div>)}</div>
        </div>
      </section>

      <section className="sm-takeaways">
        <header><h3>💡 Key Takeaways</h3></header>
        <ol>
          <li><b>1</b><span>Streaming platforms decouple producers and consumers.</span></li>
          <li><b>2</b><span>Partitions provide parallelism and ordering within a key.</span></li>
          <li><b>3</b><span>Choose delivery semantics based on your use case.</span></li>
          <li><b>4</b><span>Consumers can scale independently.</span></li>
          <li><b>5</b><span>Managed services can simplify operations.</span></li>
        </ol>
      </section>
    </div>

    <footer className="sm-status"><span><Activity size={14}/>{state.status}</span><span>{platform.label} · {controls.partitions} partitions · {controls.consumers} consumers</span></footer>
  </section>;
}
