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
    module:ts.ModuleKind.CommonJS,
    target:ts.ScriptTarget.ES2020,
    jsx:ts.JsxEmit.ReactJSX,
    esModuleInterop:true,
  },reportDiagnostics:true});
  const errors=(out.diagnostics??[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
  assert.equal(errors.length,0,file+" has TypeScript transpile errors");
  return out.outputText;
}

const modelFile=path.join(root,"lib/dbt-incremental-models-simulation.ts");
const mod={exports:{}};
vm.runInThisContext("(function(module,exports,require){"+transpile(modelFile)+"\n})",{filename:modelFile})(mod,mod.exports,require);
const model=mod.exports;

assert.equal(model.dbtIncrementalDatasets.length,3);

const ecommerce=model.getDbtIncrementalDataset("ecommerce");
const result=model.runDbtIncrementalMerge(ecommerce,ecommerce.incoming);
assert.equal(result.rows.length,5);
assert.equal(result.processedRows,3);
assert.equal(result.updatedRows,1);
assert.equal(result.insertedRows,2);
assert.equal(result.unchangedRows,2);
assert.equal(result.rows.find(row=>row.order_id==="1002").amount,"80.00");
assert.equal(result.rows.find(row=>row.order_id==="1002").status,"updated");
assert.equal(result.rows.find(row=>row.order_id==="1004").status,"inserted");
assert.equal(result.rows.find(row=>row.order_id==="1005").status,"inserted");
assert.ok(result.terminal.some(line=>line.includes("Processed 3 new/changed rows")));
assert.ok(result.terminal.some(line=>line.includes("1 updated row")));
assert.ok(result.terminal.some(line=>line.includes("2 inserted rows")));

const noChange=model.runDbtIncrementalMerge(ecommerce,[{...ecommerce.existing[0]}]);
assert.equal(noChange.processedRows,0);
assert.equal(noChange.rows.length,3);

const edited=model.cloneIncrementalRows(ecommerce.incoming);
edited[0].order_id="1003";
edited[0].amount="70.00";
const editedResult=model.runDbtIncrementalMerge(ecommerce,edited);
assert.equal(editedResult.updatedRows,2);
assert.equal(editedResult.insertedRows,1);
assert.equal(editedResult.rows.find(row=>row.order_id==="1003").amount,"70.00");

const sql=model.buildIncrementalSql(ecommerce);
assert.ok(sql.includes("materialized='incremental'"));
assert.ok(sql.includes("unique_key='order_id'"));
assert.ok(sql.includes("is_incremental()"));
assert.ok(sql.includes("interval '1 day'"));
assert.ok(sql.includes("raw_orders"));

const componentFile=path.join(root,"components/dbt-incremental-models-experience.tsx");
const source=fs.readFileSync(componentFile,"utf8");
transpile(componentFile);
for(const text of [
  "How incremental models work in the dbt flow",
  "Source (",
  "New / Changed Data",
  "Incremental Model",
  "Final Table",
  "Run Simulation: See incremental model in action",
  "Existing Table (current state)",
  "New / Changed Input Data",
  "Edit Data",
  "Run dbt Incremental Model",
  "Run Simulation",
  "Quick Notes",
  "Lesson Progress",
  "Key Takeaways",
]) assert.ok(source.replace(/&amp;/g,"&").includes(text),"Missing UI contract: "+text);

const app=fs.readFileSync(path.join(root,"components/dataprep-app.tsx"),"utf8");
assert.ok(app.includes("dbtIncrementalConcept"));
assert.ok(app.includes("DbtIncrementalHero"));
assert.ok(app.includes("DbtIncrementalRightRail"));
assert.ok(/!dbtIncrementalConcept&&[^]*?<NilaCompanion/.test(app));

console.log("PASS: dbt Incremental Models merge logic, editable-input behavior, SQL generation, TSX transpile and app integration.");
