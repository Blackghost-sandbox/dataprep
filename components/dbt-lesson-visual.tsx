"use client";

import type { ComponentType } from "react";
import { ArrowRight, CheckCircle2, Database, GitBranch, Layers3, ShieldCheck } from "lucide-react";
import type { SparkLesson } from "@/lib/spark-lessons";

const iconById: Record<string, ComponentType<{size?: number; className?: string}>> = {
  "dbt-introduction": Database,
  "models-ref": GitBranch,
  "sources": Database,
  "lineage": GitBranch,
  "tests": ShieldCheck,
  "materializations": Layers3,
  "jinja-macros": Layers3,
  "incremental": GitBranch,
  "project-structure": Layers3,
  "real-world-review": CheckCircle2,
};

export function DbtLessonVisual({ lesson }: { lesson: SparkLesson }) {
  const Icon = iconById[lesson.id] ?? GitBranch;
  return (
    <div className="mb-6 rounded-[20px] border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-[#6d5df6] text-white"><Icon size={20}/></span>
        <div>
          <div className="text-xs font-bold uppercase tracking-[.14em] text-[#6d5df6]">Follow the model</div>
          <p className="text-sm text-slate-600">Trace the dbt dependency or transformation from input to consumer.</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {lesson.flow.map((term, index) => (
          <div className="contents" key={term}>
            <div className="min-w-32 flex-1 rounded-xl border border-violet-100 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm">
              {term}
            </div>
            {index < lesson.flow.length - 1 && <ArrowRight size={18} className="shrink-0 text-violet-400" aria-hidden="true"/>}
          </div>
        ))}
      </div>
    </div>
  );
}
