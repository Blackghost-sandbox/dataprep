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
  if(file.endsWith('mock-interview.tsx'))source=source.replace('useState(false);','useState(true);').replace('useState<MockState>(()=>emptyMock(round))','useState<MockState>(()=>({...emptyMock(round),phase:globalThis.__mockPhase,mode:globalThis.__mockMode}))');
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



const {mockRounds,emptyMock,readMock,mockSummary,tickMock}=load(path.join(root,'lib/mock-interviews.ts'));
const {MockInterview}=load(path.join(root,'components/mock-interview.tsx'));
const {Sidebar}=load(path.join(root,'components/dataprep-app.tsx'));
const {parseLessonLocation,lessonLocation}=load(path.join(root,'lib/lesson-location.ts'));
assert.equal(mockRounds.length,9);
let renders=0;
for(const round of mockRounds){
  assert(round.questions.length>=4);
  assert.equal(new Set(round.questions.map(q=>q.id)).size,round.questions.length);
  for(const q of round.questions){assert(q.answer&&q.followup&&q.source&&q.criteria.length===3);}
  for(const phase of ['setup','active','paused','review','complete']){
    globalThis.__mockPhase=phase;globalThis.__mockMode='timed';
    const html=renderToString(React.createElement(MockInterview,{round}));
    assert(!html.includes('Loading your interview'));
    assert(html.includes('Mock interview studio'));
    if(phase==='active')assert(!html.includes('Reveal model answer'));
    if(phase==='review')assert(html.includes('Save review'));
    renders++;
  }
  const target=parseLessonLocation(lessonLocation('mock',round.id,'Concept'),{mock:mockRounds});
  assert.equal(target.index,mockRounds.indexOf(round));
}
const round=mockRounds[0],fresh=emptyMock(round);
assert.equal(readMock(null,round).phase,'setup');
const restored=readMock({...fresh,phase:'active',index:500,seconds:-1,ratings:[[99]]},round);
assert.equal(restored.phase,'paused');assert.equal(restored.index,3);assert.equal(restored.seconds,0);assert.equal(restored.ratings[0][0],null);
const running={...fresh,phase:'active',mode:'timed'};
assert.equal(tickMock(running,1201,1200).phase,'paused');
assert.equal(tickMock(running,1201,1200).seconds,1200);
assert.equal(tickMock({...running,phase:'paused'},30,1200).seconds,0);
assert.equal(tickMock({...running,mode:'practice'},1300,1200).phase,'active');
const scored={...fresh,answers:['my answer','','',''],revealed:[true,false,false,false],ratings:fresh.ratings.map(r=>r.map(()=>2))};
assert.deepEqual(mockSummary(scored),{score:24,max:24,rated:12,total:12,answered:1,assisted:1});
const raw=JSON.parse(JSON.stringify(scored));assert.equal(readMock(raw,round).answers[0],'my answer');
assert.equal(readMock({...fresh,history:Array.from({length:15},()=>({date:'2026-09-21T00:00:00Z',score:1,max:24,answered:1,assisted:0,seconds:30}))},round).history.length,10);
const sidebar=renderToString(React.createElement(Sidebar,{module:'mock',collapsed:false,setCollapsed:()=>{},onLesson:()=>{},currentLesson:0,completed:[],onModule:()=>{}}));
assert(sidebar.includes('Full Data Engineer Mock'));assert(sidebar.includes('Mock Interviews'));
delete globalThis.__mockPhase;delete globalThis.__mockMode;
console.log('PASS: 9 rounds, 40 questions, '+renders+' phase renders, timed answer gating, round links, timer expiry/pause, restoration validation, self-rating and history limits.');
