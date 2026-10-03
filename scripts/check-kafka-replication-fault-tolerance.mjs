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

const model=load(path.join(root,"lib/kafka-replication-fault-tolerance-simulation.ts"));

let state=model.createReplicationState();
assert.equal(state.partition,"P0");
assert.equal(state.replicationFactor,3);
assert.equal(state.minIsr,2);
assert.equal(state.acks,"all");
assert.equal(state.leaderId,2);
assert.deepEqual(model.currentIsr(state),[2,3]);
assert.equal(state.brokers[0].failed,true);
assert.equal(state.brokers[1].role,"leader");
assert.equal(state.brokers[2].role,"follower");
assert.ok(state.brokers.every(broker=>broker.partition==="P0"));

const recovered=model.recoverBroker(state,1);
assert.equal(recovered.brokers[0].failed,false);
assert.equal(recovered.brokers[0].inSync,true);
assert.deepEqual(model.currentIsr(recovered),[1,2,3]);

const produced=model.produceReplicatedMessage(recovered);
assert.equal(produced.hw,150);
assert.equal(produced.leo,150);
assert.equal(produced.nextOffset,151);
assert.ok(produced.brokers.every(broker=>broker.offsets.at(-1)===150));

const failed=model.failBroker({...recovered,leaderId:1,brokers:recovered.brokers.map(b=>({...b,role:b.id===1?"leader":"follower"}))},1);
assert.equal(failed.brokers[0].failed,true);
assert.equal(failed.leaderId,2);
assert.ok(failed.events.some(event=>event.role==="CONTROLLER"));

const oos=model.runReplicationScenario(model.setReplicationScenario(state,"follower-out-of-sync"));
assert.equal(oos.brokers.find(broker=>broker.id===3).inSync,false);
assert.equal(oos.underReplicated,true);

const healthy=model.runReplicationScenario(model.setReplicationScenario(state,"healthy-replication"));
assert.equal(healthy.leaderId,1);
assert.equal(healthy.hw,150);
assert.deepEqual(model.currentIsr(healthy),[1,2,3]);

const status=model.partitionStatus(state);
assert.equal(status.partition,"P0");
assert.equal(status.leader,2);
assert.deepEqual(status.isr,[2,3]);
assert.equal(status.replicationFactor,3);

const {KafkaReplicationFaultToleranceLab}=load(path.join(root,"components/kafka-replication-fault-tolerance-lab.tsx"));
const html=renderToString(React.createElement(KafkaReplicationFaultToleranceLab));
for(const text of [
  "Interactive Simulation","Run","Reset","Leader Failure","Auto advance",
  "Topic:","Partition P0","Broker 1","Broker 2","Broker 3","P0 · replica 1",
  "P0 · replica 2","P0 · replica 3","Produce Message","Fail Broker 1",
  "Recover Broker 1","Current ISR","Event Log","Partition Status","Message Flow"
]){
  assert.ok(html.includes(text),text);
}

console.log("PASS: explicit P0 labels, leader/follower roles, ISR, recovery, acks=all replication, leader failure/election, out-of-sync scenario, status and SSR controls.");
