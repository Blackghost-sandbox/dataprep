import { sqlLessons } from "@/lib/sql-lessons";
import { pythonLessons } from "@/lib/python-lessons";
import { sparkLessons, type SparkLesson } from "@/lib/spark-lessons";
import { modelingLessons } from "@/lib/data-modeling";
import { airflowLessons } from "@/lib/airflow-lessons";
import { kafkaLessons } from "@/lib/kafka-lessons";
import { dbtLessons } from "@/lib/dbt-lessons";
import { cloudLessons } from "@/lib/cloud-lessons";
import { systemDesignLessons } from "@/lib/system-design-lessons";
import bank from "@/lib/mock-question-bank.json";
import type { TeachingModule } from "@/lib/study-tab-content";

export type QuestionEvidence = "reported" | "topic" | "published";
export type InterviewRelevance = "High" | "Role-specific" | "Advanced";
export interface InterviewSource {
  title: string; url: string; kind: "candidate" | "published";
  note: string; checkedAt: string;
}
interface SourcedQuestion {
  id: string; module: TeachingModule; lessonIds: string[]; sourceId: string;
  evidence: QuestionEvidence; relevance: InterviewRelevance;
  question: string; answer: string; code?: string; language?: string;
}
export interface MockQuestion extends SourcedQuestion {
  topic: string; source: string; sourceTitle: string; sourceNote: string;
  lessons: {id: string; title: string; module: TeachingModule}[];
}
export interface MockRound extends SparkLesson { questions: MockQuestion[] }
export const interviewSources = bank.sources as Record<string, InterviewSource>;
export const mockTracks = [
  {id:"sql",title:"SQL Questions & Answers",lessons:sqlLessons},
  {id:"python",title:"Python Questions & Answers",lessons:pythonLessons},
  {id:"modeling",title:"Data Modeling Questions & Answers",lessons:modelingLessons},
  {id:"spark",title:"Apache Spark Questions & Answers",lessons:sparkLessons},
  {id:"airflow",title:"Apache Airflow Questions & Answers",lessons:airflowLessons},
  {id:"kafka",title:"Apache Kafka Questions & Answers",lessons:kafkaLessons},
  {id:"dbt",title:"dbt Questions & Answers",lessons:dbtLessons},
  {id:"cloud",title:"Cloud Questions & Answers",lessons:cloudLessons},
  {id:"system",title:"System Design Questions & Answers",lessons:systemDesignLessons},
] satisfies {id: TeachingModule; title: string; lessons: SparkLesson[]}[];
export const allMockQuestions: MockQuestion[] = (bank.questions as SourcedQuestion[]).map(question => {
  const track = mockTracks.find(track => track.id === question.module)!;
  const source = interviewSources[question.sourceId];
  const lessons = question.lessonIds.map(id => ({
    id, module: question.module, title: track.lessons.find(lesson => lesson.id === id)!.title,
  }));
  return {...question, lessons, topic: lessons[0].title, source: source.url,
    sourceTitle: source.title, sourceNote: source.note};
});
export const mockRounds: MockRound[] = [
  ...mockTracks.map(track => ({id: track.id + "-round", title: track.title,
    questions: allMockQuestions.filter(question => question.module === track.id)})),
  {id:"mixed-round",title:"All Questions & Answers",questions:allMockQuestions},
].map(round => ({
  ...round, minutes: 0,
  description: `${round.questions.length} sourced questions and model answers, with interview relevance and lesson coverage.`,
  concepts: [], flow: [], example: {code:"",output:"",walkthrough:[]},
  practice: {task:"",hint:"",solution:"",output:""},
  interview: round.questions.map(q => ({question:q.question, answer:q.answer, followup:""})), mistakes: [], quiz: [],
}));
