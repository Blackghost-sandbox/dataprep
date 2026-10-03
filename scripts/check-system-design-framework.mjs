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

const modelFile=path.join(root,"lib/system-design-framework-simulation.ts");
const mod={exports:{}};
vm.runInThisContext("(function(module,exports,require){"+transpile(modelFile)+"\n})",{filename:modelFile})(mod,mod.exports,require);
const model=mod.exports;

assert.equal(model.systemDesignScenarios.length,3);
const video=model.getSystemScenario("video-streaming");
const result=model.simulateSystemDesign(video,video.defaultInputs);
assert.equal(result.totalRequestsPerDay,1_000_000_000);
assert.equal(Math.round(result.cacheHitRate),70);
assert.equal(result.averageLatencyMs,120);
assert.equal(result.errorRate,0.02);
assert.ok(result.databasePeakRps<result.peakRps);
assert.equal(model.getNextSystemScenario("video-streaming"),"ecommerce");

const componentFile=path.join(root,"components/system-design-framework-experience.tsx");
const source=fs.readFileSync(componentFile,"utf8");
transpile(componentFile);
for(const phrase of [
  "Interactive Simulation",
  "Configure Scenario",
  "System Architecture (Live Simulation)",
  "Run Simulation",
  "Reset",
  "Next Scenario",
  "Simulation Results",
  "Event Logs",
  "Analysis &amp; Takeaways",
  "Lesson Progress",
  "Quick Notes",
]) assert.ok(source.includes(phrase),"Missing UI contract: "+phrase);

const app=fs.readFileSync(path.join(root,"components/dataprep-app.tsx"),"utf8");
assert.ok(app.includes("systemDesignFrameworkConcept"));
assert.ok(app.includes("SystemDesignFrameworkHero"));
assert.ok(app.includes("SystemDesignFrameworkRightRail"));
assert.ok(app.includes("!systemDesignFrameworkConcept&&<NilaCompanion"));

const lesson=fs.readFileSync(path.join(root,"components/spark-lesson.tsx"),"utf8");
assert.ok(lesson.includes("SystemDesignFrameworkLab"));

console.log("PASS: system design framework simulation math, UI contract, TypeScript transpile, and app integration.");
