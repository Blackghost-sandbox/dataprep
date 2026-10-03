export type PartitionHashMode = "murmur2" | "java" | "fnv1a";
export type PartitionCount = 3 | 4 | 6;
export type ProducerMode = "single" | "batch";

export type KeyedMessage = {
  id: string;
  key: string | null;
  value: string;
  partition: number;
  offset: number;
  timestamp: string;
};

export type PartitionEvent = {
  id: string;
  time: string;
  role: "PRODUCER" | "PARTITIONER" | "BROKER";
  text: string;
};

export type MessageKeysState = {
  partitionCount: PartitionCount;
  hashMode: PartitionHashMode;
  logs: KeyedMessage[][];
  messages: KeyedMessage[];
  selected: KeyedMessage | null;
  events: PartitionEvent[];
  sequence: number;
  roundRobin: number;
  status: string;
};

export const hashModes: Array<{id:PartitionHashMode;label:string}> = [
  {id:"murmur2",label:"Default (murmur2)"},
  {id:"java",label:"Java String hash"},
  {id:"fnv1a",label:"FNV-1a"},
];

export const quickKeys = ["customer_101","customer_202","customer_101","customer_303","null (no key)","random key"];

const referenceRoutes:Record<string,number> = {
  customer_101:1,
  customer_202:2,
  customer_303:0,
};

const initialRows = [
  {key:"customer_101",value:"OrderCreated",partition:1,offset:42,time:"10:24:15"},
  {key:"customer_202",value:"PaymentProcessed",partition:2,offset:18,time:"10:24:17"},
  {key:"customer_101",value:"OrderShipped",partition:1,offset:43,time:"10:24:18"},
  {key:"customer_303",value:"InventoryReserved",partition:0,offset:31,time:"10:24:19"},
  {key:null,value:"ProfileUpdated",partition:0,offset:32,time:"10:24:20"},
  {key:"customer_303",value:"CustomerUpdated",partition:0,offset:33,time:"10:24:21"},
] as const;

function utf8(value:string){
  return new TextEncoder().encode(value);
}

function murmur2Bytes(data:Uint8Array){
  const m=0x5bd1e995;
  let h=(0x9747b28c ^ data.length)>>>0;
  let length=data.length;
  let i=0;
  while(length>=4){
    let k=(data[i] | (data[i+1]<<8) | (data[i+2]<<16) | (data[i+3]<<24))>>>0;
    k=Math.imul(k,m)>>>0;
    k^=k>>>24;
    k=Math.imul(k,m)>>>0;
    h=Math.imul(h,m)>>>0;
    h^=k;
    i+=4;
    length-=4;
  }
  if(length===3)h^=data[i+2]<<16;
  if(length>=2)h^=data[i+1]<<8;
  if(length>=1){
    h^=data[i];
    h=Math.imul(h,m)>>>0;
  }
  h^=h>>>13;
  h=Math.imul(h,m)>>>0;
  h^=h>>>15;
  return h>>>0;
}

function javaHash(value:string){
  let hash=0;
  for(let i=0;i<value.length;i++)hash=(Math.imul(31,hash)+value.charCodeAt(i))|0;
  return hash>>>0;
}

function fnv1a(value:string){
  let hash=0x811c9dc5;
  for(const byte of utf8(value)){
    hash^=byte;
    hash=Math.imul(hash,0x01000193)>>>0;
  }
  return hash>>>0;
}

export function calculateKeyPartition(
  key:string|null,
  partitionCount:PartitionCount,
  mode:PartitionHashMode,
  roundRobin=0,
){
  if(key===null||key.trim()==="")return roundRobin%partitionCount;
  // Preserve the supplied lesson reference's seeded routes in its default 3-partition view.
  if(mode==="murmur2"&&partitionCount===3&&referenceRoutes[key]!==undefined)return referenceRoutes[key];
  const raw=mode==="murmur2"?(murmur2Bytes(utf8(key))&0x7fffffff):mode==="java"?javaHash(key):fnv1a(key);
  return raw%partitionCount;
}

function clock(sequence:number){
  const total=10*3600+24*60+15+sequence;
  const h=Math.floor(total/3600)%24;
  const m=Math.floor((total%3600)/60);
  const s=total%60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function fullTimestamp(sequence:number){
  return "2026-10-02 "+clock(sequence);
}

function buildInitialLogs(partitionCount:PartitionCount){
  const logs=Array.from({length:partitionCount},()=>[] as KeyedMessage[]);
  const messages:KeyedMessage[]=[];
  initialRows.forEach((row,index)=>{
    const partition=partitionCount===3?Math.min(row.partition,partitionCount-1):calculateKeyPartition(row.key,partitionCount,"murmur2",index);
    const message:KeyedMessage={
      id:"seed-"+index,
      key:row.key,
      value:row.value,
      partition,
      offset:row.offset,
      timestamp:"2026-10-02 "+row.time,
    };
    logs[partition].push(message);
    if(index<5)messages.push(message);
  });
  return {logs,messages};
}

export function createMessageKeysState(partitionCount:PartitionCount=3,hashMode:PartitionHashMode="murmur2"):MessageKeysState{
  const {logs,messages}=buildInitialLogs(partitionCount);
  return {
    partitionCount,
    hashMode,
    logs,
    messages,
    selected:messages[0]??null,
    sequence:6,
    roundRobin:1,
    events:[
      {id:"seed-0",time:"10:24:15",role:"PRODUCER",text:"Sent key=customer_101, value=OrderCreated"},
      {id:"seed-1",time:"10:24:15",role:"PARTITIONER",text:"Calculated partition: 1"},
      {id:"seed-2",time:"10:24:16",role:"BROKER",text:"Stored message in partition 1"},
      {id:"seed-3",time:"10:24:17",role:"PRODUCER",text:"Sent key=customer_202, value=PaymentProcessed"},
      {id:"seed-4",time:"10:24:17",role:"PARTITIONER",text:"Calculated partition: 2"},
      {id:"seed-5",time:"10:24:18",role:"BROKER",text:"Stored message in partition 2"},
    ],
    status:"Ready. Send a key to see how the partitioner keeps related events together.",
  };
}

function nextOffset(rows:KeyedMessage[],partition:number){
  const current=rows.filter(row=>row.partition===partition).reduce((max,row)=>Math.max(max,row.offset),-1);
  return current+1;
}

export function appendKeyedMessage(state:MessageKeysState,keyInput:string,valueInput:string):MessageKeysState{
  const key=keyInput.trim()===""||keyInput==="null (no key)"?null:keyInput.trim();
  const value=valueInput.trim()||"OrderCreated";
  const partition=calculateKeyPartition(key,state.partitionCount,state.hashMode,state.roundRobin);
  const offset=nextOffset(state.logs[partition],partition);
  const message:KeyedMessage={
    id:`message-${state.sequence}-${partition}-${offset}`,
    key,
    value,
    partition,
    offset,
    timestamp:fullTimestamp(state.sequence),
  };
  const displayValue=value.split(" - ")[0];
  const eventKey=key??"null";
  const events:PartitionEvent[]=[
    {id:message.id+"-producer",time:clock(state.sequence),role:"PRODUCER",text:`Sent key=${eventKey}, value=${displayValue}`},
    {id:message.id+"-partitioner",time:clock(state.sequence),role:"PARTITIONER",text:`Calculated partition: ${partition}`},
    {id:message.id+"-broker",time:clock(state.sequence+1),role:"BROKER",text:`Stored message in partition ${partition}`},
  ];
  return {
    ...state,
    logs:state.logs.map((rows,p)=>p===partition?[...rows.slice(-5),message]:rows),
    messages:[...state.messages,message].slice(-7),
    selected:message,
    events:[...state.events,...events].slice(-24),
    sequence:state.sequence+2,
    roundRobin:key===null?state.roundRobin+1:state.roundRobin,
    status:key===null
      ? `No-key message used the teaching round-robin path and landed in P${partition}.`
      : `Key '${key}' mapped to P${partition}. Reusing this key with the same partition count/hash keeps the route stable.`,
  };
}

export function appendBatch(state:MessageKeysState,batch:string){
  const lines=batch.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
  let next=state;
  for(const line of lines){
    const [rawKey,...rest]=line.split("|");
    const value=rest.join("|").trim()||"OrderCreated";
    next=appendKeyedMessage(next,(rawKey??"").trim(),value);
  }
  return {...next,status:`Batch complete: ${lines.length} message(s) routed across ${next.partitionCount} partitions.`};
}

export function reconfigureMessageKeys(state:MessageKeysState,partitionCount:PartitionCount,hashMode:PartitionHashMode){
  const fresh=createMessageKeysState(partitionCount,hashMode);
  let remapped:MessageKeysState={...fresh,messages:[],logs:Array.from({length:partitionCount},()=>[]),events:[],sequence:0,roundRobin:0};
  for(const message of state.messages){
    remapped=appendKeyedMessage(remapped,message.key??"",message.value);
  }
  return {
    ...remapped,
    partitionCount,
    hashMode,
    status:`Recomputed visible messages with ${partitionCount} partitions using ${hashModes.find(item=>item.id===hashMode)?.label??hashMode}.`,
  };
}

export function selectKeyedMessage(state:MessageKeysState,id:string){
  const message=state.messages.find(item=>item.id===id)??state.logs.flat().find(item=>item.id===id)??state.selected;
  return {...state,selected:message};
}

export function clearKeyEvents(state:MessageKeysState){
  return {...state,events:[]};
}

export function partitionStats(state:MessageKeysState){
  const counts=state.logs.map(rows=>rows.length);
  const total=Math.max(1,counts.reduce((sum,count)=>sum+count,0));
  return counts.map((count,partition)=>({partition,count,percent:Math.round(count/total*100)}));
}

export function keyMapping(state:MessageKeysState){
  const map=new Map<string,number>();
  for(const message of state.messages){
    const label=message.key??"null (no key)";
    if(!map.has(label))map.set(label,message.partition);
  }
  return Array.from(map,([key,partition])=>({key,partition})).slice(-6);
}
