"use client";

import { useState } from "react";
import { ArrowRight, Lightbulb, Target } from "lucide-react";
import { GlossaryTerm } from "@/components/glossary";

const concepts = ["DataFrame", "Partitioning", "Shuffle", "Catalyst Optimizer", "DAG", "Transformations"];

export function RelatedConceptsCard() {
  const [map, setMap] = useState(false);
  return <section className="sidebar-learning-card"><header><h3>Related Concepts</h3><button type="button" aria-expanded={map} onClick={() => setMap(!map)}>{map ? "Hide map" : "View concept map"}</button></header><div className="related-concept-list">{concepts.map(concept => <GlossaryTerm key={concept} term={concept}/>)}</div>{map && <div className="concept-map" aria-label="RDD and DataFrame concept relationships"><span>RDD</span><ArrowRight size={14}/><span>DAG</span><ArrowRight size={14}/><span>Transformations</span><span>DataFrame</span><ArrowRight size={14}/><span>Catalyst Optimizer</span><ArrowRight size={14}/><span>Partitioning / Shuffle</span></div>}</section>;
}

export function CommonInterviewCard() {
  const [view, setView] = useState<"answer" | "hint" | "solution" | null>(null);
  const [answer, setAnswer] = useState("");
  return <section className="sidebar-learning-card interview-sidebar-card"><header><h3><Target size={18}/> Common Interview Question</h3><span>Medium</span></header><p className="interview-question-copy">Why are DataFrames generally faster than RDDs?</p><div className="interview-card-actions"><button type="button" onClick={() => setView("answer")}>Try answering</button><button type="button" onClick={() => setView("hint")}>Show hint</button><button type="button" onClick={() => setView("solution")}>View solution</button></div>
    {view === "answer" && <div className="interview-reveal"><label htmlFor="sidebar-interview-answer">Your answer</label><textarea id="sidebar-interview-answer" value={answer} onChange={event => setAnswer(event.target.value)} placeholder="Explain schema, Catalyst, and the trade-off…"/><small>Saved only while this page remains open. Your answer is not automatically graded.</small></div>}
    {view === "hint" && <div className="interview-reveal hint"><Lightbulb size={16}/><p>Think about what Spark can understand from named columns and built-in expressions before execution.</p></div>}
    {view === "solution" && <div className="interview-reveal solution"><h4>Strong answer</h4><p>DataFrames expose schema and structured expressions, so Catalyst can analyze and optimize the query plan. RDDs permit arbitrary record-level functions, which give Spark less information for query-plan optimization. The actual result still depends on the workload.</p><h4>Mention</h4><p>Schema, Catalyst, logical and physical plans, built-in expressions.</p><h4>Avoid</h4><p>“DataFrames are always faster.” State that the comparison is workload-dependent.</p><h4>Follow-up</h4><p>When would an RDD still be the right choice?</p></div>}
  </section>;
}
