"use client";

import { useEffect, useState } from "react";
import { InterviewPractice } from "@/components/interview-practice";
import { SparkLessonPanel } from "@/components/spark-lesson";
import { sqlConceptGuides } from "@/lib/sql-concepts";
import { sqlLessons } from "@/lib/sql-lessons";
import { sparkLessons } from "@/lib/spark-lessons";
import { dbtLessons } from "@/lib/dbt-lessons";
import { CommonMistakes } from "@/components/common-mistakes";
import { HandsOnChallenge } from "@/components/hands-on-challenge";
import { LearningExamples } from "@/components/learning-examples";
import { SimpleExplanation } from "@/components/simple-explanation";
import { GlossaryText, GlossaryTerm } from "@/components/glossary";
import { RddDataFrameConceptExperience } from "@/components/rdd-dataframe-experience";
import { CommonInterviewCard, RelatedConceptsCard } from "@/components/rdd-sidebar-learning";
import { AnimatePresence, motion } from "framer-motion";
import { toast, Toaster } from "sonner";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDown, Bell, BookOpen, Brain, Check, CheckCircle2, ChevronDown,
  ChevronLeft, ChevronRight, Circle, Clock3, Cloud, Code2, Copy, Database,
  FileText, GraduationCap, HelpCircle, Layers3, Lightbulb, Menu, Moon,
  Mountain, Network, NotebookPen, Play, Search, Sparkles, Sun, Trophy,
  Video, Zap,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const modules = ["SQL Fundamentals", "Python for Data Engineering", "Data Modeling", "Apache Spark", "Apache Airflow", "Kafka", "dbt", "Cloud Platforms", "System Design", "Mock Interviews"];
type ModuleId = "spark" | "sql" | "dbt";
const moduleContent = {spark:sparkLessons,sql:sqlLessons,dbt:dbtLessons};
const moduleLabels: Record<ModuleId,string> = {spark:"Apache Spark",sql:"SQL Fundamentals",dbt:"dbt"};
const moduleRoadmapIndex: Record<ModuleId,number> = {sql:0,spark:3,dbt:6};
const enabledModules = new Map<number,ModuleId>([[0,"sql"],[3,"spark"],[6,"dbt"]]);
const tabs = [["Concept", BookOpen], ["Examples", Code2], ["Hands-on", NotebookPen], ["Interview Qs", HelpCircle], ["Common Mistakes", Lightbulb], ["Quiz", Brain], ["Notes", FileText]] as const;
const cn = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");
const announce = (message: string) => toast(message, { duration: 1800 });

function Brand() {
  return <button onClick={() => announce("Welcome to DataPrep")} className="flex items-center gap-3 px-5 py-5 text-left">
    <span className="grid size-10 place-items-center rounded-xl bg-white text-[#6d5df6] shadow-lg shadow-black/20"><Database size={23}/></span>
    <span><span className="block text-[21px] font-bold tracking-tight">DataPrep</span><span className="block text-xs text-slate-400">Learn • Practice • Get Hired</span></span>
  </button>;
}

export function ProgressCard({ count, total = 10, name = "Spark" }: { count: number; total?: number; name?: string }) {
  return <button onClick={() => announce(`${count} of ${total} ${name} lessons marked complete`)} className="mx-4 block w-[calc(100%-2rem)] rounded-2xl border border-white/10 bg-white/[.055] p-4 text-left hover:bg-white/[.08]">
    <span className="mb-2 flex items-center justify-between text-sm"><span className="font-semibold">{name} Progress</span><span className="font-bold text-emerald-400">{Math.round(count / total * 100)}%</span></span>
    <Progress value={Math.round(count / total * 100)} className="h-2 bg-white/10 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-emerald-400 [&_[data-slot=progress-indicator]]:to-teal-300"/>
    <span className="mt-2 block text-xs text-slate-400">Keep building your momentum</span>
  </button>;
}

export function Sidebar({ collapsed, setCollapsed, onLesson, currentLesson, completed, module, onModule }: { collapsed: boolean; setCollapsed: (value: boolean) => void; onLesson: (lesson: string) => void; currentLesson: number; completed: number[]; module:ModuleId; onModule:(module:ModuleId)=>void }) {
  const lessons=moduleContent[module].map(lesson=>lesson.title);
  const moduleIndex=moduleRoadmapIndex[module];
  const [sparkOpen, setSparkOpen] = useState(true);
  return <motion.aside animate={{ width: collapsed ? 88 : 280 }} transition={{ duration: .25 }} className="dataprep-sidebar fixed inset-y-0 left-0 z-30 flex flex-col overflow-hidden bg-[#081a36] text-white shadow-2xl">
    <div className="flex items-center justify-between pr-3"><div className={cn(collapsed && "hidden")}><Brand/></div><button aria-label="Toggle sidebar" onClick={() => setCollapsed(!collapsed)} className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-300 hover:bg-white/10"><Menu size={20}/></button></div>
    {!collapsed && <ProgressCard count={completed.length} total={lessons.length} name={module==="sql"?"SQL":module==="dbt"?"dbt":"Spark"}/>}
    <nav className="mt-4 min-h-0 flex-1 overflow-y-auto px-3 scrollbar-none">
      {!collapsed && <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-[.12em] text-slate-500">Roadmap</div>}
      <div className="space-y-1.5">{modules.map((item, i) => <div key={item}>
        <button onClick={() => enabledModules.has(i) ? (i === moduleIndex ? setSparkOpen(!sparkOpen) : (onModule(enabledModules.get(i)!),setSparkOpen(true))) : announce(`${item} is not available yet`)} aria-expanded={i === moduleIndex ? sparkOpen : undefined} className={cn("flex w-full items-center rounded-xl text-left transition-colors", collapsed ? "justify-center p-2" : "gap-3 px-3 py-2.5", i === moduleIndex ? "bg-[#2450a2] shadow-lg shadow-blue-950/30" : "hover:bg-white/[.06]")}>
          <span className={cn("grid size-8 shrink-0 place-items-center rounded-full border text-sm font-semibold", i === moduleIndex ? "border-blue-300 bg-blue-500 text-white ring-4 ring-blue-400/15" : "border-white/10 bg-[#294363] text-slate-200")}>{i + 1}</span>
          {!collapsed && <span className="flex-1 text-sm leading-tight">{item}</span>}{!collapsed && i === moduleIndex && <ChevronDown size={16}/>}
        </button>
        <AnimatePresence>{!collapsed && i === moduleIndex && sparkOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="ml-7 overflow-hidden border-l border-blue-300/20 py-1 pl-4">
          {lessons.map((lesson, j) => <button onClick={() => onLesson(lesson)} aria-current={j === currentLesson ? "step" : undefined} key={lesson} className={cn("my-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs", j === currentLesson ? "bg-white/10 font-semibold text-white" : "text-slate-400 hover:bg-white/5 hover:text-white")}><span className={cn("size-1.5 rounded-full", completed.includes(j) ? "bg-emerald-400" : j === currentLesson ? "bg-[#8b7cff]" : "bg-slate-600")}/>{lesson}</button>)}
        </motion.div>}</AnimatePresence>
      </div>)}</div>
    </nav>
    <div className={cn("m-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[.03] p-4", collapsed && "mx-3 p-3")}><div className="flex gap-3"><Trophy className="shrink-0 text-amber-400" size={collapsed ? 28 : 34}/>{!collapsed && <div><div className="font-bold">Keep Going!</div><p className="mt-1 text-xs leading-relaxed text-slate-300">Small steps lead to big careers.</p></div>}</div>{!collapsed && <button onClick={() => onLesson(lessons.find((_,i)=>!completed.includes(i)) || lessons[lessons.length-1])} className="mt-3 w-full rounded-xl bg-white py-2 text-sm font-semibold text-[#081a36] transition hover:-translate-y-0.5">Continue Learning</button>}</div>
  </motion.aside>;
}

export function TopNavbar({ dark, setDark, setTab }: { dark: boolean; setDark: (value: boolean) => void; setTab: (value: string) => void }) {
  const [query, setQuery] = useState("");
  const nav: Record<string, string> = { Home: "Concept", Roadmap: "Concept", Projects: "Hands-on", "Interview Qs": "Interview Qs", Resources: "Notes" };
  return <header className="dataprep-navbar sticky top-0 z-20 flex h-[72px] items-center gap-7 border-b border-[#e7ecf3] bg-white/90 px-6 backdrop-blur-xl">
    <form onSubmit={(event) => { event.preventDefault(); announce(query ? `Searching DataPrep for “${query}”` : "Type a topic to search"); }} className="relative w-[360px] shrink-0"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17}/><input value={query} onChange={e => setQuery(e.target.value)} aria-label="Search" className="h-11 w-full rounded-xl border border-[#e7ecf3] bg-[#f7f9fc] pl-11 pr-4 text-sm outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10" placeholder="Search topics, questions, or companies..."/></form>
    <nav className="flex flex-1 items-center justify-center gap-7 text-sm font-medium text-slate-700">{Object.keys(nav).map(x => <button onClick={() => { setTab(nav[x]); announce(`${x} opened`); }} key={x} className="whitespace-nowrap hover:text-[#6d5df6]">{x}</button>)}</nav>
    <div className="flex items-center gap-2"><button onClick={() => { setDark(!dark); announce(`${!dark ? "Dark" : "Light"} appearance selected`); }} aria-label="Toggle theme" className="grid size-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100">{dark ? <Sun size={19}/> : <Moon size={19}/>}</button><button onClick={() => announce("You’re all caught up")} aria-label="Notifications" className="relative grid size-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100"><Bell size={20}/><span className="absolute right-2 top-2 size-2 rounded-full bg-[#6d5df6] ring-2 ring-white"/></button><button onClick={() => announce("Profile menu opened")} aria-label="Profile" className="ml-1 grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#7c6ef6] to-[#4f46e5] font-bold text-white shadow-md">AK</button></div>
  </header>;
}

export function LessonTabs({ active, setActive }: { active: string; setActive: (value: string) => void }) {
  return <Tabs value={active} onValueChange={setActive} className="lesson-tabs rounded-2xl border border-[#e7ecf3] bg-white px-4 shadow-[0_8px_28px_rgba(34,48,73,.05)]"><TabsList variant="line" className="flex h-[58px] w-full justify-between gap-0">{tabs.map(([label, Icon]) => <TabsTrigger key={label} value={label} className="h-full px-3 text-[13px] font-semibold after:bottom-0 after:h-[3px] after:rounded-full after:bg-[#6d5df6] data-[state=active]:text-[#5b4deb]"><Icon size={17}/>{label}</TabsTrigger>)}</TabsList></Tabs>;
}

const features = { RDD: [["API level", "Low-level API"], ["Structure", "Immutable collection"], ["Data type", "Any object"], ["Control", "More control"], ["Performance", "Slower"]], DataFrame: [["API level", "Structured API"], ["Optimization", "Catalyst optimized"], ["Structure", "Schema enforced"], ["Experience", "Easier to use"], ["Performance", "Faster"]] };
export function FeatureComparison() {
  return <div className="grid grid-cols-2 gap-4">{Object.entries(features).map(([title, rows]) => <motion.div whileHover={{ y: -3 }} key={title} className={cn("rounded-2xl border p-5 text-left transition-shadow hover:shadow-lg", title === "RDD" ? "border-violet-200 bg-violet-50/80" : "border-emerald-200 bg-emerald-50/80")}><div className="mb-4 flex items-center gap-3"><div className={cn("grid size-10 place-items-center rounded-xl text-white", title === "RDD" ? "bg-[#7c6ef6]" : "bg-emerald-500")}>{title === "RDD" ? <Network size={21}/> : <Layers3 size={21}/>}</div><div><h3 className="text-xl font-bold"><GlossaryTerm term={title}/></h3><p className="text-xs text-slate-500">{title === "RDD" ? "Resilient Distributed Dataset" : "Distributed structured data"}</p></div></div><div className="space-y-2.5">{rows.map(([key, value]) => <div key={key} className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 text-sm"><span className="text-slate-500">{key}</span><SimpleExplanation label={value}/></div>)}</div></motion.div>)}</div>;
}

function FlowColumn({ title, items, color }: { title: string; items: string[]; color: string }) {
  return <div className={cn("flex flex-col justify-center rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md", color)}>
    <div className="mb-3 text-center text-sm font-bold"><SimpleExplanation label={title}/></div>
    <div className="space-y-1.5">{items.map((item, i) => <div key={item} className="text-center">
      <div className="rounded-xl border border-white/80 bg-white/80 px-3 py-2 text-sm font-semibold shadow-sm"><SimpleExplanation label={item}/></div>
      {i < items.length - 1 && <ArrowDown className="mx-auto my-1 text-slate-400" size={17} aria-hidden="true"/>}
    </div>)}</div>
  </div>;
}
export function ArchitectureDiagram() { return <div className="grid grid-cols-[1fr_.85fr_1fr] gap-4"><FlowColumn title="RDD Pipeline" items={["Raw Data", "Transformations", "Actions"]} color="border-blue-200 bg-blue-50"/><FlowColumn title="Execution Layer" items={["Spark Core", "Cluster Manager"]} color="border-amber-200 bg-amber-50"/><FlowColumn title="DataFrame Pipeline" items={["Structured Data", "Catalyst Optimizer", "Physical Plan"]} color="border-emerald-200 bg-emerald-50"/></div>; }

const snippets: Record<string, string> = { PySpark: `# RDD example\nrdd = sc.parallelize([1, 2, 3, 4, 5])\nrdd_squared = rdd.map(lambda x: x * x)\nprint(rdd_squared.collect())  # [1, 4, 9, 16, 25]\n\n# DataFrame example\ndata = [(1, "Alice"), (2, "Bob"), (3, "Charlie")]\ndf = spark.createDataFrame(data, ["id", "name"])\ndf.show()`, Scala: `val rdd = sc.parallelize(Seq(1, 2, 3, 4, 5))\nval squared = rdd.map(x => x * x)\nprintln(squared.collect().mkString(", "))\n\nval df = Seq((1, "Alice"), (2, "Bob")).toDF("id", "name")\ndf.show()`, SQL: `SELECT id, name, event_count\nFROM user_activity\nWHERE event_date >= current_date() - INTERVAL 7 DAYS\nORDER BY event_count DESC;` };
export function CodeBlock() {
  const [lang, setLang] = useState("PySpark"); const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(snippets[lang]); setCopied(true); toast.success("Code copied"); setTimeout(() => setCopied(false), 1500); };
  return <div className="overflow-hidden rounded-2xl border border-slate-700 bg-[#101b2d] shadow-xl shadow-slate-900/10"><div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div className="flex gap-2">{Object.keys(snippets).map(x => <button onClick={() => setLang(x)} key={x} className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold", lang === x ? "bg-[#6d5df6] text-white" : "text-slate-400 hover:bg-white/10")}>{x}</button>)}</div><button onClick={copy} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.06] px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10">{copied ? <Check size={15}/> : <Copy size={15}/>} {copied ? "Copied" : "Copy"}</button></div><pre className="overflow-auto p-5 text-[13px] leading-6 text-slate-200"><code>{snippets[lang]}</code></pre></div>;
}

function Surface({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <motion.section whileHover={{ y: -2 }} transition={{ duration: .18 }} className={cn("rounded-[20px] border border-[#e7ecf3] bg-white p-6 shadow-[0_10px_35px_rgba(35,52,82,.055)]", className)}>{children}</motion.section>; }
function SectionTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) { return <div className="mb-5 flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-[#eeeaff] text-[#6d5df6]"><Icon size={20}/></div><h2 className="text-[22px] font-bold tracking-tight">{title}</h2></div>; }

export function ResourceList() {
  const resources = [["Spark Docs", BookOpen, "#6d5df6"], ["Databricks Guide", Database, "#2563eb"], ["Engineering Blog", FileText, "#ec4899"], ["Spark Cheat Sheet", NotebookPen, "#14b8a6"], ["Catalyst Explained", Video, "#f97316"]] as const;
  return <Surface><SectionTitle icon={Cloud} title="Related Resources"/><div className="space-y-1">{resources.map(([name, Icon, color]) => <button onClick={() => announce(`${name} opened`)} key={name} className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"><span style={{ color }}><Icon size={18}/></span><span className="flex-1">{name}</span><ChevronRight size={15} className="text-slate-400"/></button>)}</div></Surface>;
}
export function QuoteCard() { return <button onClick={() => announce("Keep going — consistency compounds")} className="relative w-full overflow-hidden rounded-[20px] bg-gradient-to-br from-[#203a72] to-[#081a36] p-5 text-left text-white shadow-xl"><Mountain className="absolute -bottom-6 -right-5 size-32 text-blue-300/20"/><Sparkles className="mb-8 text-amber-300"/><blockquote className="relative text-lg font-bold leading-snug">“Learn. Build.<br/>Practice. Get Hired.”</blockquote><p className="mt-2 text-xs text-blue-200">— The DataPrep way</p></button>; }

function RightPanel({ currentLesson, onLesson, completed, module }: { currentLesson: number; onLesson: (lesson: string) => void; completed: number[]; module:ModuleId }) {
  const content=moduleContent[module];
  const lessons=content.map(lesson=>lesson.title);
  return <aside className="lesson-aside space-y-4"><Surface><details open className="lesson-playlist"><summary className="mb-3 flex cursor-pointer items-center justify-between"><span className="font-bold">Lesson Progress <ChevronDown size={16} className="inline-block text-slate-400" aria-hidden="true"/></span><span className="text-xs font-semibold text-[#6d5df6]">{completed.length} / {lessons.length} done</span></summary><Progress value={completed.length / lessons.length * 100} className="mb-5 h-2 bg-slate-100 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-[#6d5df6] [&_[data-slot=progress-indicator]]:to-[#9b8fff]"/><div className="space-y-1">{lessons.map((lesson, i) => { const state = completed.includes(i) ? "Completed" : i === currentLesson ? "Learning" : "Not started"; return <button onClick={() => onLesson(lesson)} aria-current={i === currentLesson ? "step" : undefined} key={lesson} className={cn("lesson-state-row flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] hover:bg-slate-50", i === currentLesson ? "bg-[#eeeaff] font-semibold text-[#5b4deb]" : "text-slate-600")}>{completed.includes(i) ? <CheckCircle2 size={18} className="text-emerald-500"/> : i === currentLesson ? <Play size={18} className="fill-[#6d5df6] text-[#6d5df6]"/> : <Circle size={18} className="text-slate-300"/>}<span className="min-w-0 flex-1">{i + 1}. {lesson}</span><small className={`lesson-state lesson-state-${state.toLowerCase().replace(" ", "-")}`}>{state}</small></button>; })}</div></details></Surface><button onClick={() => announce("Quick note pinned")} className="w-full rotate-[-.6deg] rounded-[18px] border border-amber-200 bg-[#fff9d9] p-5 text-left shadow-[0_8px_24px_rgba(120,87,20,.08)]"><div className="mb-2 flex items-center gap-2 font-bold"><NotebookPen size={19} className="text-amber-600"/>Quick Notes</div><p className="text-sm leading-6 text-amber-950/75">{module === "spark" && currentLesson === 1 ? "DataFrames provide a schema and an optimized query engine. Choose RDDs when their extra control fits your task." : content[currentLesson].concepts[0]?.[1]}</p></button>{module === "spark" && currentLesson === 1 && <><RelatedConceptsCard/><CommonInterviewCard/></>}{module==="sql"?<Surface><SectionTitle icon={BookOpen} title="SQL Resources"/><a href="https://www.postgresql.org/docs/current/tutorial-sql.html" target="_blank" rel="noreferrer" className="text-sm text-[#6d5df6]">PostgreSQL SQL tutorial ↗</a></Surface>:module==="dbt"?<Surface><SectionTitle icon={BookOpen} title="dbt Resources"/><a href="https://docs.getdbt.com/docs/introduction" target="_blank" rel="noreferrer" className="text-sm text-[#6d5df6]">dbt documentation ↗</a></Surface>:<ResourceList/>}<QuoteCard/></aside>;
}

function Hero({ onPrevious, onNext, currentLesson, compact = false, module }: { onPrevious: () => void; onNext: () => void; currentLesson: number; compact?: boolean; module:ModuleId }) {
  const content=moduleContent[module];
  const lessons=content.map(lesson=>lesson.title);
  const difficulty = module==="sql" ? sqlConceptGuides[content[currentLesson].id].difficulty : currentLesson===0?"Beginner":"Intermediate";
  const metadata = [[Clock3, `${content[currentLesson].minutes} min`], [GraduationCap, `Lesson ${currentLesson + 1}/${lessons.length}`], ...(module === "spark" && currentLesson === 1 ? [[Sparkles, "High interview relevance"]] : [])] as const;
  return <div className={`lesson-hero ${compact ? "practice-hero " : ""}relative overflow-hidden rounded-[22px] border border-[#e7ecf3] bg-gradient-to-r from-white via-white to-[#eef2ff] p-6 shadow-[0_8px_28px_rgba(34,48,73,.04)]`}><Mountain className="absolute -bottom-7 right-10 size-44 text-[#6d5df6]/[.07]"/><div className="relative flex items-center justify-between"><div><div className="mb-4 flex items-center gap-2 text-sm text-slate-500"><button onClick={() => announce(`${moduleLabels[module]} roadmap opened`)} className="hover:text-[#6d5df6]">{moduleLabels[module]}</button><ChevronRight size={14}/><span className="font-medium text-slate-700">{lessons[currentLesson]}</span></div><div className="flex items-center gap-4"><div className="grid size-16 place-items-center rounded-2xl bg-[#eeeaff] text-[#6d5df6]"><Zap size={31}/></div><div><h1 className="text-[40px] font-bold leading-tight tracking-[-.035em]">{lessons[currentLesson]}</h1><p className="mt-1 max-w-2xl text-[15px] leading-6 text-slate-600">{content[currentLesson].description}</p></div></div></div><div className="flex flex-col items-end gap-4"><button onClick={() => announce("Difficulty: "+difficulty)} className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700">{difficulty}</button><div className="flex gap-2"><button onClick={onPrevious} disabled={currentLesson === 0} aria-label="Previous lesson" className="grid size-10 place-items-center rounded-xl border bg-white text-slate-600 hover:bg-slate-50"><ChevronLeft size={18}/></button><button onClick={onNext} disabled={currentLesson === lessons.length - 1} className="flex items-center gap-2 rounded-xl bg-[#6d5df6] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#6d5df6]/20 hover:bg-[#5b4deb]">Next <ChevronRight size={17}/></button></div></div></div><div className="relative mt-5 flex flex-wrap gap-2">{metadata.map(([Icon, label]) => <button onClick={() => announce(String(label))} key={String(label)} className={cn("flex items-center gap-2 rounded-full border bg-white/80 px-3 py-1.5 text-xs font-medium hover:border-[#6d5df6]/30", label === "High interview relevance" ? "border-emerald-200 text-emerald-700" : "border-slate-200 text-slate-600")}><Icon size={14}/>{String(label)}</button>)}</div></div>;
}

function ConceptPanel() { return <><RddDataFrameConceptExperience/><button onClick={() => announce("Takeaway saved to your notes")} className="flex w-full items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left text-sm leading-6 text-amber-950 hover:shadow-md"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600"><Lightbulb size={20}/></span><span><span className="block font-bold">Key Takeaway</span>Use DataFrames for most structured analytics because Catalyst can optimize the query plan. Reach for RDDs when custom objects or fine-grained transformations justify lower-level control.</span></button></>; }

function InteractivePanel({ active }: { active: string }) {
  const [answer, setAnswer] = useState(""); const [notes, setNotes] = useState("");
  if (active === "Examples") return <Surface><SectionTitle icon={Code2} title="RDD and DataFrame Examples"/><LearningExamples/></Surface>;
  if (active === "Hands-on") return <Surface><SectionTitle icon={NotebookPen} title="Hands-on Challenge"/><HandsOnChallenge/></Surface>;
  if (active === "Interview Qs") return <Surface><SectionTitle icon={HelpCircle} title="Interview Practice"/><InterviewPractice/></Surface>;
  if (active === "Common Mistakes") return <Surface><SectionTitle icon={Lightbulb} title="Common Mistakes"/><CommonMistakes/></Surface>;
  if (active === "Quiz") return <Surface><SectionTitle icon={Brain} title="Quick Knowledge Check"/><p className="mb-4 text-lg font-semibold">Which component optimizes DataFrame queries?</p><div className="grid gap-3">{["Cluster Manager", "Catalyst Optimizer", "RDD Scheduler"].map(option => <button onClick={() => setAnswer(option)} key={option} className={cn("rounded-xl border p-4 text-left font-medium", answer === option ? option === "Catalyst Optimizer" ? "border-emerald-400 bg-emerald-50" : "border-rose-300 bg-rose-50" : "hover:border-[#6d5df6]/40")}>{option}</button>)}</div>{answer && <p className={cn("mt-4 font-semibold", answer === "Catalyst Optimizer" ? "text-emerald-600" : "text-rose-600")}>{answer === "Catalyst Optimizer" ? "Correct — Catalyst builds and optimizes the logical and physical plans." : "Not quite. Try again."}</p>}</Surface>;
  return <Surface><SectionTitle icon={FileText} title="Your Notes"/><textarea value={notes} onChange={e => setNotes(e.target.value)} className="min-h-52 w-full resize-y rounded-xl border bg-slate-50 p-4 outline-none focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10" placeholder="Capture an interview insight or Spark rule of thumb..."/><button onClick={() => { localStorage.setItem("dataprep-notes", notes); toast.success("Notes saved on this device"); }} className="mt-4 rounded-xl bg-[#6d5df6] px-5 py-2.5 font-semibold text-white">Save Notes</button></Surface>;
}

export function DataPrepApp() {
  const [module,setModule]=useState<ModuleId>("spark");
  const lessons=moduleContent[module].map(lesson=>lesson.title);
  const [active, setActive] = useState("Concept");
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [currentLesson, setCurrentLesson] = useState(1);
  const [completion,setCompletion]=useState<Record<ModuleId,number[]>>({spark:[],sql:[],dbt:[]});
  const completed=completion[module];
  useEffect(() => {
    const restored:Record<ModuleId,number[]>={spark:[],sql:[],dbt:[]};
    for(const id of ["spark","sql","dbt"] as const) {
      try {
        const value=JSON.parse(localStorage.getItem("dataprep."+id+".completed.v1") || "[]");
        if(Array.isArray(value))restored[id]=[...new Set(value.filter((v:unknown):v is number=>typeof v==="number"&&Number.isInteger(v)&&v>=0&&v<moduleContent[id].length))];
      } catch { toast.error("Could not restore "+id+" progress."); }
    }
    // Restore browser storage after hydration without blocking the first render.
    let cancelled=false;
    queueMicrotask(()=>{if(!cancelled)setCompletion(restored);});
    return ()=>{cancelled=true;};
  }, []);
  const switchModule=(id:ModuleId)=>{setModule(id);setCurrentLesson(0);setActive("Concept");window.scrollTo({top:0,behavior:"instant"});};
  const openLesson = (index: number) => {
    setCurrentLesson(index);
    setActive(module === "spark" ? (index === 6 ? "Hands-on" : index === 7 ? "Interview Qs" : index === 8 ? "Quiz" : "Concept") : "Concept");
    window.scrollTo({top:0,behavior:"instant"});
  };
  const selectLesson = (lesson: string) => { const index=lessons.indexOf(lesson); if(index>=0) openLesson(index); };
  const moveLesson = (direction: number) => openLesson(Math.max(0,Math.min(lessons.length-1,currentLesson+direction)));
  const toggleComplete = () => {
    const updated = completed.includes(currentLesson) ? completed.filter(n=>n!==currentLesson) : [...completed,currentLesson];
    setCompletion(values=>({...values,[module]:updated}));
    try { localStorage.setItem("dataprep."+module+".completed.v1",JSON.stringify(updated)); }
    catch { toast.error("Progress updated for this visit but could not be saved."); }
  };
  return <div className={cn((module==="sql" || currentLesson === 1) && "rdd-page", module==="sql" && "sql-module-page", "min-h-screen text-[#0f172a] transition-colors",dark ? "bg-[#e8ebf4]" : "bg-[#f5f7fb]")}>
    <Toaster position="bottom-right" richColors/>
    <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} onLesson={selectLesson} currentLesson={currentLesson} completed={completed} module={module} onModule={switchModule}/>
    <motion.div animate={{marginLeft:collapsed ? 88 : 280}} transition={{duration:.25}} className="dataprep-main min-h-screen">
      <TopNavbar dark={dark} setDark={setDark} setTab={setActive}/>
      <main className="mx-auto max-w-[1536px] space-y-4 p-5 xl:p-6">
        <div className="sql-module-picker"><label>Module <select value={module} onChange={e=>switchModule(e.target.value as ModuleId)}><option value="spark">Apache Spark</option><option value="sql">SQL Fundamentals</option><option value="dbt">dbt</option></select></label><label>Lesson <select value={currentLesson} onChange={e=>openLesson(Number(e.target.value))}>{lessons.map((lesson,i)=><option key={lesson} value={i}>{i+1}. {lesson}</option>)}</select></label></div>
        <Hero module={module} compact={["Interview Qs","Hands-on","Quiz","Common Mistakes"].includes(active)} currentLesson={currentLesson} onPrevious={()=>moveLesson(-1)} onNext={()=>moveLesson(1)}/>
        <LessonTabs active={active} setActive={setActive}/>
        <div className="lesson-layout grid grid-cols-[minmax(0,1fr)_320px] gap-4">
          <div className="lesson-content min-w-0 space-y-4">
            <motion.div key={module+"-"+currentLesson+"-"+active} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="space-y-4">
              {module==="sql" ? <SparkLessonPanel key={"sql-"+sqlLessons[currentLesson].id} module="sql" lesson={sqlLessons[currentLesson]} active={active} onTab={setActive} onLesson={id=>{const index=sqlLessons.findIndex(lesson=>lesson.id===id);if(index>=0)openLesson(index);}}/> : module==="dbt" ? <SparkLessonPanel key={"dbt-"+dbtLessons[currentLesson].id} module="dbt" lesson={dbtLessons[currentLesson]} active={active}/> : currentLesson === 1 && active !== "Notes" ? active === "Concept" ? <ConceptPanel/> : <InteractivePanel active={active}/> : <SparkLessonPanel key={sparkLessons[currentLesson].id} lesson={sparkLessons[currentLesson]} active={active}/>}
            </motion.div>
            <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5">
              <div><button type="button" aria-pressed={completed.includes(currentLesson)} onClick={toggleComplete} className="rounded-xl bg-[#6d5df6] px-4 py-2 text-sm font-semibold text-white">{completed.includes(currentLesson) ? "✓ Completed · mark incomplete" : "Mark lesson complete"}</button><p className="mt-2 text-xs text-slate-500">Self-reported progress · saved on this device</p></div>
              <button disabled={currentLesson===lessons.length-1} onClick={()=>moveLesson(1)} className="text-sm font-semibold text-[#6d5df6] disabled:opacity-40">{currentLesson===lessons.length-1 ? "End of module" : "Next: "+lessons[currentLesson+1]+" →"}</button>
            </section>
          </div>
          <RightPanel module={module} currentLesson={currentLesson} onLesson={selectLesson} completed={completed}/>
        </div>
      </main>
    </motion.div>
  </div>;
}
