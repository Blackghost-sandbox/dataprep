import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';

import ts from 'typescript';
import React from 'react';
import {renderToString as renderRawToString} from "react-dom/server";
// React can split visible text with hydration comments and escape entities.
const renderToString=(node)=>renderRawToString(node).replace(/<!--[^]*?-->/g,"").replace(/&amp;/g,"&").replace(/&gt;/g,">").replace(/&lt;/g,"<").replace(/&quot;/g,'"').replace(/&#x27;|&#39;/g,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));
const root=path.resolve(import.meta.dirname,'..');
const require=createRequire(import.meta.url),cache=new Map();
function load(file){
  if(file.endsWith(".json"))return JSON.parse(fs.readFileSync(file,"utf8"));
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
      const found=[base,...['.tsx','.ts','/index.tsx','/index.ts'].map(ext=>base+ext)].find(fs.existsSync);
      assert.ok(found,name);return load(found);
    }return require(name);
  };
  vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(localRequire,loaded,loaded.exports);
  return loaded.exports;
}


const modules={
  dbt:load(path.join(root,'lib/dbt-lessons.ts')).dbtLessons,
  cloud:load(path.join(root,'lib/cloud-lessons.ts')).cloudLessons,
  system:load(path.join(root,'lib/system-design-lessons.ts')).systemDesignLessons,
};
const {SparkLessonPanel}=load(path.join(root,'components/spark-lesson.tsx'));
const {Sidebar}=load(path.join(root,'components/dataprep-app.tsx'));
const {GlossaryProvider}=load(path.join(root,'components/glossary.tsx'));
const {parseLessonLocation,lessonLocation}=load(path.join(root,'lib/lesson-location.ts'));
let renders=0;
for(const [module,lessons] of Object.entries(modules)){
  assert(lessons.length>0);
  assert.equal(new Set(lessons.map(l=>l.id)).size,lessons.length);
  for(const lesson of lessons){
    assert(lesson.example.code&&lesson.example.output&&lesson.example.walkthrough.length);
    assert(lesson.practice.task&&lesson.practice.solution&&lesson.practice.hint);
    assert(lesson.interview.length&&lesson.mistakes.length&&lesson.quiz.length);
    for(const q of lesson.quiz)assert(q.correct>=0&&q.correct<q.options.length);
    for(const active of ['Concept','Examples','Hands-on','Interview Qs','Common Mistakes','Quiz','Notes']){
      const html=renderToString(React.createElement(GlossaryProvider,null,React.createElement(SparkLessonPanel,{lesson,active,module,onTab:()=>{}})));
      assert(html.length>300);
      assert(!html.includes('Examples target PySpark'));
      assert(!html.includes('Read the Apache Spark guide'));
      const location=parseLessonLocation(lessonLocation(module,lesson.id,active),modules);
      assert.deepEqual(location,{module,index:lessons.indexOf(lesson),tab:active});
      renders++;
    }
  }
  const html=renderToString(React.createElement(Sidebar,{collapsed:false,setCollapsed:()=>{},onLesson:()=>{},currentLesson:0,completed:[],module,onModule:()=>{}}));
  assert(html.includes(lessons[0].title.replaceAll('&','&')));
  console.log('PASS: '+module+' '+lessons.length+' lessons, seven tabs, sidebar and deep-link round trips.');
}
assert.equal(parseLessonLocation('#dbt/not-a-lesson/Concept',modules),null);
assert.equal(parseLessonLocation('#__proto__/x/Concept',modules),null);
console.log('PASS: '+renders+' imported lesson/tab server renders. Live persistence and browser interaction require manual QA.');
