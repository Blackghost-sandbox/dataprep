import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import ts from 'typescript';
import React from 'react';
import {renderToString as renderRawToString} from "react-dom/server";
// React can split visible text with hydration comments and escape entities.
const renderToString=(node)=>renderRawToString(node).replace(/<!--[^]*?-->/g,"").replace(/&amp;/g,"&").replace(/&gt;/g,">").replace(/&lt;/g,"<").replace(/&quot;/g,'"').replace(/&#x27;|&#39;/g,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));
const root=path.resolve(import.meta.dirname,'..');
const require=createRequire(import.meta.url);
const cache=new Map();
function load(file){
  if(file.endsWith(".json"))return JSON.parse(fs.readFileSync(file,"utf8"));
  if(cache.has(file))return cache.get(file).exports;
  const loaded={exports:{}};cache.set(file,loaded);
  const source=fs.readFileSync(file,'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const localRequire=name=>{
    if(name.startsWith('@/')||name.startsWith('.')){
      const base=name.startsWith('@/')?path.join(root,name.slice(2)):path.resolve(path.dirname(file),name);
      const found=[base,...['.tsx','.ts','/index.tsx','/index.ts'].map(ext=>base+ext)].find(fs.existsSync);
      assert.ok(found,'Module not found: '+name);return load(found);
    }
    return require(name);
  };
  vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(localRequire,loaded,loaded.exports);
  return loaded.exports;
}


const {initialPartitions,redistribute,partitionCode}=load(path.join(root,'lib/partitioning-simulation.ts'));
let cases=0;
for(const count of [6,12])for(const initial of [2,3,4])for(const target of [1,2,3,4])for(const skew of [false,true])for(const operation of ['repartition','coalesce']){
 const before=initialPartitions(count,initial,skew);
 const original=JSON.stringify(before);
 const after=redistribute(before,target,operation);
 assert.equal(after.flat().length,count);
 assert.equal(new Set(after.flat().map(r=>r.id)).size,count);
 assert.deepEqual(after.flat().map(r=>r.id).sort((a,b)=>a-b),before.flat().map(r=>r.id).sort((a,b)=>a-b));
 assert.equal(after.length,operation==='coalesce'?Math.min(initial,target):target);
 assert.equal(JSON.stringify(before),original);
 if(operation==='coalesce')for(const group of before)assert.ok(after.some(out=>group.every(row=>out.includes(row))));
 cases++;
}
assert.deepEqual(redistribute(initialPartitions(6,2),3,'repartition').map(p=>p.map(r=>r.id)),[[1,4],[2,5],[3,6]]);
assert.deepEqual(initialPartitions(12,4,true).map(p=>p.length),[9,1,1,1]);
assert.ok(partitionCode(3,'repartition')[2].endsWith('.show()'));
const {SparkPartitioningConcept}=load(path.join(root,'components/spark-partitioning-concept.tsx'));
const {GlossaryProvider}=load(path.join(root,'components/glossary.tsx'));
const html=renderToString(React.createElement(GlossaryProvider,null,React.createElement(SparkPartitioningConcept)));
for(const text of ['Partitioning Lab','Run Animation','Step Mode','Data skew','Waiting for records','not a live Spark run'])assert.ok((html.includes(text)||html.replace(/<[^>]*>/g,"").includes(text)),text);
console.log('PASS: '+cases+' partition scenarios preserve records, IDs and source data; coalesce groups whole partitions; lab SSR passes.');

