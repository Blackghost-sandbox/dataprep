"use client";

import { useMemo, useState } from "react";
import type { DragEvent } from "react";
import {
  BadgeHelp,
  Box,
  BriefcaseBusiness,
  CheckCircle2,
  CircleHelp,
  GripVertical,
  KeyRound,
  Link2,
  ListTree,
  Package,
  Play,
  RefreshCcw,
  ShoppingCart,
  Table2,
  Tag,
  UserRound,
} from "lucide-react";
import { useCompanion } from "@/components/companion-context";

type Classification = "Entity" | "Attribute" | "Relationship";
type ItemId =
  | "Customer"
  | "email"
  | "places"
  | "Order"
  | "order_date"
  | "contains"
  | "Product"
  | "price"
  | "belongs_to";

interface BusinessItem {
  id: ItemId;
  expected: Classification;
}

const ITEMS: BusinessItem[] = [
  { id: "Customer", expected: "Entity" },
  { id: "email", expected: "Attribute" },
  { id: "places", expected: "Relationship" },
  { id: "Order", expected: "Entity" },
  { id: "order_date", expected: "Attribute" },
  { id: "contains", expected: "Relationship" },
  { id: "Product", expected: "Entity" },
  { id: "price", expected: "Attribute" },
  { id: "belongs_to", expected: "Relationship" },
];

const INITIAL_ASSIGNMENTS: Partial<Record<ItemId, Classification>> = {
  Customer: "Entity",
  email: "Attribute",
  places: "Relationship",
  Order: "Entity",
  order_date: "Attribute",
  contains: "Relationship",
  Product: "Entity",
  price: "Attribute",
};

const CLASSIFICATIONS: Array<{
  name: Classification;
  subtitle: string;
  icon: typeof Box;
  tone: string;
}> = [
  { name: "Entity", subtitle: "A thing (usually a business object)", icon: Box, tone: "blue" },
  { name: "Attribute", subtitle: "A property of an entity", icon: Tag, tone: "green" },
  { name: "Relationship", subtitle: "A connection between things", icon: Link2, tone: "orange" },
];

const expectedById = Object.fromEntries(ITEMS.map((item) => [item.id, item.expected])) as Record<ItemId, Classification>;

function itemIcon(item: ItemId, size = 14) {
  const type = expectedById[item];
  if (type === "Entity") return <Box size={size}/>;
  if (type === "Attribute") return <Tag size={size}/>;
  return <Link2 size={size}/>;
}

function classificationTone(value: Classification | undefined) {
  if (value === "Entity") return "entity";
  if (value === "Attribute") return "attribute";
  if (value === "Relationship") return "relationship";
  return "unknown";
}

function SchemaCard({
  entity,
  fields,
  tone,
  enabled,
}: {
  entity: "Customer" | "Order" | "Product";
  fields: Array<{ name: string; key?: "PK" | "FK"; enabled?: boolean }>;
  tone: "customer" | "order" | "product";
  enabled: boolean;
}) {
  const icon = entity === "Customer" ? <UserRound size={16}/> : entity === "Order" ? <ShoppingCart size={16}/> : <Package size={16}/>;
  return (
    <div className={`mer-schema-card mer-schema-${tone} ${enabled ? "" : "is-muted"}`}>
      <header>{icon}<strong>{entity}</strong></header>
      <div>
        {fields.map((field) => (
          <span key={field.name} className={field.enabled === false ? "is-hidden-field" : ""}>
            {field.key ? <KeyRound size={10}/> : <i/>}
            <b>{field.name}</b>
            {field.key && <small className={field.key === "PK" ? "is-pk" : "is-fk"}>{field.key}</small>}
          </span>
        ))}
      </div>
    </div>
  );
}

function ErPreview({ assignments }: { assignments: Partial<Record<ItemId, Classification>> }) {
  const correct = (id: ItemId) => assignments[id] === expectedById[id];
  return (
    <div className="mer-er-preview" aria-label="Live entity relationship model">
      <SchemaCard
        entity="Customer"
        tone="customer"
        enabled={correct("Customer")}
        fields={[
          { name: "customer_id", key: "PK" },
          { name: "name" },
          { name: "email", enabled: correct("email") },
          { name: "city" },
        ]}
      />
      <div className={`mer-er-link mer-er-places ${correct("places") ? "is-active" : ""}`}>
        <span>1</span><i/><b>places</b><i/><span>N</span>
      </div>
      <SchemaCard
        entity="Order"
        tone="order"
        enabled={correct("Order")}
        fields={[
          { name: "order_id", key: "PK" },
          { name: "customer_id", key: "FK" },
          { name: "order_date", enabled: correct("order_date") },
        ]}
      />
      <div className={`mer-er-link mer-er-contains ${correct("contains") ? "is-active" : ""}`}>
        <span>1</span><i/><b>contains</b><i/><span>N</span>
      </div>
      <SchemaCard
        entity="Product"
        tone="product"
        enabled={correct("Product")}
        fields={[
          { name: "product_id", key: "PK" },
          { name: "name" },
          { name: "price", enabled: correct("price") },
          { name: "category" },
        ]}
      />
    </div>
  );
}

function TablesPreview() {
  return (
    <div className="mer-table-preview" aria-label="Sample relational tables">
      <table>
        <caption>Customer</caption>
        <thead><tr><th>customer_id</th><th>name</th><th>email</th></tr></thead>
        <tbody><tr><td>1</td><td>Alice</td><td>alice@ex.com</td></tr><tr><td>2</td><td>Bob</td><td>bob@ex.com</td></tr></tbody>
      </table>
      <table>
        <caption>Order</caption>
        <thead><tr><th>order_id</th><th>customer_id</th><th>order_date</th></tr></thead>
        <tbody><tr><td>501</td><td>1</td><td>2026-01-10</td></tr><tr><td>502</td><td>1</td><td>2026-01-18</td></tr></tbody>
      </table>
      <table>
        <caption>Product</caption>
        <thead><tr><th>product_id</th><th>name</th><th>price</th></tr></thead>
        <tbody><tr><td>10</td><td>Notebook</td><td>50</td></tr><tr><td>20</td><td>Pen</td><td>10</td></tr></tbody>
      </table>
    </div>
  );
}

export function ModelingEntitiesBuilder() {
  const companion = useCompanion();
  const [assignments, setAssignments] = useState<Partial<Record<ItemId, Classification>>>({ ...INITIAL_ASSIGNMENTS });
  const [selected, setSelected] = useState<ItemId | null>(null);
  const [checked, setChecked] = useState(true);
  const [view, setView] = useState<"diagram" | "tables">("diagram");

  const classified = Object.keys(assignments).length;
  const results = useMemo(
    () =>
      ITEMS.map((item) => ({
        ...item,
        actual: assignments[item.id],
        correct: assignments[item.id] === item.expected,
      })),
    [assignments],
  );
  const wrongCount = results.filter((item) => item.actual && !item.correct).length;
  const correctCount = results.filter((item) => item.correct).length;
  const allCorrect = correctCount === ITEMS.length;

  const assign = (item: ItemId, classification: Classification) => {
    setAssignments((previous) => ({ ...previous, [item]: classification }));
    setSelected(null);
    setChecked(false);
  };

  const drop = (event: DragEvent<HTMLElement>, classification: Classification) => {
    event.preventDefault();
    const item = event.dataTransfer.getData("text/plain") as ItemId;
    if (ITEMS.some((candidate) => candidate.id === item)) assign(item, classification);
  };

  const runCheck = () => {
    setChecked(true);
    const nowCorrect = ITEMS.every((item) => assignments[item.id] === item.expected);
    companion?.emit({
      type: nowCorrect ? "exercise_correct" : "exercise_error",
      lesson: "Entities, Attributes & Relationships",
      source: "runner",
    });
  };

  const reset = () => {
    setAssignments({ ...INITIAL_ASSIGNMENTS });
    setSelected(null);
    setChecked(true);
    setView("diagram");
  };

  const hintText = allCorrect
    ? "Great work. Entities are things, attributes describe those things, and relationships connect them."
    : wrongCount > 0 && checked
      ? "One or more classifications do not match the business meaning. Ask: is it a thing, a property, or a connection?"
      : "“belongs_to” describes how one thing is associated with another thing (e.g., a product belongs to a category).";

  return (
    <section className="mer-builder" aria-labelledby="mer-title">
      <header className="mer-builder-head">
        <div>
          <h2 id="mer-title"><ListTree size={23}/>Model Builder Challenge</h2>
          <p>Classify each business concept as an Entity, Attribute, or Relationship and see the ER model get built live.</p>
        </div>
        <div className="mer-builder-actions">
          <span className="mer-progress-pill"><i><b style={{ width: `${Math.round((classified / ITEMS.length) * 100)}%` }}/></i><strong>{classified} / {ITEMS.length} classified</strong></span>
          <button type="button" className="mer-reset" onClick={reset}><RefreshCcw size={15}/>Reset</button>
          <button type="button" className="mer-run" onClick={runCheck}><Play size={15} fill="currentColor"/>Run &amp; Check</button>
        </div>
      </header>

      <div className="mer-classifier">
        <section className="mer-tray" aria-label="Business objects tray">
          <header><BriefcaseBusiness size={20}/><div><h3>Business objects tray</h3><p>Drag each item to the correct category</p></div></header>
          <div className="mer-tray-items">
            {ITEMS.map((item) => {
              const actual = assignments[item.id];
              return (
                <button
                  type="button"
                  draggable
                  key={item.id}
                  aria-pressed={selected === item.id}
                  className={`mer-tray-item mer-item-${classificationTone(actual)}`}
                  onClick={() => setSelected((previous) => previous === item.id ? null : item.id)}
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", item.id);
                    event.dataTransfer.effectAllowed = "move";
                    setSelected(item.id);
                  }}
                >
                  <span>{itemIcon(item.id)}<b>{item.id}</b></span>
                  <small>{actual ? actual.toUpperCase() : "UNKNOWN"}</small>
                  <GripVertical size={13}/>
                </button>
              );
            })}
          </div>
        </section>

        {CLASSIFICATIONS.map(({ name, subtitle, icon: Icon, tone }) => {
          const bucketItems = ITEMS.filter((item) => assignments[item.id] === name);
          const showPendingRelationship = name === "Relationship" && !assignments.belongs_to;
          return (
            <section
              key={name}
              className={`mer-bucket mer-bucket-${tone}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => drop(event, name)}
              aria-label={`${name} classification bucket`}
            >
              <header><span><Icon size={22}/></span><div><h3>{name}</h3><p>{subtitle}</p></div></header>
              <div className="mer-bucket-items">
                {bucketItems.map((item) => {
                  const isWrong = checked && item.expected !== name;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      className={`mer-bucket-item ${isWrong ? "is-wrong" : ""}`}
                      onClick={() => setSelected(item.id)}
                      aria-label={`${item.id} classified as ${name}`}
                    >
                      {itemIcon(item.id)}<b>{item.id}</b><GripVertical size={13}/>
                    </button>
                  );
                })}
                {showPendingRelationship && (
                  <button
                    type="button"
                    className="mer-bucket-item mer-bucket-unknown"
                    aria-pressed={selected === "belongs_to"}
                    onClick={() => setSelected("belongs_to")}
                  >
                    <Link2 size={14}/><b>belongs_to</b><CircleHelp size={18}/>
                  </button>
                )}
              </div>
              <button
                type="button"
                className="mer-drop-zone"
                disabled={!selected}
                onClick={() => selected && assign(selected, name)}
              >
                {selected ? `Classify ${selected} as ${name}` : "Drag items here"}
              </button>
            </section>
          );
        })}
      </div>

      <section className="mer-preview">
        <header>
          <div><span><Table2 size={20}/></span><div><h3>Live model preview</h3><p>See your classifications turn into an ER model in real time.</p></div></div>
          <div className="mer-view-toggle" role="group" aria-label="Preview representation">
            <button type="button" aria-pressed={view === "diagram"} onClick={() => setView("diagram")}><ListTree size={14}/>ER Diagram</button>
            <button type="button" aria-pressed={view === "tables"} onClick={() => setView("tables")}><Table2 size={14}/>Tables</button>
          </div>
        </header>
        {view === "diagram" ? <ErPreview assignments={assignments}/> : <TablesPreview/>}
      </section>

      <section className="mer-feedback">
        <div className="mer-feedback-results">
          <h3>&gt;_ Check results &amp; feedback</h3>
          <div className="mer-feedback-grid">
            {results.map((item) => {
              const state = !item.actual ? "missing" : item.correct ? "correct" : "wrong";
              return (
                <p key={item.id} className={`is-${state}`}>
                  {state === "correct" ? <CheckCircle2 size={14}/> : state === "wrong" ? <CircleHelp size={14}/> : <BadgeHelp size={14}/>}
                  <span><b>{item.id}</b> → {item.actual || "Needs your classification"}</span>
                  {checked && <strong>{state === "correct" ? "✓ Correct" : state === "wrong" ? `✕ Expected ${item.expected}` : "Needs your classification"}</strong>}
                </p>
              );
            })}
          </div>
        </div>
        <aside className={`mer-hint ${allCorrect ? "is-complete" : ""}`}>
          <h3><span>💡</span>{allCorrect ? "Nice work" : "Hint"}</h3>
          <p>{hintText}</p>
          {!allCorrect && !assignments.belongs_to && <button type="button" onClick={() => assign("belongs_to", "Relationship")}>Classify now <span>→</span></button>}
          {!allCorrect && assignments.belongs_to && <button type="button" onClick={runCheck}>Check again <span>→</span></button>}
        </aside>
      </section>
    </section>
  );
}
