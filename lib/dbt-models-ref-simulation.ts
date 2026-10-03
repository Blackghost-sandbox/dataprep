export type DbtModelsScenarioId = "ecommerce" | "subscriptions" | "support";

export type DbtModelsScenario = {
  id: DbtModelsScenarioId;
  label: string;
  sourceName: string;
  stagingModel: string;
  factModel: string;
  downstreamLabel: string;
  rowCount: number;
  sourceCode: string;
  rows: Array<{
    id: string;
    customer: string;
    date: string;
    amount: string;
  }>;
};

export const dbtModelsScenarios: DbtModelsScenario[] = [
  {
    id: "ecommerce",
    label: "E-commerce Analytics",
    sourceName: "raw.orders",
    stagingModel: "stg_orders",
    factModel: "fct_orders",
    downstreamLabel: "dashboard",
    rowCount: 1024,
    sourceCode: [
      "select",
      "    order_id,",
      "    customer_id,",
      "    order_date,",
      "    total_amount",
      "from {{ source('raw', 'orders') }}",
      "where order_date >= '2024-01-01'",
    ].join("\n"),
    rows: [
      { id: "1001", customer: "C001", date: "2024-01-02", amount: "120.50" },
      { id: "1002", customer: "C004", date: "2024-01-03", amount: "75.20" },
      { id: "1003", customer: "C002", date: "2024-01-04", amount: "310.00" },
      { id: "1004", customer: "C001", date: "2024-01-05", amount: "45.99" },
      { id: "1005", customer: "C010", date: "2024-01-06", amount: "220.00" },
    ],
  },
  {
    id: "subscriptions",
    label: "Subscription Revenue",
    sourceName: "raw.subscriptions",
    stagingModel: "stg_subscriptions",
    factModel: "fct_subscription_revenue",
    downstreamLabel: "revenue dashboard",
    rowCount: 684,
    sourceCode: [
      "select",
      "    subscription_id as order_id,",
      "    customer_id,",
      "    started_at as order_date,",
      "    monthly_amount as total_amount",
      "from {{ source('raw', 'subscriptions') }}",
      "where status in ('active', 'trialing')",
    ].join("\n"),
    rows: [
      { id: "SUB301", customer: "C011", date: "2024-02-03", amount: "49.00" },
      { id: "SUB302", customer: "C022", date: "2024-02-05", amount: "29.00" },
      { id: "SUB303", customer: "C031", date: "2024-02-06", amount: "99.00" },
      { id: "SUB304", customer: "C045", date: "2024-02-08", amount: "49.00" },
      { id: "SUB305", customer: "C052", date: "2024-02-09", amount: "79.00" },
    ],
  },
  {
    id: "support",
    label: "Support Operations",
    sourceName: "raw.support_tickets",
    stagingModel: "stg_support_tickets",
    factModel: "fct_support_activity",
    downstreamLabel: "support dashboard",
    rowCount: 1488,
    sourceCode: [
      "select",
      "    ticket_id as order_id,",
      "    customer_id,",
      "    opened_at as order_date,",
      "    handling_cost as total_amount",
      "from {{ source('raw', 'support_tickets') }}",
      "where is_spam = false",
    ].join("\n"),
    rows: [
      { id: "TK901", customer: "C101", date: "2024-03-01", amount: "14.20" },
      { id: "TK902", customer: "C118", date: "2024-03-01", amount: "21.40" },
      { id: "TK903", customer: "C144", date: "2024-03-02", amount: "11.80" },
      { id: "TK904", customer: "C156", date: "2024-03-02", amount: "32.10" },
      { id: "TK905", customer: "C171", date: "2024-03-03", amount: "18.60" },
    ],
  },
];

export function getDbtModelsScenario(id: DbtModelsScenarioId): DbtModelsScenario {
  return dbtModelsScenarios.find((scenario) => scenario.id === id) ?? dbtModelsScenarios[0];
}

export type DbtModelsRunState = {
  step: number;
  status: "idle" | "running" | "success";
  log: string[];
};

export function newDbtModelsRunState(): DbtModelsRunState {
  return { step: 0, status: "idle", log: [] };
}

export function buildDbtModelsSteps(scenario: DbtModelsScenario): string[] {
  return [
    "Parsed model " + scenario.stagingModel,
    "Resolved source dependency " + scenario.sourceName,
    "Compiled ref graph " + scenario.stagingModel + " → " + scenario.factModel,
    "Built analytics." + scenario.stagingModel,
    "Built analytics." + scenario.factModel,
    "Exposed " + scenario.rowCount.toLocaleString("en-US") + " rows to " + scenario.downstreamLabel,
  ];
}

export function advanceDbtModelsRun(
  state: DbtModelsRunState,
  scenario: DbtModelsScenario,
): DbtModelsRunState {
  const steps = buildDbtModelsSteps(scenario);
  if (state.status === "success") return state;
  const nextStep = Math.min(state.step + 1, steps.length);
  return {
    step: nextStep,
    status: nextStep >= steps.length ? "success" : "running",
    log: steps.slice(0, nextStep),
  };
}
