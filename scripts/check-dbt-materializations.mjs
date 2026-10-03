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

const modelFile=path.join(root,"lib/dbt-materializations-simulation.ts");
const mod={exports:{}};
vm.runInThisContext("(function(module,exports,require){"+transpile(modelFile)+"\n})",{filename:modelFile})(mod,mod.exports,require);
const model=mod.exports;

assert.equal(model.dbtMaterializationOptions.length,4);
assert.equal(model.dbtMaterializationDatasets.length,3);

for(const dataset of model.dbtMaterializationDatasets){
  for(const option of model.dbtMaterializationOptions){
    const sql=model.buildDbtMaterializationSql(dataset,option.id);
    assert.ok(sql.includes("materialized='"+option.id+"'") || option.id==="incremental");
    assert.ok(sql.includes(dataset.sourceModel));
    const result=model.runDbtMaterialization(dataset,option.id);
    assert.equal(result.materialization,option.id);
    assert.ok(result.status.length>10);
    if(option.id==="view"){
      assert.equal(result.relationType,"view");
      assert.equal(result.storedRows,0);
    } else if(option.id==="table"){
      assert.equal(result.relationType,"table");
      assert.equal(result.storedRows,dataset.totalRows);
    } else if(option.id==="incremental"){
      assert.equal(result.relationType,"incremental table");
      assert.equal(result.processedRows,dataset.changedRows);
    } else {
      assert.equal(result.relationType,"none");
      assert.equal(result.relationName,null);
      assert.equal(result.storedRows,0);
    }
  }
}

const componentFile=path.join(root,"components/dbt-materializations-experience.tsx");
const source=fs.readFileSync(componentFile,"utf8");
transpile(componentFile);
for(const text of [
  "How materializations change the final object",
  "Run Simulation",
  "Try different materializations",
  "Choose Materialization",
  "Simulation Result",
  "Query Result",
  "Warehouse Object",
  "Lesson Progress",
  "Key Takeaways",
  "Reset"
])assert.ok(source.includes(text),"Missing UI contract: "+text);

const app=fs.readFileSync(path.join(root,"components/dataprep-app.tsx"),"utf8");
assert.ok(app.includes("dbtMaterializationsConcept"));
assert.ok(app.includes("DbtMaterializationsHero"));
assert.ok(app.includes("DbtMaterializationsRightRail"));
assert.ok(app.includes("!dbtMaterializationsConcept&&<NilaCompanion"));

console.log("PASS: dbt materializations deterministic options/datasets, run outputs, TSX transpile, UI contracts and app integration.");
