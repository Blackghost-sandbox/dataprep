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

const model=load(path.join(root,"lib/kafka-ordering-delivery-simulation.ts"));

let state=model.createDeliveryState();
assert.equal(state.mode,"at-least-once");
assert.equal(state.scenario,"consumer-crash");
assert.equal(state.speed,"slow");
assert.equal(state.selectedPartition,0);
assert.equal(state.committedOffset,211);
assert.equal(state.nextOffset,213);
assert.equal(state.messagesInLog,5);
assert.equal(state.records.filter(r=>r.partition===0).length,3);

const atleast=model.runDeliverySimulation(state);
assert.equal(atleast.currentOrder,1043);
assert.equal(atleast.committedOffset,214);
assert.equal(atleast.duplicateCount,1);
assert.equal(atleast.retryCount,1);
assert.ok(atleast.events.some(e=>e.role==="RETRY"));
assert.ok(atleast.status.includes("replayed"));

const atmostState=model.setDeliveryMode(state,"at-most-once");
const atmost=model.runDeliverySimulation(atmostState);
assert.equal(atmost.lostCount,1);
assert.equal(atmost.committedOffset,214);
assert.ok(atmost.events.some(e=>e.text.includes("committed position already advanced")));
assert.ok(atmost.records.some(r=>r.partition===0&&r.offset===213&&r.status==="lost"));

const exactState=model.setDeliveryMode(state,"exactly-once");
const exact=model.runDeliverySimulation(exactState);
assert.equal(exact.duplicateCount,0);
assert.equal(exact.lostCount,0);
assert.equal(exact.committedOffset,214);
assert.ok(exact.events.some(e=>e.role==="TXN"&&e.text.includes("atomically")));
assert.ok(exact.status.includes("External"));

const normal=model.runDeliverySimulation(model.setDeliveryScenario(model.setDeliveryMode(state,"at-least-once"),"normal"));
assert.equal(normal.duplicateCount,0);
assert.equal(normal.lostCount,0);
assert.ok(normal.status.includes("completed normally"));

const speed=model.setDeliverySpeed(state,"fast");
assert.equal(speed.speed,"fast");
const cleared=model.clearDeliveryEvents(state);
assert.deepEqual(cleared.events,[]);

const {KafkaOrderingDeliveryLab}=load(path.join(root,"components/kafka-ordering-delivery-lab.tsx"));
const html=renderToString(React.createElement(KafkaOrderingDeliveryLab));
for(const text of [
  "Interactive Simulation","Run Simulation","Reset","Consumer Crash Before Commit",
  "At-most-once","At-least-once","Exactly-once","Speed:","Producer","Topic (orders)",
  "Partition 0","Partition 1","Partition 2","Consumer Group","Delivery Guarantees",
  "Event Log","Partition State","Key Takeaways"
]){
  assert.ok(html.includes(text),text);
}

console.log("PASS: at-most-once loss, at-least-once replay/duplicate, exactly-once Kafka transaction, normal flow, speed/mode controls, partition ordering and SSR controls.");
