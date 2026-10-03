export type ArchitectureScenarioId = "normal-flow" | "broker-failure" | "consumer-rebalance";
export type ArchitectureStepId = "produce" | "partition" | "replicate" | "consume" | "commit";

export type ArchitectureEvent = {
  id:string;
  step:ArchitectureStepId;
  title:string;
  detail:string;
  status:"ready"|"active"|"complete"|"warning";
};

export type BrokerView = {
  id:number;
  healthy:boolean;
  partitions:Array<{id:"P0"|"P1"|"P2";role:"leader"|"follower"}>;
};

export type ArchitectureReviewState = {
  scenario:ArchitectureScenarioId;
  currentStep:number;
  events:ArchitectureEvent[];
  brokers:BrokerView[];
  activePartition:"P0"|"P1"|"P2";
  activeConsumer:number;
  committedOffset:number;
  brokerFailure:number|null;
  status:string;
};

export const architectureScenarios:Array<{id:ArchitectureScenarioId;label:string}> = [
  {id:"normal-flow",label:"Normal Event Flow"},
  {id:"broker-failure",label:"Broker Failure & Leader Election"},
  {id:"consumer-rebalance",label:"Consumer Rebalance"},
];

const baseEvents:ArchitectureEvent[] = [
  {id:"produce",step:"produce",title:"Producer sends a record",detail:"order_id=1042, key=user-77, amount=499",status:"ready"},
  {id:"partition",step:"partition",title:"Record is assigned to a partition",detail:"Key hashes to partition P0",status:"ready"},
  {id:"replicate",step:"replicate",title:"Stored on leader and replicated to followers",detail:"Broker 1 leads P0; Brokers 2 and 3 hold follower replicas",status:"ready"},
  {id:"consume",step:"consume",title:"Consumer reads from its assigned partition",detail:"Consumer 1 reads P0 from the current leader",status:"ready"},
  {id:"commit",step:"commit",title:"Offset is committed",detail:"Consumer group commits next offset 212",status:"ready"},
];

function baseBrokers():BrokerView[]{
  return [
    {id:1,healthy:true,partitions:[
      {id:"P0",role:"leader"},{id:"P1",role:"follower"},{id:"P2",role:"follower"}
    ]},
    {id:2,healthy:true,partitions:[
      {id:"P0",role:"follower"},{id:"P1",role:"leader"},{id:"P2",role:"follower"}
    ]},
    {id:3,healthy:true,partitions:[
      {id:"P0",role:"follower"},{id:"P1",role:"follower"},{id:"P2",role:"leader"}
    ]},
  ];
}

function applyStep(events:ArchitectureEvent[],currentStep:number){
  return events.map((event,index)=>({
    ...event,
    status:index<currentStep?"complete":index===currentStep?"active":"ready",
  } as ArchitectureEvent));
}

export function createArchitectureReviewState():ArchitectureReviewState{
  return {
    scenario:"normal-flow",
    currentStep:0,
    events:applyStep(baseEvents,0),
    brokers:baseBrokers(),
    activePartition:"P0",
    activeConsumer:1,
    committedOffset:211,
    brokerFailure:null,
    status:"Ready to trace one record end-to-end through producer, partition, replicas, consumer and committed offset.",
  };
}

export function setArchitectureScenario(state:ArchitectureReviewState,scenario:ArchitectureScenarioId):ArchitectureReviewState{
  const reset=createArchitectureReviewState();
  return {...reset,scenario,status:`Scenario changed to ${architectureScenarios.find(item=>item.id===scenario)?.label??scenario}.`};
}

export function nextArchitectureStep(state:ArchitectureReviewState):ArchitectureReviewState{
  const next=Math.min(state.events.length-1,state.currentStep+1);
  let brokers=state.brokers;
  let activeConsumer=state.activeConsumer;
  let brokerFailure=state.brokerFailure;
  let committedOffset=state.committedOffset;
  let status=state.status;

  if(state.scenario==="broker-failure"&&next>=2){
    brokerFailure=1;
    brokers=state.brokers.map(broker=>({
      ...broker,
      healthy:broker.id!==1,
      partitions:broker.partitions.map(partition=>{
        if(partition.id!=="P0")return partition;
        if(broker.id===2)return {...partition,role:"leader" as const};
        return {...partition,role:"follower" as const};
      }),
    }));
    status="Broker 1 failed while leading P0. Broker 2 is elected leader from an in-sync follower replica.";
  } else if(state.scenario==="consumer-rebalance"&&next>=3){
    activeConsumer=2;
    status="Consumer group rebalanced: P0 ownership moved from Consumer 1 to Consumer 2 before processing resumed.";
  } else {
    const labels=[
      "Producer created the order record with key user-77.",
      "The partitioner routed the key to P0.",
      "P0 was replicated across Brokers 1, 2 and 3.",
      "Consumer 1 read the record from P0.",
      "The group committed next offset 212 after successful processing.",
    ];
    status=labels[next]??state.status;
  }

  if(next===4)committedOffset=212;
  return {
    ...state,
    currentStep:next,
    events:applyStep(state.events,next),
    brokers,
    activeConsumer,
    brokerFailure,
    committedOffset,
    status,
  };
}

export function runArchitectureSimulation(state:ArchitectureReviewState):ArchitectureReviewState{
  let next=state;
  for(let i=state.currentStep;i<state.events.length-1;i++)next=nextArchitectureStep(next);
  return {
    ...next,
    events:next.events.map(event=>({...event,status:"complete"})),
    currentStep:next.events.length-1,
    status:state.scenario==="broker-failure"
      ?"Failure trace complete: P0 leader moved to Broker 2, Consumer 1 continued from the replicated log, and next offset 212 was committed."
      :state.scenario==="consumer-rebalance"
        ?"Rebalance trace complete: P0 moved to Consumer 2 and the group committed next offset 212 after processing."
        :"End-to-end trace complete: producer → P0 → leader/followers → Consumer 1 → committed next offset 212.",
  };
}

export function resetArchitectureSimulation(){
  return createArchitectureReviewState();
}
