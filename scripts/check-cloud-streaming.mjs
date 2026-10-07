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
  const code=ts.transpileModule(source,{compilerOptions:{
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,
    jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true
  }}).outputText;
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

const model=load(path.join(root,"lib/cloud-streaming-simulation.ts"));
const controls=model.defaultStreamingControls();
assert.equal(controls.platform,"kafka");
assert.equal(controls.eventType,"orders");
assert.equal(controls.eventsPerSecond,10);
assert.equal(controls.partitionKey,"user_id");
assert.equal(controls.partitions,3);
assert.equal(controls.consumerGroup,"order-processor");
assert.equal(controls.consumers,2);

const initial=model.referenceStreamingState();
assert.equal(initial.running,true);
assert.deepEqual(initial.partitions.map(p=>p.events),[12,9,11]);
assert.deepEqual(initial.consumers.map(c=>c.rate),[8,7]);
assert.deepEqual(initial.consumers.map(c=>c.lag),[2,3]);
assert.equal(initial.metrics.ingressRate,10);
assert.equal(initial.metrics.processingRate,15);
assert.equal(initial.metrics.totalLag,5);
assert.equal(initial.metrics.retentionHours,168);
assert.equal(initial.events[0].event_id,"evt_7832");
assert.equal(initial.events[0].partition,1);
assert.equal(model.stablePartition("user_1001",3),1);

const routed=model.sendPartitionedEvent(initial,"user_1001",3);
assert.equal(routed.target,1);
assert.equal(routed.partitions[1].events,10);
assert.equal(routed.partitions[1].keys.at(-1),"user_1001");

const scaled=model.simulateStreaming({...controls,eventsPerSecond:30,partitions:6,consumers:3});
assert.equal(scaled.partitions.length,6);
assert.equal(scaled.consumers.length,3);
assert.equal(scaled.metrics.ingressRate,30);
assert.equal(scaled.metrics.partitions,6);
assert.equal(scaled.metrics.consumers,3);
assert.ok(scaled.metrics.processingRate>initial.metrics.processingRate);

const kinesis=model.simulateStreaming({...controls,platform:"kinesis"});
assert.equal(kinesis.metrics.retentionHours,24);
assert.ok(kinesis.status.includes("Kinesis"));

const pubsub=model.simulateStreaming({...controls,platform:"pubsub"});
assert.ok(pubsub.status.includes("Pub/Sub"));

assert.equal(model.deliverySemantics.length,3);
assert.equal(model.deliverySemantics[0].label,"At Most Once");
assert.equal(model.deliverySemantics[1].label,"At Least Once");
assert.equal(model.deliverySemantics[2].label,"Exactly Once");

const {CloudStreamingLab,CloudStreamingHero}=load(path.join(root,"components/cloud-streaming-lab.tsx"));
const html=renderToString(React.createElement(CloudStreamingLab));
for(const text of [
  "Run Simulation","Streaming Platform","Apache Kafka (Self-Managed)","Produce Events",
  "E-commerce Orders","Events per second","Event Key (Partition Key)","user_id",
  "Start Producing","Partition 0","12 events","Partition 1","9 events","Partition 2","11 events",
  "Consumers","order-processor","Consumer 1","8 events/sec","Lag: 2","Consumer 2","7 events/sec","Lag: 3",
  "Output (Processed Events)","Events","Metrics","Delivery Semantics Comparison",
  "At Most Once","At Least Once","Exactly Once","Partitioning & Ordering",
  "user_1001","Send Event","Key Takeaways"
])assert.ok((html.includes(text)||html.replace(/<[^>]*>/g,"").includes(text)),text);

const hero=renderToString(React.createElement(CloudStreamingHero,{
  description:"Design cloud event pipelines around partitions, ordering scope, retention, consumer scaling, delivery semantics, and recovery.",
  minutes:28,currentLesson:7,total:11,onPrevious:()=>{},onNext:()=>{}
}));
for(const text of [
  "Streaming & Messaging","28 min","Lesson 8/11","Intermediate",
  "Producers","Streaming Platform","Consumers","Previous","Next"
])assert.ok(hero.includes(text),text);

console.log("PASS: streaming reference state, partition routing, consumer scaling, provider behavior, delivery semantics, SSR controls and hero.");
