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
const {sqlLessons}=load(path.join(root,'lib/sql-lessons.ts'));
const {SqlFundamentalsVisual}=load(path.join(root,'components/sql-fundamentals-visual.tsx'));
const {GlossaryProvider,GlossaryTerm}=load(path.join(root,'components/glossary.tsx'));
const {DarkCodeCard}=load(path.join(root,'components/rdd-dataframe-experience.tsx'));
const {Sidebar}=load(path.join(root,'components/dataprep-app.tsx'));
const {SqlConcept}=load(path.join(root,'components/sql-concept.tsx'));
const {SqlOperationVisual}=load(path.join(root,'components/sql-fundamentals-visual.tsx'));
const {sqlConceptGuides}=load(path.join(root,'lib/sql-concepts.ts'));
function buttons(node,found=[]){
  if(!node||typeof node!=='object')return found;
  if(node.type==='button')found.push(node);
  React.Children.forEach(node.props?.children,child=>buttons(child,found));
  return found;
}
for(const lesson of sqlLessons){
  const tabs=[],links=[];
  const props={lesson,onTab:tab=>tabs.push(tab),onLesson:id=>links.push(id)};
  const concept=renderToString(React.createElement(GlossaryProvider,null,React.createElement(SqlConcept,props)));
  const headings=['What is','Basic syntax','Follow the data','Why it matters','Remember','Key Takeaway','Explore Examples'];
  let previous=-1;
  for(const heading of headings){const position=concept.indexOf(heading);assert.ok(position>previous,lesson.id+': '+heading);previous=position;}
  assert.ok(!concept.includes('In plain English'));
  assert.ok(!concept.includes('postgresql.org'));
  for(const button of buttons(SqlConcept(props)))button.props.onClick();
  assert.deepEqual(tabs,['Examples','Hands-on']);
  for(const id of links)assert.ok(sqlLessons.some(item=>item.id===id));
  assert.ok(sqlConceptGuides[lesson.id]);
  assert.ok(renderToString(React.createElement(SqlOperationVisual,{id:lesson.id})).length>100);
  const html=renderToString(React.createElement(GlossaryProvider,null,
    React.createElement(SqlFundamentalsVisual,{id:lesson.id,query:lesson.example.code,explanation:lesson.description}),
    React.createElement(DarkCodeCard,{title:'SQL',code:lesson.example.code})));
  assert.ok(html.includes('Follow the data'));
  assert.ok(html.includes('Next'));
}
for(const term of ['JOIN','CTE','Aggregate','Window Function','Primary Key','Foreign Key','NULL']){
  const html=renderToString(React.createElement(GlossaryProvider,null,React.createElement(GlossaryTerm,{term})));
  assert.ok(html.includes('open glossary deep dive'),term);
}
for(const moduleId of ['sql','spark']){
  const html=renderToString(React.createElement(Sidebar,{collapsed:false,setCollapsed:()=>{},onLesson:()=>{},currentLesson:0,completed:[],module:moduleId,onModule:()=>{}}));
  assert.ok(html.replace(/<!--.*?-->/g,'').includes(moduleId==='sql'?'SQL Progress':'Spark Progress'));
  assert.ok(html.includes(moduleId==='sql'?'Window Functions':'RDD vs DataFrame'));
}
console.log('PASS: 14 SQL visual/code renders, 7 glossary triggers, both module sidebars. No TooltipProvider runtime errors.');
console.log('Server-render smoke tests do not replace browser interaction or responsive layout checks.');
assert.equal(sqlConceptGuides.select.difficulty,'Beginner');
console.log('PASS: 14 concept sequences, operation visuals, continuation callbacks, related lesson links, SELECT difficulty.');
