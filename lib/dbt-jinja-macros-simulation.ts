export type DbtJinjaDatasetId = "ecommerce" | "subscriptions" | "support";

export type DbtJinjaRow = {
  order_id: string;
  customer_id: string;
  order_date: string;
  total_amount: string;
  region: string;
};

export type DbtJinjaDataset = {
  id: DbtJinjaDatasetId;
  label: string;
  relation: string;
  rows: DbtJinjaRow[];
};

function generatedRows(prefix:string,count:number,month:number,startDay:number): DbtJinjaRow[] {
  return Array.from({length:count},(_,index)=>{
    const date=new Date(Date.UTC(2024,month-1,startDay+(index%20)));
    return {
      order_id:prefix+String(index+1).padStart(4,"0"),
      customer_id:"C"+String(100+index).padStart(3,"0"),
      order_date:date.toISOString().slice(0,10),
      total_amount:(35+(index%17)*11.25).toFixed(2),
      region:index%4===0?"CA":"US",
    };
  });
}

export const dbtJinjaDatasets: DbtJinjaDataset[] = [
  {
    id: "ecommerce",
    label: "E-commerce Orders (Sample)",
    relation: "analytics.orders",
    rows: [
      {order_id:"1001",customer_id:"C001",order_date:"2024-01-02",total_amount:"120.50",region:"US"},
      {order_id:"1002",customer_id:"C004",order_date:"2024-01-03",total_amount:"75.20",region:"US"},
      {order_id:"1003",customer_id:"C002",order_date:"2024-01-04",total_amount:"310.00",region:"CA"},
      {order_id:"1004",customer_id:"C001",order_date:"2024-01-05",total_amount:"45.99",region:"US"},
      {order_id:"1005",customer_id:"C010",order_date:"2024-01-06",total_amount:"220.00",region:"US"},
    ].concat(generatedRows("2",120,1,7)),
  },
  {
    id: "subscriptions",
    label: "Subscription Revenue",
    relation: "analytics.subscriptions",
    rows: [
      {order_id:"SUB301",customer_id:"C011",order_date:"2024-02-03",total_amount:"49.00",region:"US"},
      {order_id:"SUB302",customer_id:"C022",order_date:"2024-02-05",total_amount:"29.00",region:"EU"},
      {order_id:"SUB303",customer_id:"C031",order_date:"2024-02-06",total_amount:"99.00",region:"US"},
      {order_id:"SUB304",customer_id:"C045",order_date:"2024-02-08",total_amount:"49.00",region:"US"},
      {order_id:"SUB305",customer_id:"C052",order_date:"2024-02-09",total_amount:"79.00",region:"EU"},
    ].concat(generatedRows("S",75,2,10)),
  },
  {
    id: "support",
    label: "Support Operations",
    relation: "analytics.support_activity",
    rows: [
      {order_id:"TK901",customer_id:"C101",order_date:"2024-03-01",total_amount:"14.20",region:"US"},
      {order_id:"TK902",customer_id:"C118",order_date:"2024-03-01",total_amount:"21.40",region:"US"},
      {order_id:"TK903",customer_id:"C144",order_date:"2024-03-02",total_amount:"11.80",region:"EU"},
      {order_id:"TK904",customer_id:"C156",order_date:"2024-03-02",total_amount:"32.10",region:"US"},
      {order_id:"TK905",customer_id:"C171",order_date:"2024-03-03",total_amount:"18.60",region:"US"},
    ].concat(generatedRows("T",95,3,5)),
  },
];

export function getDbtJinjaDataset(id: DbtJinjaDatasetId): DbtJinjaDataset {
  return dbtJinjaDatasets.find(dataset=>dataset.id===id) ?? dbtJinjaDatasets[0];
}

export const defaultJinjaModel = [
  "-- Using a variable and a macro",
  "{% set start_date = var('start_date', '2024-01-01') %}",
  "",
  "select",
  "    order_id,",
  "    customer_id,",
  "    order_date,",
  "    total_amount",
  "from {{ ref('raw_orders') }}",
  "where order_date >= '{{ start_date }}'",
  "{% if is_incremental() %}",
  "  and _loaded_at > (select max(_loaded_at)",
  "                    from {{ this }})",
  "{% endif %}",
].join("\n");

export const defaultProjectVars = [
  "vars:",
  "  start_date: '2024-01-01'",
  "  region: 'US'",
].join("\n");

export const defaultMacro = [
  "{% macro date_filter(column, days_back=7) %}",
  "  {{ column }} >= dateadd(day, -{{ days_back }},",
  "      current_date)",
  "{% endmacro %}",
].join("\n");

export type DbtJinjaCompileResult = {
  compiledSql: string;
  startDate: string;
  region: string;
  usedMacro: boolean;
  macroDaysBack: number;
  rowCount: number;
  rows: DbtJinjaRow[];
};

function findQuotedValue(text: string, key: string, fallback: string): string {
  const patterns = [
    new RegExp(key+"\\s*:\\s*['\"]([^'\"]+)['\"]", "i"),
    new RegExp("var\\(\\s*['\"]"+key+"['\"]\\s*,\\s*['\"]([^'\"]+)['\"]\\s*\\)", "i"),
  ];
  for (const pattern of patterns) {
    const match=text.match(pattern);
    if(match?.[1]) return match[1];
  }
  return fallback;
}

function macroDays(macro: string): number {
  const match=macro.match(/days_back\s*=\s*(\d+)/);
  return match ? Number(match[1]) : 7;
}

export function compileDbtJinja({
  model,
  vars,
  macro,
  dataset,
}:{
  model:string;
  vars:string;
  macro:string;
  dataset:DbtJinjaDataset;
}): DbtJinjaCompileResult {
  const startDate=findQuotedValue(vars,"start_date",findQuotedValue(model,"start_date","2024-01-01"));
  const region=findQuotedValue(vars,"region","US");
  const daysBack=macroDays(macro);
  let sql=model;

  sql=sql.replace(/\{%\s*set\s+start_date\s*=\s*var\([^%]+%\}\s*/g,"");
  sql=sql.replace(/\{\{\s*ref\(\s*['\"]raw_orders['\"]\s*\)\s*\}\}/g,dataset.relation);
  sql=sql.replace(/\{\{\s*start_date\s*\}\}/g,startDate);
  sql=sql.replace(/\{%\s*if\s+is_incremental\(\)\s*%\}[\s\S]*?\{%\s*endif\s*%\}/g,"");
  sql=sql.replace(/\{\{\s*var\(\s*['\"]region['\"](?:\s*,\s*['\"][^'\"]+['\"])?\s*\)\s*\}\}/g,region);

  const macroCall=/\{\{\s*date_filter\(\s*['\"]([^'\"]+)['\"](?:\s*,\s*(\d+))?\s*\)\s*\}\}/g;
  let usedMacro=false;
  sql=sql.replace(macroCall,(_,column:string,days:string|undefined)=>{
    usedMacro=true;
    return column+" >= dateadd(day, -"+(days?Number(days):daysBack)+", current_date)";
  });

  sql=sql.replace(/\n{3,}/g,"\n\n").trim();

  const dateMatch=sql.match(/order_date\s*>=\s*['\"](\d{4}-\d{2}-\d{2})['\"]/i);
  const regionMatch=sql.match(/region\s*=\s*['\"]([^'\"]+)['\"]/i);
  const effectiveStartDate=dateMatch?.[1] ?? "";
  const effectiveRegion=regionMatch?.[1] ?? "";
  const rows=dataset.rows.filter(row=>{
    const dateOk=!effectiveStartDate || row.order_date>=effectiveStartDate;
    const regionOk=!effectiveRegion || row.region===effectiveRegion;
    return dateOk && regionOk;
  });
  return {
    compiledSql:sql,
    startDate,
    region,
    usedMacro,
    macroDaysBack:daysBack,
    rowCount:rows.length,
    rows,
  };
}

export function previewCompiledSql(result: DbtJinjaCompileResult): string {
  const lines=result.compiledSql.split("\n").map(line=>line.trim()).filter(Boolean);
  const from=lines.find(line=>line.startsWith("from ")) ?? "from analytics.orders";
  const where=lines.find(line=>line.startsWith("where ")) ?? "where order_date >= '"+result.startDate+"'";
  return ["select *",from,where].join("\n");
}

export function buildJinjaRunLog(result: DbtJinjaCompileResult, dataset: DbtJinjaDataset): string[] {
  return [
    "Parsing dbt project...",
    "Loaded vars: start_date="+result.startDate+", region="+result.region,
    "Rendering Jinja template...",
    result.usedMacro ? "Expanded date_filter macro (days_back="+result.macroDaysBack+")" : "No macro invocation in model",
    "Compiled SQL for "+dataset.relation,
    "Warehouse returned "+result.rowCount+" row"+(result.rowCount===1?"":"s"),
  ];
}
