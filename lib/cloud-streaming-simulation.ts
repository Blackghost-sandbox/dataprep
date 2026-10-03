export type StreamingPlatformId = "kafka" | "kinesis" | "pubsub" | "eventhubs";
export type EventTypeId = "orders" | "clickstream" | "iot" | "payments";
export type PartitionKeyId = "user_id" | "order_id" | "device_id" | "region";
export type DeliverySemanticId = "at-most-once" | "at-least-once" | "exactly-once";

export type StreamingControls = {
  platform: StreamingPlatformId;
  eventType: EventTypeId;
  eventsPerSecond: number;
  partitionKey: PartitionKeyId;
  partitions: number;
  consumerGroup: string;
  consumers: number;
};

export type PartitionState = {
  id:number;
  events:number;
  keys:string[];
};

export type ConsumerState = {
  id:number;
  rate:number;
  lag:number;
  partitions:number[];
};

export type ProcessedEvent = {
  event_id:string;
  user_id:string;
  product:string;
  amount:number;
  event_time:string;
  partition:number;
  processed_at:string;
};

export type StreamingMetrics = {
  ingressRate:number;
  processingRate:number;
  totalLag:number;
  partitions:number;
  consumers:number;
  retentionHours:number;
};

export type StreamingSimulationState = {
  running:boolean;
  partitions:PartitionState[];
  consumers:ConsumerState[];
  events:ProcessedEvent[];
  metrics:StreamingMetrics;
  status:string;
};

export const streamingPlatforms = {
  kafka:{
    label:"Apache Kafka (Self-Managed)",
    short:"Kafka",
    retentionHours:168,
    partitionWord:"Partitions",
    consumerWord:"Consumer Group",
    delivery:"At Least Once",
  },
  kinesis:{
    label:"Amazon Kinesis",
    short:"Kinesis",
    retentionHours:24,
    partitionWord:"Shards",
    consumerWord:"Consumer App",
    delivery:"At Least Once",
  },
  pubsub:{
    label:"Google Cloud Pub/Sub",
    short:"Pub/Sub",
    retentionHours:168,
    partitionWord:"Ordering Keys",
    consumerWord:"Subscription",
    delivery:"At Least Once",
  },
  eventhubs:{
    label:"Azure Event Hubs",
    short:"Event Hubs",
    retentionHours:24,
    partitionWord:"Partitions",
    consumerWord:"Consumer Group",
    delivery:"At Least Once",
  },
} satisfies Record<StreamingPlatformId,{
  label:string;short:string;retentionHours:number;partitionWord:string;consumerWord:string;delivery:string;
}>;

export const eventTypes = {
  orders:{label:"E-commerce Orders",product:"laptop",baseAmount:1200},
  clickstream:{label:"Clickstream Events",product:"page_view",baseAmount:0},
  iot:{label:"IoT Sensor Events",product:"sensor_reading",baseAmount:42},
  payments:{label:"Payment Events",product:"payment",baseAmount:800},
} satisfies Record<EventTypeId,{label:string;product:string;baseAmount:number}>;

export const partitionKeys = {
  user_id:"user_id",
  order_id:"order_id",
  device_id:"device_id",
  region:"region",
} satisfies Record<PartitionKeyId,string>;

export function defaultStreamingControls():StreamingControls{
  return {
    platform:"kafka",
    eventType:"orders",
    eventsPerSecond:10,
    partitionKey:"user_id",
    partitions:3,
    consumerGroup:"order-processor",
    consumers:2,
  };
}

function seedPartitionCounts(partitions:number){
  if(partitions===3)return [12,9,11];
  return Array.from({length:partitions},(_,index)=>8+((index*7+4)%6));
}

function seededConsumers(partitions:number,consumers:number,eps:number):ConsumerState[]{
  return Array.from({length:consumers},(_,index)=>{
    const owned=Array.from({length:partitions},(_,p)=>p).filter(p=>p%consumers===index);
    return {
      id:index+1,
      rate:Math.max(1,Math.round(eps*(.8-index*.08))),
      lag:Math.max(0,2+index),
      partitions:owned,
    };
  });
}

function seedEvents(partitions:number,eventType:EventTypeId):ProcessedEvent[]{
  const meta=eventTypes[eventType];
  return [
    {
      event_id:"evt_7832",
      user_id:"u_1001",
      product:meta.product,
      amount:meta.baseAmount,
      event_time:"2026-10-01T10:24:32Z",
      partition:Math.min(1,partitions-1),
      processed_at:"2026-10-01T10:24:33Z",
    },
    {
      event_id:"evt_7833",
      user_id:"u_2045",
      product:eventType==="orders"?"phone":meta.product,
      amount:eventType==="orders"?800:meta.baseAmount,
      event_time:"2026-10-01T10:24:32Z",
      partition:Math.min(2,partitions-1),
      processed_at:"2026-10-01T10:24:33Z",
    },
  ];
}

export function referenceStreamingState():StreamingSimulationState{
  const controls=defaultStreamingControls();
  const counts=seedPartitionCounts(controls.partitions);
  return {
    running:true,
    partitions:counts.map((events,id)=>({id,events,keys:[]})),
    consumers:seededConsumers(controls.partitions,controls.consumers,controls.eventsPerSecond),
    events:seedEvents(controls.partitions,controls.eventType),
    metrics:{
      ingressRate:10,
      processingRate:15,
      totalLag:5,
      partitions:3,
      consumers:2,
      retentionHours:168,
    },
    status:"Streaming pipeline is running with partitioned delivery and independent consumers.",
  };
}

export function stablePartition(key:string,partitions:number){
  let hash=0;
  for(let i=0;i<key.length;i++)hash=(hash*31+key.charCodeAt(i))>>>0;
  return hash%Math.max(1,partitions);
}

export function simulateStreaming(controls:StreamingControls):StreamingSimulationState{
  const platform=streamingPlatforms[controls.platform];
  const baseCounts=seedPartitionCounts(controls.partitions);
  const scale=Math.max(.2,controls.eventsPerSecond/10);
  const partitions=baseCounts.map((count,id)=>({
    id,
    events:Math.max(1,Math.round(count*scale)),
    keys:[],
  }));
  const consumers=seededConsumers(controls.partitions,controls.consumers,controls.eventsPerSecond);
  const processingRate=consumers.reduce((sum,c)=>sum+c.rate,0);
  const totalLag=consumers.reduce((sum,c)=>sum+c.lag,0);
  return {
    running:true,
    partitions,
    consumers,
    events:seedEvents(controls.partitions,controls.eventType),
    metrics:{
      ingressRate:controls.eventsPerSecond,
      processingRate,
      totalLag,
      partitions:controls.partitions,
      consumers:controls.consumers,
      retentionHours:platform.retentionHours,
    },
    status:`${platform.short} is processing ${controls.eventsPerSecond} events/sec across ${controls.partitions} ${platform.partitionWord.toLowerCase()}.`,
  };
}

export function sendPartitionedEvent(state:StreamingSimulationState,key:string,partitions:number){
  const target=stablePartition(key,partitions);
  return {
    target,
    partitions:state.partitions.map(partition=>partition.id===target
      ? {...partition,events:partition.events+1,keys:[...partition.keys,key].slice(-5)}
      : partition
    ),
  };
}

export const deliverySemantics = [
  {
    id:"at-most-once" as DeliverySemanticId,
    label:"At Most Once",
    bullets:["Lowest latency","No duplicates","Possible data loss"],
    useCase:"metrics, logs",
    tone:"red",
  },
  {
    id:"at-least-once" as DeliverySemanticId,
    label:"At Least Once",
    bullets:["No data loss","Possible duplicates","Requires idempotent processing"],
    useCase:"event processing, ETL",
    tone:"blue",
  },
  {
    id:"exactly-once" as DeliverySemanticId,
    label:"Exactly Once",
    bullets:["No data loss","No duplicates","Higher overhead"],
    useCase:"financial transactions",
    tone:"green",
  },
];
