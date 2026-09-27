"use client";

import type { ComponentType } from "react";
import { ArrowRight, Boxes, Cloud, Database, Network, Radar, ShieldCheck, WalletCards } from "lucide-react";
import type { SparkLesson } from "@/lib/spark-lessons";

const iconById: Record<string, ComponentType<{size?: number; className?: string}>> = {
  "cloud-introduction": Cloud,
  "object-storage": Database,
  "identity-security": ShieldCheck,
  "compute-serverless": Boxes,
  "managed-batch": Boxes,
  "cloud-warehouses": Database,
  "lakehouse": Database,
  "streaming": Network,
  "orchestration-integration": Network,
  "networking-reliability": Radar,
  "cost-architecture-review": WalletCards,
};

export function CloudLessonVisual({ lesson }: { lesson: SparkLesson }) {
  const Icon = iconById[lesson.id] ?? Cloud;
  return (
    <div className="mb-6 rounded-[20px] border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-sky-600 text-white"><Icon size={20}/></span>
        <div>
          <div className="text-xs font-bold uppercase tracking-[.14em] text-sky-700">Map the architecture</div>
          <p className="text-sm text-slate-600">Follow the responsibility from source to storage, compute, serving, and control-plane concerns.</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {lesson.flow.map((term, index) => (
          <div className="contents" key={term}>
            <div className="min-w-32 flex-1 rounded-xl border border-sky-100 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm">
              {term}
            </div>
            {index < lesson.flow.length - 1 && <ArrowRight size={18} className="shrink-0 text-sky-400" aria-hidden="true"/>}
          </div>
        ))}
      </div>
    </div>
  );
}
