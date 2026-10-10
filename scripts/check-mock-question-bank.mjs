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

const {mockRounds, mockTracks, allMockQuestions, interviewSources}=load(path.join(root,"lib/mock-interviews.ts"));
const {filterMockQuestions}=load(path.join(root,"lib/mock-question-filters.ts"));
const {MockInterview}=load(path.join(root,"components/mock-interview.tsx"));
const blank={search:"",lesson:"",relevance:"",evidence:""};
const ids=new Set(),prompts=new Set();
for(const q of allMockQuestions){
 assert.ok(!ids.has(q.id),q.id);ids.add(q.id);
 assert.ok(!prompts.has(q.question.toLowerCase()),q.question);prompts.add(q.question.toLowerCase());
 assert.ok(q.answer.length>100,q.id+" needs a substantive answer");
 assert.ok(["High","Role-specific","Advanced"].includes(q.relevance));
 assert.ok(["reported","topic","published"].includes(q.evidence));
 assert.ok(new URL(q.source).protocol==="https:");
 assert.equal(interviewSources[q.sourceId].kind,q.evidence==="published"?"published":"candidate");
 assert.ok(q.lessons.length);
 for(const lesson of q.lessons){
  const track=mockTracks.find(t=>t.id===lesson.module);
  assert.ok(track.lessons.some(l=>l.id===lesson.id&&l.title===lesson.title),q.id);
 }
}
let lessonCount=0;
for(const track of mockTracks){
 const round=mockRounds.find(r=>r.id===track.id+"-round");assert.ok(round);
 assert.deepEqual(round.questions.map(q=>q.id),allMockQuestions.filter(q=>q.module===track.id).map(q=>q.id));
 for(const lesson of track.lessons){
  lessonCount++;
  const result=filterMockQuestions(round.questions,{...blank,lesson:track.id+"/"+lesson.id});
  assert.ok(result.length,track.id+"/"+lesson.id+" missing");
  assert.ok(result.every(q=>q.lessonIds.includes(lesson.id)));
 }
 const html=renderToString(React.createElement(MockInterview,{round}));
 assert.ok(html.includes("Questions & answers"));
 assert.ok(html.includes(round.questions[0].question));
 assert.ok(html.replace(/<[^>]+>/g," ").replace(/\s+/g," ").includes(round.questions.at(-1).answer.replace(/\s+/g," ")) || html.replace(/<[^>]+>/g,"").includes(round.questions.at(-1).answer));
 assert.ok(html.includes('class="qa-keyword"'));
 assert.equal((html.match(/class="mock-bank-question"/g)||[]).length,round.questions.length);
 for(const word of ["Start interview","Choose your mode","self-rated points","Reveal model answer","Session paused"]){assert.ok(!html.includes(word),word);}
}
assert.equal(filterMockQuestions(allMockQuestions,blank).length,allMockQuestions.length);
for(const relevance of ["High","Role-specific","Advanced"]){const result=filterMockQuestions(allMockQuestions,{...blank,relevance});assert.ok(result.length);assert.ok(result.every(q=>q.relevance===relevance));}
for(const evidence of ["reported","topic","published"]){const result=filterMockQuestions(allMockQuestions,{...blank,evidence});assert.ok(result.length);assert.ok(result.every(q=>q.evidence===evidence));}
const reports=filterMockQuestions(allMockQuestions,{...blank,evidence:"candidate"});assert.ok(reports.length);assert.ok(reports.every(q=>q.evidence!=="published"));
assert.ok(filterMockQuestions(allMockQuestions,{...blank,search:"second salary"}).some(q=>q.id==="sql-015"));
assert.equal(filterMockQuestions(allMockQuestions,{...blank,search:"zzzz-no-such-question"}).length,0);
const mixed=mockRounds.find(r=>r.id==="mixed-round");assert.deepEqual(mixed.questions.map(q=>q.id),allMockQuestions.map(q=>q.id));
const html=renderToString(React.createElement(MockInterview,{round:mixed}));assert.equal((html.match(/class="mock-bank-question"/g)||[]).length,allMockQuestions.length);
console.log(JSON.stringify({questions:ids.size,sources:Object.keys(interviewSources).length,lessons:lessonCount,rounds:mockRounds.length,rendered:"all questions and answers, all rounds",filters:"search, lesson, evidence, relevance, empty results"},null,2));
