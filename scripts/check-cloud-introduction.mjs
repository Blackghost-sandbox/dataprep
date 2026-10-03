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

const model=load(path.join(root,"lib/cloud-introduction-simulation.ts"));
assert.equal(model.cloudStages.length,6);
assert.equal(model.cloudScenarios.length,3);
assert.equal(model.providerServices.aws.storage.name,"Amazon S3");
assert.equal(model.providerServices.gcp.analytics.name,"BigQuery");
assert.equal(model.providerServices.azure.ingestion.name,"Azure Event Hubs");

let state=model.newCloudSimulationState();
for(let i=0;i<model.cloudStages.length;i++)state=model.advanceCloudSimulation(state,"retail","aws");
assert.equal(state.nextStage,6);
assert.deepEqual(state.completed,["sources","ingestion","storage","processing","analytics","consumers"]);
assert.ok(state.logs.some(entry=>entry.text.includes("Amazon Kinesis")));
assert.ok(state.logs.some(entry=>entry.text.includes("S3")));
assert.ok(state.logs.some(entry=>entry.text.includes("Redshift")));
assert.ok(state.logs.some(entry=>entry.text.includes("completed successfully")));

const gcp=model.runCloudSimulationToEnd("iot","gcp");
assert.ok(gcp.logs.some(entry=>entry.text.includes("Google Cloud Pub/Sub")));
assert.ok(gcp.logs.some(entry=>entry.text.includes("BigQuery")));

const azure=model.runCloudSimulationToEnd("customer360","azure");
assert.ok(azure.logs.some(entry=>entry.text.includes("Azure Event Hubs")));
assert.ok(azure.logs.some(entry=>entry.text.includes("Azure Synapse Analytics")));

const {CloudIntroductionLab,CloudIntroductionHero}=load(path.join(root,"components/cloud-introduction-lab.tsx"));
const html=renderToString(React.createElement(CloudIntroductionLab));
for(const text of ["Run Simulation","Retail Analytics Pipeline","Data Sources","Ingestion","Storage (Data Lake)","Processing","Analytics","BI & Consumers","Execution Logs","Service Details","Key Takeaways","Amazon S3","BigQuery","Azure"]){
  assert.ok(html.includes(text),text);
}
const hero=renderToString(React.createElement(CloudIntroductionHero,{description:"Vendor-neutral cloud data systems",minutes:20,currentLesson:0,total:11,onPrevious:()=>{},onNext:()=>{}}));
for(const text of ["Cloud Platforms for Data Engineering","20 min","Lesson 1/11","Beginner","Data Engineering","Next"]){
  assert.ok(hero.includes(text),text);
}

console.log("PASS: cloud introduction scenarios, provider mappings, six-stage deterministic pipeline, provider-specific logs, hero and SSR controls.");