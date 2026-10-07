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

const model=load(path.join(root,"lib/cloud-networking-observability-simulation.ts"));

const controls=model.defaultObservabilityControls();
assert.equal(controls.scenario,"service-failure-retry");
assert.equal(controls.eventsPerSecond,100);
assert.equal(controls.region,"us-east-1");
assert.equal(controls.networkIssue,"none");
assert.equal(controls.simulateNetworkIssue,false);
assert.equal(controls.dataService,"kinesis");
assert.equal(controls.retention,"24h");
assert.equal(controls.workerCount,3);
assert.equal(controls.processingTimeSeconds,2);
assert.equal(controls.showMetrics,true);
assert.equal(controls.showLogs,true);
assert.equal(controls.showTraces,true);
assert.equal(controls.alertsEnabled,true);

const initial=model.referenceObservabilityState();
assert.equal(initial.metrics.incomingEvents,100);
assert.equal(initial.metrics.processedEvents,98);
assert.equal(initial.metrics.errorRatePct,2);
assert.equal(initial.metrics.latencyMs,850);
assert.equal(initial.metrics.retries,4);
assert.equal(initial.metrics.consumerLag,12);
assert.equal(initial.alertTriggered,false);
assert.deepEqual(initial.traces.map(span=>span.durationMs),[12,35,18,620,45]);
assert.ok(initial.logs.some(log=>log.text.includes("Network timeout to consumer")));
assert.ok(initial.logs.some(log=>log.text.includes("Retrying (1/3)")));
assert.ok(initial.logs.some(log=>log.text.includes("Consumer connection restored")));
assert.ok(initial.logs.some(log=>log.text.includes("Pipeline healthy")));

const defaultRun=model.computeObservability(controls);
assert.equal(defaultRun.metrics.incomingEvents,100);
assert.equal(defaultRun.metrics.processedEvents,98);
assert.equal(defaultRun.metrics.errorRatePct,2);
assert.equal(defaultRun.metrics.latencyMs,850);
assert.equal(defaultRun.metrics.retries,4);
assert.equal(defaultRun.metrics.consumerLag,12);
assert.equal(defaultRun.alertTriggered,false);

const timeout=model.computeObservability({
  ...controls,
  simulateNetworkIssue:true,
  networkIssue:"timeout",
});
assert.ok(timeout.metrics.errorRatePct>5);
assert.ok(timeout.metrics.latencyMs>850);
assert.ok(timeout.metrics.consumerLag>12);
assert.equal(timeout.alertTriggered,true);
assert.ok(timeout.logs.some(log=>log.level==="WARN"));

const blocked=model.computeObservability({
  ...controls,
  simulateNetworkIssue:true,
  networkIssue:"blocked",
});
assert.equal(blocked.alertTriggered,true);
assert.equal(blocked.healthy,false);
assert.ok(blocked.logs.some(log=>log.level==="ERROR"));

const scaled=model.computeObservability({
  ...controls,
  eventsPerSecond:400,
  workerCount:1,
  processingTimeSeconds:6,
});
assert.ok(scaled.metrics.processedEvents<400);
assert.ok(scaled.metrics.consumerLag>12);

const healthy=model.computeObservability({...controls,scenario:"healthy"});
assert.equal(healthy.metrics.errorRatePct,.5);
assert.equal(healthy.metrics.retries,0);
assert.equal(healthy.metrics.latencyMs,410);

const pubsub=model.computeObservability({...controls,dataService:"pubsub"});
assert.ok(pubsub.traces.some(span=>span.label.includes("Pub/Sub")));
assert.ok(pubsub.logs.some(log=>log.text.includes("Pub/Sub")));

const {CloudNetworkingObservabilityLab,CloudNetworkingObservabilityHero}=load(path.join(root,"components/cloud-networking-observability-lab.tsx"));
const html=renderToString(React.createElement(CloudNetworkingObservabilityLab));
for(const text of [
  "Run Simulation","Service failure & auto-retry","1. Data Source","Events/sec","100","us-east-1",
  "2. Network Layer","No issue","Inject selected issue","3. Data Service","Amazon Kinesis","24 hours",
  "4. Consumer","Worker count","Processing time (sec)","5. Monitoring & Alerts",
  "Show metrics","Show logs","Show traces","Enable alert (error > 5%)",
  "Live Metrics","Incoming Events","Processed Events","Error Rate","850","Retries","Consumer Lag",
  "Logs (Live)","Network timeout to consumer","Retrying (1/3)","Traces (Sample Event)",
  "Producer (application)","Network (VPC → Kinesis)","Kinesis (ingest)","Consumer (process)",
  "Write to destination","Key Takeaways"
])assert.ok((html.includes(text)||html.replace(/<[^>]*>/g,"").includes(text)),text);

const hero=renderToString(React.createElement(CloudNetworkingObservabilityHero,{
  description:"Connect private data services safely, design for failure domains, and monitor pipelines with metrics, logs, traces, lineage, and data-quality signals.",
  minutes:30,currentLesson:9,total:11,onPrevious:()=>{},onNext:()=>{}
}));
for(const text of [
  "Networking, Reliability & Observability","30 min","Lesson 10/11","Intermediate",
  "Data","Sources","VPC / Private","Network","Data Services","Metrics","Logs","Traces","Alerts","Previous","Next"
])assert.ok(hero.includes(text),text);

console.log("PASS: networking observability reference state, failure injection, alert threshold, scaling, service traces, SSR controls and hero.");
