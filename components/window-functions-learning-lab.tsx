"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Database,
  Eye,
  FileCode2,
  Lightbulb,
  ListChecks,
  Play,
  RotateCcw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import type { SparkLesson } from "@/lib/spark-lessons";
import { orderTable } from "@/lib/sql-lessons";
import { sqlConceptGuides } from "@/lib/sql-concepts";
import { GlossaryText } from "@/components/glossary";
import { DarkCodeCard } from "@/components/rdd-dataframe-experience";

function MiniTable({
  rows,
  result,
  alias,
  activeId,
}: {
  rows: WindowResultRow[];
  result?: boolean;
  alias: string;
  activeId?: number;
}) {
  return (
    <div className="wf-table-wrap">
      <table>
        <thead>
          <tr>
            <th>id</th>
            <th>customer_id</th>
            <th>amount</th>
            {result && <th>{alias}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={row.id === activeId ? "wf-active-row" : undefined}>
              <td>{row.id}</td>
              <td><span className={`wf-partition wf-partition-${row.customer_id}`}>{row.customer_id}</span></td>
              <td>{row.amount}</td>
              {result && <td className="wf-result-value">{Number.isInteger(row.value) ? row.value : row.value.toFixed(1)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function WindowFunctionsLearningLab({
  lesson,
  onTab,
  onLesson,
}: {
  lesson: SparkLesson;
  onTab: (tab: string) => void;
  onLesson: (id: string) => void;
}) {
  const guide = sqlConceptGuides["window-functions"];
  const defaultScenario = scenarios[0];
  const [scenarioId, setWindowScenarioId] = useState<WindowScenarioId>(defaultScenario.id);
  const [query, setQuery] = useState(defaultScenario.query);
  const [status, setStatus] = useState<Status>("ready");
  const [error, setError] = useState("");
  const [executed, setExecuted] = useState(() => evaluateWindow(defaultScenario.query));
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(false);

  const sourceRows = useMemo<WindowResultRow[]>(
    () =>
      orderTable.rows.map((row) => ({
        id: Number(row[0]),
        customer_id: Number(row[1]),
        amount: Number(row[2]),
        value: 0,
      })),
    [],
  );
  const scenario = scenarios.find((item) => item.id === scenarioId) || defaultScenario;

  function chooseScenario(id: WindowScenarioId) {
    const next = scenarios.find((item) => item.id === id) || defaultScenario;
    setWindowScenarioId(next.id);
    setQuery(next.query);
    setExecuted(evaluateWindow(next.query));
    setStatus("ready");
    setError("");
    setStep(0);
  }

  function run() {
    setStatus("executing");
    setError("");
    const next = evaluateWindow(query);
    if (next.error) {
      setExecuted(next);
      setStatus("error");
      setError(next.error);
      setStep(1);
      return;
    }
    setExecuted(next);
    setStatus("result");
    setStep(2);
  }

  function reset() {
    chooseScenario(scenarioId);
  }

  async function copySql() {
    try {
      await navigator.clipboard.writeText(query);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  const stepLabels = ["Input table", "Apply window", "Result"];
  const activeResultId = step === 1 ? sourceRows[Math.min(1, sourceRows.length - 1)]?.id : undefined;

  return (
    <div className="sql-concept-sequence wf-sequence">
      <section className="sql-concept-intro">
        <div className="sql-intro-copy">
          <h3><BookOpen size={19}/> What is Window Functions?</h3>
          <p><GlossaryText>{lesson.description}</GlossaryText></p>
          <p className="sql-mental-question"><Lightbulb size={18}/> <span>Think: “{guide.question}”</span></p>
        </div>
        <div className="sql-model-panel">
          <h4>Mental model</h4>
          <ol className="sql-mental-model" aria-label="Mental model">
            {guide.model.map((part, index) => {
              const Icon = [Database, FileCode2, ListChecks][index] || Database;
              return (
                <li key={part}>
                  <span><Icon size={24}/><b>{part}</b></span>
                  {index < guide.model.length - 1 && <ArrowRight size={15} aria-hidden/>}
                </li>
              );
            })}
          </ol>
        </div>
        <div className="sql-basic-code">
          <h4>Basic syntax</h4>
          <DarkCodeCard title="SQL · basic syntax" code={lesson.example.code}/>
        </div>
        <div className="sql-parts-panel">
          <h4>What each part means</h4>
          <dl className="sql-syntax-parts">
            {guide.parts.map(([term, meaning]) => (
              <div key={term}><dt><code>{term}</code></dt><dd>{meaning}</dd></div>
            ))}
          </dl>
        </div>
      </section>

      <section className="wf-lab" aria-label="Window Functions interactive simulation">
        <header className="wf-lab-header">
          <div className="visual-title">
            <span><Eye size={21}/></span>
            <div>
              <h3>Follow the data</h3>
              <p>Keep every order row while the window adds context beside it.</p>
            </div>
          </div>
          <div className="wf-run-actions">
            <button type="button" className="spark-primary" onClick={run} disabled={status === "executing"}>
              <Play size={15} fill="currentColor"/> {status === "executing" ? "Executing…" : "Run Query"}
            </button>
            <button type="button" onClick={reset}><RotateCcw size={15}/> Reset</button>
          </div>
        </header>

        <div className="wf-stepper" role="tablist" aria-label="Window function walkthrough">
          {stepLabels.map((label, index) => (
            <button
              type="button"
              role="tab"
              aria-selected={step === index}
              key={label}
              onClick={() => setStep(index)}
            >
              <span>{index + 1}</span>{label}
            </button>
          ))}
        </div>

        <div className="wf-scenarios" aria-label="Window function scenarios">
          {scenarios.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={scenarioId === item.id}
              onClick={() => chooseScenario(item.id)}
            >
              <strong>{item.label}</strong><span>{item.short}</span>
            </button>
          ))}
        </div>

        <div className="wf-workspace">
          <section className="wf-source-panel">
            <div className="wf-panel-title"><span className="wf-dot wf-blue"/> <div><strong>1. Source rows</strong><small>orders · {sourceRows.length} rows</small></div></div>
            <MiniTable rows={sourceRows} alias={executed.alias} activeId={activeResultId}/>
            <p className="wf-footnote">The source table never changes. customer_id colors show the partitions.</p>
          </section>

          <section className="wf-query-panel">
            <div className="wf-panel-title"><span className="wf-dot wf-pink"/> <div><strong>2. Window expression</strong><small>Edit the lesson SQL, then run it.</small></div></div>
            <div className="wf-editor-shell">
              <div className="wf-editor-bar"><span>SQL</span><button type="button" onClick={copySql}><Copy size={14}/>{copied ? "Copied" : "Copy"}</button></div>
              <textarea aria-label="Window function SQL" spellCheck={false} value={query} onChange={(event) => { setQuery(event.target.value); setStatus("ready"); setError(""); }}/>
            </div>
            <div className="wf-partition-visual">
              <strong>Window partitions</strong>
              <div><span className="wf-partition wf-partition-1">customer 1</span><b>500</b><b>300</b><span className="wf-window-brace">same window</span></div>
              <div><span className="wf-partition wf-partition-3">customer 3</span><b>200</b><span className="wf-window-brace">own window</span></div>
            </div>
          </section>

          <section className="wf-result-panel">
            <div className="wf-panel-title"><span className="wf-dot wf-green"/> <div><strong>3. Result</strong><small>{status === "result" ? "Same rows + calculated column" : "Run the query to confirm the result"}</small></div></div>
            {status === "error" ? (
              <div className="wf-error" role="alert"><TriangleAlert size={18}/><div><strong>Query error</strong><p>{error}</p></div></div>
            ) : (
              <MiniTable rows={executed.rows.length ? executed.rows : sourceRows} result alias={executed.alias} activeId={activeResultId}/>
            )}
            <div className="wf-result-summary" aria-live="polite">
              {status === "ready" && <>Ready · edit the SQL or choose a scenario, then run.</>}
              {status === "executing" && <>Executing the window expression…</>}
              {status === "result" && <><CheckCircle2 size={16}/> {executed.rows.length} input rows → {executed.rows.length} output rows. No collapse.</>}
              {status === "error" && <>Fix the highlighted query issue and run again.</>}
            </div>
          </section>
        </div>

        <div className="wf-explain-grid">
          <section className="wf-execution">
            <h4><Sparkles size={17}/> What is happening?</h4>
            <ol>
              <li className={step >= 0 ? "wf-step-active" : ""}><span>1</span><div><strong>Read rows</strong><p>Start with the three order records.</p></div></li>
              <li className={step >= 1 ? "wf-step-active" : ""}><span>2</span><div><strong>Build each window</strong><p>{scenario.explanation}</p></div></li>
              <li className={step >= 2 ? "wf-step-active" : ""}><span>3</span><div><strong>Attach the value</strong><p>The calculated value is written beside each original row.</p></div></li>
            </ol>
          </section>
          <section className="wf-compare">
            <h4>GROUP BY vs Window Function</h4>
            <div className="wf-compare-row">
              <article><span>GROUP BY</span><strong>3 rows → 2 groups</strong><p>Replaces detail rows with summary rows.</p></article>
              <ArrowRight size={18}/>
              <article className="wf-compare-window"><span>WINDOW</span><strong>3 rows → 3 rows</strong><p>Keeps detail rows and adds calculated context.</p></article>
            </div>
          </section>
        </div>
      </section>

      <div className="sql-callout-pair">
        <section className="sql-compact-callout">
          <h3><Lightbulb size={19}/> Why it matters</h3>
          <p>{lesson.concepts[1][1]}</p>
        </section>
        <section className="sql-compact-callout sql-remember">
          <h3><TriangleAlert size={19}/> Remember</h3>
          <p><GlossaryText>{guide.remember}</GlossaryText></p>
          {guide.related && <button type="button" onClick={() => onLesson(guide.related![0])}>{guide.related[1]} →</button>}
        </section>
      </div>

      <section className="sql-compact-callout sql-takeaway">
        <h3><CheckCircle2 size={19}/> Key Takeaway</h3>
        <p>{guide.takeaway}</p>
        <nav className="spark-actions" aria-label="Continue learning">
          <button type="button" onClick={() => onTab("Examples")}>Explore Examples →</button>
          <button type="button" onClick={() => onTab("Hands-on")}>Practice Window Functions →</button>
        </nav>
      </section>
    </div>
  );
}
