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

const model=load(path.join(root,"lib/kafka-producer-consumer-simulation.ts"));

for(const dataset of ["orders","payments"]){
  let state=model.newProducerConsumerState(dataset);
  assert.equal(state.logs.reduce((n,rows)=>n+rows.length,0),7);
  assert.deepEqual(state.logs.map(rows=>rows.length),[3,2,2]);
  state.logs.forEach((rows,partition)=>rows.forEach((record,offset)=>{
    assert.equal(record.partition,partition);
    assert.equal(record.offset,offset);
  }));

  const normal=model.runProducerConsumer(state,dataset,"normal");
  assert.equal(normal.cursor,8);
  assert.equal(normal.timeline.length>state.timeline.length,true);

  const burst=model.runProducerConsumer(state,dataset,"burst");
  assert.equal(burst.cursor,10);
  assert.equal(burst.logs.reduce((n,rows)=>n+rows.length,0),10);

  let slow=model.newProducerConsumerState(dataset);
  while(slow.cursor<model.producerDatasets[dataset].length)slow=model.runProducerConsumer(slow,dataset,"slow-consumer");
  assert.equal(model.consumerLag(slow,"c")>0,true);
  assert.equal(slow.consumers.c.active,false);

  const reset=model.newProducerConsumerState(dataset);
  assert.equal(reset.cursor,7);
  assert.equal(reset.runCount,0);
}

const {KafkaProducerConsumerLab}=load(path.join(root,"components/kafka-producer-consumer-lab.tsx"));
const html=renderToString(React.createElement(KafkaProducerConsumerLab));
for(const text of ["Interactive Simulation","E-commerce Orders","Normal Flow","Run","Reset","Next Scenario","Producer","Kafka Topic","Consumer A","Consumer B","Consumer C","Event Timeline","Message Inspector","Partition View"]){
  assert.ok((html.includes(text)||html.replace(/<[^>]*>/g,"").includes(text)),text);
}

console.log("PASS: producer/consumer datasets, partition routing, offsets, normal/burst/slow scenarios, reset state and SSR controls.");
