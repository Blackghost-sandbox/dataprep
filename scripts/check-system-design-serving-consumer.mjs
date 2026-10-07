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
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    reportDiagnostics: true,
  });
  const errors = (out.diagnostics ?? []).filter(d => d.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, file + " has TypeScript transpile errors");
  return out.outputText;
}

const modelFile = path.join(root, "lib/system-design-serving-consumer-simulation.ts");
const mod = { exports: {} };
vm.runInThisContext("(function(module,exports,require){" + transpile(modelFile) + "\n})", { filename: modelFile })(mod, mod.exports, require);
const model = mod.exports;
const scenario = model.getServingScenario("multi-consumer");
const result = model.simulateServing(scenario, model.defaultServingState);
assert.equal(result.queryLatencyMs, 320);
assert.equal(result.concurrentQueriesPerMin, 1250);
assert.equal(result.consumerCount, 500);
assert.equal(result.monthlyCost, 420);
assert.equal(model.servingScenarios.length, 3);

const componentFile = path.join(root, "components/system-design-serving-consumer-experience.tsx");
const source = fs.readFileSync(componentFile, "utf8");
transpile(componentFile);
for (const phrase of [
  "Interactive Simulation",
  "Configure Consumers",
  "Serving Architecture (Interactive)",
  "Run Simulation",
  "Run Query",
  "Simulation Results",
  "Live Query Output",
  "Compare Serving Patterns",
  "Lesson Progress",
  "Quick Notes",
]) assert.ok(source.replace(/&amp;/g,"&").includes(phrase), "Missing UI contract: " + phrase);

const app = fs.readFileSync(path.join(root, "components/dataprep-app.tsx"), "utf8");
assert.ok(app.includes("systemServingConsumerHandsOn"));
assert.ok(app.includes("SystemServingConsumerHero"));
assert.ok(app.includes("SystemServingConsumerRightRail"));

const lesson = fs.readFileSync(path.join(root, "components/spark-lesson.tsx"), "utf8");
assert.ok(lesson.includes("SystemServingConsumerLab"));

console.log("PASS: serving/consumer reference defaults, TSX transpile, UI contract, and app integration.");
