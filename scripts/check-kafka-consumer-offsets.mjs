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

const model=load(path.join(root,"lib/kafka-consumer-offsets-simulation.ts"));

let state=model.createConsumerOffsetsState();
assert.equal(state.partition,1);
assert.equal(state.fetchPosition,211);
assert.equal(state.lastProcessed,210);
assert.equal(state.committedOffset,211);
assert.equal(state.records.length,8);
assert.equal(model.currentOffsetRecord(state).order_id,"A1042");
assert.equal(model.offsetProgress(state).nextToFetch,211);

const normal=model.runConsumerOffsetsScenario(state);
assert.equal(normal.lastProcessed,211);
assert.equal(normal.committedOffset,212);
assert.equal(normal.fetchPosition,212);
assert.ok(normal.events.some(event=>event.role==="COMMIT"&&event.text.includes("212")));

const manual=model.setOffsetAutoCommit(state,false);
const processed=model.processOffsetMessage(manual);
assert.equal(processed.lastProcessed,211);
assert.equal(processed.committedOffset,211);
assert.equal(processed.processingStep,3);
const committed=model.commitConsumerOffset(processed);
assert.equal(committed.committedOffset,212);
assert.equal(committed.fetchPosition,212);

const crashState=model.setOffsetScenario(state,"crash-before-commit");
const crashed=model.processOffsetMessage(crashState);
assert.equal(crashed.lastProcessed,211);
assert.equal(crashed.committedOffset,211);
assert.equal(crashed.fetchPosition,211);
assert.ok(crashed.events.some(event=>event.role==="RESTART"));

const replayState={...state,fetchPosition:214,committedOffset:212};
const replay=model.runConsumerOffsetsScenario(model.setOffsetScenario(replayState,"replay-from-commit"));
assert.equal(replay.fetchPosition,212);
assert.ok(replay.status.includes("Restarted from durable committed offset 212"));

const stoppedAdvance=model.setOffsetAutoAdvance(processed,false);
const manualCommit=model.commitConsumerOffset(stoppedAdvance);
assert.equal(manualCommit.committedOffset,212);
assert.equal(manualCommit.fetchPosition,211);

const {KafkaConsumerOffsetsLab}=load(path.join(root,"components/kafka-consumer-offsets-lab.tsx"));
const html=renderToString(React.createElement(KafkaConsumerOffsetsLab));
for(const text of [
  "Interactive Simulation","Run","Reset","Normal Flow","Auto advance","Kafka Topic:",
  "Consumer (C1)","Fetch position","Last processed","Committed offset",
  "Processing & Commit","Process Message","Auto commit","Commit Offset",
  "Message Details","Event Log","Offset Progress"
]){
  assert.ok((html.includes(text)||html.replace(/<[^>]*>/g,"").includes(text)),text);
}

console.log("PASS: fetch/process/commit semantics, manual commit, crash-before-commit replay, committed-offset restart, auto-advance and SSR controls.");
