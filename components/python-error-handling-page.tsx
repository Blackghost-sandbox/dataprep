"use client";

import { PythonCodeLine } from "./python-code-line";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Bug,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  FileText,
  Lightbulb,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  X,
  Zap,
} from "lucide-react";
import { useCompanion } from "@/components/companion-context";
import { AICompanionService } from "@/lib/companion";
import { toast } from "sonner";

type DemoStep = 0 | 1 | 2 | 3;

const rawValues = ["100", "bad", "50"] as const;

const exampleCode = [
  "import logging",
  "",
  "# Configure logger",
  "logging.basicConfig(level=logging.INFO,",
  '                    format="%(asctime)s %(levelname)s: %(message)s")',
  'logger = logging.getLogger("__name__")',
  "",
  "def parse_amount(raw):",
  "    try:",
  "        return int(raw)",
  "    except ValueError as e:",
  '        logger.warning(f"Could not parse amount: {raw!r} ({e})")',
  "        return None",
  "",
  'results = [parse_amount(v) for v in ["100", "bad", "50"]]',
  "print(results)   # [100, None, 50]",
].join("\n");

const timeline = [
  { title: 'Try value "100"', body: "Parsed successfully", time: "00:00", tone: "blue" },
  { title: 'Try value "bad"', body: "Caught ValueError", time: "00:01", tone: "violet" },
  { title: "Log warning", body: "Write warning to logs", time: "00:01", tone: "orange" },
  { title: "Continue", body: "Add None to results", time: "00:02", tone: "green" },
] as const;

const keyConcepts = [
  {
    tone: "violet",
    Icon: Target,
    title: "Catch specific exceptions",
    body: "Catch the exceptions you expect (like ValueError), not a bare except, so real bugs still surface.",
  },
  {
    tone: "blue",
    Icon: ShieldCheck,
    title: "finally always runs",
    body: "Code in a finally block executes whether the try block succeeds or raises an error.",
  },
  {
    tone: "green",
    Icon: FileText,
    title: "Logging beats print",
    body: "Use the logging module to add severity levels, timestamps, and configurable outputs.",
  },
  {
    tone: "orange",
    Icon: Bug,
    title: "Let unexpected bugs surface",
    body: "Don't catch everything — let unexpected exceptions raise so they can be fixed.",
  },
] as const;

const decisionCards = [
  { tone: "violet", Icon: Target, question: "Need to handle an expected parse problem?", action: "Catch ValueError" },
  { tone: "blue", Icon: Zap, question: "Need cleanup no matter what?", action: "Use finally" },
  { tone: "green", Icon: FileText, question: "Need production visibility?", action: "Use logging" },
  { tone: "orange", Icon: Bug, question: "Unexpected bug?", action: "Let it raise" },
] as const;

function PythonLogo() {
  return (
    <svg className="pyerr-python-logo" viewBox="0 0 78 78" aria-label="Python">
      <defs>
        <linearGradient id="pyerrBlue" x1="0" x2="1"><stop stopColor="#2b88c9"/><stop offset="1" stopColor="#1766a9"/></linearGradient>
        <linearGradient id="pyerrYellow" x1="0" x2="1"><stop stopColor="#ffe15a"/><stop offset="1" stopColor="#efb826"/></linearGradient>
      </defs>
      <path d="M38 9c-14 0-14 6-14 6v13h22v4H17S7 31 7 47c0 16 12 15 12 15h8V50c0-8 7-15 15-15h18c7 0 11-6 11-13 0-7-6-13-13-13H38Z" fill="url(#pyerrBlue)"/>
      <circle cx="34" cy="17" r="2.7" fill="#fff"/>
      <path d="M40 69c14 0 14-6 14-6V50H32v-4h29s10 1 10-15c0-16-12-15-12-15h-8v12c0 8-7 15-15 15H18c-7 0-11 6-11 13 0 7 6 13 13 13h20Z" fill="url(#pyerrYellow)"/>
      <circle cx="44" cy="61" r="2.7" fill="#fff"/>
    </svg>
  );
}

export function PythonErrorHandlingHero({
  onPrevious,
  onNext,
}: {
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <section className="pyerr-hero">
      <div className="pyerr-hero-copy">
        <div className="pyerr-hero-main">
          <div className="pyerr-hero-icon"><Zap size={32}/></div>
          <div>
            <h1>Error Handling &amp; Logging</h1>
            <p>Catch the errors you expect, let the rest surface, and make failures visible with logging instead of print.</p>
            <div className="pyerr-meta">
              <span><Clock3 size={14}/>20 min</span>
              <span><BookOpen size={14}/>Lesson 5/10</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pyerr-hero-art" aria-hidden="true">
        <span className="pyerr-bubble-dot dot-one"/><span className="pyerr-bubble-dot dot-two"/><span className="pyerr-bubble-dot dot-three"/>
        <div className="pyerr-python-orb"><PythonLogo/></div>
        <div className="pyerr-log-sheet">
          <span/><span/><span/><span/><span/>
        </div>
        <div className="pyerr-label label-error"><AlertTriangle size={12}/>ValueError</div>
        <div className="pyerr-label label-try"><ShieldCheck size={12}/>try / except</div>
        <div className="pyerr-label label-log"><FileText size={12}/>logging.warning()</div>
      </div>

      <div className="pyerr-hero-nav">
        <button type="button" aria-label="Previous lesson" onClick={onPrevious}><ChevronLeft size={18}/></button>
        <button type="button" className="pyerr-next" onClick={onNext}>Next <ChevronRight size={17}/></button>
      </div>
    </section>
  );
}

function RawValuesTable({ activeIndex }: { activeIndex: number | null }) {
  return (
    <table className="pyerr-values-table">
      <thead><tr><th/><th>value</th></tr></thead>
      <tbody>
        {rawValues.map((value,index)=><tr key={value} className={activeIndex===index ? "is-active" : ""}><td>{index}</td><td>{value === "bad" ? <strong>&quot;bad&quot;</strong> : `"${value}"`}</td></tr>)}
      </tbody>
    </table>
  );
}

function StageOne({ active, activeIndex }: { active: boolean; activeIndex: number | null }) {
  return (
    <article className={"pyerr-stage pyerr-stage-blue " + (active ? "is-active" : "")}>
      <header><span className="pyerr-stage-number">1</span><div><strong>Try input</strong><p>Process a list of values</p></div></header>
      <div className="pyerr-panel">
        <strong>Raw values (e.g. from file)</strong>
        <RawValuesTable activeIndex={activeIndex}/>
      </div>
      <p className="pyerr-stage-note">We&apos;ll try to convert each value to an integer using <code>int()</code>.</p>
      <ArrowRight className="pyerr-stage-arrow" size={23}/>
    </article>
  );
}

function StageTwo({ active, complete }: { active: boolean; complete: boolean }) {
  return (
    <article className={"pyerr-stage pyerr-stage-red " + (active ? "is-active " : "") + (complete ? "is-complete" : "")}>
      <header><span className="pyerr-stage-number">2</span><div><strong>Catch expected error</strong><p>Handle ValueError only</p></div></header>
      <div className="pyerr-error-box">
        <code>int(<b>&quot;bad&quot;</b>)</code>
        <div><ArrowRight size={17}/><strong>ValueError</strong></div>
      </div>
      <div className="pyerr-explain"><span>↳</span><p>The <code>ValueError</code> is caught specifically, so only the <u>bad</u> value is handled.</p></div>
      <ArrowRight className="pyerr-stage-arrow" size={23}/>
    </article>
  );
}

function StageThree({ active, complete }: { active: boolean; complete: boolean }) {
  return (
    <article className={"pyerr-stage pyerr-stage-green " + (active ? "is-active " : "") + (complete ? "is-complete" : "")}>
      <header><span className="pyerr-stage-number">3</span><div><strong>Log warning</strong><p>Record what happened</p></div></header>
      <pre className="pyerr-log-output"><code>2024-01-15 10:00:21  <b>WARNING</b>{"\n"}{"\n"}Could not parse amount: &apos;bad&apos;{"\n"}(ValueError: invalid literal{"\n"}for int() with base 10:{"\n"}&apos;bad&apos;)</code></pre>
      <div className="pyerr-explain"><span>↓</span><p>We log a warning with details instead of using <code>print()</code>.</p></div>
      <ArrowRight className="pyerr-stage-arrow" size={23}/>
    </article>
  );
}

function StageFour({ active, complete }: { active: boolean; complete: boolean }) {
  return (
    <article className={"pyerr-stage pyerr-stage-green " + (active ? "is-active " : "") + (complete ? "is-complete" : "")}>
      <header><span className="pyerr-stage-number">4</span><div><strong>Continue or raise</strong><p>Pipeline keeps running</p></div></header>
      <div className="pyerr-panel">
        <strong>Results (cleaned list)</strong>
        <table className="pyerr-values-table pyerr-result-table">
          <thead><tr><th/><th>value</th></tr></thead>
          <tbody>
            <tr className={complete ? "is-safe" : ""}><td>0</td><td>{complete ? "100" : "—"}</td></tr>
            <tr className={complete ? "is-safe" : ""}><td>1</td><td>{complete ? "None" : "—"}</td></tr>
            <tr className={complete ? "is-safe" : ""}><td>2</td><td>{complete ? "50" : "—"}</td></tr>
          </tbody>
        </table>
      </div>
      <p className="pyerr-stage-note">For expected bad data, we continue with a safe value (e.g. <code>None</code>).</p>
    </article>
  );
}

function Timeline({ step, running, onStep }: { step: DemoStep; running: boolean; onStep: (step: DemoStep)=>void }) {
  return (
    <section className="pyerr-timeline">
      <header><span><Lightbulb size={13}/></span><strong>Execution Timeline</strong><small>(illustrative)</small></header>
      <div>
        {timeline.map((item,index)=>(
          <button
            key={item.title}
            type="button"
            onClick={()=>!running&&onStep(index as DemoStep)}
            disabled={running}
            className={(step===index ? "is-active " : "") + (step>=index ? "is-complete" : "") + " pyerr-tone-" + item.tone}
            aria-current={step===index ? "step" : undefined}
          >
            <span className="pyerr-time-number">{index+1}</span>
            <span className="pyerr-time-icon">{index===0?<Search size={20}/>:index===1?<AlertTriangle size={20}/>:index===2?<FileText size={20}/>:<Play size={20}/>}</span>
            <span><strong>{item.title}</strong><small>{item.body}<br/>{item.time}</small></span>
            {step>=index && <CheckCircle2 className="pyerr-time-check" size={14}/>}
            {index<timeline.length-1 && <ArrowRight className="pyerr-time-arrow" size={17}/>}
          </button>
        ))}
      </div>
    </section>
  );
}

function CodeExample() {
  const [copied,setCopied]=useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exampleCode);
      setCopied(true);
      window.setTimeout(()=>setCopied(false),1200);
    } catch {
      toast.error("Could not copy this example.");
    }
  };
  return (
    <section className="pyerr-code-example">
      <header><strong>Python example · parse_amount with logging</strong><button type="button" onClick={copy}>{copied?<Check size={13}/>:<Copy size={13}/>} {copied?"Copied":"Copy"}</button></header>
      <pre><code>{exampleCode.split("\n").map((line,index)=><span key={index}><i>{index+1}</i><b className={line.trim().startsWith("#") ? "is-comment" : ""}><PythonCodeLine code={line || " "} /></b></span>)}</code></pre>
    </section>
  );
}

function ConceptsPanel() {
  return (
    <section className="pyerr-concepts-panel">
      <h3>Key Concepts</h3>
      <div className="pyerr-concept-grid">
        {keyConcepts.map(({tone,Icon,title,body})=>(
          <article key={title} className={"pyerr-key pyerr-tone-"+tone}><span><Icon size={20}/></span><div><strong>{title}</strong><p>{body}</p></div></article>
        ))}
      </div>
      <h4>When to do what?</h4>
      <div className="pyerr-decision-grid">
        {decisionCards.map(({tone,Icon,question,action})=>(
          <article key={action} className={"pyerr-decision pyerr-tone-"+tone}><span><Icon size={15}/></span><div><small>{question}</small><strong>{action}</strong></div></article>
        ))}
      </div>
    </section>
  );
}

export function PythonErrorHandlingConcept() {
  const [step,setStep]=useState<DemoStep>(0);
  const [running,setRunning]=useState(false);
  const [started,setStarted]=useState(false);
  const timers=useRef<number[]>([]);

  const clearTimers=()=>{
    timers.current.forEach(timer=>window.clearTimeout(timer));
    timers.current=[];
  };
  useEffect(()=>()=>clearTimers(),[]);

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
  const reset=()=>{
    clearTimers();
    setRunning(false);
    setStep(0);setStarted(false);
  };

  const activeIndex = step===0 ? 0 : step===1 || step===2 ? 1 : 2;

  return (
    <div className={"pyerr-concept"+(running?" is-running":"")}>
      <header className="pyerr-concept-header">
        <div className="pyerr-playmark"><Play size={22}/></div>
        <div><h2>Error Handling &amp; Logging Simulator</h2><p>See how we catch expected errors, log what happened, and decide whether to continue or raise.</p></div>
        <div className="pyerr-controls">
          <button type="button" className="pyerr-run" onClick={run}><Play size={15}/>{running?"Running…":"Run"}</button>
          <button type="button" onClick={previous} disabled={step===0}>Previous step</button><button type="button" onClick={next} disabled={step===3}><Play size={14}/>Next step</button>
          <button type="button" onClick={reset}><RotateCcw size={14}/>Reset</button>
          <span>{step+1} / 4 steps</span>
        </div>
      </header>

      <p className="python-native-explanation" aria-live="polite">Illustrative flow � {["Read text values 100, bad and 50.", "int(bad) raises ValueError; the matching handler catches it.", "Record a warning explaining which value could not be parsed.", "Continue with the next value; the handled failure returns None."][step]}</p>
      <div className="pyerr-stage-grid">
        <StageOne active={step===0} activeIndex={activeIndex}/>
        <StageTwo active={step===1} complete={step>1}/>
        <StageThree active={step===2} complete={step>2}/>
        <StageFour active={step===3} complete={step===3}/>
      </div>

      <Timeline step={step} running={false} onStep={value=>{clearTimers();setRunning(false);setStarted(true);setStep(value);}}/>

      <div className="pyerr-bottom-grid">
        <CodeExample/>
        <ConceptsPanel/>
      </div>
    </div>
  );
}

export function PythonErrorHandlingCompanion() {
  const companion=useCompanion();
  const service=useRef(new AICompanionService());
  const [mode,setMode]=useState<"idle"|"ask"|"example">("idle");
  const [question,setQuestion]=useState("");
  const [answer,setAnswer]=useState("");
  const [busy,setBusy]=useState(false);

  if(!companion)return null;

  const answerQuestion=async()=>{
    const q=question.trim();
    if(!q||busy)return;
    setBusy(true);
    const lower=q.toLowerCase();
    let local="";
    if(lower.includes("valueerror")) local="Catch ValueError when a conversion can fail because the input value is invalid, such as int('bad'). Catching only the expected exception lets unrelated bugs still surface.";
    else if(lower.includes("finally")) local="A finally block runs whether the try block succeeds, raises a caught exception, or raises an uncaught exception. Use it for cleanup when a context manager is not already handling the resource.";
    else if(lower.includes("logging")||lower.includes("print")) local="Logging is preferable to print in a pipeline because it adds severity levels, timestamps, filtering, and configurable destinations.";
    else if(lower.includes("broad")||lower.includes("except exception")||lower.includes("bare except")) local="A broad except can hide programming errors along with expected failures. Catch only the exceptions you can handle meaningfully.";
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
    <section className="pyerr-companion">
      <div className="pyerr-companion-body">
        <div><strong>Learning Error Handling &amp; Logging?</strong><p>I’m Mithoo. Let’s make it simple, one step at a time.</p></div>
        <Image src="/nila-avatar.png" alt="Mithoo learning companion" width={108} height={132}/>
      </div>
      <div className="pyerr-companion-actions">
        <button type="button" onClick={()=>{setMode(mode==="ask"?"idle":"ask");setAnswer("");}}><span>◉</span>Ask a Question</button>
        <button type="button" onClick={explainExample} disabled={busy}><Sparkles size={14}/>{busy?"Loading…":"Explain with Example"}</button>
      </div>
      {mode==="ask"&&<div className="pyerr-companion-expand"><div><input aria-label="Ask Mithoo about error handling" value={question} onChange={event=>setQuestion(event.target.value)} onKeyDown={event=>{if(event.key==="Enter")void answerQuestion();}} placeholder="Why catch ValueError?"/><button type="button" onClick={answerQuestion} disabled={busy||!question.trim()}>Ask</button></div>{answer&&<p>{answer}</p>}</div>}
      {mode==="example"&&answer&&<div className="pyerr-companion-expand"><button type="button" onClick={()=>setMode("idle")} className="pyerr-expand-close" aria-label="Close explanation"><X size={13}/></button><pre>{answer}</pre></div>}
    </section>
  );
}
