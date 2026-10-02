import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
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
const {modelingLessons,modelTables:t}=load(path.join(root,'lib/data-modeling.ts'));
const {SparkLessonPanel}=load(path.join(root,'components/spark-lesson.tsx'));
const {Sidebar}=load(path.join(root,'components/dataprep-app.tsx'));
const {GlossaryProvider}=load(path.join(root,'components/glossary.tsx'));
const {getGlossaryItem}=load(path.join(root,'lib/glossary.ts'));
assert.equal(modelingLessons.length,14);assert.equal(new Set(modelingLessons.map(l=>l.id)).size,14);
const tabs=['Concept','Examples','Hands-on','Interview Qs','Common Mistakes','Quiz','Notes'];
for(const lesson of modelingLessons){
  assert.ok(lesson.frames.length>=3);assert.ok(lesson.interview.length>=2);assert.ok(lesson.mistakes.length>=2);assert.ok(lesson.quiz.length>=2);
  for(const item of [lesson.decision,...lesson.quiz])assert.ok(item.correct>=0&&item.correct<item.options.length);
  for(const f of lesson.frames){assert.ok(f.tables.length>0);for(const table of f.tables)for(const row of table.rows)assert.equal(row.length,table.columns.length,lesson.id+' table shape');}
  for(const active of tabs){
    const html=renderToString(React.createElement(GlossaryProvider,null,React.createElement(SparkLessonPanel,{lesson,module:'modeling',active,onTab:()=>{}})));
    assert.ok(!html.includes('Loading your lesson'),lesson.id+' '+active);
    assert.ok(!html.includes('Read the Apache Spark guide'),lesson.id+' wrong resource');
    if(active==='Concept'){
      if(lesson.id==='entities'){
        for(const label of ['Model Builder Challenge','Run &amp; Check','Business objects tray','Live model preview','Check results &amp; feedback'])assert.ok(html.includes(label),lesson.id+' '+label);
        assert.ok(html.includes('8 / 9 classified'));
      }else{
        assert.ok(html.includes('Key Takeaway'));
        assert.ok(html.includes('See the model')||html.includes('See the history')||html.includes('Two different jobs')||html.includes('From question to model'));
      }
    }
    if(active==='Hands-on'){assert.ok(html.includes('Check design choice'));assert.ok(html.includes('not automatically graded'));}
    if(active==='Quiz')assert.ok(html.includes('Submit answers'));
    if(active==='Notes')assert.ok(html.includes(lesson.id+'-notes'));
  }
}
for(const term of ['Entity','Attribute','Relationship','Primary Key','Foreign Key','Cardinality','Normalization','Denormalization','Grain','Fact','Dimension','Surrogate Key','Natural Key','Star Schema','Snowflake Schema','SCD'])assert.ok(getGlossaryItem(term),term);
const sidebar=renderToString(React.createElement(Sidebar,{collapsed:false,setCollapsed:()=>{},onLesson:()=>{},currentLesson:0,completed:[0,1],module:'modeling',onModule:()=>{}}));
assert.ok(sidebar.includes('Modeling'));assert.ok(sidebar.includes('14%'));assert.ok(sidebar.includes('Slowly Changing Dimensions'));
const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON;');
db.exec(modelingLessons.find(l=>l.id==='keys').example.code);
db.exec("INSERT INTO customers VALUES (1,'Alice'); INSERT INTO orders VALUES (501,1),(502,1);");
assert.throws(()=>db.exec('INSERT INTO orders VALUES (503,99);'));
assert.throws(()=>db.exec('INSERT INTO orders VALUES (501,1);'));
db.exec('CREATE TABLE dim_product(product_key INTEGER PRIMARY KEY, product TEXT, category TEXT); CREATE TABLE fact_sales(order_id INTEGER,line_no INTEGER,customer_key INTEGER,product_key INTEGER REFERENCES dim_product(product_key),date_key INTEGER,store_key INTEGER,quantity INTEGER,revenue INTEGER,PRIMARY KEY(order_id,line_no));');
const productInsert=db.prepare('INSERT INTO dim_product VALUES (?,?,?)');for(const row of t.dimProduct.rows)productInsert.run(...row);
const factInsert=db.prepare('INSERT INTO fact_sales VALUES (?,?,?,?,?,?,?,?)');for(const row of t.fact.rows)factInsert.run(...row);
const totals=db.prepare(modelingLessons.find(l=>l.id==='star-schema').example.code).all();
assert.equal(totals[0].revenue,200);assert.equal(totals[0].category,'Stationery');
assert.equal(db.prepare('SELECT COUNT(DISTINCT order_id) AS n FROM fact_sales').get().n,3);
for(const [date,key] of [['2026-01-10',101],['2026-02-01',205],['2026-02-15',205]]){
  const matches=t.history.rows.filter(row=>row[4]<=date&&(row[5]===null||date<row[5]));
  assert.equal(matches.length,1);assert.equal(matches[0][0],key);
}
console.log('PASS: 14 lessons × 7 hydrated-branch server renders; entities model-builder surface; glossary coverage; sidebar progress; table shapes; SQL keys, references, totals and SCD boundaries.');
console.log('Browser navigation, persistence, keyboard interactions and responsive layout still require live verification.');
