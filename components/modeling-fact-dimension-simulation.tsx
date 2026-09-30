"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Database,
  GraduationCap,
  Lightbulb,
  Network,
  Play,
  RefreshCcw,
  Sparkles,
  Table2,
  Zap,
} from "lucide-react";
import { useCompanion } from "@/components/companion-context";

type Phase = "source" | "dimensions" | "fact" | "complete";
type PreviewTab = "fact" | "customer" | "product" | "date";
type ScenarioId = "ecommerce" | "retail" | "subscriptions";

type OperationalRow = {
  order_id: number;
  customer: string;
  city: string;
  product: string;
  category: string;
  date: string;
  quantity: number;
  amount: number;
};

type Scenario = {
  id: ScenarioId;
  name: string;
  rows: OperationalRow[];
};

type CustomerDim = { customer_key: number; name: string; city: string };
type ProductDim = { product_key: number; product: string; category: string };
type DateDim = { date_key: number; date: string; month: string; year: number };
type FactRow = {
  order_id: number;
  customer_key: number;
  product_key: number;
  date_key: number;
  quantity: number;
  amount: number;
};

const SCENARIOS: Scenario[] = [
  {
    id: "ecommerce",
    name: "E-commerce Orders",
    rows: [
      { order_id: 1001, customer: "Alice", city: "New York", product: "Laptop", category: "Electronics", date: "2024-01-10", quantity: 1, amount: 1200 },
      { order_id: 1002, customer: "Bob", city: "Chicago", product: "Phone", category: "Electronics", date: "2024-01-11", quantity: 1, amount: 800 },
      { order_id: 1003, customer: "Alice", city: "New York", product: "Pen", category: "Stationery", date: "2024-01-12", quantity: 1, amount: 50 },
      { order_id: 1004, customer: "Carol", city: "Austin", product: "Laptop", category: "Electronics", date: "2024-01-13", quantity: 1, amount: 1200 },
      { order_id: 1005, customer: "David", city: "Seattle", product: "Monitor", category: "Electronics", date: "2024-01-13", quantity: 1, amount: 300 },
    ],
  },
  {
    id: "retail",
    name: "Retail Store Sales",
    rows: [
      { order_id: 2001, customer: "Asha", city: "Chennai", product: "Jacket", category: "Apparel", date: "2024-02-01", quantity: 1, amount: 90 },
      { order_id: 2002, customer: "Ravi", city: "Mumbai", product: "Sneakers", category: "Footwear", date: "2024-02-01", quantity: 1, amount: 140 },
      { order_id: 2003, customer: "Asha", city: "Chennai", product: "Cap", category: "Accessories", date: "2024-02-02", quantity: 1, amount: 25 },
      { order_id: 2004, customer: "Mina", city: "Pune", product: "Jacket", category: "Apparel", date: "2024-02-03", quantity: 1, amount: 90 },
      { order_id: 2005, customer: "Kabir", city: "Delhi", product: "Backpack", category: "Accessories", date: "2024-02-03", quantity: 1, amount: 65 },
    ],
  },
  {
    id: "subscriptions",
    name: "Subscription Orders",
    rows: [
      { order_id: 3001, customer: "Nova Labs", city: "Boston", product: "Starter Plan", category: "Subscription", date: "2024-03-01", quantity: 1, amount: 49 },
      { order_id: 3002, customer: "Acme Co", city: "Denver", product: "Pro Plan", category: "Subscription", date: "2024-03-01", quantity: 1, amount: 149 },
      { order_id: 3003, customer: "Nova Labs", city: "Boston", product: "Seat Add-on", category: "Add-on", date: "2024-03-02", quantity: 1, amount: 75 },
      { order_id: 3004, customer: "Orbit Inc", city: "Austin", product: "Pro Plan", category: "Subscription", date: "2024-03-03", quantity: 1, amount: 149 },
      { order_id: 3005, customer: "Acme Co", city: "Denver", product: "Seat Add-on", category: "Add-on", date: "2024-03-03", quantity: 1, amount: 45 },
    ],
  },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function buildModel(rows: OperationalRow[]) {
  const customerKeys = new Map<string, number>();
  const productKeys = new Map<string, number>();
  const dateKeys = new Map<string, number>();
  const customers: CustomerDim[] = [];
  const products: ProductDim[] = [];
  const dates: DateDim[] = [];

  for (const row of rows) {
    const customerId = row.customer + "|" + row.city;
    if (!customerKeys.has(customerId)) {
      const key = customers.length + 1;
      customerKeys.set(customerId, key);
      customers.push({ customer_key: key, name: row.customer, city: row.city });
    }

    const productId = row.product + "|" + row.category;
    if (!productKeys.has(productId)) {
      const key = (products.length + 1) * 10;
      productKeys.set(productId, key);
      products.push({ product_key: key, product: row.product, category: row.category });
    }

    if (!dateKeys.has(row.date)) {
      const key = Number(row.date.replaceAll("-", ""));
      dateKeys.set(row.date, key);
      const [, month] = row.date.split("-").map(Number);
      dates.push({ date_key: key, date: row.date, month: MONTHS[month - 1], year: Number(row.date.slice(0, 4)) });
    }
  }

  const facts: FactRow[] = rows.map((row) => ({
    order_id: row.order_id,
    customer_key: customerKeys.get(row.customer + "|" + row.city)!,
    product_key: productKeys.get(row.product + "|" + row.category)!,
    date_key: dateKeys.get(row.date)!,
    quantity: row.quantity,
    amount: row.amount,
  }));

  return { customers, products, dates, facts };
}

function SmallTable({
  columns,
  rows,
  dense = false,
}: {
  columns: string[];
  rows: object[];
  dense?: boolean;
}) {
  return (
    <div className={dense ? "mfd-table mfd-table-dense" : "mfd-table"}>
      <table>
        <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index}>{columns.map((column) => <td key={column}>{String((row as Record<string, string | number>)[column])}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function PreviewCode({
  code,
  copyId,
  copied,
  onCopy,
}: {
  code: string;
  copyId: string;
  copied: string | null;
  onCopy: (id: string, value: string) => void;
}) {
  return (
    <div className="mfd-code">
      <button type="button" aria-label="Copy SQL" onClick={() => onCopy(copyId, code)}>
        {copied === copyId ? <Check size={13}/> : <Copy size={13}/>}
        <span>{copied === copyId ? "Copied" : "Copy"}</span>
      </button>
      <pre tabIndex={0}><code>{code}</code></pre>
    </div>
  );
}

const SQL: Record<PreviewTab, string> = {
  fact: `CREATE TABLE fact_sales (
  order_id INT,
  customer_key INT,
  product_key INT,
  date_key INT,
  quantity INT,
  amount DECIMAL(12,2)
);`,
  customer: `CREATE TABLE dim_customer (
  customer_key INT PRIMARY KEY,
  name VARCHAR(120),
  city VARCHAR(120)
);`,
  product: `CREATE TABLE dim_product (
  product_key INT PRIMARY KEY,
  product VARCHAR(120),
  category VARCHAR(120)
);`,
  date: `CREATE TABLE dim_date (
  date_key INT PRIMARY KEY,
  date DATE,
  month VARCHAR(3),
  year INT
);`,
};

const ANALYTICAL_SQL = `SELECT
  p.category,
  SUM(f.amount) AS total_sales
FROM fact_sales f
JOIN dim_product p
  ON f.product_key = p.product_key
GROUP BY p.category
ORDER BY total_sales DESC;`;

export function ModelingFactDimensionHero({
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
    <section className="mfd-hero" aria-labelledby="mfd-hero-title">
      <div className="mfd-hero-copy">
        <div className="mfd-breadcrumb"><span>Data Modeling</span><ChevronRight size={13}/><strong>Fact &amp; Dimension Tables</strong></div>
        <div className="mfd-title-row">
          <span className="mfd-hero-icon"><Zap size={24}/></span>
          <div><h1 id="mfd-hero-title">Fact &amp; Dimension Tables</h1><p>{description}</p></div>
        </div>
        <div className="mfd-meta"><span><Clock3 size={14}/>{minutes} min</span><span><GraduationCap size={14}/>Lesson {currentLesson + 1}/{total}</span></div>
      </div>

      <div className="mfd-hero-art" aria-hidden="true">
        <div className="mfd-art-node mfd-art-left"><Database size={49}/></div>
        <div className="mfd-art-node mfd-art-top"><Database size={42}/></div>
        <div className="mfd-art-fact"><Table2 size={47}/><b>Fact Table</b></div>
        <div className="mfd-art-node mfd-art-right"><Database size={49}/></div>
        <div className="mfd-art-node mfd-art-right-low"><Database size={44}/></div>
        <span className="mfd-art-dim-label">Dimensions</span>
        <span className="mfd-art-dim-label mfd-art-dim-label-right">Dimensions</span>
        <i className="mfd-art-line a"/><i className="mfd-art-line b"/><i className="mfd-art-line c"/><i className="mfd-art-line d"/>
      </div>

      <div className="mfd-hero-actions">
        <span className="mfd-difficulty">Intermediate</span>
        <div><button type="button" aria-label="Previous lesson" onClick={onPrevious} disabled={currentLesson === 0}><ChevronLeft size={18}/></button><button type="button" className="mfd-next" onClick={onNext} disabled={currentLesson === total - 1}>Next <ChevronRight size={17}/></button></div>
      </div>
    </section>
  );
}

export function ModelingFactDimensionSimulation() {
  const companion = useCompanion();
  const [scenarioId, setScenarioId] = useState<ScenarioId>("ecommerce");
  const [phase, setPhase] = useState<Phase>("complete");
  const [previewTab, setPreviewTab] = useState<PreviewTab>("fact");
  const [copied, setCopied] = useState<string | null>(null);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scenario = useMemo(() => SCENARIOS.find((item) => item.id === scenarioId) ?? SCENARIOS[0], [scenarioId]);
  const model = useMemo(() => buildModel(scenario.rows), [scenario]);
  const phaseIndex = phase === "source" ? 0 : phase === "dimensions" ? 1 : phase === "fact" ? 2 : 3;

  const operationalRows = scenario.rows.map(({ order_id, customer, product, date, amount }) => ({ order_id, customer, product, date, amount }));
  const factRows = model.facts.map((row) => ({ ...row, amount: row.amount.toFixed(2) }));

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => () => {
    clearTimers();
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);

  const chooseScenario = (id: ScenarioId) => {
    clearTimers();
    setScenarioId(id);
    setPhase("source");
    setPreviewTab("fact");
    setCopied(null);
  };

  const run = () => {
    clearTimers();
    setPhase("source");
    const dimensions = setTimeout(() => setPhase("dimensions"), 380);
    const fact = setTimeout(() => setPhase("fact"), 820);
    const complete = setTimeout(() => {
      setPhase("complete");
      companion?.emit({ type: "exercise_correct", lesson: "Fact & Dimension Tables", source: "runner" });
    }, 1260);
    timers.current.push(dimensions, fact, complete);
  };

  const reset = () => {
    clearTimers();
    setScenarioId("ecommerce");
    setPhase("complete");
    setPreviewTab("fact");
    setCopied(null);
  };

  const copyText = async (id: string, value: string) => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(value);
      ok = true;
    } catch {
      try {
        const area = document.createElement("textarea");
        area.value = value;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        ok = document.execCommand("copy");
        document.body.removeChild(area);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(id);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(null), 1600);
    }
  };

  const checklist = [
    ["Identify dimensions", 1],
    ["Create surrogate keys", 1],
    ["Separate measures", 2],
    ["Build relationships", 2],
    ["Generate star schema", 3],
  ] as const;

  const selectPreview = (tab: PreviewTab) => {
    setPreviewTab(tab);
  };
  const currentTransformIndex = phaseIndex === 1 ? 1 : phaseIndex === 2 ? 3 : phaseIndex >= 3 ? 4 : -1;

  return (
    <section className="mfd-simulation" aria-labelledby="mfd-simulation-title">
      <header className="mfd-simulation-head">
        <div><h2 id="mfd-simulation-title"><Network size={23}/>Interactive Simulation</h2><p>Transform operational order data into a Fact table and Dimension tables. See how measures and dimensions work together.</p></div>
        <div className="mfd-controls">
          <button type="button" className="mfd-run" onClick={run}><Play size={14}/>{phase !== "complete" ? "Running…" : "Run Transformation"}</button>
          <button type="button" className="mfd-reset" onClick={reset}><RefreshCcw size={14}/>Reset</button>
          <select aria-label="Transformation scenario" value={scenarioId} onChange={(event) => chooseScenario(event.target.value as ScenarioId)}>
            {SCENARIOS.map((item, index) => <option key={item.id} value={item.id}>{`Scenario ${index + 1}: ${item.name}`}</option>)}
          </select>
        </div>
      </header>

      <div className="mfd-flow">
        <section className={`mfd-stage mfd-stage-source ${phaseIndex >= 0 ? "is-active" : ""}`}>
          <header><span><Database size={20}/></span><div><h3>1. Operational Data</h3><p>Raw order data from source system</p></div></header>
          <SmallTable columns={["order_id","customer","product","date","amount"]} rows={operationalRows}/>
          <div className="mfd-stage-badge"><Database size={13}/>{scenario.rows.length} rows loaded</div>
        </section>

        <div className="mfd-flow-arrow" aria-hidden="true"><ArrowRight size={24}/></div>

        <section className={`mfd-stage mfd-stage-transform ${phaseIndex >= 1 ? "is-active" : "is-future"}`}>
          <header><span><Sparkles size={20}/></span><div><h3>2. Transform</h3><p>Extract entities, create keys<br/>and calculate measures</p></div></header>
          <div className="mfd-checklist">
            {checklist.map(([label, required], index) => {
              const active = phaseIndex >= required;
              const current = phase !== "complete" && active && index === currentTransformIndex;
              return <div key={label} className={active ? "is-done" : ""}><span>{active ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}</span><strong>{label}</strong>{current && <i>active</i>}</div>;
            })}
          </div>
        </section>

        <div className="mfd-flow-arrow" aria-hidden="true"><ArrowRight size={24}/></div>

        <section className={`mfd-stage mfd-stage-dimensions ${phaseIndex >= 1 ? "is-active" : "is-future"}`}>
          <header><span><Database size={20}/></span><div><h3>3. Dimension Tables</h3><p>Descriptive context for analysis</p></div></header>
          <div className="mfd-dim-table"><strong>Dim Customer ({model.customers.length} rows)</strong><SmallTable dense columns={["customer_key","name","city"]} rows={model.customers}/></div>
          <div className="mfd-dim-table"><strong>Dim Product ({model.products.length} rows)</strong><SmallTable dense columns={["product_key","product","category"]} rows={model.products}/></div>
          <div className="mfd-dim-table"><strong>Dim Date ({model.dates.length} rows)</strong><SmallTable dense columns={["date_key","date","month","year"]} rows={model.dates}/></div>
        </section>

        <div className="mfd-flow-arrow" aria-hidden="true"><ArrowRight size={24}/></div>

        <section className={`mfd-stage mfd-stage-fact ${phaseIndex >= 2 ? "is-active" : "is-future"}`}>
          <header><span><BarChart3 size={20}/></span><div><h3>4. Fact Table</h3><p>Quantitative measurements</p></div></header>
          <SmallTable dense columns={["order_id","customer_key","product_key","date_key","quantity","amount"]} rows={factRows}/>
          <div className="mfd-stage-badge mfd-fact-badge"><CheckCircle2 size={13}/>{model.facts.length} fact rows created</div>
        </section>
      </div>

      <div className={`mfd-lower ${phaseIndex >= 3 ? "is-active" : "is-future"}`}>
        <section className="mfd-star-card">
          <header><Network size={17}/><strong>Visual Model (Star Schema)</strong></header>
          <div className="mfd-star">
            <button type="button" className="mfd-node mfd-node-customer" aria-pressed={previewTab === "customer"} onClick={() => selectPreview("customer")}><Database size={13}/><strong>DIM_CUSTOMER</strong><small>customer_key<br/>name<br/>city</small></button>
            <button type="button" className="mfd-node mfd-node-product" aria-pressed={previewTab === "product"} onClick={() => selectPreview("product")}><Database size={13}/><strong>DIM_PRODUCT</strong><small>product_key<br/>product<br/>category</small></button>
            <button type="button" className="mfd-node mfd-node-fact" aria-pressed={previewTab === "fact"} onClick={() => selectPreview("fact")}><Table2 size={13}/><strong>FACT_SALES</strong><small>order_id<br/>customer_key<br/>product_key<br/>date_key<br/>quantity<br/>amount</small></button>
            <button type="button" className="mfd-node mfd-node-date" aria-pressed={previewTab === "date"} onClick={() => selectPreview("date")}><Database size={13}/><strong>DIM_DATE</strong><small>date_key<br/>date<br/>month<br/>year</small></button>
            <i className="mfd-spoke mfd-spoke-a"/><i className="mfd-spoke mfd-spoke-b"/><i className="mfd-spoke mfd-spoke-c"/>
          </div>
        </section>

        <section className="mfd-sql-preview">
          <header><Table2 size={17}/><strong>SQL Preview</strong></header>
          <div className="mfd-preview-tabs" role="tablist" aria-label="SQL table preview">
            {([
              ["fact","Fact Table"],
              ["customer","Dim Customer"],
              ["product","Dim Product"],
              ["date","Dim Date"],
            ] as const).map(([id,label]) => <button type="button" role="tab" aria-selected={previewTab === id} key={id} onClick={() => selectPreview(id)}>{label}</button>)}
          </div>
          <PreviewCode code={SQL[previewTab]} copyId={"preview-"+previewTab} copied={copied} onCopy={copyText}/>
        </section>

        <section className="mfd-query-card">
          <header><Sparkles size={17}/><strong>Sample Analytical Query</strong></header>
          <p>Total sales by product category</p>
          <PreviewCode code={ANALYTICAL_SQL} copyId="analytical" copied={copied} onCopy={copyText}/>
        </section>
      </div>

      <div className="mfd-summary-row">
        <article className="mfd-summary-green"><header><CheckCircle2 size={17}/><strong>Key Takeaways</strong></header><ul><li>Fact tables store measurable business events.</li><li>Dimension tables provide descriptive context.</li><li>They join using foreign keys.</li></ul></article>
        <article className="mfd-summary-blue"><header><Lightbulb size={17}/><strong>When to use</strong></header><ul><li>Use fact &amp; dimension tables for analytics and reporting.</li><li>Facts store numeric measures.</li><li>Dimensions store business context (who, what, when, where).</li></ul></article>
        <article className="mfd-summary-red"><header><AlertCircle size={17}/><strong>Common Mistakes</strong></header><ul><li>Putting descriptive attributes in fact table.</li><li>Not using surrogate keys.</li><li>Missing important dimensions like date or customer.</li></ul></article>
      </div>

      <span className="mfd-status" role="status">{phase === "source" ? "Operational rows loaded. Identifying dimensions next." : phase === "dimensions" ? "Dimension rows and surrogate keys created." : phase === "fact" ? "Fact rows created at one row per source order line." : "Transformation complete. Star schema and SQL previews are ready."}</span>
    </section>
  );
}
