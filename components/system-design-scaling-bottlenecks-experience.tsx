"use client";
import {useSystemDesignMotion} from "@/components/system-design-motion";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  AlertTriangle, BarChart3, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  Circle, Clock3, Database, Gauge, GraduationCap, Lightbulb, Network, Play,
  RefreshCcw, Server, Settings2, Sparkles, Zap
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useCompanion } from "@/components/companion-context";
import {
  comparisonRows,
  getScalingScenario,
  scalingScenarios,
  simulateScaling,
  type ScalingResult,
  type ScalingScenarioId,
} from "@/lib/system-design-scaling-bottlenecks-simulation";

export function SystemScalingBottlenecksHero({
  description, minutes, currentLesson, total, onPrevious, onNext,
}: {
  description: string;
  minutes: number;
  currentLesson: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return <section className="sdsb-hero">
    <div>
      <div className="sdsb-breadcrumb"><span>System Design</span><ChevronRight size={14}/><strong>Scaling, Partitioning &amp; Bottlenecks</strong></div>
      <div className="sdsb-title-row"><span className="sdsb-hero-icon"><Zap size={28}/></span><div><h1>Scaling, Partitioning &amp; Bottlenecks</h1><p>{description}</p></div></div>
      <div className="sdsb-meta"><span><Clock3 size={14}/>{minutes} min</span><span><GraduationCap size={14}/>Lesson {currentLesson + 1}/{total}</span><span className="sdsb-level">Intermediate</span></div>
    </div>
    <div className="sdsb-hero-actions"><button type="button" onClick={onPrevious}><ChevronLeft size={18}/></button><button type="button" onClick={onNext} disabled={currentLesson === total - 1}>Next <ChevronRight size={17}/></button></div>
  </section>;
}

function SliderCard({
  title, subtitle, value, min, max, step, onChange, tone, icon,
}: {
  title: string;
  subtitle: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  tone: string;
  icon: React.ReactNode;
}) {
  return <article className={"sdsb-slider-card " + tone}>
    <div className="sdsb-slider-top"><span>{icon}</span><div><strong>{title}</strong><small>{subtitle}</small></div></div>
    <b>{title === "Source" ? Math.round(value / 1000) + "K events/min" : title === "Partitioning" ? "Partitions: " + value : title === "Processing" ? "Workers: " + value : "Write rate: " + Math.round(value / 1000) + "K"}</b>
    <input type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))}/>
    <div className="sdsb-range-labels"><span>{title === "Source" || title === "Sink" ? "10K" : min}</span><span>{title === "Source" || title === "Sink" ? "100K" : value}</span><span>{title === "Source" || title === "Sink" ? "500K" : max}</span></div>
  </article>;
}

function ThroughputChart({ result }: { result: ScalingResult }) {
  const width = 470;
  const height = 150;
  const maxValue = Math.max(160, ...result.inputSeries, ...result.processedSeries, ...result.lagSeries);
  const makePoints = (values: number[]) => values.map((value, index) => {
    const x = 10 + (index / (values.length - 1)) * (width - 20);
    const y = height - 12 - (value / maxValue) * (height - 28);
    return x.toFixed(1) + "," + y.toFixed(1);
  }).join(" ");
  return <section className="sdsb-chart">
    <h3>2. Throughput &amp; Lag (Live)</h3>
    <div className="sdsb-chart-legend"><span className="input">● Input Rate</span><span className="processed">● Processed Rate</span><span className="lag">● Consumer Lag</span></div>
    <svg viewBox={"0 0 " + width + " " + height} role="img" aria-label="Throughput and lag line chart">
      {[25,60,95,130].map(y => <line key={y} x1="10" x2={width-10} y1={y} y2={y} className="grid"/>)}
      <polyline points={makePoints(result.inputSeries)} className="line input"/>
      <polyline points={makePoints(result.processedSeries)} className="line processed"/>
      <polyline points={makePoints(result.lagSeries)} className="line lag"/>
      <rect x="250" y="5" width="80" height={height-15} className="hot-zone"/>
      <line x1="278" x2="278" y1="6" y2={height-8} className="hot-line"/>
      <text x="285" y="18">Bottleneck</text>
    </svg>
    <div className="sdsb-time-axis"><span>10:24</span><span>10:25</span><span>10:26</span><span>10:27</span><span>10:28</span><span>10:29</span></div>
  </section>;
}

function PartitionBars({ result }: { result: ScalingResult }) {
  const max = Math.max(...result.partitionLoads, 1);
  return <section className="sdsb-partitions">
    <h3>3. Partition Load Distribution</h3>
    <div className="sdsb-bar-area">
      {result.partitionLoads.slice(0, 12).map((load, index) => <div className={"sdsb-bar-item " + (result.hotspotPartition === index ? "hot" : "")} key={index}>
        <span className="sdsb-bar-value">{Math.round(load / 1000)}K</span>
        <i style={{ height: Math.max(12, (load / max) * 115) }}/>
        <b>P{index}</b>
      </div>)}
    </div>
  </section>;
}

function Metric({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: string; detail: string; tone: string }) {
  return <article className={"sdsb-metric " + tone}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{detail}</em></div></article>;
}

export function SystemScalingBottlenecksLab() {
  const motion=useSystemDesignMotion("scaling");
  const companion = useCompanion();
  const [scenarioId, setScenarioId] = useState<ScalingScenarioId>("partition-skew");
  const scenario = useMemo(() => getScalingScenario(scenarioId), [scenarioId]);
  const [sourceRate, setSourceRate] = useState(100_000);
  const [partitions, setPartitions] = useState(6);
  const [workers, setWorkers] = useState(4);
  const [sinkRate, setSinkRate] = useState(100_000);
  const [result, setResult] = useState<ScalingResult>(() => simulateScaling(getScalingScenario("partition-skew"), 100_000, 6, 4, 100_000));
  const [running, setRunning] = useState(false);
  const [highlight, setHighlight] = useState(false);

  const chooseScenario = (id: ScalingScenarioId) => {
    const next = getScalingScenario(id);
    setScenarioId(id);
    setSourceRate(next.sourceRate);
    setPartitions(next.partitions);
    setWorkers(next.workers);
    setSinkRate(next.sinkRate);
    setResult(simulateScaling(next, next.sourceRate, next.partitions, next.workers, next.sinkRate));
    setHighlight(false);
  };

  const reset = () => chooseScenario("partition-skew");

  const run = () => {
    setRunning(true);
    window.setTimeout(() => {
      setResult(simulateScaling(scenario, sourceRate, partitions, workers, sinkRate));
      setRunning(false);
      companion?.emit({ type: "exercise_correct", lesson: "Scaling, Partitioning & Bottlenecks", source: "runner" });
    }, 320);
  };

  return <section {...motion} className="sdsb-lab">
    <header className="sdsb-sim-header">
      <div className="sdsb-sim-heading"><span><Play size={20} fill="currentColor"/></span><div><h2>Interactive Simulation</h2><p>Adjust load, partitions, and workers to see how throughput changes and where bottlenecks occur.</p></div></div>
      <div className="sdsb-toolbar">
        <button type="button" className="sdsb-reset" onClick={reset}><RefreshCcw size={15}/>Reset</button>
        <button type="button" className="sdsb-run" onClick={run} disabled={running}><Play size={15} fill="currentColor"/>{running ? "Running…" : "Run Simulation"}</button>
        <label className="sdsb-scenario"><span>{scenario.label}</span><select value={scenarioId} onChange={event => chooseScenario(event.target.value as ScalingScenarioId)}>{scalingScenarios.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}</select><ChevronDown size={14}/></label>
      </div>
    </header>

    <div className="sdsb-content">
      <section className="sdsb-pipeline">
        <h3>1. Data Pipeline (Live Simulation)</h3>
        <div className="sdsb-pipeline-grid">
          <SliderCard title="Source" subtitle="(Events)" value={sourceRate} min={10_000} max={500_000} step={10_000} onChange={setSourceRate} tone="blue" icon={<Database size={24}/>}/>
          <span className="sdsb-arrow">→</span>
          <SliderCard title="Partitioning" subtitle="(Kafka)" value={partitions} min={1} max={24} step={1} onChange={setPartitions} tone={highlight ? "red pulse" : "red"} icon={<Network size={24}/>}/>
          <span className="sdsb-arrow">→</span>
          <SliderCard title="Processing" subtitle="(Spark Streaming)" value={workers} min={1} max={16} step={1} onChange={setWorkers} tone="purple" icon={<Settings2 size={24}/>}/>
          <span className="sdsb-arrow">→</span>
          <SliderCard title="Sink" subtitle="(Data Warehouse)" value={sinkRate} min={10_000} max={500_000} step={10_000} onChange={setSinkRate} tone="green" icon={<Database size={24}/>}/>
          <span className="sdsb-arrow">→</span>
          <aside className="sdsb-detector"><header><AlertTriangle size={16}/>Bottleneck Detector</header><span>Current bottleneck:</span><strong>{result.bottleneck}</strong><button type="button" onClick={() => setHighlight(value => !value)}>Highlight in flow</button></aside>
        </div>
      </section>

      <div className="sdsb-mid-grid">
        <ThroughputChart result={result}/>
        <PartitionBars result={result}/>
        <section className="sdsb-processing-metrics"><h3>4. Processing Metrics</h3><div>
          <Metric tone="green" icon={<Gauge size={18}/>} label="Throughput" value={result.throughput.toLocaleString()} detail="events/min · ↑ 12%"/>
          <Metric tone="blue" icon={<Clock3 size={18}/>} label="End-to-End Latency" value={result.latencySec.toFixed(1) + " sec"} detail="↑ 60%"/>
          <Metric tone="orange" icon={<BarChart3 size={18}/>} label="Consumer Lag" value={result.consumerLag.toLocaleString()} detail="events · ↑ 120%"/>
          <Metric tone="purple" icon={<Circle size={18}/>} label="Failed Records" value={result.failedRecords.toLocaleString()} detail={"(" + ((result.failedRecords / Math.max(1, result.throughput)) * 100).toFixed(1) + "%) · ↑ 0.1%"}/>
        </div></section>
      </div>

      <div className="sdsb-bottom-grid">
        <section className="sdsb-compare">
          <h3>5. Compare Configurations</h3>
          <table><thead><tr><th>Configuration</th><th>Partitions</th><th>Workers</th><th>Throughput<br/>(events/min)</th><th>End-to-End<br/>Latency</th><th>Consumer Lag</th><th>Status</th></tr></thead>
            <tbody>{comparisonRows.map((row, index) => <tr key={row.label} className={index === 0 ? "current" : index === 3 ? "best" : ""}><td>{row.label}</td><td>{row.partitions}</td><td>{row.workers}</td><td>{row.throughput}</td><td>{row.latency}</td><td>{row.lag}</td><td><span>{row.status}</span></td></tr>)}</tbody>
          </table>
        </section>

        <section className="sdsb-takeaways"><h3>6. Key Takeaways</h3>
          <div><CheckCircle2 size={17}/><span>Partition data to avoid hot keys and skew.</span></div>
          <div><CheckCircle2 size={17}/><span>Add workers only when the bottleneck is in processing (not source or sink).</span></div>
          <div><AlertTriangle size={17}/><span>Monitor consumer lag, not just CPU.</span></div>
          <div><Circle size={17}/><span>Use backpressure or rate limiting instead of blindly scaling workers.</span></div>
        </section>
      </div>
    </div>
  </section>;
}

export function SystemScalingBottlenecksRightRail({
  lessonTitles, currentLesson, completed, onLesson, onNotes,
}: {
  lessonTitles: string[];
  currentLesson: number;
  completed: number[];
  onLesson: (lesson: string) => void;
  onNotes: () => void;
}) {
  return <div className="sdsb-right-rail">
    <section className="sdsb-progress-card"><header><strong>Lesson Progress <ChevronDown size={14}/></strong><span>{completed.length} / {lessonTitles.length} done</span></header><Progress value={completed.length / lessonTitles.length * 100} className="sdsb-progress"/><div className="sdsb-progress-list">{lessonTitles.map((lesson, index) => { const done=completed.includes(index), current=index===currentLesson; return <button type="button" key={lesson} className={current ? "is-current" : ""} onClick={() => onLesson(lesson)}>{done ? <CheckCircle2 size={17}/> : current ? <Play size={17} fill="currentColor"/> : <Circle size={17}/>}<span>{index + 1}. {lesson}</span><small>{done ? "Completed" : current ? "Learning" : "Not started"}</small></button>; })}</div></section>
    <section className="sdsb-notes-card"><header><Lightbulb size={18}/><strong>Quick Notes</strong><button type="button" onClick={onNotes}>+ Add Note</button></header><p>Jot down key points, questions, or your own notes…</p><div className="sdsb-notes-visual"><div><Sparkles size={18}/><span>Scale the constrained stage, not the loudest metric.</span></div><Image src="/nila-avatar.png" alt="Mithoo learning companion" width={88} height={108}/></div></section>
  </div>;
}
