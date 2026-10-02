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
    if(action==="ask"&&context.course==="Data Modeling"&&lesson.id==="er-modeling"){
      const q=question.toLowerCase();
      if(/supplier|vendor/.test(q))text="Add Supplier as its own entity with supplier_id as the primary key. For a simple one-supplier-per-product rule, add supplier_id as a foreign key on Product and model Supplier 1 → many Product. If products can have multiple suppliers, use a ProductSupplier bridge instead.";
      else if(/order ?line|quantity|unit[_ ]?price/.test(q))text="OrderLine is the association between an Order and a Product. Quantity and purchase unit_price belong on OrderLine because they describe one purchased line, not the reusable Product catalog row.";
      else if(/cardinality|1:n|one to many/.test(q))text="State the rule in both directions. Example: one Customer can place many Orders; each Order belongs to exactly one Customer. Put customer_id on Order as the foreign key.";
      else if(/validate|check|error/.test(q))text="Validate four things: every entity has row identity, foreign keys point to valid parent entities, every relationship has explicit cardinality, and the diagram has no ambiguous duplicate relationships.";
      else text="A readable ER model should make entity identity, attributes, relationship verbs, cardinality and optionality visible. Use the builder stages to add entities, then attributes, relationships, cardinality and validation.";
    }
    if(action==="ask"&&context.course==="Data Modeling"&&lesson.id==="normalization"){
      const q=question.toLowerCase();
      if(/1nf|first normal|repeating|atomic/.test(q))text="1NF removes repeating groups so each cell contains one value. In the playground, 'Notebook, Pen' becomes two order-item rows: Notebook quantity 2 and Pen quantity 3.";
      else if(/2nf|second normal|partial depend/.test(q))text="2NF matters when a key has multiple columns. A non-key attribute should depend on the whole candidate key, not only part of it. The playground moves order-level facts to Orders and keeps line quantity at the order-item grain.";
      else if(/3nf|third normal|transitive/.test(q))text="3NF removes inappropriate transitive dependencies between non-key attributes. Customer name and city move behind customer_id, while product name/category/price move behind product_id.";
      else if(/alice|city|update anomal/.test(q))text="Before normalization, Alice and New York repeat on multiple order rows, so a city change can require several updates. In the 3NF model, current customer city is stored once in Customers and orders reference customer_id.";
      else if(/example|another|generate/.test(q))text="Example: imagine Enrollment(student_id, student_name, course_id, course_name, instructor_id, instructor_name). Keep one enrollment row per student-course pair, move student facts behind student_id, course facts behind course_id, and instructor facts behind instructor_id when those dependencies match the business rules.";
      else text="Normalize by dependencies: 1NF makes values atomic, 2NF removes partial dependencies on part of a composite key, and 3NF removes inappropriate transitive dependencies. Use the stage strip to compare exactly what moves at each step.";
    }
    if(action==="ask"&&context.course==="Data Modeling"&&lesson.id==="denormalization"){
      const q=question.toLowerCase();
      if(/when|why|use denormal|should i denormal/.test(q))text="Denormalize for a known read workload when repeated joins or repeated calculations are expensive enough to justify duplicated data. Keep the normalized sources authoritative, declare the read-model grain, and define freshness and reconciliation checks.";
      else if(/stale|refresh|update|change/.test(q))text="A denormalized copy can become stale because source attributes are duplicated. Give the read model a refresh contract, owner, and reconciliation checks so consumers know how current the repeated fields are.";
      else if(/join|three joins|3 joins|zero joins|0 joins/.test(q))text="The normalized query joins Customer → Order → OrderLine at line grain. The read model precomputes that path, so the reporting query can aggregate directly from one wide table with zero joins at read time.";
      else if(/grain|duplicate|double count|total/.test(q))text="Keep one row per order line in this read model. Do not copy an order-level total onto every line and then sum it, because that would double-count orders with multiple lines.";
      else if(/example|different|more columns|change the data/.test(q))text="Another example is a product-sales dashboard that repeatedly joins OrderLine, Product, Category and Store. A governed line-grain read model can repeat product/category/store descriptions for easier reads, provided refresh ownership and history semantics are explicit.";
      else text="Denormalization intentionally repeats selected data for a read workload. In this lesson, normalized Customer, Order and OrderLine rows are joined once at line grain and published as a read model, trading simpler reads for storage and refresh responsibility.";
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
