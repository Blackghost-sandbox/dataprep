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

const model=load(path.join(root,"lib/cloud-data-warehouse-simulation.ts"));
const controls=model.defaultWarehouseControls();
assert.equal(controls.provider,"snowflake");
assert.equal(controls.source,"sales-csv");
assert.equal(controls.table,"sales_raw");
assert.equal(controls.rowsToLoad,1000000);
assert.equal(controls.warehouseSize,"Medium (4 credits)");
assert.equal(controls.autoScaling,true);
assert.equal(controls.maxClusters,2);

const metrics=model.computeWarehouseMetrics(controls);
assert.equal(metrics.queryTimeSeconds,2.4);
assert.equal(metrics.dataScannedMb,124);
assert.equal(metrics.computeUnits,4);

const rows=model.warehouseResults(controls);
assert.equal(rows.length,5);
assert.deepEqual(rows[0],{region:"US",month:"2026-10",totalOrders:12450,totalRevenue:1250340});
assert.deepEqual(rows[4],{region:"APAC",month:"2026-10",totalOrders:6540,totalRevenue:680420});

const initial=model.referenceWarehouseState();
assert.equal(initial.loaded,true);
assert.equal(initial.queried,true);
assert.equal(initial.metrics.queryTimeSeconds,2.4);
assert.ok(initial.logs.some(entry=>entry.text.includes("Loading 1,000,000 rows")));
assert.ok(initial.logs.some(entry=>entry.text.includes("Query completed in 2.4 seconds")));
assert.ok(initial.logs.some(entry=>entry.text.includes("Returned 5 rows")));

const scaled=model.simulateWarehouse({...controls,rowsToLoad:2000000,warehouseSize:"Large (8 credits)",maxClusters:4});
assert.equal(scaled.loaded,true);
assert.equal(scaled.queried,true);
assert.ok(scaled.metrics.dataScannedMb>124);
assert.ok(scaled.results[0].totalOrders>12450);

const bigquery=model.simulateWarehouse({...controls,provider:"bigquery"});
assert.ok(bigquery.status.includes("Google BigQuery"));
assert.ok(bigquery.logs.some(entry=>entry.text.includes("BigQuery")));

const loadOnly=model.loadWarehouseOnly({...controls,rowsToLoad:500000});
assert.equal(loadOnly.loaded,true);
assert.equal(loadOnly.queried,false);
assert.equal(loadOnly.results.length,0);

assert.ok(model.warehouseQuery.includes("DATE_TRUNC"));
assert.ok(model.warehouseQuery.includes("GROUP BY 1, 2"));

const {CloudDataWarehouseLab,CloudDataWarehouseHero}=load(path.join(root,"components/cloud-data-warehouse-lab.tsx"));
const html=renderToString(React.createElement(CloudDataWarehouseLab));
for(const text of [
  "Run Simulation","Warehouse Provider","Snowflake","Load Data","Warehouse Compute",
  "Execute Analytical Query","View Results","Sales Data (CSV)","sales_raw",
  "1,000,000","Medium (4 credits)","Auto Scaling","Max Clusters",
  "12,450","1,250,340","2.4s","124 MB","Warehouse Credits",
  "Storage vs Compute Separation","Execution Logs","Key Takeaways"
])assert.ok((html.includes(text)||html.replace(/<[^>]*>/g,"").includes(text)),text);

const hero=renderToString(React.createElement(CloudDataWarehouseHero,{
  description:"Compare warehouse execution models, separate storage from compute where relevant, and design for concurrency, partitioning, clustering, and predictable analytics workloads.",
  minutes:28,currentLesson:5,total:11,onPrevious:()=>{},onNext:()=>{}
}));
for(const text of ["Cloud Data Warehouses","28 min","Lesson 6/11","Intermediate","Amazon","BigQuery","Snowflake","Azure"]){
  assert.ok(hero.includes(text),text);
}

console.log("PASS: warehouse reference values, scaling, provider behavior, load/query states, SSR controls and hero.");
