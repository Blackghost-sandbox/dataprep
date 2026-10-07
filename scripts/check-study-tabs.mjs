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

const {buildStudyContent,studyFocus}=load(path.join(root,"lib/study-tab-content.ts"));
const modules=[['sql','sql-lessons','sqlLessons'],['python','python-lessons','pythonLessons'],['modeling','data-modeling','modelingLessons'],['spark','spark-lessons','sparkLessons'],['airflow','airflow-lessons','airflowLessons'],['kafka','kafka-lessons','kafkaLessons'],['dbt','dbt-lessons','dbtLessons'],['cloud','cloud-lessons','cloudLessons'],['system','system-design-lessons','systemDesignLessons']];
const rows=[];
for(const [module,file,key] of modules){
 const lessons=load(path.join(root,'lib/'+file+'.ts'))[key];
 for(const lesson of lessons){
  const c=buildStudyContent(module,lesson);const id=module+'/'+lesson.id;
  assert.ok(studyFocus[module][lesson.id],id+' needs a lesson-specific scenario');
  assert.equal(new Set([c.focus.answer,...c.focus.distractors]).size,3,id+' case study choices must be distinct');
  assert.ok(c.focus.edge.length>20&&c.focus.verify.length>20,id+' case study needs a failure boundary and verification evidence');
  assert.ok(c.interviews.length>=6,id+' needs six interview questions');
  assert.ok(c.quiz.length>=3,id+' needs at least three quiz questions');
  assert.equal(new Set(c.interviews.map(q=>q.question)).size,c.interviews.length,id+' duplicate interview questions');
  assert.equal(new Set(c.quiz.map(q=>q.question)).size,c.quiz.length,id+' duplicate quiz questions');
  for(const q of c.quiz){assert.ok(q.options.length>=2,id+' quiz options');assert.ok(q.correct>=0&&q.correct<q.options.length,id+' answer index');assert.ok(q.explanation.length>20,id+' explanation');assert.equal(new Set(q.options).size,q.options.length,id+' duplicated answer options');}
  assert.ok((lesson.example.code||lesson.frames?.length)&&lesson.example.output&&lesson.example.walkthrough.length,id+' worked example');
  assert.ok(lesson.practice.task&&lesson.practice.solution&&lesson.practice.output,id+' exercise');
  assert.ok(lesson.mistakes.length,id+' mistake examples');
  rows.push({module,lesson:lesson.id,interviewQuestions:c.interviews.length,quizQuestions:c.quiz.length});
 }
 console.log('PASS '+module+': '+lessons.length+' enriched lessons');
}
fs.mkdirSync(path.join(root,'artifacts/study-tabs'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts/study-tabs/content-audit.json'),JSON.stringify(rows,null,2));
console.log('PASS '+rows.length+' lessons: substantive content coverage, unique questions, valid quiz indexes, worked examples and practice solutions.');
