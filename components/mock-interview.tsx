"use client";
import { useState } from "react";
import { Search, ExternalLink, MessageSquareText } from "lucide-react";
import { SyntaxText } from "@/components/syntax-editor";
import { filterMockQuestions, evidenceLabels } from "@/lib/mock-question-filters";
import type { MockRound } from "@/lib/mock-interviews";

import glossary from "@/lib/qa-glossary.json";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const terms = Object.keys(glossary).sort((a,b) => b.length-a.length);
const termPattern = new RegExp("\\b(" + terms.map(t => t.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")).join("|") + ")\\b", "gi");
function Keyword({term}: {term:string}) {
  const [open,setOpen] = useState(false);
  const entry = glossary[term.toLowerCase() as keyof typeof glossary];
  return <Tooltip open={open} onOpenChange={setOpen}><TooltipTrigger asChild><button type="button" className="qa-keyword" aria-label={term + ": show explanation"} onClick={() => setOpen(value => !value)}>{term}</button></TooltipTrigger><TooltipContent className="qa-definition" sideOffset={8} collisionPadding={16}><strong>{term}</strong><p>{entry.meaning}</p><div><span>Example</span><p>{entry.example}</p></div></TooltipContent></Tooltip>;
}
function highlightAnswer(answer: string, module: string) {
  const seen = new Set<string>();
  return answer.split(termPattern).map((part,index) => {
    if (index % 2 === 0 || seen.has(part.toLowerCase())) return part;
    // Ordinary prose such as "where supported" is not a SQL clause.
    if (["where", "select", "case", "count", "sum", "rank", "distinct", "like"].includes(part.toLowerCase()) && part !== part.toUpperCase()) return part;
    if (["ref", "source"].includes(part.toLowerCase()) && module !== "dbt") return part;
    seen.add(part.toLowerCase());
    return <Keyword term={part} key={index}/>;
  });
}

export function MockInterview({round}: {round: MockRound}) {
  const [search, setSearch] = useState("");
  const [lesson, setLesson] = useState("");
  const [relevance, setRelevance] = useState("");
  const [evidence, setEvidence] = useState("");
  const lessons = [...new Map(round.questions.flatMap(q => q.lessons)
    .map(l => [l.module + "/" + l.id, l])).entries()];
  const questions = filterMockQuestions(round.questions, {search, lesson, relevance, evidence});
  const evidenceCounts = round.questions.reduce((counts, question) => {
    counts[question.evidence] = (counts[question.evidence] ?? 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  const evidenceOrder = {reported: 0, topic: 1, published: 2, authored: 3};
  questions.sort((a,b) => evidenceOrder[a.evidence] - evidenceOrder[b.evidence]);
  const filtered = Boolean(search || lesson || relevance || evidence);
  const reset = () => {setSearch(""); setLesson(""); setRelevance(""); setEvidence("");};
  return <TooltipProvider delayDuration={350}><section className="mock-question-bank" aria-label="Questions and answers">
    <header className="mock-bank-heading">
      <div className="mock-bank-title"><span className="mock-bank-icon"><MessageSquareText size={22} aria-hidden="true"/></span><div><h2>Questions & answers</h2><p>Candidate reports and topic interview practice, clearly labeled. Hover or tap highlighted terms to learn their meaning.</p></div></div>
      <span className="mock-bank-count">{round.questions.length} questions</span>
    </header>
    <div className="mock-bank-filters">
      <label className="mock-bank-search"><span>Search questions and answers</span><div><Search size={17} aria-hidden="true"/><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Try window functions, retries, SCD…"/></div></label>
      <label><span>Lesson</span><select value={lesson} onChange={e => setLesson(e.target.value)}><option value="">All lessons</option>{lessons.map(([key,l]) => <option key={key} value={key}>{round.id === "mixed-round" ? l.module.toUpperCase() + " · " : ""}{l.title}</option>)}</select></label>
      <label><span>Interview relevance</span><select value={relevance} onChange={e => setRelevance(e.target.value)}><option value="">All relevance levels</option><option value="High">High · core skills</option><option value="Role-specific">Role-specific · stack skills</option><option value="Advanced">Advanced · senior scenarios</option></select></label>
      <label><span>Question evidence</span><select value={evidence} onChange={e => setEvidence(e.target.value)}><option value="">All sources</option><option value="candidate">Candidate reports only</option><option value="reported">Reported questions</option><option value="topic">Reported topics</option><option value="published">Published practice</option><option value="authored">Topic interview practice</option></select></label>
    </div>
    <p className="mock-bank-context">{evidenceCounts.reported ?? 0} candidate-reported questions · {evidenceCounts.topic ?? 0} reported-topic prompts · {(evidenceCounts.published ?? 0) + (evidenceCounts.authored ?? 0)} topic/practice questions. Relevance is an editorial preparation priority, not measured company frequency. Model answers are independently authored; technical references do not establish employer attribution.</p>
    <div className="mock-bank-results"><p role="status" aria-live="polite">{questions.length} of {round.questions.length} questions · answers shown below</p>{filtered && <button onClick={reset}>Clear filters</button>}</div>
    <div className="mock-bank-list">
      {questions.map(q => <article className="mock-bank-question" key={q.id} aria-labelledby={q.id}>
        <div className="mock-question-meta"><span className={"mock-relevance mock-relevance-" + q.relevance.toLowerCase()}>{q.relevance === "High" ? "High interview relevance" : q.relevance + " relevance"}</span><span className={"mock-evidence mock-evidence-" + q.evidence}>{evidenceLabels[q.evidence]}</span></div>
        <h3 id={q.id}>{q.question}</h3>
        <p className="mock-question-answer">{highlightAnswer(q.answer, q.module)}</p>
        {q.code && <div className="mock-answer-code"><div>{q.language === "sql" ? "SQL · PostgreSQL-compatible" : "Python · reference solution"}</div><pre><code><SyntaxText code={q.code}/></code></pre></div>}
        <footer><span className="mock-question-topics">{q.lessons.map(l => l.title).join(" · ")}</span><a href={q.source} target="_blank" rel="noopener noreferrer">{q.sourceTitle}<ExternalLink size={13} aria-hidden="true"/><span className="sr-only"> (opens in a new tab)</span></a>{q.sourceNote && <small>{q.sourceNote}</small>}</footer>
      </article>)}
      {!questions.length && <div className="mock-bank-empty"><h3>No matching questions</h3><p>Try another search or broaden your filters.</p><button onClick={reset}>Show all questions</button></div>}
    </div>
  </section></TooltipProvider>;
}
