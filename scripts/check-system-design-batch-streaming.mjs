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

const modelFile = path.join(root, "lib/system-design-batch-streaming-simulation.ts");
const mod = { exports: {} };
vm.runInThisContext("(function(module,exports,require){" + transpile(modelFile) + "\n})", { filename: modelFile })(mod, mod.exports, require);
const model = mod.exports;
const scenario = model.getBatchStreamingScenario("ecommerce-orders");
const result = model.simulateBatchStreaming(scenario, 10000, model.defaultBatchStreamingOptions);
assert.equal(result.batchOrders, 600000);
assert.equal(result.batchLatencyMinutes, 60);
assert.equal(result.batchFreshnessMinutes, 60);
assert.equal(result.streamingOrders, 35420);
assert.equal(result.streamLatencySeconds, 2.4);
assert.equal(model.batchStreamingScenarios.length, 3);

const componentFile = path.join(root, "components/system-design-batch-streaming-experience.tsx");
const source = fs.readFileSync(componentFile, "utf8");
transpile(componentFile);
for (const phrase of [
  "Interactive Simulation",
  "Configure Scenario",
  "Architecture Comparison (Live Simulation)",
  "Batch Architecture",
  "Streaming Architecture",
  "Run Simulation",
  "Real-time Results",
  "Event Flow (Live)",
  "Compare Results",
  "Lesson Progress",
  "Quick Notes",
]) assert.ok(source.includes(phrase), "Missing UI contract: " + phrase);

const app = fs.readFileSync(path.join(root, "components/dataprep-app.tsx"), "utf8");
assert.ok(app.includes("systemBatchStreamingHandsOn"));
assert.ok(app.includes("SystemBatchStreamingHero"));
assert.ok(app.includes("SystemBatchStreamingRightRail"));

const lesson = fs.readFileSync(path.join(root, "components/spark-lesson.tsx"), "utf8");
assert.ok(lesson.includes("SystemBatchStreamingLab"));

console.log("PASS: batch/streaming reference defaults, TSX transpile, UI contract, and app integration.");
