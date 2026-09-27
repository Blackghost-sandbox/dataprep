/** Pure, deterministic teaching models. Not a Kafka client or broker emulator. */
export const orderEvent={event_id:"evt-1042",type:"OrderCreated",order_id:1042,customer_id:77,amount:499};
export type EventStage="created"|"sent"|"routed"|"appended"|"read"|"processed"|"committed";
export const eventStages:EventStage[]=["created","sent","routed","appended","read","processed","committed"];
export function eventSnapshot(step:number){
  const n=Math.max(0,Math.min(6,step));
  return {stage:eventStages[n],partition:n>=2?1:null,offset:n>=3?211:null,read:n>=4,processed:n>=5,committed:n>=6?212:211,logs:[[100,101,102],n>=3?[210,211]:[210],[320,321]]};
}
// Explicit classroom routing table, NOT Kafka's default hash implementation.
export const keyRoutes:Record<string,number>={"101":2,"205":0,"330":1};
export function teachingPartition(key:string){return keyRoutes[key]??null;}
export function assignPartitions(members:string[],partitions=3):Record<string,number[]>{
  const result:Record<string,number[]>=Object.fromEntries(members.map(m=>[m,[]]));
  if(members.length)for(let p=0;p<partitions;p++)result[members[p%members.length]].push(p);
  return result;
}
export type DeliveryMode="at-least-once"|"at-most-once";
export function recoveryTrace(mode:DeliveryMode){
  return mode==="at-least-once"?[
    {title:"Read P1:211",committed:211,effects:0,next:211,note:"Fetch the record. No external effect or commit yet."},
    {title:"Process the order",committed:211,effects:1,next:212,note:"The external write completes, but the durable consumer commit still says 211."},
    {title:"Crash before commit",committed:211,effects:1,next:211,note:"Restart from committed offset 211. The same record will be read again."},
    {title:"Replay the record",committed:211,effects:2,next:212,note:"A naive append repeats the effect. A sink keyed by event_id could deduplicate it."},
    {title:"Commit 212",committed:212,effects:2,next:212,note:"The group resumes at the next offset. The duplicate effect already happened."},
  ]:[
    {title:"Read P1:211",committed:211,effects:0,next:211,note:"The record has not produced its intended external effect."},
    {title:"Commit 212 first",committed:212,effects:0,next:212,note:"Progress advances before the application processes the record."},
    {title:"Crash before processing",committed:212,effects:0,next:212,note:"The record remains in Kafka, but this group will resume after it."},
    {title:"Restart at 212",committed:212,effects:0,next:212,note:"Offset 211 is skipped by this group’s normal resume path: its effect is lost."},
  ];
}
export function replicaSnapshot(step:number){
  const n=Math.max(0,Math.min(4,step));
  return {leader:n>=4?2:1,failed:n>=3?1:null,copies:[n>=1,n>=2,n>=2],acknowledged:n>=2,available:n!==3};
}
export function lag(endOffset:number,committedNext:number){return Math.max(0,endOffset-committedNext);}
export function streamTotals(){return [{region:"IN",amount:499},{region:"US",amount:200},{region:"IN",amount:-1},{region:"IN",amount:101}].filter(e=>e.amount>0).reduce<Record<string,number>>((totals,e)=>({...totals,[e.region]:(totals[e.region]??0)+e.amount}),{});}
