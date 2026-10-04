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
      if(base.endsWith('.json'))return JSON.parse(fs.readFileSync(base,'utf8'));
      const found=['.tsx','.ts','/index.tsx','/index.ts'].map(ext=>base+ext).find(fs.existsSync);
      assert.ok(found,name);return load(found);
    }return require(name);
  };
  vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(localRequire,loaded,loaded.exports);
  return loaded.exports;
}



const {pythonLessons}=load(path.join(root,'lib/python-lessons.ts'));
if(process.argv.includes('--python-json')){console.log(JSON.stringify(pythonLessons.flatMap(l=>[{id:l.id+' example',code:l.example.code},{id:l.id+' solution',code:l.practice.solution}])));process.exit(0);}
const {SparkLessonPanel}=load(path.join(root,'components/spark-lesson.tsx'));
const {Sidebar}=load(path.join(root,'components/dataprep-app.tsx'));
const {GlossaryProvider}=load(path.join(root,'components/glossary.tsx'));
const {parseLessonLocation,lessonLocation}=load(path.join(root,'lib/lesson-location.ts'));
assert.equal(pythonLessons.length,10);assert.equal(new Set(pythonLessons.map(l=>l.id)).size,10);
let renders=0;
for(const lesson of pythonLessons){
 for(const q of lesson.quiz)assert(q.correct>=0&&q.correct<q.options.length);
 for(const active of ['Concept','Examples','Hands-on','Interview Qs','Common Mistakes','Quiz','Notes']){
  const html=renderToString(React.createElement(GlossaryProvider,null,React.createElement(SparkLessonPanel,{module:'python',lesson,active})));
  assert(html.length>300);assert(!html.includes('Examples target PySpark'));assert(!html.includes('Read the Apache Spark guide'));
  if(active==='Examples')assert(html.includes('Run Code'),lesson.id+' '+active+' execution control');
  if(active==='Hands-on')assert(html.includes('Your Python draft'));
  assert.equal(parseLessonLocation(lessonLocation('python',lesson.id,active),{python:pythonLessons}).index,pythonLessons.indexOf(lesson));renders++;
 }
}
const html=renderToString(React.createElement(Sidebar,{module:'python',collapsed:false,setCollapsed:()=>{},currentLesson:0,completed:[],onLesson:()=>{},onModule:()=>{}}));
assert(html.includes('Data Structures for ETL'));assert(html.includes('Python for Data Engineering'));
console.log('PASS: 10 Python lessons, '+renders+' tab renders, quiz indices, Python draft UI, sidebar and lesson deep links.');



