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

const {DatabaseSync}=require('node:sqlite');
const {
  filterRows,filterModes,evaluateFilter,filterQuery,
  whereDatasets,whereScenarios,evaluateWherePlan,buildWhereSimulationQuery,
}=load(path.join(root,'lib/where-lab.ts'));
const {WhereLearningLab}=load(path.join(root,'components/where-learning-lab.tsx'));

// Keep the legacy NULL-semantics helpers covered because other SQL lessons can reuse them.
const legacy=new DatabaseSync(':memory:');legacy.exec('CREATE TABLE customers(id INTEGER,name TEXT,city TEXT,age INTEGER)');
for(const row of filterRows)legacy.prepare('INSERT INTO customers VALUES(?,?,?,?)').run(row.id,row.name,row.city,row.age);
let legacyChecks=0;
for(const mode of filterModes)for(const age of [0,19,22,25,29,31,100]){
  const actual=legacy.prepare(filterQuery(mode.id,age)).all().map(r=>r.name);
  const modeled=filterRows.filter(r=>evaluateFilter(r,mode.id,age)==='TRUE').map(r=>r.name);
  assert.deepEqual(modeled,actual);legacyChecks++;
}
legacy.close();

const customers=whereDatasets.find(item=>item.id==='customers');
assert.ok(customers);
assert.equal(customers.rows.length,10);
const scenarios=whereScenarios('customers');
assert.equal(scenarios.length,5);
assert.equal(customers.rows.filter(row=>evaluateWherePlan(row,customers,scenarios[0].plan)==='TRUE').length,9,'age > 25');
assert.equal(customers.rows.filter(row=>evaluateWherePlan(row,customers,scenarios[1].plan)==='TRUE').length,2,'city = Chennai');
assert.equal(customers.rows.filter(row=>evaluateWherePlan(row,customers,scenarios[2].plan)==='TRUE').length,1,'age >= 30 AND Mumbai');
assert.equal(customers.rows.filter(row=>evaluateWherePlan(row,customers,scenarios[3].plan)==='TRUE').length,5,'age < 30 OR Chennai');
assert.equal(customers.rows.filter(row=>evaluateWherePlan(row,customers,scenarios[4].plan)==='TRUE').length,0,'no matches');
const likePlan={join:'AND',conditions:[{column:'city',operator:'LIKE',value:'M%'}]};
assert.deepEqual(customers.rows.filter(row=>evaluateWherePlan(row,customers,likePlan)==='TRUE').map(row=>row.name),['Bob','Jack']);
assert.match(buildWhereSimulationQuery(customers,scenarios[0].plan),/WHERE age > 25;/);

const html=renderToString(React.createElement(WhereLearningLab));
for(const text of ['Interactive Simulation','Set the condition','Query being executed','Row-by-row evaluation','Input table (customers)','Result table (filtered)','Try it yourself!','Key takeaways','Customers (10 rows)','Run Query','Next Scenario']){
  assert.ok((html.includes(text)||html.replace(/<[^>]*>/g,"").includes(text)),text);
}
assert.ok(!html.includes('Who gets invited?'));
console.log('PASS: '+legacyChecks+' legacy WHERE cases plus 5 screenshot-target scenarios and initial simulation render.');
console.log('Browser timing, clipboard, dataset switching and responsive layout still require browser verification.');
