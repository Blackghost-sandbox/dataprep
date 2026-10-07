import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {createRequire} from "node:module";
import assert from "node:assert/strict";
import ts from "typescript";

const root=path.resolve(import.meta.dirname,"..");
const require=createRequire(import.meta.url);

function transpile(file){
  const source=fs.readFileSync(file,"utf8");
  const out=ts.transpileModule(source,{compilerOptions:{
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,
    jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true
  },reportDiagnostics:true});
  const errors=(out.diagnostics??[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
  assert.equal(errors.length,0,file+" has TypeScript transpile errors");
  return out.outputText;
}

const modelFile=path.join(root,"lib/dbt-models-ref-simulation.ts");
const mod={exports:{}};
vm.runInThisContext("(function(module,exports,require){"+transpile(modelFile)+"\n})",{filename:modelFile})(mod,mod.exports,require);
const model=mod.exports;
assert.equal(model.dbtModelsScenarios.length,3);
for(const scenario of model.dbtModelsScenarios){
  assert.ok(scenario.sourceCode.includes("source("));
  assert.ok(scenario.stagingModel.startsWith("stg_"));
  assert.ok(scenario.factModel.startsWith("fct_"));
  let state=model.newDbtModelsRunState();
  for(let i=0;i<6;i++)state=model.advanceDbtModelsRun(state,scenario);
  assert.equal(state.status,"success");
  assert.equal(state.step,6);
  assert.equal(state.log.length,6);
  assert.ok(state.log.some(line=>line.includes(scenario.stagingModel+" → "+scenario.factModel)));
}

const componentFile=path.join(root,"components/dbt-models-ref-experience.tsx");
const source=fs.readFileSync(componentFile,"utf8");
transpile(componentFile);
for(const text of [
  "Understand Models & ref()","Run Model","Reset","Model Lineage (DAG)",
  "Query Results (Preview)","Project Structure","Lesson Progress","Scenario"
])assert.ok(source.replace(/&amp;/g,"&").includes(text),"Missing UI contract: "+text);

const app=fs.readFileSync(path.join(root,"components/dataprep-app.tsx"),"utf8");
assert.ok(app.includes("dbtModelsConcept"));
assert.ok(app.includes("DbtModelsHero"));
assert.ok(app.includes("DbtModelsRightRail"));
assert.ok(/!dbtModelsConcept&&[^]*?<NilaCompanion/.test(app));

console.log("PASS: dbt Models ref scenarios, deterministic run state, TSX transpile, UI contracts and app integration.");
