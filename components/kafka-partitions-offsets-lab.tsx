"use client";

import {useMemo,useState} from "react";
import {
  Boxes, ChevronRight, CircleDot, Database, Play, RadioTower, RefreshCcw,
  RotateCcw, Send, Sparkles, Zap
} from "lucide-react";
import {
  clearOffsetEvents, consumeOffsetMessages, createOffsetLabState, offsetScenarioCatalog,
  partitionDetails, produceOffsetMessage, runOffsetScenario, withConsumerPartition,
  withPartitionCount, withSelectedPartition, withStartOffset,
  type OffsetScenarioId, type StartOffsetMode
} from "@/lib/kafka-partitions-offsets-simulation";

const partitionTone=["blue","orange","pink"] as const;

export function KafkaPartitionsOffsetsLab(){
  const [state,setState]=useState(()=>createOffsetLabState(3));
  const [scenario,setScenario]=useState<OffsetScenarioId>("normal");
  const [messageValue,setMessageValue]=useState("OrderCreated");
  const [messageKey,setMessageKey]=useState("customer_101");

  const selectedRows=state.logs[state.selectedPartition]??[];
  const details=useMemo(()=>partitionDetails(state,state.selectedPartition),[state,state.selectedPartition]);
  const previewTimestamp="2026-10-02 10:24:"+String(15+state.sequence).padStart(2,"0");

  const reset=()=>setState(createOffsetLabState(state.partitionCount));
  const run=()=>setState(s=>runOffsetScenario(s,scenario,messageValue,messageKey));
  const send=()=>setState(s=>produceOffsetMessage(s,messageValue,messageKey));
  const consume=()=>setState(s=>consumeOffsetMessages(s));

  return <section className="kpo-lab" aria-label="Kafka partitions and offsets interactive simulation">
    <header className="kpo-toolbar">
      <div className="kpo-heading">
        <span><Play size={19} fill="currentColor"/></span>
        <div>
          <h2>Interactive Simulation</h2>
          <p>Produce messages to a topic with multiple partitions and see how they are stored with offsets. Then consume from different offsets.</p>
        </div>
      </div>
      <div className="kpo-top-actions">
        <button className="kpo-run" onClick={run}><Play size={14} fill="currentColor"/>Run</button>
        <button onClick={reset}><RefreshCcw size={14}/>Reset</button>
        <label><span>Scenario</span><select value={scenario} onChange={e=>setScenario(e.target.value as OffsetScenarioId)}>{offsetScenarioCatalog.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <div className="kpo-partition-count"><span>Partitions</span><div>{[1,2,3].map(count=><button key={count} aria-pressed={state.partitionCount===count} onClick={()=>setState(s=>withPartitionCount(s,count))}>{count}</button>)}</div></div>
      </div>
    </header>

    <div className="kpo-main-grid">
      <article className="kpo-producer">
        <header><span><RadioTower size={18}/></span><div><h3>Producer</h3><p>Send messages to a topic</p></div></header>
        <label>Message value<input value={messageValue} onChange={e=>setMessageValue(e.target.value)} /></label>
        <label>Message key <small>(optional)</small><input value={messageKey} onChange={e=>setMessageKey(e.target.value)} /></label>
        <button className="kpo-send" onClick={send}><Send size={15}/>Send Message</button>
        <h4>Message Preview</h4>
        <pre>{JSON.stringify({key:messageKey||null,value:messageValue,timestamp:previewTimestamp},null,2)}</pre>
      </article>

      <div className="kpo-arrow kpo-arrow-left" aria-hidden="true"><i/><ChevronRight size={22}/></div>

      <article className="kpo-topic">
        <header><span><Database size={18}/></span><h3>Kafka Topic: <strong>orders</strong></h3><small><Sparkles size={11}/>Live</small></header>
        <div className="kpo-partition-stack">
          {state.logs.map((rows,partition)=>{
            const tone=partitionTone[partition]??"blue";
            return <button key={partition} className={"kpo-partition "+tone+(state.selectedPartition===partition?" is-selected":"")} onClick={()=>setState(s=>withSelectedPartition(s,partition))}>
              <div className="kpo-partition-label"><span>P{partition}</span><div><strong>Partition {partition}</strong><small>Next offset: {rows.length}</small></div></div>
              <div className="kpo-records">
                {rows.slice(-3).map(record=><span key={record.offset}><b>{record.offset}</b><em>{record.value}</em></span>)}
                {Array.from({length:Math.max(0,3-rows.slice(-3).length)}).map((_,i)=><span className="kpo-empty" key={"empty-"+i}>+</span>)}
              </div>
            </button>;
          })}
        </div>
      </article>

      <div className="kpo-arrow kpo-arrow-right" aria-hidden="true"><i/><ChevronRight size={22}/></div>

      <article className="kpo-consumer">
        <header><span><Boxes size={18}/></span><div><h3>Consumer</h3><p>Read messages from a partition</p></div></header>
        <div className="kpo-consumer-fields">
          <label>Partition<select value={state.consumePartition} onChange={e=>setState(s=>withConsumerPartition(s,Number(e.target.value)))}>{state.logs.map((_,p)=><option key={p} value={p}>{p}</option>)}</select></label>
          <label>Start offset<select value={state.startOffset} onChange={e=>setState(s=>withStartOffset(s,e.target.value as StartOffsetMode))}><option value="latest">Latest</option><option value="earliest">Earliest</option></select></label>
        </div>
        <button className="kpo-consume" onClick={consume}><Play size={14} fill="currentColor"/>Consume Messages</button>
        <h4>Consumed Messages</h4>
        <div className="kpo-consumed">
          {state.consumed.length?state.consumed.slice(-4).map(record=><button key={record.partition+"-"+record.offset} onClick={()=>setState(s=>withSelectedPartition(s,record.partition))}><b className={"tone-"+record.partition}>{record.offset}</b><span>{record.value}</span></button>):<p>No messages consumed yet.</p>}
        </div>
      </article>
    </div>

    <div className="kpo-lower-grid">
      <section className="kpo-event-log">
        <header><h3>Event Log <span>(Live)</span></h3><button onClick={()=>setState(s=>clearOffsetEvents(s))}>Clear</button></header>
        <ol>{state.events.length?state.events.slice(-6).reverse().map(event=><li key={event.id}><i/><time>{event.time}</time><b className={"role-"+event.role.toLowerCase()}>{event.role}</b><span>{event.text}</span></li>):<li className="kpo-empty-log">No events yet. Run, send, or consume to create a trace.</li>}</ol>
      </section>

      <section className="kpo-details">
        <header><h3>Partition Details</h3><select value={state.selectedPartition} onChange={e=>setState(s=>withSelectedPartition(s,Number(e.target.value)))}>{state.logs.map((_,p)=><option key={p} value={p}>Partition {p}</option>)}</select></header>
        <dl>
          <div><dt>Latest offset</dt><dd>{details.latestOffset}</dd></div>
          <div><dt>Messages</dt><dd>{details.messages}</dd></div>
          <div><dt>Earliest offset</dt><dd>{details.earliestOffset}</dd></div>
          <div><dt>Log end offset</dt><dd>{details.logEndOffset}</dd></div>
          <div><dt>Size (approx)</dt><dd>{details.approxKb} KB</dd></div>
        </dl>
      </section>

      <section className="kpo-message-list">
        <header><h3>Messages in Partition {state.selectedPartition}</h3></header>
        <div>{selectedRows.length?selectedRows.slice(-5).map(record=><article key={record.offset}><b className={"tone-"+record.partition}>{record.offset}</b><span>{record.value}</span><time>{record.timestamp}</time></article>):<p>No records in this partition.</p>}</div>
      </section>
    </div>

    <footer className="kpo-status"><span><CircleDot size={11}/>Live simulation</span><p>{state.status}</p><button onClick={run}><RotateCcw size={13}/>Run again</button></footer>
  </section>;
}
