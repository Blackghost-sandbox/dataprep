import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);

function transpile(file) {
  const source = fs.readFileSync(file, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    reportDiagnostics: true,
  });
  const errors = (output.diagnostics ?? []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, file + " has TypeScript transpile errors");
  return output.outputText;
}

const modelFile = path.join(root, "lib/dbt-introduction-simulation.ts");
const modelCode = transpile(modelFile);
const module = { exports: {} };
vm.runInThisContext("(function(module,exports,require){" + modelCode + "\n})", { filename: modelFile })(module, module.exports, require);
const model = module.exports;

assert.equal(model.dbtIntroScenarios.length, 3);
for (const scenario of model.dbtIntroScenarios) {
  assert.ok(scenario.code.includes("source("), scenario.id + " must use dbt source()");
  assert.ok(scenario.rows.length >= 4, scenario.id + " must include deterministic preview rows");
  assert.ok(scenario.fields.length >= 5, scenario.id + " must include warehouse schema");
  const logs = model.buildDbtExecutionLog(scenario);
  assert.equal(logs.length, 6);
  assert.ok(logs[0].includes(scenario.modelName));
  assert.ok(logs[2].includes(scenario.warehouse));
  assert.ok(logs[3].includes("analytics." + scenario.modelName));
  assert.ok(logs[4].includes(scenario.rowCount.toLocaleString("en-US")));
  assert.ok(logs[5].includes("successfully"));
}

const componentFile = path.join(root, "components/dbt-introduction-experience.tsx");
const componentSource = fs.readFileSync(componentFile, "utf8");
transpile(componentFile);
for (const text of [
  "What is dbt? (Interactive Architecture)",
  "Try a Simple dbt Model",
  "Run Model",
  "Reset",
  "Execution Log",
  "Query Results Preview",
  "Model in Warehouse",
  "Lesson Progress",
  "Key Takeaways",
  "Why Use dbt?",
  "Quick Notes",
]) assert.ok(componentSource.replace(/&amp;/g,"&").replace(/<[^>]*>/g,"").includes(text), "Missing UI contract: " + text);

const appSource = fs.readFileSync(path.join(root, "components/dataprep-app.tsx"), "utf8");
assert.ok(appSource.includes("dbtIntroConcept"));
assert.ok(appSource.includes("DbtIntroductionHero"));
assert.ok(appSource.includes("DbtIntroductionRightRail"));
assert.ok(/!dbtIntroConcept&&[^]*?<NilaCompanion/.test(appSource));

console.log("PASS: dbt introduction scenarios, deterministic logs, TSX transpile, required screenshot UI contracts, app integration.");
