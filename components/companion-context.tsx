"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CompanionContext, ExerciseContext, LearningEvent } from "@/lib/companion";

interface ContextValue {
  context: CompanionContext;
  event: LearningEvent | null;
  emit: (event: LearningEvent) => void;
  report: (lesson: string, exercise: ExerciseContext | null) => void;
}
const Context = createContext<ContextValue | null>(null);
export function CompanionProvider({ context, children }: { context: CompanionContext; children: React.ReactNode }) {
  const [exercise, setExercise] = useState<{lesson:string;value:ExerciseContext|null}|null>(null);
  const [event, setEvent] = useState<LearningEvent|null>(null);
  const report = useCallback((lesson:string,value:ExerciseContext|null)=>setExercise({lesson,value}),[]);
  const emit = useCallback((event:LearningEvent)=>setEvent({...event,emittedAt:Date.now()}),[]);
  const value = useMemo(()=>({context:{...context,exercise:context.tab==="Hands-on" && exercise?.lesson===context.lesson.id ? exercise.value??undefined : undefined},event,emit,report}),[context,exercise,event,emit,report]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useCompanion = ()=>useContext(Context);
export function useCompanionExercise(lesson:string, active:boolean, task:string, hint:string, solution:string, userCode?:string) {
  const report=useCompanion()?.report;
  useEffect(()=>{
    if(!active || !report)return;
    report(lesson,{task,hint,solution,userCode});
    return ()=>report(lesson,null);
  },[report,lesson,active,task,hint,solution,userCode]);
}
