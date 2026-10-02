"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Box,
  Check,
  CheckCircle2,
  Copy,
  Database,
  FileCode2,
  Lightbulb,
  Play,
  RotateCcw,
  Table2,
  TriangleAlert,
} from "lucide-react";
import { useCompanion } from "@/components/companion-context";

type Cell = string | number | null;
type Dataset = {
  id: string;
  label: string;
  table: string;
  columns: string[];
  rows: Cell[][];
};

type QueryResult = {
  columns: string[];
  rows: Cell[][];
  elapsed: number;
};

const datasets: Dataset[] = [
  {
    id: "customers",
    label: "Customers (10 rows)",
    table: "customers",
    columns: ["id", "name", "city", "age", "signup_date"],
    rows: [
      [1, "Alice", "Chennai", 28, "2023-01-15"],
      [2, "Bob", "Mumbai", 34, "2023-02-10"],
      [3, "Carol", "Delhi", 25, "2023-02-20"],
      [4, "David", "Bangalore", 41, "2023-03-05"],
      [5, "Eva", "Hyderabad", 31, "2023-03-18"],
      [6, "Frank", "Pune", 38, "2023-04-02"],
      [7, "Grace", "Kolkata", 29, "2023-04-12"],
      [8, "Henry", "Ahmedabad", 36, "2023-05-01"],
      [9, "Irene", "Chennai", 32, "2023-05-14"],
      [10, "Jack", "Mumbai", 27, "2023-06-10"],
    ],
  },
  {
    id: "orders",
    label: "Orders (8 rows)",
    table: "orders",
    columns: ["id", "customer_id", "amount", "status", "order_date"],
    rows: [
      [101, 1, 500, "paid", "2023-06-02"],
      [102, 1, 300, "paid", "2023-06-08"],
      [103, 3, 200, "pending", "2023-06-11"],
      [104, 4, 780, "paid", "2023-06-16"],
      [105, 5, 120, "refunded", "2023-06-19"],
      [106, 7, 450, "paid", "2023-06-22"],
      [107, 9, 640, "pending", "2023-06-24"],
      [108, 10, 90, "paid", "2023-06-29"],
    ],
  },
];

const scenarios: Record<string, string[]> = {
  customers: [
    "SELECT *\nFROM customers;",
    "SELECT id, name\nFROM customers;",
    "SELECT name, city\nFROM customers;",
    "SELECT name, city, age\nFROM customers;",
  ],
  orders: [
    "SELECT *\nFROM orders;",
    "SELECT id, amount\nFROM orders;",
    "SELECT customer_id, status\nFROM orders;",
    "SELECT id, customer_id, amount\nFROM orders;",
  ],
};

function evaluate(query: string): QueryResult {
  const normalized = query.trim().replace(/;\s*$/, "").replace(/\s+/g, " ");
  const match = normalized.match(/^SELECT\s+(.+?)\s+FROM\s+([A-Za-z_][A-Za-z0-9_]*)$/i);
  if (!match) {
    throw new Error("Use the introductory shape SELECT columns FROM table; for this lesson.");
  }

  const [, selectedText, tableNameRaw] = match;
  const tableName = tableNameRaw.toLowerCase();
  const dataset = datasets.find(item => item.table === tableName);
  if (!dataset) {
    throw new Error(`Unknown table “${tableNameRaw}”. Try customers or orders.`);
  }

  const selected = selectedText.trim() === "*"
    ? dataset.columns
    : selectedText.split(",").map(value => value.trim().replace(/^[`"]|[`"]$/g, ""));

  if (!selected.length || selected.some(column => !column)) {
    throw new Error("Choose at least one column after SELECT.");
  }

  const unknown = selected.find(column => !dataset.columns.includes(column));
  if (unknown) {
    throw new Error(`Unknown column “${unknown}” in ${dataset.table}.`);
  }

  const indexes = selected.map(column => dataset.columns.indexOf(column));
  return {
    columns: selected,
    rows: dataset.rows.map(row => indexes.map(index => row[index])),
    elapsed: Math.max(2, Math.min(12, Math.round(dataset.rows.length * 0.8))),
  };
}

function DataTable({ dataset, result = false }: { dataset: Dataset | QueryResult; result?: boolean }) {
  return <div className={"sql-intro-table-wrap" + (result ? " sql-intro-result-table" : "")} tabIndex={0} role="region" aria-label={result ? "Query result table" : "Source data table"}>
    <table>
      <thead><tr>{dataset.columns.map(column => <th scope="col" key={column}>{column}</th>)}</tr></thead>
      <tbody>{dataset.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, columnIndex) => <td key={dataset.columns[columnIndex]}>{value === null ? <em>NULL</em> : value}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}

function SqlHighlight({ value }: { value: string }) {
  const tokens = value.split(/(\bSELECT\b|\bFROM\b|\*|,|;)/gi);
  return <>{tokens.map((token, index) => {
    const upper = token.toUpperCase();
    const className = upper === "SELECT" || upper === "FROM"
      ? "sql-token-keyword"
      : token === "*" ? "sql-token-operator" : token === "," || token === ";" ? "sql-token-punctuation" : "sql-token-name";
    return <span className={className} key={index}>{token}</span>;
  })}</>;
}

export function SqlIntroductionLab() {
  const companion = useCompanion();
  const [datasetId, setDatasetId] = useState("customers");
  const [scenario, setScenario] = useState(0);
  const dataset = useMemo(() => datasets.find(item => item.id === datasetId) ?? datasets[0], [datasetId]);
  const [query, setQuery] = useState(scenarios.customers[0]);
  const [result, setResult] = useState<QueryResult>(() => evaluate(scenarios.customers[0]));
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dirty, setDirty] = useState(false);

  const applyQuery = (nextQuery = query, nextScenario = scenario) => {
    setRunning(true);
    setError("");
    window.setTimeout(() => {
      try {
        const next = evaluate(nextQuery);
        setResult(next);
        setDirty(false);
        companion?.emit({ type: "exercise_correct", lesson: "SQL Introduction", source: "runner" });
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : "Could not run this query.";
        setError(message);
        companion?.emit({ type: "exercise_error", lesson: "SQL Introduction", source: "runner" });
      } finally {
        setRunning(false);
        setScenario(nextScenario);
      }
    }, 160);
  };

  const changeDataset = (nextId: string) => {
    const nextQuery = scenarios[nextId][0];
    setDatasetId(nextId);
    setScenario(0);
    setQuery(nextQuery);
    setError("");
    setResult(evaluate(nextQuery));
    setDirty(false);
  };

  const reset = () => {
    const nextQuery = scenarios[datasetId][0];
    setScenario(0);
    setQuery(nextQuery);
    setResult(evaluate(nextQuery));
    setError("");
    setRunning(false);
    setDirty(false);
  };

  const nextScenario = () => {
    const nextIndex = (scenario + 1) % scenarios[datasetId].length;
    const nextQuery = scenarios[datasetId][nextIndex];
    setQuery(nextQuery);
    setDirty(false);
    applyQuery(nextQuery, nextIndex);
  };

  const quickQuery = (columns: string) => {
    const nextQuery = `SELECT ${columns}\nFROM ${dataset.table};`;
    setQuery(nextQuery);
    setDirty(false);
    applyQuery(nextQuery, scenario);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(query);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const lines = Math.max(2, query.split("\n").length);

  return <section className="sql-intro-lab" aria-label="Interactive SQL introduction">
    <header className="sql-intro-lab-header">
      <div className="sql-intro-lab-title">
        <span className="sql-intro-lab-icon"><Box size={24}/></span>
        <div><h2>Interactive Exploration</h2><p>Explore a real table, write your first SQL query, and see how SQL returns the data you want.</p></div>
      </div>
      <div className="sql-intro-controls">
        <label className="sql-intro-dataset"><span>Dataset</span><select aria-label="Dataset" value={datasetId} onChange={event => changeDataset(event.target.value)}>{datasets.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <button type="button" className="sql-intro-run" disabled={running} onClick={() => applyQuery()}><Play size={16} fill="currentColor"/>{running ? "Running…" : "Run Query"}</button>
        <button type="button" className="sql-intro-reset" onClick={reset}><RotateCcw size={15}/>Reset</button>
        <button type="button" className="sql-intro-next" onClick={nextScenario}>Next Scenario <ArrowRight size={16}/></button>
      </div>
    </header>

    <div className="sql-intro-workspace">
      <article className="sql-intro-stage">
        <div className="sql-intro-stage-heading"><span>1.</span><div><h3>The data</h3><p>This is the source table we will query.</p></div></div>
        <DataTable dataset={dataset}/>
      </article>

      <article className="sql-intro-stage sql-intro-query-stage">
        <div className="sql-intro-stage-heading"><Database size={17}/><div><h3>2. Write your first query</h3><p>Select all columns from the {dataset.table} table.</p></div></div>
        <div className="sql-intro-editor-shell">
          <div className="sql-intro-editor-top"><span><Database size={14}/> SQL</span><button type="button" onClick={copy}>{copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? "Copied" : "Copy"}</button></div>
          <div className="sql-intro-editor">
            <div className="sql-intro-line-numbers" aria-hidden="true">{Array.from({ length: lines }, (_, index) => <span key={index}>{index + 1}</span>)}</div>
            <pre aria-hidden="true"><code><SqlHighlight value={query}/></code></pre>
            <textarea
              aria-label="SQL query editor"
              spellCheck={false}
              value={query}
              onChange={event => { setQuery(event.target.value); setDirty(true); }}
            />
          </div>
        </div>
        <div className="sql-intro-query-chips" aria-label="Suggested queries">
          {["*", "id, name", "name, city"].map(columns => <button type="button" onClick={() => quickQuery(columns)} key={columns}>SELECT {columns}</button>)}
        </div>
        {dirty && <p className="sql-intro-ready" role="status">Query changed · choose Run Query to update the result.</p>}
      </article>

      <article className="sql-intro-stage sql-intro-result-stage">
        <div className="sql-intro-stage-heading sql-intro-result-heading"><CheckCircle2 size={21}/><div><h3>3. Query result</h3><p aria-live="polite">{error ? "Fix the query and run it again." : running ? "Executing query…" : `${result.rows.length} rows returned in ${result.elapsed} ms`}</p></div></div>
        {error ? <div className="sql-intro-error" role="alert"><TriangleAlert size={20}/><div><strong>Query error</strong><p>{error}</p></div></div> : <DataTable dataset={result} result/>}
      </article>
    </div>

    <div className="sql-intro-bottom">
      <section className="sql-intro-how">
        <h3><Lightbulb size={21}/>How it works?</h3>
        <div className="sql-intro-flow">
          <div><span className="sql-intro-flow-icon"><Database size={23}/></span><strong>Table rows</strong><p>Data is stored in rows<br/>and columns</p></div>
          <ArrowRight className="sql-intro-flow-arrow" size={22}/>
          <div><span className="sql-intro-flow-icon"><FileCode2 size={23}/></span><strong>SQL request</strong><p>You specify what<br/>columns/rows you want</p></div>
          <ArrowRight className="sql-intro-flow-arrow" size={22}/>
          <div><span className="sql-intro-flow-icon sql-intro-flow-success"><Table2 size={23}/></span><strong>Result rows</strong><p>Only the requested<br/>data is returned</p></div>
        </div>
      </section>

      <section className="sql-intro-takeaways">
        <h3><Table2 size={21}/>Key takeaways</h3>
        <ul>
          <li><CheckCircle2 size={17}/>A table stores data in rows and columns.</li>
          <li><CheckCircle2 size={17}/>SELECT chooses which columns to return.</li>
          <li><CheckCircle2 size={17}/>It does not modify the original data.</li>
          <li><CheckCircle2 size={17}/>It does not remove duplicate rows automatically.</li>
        </ul>
      </section>
    </div>
  </section>;
}
