export type ConnectScenarioId = "normal" | "sink-retry" | "transform-error";
export type ConnectEventRole = "SOURCE" | "TASK" | "TRANSFORM" | "SINK" | "ERROR";

export type ConnectRecord = {
  id:string;
  order_id:number;
  user_id:number;
  amount:number;
  product:string;
  user_email:string;
  created_at:string;
};

export type TransformedRecord = {
  order_id:number;
  user_id:number;
  total_amount:number;
  product:string;
  user_email:string;
  created_at:string;
};

export type ConnectorTask = {
  id:number;
  status:"Running"|"Retrying"|"Failed";
  records:number;
  retries:number;
};

export type ConnectEvent = {
  id:string;
  time:string;
  role:ConnectEventRole;
  text:string;
};

export type KafkaConnectState = {
  scenario:ConnectScenarioId;
  running:boolean;
  sequence:number;
  sourceRecords:number;
  processedRecords:number;
  consumerLag:number;
  retries:number;
  dlqRecords:number;
  latencyMs:number;
  topicRate:number;
  sourceTasks:ConnectorTask[];
  sinkTasks:ConnectorTask[];
  sourceRecord:ConnectRecord;
  transformedRecord:TransformedRecord;
  topicOffsets:number[];
  events:ConnectEvent[];
  status:string;
};

export const connectScenarios:Array<{id:ConnectScenarioId;label:string}> = [
  {id:"normal",label:"PostgreSQL → Kafka → Warehouse"},
  {id:"sink-retry",label:"Sink Retry / Recovery"},
  {id:"transform-error",label:"Transform Error → DLQ"},
];

function clock(sequence:number){
  const total=10*3600+22*60+11+sequence;
  const h=Math.floor(total/3600)%24;
  const m=Math.floor((total%3600)/60);
  const s=total%60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function sourceRecord(sequence:number):ConnectRecord{
  return {
    id:`record-${sequence}`,
    order_id:1043+sequence,
    user_id:207+sequence,
    amount:299,
    product:"Laptop",
    user_email:"john@example.com",
    created_at:"2024-01-20T10:22:11Z",
  };
}

function transform(record:ConnectRecord):TransformedRecord{
  return {
    order_id:record.order_id,
    user_id:record.user_id,
    total_amount:record.amount,
    product:record.product,
    user_email:"j***@example.com",
    created_at:record.created_at,
  };
}

export function createKafkaConnectState():KafkaConnectState{
  const initial=sourceRecord(0);
  return {
    scenario:"normal",
    running:true,
    sequence:0,
    sourceRecords:1245,
    processedRecords:12438,
    consumerLag:8,
    retries:1,
    dlqRecords:0,
    latencyMs:820,
    topicRate:3.2,
    sourceTasks:[
      {id:0,status:"Running",records:1245,retries:0},
      {id:1,status:"Running",records:1198,retries:0},
    ],
    sinkTasks:[
      {id:0,status:"Running",records:1220,retries:0},
      {id:1,status:"Running",records:1210,retries:1},
    ],
    sourceRecord:initial,
    transformedRecord:transform(initial),
    topicOffsets:[102,103,104],
    events:[
      {id:"seed-0",time:"10:22:11",role:"SOURCE",text:"Detected new row in public.orders (id=1043)"},
      {id:"seed-1",time:"10:22:11",role:"TASK",text:"Task 0 polled 1 record (offset: 3921)"},
      {id:"seed-2",time:"10:22:12",role:"TRANSFORM",text:"Applied RenameField: amount → total_amount"},
      {id:"seed-3",time:"10:22:12",role:"SINK",text:"Task 1 wrote record to Snowflake (order_id=1043)"},
      {id:"seed-4",time:"10:22:14",role:"TASK",text:"Task 1 retrying record (attempt 1/3)"},
      {id:"seed-5",time:"10:22:14",role:"ERROR",text:"Temporary network error to Snowflake (HTTP 503)"},
      {id:"seed-6",time:"10:22:16",role:"SINK",text:"Record successfully written after retry (order_id=1044)"},
    ],
    status:"Connect pipeline is running: PostgreSQL → source connector → Kafka → transforms → sink connector → Snowflake.",
  };
}

export function setConnectScenario(state:KafkaConnectState,scenario:ConnectScenarioId){
  return {...state,scenario,status:`Scenario changed to ${connectScenarios.find(item=>item.id===scenario)?.label??scenario}.`};
}

function appendEvents(state:KafkaConnectState,events:ConnectEvent[],patch:Partial<KafkaConnectState>,status:string):KafkaConnectState{
  return {
    ...state,
    ...patch,
    sequence:state.sequence+events.length,
    events:[...state.events,...events].slice(-40),
    status,
  };
}

export function runKafkaConnectSimulation(state:KafkaConnectState):KafkaConnectState{
  const next=sourceRecord(state.sequence+1);
  const transformed=transform(next);

  if(state.scenario==="transform-error"){
    const events:ConnectEvent[]=[
      {id:`src-${state.sequence}`,time:clock(state.sequence),role:"SOURCE",text:`Detected new row in public.orders (id=${next.order_id})`},
      {id:`task-${state.sequence}`,time:clock(state.sequence),role:"TASK",text:"Source task emitted record to topic orders"},
      {id:`transform-${state.sequence}`,time:clock(state.sequence+1),role:"TRANSFORM",text:"Applied MaskField(user_email)"},
      {id:`error-${state.sequence}`,time:clock(state.sequence+1),role:"ERROR",text:"Flatten transform failed validation; routed record to DLQ"},
    ];
    return appendEvents(
      state,
      events,
      {
        sourceRecord:next,
        transformedRecord:transformed,
        sourceRecords:state.sourceRecords+1,
        processedRecords:state.processedRecords+1,
        dlqRecords:state.dlqRecords+1,
        consumerLag:state.consumerLag+1,
        latencyMs:1140,
      },
      `Transform failed for order ${next.order_id}; record routed to DLQ and sink write skipped.`
    );
  }

  if(state.scenario==="sink-retry"){
    const events:ConnectEvent[]=[
      {id:`src-${state.sequence}`,time:clock(state.sequence),role:"SOURCE",text:`Detected new row in public.orders (id=${next.order_id})`},
      {id:`task-${state.sequence}`,time:clock(state.sequence),role:"TASK",text:"Source task wrote record to Kafka topic orders"},
      {id:`transform-${state.sequence}`,time:clock(state.sequence+1),role:"TRANSFORM",text:"Applied RenameField + MaskField"},
      {id:`retry-${state.sequence}`,time:clock(state.sequence+1),role:"TASK",text:"Sink task retrying record (attempt 1/3)"},
      {id:`err-${state.sequence}`,time:clock(state.sequence+2),role:"ERROR",text:"Temporary Snowflake write failure (HTTP 503)"},
      {id:`sink-${state.sequence}`,time:clock(state.sequence+3),role:"SINK",text:`Record written after retry (order_id=${next.order_id})`},
    ];
    return appendEvents(
      state,
      events,
      {
        sourceRecord:next,
        transformedRecord:transformed,
        sourceRecords:state.sourceRecords+1,
        processedRecords:state.processedRecords+1,
        retries:state.retries+1,
        consumerLag:Math.max(0,state.consumerLag-1),
        latencyMs:1260,
        sinkTasks:state.sinkTasks.map(task=>task.id===1?{...task,records:task.records+1,retries:task.retries+1,status:"Running"}:task),
        topicOffsets:state.topicOffsets.map((offset,index)=>index===1?offset+1:offset),
      },
      `Order ${next.order_id} reached Snowflake after one retry.`
    );
  }

  const events:ConnectEvent[]=[
    {id:`src-${state.sequence}`,time:clock(state.sequence),role:"SOURCE",text:`Detected new row in public.orders (id=${next.order_id})`},
    {id:`task-${state.sequence}`,time:clock(state.sequence),role:"TASK",text:"Source task polled and published record"},
    {id:`transform-${state.sequence}`,time:clock(state.sequence+1),role:"TRANSFORM",text:"Applied RenameField(amount → total_amount), MaskField(user_email)"},
    {id:`sink-${state.sequence}`,time:clock(state.sequence+2),role:"SINK",text:`Wrote record to Snowflake orders_analytics (order_id=${next.order_id})`},
  ];
  return appendEvents(
    state,
    events,
    {
      sourceRecord:next,
      transformedRecord:transformed,
      sourceRecords:state.sourceRecords+1,
      processedRecords:state.processedRecords+1,
      consumerLag:Math.max(0,state.consumerLag-1),
      latencyMs:790,
      sourceTasks:state.sourceTasks.map(task=>task.id===0?{...task,records:task.records+1}:task),
      sinkTasks:state.sinkTasks.map(task=>task.id===0?{...task,records:task.records+1}:task),
      topicOffsets:state.topicOffsets.map((offset,index)=>index===0?offset+1:offset),
    },
    `Order ${next.order_id} moved end-to-end from PostgreSQL to Snowflake successfully.`
  );
}

export function clearConnectEvents(state:KafkaConnectState){
  return {...state,events:[]};
}

export function resetKafkaConnectState(){
  return createKafkaConnectState();
}
