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

const model=load(path.join(root,"lib/kafka-message-keys-simulation.ts"));

let state=model.createMessageKeysState();
assert.equal(state.partitionCount,3);
assert.equal(state.hashMode,"murmur2");
assert.deepEqual(state.logs.map(rows=>rows.length),[3,2,1]);
assert.equal(state.messages.length,5);
assert.equal(state.selected.key,"customer_101");
assert.equal(state.selected.partition,1);
assert.equal(state.selected.offset,42);
assert.equal(model.calculateKeyPartition("customer_101",3,"murmur2",0),1);
assert.equal(model.calculateKeyPartition("customer_202",3,"murmur2",0),2);
assert.equal(model.calculateKeyPartition("customer_303",3,"murmur2",0),0);

const repeated=model.appendKeyedMessage(state,"customer_101","OrderPaid");
assert.equal(repeated.selected.partition,1);
assert.equal(repeated.logs[1].at(-1).key,"customer_101");
assert.ok(repeated.events.at(-2).text.includes("partition: 1"));

const noKey=model.appendKeyedMessage(state,"null (no key)","ProfileUpdated");
assert.equal(noKey.selected.partition,state.roundRobin%3);
assert.equal(noKey.roundRobin,state.roundRobin+1);

const batch=model.appendBatch(state,"customer_101|One\ncustomer_202|Two\ncustomer_303|Three");
assert.equal(batch.messages.at(-3).partition,1);
assert.equal(batch.messages.at(-2).partition,2);
assert.equal(batch.messages.at(-1).partition,0);
assert.ok(batch.status.includes("Batch complete"));

const six=model.reconfigureMessageKeys(state,6,"java");
assert.equal(six.partitionCount,6);
assert.equal(six.hashMode,"java");
assert.equal(six.logs.length,6);
for(const message of six.messages){
  assert.ok(message.partition>=0&&message.partition<6);
}

const mapping=model.keyMapping(state);
assert.deepEqual(mapping.map(row=>row.key),["customer_101","customer_202","customer_303","null (no key)"]);
const stats=model.partitionStats(state);
assert.deepEqual(stats,[{partition:0,count:3,percent:60},{partition:1,count:3,percent:30},{partition:2,count:1,percent:10}]);

const {KafkaMessageKeysLab}=load(path.join(root,"components/kafka-message-keys-lab.tsx"));
const html=renderToString(React.createElement(KafkaMessageKeysLab));
for(const text of [
  "Interactive Simulation","Run","Reset","Hash Function","Number of partitions",
  "Produce Messages","Single Message","Batch Messages","Send Message","Quick Keys",
  "Kafka Topic:","Partition Mapping","Same key","Event Log","Message Inspector","Partition Stats"
]){
  assert.ok((html.includes(text)||html.replace(/<[^>]*>/g,"").includes(text)),text);
}

console.log("PASS: reference routes, same-key stability, no-key routing, batch sends, hash/partition reconfiguration, mapping/stats and SSR controls.");
