"use client";

import { PythonCodeLine } from "./python-code-line";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Copy,
  Lightbulb,
  MessageSquare,
  Pause,
  Play,
  RotateCcw,
  Trophy,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useCompanion } from "@/components/companion-context";
import { AICompanionService } from "@/lib/companion";

type Question = {
  difficulty: "Easy" | "Medium";
  topic: string;
  prompt: string;
  subtext: string;
  code: string;
  options: { label: string; value: string }[];
  correct: number;
  explanation: string;
  takeaways: string[];
};

const questions: Question[] = [
  {
    difficulty: "Easy",
    topic: "Files · CSV",
    prompt: "What type is row['amount'] when read with csv.DictReader?",
    subtext: "Assume the CSV contains amount values such as 100 and 250.",
    code: "import csv\n\nwith open('orders.csv', newline='') as f:\n    row = next(csv.DictReader(f))\n    type(row['amount'])",
    options: [
      { label: "A", value: "int" },
      { label: "B", value: "str" },
      { label: "C", value: "float" },
      { label: "D", value: "Decimal" },
    ],
    correct: 1,
    explanation: "csv.DictReader returns field values as strings. Convert the value explicitly when the pipeline needs a numeric type.",
    takeaways: ["CSV text is read as strings", "Convert numeric fields explicitly", "Validate conversion failures"],
  },
  {
    difficulty: "Easy",
    topic: "Data Structures",
    prompt: "Which Python structure guarantees unique elements?",
    subtext: "Choose the built-in structure that removes duplicate values by design.",
    code: "values = [1, 1, 2, 3, 3]\nunique = set(values)\nprint(unique)",
    options: [
      { label: "A", value: "list" },
      { label: "B", value: "set" },
      { label: "C", value: "tuple" },
      { label: "D", value: "dict_values" },
    ],
    correct: 1,
    explanation: "A set stores unique hashable values, so repeated values are discarded.",
    takeaways: ["Sets enforce uniqueness", "Membership tests are fast", "Set order should not be treated as business ordering"],
  },
  {
    difficulty: "Medium",
    topic: "pandas · Data Wrangling",
    prompt: "What will be the output of the following pandas code?",
    subtext: "Assume the DataFrame df is defined as shown below.",
    code: "import pandas as pd\n\ndf = pd.DataFrame({\n    'country': ['US', 'US', 'IN', 'IN', 'US'],\n    'amount': [100, 200, 150, 50, 120]\n})\n\nresult = df[df['amount'] > 100].groupby('country')['amount'].sum()\nresult",
    options: [
      { label: "A", value: "country\nIN    200\nUS    320" },
      { label: "B", value: "country\nIN    150\nUS    320" },
      { label: "C", value: "country\nIN    200\nUS    420" },
      { label: "D", value: "country\nIN     50\nUS    220" },
    ],
    correct: 1,
    explanation: "The boolean filter keeps only amount > 100: US 200, IN 150, and US 120. groupby('country')['amount'].sum() then produces IN = 150 and US = 320.",
    takeaways: ["Filter before grouping", "The comparison is strictly > 100", "groupby + sum aggregates within each country"],
  },
  {
    difficulty: "Medium",
    topic: "Functions",
    prompt: "When is a default argument value created in Python?",
    subtext: "Think about why mutable defaults can preserve state between calls.",
    code: "def add_item(item, items=[]):\n    items.append(item)\n    return items",
    options: [
      { label: "A", value: "Once, when the function is defined" },
      { label: "B", value: "Every time the function is called" },
      { label: "C", value: "Only when the default is mutated" },
      { label: "D", value: "When the module exits" },
    ],
    correct: 0,
    explanation: "Default argument expressions are evaluated once when the function definition executes. Mutable defaults can therefore be shared across calls.",
    takeaways: ["Defaults are evaluated at definition time", "Mutable objects can leak state across calls", "Use None and allocate inside the function"],
  },
  {
    difficulty: "Easy",
    topic: "Files · Parquet",
    prompt: "Which file format is columnar and typed?",
    subtext: "Choose the format commonly used for analytical data pipelines.",
    code: "df.to_parquet('data/orders.parquet')\nloaded = pd.read_parquet('data/orders.parquet')",
    options: [
      { label: "A", value: "CSV" },
      { label: "B", value: "JSON" },
      { label: "C", value: "Parquet" },
      { label: "D", value: "TXT" },
    ],
    correct: 2,
    explanation: "Parquet is a typed, columnar format. It is well suited to analytical workloads and selective column reads.",
    takeaways: ["Parquet stores columns together", "Schema information travels with the data", "Compression is useful for analytical datasets"],
  },
  {
    difficulty: "Medium",
    topic: "Error Handling",
    prompt: "When does a finally block run?",
    subtext: "Consider normal completion, caught exceptions, and uncaught exceptions.",
    code: "try:\n    process_record()\nfinally:\n    release_resource()",
    options: [
      { label: "A", value: "Only if no exception occurs" },
      { label: "B", value: "Only if an exception occurs" },
      { label: "C", value: "Whether or not an exception occurs" },
      { label: "D", value: "Only after a return statement" },
    ],
    correct: 2,
    explanation: "The finally suite executes as control leaves the try statement, whether execution completed normally or because of an exception.",
    takeaways: ["finally is for guaranteed cleanup", "Prefer context managers for many resources", "Do not use finally to hide unexpected failures"],
  },
  {
    difficulty: "Easy",
    topic: "pandas · Filtering",
    prompt: "What does orders[orders['amount'] > 50] return?",
    subtext: "Assume orders is a pandas DataFrame.",
    code: "filtered = orders[orders['amount'] > 50]\nprint(filtered)",
    options: [
      { label: "A", value: "A single number" },
      { label: "B", value: "Rows where the condition is True" },
      { label: "C", value: "Every row with amount replaced" },
      { label: "D", value: "An error" },
    ],
    correct: 1,
    explanation: "The expression inside brackets is a boolean mask. pandas keeps rows where that mask evaluates to True.",
    takeaways: ["Boolean masks select rows", "The original DataFrame is not changed by this expression", "Combine masks carefully with & and |"],
  },
  {
    difficulty: "Easy",
    topic: "Error Handling",
    prompt: "What does int('bad') raise?",
    subtext: "Choose the exception raised when a non-numeric string cannot be parsed as an integer.",
    code: "value = int('bad')",
    options: [
      { label: "A", value: "TypeError" },
      { label: "B", value: "ValueError" },
      { label: "C", value: "KeyError" },
      { label: "D", value: "IndexError" },
    ],
    correct: 1,
    explanation: "int() raises ValueError when the input type is acceptable but the string value cannot be interpreted as an integer.",
    takeaways: ["Bad numeric text raises ValueError", "None would raise TypeError", "Catch only the exceptions you can handle"],
  },
  {
    difficulty: "Easy",
    topic: "Logging",
    prompt: "Which module keeps failure records visible in a scheduled Python job?",
    subtext: "Choose the standard library tool that supports levels and configurable outputs.",
    code: "import logging\nlogger = logging.getLogger(__name__)\nlogger.warning('Bad record: %r', record)",
    options: [
      { label: "A", value: "print" },
      { label: "B", value: "logging" },
      { label: "C", value: "input" },
      { label: "D", value: "random" },
    ],
    correct: 1,
    explanation: "The logging module provides severity levels and configurable handlers, making pipeline failures easier to retain and inspect than ad-hoc print calls.",
    takeaways: ["Use logging for operational visibility", "Include useful context in messages", "Choose levels such as INFO, WARNING, and ERROR deliberately"],
  },
  {
    difficulty: "Medium",
    topic: "pandas · SQL Thinking",
    prompt: "What does groupby(...).sum() correspond to in SQL?",
    subtext: "Choose the closest relational operation.",
    code: "result = orders.groupby('country')['amount'].sum()",
    options: [
      { label: "A", value: "WHERE" },
      { label: "B", value: "GROUP BY with an aggregate" },
      { label: "C", value: "ORDER BY" },
      { label: "D", value: "DISTINCT only" },
    ],
    correct: 1,
    explanation: "groupby splits rows into groups by key and sum applies an aggregate within each group, matching SQL GROUP BY with SUM.",
    takeaways: ["groupby defines the groups", "sum is the aggregate", "Filtering normally corresponds to WHERE before the aggregation"],
  },
];

function QuizHeroArt() {
  return (
    <div className="pyquiz-hero-art" aria-hidden="true">
      <span className="pyquiz-dot d1"/><span className="pyquiz-dot d2"/><span className="pyquiz-dot d3"/>
      <div className="pyquiz-bulb"><Lightbulb size={36}/></div>
      <div className="pyquiz-paper"><i/><i/><i/><i/><span>✓</span><span>✓</span><span>✓</span></div>
      <div className="pyquiz-python">Py</div>
      <span className="pyquiz-spark">✦</span>
    </div>
  );
}

export function PythonQuizHero({ onPrevious, onNext }: { onPrevious:()=>void; onNext:()=>void }) {
  return (
    <section className="pyquiz-hero">
      <div className="pyquiz-hero-copy">
        <div className="pyquiz-breadcrumb"><span>Python for Data Engineering</span><span>›</span><strong>Quiz</strong></div>
        <div className="pyquiz-hero-main">
          <div className="pyquiz-title-icon"><ClipboardCheck size={31}/></div>
          <div>
            <h1>Quiz</h1>
            <p>Check your understanding across data structures, functions, files, error handling, and pandas.</p>
            <div className="pyquiz-meta"><span>◷ 20 min</span><span>▣ Lesson 9/10</span><span className="pyquiz-intermediate">✦ Intermediate</span></div>
          </div>
        </div>
      </div>
      <QuizHeroArt/>
      <div className="pyquiz-hero-nav"><button type="button" aria-label="Previous lesson" onClick={onPrevious}><ChevronLeft size={18}/></button><button type="button" className="pyquiz-next" onClick={onNext}>Next <ChevronRight size={17}/></button></div>
    </section>
  );
}

function CopyButton({ text }: { text:string }) {
  const [copied,setCopied]=useState(false);
  const copy=async()=>{
    try{await navigator.clipboard.writeText(text);setCopied(true);window.setTimeout(()=>setCopied(false),1200);}
    catch{toast.error("Could not copy this code.");}
  };
  return <button type="button" className="pyquiz-copy" onClick={copy}>{copied?<Check size={13}/>:<Copy size={13}/>} {copied?"Copied":"Copy"}</button>;
}

function CodePanel({ code }: { code:string }) {
  return (
    <section className="pyquiz-code">
      <header><div><span className="pyquiz-python-small">Py</span><strong>Python Code</strong></div><CopyButton text={code}/></header>
      <pre><code>{code.split("\n").map((line,index)=><span key={index}><i>{index+1}</i><b className={line.trim().startsWith("#")?"is-comment":""}><PythonCodeLine code={line || " "} /></b></span>)}</code></pre>
    </section>
  );
}

function MiniPandasExplanation() {
  return (
    <div className="pyquiz-pandas-explain">
      <div><p>The code first filters rows where <code>amount &gt; 100</code>, which keeps:</p><table><thead><tr><th>country</th><th>amount</th></tr></thead><tbody><tr><td>US</td><td>200</td></tr><tr><td>IN</td><td>150</td></tr><tr><td>US</td><td>120</td></tr></tbody></table></div>
      <div><p>Then it groups by country and sums the amount:</p><table><thead><tr><th>country</th><th>amount</th></tr></thead><tbody><tr><td>IN</td><td>150</td></tr><tr><td>US</td><td>320</td></tr></tbody></table></div>
    </div>
  );
}

type Persisted = {
  current:number;
  choices:Record<number,number>;
  checked:Record<number,boolean>;
  seconds:number;
  paused:boolean;
};

const storageKey="dataprep.python.quiz.reference.v1";

export function PythonQuizConcept() {
  const [current,setCurrent]=useState(0);
  const [choices,setChoices]=useState<Record<number,number>>({});
  const [checked,setChecked]=useState<Record<number,boolean>>({});
  const [seconds,setSeconds]=useState(20*60);
  const [paused,setPaused]=useState(false);
  const [detailTab,setDetailTab]=useState<"explanation"|"takeaways">("explanation");
  const [ready,setReady]=useState(false);

  useEffect(()=>{
    try{
      const raw=localStorage.getItem(storageKey);
      if(raw){
        const value=JSON.parse(raw) as Partial<Persisted>;
        if(Number.isInteger(value.current))setCurrent(Math.max(0,Math.min(questions.length-1,value.current!)));
        if(value.choices&&typeof value.choices==="object")setChoices(value.choices);
        if(value.checked&&typeof value.checked==="object")setChecked(value.checked);
        if(typeof value.seconds==="number")setSeconds(Math.max(0,Math.min(20*60,value.seconds)));
        if(typeof value.paused==="boolean")setPaused(value.paused);
      }
    }catch{}
    setReady(true);
  },[]);

  useEffect(()=>{
    if(!ready)return;
    const value:Persisted={current,choices,checked,seconds,paused};
    try{localStorage.setItem(storageKey,JSON.stringify(value));}catch{}
  },[current,choices,checked,seconds,paused,ready]);

  useEffect(()=>{
    if(!ready||paused||seconds<=0)return;
    const timer=window.setInterval(()=>setSeconds(value=>Math.max(0,value-1)),1000);
    return()=>window.clearInterval(timer);
  },[ready,paused,seconds]);

  const question=questions[current];
  const selected=choices[current];
  const isChecked=Boolean(checked[current]);
  const answeredIndexes=Object.keys(checked).filter(key=>checked[Number(key)]);
  const score=answeredIndexes.filter(key=>choices[Number(key)]===questions[Number(key)]?.correct).length;
  const answered=answeredIndexes.length;
  const correct=isChecked&&selected===question.correct;
  const minutes=String(Math.floor(seconds/60)).padStart(2,"0");
  const secs=String(seconds%60).padStart(2,"0");
  const progress=((current+1)/questions.length)*100;

  const choose=(index:number)=>{
    if(isChecked)return;
    setChoices(previous=>({...previous,[current]:index}));
  };
  const check=()=>{
    if(selected===undefined)return;
    setChecked(previous=>({...previous,[current]:true}));
    setDetailTab("explanation");
  };
  const move=(next:number)=>{
    setCurrent(Math.max(0,Math.min(questions.length-1,next)));
    setDetailTab("explanation");
  };
  const resetAll=()=>{
    setCurrent(0);setChoices({});setChecked({});setSeconds(20*60);setPaused(false);setDetailTab("explanation");
    try{localStorage.removeItem(storageKey);}catch{}
  };

  return (
    <div className="pyquiz-concept">
      <header className="pyquiz-progress-head">
        <div><Trophy size={23}/><strong>Question {current+1} of {questions.length}</strong></div>
        <div className="pyquiz-progress-track"><span style={{width:progress+"%"}}/></div>
        <div className="pyquiz-score"><CheckCircle2 size={18}/><span>Score: <strong>{score} / {answered}</strong></span></div>
        <div className="pyquiz-timer"><Clock3 size={17}/><strong>{minutes}:{secs}</strong><button type="button" aria-label={paused?"Resume timer":"Pause timer"} onClick={()=>setPaused(value=>!value)}>{paused?<Play size={15}/>:<Pause size={15}/>}</button></div>
      </header>

      <div className="pyquiz-question-grid">
        <section className="pyquiz-question">
          <div className="pyquiz-tags"><span className={"difficulty "+question.difficulty.toLowerCase()}>{question.difficulty}</span><span>{question.topic}</span></div>
          <h2>{question.prompt}</h2>
          <p>{question.subtext}</p>
          <CodePanel code={question.code}/>
        </section>

        <section className="pyquiz-options" aria-label="Answer options">
          {question.options.map((option,index)=>{
            const selectedNow=selected===index;
            const revealCorrect=isChecked&&index===question.correct;
            const wrong=isChecked&&selectedNow&&index!==question.correct;
            return <button key={option.label} type="button" disabled={isChecked} aria-pressed={selectedNow} onClick={()=>choose(index)} className={(selectedNow?"is-selected ":"")+(revealCorrect?"is-correct ":"")+(wrong?"is-wrong ":"")}>
              <span className="pyquiz-radio">{selectedNow?<i/>:null}</span><b>{option.label}</b><pre>{option.value}</pre>{revealCorrect&&<CheckCircle2 className="pyquiz-option-check" size={20}/>}
            </button>;
          })}
        </section>
      </div>

      {isChecked&&<section className={"pyquiz-feedback "+(correct?"correct":"incorrect")}>
        <div className="pyquiz-feedback-title">{correct?<CheckCircle2 size={31}/>:<AlertTriangle size={31}/>}<strong>{correct?"Correct! Well done!":"Review this one"}</strong></div>
        <div className="pyquiz-feedback-tabs"><button type="button" className={detailTab==="explanation"?"is-active":""} onClick={()=>setDetailTab("explanation")}>Explanation</button><button type="button" className={detailTab==="takeaways"?"is-active":""} onClick={()=>setDetailTab("takeaways")}>Key Takeaways</button></div>
        {detailTab==="explanation" ? (current===2?<MiniPandasExplanation/>:<p className="pyquiz-feedback-copy">{question.explanation}</p>) : <ul className="pyquiz-takeaway-list">{question.takeaways.map(item=><li key={item}><CheckCircle2 size={13}/>{item}</li>)}</ul>}
      </section>}

      <footer className="pyquiz-footer">
        <button type="button" className="pyquiz-prev" disabled={current===0} onClick={()=>move(current-1)}><ChevronLeft size={15}/>Previous</button>
        <div>
          <button type="button" className="pyquiz-reset" onClick={resetAll}><RotateCcw size={15}/>Reset Quiz</button>
          {!isChecked?<button type="button" className="pyquiz-check" disabled={selected===undefined} onClick={check}><RotateCcw size={15}/>Check Answer</button>:current<questions.length-1?<button type="button" className="pyquiz-next-question" onClick={()=>move(current+1)}>Next Question <ChevronRight size={15}/></button>:<button type="button" className="pyquiz-next-question" onClick={()=>move(0)}>Review from Start <ChevronRight size={15}/></button>}
        </div>
      </footer>
    </div>
  );
}

export function PythonQuizQuickTips() {
  return (
    <section className="pyquiz-quick-tips">
      <header><Lightbulb size={22}/><strong>Quick Tips</strong></header>
      <ul><li>Read the question carefully</li><li>Check the DataFrame shape and types</li><li>Think about filtering, grouping, and aggregation steps</li><li>Eliminate clearly incorrect options</li><li>Practice similar questions to build speed</li></ul>
    </section>
  );
}

export function PythonQuizCompanion() {
  const companion=useCompanion();
  const service=useRef(new AICompanionService());
  const [mode,setMode]=useState<"idle"|"ask"|"example">("idle");
  const [question,setQuestion]=useState("");
  const [answer,setAnswer]=useState("");
  const [busy,setBusy]=useState(false);
  if(!companion)return null;

  const ask=async()=>{
    const q=question.trim();if(!q||busy)return;setBusy(true);
    const lower=q.toLowerCase();
    let local="";
    if(lower.includes("groupby")||lower.includes("pandas")) local="Trace pandas questions in order: identify the rows kept by the filter, identify the grouping key, then apply the aggregate inside each group.";
    else if(lower.includes("dictreader")||lower.includes("csv")) local="Remember that csv.DictReader reads field values as strings. Convert numeric fields explicitly and handle conversion failures.";
    else if(lower.includes("default argument")) local="Default arguments are evaluated once when the function definition executes. For mutable defaults, use None and create a fresh object inside the function.";
    else if(lower.includes("parquet")) local="Parquet is a typed columnar format, which is why it fits analytical pipeline stages better than plain-text CSV for many large datasets.";
    else if(lower.includes("exception")||lower.includes("finally")) local="Separate expected errors from unexpected bugs. Catch specific exceptions, use finally for guaranteed cleanup, and let unrelated failures surface.";
    if(local)setAnswer(local);
    else {const reply=await service.current.respond("simply",companion.context,q);setAnswer(reply.text);}
    setBusy(false);
  };
  const example=async()=>{
    if(busy)return;setBusy(true);
    const reply=await service.current.respond("example",companion.context);
    setAnswer(reply.text);setMode("example");setBusy(false);
  };
  return (
    <section className="pyquiz-companion">
      <header><MessageSquare size={15}/><strong>Mithoo · Learning companion</strong></header>
      <div className="pyquiz-companion-body"><div><strong>Stuck on this question?</strong><p>I can explain step by step, show a hint, or give a similar example.</p></div><Image src="/nila-avatar.png" alt="Mithoo learning companion" width={104} height={128}/></div>
      <div className="pyquiz-companion-actions"><button type="button" onClick={()=>{setMode(mode==="ask"?"idle":"ask");setAnswer("");}}><span>◉</span>Ask a Question</button><button type="button" onClick={example} disabled={busy}><Lightbulb size={14}/>{busy?"Loading…":"Explain with Example"}</button></div>
      {mode==="ask"&&<div className="pyquiz-companion-expand"><div><input aria-label="Ask Mithoo about the quiz" value={question} onChange={event=>setQuestion(event.target.value)} onKeyDown={event=>{if(event.key==="Enter")void ask();}} placeholder="How should I trace this?"/><button type="button" disabled={busy||!question.trim()} onClick={ask}>Ask</button></div>{answer&&<p>{answer}</p>}</div>}
      {mode==="example"&&answer&&<div className="pyquiz-companion-expand"><button type="button" className="pyquiz-expand-close" onClick={()=>setMode("idle")} aria-label="Close explanation"><X size={13}/></button><pre>{answer}</pre></div>}
    </section>
  );
}
