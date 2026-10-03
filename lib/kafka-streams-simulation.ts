export type StreamScenarioId = "windowed-aggregation" | "filter-only" | "regional-count";
export type StreamStageId = "source" | "filter" | "group" | "aggregate" | "sink";

export type StreamEvent = {
  id:number;
  region:string;
  amount:number;
  timestamp:string;
};

export type StreamOutput = {
  region:string;
  total:number;
  count:number;
  windowStart:string;
};

export type StreamLogRole = "SOURCE" | "FILTER" | "AGGREGATE";
export type StreamLog = {
  id:string;
  time:string;
  role:StreamLogRole;
  text:string;
};

export type KafkaStreamsState = {
  scenario:StreamScenarioId;
  autoAdvance:boolean;
  inputEvents:StreamEvent[];
  outputEvents:StreamOutput[];
  stateStore:StreamOutput[];
  logs:StreamLog[];
  activeStage:StreamStageId;
  processedCount:number;
  sequence:number;
  status:string;
};

export const streamScenarios:Array<{id:StreamScenarioId;label:string}> = [
  {id:"windowed-aggregation",label:"Windowed Aggregation"},
  {id:"filter-only",label:"Filter Invalid Events"},
  {id:"regional-count",label:"Count by Region"},
];

const seedEvents:StreamEvent[] = [
  {id:1,region:"IN",amount:499,timestamp:"10:24:01"},
  {id:2,region:"US",amount:200,timestamp:"10:24:03"},
  {id:3,region:"IN",amount:-1,timestamp:"10:24:04"},
  {id:4,region:"IN",amount:101,timestamp:"10:24:06"},
  {id:5,region:"EU",amount:350,timestamp:"10:24:08"},
];

function aggregate(events:StreamEvent[],scenario:StreamScenarioId):StreamOutput[]{
  const valid=scenario==="filter-only"?events.filter(e=>e.amount>0):events.filter(e=>e.amount>0);
  const map=new Map<string,{total:number;count:number}>();
  for(const event of valid){
    const row=map.get(event.region)??{total:0,count:0};
    row.total+=scenario==="regional-count"?1:event.amount;
    row.count+=1;
    map.set(event.region,row);
  }
  return Array.from(map,([region,value])=>({
    region,
    total:value.total,
    count:value.count,
    windowStart:"10:20:00",
  }));
}

function seedLogs():StreamLog[]{
  return [
    {id:"seed-1",time:"10:24:01",role:"SOURCE",text:"Received event: (IN, 499)"},
    {id:"seed-2",time:"10:24:01",role:"FILTER",text:"Passed (amount > 0)"},
    {id:"seed-3",time:"10:24:01",role:"AGGREGATE",text:"IN total = 499"},
    {id:"seed-4",time:"10:24:02",role:"SOURCE",text:"Received event: (US, 200)"},
    {id:"seed-5",time:"10:24:02",role:"FILTER",text:"Passed (amount > 0)"},
    {id:"seed-6",time:"10:24:02",role:"AGGREGATE",text:"US total = 200"},
    {id:"seed-7",time:"10:24:04",role:"SOURCE",text:"Received event: (IN, -1)"},
    {id:"seed-8",time:"10:24:04",role:"FILTER",text:"Filtered (amount <= 0)"},
    {id:"seed-9",time:"10:24:06",role:"SOURCE",text:"Received event: (IN, 101)"},
    {id:"seed-10",time:"10:24:06",role:"AGGREGATE",text:"IN total = 600"},
    {id:"seed-11",time:"10:24:08",role:"SOURCE",text:"Received event: (EU, 350)"},
    {id:"seed-12",time:"10:24:08",role:"AGGREGATE",text:"EU total = 350"},
  ];
}

export function createKafkaStreamsState():KafkaStreamsState{
  const stateStore=aggregate(seedEvents,"windowed-aggregation");
  return {
    scenario:"windowed-aggregation",
    autoAdvance:true,
    inputEvents:[...seedEvents],
    outputEvents:stateStore,
    stateStore,
    logs:seedLogs(),
    activeStage:"aggregate",
    processedCount:seedEvents.length,
    sequence:6,
    status:"Windowed aggregation is active. Invalid amounts are filtered before grouping and aggregation.",
  };
}

export function setStreamScenario(state:KafkaStreamsState,scenario:StreamScenarioId):KafkaStreamsState{
  const nextStore=aggregate(state.inputEvents,scenario);
  return {
    ...state,
    scenario,
    stateStore:nextStore,
    outputEvents:nextStore,
    activeStage:scenario==="filter-only"?"filter":"aggregate",
    status:`Scenario changed to ${streamScenarios.find(s=>s.id===scenario)?.label??scenario}.`,
  };
}

export function setStreamAutoAdvance(state:KafkaStreamsState,enabled:boolean):KafkaStreamsState{
  return {...state,autoAdvance:enabled,status:enabled?"Auto advance enabled.":"Auto advance disabled."};
}

function clock(sequence:number){
  const total=10*3600+24*60+9+sequence*2;
  const h=Math.floor(total/3600)%24;
  const m=Math.floor((total%3600)/60);
  const s=total%60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

export function addStreamEvent(state:KafkaStreamsState,region="IN",amount=125):KafkaStreamsState{
  const event:StreamEvent={
    id:Math.max(0,...state.inputEvents.map(e=>e.id))+1,
    region,
    amount,
    timestamp:clock(state.sequence),
  };
  const inputEvents=[...state.inputEvents,event].slice(-8);
  return {
    ...state,
    inputEvents,
    sequence:state.sequence+1,
    activeStage:"source",
    status:`Added event ${event.id}: (${event.region}, ${event.amount}). Run the simulation to process it.`,
  };
}

export function runKafkaStreamsSimulation(state:KafkaStreamsState):KafkaStreamsState{
  const event=state.inputEvents.at(-1);
  if(!event)return state;
  const logs:StreamLog[]=[
    {id:`source-${state.sequence}`,time:event.timestamp,role:"SOURCE",text:`Received event: (${event.region}, ${event.amount})`},
  ];

  if(event.amount<=0){
    logs.push({id:`filter-${state.sequence}`,time:event.timestamp,role:"FILTER",text:"Filtered (amount <= 0)"});
    return {
      ...state,
      logs:[...state.logs,...logs].slice(-30),
      activeStage:"filter",
      processedCount:state.processedCount+1,
      sequence:state.sequence+1,
      status:`Event ${event.id} was filtered and produced no output record.`,
    };
  }

  logs.push({id:`filter-${state.sequence}`,time:event.timestamp,role:"FILTER",text:"Passed (amount > 0)"});
  const stateStore=aggregate(state.inputEvents,state.scenario);
  const regional=stateStore.find(row=>row.region===event.region);
  logs.push({
    id:`agg-${state.sequence}`,
    time:event.timestamp,
    role:"AGGREGATE",
    text:state.scenario==="regional-count"
      ?`${event.region} count = ${regional?.total??0}`
      :`${event.region} total = ${regional?.total??0}`,
  });

  return {
    ...state,
    stateStore,
    outputEvents:stateStore,
    logs:[...state.logs,...logs].slice(-30),
    activeStage:state.autoAdvance?"sink":"aggregate",
    processedCount:state.processedCount+1,
    sequence:state.sequence+1,
    status:`Processed event ${event.id}; ${event.region} state is now ${regional?.total??0}.`,
  };
}

export function clearStreamLogs(state:KafkaStreamsState){
  return {...state,logs:[]};
}
