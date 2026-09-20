const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const cache = new Map();
function load(relative) {
  if (cache.has(relative)) return cache.get(relative);
  const source = fs.readFileSync(path.join(root, relative), "utf8");
  const code = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const result = {exports:{}};
  vm.runInNewContext(code, {exports:result.exports,module:result,require:(name)=>{
    assert.ok(name.startsWith("@/lib/"), "Unexpected module: "+name);
    return load(name.replace("@/","")+".ts");
  }});
  cache.set(relative,result.exports);
  return result.exports;
}
const data = load("lib/spark-sql-example.ts");
const lesson = load("lib/spark-lessons.ts").sparkLessons.find(item=>item.id==="spark-sql");
assert.equal(data.sqlSales.length,5);
assert.equal(data.positiveSales.length,3);
assert.equal(JSON.stringify(data.sqlTotals),JSON.stringify([{country:"IN",total:120},{country:"US",total:50}]));
assert.equal(data.sqlSales.filter(row=>row.country==="US").reduce((sum,row)=>sum+row.amount,0),40);
assert.ok(lesson.example.code.includes(data.sqlSetup));
assert.ok(lesson.practice.solution.includes("HAVING SUM(amount) > 100"));
const net = lesson.practice.solution.split("# 2. Net totals, including refunds")[1].split("# 3.")[0];
assert.ok(!net.includes("WHERE"),"Net revenue must include refunds");
assert.ok(lesson.practice.solution.includes(data.dataframeQuery));
assert.equal(lesson.quiz.length,8);
for(const question of lesson.quiz) assert.ok(question.correct>=0&&question.correct<question.options.length);
const ui=fs.readFileSync(path.join(root,"components/spark-sql-comparison.tsx"),"utf8");
assert.equal((ui.match(/useWalkthrough\(4\)/g)||[]).length,1);
assert.ok(ui.includes("<SqlDataStep step={walkthrough.step}"));
assert.ok(!ui.includes("SparkSqlWalkthrough"));
console.log("Spark SQL checks passed: dataset, totals, practice queries, quiz indices, shared controller.");
