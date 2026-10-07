"use client";
import {useKafkaMotion} from "@/components/kafka-motion";

import {useMemo,useState} from "react";
import {
  BookOpen, CheckCircle2, CircleDot, Code2, Database, HelpCircle, Lightbulb,
  ListChecks, Network, Play, RefreshCcw, Server, ShieldCheck, Sparkles, Users
} from "lucide-react";
import {
  architectureScenarios, createArchitectureReviewState, nextArchitectureStep,
  resetArchitectureSimulation, runArchitectureSimulation, setArchitectureScenario,
  type ArchitectureScenarioId
} from "@/lib/kafka-architecture-review-simulation";

const interviewQuestions=[
  "How does Kafka ensure durability?",
  "What happens when a broker fails?",
  "How are keys used for partitioning?",
  "Explain consumer group rebalancing.",
  "At-least-once vs exactly-once?",
  "How does log compaction work?",
  "What is ISR and why is it important?",
];

const keyConcepts=[
  "Brokers & Cluster",
  "Topics & Partitions",
  "Replication & ISR",
  "Producer & Consumer",
  "Consumer Groups",
  "Offsets & Delivery Semantics",
  "Retention & Log Compaction",
  "Real-world design patterns",
];

const designPatterns=[
  "Event-driven architecture",
  "Data ingestion pipeline",
  "Real-time analytics (Kafka Streams)",
  "Change Data Capture (Kafka Connect)",
  "Microservices communication",
  "Audit logs & monitoring",
  "Dead letter topic (DLT)",
  "Multi-region replication",
];

export function KafkaArchitectureReviewLab(){
 const kafkaMotion=useKafkaMotion();
  const [state,setState]=useState(()=>createArchitectureReviewState());

  const activeStep=state.events[state.currentStep]?.step;
  const p0Leader=useMemo(()=>{
    const broker=state.brokers.find(item=>item.partitions.some(p=>p.id==="P0"&&p.role==="leader"));
    return broker?.id??null;
  },[state.brokers]);

  return <section {...kafkaMotion} className="kar-lab" aria-label="Kafka architecture and interview review">
    <header className="kar-section-heading">
      <div>
        <BookOpen size={24}/>
        <div>
          <h2>End-to-End Architecture</h2>
          <p>A producer sends records to a topic. Kafka stores them across partitions on multiple brokers. Consumers read from the topic using consumer groups. Data is replicated for fault tolerance.</p>
        </div>
      </div>
      <div className="kar-controls">
        <label><span>Scenario</span><select value={state.scenario} onChange={e=>setState(s=>setArchitectureScenario(s,e.target.value as ArchitectureScenarioId))}>{architectureScenarios.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <button onClick={()=>setState(s=>nextArchitectureStep(s))}>Next Step</button>
        <button onClick={()=>setState(resetArchitectureSimulation())}><RefreshCcw size={14}/>Reset</button>
        <button className="kar-run" onClick={()=>setState(s=>runArchitectureSimulation(s))}><Play size={14} fill="currentColor"/>Run Simulation</button>
      </div>
    </header>

    <div className="kar-architecture-grid">
      <div className="kar-diagram">
        <article className={"kar-producer "+(activeStep==="produce"?"active":"")}>
          <header><span><Code2 size={18}/></span><h3>Producer</h3></header>
          <p>Sends records<br/>(key, value)<br/>to a topic</p>
          <pre>{JSON.stringify({key:"user-77",value:"order",amount:499},null,2)}</pre>
        </article>

        <div className="kar-arrow">→</div>

        <article className={"kar-cluster "+(["partition","replicate"].includes(activeStep)?"active":"")}>
          <header><Network size={19}/><h3>Kafka Cluster</h3></header>
          <div className="kar-brokers">
            {state.brokers.map(broker=><section key={broker.id} className={"kar-broker "+(!broker.healthy?"failed":"")}>
              <header><span><Server size={16}/></span><div><h4>Broker {broker.id}</h4><small>{broker.healthy?(broker.id===p0Leader?"P0 Leader":"Replica host"):"Unavailable"}</small></div></header>
              <strong>Topic: orders</strong>
              <div>{broker.partitions.map(partition=><p key={partition.id} className={(partition.id==="P0"&&activeStep==="partition")||activeStep==="replicate"?"highlight":""}>
                <Database size={12}/><span>{partition.id} ({partition.role==="leader"?"L":"F"})</span>
              </p>)}</div>
            </section>)}
          </div>
          {state.brokerFailure&&<p className="kar-failure-note">Broker {state.brokerFailure} failed. P0 leader is now Broker {p0Leader}.</p>}
        </article>

        <div className="kar-arrow">→</div>

        <article className={"kar-consumers "+(activeStep==="consume"||activeStep==="commit"?"active":"")}>
          <header><span><Users size={18}/></span><h3>Consumer Group</h3></header>
          <p>Reads records<br/>from partitions</p>
          <div>{[1,2,3].map(id=><button key={id} className={state.activeConsumer===id?"assigned":""}><Database size={12}/>Consumer {id}</button>)}</div>
          <footer>Committed next offset: <strong>{state.committedOffset}</strong></footer>
        </article>
      </div>

      <aside className="kar-topic-card">
        <header><span><Database size={18}/></span><h3>Topic: orders</h3></header>
        <ul>
          <li><Network size={14}/><span>3 partitions (P0, P1, P2)</span></li>
          <li><Server size={14}/><span>Replication factor: 3</span></li>
          <li><ShieldCheck size={14}/><span>Min ISR: 2</span></li>
          <li><Database size={14}/><span>Retention: 7 days</span></li>
        </ul>
        <div className="kar-live-state">
          <strong>Current trace</strong>
          <span><CircleDot size={10}/>P0 leader: Broker {p0Leader??"—"}</span>
          <span><CircleDot size={10}/>Assigned consumer: C{state.activeConsumer}</span>
          <span><CircleDot size={10}/>Committed next: {state.committedOffset}</span>
        </div>
      </aside>
    </div>

    <div className="kar-trace-status">
      <span><Sparkles size={14}/>{state.currentStep+1} / {state.events.length}</span>
      <p>{state.status}</p>
    </div>

    <div className="kar-review-grid">
      <section className="kar-flow-card">
        <header><span><ListChecks size={17}/></span><h3>Event Flow (Sequence)</h3></header>
        <ol>{state.events.map((event,index)=><li key={event.id} className={event.status}>
          <b>{index+1}</b>
          <div><strong>{event.title}</strong><small>{event.detail}</small></div>
        </li>)}</ol>
      </section>

      <section className="kar-concepts">
        <header><span><Lightbulb size={17}/></span><h3>Key Concepts</h3></header>
        <ul>{keyConcepts.map(item=><li key={item}><CheckCircle2 size={13}/><span>{item}</span></li>)}</ul>
      </section>

      <section className="kar-interview">
        <header><span><HelpCircle size={17}/></span><h3>Common Interview Questions</h3></header>
        <ul>{interviewQuestions.map(item=><li key={item}><button><span>›</span>{item}</button></li>)}</ul>
      </section>

      <section className="kar-patterns">
        <header><span><Sparkles size={17}/></span><h3>Design Patterns</h3></header>
        <ul>{designPatterns.map((item,index)=><li key={item}><i className={"dot d"+index}/><span>{item}</span></li>)}</ul>
      </section>
    </div>

    <footer className="kar-footer">
      <span><CheckCircle2 size={12}/>Architecture trace ready</span>
      <p>Trace one event successfully, then trace the same event through a failure before declaring the design reliable.</p>
      <span>P0 · RF 3 · Min ISR 2</span>
    </footer>
  </section>;
}
