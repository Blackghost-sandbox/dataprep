export type OffsetScenarioId = "normal" | "crash-before-commit" | "replay-from-commit";

export type ConsumerOffsetRecord = {
  offset:number;
  order_id:string;
  customer_id:string;
  amount:number;
  product:string;
  event_time:string;
};

export type ConsumerOffsetEvent = {
  id:string;
  time:string;
  role:"FETCH"|"PROCESS"|"SUCCESS"|"COMMIT"|"RESTART";
  text:string;
};

export type ConsumerOffsetsState = {
  partition:number;
  records:ConsumerOffsetRecord[];
  fetchPosition:number;
  lastProcessed:number;
  committedOffset:number;
  autoAdvance:boolean;
  autoCommit:boolean;
  scenario:OffsetScenarioId;
  processingStep:1|2|3;
  running:boolean;
  sequence:number;
  events:ConsumerOffsetEvent[];
  status:string;
};

export const offsetScenarios:Array<{id:OffsetScenarioId;label:string}>=[
  {id:"normal",label:"Normal Flow"},
  {id:"crash-before-commit",label:"Crash Before Commit"},
  {id:"replay-from-commit",label:"Replay From Commit"},
];

const baseRecords:ConsumerOffsetRecord[] = [
  {offset:208,order_id:"A1039",customer_id:"098",amount:129,product:"Mouse",event_time:"2026-10-02 10:24:08"},
  {offset:209,order_id:"A1040",customer_id:"099",amount:249,product:"Keyboard",event_time:"2026-10-02 10:24:10"},
  {offset:210,order_id:"A1041",customer_id:"100",amount:799,product:"Monitor",event_time:"2026-10-02 10:24:11"},
  {offset:211,order_id:"A1042",customer_id:"101",amount:499,product:"Laptop",event_time:"2026-10-02 10:24:15"},
  {offset:212,order_id:"A1043",customer_id:"102",amount:89,product:"Headphones",event_time:"2026-10-02 10:24:16"},
  {offset:213,order_id:"A1044",customer_id:"103",amount:149,product:"Webcam",event_time:"2026-10-02 10:24:17"},
  {offset:214,order_id:"A1045",customer_id:"104",amount:59,product:"Cable",event_time:"2026-10-02 10:24:18"},
  {offset:215,order_id:"A1046",customer_id:"105",amount:299,product:"Dock",event_time:"2026-10-02 10:24:19"},
];

function clock(sequence:number){
  const total=10*3600+24*60+12+sequence;
  const h=Math.floor(total/3600)%24;
  const m=Math.floor((total%3600)/60);
  const s=total%60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

export function createConsumerOffsetsState():ConsumerOffsetsState{
  return {
    partition:1,
    records:baseRecords,
    fetchPosition:211,
    lastProcessed:210,
    committedOffset:211,
    autoAdvance:true,
    autoCommit:true,
    scenario:"normal",
    processingStep:1,
    running:true,
    sequence:5,
    events:[
      {id:"seed-fetch-211",time:"10:24:12",role:"FETCH",text:"Fetched message at offset 211"},
      {id:"seed-process-211",time:"10:24:13",role:"PROCESS",text:"Processing message 211"},
      {id:"seed-success-211",time:"10:24:13",role:"SUCCESS",text:"Processed message 211"},
      {id:"seed-commit-212",time:"10:24:13",role:"COMMIT",text:"Committed offset 212"},
      {id:"seed-fetch-212",time:"10:24:14",role:"FETCH",text:"Fetched message at offset 212"},
    ],
    status:"Ready. Fetch position is independent from durable committed progress.",
  };
}

export function currentOffsetRecord(state:ConsumerOffsetsState){
  return state.records.find(record=>record.offset===state.fetchPosition)??null;
}

export function setOffsetScenario(state:ConsumerOffsetsState,scenario:OffsetScenarioId){
  return {...state,scenario,status:`Scenario changed to ${offsetScenarios.find(item=>item.id===scenario)?.label??scenario}.`};
}

export function setOffsetAutoAdvance(state:ConsumerOffsetsState,enabled:boolean){
  return {...state,autoAdvance:enabled,status:enabled?"Auto advance enabled.":"Auto advance disabled."};
}

export function setOffsetAutoCommit(state:ConsumerOffsetsState,enabled:boolean){
  return {...state,autoCommit:enabled,status:enabled?"Auto commit teaching mode enabled.":"Manual commit mode enabled."};
}

function appendEvents(state:ConsumerOffsetsState,events:ConsumerOffsetEvent[],status:string,overrides:Partial<ConsumerOffsetsState>={}):ConsumerOffsetsState{
  return {
    ...state,
    ...overrides,
    sequence:state.sequence+events.length,
    events:[...state.events,...events].slice(-28),
    status,
  };
}

export function fetchOffsetMessage(state:ConsumerOffsetsState){
  const record=currentOffsetRecord(state);
  if(!record)return {...state,status:"No retained record exists at the current fetch position."};
  const event:ConsumerOffsetEvent={
    id:`fetch-${state.sequence}-${record.offset}`,
    time:clock(state.sequence),
    role:"FETCH",
    text:`Fetched message at offset ${record.offset}`,
  };
  return appendEvents(state,[event],`Fetched P${state.partition}:${record.offset}. Fetching does not mean processing or commit.`,{processingStep:1,running:true});
}

export function processOffsetMessage(state:ConsumerOffsetsState){
  const record=currentOffsetRecord(state);
  if(!record)return {...state,status:"No record is available to process at the current fetch position."};

  const processEvent:ConsumerOffsetEvent={id:`process-${state.sequence}-${record.offset}`,time:clock(state.sequence),role:"PROCESS",text:`Processing message ${record.offset}`};
  const successEvent:ConsumerOffsetEvent={id:`success-${state.sequence}-${record.offset}`,time:clock(state.sequence+1),role:"SUCCESS",text:`Processed message ${record.offset}`};

  if(state.scenario==="crash-before-commit"){
    const restartEvent:ConsumerOffsetEvent={id:`restart-${state.sequence}-${record.offset}`,time:clock(state.sequence+2),role:"RESTART",text:`Crash before commit; restart from committed offset ${state.committedOffset}`};
    return appendEvents(
      state,
      [processEvent,successEvent,restartEvent],
      `Processed offset ${record.offset} but crashed before commit. Restart returns to committed offset ${state.committedOffset}.`,
      {lastProcessed:record.offset,fetchPosition:state.committedOffset,processingStep:1,running:true}
    );
  }

  const processed=appendEvents(
    state,
    [processEvent,successEvent],
    `Processed offset ${record.offset}. The safe next commit is ${record.offset+1}.`,
    {lastProcessed:record.offset,processingStep:3}
  );

  if(state.autoCommit)return commitConsumerOffset(processed);
  return processed;
}

export function commitConsumerOffset(state:ConsumerOffsetsState){
  const next=Math.max(state.committedOffset,state.lastProcessed+1);
  const event:ConsumerOffsetEvent={
    id:`commit-${state.sequence}-${next}`,
    time:clock(state.sequence),
    role:"COMMIT",
    text:`Committed offset ${next}`,
  };
  let fetchPosition=state.fetchPosition;
  let events=[event];
  if(state.autoAdvance&&next<=state.records.at(-1)!.offset){
    fetchPosition=next;
    events=[
      event,
      {id:`fetch-${state.sequence+1}-${next}`,time:clock(state.sequence+1),role:"FETCH",text:`Fetched message at offset ${next}`},
    ];
  }
  return appendEvents(
    state,
    events,
    `Committed next offset ${next}. On restart, this group resumes from ${next} while that offset is retained.`,
    {committedOffset:next,fetchPosition,processingStep:fetchPosition===next?1:3}
  );
}

export function replayFromCommittedOffset(state:ConsumerOffsetsState){
  const fetchPosition=state.committedOffset;
  const event:ConsumerOffsetEvent={
    id:`restart-${state.sequence}-${fetchPosition}`,
    time:clock(state.sequence),
    role:"RESTART",
    text:`Restarted consumer from committed offset ${fetchPosition}`,
  };
  return appendEvents(state,[event],`Restarted from durable committed offset ${fetchPosition}.`,{fetchPosition,processingStep:1,running:true});
}

export function runConsumerOffsetsScenario(state:ConsumerOffsetsState){
  if(state.scenario==="replay-from-commit")return replayFromCommittedOffset(state);
  const fetched=fetchOffsetMessage(state);
  return processOffsetMessage(fetched);
}

export function clearConsumerOffsetEvents(state:ConsumerOffsetsState){
  return {...state,events:[]};
}

export function offsetProgress(state:ConsumerOffsetsState){
  return {
    lastProcessed:state.lastProcessed,
    committed:state.committedOffset,
    nextToFetch:state.fetchPosition,
  };
}
