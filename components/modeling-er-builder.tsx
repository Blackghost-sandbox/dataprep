"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import {
  AlertCircle,
  Boxes,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  GitBranch,
  GraduationCap,
  Grid2X2,
  KeyRound,
  Link2,
  Maximize2,
  Minus,
  MoreHorizontal,
  Package,
  Play,
  Plus,
  RefreshCcw,
  ShoppingCart,
  Tag,
  Trash2,
  Truck,
  UserRound,
  UsersRound,
  Zap,
} from "lucide-react";
import { useCompanion } from "@/components/companion-context";

type PaletteTab = "Entities" | "Attributes" | "Relationships";
type InspectorTab = "Inspector" | "Business Rules";
type EntityId = "Customer" | "Order" | "Product" | "OrderLine" | "Supplier" | "Category";
type FieldKey = "PK" | "FK" | undefined;
type Cardinality = "1:N" | "1:1" | "N:M";
type BuilderStatus = "ready" | "running" | "done";

type Field = {
  id: string;
  name: string;
  type: string;
  key?: FieldKey;
  ref?: EntityId;
};

type EntityModel = {
  id: EntityId;
  tableName: string;
  description: string;
  fields: Field[];
};

type RelationshipModel = {
  id: string;
  name: string;
  from: EntityId;
  to: EntityId;
  cardinality: Cardinality;
};

const ENTITY_CATALOG: Record<EntityId, EntityModel> = {
  Customer: {
    id: "Customer",
    tableName: "customer",
    description: "Stores customer details like name, email and city.",
    fields: [
      { id: "customer_id", name: "customer_id", type: "INT", key: "PK" },
      { id: "name", name: "name", type: "VARCHAR" },
      { id: "email", name: "email", type: "VARCHAR" },
      { id: "city", name: "city", type: "VARCHAR" },
    ],
  },
  Order: {
    id: "Order",
    tableName: "order",
    description: "Represents a purchase placed by one customer.",
    fields: [
      { id: "order_id", name: "order_id", type: "INT", key: "PK" },
      { id: "customer_id", name: "customer_id", type: "INT", key: "FK", ref: "Customer" },
      { id: "order_date", name: "order_date", type: "DATE" },
      { id: "total_amount", name: "total_amount", type: "DECIMAL" },
    ],
  },
  Product: {
    id: "Product",
    tableName: "product",
    description: "Stores reusable product catalog details.",
    fields: [
      { id: "product_id", name: "product_id", type: "INT", key: "PK" },
      { id: "name", name: "name", type: "VARCHAR" },
      { id: "category", name: "category", type: "VARCHAR" },
      { id: "price", name: "price", type: "DECIMAL" },
    ],
  },
  OrderLine: {
    id: "OrderLine",
    tableName: "order_line",
    description: "Represents one purchased product line inside an order.",
    fields: [
      { id: "order_line_id", name: "order_line_id", type: "INT", key: "PK" },
      { id: "order_id", name: "order_id", type: "INT", key: "FK", ref: "Order" },
      { id: "product_id", name: "product_id", type: "INT", key: "FK", ref: "Product" },
      { id: "quantity", name: "quantity", type: "INT" },
      { id: "unit_price", name: "unit_price", type: "DECIMAL" },
    ],
  },
  Supplier: {
    id: "Supplier",
    tableName: "supplier",
    description: "Stores vendors that can supply products.",
    fields: [
      { id: "supplier_id", name: "supplier_id", type: "INT", key: "PK" },
      { id: "name", name: "name", type: "VARCHAR" },
      { id: "email", name: "email", type: "VARCHAR" },
    ],
  },
  Category: {
    id: "Category",
    tableName: "category",
    description: "Stores governed product categories.",
    fields: [
      { id: "category_id", name: "category_id", type: "INT", key: "PK" },
      { id: "name", name: "name", type: "VARCHAR" },
    ],
  },
};

const CORE_ENTITY_IDS: EntityId[] = ["Customer", "Order", "Product", "OrderLine"];

const CORE_RELATIONSHIPS: RelationshipModel[] = [
  { id: "customer-order", name: "places", from: "Customer", to: "Order", cardinality: "1:N" },
  { id: "order-line", name: "contains", from: "Order", to: "OrderLine", cardinality: "1:N" },
  { id: "product-line", name: "references", from: "Product", to: "OrderLine", cardinality: "1:N" },
];

const OPTIONAL_RELATIONSHIPS: RelationshipModel[] = [
  { id: "supplier-product", name: "supplies", from: "Supplier", to: "Product", cardinality: "1:N" },
  { id: "category-product", name: "categorizes", from: "Category", to: "Product", cardinality: "1:N" },
];

const ATTRIBUTE_OPTIONS = [
  { id: "status", name: "status", type: "VARCHAR" },
  { id: "created_at", name: "created_at", type: "TIMESTAMP" },
  { id: "phone", name: "phone", type: "VARCHAR" },
  { id: "notes", name: "notes", type: "VARCHAR" },
] as const;

const STEPS = [
  ["Define Entities", "Add tables to model"],
  ["Add Attributes", "Set keys and data types"],
  ["Connect Relationships", "Link tables together"],
  ["Set Cardinality", "Define 1-1, 1-M, M-M"],
  ["Validate Diagram", "Check for errors"],
] as const;

function cloneEntity(id: EntityId): EntityModel {
  const source = ENTITY_CATALOG[id];
  return { ...source, fields: source.fields.map((field) => ({ ...field })) };
}

function initialEntities() {
  return Object.fromEntries(CORE_ENTITY_IDS.map((id) => [id, cloneEntity(id)])) as Partial<Record<EntityId, EntityModel>>;
}

function entityIcon(id: EntityId, size = 17) {
  if (id === "Customer") return <UserRound size={size}/>;
  if (id === "Order") return <ShoppingCart size={size}/>;
  if (id === "Product") return <Package size={size}/>;
  if (id === "OrderLine") return <Boxes size={size}/>;
  if (id === "Supplier") return <Truck size={size}/>;
  return <Tag size={size}/>;
}

function entityTone(id: EntityId) {
  if (id === "Customer") return "blue";
  if (id === "Order") return "green";
  if (id === "Product") return "orange";
  if (id === "OrderLine") return "pink";
  if (id === "Supplier") return "cyan";
  return "violet";
}

function pluralize(id: EntityId) {
  if (id === "Category") return "categories";
  if (id === "OrderLine") return "order lines";
  return id.toLowerCase() + "s";
}

function generateRules(entities: Partial<Record<EntityId, EntityModel>>, relationships: RelationshipModel[]) {
  const rules: string[] = [];
  const has = (id: EntityId) => Boolean(entities[id]);
  const relation = (id: string) => relationships.find((item) => item.id === id);

  if (has("Customer") && has("Order") && relation("customer-order")) {
    rules.push("A customer can place many orders, but each order belongs to one customer.");
  }
  if (has("Order") && has("OrderLine") && relation("order-line")) {
    rules.push("An order contains one or more order lines, but each order line belongs to one order.");
  }
  if (has("Product") && has("OrderLine") && relation("product-line")) {
    rules.push("Each order line references one product, but a product can appear in many order lines.");
  }
  if (has("Customer")) {
    const fields = entities.Customer!.fields.filter((field) => field.key !== "PK").map((field) => field.name);
    if (fields.length) rules.push(`Customer stores customer details (${fields.slice(0, 3).join(", ")}).`);
  }
  if (has("Product")) {
    const fields = entities.Product!.fields.filter((field) => field.key !== "PK").map((field) => field.name);
    if (fields.length) rules.push(`Product stores product details (${fields.slice(0, 3).join(", ")}).`);
  }
  if (has("Supplier") && has("Product") && relation("supplier-product")) {
    rules.push("One supplier can supply many products; each modeled product references one supplier in this example.");
  }
  if (has("Category") && has("Product") && relation("category-product")) {
    rules.push("One category can classify many products; each modeled product belongs to one governed category.");
  }

  return rules.length ? rules : ["Add entities and relationships to generate business rules."];
}

function validateModel(entities: Partial<Record<EntityId, EntityModel>>, relationships: RelationshipModel[]) {
  const list = Object.values(entities).filter(Boolean) as EntityModel[];
  const allHavePk = list.length > 0 && list.every((entity) => entity.fields.some((field) => field.key === "PK"));
  const foreignKeysValid = list.every((entity) =>
    entity.fields.filter((field) => field.key === "FK").every((field) => Boolean(field.ref && entities[field.ref] && entities[field.ref]!.fields.some((target) => target.key === "PK"))),
  );
  const relationshipsValid = relationships.length > 0 && relationships.every((relationship) =>
    Boolean(entities[relationship.from] && entities[relationship.to] && relationship.cardinality),
  );
  const signatures = relationships.map((relationship) => `${relationship.from}|${relationship.name}|${relationship.to}`);
  const noAmbiguous = new Set(signatures).size === signatures.length && relationships.every((relationship) => relationship.from !== relationship.to);

  return [
    { id: "pk", title: "All entities have a primary key", detail: `${list.filter((entity) => entity.fields.some((field) => field.key === "PK")).length} entities with PK defined`, passed: allHavePk },
    { id: "fk", title: "Foreign keys are consistent", detail: `${list.flatMap((entity) => entity.fields.filter((field) => field.key === "FK")).length} foreign keys properly defined`, passed: foreignKeysValid },
    { id: "cardinality", title: "All relationships have cardinality", detail: `${relationships.length} relationships with cardinality set`, passed: relationshipsValid },
    { id: "ambiguous", title: "No ambiguous relationships", detail: noAmbiguous ? "All relationships are clear and valid" : "Duplicate or self-referencing relationship found", passed: noAmbiguous },
  ];
}

function CanvasEntity({
  entity,
  selected,
  stage,
  onSelect,
}: {
  entity: EntityModel;
  selected: boolean;
  stage: number;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`merd-entity-card merd-entity-${entityTone(entity.id)} ${selected ? "is-selected" : ""}`}
      data-entity={entity.id}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <header>{entityIcon(entity.id, 16)}<strong>{entity.id}</strong></header>
      <div className={stage === 0 ? "is-stage-muted" : ""}>
        {entity.fields.map((field) => <span key={field.id}>
          {field.key === "PK" ? <KeyRound size={10}/> : field.key === "FK" ? <Link2 size={10}/> : <i/>}
          <b>{field.name}</b><small>{field.type}</small>
          {field.key && <em>{field.key}</em>}
        </span>)}
      </div>
    </button>
  );
}

function RelationshipLines({
  entities,
  relationships,
  stage,
}: {
  entities: Partial<Record<EntityId, EntityModel>>;
  relationships: RelationshipModel[];
  stage: number;
}) {
  const exists = (id: string) => relationships.some((relationship) => relationship.id === id);
  return (
    <svg className={`merd-lines ${stage < 2 ? "is-muted" : ""}`} viewBox="0 0 760 390" aria-label="ER relationship connectors">
      {entities.Customer && entities.Order && exists("customer-order") && <>
        <path className="merd-line merd-line-blue" d="M250 82 H310 Q326 82 326 98 V116 Q326 130 342 130 H405"/>
        <text x="267" y="72">1</text><text x="387" y="72">M</text>
        <rect x="292" y="102" width="67" height="26" rx="12"/><text className="merd-label merd-label-blue" x="325.5" y="119">places</text>
      </>}
      {entities.Order && entities.OrderLine && exists("order-line") && <>
        <path className="merd-line merd-line-orange" d="M500 156 V215"/>
        <text x="478" y="176">1</text><text x="478" y="219">M</text>
        <rect className="merd-rect-orange" x="461" y="181" width="79" height="25" rx="12"/><text className="merd-label merd-label-orange" x="500.5" y="198">contains</text>
      </>}
      {entities.Product && entities.OrderLine && exists("product-line") && <>
        <path className="merd-line merd-line-pink" d="M254 296 H402"/>
        <text x="267" y="285">1</text><text x="385" y="285">M</text>
        <rect className="merd-rect-pink" x="289" y="281" width="82" height="26" rx="12"/><text className="merd-label merd-label-pink" x="330" y="298">references</text>
      </>}
      {entities.Supplier && entities.Product && exists("supplier-product") && <>
        <path className="merd-line merd-line-cyan" d="M96 223 V260 Q96 273 112 273 H151"/>
        <text x="78" y="243">1</text><text x="137" y="263">M</text>
      </>}
      {entities.Category && entities.Product && exists("category-product") && <>
        <path className="merd-line merd-line-violet" d="M183 356 V335"/>
      </>}
    </svg>
  );
}

export function ModelingERHero({
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
    <section className="merd-hero" aria-labelledby="merd-hero-title">
      <div className="merd-hero-copy">
        <div className="merd-breadcrumb"><span>Data Modeling</span><ChevronRight size={13}/><strong>ER Modeling</strong></div>
        <div className="merd-title-row"><span className="merd-hero-icon"><Zap size={24}/></span><div><h1 id="merd-hero-title">ER Modeling</h1><p>{description}</p></div></div>
        <div className="merd-meta"><span><Clock3 size={14}/>{minutes} min</span><span><GraduationCap size={14}/>Lesson {currentLesson + 1}/{total}</span></div>
      </div>
      <div className="merd-hero-art" aria-hidden="true">
        <div className="merd-mini-db merd-mini-db-small"><Database size={42}/></div>
        <div className="merd-mini-db merd-mini-db-main"><Database size={70}/></div>
        <div className="merd-mini-card merd-mini-card-a"><UserRound size={17}/><span/><span/></div>
        <div className="merd-mini-card merd-mini-card-b"><ShoppingCart size={18}/><span/><span/></div>
        <div className="merd-mini-chain"><Link2 size={27}/></div>
        <i className="merd-mini-ok">✓</i>
      </div>
      <div className="merd-hero-actions">
        <span className="merd-difficulty">Intermediate</span>
        <div><button type="button" aria-label="Previous lesson" onClick={onPrevious} disabled={currentLesson === 0}><ChevronLeft size={18}/></button><button type="button" className="merd-next" onClick={onNext} disabled={currentLesson === total - 1}>Next <ChevronRight size={17}/></button></div>
      </div>
    </section>
  );
}

export function ModelingERBuilder() {
  const companion = useCompanion();
  const [entities, setEntities] = useState<Partial<Record<EntityId, EntityModel>>>(() => initialEntities());
  const [relationships, setRelationships] = useState<RelationshipModel[]>(() => CORE_RELATIONSHIPS.map((relationship) => ({ ...relationship })));
  const [selectedEntity, setSelectedEntity] = useState<EntityId>("Customer");
  const [paletteTab, setPaletteTab] = useState<PaletteTab>("Entities");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("Inspector");
  const [activeStep, setActiveStep] = useState(0);
  const [stepByStep, setStepByStep] = useState(false);
  const [status, setStatus] = useState<BuilderStatus>("done");
  const [validated, setValidated] = useState(true);
  const [validationSnapshot, setValidationSnapshot] = useState(() => validateModel(initialEntities(), CORE_RELATIONSHIPS));
  const [generatedRules, setGeneratedRules] = useState(() => generateRules(initialEntities(), CORE_RELATIONSHIPS));
  const [rulesStale, setRulesStale] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [gridVisible, setGridVisible] = useState(true);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const selected = entities[selectedEntity];
  const liveValidation = useMemo(() => validateModel(entities, relationships), [entities, relationships]);
  const passedCount = validationSnapshot.filter((check) => check.passed).length;

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const markChanged = () => {
    clearTimers();
    setStatus("ready");
    setValidated(false);
    setRulesStale(true);
  };

  const addEntity = (id: EntityId) => {
    if (entities[id]) {
      setSelectedEntity(id);
      return;
    }
    setEntities((previous) => ({ ...previous, [id]: cloneEntity(id) }));
    setSelectedEntity(id);
    markChanged();
  };

  const deleteEntity = (id: EntityId) => {
    setEntities((previous) => {
      const next = { ...previous };
      delete next[id];
      return next;
    });
    setRelationships((previous) => previous.filter((relationship) => relationship.from !== id && relationship.to !== id));
    const remaining = (Object.keys(entities) as EntityId[]).filter((entityId) => entityId !== id && entities[entityId]);
    setSelectedEntity(remaining[0] ?? "Customer");
    markChanged();
  };

  const updateEntity = (id: EntityId, patch: Partial<EntityModel>) => {
    setEntities((previous) => previous[id] ? { ...previous, [id]: { ...previous[id]!, ...patch } } : previous);
    markChanged();
  };

  const addAttribute = (field: Omit<Field, "key" | "ref">) => {
    if (!selected) return;
    if (selected.fields.some((item) => item.id === field.id)) return;
    updateEntity(selected.id, { fields: [...selected.fields, { ...field }] });
  };

  const removeAttribute = (fieldId: string) => {
    if (!selected) return;
    const field = selected.fields.find((item) => item.id === fieldId);
    if (!field || field.key === "PK") return;
    updateEntity(selected.id, { fields: selected.fields.filter((item) => item.id !== fieldId) });
  };

  const toggleRelationship = (candidate: RelationshipModel) => {
    if (!entities[candidate.from] || !entities[candidate.to]) return;
    const connected = relationships.some((item) => item.id === candidate.id);
    setRelationships((previous) => connected ? previous.filter((item) => item.id !== candidate.id) : [...previous, { ...candidate }]);
    if (candidate.id === "supplier-product" && entities.Product) {
      const fieldId = "supplier_id";
      setEntities((previous) => {
        const product = previous.Product;
        if (!product) return previous;
        const fields = connected
          ? product.fields.filter((field) => field.id !== fieldId)
          : product.fields.some((field) => field.id === fieldId)
            ? product.fields
            : [...product.fields, { id: fieldId, name: fieldId, type: "INT", key: "FK" as const, ref: "Supplier" as const }];
        return { ...previous, Product: { ...product, fields } };
      });
    }
    if (candidate.id === "category-product" && entities.Product) {
      const fieldId = "category_id";
      setEntities((previous) => {
        const product = previous.Product;
        if (!product) return previous;
        const fields = connected
          ? product.fields.filter((field) => field.id !== fieldId)
          : product.fields.some((field) => field.id === fieldId)
            ? product.fields
            : [...product.fields, { id: fieldId, name: fieldId, type: "INT", key: "FK" as const, ref: "Category" as const }];
        return { ...previous, Product: { ...product, fields } };
      });
    }
    markChanged();
  };

  const cycleCardinality = (id: string) => {
    const order: Cardinality[] = ["1:N", "1:1", "N:M"];
    setRelationships((previous) => previous.map((relationship) => {
      if (relationship.id !== id) return relationship;
      const index = order.indexOf(relationship.cardinality);
      return { ...relationship, cardinality: order[(index + 1) % order.length] };
    }));
    markChanged();
  };

  const validateAndGenerate = () => {
    const checks = validateModel(entities, relationships);
    setValidationSnapshot(checks);
    setGeneratedRules(generateRules(entities, relationships));
    setRulesStale(false);
    setValidated(true);
    setStatus("done");
    setActiveStep(4);
    companion?.emit({
      type: checks.every((check) => check.passed) ? "exercise_correct" : "exercise_error",
      lesson: "ER Modeling",
      source: "runner",
    });
  };

  const moveToStep = (step: number) => {
    setActiveStep(step);
    if (step === 0) setPaletteTab("Entities");
    if (step === 1) setPaletteTab("Attributes");
    if (step === 2 || step === 3) setPaletteTab("Relationships");
    if (step === 4) validateAndGenerate();
  };

  const run = () => {
    clearTimers();
    if (stepByStep) {
      const next = status !== "running" || activeStep >= 4 ? 0 : activeStep + 1;
      setStatus(next === 4 ? "done" : "running");
      moveToStep(next);
      return;
    }
    setValidated(false);
    setStatus("running");
    [0, 1, 2, 3, 4].forEach((step, index) => {
      const timer = setTimeout(() => {
        if (step < 4) moveToStep(step);
        else validateAndGenerate();
      }, 130 + index * 260);
      timers.current.push(timer);
    });
  };

  const reset = () => {
    clearTimers();
    const nextEntities = initialEntities();
    const nextRelationships = CORE_RELATIONSHIPS.map((relationship) => ({ ...relationship }));
    setEntities(nextEntities);
    setRelationships(nextRelationships);
    setSelectedEntity("Customer");
    setPaletteTab("Entities");
    setInspectorTab("Inspector");
    setActiveStep(0);
    setStepByStep(false);
    setStatus("done");
    setValidated(true);
    setValidationSnapshot(validateModel(nextEntities, nextRelationships));
    setGeneratedRules(generateRules(nextEntities, nextRelationships));
    setRulesStale(false);
    setZoom(1);
    setGridVisible(true);
  };

  const dropEntity = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain") as EntityId;
    if (ENTITY_CATALOG[id]) addEntity(id);
  };

  const regenerateRules = () => {
    setGeneratedRules(generateRules(entities, relationships));
    setRulesStale(false);
  };

  const relationChoices = [...CORE_RELATIONSHIPS, ...OPTIONAL_RELATIONSHIPS];

  return (
    <section className="merd-builder" aria-labelledby="merd-builder-title">
      <header className="merd-builder-head">
        <div><h2 id="merd-builder-title"><GitBranch size={23}/>Build Your ER Diagram</h2><p>Drag entities, add attributes, connect relationships, set cardinality and validate your model.</p></div>
        <div className="merd-builder-controls">
          <button type="button" className="merd-run" onClick={run}><Play size={15} fill="currentColor"/>{stepByStep && status === "running" ? "Next Step" : "Run & Validate"}</button>
          <label className="merd-toggle"><input type="checkbox" checked={stepByStep} onChange={(event) => { clearTimers(); setStepByStep(event.target.checked); setStatus("ready"); setActiveStep(-1); }}/><span/>Step by step</label>
          <button type="button" className="merd-reset" onClick={reset}><RefreshCcw size={14}/>Reset</button>
        </div>
      </header>

      <div className="merd-steps" aria-label="ER modeling workflow">
        {STEPS.map(([title, subtitle], index) => <button type="button" key={title} className={`${activeStep === index ? "is-active" : ""} ${index === 4 && validated && passedCount === 4 ? "is-complete" : ""}`} aria-current={activeStep === index ? "step" : undefined} onClick={() => moveToStep(index)}>
          <span>{index + 1}</span><div><strong>{title}</strong><small>{subtitle}</small></div>
        </button>)}
      </div>

      <div className="merd-workspace">
        <aside className="merd-palette">
          <nav role="tablist" aria-label="ER builder palette">
            {(["Entities", "Attributes", "Relationships"] as PaletteTab[]).map((tab) => <button type="button" role="tab" key={tab} aria-selected={paletteTab === tab} onClick={() => setPaletteTab(tab)}>
              {tab === "Entities" ? <Grid2X2 size={13}/> : tab === "Attributes" ? <KeyRound size={13}/> : <Link2 size={13}/>}
              {tab}
            </button>)}
          </nav>
          {paletteTab === "Entities" && <div className="merd-palette-body">
            <p>Drag to add an entity to the canvas</p>
            {(Object.keys(ENTITY_CATALOG) as EntityId[]).map((id) => <button
              type="button"
              draggable
              key={id}
              className={`merd-palette-item merd-palette-${entityTone(id)}`}
              aria-pressed={Boolean(entities[id])}
              onClick={() => addEntity(id)}
              onDragStart={(event) => { event.dataTransfer.setData("text/plain", id); event.dataTransfer.effectAllowed = "copy"; }}
            >
              <span>{entityIcon(id, 16)}</span><div><strong>{id}</strong><small>{id === "OrderLine" ? "e.g. order items" : id === "Supplier" ? "e.g. vendors" : id === "Category" ? "e.g. product categories" : `e.g. ${pluralize(id)}, ${id === "Customer" ? "users" : id === "Order" ? "purchases" : "items"}`}</small></div>{entities[id] && <Check size={13}/>}
            </button>)}
          </div>}
          {paletteTab === "Attributes" && <div className="merd-palette-body">
            <p>{selected ? `Add an attribute to ${selected.id}` : "Select an entity first"}</p>
            {ATTRIBUTE_OPTIONS.map((field) => <button type="button" key={field.id} className="merd-attribute-option" disabled={!selected || selected.fields.some((item) => item.id === field.id)} onClick={() => addAttribute(field)}>
              <span><KeyRound size={14}/></span><div><strong>{field.name}</strong><small>{field.type}</small></div><Plus size={13}/>
            </button>)}
          </div>}
          {paletteTab === "Relationships" && <div className="merd-palette-body">
            <p>Connect entities or cycle cardinality</p>
            {relationChoices.map((relationship) => {
              const connected = relationships.some((item) => item.id === relationship.id);
              const current = relationships.find((item) => item.id === relationship.id);
              const available = Boolean(entities[relationship.from] && entities[relationship.to]);
              return <div className="merd-relation-option" key={relationship.id}>
                <button type="button" disabled={!available} aria-pressed={connected} onClick={() => toggleRelationship(relationship)}>
                  <Link2 size={14}/><span><strong>{relationship.name}</strong><small>{relationship.from} → {relationship.to}</small></span>{connected ? <Check size={13}/> : <Plus size={13}/>}
                </button>
                {connected && <button type="button" className="merd-cardinality-cycle" onClick={() => cycleCardinality(relationship.id)} aria-label={`Change ${relationship.name} cardinality`}>{current?.cardinality}</button>}
              </div>;
            })}
          </div>}
        </aside>

        <div
          className={`merd-canvas ${gridVisible ? "has-grid" : ""} merd-stage-${Math.max(0, activeStep)}`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={dropEntity}
        >
          <div className="merd-canvas-inner" style={{ transform: `scale(${zoom})` }}>
            <RelationshipLines entities={entities} relationships={relationships} stage={Math.max(0, activeStep)}/>
            {entities.Customer && <CanvasEntity entity={entities.Customer} selected={selectedEntity === "Customer"} stage={Math.max(0, activeStep)} onSelect={() => setSelectedEntity("Customer")}/>}
            {entities.Order && <CanvasEntity entity={entities.Order} selected={selectedEntity === "Order"} stage={Math.max(0, activeStep)} onSelect={() => setSelectedEntity("Order")}/>}
            {entities.Product && <CanvasEntity entity={entities.Product} selected={selectedEntity === "Product"} stage={Math.max(0, activeStep)} onSelect={() => setSelectedEntity("Product")}/>}
            {entities.OrderLine && <CanvasEntity entity={entities.OrderLine} selected={selectedEntity === "OrderLine"} stage={Math.max(0, activeStep)} onSelect={() => setSelectedEntity("OrderLine")}/>}
            {entities.Supplier && <CanvasEntity entity={entities.Supplier} selected={selectedEntity === "Supplier"} stage={Math.max(0, activeStep)} onSelect={() => setSelectedEntity("Supplier")}/>}
            {entities.Category && <CanvasEntity entity={entities.Category} selected={selectedEntity === "Category"} stage={Math.max(0, activeStep)} onSelect={() => setSelectedEntity("Category")}/>}
          </div>
          <div className="merd-canvas-controls" role="group" aria-label="Canvas controls">
            <button type="button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(1.25, Number((value + .1).toFixed(2))))}><Plus size={15}/></button>
            <button type="button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(.75, Number((value - .1).toFixed(2))))}><Minus size={15}/></button>
            <button type="button" aria-label="Fit diagram" onClick={() => setZoom(1)}><Maximize2 size={14}/></button>
            <button type="button" aria-pressed={gridVisible} aria-label="Toggle canvas grid" onClick={() => setGridVisible((value) => !value)}><Grid2X2 size={14}/></button>
          </div>
        </div>

        <aside className="merd-inspector">
          <nav role="tablist" aria-label="ER model inspector">
            <button type="button" role="tab" aria-selected={inspectorTab === "Inspector"} onClick={() => setInspectorTab("Inspector")}><Boxes size={13}/>Inspector</button>
            <button type="button" role="tab" aria-selected={inspectorTab === "Business Rules"} onClick={() => setInspectorTab("Business Rules")}><CheckCircle2 size={13}/>Business Rules</button>
          </nav>
          {inspectorTab === "Inspector" ? selected ? <div className="merd-inspector-body">
            <header className={`merd-inspector-entity merd-palette-${entityTone(selected.id)}`}>{entityIcon(selected.id, 17)}<strong>{selected.id} (Entity)</strong></header>
            <p>{selected.description}</p>
            <label>Table name<input value={selected.tableName} onChange={(event) => updateEntity(selected.id, { tableName: event.target.value })}/></label>
            <label>Description<textarea rows={2} value={selected.description} onChange={(event) => updateEntity(selected.id, { description: event.target.value })}/></label>
            <div className="merd-attribute-head"><strong>Attributes ({selected.fields.length})</strong><button type="button" onClick={() => { setPaletteTab("Attributes"); setActiveStep(1); }}><Plus size={12}/>Add</button></div>
            <div className="merd-inspector-fields">
              {selected.fields.map((field) => <div key={field.id}>
                <span>{field.key === "PK" ? <KeyRound size={12}/> : field.key === "FK" ? <Link2 size={12}/> : <i/>}<b>{field.name}</b></span>
                <small>{field.type}</small>{field.key && <em>{field.key}</em>}
                <button type="button" aria-label={`Remove ${field.name}`} disabled={field.key === "PK"} onClick={() => removeAttribute(field.id)}><MoreHorizontal size={14}/></button>
              </div>)}
            </div>
            <button type="button" className="merd-delete" onClick={() => deleteEntity(selected.id)}><Trash2 size={13}/>Delete Entity</button>
          </div> : <div className="merd-inspector-empty">Select an entity on the canvas.</div> : <div className="merd-rule-inspector">
            <header><strong>Generated rules</strong><button type="button" onClick={regenerateRules}><RefreshCcw size={12}/>{rulesStale ? "Update" : "Regenerate"}</button></header>
            <ol>{generatedRules.map((rule, index) => <li key={index}>{rule}</li>)}</ol>
          </div>}
        </aside>
      </div>

      <div className="merd-bottom">
        <section className="merd-validation">
          <header><div><CheckCircle2 size={22}/><strong>Validation Results</strong></div><span>{validated ? `${passedCount}/4 checks passed` : "Changes need validation"}</span><i><b style={{ width: validated ? `${passedCount * 25}%` : "0%" }}/></i></header>
          <div>{(validated ? validationSnapshot : liveValidation).map((check) => <article key={check.id} className={check.passed ? "is-pass" : "is-fail"}>
            <span>{check.passed ? <Check size={15}/> : <AlertCircle size={15}/>}</span><div><strong>{check.title}</strong><small>{check.detail}</small></div>
          </article>)}</div>
        </section>
        <section className="merd-business-rules">
          <header><div><Database size={18}/><strong>Business Rules (Generated)</strong>{rulesStale && <small>stale</small>}</div><button type="button" onClick={regenerateRules}><RefreshCcw size={12}/>Regenerate</button></header>
          <ol>{generatedRules.slice(0, 5).map((rule, index) => <li key={index}>{rule}</li>)}</ol>
        </section>
      </div>

      <span className="merd-status" role="status">{status === "running" ? `Builder step ${activeStep + 1} of 5` : validated ? `Validation complete: ${passedCount} of 4 checks passed.` : "Model changed. Run validation to refresh the checks and generated rules."}</span>
    </section>
  );
}
