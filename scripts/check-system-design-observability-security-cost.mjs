import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import ts from "typescript";

const root=path.resolve(import.meta.dirname,"..");

function transpile(file){
  const source=fs.readFileSync(file,"utf8");
  const out=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true},reportDiagnostics:true});
  const errors=(out.diagnostics??[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
  assert.equal(errors.length,0,file+" has TypeScript transpile errors");
  return source;
}

const model=transpile(path.join(root,"lib/system-design-observability-security-cost-simulation.ts"));
for(const phrase of [
  'label:"Scenario 1: E-commerce Platform"',
  "eventsPerSecond:10_000",
  "dataVolumeGbPerDay:500",
  "errorRatePct:.7",
  "throughput:9842",
  "latencyMs:320",
  "activeConsumers:8",
  "dailyCost:420",
  "errorsPerMinute=isReference ? 68",
  '{label:"Compute",amount:180,percent:43}',
  '{label:"Storage",amount:120,percent:29}',
]) assert.ok(model.includes(phrase),"Missing reference baseline: "+phrase);

const component=transpile(path.join(root,"components/system-design-observability-security-cost-experience.tsx"));
for(const phrase of [
  "Interactive Simulation",
  "Configure Workload & Controls",
  "Pipeline with Observability, Security & Cost Controls",
  "Run Simulation",
  "Real-time Metrics (Live)",
  "Live Logs & Alerts",
  "Cost Breakdown",
  "Lesson Progress",
  "Quick Notes",
]) assert.ok(component.replace(/&amp;/g,"&").includes(phrase),"Missing UI contract: "+phrase);

const app=fs.readFileSync(path.join(root,"components/dataprep-app.tsx"),"utf8");
assert.ok(app.includes("systemObservabilitySecurityCostHandsOn"));
assert.ok(app.includes("SystemObservabilitySecurityCostHero"));
assert.ok(app.includes("SystemObservabilitySecurityCostRightRail"));
const lesson=fs.readFileSync(path.join(root,"components/spark-lesson.tsx"),"utf8");
assert.ok(lesson.includes("SystemObservabilitySecurityCostLab"));
console.log("PASS: observability/security/cost reference contract and integration.");
