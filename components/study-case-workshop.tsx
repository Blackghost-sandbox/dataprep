"use client";
import { useState } from "react";
import { ArrowRight, Check, GitBranch, ShieldCheck, TriangleAlert } from "lucide-react";
import type { StudyFocus, TeachingModule } from "@/lib/study-tab-content";

const contexts: Record<TeachingModule, [string, string, string]> = {
  sql: ["Analytics request", "Query decision", "Result contract"],
  python: ["Pipeline input", "Transformation decision", "Verified output"],
  modeling: ["Business requirement", "Model decision", "Data integrity"],
  spark: ["Distributed workload", "Execution decision", "Correctness & performance"],
  airflow: ["Scheduled workload", "Orchestration decision", "Reliable completion"],
  kafka: ["Event stream", "Delivery decision", "Durable progress"],
  dbt: ["Warehouse requirement", "Model decision", "Trusted relation"],
  cloud: ["Cloud workload", "Service decision", "Operational evidence"],
  system: ["Consumer requirement", "Architecture decision", "Recovery evidence"]
};
export function StudyCaseWorkshop({ focus, module, lessonTitle }: { focus: StudyFocus; module: TeachingModule; lessonTitle: string }) {
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const labels = contexts[module];
  const correctIndex = lessonTitle.length % 3;
  const options = [...focus.distractors];
  options.splice(correctIndex, 0, focus.answer);
  return <section className="study-case" aria-label="Decision case study">
    <header><span className="study-case-tag"><GitBranch size={17}/> CASE STUDY</span><h3>{lessonTitle} in a real workload</h3><p>Make the decision first. Then inspect the result and the failure boundary.</p></header>
    <div className="study-case-flow">
      <article><span className="study-stage-number">01</span><h4>{labels[0]}</h4><p>{focus.question}</p></article>
      <ArrowRight className="study-flow-arrow" size={23}/>
      <article className="study-case-decision"><span className="study-stage-number">02</span><h4>{labels[1]}</h4><fieldset><legend>Choose the approach you would defend</legend>{options.map((option, i) => <label className="study-option" key={option}><input type="radio" name="study-case-choice" checked={choice === i} onChange={() => { setChoice(i); setChecked(false); }}/><span>{option}</span></label>)}</fieldset><button className="study-primary" disabled={choice === null} onClick={() => setChecked(true)}>Inspect this decision</button></article>
      <ArrowRight className="study-flow-arrow" size={23}/>
      <article className="study-case-outcome"><span className="study-stage-number">03</span><h4>{labels[2]}</h4>{checked ? <div role="status"><strong className={choice === correctIndex ? "study-case-success" : "study-case-review"}>{choice === correctIndex ? "✓ Appropriate choice" : "Review your choice"}</strong><p>{focus.answer}</p><p>{focus.reason}</p></div> : <p>Choose an approach to reveal the outcome and why it meets the requirement.</p>}</article>
    </div>
    <div className="study-case-boundary"><div><TriangleAlert size={21}/><h4>Now change the conditions</h4><p>{focus.edge}</p></div><div><ShieldCheck size={21}/><h4>Evidence to collect</h4><p>{focus.verify}</p></div></div>
  </section>;
}
export function InterviewRubric({ checked, onChange }: { checked: boolean[]; onChange: (next: boolean[]) => void }) {
  const criteria = ["I gave a direct answer before adding detail.", "I explained why the approach works.", "I included a concrete input and expected outcome.", "I discussed a failure case or trade-off."];
  return <aside className="study-interview-rubric"><h3><Check size={19}/> What a strong answer includes</h3>{criteria.map((criterion, i) => <label className="study-check" key={criterion}><input type="checkbox" checked={checked[i] ?? false} onChange={e => { const next = [...checked]; next[i] = e.target.checked; onChange(next); }}/>{criterion}</label>)}<p className="study-caption">Self-review · {checked.filter(Boolean).length}/4 covered</p></aside>;
}
