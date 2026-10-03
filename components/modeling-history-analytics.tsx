"use client";

import { useEffect, useRef, useState } from "react";
import { Play, RefreshCcw, ArrowRight } from "lucide-react";
import { SqlSampleTable } from "@/components/sql-fundamentals-visual";
import { modelTables } from "@/lib/data-modeling";
import type { SqlTable } from "@/lib/sql-lessons";

// Both labs execute deterministic transformations against the displayed local rows.
export function ModelingHistorySimulation() {
  const [policy, setPolicy] = useState("2");
  const [scenario, setScenario] = useState(0);
  const [date, setDate] = useState("2026-01-10");
  const [phase, setPhase] = useState<"ready" | "running" | "done">("ready");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const city = ["Bangalore", "Pune"][scenario];
  const clear = () => { if (timer.current) clearTimeout(timer.current); setPhase("ready"); };
  const run = () => { clear(); setPhase("running"); timer.current = setTimeout(() => setPhase("done"), 650); };
  const reset = () => { clear(); setPolicy("2"); setScenario(0); setDate("2026-01-10"); };
  const complete = phase === "done";
  const rows: SqlTable["rows"] = !complete
    ? [[101, 1, "Alice", "Chennai", "2026-01-01", null]]
    : policy === "1"
      ? [[101, 1, "Alice", city, "2026-01-01", null]]
      : [[101, 1, "Alice", "Chennai", "2026-01-01", "2026-02-01"], [205, 1, "Alice", city, "2026-02-01", null]];
  const match = rows.find(row => String(row[4]) <= date && (row[5] === null || date < String(row[5])));
  return <section className="model-history-lab" aria-label="History simulation">
    <h2>Customer History Lab</h2>
    <p>Apply a February 1 address change, then resolve a sale against the selected history policy.</p>
    <div className="model-options" role="group" aria-label="History policy">
      <button aria-pressed={policy === "1"} onClick={() => { clear(); setPolicy("1"); }}>Type 1 · overwrite</button>
      <button aria-pressed={policy === "2"} onClick={() => { clear(); setPolicy("2"); }}>Type 2 · keep versions</button>
    </div>
    <div className="model-timeline"><span>January 1<br/><b>Chennai</b></span><ArrowRight/><span>February 1 · Alice moves<br/><b>{city}</b></span></div>
    <div className="model-lab-controls">
      <button className="model-run" onClick={run} disabled={phase === "running"}><Play size={15}/>{phase === "running" ? "Applying change…" : "Run Simulation"}</button>
      <button className="model-reset" onClick={reset}><RefreshCcw size={15}/>Reset</button>
      <button onClick={() => { clear(); setScenario(value => (value + 1) % 2); }}>Next Scenario</button>
    </div>
    <SqlSampleTable table={{ title: complete ? "Customer dimension · after update" : "Customer dimension · before update", columns: modelTables.history.columns, rows }}/>
    <label className="model-date">Inspect a sale on <select value={date} onChange={event => setDate(event.target.value)}>
      <option value="2026-01-10">January 10</option><option value="2026-02-01">February 1 (boundary)</option><option value="2026-02-15">February 15</option>
    </select></label>
    <p role="status">{phase === "running" ? "Applying the selected update policy…" : !complete ? "Ready. Run the simulation to apply the address change." : policy === "1" ? `Update complete. Sale resolves to key 101, ${city}. The previous city has been overwritten, including for January reporting.` : `Update complete. ${date} resolves to key ${match?.[0]}, ${match?.[3]}. Exactly one interval matches.`}</p>
    <p>Type 2 uses start_date ≤ sale date &lt; end_date. The prior version ends exactly when its replacement starts.</p>
  </section>;
}

const questions = [
  { name: "Revenue by month", dimension: "Date", key: "date_key", label: "month", table: modelTables.dimDate, field: 2, factField: 4 },
  { name: "Revenue by category", dimension: "Product", key: "product_key", label: "category", table: modelTables.dimProduct, field: 2, factField: 3 },
  { name: "Top customers", dimension: "Customer", key: "customer_key", label: "customer", table: modelTables.dimCustomer, field: 2, factField: 2 },
  { name: "Revenue by store region", dimension: "Store", key: "store_key", label: "region", table: modelTables.dimStore, field: 2, factField: 5 },
];
export function ModelingAnalyticsSimulation() {
  const [question, setQuestion] = useState(0);
  const [scenario, setScenario] = useState(0);
  const [phase, setPhase] = useState<"ready" | "running" | "done">("ready");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const clear = () => { if (timer.current) clearTimeout(timer.current); setPhase("ready"); };
  const selected = questions[question];
  const facts = scenario === 0 ? modelTables.fact.rows : modelTables.fact.rows.slice(0, 2);
  const totals = new Map<string, number>();
  for (const row of facts) {
    const dimension = selected.table.rows.find(item => item[0] === row[selected.factField]);
    const label = String(dimension?.[selected.field] ?? "Unknown");
    totals.set(label, (totals.get(label) ?? 0) + Number(row[7]));
  }
  const results = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  return <section aria-label="Analytics simulation">
    <h2>Business Question → Analytical Result</h2>
    <p>Select a question and aggregate the displayed fact rows through its dimension key. Values use one currency.</p>
    <div className="model-options" role="group" aria-label="Business question">{questions.map((item, index) => <button key={item.key} aria-pressed={index === question} onClick={() => { clear(); setQuestion(index); }}>{item.name}</button>)}</div>
    <div className="model-chain"><div><b>Grain</b><small>One order line</small></div><ArrowRight/><div><b>{selected.dimension} dimension</b><small>{selected.key}</small></div><ArrowRight/><div><b>Measure</b><small>SUM(revenue)</small></div></div>
    <SqlSampleTable table={{ ...modelTables.fact, title: scenario === 0 ? "All orders · 4 sale lines" : "Order 501 only · 2 sale lines", rows: facts }}/>
    <div className="model-lab-controls">
      <button className="model-run" disabled={phase === "running"} onClick={() => { clear(); setPhase("running"); timer.current = setTimeout(() => setPhase("done"), 650); }}><Play size={15}/>{phase === "running" ? "Aggregating…" : "Run Simulation"}</button>
      <button className="model-reset" onClick={() => { clear(); setQuestion(0); setScenario(0); }}><RefreshCcw size={15}/>Reset</button>
      <button onClick={() => { clear(); setScenario(value => (value + 1) % 2); }}>Next Scenario</button>
    </div>
    {phase === "done" && <SqlSampleTable table={{ title: selected.name, columns: [selected.label, "revenue"], rows: results }}/>}
    <p role="status">{phase === "running" ? `Joining ${facts.length} fact rows and aggregating revenue…` : phase === "done" ? `Complete: ${facts.length} lines → ${results.length} groups. Total revenue ${results.reduce((sum, row) => sum + row[1], 0)}.` : "Ready. Run the simulation to build the result."}</p>
    <p className="model-caption">Computed locally from the sample rows; this is a relational simulation, not a SQL engine.</p>
  </section>;
}

