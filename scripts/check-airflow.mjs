import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';

import ts from 'typescript';
import React from 'react';
import {renderToString} from 'react-dom/server';
const root=path.resolve(import.meta.dirname,'..');
const require=createRequire(import.meta.url),cache=new Map();
function load(file){
  if(cache.has(file))return cache.get(file).exports;
  const loaded={exports:{}};cache.set(file,loaded);
  let source=fs.readFileSync(file,'utf8');
  // Server effects never hydrate localStorage. Render the hydrated branch ONLY
  // in this test fixture; this is a render smoke test, not a browser/storage test.
  if(file.endsWith('spark-lesson.tsx'))source=source.replace('const [ready, setReady] = useState(false);','const [ready, setReady] = useState(true);');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const localRequire=name=>{
    if(name.startsWith('@/')||name.startsWith('.')){
      const base=name.startsWith('@/')?path.join(root,name.slice(2)):path.resolve(path.dirname(file),name);
      const found=['.tsx','.ts','/index.tsx','/index.ts'].map(ext=>base+ext).find(fs.existsSync);
      assert.ok(found,name);return load(found);
    }return require(name);
  };
  vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(localRequire,loaded,loaded.exports);
  return loaded.exports;
}

const {airflowLessons}=load(path.join(root,'lib/airflow-lessons.ts'));
if(process.argv.includes('--python-json')){console.log(JSON.stringify(airflowLessons.map(l=>({id:l.id,code:l.example.code}))));process.exit(0);}
const {executionScenario,dependenciesSatisfied}=load(path.join(root,'lib/airflow-execution.ts'));
const {SparkLessonPanel}=load(path.join(root,'components/spark-lesson.tsx'));
const {GlossaryProvider}=load(path.join(root,'components/glossary.tsx'));
const {Sidebar}=load(path.join(root,'components/dataprep-app.tsx'));
assert.equal(airflowLessons.length,16);
assert.equal(new Set(airflowLessons.map(l=>l.id)).size,16);
let rendered=0;
for(const lesson of airflowLessons){
  for(const q of [...lesson.quiz,lesson.decision]){assert(q.correct>=0&&q.correct<q.options.length);assert(q.explanation.trim().length>0);}
  for(const tab of ['Concept','Examples','Hands-on','Interview Qs','Common Mistakes','Quiz','Notes']){
    const html=renderToString(React.createElement(GlossaryProvider,null,React.createElement(SparkLessonPanel,{lesson,active:tab,module:'airflow',onTab:()=>{}})));
    assert(html.length>300,lesson.id+' '+tab);assert(!html.includes('PySpark 3.5'),lesson.id);rendered++;
  }
}
const sidebar=renderToString(React.createElement(Sidebar,{collapsed:false,setCollapsed:()=>{},onLesson:()=>{},currentLesson:0,completed:[],module:'airflow',onModule:()=>{}}));
assert(sidebar.includes('Airflow Introduction'));assert(sidebar.includes('Build &amp; Review a Sales DAG'));
for(const kind of ['chain','etl','dependencies','mapping','branching','sensors','retries']){
  const s=executionScenario(kind);
  for(const frame of s.frames){
    for(const node of s.nodes){
      assert(frame.states[node.id]);
      if(frame.states[node.id]==='scheduled'){
        const parents=s.edges.filter(([,to])=>to===node.id).map(([from])=>frame.states[from]);
        assert(dependenciesSatisfied(parents,kind==='branching'&&node.id==='join'?'none_failed_min_one_success':'all_success'),kind+' '+frame.title);
      }
    }
  }
  assert.equal(s.frames.at(-1).states[s.nodes.at(-1).id],'success');
}
const failure=executionScenario('retries',true).frames.at(-1);
assert.equal(failure.states.transform,'failed');assert.equal(failure.states.load,'upstream_failed');
assert(executionScenario('sensors').frames.some(f=>f.states.wait_file==='up_for_reschedule'));
assert.equal(dependenciesSatisfied(['success','skipped']),false);
assert.equal(dependenciesSatisfied(['success','skipped'],'none_failed_min_one_success'),true);
assert.equal(dependenciesSatisfied(['skipped','skipped'],'none_failed_min_one_success'),false);
assert.equal(dependenciesSatisfied(['success','failed'],'none_failed_min_one_success'),false);
assert.equal(airflowLessons.at(-1).execution,'etl');
console.log('PASS: 16 lessons, '+rendered+' lesson/tab renders, Airflow sidebar, 7 execution scenarios, retry failure and trigger-rule invariants.');
