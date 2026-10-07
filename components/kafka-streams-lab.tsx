"use client";
import {useKafkaMotion} from "@/components/kafka-motion";

import {useMemo,useState} from "react";
import {
  CheckCircle2, CircleDot, Code2, Database, Filter, GitBranch, Play,
  Plus, RefreshCcw, Sigma, Sparkles
} from "lucide-react";
import {
  addStreamEvent, clearStreamLogs, createKafkaStreamsState,
  runKafkaStreamsSimulation, setStreamAutoAdvance, setStreamScenario,
  streamScenarios, type StreamScenarioId
} from "@/lib/kafka-streams-simulation";

const stageTone:Record<string,string>={
  source:"pink",filter:"purple",group:"orange",aggregate:"blue",sink:"green"
};

export function KafkaStreamsLab(){
 const kafkaMotion=useKafkaMotion();
  const [state,setState]=useState(()=>createKafkaStreamsState());
  const [region,setRegion]=useState("IN");
  const [amount,setAmount]=useState("125");
  const [showAdd,setShowAdd]=useState(false);

  const code=useMemo(()=>[
    "StreamsBuilder builder = new StreamsBuilder();",
    "",
    'KStream<String, Order> orders = builder.stream("orders");',
    "",
    "KTable<String, Double> salesByRegion = orders",
    "  .filter((key, value) -> value.getAmount() > 0)",
    "  .groupBy((key, value) -> value.getRegion(),",
    "           Grouped.with(Serdes.String(), OrderSerde))",
    "  .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration",
    "           .ofMinutes(5)))",
    "  .aggregate(",
    "      () -> 0.0,",
    "      (key, value, agg) -> agg + value.getAmount()",
    "  );",
    "",
    'salesByRegion.toStream().to("sales_by_region");'
  ].join("\n"),[]);

  const add=()=>{
    const parsed=Number(amount);
    setState(s=>addStreamEvent(s,region||"IN",Number.isFinite(parsed)?parsed:0));
    setShowAdd(false);
  };
  const run=()=>setState(s=>runKafkaStreamsSimulation(s));
  const reset=()=>{setState(createKafkaStreamsState());setShowAdd(false);setRegion("IN");setAmount("125");};

  const stages=[
    {id:"source",title:"Source",main:"orders",sub:"Read events from topic orders",rate:"5 events/s",icon:<GitBranch size={17}/>},
    {id:"filter",title:"Filter",main:"amount > 0",sub:"Filter invalid amounts",rate:"4 events/s",icon:<Filter size={17}/>},
    {id:"group",title:"Group By",main:"by region",sub:"Group events by region",rate:"4 events/s",icon:<GitBranch size={17}/>},
    {id:"aggregate",title:"Aggregate",main:state.scenario==="regional-count"?"count()":"sum(amount)",sub:"Calculate running total",rate:"4 events/s",icon:<Sigma size={17}/>},
    {id:"sink",title:"Sink",main:"sales_by_region",sub:"Write to output topic",rate:"4 events/s",icon:<Database size={17}/>},
  ];

  return <section {...kafkaMotion} className="ksp-lab" aria-label="Kafka Streams and stream processing interactive simulation">
    <header className="ksp-toolbar">
      <div className="ksp-heading">
        <span><Play size={19} fill="currentColor"/></span>
        <div>
          <h2>Interactive Simulation</h2>
          <p>See how a Kafka Streams topology reads events, processes them and produces output in real time. Modify the scenario and watch the flow.</p>
        </div>
      </div>
      <div className="ksp-controls">
        <button className="ksp-run" onClick={run}><Play size={14} fill="currentColor"/>Run Simulation</button>
        <button onClick={reset}><RefreshCcw size={14}/>Reset</button>
        <label><span>Scenario</span><select value={state.scenario} onChange={e=>setState(s=>setStreamScenario(s,e.target.value as StreamScenarioId))}>{streamScenarios.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label className="ksp-switch"><input type="checkbox" checked={state.autoAdvance} onChange={e=>setState(s=>setStreamAutoAdvance(s,e.target.checked))}/><i/><b>Auto advance</b></label>
      </div>
    </header>

    <div className="ksp-flow-grid">
      <article className="ksp-input">
        <header><span><Database size={17}/></span><h3>Input Events <small>(orders)</small></h3><button onClick={()=>setShowAdd(v=>!v)}><Plus size={13}/>Add Event</button></header>
        {showAdd&&<div className="ksp-add-row">
          <select value={region} onChange={e=>setRegion(e.target.value)}><option>IN</option><option>US</option><option>EU</option></select>
          <input value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal"/>
          <button onClick={add}>Add</button>
        </div>}
        <table><thead><tr><th>#</th><th>Region</th><th>Amount</th><th>Timestamp</th></tr></thead>
          <tbody>{state.inputEvents.slice(-5).map((event,index)=><tr key={event.id} className={event.amount<=0?"filtered":""}><td><i className={"dot d"+(index%5)}/>{event.id}</td><td>{event.region}</td><td>{event.amount}</td><td>{event.timestamp}</td></tr>)}</tbody>
        </table>
      </article>

      <div className="ksp-arrow">→</div>

      <div className="ksp-topology">
        {stages.map((stage,index)=><div key={stage.id} className="ksp-stage-wrap">
          <article className={"ksp-stage "+stageTone[stage.id]+(state.activeStage===stage.id?" active":"")}>
            <header><span>{stage.icon}</span><h3>{stage.title}</h3></header>
            <strong>{stage.main}</strong>
            <p>{stage.sub}</p>
            <em><CircleDot size={9}/>Active</em>
            <small>{stage.rate}</small>
          </article>
          {index<stages.length-1&&<div className="ksp-stage-arrow">→</div>}
        </div>)}
      </div>

      <div className="ksp-arrow">→</div>

      <article className="ksp-output">
        <header><span><Database size={17}/></span><h3>Output Events <small>(sales_by_region)</small></h3></header>
        <table><thead><tr><th>#</th><th>Region</th><th>Total</th><th>Window Start</th></tr></thead>
          <tbody>{state.outputEvents.map((row,index)=><tr key={row.region}><td><i className={"dot d"+(index%5)}/>{index+1}</td><td>{row.region}</td><td>{row.total}</td><td>{row.windowStart}</td></tr>)}</tbody>
        </table>
      </article>
    </div>

    <div className="ksp-lower-grid">
      <section className="ksp-code">
        <header><h3><Code2 size={15}/>Topology (Code View)</h3><button onClick={()=>navigator.clipboard?.writeText(code)}>Copy</button></header>
        <pre>{code}</pre>
      </section>

      <section className="ksp-event-log">
        <header><h3>Event Log <span>(Live)</span></h3><button onClick={()=>setState(s=>clearStreamLogs(s))}>Clear</button></header>
        <ol>{state.logs.length?state.logs.slice(-10).map(log=><li key={log.id}><i/><time>{log.time}</time><b className={"role-"+log.role.toLowerCase()}>{log.role}</b><span>{log.text}</span></li>):<li className="ksp-empty-log">No events yet. Run the simulation.</li>}</ol>
      </section>

      <div className="ksp-right-stack">
        <section className="ksp-state-store">
          <header><span><Database size={15}/></span><h3>State Store (Windowed)</h3></header>
          <select><option>sales_by_region</option></select>
          <table><thead><tr><th>Region</th><th>Total</th><th>Count</th></tr></thead><tbody>{state.stateStore.map(row=><tr key={row.region}><td>{row.region}</td><td>{row.total}</td><td>{row.count}</td></tr>)}</tbody></table>
        </section>

        <section className="ksp-takeaways">
          <header><span><Sparkles size={15}/></span><h3>Key Takeaways</h3></header>
          <ul>
            {[
              "Kafka Streams processes data continuously.",
              "Topologies define the flow of operations.",
              "State stores maintain intermediate results.",
              "Output topics can be queried by downstream systems."
            ].map(item=><li key={item}><CheckCircle2 size={13}/><span>{item}</span></li>)}
          </ul>
        </section>
      </div>
    </div>

    <footer className="ksp-status"><span><CircleDot size={11}/>Live</span><p>{state.status}</p><span>{state.processedCount} processed · {state.outputEvents.length} output rows</span></footer>
  </section>;
}
