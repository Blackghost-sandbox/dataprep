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

const model=load(path.join(root,"lib/cloud-lakehouse-simulation.ts"));

assert.equal(model.tableFormats.delta.label,"Delta Lake");
assert.equal(model.tableFormats.iceberg.label,"Apache Iceberg");
assert.equal(model.tableFormats.hudi.label,"Apache Hudi");

const files=model.defaultLakehouseFiles();
assert.equal(files.length,2);
assert.equal(files[0].name,"sales_2026_10.csv");
assert.equal(files[0].sizeMb,120);
assert.equal(files[1].name,"sales_2026_11.csv");
assert.equal(files[1].sizeMb,95);

const initial=model.referenceLakehouseState();
assert.equal(initial.queried,true);
assert.equal(initial.queryTimeSeconds,1.8);
assert.equal(initial.results.length,5);
assert.deepEqual(initial.results[0],{date:"2026-10-01",product:"Laptop",totalSales:125430,numOrders:1230});
assert.ok(initial.status.includes("Delta Lake"));

const ops=model.defaultLakehouseOperations();
assert.equal(ops["create-table"],true);
assert.equal(ops["append"],true);
assert.equal(ops["schema-evolution"],true);
assert.equal(ops["time-travel"],true);
assert.equal(ops["acid"],true);

const withSample=model.addSampleLakehouseFile(files,0);
assert.equal(withSample.length,3);
assert.equal(withSample[2].name,"sales_2026_12.parquet");

const upload=model.uploadedFileToLakehouseFile("new_batch.parquet",10485760,4);
assert.equal(upload.type,"Parquet");
assert.equal(upload.sizeMb,10);

const iceberg=model.simulateLakehouse({
  format:"iceberg",
  files:withSample,
  operations:{...ops,"schema-evolution":false}
});
assert.equal(iceberg.queried,true);
assert.ok(iceberg.status.includes("Apache Iceberg"));
assert.ok(iceberg.logs.some(entry=>entry.text.includes("Schema evolution disabled")));
assert.ok(iceberg.results[0].totalSales>initial.results[0].totalSales);

const hudi=model.simulateLakehouse({format:"hudi",files,operations:ops});
assert.ok(hudi.status.includes("Apache Hudi"));
assert.ok(hudi.logs.some(entry=>entry.text.includes("Versioned snapshot committed")));

const features=model.tableFormatFeatures();
assert.equal(features.length,5);
assert.equal(features.every(row=>row.delta&&row.iceberg&&row.hudi),true);
assert.ok(model.lakehouseQuery.includes("SUM(amount)"));
assert.ok(model.lakehouseQuery.includes("GROUP BY date, product"));

const {CloudLakehouseLab,CloudLakehouseHero}=load(path.join(root,"components/cloud-lakehouse-lab.tsx"));
const html=renderToString(React.createElement(CloudLakehouseLab));
for(const text of [
  "Run Simulation","Table Format","Delta Lake (Default)","Ingest Data (Object Storage)",
  "Table Format Operations","Query the Table","Results (Consistent View)",
  "sales_2026_10.csv","120 MB","sales_2026_11.csv","95 MB","Schema evolution",
  "Time travel (Versioning)","ACID transactions","Run Query","125,430","1,230",
  "Query completed in 1.8 seconds","Table Format Comparison",
  "Object Storage vs Table Format","Key Takeaways"
])assert.ok(html.includes(text),text);

const hero=renderToString(React.createElement(CloudLakehouseHero,{
  description:"Understand why table formats add transactions, metadata, schema management, and table semantics on top of object storage.",
  minutes:28,currentLesson:6,total:11,onPrevious:()=>{},onNext:()=>{}
}));
for(const text of [
  "Lakehouse &amp; Open Table Formats","28 min","Lesson 7/11","Intermediate",
  "Data Sources","Object Storage","Table Format Layer","Analytics &amp; BI","Previous","Next"
])assert.ok(hero.includes(text),text);

console.log("PASS: lakehouse reference state, file ingestion, table-format switching, operations, query results, SSR controls and hero.");
