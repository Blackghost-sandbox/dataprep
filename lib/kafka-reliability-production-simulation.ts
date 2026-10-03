export type ReliabilityScenarioId = "high-throughput" | "poison-message" | "broker-degradation" | "consumer-lag-spike";

export type ReliabilityEventRole = "PRODUCER" | "BROKER" | "CONSUMER" | "RETRY" | "DLQ" | "MONITOR";

export type ReliabilityEvent = {
  id:string;
  time:string;
  role:ReliabilityEventRole;
  text:string;
  status?:"success"|"failed"|"warning"|"info";
};

export type FailedMessage = {
  order_id:string;
  customer_id:string;
  amount:number;
  currency:string;
  items:Array<{sku:string;qty:number}>;
  eventTime:string;
  eventId:string;
  error:string;
  retryCount:number;
};

export type ReliabilityState = {
  scenario:ReliabilityScenarioId;
  acksAll:boolean;
  idempotentProducer:boolean;
  retries:number;
  dlqEnabled:boolean;
  autoCommit:boolean;
  sendRate:number;
  throughput:number;
  processed:number;
  failed:number;
  consumerLag:number;
  retryAttempts:number;
  retryQueue:number;
  dlqMessages:number;
  avgLatencyMs:number;
  errorRate:number;
  brokerHealth:number;
  partitions:number;
  replicationFactor:number;
  isr:number;
  sequence:number;
  events:ReliabilityEvent[];
  failedMessage:FailedMessage;
  status:string;
};

export const reliabilityScenarios:Array<{id:ReliabilityScenarioId;label:string}> = [
  {id:"high-throughput",label:"High Throughput Orders"},
  {id:"poison-message",label:"Poison Message / DLQ"},
  {id:"broker-degradation",label:"Broker Degradation"},
  {id:"consumer-lag-spike",label:"Consumer Lag Spike"},
];

function clock(sequence:number){
  const total=10*3600+24*60+1+sequence;
  const h=Math.floor(total/3600)%24;
  const m=Math.floor((total%3600)/60);
  const s=total%60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function baseFailedMessage():FailedMessage{
  return {
    order_id:"ORDER-1002",
    customer_id:"CUST-7791",
    amount:259.99,
    currency:"USD",
    items:[{sku:"SKU-11",qty:2}],
    eventTime:"2024-10-20T10:24:04Z",
    eventId:"evt-9f3a2f",
    error:"validation_failed: missing shipping_address",
    retryCount:3,
  };
}

export function createReliabilityState():ReliabilityState{
  return {
    scenario:"high-throughput",
    acksAll:true,
    idempotentProducer:true,
    retries:3,
    dlqEnabled:true,
    autoCommit:false,
    sendRate:500,
    throughput:498,
    processed:497,
    failed:3,
    consumerLag:12,
    retryAttempts:2,
    retryQueue:1,
    dlqMessages:2,
    avgLatencyMs:42,
    errorRate:0.6,
    brokerHealth:3,
    partitions:3,
    replicationFactor:3,
    isr:3,
    sequence:10,
    events:[
      {id:"seed-0",time:"10:24:01",role:"PRODUCER",text:"Sent order event ORDER-1003",status:"info"},
      {id:"seed-1",time:"10:24:01",role:"BROKER",text:"Acknowledged (acks=all) partition-1",status:"success"},
      {id:"seed-2",time:"10:24:02",role:"CONSUMER",text:"Processing ORDER-1001 success 42ms",status:"success"},
      {id:"seed-3",time:"10:24:03",role:"PRODUCER",text:"Sent order event ORDER-1002",status:"info"},
      {id:"seed-4",time:"10:24:03",role:"BROKER",text:"Acknowledged (acks=all) partition-0",status:"success"},
      {id:"seed-5",time:"10:24:04",role:"CONSUMER",text:"Processing ORDER-1002 failed (timeout)",status:"failed"},
      {id:"seed-6",time:"10:24:04",role:"RETRY",text:"Scheduled retry 1/3 in 5s",status:"warning"},
      {id:"seed-7",time:"10:24:09",role:"CONSUMER",text:"Processing ORDER-1002 failed (validation)",status:"failed"},
      {id:"seed-8",time:"10:24:09",role:"DLQ",text:"Moved to DLQ ORDER-1002",status:"failed"},
      {id:"seed-9",time:"10:24:10",role:"CONSUMER",text:"Processing ORDER-1003 success 38ms",status:"success"},
    ],
    failedMessage:baseFailedMessage(),
    status:"Production profile is healthy: durable writes, bounded retries, DLQ protection and manual commit control are enabled.",
  };
}

export function setReliabilityScenario(state:ReliabilityState,scenario:ReliabilityScenarioId):ReliabilityState{
  return {...state,scenario,status:`Scenario changed to ${reliabilityScenarios.find(item=>item.id===scenario)?.label??scenario}.`};
}

export function setReliabilityOption(state:ReliabilityState,key:"acksAll"|"idempotentProducer"|"dlqEnabled"|"autoCommit",value:boolean):ReliabilityState{
  return {...state,[key]:value,status:`${key} is now ${value?"enabled":"disabled"}.`};
}

export function setReliabilityRetries(state:ReliabilityState,retries:number):ReliabilityState{
  return {...state,retries:Math.max(0,Math.min(8,retries)),status:`Retry policy set to ${retries} attempt(s).`};
}

function append(state:ReliabilityState,events:ReliabilityEvent[],patch:Partial<ReliabilityState>,status:string):ReliabilityState{
  return {
    ...state,
    ...patch,
    sequence:state.sequence+events.length,
    events:[...state.events,...events].slice(-40),
    status,
  };
}

export function runReliabilitySimulation(state:ReliabilityState):ReliabilityState{
  if(state.scenario==="poison-message"){
    const events:ReliabilityEvent[]=[
      {id:`consumer-${state.sequence}`,time:clock(state.sequence),role:"CONSUMER",text:"Processing ORDER-2001 failed (schema validation)",status:"failed"},
      {id:`retry-${state.sequence}`,time:clock(state.sequence+1),role:"RETRY",text:`Retry attempt ${Math.min(state.retryAttempts+1,state.retries)}/${state.retries}`,status:"warning"},
      {id:`dlq-${state.sequence}`,time:clock(state.sequence+2),role:"DLQ",text:"Poison message routed to orders.DLQ",status:"failed"},
    ];
    return append(
      state,
      events,
      {
        processed:state.processed+1,
        failed:state.failed+1,
        retryAttempts:Math.min(state.retries,state.retryAttempts+1),
        retryQueue:Math.max(0,state.retryQueue-1),
        dlqMessages:state.dlqEnabled?state.dlqMessages+1:state.dlqMessages,
        errorRate:Number((state.errorRate+0.2).toFixed(1)),
        avgLatencyMs:58,
      },
      state.dlqEnabled
        ?"Poison message exhausted its bounded retry path and was quarantined in the DLQ."
        :"DLQ is disabled; the poison message remains an operational risk and can block safe progress."
    );
  }

  if(state.scenario==="broker-degradation"){
    const degraded=Math.max(1,state.brokerHealth-1);
    const events:ReliabilityEvent[]=[
      {id:`broker-${state.sequence}`,time:clock(state.sequence),role:"BROKER",text:"Broker-2 became unavailable",status:"failed"},
      {id:`broker-isr-${state.sequence}`,time:clock(state.sequence+1),role:"BROKER",text:`ISR reduced to ${Math.max(1,state.isr-1)}/${state.replicationFactor}`,status:"warning"},
      {id:`monitor-${state.sequence}`,time:clock(state.sequence+2),role:"MONITOR",text:"Broker health alert fired",status:"warning"},
    ];
    return append(
      state,
      events,
      {
        brokerHealth:degraded,
        isr:Math.max(1,state.isr-1),
        throughput:Math.max(340,state.throughput-70),
        avgLatencyMs:76,
        consumerLag:state.consumerLag+18,
        errorRate:Number((state.errorRate+0.3).toFixed(1)),
      },
      `Broker degradation detected: ${degraded}/3 brokers healthy and ISR is ${Math.max(1,state.isr-1)}/3.`
    );
  }

  if(state.scenario==="consumer-lag-spike"){
    const events:ReliabilityEvent[]=[
      {id:`producer-${state.sequence}`,time:clock(state.sequence),role:"PRODUCER",text:"Traffic burst: 760 msg/s",status:"info"},
      {id:`consumer-${state.sequence}`,time:clock(state.sequence+1),role:"CONSUMER",text:"Consumer processing capacity saturated",status:"warning"},
      {id:`monitor-${state.sequence}`,time:clock(state.sequence+2),role:"MONITOR",text:"Consumer lag threshold exceeded",status:"warning"},
    ];
    return append(
      state,
      events,
      {
        sendRate:760,
        throughput:520,
        consumerLag:state.consumerLag+65,
        avgLatencyMs:88,
        errorRate:Number((state.errorRate+0.1).toFixed(1)),
      },
      "Consumer lag spiked because input rate exceeded processing capacity. Scale consumers or reduce bottlenecks before changing durability settings."
    );
  }

  const nextProcessed=state.processed+Math.max(1,Math.round(state.throughput/100));
  const events:ReliabilityEvent[]=[
    {id:`producer-${state.sequence}`,time:clock(state.sequence),role:"PRODUCER",text:"Sent high-throughput order batch",status:"info"},
    {id:`broker-${state.sequence}`,time:clock(state.sequence),role:"BROKER",text:`Acknowledged batch (${state.acksAll?"acks=all":"reduced acks"})`,status:state.acksAll?"success":"warning"},
    {id:`consumer-${state.sequence}`,time:clock(state.sequence+1),role:"CONSUMER",text:"Processed batch successfully",status:"success"},
    {id:`monitor-${state.sequence}`,time:clock(state.sequence+1),role:"MONITOR",text:"Latency and lag remain within target",status:"success"},
  ];
  return append(
    state,
    events,
    {
      processed:nextProcessed,
      throughput:state.idempotentProducer?498:505,
      consumerLag:Math.max(0,state.consumerLag-3),
      avgLatencyMs:Math.max(30,state.avgLatencyMs-2),
      errorRate:Math.max(0.2,Number((state.errorRate-0.1).toFixed(1))),
    },
    state.acksAll&&state.idempotentProducer
      ?"High-throughput run completed with durable writes and replay-safe producer semantics."
      :"Throughput increased, but durability or duplicate-prevention protections are weaker."
  );
}

export function clearReliabilityEvents(state:ReliabilityState){
  return {...state,events:[]};
}
