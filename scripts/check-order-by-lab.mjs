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
  let source=fs.readFileSync(file,'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const localRequire=name=>{
    if(name.startsWith('@/')||name.startsWith('.')){
      const base=name.startsWith('@/')?path.join(root,name.slice(2)):path.resolve(path.dirname(file),name);
      const found=['.tsx','.ts','/index.tsx','/index.ts'].map(ext=>base+ext).find(fs.existsSync);
      assert.ok(found,name);return load(found);
    }
    return require(name);
  };
  vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(localRequire,loaded,loaded.exports);
  return loaded.exports;
}

const {orderDatasets,orderScenarios,sortRows,orderQuery}=load(path.join(root,'lib/order-by-lab.ts'));
const {OrderByLearningLab}=load(path.join(root,'components/order-by-learning-lab.tsx'));

const customers=orderDatasets.find(item=>item.id==='customers');
assert.ok(customers);
assert.equal(customers.rows.length,10);
const scenarios=orderScenarios('customers');
assert.equal(scenarios.length,4);
assert.deepEqual(sortRows(customers,'age','ASC').map(row=>row.age),[25,27,28,29,31,32,34,36,38,41]);
assert.deepEqual(sortRows(customers,'age','DESC').map(row=>row.age),[41,38,36,34,32,31,29,28,27,25]);
assert.deepEqual(sortRows(customers,'name','ASC').slice(0,3).map(row=>row.name),['Alice','Bob','Carol']);
assert.deepEqual(sortRows(customers,'signup_date','DESC').slice(0,2).map(row=>row.name),['Jack','Irene']);
assert.equal(orderQuery(customers,'age','ASC'),'SELECT name, age, city\nFROM customers\nORDER BY age ASC;');

const orders=orderDatasets.find(item=>item.id==='orders');
assert.ok(orders);
assert.deepEqual(sortRows(orders,'amount','DESC').slice(0,3).map(row=>row.amount),[780,640,500]);

const html=renderToString(React.createElement(OrderByLearningLab));
for(const text of ['Interactive Simulation','Choose sorting options','Original data (unsorted)','Result after ORDER BY age ASC','ORDER BY syntax','Visual explanation','Try different scenarios','Customers (10 rows)','Run Query','Next Scenario']){
  assert.ok(html.includes(text),text);
}
assert.ok(html.includes('Ascending (ASC)'));
assert.ok(html.includes('Descending (DESC)'));
console.log('PASS: ORDER BY numeric/text/date sorting, ASC/DESC, generated SQL and initial server render.');
console.log('Browser select/run timing, Copy SQL, dataset switching and pixel layout still require browser verification.');
