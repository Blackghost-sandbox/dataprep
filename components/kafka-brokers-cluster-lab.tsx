"use client";
import {useKafkaMotion} from "@/components/kafka-motion";

import {useMemo,useState} from "react";
import {
  CheckCircle2, ChevronRight, CircleDot, Database, Play, RadioTower, RefreshCcw,
  Send, Server, ShieldCheck, Sparkles, Users
} from "lucide-react";
import {
  brokerPartitions, clearClusterEvents, clusterOverview, clusterPartitionDetails,
  consumeClusterMessages, createClusterState, reconfigureCluster, replicaBrokers,
  selectClusterPartition, sendClusterMessage, setAutoRebalance, setClusterTopic,
  type ClusterStartMode, type ClusterTopicId
} from "@/lib/kafka-brokers-cluster-simulation";

const brokerTone=["blue","orange","green","pink","violet"] as const;

function initialPayload(){
  return JSON.stringify({order_id:"A1001",customer_id:"101",amount:499,product:"Laptop"},null,2);
}

export function KafkaBrokersClusterLab(){
 const kafkaMotion=useKafkaMotion();
  const [state,setState]=useState(()=>createClusterState());
  const [messageKey,setMessageKey]=useState("customer_101");
  const [messageValue,setMessageValue]=useState(initialPayload);
  const [consumerGroup,setConsumerGroup]=useState("analytics-group");
  const [startFrom,setStartFrom]=useState<ClusterStartMode>("latest");
  const [selectedBroker,setSelectedBroker]=useState(1);
  const [payloadError,setPayloadError]=useState("");

  const details=useMemo(()=>clusterPartitionDetails(state,state.selectedPartition),[state]);
  const overview=useMemo(()=>clusterOverview(state),[state]);
  const selectedBrokerPartitions=brokerPartitions(state,selectedBroker);

  const send=()=>{
    try{
      const parsed=JSON.parse(messageValue) as Partial<{order_id:string;customer_id:string;amount:number;product:string}>;
      setPayloadError("");
      setState(s=>sendClusterMessage(s,{
        key:messageKey,
        order_id:String(parsed.order_id??""),
        customer_id:String(parsed.customer_id??""),
        amount:Number(parsed.amount??0),
        product:String(parsed.product??""),
      }));
    }catch{
      setPayloadError("Message value must be valid JSON.");
    }
  };
  const consume=()=>setState(s=>consumeClusterMessages(s,startFrom));
  const run=()=>{
    try{
      const parsed=JSON.parse(messageValue) as Partial<{order_id:string;customer_id:string;amount:number;product:string}>;
      setPayloadError("");
      setState(s=>consumeClusterMessages(sendClusterMessage(s,{
        key:messageKey,
        order_id:String(parsed.order_id??""),
        customer_id:String(parsed.customer_id??""),
        amount:Number(parsed.amount??0),
        product:String(parsed.product??""),
      }),startFrom));
    }catch{
      setPayloadError("Message value must be valid JSON.");
    }
  };
  const reset=()=>{
    setState(createClusterState(state.brokerCount,state.replicationFactor,state.topic));
    setSelectedBroker(1);
    setPayloadError("");
  };

  return <section {...kafkaMotion} className="kbc-lab" aria-label="Interactive Kafka broker cluster simulation">
    <header className="kbc-toolbar">
      <div className="kbc-heading">
        <span><Play size={19} fill="currentColor"/></span>
        <div><h2>Interactive Kafka Cluster</h2><p>See how a topic&apos;s partitions and replicas are distributed across multiple brokers. Click a broker, partition or replica to explore.</p></div>
      </div>
      <div className="kbc-controls">
        <button className="kbc-run" onClick={run}><Play size={14} fill="currentColor"/>Run</button>
        <button onClick={reset}><RefreshCcw size={14}/>Reset</button>
        <fieldset><legend>Number of brokers</legend><div>{[3,4,5].map(count=><button key={count} aria-pressed={state.brokerCount===count} onClick={()=>setState(s=>reconfigureCluster(s,count,s.replicationFactor))}>{count}</button>)}</div></fieldset>
        <fieldset><legend>Replication factor</legend><div>{[1,2,3].map(rf=><button key={rf} aria-pressed={state.replicationFactor===rf} onClick={()=>setState(s=>reconfigureCluster(s,s.brokerCount,rf))}>{rf}</button>)}</div></fieldset>
        <label className="kbc-topic-select"><span>Topic</span><select value={state.topic} onChange={e=>setState(s=>setClusterTopic(s,e.target.value as ClusterTopicId))}><option value="orders">orders</option><option value="payments">payments</option></select></label>
        <label className="kbc-switch"><input type="checkbox" checked={state.autoRebalance} onChange={e=>setState(s=>setAutoRebalance(s,e.target.checked))}/><span/><b>Auto re-balance</b></label>
      </div>
    </header>

    <div className="kbc-main-grid">
      <article className="kbc-producer">
        <header><span><RadioTower size={18}/></span><div><h3>Producer</h3><p>Send messages to topic</p></div></header>
        <label>Topic<select value={state.topic} onChange={e=>setState(s=>setClusterTopic(s,e.target.value as ClusterTopicId))}><option value="orders">orders</option><option value="payments">payments</option></select></label>
        <label>Message key <small>(optional)</small><input value={messageKey} onChange={e=>setMessageKey(e.target.value)}/></label>
        <label>Message value<textarea spellCheck={false} value={messageValue} onChange={e=>setMessageValue(e.target.value)}/></label>
        {payloadError&&<p className="kbc-error" role="alert">{payloadError}</p>}
        <button className="kbc-send" onClick={send}><Send size={15}/>Send Message</button>
      </article>

      <div className="kbc-flow kbc-flow-left" aria-hidden="true"><i/><ChevronRight size={21}/></div>

      <article className="kbc-cluster">
        <header><span><Database size={18}/></span><h3>Kafka Cluster <strong>({state.brokerCount} brokers)</strong></h3><small><CheckCircle2 size={12}/>Healthy</small></header>
        <div className={"kbc-brokers brokers-"+state.brokerCount}>
          {Array.from({length:state.brokerCount},(_,index)=>{
            const broker=index+1, placement=brokerPartitions(state,broker);
            const visiblePlacement=placement.slice(0,3);
            const leaders=placement.filter(item=>item.leader).length;
            const tone=brokerTone[index]??"blue";
            return <section key={broker} className={"kbc-broker "+tone+(selectedBroker===broker?" is-selected":"")}>
              <button className="kbc-broker-head" onClick={()=>setSelectedBroker(broker)}>
                <span><Server size={16}/></span><div><h4>Broker {broker}</h4><small>broker-{broker}:9092</small></div>
              </button>
              <div className="kbc-broker-metrics"><span>Leader: <b>{leaders}</b></span><span>Replicas: <b>{Math.min(3,placement.length)}</b></span></div>
              <div className="kbc-replica-stack">
                {visiblePlacement.map(item=><button key={item.partition} className={"kbc-replica "+(item.leader?"leader":"replica")} onClick={()=>setState(s=>selectClusterPartition(s,item.partition))}>
                  <div><Database size={14}/><strong>P{item.partition} ({item.leader?"Leader":"Replica"})</strong></div>
                  <span>{item.replicas.map(replica=><b key={replica} className={"replica-"+replica}>{replica}</b>)}</span>
                </button>)}
              </div>
            </section>;
          })}
        </div>
      </article>

      <div className="kbc-flow kbc-flow-right" aria-hidden="true"><i/><ChevronRight size={21}/></div>

      <article className="kbc-consumer">
        <header><span><Users size={18}/></span><div><h3>Consumer</h3><p>Read messages from topic</p></div></header>
        <label>Topic<select value={state.topic} onChange={e=>setState(s=>setClusterTopic(s,e.target.value as ClusterTopicId))}><option value="orders">orders</option><option value="payments">payments</option></select></label>
        <label>Consumer group <small>(optional)</small><input value={consumerGroup} onChange={e=>setConsumerGroup(e.target.value)}/></label>
        <label>Start from<select value={startFrom} onChange={e=>setStartFrom(e.target.value as ClusterStartMode)}><option value="latest">Latest</option><option value="earliest">Earliest</option></select></label>
        <button className="kbc-consume" onClick={consume}><Play size={14} fill="currentColor"/>Start Consuming</button>
        <h4>Consumed Messages</h4>
        <div className="kbc-consumed">{state.consumed.length?state.consumed.map(record=><button key={record.id} onClick={()=>setState(s=>selectClusterPartition(s,record.partition))}><b className={"p-"+record.partition}>P{record.partition}</b><code>{JSON.stringify({order_id:record.order_id})}</code></button>):<p>No messages consumed yet.</p>}</div>
      </article>
    </div>

    <div className="kbc-lower-grid">
      <section className="kbc-event-log">
        <header><h3>Event Log <span>(Live)</span></h3><button onClick={()=>setState(s=>clearClusterEvents(s))}>Clear</button></header>
        <ol>{state.events.length?state.events.slice(-7).map(event=><li key={event.id}><i/><time>{event.time}</time><b className={"role-"+event.role.toLowerCase()}>{event.broker?event.role+"-"+event.broker:event.role}</b><span>{event.text}</span></li>):<li className="kbc-empty-log">No events yet. Run or send a message to create a trace.</li>}</ol>
      </section>

      <section className="kbc-details">
        <header><h3>Partition Details</h3><select value={state.selectedPartition} onChange={e=>setState(s=>selectClusterPartition(s,Number(e.target.value)))}>{Array.from({length:state.partitionCount},(_,p)=><option key={p} value={p}>Partition {p}</option>)}</select></header>
        <div className="kbc-detail-body"><Database size={29}/><dl>
          <div><dt>Leader</dt><dd><i className={"broker-dot b"+details.leader}/><button onClick={()=>setSelectedBroker(details.leader)}>Broker {details.leader}</button></dd></div>
          <div><dt>Replicas</dt><dd>{details.replicas.join(", ")}</dd></div>
          <div><dt>ISR (In Sync)</dt><dd>{details.isr.map(id=><span key={id} className="kbc-ok"><CircleDot size={9}/>{id}</span>)}</dd></div>
          <div><dt>Total messages</dt><dd>{details.totalMessages}</dd></div>
          <div><dt>Earliest offset</dt><dd>{details.earliestOffset}</dd></div>
          <div><dt>Latest offset</dt><dd>{details.latestOffset}</dd></div>
          <div><dt>Replication factor</dt><dd>{details.replicationFactor}</dd></div>
        </dl></div>
      </section>

      <section className="kbc-overview">
        <header><h3>Cluster Overview</h3></header>
        <div className="kbc-overview-chips"><span><Server size={13}/>{overview.brokers} Brokers</span><span><Database size={13}/>{overview.partitions} Partitions</span></div>
        <ul>
          <li className="healthy"><CheckCircle2 size={12}/>All brokers healthy</li>
          <li><Sparkles size={12}/>Replication factor: {overview.replicationFactor}</li>
          <li><Database size={12}/>Partitions per broker: ~{overview.approxPerBroker}</li>
          <li><RefreshCcw size={12}/>Auto re-balancing: {state.autoRebalance?"Enabled":"Disabled"}</li>
          <li><ShieldCheck size={12}/>Unclean leader election: Disabled</li>
        </ul>
        <p>Broker {selectedBroker}: {selectedBrokerPartitions.length} replica placement(s)</p>
      </section>
    </div>

    <footer className="kbc-status"><span><CircleDot size={11}/>Healthy</span><p>{state.status}</p><span>Consumer group: {consumerGroup||"none"}</span></footer>
  </section>;
}
