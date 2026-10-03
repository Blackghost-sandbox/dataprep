export type DbtIntroScenarioId = "ecommerce" | "subscriptions" | "marketplace";

export type DbtIntroRow = {
  id: string;
  customer: string;
  date: string;
  status: string;
  amount: string;
};

export type DbtIntroField = {
  name: string;
  type: "VARCHAR" | "DATE" | "NUMERIC";
};

export type DbtIntroScenario = {
  id: DbtIntroScenarioId;
  label: string;
  sourceLabel: string;
  sourceTable: string;
  modelName: string;
  warehouse: string;
  analyticsTool: string;
  rowCount: number;
  code: string;
  rows: DbtIntroRow[];
  fields: DbtIntroField[];
};

export const dbtIntroScenarios: DbtIntroScenario[] = [
  {
    id: "ecommerce",
    label: "E-commerce Analytics",
    sourceLabel: "Application DB",
    sourceTable: "raw.orders",
    modelName: "stg_orders",
    warehouse: "Snowflake",
    analyticsTool: "Metabase",
    rowCount: 1024,
    code: [
      "select",
      "  order_id,",
      "  customer_id,",
      "  order_date,",
      "  order_status,",
      "  amount",
      "from {{ source('raw', 'orders') }}",
      "where order_status is not null",
    ].join("\n"),
    rows: [
      { id: "1001", customer: "CUST_001", date: "2024-01-15", status: "completed", amount: "259.99" },
      { id: "1002", customer: "CUST_002", date: "2024-01-16", status: "shipped", amount: "129.50" },
      { id: "1003", customer: "CUST_003", date: "2024-01-17", status: "completed", amount: "89.00" },
      { id: "1004", customer: "CUST_004", date: "2024-01-18", status: "processing", amount: "174.25" },
    ],
    fields: [
      { name: "order_id", type: "VARCHAR" },
      { name: "customer_id", type: "VARCHAR" },
      { name: "order_date", type: "DATE" },
      { name: "order_status", type: "VARCHAR" },
      { name: "amount", type: "NUMERIC" },
    ],
  },
  {
    id: "subscriptions",
    label: "Subscription Revenue",
    sourceLabel: "Billing API",
    sourceTable: "raw.subscriptions",
    modelName: "stg_subscriptions",
    warehouse: "BigQuery",
    analyticsTool: "Looker",
    rowCount: 684,
    code: [
      "select",
      "  subscription_id,",
      "  customer_id,",
      "  started_at as subscription_date,",
      "  status as order_status,",
      "  monthly_amount as amount",
      "from {{ source('raw', 'subscriptions') }}",
      "where status in ('active', 'trialing')",
    ].join("\n"),
    rows: [
      { id: "SUB_301", customer: "CUST_011", date: "2024-02-03", status: "active", amount: "49.00" },
      { id: "SUB_302", customer: "CUST_022", date: "2024-02-05", status: "trialing", amount: "29.00" },
      { id: "SUB_303", customer: "CUST_031", date: "2024-02-06", status: "active", amount: "99.00" },
      { id: "SUB_304", customer: "CUST_045", date: "2024-02-08", status: "active", amount: "49.00" },
    ],
    fields: [
      { name: "subscription_id", type: "VARCHAR" },
      { name: "customer_id", type: "VARCHAR" },
      { name: "subscription_date", type: "DATE" },
      { name: "order_status", type: "VARCHAR" },
      { name: "amount", type: "NUMERIC" },
    ],
  },
  {
    id: "marketplace",
    label: "Marketplace Orders",
    sourceLabel: "Third-party API",
    sourceTable: "raw.marketplace_orders",
    modelName: "stg_marketplace_orders",
    warehouse: "Databricks",
    analyticsTool: "Tableau",
    rowCount: 2310,
    code: [
      "select",
      "  order_id,",
      "  buyer_id as customer_id,",
      "  created_at as order_date,",
      "  fulfillment_status as order_status,",
      "  gross_amount as amount",
      "from {{ source('raw', 'marketplace_orders') }}",
      "where is_test_order = false",
    ].join("\n"),
    rows: [
      { id: "MKT_8121", customer: "BUY_401", date: "2024-03-01", status: "fulfilled", amount: "319.00" },
      { id: "MKT_8122", customer: "BUY_119", date: "2024-03-01", status: "processing", amount: "74.50" },
      { id: "MKT_8123", customer: "BUY_553", date: "2024-03-02", status: "fulfilled", amount: "149.95" },
      { id: "MKT_8124", customer: "BUY_621", date: "2024-03-02", status: "shipped", amount: "211.40" },
    ],
    fields: [
      { name: "order_id", type: "VARCHAR" },
      { name: "customer_id", type: "VARCHAR" },
      { name: "order_date", type: "DATE" },
      { name: "order_status", type: "VARCHAR" },
      { name: "amount", type: "NUMERIC" },
    ],
  },
];

export function getDbtIntroScenario(id: DbtIntroScenarioId): DbtIntroScenario {
  return dbtIntroScenarios.find((scenario) => scenario.id === id) ?? dbtIntroScenarios[0];
}

export function buildDbtExecutionLog(scenario: DbtIntroScenario): string[] {
  return [
    "10:14:23  Running model: " + scenario.modelName,
    "10:14:24  Compiling SQL...",
    "10:14:25  Executing on warehouse (" + scenario.warehouse + ")...",
    "10:14:27  Created table: analytics." + scenario.modelName,
    "10:14:27  " + scenario.rowCount.toLocaleString("en-US") + " rows processed",
    "10:14:27  Model run completed successfully!",
  ];
}
