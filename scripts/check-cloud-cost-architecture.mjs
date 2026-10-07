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

const model=load(path.join(root,"lib/cloud-cost-architecture-simulation.ts"));
const controls=model.defaultCostControls();

assert.equal(controls.scenario,"hourly-analytics");
assert.equal(controls.dailyDataGb,500);
assert.equal(controls.retentionDays,90);
assert.equal(controls.storageTier,"intelligent");
assert.equal(controls.computeMode,"serverless");
assert.equal(controls.servingMode,"warehouse");
assert.equal(controls.autoScaling,true);
assert.equal(controls.lifecyclePolicy,true);
assert.equal(controls.pruneScans,true);
assert.equal(controls.crossRegion,false);
assert.equal(controls.managedServices,true);
assert.equal(controls.cacheServing,true);

const baseline=model.computeCostMetrics(controls);
assert.ok(baseline.monthlyCost>0);
assert.ok(baseline.costPerTb>0);
assert.ok(baseline.scanTb>0);
assert.ok(baseline.storageTb>0);
assert.ok(baseline.performanceScore>=80);
assert.ok(baseline.reliabilityScore>=90);
assert.ok(baseline.optimizationScore>=80);

const expensive=model.computeCostMetrics({
  ...controls,
  dailyDataGb:1500,
  retentionDays:180,
  storageTier:"standard",
  computeMode:"fixed-cluster",
  autoScaling:false,
  lifecyclePolicy:false,
  pruneScans:false,
  crossRegion:true,
  managedServices:false,
  cacheServing:false,
});
assert.ok(expensive.monthlyCost>baseline.monthlyCost);
assert.ok(expensive.scanTb>baseline.scanTb);
assert.ok(expensive.networkGb>baseline.networkGb);
assert.ok(expensive.optimizationScore<baseline.optimizationScore);

const optimized=model.simulateCostReview(controls);
assert.equal(optimized.reviewItems.length,8);
assert.ok(optimized.recommendations.length>=1);
assert.ok(optimized.status.includes("Review complete"));

const weak=model.simulateCostReview({...controls,autoScaling:false,lifecyclePolicy:false,pruneScans:false,crossRegion:true,cacheServing:false});
assert.ok(weak.recommendations.some(item=>item.includes("autoscaling")));
assert.ok(weak.recommendations.some(item=>item.includes("lifecycle")));
assert.ok(weak.recommendations.some(item=>item.includes("cross-region")));

const {CloudCostArchitectureLab,CloudCostArchitectureHero}=load(path.join(root,"components/cloud-cost-architecture-lab.tsx"));
const html=renderToString(React.createElement(CloudCostArchitectureLab));
for(const text of [
  "Understand Cost Optimization & Architecture Review","MAP THE ARCHITECTURE",
  "1. Ingest","2. Store","3. Process","4. Serve","5. Observe & Optimize",
  "Optimize input","Optimize storage","Optimize compute","Optimize serving","Optimize continuously",
  "Scenario","Hourly analytics","Run Simulation","Daily Data","500 GB/day","90 days",
  "Standard","Serverless / managed","Cloud warehouse","Est. Monthly Cost",
  "Performance","Reliability","Optimization","Cost Optimization Levers",
  "Right-size compute","Optimize storage","Minimize data movement","Manage operational cost",
  "Architecture Review Checklist","Workload shape and SLA requirements",
  "Estimated monthly cost and cost per TB/query","Simulation Recommendations"
])assert.ok((html.includes(text)||html.replace(/<[^>]*>/g,"").includes(text)),text);

const hero=renderToString(React.createElement(CloudCostArchitectureHero,{
  description:"Design a complete cloud data pipeline and reason about cost using workload shape, data scanned, compute time, storage tiers, network movement, and operational effort.",
  minutes:35,currentLesson:10,total:11,onPrevious:()=>{}
}));
for(const text of [
  "Cost Optimization & Architecture Review","35 min","Lesson 11/11","Intermediate",
  "Cost","Performance","Reliability","Scalability"
])assert.ok(hero.includes(text),text);

console.log("PASS: cost architecture model, optimization levers, review checklist, SSR simulator and hero.");
