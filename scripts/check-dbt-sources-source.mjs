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

const modelFile=path.join(root,"lib/dbt-sources-source-simulation.ts");
const mod={exports:{}};
vm.runInThisContext("(function(module,exports,require){"+transpile(modelFile)+"\n})",{filename:modelFile})(mod,mod.exports,require);
const model=mod.exports;
assert.equal(model.dbtSourceScenarios.length,3);
for(const scenario of model.dbtSourceScenarios){
  assert.ok(scenario.sql.includes("source("));
  assert.ok(scenario.yaml.includes("sources:"));
  assert.ok(scenario.yaml.includes("freshness:"));
  assert.ok(scenario.rows.length>=5);
  let state=model.newDbtSourceRunState();
  for(let i=0;i<6;i++)state=model.advanceDbtSourceRun(state,scenario);
  assert.equal(state.status,"success");
  assert.equal(state.step,6);
  assert.equal(state.log.length,6);
  assert.ok(state.log.some(line=>line.includes(scenario.sourceGroup+"."+scenario.tableName)));
  assert.ok(state.log.some(line=>line.includes(scenario.martModel)));
}

const componentFile=path.join(root,"components/dbt-sources-source-experience.tsx");
const source=fs.readFileSync(componentFile,"utf8");
transpile(componentFile);
for(const text of [
  "How source() works","End-to-End Flow","External Source","Define in schema.yml",
  "Use source() in model","Downstream Models","Run Model","Reset",
  "Query Results (Preview)","schema.yml definition (Source)","Model Lineage (DAG)",
  "Key Takeaways","Lesson Progress"
])assert.ok(source.replace(/&amp;/g,"&").includes(text),"Missing UI contract: "+text);

const app=fs.readFileSync(path.join(root,"components/dataprep-app.tsx"),"utf8");
assert.ok(app.includes("dbtSourcesConcept"));
assert.ok(app.includes("DbtSourcesHero"));
assert.ok(app.includes("DbtSourcesRightRail"));
assert.ok(/!dbtSourcesConcept&&[^]*?<NilaCompanion/.test(app));

console.log("PASS: dbt Sources source scenarios, deterministic run state, TSX transpile, screenshot UI contracts and app integration.");
