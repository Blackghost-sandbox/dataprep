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

const model=load(path.join(root,"lib/cloud-compute-simulation.ts"));
const controls=model.defaultComputeControls();
assert.equal(controls.vmInstanceType,"t3.medium");
assert.equal(controls.vmInstances,2);
assert.equal(controls.replicas,3);
assert.equal(controls.memoryMb,1024);
assert.equal(controls.invocations,1000);

const daily=model.simulateCompute(controls,"daily-sales");
assert.equal(daily.vm.startup,"~ 2–3 min");
assert.equal(daily.vm.processingMinutes,5);
assert.equal(daily.container.processingMinutes,4.5);
assert.equal(daily.serverless.processingMinutes,4.2);
assert.equal(daily.vm.cost,.067);
assert.equal(daily.container.cost,.042);
assert.equal(daily.serverless.cost,.021);
assert.equal(daily.vm.scalability,"Manual");
assert.equal(daily.container.scalability,"Automatic");
assert.equal(daily.serverless.scalability,"Automatic");
assert.equal(daily.winner,"serverless");
assert.ok(daily.logs.some(entry=>entry.text.includes("Job completed successfully")));
assert.ok(daily.logs.some(entry=>entry.text.includes("Total cost: $0.021")));

const scaled=model.simulateCompute({...controls,vmScaling:"Auto Scaling Group",vmInstances:4,replicas:6,memoryMb:2048,invocations:2500},"nightly-python");
assert.equal(scaled.vm.scalability,"Automatic");
assert.ok(scaled.vm.cost>daily.vm.cost);
assert.ok(scaled.container.cost>daily.container.cost);
assert.ok(scaled.serverless.cost>daily.serverless.cost);
assert.equal(scaled.serverless.startup,"~ 80 ms");

const event=model.simulateCompute({...controls,memoryMb:512,invocations:200},"event-validation");
assert.equal(event.serverless.startup,"~ 140 ms");
assert.ok(event.serverless.processingMinutes<1);

const {CloudComputeLab,CloudComputeHero}=load(path.join(root,"components/cloud-compute-lab.tsx"));
const html=renderToString(React.createElement(CloudComputeLab));
for(const text of [
  "Run Simulation","ETL: Daily Sales Processing","Virtual Machines (VMs)",
  "Containers (Docker + Orchestration)","Serverless (Functions)",
  "t3.medium (2 vCPU, 4 GB)","Kubernetes (EKS/GKE/AKS)","ETL Processor",
  "$0.067","$0.042","$0.021","Execution Flow","Simulation Results",
  "Execution Logs","Compare Key Characteristics","Key Takeaways"
])assert.ok((html.includes(text)||html.replace(/<[^>]*>/g,"").includes(text)),text);

const hero=renderToString(React.createElement(CloudComputeHero,{
  description:"Choose an execution model based on workload duration, scaling, startup behavior, isolation, operational ownership, and cost.",
  minutes:24,currentLesson:3,total:11,onPrevious:()=>{},onNext:()=>{}
}));
for(const text of ["Compute: VMs, Containers & Serverless","24 min","Lesson 4/11","Intermediate","Previous","Next"]){
  assert.ok(hero.includes(text),text);
}

console.log("PASS: compute controls, reference metrics, cost changes, scenario behavior, SSR controls and hero.");
