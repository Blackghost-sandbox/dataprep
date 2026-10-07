"use client";
import {useKafkaMotion} from "@/components/kafka-motion";

import {useMemo,useState} from "react";
import {
  CheckCircle2, CircleDot, Database, GitBranch, Play, RefreshCcw,
  ShieldCheck, Users
} from "lucide-react";
import {
  clearDeliveryEvents, createDeliveryState, deliveryModes, deliveryScenarios,
  runDeliverySimulation, setDeliveryMode, setDeliveryScenario, setDeliverySpeed,
  type DeliveryMode, type DeliveryScenario, type SimulationSpeed
} from "@/lib/kafka-ordering-delivery-simulation";

export function KafkaOrderingDeliveryLab(){
 const kafkaMotion=useKafkaMotion();
  const [state,setState]=useState(()=>createDeliveryState());
  const p0Records=useMemo(()=>state.records.filter(record=>record.partition===0).slice(-5),[state.records]);
  const mode=deliveryModes.find(item=>item.id===state.mode)!;

  const reset=()=>setState(createDeliveryState());
  const run=()=>setState(s=>runDeliverySimulation({...s,running:true}));

  return <section {...kafkaMotion} className="kod-lab" aria-label="Kafka ordering and delivery semantics interactive simulation">
    <header className="kod-toolbar">
      <div className="kod-heading">
        <span><Play size={19} fill="currentColor"/></span>
        <div>
          <h2>Interactive Simulation</h2>
          <p>Simulate how Kafka preserves ordering within a partition and how delivery guarantees behave during retries and failures.</p>
        </div>
      </div>
      <div className="kod-controls">
        <button onClick={reset}><RefreshCcw size={14}/>Reset</button>
        <label><span>Scenario</span><select value={state.scenario} onChange={e=>setState(s=>setDeliveryScenario(s,e.target.value as DeliveryScenario))}>{deliveryScenarios.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <button className="kod-run" onClick={run}><Play size={14} fill="currentColor"/>Run Simulation</button>
      </div>
    </header>

    <div className="kod-mode-speed-row">
      <div className="kod-modes">
        {deliveryModes.map(item=><button key={item.id} className={state.mode===item.id?"active":""} onClick={()=>setState(s=>setDeliveryMode(s,item.id as DeliveryMode))}>{item.label}</button>)}
      </div>
      <div className="kod-speed"><span>Speed:</span>{(["slow","normal","fast"] as const).map(speed=><button key={speed} className={state.speed===speed?"active":""} onClick={()=>setState(s=>setDeliverySpeed(s,speed as SimulationSpeed))}>{speed[0].toUpperCase()+speed.slice(1)}</button>)}</div>
    </div>

    <div className="kod-main-grid">
      <div className="kod-diagram">
        <article className="kod-producer">
          <header><span><GitBranch size={18}/></span><h3>Producer</h3></header>
          <p>Sends records<br/>to a topic</p>
          <pre>{JSON.stringify({order_id:state.currentOrder,amount:499,product:"Laptop"},null,2)}</pre>
          <footer><span>Current key</span><b>user-77</b></footer>
        </article>

        <div className="kod-arrow">→</div>

        <article className="kod-topic">
          <header><span><Database size={18}/></span><h3>Topic (orders)</h3></header>
          <div className="kod-partitions">
            {[0,1,2].map(partition=>{
              const records=state.records.filter(record=>record.partition===partition).slice(-3);
              return <section key={partition} className={state.selectedPartition===partition?"selected":""}>
                <header><Database size={13}/><strong>Partition {partition}</strong></header>
                <div>{records.map(record=><button key={record.id} className={record.status}><small>{record.offset}</small><b>{record.id}</b></button>)}</div>
              </section>;
            })}
          </div>
          <footer><span>Ordering is guaranteed</span><strong>within each partition</strong></footer>
        </article>

        <div className="kod-arrow">→</div>

        <article className="kod-consumers">
          <header><span><Users size={18}/></span><h3>Consumer Group</h3></header>
          <p>Reads records from partitions</p>
          <div>{[1,2,3].map(id=><button key={id} className={id===1?"active":""}><Users size={13}/>Consumer {id}</button>)}</div>
          <footer><span>P0 owner</span><b>Consumer 1</b></footer>
        </article>
      </div>

      <aside className="kod-guarantees">
        <header><span><ShieldCheck size={17}/></span><h3>Delivery Guarantees</h3></header>
        {deliveryModes.map(item=><button key={item.id} className={state.mode===item.id?"active":""} onClick={()=>setState(s=>setDeliveryMode(s,item.id as DeliveryMode))}>
          <span className="radio">{state.mode===item.id&&<i/>}</span>
          <div><strong>{item.label}</strong><p>{item.subtitle}</p></div>
        </button>)}
        <div className="kod-guarantee-note"><CheckCircle2 size={15}/><p>{state.mode==="exactly-once"?"Kafka transactions can coordinate Kafka output records and consumed offsets. External side effects still require sink support or idempotency.":mode.subtitle}</p></div>
      </aside>
    </div>

    <div className="kod-lower-grid">
      <section className="kod-event-log">
        <header><h3>Event Log <span>(Live)</span></h3><button onClick={()=>setState(s=>clearDeliveryEvents(s))}>Clear</button></header>
        <ol>{state.events.length?state.events.slice(-10).map(event=><li key={event.id}><i/><time>{event.time}</time><b className={"role-"+event.role.toLowerCase()}>{event.role}</b><span>{event.text}</span></li>):<li className="kod-empty">No events yet. Run the simulation.</li>}</ol>
      </section>

      <section className="kod-partition-state">
        <header><span><Database size={16}/></span><h3>Partition State</h3></header>
        <div className="kod-partition-tabs">{[0,1,2].map(partition=><button key={partition} className={state.selectedPartition===partition?"active":""} onClick={()=>setState(s=>({...s,selectedPartition:partition as 0|1|2,status:`Inspecting P${partition}.`}))}>P{partition}</button>)}</div>
        <div className="kod-offset-row">{p0Records.map(record=><button key={record.offset} className={record.status}><small>{record.status==="processed"?"✓":record.status==="duplicate"?"↻":record.status==="lost"?"×":""}</small><b>{record.offset}</b></button>)}</div>
        <dl>
          <div><dt>Committed offset</dt><dd>{state.committedOffset}</dd></div>
          <div><dt>Next offset</dt><dd>{state.nextOffset}</dd></div>
          <div><dt>Lag</dt><dd>{state.lag}</dd></div>
          <div><dt>Messages in log</dt><dd>{state.messagesInLog}</dd></div>
          <div><dt>Retries</dt><dd>{state.retryCount}</dd></div>
          <div><dt>Duplicates / Lost</dt><dd>{state.duplicateCount} / {state.lostCount}</dd></div>
        </dl>
      </section>

      <section className="kod-takeaways">
        <header><span><ShieldCheck size={16}/></span><h3>Key Takeaways</h3></header>
        <ul>
          <li><CheckCircle2 size={14}/><span>Ordering is guaranteed within a partition, not across partitions.</span></li>
          <li><CheckCircle2 size={14}/><span>At-most-once may lose messages because progress can be committed before processing.</span></li>
          <li><CheckCircle2 size={14}/><span>At-least-once may replay a record and produce duplicate effects.</span></li>
          <li><CheckCircle2 size={14}/><span>Kafka exactly-once uses idempotent/transactional processing for Kafka-visible results.</span></li>
          <li><CheckCircle2 size={14}/><span>External systems still need compatible transactions or idempotency.</span></li>
        </ul>
      </section>
    </div>

    <footer className="kod-status"><span><CircleDot size={11}/>Live</span><p>{state.status}</p><span>{state.mode} · {state.scenario}</span></footer>
  </section>;
}
