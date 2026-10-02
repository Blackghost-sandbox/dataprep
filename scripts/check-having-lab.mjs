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
  havingDatasets,havingScenarios,groupForHaving,filteredHavingGroups,
  havingQuery,matchesHaving,formatHavingValue
}=load(path.join(root,'lib/having-lab.ts'));
const {HavingLearningLab}=load(path.join(root,'components/having-learning-lab.tsx'));

const orders=havingDatasets.find(item=>item.id==='orders');
assert.ok(orders);
assert.equal(orders.rows.length,10);
const scenarios=havingScenarios('orders');
assert.equal(scenarios.length,4);

const cityGroups=groupForHaving(orders,scenarios[0]);
assert.deepEqual(cityGroups.map(group=>group.key),['Delhi','Mumbai','Bangalore','Pune','Chennai']);
assert.deepEqual(cityGroups.map(group=>group.aggregate),[1570,1000,330,550,890]);
assert.deepEqual(cityGroups.map(group=>group.count),[3,2,2,2,1]);
assert.deepEqual(filteredHavingGroups(orders,scenarios[0]).map(group=>group.key),['Delhi']);
assert.equal(matchesHaving(1000,'>',1000),false);
assert.equal(matchesHaving(1000,'>=',1000),true);
assert.equal(formatHavingValue(1570,'SUM'),'1,570');
assert.equal(havingQuery(orders,scenarios[0]),'SELECT city, SUM(amount) AS total_amount\nFROM orders\nGROUP BY city\nHAVING SUM(amount) > 1000;');

const customerCount=filteredHavingGroups(orders,scenarios[1]);
assert.deepEqual(customerCount.map(group=>group.key),[101,102,103,104]);
const averages=filteredHavingGroups(orders,scenarios[2]);
assert.deepEqual(averages.map(group=>group.key),['Delhi','Chennai']);
const premium=filteredHavingGroups(orders,scenarios[3]);
assert.deepEqual(premium.map(group=>group.key),[101,102]);

const html=renderToString(React.createElement(HavingLearningLab));
for(const text of ['Interactive Simulation','High-spend cities','Customers with 2+ orders','Average above threshold','Premium customers','Group by column','Aggregate function','Condition','Threshold value','Input table (orders)','After GROUP BY (summary)','After HAVING (filtered groups)','Generated SQL','Visual explanation','WHERE vs HAVING','Orders (10 rows)','Run Query','Next Scenario','1,570']){
  assert.ok(html.includes(text),text);
}
assert.ok(html.includes('1 group'));
assert.ok(html.includes('HAVING SUM(amount) &gt; 1000'));
console.log('PASS: HAVING grouping, aggregate predicates, scenarios, generated SQL and initial server render.');
console.log('Reference note: SUM(amount) > 1000 correctly excludes the Mumbai group whose total is exactly 1000.');
console.log('Browser controls, Run Query timing, Copy SQL, dataset switching and pixel layout still require browser verification.');
