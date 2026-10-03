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

const modelFile = path.join(root, "lib/system-design-scaling-bottlenecks-simulation.ts");
const mod = { exports: {} };
vm.runInThisContext("(function(module,exports,require){" + transpile(modelFile) + "\n})", { filename: modelFile })(mod, mod.exports, require);
const model = mod.exports;
const scenario = model.getScalingScenario("partition-skew");
const result = model.simulateScaling(scenario, 100000, 6, 4, 100000);
assert.equal(result.throughput, 82430);
assert.equal(result.latencySec, 2.4);
assert.equal(result.consumerLag, 35200);
assert.equal(result.failedRecords, 240);
assert.equal(result.bottleneck, "Partition 2 (Hotspot)");
assert.equal(result.partitionLoads[2], 48000);
assert.equal(model.scalingScenarios.length, 3);

const componentFile = path.join(root, "components/system-design-scaling-bottlenecks-experience.tsx");
const source = fs.readFileSync(componentFile, "utf8");
transpile(componentFile);
for (const phrase of [
  "Interactive Simulation",
  "Data Pipeline (Live Simulation)",
  "Bottleneck Detector",
  "Run Simulation",
  "Throughput &amp; Lag (Live)",
  "Partition Load Distribution",
  "Processing Metrics",
  "Compare Configurations",
  "Key Takeaways",
  "Lesson Progress",
  "Quick Notes",
]) assert.ok(source.includes(phrase), "Missing UI contract: " + phrase);

const app = fs.readFileSync(path.join(root, "components/dataprep-app.tsx"), "utf8");
assert.ok(app.includes("systemScalingBottlenecksHandsOn"));
assert.ok(app.includes("SystemScalingBottlenecksHero"));
assert.ok(app.includes("SystemScalingBottlenecksRightRail"));

const lesson = fs.readFileSync(path.join(root, "components/spark-lesson.tsx"), "utf8");
assert.ok(lesson.includes("SystemScalingBottlenecksLab"));

console.log("PASS: scaling/bottlenecks reference defaults, TSX transpile, UI contract, and app integration.");
