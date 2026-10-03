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

const modelFile=path.join(root,"lib/dbt-tests-data-quality-simulation.ts");
const mod={exports:{}};
vm.runInThisContext("(function(module,exports,require){"+transpile(modelFile)+"\n})",{filename:modelFile})(mod,mod.exports,require);
const model=mod.exports;

assert.equal(model.dbtTestDatasets.length,3);
const rows=model.cloneDataset("ecommerce");
assert.equal(rows.length,10);
const failures=model.runDbtDataTests(rows);
assert.equal(failures.length,4);
assert.ok(failures.some(f=>f.id==="not-null-order"));
assert.ok(failures.some(f=>f.id==="unique-order"));
assert.ok(failures.some(f=>f.id==="not-null-customer"));
assert.ok(failures.some(f=>f.id==="accepted-amount"));
const terminal=model.buildDbtTestTerminal(failures);
assert.ok(terminal.some(line=>line.includes("4 errors")));
assert.ok(terminal.filter(line=>line.includes("FAIL")).length===4);
assert.equal(model.runDbtDataTests(model.cloneDataset("clean")).length,0);

const componentFile=path.join(root,"components/dbt-tests-data-quality-experience.tsx");
const source=fs.readFileSync(componentFile,"utf8");
transpile(componentFile);
for(const text of [
  "Where tests fit in the dbt flow",
  "Run Simulation: See dbt tests in action",
  "Input Data (stg_orders)",
  "Edit Data",
  "dbt Test Configuration (schema.yml)",
  "Run dbt Tests",
  "Run Tests",
  "Test Results",
  "Key Takeaways",
  "Lesson Progress"
])assert.ok(source.includes(text),"Missing UI contract: "+text);

const app=fs.readFileSync(path.join(root,"components/dataprep-app.tsx"),"utf8");
assert.ok(app.includes("dbtTestsConcept"));
assert.ok(app.includes("DbtTestsHero"));
assert.ok(app.includes("DbtTestsRightRail"));
assert.ok(app.includes("!dbtTestsConcept&&<NilaCompanion"));

console.log("PASS: dbt Tests & Data Quality functional simulation, default 4 failures, clean dataset, TSX transpile and app integration.");
