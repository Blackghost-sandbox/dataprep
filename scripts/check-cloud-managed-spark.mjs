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
  const loaded={exports:{}}; cache.set(file,loaded);
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

const model=load(path.join(root,"lib/cloud-managed-spark-simulation.ts"));
const controls=model.defaultSparkControls();
assert.equal(controls.scenario,"daily-sales");
assert.equal(controls.dataSource,"s3");
assert.equal(controls.fileFormat,"Parquet");
assert.equal(controls.dataSizeGb,1);
assert.equal(controls.clusterType,"Serverless (EMR Serverless)");
assert.equal(controls.workerType,"Standard (4 vCPU, 16 GB)");
assert.equal(controls.autoScaling,true);
assert.equal(controls.minWorkers,2);
assert.equal(controls.maxWorkers,10);
assert.equal(controls.outputFormat,"Parquet");
assert.equal(controls.partitionBy,"date");

const metrics=model.computeSparkMetrics(controls);
assert.equal(metrics.workers,4);
assert.equal(metrics.totalVcpu,16);
assert.equal(metrics.totalMemoryGb,64);
assert.equal(metrics.totalRecords,12500000);
assert.equal(metrics.processingSeconds,71);
assert.ok(metrics.throughput>=176000&&metrics.throughput<177000);
assert.equal(metrics.dataReadGb,1);
assert.equal(metrics.dataWrittenGb,.82);
assert.equal(metrics.estimatedCost,.042);
assert.equal(model.sparkOutputPath(controls),"s3://data-lake/sales/date=2026-10-02/");
assert.equal(model.formatDuration(71),"1 min 11 sec");

const initial=model.referenceSparkState();
assert.equal(initial.stages[0].status,"complete");
assert.equal(initial.stages[1].status,"running");
assert.equal(initial.stages[2].status,"waiting");
assert.equal(initial.stages[3].status,"waiting");
assert.ok(initial.logs.some(entry=>entry.text.includes("EMR Serverless")));
assert.ok(initial.logs.some(entry=>entry.text.includes("Job completed successfully")));

const scaled=model.simulateSpark({
  ...controls,
  dataSizeGb:5,
  workerType:"Compute Optimized (8 vCPU, 16 GB)",
  maxWorkers:15,
  target:"gcs",
  partitionBy:"region",
});
assert.equal(scaled.stages.every(stage=>stage.status==="complete"),true);
assert.ok(scaled.metrics.workers>4);
assert.ok(scaled.metrics.totalVcpu>16);
assert.ok(scaled.metrics.totalRecords>metrics.totalRecords);
assert.ok(scaled.logs.some(entry=>entry.text.includes("gs://data-lake")));
assert.ok(model.sparkOutputPath({...controls,target:"gcs",partitionBy:"region"}).includes("region=us-east-1"));

const fixed=model.computeSparkMetrics({...controls,autoScaling:false,minWorkers:3,dataSizeGb:10});
assert.equal(fixed.workers,3);

const {CloudManagedSparkLab,CloudManagedSparkHero}=load(path.join(root,"components/cloud-managed-spark-lab.tsx"));
const html=renderToString(React.createElement(CloudManagedSparkLab));
for(const text of [
  "Run Simulation","ETL: Daily Sales Processing","Input Data (Storage)",
  "Managed Spark Job","Processing (Spark Stages)","Output (Data Lake)",
  "S3 (Amazon)","Parquet","Serverless (EMR Serverless)","Standard (4 vCPU, 16 GB)",
  "Auto Scaling","Read Data","Transform","Shuffle","Write Output",
  "Cluster Details (Live)","4 / 10","16","64 GB","Execution Logs",
  "Job Metrics","12.5 M","1 min 11 sec","176K records/sec","820 MB","$0.042",
  "Key Takeaways"
])assert.ok((html.includes(text)||html.replace(/<[^>]*>/g,"").includes(text)),text);

const hero=renderToString(React.createElement(CloudManagedSparkHero,{
  description:"Understand when to use managed distributed processing services and how storage, cluster lifecycle, scaling, and job boundaries affect batch pipelines.",
  minutes:28,currentLesson:4,total:11,onPrevious:()=>{},onNext:()=>{}
}));
for(const text of ["Managed Batch & Spark Processing","28 min","Lesson 5/11","Intermediate","Previous","Next"]){
  assert.ok(hero.includes(text),text);
}

console.log("PASS: managed Spark reference metrics, scaling, output path, stage state, SSR controls and hero.");
