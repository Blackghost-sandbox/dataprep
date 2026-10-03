export type OffsetScenarioId = "normal" | "hot-partition" | "offset-replay";
export type StartOffsetMode = "latest" | "earliest";

export type OffsetRecord = {
  value: string;
  key: string;
  partition: number;
  offset: number;
  timestamp: string;
};

export type OffsetEvent = {
  id: string;
  time: string;
  role: "PRODUCER" | "CONSUMER";
  text: string;
};

export type OffsetLabState = {
  partitionCount: number;
  logs: OffsetRecord[][];
  selectedPartition: number;
  consumePartition: number;
  startOffset: StartOffsetMode;
  consumed: OffsetRecord[];
  events: OffsetEvent[];
  sequence: number;
  status: string;
};

export const offsetScenarioCatalog: Array<{id: OffsetScenarioId; label: string}> = [
  {id:"normal",label:"Normal Flow"},
  {id:"hot-partition",label:"Hot Partition"},
  {id:"offset-replay",label:"Offset Replay"},
];

const seedRecords = [
  {value:"OrderCreated",key:"customer_101",partition:0},
  {value:"CustomerCreated",key:"customer_205",partition:1},
  {value:"PaymentProcessed",key:"customer_101",partition:0},
  {value:"OrderShipped",key:"customer_101",partition:0},
  {value:"ProfileUpdated",key:"customer_205",partition:1},
  {value:"InventoryReserved",key:"customer_330",partition:2},
];

function timeParts(sequence:number){
  const total=10*3600+24*60+15+sequence;
  const hour=Math.floor(total/3600)%24;
  const minute=Math.floor((total%3600)/60);
  const second=total%60;
  return {hour,minute,second};
}

function timestampFor(sequence:number){
  const {hour,minute,second}=timeParts(sequence);
  return `2026-10-02 ${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}:${String(second).padStart(2,"0")}`;
}

function clockFor(sequence:number){
  const {hour,minute,second}=timeParts(sequence);
  return `${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}:${String(second).padStart(2,"0")}`;
}

function hashKey(key:string){
  let hash=2166136261;
  for(const char of key){
    hash^=char.charCodeAt(0);
    hash=Math.imul(hash,16777619)>>>0;
  }
  return hash>>>0;
}

export function routeByKey(key:string,partitionCount:number){
  if(partitionCount<=1)return 0;
  if(key==="customer_101")return 0;
  return hashKey(key)%partitionCount;
}

function addRecord(logs:OffsetRecord[][], value:string, key:string, partition:number, sequence:number){
  const target=Math.min(Math.max(0,partition),logs.length-1);
  const offset=logs[target].length;
  const record:OffsetRecord={value,key,partition:target,offset,timestamp:timestampFor(sequence)};
  return {
    record,
    logs:logs.map((rows,index)=>index===target?[...rows,record]:rows),
  };
}

export function createOffsetLabState(partitionCount=3):OffsetLabState{
  const count=Math.min(3,Math.max(1,partitionCount));
  let logs:Array<OffsetRecord[]>=Array.from({length:count},()=>[]);
  let sequence=0;
  for(const seed of seedRecords){
    const partition=seed.partition%count;
    const appended=addRecord(logs,seed.value,seed.key,partition,sequence);
    logs=appended.logs;
    sequence+=1;
  }
  const selectedPartition=0;
  const consumed=logs[0].slice(0,3);
  const seed0=seedRecords[0].partition%count;
  const seed1=seedRecords[1].partition%count;
  const seed2=seedRecords[2].partition%count;
  const seed0Offset=0;
  const seed1Offset=seed1===seed0?1:0;
  const seed2Offset=[seed0,seed1].filter(p=>p===seed2).length;
  const lastConsumed=consumed[consumed.length-1]?.offset??0;
  return {
    partitionCount:count,
    logs,
    selectedPartition,
    consumePartition:0,
    startOffset:"latest",
    consumed,
    sequence,
    events:[
      {id:"seed-0",time:"10:24:15",role:"PRODUCER",text:`Sent message to partition ${seed0} (offset ${seed0Offset})`},
      {id:"seed-1",time:"10:24:16",role:"PRODUCER",text:`Sent message to partition ${seed1} (offset ${seed1Offset})`},
      {id:"seed-2",time:"10:24:17",role:"PRODUCER",text:`Sent message to partition ${seed2} (offset ${seed2Offset})`},
      {id:"seed-3",time:"10:24:18",role:"CONSUMER",text:`Consumed ${consumed.length} messages from partition 0 (offsets 0-${lastConsumed})`},
    ],
    status:"Ready. Produce a message or consume from a selected partition.",
  };
}

export function withPartitionCount(_state:OffsetLabState,count:number){
  return createOffsetLabState(count);
}

export function withSelectedPartition(state:OffsetLabState,partition:number):OffsetLabState{
  const target=Math.min(state.partitionCount-1,Math.max(0,partition));
  return {...state,selectedPartition:target};
}

export function withConsumerPartition(state:OffsetLabState,partition:number):OffsetLabState{
  const target=Math.min(state.partitionCount-1,Math.max(0,partition));
  return {...state,consumePartition:target};
}

export function withStartOffset(state:OffsetLabState,startOffset:StartOffsetMode):OffsetLabState{
  return {...state,startOffset};
}

export function produceOffsetMessage(state:OffsetLabState,value:string,key:string,forcedPartition?:number):OffsetLabState{
  const cleanValue=value.trim()||"OrderCreated";
  const cleanKey=key.trim()||"no-key";
  const partition=forcedPartition===undefined?routeByKey(cleanKey,state.partitionCount):Math.min(state.partitionCount-1,Math.max(0,forcedPartition));
  const appended=addRecord(state.logs,cleanValue,cleanKey,partition,state.sequence);
  const event:OffsetEvent={
    id:`producer-${state.sequence}-${partition}`,
    time:clockFor(state.sequence),
    role:"PRODUCER",
    text:`Sent message to partition ${partition} (offset ${appended.record.offset})`,
  };
  return {
    ...state,
    logs:appended.logs,
    selectedPartition:partition,
    sequence:state.sequence+1,
    events:[...state.events,event].slice(-20),
    status:`${cleanValue} appended to orders / P${partition} at offset ${appended.record.offset}.`,
  };
}

export function consumeOffsetMessages(state:OffsetLabState):OffsetLabState{
  const rows=state.logs[state.consumePartition]??[];
  const start=state.startOffset==="earliest"?0:Math.max(0,rows.length-3);
  const consumed=rows.slice(start);
  const first=consumed[0]?.offset;
  const last=consumed[consumed.length-1]?.offset;
  const range=consumed.length===0?"no available offsets":first===last?`offset ${first}`:`offsets ${first}-${last}`;
  const event:OffsetEvent={
    id:`consumer-${state.sequence}-${state.consumePartition}-${state.startOffset}`,
    time:clockFor(state.sequence),
    role:"CONSUMER",
    text:`Consumed ${consumed.length} messages from partition ${state.consumePartition} (${range})`,
  };
  return {
    ...state,
    selectedPartition:state.consumePartition,
    consumed,
    sequence:state.sequence+1,
    events:[...state.events,event].slice(-20),
    status:consumed.length
      ? `Consumer read ${consumed.length} retained message(s) from P${state.consumePartition}; reading did not delete them.`
      : `Partition ${state.consumePartition} has no messages to consume.`,
  };
}

export function clearOffsetEvents(state:OffsetLabState):OffsetLabState{
  return {...state,events:[]};
}

export function runOffsetScenario(state:OffsetLabState,scenario:OffsetScenarioId,value:string,key:string):OffsetLabState{
  if(scenario==="hot-partition"){
    let next=state;
    for(const item of ["OrderCreated","PaymentProcessed","OrderShipped"]){
      next=produceOffsetMessage(next,item,key,0);
    }
    return {...next,status:"Hot Partition scenario: three messages were appended to P0 to make its offset sequence advance faster."};
  }
  if(scenario==="offset-replay"){
    const replayState={...state,startOffset:"earliest" as StartOffsetMode};
    const consumed=consumeOffsetMessages(replayState);
    return {...consumed,status:"Offset Replay scenario: the selected consumer partition was read again from its earliest retained offset."};
  }
  const produced=produceOffsetMessage(state,value,key);
  return consumeOffsetMessages({...produced,consumePartition:produced.selectedPartition,startOffset:"latest"});
}

export function partitionDetails(state:OffsetLabState,partition:number){
  const rows=state.logs[partition]??[];
  return {
    latestOffset:rows.length,
    messages:rows.length,
    earliestOffset:rows[0]?.offset??0,
    logEndOffset:rows.length,
    approxKb:Math.max(1,Math.ceil(JSON.stringify(rows).length/1024)),
  };
}
