"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, ChevronLeft, ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const help: Record<string,string> = {
  sc: "SparkContext: your connection to Spark’s basic data-processing engine.",
  parallelize: "Turn this small local list into an RDD that Spark can process across workers.",
  map: "Apply the same rule to every item and create a new RDD.",
  lambda: "A short function. Here, x is one number and x * x multiplies it by itself.",
  collect: "Bring every result back to your main program. Use only when the result is small enough to fit in memory.",
  createDataFrame: "Create a table with named columns from these data rows.",
  select: "Choose the columns or calculations to include in the result.",
  col: "Refer to a named column so Spark can calculate with its values.",
  alias: "Give the calculated column a readable name.",
  show: "Run the calculation and print a small preview as a table.",
  orderBy: "Sort the output so the results appear in a predictable order.",
  spark: "The SparkSession used to work with tables and SQL.",
  toDF: "Turn these values into a DataFrame with the column name provided.",
  SELECT: "Choose columns or calculate the values you want to return.",
  FROM: "Identify which table supplies the data.",
  VALUES: "Create a tiny table directly from the numbers shown here.",
};
type Example = {name:string; lines:string[]; explanations:string[]; output:string};
const examples: Record<string,Example[]> = {
  PySpark: [
    {name:"RDD • write a rule for each number",lines:["rdd = sc.parallelize([1, 2, 3, 4, 5])","squared = rdd.map(lambda x: x * x)","print(sorted(squared.collect()))"],explanations:["Start with the five numbers and create an RDD. sc is supplied by a Spark-enabled notebook or shell.","Describe a rule: multiply each number by itself. This creates a new RDD; Spark has not calculated the result yet.","collect() triggers the work and brings back this small result. Sort it and print it. Avoid collect() for large datasets."],output:"[1, 4, 9, 16, 25]"},
    {name:"DataFrame • describe a column calculation",lines:["from pyspark.sql.functions import col","df = spark.createDataFrame([(1,), (2,), (3,), (4,), (5,)], ['number'])","squared = df.select((col('number') * col('number')).alias('square'))","squared.orderBy('square').show()"],explanations:["Import col so you can refer to a table column in an expression.","Create the same five numbers as a one-column table. Each tuple is a row; number is the column’s name.","Multiply the number column by itself and name the result square. Spark can inspect and optimize this expression.","Sort the calculated column, then run the work and print a table preview."],output:"+------+\n|square|\n+------+\n|     1|\n|     4|\n|     9|\n|    16|\n|    25|\n+------+"}
  ],
  Scala: [
    {name:"RDD • write a rule for each number",lines:["val rdd = sc.parallelize(Seq(1, 2, 3, 4, 5))","val squared = rdd.map(x => x * x)","println(squared.collect().sorted.mkString(\"[\", \", \", \"]\"))"],explanations:["Create an RDD from the same five numbers using the SparkContext supplied by spark-shell.","For every number x, calculate x times x. This describes a transformation without running it yet.","Collect this small result, sort the numbers, and format them as a list."],output:"[1, 4, 9, 16, 25]"},
    {name:"DataFrame • describe a column calculation",lines:["import spark.implicits._","import org.apache.spark.sql.functions.col","val df = Seq(1, 2, 3, 4, 5).toDF(\"number\")","val squared = df.select((col(\"number\") * col(\"number\")).alias(\"square\"))","squared.orderBy(\"square\").show()"],explanations:["Enable Scala’s convenient conversions from local values to Spark tables.","Import the function for referring to columns.","Create a table with the same five values in a column called number.","Describe a column multiplication and name its result square.","Sort the result and print the table. show() triggers execution."],output:"+------+\n|square|\n+------+\n|     1|\n|     4|\n|     9|\n|    16|\n|    25|\n+------+"}
  ],
  SQL: [{name:"Spark SQL • the same column calculation",lines:["SELECT number * number AS square","FROM VALUES (1), (2), (3), (4), (5) AS numbers(number)","ORDER BY square;"],explanations:["Multiply the number column by itself and call the output square.","Provide the same five input rows as an inline table named numbers.","Sort the resulting squares. Run this query in a Spark SQL environment."],output:"square\n------\n1\n4\n9\n16\n25"}]
};

export function CodeLine({line}:{line:string}) {
  return <>{(line.match(/"[^"\n]*"|'[^'\n]*'|\b[A-Za-z_][A-Za-z_0-9]*\b|\b\d+\b|[^A-Za-z_0-9"']+/g) ?? [line]).map((token,i)=> {
    if(help[token]) return <Tooltip key={i}><TooltipTrigger asChild><button type="button" className="code-help">{token}</button></TooltipTrigger><TooltipContent sideOffset={8} className="simple-explanation-card">{help[token]}</TooltipContent></Tooltip>;
    const color=/^["']/.test(token)?"#a7e3a1":/^\d+$/.test(token)?"#f5c887":/^(val|import|from|AS|ORDER|BY)$/.test(token)?"#c4a7ff":undefined;
    return <span key={i} style={{color}}>{token}</span>;
  })}</>;
}
function ExampleCard({example}:{example:Example}) {
  const [step,setStep]=useState<number|null>(null);
  return <article className="example-card"><header><h3>{example.name}</h3><button onClick={async()=>{try{await navigator.clipboard.writeText(example.lines.join('\n'));toast.success('Code copied');}catch{toast.error('Copy unavailable. Select the code and copy it manually.');}}} aria-label={`Copy ${example.name}`}><Copy size={15}/>Copy</button></header>
    <div className="example-code" role="region" aria-label={example.name} tabIndex={0}><code>{example.lines.map((line,i)=><div key={i} className={step===i?'example-line selected':'example-line'}><span aria-hidden="true" className="line-number">{i+1}</span><span><CodeLine line={line}/></span></div>)}</code></div>
    <div className="example-controls"><button aria-expanded={step!==null} onClick={()=>setStep(step===null?0:null)}>{step===null?'Explain step by step':'Close walkthrough'}</button>{step!==null&&<div><button aria-label="Previous code line" disabled={step===0} onClick={()=>setStep(step-1)}><ChevronLeft size={17}/></button><span>{step+1} / {example.lines.length}</span><button aria-label="Next code line" disabled={step===example.lines.length-1} onClick={()=>setStep(step+1)}><ChevronRight size={17}/></button></div>}</div>
    {step!==null&&<p className="example-explanation" aria-live="polite"><strong>Line {step+1}. </strong>{example.explanations[step]}</p>}
    <div className="example-output"><h4>Expected output</h4><pre>{example.output}</pre><p>Illustrative output • code is not executed in this page.</p></div>
  </article>;
}
export function LearningExamples(){
  const [language,setLanguage]=useState('PySpark');const [answer,setAnswer]=useState(false);
  return <TooltipProvider delayDuration={180}><div className="learning-examples"><p className="example-goal"><strong>One task, two approaches:</strong> square the numbers 1–5. Both produce 1, 4, 9, 16, 25.</p><p className="example-hint">Hover over underlined code—or focus it with Tab—for a simple explanation. Python and Scala examples assume an existing Spark session.</p>
    <div className="example-languages" role="group" aria-label="Example language">{Object.keys(examples).map(lang=><button key={lang} aria-pressed={lang===language} onClick={()=>setLanguage(lang)}>{lang}</button>)}</div>
    {language==='SQL'&&<p className="example-hint">SQL uses Spark’s structured query engine. There is no RDD syntax in SQL; compare the RDD version in PySpark or Scala.</p>}
    <div key={language} className="example-stack">{examples[language].map(example=><ExampleCard key={example.name} example={example}/>)}</div>
    <section className="example-practice"><h3>Your turn</h3><p>What would the five results be if you added 2 to each number instead of squaring it?</p><button aria-expanded={answer} onClick={()=>setAnswer(!answer)}>{answer?'Hide answer':'Reveal answer'}</button>{answer&&<p aria-live="polite"><strong>[3, 4, 5, 6, 7]</strong> — start with 1–5 and add 2 to each value. In the RDD example, use <code>x + 2</code>.</p>}</section>
  </div></TooltipProvider>;
}
