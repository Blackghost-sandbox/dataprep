import type { SparkLesson } from "@/lib/spark-lessons";
import { sqlConceptGuides } from "@/lib/sql-concepts";

export type CompanionMode="idle"|"reactive"|"teaching"|"conversation";
export type Expression="idle"|"greeting"|"listening"|"thinking"|"explaining"|"success"|"celebration"|"hint"|"encouragement";
export type LearningEvent={type:"lesson_opened"|"exercise_started"|"exercise_correct"|"exercise_error"|"repeated_error"|"lesson_completed";lesson:string;source?:"quiz"|"runner"|"self-check";emittedAt?:number};
export interface ExerciseContext {task?:string;userCode?:string;executionResult?:string;executionError?:string;hint?:string;solution?:string}
export interface CompanionContext {course:string;lesson:SparkLesson;tab:string;exercise?:ExerciseContext}
export type CompanionAction="ask"|"explain"|"simply"|"example"|"hint"|"error"|"solution";
export type ChatTurn={role:"user"|"assistant";text:string};
export interface CompanionReply {text:string;source:"lesson"|"provider"|"unavailable";expression:Expression}
export interface SelectedContext {course:string;lesson:string;concept:string;currentExample?:string;currentExercise?:string;userCode?:string;executionResult?:string;executionError?:string}
const limit=(text:string|undefined,max:number)=>text?.slice(0,max);
export function selectCompanionContext(context:CompanionContext,action:CompanionAction,question:string):SelectedContext {
  const selected:SelectedContext={course:context.course,lesson:context.lesson.title,concept:context.lesson.concepts[0]?.[1].slice(0,800)??context.lesson.description};
  const codeRelated=/\b(code|query|error|fail|debug|exercise|solution)\b/i.test(question)||["hint","error","solution"].includes(action);
  if(action==="example")selected.currentExample=limit(context.lesson.example.code,1800);
  if(codeRelated&&context.tab==="Hands-on"){
    selected.currentExercise=limit(context.exercise?.task??context.lesson.practice.task,800);
    selected.userCode=limit(context.exercise?.userCode,3000);
    selected.executionError=limit(context.exercise?.executionError,800);
    selected.executionResult=limit(context.exercise?.executionResult,800);
  }
  return selected;
}
export function recentTurns(history:ChatTurn[]){return history.slice(-4).map(turn=>({...turn,text:turn.text.slice(0,1200)}));}
export class CompanionCache {
  private entries=new Map<string,CompanionReply>();
  get(key:string){return this.entries.get(key);}
  set(key:string,value:CompanionReply){if(this.entries.size>=32)this.entries.delete(this.entries.keys().next().value!);this.entries.set(key,value);}
}
export interface CompanionTransport {request(input:{action:CompanionAction;question:string;context:SelectedContext;history:ChatTurn[];hintLevel:number;revealSolution:boolean},signal?:AbortSignal):Promise<CompanionReply>}
/** Only instantiate after a secure, authenticated, rate-limited backend is configured. Never pass API keys here. */
export class BackendCompanionTransport implements CompanionTransport {
  constructor(private endpoint:string){if(!endpoint.startsWith("/api/")||endpoint.includes(".."))throw new Error("Use a same-origin API endpoint.");}
  async request(input:Parameters<CompanionTransport["request"]>[0],signal?:AbortSignal):Promise<CompanionReply>{
    const response=await fetch(this.endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input),signal});
    if(!response.ok)throw new Error("Mithoo’s AI service is unavailable. Local lesson tools still work.");
    const value=await response.json();
    if(!value||typeof value!=="object"||!("text" in value)||typeof value.text!=="string"||!value.text.trim())throw new Error("The AI service returned an empty response.");
    return {text:value.text.slice(0,6000),source:"provider",expression:"explaining"};
  }
}
export class AICompanionService {
  private cache=new CompanionCache();
  constructor(private transport?:CompanionTransport){}
  get configured(){return Boolean(this.transport);}
  async respond(action:CompanionAction,context:CompanionContext,question="",history:ChatTurn[]=[],hintLevel=1,signal?:AbortSignal):Promise<CompanionReply>{
    const lesson=context.lesson;
    const guide=context.course==="SQL Fundamentals"?sqlConceptGuides[lesson.id]:undefined;
    // Cache only static lesson content. No user code, errors or conversation are stored here.
    const cacheable=["explain","simply","example"].includes(action);
    const cacheKey=JSON.stringify(["v1",context.course,lesson.id,action,lesson.concepts,lesson.example]);
    if(cacheable){const cached=this.cache.get(cacheKey);if(cached)return cached;}
    let text="";
    if(action==="explain")text=`Let’s make ${lesson.title} clear. ${lesson.concepts[0]?.[1]??lesson.description}\n\n${lesson.concepts[1]?.[1]??""}\n\nTry this: ${lesson.example.walkthrough[0]} Pause and predict the output before checking it.`;
    if(action==="simply")text=guide?`Think: “${guide.question}”\n\n${guide.takeaway}\n\n${guide.parts.map(([part,meaning])=>`${part}: ${meaning}`).join("\n")}\n\nRemember: ${guide.remember}`:`One idea to focus on: ${lesson.description}\n\n${lesson.example.walkthrough[0]}\n\n${lesson.concepts[0]?.[1]??""}`;
    if(action==="example")text=`Here’s the lesson’s worked example:\n\n${lesson.example.code}\n\nExpected sample result (not live execution):\n${lesson.example.output}`;
    if(action==="hint"){
      if(context.tab!=="Hands-on")text="Open Hands-on and I’ll help you work through the current exercise one hint at a time.";
      else if(hintLevel===1)text=`Start by naming the required output. Which rows or values should remain?\n\nYour task: ${context.exercise?.task??lesson.practice.task}`;
      else if(hintLevel===2)text=context.exercise?.hint??lesson.practice.hint;
      else text=`Trace one input row through the steps. Check the column names and the expected result shape before changing your code.\n\n${lesson.mistakes[0]?.better??"Compare the result to the requirement."}\n\nThe worked solution stays hidden until you ask for it.`;
    }
    if(action==="solution")text=`You asked for the worked solution:\n\n${context.exercise?.solution??lesson.practice.solution}\n\nRun it in your learning environment and explain each step. I haven’t executed it.`;
    if(action==="ask"&&/^(show|reveal|give)( me)? (the )?(full |worked )?(answer|solution)[.!]?$/i.test(question.trim()))return this.respond("solution",context,"",[],hintLevel,signal);
    if(action==="ask"&&/^(give me a hint|hint|help me start)[.!]?$/i.test(question.trim()))return this.respond("hint",context,"",[],Math.max(1,hintLevel),signal);
    if(action==="ask"&&context.course==="Data Modeling"&&lesson.id==="snowflake-schema"){
      const q=question.toLowerCase();
      if(/difference|star.*snowflake|snowflake.*star/.test(q))text="A star schema keeps descriptive dimensions flatter and usually joins the fact directly to them. A snowflake schema normalizes some dimension hierarchies into related sub-dimensions, such as Product → Subcategory → Category. The trade-off is less repeated descriptive data versus more joins and navigation.";
      else if(/product|subcategory|category|hierarch/.test(q))text="Follow the product branch: FACT_SALES stores product_key, DIM_PRODUCT stores subcategory_key, DIM_SUBCATEGORY stores category_key, and DIM_CATEGORY stores the governed category name. Each referenced key should be unique so the path does not multiply fact rows.";
      else if(/customer|segment/.test(q))text="The customer branch is also snowflaked: FACT_SALES → Customer → Customer Segment. Segment descriptions live once in the sub-dimension instead of repeating on every customer row.";
      else if(/query|join|sales/.test(q))text="The sample analytical query traverses FACT_SALES → Product → Subcategory → Category, then groups by category_name and sums amount. More joins are expected in this normalized hierarchy, so validate row counts and totals after each relationship.";
      else if(/redundan|duplicate|repeat/.test(q))text="Snowflaking can reduce repeated descriptive attributes because shared hierarchy values live in their own tables. It does not automatically make a model faster, and over-normalizing tiny attributes can make analysis harder.";
      else if(/when|use/.test(q))text="Evaluate snowflaking when a dimension contains a governed hierarchy or shared attributes that benefit from centralized ownership. Compare that benefit with the extra joins, consumer complexity, engine behavior and maintenance cost.";
      else text="Select any table in the simulation and trace its keys. The core idea is that the fact still records the business event, while some dimensions are normalized further into sub-dimensions with one-to-many relationships.";
    }
    if(text){const reply:CompanionReply={text,source:"lesson",expression:action==="hint"?"hint":"explaining"};if(cacheable)this.cache.set(cacheKey,reply);return reply;}
    if(!this.transport)return {source:"unavailable",expression:"encouragement",text:"Custom AI answers aren’t connected yet. I can still explain this lesson, show its example, quiz you, or offer progressive hints locally. Your question and code have not been sent to an AI provider."};
    return this.transport.request({action,question:question.slice(0,1200),context:selectCompanionContext(context,action,question),history:recentTurns(history),hintLevel,revealSolution:action==="solution"},signal);
  }
}
export class ReactionEngine {
  private last=-Infinity;
  react(event:LearningEvent,now=Date.now()):{text:string;expression:Expression}|null{
    if(now-this.last<45000||event.type==="exercise_started"||event.type==="exercise_error")return null;
    this.last=now;
    if(event.type==="lesson_completed")return {text:`You marked ${event.lesson} complete. Ready to try the next lesson?`,expression:"celebration"};
    if(event.type==="exercise_correct")return {text:event.source==="quiz"?`Correct on the ${event.lesson} quiz. Can you explain why?`:`You marked your ${event.lesson} self-check complete.`,expression:"success"};
    if(event.type==="repeated_error")return {text:`Let’s revisit one idea in ${event.lesson}. A hint is here when you want it.`,expression:"hint"};
    return {text:`Learning ${event.lesson}? I’m Mithoo. Let’s make it simple, one step at a time.`,expression:"greeting"};
  }
}
