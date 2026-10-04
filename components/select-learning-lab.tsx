"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Database,
  ExternalLink,
  Lightbulb,
  Play,
  RotateCcw,
  Target,
} from "lucide-react";

type ColumnKey =
  | "id"
  | "name"
  | "city"
  | "age"
  | "signup_date"
  | "country"
  | "plan"
  | "total_spend"
  | "is_active";

type SqlValue = string | number | boolean;
type Row = Record<ColumnKey, SqlValue>;

const columns: Array<{ key: ColumnKey; type: string }> = [
  { key: "id", type: "INT" },
  { key: "name", type: "VARCHAR" },
  { key: "city", type: "VARCHAR" },
  { key: "age", type: "INT" },
  { key: "signup_date", type: "DATE" },
  { key: "country", type: "VARCHAR" },
  { key: "plan", type: "VARCHAR" },
  { key: "total_spend", type: "DECIMAL" },
  { key: "is_active", type: "BOOLEAN" },
];

const customers: Row[] = [
  { id: 1, name: "Alice", city: "Chennai", age: 28, signup_date: "2023-01-15", country: "India", plan: "Pro", total_spend: 120.5, is_active: true },
  { id: 2, name: "Bob", city: "Mumbai", age: 34, signup_date: "2023-02-10", country: "India", plan: "Basic", total_spend: 50, is_active: true },
  { id: 3, name: "Carol", city: "Delhi", age: 25, signup_date: "2023-02-20", country: "India", plan: "Pro", total_spend: 310, is_active: false },
  { id: 4, name: "David", city: "Bangalore", age: 41, signup_date: "2023-03-05", country: "India", plan: "Enterprise", total_spend: 620, is_active: true },
  { id: 5, name: "Eva", city: "Hyderabad", age: 31, signup_date: "2023-03-18", country: "India", plan: "Basic", total_spend: 80, is_active: true },
  { id: 6, name: "Frank", city: "Pune", age: 38, signup_date: "2023-04-02", country: "India", plan: "Pro", total_spend: 220, is_active: true },
  { id: 7, name: "Grace", city: "Kolkata", age: 29, signup_date: "2023-04-12", country: "India", plan: "Basic", total_spend: 45, is_active: false },
  { id: 8, name: "Henry", city: "Ahmedabad", age: 36, signup_date: "2023-05-01", country: "India", plan: "Pro", total_spend: 178, is_active: true },
  { id: 9, name: "Irene", city: "Chennai", age: 32, signup_date: "2023-05-14", country: "India", plan: "Enterprise", total_spend: 540, is_active: true },
  { id: 10, name: "Jack", city: "Mumbai", age: 27, signup_date: "2023-06-10", country: "India", plan: "Basic", total_spend: 60, is_active: false },
];

const trialCustomers: Row[] = [
  { id: 21, name: "Maya", city: "Jaipur", age: 26, signup_date: "2023-07-03", country: "India", plan: "Basic", total_spend: 35, is_active: true },
  { id: 22, name: "Noah", city: "Kochi", age: 30, signup_date: "2023-07-11", country: "India", plan: "Pro", total_spend: 145, is_active: true },
  { id: 23, name: "Omar", city: "Lucknow", age: 33, signup_date: "2023-07-24", country: "India", plan: "Pro", total_spend: 210, is_active: false },
  { id: 24, name: "Priya", city: "Surat", age: 28, signup_date: "2023-08-02", country: "India", plan: "Enterprise", total_spend: 480, is_active: true },
  { id: 25, name: "Ravi", city: "Indore", age: 37, signup_date: "2023-08-19", country: "India", plan: "Basic", total_spend: 70, is_active: true },
  { id: 26, name: "Sara", city: "Mysuru", age: 24, signup_date: "2023-09-01", country: "India", plan: "Pro", total_spend: 160, is_active: false },
];

const datasets = {
  customers: { label: "Customers (10 rows)", table: "customers", rows: customers },
  trial: { label: "Trial cohort (6 rows)", table: "trial_customers", rows: trialCustomers },
} as const;

type DatasetKey = keyof typeof datasets;

const scenarios: Array<{ label: string; columns: ColumnKey[] }> = [
  { label: "Core identity", columns: ["id", "name", "city"] },
  { label: "Profile", columns: ["name", "age"] },
  { label: "Signup & plan", columns: ["signup_date", "plan"] },
  { label: "Spend snapshot", columns: ["name", "city", "total_spend"] },
];

const pretty = (value: SqlValue) => {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number" && !Number.isInteger(value)) return value.toFixed(2);
  return String(value);
};

export function SelectLearningLab() {
  const [datasetKey, setDatasetKey] = useState<DatasetKey>("customers");
  const [selected, setSelected] = useState<ColumnKey[]>(scenarios[0].columns);
  const [executed, setExecuted] = useState<ColumnKey[]>(scenarios[0].columns);
  const [scenario, setScenario] = useState(0);
  const [runState, setRunState] = useState<"ready" | "running" | "done">("done");
  const [phase,setPhase]=useState<'idle'|'read'|'project'|'return'|'complete'>('idle');
  const [scanRow,setScanRow]=useState(-1);
  const [visibleRows,setVisibleRows]=useState(customers.length);
  const [runCycle,setRunCycle]=useState(0);
  const timers=useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearRun=()=>{timers.current.forEach(clearTimeout);timers.current=[];};
  useEffect(()=>()=>{timers.current.forEach(clearTimeout);},[]);
  const cancelRun=()=>{clearRun();setPhase('idle');setScanRow(-1);setVisibleRows(100);};
  const [copied, setCopied] = useState(false);
  const [showFullData, setShowFullData] = useState(false);

  const dataset = datasets[datasetKey];
  const sql = selected.length
    ? `SELECT ${selected.join(", ")}\nFROM ${dataset.table};`
    : `-- Choose at least one column\nFROM ${dataset.table};`;


  const resultRows = useMemo(
    () => dataset.rows.map(row => executed.map(column => row[column])),
    [dataset, executed],
  );

  function toggleColumn(column: ColumnKey) {
    setSelected(current =>
      current.includes(column)
        ? current.filter(item => item !== column)
        : columns.filter(item => current.includes(item.key) || item.key === column).map(item => item.key),
    );
    cancelRun();
    setRunState("ready");
  }

  function runQuery() {
    if (!selected.length || runState==='running') return;
    clearRun();
    const chosen=[...selected];
    const count=dataset.rows.length;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setRunCycle(value=>value+1);
    setRunState('running');
    setPhase('read');
    setScanRow(0);
    const schedule=(fn:()=>void,delay:number)=>{timers.current.push(setTimeout(fn,delay));};
    if(reduced){
      setExecuted(chosen);setVisibleRows(count);setScanRow(-1);setPhase('complete');setRunState('done');return;
    }
    for(let index=1;index<count;index++)schedule(()=>setScanRow(index),index*110);
    const projectAt=count*110+250;
    schedule(()=>{setPhase('project');setScanRow(-1);setVisibleRows(0);setExecuted(chosen);},projectAt);
    const returnAt=projectAt+650;
    schedule(()=>setPhase('return'),returnAt);
    for(let index=0;index<count;index++)schedule(()=>setVisibleRows(index+1),returnAt+index*85);
    schedule(()=>{setPhase('complete');setRunState('done');},returnAt+count*85+200);
  }

  function applyScenario(index: number) {
    cancelRun();
    const next = scenarios[index];
    setScenario(index);
    setSelected([...next.columns]);
    setExecuted([...next.columns]);
    setRunState("done");
  }

  function reset() {
    cancelRun();
    setDatasetKey("customers");
    setScenario(0);
    setSelected([...scenarios[0].columns]);
    setExecuted([...scenarios[0].columns]);
    setRunState("done");
    setCopied(false);
    setShowFullData(false);
  }

  function changeDataset(value: DatasetKey) {
    cancelRun();
    setDatasetKey(value);
    setRunState("ready");
  }

  async function copySql() {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return <section className={`select-lab execution-${phase}`} aria-busy={runState==='running'} aria-label="Interactive SELECT simulation">
    <header className="select-lab-toolbar">
      <div className="select-lab-title">
        <span className="select-lab-icon"><Database size={24}/></span>
        <div><h2>Interactive Simulation</h2><p>Choose the columns you want to return and see how SELECT shapes the result.</p></div>
      </div>
      <div className="select-lab-actions">
        <label className="select-dataset">Dataset
          <select disabled={runState==='running'} value={datasetKey} onChange={event => changeDataset(event.target.value as DatasetKey)}>
            {Object.entries(datasets).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
          </select>
        </label>
        <button className="select-run" type="button" disabled={!selected.length || runState === "running"} onClick={runQuery}>
          <Play size={15} fill="currentColor"/>{runState === "running" ? "Running…" : "Run Query"}
        </button>
        <button type="button" className="select-reset" onClick={reset}><RotateCcw size={15}/>Reset</button>
        <button type="button" className="select-next" onClick={() => applyScenario((scenario + 1) % scenarios.length)}>Next Scenario <ArrowRight size={15}/></button>
      </div>
    </header>

    <div className="select-lab-main">
      <aside className="select-column-panel">
        <h3><span>1.</span> Select columns</h3>
        <p>Choose the columns to include in the result.</p>
        <div className="select-column-list">
          {columns.map(column => <label key={column.key} className={selected.includes(column.key) ? "is-selected" : ""}>
            <input disabled={runState==='running'} type="checkbox" checked={selected.includes(column.key)} onChange={() => toggleColumn(column.key)}/>
            <strong>{column.key}</strong><small>{column.type}</small>
          </label>)}
        </div>
      </aside>

      <div className="select-lab-stage">
        {phase!=='idle'&&<div className="select-execution-strip" role="status"><div>{[['read','Read records'],['project','Choose columns'],['return','Build result']].map(([step,label],index)=><span key={step} className={phase===step?'is-active':phase==='complete'||(['read','project','return'].indexOf(phase)>index)?'is-complete':''}><b>{index+1}</b>{label}</span>)}</div><p>{phase==='read'?`Reading row ${scanRow+1} of ${dataset.rows.length} from ${dataset.table}.`:phase==='project'?`Keeping ${selected.join(', ')}. Other columns stay in the source table.`:phase==='return'?`Copying the selected values into the result: ${visibleRows} of ${dataset.rows.length} rows.`:`Complete: ${dataset.rows.length} rows × ${executed.length} columns. Source data unchanged.`}</p></div>}
        <div className="select-data-flow">
          <section className="select-source-card">
            <header><h3><Database size={16}/> Source data ({dataset.table})</h3><button type="button" onClick={() => setShowFullData(value => !value)}><ExternalLink size={14}/>{showFullData ? "Close full data" : "View full data"}</button></header>
            <div className="select-table-scroll">
              <table>
                <thead><tr>{columns.map(column => <th key={column.key} className={selected.includes(column.key) ? "is-selected" : ""}>{column.key}</th>)}</tr></thead>
                <tbody>{dataset.rows.map(row => <tr key={String(row.id)} className={phase==='read'&&dataset.rows[scanRow]?.id===row.id?'execution-current':''}>{columns.map(column => <td key={column.key} className={selected.includes(column.key) ? "is-selected" : ""}>{column.key === "is_active" ? <span className={row.is_active ? "select-bool true" : "select-bool false"}>{pretty(row[column.key])}</span> : pretty(row[column.key])}</td>)}</tr>)}</tbody>
              </table>
            </div>
            {showFullData && <div className="select-full-data" role="status">Full dataset visible · {dataset.rows.length} rows × {columns.length} columns. SELECT reads this table; it does not modify it.</div>}
          </section>

          <div className="select-flow-arrow" aria-hidden="true"><ArrowRight size={21}/><i/><i/><i/></div>

          <section className="select-result-card" aria-live="polite">
            <header><h3><Database size={16}/> 3. Query result <small>({executed.length} columns • {dataset.rows.length} rows)</small></h3></header>
            <div className="select-result-scroll">
              <table>
                <thead><tr>{executed.map(column => <th key={column}>{column}</th>)}</tr></thead>
                <tbody>{resultRows.map((row,index)=><tr key={`${runCycle}-${dataset.rows[index].id}`} className={phase==='project'||phase==='return'?(index<visibleRows?'execution-arrived':'execution-pending'):''}>{row.map((value,cell)=><td key={executed[cell]}>{pretty(value)}</td>)}</tr>)}</tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="select-lab-bottom">
          <section className="select-sql-card">
            <header><h3><Database size={16}/> 4. Generated SQL</h3><button type="button" onClick={copySql}>{copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? "Copied" : "Copy"}</button></header>
            <div className="select-sql-lines" aria-label="Generated SQL">
              <span className="line-no">1</span><code><b>SELECT</b> {selected.join(", ") || "…"}</code>
              <span className="line-no">2</span><code><b>FROM</b> {dataset.table};</code>
            </div>
          </section>
          <aside className="select-explainer">
            <h3><Lightbulb size={17}/> What happened?</h3>
            <p><CheckCircle2 size={14}/> Only the selected columns are returned.</p>
            <p><CheckCircle2 size={14}/> All {dataset.rows.length} rows are included (no filtering).</p>
            <p><CheckCircle2 size={14}/> The original table is not modified.</p>
            <p><CheckCircle2 size={14}/> Column order follows your selection.</p>
          </aside>
        </div>
      </div>
    </div>

    <footer className="select-challenge">
      <div><Target size={29}/><span><strong>Try it yourself</strong><small>Change the selected columns and run the query. Try different datasets.</small></span></div>
      <div className="select-challenge-grid" aria-label="Suggested challenges">
        <strong>Suggested challenges:</strong>
        <button type="button" onClick={() => applyScenario(1)}>○ Select only name and age</button>
        <button type="button" onClick={() => applyScenario(3)}>○ Select name, city and total_spend</button>
        <button type="button" onClick={() => applyScenario(2)}>○ Include signup_date and plan</button>
        <button type="button" onClick={() => { changeDataset(datasetKey === "customers" ? "trial" : "customers"); }}>○ Try with a different dataset</button>
      </div>
    </footer>
  </section>;
}
