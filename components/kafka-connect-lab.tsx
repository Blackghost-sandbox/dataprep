"use client";

import {useMemo,useState} from "react";
import {
  AlertTriangle, CheckCircle2, CircleDot, Database, FileJson, Play, RefreshCcw,
  Server, Snowflake, Sparkles, Table2, Zap
} from "lucide-react";
import {
  clearConnectEvents, connectScenarios, createKafkaConnectState,
  runKafkaConnectSimulation, setConnectScenario,
  type ConnectScenarioId
} from "@/lib/kafka-connect-simulation";

export function KafkaConnectLab(){
  const [state,setState]=useState(()=>createKafkaConnectState());
  const [inspectorTab,setInspectorTab]=useState<"original"|"transformed">("transformed");

  const originalJson=useMemo(()=>JSON.stringify(state.sourceRecord,null,2),[state.sourceRecord]);
  const transformedJson=useMemo(()=>JSON.stringify(state.transformedRecord,null,2),[state.transformedRecord]);

  const run=()=>setState(s=>runKafkaConnectSimulation(s));
  const reset=()=>{setState(createKafkaConnectState());setInspectorTab("transformed");};

  return <section className="kcn-lab" aria-label="Kafka Connect interactive simulation">
    <header className="kcn-toolbar">
      <div className="kcn-heading">
        <span><Play size={19} fill="currentColor"/></span>
        <div>
          <h2>Interactive Simulation</h2>
          <p>See how source and sink connectors move data through Kafka, with transforms, tasks and real-time metrics.</p>
        </div>
      </div>
      <div className="kcn-controls">
        <label><span>Scenario</span><select value={state.scenario} onChange={e=>setState(s=>setConnectScenario(s,e.target.value as ConnectScenarioId))}>{connectScenarios.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <button onClick={reset}><RefreshCcw size={14}/>Reset</button>
        <button className="kcn-run" onClick={run}><Play size={14} fill="currentColor"/>Run Simulation</button>
      </div>
    </header>

    <div className="kcn-flow-grid">
      <article className="kcn-source-system">
        <header><span><Database size={17}/></span><h3>Source System</h3></header>
        <div className="kcn-system-brand"><Database size={35}/><div><strong>PostgreSQL</strong><span>Connected</span></div></div>
        <section className="kcn-table-card">
          <header><Table2 size={14}/><strong>orders</strong></header>
          <dl>
            <div><dt>id</dt><dd>INT</dd></div>
            <div><dt>user_id</dt><dd>INT</dd></div>
            <div><dt>amount</dt><dd>DECIMAL</dd></div>
            <div><dt>product</dt><dd>TEXT</dd></div>
            <div><dt>created_at</dt><dd>TIMESTAMP</dd></div>
          </dl>
        </section>
        <p className="kcn-poll"><RefreshCcw size={13}/>Polling new/updated rows</p>
      </article>

      <div className="kcn-arrow" aria-hidden="true">→</div>

      <article className="kcn-source-connector">
        <header><span><Server size={17}/></span><div><h3>Source Connector</h3><p>PostgresSourceConnector</p></div><em>Running</em></header>
        <pre>{JSON.stringify({
          "connector.class":"io.debezium.connector.postgresql.PostgresConnector",
          "topic.prefix":"dbserver1",
          "table.include.list":"public.orders",
          "tasks.max":2
        },null,2)}</pre>
        <div className="kcn-chip-row"><span>tasks.max: 2</span><span>topic: orders</span><span>transforms: 1</span><span>mode: CDC</span></div>
        <h4>Tasks (2)</h4>
        <div className="kcn-task-list">{state.sourceTasks.map(task=><article key={task.id}><span><CircleDot size={10}/>Task {task.id}</span><b>{task.status}</b><em>{task.records.toLocaleString()} recs</em><small>{task.retries} retries</small></article>)}</div>
      </article>

      <div className="kcn-arrow" aria-hidden="true">→</div>

      <article className="kcn-topic">
        <header><span><Database size={17}/></span><h3>Kafka Topic<br/><strong>orders</strong></h3></header>
        <span className="kcn-rate">{state.topicRate} messages/sec</span>
        <section>
          <h4>Latest Record</h4>
          <pre>{JSON.stringify({
            order_id:state.sourceRecord.order_id,
            user_id:state.sourceRecord.user_id,
            amount:state.sourceRecord.amount,
            product:state.sourceRecord.product,
            created_at:state.sourceRecord.created_at
          },null,2)}</pre>
        </section>
        <footer><span><Database size={16}/>3 partitions</span><div>{state.topicOffsets.map((offset,index)=><b key={index}>P{index}<small>{offset}</small></b>)}</div></footer>
      </article>

      <article className="kcn-transform">
        <header><Sparkles size={16}/><h3>Transform<br/>(SMT)</h3></header>
        <section><span>✦</span><div><strong>Mask Email</strong><small>Redact user_email</small></div></section>
        <section><span>✎</span><div><strong>Rename Field</strong><small>amount → total_amount</small></div></section>
        <section><span>◉</span><div><strong>Flatten JSON</strong><small>Flatten nested fields</small></div></section>
      </article>

      <div className="kcn-arrow orange" aria-hidden="true">→</div>

      <article className="kcn-sink-connector">
        <header><span><Server size={17}/></span><div><h3>Sink Connector</h3><p>SnowflakeSinkConnector</p></div><em>Running</em></header>
        <pre>{JSON.stringify({
          "connector.class":"com.snowflake.kafka.connector.SnowflakeSinkConnector",
          "topics":"orders",
          "tasks.max":2,
          "snowflake.url":"***",
          "snowflake.db":"ANALYTICS"
        },null,2)}</pre>
        <div className="kcn-chip-row"><span>tasks.max: 2</span><span>topics: orders</span><span>auto.create: true</span><span>insert.mode: upsert</span></div>
        <h4>Tasks (2)</h4>
        <div className="kcn-task-list">{state.sinkTasks.map(task=><article key={task.id}><span><CircleDot size={10}/>Task {task.id}</span><b>{task.status}</b><em>{task.records.toLocaleString()} recs</em><small>{task.retries} {task.retries===1?"retry":"retries"}</small></article>)}</div>
      </article>

      <div className="kcn-arrow" aria-hidden="true">→</div>

      <article className="kcn-destination">
        <header><Snowflake size={18}/><h3>Destination System</h3></header>
        <div className="kcn-system-brand snow"><Snowflake size={35}/><div><strong>Snowflake</strong><span>Connected</span></div></div>
        <section className="kcn-table-card">
          <header><Table2 size={14}/><strong>orders_analytics</strong></header>
          <dl>
            <div><dt>order_id</dt><dd>NUMBER</dd></div>
            <div><dt>user_id</dt><dd>NUMBER</dd></div>
            <div><dt>total_amount</dt><dd>FLOAT</dd></div>
            <div><dt>product</dt><dd>VARCHAR</dd></div>
            <div><dt>created_at</dt><dd>TIMESTAMP</dd></div>
          </dl>
        </section>
        <p className="kcn-ingest"><CircleDot size={11}/>Ingesting records...</p>
      </article>
    </div>

    <div className="kcn-metrics">
      <article><span><Zap size={17}/></span><div><strong>Connector Status</strong><b>2 / 2 running</b><small>All tasks healthy</small></div></article>
      <article><span><Database size={17}/></span><div><strong>Records Processed</strong><b>{state.processedRecords.toLocaleString()}</b><small>({state.topicRate.toFixed(1)} recs/sec)</small></div></article>
      <article><span><RefreshCcw size={17}/></span><div><strong>Consumer Lag</strong><b>{state.consumerLag}</b><small>records behind</small></div></article>
      <article><span><RefreshCcw size={17}/></span><div><strong>Retries</strong><b>{state.retries}</b><small>(last 5 min)</small></div></article>
      <article><span><AlertTriangle size={17}/></span><div><strong>DLQ Records</strong><b>{state.dlqRecords}</b><small>No failed records</small></div></article>
      <article><span><Zap size={17}/></span><div><strong>End-to-End Latency</strong><b>~ {state.latencyMs} ms</b><small>avg per record</small></div></article>
    </div>

    <div className="kcn-lower-grid">
      <section className="kcn-event-log">
        <header><h3>Event Log / Connector Activity</h3><button onClick={()=>setState(s=>clearConnectEvents(s))}>Clear</button></header>
        <div className="kcn-event-filters"><button className="active">All</button><button>Source</button><button>Task</button><button>Transform</button><button>Sink</button><button>Error</button></div>
        <ol>{state.events.length?state.events.slice(-8).map(event=><li key={event.id}><time>{event.time}</time><b className={"role-"+event.role.toLowerCase()}>{event.role}</b><span>{event.text}</span></li>):<li className="kcn-empty-log">No events yet. Run the simulation to generate connector activity.</li>}</ol>
      </section>

      <section className="kcn-inspector">
        <header><h3>Record Inspector</h3><button><Table2 size={13}/>View as Table</button></header>
        <div className="kcn-inspector-tabs"><button className={inspectorTab==="original"?"active":""} onClick={()=>setInspectorTab("original")}>Original Record</button><button className={inspectorTab==="transformed"?"active":""} onClick={()=>setInspectorTab("transformed")}>After Transform</button></div>
        <div className="kcn-inspector-body">
          <pre className={inspectorTab==="original"?"focus":""}>{originalJson}</pre>
          <span>→</span>
          <pre className={inspectorTab==="transformed"?"focus":""}>{transformedJson}</pre>
        </div>
        <p><CheckCircle2 size={13}/>Transforms applied: RenameField (amount → total_amount), MaskField (user_email)</p>
      </section>
    </div>

    <footer className="kcn-status"><span><CircleDot size={11}/>Running</span><p>{state.status}</p><span>{state.sourceRecords.toLocaleString()} source records observed</span></footer>
  </section>;
}
