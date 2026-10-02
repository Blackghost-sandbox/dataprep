"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  BookOpen,
  Box,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Code2,
  Copy,
  FileText,
  Lightbulb,
  List,
  MessageSquare,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useCompanion } from "@/components/companion-context";
import { AICompanionService } from "@/lib/companion";

type Category = "Conceptual" | "Code Output" | "Debugging" | "Scenario Based";

type Criterion = {
  label: string;
  keywords: string[];
};

type Takeaway = {
  tone: "blue" | "violet" | "green" | "orange";
  title: string;
  bullets: string[];
  Icon: typeof List;
};

type InterviewQuestion = {
  category: Category;
  badge: string;
  question: string;
  prompt: string;
  hint: string;
  modelAnswer: string;
  exampleTitle: string;
  exampleCode: string;
  criteria: Criterion[];
  takeaways: Takeaway[];
};

const categories: Category[] = ["Conceptual", "Code Output", "Debugging", "Scenario Based"];

const questions: InterviewQuestion[] = [
  {
    category: "Conceptual",
    badge: "Common Question",
    question: "What is the difference between a list and a tuple in Python?",
    prompt: "Focus on key differences, when to use each, and any important trade-offs.",
    hint: "Start with mutability, then talk about syntax and when an immutable sequence is useful.",
    modelAnswer:
      "A list is mutable, which means you can add, remove, or replace elements after creation. A tuple is immutable, so its items cannot be changed. Lists use square brackets and are usually the right choice for data that changes during processing. Tuples use parentheses and work well for fixed records, stable keys, or values that should not be modified accidentally. A tuple can also be used as a dictionary key when all of its elements are hashable.",
    exampleTitle: "Example",
    exampleCode:
      'my_list = [1, 2, 3]\nmy_list.append(4)   # works\n\nmy_tuple = (1, 2, 3)\n# my_tuple.append(4)  # AttributeError',
    criteria: [
      { label: "list is mutable", keywords: ["mutable", "change", "append", "modify"] },
      { label: "tuple is immutable", keywords: ["immutable", "cannot change", "fixed"] },
      { label: "syntax difference", keywords: ["[]", "square bracket", "()", "parentheses"] },
      { label: "use-case trade-off", keywords: ["dictionary key", "dict key", "fixed record", "stable", "use case"] },
    ],
    takeaways: [
      { tone: "blue", Icon: List, title: "List", bullets: ["Mutable", "Uses [ ]", "Best for modifiable data"] },
      { tone: "violet", Icon: Box, title: "Tuple", bullets: ["Immutable", "Uses ( )", "Useful for fixed values"] },
      { tone: "green", Icon: CheckCircle2, title: "Use cases", bullets: ["Lists: dynamic ETL data", "Tuples: stable records / keys"] },
      { tone: "orange", Icon: AlertTriangle, title: "Trade-offs", bullets: ["Lists are flexible", "Tuples protect against mutation"] },
    ],
  },
  {
    category: "Conceptual",
    badge: "Common Question",
    question: "Why are mutable default arguments considered dangerous in Python?",
    prompt: "Explain when the default object is created, what can go wrong, and the standard safe pattern.",
    hint: "Think about whether the default list is created once or every time the function is called.",
    modelAnswer:
      "A mutable default such as [] is created once, when Python defines the function, not each time the function is called. If the function mutates that object, later calls reuse the same object and can see state left by earlier calls. The usual safe pattern is to default to None and create a new list or dictionary inside the function.",
    exampleTitle: "Safe pattern",
    exampleCode:
      "def add_item(item, items=None):\n    if items is None:\n        items = []\n    items.append(item)\n    return items",
    criteria: [
      { label: "created once", keywords: ["created once", "definition time", "defined once"] },
      { label: "shared across calls", keywords: ["shared", "reuse", "across calls", "later calls"] },
      { label: "state can leak", keywords: ["state", "accumulate", "unexpected", "leak"] },
      { label: "default to None", keywords: ["none", "items is none"] },
    ],
    takeaways: [
      { tone: "blue", Icon: Settings, title: "Definition time", bullets: ["Defaults are evaluated once", "Object can be reused"] },
      { tone: "violet", Icon: Box, title: "Hidden state", bullets: ["Mutations persist", "Later calls can inherit data"] },
      { tone: "green", Icon: ShieldCheck, title: "Safe pattern", bullets: ["Default to None", "Create a fresh object inside"] },
      { tone: "orange", Icon: AlertTriangle, title: "Interview signal", bullets: ["Explain the mechanism", "Show the corrected pattern"] },
    ],
  },
  {
    category: "Code Output",
    badge: "Code Question",
    question: "What does this list comprehension return, and why?",
    prompt: "Trace the filter first, then the transformation. Explain the resulting order.",
    hint: "Keep only values greater than or equal to 20 before doubling them.",
    modelAnswer:
      "The result is [60, 40]. The comprehension reads each value from prices in input order, keeps only values greater than or equal to 20, and doubles the values that remain. The original list is not modified.",
    exampleTitle: "Question code",
    exampleCode:
      "prices = [10, 30, 20]\ndoubled = [p * 2 for p in prices if p >= 20]\nprint(doubled)  # [60, 40]",
    criteria: [
      { label: "correct output", keywords: ["60", "40", "[60, 40]"] },
      { label: "filter happens", keywords: [">= 20", "greater than", "filter", "keeps"] },
      { label: "values are doubled", keywords: ["double", "* 2", "multipl"] },
      { label: "input order is preserved", keywords: ["order", "input order"] },
    ],
    takeaways: [
      { tone: "blue", Icon: List, title: "Read left to right", bullets: ["Iterate input values", "Preserve input order"] },
      { tone: "violet", Icon: Target, title: "Filter", bullets: ["Keep p >= 20", "10 is removed"] },
      { tone: "green", Icon: Zap, title: "Transform", bullets: ["Multiply kept values by 2", "30 → 60, 20 → 40"] },
      { tone: "orange", Icon: AlertTriangle, title: "Trade-off", bullets: ["Concise for simple logic", "Avoid overly complex comprehensions"] },
    ],
  },
  {
    category: "Code Output",
    badge: "Code Question",
    question: "What does clean_amount return for ['100', None, 'bad', '50']?",
    prompt: "Identify which calls raise TypeError vs ValueError and explain why the function keeps running.",
    hint: "int(None) and int('bad') fail for different reasons, but both exceptions are caught.",
    modelAnswer:
      "The output is [100, 0, 0, 50]. int('100') and int('50') succeed. int(None) raises TypeError and int('bad') raises ValueError, and the function catches both exceptions and returns the default value 0 instead.",
    exampleTitle: "Question code",
    exampleCode:
      'def clean_amount(raw, default=0):\n    try:\n        return int(raw)\n    except (TypeError, ValueError):\n        return default\n\nprint([clean_amount(v) for v in ["100", None, "bad", "50"]])',
    criteria: [
      { label: "correct output", keywords: ["100", "0", "50", "[100, 0, 0, 50]"] },
      { label: "None raises TypeError", keywords: ["typeerror", "none"] },
      { label: "bad string raises ValueError", keywords: ["valueerror", "bad"] },
      { label: "default keeps execution going", keywords: ["default", "return 0", "keeps running", "continue"] },
    ],
    takeaways: [
      { tone: "blue", Icon: Code2, title: "Successful parses", bullets: ["'100' → 100", "'50' → 50"] },
      { tone: "violet", Icon: AlertTriangle, title: "TypeError", bullets: ["int(None) fails", "Caught explicitly"] },
      { tone: "green", Icon: ShieldCheck, title: "ValueError", bullets: ["int('bad') fails", "Caught explicitly"] },
      { tone: "orange", Icon: Target, title: "Trade-off", bullets: ["Default keeps pipeline moving", "Bad values should still be observable"] },
    ],
  },
  {
    category: "Debugging",
    badge: "Debugging Question",
    question: "Why does this function keep values from previous calls?",
    prompt: "Find the bug, explain the Python behavior behind it, and show the safest correction.",
    hint: "Look at the default value for items. Ask when that list is created.",
    modelAnswer:
      "The bug is the mutable default argument items=[]. Python creates that list once when the function is defined, so every call that uses the default mutates the same list. Change the default to None and create a fresh list inside the function.",
    exampleTitle: "Buggy and fixed",
    exampleCode:
      "def add_item(item, items=[]):\n    items.append(item)\n    return items\n\n# Fix:\ndef safe_add_item(item, items=None):\n    if items is None:\n        items = []\n    items.append(item)\n    return items",
    criteria: [
      { label: "mutable default identified", keywords: ["mutable default", "items=[]", "list default"] },
      { label: "created once", keywords: ["created once", "definition time"] },
      { label: "shared state explained", keywords: ["same list", "shared", "previous calls", "persist"] },
      { label: "None fix", keywords: ["none", "fresh list", "new list"] },
    ],
    takeaways: [
      { tone: "blue", Icon: Settings, title: "Root cause", bullets: ["Default list is created once", "Calls reuse it"] },
      { tone: "violet", Icon: Box, title: "Symptom", bullets: ["Items accumulate", "Behavior looks stateful"] },
      { tone: "green", Icon: ShieldCheck, title: "Fix", bullets: ["Use None default", "Allocate inside the function"] },
      { tone: "orange", Icon: AlertTriangle, title: "Debugging habit", bullets: ["Reproduce with two calls", "Explain cause before patching"] },
    ],
  },
  {
    category: "Debugging",
    badge: "Debugging Question",
    question: "A batch job catches every exception with 'except Exception' and silently continues. What is wrong?",
    prompt: "Explain the risk, how to narrow the handler, and what should be logged or re-raised.",
    hint: "Think about the difference between an expected bad record and a programming bug.",
    modelAnswer:
      "A broad handler can hide unrelated programming errors and make the pipeline appear healthy when it is not. Catch only exceptions you can handle meaningfully, such as ValueError for a known parse problem. Log useful context for expected bad data, and let unexpected exceptions propagate or re-raise them after logging.",
    exampleTitle: "Safer pattern",
    exampleCode:
      'try:\n    amount = int(raw)\nexcept ValueError as exc:\n    logger.warning("Bad amount %r: %s", raw, exc)\n    amount = None',
    criteria: [
      { label: "broad catch hides bugs", keywords: ["hide", "broad", "programming error", "unexpected"] },
      { label: "catch specific exceptions", keywords: ["specific", "valueerror"] },
      { label: "log context", keywords: ["log", "logging", "context", "warning"] },
      { label: "unexpected errors should surface", keywords: ["re-raise", "propagate", "surface", "raise"] },
    ],
    takeaways: [
      { tone: "blue", Icon: ShieldCheck, title: "Specific handling", bullets: ["Catch expected failures", "Handle what you understand"] },
      { tone: "violet", Icon: FileText, title: "Visibility", bullets: ["Log useful context", "Keep bad records observable"] },
      { tone: "green", Icon: CheckCircle2, title: "Recovery", bullets: ["Continue only when safe", "Return an explicit fallback"] },
      { tone: "orange", Icon: AlertTriangle, title: "Unexpected bugs", bullets: ["Do not swallow them", "Let them surface or re-raise"] },
    ],
  },
  {
    category: "Scenario Based",
    badge: "Scenario Question",
    question: "You need to move a large analytical dataset between pipeline stages. CSV, JSON, or Parquet?",
    prompt: "Choose a format and justify the choice using structure, typing, compression, and downstream access patterns.",
    hint: "For large analytics workloads, think about a typed columnar format rather than a plain-text interchange format.",
    modelAnswer:
      "For a large analytical dataset, Parquet is usually the strongest default because it is columnar, typed, and compressed. Analytics engines can read only the columns they need, and the schema travels with the data. CSV is useful for simple interoperability but has weaker type information, while JSON is useful for nested or semi-structured records but is typically more verbose for large tabular analytics.",
    exampleTitle: "Typical choice",
    exampleCode:
      'df.to_parquet("data/orders.parquet")\nloaded = pd.read_parquet("data/orders.parquet")',
    criteria: [
      { label: "Parquet selected", keywords: ["parquet"] },
      { label: "columnar advantage", keywords: ["columnar", "columns"] },
      { label: "typed / schema", keywords: ["typed", "schema", "types"] },
      { label: "compression / selective reads", keywords: ["compress", "only columns", "selective", "analytics"] },
    ],
    takeaways: [
      { tone: "blue", Icon: FileText, title: "CSV", bullets: ["Simple and portable", "Weak schema information"] },
      { tone: "violet", Icon: Code2, title: "JSON", bullets: ["Good for nested data", "Verbose for large tabular data"] },
      { tone: "green", Icon: Database, title: "Parquet", bullets: ["Columnar and typed", "Compressed and analytics-friendly"] },
      { tone: "orange", Icon: Target, title: "Interview framing", bullets: ["State workload first", "Then justify the format"] },
    ],
  },
  {
    category: "Scenario Based",
    badge: "Scenario Question",
    question: "A pandas transformation is slow because it loops over every row. How would you improve it?",
    prompt: "Describe how you would diagnose the bottleneck, replace row-wise work, and validate the result.",
    hint: "Look for boolean masks, vectorized column expressions, and groupby/aggregation before reaching for iterrows().",
    modelAnswer:
      "First confirm that the Python-level row loop is the bottleneck with a small reproducible example or timing measurement. Then express the logic with vectorized pandas operations: boolean masks for filtering, column expressions for transformations, and groupby/agg for grouped calculations. After changing the implementation, compare the output against a known sample before measuring performance again.",
    exampleTitle: "Vectorized alternative",
    exampleCode:
      "filtered = orders[orders['amount'] > 50]\nresult = filtered.groupby('country')['amount'].sum().reset_index()",
    criteria: [
      { label: "diagnose first", keywords: ["measure", "profile", "bottleneck", "timing", "reproducible"] },
      { label: "vectorized operations", keywords: ["vectorized", "vectorization"] },
      { label: "mask / groupby", keywords: ["mask", "filter", "groupby", "agg"] },
      { label: "validate correctness", keywords: ["validate", "compare", "known sample", "correctness"] },
    ],
    takeaways: [
      { tone: "blue", Icon: Target, title: "Measure first", bullets: ["Confirm the bottleneck", "Use a reproducible sample"] },
      { tone: "violet", Icon: Zap, title: "Vectorize", bullets: ["Prefer column operations", "Avoid Python-level row loops"] },
      { tone: "green", Icon: Settings, title: "Use pandas primitives", bullets: ["Boolean masks", "groupby + aggregation"] },
      { tone: "orange", Icon: CheckCircle2, title: "Protect correctness", bullets: ["Compare outputs", "Optimize only after validation"] },
    ],
  },
];

function InterviewHeroArt() {
  return (
    <div className="pyiq-hero-art" aria-hidden="true">
      <span className="pyiq-dot d1"/><span className="pyiq-dot d2"/><span className="pyiq-dot d3"/><span className="pyiq-dot d4"/>
      <div className="pyiq-paper paper-a"><Code2 size={31}/><i/><i/><i/></div>
      <div className="pyiq-paper paper-b"><i/><i/><i/><i/></div>
      <div className="pyiq-python">Py</div>
      <div className="pyiq-chat c1"><MessageSquare size={17}/></div>
      <div className="pyiq-chat c2"><MessageSquare size={17}/></div>
    </div>
  );
}

export function PythonInterviewHero() {
  return (
    <section className="pyiq-hero">
      <div className="pyiq-hero-copy">
        <div className="pyiq-breadcrumb"><span>Python for Data Engineering</span><span>›</span><strong>Interview Questions</strong></div>
        <div className="pyiq-hero-main">
          <div className="pyiq-title-icon"><MessageSquare size={29}/></div>
          <div>
            <h1>Interview Questions</h1>
            <p>Practice explaining Python concepts clearly. For each question, try a direct answer, see the mechanism, review an example, and understand trade-offs.</p>
            <div className="pyiq-meta">
              <span>◷ 30 min</span>
              <span>▣ Lesson 8/10</span>
              <span className="pyiq-intermediate">✦ Intermediate</span>
            </div>
          </div>
        </div>
      </div>
      <InterviewHeroArt/>
    </section>
  );
}

function ApproachStrip() {
  const items = [
    [MessageSquare, "Direct answer", "Start with the main idea", "green"],
    [Settings, "Mechanism", "Explain how it works", "blue"],
    [Code2, "Example", "Show a small code sample", "violet"],
    [AlertTriangle, "Trade-off", "Mention limitations", "orange"],
  ] as const;
  return (
    <section className="pyiq-approach">
      <div className="pyiq-approach-copy">
        <span><Target size={18}/></span>
        <div><h2>How to approach interview questions</h2><p>Use a clear structure to answer. Don’t just give the answer — explain how it works, give an example, and mention limitations.</p></div>
      </div>
      <div className="pyiq-approach-flow">
        {items.map(([Icon,title,body,tone],index)=><div key={title} className={"pyiq-approach-item pyiq-"+tone}>
          <span><Icon size={18}/></span><strong>{index+1}. {title}</strong><small>{body}</small>{index<items.length-1&&<i>→</i>}
        </div>)}
      </div>
    </section>
  );
}

function CopyButton({ text, label = "Copy" }: { text:string; label?:string }) {
  const [copied,setCopied]=useState(false);
  const copy=async()=>{
    try{await navigator.clipboard.writeText(text);setCopied(true);window.setTimeout(()=>setCopied(false),1200);}
    catch{toast.error("Could not copy this content.");}
  };
  return <button type="button" className="pyiq-copy" onClick={copy}>{copied?<Check size={13}/>:<Copy size={13}/>} {copied?"Copied":label}</button>;
}

function AnswerSelfCheck({
  answer,
  question,
}: {
  answer:string;
  question:InterviewQuestion;
}) {
  const normalized=answer.toLowerCase();
  const matches=question.criteria.map(criterion=>({
    ...criterion,
    matched: criterion.keywords.some(keyword=>normalized.includes(keyword.toLowerCase())),
  }));
  const hit=matches.filter(item=>item.matched).length;
  const words=answer.trim().split(/\s+/).filter(Boolean).length;
  return (
    <div className="pyiq-self-check" role="status">
      <header><ClipboardCheck size={16}/><strong>Answer self-check</strong><span>{hit}/{matches.length} key ideas mentioned</span></header>
      <div className="pyiq-check-grid">
        {matches.map(item=><span key={item.label} className={item.matched?"is-hit":""}>{item.matched?<CheckCircle2 size={12}/>:<span className="pyiq-empty-dot"/>}{item.label}</span>)}
      </div>
      <p>{words<18?"Your answer is very short. Add the mechanism and one trade-off before comparing it with the model answer.":hit===matches.length?"Strong coverage. Now make sure the answer is concise enough to say aloud in about a minute.":"This is a deterministic structure check, not semantic grading. Review the missing ideas, then refine your explanation."}</p>
    </div>
  );
}

function PracticeQuestion() {
  const [index,setIndex]=useState(0);
  const [answers,setAnswers]=useState<Record<number,string>>({});
  const [hintOpen,setHintOpen]=useState(false);
  const [checked,setChecked]=useState(false);
  const [ready,setReady]=useState(false);
  const question=questions[index];

  useEffect(()=>{
    try{
      const raw=localStorage.getItem("dataprep.python.interview.answers.v1");
      if(raw)setAnswers(JSON.parse(raw));
    }catch{}
    setReady(true);
  },[]);
  useEffect(()=>{
    if(!ready)return;
    try{localStorage.setItem("dataprep.python.interview.answers.v1",JSON.stringify(answers));}catch{}
  },[answers,ready]);

  const go=(next:number)=>{
    setIndex(Math.max(0,Math.min(questions.length-1,next)));
    setHintOpen(false);
    setChecked(false);
  };
  const selectCategory=(category:Category)=>{
    const next=questions.findIndex(item=>item.category===category);
    if(next>=0)go(next);
  };
  const currentAnswer=answers[index]??"";
  const modelCopy=question.modelAnswer+"\n\n"+question.exampleCode;

  return (
    <section className="pyiq-practice">
      <header className="pyiq-practice-head">
        <div><MessageSquare size={17}/><strong>Practice a real question</strong></div>
        <div className="pyiq-category-tabs" role="tablist" aria-label="Interview question categories">
          {categories.map(category=><button key={category} type="button" role="tab" aria-selected={question.category===category} className={question.category===category?"is-active":""} onClick={()=>selectCategory(category)}>{category}</button>)}
        </div>
        <div className="pyiq-question-nav"><button type="button" aria-label="Previous question" disabled={index===0} onClick={()=>go(index-1)}><ChevronLeft size={16}/></button><span>{index+1} / {questions.length}</span><button type="button" aria-label="Next question" disabled={index===questions.length-1} onClick={()=>go(index+1)}><ChevronRight size={16}/></button></div>
      </header>

      <div className="pyiq-question-banner"><span>Q{index+1}</span><strong>{question.question}</strong><b><Sparkles size={12}/>{question.badge}</b></div>

      <div className="pyiq-answer-grid">
        <section className="pyiq-your-answer">
          <header><span><MessageSquare size={16}/></span><div><strong>Try your answer</strong><p>Write your answer in your own words. {question.prompt}</p></div><button type="button" aria-expanded={hintOpen} onClick={()=>setHintOpen(v=>!v)}><Lightbulb size={14}/>Need a hint?</button></header>
          {hintOpen&&<div className="pyiq-hint"><Lightbulb size={14}/><p>{question.hint}</p></div>}
          <textarea value={currentAnswer} onChange={event=>{setAnswers(previous=>({...previous,[index]:event.target.value}));setChecked(false);}} placeholder="Type your answer here..." aria-label={"Your answer to question "+(index+1)}/>
          <footer><small>Take a moment to think and write your answer before viewing the explanation. Your draft is saved on this device.</small><button type="button" disabled={!currentAnswer.trim()} onClick={()=>setChecked(true)}>Check Answer <ChevronRight size={15}/></button></footer>
          {checked&&<AnswerSelfCheck answer={currentAnswer} question={question}/>}
        </section>

        <section className="pyiq-model-answer">
          <header><span><BookOpen size={16}/></span><strong>Model Answer</strong><CopyButton text={modelCopy}/></header>
          <p>{question.modelAnswer}</p>
          <div className="pyiq-example">
            <header><div><Code2 size={14}/><strong>{question.exampleTitle}</strong></div><CopyButton text={question.exampleCode}/></header>
            <pre><code>{question.exampleCode.split("\n").map((line,lineIndex)=><span key={lineIndex}><i>{lineIndex+1}</i><b className={line.trim().startsWith("#")?"is-comment":""}>{line||" "}</b></span>)}</code></pre>
          </div>
        </section>
      </div>

      <section className="pyiq-takeaways">
        <header><Lightbulb size={16}/><strong>Key Takeaways</strong></header>
        <div>{question.takeaways.map(({tone,Icon,title,bullets})=><article key={title} className={"pyiq-takeaway pyiq-"+tone}><span><Icon size={19}/></span><div><strong>{title}</strong><ul>{bullets.map(bullet=><li key={bullet}><CheckCircle2 size={11}/>{bullet}</li>)}</ul></div></article>)}</div>
      </section>
    </section>
  );
}

export function PythonInterviewConcept() {
  return (
    <div className="pyiq-concept">
      <ApproachStrip/>
      <PracticeQuestion/>
    </div>
  );
}

export function PythonInterviewQuickTips() {
  return (
    <section className="pyiq-quick-tips">
      <header><Lightbulb size={22}/><strong>Quick Tips</strong></header>
      <ul>
        <li>Be clear and structured</li>
        <li>Use simple examples</li>
        <li>Mention limitations</li>
        <li>It’s okay to say “I’m not sure”</li>
        <li>Think out loud — interviewers value your reasoning</li>
      </ul>
    </section>
  );
}


export function PythonInterviewCompanion() {
  const companion=useCompanion();
  const service=useRef(new AICompanionService());
  const [mode,setMode]=useState<"idle"|"ask"|"example">("idle");
  const [question,setQuestion]=useState("");
  const [answer,setAnswer]=useState("");
  const [busy,setBusy]=useState(false);

  if(!companion)return null;

  const ask=async()=>{
    const q=question.trim();
    if(!q||busy)return;
    setBusy(true);
    const lower=q.toLowerCase();
    let local="";
    if(lower.includes("list")&&lower.includes("tuple")) local="Lead with mutability: lists are mutable and tuples are immutable. Then add syntax, a concrete use case for each, and one trade-off such as tuples being suitable for stable hashable keys when their elements are hashable.";
    else if(lower.includes("mutable default")||lower.includes("default argument")) local="Explain that a mutable default is created once at function definition time and reused across calls. Show the safe None pattern so the interviewer hears both the mechanism and the fix.";
    else if(lower.includes("groupby")||lower.includes("pandas")) local="State the operation first, then the mechanism: groupby splits rows by key, applies an aggregation, and combines results. Mention vectorization and validate correctness on a known sample.";
    else if(lower.includes("exception")||lower.includes("valueerror")) local="Differentiate expected failures from programming bugs. Catch only specific exceptions you can handle, log useful context, and let unexpected errors surface.";
    else if(lower.includes("parquet")||lower.includes("csv")||lower.includes("json")) local="Frame the answer around workload. For large analytics data, Parquet is usually strong because it is typed, columnar, and compressed; CSV is simple interchange; JSON fits nested or semi-structured records.";
    if(local)setAnswer(local);
    else {
      const reply=await service.current.respond("simply",companion.context,q);
      setAnswer(reply.text);
    }
    setBusy(false);
  };

  const explainExample=async()=>{
    if(busy)return;
    setBusy(true);
    const reply=await service.current.respond("example",companion.context);
    setAnswer(reply.text);
    setMode("example");
    setBusy(false);
  };

  return (
    <section className="pyiq-companion">
      <header><MessageSquare size={15}/><strong>Mithoo · Learning companion</strong></header>
      <div className="pyiq-companion-body">
        <div><strong>Stuck on a question?</strong><p>I can give hints, explain concepts, or show another example.</p></div>
        <Image src="/nila-avatar.png" alt="Mithoo learning companion" width={104} height={128}/>
      </div>
      <div className="pyiq-companion-actions">
        <button type="button" onClick={()=>{setMode(mode==="ask"?"idle":"ask");setAnswer("");}}><span>◉</span>Ask a Question</button>
        <button type="button" onClick={explainExample} disabled={busy}><Lightbulb size={14}/>{busy?"Loading…":"Explain with Example"}</button>
      </div>
      {mode==="ask"&&<div className="pyiq-companion-expand"><div><input aria-label="Ask Mithoo about interview questions" value={question} onChange={event=>setQuestion(event.target.value)} onKeyDown={event=>{if(event.key==="Enter")void ask();}} placeholder="How should I answer list vs tuple?"/><button type="button" onClick={ask} disabled={busy||!question.trim()}>Ask</button></div>{answer&&<p>{answer}</p>}</div>}
      {mode==="example"&&answer&&<div className="pyiq-companion-expand"><button type="button" className="pyiq-expand-close" onClick={()=>setMode("idle")} aria-label="Close explanation">×</button><pre>{answer}</pre></div>}
    </section>
  );
}
