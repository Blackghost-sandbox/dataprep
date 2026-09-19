"use client";
import { useState } from "react";
import { SimpleExplanation } from "@/components/simple-explanation";

const steps = [
  {
    title: "Create your starting data",
    instruction: "Create an RDD containing the numbers 1, 2, 3, 4, and 5. Keep the original data for the next step.",
    starter: "numbers = [1, 2, 3, 4, 5]\nrdd = sc.________(numbers)",
    hint: "Use parallelize() to turn a small Python list into an RDD.",
    solution: "numbers = [1, 2, 3, 4, 5]\nrdd = sc.parallelize(numbers)\nprint(rdd.collect())",
    expected: "[1, 2, 3, 4, 5]",
    explanation: "collect() brings the data back to your program. It is safe for these five numbers; avoid it for results too large for the driver’s memory.",
    terms: ["source RDD"],
  },
  {
    title: "Give the data a column name and type",
    instruction: "Convert each number into a one-field row. Create a DataFrame with a column named number that contains whole numbers.",
    starter: "rows = rdd.map(lambda x: (x,))\ndf = spark.createDataFrame(rows, schema=________)",
    hint: "Use the schema string 'number INT'. The comma in (x,) makes it a one-item tuple, which represents a row.",
    solution: "rows = rdd.map(lambda x: (x,))\ndf = spark.createDataFrame(rows, schema='number INT')\ndf.printSchema()\ndf.show()",
    expected: "root\n |-- number: integer (nullable = true)\n\n+------+\n|number|\n+------+\n|     1|\n|     2|\n|     3|\n|     4|\n|     5|\n+------+",
    explanation: "The schema tells Spark what each row means: one column, named number, containing integers. Row display order is not guaranteed without sorting.",
    terms: ["typed schema"],
  },
  {
    title: "Compare how Spark plans the work",
    instruction: "Square the same five numbers using both approaches. Inspect the RDD’s dependency information and the DataFrame’s query plans.",
    starter: "rdd_squared = rdd.map(lambda x: x * x)\n# Inspect rdd_squared.toDebugString()\n\nfrom pyspark.sql.functions import col\ndf_squared = df.select((col('number') * col('number')).alias('square'))\n# Inspect df_squared.explain(extended=True)",
    hint: "toDebugString() describes RDD dependencies. explain(extended=True) shows the DataFrame’s parsed, analyzed, optimized, and physical plans.",
    solution: "rdd_squared = rdd.map(lambda x: x * x)\nprint(rdd_squared.toDebugString().decode('utf-8'))\n\nfrom pyspark.sql.functions import col\ndf_squared = df.select((col('number') * col('number')).alias('square'))\ndf_squared.explain(extended=True)\n\nprint(sorted(rdd_squared.collect()))\ndf_squared.orderBy('square').show()",
    expected: "RDD values: [1, 4, 9, 16, 25]\nDataFrame square column: 1, 4, 9, 16, 25\n\nLook for DataFrame plan headings such as:\n== Optimized Logical Plan ==\n== Physical Plan ==",
    explanation: "Plan details and RDD identifiers vary by Spark version. Look for the multiplication expression in the DataFrame plan. Spark can inspect that column expression; arbitrary Python RDD functions are not optimized by Catalyst in the same way. This tiny example is for understanding plans, not benchmarking speed.",
    terms: ["execution plan"],
  },
];

export function HandsOnChallenge() {
  const [completed, setCompleted] = useState<boolean[]>([false, false, false]);
  const count = completed.filter(Boolean).length;
  return <div className="guided-challenge">
    <p>Build an RDD, turn it into a DataFrame, and compare their execution plans using the same five numbers.</p>
    <aside className="challenge-setup"><strong>Before you start</strong><p>Run the code in a PySpark notebook or the <code>pyspark</code> shell with classic Spark. You need an existing <code>spark</code> session; initialize <code>sc = spark.sparkContext</code> if your environment does not provide it. RDDs are not supported in Spark Connect sessions.</p><p>Run the steps in order in the same session. This page provides guidance; it does not execute or validate your code.</p></aside>
    <div className="challenge-progress" role="status">{count} of 3 steps marked complete <span>Self-check</span></div>
    <div className="challenge-steps">{steps.map((step, index) => <details key={step.title} open className="challenge-step">
      <summary><span className="challenge-number">{index + 1}</span><h3>{step.title}</h3><span className="challenge-chevron" aria-hidden="true">⌄</span></summary>
      <div className="challenge-body"><p>{step.instruction}</p><div className="challenge-terms">What does it mean? {step.terms.map(term => <SimpleExplanation key={term} label={term}/>)}</div>
        <h4>Starter code</h4><pre tabIndex={0} aria-label={`Starter code for step ${index + 1}`}><code>{step.starter}</code></pre>
        <details className="challenge-help"><summary>Need a hint?</summary><p>{step.hint}</p></details>
        <details className="challenge-help"><summary>Show solution</summary><pre tabIndex={0} aria-label={`Solution for step ${index + 1}`}><code>{step.solution}</code></pre></details>
        <h4>Expected result</h4><pre className="challenge-result" tabIndex={0}><code>{step.expected}</code></pre><p className="challenge-note">{step.explanation}</p>
        <label className="challenge-completion"><input type="checkbox" checked={completed[index]} onChange={event => setCompleted(previous => previous.map((value, i) => i === index ? event.target.checked : value))}/>I completed this step</label>
      </div>
    </details>)}</div>
    {count === 3 && <p className="challenge-finished" role="status">All three steps marked complete. You can now explain how the same calculation is expressed with RDDs and DataFrames.</p>}
  </div>;
}
