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

const modelFile=path.join(root,"lib/dbt-project-structure-simulation.ts");
const mod={exports:{}};
vm.runInThisContext("(function(module,exports,require){"+transpile(modelFile)+"\n})",{filename:modelFile})(mod,mod.exports,require);
const model=mod.exports;

assert.equal(model.dbtProjectScenarios.length,3);

const healthy=model.getDbtProjectScenario("healthy");
const healthyValidation=model.validateDbtProject(healthy);
assert.equal(healthyValidation.issues.length,0);
assert.equal(healthyValidation.score,100);
assert.ok(healthyValidation.passedChecks.some(line=>line.includes("dbt_project.yml")));

const misplaced=model.getDbtProjectScenario("misplaced");
const misplacedValidation=model.validateDbtProject(misplaced);
assert.ok(misplacedValidation.issues.some(issue=>issue.id==="layering"));
assert.ok(misplacedValidation.score<100);

const undocumented=model.getDbtProjectScenario("undocumented");
const undocumentedValidation=model.validateDbtProject(undocumented);
assert.ok(undocumentedValidation.issues.some(issue=>issue.id==="docs-fct-orders"));
assert.ok(undocumentedValidation.issues.some(issue=>issue.id==="docs-stg-customers"));

const fct=model.getDbtProjectNode(healthy,"fct-orders");
const docs=model.buildDocsPreview(fct);
assert.ok(docs.join("\n").includes("models/marts/fct_orders.sql"));
assert.ok(docs.join("\n").includes("Documentation status: documented"));

const componentFile=path.join(root,"components/dbt-project-structure-experience.tsx");
const source=fs.readFileSync(componentFile,"utf8");
transpile(componentFile);
for(const text of [
  "How a dbt project is structured",
  "dbt_project.yml",
  "models/",
  "macros/",
  "tests/",
  "seeds/",
  "docs/",
  "Run Simulation: Validate a dbt project",
  "Inspect Project Node",
  "Documentation Preview",
  "Project Validation",
  "Lesson Progress",
  "Key Takeaways",
  "Quick Notes",
]) assert.ok(source.includes(text),"Missing UI contract: "+text);

const app=fs.readFileSync(path.join(root,"components/dataprep-app.tsx"),"utf8");
assert.ok(app.includes("dbtProjectStructureConcept"));
assert.ok(app.includes("DbtProjectStructureHero"));
assert.ok(app.includes("DbtProjectStructureRightRail"));
assert.ok(app.includes("!dbtProjectStructureConcept&&<NilaCompanion"));

console.log("PASS: dbt Project Structure scenarios, validation, docs preview, TSX transpile and app integration.");
