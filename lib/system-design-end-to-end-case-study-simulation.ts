export type EndToEndScenarioId = "marketplace" | "fraud" | "ml-platform";

export type EndToEndScenario = {
  id: EndToEndScenarioId;
  label: string;
  eventsPerMinute: number;
  eventSizeKb: number;
  retentionYears: number;
  realTimeMix: number;
  adhocMix: number;
  mlMix: number;
};

export type ArchitectureSelection =
  | "producers"
  | "ingestion"
  | "processing"
  | "storage"
  | "serving"
  | "consumers";

export type EndToEndResult = {
  throughput: number;
  latencySec: number;
  consumerQueries: number;
  processingCost: number;
  sourceRates: {
    web: number;
    mobile: number;
    partner: number;
  };
  processingRates: {
    streaming: number;
    batch: number;
  };
  storageRates: {
    lake: number;
    warehouse: number;
  };
  architectureNotes: Record<ArchitectureSelection,string>;
  eventSeries: number[];
  eventTypes: Array<{label:string;percent:number}>;
  regions: Array<{label:string;percent:number;x:number;y:number}>;
};

export const endToEndScenarios: EndToEndScenario[] = [
  {
    id:"marketplace",
    label:"Scenario 1: Marketplace Analytics",
    eventsPerMinute:100_000,
    eventSizeKb:2,
    retentionYears:2,
    realTimeMix:60,
    adhocMix:30,
    mlMix:10,
  },
  {
    id:"fraud",
    label:"Scenario 2: Fraud Detection",
    eventsPerMinute:180_000,
    eventSizeKb:1,
    retentionYears:1,
    realTimeMix:80,
    adhocMix:15,
    mlMix:5,
  },
  {
    id:"ml-platform",
    label:"Scenario 3: ML Feature Platform",
    eventsPerMinute:75_000,
    eventSizeKb:4,
    retentionYears:3,
    realTimeMix:35,
    adhocMix:20,
    mlMix:45,
  },
];

export function getEndToEndScenario(id:EndToEndScenarioId):EndToEndScenario {
  return endToEndScenarios.find(item=>item.id===id)??endToEndScenarios[0];
}

export function simulateEndToEnd(
  scenario:EndToEndScenario,
  eventsPerMinute:number,
  eventSizeKb:number,
  retentionYears:number,
  mixes:{realTime:number;adhoc:number;ml:number},
):EndToEndResult {
  const events=Math.max(1_000,Math.round(eventsPerMinute));
  const size=Math.max(.5,eventSizeKb);
  const retention=Math.max(1,retentionYears);
  const totalMix=Math.max(1,mixes.realTime+mixes.adhoc+mixes.ml);
  const rt=mixes.realTime/totalMix;
  const adhoc=mixes.adhoc/totalMix;
  const ml=mixes.ml/totalMix;

  const reference =
    scenario.id==="marketplace" &&
    events===100_000 &&
    size===2 &&
    retention===2 &&
    Math.round(rt*100)===60 &&
    Math.round(adhoc*100)===30 &&
    Math.round(ml*100)===10;

  const throughput=reference?100_000:Math.round(events*.985);
  const latencySec=reference?2.3:Number(Math.max(.45,2.1+(events/100_000-.8)*.9+(size-2)*.14).toFixed(1));
  const consumerQueries=reference?1_250:Math.round(620+events/130+adhoc*620);
  const processingCost=reference?420:Math.round(180+(events/100_000)*155+size*28+retention*18+ml*95);

  const web=reference?60_000:Math.round(events*.60);
  const mobile=reference?30_000:Math.round(events*.30);
  const partner=Math.max(0,events-web-mobile);
  const streaming=Math.round(events*rt + events*ml*.2);
  const batch=Math.max(0,events-streaming);

  return {
    throughput,
    latencySec,
    consumerQueries,
    processingCost,
    sourceRates:{web,mobile,partner},
    processingRates:{streaming,batch},
    storageRates:{lake:events,warehouse:events},
    architectureNotes:{
      producers:"Web, mobile, and partner producers publish versioned events through a stable contract.",
      ingestion:"Kafka absorbs bursts, decouples producers from processing, and keeps a replayable event log.",
      processing:"Streaming serves freshness-sensitive consumers while batch handles economical historical work.",
      storage:"S3/Delta preserves replayable history; Snowflake serves curated analytical queries.",
      serving:"BI, product APIs, and the feature store expose purpose-built read paths.",
      consumers:"Analysts, product applications, and ML pipelines consume the same governed business definitions.",
    },
    eventSeries: reference
      ? [82,60,56,89,71,92,78,95,101,122,70,82,93,98,88,91]
      : Array.from({length:16},(_,i)=>Math.round((events/1000)*(.56+((i*17)%49)/100))),
    eventTypes:[
      {label:"Page View",percent:42},
      {label:"Add to Cart",percent:28},
      {label:"Purchase",percent:15},
      {label:"Search",percent:10},
      {label:"Other",percent:5},
    ],
    regions:[
      {label:"US",percent:38,x:75,y:43},
      {label:"AN",percent:22,x:57,y:51},
      {label:"EU",percent:18,x:51,y:37},
      {label:"APAC",percent:15,x:80,y:56},
      {label:"Other",percent:7,x:42,y:62},
    ],
  };
}
