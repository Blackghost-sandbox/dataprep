"use client";
import {useKafkaMotion} from "@/components/kafka-motion";

import {useMemo,useState} from "react";
import {
  AlertTriangle, CheckCircle2, CircleDot, Database, Play, RefreshCcw,
  RotateCcw, Server, Settings2, ShieldCheck, Sparkles, Users, Zap
} from "lucide-react";
import {
  clearReplicationEvents, createReplicationState, currentIsr, electNewLeader,
  failBroker, partitionStatus, produceReplicatedMessage, recoverBroker,
  replicationScenarios, runReplicationScenario, setReplicationAutoAdvance,
  setReplicationScenario, type ReplicationScenarioId
} from "@/lib/kafka-replication-fault-tolerance-simulation";

const brokerTone=["red","green","blue"] as const;

export function KafkaReplicationFaultToleranceLab(){
 const kafkaMotion=useKafkaMotion();
  const [state,setState]=useState(()=>createReplicationState());
  const status=useMemo(()=>partitionStatus(state),[state]);
  const isr=currentIsr(state);

  const run=()=>setState(s=>runReplicationScenario(s));
  const reset=()=>setState(createReplicationState());

  return <section {...kafkaMotion} className="krf-lab" aria-label="Kafka replication and fault tolerance interactive simulation">
    <header className="krf-toolbar">
      <div className="krf-heading">
        <span><Play size={19} fill="currentColor"/></span>
        <div>
          <h2>Interactive Simulation</h2>
          <p>See how replicas, leader failure and ISR keep your data safe. Produce messages, fail a broker and watch Kafka elect a new leader automatically.</p>
        </div>
      </div>
      <div className="krf-controls">
        <button className="krf-run" onClick={run}><Play size={14} fill="currentColor"/>Run</button>
        <button onClick={reset}><RefreshCcw size={14}/>Reset</button>
        <label><span>Scenario</span><select value={state.scenario} onChange={e=>setState(s=>setReplicationScenario(s,e.target.value as ReplicationScenarioId))}>{replicationScenarios.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label className="krf-switch"><input type="checkbox" checked={state.autoAdvance} onChange={e=>setState(s=>setReplicationAutoAdvance(s,e.target.checked))}/><i/><b>Auto advance</b></label>
      </div>
    </header>

    <div className="krf-main-grid">
      <article className="krf-topic">
        <header>
          <span><Database size={18}/></span>
          <div><h3>Topic: <strong>orders</strong></h3><p>Replication factor: {state.replicationFactor} <i/> Min ISR: {state.minIsr} <i/> Acks: {state.acks}</p></div>
          <div className="krf-legend"><span><i className="leader"/>Leader</span><span><i className="follower"/>Follower (in-sync)</span><span><i className="out"/>Follower (out-of-sync)</span></div>
        </header>

        <div className="krf-partition-banner"><Database size={15}/><strong>Partition {state.partition}</strong><span>Replicated across brokers</span></div>

        <div className="krf-broker-grid">
          {state.brokers.map((broker,index)=>{
            const tone=brokerTone[index];
            const leader=broker.id===state.leaderId&&!broker.failed;
            return <section key={broker.id} className={"krf-broker "+tone+(broker.failed?" failed":"")}>
              <header>
                <span><Server size={17}/></span>
                <div>
                  <h4>Broker {broker.id}</h4>
                  <p><b>{broker.partition}</b> · replica {broker.replica}</p>
                </div>
                <em className={broker.failed?"failed":leader?"leader":"follower"}>{broker.failed?"FAILED":leader?"LEADER":"FOLLOWER"}</em>
              </header>
              <div className="krf-isr-row">
                <span className={broker.inSync&&!broker.failed?"ok":"bad"}>{broker.inSync&&!broker.failed?"In ISR":"Not in ISR"}</span>
                <span className={broker.failed?"bad":"ok"}>{broker.failed?"Unavailable":"Active"}</span>
              </div>
              <div className="krf-offset-row">
                {broker.offsets.slice(-5).map(offset=><button key={offset} className={offset===state.hw?"hw":offset===state.leo?"leo":""}><small>{broker.partition}</small><b>{offset}</b></button>)}
              </div>
              {broker.id===1?<button className="krf-broker-action danger" onClick={()=>setState(s=>failBroker(s,1))}><AlertTriangle size={14}/>Crash Broker 1</button>
              :broker.id===2?<button className="krf-broker-action" onClick={()=>setState(s=>electNewLeader(s))}><Zap size={14}/>Elect New Leader</button>
              :<div className="krf-replica-note"><RotateCcw size={13}/><span>Replicates {broker.partition}</span></div>}
            </section>;
          })}
        </div>

        <div className="krf-replication-link"><span>{state.partition} replication</span><i/><b>↔</b><i/></div>
      </article>

      <aside className="krf-actions">
        <header><Settings2 size={17}/><h3>Actions</h3></header>
        <button onClick={()=>setState(s=>produceReplicatedMessage(s))}><Sparkles size={15}/>Produce Message</button>
        <button className="danger" onClick={()=>setState(s=>failBroker(s,1))}><AlertTriangle size={15}/>Fail Broker 1</button>
        <button className="success" onClick={()=>setState(s=>recoverBroker(s,1))}><RefreshCcw size={15}/>Recover Broker 1</button>
        <section className="krf-current-isr">
          <header><Users size={17}/><div><h4>Current ISR</h4><strong>{isr.length} / {state.replicationFactor} ({isr.length>=state.minIsr?"Healthy":"Below Min ISR"})</strong></div></header>
          <div>{isr.map(id=><span key={id}>Broker {id}</span>)}</div>
        </section>
      </aside>
    </div>

    <div className="krf-lower-grid">
      <section className="krf-event-log">
        <header><h3>Event Log <span>(Live)</span></h3><button onClick={()=>setState(s=>clearReplicationEvents(s))}>Clear</button></header>
        <ol>{state.events.length?state.events.slice(-7).map(event=><li key={event.id}><i/><time>{event.time}</time><b className={"role-"+event.role.toLowerCase()}>{event.role}</b><span>{event.text}</span></li>):<li className="krf-empty-log">No events yet. Run or trigger an action.</li>}</ol>
      </section>

      <section className="krf-status-card">
        <header><span><Database size={16}/></span><h3>Partition Status</h3></header>
        <dl>
          <div><dt>Partition</dt><dd>{status.partition}</dd></div>
          <div><dt>Leader</dt><dd>{status.leader?"Broker "+status.leader:"Election pending"}</dd></div>
          <div><dt>Followers</dt><dd>{status.followers.length?status.followers.map(id=>"Broker "+id).join(", "):"None"}</dd></div>
          <div><dt>ISR</dt><dd>{status.isr.join(" / ")||"None"}</dd></div>
          <div><dt>Replication factor</dt><dd>{status.replicationFactor}</dd></div>
          <div><dt>Min ISR</dt><dd>{status.minIsr}</dd></div>
          <div><dt>HW (High Watermark)</dt><dd>{status.hw}</dd></div>
          <div><dt>LEO (Log End Offset)</dt><dd>{status.leo}</dd></div>
          <div><dt>Under-replicated</dt><dd className={status.underReplicated?"warn":"ok"}>{status.underReplicated?"Yes":"No"}</dd></div>
        </dl>
      </section>

      <section className="krf-flow">
        <header><span><ShieldCheck size={16}/></span><h3>Message Flow</h3></header>
        <div className="krf-flow-offsets">{[145,146,147,148,149].map(offset=><span key={offset} className={offset===state.hw?"active":""}><small>{state.partition}</small>{offset}</span>)}</div>
        <div className="krf-safe">
          <CheckCircle2 size={20}/>
          <div><strong>{isr.length>=state.minIsr?"All committed messages are safe":"Durability risk: ISR below minimum"}</strong><p>{isr.length>=state.minIsr?"With acks=all and min.insync.replicas="+state.minIsr+", committed "+state.partition+" messages remain durable across the represented failure.":"Current ISR has "+isr.length+" broker(s); writes requiring min ISR "+state.minIsr+" are not safe to acknowledge."}</p></div>
        </div>
      </section>
    </div>

    <footer className="krf-footer"><span><CircleDot size={11}/>{isr.length>=state.minIsr?"Available":"Degraded"}</span><p>{state.status}</p><span>{state.partition} · RF {state.replicationFactor} · ISR {isr.join(",")||"none"}</span></footer>
  </section>;
}
