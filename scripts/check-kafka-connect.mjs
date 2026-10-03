import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {createRequire} from "node:module";
import assert from "node:assert/strict";
import ts from "typescript";
import React from "react";
import {renderToString} from "react-dom/server";

const root=path.resolve(import.meta.dirname,"..");
const require=createRequire(import.meta.url);
const cache=new Map();

function load(file){
  if(cache.has(file))return cache.get(file).exports;
  const loaded={exports:{}};cache.set(file,loaded);
  const source=fs.readFileSync(file,"utf8");
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const localRequire=name=>{
    if(name.startsWith("@/")||name.startsWith(".")){
      const base=name.startsWith("@/")?path.join(root,name.slice(2)):path.resolve(path.dirname(file),name);
      const found=[".tsx",".ts","/index.tsx","/index.ts"].map(ext=>base+ext).find(fs.existsSync);
      assert.ok(found,"Module not found: "+name);
      return load(found);
    }
    return require(name);
  };
  vm.runInThisContext("(function(require,module,exports){"+code+"\n})",{filename:file})(localRequire,loaded,loaded.exports);
  return loaded.exports;
}

const model=load(path.join(root,"lib/kafka-connect-simulation.ts"));

let state=model.createKafkaConnectState();
assert.equal(state.scenario,"normal");
assert.equal(state.running,true);
assert.equal(state.sourceTasks.length,2);
assert.equal(state.sinkTasks.length,2);
assert.equal(state.processedRecords,12438);
assert.equal(state.consumerLag,8);
assert.equal(state.retries,1);
assert.equal(state.dlqRecords,0);
assert.deepEqual(state.topicOffsets,[102,103,104]);
assert.equal(state.transformedRecord.total_amount,299);
assert.equal(state.transformedRecord.user_email,"j***@example.com");

const normal=model.runKafkaConnectSimulation(state);
assert.equal(normal.processedRecords,12439);
assert.equal(normal.consumerLag,7);
assert.equal(normal.sourceRecord.order_id,1044);
assert.equal(normal.transformedRecord.total_amount,299);
assert.ok(normal.events.some(event=>event.role==="SINK"&&event.text.includes("Snowflake")));

const retry=model.runKafkaConnectSimulation(model.setConnectScenario(state,"sink-retry"));
assert.equal(retry.retries,2);
assert.equal(retry.sinkTasks.find(task=>task.id===1).retries,2);
assert.equal(retry.consumerLag,7);
assert.ok(retry.events.some(event=>event.role==="ERROR"));
assert.ok(retry.events.some(event=>event.role==="SINK"&&event.text.includes("after retry")));

const dlq=model.runKafkaConnectSimulation(model.setConnectScenario(state,"transform-error"));
assert.equal(dlq.dlqRecords,1);
assert.equal(dlq.consumerLag,9);
assert.ok(dlq.status.includes("DLQ"));
assert.ok(dlq.events.some(event=>event.role==="ERROR"));

const cleared=model.clearConnectEvents(state);
assert.deepEqual(cleared.events,[]);

const {KafkaConnectLab}=load(path.join(root,"components/kafka-connect-lab.tsx"));
const html=renderToString(React.createElement(KafkaConnectLab));
for(const text of [
  "Interactive Simulation","Run Simulation","Reset","Scenario",
  "Source System","PostgreSQL","Source Connector","PostgresSourceConnector",
  "Kafka Topic","orders","Transform","Sink Connector","SnowflakeSinkConnector",
  "Destination System","Snowflake","Connector Status","Records Processed",
  "Consumer Lag","Retries","DLQ Records","End-to-End Latency",
  "Event Log / Connector Activity","Record Inspector","Original Record","After Transform"
]){
  assert.ok(html.includes(text),text);
}

console.log("PASS: source→Kafka→transform→sink pipeline, retry recovery, transform-error DLQ, metrics, task state and SSR controls.");
