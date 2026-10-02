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
      assert.ok(found,name);return load(found);
    }
    return require(name);
  };
  vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(localRequire,loaded,loaded.exports);
  return loaded.exports;
}

const {limitDatasets,limitScenarios,sortedLimitRows,limitQuery}=load(path.join(root,'lib/limit-lab.ts'));
const {LimitLearningLab}=load(path.join(root,'components/limit-learning-lab.tsx'));

const customers=limitDatasets.find(item=>item.id==='customers');
assert.ok(customers);
assert.equal(customers.rows.length,10);
const scenarios=limitScenarios('customers');
assert.equal(scenarios.length,3);
assert.deepEqual(sortedLimitRows(customers,'age','DESC',3).map(row=>[row.name,row.age]),[['David',41],['Frank',38],['Henry',36]]);
assert.deepEqual(sortedLimitRows(customers,'age','ASC',3).map(row=>[row.name,row.age]),[['Carol',25],['Jack',27],['Alice',28]]);
assert.deepEqual(sortedLimitRows(customers,'signup_date','DESC',2).map(row=>row.name),['Jack','Irene']);
assert.equal(sortedLimitRows(customers,'age','DESC',50).length,10);
assert.equal(limitQuery(customers,'age','DESC',3),'SELECT id, name, city, age, signup_date\nFROM customers\nORDER BY age DESC\nLIMIT 3;');

const orders=limitDatasets.find(item=>item.id==='orders');
assert.ok(orders);
assert.deepEqual(sortedLimitRows(orders,'amount','DESC',3).map(row=>row.amount),[780,640,500]);

const html=renderToString(React.createElement(LimitLearningLab));
for(const text of ['Interactive Simulation','Set query options','Input table (customers)','Query result (Top 3 by age)','Generated SQL','Visual explanation','Try different scenarios','Customers (10 rows)','Run Query','Next Scenario','Top 3 by age']){
  assert.ok(html.includes(text),text);
}
assert.ok(html.includes('LIMIT 3'));
assert.ok(html.includes('DESC'));
console.log('PASS: LIMIT Top N numeric/date sorting, clipping, generated SQL and initial server render.');
console.log('Browser controls, Run Query timing, Copy SQL, dataset switching and pixel layout still require browser verification.');
