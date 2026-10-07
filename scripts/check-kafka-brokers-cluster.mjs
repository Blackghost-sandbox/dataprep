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

const model=load(path.join(root,"lib/kafka-brokers-cluster-simulation.ts"));

let state=model.createClusterState();
assert.equal(state.brokerCount,3);
assert.equal(state.replicationFactor,3);
assert.equal(state.partitionCount,6);
assert.deepEqual(model.replicaBrokers(0,3,3),[1,2,3]);
assert.deepEqual(model.replicaBrokers(1,3,3),[2,3,1]);
assert.equal(model.leaderForPartition(2,3),3);
assert.equal(model.routeClusterRecord("customer_101"),0);
assert.equal(model.routeClusterRecord("customer_102"),1);

const broker1=model.brokerPartitions(state,1);
assert.equal(broker1.length,6);
assert.equal(broker1.filter(item=>item.leader).length,2);

state=model.sendClusterMessage(state,{
  key:"customer_101",
  order_id:"A2001",
  customer_id:"101",
  amount:499,
  product:"Laptop",
});
assert.equal(state.selectedPartition,0);
assert.equal(state.records[0].at(-1).order_id,"A2001");
assert.equal(state.records[0].at(-1).offset,16);
assert.equal(state.nextOffsets[0],17);
assert.ok(state.events.some(event=>event.role==="REPLICA"&&event.broker===2));
assert.ok(state.events.some(event=>event.role==="REPLICA"&&event.broker===3));

state=model.consumeClusterMessages(state,"latest");
assert.equal(state.consumed.length,3);
assert.ok(state.events.at(-1).text.includes("starting from latest"));

const five=model.reconfigureCluster(state,5,2);
assert.equal(five.brokerCount,5);
assert.equal(five.replicationFactor,2);
assert.deepEqual(model.replicaBrokers(4,5,2),[5,1]);

const noBalance=model.setAutoRebalance(five,false);
assert.equal(noBalance.autoRebalance,false);
assert.ok(model.reconfigureCluster(noBalance,4,2).status.includes("disabled"));

const details=model.clusterPartitionDetails(state,0);
assert.equal(details.leader,1);
assert.deepEqual(details.replicas,[1,2,3]);
assert.equal(details.latestOffset,16);

const overview=model.clusterOverview(state);
assert.deepEqual(overview,{brokers:3,partitions:6,replicationFactor:3,approxPerBroker:6});

const {KafkaBrokersClusterLab}=load(path.join(root,"components/kafka-brokers-cluster-lab.tsx"));
const html=renderToString(React.createElement(KafkaBrokersClusterLab));
for(const text of [
  "Interactive Kafka Cluster","Run","Reset","Number of brokers","Replication factor",
  "Auto re-balance","Producer","Send Message","Kafka Cluster","Broker 1","Broker 2",
  "Broker 3","Consumer","Start Consuming","Event Log","Partition Details","Cluster Overview"
]){
  assert.ok((html.includes(text)||html.replace(/<[^>]*>/g,"").includes(text)),text);
}

console.log("PASS: broker placement, leaders/replicas, RF changes, keyed routing, send/consume flow, auto-rebalance state, partition details, overview and SSR controls.");
