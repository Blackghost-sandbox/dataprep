import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import ts from 'typescript';
import React from 'react';
import {renderToString} from 'react-dom/server';
const root=path.resolve(import.meta.dirname,'..');
const require=createRequire(import.meta.url);
const cache=new Map();
function load(file){
  if(cache.has(file))return cache.get(file).exports;
  const loaded={exports:{}};cache.set(file,loaded);
  const source=fs.readFileSync(file,'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const localRequire=name=>{
    if(name.startsWith('@/')||name.startsWith('.')){
      const base=name.startsWith('@/')?path.join(root,name.slice(2)):path.resolve(path.dirname(file),name);
      const found=['.tsx','.ts','/index.tsx','/index.ts'].map(ext=>base+ext).find(fs.existsSync);
      assert.ok(found,'Module not found: '+name);return load(found);
    }
    return require(name);
  };
  vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(localRequire,loaded,loaded.exports);
  return loaded.exports;
}

const {airflowLessons}=load(path.join(root,'lib/airflow-lessons.ts'));
const {dagChoices,dagTrace,taskReason,flowChoices,flowStory}=load(path.join(root,'lib/airflow-lab-model.ts'));
const {dependenciesSatisfied}=load(path.join(root,'lib/airflow-execution.ts'));
const {AirflowConceptLab}=load(path.join(root,'components/airflow-concept-lab.tsx'));
const {GlossaryProvider}=load(path.join(root,'components/glossary.tsx'));
const allowed={none:['scheduled','skipped','upstream_failed'],scheduled:['queued'],queued:['running'],running:['success','failed','up_for_retry','up_for_reschedule'],up_for_retry:['scheduled'],up_for_reschedule:['scheduled'],success:[],failed:[],upstream_failed:[],skipped:[]};
let scenarios=0,frames=0;
assert.equal(airflowLessons.length,16);
for(const lesson of airflowLessons){
 const html=renderToString(React.createElement(GlossaryProvider,null,React.createElement(AirflowConceptLab,{lesson})));
 for(const label of ['Next step','Reset','Key takeaway','educational'])assert.ok(html.includes(label),lesson.id+': '+label);
 if(lesson.visual==='execution'){
  for(const choice of dagChoices[lesson.id]??['Default scenario']){
   const trace=dagTrace(lesson,choice);scenarios++;
   trace.frames.forEach((frame,i)=>{
    frames++;assert.ok(trace.nodes.some(n=>n.id===frame.focus));
    trace.nodes.forEach(({id})=>{
     assert.ok(allowed[frame.states[id]]);
     assert.ok(taskReason(trace,i,id).length>0);
     if(i){const old=trace.frames[i-1].states[id],next=frame.states[id];if(old!==next)assert.ok(allowed[old].includes(next),lesson.id+' '+choice+' '+id+': '+old+' -> '+next);}
     if(frame.states[id]==='scheduled'){
      const parents=trace.edges.filter(([,to])=>to===id).map(([from])=>frame.states[from]);
      assert.ok(dependenciesSatisfied(parents,id==='join'?'none_failed_min_one_success':'all_success'),lesson.id+' scheduled before eligible: '+id);
     }
    });
   });
   const end=trace.frames.at(-1).states;
   assert.ok(Object.values(end).every(s=>['success','skipped','failed','upstream_failed'].includes(s)));
  }
 }else{
  for(const choice of flowChoices[lesson.id]){
   const story=flowStory(lesson.id,choice);scenarios++;
   story.steps.forEach(frame=>{frames++;assert.ok(story.nodes[frame.node]);assert.ok(story.code[frame.line]);assert.ok(frame.explanation&&frame.value);});
  }
 }
}
const retry=airflowLessons.find(l=>l.id==='retries');
assert.equal(dagTrace(retry,'Exhaust retries').frames.at(-1).states.load,'upstream_failed');
assert.equal(dagTrace(retry,'Timeout').frames.at(-1).states.load,'upstream_failed');
const sensor=dagTrace(airflowLessons.find(l=>l.id==='sensors'),'Default scenario');
assert.equal(sensor.frames.find(f=>f.states.wait_file==='up_for_reschedule').states.load,'none');
console.log('PASS: all 16 Concept lessons SSR; '+scenarios+' scenarios; '+frames+' frames; legal state transitions, upstream eligibility, retry exhaustion and sensor blocking.');

