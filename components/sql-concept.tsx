"use client";
import { BookOpen, Lightbulb, TriangleAlert, CheckCircle2, ArrowRight, Database, Table2, FileCode2, ListChecks } from "lucide-react";
import type { SparkLesson } from "@/lib/spark-lessons";
import { sqlConceptGuides } from "@/lib/sql-concepts";
import { GlossaryText } from "@/components/glossary";
import { DarkCodeCard } from "@/components/rdd-dataframe-experience";
import { SqlFundamentalsVisual } from "@/components/sql-fundamentals-visual";
import { WhereLearningLab } from "@/components/where-learning-lab";
import { DistinctLearningLab } from "@/components/distinct-learning-lab";
import { SqlIntroductionLab } from "@/components/sql-introduction-lab";
import { SelectLearningLab } from "@/components/select-learning-lab";
import { OrderByLearningLab } from "@/components/order-by-learning-lab";
import { LimitLearningLab } from "@/components/limit-learning-lab";
import { AggregateLearningLab } from "@/components/aggregate-learning-lab";
import { GroupByLearningLab } from "@/components/group-by-learning-lab";
import { HavingLearningLab } from "@/components/having-learning-lab";
import { JoinsLearningLab } from "@/components/joins-learning-lab";
import { SubqueriesCtesLearningLab } from "@/components/subqueries-ctes-learning-lab";
import { SubqueriesFlowLearningLab } from "@/components/subqueries-flow-learning-lab";
import { WindowFunctionsLearningLab } from "@/components/window-functions-learning-lab";
import { NullCaseLearningLab } from "@/components/null-case-learning-lab";

export function SqlConcept({lesson,onTab,onLesson}:{lesson:SparkLesson;onTab:(tab:string)=>void;onLesson:(id:string)=>void}){
  if(lesson.id==="introduction")return <SqlIntroductionLab/>;
  if(lesson.id==="where")return <WhereLearningLab/>;
  if(lesson.id==="null-case")return <NullCaseLearningLab/>;
  if(lesson.id==="window-functions")return <WindowFunctionsLearningLab lesson={lesson} onTab={onTab} onLesson={onLesson}/>;
  if(lesson.id==="subqueries-ctes")return <SubqueriesFlowLearningLab/>;
  if(lesson.id==="joins")return <JoinsLearningLab/>;
  if(lesson.id==="having")return <HavingLearningLab/>;
  if(lesson.id==="group-by")return <GroupByLearningLab/>;
  if(lesson.id==="aggregate-functions")return <AggregateLearningLab/>;
  if(lesson.id==="limit")return <LimitLearningLab/>;
  if(lesson.id==="order-by")return <OrderByLearningLab/>;
  if(lesson.id==="distinct")return <DistinctLearningLab/>;
  if(lesson.id==="select")return <SelectLearningLab/>;
  const guide=sqlConceptGuides[lesson.id];
  return <div className="sql-concept-sequence">
    <section className="sql-concept-intro">
      <div className="sql-intro-copy"><h3><BookOpen size={19}/> What is {lesson.id==="introduction"?"SQL":lesson.title}?</h3><p><GlossaryText>{guide.definition??lesson.concepts[0][1]}</GlossaryText></p><p className="sql-mental-question"><Lightbulb size={18}/> <span>Think: “{guide.question}”</span></p></div>
      <div className="sql-model-panel"><h4>Mental model</h4><ol className="sql-mental-model" aria-label="Mental model">{guide.model.map((part,i)=>{const Icon=[Database,FileCode2,ListChecks][i]??Table2;return <li key={part}><span><Icon size={24}/><b>{part}</b></span>{i<guide.model.length-1&&<ArrowRight size={15} aria-hidden/>}</li>;})}</ol></div>
      <div className="sql-basic-code"><h4>Basic syntax</h4><DarkCodeCard title="SQL · basic syntax" code={guide.syntax??lesson.example.code}/></div>
      <div className="sql-parts-panel"><h4>What each part means</h4><dl className="sql-syntax-parts">{guide.parts.map(([term,meaning])=><div key={term}><dt><code>{term}</code></dt><dd>{meaning}</dd></div>)}</dl></div>
    </section>
    <SqlFundamentalsVisual id={lesson.id} query={guide.syntax??lesson.example.code} explanation={guide.definition??lesson.concepts[0][1]}/>
    <div className="sql-callout-pair"><section className="sql-compact-callout"><h3><Lightbulb size={19}/> Why it matters</h3><p>{lesson.id==="select"?"Selecting only the columns you need keeps results clear and avoids returning unnecessary data.":lesson.concepts[1][1]}</p></section>
    <section className="sql-compact-callout sql-remember"><h3><TriangleAlert size={19}/> Remember</h3><p><GlossaryText>{guide.remember}</GlossaryText></p>{guide.related&&<button type="button" onClick={()=>onLesson(guide.related![0])}>{guide.related[1]} →</button>}</section></div>
    <section className="sql-compact-callout sql-takeaway"><h3><CheckCircle2 size={19}/> Key Takeaway</h3><p>{guide.takeaway}</p>
    <nav className="spark-actions" aria-label="Continue learning"><button type="button" onClick={()=>onTab("Examples")}>Explore Examples →</button><button type="button" onClick={()=>onTab("Hands-on")}>Practice {lesson.title} →</button></nav></section>
  </div>;
}
