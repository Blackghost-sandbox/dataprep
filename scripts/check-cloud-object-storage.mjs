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
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true
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

const model=load(path.join(root,"lib/cloud-object-storage-simulation.ts"));

assert.equal(model.objectStorageProviders.aws.label,"AWS S3");
assert.equal(model.objectStorageProviders.gcp.label,"Google Cloud Storage");
assert.equal(model.objectStorageProviders.azure.label,"Azure Blob / ADLS");
assert.equal(model.objectStorageFormats.json.extension,"json");
assert.equal(model.objectStorageFormats.parquet.extension,"parquet");

const pathValue=model.objectStoragePath({
  dataSource:"ecommerce",partitionByDate:true,pathPrefix:"raw/ecommerce/"
});
assert.equal(pathValue,"raw/ecommerce/year=2026/month=10/day=02/");

const files=model.objectStorageFiles({
  dataSource:"ecommerce",format:"json",partitionByDate:true,pathPrefix:"raw/ecommerce/"
});
assert.equal(files.length,3);
assert.equal(files[0].name,"orders_0001.json");

const aws=model.runObjectStorageSimulation({
  provider:"aws",dataSource:"ecommerce",format:"json",volumeMb:100,
  partitionByDate:true,pathPrefix:"raw/ecommerce/",bucket:"dataprep-lake",storageClass:"Standard"
});
assert.equal(aws.generated,true);
assert.equal(aws.uploaded,true);
assert.equal(aws.queried,true);
assert.ok(aws.logs.some(entry=>entry.text.includes("s3://dataprep-lake")));
assert.ok(aws.logs.some(entry=>entry.text.includes("Athena")));
assert.ok(aws.logs.some(entry=>entry.text.includes("Storage class: Standard")));
assert.equal(model.objectStorageResult(100,"ecommerce").total_orders,1000);
assert.equal(model.objectStorageResult(100,"ecommerce").total_revenue,125430.5);

const gcp=model.runObjectStorageSimulation({
  provider:"gcp",dataSource:"clickstream",format:"parquet",volumeMb:200,
  partitionByDate:true,pathPrefix:"raw/clickstream/",bucket:"dataprep-lake",storageClass:"Standard"
});
assert.ok(gcp.logs.some(entry=>entry.text.includes("gs://dataprep-lake")));
assert.ok(gcp.logs.some(entry=>entry.text.includes("BigQuery")));

const azure=model.runObjectStorageSimulation({
  provider:"azure",dataSource:"crm",format:"csv",volumeMb:150,
  partitionByDate:false,pathPrefix:"raw/crm/",bucket:"dataprep-lake",storageClass:"Hot"
});
assert.ok(azure.logs.some(entry=>entry.text.includes("abfss://dataprep-lake")));
assert.ok(azure.logs.some(entry=>entry.text.includes("Synapse")));
assert.ok(azure.logs.some(entry=>entry.text.includes("Partitioning disabled")));

const {CloudObjectStorageLab,CloudObjectStorageHero}=load(path.join(root,"components/cloud-object-storage-lab.tsx"));
const html=renderToString(React.createElement(CloudObjectStorageLab));
for(const text of [
  "Run Simulation","AWS S3","Ingest Data","Object Storage","Data Lake Layout","Analyze Data",
  "E-commerce App","JSON","dataprep-lake","Standard","raw/ecommerce/","Athena","BigQuery","Synapse",
  "Execution Logs","Query Results","Key Takeaways","1,000","$125,430.50","Download"
])assert.ok((html.includes(text)||html.replace(/<[^>]*>/g,"").includes(text)),text);

const hero=renderToString(React.createElement(CloudObjectStorageHero,{
  description:"Understand why object storage is the foundation of many cloud data lakes.",
  minutes:25,currentLesson:1,total:11,onPrevious:()=>{},onNext:()=>{}
}));
for(const text of ["Object Storage & Data Lakes","25 min","Lesson 2/11","Intermediate","Previous","Next"]){
  assert.ok(hero.includes(text),text);
}

console.log("PASS: object storage provider mapping, source/format controls, date partition path, deterministic query result, SSR controls and hero.");
