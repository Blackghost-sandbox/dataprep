"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SimpleExplanation } from "@/components/simple-explanation";

const mistakes = [
  {
    id: "choose-api",
    title: "Choosing RDDs without considering DataFrames",
    meaning: "You write instructions for individual records even though your task is just filtering rows or adding up columns.",
    risk: "That can mean more code to maintain and fewer opportunities for Spark to improve the work automatically. RDDs are still useful when you genuinely need custom record-level processing.",
    better: "Start with a DataFrame for table-like operations. Choose an RDD when its extra control solves a specific requirement—not simply because the input arrived as text.",
    terms: ["Structured API", "Catalyst Optimizer"],
    before: '# Works, but manually processes each record\nrows = spark.createDataFrame([(20,), (15,)], "age INT")\nadults = rows.rdd.filter(lambda row: row.age >= 18)\nprint(adults.count())',
    after: '# Express the same filter using a column\nrows = spark.createDataFrame([(20,), (15,)], "age INT")\nadults = rows.filter("age >= 18")\nprint(adults.count())',
    takeaway: "Both examples return 1. Prefer the approach that fits the task; DataFrames are not guaranteed to win every workload.",
  },
  {
    id: "schema",
    title: "Leaving production column types to guesswork",
    meaning: "You let Spark guess whether each column contains text, whole numbers, or another type.",
    risk: "New or unusual values can change what Spark infers. Reading data may also require extra work to discover those types.",
    better: "When the expected format is known, supply an explicit schema and decide how invalid records should be handled.",
    terms: ["explicit schema", "Schema enforced"],
    before: '# Requires a people.csv file with id and name headers\npeople = spark.read.option("header", True).option(\n    "inferSchema", True\n).csv("people.csv")',
    after: '# Known columns; fail rather than silently accept malformed input\npeople = spark.read.option("header", True).option(\n    "mode", "FAILFAST"\n).schema("id INT, name STRING").csv("people.csv")\npeople.show()',
    takeaway: "A schema describes the expected structure. It does not replace checks for missing values, duplicates, or business rules.",
  },
  {
    id: "lazy",
    title: "Expecting every DataFrame operation to run immediately",
    meaning: "You assume that filtering a table immediately processes all its rows.",
    risk: "Spark usually records the requested changes first and processes the rows when you ask for a result. Timing only a filter measures planning, not the full calculation.",
    better: "Distinguish transformations from actions. Request an actual result before assuming the row-processing work is finished.",
    terms: ["Transformations", "Actions", "execution plan"],
    before: 'numbers = spark.range(5)\nfiltered = numbers.filter("id > 2")\n# Incorrect assumption: all rows have now been processed',
    after: 'numbers = spark.range(5)\nfiltered = numbers.filter("id > 2")\nprint(filtered.count())  # Action: runs the work; prints 2',
    takeaway: "Think: plan first, execute when needed. Some setup operations can still do work, such as discovering a file's schema.",
  },
  {
    id: "partitions",
    title: "Ignoring how work is divided after a shuffle",
    meaning: "Spark moves records between computers to group matching values, but the resulting pieces of work may be too large or too small.",
    risk: "Too few pieces can overload a worker; too many tiny pieces add scheduling overhead. Unevenly sized groups can leave one worker busy while others finish.",
    better: "Inspect the plan and task sizes in the Spark UI. Let adaptive execution help when appropriate, then tune based on measured workload—not a magic partition number.",
    terms: ["shuffle", "partition count", "adaptive execution"],
    before: 'events = spark.createDataFrame(\n    [("US",), ("IN",), ("US",)], "country STRING"\n)\ntotals = events.groupBy("country").count()\ntotals.show()  # Correct result, but no inspection of the work',
    after: '# Run after creating events above\nspark.conf.set("spark.sql.adaptive.enabled", "true")\ntotals = events.groupBy("country").count()\ntotals.explain()  # Inspect the execution plan\ntotals.show()\n# For real data, inspect task sizes and duration in Spark UI',
    takeaway: "This tiny example demonstrates the workflow, not a performance benchmark. Adaptive execution helps but does not eliminate every imbalance.",
  },
];

export function CommonMistakes() {
  return <div className="mistakes-guide">
    <p className="mistakes-intro">Open a mistake to understand why it matters and what to do instead.</p>
    <Accordion type="multiple" defaultValue={["choose-api"]} className="mistakes-list">
      {mistakes.map((item, index) => <AccordionItem key={item.id} value={item.id} className="mistake-item">
        <AccordionTrigger className="mistake-trigger">
          <span className="mistake-heading"><span className="mistake-number">{index + 1}</span><span>{item.title}</span></span>
        </AccordionTrigger>
        <AccordionContent className="mistake-body">
          <section><h4>In simple words</h4><p>{item.meaning}</p></section>
          <section className="mistake-warning"><h4>Why it can be a problem</h4><p>{item.risk}</p></section>
          <section className="mistake-better"><h4>What to do instead</h4><p>{item.better}</p></section>
          <div className="mistake-terms"><span>Hover or focus to explain:</span>{item.terms.map(term => <SimpleExplanation key={term} label={term}/>)}</div>
          <div className="mistake-code-pair">
            {[["Before · the pitfall", item.before], ["After · a better approach", item.after]].map(([label, code]) =>
              <section key={label}><h4>{label}</h4><pre tabIndex={0} aria-label={label + " PySpark example"}><code>{code}</code></pre></section>
            )}
          </div>
          <p className="mistake-caption">PySpark examples assume an existing Spark session named spark. Code is illustrative and is not run on this page.</p>
          <p className="mistake-takeaway"><strong>Remember:</strong> {item.takeaway}</p>
        </AccordionContent>
      </AccordionItem>)}
    </Accordion>
  </div>;
}
