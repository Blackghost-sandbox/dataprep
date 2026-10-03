import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {createRequire} from "node:module";
import assert from "node:assert/strict";
import ts from "typescript";
import React from "react";
import {renderToString} from "react-dom/server";

const root=path.resolve(import.meta.dirname,"..");
const require=createRequire(import.meta.url);
const cache=new Map();

function load(file){
  if(cache.has(file))return cache.get(file).exports;
  const loaded={exports:{}};cache.set(file,loaded);
  const source=fs.readFileSync(file,"utf8");
  const code=ts.transpileModule(source,{compilerOptions:{
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,
    jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true
  }}).outputText;
  const localRequire=name=>{
    if(name.startsWith("@/")||name.startsWith(".")){
      const base=name.startsWith("@/")?path.join(root,name.slice(2)):path.resolve(path.dirname(file),name);
      const found=[".tsx",".ts","/index.tsx","/index.ts"].map(ext=>base+ext).find(fs.existsSync);
      assert.ok(found,"Module not found: "+name);
      return load(found);
    }
    return require(name);
  };
  vm.runInThisContext("(function(require,module,exports){"+code+"\n})",{filename:file})(localRequire,loaded,loaded.exports);
  return loaded.exports;
}

const model=load(path.join(root,"lib/cloud-orchestration-simulation.ts"));

assert.equal(model.orchestrators.airflow.label,"Apache Airflow (Managed)");
assert.equal(model.orchestrators["step-functions"].label,"AWS Step Functions");
assert.equal(model.orchestrators.adf.label,"Azure Data Factory");
assert.equal(model.orchestrators.composer.label,"Google Cloud Composer");

const initial=model.referenceOrchestrationState();
assert.equal(initial.pipelineStatus,"success");
assert.equal(initial.tasks.length,5);
assert.equal(initial.selectedTask,"load");
assert.equal(initial.tasks.every(task=>task.status==="success"),true);
assert.deepEqual(initial.tasks.map(task=>task.duration),["2 min","4 min","1 min","1 min","30 sec"]);
assert.ok(initial.logs.some(entry=>entry.text.includes("Reading sales_2026-10.csv from S3")));
assert.ok(initial.logs.some(entry=>entry.text.includes("Submitting Spark job to EMR")));
assert.ok(initial.logs.some(entry=>entry.text.includes("Writing to BigQuery")));
assert.ok(initial.logs.some(entry=>entry.text.includes("Data quality checks passed")));
assert.ok(initial.logs.some(entry=>entry.text.includes("DAG run completed successfully")));

const loadTask=model.taskById(initial.tasks,"load");
assert.equal(loadTask.operator,"BigQueryInsertJobOperator");
assert.equal(loadTask.startTime,"2026-10-01 10:30:13");
assert.equal(loadTask.endTime,"2026-10-01 10:31:20");
assert.equal(loadTask.inputRows,"1,000,000");
assert.equal(loadTask.output,"sales.analytics.daily_sales");
assert.equal(loadTask.processed,"120 MB");

const running=model.runningOrchestrationState(2,"transform");
assert.equal(running.pipelineStatus,"running");
assert.equal(running.tasks[0].status,"running");
assert.equal(running.tasks.slice(1).every(task=>task.status==="waiting"),true);
assert.equal(running.selectedTask,"transform");

const step=model.completedOrchestrationState(3,"step-functions");
assert.equal(step.pipelineStatus,"success");
assert.equal(step.runId,3);
assert.ok(step.status.includes("AWS Step Functions"));
assert.ok(step.logs[0].text.includes("AWS Step Functions run #3"));

const composer=model.completedOrchestrationState(4,"composer");
assert.ok(composer.status.includes("Google Cloud Composer"));

assert.ok(model.dagDefinition.includes('dag_id="daily_sales_pipeline"'));
assert.ok(model.dagDefinition.includes('SparkSubmitOperator'));
assert.ok(model.dagDefinition.includes('BigQueryInsertJobOperator'));
assert.ok(model.dagDefinition.includes('extract >> transform >> load >> quality >> publish'));

const {CloudOrchestrationLab,CloudOrchestrationHero}=load(path.join(root,"components/cloud-orchestration-lab.tsx"));
const html=renderToString(React.createElement(CloudOrchestrationLab));
for(const text of [
  "Run Simulation","Orchestrator","Apache Airflow (Managed)","ETL Pipeline: Daily Sales Analytics",
  "Auto Run (5s)","Success","Running","Failed","Waiting",
  "1. Extract Data","From S3 (CSV)","2. Transform","Run Spark job","3. Load to Warehouse",
  "Write to BigQuery","4. Data Quality","Run checks","5. Publish","Update dashboard",
  "DAG Definition (Simplified)","Execution Logs (Live)","Pipeline Metadata",
  "Task Details","DAG Run Info","BigQueryInsertJobOperator","1,000,000",
  "sales.analytics.daily_sales","120 MB","Key Takeaways"
])assert.ok(html.includes(text),text);

const hero=renderToString(React.createElement(CloudOrchestrationHero,{
  description:"Coordinate cloud jobs, retries, dependencies, schedules, and managed integrations without turning orchestration into transformation logic.",
  minutes:26,currentLesson:8,total:11,onPrevious:()=>{},onNext:()=>{}
}));
for(const text of [
  "Orchestration &amp; Managed Data Integration","26 min","Lesson 9/11","Intermediate",
  "Apache","Airflow","AWS","Step Functions","Azure","Data Factory","Google","Cloud Composer","Previous","Next"
])assert.ok(hero.includes(text),text);

console.log("PASS: orchestration reference state, task metadata, running/completed states, providers, DAG, SSR controls and hero.");
