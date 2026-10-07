"use client";
import {useKafkaMotion} from "@/components/kafka-motion";

import {useMemo,useState} from "react";
import {
  Activity, AlertTriangle, CheckCircle2, CircleDot, Copy, Database, FileJson,
  Gauge, Play, RefreshCcw, Repeat2, Server, ShieldCheck, Sparkles, Users
} from "lucide-react";
import {
  clearReliabilityEvents, createReliabilityState, reliabilityScenarios,
  runReliabilitySimulation, setReliabilityOption, setReliabilityRetries,
  setReliabilityScenario, type ReliabilityScenarioId
} from "@/lib/kafka-reliability-production-simulation";

export function KafkaReliabilityProductionLab(){
 const kafkaMotion=useKafkaMotion();
  const [state,setState]=useState(()=>createReliabilityState());
  const [inspector,setInspector]=useState<"payload"|"headers"|"error"|"metadata">("payload");

  const failedPayload=useMemo(()=>JSON.stringify({
    orderId:state.failedMessage.order_id,
    customerId:state.failedMessage.customer_id,
    amount:state.failedMessage.amount,
    currency:state.failedMessage.currency,
    items:state.failedMessage.items,
    eventTime:state.failedMessage.eventTime,
    eventId:state.failedMessage.eventId
  },null,2),[state.failedMessage]);

  const reset=()=>{setState(createReliabilityState());setInspector("payload");};

  return <section {...kafkaMotion} className="krp-lab" aria-label="Kafka reliability and production patterns interactive simulation">
    <header className="krp-toolbar">
      <div className="krp-heading">
        <span><Play size={19} fill="currentColor"/></span>
        <div><h2>Interactive Simulation</h2><p>Tune a production pipeline for reliability and performance. Adjust settings, run the simulation and observe how events flow, fail, retry and get processed or sent to DLQ.</p></div>
      </div>
      <div className="krp-controls">
        <button onClick={reset}><RefreshCcw size={14}/>Reset</button>
        <label><span>Scenario</span><select value={state.scenario} onChange={e=>setState(s=>setReliabilityScenario(s,e.target.value as ReliabilityScenarioId))}>{reliabilityScenarios.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <button className="krp-run" onClick={()=>setState(s=>runReliabilitySimulation(s))}><Play size={14} fill="currentColor"/>Run Simulation</button>
      </div>
    </header>

    <div className="krp-policy-row">
      <button className="green" aria-pressed={state.acksAll} onClick={()=>setState(s=>setReliabilityOption(s,"acksAll",!s.acksAll))}><ShieldCheck size={17}/><span><strong>Acks = {state.acksAll?"all":"1"}</strong><small>Durable writes</small></span></button>
      <button className="purple" aria-pressed={state.idempotentProducer} onClick={()=>setState(s=>setReliabilityOption(s,"idempotentProducer",!s.idempotentProducer))}><Sparkles size={17}/><span><strong>Idempotent Producer = {state.idempotentProducer?"On":"Off"}</strong><small>Prevent duplicates</small></span></button>
      <button className="blue" onClick={()=>setState(s=>setReliabilityRetries(s,(s.retries%5)+1))}><Repeat2 size={17}/><span><strong>Retries = {state.retries}</strong><small>With exponential backoff</small></span></button>
      <button className="pink" aria-pressed={state.dlqEnabled} onClick={()=>setState(s=>setReliabilityOption(s,"dlqEnabled",!s.dlqEnabled))}><FileJson size={17}/><span><strong>DLQ = {state.dlqEnabled?"Enabled":"Disabled"}</strong><small>Handle poison messages</small></span></button>
      <button className="orange" aria-pressed={!state.autoCommit} onClick={()=>setState(s=>setReliabilityOption(s,"autoCommit",!s.autoCommit))}><Database size={17}/><span><strong>Auto Commit = {state.autoCommit?"On":"Off"}</strong><small>{state.autoCommit?"Automatic":"Manual"} control</small></span></button>
    </div>

    <div className="krp-pipeline">
      <article className="krp-stage producer">
        <header><span><Sparkles size={17}/></span><div><h3>Producer</h3><small><CircleDot size={9}/>Active</small></div></header>
        <p>Produces order events with unique keys</p>
        <div className="krp-stage-stat"><span>Send Rate</span><strong>{state.sendRate} msg/s</strong><i style={{height:"70%"}}/><i style={{height:"85%"}}/><i style={{height:"100%"}}/></div>
        <footer><span>Delivery Policy</span><b>{state.acksAll?"acks=all":"acks=1"}, idempotent={state.idempotentProducer?"on":"off"}</b></footer>
      </article>

      <div className="krp-arrow">→</div>

      <article className="krp-stage brokers">
        <header><span><Server size={17}/></span><div><h3>Kafka Topic / Brokers</h3><small><CircleDot size={9}/>Healthy</small></div></header>
        <p>orders topic ({state.partitions} partitions) with replication factor {state.replicationFactor}</p>
        <dl><div><dt>Partitions</dt><dd><b>P0</b><b>P1</b><b>P2</b></dd></div><div><dt>Leader replicas</dt><dd className="dots">● ● ●</dd></div><div><dt>ISR (in-sync replicas)</dt><dd>{state.isr} / {state.replicationFactor}</dd></div></dl>
        <div className="krp-stage-stat"><span>Throughput</span><strong>{state.throughput} msg/s</strong><i style={{height:"55%"}}/><i style={{height:"78%"}}/><i style={{height:"94%"}}/></div>
      </article>

      <div className="krp-arrow">→</div>

      <article className="krp-stage consumer">
        <header><span><Users size={17}/></span><div><h3>Consumer Group</h3><small><CircleDot size={9}/>Running</small></div></header>
        <p>Processes orders with business logic</p>
        <div className="krp-value-row"><span>Processed</span><strong>{state.processed}</strong><i className="bars green"/></div>
        <div className="krp-value-row"><span>Failed</span><strong>{state.failed}</strong><i className="bars pink"/></div>
        <div className="krp-value-row"><span>Consumer Lag</span><strong>{state.consumerLag}</strong><i className="bars blue"/></div>
      </article>

      <div className="krp-arrow">→</div>

      <article className="krp-stage retry">
        <header><span><Repeat2 size={17}/></span><div><h3>Retry &amp; DLQ</h3><small><CircleDot size={9}/>Enabled</small></div></header>
        <p>Handles failed messages with retries and DLQ</p>
        <div className="krp-value-row"><span>Retry Attempts</span><strong>{state.retryAttempts} / {state.retries}</strong><i className="bars orange"/></div>
        <div className="krp-value-row"><span>In Retry Queue</span><strong>{state.retryQueue}</strong><i className="line pink"/></div>
        <div className="krp-value-row"><span>DLQ Messages</span><strong>{state.dlqMessages}</strong><i className="bars pink"/></div>
      </article>

      <div className="krp-arrow">→</div>

      <article className="krp-stage monitoring">
        <header><span><Activity size={17}/></span><div><h3>Monitoring / Metrics</h3><small><CircleDot size={9}/>Healthy</small></div></header>
        <p>Real-time observability and alerts</p>
        <div className="krp-value-row"><span>Avg Latency</span><strong>{state.avgLatencyMs} ms</strong><i className="bars blue"/></div>
        <div className="krp-value-row"><span>Error Rate</span><strong>{state.errorRate}%</strong><i className="bars pink"/></div>
        <div className="krp-value-row"><span>Throughput</span><strong>{state.throughput} msg/s</strong><i className="bars blue"/></div>
        <footer><span>Status</span><b><CheckCircle2 size={12}/>All Good</b></footer>
      </article>
    </div>

    <div className="krp-middle-grid">
      <section className="krp-event-log">
        <header><h3>Event Log <span>(Live Timeline)</span></h3><small><CircleDot size={9}/>Streaming...</small><button onClick={()=>setState(s=>clearReliabilityEvents(s))}>Clear</button></header>
        <ol>{state.events.length?state.events.slice(-10).map(event=><li key={event.id}><time>{event.time}</time><i/><b className={"role-"+event.role.toLowerCase()}>{event.role}</b><span>{event.text}</span></li>):<li className="krp-empty">No events yet. Run the simulation.</li>}</ol>
      </section>

      <section className="krp-metrics-panel">
        <header><h3>Reliability Metrics</h3><span><CircleDot size={9}/>Live</span></header>
        <div>
          <article><span><Users size={16}/></span><div><small>Consumer Lag</small><strong>{state.consumerLag}</strong><em>↓ 60%</em></div></article>
          <article><span><Gauge size={16}/></span><div><small>Avg Latency</small><strong>{state.avgLatencyMs} ms</strong><em>↘</em></div></article>
          <article><span><AlertTriangle size={16}/></span><div><small>Error Rate</small><strong>{state.errorRate}%</strong><em>↓ 72%</em></div></article>
          <article><span><Repeat2 size={16}/></span><div><small>Retry Queue</small><strong>{state.retryQueue}</strong><em>↑ 0%</em></div></article>
          <article><span><Database size={16}/></span><div><small>DLQ Count</small><strong>{state.dlqMessages}</strong><em>↑ 0%</em></div></article>
          <article><span><CheckCircle2 size={16}/></span><div><small>Broker Health</small><strong>{state.brokerHealth} / 3</strong><em>Healthy</em></div></article>
        </div>
      </section>

      <section className="krp-inspector">
        <header><h3>Message / Failure Inspector</h3><select><option>Failed Message (DLQ)</option></select></header>
        <div className="krp-inspector-tabs">
          {(["payload","headers","error","metadata"] as const).map(tab=><button key={tab} className={inspector===tab?"active":""} onClick={()=>setInspector(tab)}>{tab==="error"?"Error Details":tab[0].toUpperCase()+tab.slice(1)}</button>)}
        </div>
        <div className="krp-inspector-body">
          {inspector==="payload"&&<><button className="copy" onClick={()=>navigator.clipboard?.writeText(failedPayload)}><Copy size={12}/>Copy</button><pre>{failedPayload}</pre></>}
          {inspector==="headers"&&<pre>{JSON.stringify({"content-type":"application/json","x-event-id":state.failedMessage.eventId,"retry-count":state.failedMessage.retryCount},null,2)}</pre>}
          {inspector==="error"&&<pre>{JSON.stringify({error:state.failedMessage.error,retryCount:state.failedMessage.retryCount,dlqEnabled:state.dlqEnabled},null,2)}</pre>}
          {inspector==="metadata"&&<pre>{JSON.stringify({topic:"orders.DLQ",partition:0,offset:4812,consumerGroup:"orders-v1"},null,2)}</pre>}
        </div>
        <footer><span><CheckCircle2 size={11}/>Schema Valid</span><span><ShieldCheck size={11}/>Idempotent</span><span><Repeat2 size={11}/>Retryable</span><span><AlertTriangle size={11}/>In DLQ</span></footer>
      </section>
    </div>

    <div className="krp-bottom-grid">
      <section className="best"><header><CheckCircle2 size={16}/><h3>Best Practices</h3></header><ul>{[
        "Use acks=all with replication for durability",
        "Enable idempotent producer to avoid duplicates",
        "Configure reasonable retries with exponential backoff",
        "Use DLQ for poison messages",
        "Monitor consumer lag, error rate and broker health"
      ].map(item=><li key={item}><CheckCircle2 size={11}/>{item}</li>)}</ul></section>
      <section className="failure"><header><AlertTriangle size={16}/><h3>Common Failure Modes</h3></header><ul>{[
        "Message loss with acks=1 or acks=0",
        "Duplicate messages without idempotency",
        "Infinite retry loops without backoff limits",
        "Poison messages blocking consumer progress",
        "High consumer lag due to slow processing",
        "Broker failures and under-replicated partitions"
      ].map(item=><li key={item}><i/> {item}</li>)}</ul></section>
      <section className="takeaways"><header><Sparkles size={16}/><h3>Key Takeaways</h3></header><ul>{[
        "Use acks=all and idempotent producer for reliable delivery",
        "Implement retries with exponential backoff",
        "Send poison messages to a DLQ",
        "Monitor lag, latency, error rate and broker health",
        "Tune partition count and consumer parallelism",
        "Set up alerts for critical metrics in production"
      ].map(item=><li key={item}><i/> {item}</li>)}</ul></section>
    </div>

    <footer className="krp-status"><span><CircleDot size={11}/>Live</span><p>{state.status}</p><span>{state.brokerHealth}/3 brokers · {state.consumerLag} lag · {state.dlqMessages} DLQ</span></footer>
  </section>;
}
