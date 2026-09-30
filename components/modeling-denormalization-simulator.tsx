"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  Gauge,
  GraduationCap,
  Lightbulb,
  Link2,
  Play,
  RefreshCcw,
  Scale,
  ShoppingCart,
  Table2,
  UserRound,
  Zap,
} from "lucide-react";
import { useCompanion } from "@/components/companion-context";

type StageIndex = 0 | 1 | 2;
type RunStatus = "ready" | "running" | "done";
type QuerySide = "before" | "after";

type Customer = {
  customer_id: number;
  name: string;
  city: string;
  segment: string;
};

type Order = {
  order_id: number;
  customer_id: number;
  order_date: string;
  status: string;
};

type OrderLine = {
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
};

type ReadModelRow = {
  order_id: number;
  order_date: string;
  customer_name: string;
  city: string;
  product_id: number;
  quantity: number;
  amount: number;
};

const CUSTOMERS: Customer[] = [
  { customer_id: 1, name: "Alice", city: "Chennai", segment: "Consumer" },
  { customer_id: 2, name: "Bob", city: "Mumbai", segment: "Enterprise" },
  { customer_id: 3, name: "Carol", city: "Bangalore", segment: "SMB" },
];

const ORDERS: Order[] = [
  { order_id: 101, customer_id: 1, order_date: "2024-01-10", status: "Completed" },
  { order_id: 102, customer_id: 2, order_date: "2024-01-12", status: "Shipped" },
  { order_id: 103, customer_id: 1, order_date: "2024-01-15", status: "Completed" },
];

const ORDER_LINES: OrderLine[] = [
  { order_id: 101, product_id: 201, quantity: 2, unit_price: 120 },
  { order_id: 101, product_id: 202, quantity: 1, unit_price: 80 },
  { order_id: 102, product_id: 201, quantity: 3, unit_price: 120 },
  { order_id: 103, product_id: 203, quantity: 1, unit_price: 200 },
];

const STAGES = [
  { title: "Source Tables", subtitle: "(Normalized)" },
  { title: "Join at Line Grain", subtitle: "(Precompute)" },
  { title: "Publish Read Model", subtitle: "(Denormalized)" },
] as const;

const BEFORE_SQL = `SELECT c.name, c.city,
       SUM(ol.quantity * ol.unit_price) AS total_sales
FROM customer c
JOIN orders o ON o.customer_id = c.customer_id
JOIN order_line ol ON ol.order_id = o.order_id
GROUP BY c.name, c.city;`;

const AFTER_SQL = `SELECT customer_name, city,
       SUM(amount) AS total_sales
FROM order_read_model
GROUP BY customer_name, city;`;

function buildReadModel(customers: Customer[], orders: Order[], lines: OrderLine[]): ReadModelRow[] {
  const customerById = new Map(customers.map((customer) => [customer.customer_id, customer]));
  const orderById = new Map(orders.map((order) => [order.order_id, order]));
  return lines.flatMap((line) => {
    const order = orderById.get(line.order_id);
    if (!order) return [];
    const customer = customerById.get(order.customer_id);
    if (!customer) return [];
    return [{
      order_id: order.order_id,
      order_date: order.order_date,
      customer_name: customer.name,
      city: customer.city,
      product_id: line.product_id,
      quantity: line.quantity,
      amount: line.quantity * line.unit_price,
    }];
  });
}

function SourceTable({
  tone,
  icon,
  title,
  rows,
  columns,
}: {
  tone: "blue" | "green" | "orange";
  icon: React.ReactNode;
  title: string;
  rows: Array<Record<string, string | number>>;
  columns: string[];
}) {
  return (
    <section className={`mden-source-table mden-source-${tone}`}>
      <header>
        <span>{icon}</span>
        <strong>{title}</strong>
        <small>{rows.length} rows</small>
        <i aria-hidden="true">•••</i>
      </header>
      <div>
        <table>
          <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>
            {rows.map((row, index) => <tr key={index}>{columns.map((column) => <td key={column}>{String(row[column])}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ReadModelTable({ rows }: { rows: ReadModelRow[] }) {
  return (
    <div className="mden-read-table">
      <table>
        <thead><tr>{["order_id","order_date","customer_name","city","product_id","quantity","amount"].map((column) => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>
          {rows.map((row) => <tr key={`${row.order_id}-${row.product_id}`}>
            <td>{row.order_id}</td>
            <td>{row.order_date}</td>
            <td>{row.customer_name}</td>
            <td>{row.city}</td>
            <td>{row.product_id}</td>
            <td>{row.quantity}</td>
            <td>{row.amount.toFixed(2)}</td>
          </tr>)}
        </tbody>
      </table>
    </div>
  );
}

export function ModelingDenormalizationHero({
  currentLesson,
  total,
  minutes,
  description,
  onPrevious,
  onNext,
}: {
  currentLesson: number;
  total: number;
  minutes: number;
  description: string;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <section className="mden-hero" aria-labelledby="mden-hero-title">
      <div className="mden-hero-copy">
        <div className="mden-breadcrumb"><span>Data Modeling</span><ChevronRight size={13}/><strong>Denormalization</strong></div>
        <div className="mden-title-row">
          <span className="mden-hero-icon"><Zap size={24}/></span>
          <div><h1 id="mden-hero-title">Denormalization</h1><p>{description}</p></div>
        </div>
        <div className="mden-meta">
          <span><Clock3 size={14}/>{minutes} min</span>
          <span><GraduationCap size={14}/>Lesson {currentLesson + 1}/{total}</span>
        </div>
      </div>

      <div className="mden-hero-art" aria-hidden="true">
        <div className="mden-db mden-db-a"><Database size={46}/></div>
        <div className="mden-db mden-db-b"><Database size={69}/></div>
        <div className="mden-db mden-db-c"><Database size={42}/></div>
        <span className="mden-hero-link"><Link2 size={29}/></span>
        <span className="mden-hero-ok"><Check size={12}/></span>
        <div className="mden-read-model-card"><b>Read Model</b><BarChart3 size={54}/></div>
      </div>

      <div className="mden-hero-actions">
        <span className="mden-difficulty">Intermediate</span>
        <div>
          <button type="button" aria-label="Previous lesson" onClick={onPrevious} disabled={currentLesson === 0}><ChevronLeft size={18}/></button>
          <button type="button" className="mden-next" onClick={onNext} disabled={currentLesson === total - 1}>Next <ChevronRight size={17}/></button>
        </div>
      </div>
    </section>
  );
}

export function ModelingDenormalizationSimulator() {
  const companion = useCompanion();
  const [activeStage, setActiveStage] = useState<StageIndex>(2);
  const [stepByStep, setStepByStep] = useState(false);
  const [status, setStatus] = useState<RunStatus>("done");
  const [querySide, setQuerySide] = useState<QuerySide>("after");
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const readRows = useMemo(() => buildReadModel(CUSTOMERS, ORDERS, ORDER_LINES), []);
  const joinCountBefore = 3;
  const joinCountAfter = 0;

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const emitComplete = () => {
    companion?.emit({ type: "exercise_correct", lesson: "Denormalization", source: "runner" });
  };

  const setStage = (next: StageIndex) => {
    clearTimers();
    setActiveStage(next);
    setStatus(next === 2 ? "done" : "ready");
    if (next === 2) emitComplete();
  };

  const run = () => {
    clearTimers();
    if (stepByStep) {
      const next = status !== "running" ? 0 : Math.min(2, activeStage + 1) as StageIndex;
      setActiveStage(next);
      if (next === 2) {
        setStatus("done");
        setQuerySide("after");
        emitComplete();
      } else {
        setStatus("running");
      }
      return;
    }

    setStatus("running");
    setActiveStage(0);
    setQuerySide("before");
    [1, 2].forEach((stage, index) => {
      const timer = setTimeout(() => {
        setActiveStage(stage as StageIndex);
        if (stage === 2) {
          setStatus("done");
          setQuerySide("after");
          emitComplete();
        }
      }, 420 + index * 620);
      timers.current.push(timer);
    });
  };

  const reset = () => {
    clearTimers();
    setActiveStage(0);
    setStatus("ready");
    setStepByStep(false);
    setQuerySide("before");
  };

  return (
    <section className="mden-simulator" aria-labelledby="mden-simulator-title">
      <header className="mden-simulator-head">
        <div>
          <h2 id="mden-simulator-title"><Database size={24}/>Read Model Builder &amp; Trade-off Simulator</h2>
          <p>Join normalized tables at the line grain to build a denormalized read model.<br/>See how it improves read performance and what trade-offs it brings.</p>
        </div>
        <div className="mden-stage-strip" aria-label="Denormalization stages">
          {STAGES.map((stage, index) => <button
            type="button"
            key={stage.title}
            onClick={() => setStage(index as StageIndex)}
            aria-current={activeStage === index ? "step" : undefined}
            className={`${activeStage === index ? "is-active" : ""} ${activeStage > index ? "is-complete" : ""}`}
          >
            <span>{index + 1}</span>
            <div><strong>{stage.title}</strong><small>{stage.subtitle}</small></div>
          </button>)}
        </div>
      </header>

      <div className="mden-controls">
        <button type="button" className="mden-run" onClick={run}><Play size={15} fill="currentColor"/>{stepByStep && status === "running" ? "Next Step" : "Run Merge & Build Read Model"}</button>
        <label className="mden-toggle"><input type="checkbox" checked={stepByStep} onChange={(event) => { clearTimers(); setStepByStep(event.target.checked); setActiveStage(0); setStatus("ready"); setQuerySide("before"); }}/><span/>Step by step</label>
        <button type="button" className="mden-reset" onClick={reset}><RefreshCcw size={14}/>Reset</button>
      </div>

      <div className="mden-main-grid">
        <section className={`mden-normalized ${activeStage === 0 ? "is-active" : ""}`}>
          <header><Database size={21}/><div><h3>Normalized Source Tables</h3><p>These tables are normalized and need joins to answer analytical queries.</p></div></header>
          <SourceTable tone="blue" icon={<UserRound size={17}/>} title="Customer" rows={CUSTOMERS} columns={["customer_id","name","city","segment"]}/>
          <SourceTable tone="green" icon={<ShoppingCart size={17}/>} title="Order" rows={ORDERS} columns={["order_id","customer_id","order_date","status"]}/>
          <SourceTable tone="orange" icon={<Table2 size={17}/>} title="Order Line" rows={ORDER_LINES} columns={["order_id","product_id","quantity","unit_price"]}/>
        </section>

        <section className={`mden-join-zone ${activeStage >= 1 ? "is-active" : ""}`} aria-label="Precomputed join">
          <div className="mden-join-lines" aria-hidden="true">
            <i className="mden-line-one"/><i className="mden-line-two"/><i className="mden-line-three"/>
          </div>
          <div className="mden-join-card"><span>⚙</span><span>⚙</span><strong>Precompute<br/>Joins at<br/>Line Grain</strong></div>
          <div className="mden-join-note"><Lightbulb size={14}/><p>We join Customer + Order + Order Line and select the columns needed for reads.</p></div>
          <div className="mden-result-pill">Result: 1 denormalized table <ArrowRight size={14}/></div>
        </section>

        <section className={`mden-output-stack ${activeStage >= 2 ? "is-active" : "is-future"}`}>
          <section className="mden-read-model">
            <header>
              <span><Database size={20}/></span>
              <div><h3>Denormalized Read Model</h3><p>A wide table with pre-joined data for fast analytical reads.</p></div>
              <b><Zap size={11}/>Read Optimized</b>
            </header>
            <ReadModelTable rows={readRows}/>
            <div className="mden-read-callout"><CheckCircle2 size={15}/><span>Precomputed join results are stored, so reads no longer need multiple joins.</span></div>
          </section>

          <section className="mden-query-comparison">
            <header><Database size={19}/><div><h3>Before vs After: Query Comparison</h3><p>Same business question: Total sales by customer and city</p></div></header>
            <div className="mden-query-grid">
              <button type="button" className={querySide === "before" ? "is-selected" : ""} onClick={() => setQuerySide("before")} aria-pressed={querySide === "before"}>
                <header><strong>Before (Normalized) — 3 Joins</strong><small>SQL</small></header>
                <pre><code>{BEFORE_SQL}</code></pre>
                <footer><span><CheckCircle2 size={12}/>3 joins</span><span>Higher read cost</span><span>Slower on large data</span></footer>
              </button>
              <span className="mden-vs">VS</span>
              <button type="button" className={querySide === "after" ? "is-selected" : ""} onClick={() => setQuerySide("after")} aria-pressed={querySide === "after"}>
                <header><strong>After (Read Model) — 0 Joins</strong><small>SQL</small></header>
                <pre><code>{AFTER_SQL}</code></pre>
                <footer><span><CheckCircle2 size={12}/>0 joins</span><span>Fast reads</span><span>Simple query</span></footer>
              </button>
            </div>
          </section>
        </section>
      </div>

      <div className="mden-bottom-grid">
        <section className="mden-performance">
          <header><BarChart3 size={18}/><strong>Performance Comparison</strong><span><i/>Normalized (Before)</span><span><i/>Denormalized (After)</span></header>
          <div>
            <div><label>Read speed (analytical queries)</label><span className="mden-before-bar"><b style={{ width: "12%" }}/><small>1x</small></span><span className="mden-after-bar"><b style={{ width: activeStage >= 2 ? "78%" : "0%" }}/><small>{activeStage >= 2 ? "8-20x*" : "—"}</small></span></div>
            <div><label>Number of joins per query</label><span className="mden-before-bar"><b style={{ width: "34%" }}/><small>{joinCountBefore}</small></span><span className="mden-after-bar"><b style={{ width: activeStage >= 2 ? "3%" : "0%" }}/><small>{activeStage >= 2 ? joinCountAfter : "—"}</small></span></div>
            <div><label>Query complexity</label><span className="mden-before-bar"><b style={{ width: "48%" }}/><small>High</small></span><span className="mden-after-bar"><b style={{ width: activeStage >= 2 ? "22%" : "0%" }}/><small>{activeStage >= 2 ? "Low" : "—"}</small></span></div>
          </div>
          <p>*Illustrative read-path comparison from the reference; real speedup depends on engine, data, indexing, caching and workload.</p>
        </section>

        <section className="mden-tradeoffs">
          <header><Scale size={18}/><strong>Trade-offs of Denormalization</strong></header>
          <div>
            <article>
              <h4><CheckCircle2 size={14}/>Benefits</h4>
              <ul><li>Faster analytical reads</li><li>Fewer joins, simpler queries</li><li>Good for dashboards &amp; reporting</li><li>Precomputes repeated logic</li></ul>
            </article>
            <article>
              <h4><AlertTriangle size={14}/>Cautions</h4>
              <ul><li>More storage (data duplication)</li><li>Updates are more complex</li><li>Data can become stale</li><li>Not ideal for high-change data</li></ul>
            </article>
          </div>
        </section>
      </div>

      <span className="mden-status" role="status">
        {status === "running" ? `Build stage ${activeStage + 1} of 3` : status === "done" ? "Read model published from the normalized source tables." : `Ready at ${STAGES[activeStage].title}.`}
      </span>
    </section>
  );
}
