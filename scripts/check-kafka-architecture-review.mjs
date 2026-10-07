import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {createRequire} from "node:module";
import assert from "node:assert/strict";
import ts from "typescript";
import React from "react";
import {renderToString as renderRawToString} from "react-dom/server";
// React can split visible text with hydration comments and escape entities.
const renderToString=(node)=>renderRawToString(node).replace(/<!--[^]*?-->/g,"").replace(/&amp;/g,"&").replace(/&gt;/g,">").replace(/&lt;/g,"<").replace(/&quot;/g,'"').replace(/&#x27;|&#39;/g,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));

const root=path.resolve(import.meta.dirname,"..");
const require=createRequire(import.meta.url);
const cache=new Map();

function load(file){
  if(file.endsWith(".json"))return JSON.parse(fs.readFileSync(file,"utf8"));
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

const model=load(path.join(root,"lib/kafka-architecture-review-simulation.ts"));

let state=model.createArchitectureReviewState();
assert.equal(state.scenario,"normal-flow");
assert.equal(state.activePartition,"P0");
assert.equal(state.activeConsumer,1);
assert.equal(state.committedOffset,211);
assert.equal(state.events.length,5);
assert.equal(state.brokers.length,3);
assert.equal(state.brokers[0].partitions.find(p=>p.id==="P0").role,"leader");
assert.equal(state.brokers[1].partitions.find(p=>p.id==="P1").role,"leader");
assert.equal(state.brokers[2].partitions.find(p=>p.id==="P2").role,"leader");

const next=model.nextArchitectureStep(state);
assert.equal(next.currentStep,1);
assert.ok(next.status.includes("P0"));

const complete=model.runArchitectureSimulation(state);
assert.equal(complete.currentStep,4);
assert.equal(complete.committedOffset,212);
assert.ok(complete.events.every(event=>event.status==="complete"));
assert.ok(complete.status.includes("producer"));

const failedScenario=model.setArchitectureScenario(state,"broker-failure");
const failed=model.runArchitectureSimulation(failedScenario);
assert.equal(failed.brokerFailure,1);
assert.equal(failed.brokers.find(b=>b.id===1).healthy,false);
assert.equal(failed.brokers.find(b=>b.id===2).partitions.find(p=>p.id==="P0").role,"leader");
assert.equal(failed.committedOffset,212);
assert.ok(failed.status.includes("Broker 2"));

const rebalanceScenario=model.setArchitectureScenario(state,"consumer-rebalance");
const rebalanced=model.runArchitectureSimulation(rebalanceScenario);
assert.equal(rebalanced.activeConsumer,2);
assert.equal(rebalanced.committedOffset,212);
assert.ok(rebalanced.status.includes("Consumer 2"));

const reset=model.resetArchitectureSimulation();
assert.equal(reset.brokerFailure,null);
assert.equal(reset.activeConsumer,1);
assert.equal(reset.committedOffset,211);

const {KafkaArchitectureReviewLab}=load(path.join(root,"components/kafka-architecture-review-lab.tsx"));
const html=renderToString(React.createElement(KafkaArchitectureReviewLab));
for(const text of [
  "End-to-End Architecture","Run Simulation","Next Step","Reset","Normal Event Flow",
  "Producer","Kafka Cluster","Broker 1","Broker 2","Broker 3","Consumer Group",
  "Topic: orders","3 partitions (P0, P1, P2)","Replication factor: 3","Min ISR: 2",
  "Event Flow (Sequence)","Key Concepts","Common Interview Questions","Design Patterns"
]){
  assert.ok((html.includes(text)||html.replace(/<[^>]*>/g,"").includes(text)),text);
}

console.log("PASS: normal architecture trace, broker failure/leader election, consumer rebalance, committed offset progression and SSR controls.");
