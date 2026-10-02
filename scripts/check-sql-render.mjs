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
const {evaluateQueryExecution,queryExecutionVariations}=load(path.join(root,'lib/query-execution-lab.ts'));
const {QueryExecutionLearningLab}=load(path.join(root,'components/query-execution-learning-lab.tsx'));
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
    :lesson.id==='query-execution'
      ?['Interactive Query Simulation','Source Tables','SQL Editor','Query Result','Query Execution Order (Visual Flow)','Example Variations']
      :['What is','Basic syntax','Follow the data','Why it matters','Remember','Key Takeaway','Explore Examples'];
  let previous=-1;
  for(const heading of headings){const position=concept.indexOf(heading);assert.ok(position>previous,lesson.id+': '+heading);previous=position;}
  assert.ok(!concept.includes('In plain English'));
  assert.ok(!concept.includes('postgresql.org'));
  for(const button of buttons(SqlConcept(props)))button.props.onClick();
  assert.deepEqual(tabs,lesson.id==='where'||lesson.id==='query-execution'?[]:['Examples','Hands-on']);
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

const queryExecutionHtml=renderToString(React.createElement(QueryExecutionLearningLab));
for(const text of ['Interactive Query Simulation','Run Query','Step by step','FROM / JOIN','WHERE','GROUP BY','HAVING','SELECT','ORDER BY','LIMIT','Query Execution Order (Visual Flow)','Example Variations'])assert.ok(queryExecutionHtml.includes(text),text);
const full=evaluateQueryExecution(queryExecutionVariations.find(item=>item.id==='full').query);
assert.deepEqual(full.final.columns,['customer_id','total_orders','total_amount']);
assert.deepEqual(full.final.rows,[[102,2,1100],[104,2,1070],[101,2,790],[105,2,760]]);
assert.equal(full.stages.find(stage=>stage.id==='where').table.rows.length,9);
assert.equal(full.stages.find(stage=>stage.id==='group').table.rows.length,5);
assert.equal(full.stages.find(stage=>stage.id==='having').table.rows.length,4);
const whereOnly=evaluateQueryExecution(queryExecutionVariations.find(item=>item.id==='where').query);
assert.deepEqual(whereOnly.final.rows.map(row=>row[3]),[860,780,650,540]);
const grouped=evaluateQueryExecution(queryExecutionVariations.find(item=>item.id==='group').query);
assert.equal(grouped.final.rows.length,5);
const having=evaluateQueryExecution(queryExecutionVariations.find(item=>item.id==='having').query);
assert.equal(having.final.rows.length,4);
const limited=evaluateQueryExecution(queryExecutionVariations.find(item=>item.id==='limit').query);
assert.deepEqual(limited.final.rows,[[102,2,1100],[104,2,1070]]);
assert.match(evaluateQueryExecution('SELECT id FROM missing;').error,/Unknown table/);
assert.match(evaluateQueryExecution('SELECT customer_id, COUNT(*) AS total_orders FROM orders HAVING COUNT(*) > 1;').error,/GROUP BY/);
assert.match(evaluateQueryExecution('SELECT id, amount FROM orders ORDER BY missing DESC;').error,/ORDER BY column/);
console.log('PASS: Query Execution & Review lab renders, exposes all logical stages, computes the approved result, supports variations, and returns deterministic errors.');
