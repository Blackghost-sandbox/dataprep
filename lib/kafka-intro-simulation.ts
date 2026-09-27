import {lag} from "@/lib/kafka-model";
export type IntroSpeed=1|2|3;
export type IntroConfig={partitions:number;producer:IntroSpeed;a:IntroSpeed;b:IntroSpeed};
export type OrderRecord={order_id:number;item:string;amount:number;event_type:"order"};
export type StoredOrder=OrderRecord & {partition:number;offset:number};
export type ReaderState={next:number[];last:StoredOrder|null;due:number;cursor:number};
export type IntroState={tick:number;created:number;pending:{event:OrderRecord;phase:"created"|"sent"}|null;logs:StoredOrder[][];a:ReaderState;b:ReaderState;producerDue:number;active:"producer"|"topic"|"a"|"b"|"idle";message:string;history:Array<{tick:number;role:string;text:string}>};
export const defaultIntroConfig:IntroConfig={partitions:3,producer:2,a:3,b:1};
export const introLimit=12;
export function newIntroState(partitions=3):IntroState{
 const reader=():ReaderState=>({next:Array(partitions).fill(0),last:null,due:0,cursor:0});
 return {tick:0,created:0,pending:null,logs:Array.from({length:partitions},()=>[]),a:reader(),b:reader(),producerDue:0,active:"idle",message:"Send an order or step through the flow. Both applications maintain independent read positions.",history:[]};
}
export function readerLag(state:IntroState,reader:"a"|"b"){return state.logs.reduce((total,rows,p)=>total+lag(rows.length,state[reader].next[p]),0);}
export function introFinished(state:IntroState){return state.created>=introLimit&&!state.pending&&readerLag(state,"a")===0&&readerLag(state,"b")===0;}
const interval=(speed:IntroSpeed)=>speed===3?1:speed===2?5:18;
function log(state:IntroState,role:IntroState["active"],text:string):IntroState{return {...state,active:role,message:text,history:[...state.history,{tick:state.tick,role,text}].slice(-24)};}
export function advanceIntro(previous:IntroState,config:IntroConfig,manualSend=false,item="Laptop",amount=1200):IntroState{
 if(introFinished(previous))return previous;
 let state={...previous,tick:previous.tick+1};
 if(state.pending){
  if(state.pending.phase==="created")return log({...state,pending:{...state.pending,phase:"sent"}},"producer",`Producer sent order ${state.pending.event.order_id} to orders.`);
  // Explicit classroom round-robin; not Kafka's default producer partitioner.
  const partition=(state.pending.event.order_id-1000)%config.partitions;
  const record={...state.pending.event,partition,offset:state.logs[partition].length};
  const logs=state.logs.map((rows,p)=>p===partition?[...rows,record]:rows);
  return log({...state,logs,pending:null,producerDue:state.tick+interval(config.producer)},"topic",`Stored order ${record.order_id} in orders / P${partition}, offset ${record.offset}.`);
 }
 const candidates:Array<{role:"producer"|"a"|"b";due:number}>=[];
 if(state.created<introLimit)candidates.push({role:"producer",due:manualSend?-1:state.producerDue});
 for(const role of ["a","b"] as const)if(readerLag(state,role)>0)candidates.push({role,due:state[role].due});
 candidates.sort((x,y)=>x.due-y.due);
 const chosen=candidates[0];
 if(!chosen)return state;
 // Advance the teaching clock to the next eligible action; no real timestamps.
 state={...state,tick:Math.max(state.tick,chosen.due)};
 if(chosen.role==="producer"){
  const event:OrderRecord={order_id:1001+state.created,item,amount,event_type:"order"};
  return log({...state,created:state.created+1,pending:{event,phase:manualSend?"sent":"created"}},"producer",`Producer ${manualSend?"sent":"created"} order ${event.order_id}.`);
 }
 const role=chosen.role,reader=state[role];
 let partition=reader.cursor;
 for(let n=0;n<config.partitions;n++){const p=(reader.cursor+n)%config.partitions;if(reader.next[p]<state.logs[p].length){partition=p;break;}}
 const record=state.logs[partition][reader.next[partition]];
 const next=reader.next.map((offset,p)=>p===partition?offset+1:offset);
 return log({...state,[role]:{next,last:record,due:state.tick+interval(config[role]),cursor:(partition+1)%config.partitions}},role,`Consumer ${role.toUpperCase()} read P${partition}, offset ${record.offset} (order ${record.order_id}). Record remains retained.`);
}
