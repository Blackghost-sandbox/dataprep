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

const {
  groupDatasets,groupScenarios,groupRows,groupQuery,groupAggregateAlias,formatGroupValue
}=load(path.join(root,'lib/group-by-lab.ts'));
const {GroupByLearningLab}=load(path.join(root,'components/group-by-learning-lab.tsx'));

const orders=groupDatasets.find(item=>item.id==='orders');
assert.ok(orders);
assert.equal(orders.rows.length,10);
const scenarios=groupScenarios('orders');
assert.equal(scenarios.length,4);

const cityGroups=groupRows(orders,scenarios[0]);
assert.deepEqual(cityGroups.map(group=>group.key),['Chennai','Mumbai','Bangalore','Hyderabad']);
assert.deepEqual(cityGroups.map(group=>group.aggregate),[1280,1190,350,1670]);
assert.deepEqual(cityGroups.map(group=>group.count),[4,2,2,2]);
assert.deepEqual(cityGroups[0].rowIds,[1,3,6,10]);
assert.equal(groupAggregateAlias(scenarios[0]),'total_amount');
assert.equal(formatGroupValue(cityGroups[0].aggregate,'SUM'),'1,280');
assert.equal(groupQuery(orders,scenarios[0]),'SELECT city, SUM(amount) AS total_amount, COUNT(*) AS order_count\nFROM orders\nGROUP BY city;');

const byCustomer=groupRows(orders,scenarios[1]);
assert.deepEqual(byCustomer.map(group=>group.key),[101,102,103,104]);
assert.deepEqual(byCustomer.map(group=>group.aggregate),[1280,1190,350,1670]);

const countOrders=groupRows(orders,scenarios[2]);
assert.deepEqual(countOrders.map(group=>group.aggregate),[4,2,2,2]);

const avgSpend=groupRows(orders,scenarios[3]);
assert.deepEqual(avgSpend.map(group=>Number(group.aggregate.toFixed(2))),[320,595,175,835]);

const html=renderToString(React.createElement(GroupByLearningLab));
for(const text of ['Interactive Simulation','Group by city (SUM)','Group by customer','Count orders','Average spend','Source Data (orders)','Grouping (by city)','Grouped Result (SUM amount)','Generated SQL','How it works','What changed?','Key takeaways','Orders (10 rows)','Run Query','Next Scenario','1,280','1,190','1,670']){
  assert.ok(html.includes(text),text);
}
console.log('PASS: GROUP BY grouping, SUM/COUNT/AVG scenarios, generated SQL and initial server render.');
console.log('Browser scenario/run timing, Copy SQL, dataset switching and pixel layout still require browser verification.');
