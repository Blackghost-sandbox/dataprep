export type ReplicationScenarioId = "leader-failure" | "healthy-replication" | "follower-out-of-sync";

export type BrokerRole = "leader" | "follower";
export type BrokerReplicaState = {
  id:number;
  role:BrokerRole;
  failed:boolean;
  inSync:boolean;
  active:boolean;
  partition:"P0";
  replica:number;
  offsets:number[];
};

export type ReplicationEventRole = "PRODUCER" | "REPLICA" | "BROKER" | "CONTROLLER";
export type ReplicationEvent = {
  id:string;
  time:string;
  role:ReplicationEventRole;
  text:string;
};

export type ReplicationState = {
  topic:"orders";
  partition:"P0";
  replicationFactor:3;
  minIsr:2;
  acks:"all";
  leaderId:number;
  brokers:BrokerReplicaState[];
  nextOffset:number;
  hw:number;
  leo:number;
  autoAdvance:boolean;
  scenario:ReplicationScenarioId;
  sequence:number;
  events:ReplicationEvent[];
  underReplicated:boolean;
  status:string;
};

export const replicationScenarios:Array<{id:ReplicationScenarioId;label:string}> = [
  {id:"leader-failure",label:"Leader Failure"},
  {id:"healthy-replication",label:"Healthy Replication"},
  {id:"follower-out-of-sync",label:"Follower Out of Sync"},
];

const baseOffsets=[145,146,147,148,149];

function clock(sequence:number){
  const total=10*3600+24*60+12+sequence;
  const h=Math.floor(total/3600)%24;
  const m=Math.floor((total%3600)/60);
  const s=total%60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function broker(id:number,role:BrokerRole,failed:boolean,inSync:boolean,offsets=baseOffsets):BrokerReplicaState{
  return {
    id,
    role,
    failed,
    inSync,
    active:!failed,
    partition:"P0",
    replica:id,
    offsets:[...offsets],
  };
}

export function createReplicationState():ReplicationState{
  return {
    topic:"orders",
    partition:"P0",
    replicationFactor:3,
    minIsr:2,
    acks:"all",
    leaderId:2,
    brokers:[
      broker(1,"follower",true,false),
      broker(2,"leader",false,true),
      broker(3,"follower",false,true),
    ],
    nextOffset:150,
    hw:149,
    leo:149,
    autoAdvance:true,
    scenario:"leader-failure",
    sequence:6,
    events:[
      {id:"seed-0",time:"10:24:12",role:"PRODUCER",text:"Sent message (offset 149) to P0"},
      {id:"seed-1",time:"10:24:12",role:"REPLICA",text:"Replicated P0 to broker-3 (in ISR)"},
      {id:"seed-2",time:"10:24:15",role:"BROKER",text:"Broker-1 failed (P0 leader)"},
      {id:"seed-3",time:"10:24:15",role:"CONTROLLER",text:"Starting P0 leader election..."},
      {id:"seed-4",time:"10:24:16",role:"CONTROLLER",text:"Broker-2 elected as new leader for P0"},
      {id:"seed-5",time:"10:24:16",role:"REPLICA",text:"Broker-3 caught up for P0 (in ISR)"},
    ],
    underReplicated:false,
    status:"P0 is available: Broker 2 is leader and Brokers 2–3 form the current ISR.",
  };
}

function append(state:ReplicationState,events:ReplicationEvent[],status:string,patch:Partial<ReplicationState>={}):ReplicationState{
  return {
    ...state,
    ...patch,
    sequence:state.sequence+events.length,
    events:[...state.events,...events].slice(-28),
    status,
  };
}

export function currentIsr(state:ReplicationState){
  return state.brokers.filter(item=>item.inSync&&!item.failed).map(item=>item.id);
}

export function produceReplicatedMessage(state:ReplicationState){
  const isr=currentIsr(state);
  if(isr.length<state.minIsr){
    return {
      ...state,
      status:`Write rejected for ${state.partition}: ISR has ${isr.length} broker(s), below min ISR ${state.minIsr}.`,
      underReplicated:true,
    };
  }
  const leader=state.brokers.find(item=>item.id===state.leaderId&&!item.failed);
  if(!leader)return {...state,status:`No active leader for ${state.partition}; elect a leader before producing.`};

  const offset=state.nextOffset;
  const brokers=state.brokers.map(item=>{
    if(item.failed)return item;
    if(item.inSync)return {...item,offsets:[...item.offsets.slice(-4),offset]};
    return item;
  });
  const events:ReplicationEvent[]=[
    {id:`produce-${state.sequence}-${offset}`,time:clock(state.sequence),role:"PRODUCER",text:`Sent message (offset ${offset}) to ${state.partition}`},
    ...brokers
      .filter(item=>item.id!==state.leaderId&&item.inSync&&!item.failed)
      .map((item,index)=>({
        id:`replica-${state.sequence}-${item.id}-${offset}`,
        time:clock(state.sequence+index+1),
        role:"REPLICA" as const,
        text:`Replicated ${state.partition} offset ${offset} to broker-${item.id} (in ISR)`,
      })),
  ];
  return append(
    state,
    events,
    `Offset ${offset} committed for ${state.partition} with acks=all across ${isr.length} in-sync replica(s).`,
    {brokers,nextOffset:offset+1,hw:offset,leo:offset,underReplicated:isr.length<state.replicationFactor}
  );
}

export function failBroker(state:ReplicationState,brokerId:number){
  const target=state.brokers.find(item=>item.id===brokerId);
  if(!target||target.failed)return {...state,status:`Broker ${brokerId} is already failed.`};

  const wasLeader=state.leaderId===brokerId;
  const brokers=state.brokers.map(item=>item.id===brokerId?{...item,failed:true,active:false,inSync:false,role:"follower" as BrokerRole}:item);
  const event:ReplicationEvent={
    id:`fail-${state.sequence}-${brokerId}`,
    time:clock(state.sequence),
    role:"BROKER",
    text:`Broker-${brokerId} failed (${state.partition}${wasLeader?" leader":""})`,
  };
  const failed=append(
    state,
    [event],
    wasLeader?`${state.partition} leader failed. Leader election is required.`:`Broker ${brokerId} failed; ${state.partition} continues with fewer in-sync copies.`,
    {brokers,leaderId:wasLeader?0:state.leaderId,underReplicated:true}
  );
  return state.autoAdvance&&wasLeader?electNewLeader(failed):failed;
}

export function electNewLeader(state:ReplicationState){
  const candidates=state.brokers.filter(item=>!item.failed&&item.inSync).sort((a,b)=>a.id-b.id);
  if(candidates.length===0)return {...state,status:`No eligible in-sync replica can lead ${state.partition}.`,underReplicated:true};
  const leader=candidates[0].id;
  const brokers=state.brokers.map(item=>({...item,role:item.id===leader?"leader":"follower"} as BrokerReplicaState));
  const events:ReplicationEvent[]=[
    {id:`election-start-${state.sequence}`,time:clock(state.sequence),role:"CONTROLLER",text:`Starting ${state.partition} leader election...`},
    {id:`election-done-${state.sequence}-${leader}`,time:clock(state.sequence+1),role:"CONTROLLER",text:`Broker-${leader} elected as new leader for ${state.partition}`},
  ];
  return append(
    state,
    events,
    `Broker ${leader} is now leader for ${state.partition}.`,
    {brokers,leaderId:leader,underReplicated:currentIsr({...state,brokers,leaderId:leader}).length<state.replicationFactor}
  );
}

export function recoverBroker(state:ReplicationState,brokerId:number){
  const target=state.brokers.find(item=>item.id===brokerId);
  if(!target||!target.failed)return {...state,status:`Broker ${brokerId} is already active.`};
  const leader=state.brokers.find(item=>item.id===state.leaderId);
  const offsets=leader?.offsets??baseOffsets;
  const brokers=state.brokers.map(item=>item.id===brokerId?{
    ...item,
    failed:false,
    active:true,
    inSync:true,
    role:"follower" as BrokerRole,
    offsets:[...offsets],
  }:item);
  const event:ReplicationEvent={
    id:`recover-${state.sequence}-${brokerId}`,
    time:clock(state.sequence),
    role:"REPLICA",
    text:`Broker-${brokerId} recovered and rejoined ISR for ${state.partition}`,
  };
  return append(
    state,
    [event],
    `Broker ${brokerId} recovered and caught up with ${state.partition}.`,
    {brokers,underReplicated:false}
  );
}

export function makeFollowerOutOfSync(state:ReplicationState,brokerId=3){
  const brokers=state.brokers.map(item=>item.id===brokerId?{...item,inSync:false}:item);
  const event:ReplicationEvent={
    id:`oos-${state.sequence}-${brokerId}`,
    time:clock(state.sequence),
    role:"REPLICA",
    text:`Broker-${brokerId} fell out of sync for ${state.partition}`,
  };
  return append(
    state,
    [event],
    `Broker ${brokerId} is out of ISR. Writes remain available only while current ISR satisfies min ISR ${state.minIsr}.`,
    {brokers,underReplicated:true}
  );
}

export function setReplicationScenario(state:ReplicationState,scenario:ReplicationScenarioId){
  return {...state,scenario,status:`Scenario changed to ${replicationScenarios.find(item=>item.id===scenario)?.label??scenario}.`};
}

export function setReplicationAutoAdvance(state:ReplicationState,enabled:boolean){
  return {...state,autoAdvance:enabled,status:enabled?"Auto advance enabled.":"Auto advance disabled."};
}

export function runReplicationScenario(state:ReplicationState){
  if(state.scenario==="healthy-replication"){
    let base=createReplicationState();
    base={...base,scenario:"healthy-replication",brokers:[
      broker(1,"leader",false,true),
      broker(2,"follower",false,true),
      broker(3,"follower",false,true),
    ],leaderId:1,underReplicated:false,events:[],sequence:0,status:"Healthy replication scenario."};
    return produceReplicatedMessage(base);
  }
  if(state.scenario==="follower-out-of-sync"){
    let base=createReplicationState();
    base={...base,scenario:"follower-out-of-sync",brokers:[
      broker(1,"leader",false,true),
      broker(2,"follower",false,true),
      broker(3,"follower",false,true),
    ],leaderId:1,underReplicated:false,events:[],sequence:0};
    return makeFollowerOutOfSync(base,3);
  }
  let base=createReplicationState();
  base={...base,scenario:"leader-failure",brokers:[
    broker(1,"leader",false,true),
    broker(2,"follower",false,true),
    broker(3,"follower",false,true),
  ],leaderId:1,underReplicated:false,events:[],sequence:0,status:"Leader failure scenario started."};
  const produced=produceReplicatedMessage(base);
  return failBroker({...produced,autoAdvance:true},1);
}

export function clearReplicationEvents(state:ReplicationState){
  return {...state,events:[]};
}

export function partitionStatus(state:ReplicationState){
  const leader=state.brokers.find(item=>item.id===state.leaderId&&!item.failed)?.id??null;
  const followers=state.brokers.filter(item=>item.id!==leader&&!item.failed).map(item=>item.id);
  const isr=currentIsr(state);
  return {
    partition:state.partition,
    leader,
    followers,
    isr,
    replicationFactor:state.replicationFactor,
    minIsr:state.minIsr,
    hw:state.hw,
    leo:state.leo,
    underReplicated:state.underReplicated,
  };
}
