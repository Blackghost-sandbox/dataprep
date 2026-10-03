export type DbtSourceScenarioId = "ecommerce" | "subscriptions" | "crm";

export type DbtSourceScenario = {
  id: DbtSourceScenarioId;
  label: string;
  sourceGroup: string;
  tableName: string;
  sourceSystem: string;
  modelName: string;
  intermediateModel: string;
  martModel: string;
  rowCount: number;
  sql: string;
  yaml: string;
  rows: Array<{orderId:string;customerId:string;orderDate:string;totalAmount:string}>;
};

export const dbtSourceScenarios: DbtSourceScenario[] = [
  {
    id: "ecommerce",
    label: "E-commerce Analytics",
    sourceGroup: "raw",
    tableName: "orders",
    sourceSystem: "Operational DB",
    modelName: "stg_orders",
    intermediateModel: "int_orders",
    martModel: "fct_orders",
    rowCount: 1024,
    sql: [
      "select",
      "    order_id,",
      "    customer_id,",
      "    order_date,",
      "    total_amount",
      "from {{ source('raw', 'orders') }}",
      "where order_date >= '2024-01-01'",
    ].join("\n"),
    yaml: [
      "version: 2",
      "sources:",
      "  - name: raw",
      "    description: \"Raw data from operational database\"",
      "    database: analytics",
      "    schema: public",
      "    tables:",
      "      - name: orders",
      "        description: \"Orders from the e-commerce system\"",
      "        loaded_at_field: _loaded_at",
      "        freshness:",
      "          warn_after: { count: 12, period: hour }",
      "          error_after: { count: 24, period: hour }",
    ].join("\n"),
    rows: [
      {orderId:"1001",customerId:"C001",orderDate:"2024-01-02",totalAmount:"120.50"},
      {orderId:"1002",customerId:"C004",orderDate:"2024-01-03",totalAmount:"75.20"},
      {orderId:"1003",customerId:"C002",orderDate:"2024-01-04",totalAmount:"310.00"},
      {orderId:"1004",customerId:"C001",orderDate:"2024-01-05",totalAmount:"45.99"},
      {orderId:"1005",customerId:"C010",orderDate:"2024-01-06",totalAmount:"220.00"},
    ],
  },
  {
    id: "subscriptions",
    label: "Subscription Billing",
    sourceGroup: "billing",
    tableName: "subscriptions",
    sourceSystem: "Billing API",
    modelName: "stg_subscriptions",
    intermediateModel: "int_subscription_events",
    martModel: "fct_subscription_revenue",
    rowCount: 684,
    sql: [
      "select",
      "    subscription_id as order_id,",
      "    customer_id,",
      "    started_at as order_date,",
      "    monthly_amount as total_amount",
      "from {{ source('billing', 'subscriptions') }}",
      "where status in ('active', 'trialing')",
    ].join("\n"),
    yaml: [
      "version: 2",
      "sources:",
      "  - name: billing",
      "    description: \"Subscription data loaded by billing ingestion\"",
      "    schema: billing_raw",
      "    tables:",
      "      - name: subscriptions",
      "        loaded_at_field: _loaded_at",
      "        freshness:",
      "          warn_after: { count: 2, period: hour }",
      "          error_after: { count: 6, period: hour }",
    ].join("\n"),
    rows: [
      {orderId:"SUB301",customerId:"C011",orderDate:"2024-02-03",totalAmount:"49.00"},
      {orderId:"SUB302",customerId:"C022",orderDate:"2024-02-05",totalAmount:"29.00"},
      {orderId:"SUB303",customerId:"C031",orderDate:"2024-02-06",totalAmount:"99.00"},
      {orderId:"SUB304",customerId:"C045",orderDate:"2024-02-08",totalAmount:"49.00"},
      {orderId:"SUB305",customerId:"C052",orderDate:"2024-02-09",totalAmount:"79.00"},
    ],
  },
  {
    id: "crm",
    label: "CRM Customer Feed",
    sourceGroup: "crm",
    tableName: "customer_events",
    sourceSystem: "CRM / ERP",
    modelName: "stg_customer_events",
    intermediateModel: "int_customer_activity",
    martModel: "dim_customers",
    rowCount: 1488,
    sql: [
      "select",
      "    event_id as order_id,",
      "    customer_id,",
      "    occurred_at as order_date,",
      "    event_value as total_amount",
      "from {{ source('crm', 'customer_events') }}",
      "where is_deleted = false",
    ].join("\n"),
    yaml: [
      "version: 2",
      "sources:",
      "  - name: crm",
      "    description: \"CRM events loaded by ingestion\"",
      "    schema: crm_raw",
      "    tables:",
      "      - name: customer_events",
      "        loaded_at_field: ingested_at",
      "        freshness:",
      "          warn_after: { count: 4, period: hour }",
      "          error_after: { count: 8, period: hour }",
    ].join("\n"),
    rows: [
      {orderId:"EV901",customerId:"C101",orderDate:"2024-03-01",totalAmount:"14.20"},
      {orderId:"EV902",customerId:"C118",orderDate:"2024-03-01",totalAmount:"21.40"},
      {orderId:"EV903",customerId:"C144",orderDate:"2024-03-02",totalAmount:"11.80"},
      {orderId:"EV904",customerId:"C156",orderDate:"2024-03-02",totalAmount:"32.10"},
      {orderId:"EV905",customerId:"C171",orderDate:"2024-03-03",totalAmount:"18.60"},
    ],
  },
];

export function getDbtSourceScenario(id: DbtSourceScenarioId): DbtSourceScenario {
  return dbtSourceScenarios.find((item)=>item.id===id) ?? dbtSourceScenarios[0];
}

export type DbtSourceRunState = {
  step: number;
  status: "idle" | "running" | "success";
  log: string[];
};

export function newDbtSourceRunState(): DbtSourceRunState {
  return {step:0,status:"idle",log:[]};
}

export function buildDbtSourceRunSteps(scenario: DbtSourceScenario): string[] {
  return [
    "Loaded source metadata: " + scenario.sourceGroup + "." + scenario.tableName,
    "Validated source() dependency in " + scenario.modelName,
    "Compiled SQL for " + scenario.modelName,
    "Built analytics." + scenario.modelName,
    "Resolved downstream lineage to " + scenario.intermediateModel,
    "Published " + scenario.martModel + " with " + scenario.rowCount.toLocaleString("en-US") + " rows",
  ];
}

export function advanceDbtSourceRun(state: DbtSourceRunState, scenario: DbtSourceScenario): DbtSourceRunState {
  const steps=buildDbtSourceRunSteps(scenario);
  if(state.status==="success") return state;
  const nextStep=Math.min(state.step+1,steps.length);
  return {
    step:nextStep,
    status:nextStep>=steps.length?"success":"running",
    log:steps.slice(0,nextStep),
  };
}
