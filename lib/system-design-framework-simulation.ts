export type SystemScenarioId = "video-streaming" | "ecommerce" | "realtime-analytics";

export type SystemDesignInputs = {
  dailyActiveUsers: number;
  requestsPerUserPerDay: number;
  dataPerRequestMb: number;
  readPercent: number;
  peakFactor: number;
};

export type SystemScenario = {
  id: SystemScenarioId;
  label: string;
  shortLabel: string;
  defaultInputs: SystemDesignInputs;
  baseCacheHitRate: number;
  baseLatencyMs: number;
  baseErrorRate: number;
  objectStorageShare: number;
  takeaway: string;
};

export type SimulationResult = {
  totalRequestsPerDay: number;
  averageRps: number;
  peakRps: number;
  dailyTransferGb: number;
  cacheHitRate: number;
  databasePeakRps: number;
  appServerPeakRps: number;
  objectStorageGbPerDay: number;
  averageLatencyMs: number;
  errorRate: number;
  logs: string[];
  takeaways: string[];
};

export const systemDesignScenarios: SystemScenario[] = [
  {
    id: "video-streaming",
    label: "Scenario 1: Video Streaming",
    shortLabel: "Video Streaming Platform",
    defaultInputs: {
      dailyActiveUsers: 10_000_000,
      requestsPerUserPerDay: 100,
      dataPerRequestMb: 1,
      readPercent: 90,
      peakFactor: 4,
    },
    baseCacheHitRate: 70,
    baseLatencyMs: 120,
    baseErrorRate: 0.02,
    objectStorageShare: 0.88,
    takeaway: "Read-heavy traffic benefits from aggressive caching and object storage for large media payloads.",
  },
  {
    id: "ecommerce",
    label: "Scenario 2: E-commerce Checkout",
    shortLabel: "E-commerce Checkout",
    defaultInputs: {
      dailyActiveUsers: 2_500_000,
      requestsPerUserPerDay: 42,
      dataPerRequestMb: 0.08,
      readPercent: 72,
      peakFactor: 7,
    },
    baseCacheHitRate: 46,
    baseLatencyMs: 145,
    baseErrorRate: 0.05,
    objectStorageShare: 0.16,
    takeaway: "Checkout needs stronger database durability and lower cache dependence because writes are business-critical.",
  },
  {
    id: "realtime-analytics",
    label: "Scenario 3: Real-time Analytics",
    shortLabel: "Real-time Analytics",
    defaultInputs: {
      dailyActiveUsers: 5_000_000,
      requestsPerUserPerDay: 180,
      dataPerRequestMb: 0.03,
      readPercent: 82,
      peakFactor: 5,
    },
    baseCacheHitRate: 58,
    baseLatencyMs: 95,
    baseErrorRate: 0.03,
    objectStorageShare: 0.42,
    takeaway: "Analytics traffic needs burst absorption, horizontally scalable compute, and durable storage for replay.",
  },
];

const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));

export function getSystemScenario(id:SystemScenarioId):SystemScenario {
  return systemDesignScenarios.find(item=>item.id===id) ?? systemDesignScenarios[0];
}

export function getNextSystemScenario(id:SystemScenarioId):SystemScenarioId {
  const index=systemDesignScenarios.findIndex(item=>item.id===id);
  return systemDesignScenarios[(index+1)%systemDesignScenarios.length].id;
}

export function simulateSystemDesign(scenario:SystemScenario,inputs:SystemDesignInputs):SimulationResult {
  const users=Math.max(1,inputs.dailyActiveUsers);
  const requestsPerUser=Math.max(1,inputs.requestsPerUserPerDay);
  const dataMb=Math.max(0.001,inputs.dataPerRequestMb);
  const readPercent=clamp(inputs.readPercent,0,100);
  const peakFactor=clamp(inputs.peakFactor,1,30);

  const totalRequestsPerDay=users*requestsPerUser;
  const averageRps=totalRequestsPerDay/86_400;
  const peakRps=averageRps*peakFactor;
  const dailyTransferGb=totalRequestsPerDay*dataMb/1024;

  const readAdjustment=(readPercent-scenario.defaultInputs.readPercent)*0.18;
  const cacheHitRate=clamp(scenario.baseCacheHitRate+readAdjustment,5,94);
  const databasePeakRps=peakRps*(1-cacheHitRate/100);
  const appServerPeakRps=peakRps;
  const objectStorageGbPerDay=dailyTransferGb*scenario.objectStorageShare;

  const loadRatio=peakRps/Math.max(1,(scenario.defaultInputs.dailyActiveUsers*scenario.defaultInputs.requestsPerUserPerDay/86_400)*scenario.defaultInputs.peakFactor);
  const writePressure=(100-readPercent)/Math.max(1,100-scenario.defaultInputs.readPercent);
  const averageLatencyMs=Math.round(clamp(
    scenario.baseLatencyMs + Math.max(0,loadRatio-1)*38 + Math.max(0,writePressure-1)*18 - Math.max(0,cacheHitRate-scenario.baseCacheHitRate)*0.7,
    35,
    950,
  ));
  const errorRate=Number(clamp(
    scenario.baseErrorRate + Math.max(0,loadRatio-1)*0.035 + Math.max(0,writePressure-1)*0.012,
    0.005,
    2.5,
  ).toFixed(3));

  const sampleRequest=Math.max(1,Math.round(averageRps));
  const logs=[
    "User request received  /api/resource/123",
    "Route to load balancer  ("+Math.round(peakRps).toLocaleString()+" peak req/s)",
    "Forward to app server  (node-1)",
    "Cache lookup  "+(cacheHitRate>=50?"HIT":"MISS")+" ("+cacheHitRate.toFixed(0)+"%)",
    "Return data  "+averageLatencyMs+" ms",
    "Capacity snapshot  "+sampleRequest.toLocaleString()+" avg req/s",
  ];

  const takeaways=[
    "Load balancer distributes peak traffic across application servers.",
    cacheHitRate.toFixed(0)+"% of eligible reads are served from cache in this scenario.",
    "Database peak load is about "+Math.round(databasePeakRps).toLocaleString()+" req/s after cache relief.",
    "Object storage handles about "+Math.round(objectStorageGbPerDay).toLocaleString()+" GB/day of large or durable payloads.",
    "Monitoring should track latency, errors, saturation and cache effectiveness.",
  ];

  return {
    totalRequestsPerDay,
    averageRps,
    peakRps,
    dailyTransferGb,
    cacheHitRate,
    databasePeakRps,
    appServerPeakRps,
    objectStorageGbPerDay,
    averageLatencyMs,
    errorRate,
    logs,
    takeaways,
  };
}

export function formatCompactNumber(value:number):string {
  if(value>=1_000_000_000) return (value/1_000_000_000).toFixed(value>=10_000_000_000?0:1).replace(/\.0$/,"")+"B";
  if(value>=1_000_000) return (value/1_000_000).toFixed(value>=10_000_000?0:1).replace(/\.0$/,"")+"M";
  if(value>=1_000) return (value/1_000).toFixed(value>=10_000?0:1).replace(/\.0$/,"")+"K";
  return Math.round(value).toString();
}
