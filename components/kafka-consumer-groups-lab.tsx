"use client";

import {useMemo,useState} from "react";
import {
  CheckCircle2, CircleDot, Database, Play, RefreshCcw, RotateCcw, Users, Zap
} from "lucide-react";
import {
  applyConsumerGroupAction, clearConsumerGroupEvents, createConsumerGroupState,
  groupMetrics, ownerForPartition, selectConsumerGroupPartition, setConsumerGroupAuto,
  setConsumerGroupConsumers, setConsumerGroupPartitions,
  type ConsumerGroupConsumerCount, type ConsumerGroupPartitionCount, type RebalanceAction
} from "@/lib/kafka-consumer-groups-simulation";

const tones=["blue","orange","pink","green","violet","cyan","amber","rose","indigo"] as const;

const actions:Array<{id:RebalanceAction;label:string}>=[
  {id:"add",label:"Add a consumer (C4)"},
  {id:"remove",label:"Remove last consumer"},
  {id:"fail",label:"Simulate consumer failure"},
  {id:"restart",label:"Restart / add consumer"},
];

export function KafkaConsumerGroupsLab(){
  const [state,setState]=useState(()=>createConsumerGroupState());
  const [action,setAction]=useState<RebalanceAction>("add");
  const metrics=useMemo(()=>groupMetrics(state),[state]);

  const apply=()=>setState(s=>applyConsumerGroupAction(s,action));
  const reset=()=>{setState(createConsumerGroupState());setAction("add");};

  return <section className="kcg-lab" aria-label="Kafka consumer groups interactive simulation">
    <header className="kcg-toolbar">
      <div className="kcg-heading">
        <span><Play size={19} fill="currentColor"/></span>
        <div>
          <h2>Interactive Simulation</h2>
          <p>See how partitions are assigned to consumers in a group. Add/remove consumers and watch rebalancing.</p>
        </div>
      </div>
      <div className="kcg-controls">
        <button className="kcg-run" onClick={apply}><Play size={14} fill="currentColor"/>Run</button>
        <button onClick={reset}><RefreshCcw size={14}/>Reset</button>
        <fieldset><legend>Number of partitions</legend><div>{([3,6,9] as const).map(count=><button key={count} aria-pressed={state.partitionCount===count} onClick={()=>setState(s=>setConsumerGroupPartitions(s,count as ConsumerGroupPartitionCount))}>{count}</button>)}</div></fieldset>
        <fieldset><legend>Number of consumers</legend><div>{([1,2,3,4] as const).map(count=><button key={count} aria-pressed={state.consumerCount===count} onClick={()=>setState(s=>setConsumerGroupConsumers(s,count as ConsumerGroupConsumerCount))}>{count}</button>)}</div></fieldset>
        <label className="kcg-switch"><span>Rebalancing</span><div><input type="checkbox" checked={state.autoRebalance} onChange={e=>setState(s=>setConsumerGroupAuto(s,e.target.checked))}/><i/><b>Auto</b></div></label>
      </div>
    </header>

    <div className="kcg-main-grid">
      <article className="kcg-topic">
        <header><span><Database size={18}/></span><h3>Kafka Topic: <strong>orders</strong></h3></header>
        <div className="kcg-partition-list">
          {state.partitions.map(partition=>{
            const tone=tones[partition.id%tones.length];
            const owner=ownerForPartition(state,partition.id);
            return <button key={partition.id} className={"kcg-partition "+tone+(state.selectedPartition===partition.id?" is-selected":"")} onClick={()=>setState(s=>selectConsumerGroupPartition(s,partition.id))}>
              <span className="kcg-partition-icon"><Database size={15}/></span>
              <div><strong>Partition {partition.id}</strong><small>{partition.messages} messages</small></div>
              <div className="kcg-record-dots">{Array.from({length:Math.min(6,Math.max(3,Math.ceil(partition.messages/3)))},(_,index)=><i key={index}>{String.fromCharCode(51+index)}</i>)}</div>
              <em>{owner?"→ "+owner.label:"Unassigned"}</em>
            </button>;
          })}
        </div>
      </article>

      <article className="kcg-group">
        <header><span><Users size={18}/></span><div><h3>Consumer Group</h3><p>Group ID: analytics-group</p></div><small><CircleDot size={10}/>Running</small></header>
        <div className="kcg-consumer-list">
          {state.consumers.map((consumer,index)=>{
            const tone=tones[index%tones.length];
            const processing=consumer.partitions.reduce((sum,p)=>sum+(state.partitions[p]?.messages??0),0);
            return <section key={consumer.id} className={"kcg-consumer "+tone}>
              <span className="kcg-user-icon"><Users size={17}/></span>
              <div><strong>{consumer.label}</strong><p>Partitions: {consumer.partitions.length?consumer.partitions.join(", "):"None"}</p><small>Processing: {processing} msgs</small></div>
              <em><CircleDot size={10}/>Active</em>
            </section>;
          })}
          {state.consumerCount<state.partitionCount&&state.consumerCount===4&&<p className="kcg-hint">Some consumers can own multiple partitions; ownership remains one active consumer per partition.</p>}
        </div>
      </article>

      <article className="kcg-rebalance">
        <header><span><RotateCcw size={17}/></span><h3>Rebalancing in Action</h3></header>
        <div className="kcg-action-row">
          <label><span>Action</span><select value={action} onChange={e=>setAction(e.target.value as RebalanceAction)}>{actions.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <button onClick={apply}>Apply</button>
        </div>
        <ol>{state.steps.map(step=><li key={step.id}><b>{step.id}</b><span>{step.label}</span><em className={"status-"+step.status.toLowerCase()}>{step.status}</em></li>)}</ol>
        <div className="kcg-info"><CircleDot size={14}/><p>Partitions are rebalanced so that each partition has exactly one consumer in the group.</p></div>
      </article>
    </div>

    <div className="kcg-lower-grid">
      <section className="kcg-event-log">
        <header><h3>Event Log <span>(Live)</span></h3><button onClick={()=>setState(s=>clearConsumerGroupEvents(s))}>Clear</button></header>
        <ol>{state.events.length?state.events.slice(-8).map(event=><li key={event.id}><i/><time>{event.time}</time><b className={"role-"+event.role.toLowerCase()}>{event.role}</b><span>{event.text}</span></li>):<li className="kcg-empty-log">No events yet. Run an action to create a group trace.</li>}</ol>
      </section>

      <section className="kcg-assignments">
        <header><h3>Partition Assignment</h3></header>
        <div className="kcg-table-wrap"><table>
          <thead><tr><th>Partition</th><th>Leader</th><th>Current Consumer</th><th>Lag</th></tr></thead>
          <tbody>{state.partitions.map(partition=>{
            const owner=ownerForPartition(state,partition.id);
            return <tr key={partition.id}>
              <td><b className={"tone-"+(partition.id%tones.length)}>{partition.id}</b></td>
              <td>{partition.leader}</td>
              <td><strong>{owner?.label??"Unassigned"}</strong>{owner&&<small>({owner.id})</small>}</td>
              <td><em className={partition.lag===0?"lag-zero":partition.lag>=3?"lag-high":"lag-low"}>{partition.lag}</em></td>
            </tr>;
          })}</tbody>
        </table></div>
      </section>

      <section className="kcg-metrics">
        <header><h3>Consumer Group Metrics</h3></header>
        <div>
          <article><span><Users size={18}/></span><strong>{metrics.consumers}</strong><small>Consumers</small></article>
          <article><span><Database size={18}/></span><strong>{metrics.partitions}</strong><small>Partitions</small></article>
          <article><span><Zap size={18}/></span><strong>{metrics.throughput}</strong><small>Messages/min</small></article>
          <article><span><RefreshCcw size={18}/></span><strong>{metrics.rebalances}</strong><small>Rebalances</small></article>
        </div>
      </section>
    </div>

    <footer className="kcg-status"><span><CheckCircle2 size={12}/>Running</span><p>{state.status}</p><span>{state.partitionCount} partitions · {state.consumerCount} consumers</span></footer>
  </section>;
}
