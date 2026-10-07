"use client";
import {useSystemDesignMotion} from "@/components/system-design-motion";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  BarChart3, Boxes, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  Circle, Clock3, Database, DollarSign, Gauge, GraduationCap, HardDrive,
  Layers3, Lightbulb, Network, Play, RefreshCcw, Server, Settings2,
  Smartphone, Sparkles, Store, Users, Zap
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useCompanion } from "@/components/companion-context";
import {
  analyticsLabel,
  defaultStorageChoices,
  eventStorageLabel,
  getStorageScenario,
  operationalLabel,
  servingLabel,
  simulateStoragePlatform,
  storageScenarios,
  type AnalyticsStore,
  type EventStorage,
  type OperationalDb,
  type ServingStore,
  type StorageChoices,
  type StorageResult,
  type StorageScenarioId,
} from "@/lib/system-design-storage-modeling-simulation";

export function SystemStorageModelingHero({
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
    <section className="sdsm-hero">
      <div>
        <div className="sdsm-breadcrumb">
          <span>System Design</span><ChevronRight size={14}/><strong>Storage &amp; Data Modeling Choices</strong>
        </div>
        <div className="sdsm-title-row">
          <span className="sdsm-hero-icon"><Zap size={28}/></span>
          <div>
            <h1>Storage &amp; Data Modeling Choices</h1>
            <p>{description}</p>
          </div>
        </div>
        <div className="sdsm-meta">
          <span><Clock3 size={14}/>{minutes} min</span>
          <span><GraduationCap size={14}/>Lesson {currentLesson + 1}/{total}</span>
          <span className="sdsm-level">Intermediate</span>
        </div>
      </div>
      <div className="sdsm-hero-actions">
        <button type="button" onClick={onPrevious} aria-label="Previous lesson"><ChevronLeft size={18}/></button>
        <button type="button" onClick={onNext} disabled={currentLesson === total - 1}>Next <ChevronRight size={17}/></button>
      </div>
    </section>
  );
}

function Architecture({
  choices,
  result,
}: {
  choices: StorageChoices;
  result: StorageResult;
}) {
  return (
    <section className="sdsm-architecture">
      <h3>3. Data Platform Architecture (Live Simulation)</h3>
      <div className="sdsm-architecture-grid">
        <div className="sdsm-stage sdsm-sources">
          <header>Sources</header>
          <div><Store size={18}/><b>Web App</b><small>(Orders)</small></div>
          <div><Smartphone size={18}/><b>Mobile App</b><small>(Events)</small></div>
          <div><DollarSign size={18}/><b>Payment Service</b><small>(Transactions)</small></div>
          <div><Boxes size={18}/><b>Inventory Service</b><small>(Updates)</small></div>
        </div>
        <div className="sdsm-route-labels">
          <span>Batch<br/><small>→</small></span>
          <span>CDC<br/><small>→</small></span>
          <span>Event Stream<br/><small>→</small></span>
        </div>
        <div className="sdsm-stage sdsm-ingestion">
          <header>Ingestion Layer</header>
          <div><Clock3 size={18}/><b>Batch ETL</b><small>(Airflow)</small></div>
          <div><Network size={18}/><b>CDC Pipeline</b><small>(Debezium)</small></div>
          <div><Network size={18}/><b>Stream Ingestion</b><small>(Kafka)</small></div>
        </div>
        <div className="sdsm-arrow">→</div>
        <div className="sdsm-stage sdsm-storage">
          <header>Storage Layer</header>
          <div><HardDrive size={18}/><b>Raw Data</b><small>{eventStorageLabel(choices.eventStorage)}</small></div>
          <div><Layers3 size={18}/><b>Curated Model</b><small>(Iceberg / Delta)</small></div>
          <div><Database size={18}/><b>Metadata</b><small>(Catalog)</small></div>
        </div>
        <div className="sdsm-arrow">→</div>
        <div className="sdsm-stage sdsm-serving">
          <header>Serving Layer</header>
          <div><BarChart3 size={18}/><b>Data Warehouse</b><small>{analyticsLabel(choices.analyticsStore)}</small></div>
          <div><Sparkles size={18}/><b>Feature Store</b><small>(Model Serving)</small></div>
          <div><Server size={18}/><b>Operational Store</b><small>{servingLabel(choices.servingStore)}</small></div>
        </div>
        <div className="sdsm-arrow">→</div>
        <div className="sdsm-stage sdsm-consumers">
          <header>Consumers</header>
          <div><BarChart3 size={18}/><b>BI Analysts</b><small>(Dashboards)</small></div>
          <div><Sparkles size={18}/><b>Data Scientists</b><small>(ML/AI)</small></div>
          <div><Users size={18}/><b>Applications</b><small>(Real-time APIs)</small></div>
        </div>
      </div>
      <div className="sdsm-live-rate">Live ingest <b>{(result.ingestionRate / 1000).toFixed(1)}K events/sec</b></div>
    </section>
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
    <article className={"sdsm-metric " + tone}>
      <span>{icon}</span>
      <div><small>{label}</small><strong>{value}</strong><em>{detail}</em></div>
    </article>
  );
}

const queryResults = [
  ["Electronics", "1,245,320", "12,453,200"],
  ["Fashion", "982,431", "6,812,300"],
  ["Home & Kitchen", "743,210", "4,321,800"],
  ["Books", "621,442", "3,112,400"],
];

export function SystemStorageModelingLab() {
  const motion=useSystemDesignMotion("storage");
  const companion = useCompanion();
  const [scenarioId, setScenarioId] = useState<StorageScenarioId>("ecommerce");
  const scenario = useMemo(() => getStorageScenario(scenarioId), [scenarioId]);
  const [choices, setChoices] = useState<StorageChoices>({ ...defaultStorageChoices });
  const [result, setResult] = useState<StorageResult>(() =>
    simulateStoragePlatform(getStorageScenario("ecommerce"), defaultStorageChoices),
  );
  const [running, setRunning] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [queryTab, setQueryTab] = useState<"operational" | "analytical" | "serving">("analytical");
  const [queryRan, setQueryRan] = useState(true);
  const [logFilter, setLogFilter] = useState<"all" | "storage">("all");

  const patch = <K extends keyof StorageChoices,>(key: K, value: StorageChoices[K]) =>
    setChoices(current => ({ ...current, [key]: value }));

  const chooseScenario = (id: StorageScenarioId) => {
    const next = getStorageScenario(id);
    setScenarioId(id);
    setChoices({ ...defaultStorageChoices });
    setResult(simulateStoragePlatform(next, defaultStorageChoices));
    setQueryRan(true);
  };

  const reset = () => chooseScenario("ecommerce");

  const run = () => {
    setRunning(true);
    window.setTimeout(() => {
      const next = simulateStoragePlatform(scenario, choices);
      setResult(next);
      setRunning(false);
      companion?.emit({ type: "exercise_correct", lesson: "Storage & Data Modeling Choices", source: "runner" });
    }, 320);
  };

  const logs = logFilter === "storage"
    ? result.logs.filter(line => line.includes("[S3]") || line.includes("[WAREHOUSE]") || line.includes("[CACHE]"))
    : result.logs;

  return (
    <section {...motion} className="sdsm-lab">
      <header className="sdsm-sim-header">
        <div className="sdsm-sim-heading">
          <span><Play size={20} fill="currentColor"/></span>
          <div>
            <h2>Interactive Simulation</h2>
            <p>Design a data platform for a real-world use case. Choose storage and data model for each layer and see how it performs.</p>
          </div>
        </div>
        <div className="sdsm-toolbar">
          <button type="button" className="sdsm-reset" onClick={reset}><RefreshCcw size={15}/>Reset</button>
          <button type="button" className="sdsm-run" onClick={run} disabled={running}><Play size={15} fill="currentColor"/>{running ? "Running…" : "Run Simulation"}</button>
          <label className="sdsm-scenario">
            <span>{scenario.label}</span>
            <select value={scenarioId} onChange={event => chooseScenario(event.target.value as StorageScenarioId)}>
              {storageScenarios.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <ChevronDown size={14}/>
          </label>
        </div>
      </header>

      <div className="sdsm-workspace">
        <section className="sdsm-config">
          <div className="sdsm-config-section">
            <h3>1. Select Use Case</h3>
            <p>Pick a scenario to see different access patterns and data characteristics.</p>
            <label className="sdsm-usecase">
              <Store size={17}/>
              <select value={scenarioId} onChange={event => chooseScenario(event.target.value as StorageScenarioId)}>
                {storageScenarios.map(item => <option key={item.id} value={item.id}>{item.useCase}</option>)}
              </select>
              <ChevronDown size={14}/>
            </label>
            <h4>Workload Characteristics</h4>
            <dl className="sdsm-workload">
              <div><dt>Daily Orders</dt><dd>{scenario.dailyOrders.toLocaleString()}</dd><b>High</b></div>
              <div><dt>Products</dt><dd>{scenario.products.toLocaleString()}</dd><b className="medium">Medium</b></div>
              <div><dt>Events / Day</dt><dd>{scenario.eventsPerDay.toLocaleString()}</dd><b>High</b></div>
              <div><dt>Analytics Queries</dt><dd>{scenario.analyticsQueries}</dd><b>High</b></div>
              <div><dt>Data Retention</dt><dd>{scenario.retentionYears} years</dd><b className="medium">Medium</b></div>
            </dl>
          </div>

          <div className="sdsm-config-section">
            <h3>2. Configure Storage Choices</h3>
            <p>Choose storage and data model for each layer.</p>

            <label className="sdsm-choice"><span><Database size={16}/>Operational DB (OLTP)</span><div><select value={choices.operationalDb} onChange={event => patch("operationalDb", event.target.value as OperationalDb)}><option value="postgres">PostgreSQL (Relational)</option><option value="mysql">MySQL (Relational)</option><option value="dynamodb">DynamoDB (Key-value)</option></select><ChevronDown size={13}/></div></label>
            <label className="sdsm-choice"><span><Network size={16}/>Event Storage</span><div><select value={choices.eventStorage} onChange={event => patch("eventStorage", event.target.value as EventStorage)}><option value="kafka-s3">Kafka + S3 (Data Lake)</option><option value="kinesis-s3">Kinesis + S3</option><option value="pubsub-gcs">Pub/Sub + GCS</option></select><ChevronDown size={13}/></div></label>
            <label className="sdsm-choice"><span><BarChart3 size={16}/>Analytics Store</span><div><select value={choices.analyticsStore} onChange={event => patch("analyticsStore", event.target.value as AnalyticsStore)}><option value="snowflake">Snowflake (Warehouse)</option><option value="bigquery">BigQuery (Warehouse)</option><option value="redshift">Redshift (Warehouse)</option></select><ChevronDown size={13}/></div></label>
            <label className="sdsm-choice"><span><Server size={16}/>Serving Store</span><div><select value={choices.servingStore} onChange={event => patch("servingStore", event.target.value as ServingStore)}><option value="redis">Redis (Cache)</option><option value="dynamodb">DynamoDB (Serving)</option><option value="elastic">Elasticsearch (Search)</option></select><ChevronDown size={13}/></div></label>

            <button type="button" className="sdsm-advanced-toggle" onClick={() => setAdvanced(value => !value)}><Settings2 size={15}/>Advanced Options<ChevronDown size={14}/></button>
            {advanced && <div className="sdsm-advanced">
              <span>Operational choice: <b>{operationalLabel(choices.operationalDb)}</b></span>
              <span>Data model: <b>Raw → curated → serving</b></span>
              <span>Retention: <b>{scenario.retentionYears} years</b></span>
            </div>}
          </div>
        </section>

        <div className="sdsm-main">
          <Architecture choices={choices} result={result}/>

          <div className="sdsm-bottom">
            <section className="sdsm-results">
              <header><h3>4. Simulation Results</h3><span><CheckCircle2 size={14}/>Completed</span></header>
              <div className="sdsm-metrics-grid">
                <Metric tone="blue" icon={<Zap size={18}/>} label="Ingestion Rate" value={(result.ingestionRate / 1000).toFixed(1) + "K"} detail="events/sec · ↑ 18%"/>
                <Metric tone="cyan" icon={<Gauge size={18}/>} label="Query Latency" value={result.queryLatencyMs + " ms"} detail="↓ 42%"/>
                <Metric tone="purple" icon={<Database size={18}/>} label="Storage Used" value={result.storageTb.toFixed(1) + " TB"} detail="(30 days) · ↑ 0%"/>
                <Metric tone="gold" icon={<DollarSign size={18}/>} label="Cost Estimate" value={"$" + result.monthlyCost.toLocaleString()} detail="/month · ↓ 25%"/>
              </div>
            </section>

            <section className="sdsm-logs">
              <header><h3>5. Data Flow (Live)</h3><label><select value={logFilter} onChange={event => setLogFilter(event.target.value as "all" | "storage")}><option value="all">All Events</option><option value="storage">Storage Only</option></select><ChevronDown size={13}/></label></header>
              <pre>{logs.map((line, index) => <span key={line}><time>10:24:{String(index + 1).padStart(2, "0")}</time>{line}</span>)}</pre>
            </section>

            <section className="sdsm-query">
              <header><h3>6. Query &amp; Compare</h3></header>
              <div className="sdsm-query-tabs">
                <button className={queryTab === "operational" ? "is-active" : ""} onClick={() => { setQueryTab("operational"); setQueryRan(false); }}>Operational</button>
                <button className={queryTab === "analytical" ? "is-active" : ""} onClick={() => { setQueryTab("analytical"); setQueryRan(false); }}>Analytical</button>
                <button className={queryTab === "serving" ? "is-active" : ""} onClick={() => { setQueryTab("serving"); setQueryRan(false); }}>Serving</button>
              </div>
              <div className="sdsm-query-editor">
                <pre>{queryTab === "analytical"
                  ? "SELECT\n  product_category,\n  COUNT(*) AS total_orders,\n  SUM(revenue) AS total_revenue\nFROM orders\nWHERE order_date >= '2026-07-01'\nGROUP BY product_category\nORDER BY total_orders DESC;"
                  : queryTab === "operational"
                    ? "SELECT order_id, customer_id, status\nFROM orders\nWHERE order_id = 10023;"
                    : "GET /product-category/top?limit=4"}</pre>
                <button type="button" onClick={() => setQueryRan(true)}>Run Query</button>
              </div>
              {queryRan ? (
                queryTab === "analytical" ? (
                  <table><thead><tr><th>product_category</th><th>total_orders</th><th>total_revenue</th></tr></thead><tbody>{queryResults.map(row => <tr key={row[0]}>{row.map(cell => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table>
                ) : (
                  <div className="sdsm-query-response">{queryTab === "operational" ? "10023 · C123 · completed" : "Electronics · Fashion · Home & Kitchen · Books"}</div>
                )
              ) : <div className="sdsm-query-response">Run the query to see results.</div>}
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SystemStorageModelingRightRail({
  lessonTitles,
  currentLesson,
  completed,
  onLesson,
  onNotes,
}: {
  lessonTitles: string[];
  currentLesson: number;
  completed: number[];
  onLesson: (lesson: string) => void;
  onNotes: () => void;
}) {
  return (
    <div className="sdsm-right-rail">
      <section className="sdsm-progress-card">
        <header><strong>Lesson Progress <ChevronDown size={14}/></strong><span>{completed.length} / {lessonTitles.length} done</span></header>
        <Progress value={completed.length / lessonTitles.length * 100} className="sdsm-progress"/>
        <div className="sdsm-progress-list">
          {lessonTitles.map((lesson, index) => {
            const done = completed.includes(index);
            const current = index === currentLesson;
            return (
              <button type="button" key={lesson} className={current ? "is-current" : ""} onClick={() => onLesson(lesson)}>
                {done ? <CheckCircle2 size={17}/> : current ? <Play size={17} fill="currentColor"/> : <Circle size={17}/>}
                <span>{index + 1}. {lesson}</span>
                <small>{done ? "Completed" : current ? "Learning" : "Not started"}</small>
              </button>
            );
          })}
        </div>
      </section>

      <section className="sdsm-notes-card">
        <header><Lightbulb size={18}/><strong>Quick Notes</strong><button type="button" onClick={onNotes}>+ Add Note</button></header>
        <p>Jot down key points, questions, or your own notes…</p>
        <div className="sdsm-notes-visual">
          <div><Sparkles size={18}/><span>Pick storage by workload, guarantees, and access patterns.</span></div>
          <Image src="/nila-avatar.png" alt="Mithoo learning companion" width={88} height={108}/>
        </div>
      </section>
    </div>
  );
}
