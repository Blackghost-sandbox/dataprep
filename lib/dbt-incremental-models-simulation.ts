export type DbtIncrementalDatasetId = "ecommerce" | "subscriptions" | "support";

export type DbtIncrementalRow = {
  order_id: string;
  customer_id: string;
  order_date: string;
  amount: string;
  updated_at: string;
};

export type DbtIncrementalDataset = {
  id: DbtIncrementalDatasetId;
  label: string;
  modelName: string;
  sourceName: string;
  uniqueKey: "order_id";
  existing: DbtIncrementalRow[];
  incoming: DbtIncrementalRow[];
};

export type DbtIncrementalMergeStatus = "unchanged" | "updated" | "inserted";

export type DbtIncrementalMergedRow = DbtIncrementalRow & {
  status: DbtIncrementalMergeStatus;
};

export type DbtIncrementalRunResult = {
  rows: DbtIncrementalMergedRow[];
  processedRows: number;
  updatedRows: number;
  insertedRows: number;
  unchangedRows: number;
  terminal: string[];
};

export const dbtIncrementalDatasets: DbtIncrementalDataset[] = [
  {
    id: "ecommerce",
    label: "E-commerce Orders (Sample)",
    modelName: "fct_orders",
    sourceName: "raw_orders",
    uniqueKey: "order_id",
    existing: [
      {order_id:"1001",customer_id:"C001",order_date:"2024-01-01",amount:"120.50",updated_at:"2024-01-01T08:10:00Z"},
      {order_id:"1002",customer_id:"C002",order_date:"2024-01-02",amount:"75.20",updated_at:"2024-01-02T09:15:00Z"},
      {order_id:"1003",customer_id:"C003",order_date:"2024-01-03",amount:"65.00",updated_at:"2024-01-03T11:05:00Z"},
    ],
    incoming: [
      {order_id:"1004",customer_id:"C004",order_date:"2024-01-04",amount:"310.00",updated_at:"2024-01-04T12:20:00Z"},
      {order_id:"1002",customer_id:"C002",order_date:"2024-01-02",amount:"80.00",updated_at:"2024-01-04T13:10:00Z"},
      {order_id:"1005",customer_id:"C005",order_date:"2024-01-05",amount:"220.00",updated_at:"2024-01-05T08:45:00Z"},
    ],
  },
  {
    id: "subscriptions",
    label: "Subscription Revenue",
    modelName: "fct_subscriptions",
    sourceName: "raw_subscriptions",
    uniqueKey: "order_id",
    existing: [
      {order_id:"SUB301",customer_id:"C011",order_date:"2024-02-01",amount:"49.00",updated_at:"2024-02-01T08:00:00Z"},
      {order_id:"SUB302",customer_id:"C022",order_date:"2024-02-02",amount:"29.00",updated_at:"2024-02-02T08:00:00Z"},
      {order_id:"SUB303",customer_id:"C031",order_date:"2024-02-03",amount:"99.00",updated_at:"2024-02-03T08:00:00Z"},
    ],
    incoming: [
      {order_id:"SUB302",customer_id:"C022",order_date:"2024-02-02",amount:"39.00",updated_at:"2024-02-05T09:00:00Z"},
      {order_id:"SUB304",customer_id:"C045",order_date:"2024-02-05",amount:"49.00",updated_at:"2024-02-05T09:30:00Z"},
      {order_id:"SUB305",customer_id:"C052",order_date:"2024-02-06",amount:"79.00",updated_at:"2024-02-06T10:00:00Z"},
    ],
  },
  {
    id: "support",
    label: "Support Operations",
    modelName: "fct_support_activity",
    sourceName: "raw_support_activity",
    uniqueKey: "order_id",
    existing: [
      {order_id:"TK901",customer_id:"C101",order_date:"2024-03-01",amount:"14.20",updated_at:"2024-03-01T07:00:00Z"},
      {order_id:"TK902",customer_id:"C118",order_date:"2024-03-01",amount:"21.40",updated_at:"2024-03-01T08:00:00Z"},
      {order_id:"TK903",customer_id:"C144",order_date:"2024-03-02",amount:"11.80",updated_at:"2024-03-02T08:30:00Z"},
    ],
    incoming: [
      {order_id:"TK902",customer_id:"C118",order_date:"2024-03-01",amount:"24.90",updated_at:"2024-03-03T08:00:00Z"},
      {order_id:"TK904",customer_id:"C156",order_date:"2024-03-03",amount:"32.10",updated_at:"2024-03-03T09:00:00Z"},
      {order_id:"TK905",customer_id:"C171",order_date:"2024-03-03",amount:"18.60",updated_at:"2024-03-03T09:30:00Z"},
    ],
  },
];

export function getDbtIncrementalDataset(id: DbtIncrementalDatasetId): DbtIncrementalDataset {
  return dbtIncrementalDatasets.find(dataset=>dataset.id===id) ?? dbtIncrementalDatasets[0];
}

export function cloneIncrementalRows(rows: DbtIncrementalRow[]): DbtIncrementalRow[] {
  return rows.map(row=>({...row}));
}

function sameBusinessValues(a: DbtIncrementalRow,b: DbtIncrementalRow): boolean {
  return a.customer_id===b.customer_id &&
    a.order_date===b.order_date &&
    a.amount===b.amount &&
    a.updated_at===b.updated_at;
}

export function runDbtIncrementalMerge(
  dataset: DbtIncrementalDataset,
  incomingRows: DbtIncrementalRow[],
): DbtIncrementalRunResult {
  const byKey = new Map<string, DbtIncrementalMergedRow>(dataset.existing.map(row=>[row.order_id,{...row,status:"unchanged" as const}]));
  let updatedRows=0;
  let insertedRows=0;

  for(const incoming of incomingRows){
    const previous=byKey.get(incoming.order_id);
    if(previous){
      if(!sameBusinessValues(previous,incoming)){
        byKey.set(incoming.order_id,{...incoming,status:"updated"});
        updatedRows++;
      }
    } else {
      byKey.set(incoming.order_id,{...incoming,status:"inserted"});
      insertedRows++;
    }
  }

  const rows=[...byKey.values()].sort((a,b)=>a.order_id.localeCompare(b.order_id));
  const processedRows=updatedRows+insertedRows;
  const unchangedRows=rows.filter(row=>row.status==="unchanged").length;
  const terminal=[
    "$ dbt run --select "+dataset.modelName,
    "Running with dbt=1.7.0",
    "Found 1 model, 0 tests",
    "[1/1] run incremental model "+dataset.modelName+" ... PASS",
    "Processed "+processedRows+" new/changed row"+(processedRows===1?"":"s"),
    "  - "+updatedRows+" updated row"+(updatedRows===1?"":"s")+" (matched by "+dataset.uniqueKey+")",
    "  - "+insertedRows+" inserted row"+(insertedRows===1?"":"s"),
    "Completed successfully in 2.4s",
  ];
  return {rows,processedRows,updatedRows,insertedRows,unchangedRows,terminal};
}

export function buildIncrementalSql(dataset: DbtIncrementalDataset): string {
  return [
    "{{ config(materialized='incremental', unique_key='order_id') }}",
    "",
    "select",
    "    order_id,",
    "    customer_id,",
    "    order_date,",
    "    amount,",
    "    updated_at",
    "from {{ ref('"+dataset.sourceName+"') }}",
    "{% if is_incremental() %}",
    "where updated_at >= (",
    "  select max(updated_at) - interval '1 day'",
    "  from {{ this }}",
    ")",
    "{% endif %}",
  ].join("\n");
}

export function getChangeType(
  existingRows: DbtIncrementalRow[],
  row: DbtIncrementalRow,
): "update" | "insert" | "no-change" {
  const previous=existingRows.find(existing=>existing.order_id===row.order_id);
  if(!previous)return "insert";
  return sameBusinessValues(previous,row)?"no-change":"update";
}
