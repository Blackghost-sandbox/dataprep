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
const model=transpile(path.join(root,"lib/system-design-end-to-end-case-study-simulation.ts"));
for(const phrase of [
  'label:"Scenario 1: Marketplace Analytics"',
  "eventsPerMinute:100_000",
  "eventSizeKb:2",
  "retentionYears:2",
  "realTimeMix:60",
  "adhocMix:30",
  "mlMix:10",
  "throughput=reference?100_000",
  "latencySec=reference?2.3",
  "consumerQueries=reference?1_250",
  "processingCost=reference?420",
]) assert.ok(model.includes(phrase),"Missing baseline: "+phrase);

const component=transpile(path.join(root,"components/system-design-end-to-end-case-study-experience.tsx"));
for(const phrase of [
  "Interactive End-to-End Simulation",
  "End-to-End Architecture (Interactive)",
  "Configure Workload",
  "Live Data Flow (Simulation)",
  "Real-time Metrics",
  "Sample Output (Analytics Dashboard)",
  "Key Takeaways",
  "Run Simulation",
  "Lesson Progress",
  "Quick Notes",
]) assert.ok(component.includes(phrase),"Missing UI contract: "+phrase);

const app=fs.readFileSync(path.join(root,"components/dataprep-app.tsx"),"utf8");
assert.ok(app.includes('systemEndToEndCaseStudyExperience=module==="system"'));
assert.ok(app.includes("SystemEndToEndCaseStudyHero"));
assert.ok(app.includes("SystemEndToEndCaseStudyRightRail"));

const lesson=fs.readFileSync(path.join(root,"components/spark-lesson.tsx"),"utf8");
assert.ok(lesson.includes('module === "system" && lesson.id === "case-study" ? <SystemEndToEndCaseStudyLab/>'));
assert.ok(lesson.includes('isSystem && lesson.id === "case-study" ? <SystemEndToEndCaseStudyLab/>'));

const layout=fs.readFileSync(path.join(root,"app/layout.tsx"),"utf8");
assert.ok(layout.includes('import "./system-design-end-to-end-case-study.css";'));
console.log("PASS: end-to-end case study reference contract, TSX transpile, and app integration.");
