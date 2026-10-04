"use client";

import { PythonCodeLine } from "./python-code-line";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  FileCode2,
  Folder,
  Play,
  Redo2,
  RotateCcw,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

type DemoStep = 0 | 1 | 2 | 3;
type ConceptMode = "reusable" | "mutable" | "modules";

const stages = [
  {
    number: 1,
    title: "Define a function",
    subtitle: "Create a reusable function\nwith clear parameters.",
    tone: "violet",
    lines: [
      "def add_tax(price, rate=0.1):",
      "    return price * (1 + rate)",
    ],
  },
  {
    number: 2,
    title: "Call and reuse",
    subtitle: "Call the function with different\nvalues and get consistent results.",
    tone: "blue",
    lines: [
      "add_tax(100)       # 110.0",
      "add_tax(250, 0.2) # 300.0",
      "add_tax(99.99)    # 109.989",
    ],
  },
  {
    number: 3,
    title: "Default argument pitfall",
    subtitle: "A mutable default value (like [])\nis created once and shared.",
    tone: "pink",
    lines: [
      "def add_item(item, items=[]):",
      "    items.append(item)",
      "    return items",
    ],
  },
  {
    number: 4,
    title: "Safe version & modules",
    subtitle: "Use None for mutable defaults\nand organize code into modules.",
    tone: "green",
    lines: [
      "def add_item(item, items=None):",
      "    if items is None:",
      "        items = []",
      "    items.append(item)",
      "    return items",
    ],
  },
] as const;

const exampleLines = [
  "# utils.py — reusable functions",
  "def clean_price(value):",
  '    """Clean a price string and convert to float."""',
  '    return float(str(value).replace("$", ""))',
  "",
  "def add_tax(price, rate=0.1):",
  '    """Add tax with a sensible default rate."""',
  "    return round(price * (1 + rate), 2)",
  "",
  "# transform.py",
  "from utils import clean_price, add_tax",
  'prices = ["$100", "$250", "$99.99"]',
  "cleaned = [clean_price(p) for p in prices]",
  "with_tax = [add_tax(p) for p in cleaned]",
];

function PythonLogo() {
  return (
    <svg className="pyfm-python-logo" viewBox="0 0 78 78" aria-label="Python">
      <defs>
        <linearGradient id="pyfmBlue" x1="0" x2="1"><stop stopColor="#2c8acb"/><stop offset="1" stopColor="#1765a8"/></linearGradient>
        <linearGradient id="pyfmYellow" x1="0" x2="1"><stop stopColor="#ffe15a"/><stop offset="1" stopColor="#f1b928"/></linearGradient>
      </defs>
      <path d="M38 9c-14 0-14 6-14 6v13h22v4H17S7 31 7 47c0 16 12 15 12 15h8V50c0-8 7-15 15-15h18c7 0 11-6 11-13 0-7-6-13-13-13H38Z" fill="url(#pyfmBlue)"/>
      <circle cx="34" cy="17" r="2.7" fill="#fff"/>
      <path d="M40 69c14 0 14-6 14-6V50H32v-4h29s10 1 10-15c0-16-12-15-12-15h-8v12c0 8-7 15-15 15H18c-7 0-11 6-11 13 0 7 6 13 13 13h20Z" fill="url(#pyfmYellow)"/>
      <circle cx="44" cy="61" r="2.7" fill="#fff"/>
    </svg>
  );
}

export function PythonFunctionsModulesHero({ onNext }: { onNext: () => void }) {
  return (
    <section className="pyfm-hero">
      <div className="pyfm-hero-copy">
        <div className="pyfm-breadcrumb">
          <span>Python for Data Engineering</span><ChevronRight size={13}/><strong>Functions &amp; Modules</strong>
        </div>
        <div className="pyfm-hero-main">
          <div className="pyfm-python-tile"><PythonLogo/></div>
          <div>
            <h1>Functions &amp; Modules</h1>
            <p>Write functions that are safe to reuse, and understand a classic Python pitfall before it bites you in production.</p>
            <div className="pyfm-meta">
              <span><Clock3 size={14}/>15 min</span>
              <span><BookOpen size={14}/>Lesson 3/10</span>
              <span className="pyfm-intermediate"><Zap size={13}/>Intermediate</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pyfm-hero-art" aria-hidden="true">
        <span className="pyfm-dot dot-a"/><span className="pyfm-dot dot-b"/><span className="pyfm-dot dot-c"/>
        <span className="pyfm-star star-a">✦</span><span className="pyfm-star star-b">✦</span>
        <div className="pyfm-chip chip-def">def( )</div>
        <div className="pyfm-chip chip-import">import</div>
        <div className="pyfm-orb"><PythonLogo/></div>
        <div className="pyfm-file-mini">.py</div>
        <div className="pyfm-files">
          <div><FileCode2 size={13}/>utils.py</div>
          <div><FileCode2 size={13}/>extract.py</div>
          <div><FileCode2 size={13}/>transform.py</div>
          <div><FileCode2 size={13}/>load.py</div>
        </div>
      </div>

      <button type="button" className="pyfm-next" onClick={onNext}>Next <ArrowRight size={17}/></button>
    </section>
  );
}

function CodePanel({ lines, tone }: { lines: readonly string[]; tone: string }) {
  return (
    <div className={"pyfm-code pyfm-code-" + tone}>
      <header><span>python</span><Copy size={13}/></header>
      <pre><code>{lines.map((line, index) => <span key={index} style={{animationDelay:`${index*350}ms`}}>{line}</span>)}</code></pre>
    </div>
  );
}

function StageCard({ index, step }: { index: number; step: DemoStep }) {
  const stage = stages[index];
  const active = step === index;
  return (
    <article className={"pyfm-stage pyfm-stage-" + stage.tone + (active ? " is-active" : step > index ? " is-complete" : "")}>
      <header>
        <span className="pyfm-step-number">{stage.number}</span>
        <div><strong>{stage.title}</strong><p>{stage.subtitle}</p></div>
      </header>
      <CodePanel lines={stage.lines} tone={stage.tone}/>
      {index === 0 && (
        <div className="pyfm-params">
          <div><code>price</code><span>Required parameter</span></div>
          <div><code>rate</code><span>Default argument (0.1)</span></div>
        </div>
      )}
      {index === 1 && (
        <div className="pyfm-output">
          <strong>Function output</strong>
          <div><code>add_tax(100)</code><ArrowRight size={13}/><b>110.0</b></div>
          <div><code>add_tax(250, 0.2)</code><ArrowRight size={13}/><b>300.0</b></div>
        </div>
      )}
      {index === 2 && (
        <div className="pyfm-pitfall">
          <strong>Multiple calls (unexpected result)</strong>
          <div><code>add_item(&quot;A&quot;)</code><ArrowRight size={13}/><b>[&apos;A&apos;]</b></div>
          <div><code>add_item(&quot;B&quot;)</code><ArrowRight size={13}/><b>[&apos;A&apos;, &apos;B&apos;]</b></div>
        </div>
      )}
      {index === 3 && (
        <div className="pyfm-tree">
          <strong><Folder size={14}/> etl_pipeline/</strong>
          <div><span>├──</span><FileCode2 size={11}/> main.py <small># run pipeline</small></div>
          <div><span>├──</span><FileCode2 size={11}/> extract.py <small># read data</small></div>
          <div><span>├──</span><FileCode2 size={11}/> transform.py <small># clean &amp; transform</small></div>
          <div><span>├──</span><FileCode2 size={11}/> load.py <small># write results</small></div>
          <div><span>└──</span><FileCode2 size={11}/> utils.py <small># shared functions</small></div>
        </div>
      )}
      {index < stages.length - 1 && <ArrowRight className="pyfm-card-arrow" size={23}/>}
    </article>
  );
}

function Timeline({ step, onStep }: { step: DemoStep; onStep: (step: DemoStep) => void }) {
  const items = [
    ["Define function", "Write a function with\nparameters and defaults."],
    ["Call function", "Run with different values\nand see consistent results."],
    ["See the pitfall", "Use a mutable default ([])\nand call multiple times."],
    ["Apply the fix", "Use None and organize\nlogic into modules."],
  ] as const;
  return (
    <section className="pyfm-timeline">
      <header><Play size={15}/><strong>Execution Timeline</strong><span>(see how the concept builds step by step)</span></header>
      <div>
        {items.map(([title, body], index) => (
          <button key={title} type="button" className={step === index ? "is-active" : step > index ? "is-complete" : ""} onClick={() => onStep(index as DemoStep)}>
            <span className="pyfm-time-number">{index + 1}</span>
            <span><strong>{title}</strong><small>{body}</small></span>
            {index < items.length - 1 && <ArrowRight className="pyfm-time-arrow" size={17}/>}
          </button>
        ))}
      </div>
    </section>
  );
}

function ExamplePanel() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exampleLines.join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error("Could not copy the example.");
    }
  };
  return (
    <section className="pyfm-example">
      <header><strong>Python Example – Functions and Modules Together</strong><button type="button" onClick={copy}>{copied ? <Check size={13}/> : <Copy size={13}/>} {copied ? "Copied" : "Copy"}</button></header>
      <pre><code>{exampleLines.map((line, index) => (
        <span key={index}><i>{index + 1}</i><b className={line.trim().startsWith("#") ? "is-comment" : ""}><PythonCodeLine code={line || " "} /></b></span>
      ))}</code></pre>
    </section>
  );
}

function KeyConcepts() {
  const items = [
    ["violet", <FileCode2 key="a" size={19}/>, "Functions document intent", "A well-named function with clear parameters is easier to test and reuse."],
    ["blue", <RotateCcw key="b" size={19}/>, "Reuse logic safely", "Functions let you apply the same logic across your pipeline."],
    ["pink", <AlertTriangle key="c" size={19}/>, "Mutable defaults can leak state", "A default like [] is created once and shared across calls. Use None instead."],
    ["green", <Users key="d" size={19}/>, "Modules keep pipelines organized", "Split code into modules (extract, transform, load, utils) for maintainability."],
  ] as const;
  return (
    <section className="pyfm-key-concepts">
      <h3>Key Concepts</h3>
      <div>{items.map(([tone, icon, title, body]) => (
        <article key={title} className={"pyfm-key-" + tone}><span>{icon}</span><div><strong>{title}</strong><p>{body}</p></div></article>
      ))}</div>
    </section>
  );
}

export function PythonFunctionsModulesConcept() {
  const [mode, setMode] = useState<ConceptMode>("reusable");
  const [step, setStep] = useState<DemoStep>(0);
  const [running, setRunning] = useState(false);
  const [started,setStarted]=useState(false);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  const jumpMode = (next: ConceptMode) => {
    clearTimers();
    setRunning(false);
    setMode(next);setStarted(true);
    setStep(next === "reusable" ? 0 : next === "mutable" ? 2 : 3);
  };

  const play=(from:DemoStep)=>{
    clearTimers();setStarted(true);setStep(from);
    if(matchMedia("(prefers-reduced-motion: reduce)").matches){setRunning(false);return;}
    setRunning(true);
    for(let next=from+1;next<=3;next++)timers.current.push(window.setTimeout(()=>setStep(next as DemoStep),5000*(next-from)));
    timers.current.push(window.setTimeout(()=>setRunning(false),5000*(4-from)));
  };
  const run=()=>{if(running){clearTimers();setRunning(false);}else play(started&&step<3?step:0);};
  const next=()=>{clearTimers();setStarted(true);setRunning(false);setStep(value=>Math.min(3,value+1) as DemoStep);};
  const previous=()=>{clearTimers();setStarted(true);setRunning(false);setStep(value=>Math.max(0,value-1) as DemoStep);};
  const reset = () => {
    clearTimers();
    setRunning(false);
    setMode("reusable");
    setStep(0);setStarted(false);
  };

  return (
    <div className={"pyfm-concept"+(running?" is-running":"")}>
      <header className="pyfm-concept-heading">
        <BookOpen size={23}/>
        <div><h2>Understand Functions &amp; Modules</h2><p>Functions make your code reusable, default arguments can be tricky, and modules help you organize larger pipelines.</p></div>
      </header>

      <div className="pyfm-toolbar">
        <div className="pyfm-mode-tabs">
          <button type="button" className={mode === "reusable" ? "is-active" : ""} onClick={() => jumpMode("reusable")}>Reusable function</button>
          <button type="button" className={mode === "mutable" ? "is-active" : ""} onClick={() => jumpMode("mutable")}>Mutable default trap</button>
          <button type="button" className={mode === "modules" ? "is-active" : ""} onClick={() => jumpMode("modules")}>Module organization</button>
        </div>
        <div className="pyfm-controls">
          <button type="button" className="pyfm-run" onClick={run}><Play size={15}/>{running ? "Running…" : "Run"}</button>
          <button type="button" onClick={previous} disabled={step===0}>Previous step</button><button type="button" onClick={next} disabled={step===3}><Redo2 size={14}/>Next step</button>
          <button type="button" onClick={reset}><RotateCcw size={14}/>Reset</button>
          <span>{step + 1} / 4 steps</span>
        </div>
      </div>

      <p className="python-native-explanation" aria-live="polite">Illustrative flow � {["Define add_tax with price and a default rate of 0.1.", "Call add_tax: 100 becomes 110.0; 250 at rate 0.2 becomes 300.0.", "The default list persists: adding B after A gives [A, B], not a fresh list.", "Organize extraction, transformation and loading in importable Python files."][step]}</p>
      <div className="pyfm-stage-grid">
        {stages.map((_, index) => <StageCard key={index} index={index} step={step}/>)}
      </div>

      <Timeline step={step} onStep={value=>{clearTimers();setRunning(false);setStarted(true);setStep(value);}}/>

      <div className="pyfm-bottom-grid">
        <ExamplePanel/>
        <KeyConcepts/>
      </div>
    </div>
  );
}

export function PythonFunctionsModulesCompanion() {
  const [mode, setMode] = useState<"idle" | "ask" | "example">("idle");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const ask = () => {
    const text = question.trim();
    if (!text) return;
    const lower = text.toLowerCase();
    const reply = lower.includes("default")
      ? "A mutable default such as [] is created once when Python defines the function. Use None, then create a fresh list inside the function."
      : lower.includes("module") || lower.includes("import")
        ? "A module is a Python file you can import. Splitting extract, transform, load, and shared utilities into modules keeps pipeline logic easier to test and reuse."
        : "A function packages one reusable operation behind a clear name and parameters. Keep it small, explicit, and easy to test.";
    setAnswer(reply);
  };

  return (
    <section className={"pyfm-companion " + (mode !== "idle" ? "is-expanded" : "")}>
      <header><span><Sparkles size={16}/></span><strong>Learning with Mithoo</strong></header>
      <div className="pyfm-companion-body">
        <p>I’m Mithoo! Functions help you write reusable code, avoid tricky defaults, and keep your pipelines organized. Let’s learn step by step!</p>
        <Image src="/nila-avatar.png" alt="Mithoo learning companion" width={104} height={130}/>
      </div>
      <div className="pyfm-companion-actions">
        <button type="button" onClick={() => { setMode(mode === "ask" ? "idle" : "ask"); setAnswer(""); }}><span>◉</span>Ask a Question</button>
        <button type="button" onClick={() => setMode(mode === "example" ? "idle" : "example")}><Sparkles size={14}/>Explain with Example</button>
      </div>
      {mode === "ask" && <div className="pyfm-companion-expand">
        <label htmlFor="pyfm-mithoo-question">Ask about this lesson</label>
        <div><input id="pyfm-mithoo-question" value={question} onChange={event => setQuestion(event.target.value)} placeholder="Why is [] a risky default?" onKeyDown={event => { if (event.key === "Enter") ask(); }}/><button type="button" onClick={ask}>Ask</button></div>
        {answer && <p>{answer}</p>}
      </div>}
      {mode === "example" && <div className="pyfm-companion-expand">
        <strong>Safe default example</strong>
        <code>def add_item(item, items=None):{"\n"}    if items is None:{"\n"}        items = []</code>
        <p>Each call gets a fresh list unless the caller explicitly supplies one.</p>
      </div>}
    </section>
  );
}

