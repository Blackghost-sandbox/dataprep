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
  // Server effects never hydrate localStorage. Render the hydrated branch ONLY
  // in this test fixture; this is a render smoke test, not a browser/storage test.
  if(file.endsWith('spark-lesson.tsx'))source=source.replace('const [ready, setReady] = useState(false);','const [ready, setReady] = useState(true);');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const localRequire=name=>{
    if(name.startsWith('@/')||name.startsWith('.')){
      const base=name.startsWith('@/')?path.join(root,name.slice(2)):path.resolve(path.dirname(file),name);
      const found=['.tsx','.ts','/index.tsx','/index.ts'].map(ext=>base+ext).find(fs.existsSync);
      assert.ok(found,name);return load(found);
    }return require(name);
  };
  vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(localRequire,loaded,loaded.exports);
  return loaded.exports;
}



const {DatabaseSync}=require('node:sqlite');

const {filterRows,filterModes,evaluateFilter,filterQuery}=load(path.join(root,'lib/where-lab.ts'));
const {WhereLearningLab}=load(path.join(root,'components/where-learning-lab.tsx'));
const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE customers(id INTEGER,name TEXT,city TEXT,age INTEGER)');
for(const row of filterRows)db.prepare('INSERT INTO customers VALUES(?,?,?,?)').run(row.id,row.name,row.city,row.age);
let checks=0;
for(const mode of filterModes)for(const age of [0,19,22,25,29,31,100]){
 const actual=db.prepare(filterQuery(mode.id,age)).all().map(r=>r.name);
 const modeled=filterRows.filter(r=>evaluateFilter(r,mode.id,age)==='TRUE').map(r=>r.name);
 assert.deepEqual(modeled,actual);checks++;
}
const dan=filterRows.find(r=>r.name==='Dan');
assert.equal(evaluateFilter(dan,'not-city',25),'UNKNOWN');
assert.equal(evaluateFilter(dan,'is-null',25),'TRUE');
const html=renderToString(React.createElement(WhereLearningLab));
assert(html.includes('Who gets invited?'));assert(html.includes('Lock prediction'));assert(html.includes('Explain it to an interviewer'));
assert(html.includes('Predict Dan passes'));assert(!html.includes('Loading'));
db.close();console.log('PASS: '+checks+' filter cases checked against SQLite, NULL semantics and learning-lab initial render.');
