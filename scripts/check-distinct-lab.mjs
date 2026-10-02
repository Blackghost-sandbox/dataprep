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

const {distinctDatasets,distinctRows,distinctScenarios,distinctQuery,duplicateGroupCounts}=load(path.join(root,'lib/distinct-lab.ts'));
const {DistinctLearningLab}=load(path.join(root,'components/distinct-learning-lab.tsx'));

const customers=distinctDatasets.find(item=>item.id==='customers');
assert.ok(customers);
assert.equal(customers.rows.length,10);
const scenarios=distinctScenarios('customers');
assert.equal(scenarios.length,4);
assert.equal(distinctRows(customers,scenarios[0].columns).length,5,'name/city unique combinations');
assert.equal(distinctRows(customers,scenarios[1].columns).length,5,'unique cities');
assert.equal(distinctRows(customers,scenarios[2].columns).length,7,'name/city/plan combinations');
assert.equal(distinctRows(customers,scenarios[3].columns).length,10,'id makes rows unique');
assert.equal(duplicateGroupCounts(customers,['name','city']).get(JSON.stringify(['Alice','Chennai'])),3);
assert.equal(distinctQuery(customers,['name','city']),'SELECT DISTINCT name, city\nFROM customers;');

const products=distinctDatasets.find(item=>item.id==='products');
assert.ok(products);
assert.equal(distinctRows(products,distinctScenarios('products')[0].columns).length,6);

const html=renderToString(React.createElement(DistinctLearningLab));
for(const text of ['Interactive Simulation','Select columns','Original data (with duplicates)','Result after DISTINCT','Generated SQL','Visual explanation','Try different scenarios','Key takeaways','Customers (10 rows)','Run Query','Next Scenario']){
  assert.ok(html.includes(text),text);
}
assert.ok(html.includes('5 unique rows returned'));
assert.ok(html.includes('name'));
assert.ok(html.includes('city'));
console.log('PASS: DISTINCT deterministic scenarios, duplicate grouping, generated SQL and initial server render.');
console.log('Browser checkbox/run timing, clipboard, dataset switching and pixel layout still require browser verification.');
