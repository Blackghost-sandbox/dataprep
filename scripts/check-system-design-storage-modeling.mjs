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
  const out = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    reportDiagnostics: true,
  });
  const errors = (out.diagnostics ?? []).filter(d => d.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, file + " has TypeScript transpile errors");
  return out.outputText;
}

const modelFile = path.join(root, "lib/system-design-storage-modeling-simulation.ts");
const mod = { exports: {} };
vm.runInThisContext("(function(module,exports,require){" + transpile(modelFile) + "\n})", { filename: modelFile })(mod, mod.exports, require);
const model = mod.exports;
const scenario = model.getStorageScenario("ecommerce");
const result = model.simulateStoragePlatform(scenario, model.defaultStorageChoices);

assert.equal(result.ingestionRate, 52300);
assert.equal(result.queryLatencyMs, 320);
assert.equal(result.storageTb, 2.8);
assert.equal(result.monthlyCost, 1240);
assert.equal(model.storageScenarios.length, 3);

const componentFile = path.join(root, "components/system-design-storage-modeling-experience.tsx");
const source = fs.readFileSync(componentFile, "utf8");
transpile(componentFile);
for (const phrase of [
  "Interactive Simulation",
  "Select Use Case",
  "Configure Storage Choices",
  "Data Platform Architecture (Live Simulation)",
  "Run Simulation",
  "Simulation Results",
  "Data Flow (Live)",
  "Query &amp; Compare",
  "Run Query",
  "Lesson Progress",
  "Quick Notes",
]) assert.ok(source.includes(phrase), "Missing UI contract: " + phrase);

const app = fs.readFileSync(path.join(root, "components/dataprep-app.tsx"), "utf8");
assert.ok(app.includes("systemStorageModelingHandsOn"));
assert.ok(app.includes("SystemStorageModelingHero"));
assert.ok(app.includes("SystemStorageModelingRightRail"));

const lesson = fs.readFileSync(path.join(root, "components/spark-lesson.tsx"), "utf8");
assert.ok(lesson.includes("SystemStorageModelingLab"));

console.log("PASS: storage/modeling reference defaults, TSX transpile, UI contract, and app integration.");
