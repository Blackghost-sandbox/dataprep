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

const modelFile=path.join(root,"lib/system-design-scale-estimation-simulation.ts");
const mod={exports:{}};
vm.runInThisContext("(function(module,exports,require){"+transpile(modelFile)+"\n})",{filename:modelFile})(mod,mod.exports,require);
const model=mod.exports;
assert.equal(model.scaleScenarios.length,3);

const video=model.getScaleScenario("video-streaming");
const result=model.calculateScale(video,video.inputs);
assert.equal(result.dailyRequests,1_000_000_000);
assert.equal(Math.round(result.averageQps),11574);
assert.equal(Math.round(result.peakQps),115741);
assert.equal(result.roundedPeakQps,120000);
assert.equal(result.dailyIngestPb,1);
assert.equal(result.annualRawPb,365);
assert.equal(result.breakdown.find(x=>x.label==="Video Files").pb,255.5);

const componentFile=path.join(root,"components/system-design-scale-estimation-experience.tsx");
const source=fs.readFileSync(componentFile,"utf8");
transpile(componentFile);
for(const phrase of [
  "Requirements & Scale Estimation",
  "Interactive Simulation",
  "Configure Your System",
  "Architecture Flow (Simulated)",
  "Run Simulation",
  "Estimated Numbers (Results)",
  "Step-by-Step Calculation",
  "Visual Breakdown",
  "Lesson Progress",
  "Quick Notes",
]) assert.ok(source.replace(/&amp;/g,"&").includes(phrase),"Missing UI contract: "+phrase);

const app=fs.readFileSync(path.join(root,"components/dataprep-app.tsx"),"utf8");
assert.ok(app.includes("systemScaleEstimationHandsOn"));
assert.ok(app.includes("SystemScaleEstimationHero"));
assert.ok(app.includes("SystemScaleEstimationRightRail"));
assert.ok(app.includes("SystemScaleEstimationRightRail"));

const lesson=fs.readFileSync(path.join(root,"components/spark-lesson.tsx"),"utf8");
assert.ok(lesson.includes("SystemScaleEstimationLab"));

console.log("PASS: scale estimation defaults, screenshot values, TSX transpile, UI contract, and app integration.");
