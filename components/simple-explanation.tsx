"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getGlossaryItem } from "@/lib/glossary";

export const simpleExplanations: Record<string, string> = {
  "DataFrame": getGlossaryItem("DataFrame")!.definition,
  "DataFrames": getGlossaryItem("DataFrame")!.definition,
  "Driver": "The program that plans your Spark application and coordinates the work sent to executors.",
  "Executors": "Processes that run Spark tasks and hold data for your application.",
  "Tasks": "Small units of work, typically processing one partition during a stage.",
  "Result": "The answer requested by an action, such as a row count or displayed table.",
  "Temporary view": "A name that lets you query a DataFrame using SQL in the current session. It is not a saved copy.",
  "SQL query": "A request describing which table data you want and how to combine or summarize it.",
  "Source": "The input data your processing starts from.",
  "filter": "Keep only rows that match a condition, such as price greater than 10.",
  "select": "Choose the columns or calculated values you want in the result.",
  "Action": "A request for Spark to compute a result, such as count, show, or a write.",
  "Input partitions": "The starting pieces of data that Spark can process in parallel.",
  "Key groups": "Records brought together because they share a value, such as the same country.",
  "Measure": "Record actual running time and resource use for the work you need done.",
  "Inspect plan": "Look at Spark’s chosen processing steps to see where work or data movement happens.",
  "Change one thing": "Adjust one setting or processing step so you can tell what caused a difference.",
  "Compare": "Check the same result and workload before and after your change.",
  "Validate": "Check that rows meet your rules for valid values and required fields.",
  "Deduplicate": "Remove repeated records according to a defined rule.",
  "Aggregate": "Combine multiple rows into summaries, such as total sales per country.",
  "Answer": "Start by directly answering the interview question.",
  "Mechanism": "Explain how the feature actually works in simple words.",
  "Example": "Give one concrete case that makes your answer easier to understand.",
  "Trade-off": "Describe what you gain and what cost or limitation comes with it.",
  "Attempt": "Try the questions yourself before looking at explanations.",
  "Submit": "Check your selected answers against this quiz’s answer key.",
  "Review": "Read why each answer is correct or incorrect.",
  "Retry": "Clear your quiz choices and try again.",
  "Define result": "Specify exactly what a correct output must contain.",
  "Build pipeline": "Connect the input, cleaning, and calculation steps.",
  "Check correctness": "Compare the actual answer with expected rows, totals, and quality rules.",
  "NULL": "A missing or unknown value, not the same as zero or empty text.",
  "GROUP BY": "Put rows with matching values into groups so you can calculate a result per group.",
  "WHERE": "Keep only the input rows that satisfy a condition.",
  "HAVING": "Keep only groups whose calculated results satisfy a condition.",
  "SUM": "Add up the non-missing values in a group.",
  "partition": "A piece of a distributed dataset that can be processed as a unit of work.",
  "Data skew": "An uneven workload: some keys or partitions contain much more data than others.",
  "repartition": "Redistribute data into a requested number of pieces, with a shuffle.",
  "coalesce": "Usually reduce the number of pieces with less data movement, possibly reducing parallel work.",
  "partitionBy": "Organize written files into folders based on column values. This is not a worker count.",
  "Caching": "Keep computed data available so later operations may reuse it.",
  "cache": "Mark a dataset for storage and reuse; an action first computes it.",
  "unpersist": "Release a dataset from Spark’s reusable storage when you no longer need it.",
  "broadcast join": "Send a small side of a join to executors so the larger side need not be shuffled for that join.",
  "Spark UI": "Spark’s monitoring pages showing jobs, tasks, timing, and other execution details.",
  "count": "Ask Spark how many rows are in the result.",
  "show": "Ask Spark to display a limited number of result rows.",
  "collect": "Bring every result row into the driver’s memory. Large results can exhaust that memory.",
  "withColumn": "Return a DataFrame with an added or replaced calculated column.",
  "explicit schema": "Column names and data types you provide yourself instead of asking Spark to guess them.",
  "shuffle": "Moving data between computers so matching records can be processed together—for example, all sales for the same country.",
  "partition count": "How many pieces your data is divided into for processing. The size and number of pieces affect how work is shared.",
  "adaptive execution": "Spark adjusts parts of its plan while the job runs, using information about the actual data sizes.",
  "source RDD": "The starting group of data items Spark will process. In this exercise, it contains the numbers 1 through 5.",
  "typed schema": "A description of your table’s columns and what each can contain—for example, a column named number that holds whole numbers.",
  "execution plan": "Spark’s instructions for carrying out your calculation, such as reading data and multiplying column values.",
  "RDD Pipeline": "The steps for processing an RDD: start with data, describe changes, then ask Spark to produce a result.",
  "Execution Layer": "The parts of the system that arrange computing resources and run your data-processing work.",
  "DataFrame Pipeline": "Spark takes data arranged in columns, improves your processing plan, and chooses how to run it.",
  "Raw Data": "The starting data before your processing steps—for example, lines read from a file.",
  "Transformations": "Instructions for creating new data from existing data, such as keeping only certain rows. Spark usually waits to run them until a result is requested.",
  "Actions": "Commands that ask Spark to do the work and produce a result—for example, count the rows or save them to a file.",
  "Spark Core": "Spark’s basic engine. It schedules processing tasks, manages data in memory, and helps recover failed work.",
  "Cluster Manager": "The system that gives Spark computing resources, such as CPU and memory, across a group of computers.",
  "Structured Data": "Data organized into named columns with defined types, such as a customer table with name and age columns.",
  "Catalyst Optimizer": "Spark’s automatic planner. It looks for ways to do less work, such as removing unwanted rows early.",
  "Physical Plan": "The concrete steps Spark chooses to run your request—for example, how to read files, combine tables, and move data between computers.",
  "Low-level API": "You tell Spark exactly how to process each data item.",
  "Immutable collection": "A group of data items that cannot be changed directly. Changes create a new group, leaving the original unchanged.",
  "Any object": "Your data can contain numbers, text, or custom objects—such as a customer record you define yourself.",
  "More control": "You can write your own rules for how each data item is processed.",
  "Structured API": "Work with data arranged in named columns, like a spreadsheet.",
  "Catalyst optimized": "Spark automatically looks for a more efficient way to process your data.",
  "Schema enforced": "Columns have defined names and types—for example, the age column must hold numbers.",
  "Easier to use": "Built-in commands handle common tasks, such as filtering rows and adding up values, for you.",
  "Slower": "For typical table-based tasks, RDDs often take longer because Spark has less information to improve your processing steps.",
  "Faster": "For typical table-based tasks, DataFrames often finish sooner because Spark can improve how the work is done. This is not guaranteed for every task.",
};

/** A brief definition on hover or focus; deliberately does not open a glossary drawer. */
export function SimpleExplanation({ label, displayText = label }: { label: string; displayText?: string }) {
  const explanation = simpleExplanations[label];
  if (!explanation) return <span className="font-semibold text-slate-800">{displayText}</span>;
  return <TooltipProvider delayDuration={180} skipDelayDuration={100}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="simple-explanation-trigger font-semibold text-slate-800">{displayText}</button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={9} collisionPadding={16} className="simple-explanation-card">
        {explanation}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>;
}
