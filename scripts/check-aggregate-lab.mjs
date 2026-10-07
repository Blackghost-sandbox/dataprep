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
  aggregateDatasets,aggregateScenarios,aggregateValue,formatAggregateValue,
  aggregateQuery,aggregateSteps,selectableColumns
}=load(path.join(root,'lib/aggregate-lab.ts'));
const {AggregateLearningLab}=load(path.join(root,'components/aggregate-learning-lab.tsx'));

const orders=aggregateDatasets.find(item=>item.id==='orders');
assert.ok(orders);
assert.equal(orders.rows.length,10);
assert.equal(aggregateValue(orders,'COUNT','*'),10);
assert.equal(aggregateValue(orders,'COUNT','amount'),10);
assert.equal(aggregateValue(orders,'SUM','amount'),4490);
assert.equal(formatAggregateValue(aggregateValue(orders,'AVG','amount'),'AVG'),'449.00');
assert.equal(aggregateValue(orders,'MIN','amount'),120);
assert.equal(aggregateValue(orders,'MAX','amount'),890);
assert.equal(aggregateScenarios('orders').length,5);
assert.equal(aggregateQuery(orders,'COUNT','amount'),'SELECT COUNT(amount) AS total_orders\nFROM orders;');
assert.equal(aggregateSteps(orders,'COUNT','amount')[2],'Total non-null values = 10');
assert.ok(selectableColumns(orders,'COUNT').some(column=>column.key==='*'));
assert.ok(!selectableColumns(orders,'SUM').some(column=>column.key==='city'));

const customers=aggregateDatasets.find(item=>item.id==='customers');
assert.ok(customers);
assert.equal(aggregateValue(customers,'AVG','age'),32.1);
assert.equal(aggregateValue(customers,'MAX','total_spend'),4500);

const html=renderToString(React.createElement(AggregateLearningLab));
for(const text of ['Interactive Simulation','Select aggregate function','Choose column (if needed)','Input table (orders)','Result','How it’s calculated','Generated SQL','Try different aggregations','Visual explanation','Key takeaways','Orders (10 rows)','Run Query','Next Scenario','COUNT(amount)','4,490']){
  assert.ok((html.includes(text)||html.replace(/<[^>]*>/g,"").includes(text)),text);
}
console.log('PASS: Aggregate COUNT/SUM/AVG/MIN/MAX semantics, query generation, columns and initial server render.');
console.log('Browser function buttons, Run Query timing, Copy SQL, dataset switching and pixel layout still require browser verification.');
