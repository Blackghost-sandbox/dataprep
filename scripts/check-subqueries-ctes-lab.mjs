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
  const source=fs.readFileSync(file,'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const localRequire=name=>{
    if(name.startsWith('@/')||name.startsWith('.')){
      const base=name.startsWith('@/')?path.join(root,name.slice(2)):path.resolve(path.dirname(file),name);
      const found=[base,...['.tsx','.ts','/index.tsx','/index.ts'].map(ext=>base+ext)].find(fs.existsSync);
      assert.ok(found,name);return load(found);
    }
    return require(name);
  };
  vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(localRequire,loaded,loaded.exports);
  return loaded.exports;
}

const {
  subqueryDatasets,customerTotals,subqueryResult,subqueryIds,subquerySql,formatSubqueryNumber
}=load(path.join(root,'lib/subqueries-ctes-lab.ts'));
const {SubqueriesCtesLearningLab}=load(path.join(root,'components/subqueries-ctes-learning-lab.tsx'));

const dataset=subqueryDatasets.find(item=>item.id==='customers-orders');
assert.ok(dataset);
assert.equal(dataset.customers.length,5);
assert.equal(dataset.orders.length,10);

const totals=customerTotals(dataset);
assert.deepEqual(totals.map(row=>[row.id,row.total_amount]),[
  [1,470],[2,1200],[3,890],[4,420],[5,760],
]);
assert.deepEqual(subqueryIds(dataset,500),[2,3,5]);
assert.deepEqual(subqueryResult(dataset,'subquery',500).map(row=>row.name),['Bob','Carol','Eva']);
assert.deepEqual(subqueryResult(dataset,'cte',800).map(row=>row.name),['Bob','Carol']);
assert.equal(subqueryResult(dataset,'select',500).length,5);
assert.equal(formatSubqueryNumber(1200),'1,200');
assert.equal(formatSubqueryNumber(535.5),'535.50');

const subquery=subquerySql('subquery',500);
assert.ok(subquery.includes('WHERE c.id IN'));
assert.ok(subquery.includes('HAVING SUM(amount) > 500'));
assert.ok(subquery.includes('AS total_amount'));
const cte=subquerySql('cte',500);
assert.ok(cte.startsWith('WITH totals AS'));
assert.ok(cte.includes('WHERE t.total_amount > 500'));
const scalar=subquerySql('select',500);
assert.ok(scalar.includes('SELECT AVG(o.amount)'));
assert.ok(scalar.includes('AS avg_amount'));

const html=renderToString(React.createElement(SubqueriesCtesLearningLab));
for(const text of [
  'Interactive Simulation','Explore the data','Choose query type','Query result',
  'Subquery','CTE (WITH)','Subquery in SELECT','customers (5 rows)','orders (10 rows)',
  'Generated SQL','Visual explanation','Try different scenarios','Minimum total amount',
  'Run Query','Reset','Next Scenario','Bob','Carol','Eva','1,200','890','760',
]){
  assert.ok((html.includes(text)||html.replace(/<[^>]*>/g,"").includes(text)),text);
}
assert.ok(html.includes('[2, 3, 5]'));
assert.ok(html.includes('3 customers'));
console.log('PASS: Subqueries/CTEs totals, threshold filtering, CTE/scalar SQL and initial server render.');
console.log('Browser query-type controls, Run Query timing, Copy SQL, dataset switching and pixel layout still require browser verification.');
