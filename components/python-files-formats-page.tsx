"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  Database,
  Eye,
  FileArchive,
  FileJson,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Lightbulb,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useCompanion } from "@/components/companion-context";
import { AICompanionService } from "@/lib/companion";

type DemoStep = 0 | 1 | 2 | 3;
type InputView = "table" | "code";
type ReadFormat = "csv" | "json" | "parquet";
type CompareView = "files" | "schema";

const rows = [
  { date: "2024-01-01", hub: "HH", price: 2.54, volume: 100 },
  { date: "2024-01-02", hub: "TTF", price: 11.23, volume: 200 },
  { date: "2024-01-03", hub: "JKM", price: 12.80, volume: 150 },
] as const;

const inputCode = [
  "import pandas as pd",
  "",
  "df = pd.DataFrame({",
  '  "date": ["2024-01-01", "2024-01-02", "2024-01-03"],',
  '  "hub": ["HH", "TTF", "JKM"],',
  '  "price": [2.54, 11.23, 12.80],',
  '  "volume": [100, 200, 150]',
  "})",
].join("\n");

const writeCode = [
  "import pandas as pd",
  "from pathlib import Path",
  "",
  "df = pd.DataFrame({",
  '  "date": ["2024-01-01", ...],',
  '  "hub": ["HH", "TTF", "JKM"],',
  '  "price": [2.54, 11.23, 12.80],',
  '  "volume": [100, 200, 150]',
  "})",
  "",
  'Path("data").mkdir(exist_ok=True)',
  'df.to_csv("data/prices.csv", index=False)',
  'df.to_json("data/prices.json", orient="records")',
  'df.to_parquet("data/prices.parquet")',
].join("\n");

const readCode: Record<ReadFormat, string> = {
  csv: [
    'df_csv = pd.read_csv("data/prices.csv")',
    "print(df_csv)",
    "print(df_csv.dtypes)",
    "print(df_csv.shape)",
  ].join("\n"),
  json: [
    'df_json = pd.read_json("data/prices.json")',
    "print(df_json)",
    "print(df_json.dtypes)",
    "print(df_json.shape)",
  ].join("\n"),
  parquet: [
    'df_parquet = pd.read_parquet("data/prices.parquet")',
    "print(df_parquet)",
    "print(df_parquet.dtypes)",
    "print(df_parquet.shape)",
  ].join("\n"),
};

const fileRows = [
  { key: "csv", name: "prices.csv", size: "642 bytes", icon: FileSpreadsheet, tone: "blue" },
  { key: "json", name: "prices.json", size: "412 bytes", icon: FileJson, tone: "violet" },
  { key: "parquet", name: "prices.parquet", size: "1.8 KB", icon: FileArchive, tone: "green" },
] as const;

const formatCards = [
  {
    key: "csv",
    title: "CSV",
    Icon: FileSpreadsheet,
    tone: "blue",
    bullets: ["Simple and human-readable", "Wide tool support", "Best for small to medium data"],
    use: "Ad-hoc data, small datasets",
  },
  {
    key: "json",
    title: "JSON",
    Icon: FileJson,
    tone: "violet",
    bullets: ["Nested structure support", "Stores complex data", "Text-based and flexible"],
    use: "APIs, semi-structured data",
  },
  {
    key: "parquet",
    title: "Parquet",
    Icon: FileArchive,
    tone: "green",
    bullets: ["Columnar and compressed", "Efficient for large datasets", "Better performance in analytics"],
    use: "Big data, data lakes, production",
  },
  {
    key: "txt",
    title: "TXT",
    Icon: FileText,
    tone: "orange",
    bullets: ["Plain text format", "No fixed structure", "Useful for logs and quick checks"],
    use: "Logs, configs, simple data",
  },
] as const;

const keyConcepts = [
  { tone: "violet", Icon: FolderOpen, title: "File paths with pathlib", body: "Use Path for safer, cross-platform paths." },
  { tone: "pink", Icon: Sparkles, title: "Use the right format", body: "Choose based on size, structure and downstream use." },
  { tone: "blue", Icon: ShieldCheck, title: "Handle files safely", body: "Use with, check existence, and handle exceptions." },
  { tone: "orange", Icon: Database, title: "Data types matter", body: "CSV infers simple types; JSON preserves nested data; Parquet is typed." },
] as const;

function PythonLogo() {
  return (
    <svg className="pyff-python-logo" viewBox="0 0 78 78" aria-label="Python">
      <defs>
        <linearGradient id="pyffBlue" x1="0" x2="1"><stop stopColor="#2b89ca"/><stop offset="1" stopColor="#1766ab"/></linearGradient>
        <linearGradient id="pyffYellow" x1="0" x2="1"><stop stopColor="#ffe05a"/><stop offset="1" stopColor="#f0b927"/></linearGradient>
      </defs>
      <path d="M38 9c-14 0-14 6-14 6v13h22v4H17S7 31 7 47c0 16 12 15 12 15h8V50c0-8 7-15 15-15h18c7 0 11-6 11-13 0-7-6-13-13-13H38Z" fill="url(#pyffBlue)"/>
      <circle cx="34" cy="17" r="2.7" fill="#fff"/>
      <path d="M40 69c14 0 14-6 14-6V50H32v-4h29s10 1 10-15c0-16-12-15-12-15h-8v12c0 8-7 15-15 15H18c-7 0-11 6-11 13 0 7 6 13 13 13h20Z" fill="url(#pyffYellow)"/>
      <circle cx="44" cy="61" r="2.7" fill="#fff"/>
    </svg>
  );
}

export function PythonFilesFormatsHero() {
  return (
    <section className="pyff-hero">
      <div className="pyff-hero-copy">
        <div className="pyff-breadcrumb">
          <span>Python for Data Engineering</span><ChevronRight size={13}/><strong>Files &amp; Data Formats</strong>
        </div>
        <div className="pyff-hero-main">
          <div className="pyff-hero-icon"><FileText size={33}/></div>
          <div>
            <h1>Files &amp; Data Formats</h1>
            <p>Read and write files safely, and pick the right format for moving data between pipeline stages.</p>
            <div className="pyff-meta">
              <span><Clock3 size={14}/>20 min</span>
              <span><BookOpen size={14}/>Lesson 4/10</span>
              <span className="pyff-intermediate"><Sparkles size={13}/>Intermediate</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pyff-hero-art" aria-hidden="true">
        <span className="pyff-star pyff-star-a">✦</span><span className="pyff-star pyff-star-b">✦</span><span className="pyff-star pyff-star-c">✦</span>
        <div className="pyff-format-doc pyff-doc-csv"><strong>CSV</strong><i/><i/><i/></div>
        <div className="pyff-format-doc pyff-doc-json"><strong>JSON</strong><b>{"{ }"}</b></div>
        <div className="pyff-format-doc pyff-doc-parquet"><strong>Parquet</strong><i/><i/><i/></div>
        <div className="pyff-format-doc pyff-doc-txt"><strong>TXT</strong><i/><i/></div>
        <div className="pyff-python-float"><PythonLogo/></div>
        <div className="pyff-dash-line line-a"/><div className="pyff-dash-line line-b"/><div className="pyff-dash-line line-c"/>
      </div>
    </section>
  );
}

function TablePreview({ compact = false }: { compact?: boolean }) {
  return (
    <table className={"pyff-table " + (compact ? "is-compact" : "")}>
      <thead><tr><th>date</th><th>hub</th><th>price</th><th>volume</th></tr></thead>
      <tbody>
        {rows.map((row) => <tr key={row.date}><td>{row.date}</td><td>{row.hub}</td><td>{row.price.toFixed(2)}</td><td>{row.volume}</td></tr>)}
      </tbody>
    </table>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error("Could not copy this code.");
    }
  };
  return <button type="button" className="pyff-copy" onClick={copy}>{copied ? <Check size={13}/> : <Copy size={13}/>} {copied ? "Copied" : "Copy"}</button>;
}

function CodeBox({ title = "Python", code }: { title?: string; code: string }) {
  return (
    <div className="pyff-code">
      <header><span>{title}</span><CopyButton text={code}/></header>
      <pre><code>{code.split("\n").map((line, index) => <span key={index} className={line.trim().startsWith("#") ? "is-comment" : ""}>{line || " "}</span>)}</code></pre>
    </div>
  );
}

function InputStage({ active, view, setView }: { active: boolean; view: InputView; setView: (v: InputView) => void }) {
  return (
    <article className={"pyff-stage pyff-stage-blue " + (active ? "is-active" : "")}>
      <header><span className="pyff-stage-number">1</span><div><strong>Input Data</strong><p>Create a sample dataset</p></div></header>
      <div className="pyff-segment">
        <button type="button" className={view==="table"?"is-active":""} onClick={()=>setView("table")}>Table</button>
        <button type="button" className={view==="code"?"is-active":""} onClick={()=>setView("code")}>Python Code</button>
      </div>
      <div className="pyff-input-body">{view==="table" ? <TablePreview/> : <CodeBox code={inputCode}/>}</div>
      <div className="pyff-tip"><span><Lightbulb size={16}/></span><p>This is the same data we’ll write to different formats.</p></div>
      <ArrowRight className="pyff-stage-arrow" size={22}/>
    </article>
  );
}

function WriteStage({ active, completed }: { active: boolean; completed: boolean }) {
  return (
    <article className={"pyff-stage pyff-stage-violet " + (active ? "is-active " : "") + (completed ? "is-complete" : "")}>
      <header><span className="pyff-stage-number">2</span><div><strong>Write to Files</strong><p>Save the data in different formats</p></div></header>
      <CodeBox code={writeCode}/>
      <div className="pyff-stage-status">{completed ? <><Check size={14}/> CSV, JSON and Parquet created</> : "Run step 2 to create the file artifacts."}</div>
      <ArrowRight className="pyff-stage-arrow" size={22}/>
    </article>
  );
}

function ReadStage({ active, format, setFormat }: { active: boolean; format: ReadFormat; setFormat: (f: ReadFormat)=>void }) {
  return (
    <article className={"pyff-stage pyff-stage-orange " + (active ? "is-active" : "")}>
      <header><span className="pyff-stage-number">3</span><div><strong>Read the Files</strong><p>Load and inspect each format</p></div></header>
      <div className="pyff-segment pyff-read-tabs">
        {(["csv","json","parquet"] as ReadFormat[]).map((item)=><button key={item} type="button" className={format===item?"is-active":""} onClick={()=>setFormat(item)}>{item === "csv" ? "CSV" : item === "json" ? "JSON" : "Parquet"}</button>)}
      </div>
      <CodeBox code={readCode[format]}/>
      <div className="pyff-preview">
        <strong>Preview ({format.toUpperCase()})</strong>
        {format === "csv" && <TablePreview compact/>}
        {format === "json" && <pre><code>{JSON.stringify(rows, null, 2)}</code></pre>}
        {format === "parquet" && <div className="pyff-parquet-preview"><span>date <b>date/string</b></span><span>hub <b>string</b></span><span>price <b>float64</b></span><span>volume <b>int64</b></span></div>}
      </div>
      <ArrowRight className="pyff-stage-arrow" size={22}/>
    </article>
  );
}

function CompareStage({
  active,
  view,
  setView,
  onViewFile,
  done,
}: {
  active: boolean;
  view: CompareView;
  setView: (v: CompareView)=>void;
  onViewFile: (key: string)=>void;
  done: boolean;
}) {
  return (
    <article className={"pyff-stage pyff-stage-green " + (active ? "is-active " : "") + (done ? "is-complete" : "")}>
      <header><span className="pyff-stage-number">4</span><div><strong>Compare Results</strong><p>See structure and file sizes</p></div></header>
      <div className="pyff-segment">
        <button type="button" className={view==="files"?"is-active":""} onClick={()=>setView("files")}>File Info</button>
        <button type="button" className={view==="schema"?"is-active":""} onClick={()=>setView("schema")}>Schema</button>
      </div>
      {view === "files" ? (
        <div className="pyff-file-list">
          {fileRows.map(({key,name,size,icon:Icon,tone})=><div key={key}><span className={"pyff-file-icon tone-"+tone}><Icon size={19}/></span><span><strong>{name}</strong><small>{size}</small></span><button type="button" onClick={()=>onViewFile(key)}>View</button></div>)}
        </div>
      ) : (
        <div className="pyff-schema">
          <div><strong>column</strong><strong>dtype</strong></div>
          <div><span>date</span><code>object/date</code></div>
          <div><span>hub</span><code>object</code></div>
          <div><span>price</span><code>float64</code></div>
          <div><span>volume</span><code>int64</code></div>
        </div>
      )}
      <div className={"pyff-success " + (done ? "is-ready" : "")}><ShieldCheck size={19}/><span><strong>{done ? "All files written successfully!" : "Comparison unlocks at step 4"}</strong><small>{done ? "The same data, different formats." : "Advance the simulation to compare outputs."}</small></span></div>
    </article>
  );
}

function FormatGuide({ onSelect }: { onSelect: (key: string)=>void }) {
  return (
    <div className="pyff-format-guides">
      {formatCards.map(({key,title,Icon,tone,bullets,use})=>(
        <button type="button" key={key} className={"pyff-format-card pyff-format-"+tone} onClick={()=>onSelect(key)}>
          <span className="pyff-format-icon"><Icon size={26}/></span>
          <div><strong>{title}</strong><ul>{bullets.map((bullet)=><li key={bullet}><span>✓</span>{bullet}</li>)}</ul><small><b>Use for:</b> {use}</small></div>
        </button>
      ))}
    </div>
  );
}

function KeyConcepts() {
  return (
    <section className="pyff-key-concepts">
      <header><span>✦</span><strong>Key Concepts</strong></header>
      <div>
        {keyConcepts.map(({tone,Icon,title,body})=>(
          <article key={title} className={"pyff-key-"+tone}><span><Icon size={20}/></span><div><strong>{title}</strong><p>{body}</p></div></article>
        ))}
      </div>
    </section>
  );
}

function FileViewer({ file, onClose }: { file: string; onClose: ()=>void }) {
  const content = useMemo(() => {
    if (file === "csv") return ["date,hub,price,volume", ...rows.map(r=>`${r.date},${r.hub},${r.price.toFixed(2)},${r.volume}`)].join("\n");
    if (file === "json") return JSON.stringify(rows, null, 2);
    if (file === "txt") return rows.map(r=>`${r.date} | ${r.hub} | ${r.price.toFixed(2)} | ${r.volume}`).join("\n");
    return [
      "Parquet preview (deterministic lesson simulation)",
      "row groups: 1",
      "columns:",
      "  date    object/date",
      "  hub     string",
      "  price   float64",
      "  volume  int64",
      "",
      "values:",
      ...rows.map(r=>`  ${r.date} | ${r.hub} | ${r.price.toFixed(2)} | ${r.volume}`),
    ].join("\n");
  }, [file]);
  return (
    <div className="pyff-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="pyff-modal" role="dialog" aria-modal="true" aria-label={"Preview " + file} onMouseDown={(event)=>event.stopPropagation()}>
        <header><div><strong>{file === "csv" ? "prices.csv" : file === "json" ? "prices.json" : file === "txt" ? "prices.txt" : "prices.parquet"}</strong><small>Generated by the lesson simulation</small></div><button type="button" onClick={onClose} aria-label="Close preview"><X size={18}/></button></header>
        <pre><code>{content}</code></pre>
        <footer><CopyButton text={content}/><button type="button" onClick={onClose}>Close</button></footer>
      </section>
    </div>
  );
}

export function PythonFilesFormatsConcept() {
  const [step, setStep] = useState<DemoStep>(0);
  const [running, setRunning] = useState(false);
  const [inputView, setInputView] = useState<InputView>("table");
  const [readFormat, setReadFormat] = useState<ReadFormat>("csv");
  const [compareView, setCompareView] = useState<CompareView>("files");
  const [viewer, setViewer] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((timer)=>window.clearTimeout(timer));
    timers.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  const run = () => {
    clearTimers();
    setRunning(true);
    setStep(0);
    [1,2,3].forEach((next,index)=>timers.current.push(window.setTimeout(()=>setStep(next as DemoStep), 650*(index+1))));
    timers.current.push(window.setTimeout(()=>setRunning(false), 2750));
  };

  const next = () => {
    clearTimers();
    setRunning(false);
    setStep((value)=>Math.min(3,value+1) as DemoStep);
  };

  const reset = () => {
    clearTimers();
    setRunning(false);
    setStep(0);
    setInputView("table");
    setReadFormat("csv");
    setCompareView("files");
    setViewer(null);
  };

  const selectGuide = (key: string) => {
    if (key === "csv" || key === "json" || key === "parquet") {
      setReadFormat(key);
      setStep(2);
      document.querySelector(".pyff-stage-orange")?.scrollIntoView({behavior:"smooth",block:"nearest"});
    } else {
      setViewer("txt");
    }
  };

  return (
    <div className="pyff-concept">
      <header className="pyff-concept-header">
        <div className="pyff-eye"><Eye size={22}/></div>
        <div><h2>Try it yourself: Read, Inspect, and Write in Different Formats</h2><p>Run the example to see how the same data can be written and read in CSV, JSON and Parquet — and compare their structure and file sizes.</p></div>
        <div className="pyff-controls">
          <button type="button" className="pyff-run" onClick={run} disabled={running}><Play size={15}/>{running ? "Running…" : "Run"}</button>
          <button type="button" onClick={next} disabled={step===3 || running}><Play size={14}/>Next step</button>
          <button type="button" onClick={reset}><RotateCcw size={14}/>Reset</button>
          <span>{step+1} / 4 steps</span>
        </div>
      </header>

      <div className="pyff-stage-grid">
        <InputStage active={step===0} view={inputView} setView={setInputView}/>
        <WriteStage active={step===1} completed={step>1}/>
        <ReadStage active={step===2} format={readFormat} setFormat={setReadFormat}/>
        <CompareStage active={step===3} view={compareView} setView={setCompareView} onViewFile={setViewer} done={step===3}/>
      </div>

      <FormatGuide onSelect={selectGuide}/>
      <KeyConcepts/>
      {viewer && <FileViewer file={viewer} onClose={()=>setViewer(null)}/>}
    </div>
  );
}

export function PythonFilesFormatsQuickNotes({ onNotes }: { onNotes: ()=>void }) {
  return (
    <section className="pyff-quick-notes">
      <header><FileText size={21}/><strong>Quick Notes</strong></header>
      <p>CSV is simple, JSON keeps structure, and Parquet is efficient for large datasets.</p>
      <button type="button" onClick={onNotes}>+ Add your note →</button>
    </section>
  );
}

export function PythonFilesFormatsCompanion() {
  const companion = useCompanion();
  const service = useRef(new AICompanionService());
  const [mode,setMode] = useState<"idle"|"ask"|"answer">("idle");
  const [question,setQuestion] = useState("");
  const [answer,setAnswer] = useState("");
  const [busy,setBusy] = useState(false);

  if (!companion) return null;

  const answerQuestion = async () => {
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    const lower = q.toLowerCase();
    let local = "";
    if (lower.includes("parquet")) local = "Parquet is columnar and typed, so analytics engines can read only needed columns and preserve schema. It is usually a better pipeline format for larger analytical datasets.";
    else if (lower.includes("csv")) local = "CSV is simple and widely supported, but the file itself does not carry a rich schema. Consumers often need to infer or define types.";
    else if (lower.includes("json")) local = "JSON is text-based and can represent nested objects and arrays, which makes it useful for APIs and semi-structured data.";
    else if (lower.includes("path") || lower.includes("pathlib")) local = "pathlib.Path models filesystem paths as objects and avoids hard-coded OS-specific separators. It also provides helpers such as exists(), mkdir(), and read_text().";
    else if (lower.includes("with") || lower.includes("close")) local = "A with block uses a context manager, so the file is closed when the block exits even when an exception occurs.";
    if (local) {
      setAnswer(local);
    } else {
      const reply = await service.current.respond("simply", companion.context, q);
      setAnswer(reply.text);
    }
    setBusy(false);
  };

  const explainExample = async () => {
    if (busy) return;
    setBusy(true);
    const reply = await service.current.respond("example", companion.context);
    setAnswer(reply.text);
    setMode("answer");
    setBusy(false);
  };

  return (
    <section className="pyff-companion">
      <header><Sparkles size={15}/><strong>Mithoo · Learning companion</strong></header>
      <div className="pyff-companion-body">
        <div><strong>Follow the data ✨</strong><p>See how the same data looks in different formats. Want to try modifying the code?</p></div>
        <Image src="/nila-avatar.png" alt="Mithoo learning companion" width={104} height={128}/>
      </div>
      <div className="pyff-companion-actions">
        <button type="button" onClick={()=>{setMode(mode==="ask"?"idle":"ask");setAnswer("");}}><span>◉</span>Ask a Question</button>
        <button type="button" onClick={explainExample} disabled={busy}><Lightbulb size={14}/>{busy?"Loading…":"Explain with Example"}</button>
      </div>
      {mode==="ask" && <div className="pyff-companion-expand"><div><input aria-label="Ask Mithoo about files and formats" value={question} onChange={(event)=>setQuestion(event.target.value)} onKeyDown={(event)=>{if(event.key==="Enter")void answerQuestion();}} placeholder="Why use Parquet?"/><button type="button" onClick={answerQuestion} disabled={busy||!question.trim()}>Ask</button></div>{answer&&<p>{answer}</p>}</div>}
      {mode==="answer" && answer && <div className="pyff-companion-expand"><button type="button" className="pyff-expand-close" onClick={()=>setMode("idle")} aria-label="Close explanation"><X size={13}/></button><pre>{answer}</pre></div>}
    </section>
  );
}
