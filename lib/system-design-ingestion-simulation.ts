export type IngestionScenarioId = "ecommerce" | "saas-analytics" | "clickstream";
export type IngestionMode = "batch" | "cdc" | "events";
export type SourceId = "oltp" | "logs" | "saas" | "events";

export type IngestionScenario = {
  id:IngestionScenarioId;
  label:string;
  baseRecords:number;
  baseLatencyMin:number;
  baseFailed:number;
  baseThroughput:number;
};

export type IngestionState = {
  enabled:Record<SourceId,boolean>;
  mode:IngestionMode;
};

export type IngestionResult = {
  records:number;
  latencyMin:number;
  failed:number;
  throughput:number;
  logLines:string[];
};

export const ingestionScenarios:IngestionScenario[]=[
  {id:"ecommerce",label:"Scenario 1: E-commerce Platform",baseRecords:1_200_000,baseLatencyMin:2.4,baseFailed:1240,baseThroughput:15_800},
  {id:"saas-analytics",label:"Scenario 2: SaaS Analytics",baseRecords:860_000,baseLatencyMin:1.8,baseFailed:520,baseThroughput:12_600},
  {id:"clickstream",label:"Scenario 3: Clickstream Platform",baseRecords:2_400_000,baseLatencyMin:0.9,baseFailed:1780,baseThroughput:28_400},
];

export const defaultIngestionState:IngestionState={
  enabled:{oltp:true,logs:true,saas:false,events:true},
  mode:"batch",
};

export function getIngestionScenario(id:IngestionScenarioId){
  return ingestionScenarios.find(x=>x.id===id)??ingestionScenarios[0];
}

export function runIngestionSimulation(scenario:IngestionScenario,state:IngestionState):IngestionResult{
  const active=Object.values(state.enabled).filter(Boolean).length;
  const sourceFactor=Math.max(.35,active/3);
  const modeFactor=state.mode==="batch"?1:state.mode==="cdc"?1.12:1.28;
  const latencyFactor=state.mode==="batch"?1:state.mode==="cdc"?.62:.38;
  const failureFactor=(state.enabled.saas?.18:0)+(state.enabled.events?.28:0)+(state.enabled.oltp?.22:0)+(state.enabled.logs?.12:0);
  const records=Math.round(scenario.baseRecords*sourceFactor*modeFactor);
  const latencyMin=Number(Math.max(.2,scenario.baseLatencyMin*latencyFactor).toFixed(1));
  const failed=Math.max(0,Math.round(scenario.baseFailed*(.55+failureFactor)));
  const throughput=Math.round(scenario.baseThroughput*sourceFactor*(state.mode==="batch"?1:state.mode==="cdc"?1.18:1.42));
  const logLines=[
    "[BATCH] Starting scheduled extract...",
    state.enabled.oltp?"[DB] Extracted 500,000 records":"[DB] OLTP source disabled",
    state.enabled.logs?"[LOG] Captured application log files":"[LOG] Application logs disabled",
    state.enabled.saas?"[API] Fetched SaaS API records":"[API] SaaS API source disabled",
    state.enabled.events?"[EVENT] Consumed event stream":"[EVENT] Event stream disabled",
    "[WRITE] Wrote data to landing zone",
    "[BUFFER] Metadata/checkpoint updated",
    "[DQ] "+failed.toLocaleString()+" records failed validation",
    "[DONE] Ingestion completed in "+latencyMin.toFixed(1)+" min",
  ];
  return {records,latencyMin,failed,throughput,logLines};
}
