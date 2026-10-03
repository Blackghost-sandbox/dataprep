export type CloudProviderId = "aws" | "gcp" | "azure";
export type CloudScenarioId = "retail" | "iot" | "customer360";
export type CloudStageId = "sources" | "ingestion" | "storage" | "processing" | "analytics" | "consumers";

export type CloudLog = {
  id: string;
  time: string;
  stage: CloudStageId | "system";
  text: string;
  tone: "muted" | "info" | "success" | "accent";
};

export type CloudSimulationState = {
  nextStage: number;
  activeStage: CloudStageId | null;
  completed: CloudStageId[];
  logs: CloudLog[];
  runCount: number;
  status: string;
};

export type CloudScenario = {
  id: CloudScenarioId;
  label: string;
  shortLabel: string;
  sources: string[];
  volume: string;
  cadence: string;
  consumerFocus: string;
};

export type ProviderService = {
  provider: CloudProviderId;
  stage: Exclude<CloudStageId, "sources" | "consumers">;
  name: string;
  shortName: string;
  category: string;
  description: string;
  uses: string[];
};

export const cloudStages: Array<{id:CloudStageId;label:string;caption:string}> = [
  {id:"sources",label:"Data Sources",caption:"Business + event data"},
  {id:"ingestion",label:"Ingestion",caption:"Move events reliably"},
  {id:"storage",label:"Storage (Data Lake)",caption:"Durable object storage"},
  {id:"processing",label:"Processing",caption:"Transform + enrich"},
  {id:"analytics",label:"Analytics",caption:"SQL serving layer"},
  {id:"consumers",label:"BI & Consumers",caption:"People + products"},
];

export const cloudScenarios: CloudScenario[] = [
  {
    id:"retail",
    label:"Retail Analytics Pipeline",
    shortLabel:"Retail analytics",
    sources:["E-commerce App","Clickstream Logs","Customer Data (CRM)"],
    volume:"1.2M events/day",
    cadence:"Near-real-time + daily batch",
    consumerFocus:"Revenue, funnel and customer analytics",
  },
  {
    id:"iot",
    label:"IoT Telemetry Pipeline",
    shortLabel:"IoT telemetry",
    sources:["Factory Sensors","Device Gateway","Maintenance Events"],
    volume:"18M events/day",
    cadence:"Continuous streaming",
    consumerFocus:"Operations dashboards and anomaly models",
  },
  {
    id:"customer360",
    label:"Customer 360 Pipeline",
    shortLabel:"Customer 360",
    sources:["CRM","Support Tickets","Product Events"],
    volume:"650K records/day",
    cadence:"Hourly micro-batch",
    consumerFocus:"Unified customer profiles and segmentation",
  },
];

export const providerServices: Record<CloudProviderId, Record<Exclude<CloudStageId,"sources"|"consumers">, ProviderService>> = {
  aws:{
    ingestion:{provider:"aws",stage:"ingestion",name:"Amazon Kinesis",shortName:"Kinesis",category:"Ingestion",description:"Managed streaming ingestion for event data and near-real-time pipelines.",uses:["Clickstream and application events","Operational telemetry","Fan-out to downstream consumers"]},
    storage:{provider:"aws",stage:"storage",name:"Amazon S3",shortName:"S3",category:"Storage",description:"Object storage for data lakes, affordable, durable and scalable for very large datasets.",uses:["Store raw, processed and curated data","Data lake foundation","Works with Glue, Athena and Redshift"]},
    processing:{provider:"aws",stage:"processing",name:"AWS Glue / EMR",shortName:"Glue / EMR",category:"Processing",description:"Managed transformation choices for serverless ETL and distributed Spark processing.",uses:["ETL and schema transforms","Spark workloads","Scheduled batch pipelines"]},
    analytics:{provider:"aws",stage:"analytics",name:"Amazon Redshift",shortName:"Redshift",category:"Analytics",description:"Cloud data warehouse for SQL analytics across curated relational and lake data.",uses:["BI dashboards","Warehouse workloads","Federated/lake analytics patterns"]},
  },
  gcp:{
    ingestion:{provider:"gcp",stage:"ingestion",name:"Google Cloud Pub/Sub",shortName:"Pub/Sub",category:"Ingestion",description:"Global event messaging service for decoupled streaming producers and consumers.",uses:["Application events","Streaming fan-out","Event-driven pipelines"]},
    storage:{provider:"gcp",stage:"storage",name:"Google Cloud Storage",shortName:"Cloud Storage",category:"Storage",description:"Durable object storage commonly used for landing, raw and curated lake zones.",uses:["Data lake zones","Archive and retention","Input for BigQuery and Dataproc"]},
    processing:{provider:"gcp",stage:"processing",name:"Google Cloud Dataproc",shortName:"Dataproc",category:"Processing",description:"Managed Spark and Hadoop processing for batch, ETL and analytical workloads.",uses:["Spark transformations","Batch pipelines","Open-source ecosystem jobs"]},
    analytics:{provider:"gcp",stage:"analytics",name:"BigQuery",shortName:"BigQuery",category:"Analytics",description:"Serverless analytical warehouse for large-scale SQL and governed data products.",uses:["Interactive SQL","BI serving","Large analytical scans"]},
  },
  azure:{
    ingestion:{provider:"azure",stage:"ingestion",name:"Azure Event Hubs",shortName:"Event Hubs",category:"Ingestion",description:"Managed high-throughput event ingestion for application, IoT and telemetry streams.",uses:["Telemetry intake","Streaming applications","Kafka-compatible event ingestion"]},
    storage:{provider:"azure",stage:"storage",name:"Azure Data Lake Storage",shortName:"ADLS",category:"Storage",description:"Cloud object storage optimized for analytics-oriented data lake organization.",uses:["Raw and curated lake zones","Hierarchical namespace","Spark and warehouse integration"]},
    processing:{provider:"azure",stage:"processing",name:"Azure Synapse / Spark",shortName:"Synapse Spark",category:"Processing",description:"Managed analytics workspace and Spark pools for transformation and data engineering.",uses:["Spark notebooks and jobs","ETL transformations","Integrated analytics workflows"]},
    analytics:{provider:"azure",stage:"analytics",name:"Azure Synapse Analytics",shortName:"Synapse",category:"Analytics",description:"Integrated analytical SQL and data warehousing for curated enterprise datasets.",uses:["SQL analytics","BI serving","Enterprise analytical workloads"]},
  },
};

export const providerLabels: Record<CloudProviderId,string> = {aws:"AWS",gcp:"Google Cloud",azure:"Azure"};

export function scenarioById(id: CloudScenarioId){
  return cloudScenarios.find(item=>item.id===id) ?? cloudScenarios[0];
}

function timeFor(sequence:number){
  const seconds=sequence*2;
  return `10:24:${String(seconds).padStart(2,"0")}`;
}

function makeLog(sequence:number,stage:CloudLog["stage"],text:string,tone:CloudLog["tone"]):CloudLog{
  return {id:`${sequence}-${stage}-${text.slice(0,12)}`,time:timeFor(sequence),stage,text,tone};
}

export function newCloudSimulationState():CloudSimulationState{
  return {
    nextStage:0,
    activeStage:null,
    completed:[],
    logs:[makeLog(0,"system","Ready. Choose a scenario and run the pipeline.","muted")],
    runCount:0,
    status:"Ready to map the pipeline across cloud responsibilities.",
  };
}

function stageLogs(stage:CloudStageId,scenario:CloudScenario,provider:CloudProviderId,sequence:number):CloudLog[]{
  const svc=providerServices[provider];
  switch(stage){
    case "sources": return [
      makeLog(sequence,"sources",`Reading data from ${scenario.sources[0]} ✓`,"success"),
      makeLog(sequence+1,"sources",`${scenario.volume} · ${scenario.cadence}`,"info"),
    ];
    case "ingestion": return [
      makeLog(sequence,"ingestion",`Ingesting events via ${svc.ingestion.name} ...`,"accent"),
      makeLog(sequence+1,"ingestion","Events accepted and checkpointed ✓","success"),
    ];
    case "storage": return [
      makeLog(sequence,"storage",`Writing to ${svc.storage.shortName} (raw zone) ✓`,"success"),
      makeLog(sequence+1,"storage","Raw objects partitioned by event date","info"),
    ];
    case "processing": return [
      makeLog(sequence,"processing",`Triggering ${svc.processing.name} job ...`,"accent"),
      makeLog(sequence+1,"processing","Job completed successfully ✓","success"),
    ];
    case "analytics": return [
      makeLog(sequence,"analytics",`Loading curated data to ${svc.analytics.name} ...`,"accent"),
      makeLog(sequence+1,"analytics","Data available for analytics ✓","success"),
    ];
    case "consumers": return [
      makeLog(sequence,"consumers",`Publishing ${scenario.consumerFocus} ✓`,"success"),
      makeLog(sequence+1,"system","Pipeline run completed successfully! 🎉","success"),
    ];
  }
}

export function advanceCloudSimulation(previous:CloudSimulationState,scenarioId:CloudScenarioId,provider:CloudProviderId):CloudSimulationState{
  const scenario=scenarioById(scenarioId);
  if(previous.nextStage>=cloudStages.length){
    return {...previous,status:"Pipeline already completed. Reset or choose another scenario to replay."};
  }
  const stage=cloudStages[previous.nextStage].id;
  const seed=previous.logs.length;
  const completed=[...previous.completed,stage];
  const done=previous.nextStage===cloudStages.length-1;
  return {
    nextStage:previous.nextStage+1,
    activeStage:done?null:stage,
    completed,
    logs:[...previous.logs,...stageLogs(stage,scenario,provider,seed)].slice(-18),
    runCount:previous.runCount+(previous.nextStage===0?1:0),
    status:done?"Pipeline completed. Inspect any stage or provider mapping below.":`${cloudStages[previous.nextStage].label} completed. Continue to ${cloudStages[previous.nextStage+1].label}.`,
  };
}

export function runCloudSimulationToEnd(scenarioId:CloudScenarioId,provider:CloudProviderId){
  let state=newCloudSimulationState();
  while(state.nextStage<cloudStages.length)state=advanceCloudSimulation(state,scenarioId,provider);
  return state;
}
