import { sqlLessons } from "@/lib/sql-lessons";
import { sparkLessons, type SparkLesson } from "@/lib/spark-lessons";
import { modelingLessons } from "@/lib/data-modeling";
import { airflowLessons } from "@/lib/airflow-lessons";
import { kafkaLessons } from "@/lib/kafka-lessons";
import { dbtLessons } from "@/lib/dbt-lessons";
import { cloudLessons } from "@/lib/cloud-lessons";
import { systemDesignLessons } from "@/lib/system-design-lessons";
export interface MockQuestion {id:string;question:string;answer:string;followup:string;topic:string;source:string;criteria:string[]}
export interface MockRound extends SparkLesson {questions:MockQuestion[]}
const tracks=[
  {id:"sql",title:"SQL Interview",lessons:sqlLessons,criteria:["State the row grain and SQL operation clearly.","Explain the result with a concrete example, including NULLs or duplicates where relevant.","Identify a correctness or performance trade-off."]},
  {id:"modeling",title:"Data Modeling Interview",lessons:modelingLessons,criteria:["Declare the grain, identity or relationship involved.","Explain the design with a business example.","Discuss history, integrity or a workload trade-off."]},
  {id:"spark",title:"Apache Spark Interview",lessons:sparkLessons,criteria:["Give a direct answer using the correct Spark concept.","Trace execution or data movement with an example.","Discuss correctness, resource cost or a limitation."]},
  {id:"airflow",title:"Apache Airflow Interview",lessons:airflowLessons,criteria:["Distinguish workflow definitions from runtime state.","Explain dependencies, scheduling or recovery with a concrete example.","Describe a relevant failure case and a safe operational response."]},
  {id:"kafka",title:"Apache Kafka Interview",lessons:kafkaLessons,criteria:["Scope the guarantee to its partition, group or processing boundary.","Trace an event or progress state with an example.","Explain a failure/replay risk and mitigation."]},
  {id:"dbt",title:"dbt Interview",lessons:dbtLessons,criteria:["Explain the model/dependency or configuration accurately.","Describe how you would validate the result.","Discuss an adapter, correctness or maintenance trade-off."]},
  {id:"cloud",title:"Cloud Architecture Interview",lessons:cloudLessons,criteria:["Clarify the workload requirements before choosing a service.","Explain data flow and responsibility boundaries.","Discuss security, resilience and cost trade-offs."]},
  {id:"system",title:"System Design Interview",lessons:systemDesignLessons,criteria:["Clarify requirements and make explicit scale assumptions.","Explain the data flow and justify critical component choices.","Discuss failures, recovery and the main bottleneck or trade-off."]},
];
function questionsFor(track:typeof tracks[number]):MockQuestion[]{
  const indices=[0,Math.floor(track.lessons.length/3),Math.floor(track.lessons.length*2/3),track.lessons.length-1];
  return indices.map(i=>{const lesson=track.lessons[i],question=lesson.interview[0];return {...question,id:track.id+"-"+lesson.id,topic:lesson.title,source:"/#"+track.id+"/"+lesson.id+"/Interview%20Qs",criteria:track.criteria};});
}
const topics=tracks.map(track=>({id:track.id+"-round",title:track.title,questions:questionsFor(track)}));
const mixed={id:"mixed-round",title:"Full Data Engineer Mock",questions:topics.map(t=>t.questions[1])};
export const mockRounds:MockRound[]=[...topics,mixed].map(round=>({
  ...round,minutes:round.questions.length*5,description:`${round.questions.length} curated questions · practice or timed mode · structured self-review.`,
  concepts:[["Interview reminder","Answer directly, explain the mechanism, use an example, then discuss a trade-off. Scores are your self-assessment, not an automated hiring verdict."]],
  flow:[],example:{code:"",output:"",walkthrough:[]},practice:{task:"Complete this mock round.",hint:"Use a concrete example.",solution:"Review against the supplied model answers and rubric.",output:"Saved self-review"},interview:round.questions,mistakes:[],quiz:[],
}));
export type Phase="setup"|"active"|"paused"|"review"|"complete";
export interface MockResult {date:string;score:number;max:number;answered:number;assisted:number;seconds:number}
export interface MockState {phase:Phase;mode:"practice"|"timed";index:number;seconds:number;answers:string[];followups:string[];revealed:boolean[];ratings:(number|null)[][];notes:string;history:MockResult[]}
export function emptyMock(round:MockRound):MockState{return {phase:"setup",mode:"practice",index:0,seconds:0,answers:round.questions.map(()=>""),followups:round.questions.map(()=>""),revealed:round.questions.map(()=>false),ratings:round.questions.map(q=>q.criteria.map(()=>null)),notes:"",history:[]};}
export function readMock(raw:unknown,round:MockRound):MockState{
  const base=emptyMock(round);if(!raw||typeof raw!=="object")return base;const s=raw as Partial<MockState>;
  const string=(x:unknown)=>typeof x==="string"?x.slice(0,50000):"";
  const phase:Phase=["setup","active","paused","review","complete"].includes(s.phase??"")?s.phase!:"setup";
  return {...base,phase:phase==="active"?"paused":phase,mode:s.mode==="timed"?"timed":"practice",index:Number.isInteger(s.index)?Math.max(0,Math.min(round.questions.length-1,s.index!)):0,seconds:typeof s.seconds==="number"&&Number.isFinite(s.seconds)?Math.max(0,Math.floor(s.seconds)):0,
    answers:base.answers.map((_,i)=>string(s.answers?.[i])),followups:base.followups.map((_,i)=>string(s.followups?.[i])),revealed:base.revealed.map((_,i)=>s.revealed?.[i]===true),ratings:base.ratings.map((r,i)=>r.map((_,j)=>[0,1,2].includes(s.ratings?.[i]?.[j] as number)?s.ratings![i][j]:null)),notes:string(s.notes),
    history:Array.isArray(s.history)?s.history.filter(r=>r&&typeof r.date==="string"&&Number.isFinite(Date.parse(r.date))&&[r.score,r.max,r.answered,r.assisted,r.seconds].every(n=>typeof n==="number"&&Number.isFinite(n)&&n>=0)&&r.score<=r.max).slice(-10):[],};
}
export function mockSummary(state:MockState){const values=state.ratings.flat();return {score:values.reduce<number>((sum,n)=>sum+(n??0),0),max:values.length*2,rated:values.filter(n=>n!==null).length,total:values.length,answered:state.answers.filter(a=>a.trim()).length,assisted:state.revealed.filter(Boolean).length};}
export function tickMock(state:MockState,delta:number,limit:number):MockState{if(state.phase!=="active")return state;const seconds=state.seconds+Math.max(0,delta);return {...state,seconds:state.mode==="timed"?Math.min(seconds,limit):seconds,phase:state.mode==="timed"&&seconds>=limit?"paused":"active"};}
