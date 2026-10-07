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
const require=createRequire(import.meta.url);
const cache=new Map();
function load(file){
  if(file.endsWith(".json"))return JSON.parse(fs.readFileSync(file,"utf8"));
  if(cache.has(file))return cache.get(file).exports;
  const loaded={exports:{}};cache.set(file,loaded);
  const source=fs.readFileSync(file,'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const localRequire=name=>{
    if(name.startsWith('@/')||name.startsWith('.')){
      const base=name.startsWith('@/')?path.join(root,name.slice(2)):path.resolve(path.dirname(file),name);
      const found=[base,...['.tsx','.ts','/index.tsx','/index.ts'].map(ext=>base+ext)].find(fs.existsSync);
      assert.ok(found,'Module not found: '+name);return load(found);
    }
    return require(name);
  };
  vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(localRequire,loaded,loaded.exports);
  return loaded.exports;
}

const model=load(path.join(root,'lib/kafka-intro-simulation.ts'));
for(let partitions=1;partitions<=4;partitions++)for(let producer=1;producer<=3;producer++)for(let a=1;a<=3;a++)for(let b=1;b<=3;b++){
 const config={partitions,producer,a,b};let state=model.newIntroState(partitions),steps=0;
 while(!model.introFinished(state)&&steps++<200){
  const old=JSON.stringify(state);const next=model.advanceIntro(state,config);
  assert.equal(JSON.stringify(state),old);
  next.logs.forEach((rows,p)=>{rows.forEach((row,i)=>assert.equal(row.offset,i));assert.ok(next.a.next[p]<=rows.length);assert.ok(next.b.next[p]<=rows.length);});
  assert.ok(next.logs.flat().length>=state.logs.flat().length);assert.ok(next.history.length<=24);state=next;
 }
 assert.ok(model.introFinished(state));assert.equal(state.logs.flat().length,12);assert.equal(new Set(state.logs.flat().map(r=>r.order_id)).size,12);
 assert.equal(model.readerLag(state,'a'),0);assert.equal(model.readerLag(state,'b'),0);
}
const {KafkaIntroLab}=load(path.join(root,'components/kafka-intro-lab.tsx'));
const {GlossaryProvider}=load(path.join(root,'components/glossary.tsx'));
const html=renderToString(React.createElement(GlossaryProvider,null,React.createElement(KafkaIntroLab)));
for(const text of ['See Kafka in action','Send Event','Consumer A','Consumer B','Auto Run','Event Log'])assert.ok((html.includes(text)||html.replace(/<[^>]*>/g,"").includes(text)),text);
console.log('PASS: 108 speed/partition scenarios, immutable state, retained records, offsets, bounded log, finite completion and SSR.');
