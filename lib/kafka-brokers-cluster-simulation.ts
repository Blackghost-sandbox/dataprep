export type ClusterTopicId = "orders" | "payments";
export type ClusterStartMode = "latest" | "earliest";

export type ClusterRecord = {
  id: string;
  order_id: string;
  customer_id: string;
  amount: number;
  product: string;
  key: string;
  partition: number;
  offset: number;
  timestamp: string;
};

export type ClusterEventRole = "PRODUCER" | "BROKER" | "REPLICA" | "CONSUMER";
export type ClusterEvent = {
  id: string;
  time: string;
  role: ClusterEventRole;
  broker?: number;
  text: string;
};

export type ClusterState = {
  brokerCount: number;
  replicationFactor: number;
  topic: ClusterTopicId;
  autoRebalance: boolean;
  partitionCount: number;
  nextOffsets: number[];
  records: ClusterRecord[][];
  consumed: ClusterRecord[];
  selectedPartition: number;
  sequence: number;
  events: ClusterEvent[];
  status: string;
};

const partitionCount = 6;
const baseOffsets = [15,12,9,7,4,2];

const starterRecords = [
  {order_id:"A1001",customer_id:"101",amount:499,product:"Laptop",key:"customer_101",partition:0},
  {order_id:"A1002",customer_id:"102",amount:189,product:"Headphones",key:"customer_102",partition:1},
  {order_id:"A1003",customer_id:"103",amount:79,product:"Mouse",key:"customer_103",partition:2},
  {order_id:"A1004",customer_id:"104",amount:899,product:"Monitor",key:"customer_104",partition:3},
  {order_id:"A1005",customer_id:"105",amount:129,product:"Keyboard",key:"customer_105",partition:4},
  {order_id:"A1006",customer_id:"106",amount:249,product:"Dock",key:"customer_106",partition:5},
] as const;

function timeParts(sequence:number){
  const total=10*3600+24*60+15+sequence;
  return {
    hour:Math.floor(total/3600)%24,
    minute:Math.floor((total%3600)/60),
    second:total%60,
  };
}

function clock(sequence:number){
  const {hour,minute,second}=timeParts(sequence);
  return `${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}:${String(second).padStart(2,"0")}`;
}

function timestamp(sequence:number){
  return "2026-10-02 "+clock(sequence);
}

function hashKey(key:string){
  const match=key.match(/(\d+)$/);
  if(match)return Math.max(0,Number(match[1])-101);
  let hash=0;
  for(const char of key)hash=(hash*31+char.charCodeAt(0))>>>0;
  return hash;
}

export function routeClusterRecord(key:string,partitions=partitionCount){
  return hashKey(key||"no-key")%partitions;
}

export function leaderForPartition(partition:number,brokerCount:number){
  return partition%brokerCount+1;
}

export function replicaBrokers(partition:number,brokerCount:number,replicationFactor:number){
  const leader=leaderForPartition(partition,brokerCount);
  const replicas:number[]=[];
  for(let i=0;i<Math.min(replicationFactor,brokerCount);i++)replicas.push(((leader-1+i)%brokerCount)+1);
  return replicas;
}

function seedRecord(item:typeof starterRecords[number],index:number):ClusterRecord{
  return {
    id:"seed-"+item.order_id,
    ...item,
    offset:baseOffsets[item.partition],
    timestamp:"2026-10-02 "+clock(index),
  };
}

export function createClusterState(brokerCount=3,replicationFactor=3,topic:ClusterTopicId="orders"):ClusterState{
  const brokers=Math.min(5,Math.max(3,brokerCount));
  const rf=Math.min(3,Math.max(1,Math.min(replicationFactor,brokers)));
  const records=Array.from({length:partitionCount},()=>[] as ClusterRecord[]);
  starterRecords.forEach((item,index)=>records[item.partition].push(seedRecord(item,index)));
  return {
    brokerCount:brokers,
    replicationFactor:rf,
    topic,
    autoRebalance:true,
    partitionCount,
    nextOffsets:baseOffsets.map(offset=>offset+1),
    records,
    consumed:records.slice(0,3).map(rows=>rows[0]).filter(Boolean),
    selectedPartition:0,
    sequence:6,
    events:[
      {id:"seed-producer",time:"10:24:15",role:"PRODUCER",text:"Sent message to topic 'orders' (key: customer_101)"},
      {id:"seed-broker",time:"10:24:15",role:"BROKER",broker:1,text:"Stored message in partition 0 (leader)"},
      {id:"seed-replica-2",time:"10:24:16",role:"REPLICA",broker:2,text:"Replicated to broker-2 (partition 0)"},
      {id:"seed-replica-3",time:"10:24:16",role:"REPLICA",broker:3,text:"Replicated to broker-3 (partition 0)"},
      {id:"seed-consumer",time:"10:24:17",role:"CONSUMER",text:"Consumed message from partition 0 (offset 15)"},
      {id:"seed-producer-2",time:"10:24:18",role:"PRODUCER",text:"Sent message to topic 'orders' (key: customer_102)"},
    ],
    status:"Healthy cluster. Click a broker, partition, or replica to inspect placement.",
  };
}

export function reconfigureCluster(state:ClusterState,brokerCount:number,replicationFactor:number){
  const brokers=Math.min(5,Math.max(3,brokerCount));
  const rf=Math.min(3,Math.max(1,Math.min(replicationFactor,brokers)));
  return {
    ...state,
    brokerCount:brokers,
    replicationFactor:rf,
    status:state.autoRebalance
      ? `Cluster re-balanced across ${brokers} brokers with replication factor ${rf}.`
      : `Configuration changed to ${brokers} brokers / RF ${rf}; auto re-balance is disabled.`,
  };
}

export function setClusterTopic(state:ClusterState,topic:ClusterTopicId):ClusterState{
  return {...state,topic,status:`Viewing topic '${topic}'. Broker placement model is unchanged.`};
}

export function setAutoRebalance(state:ClusterState,enabled:boolean):ClusterState{
  return {...state,autoRebalance:enabled,status:enabled?"Auto re-balance enabled.":"Auto re-balance disabled for this teaching model."};
}

export function selectClusterPartition(state:ClusterState,partition:number):ClusterState{
  const target=Math.min(state.partitionCount-1,Math.max(0,partition));
  return {...state,selectedPartition:target,status:`Inspecting partition ${target} and its replica placement.`};
}

export function sendClusterMessage(
  state:ClusterState,
  input:{key:string;order_id:string;customer_id:string;amount:number;product:string}
):ClusterState{
  const key=input.key.trim()||"no-key";
  const partition=routeClusterRecord(key,state.partitionCount);
  const offset=state.nextOffsets[partition];
  const leader=leaderForPartition(partition,state.brokerCount);
  const replicas=replicaBrokers(partition,state.brokerCount,state.replicationFactor);
  const record:ClusterRecord={
    id:`record-${state.sequence}-${partition}-${offset}`,
    order_id:input.order_id||`A${1001+state.sequence}`,
    customer_id:input.customer_id||"101",
    amount:Number.isFinite(input.amount)?input.amount:0,
    product:input.product||"Laptop",
    key,
    partition,
    offset,
    timestamp:timestamp(state.sequence),
  };
  const records=state.records.map((rows,p)=>p===partition?[...rows.slice(-4),record]:rows);
  const nextOffsets=state.nextOffsets.map((value,p)=>p===partition?value+1:value);
  const events:ClusterEvent[]=[
    {id:record.id+"-producer",time:clock(state.sequence),role:"PRODUCER",text:`Sent message to topic '${state.topic}' (key: ${key})`},
    {id:record.id+"-leader",time:clock(state.sequence),role:"BROKER",broker:leader,text:`Stored message in partition ${partition} (leader)`},
    ...replicas.filter(b=>b!==leader).map((broker,index)=>({
      id:record.id+"-replica-"+broker,
      time:clock(state.sequence+index+1),
      role:"REPLICA" as const,
      broker,
      text:`Replicated to broker-${broker} (partition ${partition})`,
    })),
  ];
  return {
    ...state,
    records,
    nextOffsets,
    selectedPartition:partition,
    sequence:state.sequence+Math.max(1,events.length),
    events:[...state.events,...events].slice(-24),
    status:`Stored ${record.order_id} in P${partition} at offset ${offset}; ${replicas.length} replica copy/copies are represented.`,
  };
}

export function consumeClusterMessages(state:ClusterState,start:ClusterStartMode):ClusterState{
  const candidates=state.records.flat().filter(Boolean);
  const sorted=[...candidates].sort((a,b)=>a.timestamp.localeCompare(b.timestamp));
  const consumed=start==="earliest"?sorted.slice(0,3):sorted.slice(-3);
  const event:ClusterEvent={
    id:"consumer-"+state.sequence+"-"+start,
    time:clock(state.sequence),
    role:"CONSUMER",
    text:`Consumed ${consumed.length} message(s) from topic '${state.topic}' starting from ${start} retained data`,
  };
  return {
    ...state,
    consumed,
    sequence:state.sequence+1,
    events:[...state.events,event].slice(-24),
    status:`Consumer group read ${consumed.length} message(s). Reading does not delete broker records.`,
  };
}

export function clearClusterEvents(state:ClusterState):ClusterState{
  return {...state,events:[]};
}

export function brokerPartitions(state:ClusterState,broker:number){
  return Array.from({length:state.partitionCount},(_,partition)=>{
    const replicas=replicaBrokers(partition,state.brokerCount,state.replicationFactor);
    if(!replicas.includes(broker))return null;
    return {partition,leader:leaderForPartition(partition,state.brokerCount)===broker,replicas};
  }).filter((item):item is {partition:number;leader:boolean;replicas:number[]}=>item!==null);
}

export function clusterOverview(state:ClusterState){
  return {
    brokers:state.brokerCount,
    partitions:state.partitionCount,
    replicationFactor:state.replicationFactor,
    approxPerBroker:Math.ceil(state.partitionCount*state.replicationFactor/state.brokerCount),
  };
}

export function clusterPartitionDetails(state:ClusterState,partition:number){
  const rows=state.records[partition]??[];
  const replicas=replicaBrokers(partition,state.brokerCount,state.replicationFactor);
  return {
    leader:leaderForPartition(partition,state.brokerCount),
    replicas,
    isr:replicas,
    totalMessages:rows.length,
    earliestOffset:rows[0]?.offset??0,
    latestOffset:state.nextOffsets[partition]-1,
    replicationFactor:state.replicationFactor,
  };
}
