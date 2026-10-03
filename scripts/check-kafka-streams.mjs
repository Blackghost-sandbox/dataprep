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

const model=load(path.join(root,"lib/kafka-streams-simulation.ts"));

let state=model.createKafkaStreamsState();
assert.equal(state.scenario,"windowed-aggregation");
assert.equal(state.inputEvents.length,5);
assert.deepEqual(state.stateStore.map(row=>[row.region,row.total,row.count]),[
  ["IN",600,2],["US",200,1],["EU",350,1]
]);
assert.equal(state.outputEvents.length,3);
assert.equal(state.activeStage,"aggregate");

const added=model.addStreamEvent(state,"US",50);
assert.equal(added.inputEvents.at(-1).region,"US");
assert.equal(added.inputEvents.at(-1).amount,50);
assert.equal(added.activeStage,"source");

const processed=model.runKafkaStreamsSimulation(added);
assert.equal(processed.stateStore.find(row=>row.region==="US").total,250);
assert.equal(processed.stateStore.find(row=>row.region==="US").count,2);
assert.ok(processed.logs.some(log=>log.role==="AGGREGATE"&&log.text.includes("US total = 250")));
assert.equal(processed.activeStage,"sink");

const invalid=model.runKafkaStreamsSimulation(model.addStreamEvent(state,"IN",-7));
assert.equal(invalid.stateStore.find(row=>row.region==="IN").total,600);
assert.ok(invalid.logs.at(-1).text.includes("Filtered"));
assert.equal(invalid.activeStage,"filter");

const countScenario=model.setStreamScenario(state,"regional-count");
assert.equal(countScenario.stateStore.find(row=>row.region==="IN").total,2);
assert.equal(countScenario.stateStore.find(row=>row.region==="IN").count,2);

const filtered=model.setStreamScenario(state,"filter-only");
assert.equal(filtered.activeStage,"filter");
assert.deepEqual(filtered.outputEvents.map(row=>row.region),["IN","US","EU"]);

const noAdvance=model.setStreamAutoAdvance(added,false);
const manual=model.runKafkaStreamsSimulation(noAdvance);
assert.equal(manual.activeStage,"aggregate");

const cleared=model.clearStreamLogs(state);
assert.deepEqual(cleared.logs,[]);

const {KafkaStreamsLab}=load(path.join(root,"components/kafka-streams-lab.tsx"));
const html=renderToString(React.createElement(KafkaStreamsLab));
for(const text of [
  "Interactive Simulation","Run Simulation","Reset","Windowed Aggregation","Auto advance",
  "Input Events","Add Event","Source","Filter","Group By","Aggregate","Sink",
  "Output Events","Topology (Code View)","Event Log","State Store (Windowed)","Key Takeaways"
]){
  assert.ok(html.includes(text),text);
}

console.log("PASS: seeded windowed totals, add/process flow, invalid-event filtering, regional count scenario, auto-advance behavior, log clearing and SSR controls.");
