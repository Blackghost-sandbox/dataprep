export type KafkaDatasetId = "orders" | "payments";
export type KafkaScenarioId = "normal" | "slow-consumer" | "burst";

export type ProducerRecord = {
  event_type: "order" | "payment";
  order_id: number;
  customer_id: string;
  amount: number;
  product: string;
};

export type StoredProducerRecord = ProducerRecord & {
  partition: number;
  offset: number;
  timestamp: string;
};

export type ConsumerId = "a" | "b" | "c";
export type ConsumerState = {
  id: ConsumerId;
  label: string;
  partition: number;
  next: number;
  active: boolean;
  last: StoredProducerRecord | null;
};

export type TimelineRole = "producer" | "topic" | "a" | "b" | "c";
export type TimelineEvent = {
  id: string;
  time: string;
  role: TimelineRole;
  text: string;
};

export type ProducerConsumerState = {
  cursor: number;
  logs: StoredProducerRecord[][];
  consumers: Record<ConsumerId, ConsumerState>;
  timeline: TimelineEvent[];
  selected: StoredProducerRecord | null;
  runCount: number;
  status: string;
};

export const datasetCatalog: Array<{id: KafkaDatasetId; label: string}> = [
  {id: "orders", label: "E-commerce Orders"},
  {id: "payments", label: "Payment Events"},
];

export const scenarioCatalog: Array<{id: KafkaScenarioId; label: string}> = [
  {id: "normal", label: "Normal Flow"},
  {id: "slow-consumer", label: "Slow Consumer"},
  {id: "burst", label: "Producer Burst"},
];

export const producerDatasets: Record<KafkaDatasetId, ProducerRecord[]> = {
  orders: [
    {event_type:"order",order_id:1001,customer_id:"C77",amount:499,product:"Laptop"},
    {event_type:"order",order_id:1002,customer_id:"C12",amount:89,product:"Headphones"},
    {event_type:"order",order_id:1003,customer_id:"C31",amount:129,product:"Keyboard"},
    {event_type:"order",order_id:1004,customer_id:"C44",amount:59,product:"Mouse"},
    {event_type:"order",order_id:1005,customer_id:"C18",amount:1199,product:"Monitor"},
    {event_type:"order",order_id:1006,customer_id:"C66",amount:149,product:"Webcam"},
    {event_type:"order",order_id:1007,customer_id:"C90",amount:249,product:"Dock"},
    {event_type:"order",order_id:1008,customer_id:"C53",amount:39,product:"USB-C Cable"},
    {event_type:"order",order_id:1009,customer_id:"C26",amount:799,product:"Tablet"},
    {event_type:"order",order_id:1010,customer_id:"C71",amount:1299,product:"Phone"},
    {event_type:"order",order_id:1011,customer_id:"C15",amount:299,product:"Chair"},
    {event_type:"order",order_id:1012,customer_id:"C82",amount:699,product:"Desk"},
  ],
  payments: [
    {event_type:"payment",order_id:5001,customer_id:"C09",amount:299,product:"Card"},
    {event_type:"payment",order_id:5002,customer_id:"C21",amount:89,product:"UPI"},
    {event_type:"payment",order_id:5003,customer_id:"C30",amount:549,product:"Card"},
    {event_type:"payment",order_id:5004,customer_id:"C41",amount:119,product:"Wallet"},
    {event_type:"payment",order_id:5005,customer_id:"C52",amount:899,product:"Card"},
    {event_type:"payment",order_id:5006,customer_id:"C63",amount:69,product:"UPI"},
    {event_type:"payment",order_id:5007,customer_id:"C74",amount:399,product:"Card"},
    {event_type:"payment",order_id:5008,customer_id:"C85",amount:159,product:"Wallet"},
    {event_type:"payment",order_id:5009,customer_id:"C96",amount:729,product:"Card"},
    {event_type:"payment",order_id:5010,customer_id:"C17",amount:209,product:"UPI"},
    {event_type:"payment",order_id:5011,customer_id:"C28",amount:999,product:"Card"},
    {event_type:"payment",order_id:5012,customer_id:"C39",amount:49,product:"Wallet"},
  ],
};

const consumerIds: ConsumerId[] = ["a","b","c"];
const baseByDataset: Record<KafkaDatasetId, number> = {orders:1001,payments:5001};

export function routeProducerRecord(record: ProducerRecord, dataset: KafkaDatasetId) {
  return Math.abs(record.order_id - baseByDataset[dataset]) % 3;
}

export function deterministicTime(sequence: number) {
  const seconds = 12 + sequence * 4;
  const minute = 24 + Math.floor(seconds / 60);
  const second = seconds % 60;
  return `10:${String(minute).padStart(2,"0")}:${String(second).padStart(2,"0")}`;
}

function makeConsumers(): Record<ConsumerId, ConsumerState> {
  return {
    a:{id:"a",label:"Consumer A",partition:0,next:0,active:true,last:null},
    b:{id:"b",label:"Consumer B",partition:1,next:0,active:true,last:null},
    c:{id:"c",label:"Consumer C",partition:2,next:0,active:true,last:null},
  };
}

function appendTimeline(timeline: TimelineEvent[], events: TimelineEvent[]) {
  return [...timeline, ...events].slice(-24);
}

function appendOne(previous: ProducerConsumerState, dataset: KafkaDatasetId, scenario: KafkaScenarioId, record: ProducerRecord) {
  const partition = routeProducerRecord(record,dataset);
  const offset = previous.logs[partition].length;
  const sequence = previous.logs.reduce((total, rows) => total + rows.length, 0);
  const timestamp = deterministicTime(sequence);
  const stored: StoredProducerRecord = {...record,partition,offset,timestamp};
  const logs = previous.logs.map((rows,index)=>index===partition?[...rows,stored]:rows);
  const consumerId = consumerIds[partition];
  const consumer = previous.consumers[consumerId];
  const paused = scenario === "slow-consumer" && partition === 2;
  const consumers = {
    ...previous.consumers,
    [consumerId]: {
      ...consumer,
      active: !paused,
      next: paused ? consumer.next : logs[partition].length,
      last: paused ? consumer.last : stored,
    },
  };
  const topicName = dataset === "orders" ? "orders" : "payments";
  const events: TimelineEvent[] = [
    {id:`${record.order_id}-producer`,time:timestamp,role:"producer",text:`Producer sent message (order_id: ${record.order_id})`},
    {id:`${record.order_id}-topic`,time:timestamp,role:"topic",text:`Message routed to partition ${partition}`},
  ];
  if (!paused) events.push({id:`${record.order_id}-consumer`,time:timestamp,role:consumerId,text:`${consumer.label} fetched message from partition ${partition}`});
  else events.push({id:`${record.order_id}-consumer-paused`,time:timestamp,role:"c",text:"Consumer C is intentionally slow; message remains available in partition 2"});
  return {
    ...previous,
    cursor: previous.cursor + 1,
    logs,
    consumers,
    timeline: appendTimeline(previous.timeline,events),
    selected: stored,
    status: paused
      ? `${topicName} / P2 received order ${record.order_id}; Consumer C is lagging by ${logs[2].length-consumers.c.next} record(s).`
      : `${consumer.label} fetched order ${record.order_id} from ${topicName} / P${partition} at offset ${offset}.`,
  };
}

export function newProducerConsumerState(dataset: KafkaDatasetId, seedCount = 7): ProducerConsumerState {
  let state: ProducerConsumerState = {
    cursor:0,
    logs:[[],[],[]],
    consumers:makeConsumers(),
    timeline:[],
    selected:null,
    runCount:0,
    status:"Ready. Run the simulation or send the next message.",
  };
  const source = producerDatasets[dataset];
  for (let i=0;i<Math.min(seedCount,source.length);i++) state=appendOne(state,dataset,"normal",source[i]);
  return {
    ...state,
    selected: state.logs[0][0] ?? state.logs[1][0] ?? state.logs[2][0] ?? null,
    timeline: state.timeline.slice(0,6),
    runCount:0,
    status:"Ready. Producer records are stored in three partitions and each consumer owns one partition.",
  };
}

export function runProducerConsumer(previous: ProducerConsumerState, dataset: KafkaDatasetId, scenario: KafkaScenarioId) {
  const source = producerDatasets[dataset];
  if (previous.cursor >= source.length) return {...previous,status:"Dataset complete. Reset or choose another scenario to replay."};
  const batch = scenario === "burst" ? 3 : 1;
  let state = previous;
  for (let i=0;i<batch && state.cursor<source.length;i++) state=appendOne(state,dataset,scenario,source[state.cursor]);
  return {...state,runCount:previous.runCount+1};
}

export function consumerLag(state: ProducerConsumerState, id: ConsumerId) {
  const consumer = state.consumers[id];
  return Math.max(0,state.logs[consumer.partition].length-consumer.next);
}
