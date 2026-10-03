"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  BarChart3, CalendarClock, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  Circle, Clock3, Database, Gauge, GraduationCap, Layers3, Lightbulb, Network,
  Play, RefreshCcw, Server, Settings2, Sparkles, ToggleLeft, Zap
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useCompanion } from "@/components/companion-context";
import {
  batchStreamingScenarios,
  defaultBatchStreamingOptions,
  getBatchStreamingScenario,
  simulateBatchStreaming,
  type BatchStreamingOptions,
  type BatchStreamingResult,
  type BatchStreamingScenarioId,
} from "@/lib/system-design-batch-streaming-simulation";

export function SystemBatchStreamingHero({
  description, minutes, currentLesson, total, onPrevious, onNext,
}: {
  description: string;
  minutes: number;
  currentLesson: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return <section className="sdbs-hero">
    <div>
      <div className="sdbs-breadcrumb"><span>System Design</span><ChevronRight size={14}/><strong>Batch vs Streaming Architecture</strong></div>
      <div className="sdbs-title-row">
        <span className="sdbs-hero-icon"><Zap size={28}/></span>
        <div><h1>Batch vs Streaming Architecture</h1><p>{description}</p></div>
      </div>
      <div className="sdbs-meta">
        <span><Clock3 size={14}/>{minutes} min</span>
        <span><GraduationCap size={14}/>Lesson {currentLesson + 1}/{total}</span>
        <span className="sdbs-level">Intermediate</span>
      </div>
    </div>
    <div className="sdbs-hero-actions">
      <button type="button" onClick={onPrevious}><ChevronLeft size={18}/></button>
      <button type="button" onClick={onNext} disabled={currentLesson === total - 1}>Next <ChevronRight size={17}/></button>
    </div>
  </section>;
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return <button type="button" className="sdbs-toggle-row" onClick={onChange} aria-pressed={checked}>
    <span className={"sdbs-switch " + (checked ? "is-on" : "")}><i/></span><span>{label}</span>
  </button>;
}

function ArchitectureRow({
  streaming,
  result,
}: {
  streaming: boolean;
  result: BatchStreamingResult;
}) {
  const nodes = streaming ? [
    ["Source", "Kafka Topic"],
    ["Stream Ingest", "Kafka"],
    ["Stream Process", "Flink / Spark Streaming"],
    ["Store", "Online Store (ClickHouse)"],
    ["Real-time Dashboard", "Live Metrics"],
  ] : [
    ["Source", "Orders DB"],
    ["Batch Extract", "Every 1 hour"],
    ["Transform", "Spark Job"],
    ["Store", "Data Warehouse"],
    ["Analyze", "BI Dashboard"],
  ];
  return <section className={"sdbs-arch-row " + (streaming ? "streaming" : "batch")}>
    <header><span className="sdbs-arch-icon">{streaming ? <Network size={18}/> : <Clock3 size={18}/>}</span><strong>{streaming ? "Streaming Architecture" : "Batch Architecture"}</strong><em>{streaming ? "(Real-time)" : "(Scheduled)"}</em></header>
    <div className="sdbs-arch-body">
      <div className="sdbs-node-chain">
        {nodes.map(([title, subtitle], index) => <div className="sdbs-chain-fragment" key={title}>
          <article><span>{index === 0 ? <Database size={19}/> : index === 1 ? <Network size={19}/> : index === 2 ? <Settings2 size={19}/> : index === 3 ? <Server size={19}/> : <BarChart3 size={19}/>}</span><div><b>{title}</b><small>{subtitle}</small></div></article>
          {index < nodes.length - 1 && <span className="sdbs-chain-arrow">→</span>}
        </div>)}
      </div>
      <aside>
        <div><Clock3 size={17}/><span>Latency</span><b>{streaming ? result.streamLatencySeconds.toFixed(1) + " seconds" : "~ 1 hour"}</b></div>
        <div><Gauge size={17}/><span>Throughput</span><b>High</b></div>
        <div><CalendarClock size={17}/><span>Freshness</span><b>{streaming ? "Real-time" : "Hourly"}</b></div>
      </aside>
    </div>
  </section>;
}

function MiniMetric({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: string; detail: string; tone: string }) {
  return <article className={"sdbs-mini " + tone}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{detail}</em></div></article>;
}

export function SystemBatchStreamingLab() {
  const companion = useCompanion();
  const [scenarioId, setScenarioId] = useState<BatchStreamingScenarioId>("ecommerce-orders");
  const scenario = useMemo(() => getBatchStreamingScenario(scenarioId), [scenarioId]);
  const [incoming, setIncoming] = useState(10_000);
  const [options, setOptions] = useState<BatchStreamingOptions>({ ...defaultBatchStreamingOptions });
  const [result, setResult] = useState(() => simulateBatchStreaming(getBatchStreamingScenario("ecommerce-orders"), 10_000, defaultBatchStreamingOptions));
  const [running, setRunning] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [logFilter, setLogFilter] = useState<"all" | "stream" | "batch">("all");

  const chooseScenario = (id: BatchStreamingScenarioId) => {
    const next = getBatchStreamingScenario(id);
    setScenarioId(id);
    setIncoming(next.incomingEventsPerMinute);
    setOptions({ ...defaultBatchStreamingOptions });
    setResult(simulateBatchStreaming(next, next.incomingEventsPerMinute, defaultBatchStreamingOptions));
  };

  const reset = () => chooseScenario("ecommerce-orders");

  const run = () => {
    setRunning(true);
    window.setTimeout(() => {
      const next = simulateBatchStreaming(scenario, incoming, options);
      setResult(next);
      setRunning(false);
      companion?.emit({ type: "exercise_correct", lesson: "Batch vs Streaming Architecture", source: "runner" });
    }, 320);
  };

  const logs = result.logs.filter(line =>
    logFilter === "all" ? true : logFilter === "stream" ? !line.includes("[BATCH]") : line.includes("[BATCH]"),
  );

  return <section className="sdbs-lab">
    <header className="sdbs-sim-header">
      <div className="sdbs-sim-heading"><span><Play size={20} fill="currentColor"/></span><div><h2>Interactive Simulation</h2><p>Run and compare batch vs streaming for the same use case. Adjust parameters and see how data flows, latency, and results differ.</p></div></div>
      <div className="sdbs-toolbar">
        <button type="button" className="sdbs-reset" onClick={reset}><RefreshCcw size={15}/>Reset</button>
        <button type="button" className="sdbs-run" onClick={run} disabled={running}><Play size={15} fill="currentColor"/>{running ? "Running…" : "Run Simulation"}</button>
        <label className="sdbs-scenario"><span>{scenario.label}</span><select value={scenarioId} onChange={e => chooseScenario(e.target.value as BatchStreamingScenarioId)}>{batchStreamingScenarios.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select><ChevronDown size={14}/></label>
      </div>
    </header>

    <div className="sdbs-workspace">
      <section className="sdbs-config">
        <h3><Settings2 size={15}/>1. Configure Scenario</h3><p>Adjust the inputs and see how batch vs streaming behave.</p>
        <label className="sdbs-field"><span>Data Source</span><div><Database size={15}/><select value={scenarioId} onChange={e => chooseScenario(e.target.value as BatchStreamingScenarioId)}>{batchStreamingScenarios.map(item => <option key={item.id} value={item.id}>{item.dataSource}</option>)}</select><ChevronDown size={13}/></div></label>
        <label className="sdbs-field"><span>Incoming Events / Minute</span><div><input type="number" min={1} value={incoming} onChange={e => setIncoming(Number(e.target.value) || 1)}/><small>{incoming >= 10_000 ? "High" : "Moderate"}</small></div></label>
        <label className="sdbs-field"><span>Order Value Range</span><div><span className="sdbs-static-value">{scenario.orderRange}</span></div></label>
        <label className="sdbs-field"><span>Analysis Type</span><div><span className="sdbs-static-value">{scenario.analysisType}</span><ChevronDown size={13}/></div></label>
        <div className="sdbs-toggles">
          <ToggleRow label="Enable Late Arriving Events" checked={options.lateEvents} onChange={() => setOptions(v => ({ ...v, lateEvents: !v.lateEvents }))}/>
          <ToggleRow label="Enable Out-of-Order Events" checked={options.outOfOrder} onChange={() => setOptions(v => ({ ...v, outOfOrder: !v.outOfOrder }))}/>
          <ToggleRow label="Simulate Failures" checked={options.failures} onChange={() => setOptions(v => ({ ...v, failures: !v.failures }))}/>
        </div>
        <button type="button" className="sdbs-advanced" onClick={() => setAdvanced(v => !v)}><Settings2 size={15}/>Advanced Options<ChevronRight size={14}/></button>
        {advanced && <div className="sdbs-advanced-panel"><span>Batch window: <b>{scenario.batchWindowMinutes} min</b></span><span>Allowed lateness: <b>{options.lateEvents ? "enabled" : "disabled"}</b></span><span>Ordering policy: <b>{options.outOfOrder ? "event-time" : "arrival-time"}</b></span></div>}
      </section>

      <div className="sdbs-main">
        <section className="sdbs-architecture"><h3>2. Architecture Comparison (Live Simulation)</h3><ArchitectureRow streaming={false} result={result}/><ArchitectureRow streaming result={result}/></section>
        <div className="sdbs-bottom">
          <section className="sdbs-results">
            <header><h3>3. Real-time Results</h3><span><CheckCircle2 size={14}/>Running</span></header>
            <div className="sdbs-result-columns">
              <div><h4>Batch</h4><MiniMetric tone="blue" icon={<Database size={17}/>} label="Total Orders" value={result.batchOrders.toLocaleString()} detail="(last 1 hour)"/><MiniMetric tone="blue" icon={<Clock3 size={17}/>} label="Avg Latency" value="~ 1 hour" detail=""/><MiniMetric tone="blue" icon={<CalendarClock size={17}/>} label="Data Freshness" value={result.batchFreshnessMinutes + " min"} detail=""/></div>
              <div><h4>Streaming</h4><MiniMetric tone="pink" icon={<Network size={17}/>} label="Total Orders" value={result.streamingOrders.toLocaleString()} detail="(so far)"/><MiniMetric tone="pink" icon={<Clock3 size={17}/>} label="Avg Latency" value={result.streamLatencySeconds.toFixed(1) + " sec"} detail=""/><MiniMetric tone="pink" icon={<CalendarClock size={17}/>} label="Data Freshness" value="Real-time" detail=""/></div>
            </div>
          </section>

          <section className="sdbs-logs"><header><h3>4. Event Flow (Live)</h3><label><select value={logFilter} onChange={e => setLogFilter(e.target.value as "all" | "stream" | "batch")}><option value="all">All Events</option><option value="stream">Streaming</option><option value="batch">Batch</option></select><ChevronDown size={13}/></label></header><pre>{logs.map((line, index) => <span key={index}><time>10:24:{String(index + 1).padStart(2, "0")}</time>{line}</span>)}</pre></section>

          <section className="sdbs-compare"><header><h3>5. Compare Results</h3><span>Key Metrics</span></header><table><thead><tr><th>Metric</th><th>Batch</th><th>Streaming</th></tr></thead><tbody>
            <tr><td>Latency</td><td>~ 1 hour</td><td>{result.streamLatencySeconds.toFixed(1)} sec</td></tr>
            <tr><td>Freshness</td><td>Hourly</td><td className="good">Real-time</td></tr>
            <tr><td>Throughput</td><td className="good">High</td><td className="good">High</td></tr>
            <tr><td>Use Case</td><td>Reports, BI</td><td>Live dashboards</td></tr>
            <tr><td>Cost</td><td>Lower</td><td>Higher</td></tr>
            <tr><td>Complexity</td><td>Lower</td><td>Higher</td></tr>
          </tbody></table></section>
        </div>
      </div>
    </div>
  </section>;
}

export function SystemBatchStreamingRightRail({
  lessonTitles, currentLesson, completed, onLesson, onNotes,
}: {
  lessonTitles: string[];
  currentLesson: number;
  completed: number[];
  onLesson: (lesson: string) => void;
  onNotes: () => void;
}) {
  return <div className="sdbs-right-rail">
    <section className="sdbs-progress-card"><header><strong>Lesson Progress <ChevronDown size={14}/></strong><span>{completed.length} / {lessonTitles.length} done</span></header><Progress value={completed.length / lessonTitles.length * 100} className="sdbs-progress"/><div className="sdbs-progress-list">{lessonTitles.map((lesson, index) => { const done = completed.includes(index); const current = index === currentLesson; return <button type="button" key={lesson} className={current ? "is-current" : ""} onClick={() => onLesson(lesson)}>{done ? <CheckCircle2 size={17}/> : current ? <Play size={17} fill="currentColor"/> : <Circle size={17}/>}<span>{index + 1}. {lesson}</span><small>{done ? "Completed" : current ? "Learning" : "Not started"}</small></button>; })}</div></section>
    <section className="sdbs-notes-card"><header><Lightbulb size={18}/><strong>Quick Notes</strong><button type="button" onClick={onNotes}>+ Add Note</button></header><p>Jot down key points, questions, or your own notes…</p><div className="sdbs-notes-visual"><div><Sparkles size={18}/><span>Use streaming only when lower latency creates real value.</span></div><Image src="/nila-avatar.png" alt="Mithoo learning companion" width={88} height={108}/></div></section>
  </div>;
}
