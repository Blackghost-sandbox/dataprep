export type ObservabilityScenarioId =
  | "service-failure-retry"
  | "network-timeout"
  | "consumer-lag"
  | "healthy";

export type RegionId = "us-east-1" | "us-west-2" | "eu-west-1";
export type NetworkIssueId = "none" | "latency" | "timeout" | "blocked";
export type DataServiceId = "kinesis" | "pubsub" | "eventhubs";
export type RetentionId = "24h" | "72h" | "168h";

export type ObservabilityControls = {
  scenario: ObservabilityScenarioId;
  eventsPerSecond: number;
  region: RegionId;
  networkIssue: NetworkIssueId;
  simulateNetworkIssue: boolean;
  dataService: DataServiceId;
  retention: RetentionId;
  workerCount: number;
  processingTimeSeconds: number;
  showMetrics: boolean;
  showLogs: boolean;
  showTraces: boolean;
  alertsEnabled: boolean;
};

export type ObservabilityMetrics = {
  incomingEvents: number;
  processedEvents: number;
  errorRatePct: number;
  latencyMs: number;
  retries: number;
  consumerLag: number;
};

export type ObservabilityLog = {
  id: string;
  time: string;
  level: "INFO" | "WARN" | "ERROR";
  text: string;
};

export type TraceSpan = {
  id: string;
  label: string;
  durationMs: number;
  tone: "green" | "violet" | "blue" | "orange";
};

export type ObservabilityState = {
  healthy: boolean;
  metrics: ObservabilityMetrics;
  logs: ObservabilityLog[];
  traces: TraceSpan[];
  alertTriggered: boolean;
  status: string;
};

export const observabilityScenarios = {
  "service-failure-retry": {label:"Service failure & auto-retry"},
  "network-timeout": {label:"Network timeout"},
  "consumer-lag": {label:"Consumer lag spike"},
  healthy: {label:"Healthy pipeline"},
} satisfies Record<ObservabilityScenarioId,{label:string}>;

export const dataServices = {
  kinesis:{label:"Amazon Kinesis",short:"Kinesis"},
  pubsub:{label:"Google Cloud Pub/Sub",short:"Pub/Sub"},
  eventhubs:{label:"Azure Event Hubs",short:"Event Hubs"},
} satisfies Record<DataServiceId,{label:string;short:string}>;

export const retentionOptions = {
  "24h":"24 hours",
  "72h":"72 hours",
  "168h":"7 days",
} satisfies Record<RetentionId,string>;

export function defaultObservabilityControls():ObservabilityControls{
  return {
    scenario:"service-failure-retry",
    eventsPerSecond:100,
    region:"us-east-1",
    networkIssue:"none",
    simulateNetworkIssue:false,
    dataService:"kinesis",
    retention:"24h",
    workerCount:3,
    processingTimeSeconds:2,
    showMetrics:true,
    showLogs:true,
    showTraces:true,
    alertsEnabled:true,
  };
}

function makeLogs(service:string,metrics:ObservabilityMetrics,scenario:ObservabilityScenarioId,issue:NetworkIssueId):ObservabilityLog[]{
  const base:ObservabilityLog[]=[
    {id:"1",time:"10:24:01",level:"INFO",text:`Producer sent ${metrics.incomingEvents} events`},
    {id:"2",time:"10:24:02",level:"INFO",text:`Events published to ${service}`},
  ];
  if(scenario==="service-failure-retry" || scenario==="network-timeout" || issue==="timeout"){
    base.push(
      {id:"3",time:"10:24:05",level:"WARN",text:"Network timeout to consumer"},
      {id:"4",time:"10:24:05",level:"INFO",text:"Retrying (1/3)..."},
      {id:"5",time:"10:24:07",level:"INFO",text:"Consumer connection restored"}
    );
  } else if(issue==="latency"){
    base.push({id:"3",time:"10:24:05",level:"WARN",text:"Network latency above 500 ms"});
  } else if(issue==="blocked"){
    base.push({id:"3",time:"10:24:05",level:"ERROR",text:"Security rule blocked consumer connection"});
  }
  base.push(
    {id:"6",time:"10:24:07",level:"INFO",text:`Processing ${metrics.processedEvents} events...`},
    {id:"7",time:"10:24:10",level:"INFO",text:"Checkpoint committed (offset: 1250)"},
    {id:"8",time:"10:24:11",level:"INFO",text:`Error rate: ${metrics.errorRatePct}%`},
    {id:"9",time:"10:24:12",level:"INFO",text:"Pipeline healthy ✓"}
  );
  return base;
}

export function computeObservability(controls:ObservabilityControls):ObservabilityState{
  const service=dataServices[controls.dataService];
  const baseError =
    controls.scenario==="healthy" ? 0.5 :
    controls.scenario==="consumer-lag" ? 1.2 :
    controls.scenario==="network-timeout" ? 4.2 : 2;

  const issuePenalty = !controls.simulateNetworkIssue ? 0 :
    controls.networkIssue==="latency" ? 1.3 :
    controls.networkIssue==="timeout" ? 3.5 :
    controls.networkIssue==="blocked" ? 12 : 0;

  const workerCapacity=Math.max(1,controls.workerCount)*80/Math.max(.5,controls.processingTimeSeconds);
  const capacityPenalty=Math.max(0,controls.eventsPerSecond-workerCapacity);
  const errorRate=Math.min(99,Math.round((baseError+issuePenalty+capacityPenalty*.035)*10)/10);
  const processed=Math.max(0,Math.round(controls.eventsPerSecond*(1-errorRate/100)));

  const scenarioLag=controls.scenario==="consumer-lag" ? 55 : 12;
  const lag=Math.max(0,Math.round(scenarioLag+capacityPenalty*.8+(controls.simulateNetworkIssue?8:0)));
  const latencyBase=controls.scenario==="service-failure-retry" ? 850 :
    controls.scenario==="network-timeout" ? 1320 :
    controls.scenario==="consumer-lag" ? 940 : 410;
  const latency=Math.round(latencyBase+(controls.simulateNetworkIssue?controls.networkIssue==="latency"?420:controls.networkIssue==="timeout"?760:controls.networkIssue==="blocked"?1100:0:0));
  const retries=controls.scenario==="service-failure-retry"?4:controls.scenario==="network-timeout"?6:controls.simulateNetworkIssue?3:0;

  const metrics:ObservabilityMetrics={
    incomingEvents:controls.eventsPerSecond,
    processedEvents:processed,
    errorRatePct:errorRate,
    latencyMs:latency,
    retries,
    consumerLag:lag,
  };

  const thresholdExceeded=errorRate>5;
  const healthy=!thresholdExceeded && controls.networkIssue!=="blocked";
  const traces:TraceSpan[]=[
    {id:"producer",label:"Producer (application)",durationMs:12,tone:"green"},
    {id:"network",label:`Network (VPC → ${service.short})`,durationMs:controls.simulateNetworkIssue?controls.networkIssue==="latency"?455:controls.networkIssue==="timeout"?830:controls.networkIssue==="blocked"?1200:35:35,tone:"violet"},
    {id:"service",label:`${service.short} (ingest)`,durationMs:18,tone:"blue"},
    {id:"consumer",label:"Consumer (process)",durationMs:Math.max(120,controls.processingTimeSeconds*310),tone:"orange"},
    {id:"write",label:"Write to destination",durationMs:45,tone:"green"},
  ];

  return {
    healthy,
    metrics,
    logs:makeLogs(service.short,metrics,controls.scenario,controls.simulateNetworkIssue?controls.networkIssue:"none"),
    traces,
    alertTriggered:controls.alertsEnabled && thresholdExceeded,
    status:thresholdExceeded
      ? `Alert threshold exceeded: error rate is ${errorRate}%.`
      : `Pipeline healthy with ${errorRate}% error rate and ${lag} events of consumer lag.`,
  };
}

export function referenceObservabilityState():ObservabilityState{
  const controls=defaultObservabilityControls();
  return {
    healthy:true,
    metrics:{
      incomingEvents:100,
      processedEvents:98,
      errorRatePct:2,
      latencyMs:850,
      retries:4,
      consumerLag:12,
    },
    logs:[
      {id:"1",time:"10:24:01",level:"INFO",text:"Producer sent 100 events"},
      {id:"2",time:"10:24:02",level:"INFO",text:"Events published to Kinesis"},
      {id:"3",time:"10:24:05",level:"WARN",text:"Network timeout to consumer"},
      {id:"4",time:"10:24:05",level:"INFO",text:"Retrying (1/3)..."},
      {id:"5",time:"10:24:07",level:"INFO",text:"Consumer connection restored"},
      {id:"6",time:"10:24:07",level:"INFO",text:"Processing events..."},
      {id:"7",time:"10:24:10",level:"INFO",text:"Checkpoint committed (offset: 1250)"},
      {id:"8",time:"10:24:11",level:"INFO",text:"Error rate: 2% (within threshold)"},
      {id:"9",time:"10:24:12",level:"INFO",text:"Pipeline healthy ✓"},
    ],
    traces:[
      {id:"producer",label:"Producer (application)",durationMs:12,tone:"green"},
      {id:"network",label:"Network (VPC → Kinesis)",durationMs:35,tone:"violet"},
      {id:"service",label:"Kinesis (ingest)",durationMs:18,tone:"blue"},
      {id:"consumer",label:"Consumer (process)",durationMs:620,tone:"orange"},
      {id:"write",label:"Write to destination",durationMs:45,tone:"green"},
    ],
    alertTriggered:false,
    status:"Pipeline healthy ✓",
  };
}
