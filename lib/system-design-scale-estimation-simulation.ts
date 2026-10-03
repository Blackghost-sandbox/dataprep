export type ScaleScenarioId = "video-streaming" | "ecommerce" | "social-media";

export type ScaleInputs = {
  dailyActiveUsers:number;
  requestsPerUserPerDay:number;
  dataPerRequestMb:number;
  retentionDays:number;
  peakMultiplier:number;
  compressionRatio:number;
  replicationFactor:number;
};

export type ScaleScenario = {
  id:ScaleScenarioId;
  label:string;
  shortLabel:string;
  inputs:ScaleInputs;
  storageMix:Array<{label:string;percent:number}>;
};

export type ScaleResult = {
  dailyRequests:number;
  averageQps:number;
  peakQps:number;
  roundedPeakQps:number;
  dailyIngestPb:number;
  annualRawPb:number;
  compressedPb:number;
  replicatedPb:number;
  breakdown:Array<{label:string;percent:number;pb:number}>;
};

export const scaleScenarios:ScaleScenario[]=[
  {
    id:"video-streaming",
    label:"Scenario 1: Video Streaming",
    shortLabel:"Video Streaming Platform",
    inputs:{dailyActiveUsers:10_000_000,requestsPerUserPerDay:100,dataPerRequestMb:1,retentionDays:365,peakMultiplier:10,compressionRatio:1,replicationFactor:1},
    storageMix:[
      {label:"Video Files",percent:70},
      {label:"Thumbnails",percent:10},
      {label:"Metadata",percent:5},
      {label:"Logs",percent:10},
      {label:"Other",percent:5},
    ],
  },
  {
    id:"ecommerce",
    label:"Scenario 2: E-commerce Marketplace",
    shortLabel:"E-commerce Marketplace",
    inputs:{dailyActiveUsers:4_000_000,requestsPerUserPerDay:65,dataPerRequestMb:.12,retentionDays:365,peakMultiplier:8,compressionRatio:.72,replicationFactor:2},
    storageMix:[
      {label:"Product Media",percent:40},
      {label:"Transactions",percent:25},
      {label:"Catalog",percent:15},
      {label:"Logs",percent:15},
      {label:"Other",percent:5},
    ],
  },
  {
    id:"social-media",
    label:"Scenario 3: Social Media Feed",
    shortLabel:"Social Media Feed",
    inputs:{dailyActiveUsers:25_000_000,requestsPerUserPerDay:160,dataPerRequestMb:.35,retentionDays:730,peakMultiplier:6,compressionRatio:.8,replicationFactor:2},
    storageMix:[
      {label:"Media",percent:62},
      {label:"Thumbnails",percent:12},
      {label:"Metadata",percent:10},
      {label:"Logs",percent:11},
      {label:"Other",percent:5},
    ],
  },
];

export function getScaleScenario(id:ScaleScenarioId):ScaleScenario{
  return scaleScenarios.find(item=>item.id===id)??scaleScenarios[0];
}

export function roundPeakQps(value:number):number{
  if(value>=100_000)return Math.round(value/10_000)*10_000;
  if(value>=10_000)return Math.round(value/1_000)*1_000;
  if(value>=1_000)return Math.round(value/100)*100;
  return Math.round(value);
}

export function calculateScale(scenario:ScaleScenario,inputs:ScaleInputs):ScaleResult{
  const users=Math.max(1,inputs.dailyActiveUsers);
  const reqPerUser=Math.max(1,inputs.requestsPerUserPerDay);
  const dataMb=Math.max(.001,inputs.dataPerRequestMb);
  const retentionDays=Math.max(1,inputs.retentionDays);
  const peak=Math.max(1,inputs.peakMultiplier);
  const compression=Math.max(.05,Math.min(1,inputs.compressionRatio));
  const replication=Math.max(1,inputs.replicationFactor);

  const dailyRequests=users*reqPerUser;
  const averageQps=dailyRequests/86_400;
  const peakQps=averageQps*peak;
  const roundedPeakQps=roundPeakQps(peakQps);
  const dailyIngestPb=(dailyRequests*dataMb)/1_000_000_000;
  const annualRawPb=dailyIngestPb*retentionDays;
  const compressedPb=annualRawPb*compression;
  const replicatedPb=compressedPb*replication;
  const breakdown=scenario.storageMix.map(item=>({...item,pb:annualRawPb*item.percent/100}));

  return {dailyRequests,averageQps,peakQps,roundedPeakQps,dailyIngestPb,annualRawPb,compressedPb,replicatedPb,breakdown};
}

export function compact(value:number):string{
  if(value>=1_000_000_000)return (value/1_000_000_000).toFixed(value>=10_000_000_000?0:1).replace(/\.0$/,"")+"B";
  if(value>=1_000_000)return (value/1_000_000).toFixed(value>=10_000_000?0:1).replace(/\.0$/,"")+"M";
  if(value>=1_000)return (value/1_000).toFixed(value>=10_000?0:1).replace(/\.0$/,"")+"K";
  return Math.round(value).toString();
}

export function formatPb(value:number):string{
  if(value>=100)return Math.round(value)+" PB";
  if(value>=10)return value.toFixed(1).replace(/\.0$/,"")+" PB";
  if(value>=1)return value.toFixed(1)+" PB";
  const tb=value*1000;
  return (tb>=100?Math.round(tb):Number(tb.toFixed(1)))+" TB";
}
