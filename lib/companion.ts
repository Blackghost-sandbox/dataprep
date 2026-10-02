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
      if(context.course==="Data Modeling"&&lesson.id==="entities"){
        if(hintLevel===1)text="For the last item, ask one question: does “belongs_to” name a thing, describe a thing, or connect one thing to another?";
        else if(hintLevel===2)text="“belongs_to” describes an association — for example, a Product belongs to a Category. Which of the three classification buckets represents associations?";
        else text="Place belongs_to in Relationship, then run the checker. Relationships connect entities; they are not entities or descriptive attributes.";
      }else if(context.course==="Data Modeling"&&lesson.id==="keys"){
        if(hintLevel===1)text="Try one violation at a time. A duplicate customer_id tests PRIMARY KEY uniqueness; customer_id = 99 on an order tests whether the parent Customer exists.";
        else if(hintLevel===2)text="Separate row identity from relationship validity: PRIMARY KEY checks the row itself, FOREIGN KEY checks a referenced row, UNIQUE checks duplicate business values, and CHECK validates a condition.";
        else text="Fix the highlighted cells, then run validation again. For the reference state, order row 4 needs an existing customer_id and order row 5 needs amount > 0.";
      }else if(context.tab!=="Hands-on")text="Open Hands-on and I’ll help you work through the current exercise one hint at a time.";
      else if(hintLevel===1)text=`Start by naming the required output. Which rows or values should remain?\n\nYour task: ${context.exercise?.task??lesson.practice.task}`;
      else if(hintLevel===2)text=context.exercise?.hint??lesson.practice.hint;
      else text=`Trace one input row through the steps. Check the column names and the expected result shape before changing your code.\n\n${lesson.mistakes[0]?.better??"Compare the result to the requirement."}\n\nThe worked solution stays hidden until you ask for it.`;
    }
    if(action==="solution")text=`You asked for the worked solution:\n\n${context.exercise?.solution??lesson.practice.solution}\n\nRun it in your learning environment and explain each step. I haven’t executed it.`;
    if(action==="ask"&&/^(show|reveal|give)( me)? (the )?(full |worked )?(answer|solution)[.!]?$/i.test(question.trim()))return this.respond("solution",context,"",[],hintLevel,signal);
    if(action==="ask"&&/^(give me a hint|hint|help me start)[.!]?$/i.test(question.trim()))return this.respond("hint",context,"",[],Math.max(1,hintLevel),signal);
    if(action==="ask"&&context.course==="Data Modeling"&&lesson.id==="cardinality"){
      const q=question.toLowerCase();
      if(/zero|no orders?|0 orders?/.test(q))text="A customer with zero orders is still valid in a 1:N model when minimum participation on the Order side is 0. The customer row exists without any child Order rows referencing it.";
      else if(/1:?1|one[- ]to[- ]one|one to one/.test(q))text="In a 1:1 relationship, each row can match at most one row on the other side. A foreign key plus UNIQUE on the referencing column is a common relational implementation.";
      else if(/n:?m|many[- ]to[- ]many|many to many/.test(q))text="A many-to-many relationship is normally implemented with a bridge such as Enrollment(student_id, course_id). Each bridge row connects one Student to one Course.";
      else if(/foreign key|fk/.test(q))text="For Customer 1:N Order, the foreign key belongs on Order.customer_id. Many order rows may repeat the same customer_id; that repetition is what enables one customer to have many orders.";
      else text="Cardinality states how many rows may participate on each side of a relationship. Compare 1:1, 1:N, and N:M by changing row counts in the simulation and watching the links and inspector update.";
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
