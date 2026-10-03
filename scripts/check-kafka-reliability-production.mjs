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

const model=load(path.join(root,"lib/kafka-reliability-production-simulation.ts"));

let state=model.createReliabilityState();
assert.equal(state.scenario,"high-throughput");
assert.equal(state.acksAll,true);
assert.equal(state.idempotentProducer,true);
assert.equal(state.retries,3);
assert.equal(state.dlqEnabled,true);
assert.equal(state.autoCommit,false);
assert.equal(state.sendRate,500);
assert.equal(state.throughput,498);
assert.equal(state.processed,497);
assert.equal(state.failed,3);
assert.equal(state.consumerLag,12);
assert.equal(state.retryAttempts,2);
assert.equal(state.retryQueue,1);
assert.equal(state.dlqMessages,2);
assert.equal(state.avgLatencyMs,42);
assert.equal(state.errorRate,0.6);
assert.equal(state.brokerHealth,3);
assert.equal(state.isr,3);

const high=model.runReliabilitySimulation(state);
assert.ok(high.processed>state.processed);
assert.ok(high.consumerLag<state.consumerLag);
assert.ok(high.avgLatencyMs<=state.avgLatencyMs);
assert.ok(high.events.some(event=>event.role==="MONITOR"));

const poison=model.runReliabilitySimulation(model.setReliabilityScenario(state,"poison-message"));
assert.equal(poison.failed,state.failed+1);
assert.equal(poison.dlqMessages,state.dlqMessages+1);
assert.ok(poison.events.some(event=>event.role==="DLQ"));
assert.ok(poison.status.includes("DLQ"));

const noDlq=model.setReliabilityOption(state,"dlqEnabled",false);
const poisonNoDlq=model.runReliabilitySimulation(model.setReliabilityScenario(noDlq,"poison-message"));
assert.equal(poisonNoDlq.dlqMessages,state.dlqMessages);
assert.ok(poisonNoDlq.status.includes("disabled"));

const degraded=model.runReliabilitySimulation(model.setReliabilityScenario(state,"broker-degradation"));
assert.equal(degraded.brokerHealth,2);
assert.equal(degraded.isr,2);
assert.ok(degraded.consumerLag>state.consumerLag);
assert.ok(degraded.events.some(event=>event.role==="BROKER"));

const lagged=model.runReliabilitySimulation(model.setReliabilityScenario(state,"consumer-lag-spike"));
assert.equal(lagged.sendRate,760);
assert.ok(lagged.consumerLag>state.consumerLag);
assert.ok(lagged.avgLatencyMs>state.avgLatencyMs);

const options=model.setReliabilityRetries(model.setReliabilityOption(state,"acksAll",false),5);
assert.equal(options.acksAll,false);
assert.equal(options.retries,5);

const cleared=model.clearReliabilityEvents(state);
assert.deepEqual(cleared.events,[]);

const {KafkaReliabilityProductionLab}=load(path.join(root,"components/kafka-reliability-production-lab.tsx"));
const html=renderToString(React.createElement(KafkaReliabilityProductionLab));
for(const text of [
  "Interactive Simulation","Run Simulation","Reset","High Throughput Orders",
  "Acks = all","Idempotent Producer = On","Retries = 3","DLQ = Enabled","Auto Commit = Off",
  "Producer","Kafka Topic / Brokers","Consumer Group","Retry &amp; DLQ","Monitoring / Metrics",
  "Event Log","Reliability Metrics","Message / Failure Inspector",
  "Best Practices","Common Failure Modes","Key Takeaways"
]){
  assert.ok(html.includes(text),text);
}

console.log("PASS: high-throughput flow, poison-message DLQ, disabled-DLQ risk, broker degradation, lag spike, policy controls, event clearing and SSR controls.");
