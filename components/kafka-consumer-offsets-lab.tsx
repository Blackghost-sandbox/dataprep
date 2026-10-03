"use client";

import {useMemo,useState} from "react";
import {
  CheckCircle2, CircleDot, Database, Play, RefreshCcw, Settings2, Sparkles, UserRound
} from "lucide-react";
import {
  clearConsumerOffsetEvents, commitConsumerOffset, createConsumerOffsetsState,
  currentOffsetRecord, offsetProgress, offsetScenarios, processOffsetMessage,
  runConsumerOffsetsScenario, setOffsetAutoAdvance, setOffsetAutoCommit,
  setOffsetScenario, type OffsetScenarioId
} from "@/lib/kafka-consumer-offsets-simulation";

export function KafkaConsumerOffsetsLab(){
  const [state,setState]=useState(()=>createConsumerOffsetsState());
  const record=currentOffsetRecord(state);
  const progress=useMemo(()=>offsetProgress(state),[state]);

  const run=()=>setState(s=>runConsumerOffsetsScenario(s));
  const reset=()=>setState(createConsumerOffsetsState());

  return <section className="kco-lab" aria-label="Kafka consumer offsets interactive simulation">
    <header className="kco-toolbar">
      <div className="kco-heading">
        <span><Play size={19} fill="currentColor"/></span>
        <div>
          <h2>Interactive Simulation</h2>
          <p>Consume messages from a partition, process them, and commit offsets. See how the next offset, committed offset and fetch position change.</p>
        </div>
      </div>
      <div className="kco-controls">
        <button className="kco-run" onClick={run}><Play size={14} fill="currentColor"/>Run</button>
        <button onClick={reset}><RefreshCcw size={14}/>Reset</button>
        <label><span>Scenario</span><select value={state.scenario} onChange={e=>setState(s=>setOffsetScenario(s,e.target.value as OffsetScenarioId))}>{offsetScenarios.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label className="kco-switch"><input type="checkbox" checked={state.autoAdvance} onChange={e=>setState(s=>setOffsetAutoAdvance(s,e.target.checked))}/><i/><b>Auto advance</b></label>
      </div>
    </header>

    <div className="kco-main-grid">
      <article className="kco-topic">
        <header><span><Database size={18}/></span><h3>Kafka Topic: <strong>orders</strong></h3></header>
        <section className="kco-partition-card">
          <header><span><Database size={15}/></span><div><strong>Partition 1</strong><p>Messages (offsets 208 - 215)</p></div></header>
          <div className="kco-offset-strip">
            {state.records.map(item=>{
              const cls=item.offset<=state.lastProcessed?"processed":item.offset===state.fetchPosition?"current":item.offset<state.committedOffset?"committed":item.offset===state.committedOffset?"next":"available";
              return <button key={item.offset} className={cls} aria-current={item.offset===state.fetchPosition?"true":undefined} onClick={()=>setState(s=>({...s,fetchPosition:item.offset,processingStep:1,status:`Fetch position moved to offset ${item.offset} for inspection.`}))}>
                {item.offset<=state.lastProcessed&&<CheckCircle2 size={11}/>}<b>{item.offset}</b>
              </button>;
            })}
          </div>
          <div className="kco-loop-arrow" aria-hidden="true">↪</div>
        </section>
        <div className="kco-legend">
          <span><i className="processed"/>Processed</span>
          <span><i className="current"/>Current (fetched)</span>
          <span><i className="not-fetched"/>Not yet fetched</span>
          <span><i className="available"/>Available</span>
        </div>
      </article>

      <article className="kco-consumer">
        <header><span><UserRound size={18}/></span><h3>Consumer (C1)</h3><small><CircleDot size={10}/>Running</small></header>
        <dl>
          <div><dt>Group ID</dt><dd>analytics-group</dd></div>
          <div><dt>Partition</dt><dd>1</dd></div>
          <div className="highlight-purple"><dt>Fetch position</dt><dd>{state.fetchPosition}</dd></div>
          <div><dt>Last processed</dt><dd>{state.lastProcessed}</dd></div>
          <div className="highlight-green"><dt>Committed offset</dt><dd>{state.committedOffset}</dd></div>
        </dl>
      </article>

      <article className="kco-processing">
        <header><span><Settings2 size={17}/></span><h3>Processing &amp; Commit</h3></header>
        <ol>
          <li className={state.processingStep===1?"is-active":""}><b>1</b><span>Fetch message (offset {state.fetchPosition})</span></li>
          <li className={state.processingStep===2?"is-active":""}><b>2</b><span>Process message</span>{state.processingStep===2&&<i className="kco-spinner"/>}</li>
          <li className={state.processingStep===3?"is-active":""}><b>3</b><span>Commit next offset ({state.lastProcessed+1})</span></li>
        </ol>
        <button className="kco-process" onClick={()=>setState(s=>processOffsetMessage({...s,processingStep:2}))}><Play size={14} fill="currentColor"/>Process Message</button>
        <label className="kco-autocommit"><input type="checkbox" checked={state.autoCommit} onChange={e=>setState(s=>setOffsetAutoCommit(s,e.target.checked))}/><span>Auto commit (like enable.auto.commit)</span></label>
        <button className="kco-commit" onClick={()=>setState(s=>commitConsumerOffset(s))}>Commit Offset</button>
      </article>
    </div>

    <div className="kco-lower-grid">
      <section className="kco-details">
        <header><span><Sparkles size={16}/></span><h3>Message Details <small>(offset {record?.offset??state.fetchPosition})</small></h3></header>
        {record?<pre>{JSON.stringify({
          order_id:record.order_id,
          customer_id:record.customer_id,
          amount:record.amount,
          product:record.product,
          event_time:record.event_time
        },null,2)}</pre>:<p>No retained message at this fetch position.</p>}
      </section>

      <section className="kco-event-log">
        <header><h3>Event Log <span>(Live)</span></h3><button onClick={()=>setState(s=>clearConsumerOffsetEvents(s))}>Clear</button></header>
        <ol>{state.events.length?state.events.slice(-7).map(event=><li key={event.id}><i/><time>{event.time}</time><b className={"role-"+event.role.toLowerCase()}>{event.role}</b><span>{event.text}</span></li>):<li className="kco-empty-log">No events yet. Run or process a message.</li>}</ol>
      </section>

      <section className="kco-progress">
        <header><span><Database size={16}/></span><h3>Offset Progress</h3></header>
        <div className="kco-progress-line">
          <article><i className="done"/><span>Last processed offset</span><b>{progress.lastProcessed}</b></article>
          <article><i className="commit"/><span>Committed offset</span><b>{progress.committed}</b></article>
          <article><i className="next"/><span>Next offset (to fetch)</span><b>{progress.nextToFetch}</b></article>
        </div>
        <div className="kco-tip"><Sparkles size={14}/><p>After processing offset N, the consumer commits N+1. On restart, it will fetch from the committed offset while that record is retained.</p></div>
      </section>
    </div>

    <footer className="kco-status"><span><CircleDot size={11}/>Running</span><p>{state.status}</p><span>P1 · group analytics-group</span></footer>
  </section>;
}
