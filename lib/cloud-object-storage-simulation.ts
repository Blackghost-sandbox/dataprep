export type ObjectStorageProviderId = "aws" | "gcp" | "azure";
export type ObjectStorageDataSourceId = "ecommerce" | "clickstream" | "crm";
export type ObjectStorageFormatId = "json" | "csv" | "parquet";
export type QueryEngineId = "athena" | "bigquery" | "synapse";

export type ObjectStorageSimulationState = {
  generated: boolean;
  uploaded: boolean;
  partitioned: boolean;
  queried: boolean;
  running: boolean;
  logs: Array<{id:string;time:string;text:string;tone:"muted"|"info"|"success"|"accent"}>;
  status: string;
};

export const objectStorageProviders = {
  aws: {
    label:"AWS S3",
    short:"AWS",
    service:"Amazon S3",
    bucketLabel:"Bucket",
    uriPrefix:"s3://",
    storageClasses:["Standard","Intelligent-Tiering","Glacier Instant Retrieval"],
    defaultStorageClass:"Standard",
    queryEngine:"athena" as QueryEngineId,
  },
  gcp: {
    label:"Google Cloud Storage",
    short:"GCP",
    service:"Google Cloud Storage",
    bucketLabel:"Bucket",
    uriPrefix:"gs://",
    storageClasses:["Standard","Nearline","Archive"],
    defaultStorageClass:"Standard",
    queryEngine:"bigquery" as QueryEngineId,
  },
  azure: {
    label:"Azure Blob / ADLS",
    short:"Azure",
    service:"Azure Data Lake Storage",
    bucketLabel:"Container",
    uriPrefix:"abfss://",
    storageClasses:["Hot","Cool","Archive"],
    defaultStorageClass:"Hot",
    queryEngine:"synapse" as QueryEngineId,
  },
} satisfies Record<ObjectStorageProviderId,{
  label:string;short:string;service:string;bucketLabel:string;uriPrefix:string;
  storageClasses:string[];defaultStorageClass:string;queryEngine:QueryEngineId;
}>;

export const objectStorageDataSources = {
  ecommerce:{label:"E-commerce App",folder:"ecommerce",table:"ecommerce_orders",recordLabel:"orders"},
  clickstream:{label:"Clickstream Logs",folder:"clickstream",table:"clickstream_events",recordLabel:"events"},
  crm:{label:"Customer CRM",folder:"crm",table:"customer_records",recordLabel:"customers"},
} satisfies Record<ObjectStorageDataSourceId,{label:string;folder:string;table:string;recordLabel:string}>;

export const objectStorageFormats = {
  json:{label:"JSON",extension:"json",mime:"application/json"},
  csv:{label:"CSV",extension:"csv",mime:"text/csv"},
  parquet:{label:"Parquet",extension:"parquet",mime:"application/octet-stream"},
} satisfies Record<ObjectStorageFormatId,{label:string;extension:string;mime:string}>;

export const queryEngines = {
  athena:{label:"Athena",provider:"aws" as ObjectStorageProviderId},
  bigquery:{label:"BigQuery",provider:"gcp" as ObjectStorageProviderId},
  synapse:{label:"Synapse",provider:"azure" as ObjectStorageProviderId},
};

const baseTime = 10*60*60+24*60+1;
function clock(index:number){
  const total=baseTime+index*2;
  const h=Math.floor(total/3600)%24;
  const m=Math.floor((total%3600)/60);
  const s=total%60;
  return [h,m,s].map(n=>String(n).padStart(2,"0")).join(":");
}
function log(id:number,text:string,tone:ObjectStorageSimulationState["logs"][number]["tone"]="muted"){
  return {id:String(id)+"-"+text.slice(0,14),time:clock(id),text,tone};
}

export function newObjectStorageSimulationState():ObjectStorageSimulationState{
  return {
    generated:false,uploaded:false,partitioned:false,queried:false,running:false,
    logs:[log(0,"Ready. Configure the lake and run the simulation.","muted")],
    status:"Ready to generate sample data.",
  };
}

export function objectStoragePath({
  dataSource,partitionByDate,pathPrefix,
}:{
  dataSource:ObjectStorageDataSourceId;partitionByDate:boolean;pathPrefix:string;
}){
  const source=objectStorageDataSources[dataSource];
  const clean=pathPrefix.replace(/^\/+|\/+$/g,"") || `raw/${source.folder}`;
  if(!partitionByDate)return `${clean}/`;
  return `${clean}/year=2026/month=10/day=02/`;
}

export function objectStorageFiles({
  dataSource,format,partitionByDate,pathPrefix,count=3,
}:{
  dataSource:ObjectStorageDataSourceId;format:ObjectStorageFormatId;
  partitionByDate:boolean;pathPrefix:string;count?:number;
}){
  const source=objectStorageDataSources[dataSource];
  const extension=objectStorageFormats[format].extension;
  const path=objectStoragePath({dataSource,partitionByDate,pathPrefix});
  return Array.from({length:count},(_,index)=>({
    name:`${source.recordLabel}_${String(index+1).padStart(4,"0")}.${extension}`,
    path,
  }));
}

export function objectStorageQuery(dataSource:ObjectStorageDataSourceId){
  const table=objectStorageDataSources[dataSource].table;
  return `SELECT\n  date,\n  COUNT(*) AS total_orders,\n  SUM(amount) AS total_revenue\nFROM raw.${table}\nWHERE date = '2026-10-02'\nGROUP BY date;`;
}

export function objectStorageResult(volumeMb:number,dataSource:ObjectStorageDataSourceId){
  const multiplier=dataSource==="ecommerce"?10:dataSource==="clickstream"?64:4;
  const rows=Math.max(100,Math.round(volumeMb*multiplier));
  const revenue=dataSource==="ecommerce" ? rows*125.4305 : dataSource==="crm" ? rows*82.75 : 0;
  return {
    date:"2026-10-02",
    total_orders:rows,
    total_revenue:revenue,
  };
}

export function runObjectStorageSimulation({
  provider,dataSource,format,volumeMb,partitionByDate,pathPrefix,bucket,
}:{
  provider:ObjectStorageProviderId;dataSource:ObjectStorageDataSourceId;format:ObjectStorageFormatId;
  volumeMb:number;partitionByDate:boolean;pathPrefix:string;bucket:string;
}):ObjectStorageSimulationState{
  const p=objectStorageProviders[provider];
  const source=objectStorageDataSources[dataSource];
  const path=objectStoragePath({dataSource,partitionByDate,pathPrefix});
  const records=objectStorageResult(volumeMb,dataSource).total_orders;
  return {
    generated:true,uploaded:true,partitioned:partitionByDate,queried:true,running:false,
    logs:[
      log(0,`Generating sample ${source.folder} data...`,"muted"),
      log(1,`Created ${records.toLocaleString("en-US")} records (${volumeMb} MB)`,"info"),
      log(2,`Uploading to ${p.uriPrefix}${bucket}/${path}...`,"accent"),
      log(3,partitionByDate?`Partitioned path: ${path}`:"Partitioning disabled; objects stored under source prefix","accent"),
      log(4,`Objects created: 3 ${objectStorageFormats[format].label} files`,"info"),
      log(5,`Running ${queryEngines[p.queryEngine].label} query...`,"muted"),
      log(6,"Query completed successfully ✓","success"),
      log(7,"Returned 1 row","success"),
    ],
    status:`${p.service} pipeline completed successfully.`,
  };
}

export function generateObjectStorageData({
  dataSource,format,volumeMb,
}:{
  dataSource:ObjectStorageDataSourceId;format:ObjectStorageFormatId;volumeMb:number;
}):ObjectStorageSimulationState{
  const source=objectStorageDataSources[dataSource];
  const rows=objectStorageResult(volumeMb,dataSource).total_orders;
  return {
    generated:true,uploaded:false,partitioned:false,queried:false,running:false,
    logs:[
      log(0,`Generating sample ${source.folder} data...`,"muted"),
      log(1,`Created ${rows.toLocaleString("en-US")} records (${volumeMb} MB)`,"info"),
      log(2,`Prepared 3 ${objectStorageFormats[format].label} files for upload`,"success"),
    ],
    status:"Sample data generated. Run the simulation to upload, partition and query it.",
  };
}
