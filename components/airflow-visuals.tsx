"use client";
import { useId, useState } from "react";
import { BookOpen, GitBranch } from "lucide-react";
import { GlossaryText } from "@/components/glossary";
import { DarkCodeCard } from "@/components/rdd-dataframe-experience";
import { useWalkthrough, WalkthroughControls } from "@/components/walkthrough-controls";
import { executionScenario, taskStateMeaning, type ExecutionKind } from "@/lib/airflow-execution";
import type { AirflowLesson } from "@/lib/airflow-lessons";

function Execution({kind,exhausted=false}:{kind:ExecutionKind;exhausted?:boolean}) {
  const scenario=executionScenario(kind,exhausted);
  const controls=useWalkthrough(scenario.frames.length);
  const frame=scenario.frames[controls.step];
  const [selected,setSelected]=useState<string|null>(null);
  const marker=useId().replace(/:/g,"");
  const height=(Math.max(...scenario.nodes.map(n=>n.row))+1)*100;
  const node=scenario.nodes.find(n=>n.id===(selected??frame.focus))!;
  return <div className="airflow-execution">
    <p className="spark-caption">Educational trace · one possible execution order, not a live Airflow run.</p>
    <div className="airflow-execution-grid"><div className="airflow-graph" style={{height}}>
      <svg viewBox={`0 0 600 ${height}`} preserveAspectRatio="none" aria-hidden="true"><defs><marker id={marker} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="#9186df"/></marker></defs>{scenario.edges.map(([from,to])=>{const a=scenario.nodes.find(n=>n.id===from)!;const b=scenario.nodes.find(n=>n.id===to)!;return <path key={from+to} d={`M ${100+a.column*200} ${a.row*100+67} L ${100+b.column*200} ${b.row*100+16}`} stroke="#9186df" strokeWidth="2" fill="none" markerEnd={`url(#${marker})`}/>;})}</svg>
      {scenario.nodes.map(n=><button key={n.id} className={`airflow-node airflow-state-${frame.states[n.id]}`} style={{left:`${n.column*33.333}%`,top:n.row*100+17}} aria-pressed={node.id===n.id} onClick={()=>setSelected(n.id)}><strong>{n.id}</strong><small>{frame.states[n.id]==="none"?"not started":frame.states[n.id]}</small></button>)}
    </div><div className="airflow-narration"><span className="spark-index">{controls.step+1}</span><h3>{frame.title}</h3><p className="spark-caption">Responsible: {frame.actor}</p><p aria-live="polite">{frame.explanation}</p><hr/><h4>{node.id}</h4><p>{taskStateMeaning[frame.states[node.id]]}</p>{selected&&<button onClick={()=>setSelected(null)}>Follow current task</button>}</div></div>
    <WalkthroughControls state={controls} stableNavigation/>
    <details><summary>Dependencies behind this graph</summary><DarkCodeCard title="Python · dependency sketch" code={scenario.code}/></details>
  </div>;
}
function Schedule({catchup}:{catchup:boolean}) {
  const [enabled,setEnabled]=useState(false);
  const [day,setDay]=useState(0);
  const intervals=["Jan 1 02:00 → Jan 2 02:00","Jan 2 02:00 → Jan 3 02:00","Jan 3 02:00 → Jan 4 02:00"];
  return <><p>Explicit daily interval timetable · UTC · now: Jan 4, 2026, 03:00. Assume no previous runs.</p>{catchup&&<label className="airflow-toggle"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/> catchup={enabled?"True":"False"}</label>}<div className="topic-row">{intervals.map((label,i)=><button className="topic-box" key={label} aria-pressed={day===i} onClick={()=>setDay(i)}><strong>{label}</strong><p>{catchup?(enabled||i===2?"Eligible missing interval":"Not automatically caught up"):"Click to inspect interval"}</p></button>)}</div><div className="spark-answer"><strong>Selected interval: {intervals[day]}</strong><p>Start included; end excluded. The scheduled run becomes due after Jan {day+2} at 02:00 UTC—not at the start of this interval. Capacity can delay actual execution.</p>{catchup&&<p>Backfill is a separate, explicit historical-range request. Choose reprocessing policy deliberately; catchup=False does not prevent manual backfills.</p>}</div></>;
}
const roles=[
  ["DAG processor","Parses and serializes workflow definitions. Check import errors when a DAG is missing."],
  ["Scheduler","Evaluates run and task eligibility, dependencies, pools and concurrency."],
  ["Executor","Dispatches eligible work using the configured execution environment."],
  ["Task execution","Runs task code. In Airflow 3, Task SDK operations use the execution API boundary."],
  ["Metadata database","Persists orchestration state, not the bulk sales dataset."],
  ["API server / UI","Exposes supported APIs and the interface for inspecting runs and logs."],
];
function Architecture(){const [role,setRole]=useState(0);return <><div className="airflow-role-grid">{roles.map(([name],i)=><button className="topic-box" aria-pressed={role===i} key={name} onClick={()=>setRole(i)}>{name}</button>)}</div><p className="spark-answer">{roles[role][1]}</p><p className="topic-note">Control path: definition → scheduling → dispatch → execution. Metadata and UI support this path; they are not additional data-processing tasks.</p></>;}
function Monitoring(){const [issue,setIssue]=useState(0);const cases=[
  ["Invalid data","ValueError: Missing amount","Inspect the task log and input contract. Correct or quarantine the invalid record before rerunning; retries alone do not repair its schema."],
  ["Authentication","AuthenticationError: access denied","Check the Connection and secret permissions. Never paste passwords into logs or your answer."],
  ["Queued task","State: queued; task has not started","Check executor health, pools, queues and available capacity before debugging the task body."],
];return <><div className="spark-actions">{cases.map(([name],i)=><button key={name} aria-pressed={issue===i} onClick={()=>setIssue(i)}>{name}</button>)}</div><pre className="spark-output">{cases[issue][1]}</pre><p className="spark-answer">{cases[issue][2]}</p><p className="spark-caption">Illustrative diagnostic evidence, not logs from a connected deployment.</p></>;}
function ReferenceFlow({kind}:{kind:AirflowLesson["visual"]}){const [choice,setChoice]=useState(0);const groups=kind==="xcom"?[
  ["Return bulk rows","Large dataset → XCom → consumer","Avoid coupling orchestration messages to bulk storage. Write data durably and pass a compact reference."],
  ["Return a storage reference","Producer → durable dataset; URI → XCom → consumer","The consumer reads the dataset with its own authorized access. This preview does not create an object."],
]:kind==="config"?[
  ["Variable","Deployment configuration → task","Use for non-secret shared settings; avoid repeated network lookups at DAG parse time."],
  ["Param","Validated run input → task context","Use for supported per-run inputs and validation, not for embedding credentials."],
  ["Connection","Connection ID → approved secret lookup","Use for service access. Never expose retrieved credentials in task logs or XCom."],
]:[
  ["Blind append on retry","Attempt 1: order 501 → attempt 2: order 501 again","A repeat can duplicate the business event. An orchestration retry does not make an external write exactly-once."],
  ["Idempotent write","Business key 501 → insert/update the same target row","Use a defined key and transactional write strategy. Validate totals and handle partial failures explicitly."],
];return <><div className="spark-actions">{groups.map(([title],i)=><button key={title} aria-pressed={choice===i} onClick={()=>setChoice(i)}>{title}</button>)}</div><div className="topic-driver">{groups[choice][1]}</div><p className="spark-answer">{groups[choice][2]}</p></>;}
export function AirflowConcept({lesson,onTab}:{lesson:AirflowLesson;onTab?:(tab:string)=>void}){
  const [exhausted,setExhausted]=useState(false);
  return <><h2><BookOpen size={22}/>{lesson.title}</h2><p><GlossaryText>{lesson.concepts[0][1]}</GlossaryText></p><section className="topic-visual"><h3><GitBranch size={20}/> {lesson.visual==="execution"?"Follow the execution":"Build the mental model"}</h3>{lesson.visual==="execution"?<>{lesson.execution==="retries"&&<label className="airflow-toggle"><input type="checkbox" checked={exhausted} onChange={e=>setExhausted(e.target.checked)}/> Second attempt also fails</label>}<Execution key={String(exhausted)} kind={lesson.execution??"chain"} exhausted={exhausted}/></>:lesson.visual==="architecture"?<Architecture/>:lesson.visual==="schedule"||lesson.visual==="catchup"?<Schedule catchup={lesson.visual==="catchup"}/>:lesson.visual==="monitoring"?<Monitoring/>:<ReferenceFlow kind={lesson.visual}/>}</section><div className="spark-concepts">{lesson.concepts.slice(1).map(([title,body])=><article key={title}><h3>{title}</h3><p><GlossaryText>{body}</GlossaryText></p></article>)}</div><p className="spark-answer"><strong>Key takeaway: </strong><GlossaryText>{lesson.takeaway}</GlossaryText></p><button className="spark-primary" onClick={()=>onTab?.("Examples")}>Explore the matching example →</button></>;
}
