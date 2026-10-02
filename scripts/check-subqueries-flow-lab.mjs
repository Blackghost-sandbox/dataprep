import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';

import ts from 'typescript';
import React from 'react';
import {renderToString} from 'react-dom/server';

const root=path.resolve(import.meta.dirname,'..');
const require=createRequire(import.meta.url),cache=new Map();

function load(file){
  if(cache.has(file))return cache.get(file).exports;
  const loaded={exports:{}};cache.set(file,loaded);
  const source=fs.readFileSync(file,'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const localRequire=name=>{
    if(name.startsWith('@/')||name.startsWith('.')){
      const base=name.startsWith('@/')?path.join(root,name.slice(2)):path.resolve(path.dirname(file),name);
      const found=['.tsx','.ts','/index.tsx','/index.ts'].map(ext=>base+ext).find(fs.existsSync);
      assert.ok(found,name);
      return load(found);
    }
    return require(name);
  };
  vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(localRequire,loaded,loaded.exports);
  return loaded.exports;
}

const {
  subqueryFlowDatasets,subqueryFlowTotals,subqueryFlowCustomerIds,subqueryFlowResult,
  subqueryFlowSql,subqueryFlowInnerSql,formatSubqueryFlowNumber
}=load(path.join(root,'lib/subqueries-flow-lab.ts'));
const {SubqueriesFlowLearningLab}=load(path.join(root,'components/subqueries-flow-learning-lab.tsx'));

const dataset=subqueryFlowDatasets.find(item=>item.id==='orders');
assert.ok(dataset);
assert.equal(dataset.orders.length,10);
assert.equal(dataset.customers.length,5);

const totals=subqueryFlowTotals(dataset);
assert.equal(totals.get(101),970);
assert.equal(totals.get(102),770);
assert.equal(totals.get(103),1670);
assert.equal(totals.get(104),430);
assert.equal(totals.get(105),650);

assert.deepEqual(subqueryFlowCustomerIds(dataset,500),[101,102,103,105]);
assert.deepEqual(
  subqueryFlowResult(dataset,500,'total_amount','DESC').map(row=>[row.id,row.total_amount]),
  [[103,1670],[101,970],[102,770],[105,650]],
);
assert.deepEqual(
  subqueryFlowResult(dataset,800,'total_amount','ASC').map(row=>[row.id,row.total_amount]),
  [[101,970],[103,1670]],
);
assert.deepEqual(
  subqueryFlowResult(dataset,500,'name','ASC').map(row=>row.name),
  ['Alice','Bob','Carol','Frank'],
);

const query=subqueryFlowSql(500,'total_amount','DESC');
assert.ok(query.includes('WHERE c.id IN'));
assert.ok(query.includes('GROUP BY customer_id'));
assert.ok(query.includes('HAVING SUM(amount) > 500'));
assert.ok(query.includes('AS total_amount'));
assert.ok(query.includes('ORDER BY total_amount DESC'));
assert.equal(
  subqueryFlowInnerSql(500),
  'SELECT customer_id\nFROM orders\nGROUP BY customer_id\nHAVING SUM(amount) > 500',
);
assert.equal(formatSubqueryFlowNumber(1670),'1,670');

const html=renderToString(React.createElement(SubqueriesFlowLearningLab));
for(const text of [
  'Interactive Simulation','Input data (orders)','Subquery','Use in main query',
  'Result (customers with total > 500)','What happened?','Generated SQL',
  'Visual explanation','Try different scenarios','Minimum total amount',
  'Sort by','Sort order','Key takeaways','Orders (10 rows)',
  'Run Query','Reset','Next Scenario','1,670','970','770','650',
]){
  assert.ok(html.includes(text),text);
}

console.log('PASS: subquery totals, threshold filtering, sorting, SQL generation and initial server render.');
console.log('Reference note: the screenshot omits customer 101 even though its visible order amounts total 970 (> 500); the functional model keeps SQL semantics and includes it.');
console.log('Browser controls, Run Query timing, Copy SQL, dataset switching and pixel layout still require browser verification.');
