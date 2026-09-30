"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Box,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Database,
  FileBarChart,
  Gauge,
  GraduationCap,
  Network,
  Play,
  RefreshCcw,
  ShoppingCart,
  Table2,
  Timer,
  UsersRound,
  Zap,
} from "lucide-react";
import { useCompanion } from "@/components/companion-context";

type ScenarioId = "orders" | "customers" | "monthly" | "inventory";
type SimulationPhase = "ready" | "oltp" | "olap" | "done";
type CodeSide = "oltp" | "olap";

type DataRow = Record<string, string | number>;

type Scenario = {
  id: ScenarioId;
  name: string;
  description: string;
  oltpAction: string;
  oltpLatency: string;
  oltpTransactions: string;
  oltpCode: string;
  oltpTableTitle: string;
  oltpColumns: string[];
  oltpRows: DataRow[];
  olapAction: string;
  olapLatency: string;
  olapRowsScanned: string;
  olapCode: string;
  olapTableTitle: string;
  olapColumns: string[];
  olapRows: DataRow[];
};

const SCENARIOS: Scenario[] = [
  {
    id: "orders",
    name: "Order Analysis",
    description: "Process new orders and analyze recent sales.",
    oltpAction: "Execute Transaction (Insert new order)",
    oltpLatency: "25 ms",
    oltpTransactions: "500",
    oltpCode: `INSERT INTO orders (order_id, customer_id, product_id, quantity,
  order_date, amount)
VALUES (106, 3, 25, 2, '2024-03-08', 120.00);`,
    oltpTableTitle: "Orders (Latest)",
    oltpColumns: ["order_id", "customer_id", "product_id", "order_date", "amount"],
    oltpRows: [
      { order_id: 106, customer_id: 3, product_id: 25, order_date: "2024-03-08", amount: "120.00" },
      { order_id: 105, customer_id: 2, product_id: 18, order_date: "2024-03-07", amount: "80.00" },
      { order_id: 104, customer_id: 5, product_id: 11, order_date: "2024-03-06", amount: "75.00" },
      { order_id: 103, customer_id: 1, product_id: 20, order_date: "2024-03-05", amount: "50.00" },
      { order_id: 102, customer_id: 2, product_id: 10, order_date: "2024-03-02", amount: "60.00" },
    ],
    olapAction: "Run Analytical Query (Top 5 products by revenue)",
    olapLatency: "1.8 sec",
    olapRowsScanned: "2.4M",
    olapCode: `SELECT p.product_name,
       COUNT(DISTINCT f.order_id) AS total_orders,
       SUM(f.amount) AS total_revenue
FROM fact_sales f
JOIN dim_product p ON f.product_id = p.product_id
GROUP BY p.product_name
ORDER BY revenue DESC
LIMIT 5;`,
    olapTableTitle: "Query Result (Top 5 products)",
    olapColumns: ["product_name", "total_orders", "total_revenue"],
    olapRows: [
      { product_name: "Laptop", total_orders: "1,240", total_revenue: "248,000" },
      { product_name: "Phone", total_orders: "1,120", total_revenue: "224,000" },
      { product_name: "Tablet", total_orders: "980", total_revenue: "147,000" },
      { product_name: "Monitor", total_orders: "860", total_revenue: "120,000" },
      { product_name: "Keyboard", total_orders: "720", total_revenue: "86,000" },
    ],
  },
  {
    id: "customers",
    name: "Customer Insights",
    description: "Find top customers by revenue.",
    oltpAction: "Execute Transaction (Update customer profile)",
    oltpLatency: "18 ms",
    oltpTransactions: "320",
    oltpCode: `UPDATE customers
SET city = 'Bengaluru', updated_at = '2024-03-08'
WHERE customer_id = 3;`,
    oltpTableTitle: "Customers (Latest)",
    oltpColumns: ["customer_id", "name", "city", "status"],
    oltpRows: [
      { customer_id: 3, name: "Carol", city: "Bengaluru", status: "Active" },
      { customer_id: 2, name: "Bob", city: "Mumbai", status: "Active" },
      { customer_id: 1, name: "Alice", city: "Chennai", status: "Active" },
      { customer_id: 5, name: "Eva", city: "Delhi", status: "Active" },
      { customer_id: 4, name: "David", city: "Pune", status: "Active" },
    ],
    olapAction: "Run Analytical Query (Top customers by revenue)",
    olapLatency: "1.4 sec",
    olapRowsScanned: "1.9M",
    olapCode: `SELECT c.customer_name,
       COUNT(DISTINCT f.order_id) AS orders,
       SUM(f.amount) AS revenue
FROM fact_sales f
JOIN dim_customer c ON f.customer_id = c.customer_id
GROUP BY c.customer_name
ORDER BY revenue DESC
LIMIT 5;`,
    olapTableTitle: "Query Result (Top customers)",
    olapColumns: ["customer_name", "orders", "revenue"],
    olapRows: [
      { customer_name: "Alice", orders: "412", revenue: "92,400" },
      { customer_name: "Bob", orders: "366", revenue: "84,200" },
      { customer_name: "Carol", orders: "305", revenue: "74,600" },
      { customer_name: "Eva", orders: "289", revenue: "68,900" },
      { customer_name: "David", orders: "241", revenue: "55,700" },
    ],
  },
  {
    id: "monthly",
    name: "Monthly Reporting",
    description: "Generate monthly category sales.",
    oltpAction: "Execute Transaction (Record completed order)",
    oltpLatency: "22 ms",
    oltpTransactions: "450",
    oltpCode: `UPDATE orders
SET status = 'Completed', completed_at = '2024-03-31'
WHERE order_id = 106;`,
    oltpTableTitle: "Orders (Recent completions)",
    oltpColumns: ["order_id", "customer_id", "order_date", "status"],
    oltpRows: [
      { order_id: 106, customer_id: 3, order_date: "2024-03-31", status: "Completed" },
      { order_id: 105, customer_id: 2, order_date: "2024-03-30", status: "Completed" },
      { order_id: 104, customer_id: 5, order_date: "2024-03-29", status: "Completed" },
      { order_id: 103, customer_id: 1, order_date: "2024-03-28", status: "Completed" },
      { order_id: 102, customer_id: 2, order_date: "2024-03-27", status: "Completed" },
    ],
    olapAction: "Run Analytical Query (Monthly category sales)",
    olapLatency: "2.1 sec",
    olapRowsScanned: "3.1M",
    olapCode: `SELECT d.month, p.category,
       COUNT(DISTINCT f.order_id) AS orders,
       SUM(f.amount) AS revenue
FROM fact_sales f
JOIN dim_date d ON f.date_id = d.date_id
JOIN dim_product p ON f.product_id = p.product_id
GROUP BY d.month, p.category
ORDER BY d.month, revenue DESC;`,
    olapTableTitle: "Query Result (March categories)",
    olapColumns: ["month", "category", "orders", "revenue"],
    olapRows: [
      { month: "2024-03", category: "Electronics", orders: "2,481", revenue: "622,400" },
      { month: "2024-03", category: "Office", orders: "1,740", revenue: "188,600" },
      { month: "2024-03", category: "Home", orders: "1,322", revenue: "164,900" },
      { month: "2024-03", category: "Accessories", orders: "1,118", revenue: "123,700" },
      { month: "2024-03", category: "Books", orders: "904", revenue: "76,200" },
    ],
  },
  {
    id: "inventory",
    name: "Inventory Analysis",
    description: "Find slow moving products.",
    oltpAction: "Execute Transaction (Adjust inventory)",
    oltpLatency: "16 ms",
    oltpTransactions: "280",
    oltpCode: `UPDATE inventory
SET on_hand = on_hand - 2,
    updated_at = '2024-03-08'
WHERE product_id = 25 AND warehouse_id = 2;`,
    oltpTableTitle: "Inventory (Latest)",
    oltpColumns: ["product_id", "warehouse_id", "on_hand", "status"],
    oltpRows: [
      { product_id: 25, warehouse_id: 2, on_hand: 18, status: "In stock" },
      { product_id: 18, warehouse_id: 1, on_hand: 42, status: "In stock" },
      { product_id: 11, warehouse_id: 3, on_hand: 7, status: "Low" },
      { product_id: 20, warehouse_id: 2, on_hand: 64, status: "In stock" },
      { product_id: 10, warehouse_id: 1, on_hand: 31, status: "In stock" },
    ],
    olapAction: "Run Analytical Query (Slow-moving inventory)",
    olapLatency: "1.6 sec",
    olapRowsScanned: "2.0M",
    olapCode: `SELECT p.product_name,
       SUM(f.quantity) AS units_90d,
       i.on_hand
FROM fact_sales f
JOIN dim_product p ON f.product_id = p.product_id
JOIN inventory_snapshot i ON f.product_id = i.product_id
WHERE f.sale_date >= DATE '2023-12-10'
GROUP BY p.product_name, i.on_hand
ORDER BY units_90d ASC
LIMIT 5;`,
    olapTableTitle: "Query Result (Slow-moving products)",
    olapColumns: ["product_name", "units_90d", "on_hand"],
    olapRows: [
      { product_name: "Dock", units_90d: "22", on_hand: "140" },
      { product_name: "Webcam", units_90d: "31", on_hand: "112" },
      { product_name: "Mouse Pad", units_90d: "38", on_hand: "206" },
      { product_name: "USB Hub", units_90d: "45", on_hand: "97" },
      { product_name: "Headset", units_90d: "52", on_hand: "88" },
    ],
  },
];

function scenarioIcon(id: ScenarioId) {
  if (id === "orders") return <ShoppingCart size={18}/>;
  if (id === "customers") return <UsersRound size={18}/>;
  if (id === "monthly") return <BarChart3 size={18}/>;
  return <Box size={18}/>;
}

function DataTable({
  columns,
  rows,
  highlightFirst = false,
}: {
  columns: string[];
  rows: DataRow[];
  highlightFirst?: boolean;
}) {
  return (
    <div className="molap-table-wrap">
      <table>
        <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index} className={highlightFirst && index === 0 ? "is-new" : ""}>{columns.map((column) => <td key={column}>{String(row[column])}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function CodePanel({
  code,
  side,
  copied,
  onCopy,
}: {
  code: string;
  side: CodeSide;
  copied: CodeSide | null;
  onCopy: (side: CodeSide, code: string) => void;
}) {
  return (
    <div className="molap-code">
      <button type="button" onClick={() => onCopy(side, code)} aria-label={`Copy ${side.toUpperCase()} SQL`}><Copy size={13}/><span>{copied === side ? "Copied" : "Copy"}</span></button>
      <pre tabIndex={0}><code>{code}</code></pre>
    </div>
  );
}

export function ModelingOltpOlapHero({
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
    <section className="molap-hero" aria-labelledby="molap-hero-title">
      <div className="molap-hero-copy">
        <div className="molap-breadcrumb"><span>Data Modeling</span><ChevronRight size={13}/><strong>OLTP vs OLAP</strong></div>
        <div className="molap-title-row"><span className="molap-hero-icon"><Zap size={24}/></span><div><h1 id="molap-hero-title">OLTP vs OLAP</h1><p>{description}</p></div></div>
        <div className="molap-meta"><span><Clock3 size={14}/>{minutes} min</span><span><GraduationCap size={14}/>Lesson {currentLesson + 1}/{total}</span></div>
      </div>

      <div className="molap-hero-art" aria-hidden="true">
        <div className="molap-art-db molap-art-oltp"><Database size={67}/><b>OLTP</b></div>
        <div className="molap-art-vs">VS</div>
        <div className="molap-art-db molap-art-olap"><Database size={67}/><b>OLAP</b></div>
        <i className="molap-art-wire molap-wire-a"/><i className="molap-art-wire molap-wire-b"/><i className="molap-art-wire molap-wire-c"/>
      </div>

      <div className="molap-hero-actions">
        <span className="molap-difficulty">Intermediate</span>
        <div><button type="button" aria-label="Previous lesson" onClick={onPrevious} disabled={currentLesson === 0}><ChevronLeft size={18}/></button><button type="button" className="molap-next" onClick={onNext} disabled={currentLesson === total - 1}>Next <ChevronRight size={17}/></button></div>
      </div>
    </section>
  );
}

export function ModelingOltpOlapSimulation() {
  const companion = useCompanion();
  const [scenarioId, setScenarioId] = useState<ScenarioId>("orders");
  const [phase, setPhase] = useState<SimulationPhase>("done");
  const [copied, setCopied] = useState<CodeSide | null>(null);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scenario = useMemo(() => SCENARIOS.find((item) => item.id === scenarioId) ?? SCENARIOS[0], [scenarioId]);
  const phaseIndex = phase === "ready" ? 0 : phase === "oltp" ? 1 : phase === "olap" ? 2 : 3;

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
    setPhase("ready");
    setCopied(null);
  };

  const run = () => {
    clearTimers();
    setPhase("ready");
    const first = setTimeout(() => setPhase("oltp"), 180);
    const second = setTimeout(() => setPhase("olap"), 720);
    const third = setTimeout(() => {
      setPhase("done");
      companion?.emit({ type: "exercise_correct", lesson: "OLTP vs OLAP", source: "runner" });
    }, 1260);
    timers.current.push(first, second, third);
  };

  const reset = () => {
    clearTimers();
    setScenarioId("orders");
    setPhase("done");
    setCopied(null);
  };

  const copyCode = async (side: CodeSide, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(side);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  };

  return (
    <section className="molap-simulation" aria-labelledby="molap-simulation-title">
      <header className="molap-simulation-head">
        <div><h2 id="molap-simulation-title"><Network size={23}/>Interactive Simulation</h2><p>Run the same business scenario across OLTP and OLAP and observe the differences in access pattern, data model and behavior.</p></div>
        <div className="molap-controls">
          <button type="button" className="molap-run" onClick={run}><Play size={14}/>{phase === "oltp" || phase === "olap" ? "Running…" : "Run Simulation"}</button>
          <button type="button" className="molap-reset" onClick={reset}><RefreshCcw size={14}/>Reset</button>
          <select aria-label="Simulation scenario" value={scenarioId} onChange={(event) => chooseScenario(event.target.value as ScenarioId)}>
            {SCENARIOS.map((item, index) => <option key={item.id} value={item.id}>{`Scenario ${index + 1}: ${item.name}`}</option>)}
          </select>
        </div>
      </header>

      <div className="molap-main-grid">
        <aside className="molap-workload">
          <header><FileBarChart size={18}/><strong>Workload</strong></header>
          <div>
            {SCENARIOS.map((item) => <button type="button" key={item.id} aria-pressed={scenarioId === item.id} onClick={() => chooseScenario(item.id)}>
              <span>{scenarioIcon(item.id)}</span>
              <div><strong>{item.name}</strong><small>{item.description}</small></div>
            </button>)}
          </div>
        </aside>

        <section className={`molap-system molap-oltp ${phaseIndex >= 1 ? "is-active" : "is-future"} ${phase === "oltp" ? "is-running" : ""}`}>
          <header className="molap-system-head">
            <span><Database size={23}/></span>
            <div><h3>OLTP <small>(Transactional System)</small></h3><p>Optimized for frequent inserts, updates and small transactions.</p></div>
            <b>Row based • Real-time</b>
          </header>

          <div className="molap-metrics">
            <article><Timer size={13}/><strong>{scenario.oltpLatency}</strong><small>Avg. response</small></article>
            <article><FileBarChart size={13}/><strong>{scenario.oltpTransactions}</strong><small>Transactions</small></article>
            <article><CheckCircle2 size={13}/><strong>Success</strong><small>100%</small></article>
            <article><Table2 size={13}/><strong>Row store</strong><small>Normalized</small></article>
          </div>

          <div className="molap-action-title"><strong>{scenario.oltpAction.split(" (")[0]}</strong>{scenario.oltpAction.includes(" (") && <span> ({scenario.oltpAction.split(" (")[1]}</span>}</div>
          <CodePanel code={scenario.oltpCode} side="oltp" copied={copied} onCopy={copyCode}/>
          <h4>{scenario.oltpTableTitle}</h4>
          <DataTable columns={scenario.oltpColumns} rows={scenario.oltpRows} highlightFirst={phaseIndex >= 1}/>
        </section>

        <section className={`molap-system molap-olap ${phaseIndex >= 2 ? "is-active" : "is-future"} ${phase === "olap" ? "is-running" : ""}`}>
          <header className="molap-system-head">
            <span><Database size={23}/></span>
            <div><h3>OLAP <small>(Analytical System)</small></h3><p>Optimized for complex queries and aggregations across large data.</p></div>
            <b>Column based • Batch/Query</b>
          </header>

          <div className="molap-metrics">
            <article><Timer size={13}/><strong>{scenario.olapLatency}</strong><small>Query time</small></article>
            <article><FileBarChart size={13}/><strong>{scenario.olapRowsScanned}</strong><small>Rows scanned</small></article>
            <article><CheckCircle2 size={13}/><strong>Success</strong><small>100%</small></article>
            <article><Database size={13}/><strong>Column store</strong><small>Star Schema</small></article>
          </div>

          <div className="molap-action-title"><strong>{scenario.olapAction.split(" (")[0]}</strong>{scenario.olapAction.includes(" (") && <span> ({scenario.olapAction.split(" (")[1]}</span>}</div>
          <CodePanel code={scenario.olapCode} side="olap" copied={copied} onCopy={copyCode}/>
          <h4>{scenario.olapTableTitle}</h4>
          <DataTable columns={scenario.olapColumns} rows={scenario.olapRows}/>
        </section>
      </div>

      <section className={`molap-visual-comparison ${phase === "done" ? "is-complete" : ""}`}>
        <header><FileBarChart size={18}/><strong>Visual Comparison</strong><span>Same data. Different workload. Different design. Different performance profile.</span></header>
        <div>
          <article className="molap-compare-green"><ShoppingCart size={19}/><div><h4>Data Access Pattern</h4><p><b>OLTP:</b> Few rows (point lookup)</p><p><b>OLAP:</b> Many rows (scans)</p></div></article>
          <article className="molap-compare-violet"><Table2 size={19}/><div><h4>Data Model</h4><p><b>OLTP:</b> Normalized (3NF)</p><p><b>OLAP:</b> Denormalized (Star)</p></div></article>
          <article className="molap-compare-orange"><Gauge size={19}/><div><h4>Performance</h4><p><b>OLTP:</b> Milliseconds (fast writes)</p><p><b>OLAP:</b> Seconds (complex queries)</p></div></article>
          <article className="molap-compare-blue"><Database size={19}/><div><h4>Typical Use Cases</h4><p><b>OLTP:</b> Run the business</p><p><b>OLAP:</b> Analyze the business</p></div></article>
        </div>
        <small>Displayed timings and scan counts are deterministic teaching values for this front-end simulation, not benchmark guarantees.</small>
      </section>

      <span className="molap-status" role="status">
        {phase === "ready" ? `${scenario.name} selected. Ready to run.` : phase === "oltp" ? "Executing the transactional workload on OLTP." : phase === "olap" ? "Executing the analytical workload on OLAP." : `${scenario.name} comparison complete.`}
      </span>
    </section>
  );
}
