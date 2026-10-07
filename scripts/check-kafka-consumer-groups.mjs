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

const model=load(path.join(root,"lib/kafka-consumer-groups-simulation.ts"));

let state=model.createConsumerGroupState();
assert.equal(state.partitionCount,3);
assert.equal(state.consumerCount,3);
assert.deepEqual(state.partitions.map(row=>row.messages),[12,8,15]);
assert.deepEqual(state.partitions.map(row=>row.owner),["C1","C2","C3"]);
assert.deepEqual(state.consumers.map(row=>row.partitions),[[0],[1],[2]]);
assert.equal(state.rebalances,0);
assert.equal(state.throughput,25);

const add=model.applyConsumerGroupAction(state,"add");
assert.equal(add.consumerCount,4);
assert.equal(add.rebalances,1);
assert.equal(add.partitions.length,3);
assert.deepEqual(add.partitions.map(row=>row.owner),["C1","C2","C3"]);
assert.ok(add.status.includes("Rebalance #1"));

const six=model.setConsumerGroupPartitions(state,6);
assert.equal(six.partitionCount,6);
assert.equal(six.partitions.length,6);
assert.equal(six.rebalances,1);
assert.deepEqual(six.consumers.map(row=>row.partitions),[[0,3],[1,4],[2,5]]);

const two=model.setConsumerGroupConsumers(state,2);
assert.equal(two.consumerCount,2);
assert.equal(two.rebalances,1);
assert.deepEqual(two.consumers.map(row=>row.partitions),[[0,2],[1]]);

const manual=model.setConsumerGroupAuto(state,false);
const pending=model.setConsumerGroupPartitions(manual,6);
assert.equal(pending.partitionCount,6);
assert.equal(pending.partitions.length,3);
assert.equal(pending.rebalances,0);
assert.ok(pending.status.includes("Auto rebalancing is off"));

const failed=model.applyConsumerGroupAction(state,"fail");
assert.equal(failed.consumerCount,2);
assert.equal(failed.rebalances,1);
assert.ok(failed.events.some(event=>event.text.includes("failed")));

const metrics=model.groupMetrics(state);
assert.deepEqual(metrics,{consumers:3,partitions:3,throughput:25,rebalances:0});
assert.equal(model.ownerForPartition(state,1).label,"Consumer B");

const {KafkaConsumerGroupsLab}=load(path.join(root,"components/kafka-consumer-groups-lab.tsx"));
const html=renderToString(React.createElement(KafkaConsumerGroupsLab));
for(const text of [
  "Interactive Simulation","Run","Reset","Number of partitions","Number of consumers",
  "Rebalancing","Kafka Topic:","Consumer Group","Consumer A","Consumer B","Consumer C",
  "Rebalancing in Action","Apply","Event Log","Partition Assignment","Consumer Group Metrics"
]){
  assert.ok((html.includes(text)||html.replace(/<[^>]*>/g,"").includes(text)),text);
}

console.log("PASS: initial ownership, round-robin assignments, add/remove/failure rebalances, manual rebalance mode, metrics and SSR controls.");
