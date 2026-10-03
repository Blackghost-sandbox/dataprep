export type DeliveryMode = "at-most-once" | "at-least-once" | "exactly-once";
export type DeliveryScenario = "normal" | "consumer-crash" | "retry";
export type SimulationSpeed = "slow" | "normal" | "fast";
export type DeliveryEventRole = "PRODUCER" | "BROKER" | "CONSUMER" | "COMMIT" | "RETRY" | "TXN";

export type DeliveryEvent = {
  id:string;
  time:string;
  role:DeliveryEventRole;
  text:string;
  state?:"success"|"warning"|"error"|"info";
};

export type DeliveryRecord = {
  id:number;
  partition:0|1|2;
  offset:number;
  status:"available"|"fetched"|"processed"|"duplicate"|"lost";
};

export type DeliveryState = {
  mode:DeliveryMode;
  scenario:DeliveryScenario;
  speed:SimulationSpeed;
  currentOrder:number;
  selectedPartition:0|1|2;
  committedOffset:number;
  nextOffset:number;
  lag:number;
  messagesInLog:number;
  processedCount:number;
  duplicateCount:number;
  lostCount:number;
  retryCount:number;
  running:boolean;
  sequence:number;
  records:DeliveryRecord[];
  events:DeliveryEvent[];
  status:string;
};

export const deliveryModes:Array<{id:DeliveryMode;label:string;subtitle:string}> = [
  {id:"at-most-once",label:"At-most-once",subtitle:"Fastest. May lose messages. No retries."},
  {id:"at-least-once",label:"At-least-once",subtitle:"Retries on failure. May process duplicates."},
  {id:"exactly-once",label:"Exactly-once",subtitle:"Kafka transactional path avoids duplicate Kafka-visible results."},
];

export const deliveryScenarios:Array<{id:DeliveryScenario;label:string}> = [
  {id:"normal",label:"Normal Flow"},
  {id:"consumer-crash",label:"Consumer Crash Before Commit"},
  {id:"retry",label:"Producer / Network Retry"},
];

function clock(sequence:number){
  const total=10*3600+24*60+1+sequence;
  const h=Math.floor(total/3600)%24;
  const m=Math.floor((total%3600)/60);
  const s=total%60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function seedRecords():DeliveryRecord[]{
  return [
    {id:1040,partition:0,offset:209,status:"processed"},
    {id:1041,partition:0,offset:210,status:"processed"},
    {id:1042,partition:0,offset:211,status:"fetched"},
    {id:200,partition:1,offset:209,status:"available"},
    {id:201,partition:1,offset:210,status:"available"},
    {id:202,partition:1,offset:211,status:"available"},
    {id:300,partition:2,offset:209,status:"available"},
    {id:301,partition:2,offset:210,status:"available"},
    {id:302,partition:2,offset:211,status:"available"},
  ];
}

export function createDeliveryState():DeliveryState{
  return {
    mode:"at-least-once",
    scenario:"consumer-crash",
    speed:"slow",
    currentOrder:1042,
    selectedPartition:0,
    committedOffset:211,
    nextOffset:213,
    lag:0,
    messagesInLog:5,
    processedCount:2,
    duplicateCount:0,
    lostCount:0,
    retryCount:0,
    running:false,
    sequence:8,
    records:seedRecords(),
    events:[
      {id:"seed-0",time:"10:24:01",role:"PRODUCER",text:"Sent order 1042 to partition 0",state:"info"},
      {id:"seed-1",time:"10:24:01",role:"BROKER",text:"Appended to P0 log (offset 211)",state:"success"},
      {id:"seed-2",time:"10:24:02",role:"CONSUMER",text:"Fetched offset 211",state:"info"},
      {id:"seed-3",time:"10:24:02",role:"CONSUMER",text:"Processed order 1042",state:"success"},
      {id:"seed-4",time:"10:24:03",role:"PRODUCER",text:"Sent order 1043 to partition 0",state:"info"},
      {id:"seed-5",time:"10:24:03",role:"BROKER",text:"Appended to P0 log (offset 212)",state:"success"},
      {id:"seed-6",time:"10:24:04",role:"CONSUMER",text:"Fetched offset 212",state:"info"},
      {id:"seed-7",time:"10:24:04",role:"CONSUMER",text:"Processed order 1043",state:"success"},
    ],
    status:"At-least-once selected. A crash after processing but before commit can replay the same offset.",
  };
}

export function setDeliveryMode(state:DeliveryState,mode:DeliveryMode):DeliveryState{
  return {
    ...state,
    mode,
    status:mode==="at-most-once"
      ?"At-most-once selected. Commit can happen before processing, so a crash may lose an effect."
      :mode==="at-least-once"
        ?"At-least-once selected. Process before commit, so a crash can replay and duplicate work."
        :"Exactly-once selected for Kafka transactional processing. External side effects still require sink cooperation or idempotency.",
  };
}

export function setDeliveryScenario(state:DeliveryState,scenario:DeliveryScenario):DeliveryState{
  return {...state,scenario,status:`Scenario changed to ${deliveryScenarios.find(item=>item.id===scenario)?.label??scenario}.`};
}

export function setDeliverySpeed(state:DeliveryState,speed:SimulationSpeed):DeliveryState{
  return {...state,speed,status:`Simulation speed set to ${speed}.`};
}

function append(state:DeliveryState,events:DeliveryEvent[],patch:Partial<DeliveryState>,status:string):DeliveryState{
  return {
    ...state,
    ...patch,
    sequence:state.sequence+events.length,
    events:[...state.events,...events].slice(-32),
    status,
    running:false,
  };
}

function updateP0Record(state:DeliveryState,offset:number,status:DeliveryRecord["status"]){
  return state.records.map(record=>record.partition===0&&record.offset===offset?{...record,status}:record);
}

export function runDeliverySimulation(state:DeliveryState):DeliveryState{
  const order=state.currentOrder+1;
  const offset=state.nextOffset;
  const baseEvents:DeliveryEvent[]=[
    {id:`producer-${state.sequence}`,time:clock(state.sequence),role:"PRODUCER",text:`Sent order ${order} to partition 0`,state:"info"},
    {id:`broker-${state.sequence}`,time:clock(state.sequence),role:"BROKER",text:`Appended to P0 log (offset ${offset})`,state:"success"},
  ];

  let records=[...state.records,{id:order,partition:0 as const,offset,status:"available" as const}].slice(-12);
  const nextOffset=offset+1;
  const messagesInLog=state.messagesInLog+1;

  if(state.mode==="at-most-once"){
    const committed=offset+1;
    const events=[...baseEvents,
      {id:`commit-${state.sequence}`,time:clock(state.sequence+1),role:"COMMIT" as const,text:`Committed next offset ${committed} before processing`,state:"warning" as const},
      {id:`fetch-${state.sequence}`,time:clock(state.sequence+1),role:"CONSUMER" as const,text:`Fetched offset ${offset}`,state:"info" as const},
    ];
    if(state.scenario==="consumer-crash"){
      events.push({id:`lost-${state.sequence}`,time:clock(state.sequence+2),role:"CONSUMER",text:`Consumer crashed before processing offset ${offset}; committed position already advanced`,state:"error"});
      records=records.map(record=>record.partition===0&&record.offset===offset?{...record,status:"lost" as const}:record);
      return append(state,events,{currentOrder:order,nextOffset,committedOffset:committed,messagesInLog,lostCount:state.lostCount+1,records},`At-most-once outcome: order ${order} was lost after commit-before-process.`);
    }
    records=records.map(record=>record.partition===0&&record.offset===offset?{...record,status:"processed" as const}:record);
    events.push({id:`process-${state.sequence}`,time:clock(state.sequence+2),role:"CONSUMER",text:`Processed order ${order}`,state:"success"});
    return append(state,events,{currentOrder:order,nextOffset,committedOffset:committed,messagesInLog,processedCount:state.processedCount+1,records},`At-most-once completed without failure for order ${order}.`);
  }

  if(state.mode==="at-least-once"){
    const events=[...baseEvents,
      {id:`fetch-${state.sequence}`,time:clock(state.sequence+1),role:"CONSUMER" as const,text:`Fetched offset ${offset}`,state:"info" as const},
      {id:`process-${state.sequence}`,time:clock(state.sequence+1),role:"CONSUMER" as const,text:`Processed order ${order}`,state:"success" as const},
    ];
    if(state.scenario!=="normal"){
      events.push(
        {id:`crash-${state.sequence}`,time:clock(state.sequence+2),role:"CONSUMER",text:`Crash before committing offset ${offset+1}`,state:"error"},
        {id:`retry-${state.sequence}`,time:clock(state.sequence+3),role:"RETRY",text:`Re-fetched offset ${offset} after restart`,state:"warning"},
        {id:`duplicate-${state.sequence}`,time:clock(state.sequence+3),role:"CONSUMER",text:`Processed order ${order} again (duplicate effect possible)`,state:"warning"},
        {id:`commit-${state.sequence}`,time:clock(state.sequence+4),role:"COMMIT",text:`Committed next offset ${offset+1}`,state:"success"},
      );
      records=records.map(record=>record.partition===0&&record.offset===offset?{...record,status:"duplicate" as const}:record);
      return append(state,events,{currentOrder:order,nextOffset,committedOffset:offset+1,messagesInLog,processedCount:state.processedCount+2,duplicateCount:state.duplicateCount+1,retryCount:state.retryCount+1,records},`At-least-once outcome: order ${order} was replayed and may have produced a duplicate effect.`);
    }
    events.push({id:`commit-${state.sequence}`,time:clock(state.sequence+2),role:"COMMIT",text:`Committed next offset ${offset+1}`,state:"success"});
    records=records.map(record=>record.partition===0&&record.offset===offset?{...record,status:"processed" as const}:record);
    return append(state,events,{currentOrder:order,nextOffset,committedOffset:offset+1,messagesInLog,processedCount:state.processedCount+1,records},`At-least-once completed normally for order ${order}; no replay occurred this run.`);
  }

  const events=[...baseEvents,
    {id:`txn-begin-${state.sequence}`,time:clock(state.sequence+1),role:"TXN" as const,text:"Began Kafka transaction for read-process-write",state:"info" as const},
    {id:`fetch-${state.sequence}`,time:clock(state.sequence+1),role:"CONSUMER" as const,text:`Fetched offset ${offset}`,state:"info" as const},
    {id:`process-${state.sequence}`,time:clock(state.sequence+2),role:"CONSUMER" as const,text:`Processed order ${order} inside transaction`,state:"success" as const},
  ];
  if(state.scenario==="consumer-crash"){
    events.push(
      {id:`abort-${state.sequence}`,time:clock(state.sequence+3),role:"TXN",text:"Crash detected; aborted uncommitted transaction",state:"warning"},
      {id:`replay-${state.sequence}`,time:clock(state.sequence+4),role:"RETRY",text:`Replayed offset ${offset} in a new transaction`,state:"info"},
    );
  }
  events.push({id:`txn-commit-${state.sequence}`,time:clock(state.sequence+5),role:"TXN",text:`Committed output + next offset ${offset+1} atomically within Kafka`,state:"success"});
  records=records.map(record=>record.partition===0&&record.offset===offset?{...record,status:"processed" as const}:record);
  return append(state,events,{currentOrder:order,nextOffset,committedOffset:offset+1,messagesInLog,processedCount:state.processedCount+1,retryCount:state.scenario==="consumer-crash"?state.retryCount+1:state.retryCount,records},`Exactly-once Kafka transaction completed for order ${order}. External database/email side effects still need compatible idempotency or transactions.`);
}

export function clearDeliveryEvents(state:DeliveryState){
  return {...state,events:[]};
}
