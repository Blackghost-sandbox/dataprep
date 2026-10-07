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

const model=load(path.join(root,"lib/kafka-partitions-offsets-simulation.ts"));

let state=model.createOffsetLabState(3);
assert.deepEqual(state.logs.map(rows=>rows.length),[3,2,1]);
state.logs.forEach((rows,partition)=>rows.forEach((record,offset)=>{
  assert.equal(record.partition,partition);
  assert.equal(record.offset,offset);
}));
assert.equal(model.routeByKey("customer_101",3),0);

state=model.produceOffsetMessage(state,"OrderCreated","customer_101");
assert.equal(state.logs[0].length,4);
assert.equal(state.logs[0][3].offset,3);
assert.equal(state.selectedPartition,0);

state=model.withStartOffset(state,"earliest");
state=model.consumeOffsetMessages(state);
assert.equal(state.consumed.length,4);
assert.equal(state.consumed[0].offset,0);
assert.equal(state.consumed[3].offset,3);

const latest=model.consumeOffsetMessages(model.withStartOffset(state,"latest"));
assert.equal(latest.consumed.length,3);
assert.deepEqual(latest.consumed.map(row=>row.offset),[1,2,3]);

const one=model.withPartitionCount(state,1);
assert.deepEqual(one.logs.map(rows=>rows.length),[6]);
const two=model.withPartitionCount(state,2);
assert.deepEqual(two.logs.map(rows=>rows.length),[4,2]);

const hot=model.runOffsetScenario(model.createOffsetLabState(3),"hot-partition","OrderCreated","customer_101");
assert.equal(hot.logs[0].length,6);
assert.equal(hot.logs[1].length,2);
assert.equal(hot.logs[2].length,1);

const replay=model.runOffsetScenario(model.createOffsetLabState(3),"offset-replay","OrderCreated","customer_101");
assert.equal(replay.startOffset,"earliest");
assert.equal(replay.consumed.length,3);

const details=model.partitionDetails(model.createOffsetLabState(3),0);
assert.deepEqual(details,{latestOffset:3,messages:3,earliestOffset:0,logEndOffset:3,approxKb:1});

const {KafkaPartitionsOffsetsLab}=load(path.join(root,"components/kafka-partitions-offsets-lab.tsx"));
const html=renderToString(React.createElement(KafkaPartitionsOffsetsLab));
for(const text of ["Interactive Simulation","Run","Reset","Normal Flow","Partitions","Producer","Send Message","Kafka Topic:","Consumer","Consume Messages","Event Log","Partition Details","Messages in Partition 0"]){
  assert.ok((html.includes(text)||html.replace(/<[^>]*>/g,"").includes(text)),text);
}

console.log("PASS: partition counts, per-partition offsets, producer routing, earliest/latest consumption, hot partition/replay scenarios and SSR controls.");
