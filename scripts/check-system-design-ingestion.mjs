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
  const out=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true},reportDiagnostics:true});
  const errors=(out.diagnostics??[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
  assert.equal(errors.length,0,file+" has TypeScript transpile errors");
  return out.outputText;
}

const modelFile=path.join(root,"lib/system-design-ingestion-simulation.ts");
const mod={exports:{}};
vm.runInThisContext("(function(module,exports,require){"+transpile(modelFile)+"\n})",{filename:modelFile})(mod,mod.exports,require);
const model=mod.exports;
const scenario=model.getIngestionScenario("ecommerce");
const result=model.runIngestionSimulation(scenario,model.defaultIngestionState);
assert.equal(result.records,1_200_000);
assert.equal(result.latencyMin,2.4);
assert.equal(result.failed,1240);
assert.equal(result.throughput,15800);
assert.equal(model.ingestionScenarios.length,3);

const componentFile=path.join(root,"components/system-design-ingestion-experience.tsx");
const source=fs.readFileSync(componentFile,"utf8");
transpile(componentFile);
for(const phrase of ["Interactive Simulation","Choose Data Sources","Ingestion Pipeline (Live Simulation)","Run Simulation","Simulation Results","Event Log (Live)","Data Preview (Landing Zone)","Lesson Progress","Quick Notes"]) assert.ok(source.replace(/&amp;/g,"&").includes(phrase),"Missing UI contract: "+phrase);

const app=fs.readFileSync(path.join(root,"components/dataprep-app.tsx"),"utf8");
assert.ok(app.includes("systemIngestionHandsOn"));
assert.ok(app.includes("SystemIngestionHero"));
assert.ok(app.includes("SystemIngestionRightRail"));

const lesson=fs.readFileSync(path.join(root,"components/spark-lesson.tsx"),"utf8");
assert.ok(lesson.includes("SystemIngestionLab"));

console.log("PASS: ingestion reference defaults, TSX transpile, UI contract, and app integration.");
