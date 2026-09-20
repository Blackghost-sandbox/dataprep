"use client";

import { Fragment, useEffect, useState } from "react";
import { ArrowRight, BookOpen, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SimpleExplanation, simpleExplanations } from "@/components/simple-explanation";
import type { SparkLesson } from "@/lib/spark-lessons";
import { SparkSqlComparison as SparkSqlVisual } from "@/components/spark-sql-comparison";
import { SqlConcept } from "@/components/sql-concept";
import { SqlSampleTable } from "@/components/sql-fundamentals-visual";
import { sqlSchema, sqlVisuals } from "@/lib/sql-lessons";
import { GlossaryText } from "@/components/glossary";
import { DarkCodeCard } from "@/components/rdd-dataframe-experience";
import { SparkTopicVisual } from "@/components/spark-topic-visual";
import { DbtLessonVisual } from "@/components/dbt-lesson-visual";
import { CloudLessonVisual } from "@/components/cloud-lesson-visual";

const proseTerms = new Set(["DataFrame", "DataFrames", "Temporary view", "SQL query", "Catalyst Optimizer", "Physical Plan", "NULL", "GROUP BY", "WHERE", "HAVING", "SUM", "partition", "Data skew", "repartition", "coalesce", "partitionBy", "Caching", "cache", "unpersist", "broadcast join", "Spark UI", "withColumn", "shuffle", "explicit schema", "typed schema", "execution plan", "adaptive execution"]);

// Longest-first matching keeps phrases together; boundaries avoid matching inside words.
const helpPattern = new RegExp("(" + Object.keys(simpleExplanations).filter(term => proseTerms.has(term)).sort((a,b) => b.length-a.length).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "gi");
const helpNames = new Map(Object.keys(simpleExplanations).map(s => [s.toLowerCase(), s]));
export function SparkText({ children }: {children: string}) {
  let offset = 0;
  return <>{children.split(helpPattern).map((part, i) => {
    const start = offset; offset += part.length;
    const name = helpNames.get(part.toLowerCase());
    const boundary = !/[\p{L}\p{N}_]/u.test(children[start-1] || "") && !/[\p{L}\p{N}_]/u.test(children[offset] || "");
    return name && boundary ? <SimpleExplanation key={i} label={name} displayText={part}/> : <Fragment key={i}>{part}</Fragment>;
  })}</>;
}

export function LessonCode({ code, title = "PySpark" }: {code: string; title?: string}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (copied) { const timer = setTimeout(() => setCopied(false), 1800); return () => clearTimeout(timer); } }, [copied]);
  async function copy() {
    try { await navigator.clipboard.writeText(code); setCopied(true); }
    catch { toast.error("Could not copy. Select the code and copy it manually."); }
  }
  return <div className="spark-code"><div className="spark-code-toolbar"><span>{title}</span><button type="button" onClick={copy} aria-label={"Copy " + title}>{copied ? <Check size={15}/> : <Copy size={15}/>}<span aria-live="polite">{copied ? "Copied" : "Copy"}</span></button></div>
    <pre tabIndex={0} aria-label={title}><code>{code.split("\n").map((line,i) => <span className="spark-code-line" key={i}><span aria-hidden="true" className="spark-line-number">{i+1}</span><span>{line.split(/(#.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:from|import|as|print|True|False|None)\b|\b\d+\b)/g).map((token,j) => <span key={j} className={token.startsWith("#") ? "spark-comment" : /^["']/.test(token) ? "spark-string" : /^\d/.test(token) ? "spark-number" : /^(from|import|as|print|True|False|None)$/.test(token) ? "spark-keyword" : undefined}>{token}</span>)}</span></span>)}</code></pre></div>;
}

interface StudyState { notes: string; checks: boolean[]; drafts: Record<string,string>; choices: Record<string,string>; submitted: boolean }
const emptyState: StudyState = {notes:"",checks:[],drafts:{},choices:{},submitted:false};
function readState(value: unknown): StudyState {
  if (!value || typeof value !== "object") return emptyState;
  const v = value as Partial<StudyState>;
  const strings = (x: unknown): Record<string,string> => x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).filter(([,n]) => typeof n === "string")) : {};
  return {notes:typeof v.notes === "string" ? v.notes : "",checks:Array.isArray(v.checks) ? v.checks.map(x=>x===true) : [],drafts:strings(v.drafts),choices:strings(v.choices),submitted:v.submitted===true};
}
export function SparkLessonPanel({lesson, active, module = "spark", onTab, onLesson}: {lesson: SparkLesson; active: string; module?: "spark" | "sql" | "dbt" | "cloud"; onTab?:(tab:string)=>void; onLesson?:(id:string)=>void}) {
  const isSql = module === "sql";
  const isDbt = module === "dbt";
  const isCloud = module === "cloud";
  const [state, setState] = useState<StudyState>(emptyState);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [step, setStep] = useState(0);
  const key = "dataprep."+module+".v1." + lesson.id;
  useEffect(() => {
    try { const raw = localStorage.getItem(key); setState(raw ? readState(JSON.parse(raw)) : emptyState); }
    catch { setStorageError(true); }
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(key, JSON.stringify(state)); }
    catch { setStorageError(true); }
  }, [key, ready, state]);
  const update = (patch: Partial<StudyState>) => setState(s => ({...s,...patch}));
  const completed = state.checks.filter(Boolean).length;
  const correct = lesson.quiz.filter((q,i) => state.choices[i] === String(q.correct)).length;
  const answered = lesson.quiz.filter((q,i) => q.options.some((_,j) => state.choices[i] === String(j))).length;
  const setup = isSql
    ? <><p className="spark-notice">PostgreSQL-style SQL. Use a scratch database and run the setup once. Results below are illustrative; this website does not execute or grade your query.</p><details><summary>Schema and sample-data setup</summary><DarkCodeCard title="SQL setup · empty scratch database" code={sqlSchema}/></details></>
    : isDbt
      ? <p className="spark-notice">Examples illustrate dbt project code and expected lineage/behavior. DataPrep does not connect to a warehouse or execute dbt commands, so validate them in your own dbt project and adapter environment.</p>
      : isCloud
        ? <p className="spark-notice">Cloud examples are architecture exercises, not live infrastructure. Service behavior, quotas, pricing, and feature availability vary by provider, region, account, and date; verify production decisions in the provider documentation.</p>
        : <p className="spark-notice">Examples target PySpark 3.5.x with an existing classic Spark session named <code>spark</code>. RDD inspection requires classic Spark, not Spark Connect. Run code in your Spark notebook; this page does not execute or validate it.</p>;
  return <section className={"spark-lesson"+(isSql && active==="Concept" ? " sql-concept-shell" : "")}>
    {storageError && <p role="status" className="spark-notice">Device storage is unavailable. Keep a copy of your notes; progress may be lost when you leave.</p>}
    {!ready ? <p role="status">Loading your lesson…</p> : <>
    {active === "Concept" && <>
      {!isSql && <h2><BookOpen size={22}/> {(isDbt || isCloud) ? "Understand " + lesson.title : lesson.title === "Summary" ? "Your Spark recap" : "Understand " + lesson.title}</h2>}
      {isSql && onTab && onLesson ? <SqlConcept lesson={lesson} onTab={onTab} onLesson={onLesson}/> : isDbt ? <DbtLessonVisual lesson={lesson}/> : isCloud ? <CloudLessonVisual lesson={lesson}/> : lesson.id === "spark-sql" ? <SparkSqlVisual/> : <SparkTopicVisual id={lesson.id}/>}
      {!isSql && <><div className="spark-concepts">{lesson.concepts.map(([title,body],i) => <article key={title}><span className="spark-index">{i+1}</span><h3>{title}</h3><p><SparkText>{body}</SparkText></p></article>)}</div>
      {lesson.flow.length>0 && <h3 className="spark-section-label">How the pieces connect</h3>}
      <div className="spark-flow">{lesson.flow.map((term,i) => <Fragment key={term}><div><SimpleExplanation label={term}/></div>{i<lesson.flow.length-1 && <ArrowRight size={18} aria-hidden="true"/>}</Fragment>)}</div>
      <p className="spark-caption">Hover or keyboard-focus the bold terms for a simple explanation.</p></>}
    </>}
    {active === "Examples" && <>
      <h2>{lesson.title} · worked example</h2>{setup}
      {isSql ? <DarkCodeCard title="SQL example" code={lesson.example.code}/> : isDbt ? <LessonCode code={lesson.example.code} title="dbt project code"/> : isCloud ? <LessonCode code={lesson.example.code} title="Architecture example"/> : <LessonCode code={lesson.example.code}/>}
      <div className="spark-walkthrough"><h3>Step {step+1} of {lesson.example.walkthrough.length}</h3><p><SparkText>{lesson.example.walkthrough[step]}</SparkText></p><div className="spark-actions"><button disabled={step===0} onClick={()=>setStep(s=>s-1)}>Previous step</button><button disabled={step===lesson.example.walkthrough.length-1} onClick={()=>setStep(s=>s+1)}>Next step</button></div></div>
      <h3>Expected result</h3><pre className="spark-output">{lesson.example.output}</pre><p className="spark-caption">Illustrative expected values; Database table formatting may differ.</p>
    </>}
    {active === "Hands-on" && <>
      {lesson.id === "hands-on-task" && <SparkTopicVisual id={lesson.id}/>}
      <h2>{lesson.title === "Hands-on Task" ? "Sales pipeline mini-project" : "Try it yourself"}</h2>{setup}
      <p className="spark-task"><SparkText>{lesson.practice.task}</SparkText></p>
      {isSql && <><div className="sql-sample-tables">{sqlVisuals[lesson.id].inputs.map(table=><SqlSampleTable key={table.title} table={table}/>)}</div><label htmlFor={lesson.id+"-sql-editor"}>Your SQL draft · saved on this device</label><textarea id={lesson.id+"-sql-editor"} className="sql-practice-editor" spellCheck={false} value={state.drafts.query ?? ""} onChange={event=>update({drafts:{...state.drafts,query:event.target.value}})} placeholder="SELECT ..."/><button type="button" className="spark-primary" onClick={()=>{if(window.confirm("Clear this lesson’s SQL draft?"))update({drafts:{...state.drafts,query:""}});}}>Reset draft</button><p className="spark-caption">No query engine is connected. Run your SQL in your database; use the expected results below to compare manually.</p></>}
      <Accordion type="multiple" className="spark-accordion">
        <AccordionItem value="hint"><AccordionTrigger>Need a hint?</AccordionTrigger><AccordionContent><SparkText>{lesson.practice.hint}</SparkText></AccordionContent></AccordionItem>
        <AccordionItem value="solution"><AccordionTrigger>Reveal worked solution</AccordionTrigger><AccordionContent>{isSql ? <DarkCodeCard title="SQL solution" code={lesson.practice.solution}/> : <LessonCode code={lesson.practice.solution} title={isDbt ? "dbt solution" : isCloud ? "Architecture solution" : "PySpark solution"}/>}</AccordionContent></AccordionItem>
        <AccordionItem value="expected"><AccordionTrigger>Check expected results</AccordionTrigger><AccordionContent><pre className="spark-output">{lesson.practice.output}</pre></AccordionContent></AccordionItem>
      </Accordion>
      <h3>Your self-check · {completed}/3</h3>
      {[isSql ? "I ran the exercise in my SQL database." : isDbt ? "I tried the exercise in a dbt project or wrote the model/configuration myself." : isCloud ? "I worked through the architecture exercise and can explain my choices." : "I ran the exercise in my Spark environment.","I compared my output with the expected result.","I can explain the processing steps in my own words."].map((text,i)=><label className="spark-check" key={text}><Checkbox checked={state.checks[i] || false} onCheckedChange={checked=>{const checks=[...state.checks];checks[i]=checked===true;update({checks});}}/>{text}</label>)}
      <p className="spark-caption" role="status">{completed===3 ? "Self-check complete. Your work has not been automatically graded." : "Tick only the steps you have completed."}</p>
    </>}
    {active === "Interview Qs" && <>
      {lesson.id === "interview-questions" && <SparkTopicVisual id={lesson.id}/>}
      <h2>Interview practice · {lesson.interview.length} questions</h2><p className="spark-caption">Draft an answer before revealing the explanation. Drafts save on this device; they are not automatically graded.</p>
      <Accordion type="multiple" defaultValue={["q0"]} className="spark-accordion">{lesson.interview.map((q,i)=><AccordionItem key={q.question} value={"q"+i}><AccordionTrigger>{i+1}. {q.question}</AccordionTrigger><AccordionContent>
        <label htmlFor={lesson.id+"-draft-"+i}>Your answer</label><textarea id={lesson.id+"-draft-"+i} value={state.drafts[i] || ""} onChange={e=>update({drafts:{...state.drafts,[i]:e.target.value}})} placeholder="Direct answer → how it works → example → trade-off"/>
        <details><summary>Show hint</summary><p>Start with the definition, trace the example rows, and explain one pitfall.</p></details><details><summary>Show model answer</summary><p className="spark-answer"><SparkText>{q.answer}</SparkText></p><h4>Follow-up to think about</h4><p><SparkText>{q.followup}</SparkText></p></details>
      </AccordionContent></AccordionItem>)}</Accordion>
    </>}
    {active === "Common Mistakes" && <>
      <h2>Common mistakes</h2><p>Open a warning to understand the problem and a better approach.</p>
      <Accordion type="multiple" defaultValue={["m0"]} className="spark-accordion">{lesson.mistakes.map((m,i)=><AccordionItem key={m.title} value={"m"+i}><AccordionTrigger>{i+1}. {m.title}</AccordionTrigger><AccordionContent>
        <div className="spark-warning"><h4>Why it matters</h4><p><SparkText>{m.why}</SparkText></p></div>
        <div className="spark-answer"><h4>What to do instead</h4><p><SparkText>{m.better}</SparkText></p></div>
        {isSql ? <><DarkCodeCard code={m.before} title="Before · pitfall"/><DarkCodeCard code={m.after} title="After · better approach"/></> : <><LessonCode code={m.before} title="Before · pitfall"/><LessonCode code={m.after} title="After · better approach"/></>}
        <p className="spark-caption">These short fragments illustrate a change; use the worked example for complete input setup.</p>
      </AccordionContent></AccordionItem>)}</Accordion>
    </>}
    {active === "Quiz" && <>
      {lesson.id === "quiz" && <SparkTopicVisual id={lesson.id}/>}
      <h2>{lesson.title === "Quiz" ? (isDbt ? "dbt module knowledge check" : "Spark module knowledge check") : lesson.title + " · quiz"}</h2><p>Answer all {lesson.quiz.length} questions, then check your understanding.</p>
      {lesson.quiz.map((q,i)=><fieldset className="spark-question" key={q.question}><legend>{i+1}. {q.question}</legend><RadioGroup aria-label={q.question} disabled={state.submitted} value={state.choices[i] || ""} onValueChange={value=>update({choices:{...state.choices,[i]:value}})}>{q.options.map((option,j)=><label key={option}><RadioGroupItem value={String(j)}/>{option}</label>)}</RadioGroup>
        {state.submitted && <p className={state.choices[i]===String(q.correct) ? "spark-correct" : "spark-incorrect"}>{state.choices[i]===String(q.correct) ? "Correct. " : "Review: "+q.options[q.correct]+". "}{q.explanation}</p>}
      </fieldset>)}
      {state.submitted ? <><p role="status" className="spark-answer">Result: {correct}/{lesson.quiz.length}. Review the explanations before trying again.</p><button className="spark-primary" onClick={()=>update({choices:{},submitted:false})}>Retry quiz</button></> : <><p className="spark-caption" aria-live="polite">{answered}/{lesson.quiz.length} answered</p><button className="spark-primary" disabled={answered!==lesson.quiz.length} onClick={()=>update({submitted:true})}>Submit answers</button></>}
    </>}
    {active === "Notes" && <>
      <h2>Your notes · {lesson.title}</h2><label htmlFor={lesson.id+"-notes"}>Capture an explanation, question, or interview takeaway.</label>
      <textarea id={lesson.id+"-notes"} className="spark-notes" value={state.notes} onChange={e=>update({notes:e.target.value})} placeholder="What does this mean in my own words? When would I use it?"/>
      <p role="status" className="spark-caption">{storageError ? "Not saved: device storage unavailable." : "Automatically saved on this device for this lesson."}</p>
    </>}
    {!isSql && !isCloud && <footer className="spark-source"><a href={isDbt ? "https://docs.getdbt.com/docs/introduction" : lesson.id==="introduction" || lesson.id==="transformations" || lesson.id==="partitioning" ? "https://spark.apache.org/docs/3.5.6/rdd-programming-guide.html" : lesson.id==="performance" ? "https://spark.apache.org/docs/3.5.6/sql-performance-tuning.html" : "https://spark.apache.org/docs/3.5.6/sql-programming-guide.html"} target="_blank" rel="noreferrer">{isDbt ? "Read the dbt documentation ↗" : "Read the Apache Spark guide ↗"}</a></footer>}
    </>}
  </section>;
}
