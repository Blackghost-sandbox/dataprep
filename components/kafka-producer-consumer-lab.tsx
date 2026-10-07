"use client";
import {useKafkaMotion} from "@/components/kafka-motion";

import {useEffect,useMemo,useState} from "react";
import {
  Activity, ChevronRight, CircleDot, Database, Eye, Play, Radio, RefreshCcw,
  RotateCcw, Send, ShoppingCart, Users, Zap
} from "lucide-react";
import {
  consumerLag, datasetCatalog, newProducerConsumerState, producerDatasets,
  runProducerConsumer, scenarioCatalog,
  type ConsumerId, type KafkaDatasetId, type KafkaScenarioId, type StoredProducerRecord
} from "@/lib/kafka-producer-consumer-simulation";

const consumerTone:Record<ConsumerId,string>={a:"blue",b:"green",c:"pink"};

function MessageJson({record}:{record:StoredProducerRecord|null}) {
  if(!record)return <pre className="kpc-json">{'{\n  "order_id": 1001,\n  "customer_id": "C77",\n  "amount": 499,\n  "product": "Laptop"\n}'}</pre>;
  return <pre className="kpc-json">{JSON.stringify({
    order_id:record.order_id,
    customer_id:record.customer_id,
    amount:record.amount,
    product:record.product
  },null,2)}</pre>;
}

export function KafkaProducerConsumerLab(){
 const kafkaMotion=useKafkaMotion();
  const [dataset,setDataset]=useState<KafkaDatasetId>("orders");
  const [scenario,setScenario]=useState<KafkaScenarioId>("normal");
  const [scenarioIndex,setScenarioIndex]=useState(0);
  const [state,setState]=useState(()=>newProducerConsumerState("orders"));
  const [timelineVisible,setTimelineVisible]=useState(true);
  const [inspectorTab,setInspectorTab]=useState<"message"|"headers">("message");

  useEffect(()=>{setState(newProducerConsumerState(dataset));},[dataset]);
  const topic=dataset==="orders"?"orders":"payments";
  const nextRecord=producerDatasets[dataset][state.cursor]??null;
  const selected=state.selected;
  const partitionCounts=state.logs.map(rows=>rows.length);

  const run=()=>setState(s=>runProducerConsumer(s,dataset,scenario));
  const reset=()=>setState(newProducerConsumerState(dataset));
  const nextScenario=()=>{
    const next=(scenarioIndex+1)%scenarioCatalog.length;
    setScenarioIndex(next);
    setScenario(scenarioCatalog[next].id);
    setState(newProducerConsumerState(dataset));
  };
  const selectScenario=(value:KafkaScenarioId)=>{
    setScenario(value);
    const index=scenarioCatalog.findIndex(item=>item.id===value);
    setScenarioIndex(index<0?0:index);
    setState(newProducerConsumerState(dataset));
  };

  const activeConsumers=useMemo(()=>Object.values(state.consumers).filter(c=>c.active).length,[state.consumers]);

  return <section {...kafkaMotion} className="kpc-lab" aria-label="Kafka producers consumers and topics interactive simulation">
    <header className="kpc-toolbar">
      <div className="kpc-title">
        <span className="kpc-title-icon"><Radio size={22}/></span>
        <div><h2>Interactive Simulation</h2><p>See how a producer sends messages to a Kafka topic and how consumers fetch them from partitions.</p></div>
      </div>
      <div className="kpc-actions">
        <label><span>Dataset</span><select value={dataset} onChange={e=>setDataset(e.target.value as KafkaDatasetId)}>{datasetCatalog.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
        <label><span>Scenario</span><select value={scenario} onChange={e=>selectScenario(e.target.value as KafkaScenarioId)}>{scenarioCatalog.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
        <button className="kpc-run" onClick={run} disabled={!nextRecord}><Play size={15} fill="currentColor"/>Run</button>
        <button onClick={reset}><RotateCcw size={14}/>Reset</button>
        <button onClick={nextScenario}>Next Scenario <ChevronRight size={14}/></button>
      </div>
    </header>

    <div className="kpc-stage">
      <article className="kpc-producer">
        <header><span><Users size={19}/></span><div><h3>Producer</h3><p>Creates and sends records</p></div></header>
        <MessageJson record={nextRecord?{...nextRecord,partition:-1,offset:-1,timestamp:""}:selected}/>
        <button className="kpc-send" onClick={run} disabled={!nextRecord}><Send size={15}/>Send Message</button>
        <small>{nextRecord?"Next: "+nextRecord.order_id+" · "+nextRecord.product:"Dataset complete"}</small>
      </article>

      <div className="kpc-publish"><span>publish()</span><i/><ChevronRight size={20}/></div>

      <article className="kpc-topic">
        <header><span><Database size={18}/></span><div><h3>Kafka Topic</h3><strong>{topic}</strong></div></header>
        <div className="kpc-partitions">
          {state.logs.map((records,p)=><button key={p} data-kafka-partition={p} className={"kpc-partition p"+p} onClick={()=>records.length&&setState(s=>({...s,selected:records[records.length-1]}))}>
            <div><strong>Partition {p}</strong><small>({records.length} messages)</small><Activity size={13}/></div>
            <div className="kpc-record-strip">
              {records.slice(-3).map(record=><span key={record.order_id} className={selected?.order_id===record.order_id?"is-selected":""}>{record.order_id}</span>)}
              {records.length===0&&<em>empty</em>}
              <b>…</b>
            </div>
          </button>)}
        </div>
      </article>

      <div className="kpc-consumer-links" aria-hidden="true">
        <span className="link-a">poll()</span><span className="link-b"/><span className="link-c"/>
      </div>

      <div className="kpc-consumers">
        {(Object.values(state.consumers) as Array<(typeof state.consumers)[ConsumerId]>).map(consumer=>{
          const tone=consumerTone[consumer.id], lag=consumerLag(state,consumer.id);
          return <article data-kafka-partition={consumer.partition} className={"kpc-consumer "+tone} key={consumer.id}>
            <span className="kpc-consumer-icon"><Users size={18}/></span>
            <div><h3>{consumer.label}</h3><p>Reads from partition {consumer.partition}</p></div>
            <span className="kpc-pbadge">P{consumer.partition}</span>
            <small className={consumer.active?"active":"lagging"}><CircleDot size={11}/>{consumer.active?"Active":"Lag "+lag}</small>
          </article>;
        })}
      </div>
    </div>

    <div className="kpc-bottom">
      <section className="kpc-timeline">
        <header><h3><Zap size={18}/>Event Timeline</h3><button onClick={()=>setTimelineVisible(v=>!v)}>{timelineVisible?"Hide":"Show"}</button><span><CircleDot size={11}/>Live</span><button onClick={()=>setState(s=>({...s,timeline:[]}))}>Clear</button></header>
        {timelineVisible?<ol>{state.timeline.slice(-6).reverse().map(event=><li key={event.id}><time>{event.time}</time><i className={"role-"+event.role}/><span>{event.text}</span></li>)}</ol>:<p className="kpc-muted">Timeline hidden.</p>}
      </section>

      <section className="kpc-inspector">
        <header><h3><Eye size={18}/>Message Inspector</h3><div><button className={inspectorTab==="message"?"is-active":""} aria-pressed={inspectorTab==="message"} onClick={()=>setInspectorTab("message")}>Message</button><button className={inspectorTab==="headers"?"is-active":""} aria-pressed={inspectorTab==="headers"} onClick={()=>setInspectorTab("headers")}>Headers</button></div></header>
        {inspectorTab==="message"?<MessageJson record={selected}/>:<pre className="kpc-json">{JSON.stringify({topic,partition:selected?.partition??0,offset:selected?.offset??0,event_type:selected?.event_type??"order",content_type:"application/json"},null,2)}</pre>}
      </section>

      <section className="kpc-view">
        <header><h3><Database size={18}/>Partition View ({topic})</h3></header>
        <div className="kpc-view-tabs">{state.logs.map((rows,p)=><span key={p} className={p===selected?.partition?"is-active":""}>P{p} ({rows.length})</span>)}</div>
        <div className="kpc-view-rows">
          {(selected?state.logs[selected.partition]:state.logs[0]).slice(-3).map((record,index)=><button key={record.order_id} onClick={()=>setState(s=>({...s,selected:record}))}><b>#{index+1}</b><span>order_id: <strong>{record.order_id}</strong></span><time>{record.timestamp}</time></button>)}
        </div>
      </section>
    </div>

    <footer className="kpc-status"><span><ShoppingCart size={15}/>{state.status}</span><span>{partitionCounts.reduce((a,b)=>a+b,0)} stored · {activeConsumers}/3 consumers active</span><button onClick={run} disabled={!nextRecord}><RefreshCcw size={13}/>Run next</button></footer>
  </section>;
}
