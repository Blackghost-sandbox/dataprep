export type TableFormatId = "delta" | "iceberg" | "hudi";
export type LakehouseOperationId = "create-table" | "append" | "schema-evolution" | "time-travel" | "acid";
export type LakehouseFile = {id:string;name:string;sizeMb:number;type:"CSV"|"Parquet"|"JSON";status:"ready"|"added"};
export type LakehouseResultRow = {date:string;product:string;totalSales:number;numOrders:number};

export type LakehouseSimulationState = {
  files: LakehouseFile[];
  operations: Record<LakehouseOperationId,boolean>;
  queried:boolean;
  queryTimeSeconds:number;
  results:LakehouseResultRow[];
  status:string;
  logs:Array<{id:string;text:string;tone:"muted"|"success"|"info"|"accent"}>;
};

export const tableFormats = {
  delta:{
    label:"Delta Lake",
    short:"Delta Lake",
    provider:"Databricks / Linux Foundation",
    bestFor:"General Purpose",
    supportsStreaming:true,
    icon:"△",
  },
  iceberg:{
    label:"Apache Iceberg",
    short:"Apache Iceberg",
    provider:"Apache Software Foundation",
    bestFor:"Large Scale Analytics",
    supportsStreaming:true,
    icon:"◉",
  },
  hudi:{
    label:"Apache Hudi",
    short:"Apache Hudi",
    provider:"Apache Software Foundation",
    bestFor:"Incremental Pipelines",
    supportsStreaming:true,
    icon:"◒",
  },
} satisfies Record<TableFormatId,{
  label:string;short:string;provider:string;bestFor:string;supportsStreaming:boolean;icon:string;
}>;

export const lakehouseQuery=`SELECT
  date,
  product,
  SUM(amount) AS total_sales,
  COUNT(*) AS num_orders
FROM sales
WHERE date >= '2026-10-01'
GROUP BY date, product
ORDER BY date, product;`;

const referenceResults:LakehouseResultRow[]=[
  {date:"2026-10-01",product:"Laptop",totalSales:125430,numOrders:1230},
  {date:"2026-10-01",product:"Phone",totalSales:98210,numOrders:2134},
  {date:"2026-10-02",product:"Laptop",totalSales:142330,numOrders:1521},
  {date:"2026-10-02",product:"Tablet",totalSales:76880,numOrders:1002},
  {date:"2026-10-03",product:"Phone",totalSales:113450,numOrders:1876},
];

export function defaultLakehouseFiles():LakehouseFile[]{
  return [
    {id:"sales-2026-10",name:"sales_2026_10.csv",sizeMb:120,type:"CSV",status:"ready"},
    {id:"sales-2026-11",name:"sales_2026_11.csv",sizeMb:95,type:"CSV",status:"ready"},
  ];
}

export function defaultLakehouseOperations():Record<LakehouseOperationId,boolean>{
  return {
    "create-table":true,
    "append":true,
    "schema-evolution":true,
    "time-travel":true,
    "acid":true,
  };
}

export function referenceLakehouseState():LakehouseSimulationState{
  return {
    files:defaultLakehouseFiles(),
    operations:defaultLakehouseOperations(),
    queried:true,
    queryTimeSeconds:1.8,
    results:referenceResults,
    status:"Query completed in 1.8 seconds using Delta Lake table metadata.",
    logs:[
      {id:"1",text:"Registered raw objects in object storage.",tone:"info"},
      {id:"2",text:"Created transactional table metadata.",tone:"success"},
      {id:"3",text:"Appended sales_2026_10.csv and sales_2026_11.csv.",tone:"success"},
      {id:"4",text:"Schema evolution enabled.",tone:"accent"},
      {id:"5",text:"Snapshot committed successfully.",tone:"success"},
      {id:"6",text:"Consistent table read completed.",tone:"success"},
    ],
  };
}

export function addSampleLakehouseFile(files:LakehouseFile[],index:number):LakehouseFile[]{
  const candidates:LakehouseFile[]=[
    {id:"sales-2026-12",name:"sales_2026_12.parquet",sizeMb:88,type:"Parquet",status:"added"},
    {id:"returns-2026-10",name:"returns_2026_10.json",sizeMb:32,type:"JSON",status:"added"},
    {id:"products",name:"products.parquet",sizeMb:18,type:"Parquet",status:"added"},
  ];
  const candidate=candidates[index%candidates.length];
  return files.some(file=>file.id===candidate.id)?files:[...files,candidate];
}

export function uploadedFileToLakehouseFile(name:string,sizeBytes:number,index:number):LakehouseFile{
  const lower=name.toLowerCase();
  const type:LakehouseFile["type"]=lower.endsWith(".parquet")?"Parquet":lower.endsWith(".json")?"JSON":"CSV";
  return {id:`upload-${index}-${name}`,name,sizeMb:Math.max(1,Math.round(sizeBytes/1024/1024)),type,status:"added"};
}

export function simulateLakehouse({
  format,
  files,
  operations,
}:{
  format:TableFormatId;
  files:LakehouseFile[];
  operations:Record<LakehouseOperationId,boolean>;
}):LakehouseSimulationState{
  const meta=tableFormats[format];
  const base=1.8;
  const fileFactor=Math.max(.82,Math.min(1.35,files.length/2));
  const operationPenalty=operations["schema-evolution"]?.04:0;
  const queryTime=Math.round((base*fileFactor+operationPenalty)*10)/10;
  const factor=Math.max(.7,Math.min(1.6,files.reduce((sum,file)=>sum+file.sizeMb,0)/215));
  const results=referenceResults.map(row=>({
    ...row,
    totalSales:Math.round(row.totalSales*factor),
    numOrders:Math.max(1,Math.round(row.numOrders*factor)),
  }));
  return {
    files,
    operations,
    queried:true,
    queryTimeSeconds:queryTime,
    results,
    status:`Query completed in ${queryTime.toFixed(1)} seconds using ${meta.label} table metadata.`,
    logs:[
      {id:"1",text:`Loaded ${files.length} objects from object storage.`,tone:"info"},
      {id:"2",text:`Created ${meta.label} table metadata.`,tone:"success"},
      {id:"3",text:operations["append"]?"Appended new data transactionally.":"Append step skipped.",tone:operations["append"]?"success":"muted"},
      {id:"4",text:operations["schema-evolution"]?"Schema evolution enabled.":"Schema evolution disabled.",tone:"accent"},
      {id:"5",text:operations["time-travel"]?"Versioned snapshot committed.":"Time travel disabled for this run.",tone:"info"},
      {id:"6",text:"Consistent table read completed.",tone:"success"},
    ],
  };
}

export function tableFormatFeatures(){
  return [
    {feature:"ACID Transactions",delta:true,iceberg:true,hudi:true},
    {feature:"Schema Evolution",delta:true,iceberg:true,hudi:true},
    {feature:"Time Travel",delta:true,iceberg:true,hudi:true},
    {feature:"Upserts / Merge",delta:true,iceberg:true,hudi:true},
    {feature:"Streaming Support",delta:true,iceberg:true,hudi:true},
  ];
}
