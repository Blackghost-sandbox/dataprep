import type { MockQuestion, QuestionEvidence } from "@/lib/mock-interviews";
export const evidenceLabels: Record<QuestionEvidence,string> = {
  reported: "Candidate-reported question", topic: "Reported topic · adapted prompt",
  published: "Published interview practice",
};
export interface MockQuestionFilters {search: string; lesson: string; relevance: string; evidence: string}
export function filterMockQuestions(questions: MockQuestion[], filters: MockQuestionFilters): MockQuestion[] {
  const terms = filters.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return questions.filter(q => {
    const text = [q.question,q.answer,q.code ?? "",q.sourceTitle,...q.lessons.map(l => l.title)].join(" ").toLowerCase();
    return terms.every(term => text.includes(term))
      && (!filters.lesson || q.lessons.some(l => l.module + "/" + l.id === filters.lesson))
      && (!filters.relevance || q.relevance === filters.relevance)
      && (!filters.evidence || (filters.evidence === "candidate" ? q.evidence !== "published" : q.evidence === filters.evidence));
  });
}
