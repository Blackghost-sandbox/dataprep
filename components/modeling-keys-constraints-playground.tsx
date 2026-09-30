"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Ban,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Clock3,
  Database,
  FlaskConical,
  GraduationCap,
  KeyRound,
  Link2,
  Play,
  Plus,
  RefreshCcw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useCompanion } from "@/components/companion-context";

type CustomerRow = { customer_id: string; name: string; city: string; email: string };
type OrderRow = { order_id: string; customer_id: string; order_date: string; amount: string };
type RuleId = "pk" | "not-null" | "fk" | "unique" | "check";
type ScenarioId = "duplicate-pk" | "null-pk" | "invalid-fk" | "duplicate-unique" | "check-violation";
type TableName = "Customer" | "Order";
type ErrorItem = {
  id: string;
  rule: RuleId;
  table: TableName;
  row: number;
  field: string;
  title: string;
  detail: string;
};

const SCREEN_CUSTOMERS: CustomerRow[] = [
  { customer_id: "1", name: "Alice", city: "Chennai", email: "alice@ex.com" },
  { customer_id: "2", name: "Bob", city: "Mumbai", email: "bob@ex.com" },
  { customer_id: "3", name: "Carol", city: "Bangalore", email: "carol@ex.com" },
  { customer_id: "4", name: "David", city: "Delhi", email: "david@ex.com" },
  { customer_id: "5", name: "Emma", city: "Pune", email: "emma@ex.com" },
];

const SCREEN_ORDERS: OrderRow[] = [
  { order_id: "101", customer_id: "1", order_date: "2024-01-10", amount: "250.00" },
  { order_id: "102", customer_id: "2", order_date: "2024-01-11", amount: "120.00" },
  { order_id: "103", customer_id: "3", order_date: "2024-01-12", amount: "89.50" },
  { order_id: "104", customer_id: "99", order_date: "2024-01-13", amount: "75.00" },
  { order_id: "105", customer_id: "2", order_date: "2024-01-14", amount: "-20.00" },
];

const RULES: Array<{ id: RuleId; label: string }> = [
  { id: "pk", label: "Primary Key" },
  { id: "not-null", label: "Not Null" },
  { id: "fk", label: "Foreign Key" },
  { id: "unique", label: "Unique" },
  { id: "check", label: "Check" },
];

const SCENARIOS: Array<{ id: ScenarioId; label: string; short: string }> = [
  { id: "duplicate-pk", label: "Duplicate PK", short: "1" },
  { id: "null-pk", label: "NULL PK", short: "2" },
  { id: "invalid-fk", label: "Invalid FK", short: "3" },
  { id: "duplicate-unique", label: "Duplicate UNIQUE", short: "4" },
  { id: "check-violation", label: "CHECK violation", short: "5" },
];

const cloneCustomers = () => SCREEN_CUSTOMERS.map((row) => ({ ...row }));
const cloneOrders = () => SCREEN_ORDERS.map((row) => ({ ...row }));

function validate(customers: CustomerRow[], orders: OrderRow[]): ErrorItem[] {
  const errors: ErrorItem[] = [];

  const customerPk = new Map<string, number[]>();
  customers.forEach((row, index) => {
    const value = row.customer_id.trim();
    if (!value) {
      errors.push({
        id: `customer-pk-null-${index}`,
        rule: "pk",
        table: "Customer",
        row: index,
        field: "customer_id",
        title: "Primary key cannot be NULL",
        detail: `Customer row ${index + 1} has no customer_id.`,
      });
      return;
    }
    const group = customerPk.get(value) ?? [];
    group.push(index);
    customerPk.set(value, group);
  });
  customerPk.forEach((indexes, value) => {
    if (indexes.length > 1) {
      indexes.slice(1).forEach((index) =>
        errors.push({
          id: `customer-pk-duplicate-${index}`,
          rule: "pk",
          table: "Customer",
          row: index,
          field: "customer_id",
          title: "Primary key constraint failed",
          detail: `customer_id ${value} already exists in Customer.`,
        }),
      );
    }
  });

  const orderPk = new Map<string, number[]>();
  orders.forEach((row, index) => {
    const value = row.order_id.trim();
    if (!value) {
      errors.push({
        id: `order-pk-null-${index}`,
        rule: "pk",
        table: "Order",
        row: index,
        field: "order_id",
        title: "Primary key cannot be NULL",
        detail: `Order row ${index + 1} has no order_id.`,
      });
      return;
    }
    const group = orderPk.get(value) ?? [];
    group.push(index);
    orderPk.set(value, group);
  });
  orderPk.forEach((indexes, value) => {
    if (indexes.length > 1) {
      indexes.slice(1).forEach((index) =>
        errors.push({
          id: `order-pk-duplicate-${index}`,
          rule: "pk",
          table: "Order",
          row: index,
          field: "order_id",
          title: "Primary key constraint failed",
          detail: `order_id ${value} already exists in Order.`,
        }),
      );
    }
  });

  customers.forEach((row, index) => {
    (["name", "city"] as const).forEach((field) => {
      if (!row[field].trim()) {
        errors.push({
          id: `customer-not-null-${field}-${index}`,
          rule: "not-null",
          table: "Customer",
          row: index,
          field,
          title: "NOT NULL constraint failed",
          detail: `Customer ${field} cannot be NULL.`,
        });
      }
    });
  });

  const validCustomerIds = new Set(customers.map((row) => row.customer_id.trim()).filter(Boolean));
  orders.forEach((row, index) => {
    const value = row.customer_id.trim();
    if (value && !validCustomerIds.has(value)) {
      errors.push({
        id: `order-fk-${index}`,
        rule: "fk",
        table: "Order",
        row: index,
        field: "customer_id",
        title: "Foreign key constraint failed",
        detail: `Order customer_id '${value}' does not exist in Customer table.`,
      });
    }
  });

  const emailMap = new Map<string, number[]>();
  customers.forEach((row, index) => {
    const value = row.email.trim().toLowerCase();
    if (!value) return;
    const group = emailMap.get(value) ?? [];
    group.push(index);
    emailMap.set(value, group);
  });
  emailMap.forEach((indexes, value) => {
    if (indexes.length > 1) {
      indexes.slice(1).forEach((index) =>
        errors.push({
          id: `customer-email-unique-${index}`,
          rule: "unique",
          table: "Customer",
          row: index,
          field: "email",
          title: "Unique constraint failed",
          detail: `Customer email '${value}' already exists.`,
        }),
      );
    }
  });

  orders.forEach((row, index) => {
    const amount = Number(row.amount);
    if (Number.isFinite(amount) && amount <= 0) {
      errors.push({
        id: `order-check-${index}`,
        rule: "check",
        table: "Order",
        row: index,
        field: "amount",
        title: "Check constraint failed",
        detail: `Order amount must be greater than 0. Found: ${row.amount}`,
      });
    }
  });

  return errors;
}

export function ModelingKeysHero({
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
    <section className="mkc-hero" aria-labelledby="mkc-hero-title">
      <div className="mkc-hero-copy">
        <div className="mkc-breadcrumb"><span>Data Modeling</span><ChevronRight size={13}/><strong>Keys &amp; Constraints</strong></div>
        <div className="mkc-title-row">
          <span className="mkc-hero-icon"><KeyRound size={24}/></span>
          <div><h1 id="mkc-hero-title">Keys &amp; Constraints</h1><p>{description}</p></div>
        </div>
        <div className="mkc-meta"><span><Clock3 size={14}/>{minutes} min</span><span><GraduationCap size={14}/>Lesson {currentLesson + 1}/{total}</span></div>
      </div>
      <div className="mkc-art" aria-hidden="true">
        <div className="mkc-art-card mkc-art-pk"><CircleX size={14}/>PK</div>
        <div className="mkc-db mkc-db-a"><Database size={56}/></div>
        <div className="mkc-db mkc-db-b"><Database size={62}/></div>
        <div className="mkc-chain"><Link2 size={34}/></div>
        <div className="mkc-art-card mkc-art-fk"><Link2 size={13}/>FK</div>
        <span className="mkc-ok mkc-ok-one">✓</span>
        <span className="mkc-ok mkc-ok-two">✓</span>
      </div>
      <div className="mkc-hero-actions">
        <span className="mkc-difficulty">Intermediate</span>
        <div>
          <button type="button" onClick={onPrevious} aria-label="Previous lesson" disabled={currentLesson === 0}><ChevronLeft size={18}/></button>
          <button type="button" className="mkc-next" onClick={onNext} disabled={currentLesson === total - 1}>Next <ChevronRight size={17}/></button>
        </div>
      </div>
    </section>
  );
}

function EditableCustomerTable({
  rows,
  onChange,
  onAdd,
  errors,
}: {
  rows: CustomerRow[];
  onChange: (row: number, field: keyof CustomerRow, value: string) => void;
  onAdd: () => void;
  errors: ErrorItem[];
}) {
  const invalid = (row: number, field: keyof CustomerRow) => errors.some((error) => error.table === "Customer" && error.row === row && error.field === field);
  return (
    <section className="mkc-table-card mkc-customer-card">
      <header><div><UserRound size={18}/><h3>Customer</h3></div><button type="button" onClick={onAdd}><Plus size={13}/>Add Row</button></header>
      <p className="mkc-constraints"><b>Primary Key: customer_id</b><span/>UNIQUE: <u>email</u><span/>NOT NULL: name, city</p>
      <div className="mkc-table-wrap">
        <table>
          <thead><tr><th>#</th><th>customer_id</th><th>name</th><th>city</th><th>email</th></tr></thead>
          <tbody>{rows.map((row, index) => <tr key={index}>
            <td>{index + 1}</td>
            {(Object.keys(row) as Array<keyof CustomerRow>).map((field) => <td key={field}><input aria-label={`Customer row ${index + 1} ${field}`} className={invalid(index, field) ? "is-invalid" : ""} value={row[field]} onChange={(event) => onChange(index, field, event.target.value)}/></td>)}
          </tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

function EditableOrderTable({
  rows,
  onChange,
  onAdd,
  errors,
}: {
  rows: OrderRow[];
  onChange: (row: number, field: keyof OrderRow, value: string) => void;
  onAdd: () => void;
  errors: ErrorItem[];
}) {
  const invalid = (row: number, field: keyof OrderRow) => errors.some((error) => error.table === "Order" && error.row === row && error.field === field);
  return (
    <section className="mkc-table-card mkc-order-card">
      <header><div><BookOpen size={18}/><h3>Order</h3></div><button type="button" onClick={onAdd}><Plus size={13}/>Add Row</button></header>
      <p className="mkc-constraints"><b>Primary Key: order_id</b><span/>Foreign Key: <u>customer_id</u><span/>CHECK: amount &gt; 0</p>
      <div className="mkc-table-wrap">
        <table>
          <thead><tr><th>#</th><th>order_id</th><th>customer_id</th><th>order_date</th><th>amount</th></tr></thead>
          <tbody>{rows.map((row, index) => <tr key={index}>
            <td>{index + 1}</td>
            {(Object.keys(row) as Array<keyof OrderRow>).map((field) => <td key={field}><div className={invalid(index, field) ? "mkc-invalid-shell" : ""}><input aria-label={`Order row ${index + 1} ${field}`} className={invalid(index, field) ? "is-invalid" : ""} value={row[field]} onChange={(event) => onChange(index, field, event.target.value)}/>{invalid(index, field) && <CircleX size={13}/>}</div></td>)}
          </tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

export function ModelingKeysConstraintsPlayground() {
  const companion = useCompanion();
  const [customers, setCustomers] = useState<CustomerRow[]>(cloneCustomers);
  const [orders, setOrders] = useState<OrderRow[]>(cloneOrders);
  const [stepByStep, setStepByStep] = useState(false);
  const [activeRuleIndex, setActiveRuleIndex] = useState(4);
  const [checkedRules, setCheckedRules] = useState<RuleId[]>(RULES.map((rule) => rule.id));
  const [status, setStatus] = useState<"idle" | "running" | "done">("done");
  const [activeScenarios, setActiveScenarios] = useState<ScenarioId[]>(["invalid-fk", "check-violation"]);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const allErrors = useMemo(() => validate(customers, orders), [customers, orders]);
  const visibleErrors = useMemo(
    () => allErrors.filter((error) => checkedRules.includes(error.rule)),
    [allErrors, checkedRules],
  );

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const markDirty = () => {
    clearTimers();
    setStatus("idle");
    setCheckedRules([]);
    setActiveRuleIndex(-1);
  };

  const updateCustomer = (row: number, field: keyof CustomerRow, value: string) => {
    setCustomers((previous) => previous.map((item, index) => index === row ? { ...item, [field]: value } : item));
    markDirty();
  };

  const updateOrder = (row: number, field: keyof OrderRow, value: string) => {
    setOrders((previous) => previous.map((item, index) => index === row ? { ...item, [field]: value } : item));
    markDirty();
  };

  const addCustomer = () => {
    setCustomers((previous) => {
      const next = previous.length + 1;
      return [...previous, { customer_id: String(next), name: `Customer ${next}`, city: "Chennai", email: `customer${next}@ex.com` }];
    });
    markDirty();
  };

  const addOrder = () => {
    setOrders((previous) => {
      const nextId = 101 + previous.length;
      const fallbackCustomer = customers.find((row) => row.customer_id.trim())?.customer_id || "1";
      return [...previous, { order_id: String(nextId), customer_id: fallbackCustomer, order_date: "2024-01-15", amount: "50.00" }];
    });
    markDirty();
  };

  const injectScenario = (scenario: ScenarioId) => {
    clearTimers();
    if (scenario === "duplicate-pk") setCustomers((previous) => previous.map((row, index) => index === 4 ? { ...row, customer_id: previous[3]?.customer_id || "4" } : row));
    if (scenario === "null-pk") setCustomers((previous) => previous.map((row, index) => index === 2 ? { ...row, customer_id: "" } : row));
    if (scenario === "invalid-fk") setOrders((previous) => previous.map((row, index) => index === 3 ? { ...row, customer_id: "99" } : row));
    if (scenario === "duplicate-unique") setCustomers((previous) => previous.map((row, index) => index === 4 ? { ...row, email: previous[3]?.email || "david@ex.com" } : row));
    if (scenario === "check-violation") setOrders((previous) => previous.map((row, index) => index === 4 ? { ...row, amount: "-20.00" } : row));
    setActiveScenarios((previous) => previous.includes(scenario) ? previous : [...previous, scenario]);
    setStatus("idle");
    setCheckedRules([]);
    setActiveRuleIndex(-1);
  };

  const reset = () => {
    clearTimers();
    setCustomers(cloneCustomers());
    setOrders(cloneOrders());
    setActiveScenarios(["invalid-fk", "check-violation"]);
    setCheckedRules(RULES.map((rule) => rule.id));
    setActiveRuleIndex(4);
    setStatus("done");
  };

  const emitResult = (errors: ErrorItem[]) => {
    companion?.emit({
      type: errors.length ? "exercise_error" : "exercise_correct",
      lesson: "Keys & Constraints",
      source: "runner",
    });
  };

  const runValidation = () => {
    clearTimers();

    if (stepByStep) {
      const nextIndex = activeRuleIndex < 0 || activeRuleIndex >= RULES.length - 1 ? 0 : activeRuleIndex + 1;
      const nextRule = RULES[nextIndex].id;
      const nextChecked = nextIndex === 0 ? [nextRule] : [...RULES.slice(0, nextIndex + 1).map((rule) => rule.id)];
      setActiveRuleIndex(nextIndex);
      setCheckedRules(nextChecked);
      setStatus(nextIndex === RULES.length - 1 ? "done" : "running");
      if (nextIndex === RULES.length - 1) emitResult(validate(customers, orders));
      return;
    }

    setCheckedRules([]);
    setActiveRuleIndex(0);
    setStatus("running");
    RULES.forEach((rule, index) => {
      const timer = setTimeout(() => {
        setActiveRuleIndex(index);
        setCheckedRules(RULES.slice(0, index + 1).map((item) => item.id));
        if (index === RULES.length - 1) {
          setStatus("done");
          emitResult(validate(customers, orders));
        }
      }, 130 + index * 220);
      timers.current.push(timer);
    });
  };

  const failed = status === "done" && visibleErrors.length > 0;
  const passed = status === "done" && visibleErrors.length === 0;

  return (
    <section className="mkc-playground" aria-labelledby="mkc-playground-title">
      <header className="mkc-playground-head">
        <div><h2 id="mkc-playground-title"><ShieldCheck size={23}/>Constraint Playground</h2><p>Edit the data, inject problems, and run validation to see how keys and constraints work in real database tables.</p></div>
        <div className="mkc-controls">
          <button type="button" className="mkc-run" onClick={runValidation}><Play size={15} fill="currentColor"/>{stepByStep && status === "running" ? "Next Check" : "Run Validation"}</button>
          <label className="mkc-toggle"><input type="checkbox" checked={stepByStep} onChange={(event) => { clearTimers(); setStepByStep(event.target.checked); setStatus("idle"); setCheckedRules([]); setActiveRuleIndex(-1); }}/><span/>Step by step</label>
          <button type="button" className="mkc-reset" onClick={reset}><RefreshCcw size={14}/>Reset</button>
        </div>
      </header>

      <div className="mkc-scenarios">
        <strong>Try these scenarios:</strong>
        {SCENARIOS.map((scenario) => <button type="button" key={scenario.id} aria-pressed={activeScenarios.includes(scenario.id)} onClick={() => injectScenario(scenario.id)} className={`mkc-scenario mkc-scenario-${scenario.short}`}><span>{scenario.short}</span>{scenario.label}</button>)}
      </div>

      <div className="mkc-main-grid">
        <div className="mkc-data-area">
          <EditableCustomerTable rows={customers} onChange={updateCustomer} onAdd={addCustomer} errors={visibleErrors}/>
          <EditableOrderTable rows={orders} onChange={updateOrder} onAdd={addOrder} errors={visibleErrors}/>
        </div>
        <aside className="mkc-inject-panel">
          <header><FlaskConical size={19}/><div><h3>Inject Test Data</h3><p>Quickly add common constraint violations to see how the database responds.</p></div></header>
          <button type="button" onClick={() => injectScenario("duplicate-pk")}><span>🏫</span><b>Add duplicate customer_id</b><small>(Primary Key)</small></button>
          <button type="button" onClick={() => injectScenario("null-pk")}><span>◉</span><b>Set NULL in customer_id</b><small>(Primary Key · NOT NULL)</small></button>
          <button type="button" className="is-featured" onClick={() => injectScenario("invalid-fk")}><span>✓</span><b>Add invalid customer_id</b><small>(Foreign Key)</small><Play size={13} fill="currentColor"/></button>
          <button type="button" onClick={() => injectScenario("duplicate-unique")}><span>✉</span><b>Duplicate email</b><small>(UNIQUE constraint)</small></button>
          <button type="button" onClick={() => injectScenario("check-violation")}><span>✓</span><b>Add negative amount</b><small>(CHECK: amount &gt; 0)</small></button>
        </aside>
      </div>

      <div className="mkc-bottom-grid">
        <section className={`mkc-validation ${passed ? "is-success" : failed ? "is-failed" : "is-pending"}`} aria-live="polite">
          <header>
            <span>{passed ? <CheckCircle2 size={20}/> : <CircleX size={20}/>}</span>
            <div><h3>{passed ? "Validation Passed" : failed ? "Validation Failed" : status === "running" ? `Checking ${RULES[activeRuleIndex]?.label ?? "constraints"}...` : "Ready to Validate"}</h3><p>{passed ? "All tested constraints passed." : failed ? `${visibleErrors.length} constraint violation(s) found. Fix the errors and run again.` : "Run validation to evaluate the current table data."}</p></div>
            <button type="button" onClick={runValidation}><RefreshCcw size={13}/>{status === "idle" ? "Run Validation" : "Run Again"}</button>
          </header>
          {status !== "idle" && <div className="mkc-rule-progress">{RULES.map((rule, index) => <span key={rule.id} className={checkedRules.includes(rule.id) ? "is-checked" : activeRuleIndex === index ? "is-active" : ""}>{checkedRules.includes(rule.id) ? "✓" : index + 1} {rule.label}</span>)}</div>}
          {failed && <div className="mkc-errors">{visibleErrors.slice(0, 4).map((error, index) => <article key={error.id}><span>{index + 1}</span><div><h4>{error.title}</h4><p>{error.detail}</p></div><small>{error.table} (row {error.row + 1})</small></article>)}</div>}
          {passed && <div className="mkc-success-message"><CheckCircle2 size={16}/>Every primary key is valid, foreign keys resolve, unique emails are distinct, and order amounts satisfy the CHECK rule.</div>}
        </section>

        <section className="mkc-key-concepts">
          <header><BookOpen size={18}/><h3>Key Concepts</h3></header>
          <div>
            <article><KeyRound size={22}/><b>Primary Key (PK)</b><p>Uniquely identifies each row. Cannot be NULL.</p></article>
            <article><Link2 size={22}/><b>Foreign Key (FK)</b><p>References a primary key in another table.</p></article>
            <article><UserRound size={22}/><b>Unique</b><p>Ensures all values in a column are unique.</p></article>
            <article><Ban size={22}/><b>Not Null</b><p>Disallows NULL values in a column.</p></article>
            <article><CheckCircle2 size={22}/><b>Check</b><p>Enforces a condition (e.g., amount &gt; 0).</p></article>
          </div>
        </section>
      </div>
    </section>
  );
}
