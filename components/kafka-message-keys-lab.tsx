"use client";

import {useMemo,useState} from "react";
import {
  CheckCircle2, CircleDot, Database, Play, RefreshCcw, Send, Sparkles
} from "lucide-react";
import {
  appendBatch, appendKeyedMessage, calculateKeyPartition, clearKeyEvents,
  createMessageKeysState, hashModes, keyMapping, partitionStats, quickKeys,
  reconfigureMessageKeys, selectKeyedMessage,
  type PartitionCount, type PartitionHashMode, type ProducerMode
} from "@/lib/kafka-message-keys-simulation";

const tones=["blue","orange","pink","green","violet","cyan"] as const;

export function KafkaMessageKeysLab(){
  const [state,setState]=useState(()=>createMessageKeysState());
  const [mode,setMode]=useState<ProducerMode>("single");
  const [messageKey,setMessageKey]=useState("customer_101");
  const [messageValue,setMessageValue]=useState("OrderCreated - $499");
  const [batch,setBatch]=useState("customer_101|OrderCreated - $499\ncustomer_202|PaymentProcessed\ncustomer_101|OrderShipped\ncustomer_303|InventoryReserved");
  const mapping=useMemo(()=>keyMapping(state),[state]);
  const stats=useMemo(()=>partitionStats(state),[state]);

  const send=()=>{
    if(mode==="batch")setState(s=>appendBatch(s,batch));
    else setState(s=>appendKeyedMessage(s,messageKey,messageValue));
  };
  const run=()=>setState(s=>appendKeyedMessage(s,messageKey,messageValue));
  const reset=()=>{
    setState(createMessageKeysState());
    setMode("single");
    setMessageKey("customer_101");
    setMessageValue("OrderCreated - $499");
  };
  const changeHash=(hashMode:PartitionHashMode)=>setState(s=>reconfigureMessageKeys(s,s.partitionCount,hashMode));
  const changePartitions=(count:PartitionCount)=>setState(s=>reconfigureMessageKeys(s,count,s.hashMode));

  const previewPartition=calculateKeyPartition(
    messageKey.trim()===""||messageKey==="null (no key)"?null:messageKey,
    state.partitionCount,
    state.hashMode,
    state.roundRobin
  );

  return <section className="kmk-lab" aria-label="Kafka message keys and partitioning interactive simulation">
    <header className="kmk-toolbar">
      <div className="kmk-heading">
        <span><Play size={19} fill="currentColor"/></span>
        <div><h2>Interactive Simulation</h2><p>Send messages with different keys and see how they always map to the same partition.</p></div>
      </div>
      <div className="kmk-controls">
        <button className="kmk-run" onClick={run}><Play size={14} fill="currentColor"/>Run</button>
        <button onClick={reset}><RefreshCcw size={14}/>Reset</button>
        <label><span>Hash Function</span><select value={state.hashMode} onChange={e=>changeHash(e.target.value as PartitionHashMode)}>{hashModes.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <fieldset><legend>Number of partitions</legend><div>{([3,4,6] as const).map(count=><button key={count} aria-pressed={state.partitionCount===count} onClick={()=>changePartitions(count)}>{count}</button>)}</div></fieldset>
      </div>
    </header>

    <div className="kmk-main-grid">
      <article className="kmk-producer">
        <header><span><Send size={17}/></span><h3>Produce Messages</h3></header>
        <div className="kmk-mode-tabs">
          <button className={mode==="single"?"is-active":""} onClick={()=>setMode("single")}>Single Message</button>
          <button className={mode==="batch"?"is-active":""} onClick={()=>setMode("batch")}>Batch Messages</button>
        </div>
        {mode==="single"?<>
          <label>Message key<input value={messageKey} onChange={e=>setMessageKey(e.target.value)}/></label>
          <label>Message value<input value={messageValue} onChange={e=>setMessageValue(e.target.value)}/></label>
          <p className="kmk-preview">Preview route: <strong>{messageKey||"null"} → P{previewPartition}</strong></p>
        </>:<>
          <label>Batch <small>key|value, one per line</small><textarea value={batch} onChange={e=>setBatch(e.target.value)} spellCheck={false}/></label>
        </>}
        <button className="kmk-send" onClick={send}><Send size={14}/>{mode==="batch"?"Send Batch":"Send Message"}</button>
        <h4>Quick Keys <small>(try these)</small></h4>
        <div className="kmk-quick-keys">{quickKeys.map((key,index)=><button key={key+"-"+index} onClick={()=>{setMode("single");setMessageKey(key);}}>{key}</button>)}</div>
      </article>

      <article className="kmk-topic">
        <header><span><Database size={18}/></span><h3>Kafka Topic: <strong>orders</strong></h3><small><Sparkles size={11}/>Live</small></header>
        <div className="kmk-topic-body">
          <div className="kmk-message-stack">
            {state.messages.slice(-5).map((message,index)=>{
              const tone=tones[message.partition%tones.length];
              return <button key={message.id} className={"kmk-message "+tone+(state.selected?.id===message.id?" is-selected":"")} onClick={()=>setState(s=>selectKeyedMessage(s,message.id))}>
                <span><Database size={14}/></span><div><strong>{message.key??"null"}</strong><small>{message.value.split(" - ")[0]}</small></div><i>→ P{message.partition}</i>
              </button>;
            })}
          </div>
          <div className="kmk-partitions">
            <h4>Partitions</h4>
            {state.logs.map((rows,partition)=>{
              const tone=tones[partition%tones.length];
              return <section className={"kmk-partition "+tone} key={partition}>
                <header><span><Database size={14}/></span><strong>Partition {partition}</strong></header>
                <div>{rows.slice(-3).map(message=><button key={message.id} onClick={()=>setState(s=>selectKeyedMessage(s,message.id))}>{message.key??"null"}</button>)}</div>
              </section>;
            })}
          </div>
        </div>
      </article>

      <article className="kmk-mapping">
        <header><span><Database size={17}/></span><h3>Partition Mapping</h3></header>
        <table><thead><tr><th>Key</th><th>Partition</th></tr></thead><tbody>{mapping.map((row,index)=><tr key={row.key+"-"+index}><td>{row.key}</td><td><b className={"tone-"+row.partition}> {row.partition} </b></td></tr>)}</tbody></table>
        <div className="kmk-rule"><CheckCircle2 size={20}/><div><strong>Same key → Same partition</strong><p>All messages with the same key always go to the same partition while partition count and partitioner stay unchanged.</p></div></div>
      </article>
    </div>

    <div className="kmk-lower-grid">
      <section className="kmk-event-log">
        <header><h3>Event Log <span>(Live)</span></h3><button onClick={()=>setState(s=>clearKeyEvents(s))}>Clear</button></header>
        <ol>{state.events.length?state.events.slice(-7).map(event=><li key={event.id}><i/><time>{event.time}</time><b className={"role-"+event.role.toLowerCase()}>{event.role}</b><span>{event.text}</span></li>):<li className="kmk-empty-log">No events yet. Run or send a message.</li>}</ol>
      </section>

      <section className="kmk-inspector">
        <header><h3>Message Inspector</h3></header>
        {state.selected?<pre>{JSON.stringify({
          key:state.selected.key,
          value:state.selected.value,
          partition:state.selected.partition,
          offset:state.selected.offset,
          timestamp:state.selected.timestamp
        },null,2)}</pre>:<p>Select a message to inspect it.</p>}
      </section>

      <section className="kmk-stats">
        <header><h3>Partition Stats</h3></header>
        <div>{stats.map(item=><article key={item.partition} className={"tone-"+item.partition}><div><strong>Partition {item.partition}</strong><span>{item.count} msgs</span></div><div className="kmk-bar"><i style={{width:item.percent+"%"}}/></div><b>{item.percent}%</b></article>)}</div>
      </section>
    </div>

    <footer className="kmk-status"><span><CircleDot size={11}/>Live</span><p>{state.status}</p><span>{state.partitionCount} partitions · {hashModes.find(item=>item.id===state.hashMode)?.label}</span></footer>
  </section>;
}
