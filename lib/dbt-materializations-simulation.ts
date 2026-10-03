export type DbtMaterializationId = "view" | "table" | "incremental" | "ephemeral";
export type DbtMaterializationDatasetId = "ecommerce" | "subscriptions" | "support";

export type DbtMaterializationOption = {
  id: DbtMaterializationId;
  label: string;
  description: string;
  objectSummary: string;
};

export type DbtMaterializationDataset = {
  id: DbtMaterializationDatasetId;
  label: string;
  modelName: string;
  sourceModel: string;
  totalRows: number;
  changedRows: number;
  rows: Array<{
    order_id: string;
    customer_id: string;
    order_date: string;
    total_amount: string;
  }>;
};

export const dbtMaterializationOptions: DbtMaterializationOption[] = [
  {
    id: "view",
    label: "View",
    description: "Creates a view (no data stored)",
    objectSummary: "Virtual table (no data stored)",
  },
  {
    id: "table",
    label: "Table",
    description: "Creates a physical table (full refresh)",
    objectSummary: "Physical table (data stored)",
  },
  {
    id: "incremental",
    label: "Incremental",
    description: "Processes only new/changed data",
    objectSummary: "Efficiently processes only new data",
  },
  {
    id: "ephemeral",
    label: "Ephemeral",
    description: "Inlined into downstream model",
    objectSummary: "Inlined into downstream model (no relation)",
  },
];

export const dbtMaterializationDatasets: DbtMaterializationDataset[] = [
  {
    id: "ecommerce",
    label: "E-commerce Orders (Sample)",
    modelName: "stg_orders",
    sourceModel: "raw_orders",
    totalRows: 1024,
    changedRows: 128,
    rows: [
      {order_id:"1001",customer_id:"C001",order_date:"2024-01-01",total_amount:"120.50"},
      {order_id:"1002",customer_id:"C002",order_date:"2024-01-02",total_amount:"75.20"},
      {order_id:"1003",customer_id:"C003",order_date:"2024-01-03",total_amount:"65.00"},
      {order_id:"1004",customer_id:"C001",order_date:"2024-01-04",total_amount:"310.00"},
      {order_id:"1005",customer_id:"C005",order_date:"2024-01-05",total_amount:"45.99"},
    ],
  },
  {
    id: "subscriptions",
    label: "Subscription Revenue",
    modelName: "stg_subscriptions",
    sourceModel: "raw_subscriptions",
    totalRows: 684,
    changedRows: 54,
    rows: [
      {order_id:"SUB301",customer_id:"C011",order_date:"2024-02-03",total_amount:"49.00"},
      {order_id:"SUB302",customer_id:"C022",order_date:"2024-02-05",total_amount:"29.00"},
      {order_id:"SUB303",customer_id:"C031",order_date:"2024-02-06",total_amount:"99.00"},
      {order_id:"SUB304",customer_id:"C045",order_date:"2024-02-08",total_amount:"49.00"},
      {order_id:"SUB305",customer_id:"C052",order_date:"2024-02-09",total_amount:"79.00"},
    ],
  },
  {
    id: "support",
    label: "Support Operations",
    modelName: "stg_support_activity",
    sourceModel: "raw_support_activity",
    totalRows: 1488,
    changedRows: 211,
    rows: [
      {order_id:"TK901",customer_id:"C101",order_date:"2024-03-01",total_amount:"14.20"},
      {order_id:"TK902",customer_id:"C118",order_date:"2024-03-01",total_amount:"21.40"},
      {order_id:"TK903",customer_id:"C144",order_date:"2024-03-02",total_amount:"11.80"},
      {order_id:"TK904",customer_id:"C156",order_date:"2024-03-02",total_amount:"32.10"},
      {order_id:"TK905",customer_id:"C171",order_date:"2024-03-03",total_amount:"18.60"},
    ],
  },
];

export function getDbtMaterializationOption(id: DbtMaterializationId): DbtMaterializationOption {
  return dbtMaterializationOptions.find(option=>option.id===id) ?? dbtMaterializationOptions[1];
}

export function getDbtMaterializationDataset(id: DbtMaterializationDatasetId): DbtMaterializationDataset {
  return dbtMaterializationDatasets.find(dataset=>dataset.id===id) ?? dbtMaterializationDatasets[0];
}

export function buildDbtMaterializationSql(
  dataset: DbtMaterializationDataset,
  materialization: DbtMaterializationId,
): string {
  const config = materialization === "incremental"
    ? "{{ config(materialized='incremental', unique_key='order_id') }}"
    : "{{ config(materialized='"+materialization+"') }}";
  const incremental = materialization === "incremental"
    ? "\n{% if is_incremental() %}\nwhere updated_at >= (select max(updated_at) from {{ this }})\n{% endif %}"
    : "";
  return [
    config,
    "",
    "select",
    "    order_id,",
    "    customer_id,",
    "    order_date,",
    "    total_amount",
    "from {{ ref('"+dataset.sourceModel+"') }}"+incremental,
  ].join("\n");
}

export type DbtMaterializationRunResult = {
  materialization: DbtMaterializationId;
  status: string;
  relationName: string | null;
  relationType: "view" | "table" | "incremental table" | "none";
  processedRows: number;
  storedRows: number;
  generatedSql: string;
};

export function runDbtMaterialization(
  dataset: DbtMaterializationDataset,
  materialization: DbtMaterializationId,
): DbtMaterializationRunResult {
  const relationName = materialization === "ephemeral" ? null : "analytics."+dataset.modelName;
  const processedRows = materialization === "incremental" ? dataset.changedRows : dataset.totalRows;
  const storedRows = materialization === "view" || materialization === "ephemeral" ? 0 : dataset.totalRows;

  let status = "";
  let relationType: DbtMaterializationRunResult["relationType"] = "table";
  if(materialization==="view"){
    status = "Created view "+dataset.modelName+" (virtual relation, no rows stored)";
    relationType = "view";
  } else if(materialization==="table"){
    status = "Created table "+dataset.modelName+" with "+dataset.totalRows.toLocaleString("en-US")+" rows";
    relationType = "table";
  } else if(materialization==="incremental"){
    status = "Merged "+dataset.changedRows.toLocaleString("en-US")+" changed rows into "+dataset.modelName;
    relationType = "incremental table";
  } else {
    status = "Inlined "+dataset.modelName+" into the downstream model; no warehouse relation created";
    relationType = "none";
  }

  return {
    materialization,
    status,
    relationName,
    relationType,
    processedRows,
    storedRows,
    generatedSql: buildDbtMaterializationSql(dataset, materialization),
  };
}
