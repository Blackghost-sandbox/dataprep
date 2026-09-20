"use client";

import type { ComponentType } from "react";
import { ArrowRight, Boxes, Gauge, Network, Radar, RefreshCcw, Route, Scale, ShieldCheck, Waypoints } from "lucide-react";
import type { SparkLesson } from "@/lib/spark-lessons";

const iconById: Record<string, ComponentType<{size?: number; className?: string}>> = {
  "design-framework": Waypoints,
  "scale-estimation": Scale,
  "ingestion-design": Route,
  "storage-modeling": Boxes,
  "batch-streaming": Network,
  "correctness-reliability": RefreshCcw,
  "scaling-bottlenecks": Gauge,
  "serving-layer": Route,
  "operations-security-cost": ShieldCheck,
  "case-study": Radar,
};

export function SystemDesignVisual({ lesson }: { lesson: SparkLesson }) {
  const Icon = iconById[lesson.id] ?? Waypoints;
  return (
    <div className="mb-6 rounded-[20px] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-amber-600 text-white"><Icon size={20}/></span>
        <div>
          <div className="text-xs font-bold uppercase tracking-[.14em] text-amber-700">Reason through the design</div>
          <p className="text-sm text-slate-600">Move from requirements to scale, architecture, failure handling, and trade-offs.</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {lesson.flow.map((term, index) => (
          <div className="contents" key={term}>
            <div className="min-w-32 flex-1 rounded-xl border border-amber-100 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm">
              {term}
            </div>
            {index < lesson.flow.length - 1 && <ArrowRight size={18} className="shrink-0 text-amber-400" aria-hidden="true"/>}
          </div>
        ))}
      </div>
    </div>
  );
}
