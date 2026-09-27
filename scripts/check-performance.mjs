import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import ts from 'typescript';
import React from 'react';
import {renderToString} from 'react-dom/server';
const root=path.resolve(import.meta.dirname,'..');
const require=createRequire(import.meta.url);
const cache=new Map();
function load(file){
  if(cache.has(file))return cache.get(file).exports;
  const loaded={exports:{}};cache.set(file,loaded);
  const source=fs.readFileSync(file,'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const localRequire=name=>{
    if(name.startsWith('@/')||name.startsWith('.')){
      const base=name.startsWith('@/')?path.join(root,name.slice(2)):path.resolve(path.dirname(file),name);
      const found=['.tsx','.ts','/index.tsx','/index.ts'].map(ext=>base+ext).find(fs.existsSync);
      assert.ok(found,'Module not found: '+name);return load(found);
    }
    return require(name);
  };
  vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(localRequire,loaded,loaded.exports);
  return loaded.exports;
}

const {sampleRows,retainedRows,performanceSteps,performanceSnapshot}=load(path.join(root,'lib/performance-simulation.ts'));
assert.equal(sampleRows.length,5);
assert.equal(retainedRows.length,3);
assert.equal(retainedRows.reduce((sum,row)=>sum+row.salary,0),225000);
assert.equal(performanceSnapshot(6,true).populated,false);
assert.equal(performanceSnapshot(9,true).populated,true);
for(let step=9;step<performanceSteps.length;step++){
 assert.equal(performanceSnapshot(step,true).reads,1);
 assert.equal(performanceSnapshot(step,true).filters,1);
 assert.equal(performanceSnapshot(step,true).populated,true);
}
assert.equal(performanceSnapshot(12,false).reads,2);
assert.equal(performanceSnapshot(12,false).filters,2);
assert.equal(performanceSnapshot(12,true).sumReady,true);
assert.equal(performanceSnapshot(-1,true).reads,0);
const {SparkPerformanceConcept}=load(path.join(root,'components/spark-performance-concept.tsx'));
const html=renderToString(React.createElement(SparkPerformanceConcept));
for(const text of ['Run comparison','Next step','Reset','Explain cache()','Copy cached PySpark code','not benchmark timing']) assert.ok(html.includes(text),text);
console.log('PASS: 13 execution states; cached reuse, count/sum, reset state and component render.');

