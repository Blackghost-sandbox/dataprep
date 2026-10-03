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

const model=load(path.join(root,"lib/kafka-serialization-schema-simulation.ts"));

let state=model.createSchemaSimulationState();
assert.equal(state.writer,"v1");
assert.equal(state.reader,"v1");
assert.equal(state.format,"json-avro");
assert.equal(state.messages.length,3);
assert.equal(state.selectedOffset,103);

const selected=model.selectedSchemaMessage(state);
assert.equal(selected.offset,103);
assert.equal(selected.schema,"v2");
const v1Read=model.readMessage(selected,"v1");
assert.equal(v1Read.ok,true);
assert.ok(v1Read.ignoredFields.includes("currency"));

const removed=state.messages.find(message=>message.schema==="v3");
const incompatible=model.readMessage(removed,"v1");
assert.equal(incompatible.ok,false);
assert.equal(incompatible.value,null);
assert.equal(model.isSchemaPairCompatible("v3","v1").ok,false);

const oldToNew=model.readMessage(state.messages[0],"v2");
assert.equal(oldToNew.ok,true);
assert.equal(oldToNew.value.currency,"USD");

state=model.setWriterVersion(state,"v2");
state=model.setReaderVersion(state,"v1");
state=model.produceSchemaMessage(state);
assert.equal(state.messages.at(-1).schema,"v2");
assert.equal(state.nextOffset,106);
assert.ok(state.status.includes("can deserialize"));

const v3Produced=model.produceSchemaMessage(model.setWriterVersion(model.setReaderVersion(state,"v1"),"v3"));
assert.equal(v3Produced.messages.at(-1).schema,"v3");
assert.ok(v3Produced.status.includes("incompatible"));

const json=model.serializeMessage(state.messages[0],"json");
assert.ok(json.includes("order_id"));
const avroLike=model.serializeMessage(state.messages[0],"json-avro");
assert.ok(avroLike.includes('"schema":"v1"'));
const proto=model.serializeMessage(state.messages[0],"protobuf");
assert.ok(proto.includes("1:1042"));
assert.ok(model.rawBytes(json).split(" ").length>5);

const {KafkaSerializationSchemaLab}=load(path.join(root,"components/kafka-serialization-schema-lab.tsx"));
const html=renderToString(React.createElement(KafkaSerializationSchemaLab));
for(const text of [
  "Interactive Simulation","Run","Reset","Format","Show raw bytes","Producer (Writer)",
  "V1 (Original)","V2 (Add Field)","V3 (Remove Field)","Produce Message",
  "Kafka Topic:","Consumer (Reader)","Reader V1","Reader V2","Reader V3",
  "Schema Evolution Strategies","Common Incompatible Changes","Key Takeaways"
]){
  assert.ok(html.includes(text),text);
}

console.log("PASS: writer/reader versions, compatible field addition, incompatible required-field removal, formats/raw bytes, produce flow and SSR controls.");
