export type SparkScenarioId = "daily-sales" | "clickstream" | "customer360" | "inventory";
export type SparkDataSourceId = "s3" | "gcs" | "adls";
export type SparkFileFormat = "Parquet" | "JSON" | "CSV";
export type SparkClusterType = "Serverless (EMR Serverless)" | "Ephemeral Job Cluster" | "Long-lived Cluster";
export type SparkWorkerType = "Standard (4 vCPU, 16 GB)" | "Memory Optimized (4 vCPU, 32 GB)" | "Compute Optimized (8 vCPU, 16 GB)";
export type SparkStageId = "read" | "transform" | "shuffle" | "write";
export type SparkStageStatus = "complete" | "running" | "waiting";

export type SparkControls = {
  scenario: SparkScenarioId;
  dataSource: SparkDataSourceId;
  fileFormat: SparkFileFormat;
  dataSizeGb: number;
  clusterType: SparkClusterType;
  workerType: SparkWorkerType;
  autoScaling: boolean;
  minWorkers: number;
  maxWorkers: number;
  target: SparkDataSourceId;
  outputFormat: SparkFileFormat;
  partitionBy: "date" | "region" | "none";
};

export type SparkStage = {
  id: SparkStageId;
  label: string;
  status: SparkStageStatus;
  duration?: string;
};

export type SparkMetrics = {
  totalRecords: number;
  processingSeconds: number;
  throughput: number;
  dataReadGb: number;
  dataWrittenGb: number;
  estimatedCost: number;
  workers: number;
  totalVcpu: number;
  totalMemoryGb: number;
};

export type SparkLog = {
  id: string;
  time: string;
  text: string;
  tone: "muted" | "info" | "success" | "accent";
};

export type SparkSimulationState = {
  stages: SparkStage[];
  metrics: SparkMetrics;
  logs: SparkLog[];
  status: string;
};

export const sparkScenarios = [
  {id:"daily-sales" as SparkScenarioId,label:"ETL: Daily Sales Processing",recordDensityM:12.5,writeRatio:.82},
  {id:"clickstream" as SparkScenarioId,label:"Batch: Clickstream Aggregation",recordDensityM:28,writeRatio:.46},
  {id:"customer360" as SparkScenarioId,label:"Batch: Customer 360 Build",recordDensityM:8.4,writeRatio:.72},
  {id:"inventory" as SparkScenarioId,label:"Batch: Inventory Reconciliation",recordDensityM:5.2,writeRatio:.63},
];

export const sparkDataSources = {
  s3:{label:"S3 (Amazon)",short:"S3",uri:"s3://data-lake"},
  gcs:{label:"Google Cloud Storage",short:"GCS",uri:"gs://data-lake"},
  adls:{label:"Azure Data Lake Storage",short:"ADLS",uri:"abfss://data-lake"},
} satisfies Record<SparkDataSourceId,{label:string;short:string;uri:string}>;

export const workerTypes = {
  "Standard (4 vCPU, 16 GB)":{vcpu:4,memory:16,speed:1,costPerWorkerHour:.532},
  "Memory Optimized (4 vCPU, 32 GB)":{vcpu:4,memory:32,speed:1.08,costPerWorkerHour:.83},
  "Compute Optimized (8 vCPU, 16 GB)":{vcpu:8,memory:16,speed:1.42,costPerWorkerHour:1.02},
} satisfies Record<SparkWorkerType,{vcpu:number;memory:number;speed:number;costPerWorkerHour:number}>;

export function defaultSparkControls():SparkControls{
  return {
    scenario:"daily-sales",
    dataSource:"s3",
    fileFormat:"Parquet",
    dataSizeGb:1,
    clusterType:"Serverless (EMR Serverless)",
    workerType:"Standard (4 vCPU, 16 GB)",
    autoScaling:true,
    minWorkers:2,
    maxWorkers:10,
    target:"s3",
    outputFormat:"Parquet",
    partitionBy:"date",
  };
}

function scenarioMeta(id:SparkScenarioId){
  return sparkScenarios.find(item=>item.id===id) ?? sparkScenarios[0];
}

function clamp(value:number,min:number,max:number){return Math.min(max,Math.max(min,value));}
function round(value:number,digits=2){const m=10**digits;return Math.round(value*m)/m;}

export function computeSparkMetrics(controls:SparkControls):SparkMetrics{
  const scenario=scenarioMeta(controls.scenario);
  const worker=workerTypes[controls.workerType];
  const targetWorkers=controls.autoScaling
    ? clamp(Math.round(controls.minWorkers + controls.dataSizeGb*2),controls.minWorkers,controls.maxWorkers)
    : controls.minWorkers;
  const formatFactor=controls.fileFormat==="Parquet"?1:controls.fileFormat==="JSON"?1.28:1.15;
  const clusterFactor=controls.clusterType==="Serverless (EMR Serverless)"?1:controls.clusterType==="Ephemeral Job Cluster"?1.08:1.16;
  const processingSeconds=Math.max(20,Math.round(71*controls.dataSizeGb*formatFactor*clusterFactor/(worker.speed*Math.max(.7,targetWorkers/4))));
  const records=Math.round(scenario.recordDensityM*1_000_000*controls.dataSizeGb);
  const throughput=Math.round(records/processingSeconds);
  const written=round(controls.dataSizeGb*scenario.writeRatio*(controls.outputFormat==="Parquet"?1:controls.outputFormat==="JSON"?1.22:1.08),2);
  const estimatedCost=round(worker.costPerWorkerHour*targetWorkers*(processingSeconds/3600),3);
  return {
    totalRecords:records,
    processingSeconds,
    throughput,
    dataReadGb:round(controls.dataSizeGb,1),
    dataWrittenGb:written,
    estimatedCost,
    workers:targetWorkers,
    totalVcpu:targetWorkers*worker.vcpu,
    totalMemoryGb:targetWorkers*worker.memory,
  };
}

function clock(index:number){
  const seconds=[1,5,12,32,48,70,72,72][index] ?? 72+index;
  return `10:24:${String(seconds).padStart(2,"0")}`;
}
function makeLog(index:number,text:string,tone:SparkLog["tone"]="muted"):SparkLog{
  return {id:`${index}-${text.slice(0,16)}`,time:clock(index),text,tone};
}

export function sparkOutputPath(controls:SparkControls){
  const base=sparkDataSources[controls.target].uri;
  const folder=controls.scenario==="daily-sales"?"sales":controls.scenario==="clickstream"?"clickstream":controls.scenario==="customer360"?"customer360":"inventory";
  const partition=controls.partitionBy==="date"?"date=2026-10-02/":controls.partitionBy==="region"?"region=us-east-1/":"";
  return `${base}/${folder}/${partition}`;
}

export function referenceSparkState():SparkSimulationState{
  const controls=defaultSparkControls();
  const metrics=computeSparkMetrics(controls);
  return {
    stages:[
      {id:"read",label:"Read Data",status:"complete",duration:"32 sec"},
      {id:"transform",label:"Transform",status:"running",duration:"Running..."},
      {id:"shuffle",label:"Shuffle",status:"waiting",duration:"Waiting"},
      {id:"write",label:"Write Output",status:"waiting",duration:"Waiting"},
    ],
    metrics,
    logs:[
      makeLog(0,"Submitting Spark job to EMR Serverless...","info"),
      makeLog(1,"Provisioning workers (2 → 4)...","success"),
      makeLog(2,"Reading data from s3://raw/sales/ (1 GB)","muted"),
      makeLog(3,"Applying transformations...","accent"),
      makeLog(4,"Shuffling data (200 partitions)...","muted"),
      makeLog(5,"Writing output to s3://data-lake/sales/date=2026-10-02/","accent"),
      makeLog(6,"Job completed successfully! ✓","success"),
      makeLog(7,"Total time: 1 min 11 sec","success"),
    ],
    status:"Managed Spark job is running with auto scaling enabled.",
  };
}

export function simulateSpark(controls:SparkControls):SparkSimulationState{
  const metrics=computeSparkMetrics(controls);
  const source=sparkDataSources[controls.dataSource];
  const path=sparkOutputPath(controls);
  const format=controls.fileFormat.toLowerCase();
  return {
    stages:[
      {id:"read",label:"Read Data",status:"complete",duration:`${Math.max(8,Math.round(metrics.processingSeconds*.45))} sec`},
      {id:"transform",label:"Transform",status:"complete",duration:`${Math.max(6,Math.round(metrics.processingSeconds*.25))} sec`},
      {id:"shuffle",label:"Shuffle",status:"complete",duration:`${Math.max(4,Math.round(metrics.processingSeconds*.18))} sec`},
      {id:"write",label:"Write Output",status:"complete",duration:`${Math.max(3,Math.round(metrics.processingSeconds*.12))} sec`},
    ],
    metrics,
    logs:[
      makeLog(0,`Submitting Spark job to ${controls.clusterType}...`,"info"),
      makeLog(1,`Provisioning workers (${controls.minWorkers} → ${metrics.workers})...`,"success"),
      makeLog(2,`Reading ${format} data from ${source.uri}/raw/ (${controls.dataSizeGb} GB)`,"muted"),
      makeLog(3,"Applying transformations...","accent"),
      makeLog(4,`Shuffling data (${Math.max(50,Math.round(200*controls.dataSizeGb))} partitions)...`,"muted"),
      makeLog(5,`Writing output to ${path}`,"accent"),
      makeLog(6,"Job completed successfully! ✓","success"),
      makeLog(7,`Total time: ${formatDuration(metrics.processingSeconds)}`,"success"),
      makeLog(8,`Estimated cost: $${metrics.estimatedCost.toFixed(3)}`,"success"),
    ],
    status:`Job completed with ${metrics.workers} workers and ${metrics.throughput.toLocaleString("en-US")} records/sec throughput.`,
  };
}

export function formatDuration(totalSeconds:number){
  const minutes=Math.floor(totalSeconds/60);
  const seconds=totalSeconds%60;
  return minutes>0?`${minutes} min ${seconds} sec`:`${seconds} sec`;
}
