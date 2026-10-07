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
  let source=fs.readFileSync(file,'utf8');
  // Server effects never hydrate localStorage. Render the hydrated branch ONLY
  // in this test fixture; this is a render smoke test, not a browser/storage test.
  if(file.endsWith('spark-lesson.tsx'))source=source.replace('const [ready, setReady] = useState(false);','const [ready, setReady] = useState(true);');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const localRequire=name=>{
    if(name.startsWith('@/')||name.startsWith('.')){
      const base=name.startsWith('@/')?path.join(root,name.slice(2)):path.resolve(path.dirname(file),name);
      const found=[base,...['.tsx','.ts','/index.tsx','/index.ts'].map(ext=>base+ext)].find(fs.existsSync);
      assert.ok(found,name);return load(found);
    }return require(name);
  };
  vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(localRequire,loaded,loaded.exports);
  return loaded.exports;
}

const {SparkLessonPanel}=load(path.join(root,"components/spark-lesson.tsx"));
const {GlossaryProvider}=load(path.join(root,"components/glossary.tsx"));
const modules=[['spark','spark-lessons','sparkLessons'],['sql','sql-lessons','sqlLessons'],['python','python-lessons','pythonLessons'],['modeling','data-modeling','modelingLessons'],['airflow','airflow-lessons','airflowLessons'],['kafka','kafka-lessons','kafkaLessons'],['dbt','dbt-lessons','dbtLessons'],['cloud','cloud-lessons','cloudLessons'],['system','system-design-lessons','systemDesignLessons']];
const tabs=['Concept','Examples','Hands-on','Interview Qs','Common Mistakes','Quiz','Notes'];
let renders=0,lessonsCount=0;const failures=[];
for(const [module,file,key] of modules){const lessons=load(path.join(root,'lib/'+file+'.ts'))[key];assert.ok(Array.isArray(lessons),module);lessonsCount+=lessons.length;
 for(const lesson of lessons){assert.ok(lesson.id);for(const q of lesson.quiz){assert.ok(q.correct>=0&&q.correct<q.options.length,lesson.id+' quiz index');}
  for(const active of tabs){try{const html=renderToString(React.createElement(GlossaryProvider,null,React.createElement(SparkLessonPanel,{lesson,active,module,onTab:()=>{},onLesson:()=>{}})));assert.ok(html.length>250,module+' '+lesson.id+' '+active);assert.ok(!html.includes('[object Object]'),module+' '+lesson.id+' '+active);renders++;}catch(error){failures.push(module+'/'+lesson.id+'/'+active+': '+error.message);}}
 }
}
fs.writeFileSync(path.join(root,'artifacts/functional-audit/all-tabs.json'),JSON.stringify({lessons:lessonsCount,renders,failures},null,2));
assert.deepEqual(failures,[]);
console.log(`PASS: ${lessonsCount} lessons, ${renders} tab renders across 9 teaching modules; quiz indexes and render output checked. Mock interviews have their separate functional suite.`);
console.log('SSR smoke coverage only: browser clicks, storage, responsive layout and animation timing require a running application.');
