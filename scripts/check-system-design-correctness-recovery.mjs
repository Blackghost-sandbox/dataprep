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

const modelFile = path.join(root, "lib/system-design-correctness-recovery-simulation.ts");
const mod = { exports: {} };
vm.runInThisContext("(function(module,exports,require){" + transpile(modelFile) + "\n})", { filename: modelFile })(mod, mod.exports, require);
const model = mod.exports;
const scenario = model.getCorrectnessScenario("worker-retry");
const result = model.simulateCorrectness(scenario, "worker-crash");
assert.equal(result.totalEvents, 10000);
assert.equal(result.processedUnique, 9980);
assert.equal(result.duplicatesReceived, 240);
assert.equal(result.failedDlq, 20);
assert.equal(model.correctnessScenarios.length, 3);

const componentFile = path.join(root, "components/system-design-correctness-recovery-experience.tsx");
const source = fs.readFileSync(componentFile, "utf8");
transpile(componentFile);
for (const phrase of [
  "Interactive Simulation",
  "Data Pipeline (Simulated)",
  "Simulate Failure",
  "Run Simulation",
  "Results &amp; Metrics",
  "Sink Data Preview (Deduplicated &amp; Correct)",
  "Event Flow (Live)",
  "Key Takeaways (from Simulation)",
  "Lesson Progress",
  "Quick Notes",
]) assert.ok(source.includes(phrase), "Missing UI contract: " + phrase);

const app = fs.readFileSync(path.join(root, "components/dataprep-app.tsx"), "utf8");
assert.ok(app.includes("systemCorrectnessRecoveryHandsOn"));
assert.ok(app.includes("SystemCorrectnessRecoveryHero"));
assert.ok(app.includes("SystemCorrectnessRecoveryRightRail"));

const lesson = fs.readFileSync(path.join(root, "components/spark-lesson.tsx"), "utf8");
assert.ok(lesson.includes("SystemCorrectnessRecoveryLab"));

console.log("PASS: correctness/recovery reference defaults, TSX transpile, UI contract, and app integration.");
