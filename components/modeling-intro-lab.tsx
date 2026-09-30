"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  GraduationCap,
  KeyRound,
  Layers3,
  Network,
  Package,
  Play,
  Plus,
  RefreshCcw,
  RotateCcw,
  ShoppingCart,
  Table2,
  UserRound,
} from "lucide-react";

type TableKey = "Customer" | "Order" | "Product" | "Order Item";
type SimStatus = "idle" | "running" | "complete";

type TableState = Record<TableKey, Array<Record<string, string | number>>>;

const TABLE_TABS: TableKey[] = ["Customer", "Order", "Product", "Order Item"];
const STEPS = [
  { title: "Define Entities", log: "[1/4] Creating tables... Completed" },
  { title: "Add Data", log: "[2/4] Inserting sample data... Completed" },
  { title: "View Relationships", log: "[3/4] Building relationships... Completed" },
  { title: "Explore Model", log: "[4/4] Generating ER diagram... Completed" },
] as const;

const INITIAL_TABLES: TableState = {
  Customer: [
    { customer_id: 1, name: "Alice", city: "New York", email: "alice@ex.com" },
    { customer_id: 2, name: "Bob", city: "Chicago", email: "bob@ex.com" },
    { customer_id: 3, name: "Carol", city: "Boston", email: "carol@ex.com" },
    { customer_id: 4, name: "David", city: "Seattle", email: "david@ex.com" },
    { customer_id: 5, name: "Emma", city: "Austin", email: "emma@ex.com" },
  ],
  Order: [
    { order_id: 501, customer_id: 1, order_date: "2026-01-10", total_amount: 130 },
    { order_id: 502, customer_id: 1, order_date: "2026-01-18", total_amount: 50 },
    { order_id: 503, customer_id: 2, order_date: "2026-01-24", total_amount: 20 },
  ],
  Product: [
    { product_id: 10, name: "Notebook", category: "Stationery", price: 50 },
    { product_id: 20, name: "Pen", category: "Stationery", price: 10 },
    { product_id: 30, name: "Backpack", category: "Bags", price: 80 },
  ],
  "Order Item": [
    { order_id: 501, product_id: 10, quantity: 2, unit_price: 50 },
    { order_id: 501, product_id: 20, quantity: 3, unit_price: 10 },
    { order_id: 502, product_id: 10, quantity: 1, unit_price: 50 },
    { order_id: 503, product_id: 20, quantity: 2, unit_price: 10 },
  ],
};

const ENTITY_FIELDS = {
  Customer: [
    ["customer_id", "INT", "pk"],
    ["name", "VARCHAR", ""],
    ["city", "VARCHAR", ""],
    ["email", "VARCHAR", ""],
  ],
  Order: [
    ["order_id", "INT", "pk"],
    ["customer_id", "INT", "fk"],
    ["order_date", "DATE", ""],
    ["total_amount", "DECIMAL", ""],
  ],
  Product: [
    ["product_id", "INT", "pk"],
    ["name", "VARCHAR", ""],
    ["category", "VARCHAR", ""],
    ["price", "DECIMAL", ""],
  ],
  "Order Item": [
    ["order_id", "INT", "fk"],
    ["product_id", "INT", "fk"],
    ["quantity", "INT", ""],
    ["unit_price", "DECIMAL", ""],
  ],
} as const;

const cloneInitial = (): TableState =>
  Object.fromEntries(
    TABLE_TABS.map((key) => [key, INITIAL_TABLES[key].map((row) => ({ ...row }))]),
  ) as TableState;

function EntityCard({
  entity,
  icon,
  tone,
  selected,
  onSelect,
  className = "",
}: {
  entity: TableKey;
  icon: React.ReactNode;
  tone: "violet" | "green" | "orange" | "pink";
  selected: boolean;
  onSelect: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`dmi-entity-card dmi-tone-${tone} ${className}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="dmi-entity-title">{icon}<strong>{entity}</strong></span>
      <span className="dmi-field-list">
        {ENTITY_FIELDS[entity].map(([name, type, key]) => (
          <span className="dmi-field" key={name}>
            <span>{key && <KeyRound size={11}/>}<b>{name}</b></span>
            <small>{type}</small>
          </span>
        ))}
      </span>
    </button>
  );
}

function DataTable({
  rows,
}: {
  rows: Array<Record<string, string | number>>;
}) {
  const columns = Object.keys(rows[0] || {});
  return (
    <div className="dmi-table-scroll">
      <table>
        <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column) => <td key={column}>{String(row[column])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MiniModel({ activeStep }: { activeStep: number }) {
  const relationshipActive = activeStep >= 2;
  return (
    <div className="dmi-mini-model" aria-label="Entity relationship diagram">
      <div className="dmi-mini-card dmi-mini-customer"><UserRound size={14}/><strong>Customer</strong><small><KeyRound size={10}/>customer_id</small></div>
      <span className={relationshipActive ? "is-active" : ""}>1</span>
      <i className={relationshipActive ? "is-active" : ""}/>
      <div className="dmi-mini-card dmi-mini-order"><ShoppingCart size={14}/><strong>Order</strong><small><KeyRound size={10}/>order_id</small></div>
      <span className={relationshipActive ? "is-active" : ""}>M</span>
      <i className={relationshipActive ? "is-active" : ""}/>
      <div className="dmi-mini-card dmi-mini-item"><Table2 size={14}/><strong>Order Item</strong><small><KeyRound size={10}/>order_id + product_id</small></div>
      <span className={relationshipActive ? "is-active" : ""}>M</span>
      <i className={relationshipActive ? "is-active" : ""}/>
      <div className="dmi-mini-card dmi-mini-product"><Package size={14}/><strong>Product</strong><small><KeyRound size={10}/>product_id</small></div>
    </div>
  );
}

export function ModelingIntroHero({
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
    <section className="dmi-hero" aria-labelledby="dmi-hero-title">
      <div className="dmi-hero-copy">
        <div className="dmi-breadcrumb"><span>Data Modeling</span><ChevronRight size={13}/><strong>Data Modeling Introduction</strong></div>
        <div className="dmi-hero-heading">
          <span className="dmi-hero-icon"><Database size={24}/></span>
          <div><h1 id="dmi-hero-title">Data Modeling Introduction</h1><p>{description}</p></div>
        </div>
        <div className="dmi-hero-meta">
          <span><Clock3 size={14}/>{minutes} min</span>
          <span><GraduationCap size={14}/>Lesson {currentLesson + 1}/{total}</span>
        </div>
      </div>
      <div className="dmi-hero-art" aria-hidden="true">
        <div className="dmi-art-db dmi-art-db-left"><Database size={45}/></div>
        <div className="dmi-art-db dmi-art-db-center"><Database size={56}/></div>
        <div className="dmi-art-chart"><BarChart3 size={30}/></div>
        <div className="dmi-art-layer"><Layers3 size={27}/></div>
      </div>
      <div className="dmi-hero-actions">
        <span className="dmi-beginner">Beginner</span>
        <div>
          <button type="button" aria-label="Previous lesson" onClick={onPrevious} disabled={currentLesson === 0}><ChevronLeft size={18}/></button>
          <button type="button" className="dmi-next" onClick={onNext} disabled={currentLesson === total - 1}>Next <ChevronRight size={17}/></button>
        </div>
      </div>
    </section>
  );
}

export function ModelingIntroLab({ focused = false }: { focused?: boolean }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTable, setSelectedTable] = useState<TableKey>("Customer");
  const [tables, setTables] = useState<TableState>(cloneInitial);
  const [stepByStep, setStepByStep] = useState(false);
  const [status, setStatus] = useState<SimStatus>("idle");
  const [runLogs, setRunLogs] = useState<string[]>([]);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const totalRows = useMemo(
    () => TABLE_TABS.reduce((sum, key) => sum + tables[key].length, 0),
    [tables],
  );

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  const resetSimulation = () => {
    clearTimers();
    setCurrentStep(1);
    setSelectedTable("Customer");
    setTables(cloneInitial());
    setRunLogs([]);
    setStatus("idle");
  };

  const resetRows = () => {
    setTables(cloneInitial());
    setSelectedTable("Customer");
  };

  const jumpToStep = (index: number) => {
    clearTimers();
    setCurrentStep(index);
    setRunLogs(STEPS.slice(0, index + 1).map((step) => step.log));
    setStatus(index === STEPS.length - 1 ? "complete" : "idle");
  };

  const runOneStep = () => {
    const next = status === "running" ? Math.min(currentStep + 1, STEPS.length - 1) : 0;
    setCurrentStep(next);
    setRunLogs(STEPS.slice(0, next + 1).map((step) => step.log));
    setStatus(next === STEPS.length - 1 ? "complete" : "running");
  };

  const runSimulation = () => {
    clearTimers();
    if (stepByStep) {
      runOneStep();
      return;
    }
    setStatus("running");
    setCurrentStep(0);
    setRunLogs([]);
    STEPS.forEach((step, index) => {
      const timer = setTimeout(() => {
        setCurrentStep(index);
        setRunLogs(STEPS.slice(0, index + 1).map((item) => item.log));
        if (index === STEPS.length - 1) setStatus("complete");
      }, 120 + index * 380);
      timers.current.push(timer);
    });
  };

  const addRow = () => {
    setTables((previous) => {
      const next = { ...previous, [selectedTable]: [...previous[selectedTable]] } as TableState;
      if (selectedTable === "Customer") {
        const n = next.Customer.length + 1;
        const names = ["Farah", "Gabe", "Hana", "Ivan"];
        const cities = ["Denver", "Miami", "Portland", "Dallas"];
        const name = names[(n - 6) % names.length];
        next.Customer.push({ customer_id: n, name, city: cities[(n - 6) % cities.length], email: `${name.toLowerCase()}@ex.com` });
      } else if (selectedTable === "Order") {
        const n = next.Order.length;
        const customers = next.Customer.map((row) => Number(row.customer_id));
        next.Order.push({
          order_id: 504 + n,
          customer_id: customers[n % customers.length],
          order_date: `2026-02-${String(2 + n).padStart(2, "0")}`,
          total_amount: 35 + n * 15,
        });
      } else if (selectedTable === "Product") {
        const n = next.Product.length;
        const names = ["Bottle", "Folder", "Marker", "Cable"];
        const categories = ["Accessories", "Stationery", "Stationery", "Electronics"];
        next.Product.push({
          product_id: 40 + n * 10,
          name: names[n % names.length],
          category: categories[n % categories.length],
          price: 15 + n * 10,
        });
      } else {
        const orders = next.Order.map((row) => Number(row.order_id));
        const products = next.Product.map((row) => Number(row.product_id));
        const n = next["Order Item"].length;
        next["Order Item"].push({
          order_id: orders[n % orders.length],
          product_id: products[n % products.length],
          quantity: (n % 3) + 1,
          unit_price: Number(next.Product[n % next.Product.length].price),
        });
      }
      return next;
    });
  };

  const relationshipActive = currentStep >= 2;
  const buttonLabel = stepByStep && status === "running" ? "Next Step" : "Run Simulation";

  return (
    <section className={`dmi-lab ${focused ? "dmi-lab-focused" : ""}`} aria-label="Interactive data modeling simulation">
      <header className="dmi-lab-header">
        <div>
          <h2><Network size={22}/>Interactive Simulation</h2>
          <p>Explore a simple business system. See how real-world data is modeled as entities, attributes and relationships.</p>
        </div>
        <nav className="dmi-stepper" aria-label="Simulation stages">
          {STEPS.map((step, index) => (
            <button
              key={step.title}
              type="button"
              aria-current={currentStep === index ? "step" : undefined}
              className={currentStep > index ? "is-complete" : ""}
              onClick={() => jumpToStep(index)}
            >
              <span>{currentStep > index ? <CheckCircle2 size={13}/> : index + 1}</span>{step.title}
            </button>
          ))}
        </nav>
      </header>

      {focused && <div className="dmi-focus-note"><Play size={13}/>Simulation mode · run all stages automatically or enable Step by step to advance one learning stage at a time.</div>}

      <div className="dmi-workspace">
        <div className="dmi-model-canvas">
          <div className="dmi-schema-grid">
            <EntityCard entity="Customer" icon={<UserRound size={18}/>} tone="violet" selected={selectedTable === "Customer"} onSelect={() => setSelectedTable("Customer")} className="dmi-customer"/>
            <div className={`dmi-relation dmi-rel-customer ${relationshipActive ? "is-active" : ""}`}><b>1</b><span/><b>M</b><small>One to Many</small></div>
            <EntityCard entity="Order" icon={<ShoppingCart size={18}/>} tone="green" selected={selectedTable === "Order"} onSelect={() => setSelectedTable("Order")} className="dmi-order"/>
            <div className={`dmi-relation dmi-rel-product ${relationshipActive ? "is-active" : ""}`}><b>M</b><span/><b>M</b><small>Many to Many</small></div>
            <EntityCard entity="Product" icon={<Package size={18}/>} tone="orange" selected={selectedTable === "Product"} onSelect={() => setSelectedTable("Product")} className="dmi-product"/>
            <div className={`dmi-rel-drop ${relationshipActive ? "is-active" : ""}`} aria-hidden="true"><span/></div>
            <EntityCard entity="Order Item" icon={<Table2 size={18}/>} tone="pink" selected={selectedTable === "Order Item"} onSelect={() => setSelectedTable("Order Item")} className="dmi-orderitem"/>
          </div>
          <div className="dmi-entity-captions">
            <span><b>Entity</b>Stores information about customers.</span>
            <span><b>Entity</b>Stores each order placed by a customer.</span>
            <span><b>Entity</b>Stores products that can be ordered.</span>
            <span><b>Relationship</b>Connects orders and products.</span>
          </div>
        </div>

        <aside className="dmi-sample-panel" aria-label="Sample data">
          <div className="dmi-sample-head"><strong>Sample Data</strong><button type="button" onClick={resetRows}><RotateCcw size={13}/>Reset</button></div>
          <div className="dmi-data-tabs" role="tablist" aria-label="Sample tables">
            {TABLE_TABS.map((tab) => <button type="button" role="tab" aria-selected={selectedTable === tab} key={tab} onClick={() => setSelectedTable(tab)}>{tab}</button>)}
          </div>
          <DataTable rows={tables[selectedTable]}/>
          <button type="button" className="dmi-add-row" onClick={addRow}><Plus size={15}/>Add Row</button>
          <small className="dmi-row-count">{tables[selectedTable].length} {selectedTable.toLowerCase()} rows · {totalRows} total</small>
        </aside>
      </div>

      <div className="dmi-controls">
        <button type="button" className="dmi-run" onClick={runSimulation}><Play size={15} fill="currentColor"/>{buttonLabel}<ChevronRight size={14}/></button>
        <label className="dmi-step-toggle"><input type="checkbox" checked={stepByStep} onChange={(event) => { clearTimers(); setStepByStep(event.target.checked); setStatus("idle"); }}/><span/>Step by step</label>
        <button type="button" className="dmi-reset" onClick={resetSimulation}><RefreshCcw size={15}/>Reset</button>
        <span className="dmi-status" role="status">{status === "running" ? `Stage ${currentStep + 1} of 4` : status === "complete" ? "Simulation complete" : `Ready · ${STEPS[currentStep].title}`}</span>
      </div>

      <div className="dmi-results">
        <section className="dmi-output">
          <h3>Simulation Output</h3>
          <div aria-live="polite">
            {runLogs.length === 0 ? <p className="dmi-output-idle">Press Run Simulation to build the model.</p> : runLogs.map((log, index) => <p key={log}><CheckCircle2 size={13}/><code>{log.replace(" Completed", "")}</code><b>Completed</b></p>)}
            {status === "complete" && <p className="dmi-success"><CheckCircle2 size={13}/><strong>Simulation completed successfully! 🎉</strong></p>}
          </div>
        </section>
        <section className="dmi-visual-model">
          <header><h3>Visual Model (ER Diagram)</h3><button type="button" onClick={() => jumpToStep(3)}>View Full Diagram <Network size={14}/></button></header>
          <MiniModel activeStep={currentStep}/>
        </section>
      </div>
    </section>
  );
}
