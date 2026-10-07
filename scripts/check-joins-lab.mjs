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

const {joinDatasets,joinScenarios,runJoin,joinQuery,joinParts}=load(path.join(root,'lib/joins-lab.ts'));
const {JoinsLearningLab}=load(path.join(root,'components/joins-learning-lab.tsx'));

const orders=joinDatasets.find(item=>item.id==='orders');
assert.ok(orders);
assert.equal(orders.customers.length,5);
assert.equal(orders.orders.length,6);

const inner=runJoin(orders,joinScenarios[0]);
assert.equal(inner.length,6);
assert.deepEqual(inner.map(row=>[row.name,row.order_id,row.amount]),[
  ['Alice',201,250],['Alice',202,540],['Bob',204,320],
  ['Carol',203,120],['Carol',205,780],['David',206,410],
]);

const left=runJoin(orders,joinScenarios[1]);
assert.equal(left.length,7);
assert.deepEqual(left[left.length-1],{
  customer_id:105,name:'Eva',city:'Hyderabad',order_id:null,amount:null,order_date:null,
});

const full=runJoin(orders,joinScenarios[2]);
assert.equal(full.length,7);

const missing=runJoin(orders,joinScenarios[3]);
assert.deepEqual(missing.map(row=>row.name),['Eva']);

const multiple=runJoin(orders,joinScenarios[4]);
assert.deepEqual(multiple.map(row=>row.name),['Alice','Alice','Carol','Carol']);

const support=joinDatasets.find(item=>item.id==='support');
assert.ok(support);
assert.equal(runJoin(support,joinScenarios[0]).length,3);
assert.equal(runJoin(support,joinScenarios[1]).length,5);
assert.equal(runJoin(support,joinScenarios[2]).length,6);
assert.deepEqual(runJoin(support,joinScenarios[3]).map(row=>row.name),['Noah','Liam']);

assert.equal(joinQuery(joinScenarios[0]),'SELECT c.name, o.order_id, o.amount\nFROM customers c\nINNER JOIN orders o ON c.id = o.customer_id;');
assert.equal(joinQuery(joinScenarios[1]),'SELECT c.name, o.order_id, o.amount\nFROM customers c\nLEFT JOIN orders o ON c.id = o.customer_id;');
assert.ok(joinQuery(joinScenarios[2]).includes('FULL OUTER JOIN'));
assert.ok(joinQuery(joinScenarios[3]).includes('WHERE o.order_id IS NULL'));
assert.ok(joinQuery(joinScenarios[4]).includes('HAVING COUNT(*) > 1'));
assert.equal(joinParts(joinScenarios[0])[2][0],'ON c.id = o.customer_id');

const html=renderToString(React.createElement(JoinsLearningLab));
for(const text of [
  'Interactive Simulation','INNER JOIN','LEFT JOIN','FULL JOIN','Missing matches','Multiple orders',
  'customers','orders','Result','Generated SQL','What each part means',
  'Visual explanation','Key takeaways','Run Query','Reset','Next Scenario',
]){
  assert.ok((html.includes(text)||html.replace(/<[^>]*>/g,"").includes(text)),text);
}
assert.ok(html.includes('6 rows'));
assert.ok(html.includes('Alice'));
assert.ok(html.includes('Carol'));
console.log('PASS: JOINs INNER/LEFT/FULL, missing-match and multiple-order semantics, SQL and initial server render.');
console.log('Reference note: the screenshot result-count/body is internally inconsistent; the functional INNER JOIN correctly returns all six matching customer/order pairs.');
console.log('Browser scenario/run timing, Copy SQL, connector-line alignment, dataset switching and pixel layout still require browser verification.');
