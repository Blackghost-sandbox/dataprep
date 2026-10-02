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
const {evaluateNullCaseQuery,nullCaseScenarios}=load(path.join(root,'lib/null-case-lab.ts'));
const {NullCaseLearningLab}=load(path.join(root,'components/null-case-learning-lab.tsx'));
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
  const headings=lesson.id==='where'
    ?['Who gets invited?','Predict the result','Build the result','Break your assumption','Explain it to an interviewer']
    :lesson.id==='null-case'
      ?['Interactive Simulation','Input data','Write and run your query','Query result','How it works','Common patterns']
      :['What is','Basic syntax','Follow the data','Why it matters','Remember','Key Takeaway','Explore Examples'];
  let previous=-1;
  for(const heading of headings){const position=concept.indexOf(heading);assert.ok(position>previous,lesson.id+': '+heading);previous=position;}
  assert.ok(!concept.includes('In plain English'));
  assert.ok(!concept.includes('postgresql.org'));
  for(const button of buttons(SqlConcept(props)))button.props.onClick();
  assert.deepEqual(tabs,lesson.id==='where'||lesson.id==='null-case'?[]:['Examples','Hands-on']);
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
const {CompanionProvider}=load(path.join(root,'components/companion-context.tsx'));
const {NilaCompanion}=load(path.join(root,'components/nila-companion.tsx'));
const nila=renderToString(React.createElement(CompanionProvider,{context:{course:'SQL Fundamentals',lesson:sqlLessons[1],tab:'Concept'}},React.createElement(NilaCompanion)));
assert.ok(nila.includes('Open Mithoo learning companion'));
assert.ok(nila.includes('nila-avatar.png'));
console.log('PASS: Mithoo provider/launcher server render.');

const nullCaseHtml=renderToString(React.createElement(NullCaseLearningLab));
for(const text of ['Interactive Simulation','Run Query','Label NULL cities','Label signup status','Count NULLs','Multiple conditions','Custom query','How it works','Common patterns'])assert.ok(nullCaseHtml.includes(text),text);
const city=evaluateNullCaseQuery(nullCaseScenarios.find(item=>item.id==='city-label').query);
assert.deepEqual(city.columns,['id','name','city','city_label']);
assert.equal(city.rows.length,10);
assert.equal(city.rows[1][3],'Unknown');
assert.equal(city.rows[0][3],'Mumbai');
const signup=evaluateNullCaseQuery(nullCaseScenarios.find(item=>item.id==='signup-status').query);
assert.equal(signup.rows[2][3],'Not Signed Up');
assert.equal(signup.rows[0][3],'Signed Up');
const counts=evaluateNullCaseQuery(nullCaseScenarios.find(item=>item.id==='count-nulls').query);
assert.deepEqual(counts.rows,[[10,3,2]]);
const multiple=evaluateNullCaseQuery(nullCaseScenarios.find(item=>item.id==='multiple-conditions').query);
assert.equal(multiple.rows[1][4],'Missing city');
assert.equal(multiple.rows[2][4],'Not signed up');
assert.match(evaluateNullCaseQuery("SELECT id FROM missing;").error,/Unknown table/);
assert.match(evaluateNullCaseQuery("SELECT id, CASE WHEN city = NULL THEN 'Unknown' ELSE city END AS city_label FROM customers;").error,/IS NULL/);
assert.match(evaluateNullCaseQuery("SELECT id, CASE WHEN missing IS NULL THEN 'Unknown' ELSE city END AS city_label FROM customers;").error,/Unknown column/);
console.log('PASS: NULL & CASE WHEN lab renders and deterministic labels, counts, multi-branch CASE, and error states behave as expected.');
