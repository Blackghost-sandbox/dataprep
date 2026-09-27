"use client";
import {BookOpen,Lightbulb} from "lucide-react";
import {GlossaryText} from "@/components/glossary";
import type {AirflowLesson} from "@/lib/airflow-lessons";
import {AirflowDagLab} from "./airflow-dag-lab";
import {AirflowFlowLab} from "./airflow-flow-lab";
export function AirflowConceptLab({lesson,onTab}:{lesson:AirflowLesson;onTab?:(tab:string)=>void}){return <div className="af-learning"><header className="af-intro"><div><h2><BookOpen size={23}/>{lesson.title}</h2><p>Watch the decision, inspect the state, and explain what happens next.</p></div><aside><Lightbulb size={23}/><div><strong>Key takeaway</strong><p><GlossaryText>{lesson.takeaway}</GlossaryText></p></div></aside></header>{lesson.visual==="execution"?<AirflowDagLab key={lesson.id} lesson={lesson}/>:<AirflowFlowLab key={lesson.id} lesson={lesson}/>}<footer className="af-footer"><span>Airflow 3.1 · educational simulation · no real services or credentials</span><button onClick={()=>onTab?.("Examples")}>Explore matching code →</button></footer></div>;}
