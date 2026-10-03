"use client";

import {useMemo,useState} from "react";
import {
  AlertTriangle, CheckCircle2, CircleDot, Database, FileJson, Play, RefreshCcw,
  ShieldCheck, Sparkles
} from "lucide-react";
import {
  createSchemaSimulationState, isSchemaPairCompatible, produceSchemaMessage,
  rawBytes, readMessage, schemaFormats, schemaVersions, selectSchemaMessage,
  selectedSchemaMessage, serializeMessage, setReaderVersion, setSerializationFormat,
  setShowRawBytes, setWriterVersion, writerPayload,
  type SchemaVersion, type SerializationFormat
} from "@/lib/kafka-serialization-schema-simulation";

const versionTone:Record<SchemaVersion,string>={v1:"purple",v2:"orange",v3:"green"};

export function KafkaSerializationSchemaLab(){
  const [state,setState]=useState(()=>createSchemaSimulationState());
  const selected=selectedSchemaMessage(state);
  const read=selected?readMessage(selected,state.reader):null;
  const compatibility=isSchemaPairCompatible(state.writer,state.reader);
  const preview=writerPayload(state.writer,state.runCount);
  const serialized=selected?serializeMessage(selected,state.format):"";
  const bytes=useMemo(()=>rawBytes(serialized),[serialized]);

  const run=()=>setState(s=>produceSchemaMessage(s));
  const reset=()=>setState(createSchemaSimulationState());

  return <section className="kse-lab" aria-label="Kafka serialization and schema evolution interactive simulation">
    <header className="kse-toolbar">
      <div className="kse-heading">
        <span><Play size={19} fill="currentColor"/></span>
        <div>
          <h2>Interactive Simulation</h2>
          <p>Change the schema, send a message, and see how different readers handle it.</p>
        </div>
      </div>
      <div className="kse-controls">
        <button className="kse-run" onClick={run}><Play size={14} fill="currentColor"/>Run</button>
        <button onClick={reset}><RefreshCcw size={14}/>Reset</button>
        <label><span>Format</span><select value={state.format} onChange={e=>setState(s=>setSerializationFormat(s,e.target.value as SerializationFormat))}>{schemaFormats.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label className="kse-switch"><input type="checkbox" checked={state.showRawBytes} onChange={e=>setState(s=>setShowRawBytes(s,e.target.checked))}/><i/><b>Show raw bytes</b></label>
      </div>
    </header>

    <div className="kse-main-grid">
      <article className="kse-writer">
        <header><span className="step">1</span><div><h3>Producer (Writer)</h3><p>Creates events using a schema.</p></div></header>
        <div className="kse-version-tabs">{schemaVersions.map(version=><button key={version.id} className={state.writer===version.id?"is-active":""} onClick={()=>setState(s=>setWriterVersion(s,version.id))}>{version.label}</button>)}</div>
        <div className="kse-code-wrap">
          <pre>{JSON.stringify(preview,null,2)}</pre>
          <small>{state.writer==="v1"?"Original schema":state.writer==="v2"?"Adds optional currency field":"Removes product field"}</small>
        </div>
        <div className={"kse-compat "+(compatibility.ok?"ok":"bad")}><span>{compatibility.ok?<CheckCircle2 size={14}/>:<AlertTriangle size={14}/>}</span><p>{compatibility.reason}</p></div>
        <button className="kse-produce" onClick={run}><Play size={14} fill="currentColor"/>Produce Message</button>
      </article>

      <div className="kse-arrow" aria-hidden="true">→</div>

      <article className="kse-topic">
        <header><span><Database size={18}/></span><h3>Kafka Topic: <strong>orders</strong></h3><small>{state.messages.length} messages</small></header>
        <div className="kse-message-list">
          {state.messages.slice(-3).map(message=>{
            const tone=versionTone[message.schema];
            const previewText=state.showRawBytes
              ?rawBytes(serializeMessage(message,state.format)).slice(0,70)+"…"
              :serializeMessage(message,state.format).slice(0,90)+"…";
            return <button key={message.id} className={"kse-topic-message "+tone+(state.selectedOffset===message.offset?" is-selected":"")} onClick={()=>setState(s=>selectSchemaMessage(s,message.offset))}>
              <span className="kse-doc-icon"><FileJson size={16}/></span>
              <div className="kse-offset"><strong>Offset {message.offset}</strong><small>{message.timestamp}</small></div>
              <b>{message.schema.toUpperCase()}</b>
              <code>{previewText}</code>
            </button>;
          })}
        </div>
      </article>

      <div className="kse-arrow" aria-hidden="true">→</div>

      <article className="kse-reader">
        <header><span className="step">3</span><div><h3>Consumer (Reader)</h3><p>Reads using a (possibly older) schema.</p></div></header>
        <div className="kse-version-tabs">{schemaVersions.map(version=><button key={version.id} className={state.reader===version.id?"is-active":""} onClick={()=>setState(s=>setReaderVersion(s,version.id))}>Reader {version.short}</button>)}</div>
        <div className="kse-reader-output">
          {selected&&read?.value?<pre>{JSON.stringify(read.value,null,2)}</pre>:<pre>{JSON.stringify({error:"No message selected"},null,2)}</pre>}
          {selected&&<small>Offset {selected.offset} · Writer {selected.schema.toUpperCase()} → Reader {state.reader.toUpperCase()}</small>}
        </div>
        <div className={"kse-read-result "+(read?.ok?"ok":"bad")}>
          {read?.ok?<CheckCircle2 size={20}/>:<AlertTriangle size={20}/>}
          <div><strong>{read?.ok?"Successfully deserialized!":"Deserialization failed"}</strong><p>{read?.reason??"Select a message."}</p>{read?.ignoredFields.length?<small>Ignored: {read.ignoredFields.join(", ")}</small>:null}</div>
        </div>
      </article>
    </div>

    <div className="kse-lower-grid">
      <section className="kse-strategies">
        <header><span><ShieldCheck size={17}/></span><div><h3>Schema Evolution Strategies</h3><p>Add, remove or rename fields without breaking existing consumers.</p></div></header>
        <div>
          <article><b>Backward</b><span><CheckCircle2 size={13}/>Old readers can read new data</span></article>
          <article><b>Forward</b><span><CheckCircle2 size={13}/>New readers can read old data</span></article>
          <article><b>Full</b><span><CheckCircle2 size={13}/>Both directions work</span></article>
        </div>
      </section>

      <section className="kse-incompatible">
        <header><span><AlertTriangle size={17}/></span><div><h3>Common Incompatible Changes</h3><p>These changes can break consumers.</p></div></header>
        <ul>
          {["Changing field type (int → string)","Removing a required field","Renaming a field without alias","Changing field meaning","Incompatible nested schema changes"].map(item=><li key={item}><b>×</b><span>{item}</span></li>)}
        </ul>
      </section>

      <section className="kse-takeaways">
        <header><span><Sparkles size={17}/></span><h3>Key Takeaways</h3></header>
        <ul>
          {[
            "Serialization converts objects to bytes.",
            "Producers and consumers must agree on format.",
            "Schema evolution allows safe changes.",
            "Use schema registry (Avro/Protobuf) in production.",
            "Plan for backward/forward compatibility.",
          ].map(item=><li key={item}><CheckCircle2 size={14}/><span>{item}</span></li>)}
        </ul>
        <div className="kse-byte-preview">
          <strong>{state.showRawBytes?"Selected raw bytes":"Selected serialized payload"}</strong>
          <code>{state.showRawBytes?bytes:serialized}</code>
        </div>
      </section>
    </div>

    <footer className="kse-status"><span><CircleDot size={11}/>Live</span><p>{state.status}</p><span>Writer {state.writer.toUpperCase()} · Reader {state.reader.toUpperCase()} · {state.format}</span></footer>
  </section>;
}
