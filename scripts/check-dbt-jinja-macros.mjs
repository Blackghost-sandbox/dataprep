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

const modelFile=path.join(root,"lib/dbt-jinja-macros-simulation.ts");
const mod={exports:{}};
vm.runInThisContext("(function(module,exports,require){"+transpile(modelFile)+"\n})",{filename:modelFile})(mod,mod.exports,require);
const model=mod.exports;

assert.equal(model.dbtJinjaDatasets.length,3);
const ecommerce=model.getDbtJinjaDataset("ecommerce");
const compiled=model.compileDbtJinja({
  model:model.defaultJinjaModel,
  vars:model.defaultProjectVars,
  macro:model.defaultMacro,
  dataset:ecommerce,
});
assert.equal(compiled.startDate,"2024-01-01");
assert.equal(compiled.region,"US");
assert.ok(compiled.compiledSql.includes("analytics.raw_orders"));
assert.ok(compiled.compiledSql.includes("where order_date >= '2024-01-01'"));
assert.ok(!compiled.compiledSql.includes("{%"));
assert.ok(!compiled.compiledSql.includes("{{"));
assert.equal(compiled.rows.length,5);

const changed=model.compileDbtJinja({
  model:model.defaultJinjaModel,
  vars:"vars:\n  start_date: '2024-01-05'\n  region: 'CA'",
  macro:model.defaultMacro,
  dataset:ecommerce,
});
assert.equal(changed.startDate,"2024-01-05");
assert.equal(changed.region,"CA");
assert.equal(changed.rows.length,2);
assert.ok(changed.compiledSql.includes("2024-01-05"));

const macroModel=model.defaultJinjaModel+"\nand {{ date_filter('order_date') }}";
const macroResult=model.compileDbtJinja({
  model:macroModel,
  vars:model.defaultProjectVars,
  macro:model.defaultMacro.replace("days_back=7","days_back=14"),
  dataset:ecommerce,
});
assert.equal(macroResult.usedMacro,true);
assert.equal(macroResult.macroDaysBack,14);
assert.ok(macroResult.compiledSql.includes("dateadd(day, -14, current_date)"));

const componentFile=path.join(root,"components/dbt-jinja-macros-experience.tsx");
const source=fs.readFileSync(componentFile,"utf8");
transpile(componentFile);
for(const text of [
  "How Jinja, Variables & Macros fit in the dbt flow",
  "Jinja Template",
  "dbt Compile",
  "Compiled SQL",
  "Warehouse Execution",
  "Run Simulation: See Jinja in action",
  "Project Variables (dbt_project.yml)",
  "Macro Example (macros/date_filter.sql)",
  "Query Results",
  "Quick Notes",
  "Lesson Progress",
  "Key Takeaways"
])assert.ok(source.includes(text),"Missing UI contract: "+text);

const app=fs.readFileSync(path.join(root,"components/dataprep-app.tsx"),"utf8");
assert.ok(app.includes("dbtJinjaConcept"));
assert.ok(app.includes("DbtJinjaHero"));
assert.ok(app.includes("DbtJinjaRightRail"));
assert.ok(app.includes("!dbtJinjaConcept&&<NilaCompanion"));

console.log("PASS: dbt Jinja variables/macros compile logic, variable changes, macro expansion, TSX transpile and app integration.");
