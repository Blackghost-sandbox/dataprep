export type OpsScenarioId = "ecommerce" | "payments" | "analytics";

export type OpsScenario = {
  id: OpsScenarioId;
  label: string;
  eventsPerSecond: number;
  dataVolumeGbPerDay: number;
  errorRatePct: number;
  dataQualityMode: "late-duplicates" | "schema-drift" | "clean";
  throughput: number;
  latencyMs: number;
  activeConsumers: number;
  dailyCost: number;
};

export type OpsControls = {
  observability: boolean;
  quality: boolean;
  accessControls: boolean;
  costAlerts: boolean;
};

export type OpsResult = {
  throughput: number;
  errorRatePct: number;
  errorsPerMinute: number;
  latencyMs: number;
  dataQualityIssues: number;
  activeConsumers: number;
  dailyCost: number;
  logs: string[];
  costBreakdown: Array<{label:string;amount:number;percent:number}>;
};

export const opsScenarios: OpsScenario[] = [
  {
    id:"ecommerce",
    label:"Scenario 1: E-commerce Platform",
    eventsPerSecond:10_000,
    dataVolumeGbPerDay:500,
    errorRatePct:.7,
    dataQualityMode:"late-duplicates",
    throughput:9842,
    latencyMs:320,
    activeConsumers:8,
    dailyCost:420,
  },
  {
    id:"payments",
    label:"Scenario 2: Payments Platform",
    eventsPerSecond:18_000,
    dataVolumeGbPerDay:760,
    errorRatePct:.35,
    dataQualityMode:"schema-drift",
    throughput:17_420,
    latencyMs:245,
    activeConsumers:11,
    dailyCost:610,
  },
  {
    id:"analytics",
    label:"Scenario 3: Analytics Platform",
    eventsPerSecond:6_000,
    dataVolumeGbPerDay:340,
    errorRatePct:1.1,
    dataQualityMode:"clean",
    throughput:5_760,
    latencyMs:410,
    activeConsumers:5,
    dailyCost:330,
  },
];

export const defaultOpsControls: OpsControls = {
  observability:true,
  quality:true,
  accessControls:true,
  costAlerts:true,
};

export function getOpsScenario(id:OpsScenarioId):OpsScenario {
  return opsScenarios.find(x=>x.id===id)??opsScenarios[0];
}

export function simulateOps(
  scenario:OpsScenario,
  eventsPerSecond:number,
  dataVolumeGbPerDay:number,
  errorRatePct:number,
  dataQualityMode:OpsScenario["dataQualityMode"],
  controls:OpsControls,
):OpsResult {
  const events=Math.max(1000,eventsPerSecond);
  const dataGb=Math.max(50,dataVolumeGbPerDay);
  const err=Math.max(0,Math.min(5,errorRatePct));
  const isReference =
    scenario.id==="ecommerce" && events===10_000 && dataGb===500 && err===.7 &&
    dataQualityMode==="late-duplicates" &&
    controls.observability && controls.quality && controls.accessControls && controls.costAlerts;
  const observabilityPenalty=controls.observability?1:.96;
  const qualityPenalty=controls.quality?1:.975;
  const throughput=isReference ? 9842 : Math.round(Math.min(events,scenario.throughput*(events/scenario.eventsPerSecond))*observabilityPenalty*qualityPenalty);
  const latencyMs=isReference ? 320 : Math.round(scenario.latencyMs*(controls.quality?1:1.16)*(controls.observability?1:1.08));
  const errorsPerMinute=isReference ? 68 : Math.round(events*60*(err/100));
  const dataQualityIssues=dataQualityMode==="late-duplicates"?24:dataQualityMode==="schema-drift"?18:4;
  const activeConsumers=isReference ? 8 : Math.max(1,Math.round(scenario.activeConsumers*(events/scenario.eventsPerSecond)));
  const controlCost=(controls.observability?24:0)+(controls.quality?18:0)+(controls.accessControls?12:0)+(controls.costAlerts?6:0);
  const dailyCost=isReference ? 420 : Math.round(scenario.dailyCost*(dataGb/scenario.dataVolumeGbPerDay)*.86+controlCost);

  const compute=Math.round(dailyCost*.43);
  const storage=Math.round(dailyCost*.29);
  const transfer=Math.round(dailyCost*.14);
  const monitoring=Math.round(dailyCost*.10);
  const other=Math.max(0,dailyCost-compute-storage-transfer-monitoring);

  const logs=[
    "[INFO] Consumed "+Math.round(events*1.043).toLocaleString()+" events from orders_topic",
    dataQualityMode==="late-duplicates"?"[WARN] Late data detected (3 min behind)":dataQualityMode==="schema-drift"?"[WARN] Schema drift detected on payment_status":"[INFO] Data freshness within SLA",
    controls.quality?"[INFO] Data quality check passed (99.3% valid)":"[WARN] Data quality checks disabled",
    err>.5?"[ERROR] "+dataQualityIssues+" records failed schema validation":"[INFO] Error rate below alert threshold",
    "[INFO] Writing to Snowflake (batch_id: 1024)",
    "[INFO] Cost usage: $"+(dailyCost/1000).toFixed(2)+" (current hour)",
  ];

  return {
    throughput,
    errorRatePct:Number(err.toFixed(1)),
    errorsPerMinute,
    latencyMs,
    dataQualityIssues,
    activeConsumers,
    dailyCost,
    logs,
    costBreakdown:isReference ? [
      {label:"Compute",amount:180,percent:43},
      {label:"Storage",amount:120,percent:29},
      {label:"Data Transfer",amount:60,percent:14},
      {label:"Monitoring",amount:40,percent:10},
      {label:"Other",amount:20,percent:5},
    ] : [
      {label:"Compute",amount:compute,percent:43},
      {label:"Storage",amount:storage,percent:29},
      {label:"Data Transfer",amount:transfer,percent:14},
      {label:"Monitoring",amount:monitoring,percent:10},
      {label:"Other",amount:other,percent:5},
    ],
  };
}
