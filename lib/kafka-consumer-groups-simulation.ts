export type ConsumerGroupPartitionCount = 3 | 6 | 9;
export type ConsumerGroupConsumerCount = 1 | 2 | 3 | 4;
export type RebalanceAction = "add" | "remove" | "fail" | "restart";

export type ConsumerMember = {
  id: string;
  label: string;
  active: boolean;
  partitions: number[];
};

export type GroupPartition = {
  id: number;
  messages: number;
  leader: string;
  lag: number;
  owner: string | null;
};

export type GroupEvent = {
  id: string;
  time: string;
  role: "GROUP" | "CONSUMER" | "ASSIGN";
  text: string;
};

export type RebalanceStep = {
  id: number;
  label: string;
  status: "Joining" | "Reassigning" | "Completed";
};

export type ConsumerGroupState = {
  partitionCount: ConsumerGroupPartitionCount;
  consumerCount: ConsumerGroupConsumerCount;
  autoRebalance: boolean;
  partitions: GroupPartition[];
  consumers: ConsumerMember[];
  rebalances: number;
  throughput: number;
  sequence: number;
  events: GroupEvent[];
  steps: RebalanceStep[];
  selectedPartition: number;
  status: string;
};

const baseMessages = [12,8,15,10,6,14,11,9,7];
const baseLag = [0,3,1,2,0,4,1,2,0];

function clock(sequence:number){
  const total=10*3600+24*60+15+sequence;
  const h=Math.floor(total/3600)%24;
  const m=Math.floor((total%3600)/60);
  const s=total%60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function consumerId(index:number){
  return `C${index+1}`;
}

function consumerLabel(index:number){
  return `Consumer ${String.fromCharCode(65+index)}`;
}

export function assignGroupPartitions(partitionCount:number,consumerCount:number){
  const assignments=Array.from({length:consumerCount},()=>[] as number[]);
  for(let partition=0;partition<partitionCount;partition++)assignments[partition%consumerCount].push(partition);
  return assignments;
}

function buildMembers(partitionCount:number,consumerCount:number){
  const assignments=assignGroupPartitions(partitionCount,consumerCount);
  return assignments.map((partitions,index)=>({
    id:consumerId(index),
    label:consumerLabel(index),
    active:true,
    partitions,
  }));
}

function buildPartitions(partitionCount:number,consumerCount:number){
  const assignments=assignGroupPartitions(partitionCount,consumerCount);
  const owners=new Map<number,string>();
  assignments.forEach((parts,index)=>parts.forEach(partition=>owners.set(partition,consumerId(index))));
  return Array.from({length:partitionCount},(_,id)=>({
    id,
    messages:baseMessages[id]??(7+(id*3)%11),
    leader:`broker-${id%3+1}`,
    lag:baseLag[id]??id%4,
    owner:owners.get(id)??null,
  }));
}

function initialEvents():GroupEvent[]{
  return [
    {id:"seed-0",time:"10:24:15",role:"GROUP",text:"Consumer group 'analytics-group' created"},
    {id:"seed-1",time:"10:24:16",role:"CONSUMER",text:"Consumer A joined (C1)"},
    {id:"seed-2",time:"10:24:16",role:"ASSIGN",text:"Assigned partition 0 to Consumer A"},
    {id:"seed-3",time:"10:24:17",role:"CONSUMER",text:"Consumer B joined (C2)"},
    {id:"seed-4",time:"10:24:17",role:"ASSIGN",text:"Assigned partition 1 to Consumer B"},
    {id:"seed-5",time:"10:24:18",role:"CONSUMER",text:"Consumer C joined (C3)"},
    {id:"seed-6",time:"10:24:18",role:"ASSIGN",text:"Assigned partition 2 to Consumer C"},
  ];
}

function referenceSteps():RebalanceStep[]{
  return [
    {id:1,label:"C4 joins the group",status:"Joining"},
    {id:2,label:"Rebalancing triggered",status:"Reassigning"},
    {id:3,label:"New partition assignment",status:"Completed"},
    {id:4,label:"Consumers start processing",status:"Completed"},
  ];
}

export function createConsumerGroupState(
  partitionCount:ConsumerGroupPartitionCount=3,
  consumerCount:ConsumerGroupConsumerCount=3,
):ConsumerGroupState{
  return {
    partitionCount,
    consumerCount,
    autoRebalance:true,
    partitions:buildPartitions(partitionCount,consumerCount),
    consumers:buildMembers(partitionCount,consumerCount),
    rebalances:0,
    throughput:25,
    sequence:7,
    events:initialEvents(),
    steps:referenceSteps(),
    selectedPartition:0,
    status:"Running. Each partition has exactly one active consumer in this group.",
  };
}

function rebalance(
  state:ConsumerGroupState,
  partitionCount:ConsumerGroupPartitionCount,
  consumerCount:ConsumerGroupConsumerCount,
  reason:string,
):ConsumerGroupState{
  const oldOwners=new Map(state.partitions.map(partition=>[partition.id,partition.owner]));
  const partitions=buildPartitions(partitionCount,consumerCount);
  const consumers=buildMembers(partitionCount,consumerCount);
  const events:GroupEvent[]=[
    {id:`rebalance-${state.sequence}-group`,time:clock(state.sequence),role:"GROUP",text:reason},
  ];
  for(const partition of partitions){
    if(oldOwners.get(partition.id)!==partition.owner){
      const member=consumers.find(consumer=>consumer.id===partition.owner);
      events.push({
        id:`rebalance-${state.sequence}-p${partition.id}`,
        time:clock(state.sequence+1),
        role:"ASSIGN",
        text:`Assigned partition ${partition.id} to ${member?.label??partition.owner??"no consumer"}`,
      });
    }
  }
  return {
    ...state,
    partitionCount,
    consumerCount,
    partitions,
    consumers,
    rebalances:state.rebalances+1,
    sequence:state.sequence+2,
    events:[...state.events,...events].slice(-28),
    steps:[
      {id:1,label:reason,status:"Completed"},
      {id:2,label:"Rebalancing triggered",status:"Completed"},
      {id:3,label:"New partition assignment",status:"Completed"},
      {id:4,label:"Consumers start processing",status:"Completed"},
    ],
    status:`Rebalance #${state.rebalances+1} complete: ${partitionCount} partitions assigned across ${consumerCount} active consumer(s).`,
  };
}

export function setConsumerGroupPartitions(state:ConsumerGroupState,count:ConsumerGroupPartitionCount){
  if(count===state.partitionCount)return state;
  if(!state.autoRebalance)return {
    ...state,
    partitionCount:count,
    status:`Partition count changed to ${count}. Auto rebalancing is off; apply a rebalance action to refresh assignments.`,
  };
  return rebalance(state,count,state.consumerCount,`Partition count changed to ${count}`);
}

export function setConsumerGroupConsumers(state:ConsumerGroupState,count:ConsumerGroupConsumerCount){
  if(count===state.consumerCount)return state;
  if(!state.autoRebalance)return {
    ...state,
    consumerCount:count,
    status:`Consumer count changed to ${count}. Auto rebalancing is off; apply an action to refresh assignments.`,
  };
  const joining=count>state.consumerCount;
  const label=consumerLabel(Math.max(0,count-1));
  return rebalance(state,state.partitionCount,count,joining?`${label} joined the group`:`Group reduced to ${count} consumer(s)`);
}

export function setConsumerGroupAuto(state:ConsumerGroupState,enabled:boolean){
  return {...state,autoRebalance:enabled,status:enabled?"Automatic rebalancing enabled.":"Automatic rebalancing disabled."};
}

export function selectConsumerGroupPartition(state:ConsumerGroupState,partition:number){
  const selected=Math.min(Math.max(0,partition),Math.max(0,state.partitionCount-1));
  return {...state,selectedPartition:selected,status:`Inspecting partition ${selected} assignment and lag.`};
}

export function applyConsumerGroupAction(state:ConsumerGroupState,action:RebalanceAction){
  if(action==="add"){
    const next=Math.min(4,state.consumerCount+1) as ConsumerGroupConsumerCount;
    if(next===state.consumerCount)return {...state,status:"Maximum teaching consumer count is 4."};
    return rebalance(state,state.partitionCount,next,`C${next} joins the group`);
  }
  if(action==="remove"){
    const next=Math.max(1,state.consumerCount-1) as ConsumerGroupConsumerCount;
    if(next===state.consumerCount)return {...state,status:"At least one active consumer must remain."};
    return rebalance(state,state.partitionCount,next,`C${state.consumerCount} leaves the group`);
  }
  if(action==="fail"){
    const failed=Math.min(state.consumerCount,2);
    const next=Math.max(1,state.consumerCount-1) as ConsumerGroupConsumerCount;
    return rebalance(state,state.partitionCount,next,`Consumer ${String.fromCharCode(64+failed)} failed; reassignment required`);
  }
  const next=Math.min(4,state.consumerCount+1) as ConsumerGroupConsumerCount;
  return rebalance(state,state.partitionCount,next,`Consumer ${String.fromCharCode(64+next)} restarted and joined`);
}

export function clearConsumerGroupEvents(state:ConsumerGroupState){
  return {...state,events:[]};
}

export function groupMetrics(state:ConsumerGroupState){
  return {
    consumers:state.consumerCount,
    partitions:state.partitionCount,
    throughput:state.throughput,
    rebalances:state.rebalances,
  };
}

export function ownerForPartition(state:ConsumerGroupState,partition:number){
  const item=state.partitions.find(row=>row.id===partition);
  return state.consumers.find(consumer=>consumer.id===item?.owner)??null;
}
