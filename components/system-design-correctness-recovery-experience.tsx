"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  AlertTriangle, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  Circle, Clock3, Database, GraduationCap, Lightbulb, Network, Play,
  RefreshCcw, Server, Settings2, ShieldCheck, ShoppingCart, Sparkles,
  UserRound, Warehouse, Zap
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useCompanion } from "@/components/companion-context";
import {
  correctnessScenarios,
  getCorrectnessScenario,
  simulateCorrectness,
  type CorrectnessResult,
  type CorrectnessScenarioId,
  type FailureMode,
} from "@/lib/system-design-correctness-recovery-simulation";

export function SystemCorrectnessRecoveryHero({
  description,
  minutes,
  currentLesson,
  total,
  onPrevious,
  onNext,
}: {
  description: string;
  minutes: number;
  currentLesson: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <section className="sdcr-hero">
      <div>
        <div className="sdcr-breadcrumb">
          <span>System Design</span><ChevronRight size={14}/><strong>Correctness, Idempotency &amp; Recovery</strong>
        </div>
        <div className="sdcr-title-row">
          <span className="sdcr-hero-icon"><Zap size={28}/></span>
          <div><h1>Correctness, Idempotency &amp; Recovery</h1><p>{description}</p></div>
        </div>
        <div className="sdcr-meta">
          <span><Clock3 size={14}/>{minutes} min</span>
          <span><GraduationCap size={14}/>Lesson {currentLesson + 1}/{total}</span>
          <span className="sdcr-level">Intermediate</span>
        </div>
      </div>
      <div className="sdcr-hero-actions">
        <button type="button" onClick={onPrevious} aria-label="Previous lesson"><ChevronLeft size={18}/></button>
        <button type="button" onClick={onNext} disabled={currentLesson === total - 1}>Next <ChevronRight size={17}/></button>
      </div>
    </section>
  );
}

function FailurePicker({
  value,
  onChange,
}: {
  value: FailureMode;
  onChange: (value: FailureMode) => void;
}) {
  const items: Array<[FailureMode, string]> = [
    ["none", "No Failure"],
    ["worker-crash", "Worker Crash"],
    ["network-timeout", "Network Timeout"],
    ["duplicate-events", "Duplicate Events"],
  ];
  return (
    <div className="sdcr-failure-box">
      <header><AlertTriangle size={16}/><strong>Simulate Failure</strong></header>
      <div>
        {items.map(([id, label]) => (
          <button type="button" key={id} className={value === id ? "is-active" : ""} onClick={() => onChange(id)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: string;
}) {
  return (
    <article className={"sdcr-metric " + tone}>
      <span>{icon}</span>
      <div><small>{label}</small><strong>{value}</strong><em>{detail}</em></div>
    </article>
  );
}

const previewRows = [
  ["1001", "U123", "299.00", "COMPLETED", "2026-10-01 10:24:01", "2026-10-01 10:24:04"],
  ["1002", "U456", "149.00", "COMPLETED", "2026-10-01 10:24:02", "2026-10-01 10:24:04"],
  ["1003", "U789", "499.00", "COMPLETED", "2026-10-01 10:24:03", "2026-10-01 10:24:08"],
  ["1004", "U234", "89.00", "COMPLETED", "2026-10-01 10:24:05", "2026-10-01 10:24:08"],
  ["1005", "U567", "159.00", "COMPLETED", "2026-10-01 10:24:06", "2026-10-01 10:24:08"],
];

export function SystemCorrectnessRecoveryLab() {
  const companion = useCompanion();
  const [scenarioId, setScenarioId] = useState<CorrectnessScenarioId>("worker-retry");
  const scenario = useMemo(() => getCorrectnessScenario(scenarioId), [scenarioId]);
  const [failureMode, setFailureMode] = useState<FailureMode>("worker-crash");
  const [result, setResult] = useState<CorrectnessResult>(() =>
    simulateCorrectness(getCorrectnessScenario("worker-retry"), "worker-crash"),
  );
  const [running, setRunning] = useState(false);
  const [logFilter, setLogFilter] = useState<"all" | "retry" | "dedupe">("all");

  const chooseScenario = (id: CorrectnessScenarioId) => {
    const next = getCorrectnessScenario(id);
    setScenarioId(id);
    setFailureMode(id === "worker-retry" ? "worker-crash" : id === "network-timeout" ? "network-timeout" : "duplicate-events");
    const mode: FailureMode = id === "worker-retry" ? "worker-crash" : id === "network-timeout" ? "network-timeout" : "duplicate-events";
    setResult(simulateCorrectness(next, mode));
  };

  const reset = () => chooseScenario("worker-retry");

  const run = () => {
    setRunning(true);
    window.setTimeout(() => {
      const next = simulateCorrectness(scenario, failureMode);
      setResult(next);
      setRunning(false);
      companion?.emit({ type: "exercise_correct", lesson: "Correctness, Idempotency & Recovery", source: "runner" });
    }, 320);
  };

  const logs = result.logs.filter(line =>
    logFilter === "all"
      ? true
      : logFilter === "retry"
        ? line.includes("[RETRY]") || line.includes("[FAILURE]") || line.includes("[TIMEOUT]")
        : line.includes("[DEDUPE]") || line.includes("(dup)"),
  );

  return (
    <section className="sdcr-lab">
      <header className="sdcr-sim-header">
        <div className="sdcr-sim-heading">
          <span><Play size={20} fill="currentColor"/></span>
          <div><h2>Interactive Simulation</h2><p>Trigger failures, retries, and duplicates to see how idempotency, checkpoints, and recovery keep data correct.</p></div>
        </div>
        <div className="sdcr-toolbar">
          <button type="button" className="sdcr-reset" onClick={reset}><RefreshCcw size={15}/>Reset</button>
          <button type="button" className="sdcr-run" onClick={run} disabled={running}><Play size={15} fill="currentColor"/>{running ? "Running…" : "Run Simulation"}</button>
          <label className="sdcr-scenario">
            <span>{scenario.label}</span>
            <select value={scenarioId} onChange={event => chooseScenario(event.target.value as CorrectnessScenarioId)}>
              {correctnessScenarios.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <ChevronDown size={14}/>
          </label>
        </div>
      </header>

      <div className="sdcr-workspace">
        <div className="sdcr-left">
          <section className="sdcr-pipeline">
            <h3>1. Data Pipeline (Simulated)</h3>
            <FailurePicker value={failureMode} onChange={setFailureMode}/>
            <div className="sdcr-pipeline-flow">
              <article className="source">
                <header>Event Source</header>
                <div><ShoppingCart size={16}/>Orders</div>
                <div><Database size={16}/>Payments</div>
                <div><UserRound size={16}/>User Events</div>
                <div><Server size={16}/>Inventory</div>
              </article>
              <span className="sdcr-flow-arrow">→</span>
              <article className="ingest">
                <header>Stream Ingestion</header>
                <Network size={35}/>
                <strong>Kafka</strong>
                <small>At-least-once delivery</small>
              </article>
              <span className="sdcr-flow-arrow">→</span>
              <article className="process">
                <header>Processing</header>
                <Settings2 size={35}/>
                <strong>Spark</strong>
                <small>May retry on failure</small>
              </article>
              <span className="sdcr-flow-arrow">→</span>
              <article className="sink">
                <header>Sink</header>
                <Warehouse size={36}/>
                <strong>Data Warehouse</strong>
                <small>Idempotent writes<br/>(MERGE / UPSERT)</small>
              </article>
              <div className="sdcr-retry-loop">↶ <span>Retry (same events)</span></div>
            </div>
          </section>

          <section className="sdcr-results">
            <h3>3. Results &amp; Metrics</h3>
            <div className="sdcr-metrics-grid">
              <Metric tone="blue" icon={<Database size={19}/>} label="Total Events" value={result.totalEvents.toLocaleString()} detail="↑ 0%"/>
              <Metric tone="green" icon={<CheckCircle2 size={19}/>} label="Processed (Unique)" value={result.processedUnique.toLocaleString()} detail={"↑ " + ((result.processedUnique / result.totalEvents) * 100).toFixed(1) + "%"}/>
              <Metric tone="pink" icon={<Circle size={19}/>} label="Duplicates Received" value={result.duplicatesReceived.toLocaleString()} detail={"↑ " + ((result.duplicatesReceived / result.totalEvents) * 100).toFixed(1) + "%"}/>
              <Metric tone="orange" icon={<AlertTriangle size={19}/>} label="Failed (DLQ)" value={result.failedDlq.toLocaleString()} detail={"↓ " + ((result.failedDlq / result.totalEvents) * 100).toFixed(1) + "%"}/>
            </div>
          </section>

          <section className="sdcr-preview">
            <h3>4. Sink Data Preview (Deduplicated &amp; Correct)</h3>
            <table>
              <thead><tr><th>order_id</th><th>user_id</th><th>amount</th><th>status</th><th>event_time</th><th>processed_at</th></tr></thead>
              <tbody>{previewRows.map(row => <tr key={row[0]}>{row.map((cell, index) => <td key={index}>{index === 3 ? <span className="sdcr-status">{cell}</span> : cell}</td>)}</tr>)}</tbody>
            </table>
          </section>
        </div>

        <div className="sdcr-right">
          <section className="sdcr-logs">
            <header><h3>2. Event Flow (Live)</h3><label><select value={logFilter} onChange={event => setLogFilter(event.target.value as "all" | "retry" | "dedupe")}><option value="all">All Events</option><option value="retry">Retry / Failure</option><option value="dedupe">Duplicates</option></select><ChevronDown size={13}/></label></header>
            <pre>{logs.map((line, index) => <span key={index}><time>10:24:{String(index + 1).padStart(2, "0")}</time>{line}</span>)}</pre>
          </section>

          <section className="sdcr-takeaways">
            <h3>5. Key Takeaways (from Simulation)</h3>
            {result.takeaways.map((item, index) => (
              <div className={"tone-" + index} key={item}>
                <span>{index === 0 ? <Check size={15}/> : index === 1 ? <ShieldCheck size={15}/> : index === 2 ? <AlertTriangle size={15}/> : <Circle size={15}/>}</span>
                <p>{item}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </section>
  );
}

export function SystemCorrectnessRecoveryRightRail({
  lessonTitles, currentLesson, completed, onLesson, onNotes,
}: {
  lessonTitles: string[];
  currentLesson: number;
  completed: number[];
  onLesson: (lesson: string) => void;
  onNotes: () => void;
}) {
  return (
    <div className="sdcr-right-rail">
      <section className="sdcr-progress-card">
        <header><strong>Lesson Progress <ChevronDown size={14}/></strong><span>{completed.length} / {lessonTitles.length} done</span></header>
        <Progress value={completed.length / lessonTitles.length * 100} className="sdcr-progress"/>
        <div className="sdcr-progress-list">
          {lessonTitles.map((lesson, index) => {
            const done = completed.includes(index);
            const current = index === currentLesson;
            return <button type="button" key={lesson} className={current ? "is-current" : ""} onClick={() => onLesson(lesson)}>
              {done ? <CheckCircle2 size={17}/> : current ? <Play size={17} fill="currentColor"/> : <Circle size={17}/>}
              <span>{index + 1}. {lesson}</span>
              <small>{done ? "Completed" : current ? "Learning" : "Not started"}</small>
            </button>;
          })}
        </div>
      </section>

      <section className="sdcr-notes-card">
        <header><Lightbulb size={18}/><strong>Quick Notes</strong><button type="button" onClick={onNotes}>+ Add Note</button></header>
        <p>Jot down key points, questions, or your own notes…</p>
        <div className="sdcr-notes-visual">
          <div><Sparkles size={18}/><span>Retry-safe design means duplicates are expected, not surprising.</span></div>
          <Image src="/nila-avatar.png" alt="Mithoo learning companion" width={88} height={108}/>
        </div>
      </section>
    </div>
  );
}
