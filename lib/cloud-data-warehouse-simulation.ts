export type WarehouseProviderId = "snowflake" | "redshift" | "bigquery" | "synapse";
export type WarehouseSourceId = "sales-csv" | "orders-parquet" | "events-json";
export type WarehouseSize = "X-Small (1 credit)" | "Small (2 credits)" | "Medium (4 credits)" | "Large (8 credits)";

export type WarehouseControls = {
  provider: WarehouseProviderId;
  source: WarehouseSourceId;
  table: string;
  rowsToLoad: number;
  warehouseSize: WarehouseSize;
  autoScaling: boolean;
  maxClusters: number;
};

export type WarehouseResultRow = {
  region: string;
  month: string;
  totalOrders: number;
  totalRevenue: number;
};

export type WarehouseMetrics = {
  queryTimeSeconds: number;
  dataScannedMb: number;
  computeUnits: number;
};

export type WarehouseLog = {
  id: string;
  time: string;
  text: string;
  tone: "muted" | "info" | "success" | "accent";
};

export type WarehouseSimulationState = {
  loaded: boolean;
  queried: boolean;
  results: WarehouseResultRow[];
  metrics: WarehouseMetrics;
  logs: WarehouseLog[];
  status: string;
};

export const warehouseProviders = {
  snowflake:{
    label:"Snowflake",
    short:"Snowflake",
    computeName:"Virtual warehouse",
    storageName:"Cloud object storage",
    computeMetric:"Warehouse Credits",
    baseQuerySeconds:2.4,
    scanFactor:1,
  },
  redshift:{
    label:"Amazon Redshift",
    short:"Redshift",
    computeName:"RA3 / Serverless compute",
    storageName:"Managed storage / S3",
    computeMetric:"Compute Units",
    baseQuerySeconds:2.8,
    scanFactor:1.04,
  },
  bigquery:{
    label:"Google BigQuery",
    short:"BigQuery",
    computeName:"Slots / serverless compute",
    storageName:"BigQuery managed storage",
    computeMetric:"Slot Units",
    baseQuerySeconds:2.1,
    scanFactor:.96,
  },
  synapse:{
    label:"Azure Synapse",
    short:"Azure Synapse",
    computeName:"SQL pool",
    storageName:"Managed storage / ADLS",
    computeMetric:"Warehouse Credits",
    baseQuerySeconds:2.7,
    scanFactor:1.02,
  },
} satisfies Record<WarehouseProviderId,{
  label:string;short:string;computeName:string;storageName:string;computeMetric:string;
  baseQuerySeconds:number;scanFactor:number;
}>;

export const warehouseSources = {
  "sales-csv":{label:"Sales Data (CSV)",table:"sales_raw",kind:"CSV"},
  "orders-parquet":{label:"Orders (Parquet)",table:"orders_raw",kind:"Parquet"},
  "events-json":{label:"Events (JSON)",table:"events_raw",kind:"JSON"},
} satisfies Record<WarehouseSourceId,{label:string;table:string;kind:string}>;

export const warehouseSizes = {
  "X-Small (1 credit)":1,
  "Small (2 credits)":2,
  "Medium (4 credits)":4,
  "Large (8 credits)":8,
} satisfies Record<WarehouseSize,number>;

export const warehouseQuery = `SELECT
  region,
  DATE_TRUNC('month', order_date) AS month,
  COUNT(*) AS total_orders,
  SUM(amount) AS total_revenue
FROM sales_raw
WHERE order_date >= '2026-10-01'
GROUP BY 1, 2
ORDER BY 2, 1;`;

const referenceRows:WarehouseResultRow[] = [
  {region:"US",month:"2026-10",totalOrders:12450,totalRevenue:1250340},
  {region:"US",month:"2026-11",totalOrders:14230,totalRevenue:1480210},
  {region:"EU",month:"2026-10",totalOrders:8320,totalRevenue:920110},
  {region:"EU",month:"2026-11",totalOrders:9871,totalRevenue:1120550},
  {region:"APAC",month:"2026-10",totalOrders:6540,totalRevenue:680420},
];

export function defaultWarehouseControls():WarehouseControls{
  return {
    provider:"snowflake",
    source:"sales-csv",
    table:"sales_raw",
    rowsToLoad:1_000_000,
    warehouseSize:"Medium (4 credits)",
    autoScaling:true,
    maxClusters:2,
  };
}

function log(index:number,text:string,tone:WarehouseLog["tone"]="muted"):WarehouseLog{
  const times=["10:24:01","10:24:07","10:24:08","10:24:10","10:24:12","10:24:14","10:24:14","10:24:14"];
  return {id:`${index}-${text.slice(0,16)}`,time:times[index] ?? "10:24:15",text,tone};
}

export function computeWarehouseMetrics(controls:WarehouseControls):WarehouseMetrics{
  const provider=warehouseProviders[controls.provider];
  const credits=warehouseSizes[controls.warehouseSize];
  const rowFactor=Math.max(.1,controls.rowsToLoad/1_000_000);
  const sizeSpeed=Math.sqrt(4/credits);
  const concurrencyBoost=controls.autoScaling?Math.min(1,1/Math.sqrt(Math.max(1,controls.maxClusters)/2)):1.16;
  return {
    queryTimeSeconds:Math.round(provider.baseQuerySeconds*rowFactor*.99*sizeSpeed*concurrencyBoost*10)/10,
    dataScannedMb:Math.round(124*rowFactor*provider.scanFactor),
    computeUnits:credits,
  };
}

export function warehouseResults(controls:WarehouseControls):WarehouseResultRow[]{
  const factor=Math.max(.1,controls.rowsToLoad/1_000_000);
  return referenceRows.map(row=>({
    ...row,
    totalOrders:Math.max(1,Math.round(row.totalOrders*factor)),
    totalRevenue:Math.round(row.totalRevenue*factor),
  }));
}

export function referenceWarehouseState():WarehouseSimulationState{
  const controls=defaultWarehouseControls();
  return {
    loaded:true,
    queried:true,
    results:warehouseResults(controls),
    metrics:{queryTimeSeconds:2.4,dataScannedMb:124,computeUnits:4},
    logs:[
      log(0,"Loading 1,000,000 rows into sales_raw...","muted"),
      log(1,"Load completed successfully ✓","success"),
      log(2,"Spinning up warehouse (Medium)...","info"),
      log(3,"Warehouse ready (4 credits)","accent"),
      log(4,"Executing query...","muted"),
      log(5,"Scanning 124 MB of data...","info"),
      log(6,"Query completed in 2.4 seconds ✓","success"),
      log(7,"Returned 5 rows","success"),
    ],
    status:"Warehouse simulation ready with the reference query result.",
  };
}

export function simulateWarehouse(controls:WarehouseControls):WarehouseSimulationState{
  const provider=warehouseProviders[controls.provider];
  const metrics=computeWarehouseMetrics(controls);
  const results=warehouseResults(controls);
  const size=controls.warehouseSize.replace(/ \(.+\)$/,"");
  return {
    loaded:true,
    queried:true,
    results,
    metrics,
    logs:[
      log(0,`Loading ${controls.rowsToLoad.toLocaleString("en-US")} rows into ${controls.table}...`,"muted"),
      log(1,"Load completed successfully ✓","success"),
      log(2,`Spinning up ${provider.short} compute (${size})...`,"info"),
      log(3,`Warehouse ready (${metrics.computeUnits} credits)`,"accent"),
      log(4,"Executing analytical query...","muted"),
      log(5,`Scanning ${metrics.dataScannedMb} MB of data...`,"info"),
      log(6,`Query completed in ${metrics.queryTimeSeconds.toFixed(1)} seconds ✓`,"success"),
      log(7,`Returned ${results.length} rows`,"success"),
    ],
    status:`${provider.label} completed the analytical query using independently scalable compute.`,
  };
}

export function loadWarehouseOnly(controls:WarehouseControls):WarehouseSimulationState{
  const metrics=computeWarehouseMetrics(controls);
  return {
    loaded:true,
    queried:false,
    results:[],
    metrics,
    logs:[
      log(0,`Loading ${controls.rowsToLoad.toLocaleString("en-US")} rows into ${controls.table}...`,"muted"),
      log(1,"Load completed successfully ✓","success"),
    ],
    status:"Data loaded. Configure compute and run the analytical query.",
  };
}
