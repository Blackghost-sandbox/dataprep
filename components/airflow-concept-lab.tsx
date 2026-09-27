"use client";

import {BookOpen,Lightbulb} from "lucide-react";
import {GlossaryText} from "@/components/glossary";
import type {AirflowLesson} from "@/lib/airflow-lessons";
import {AirflowDagLab} from "./airflow-dag-lab";
import {AirflowFlowLab} from "./airflow-flow-lab";
import {AirflowIntroControlRoom} from "./airflow-intro-control-room";
import {AirflowDependenciesLab} from "./airflow-dependencies-lab";
import {AirflowArchitectureLab} from "./airflow-architecture-lab";
import {AirflowSchedulingLab} from "./airflow-scheduling-lab";
import {AirflowCatchupLab} from "./airflow-catchup-lab";

export function AirflowConceptLab({lesson,onTab}:{lesson:AirflowLesson;onTab?:(tab:string)=>void}){
  if(lesson.id==="catchup-backfill"){
    return <div className="af-learning af-catchup-page">
      <AirflowCatchupLab lesson={lesson}/>
      <footer className="af-footer">
        <span>Airflow 3.1 · educational historical-run simulation · no real scheduler or worker</span>
        <button onClick={()=>onTab?.("Examples")}>Explore matching code →</button>
      </footer>
    </div>;
  }

  if(lesson.id==="scheduling"){
    return <div className="af-learning af-scheduling-page">
      <AirflowSchedulingLab lesson={lesson}/>
      <footer className="af-footer">
        <span>Airflow 3.1 · educational timeline · no real scheduler or worker</span>
        <button onClick={()=>onTab?.("Examples")}>Explore matching code →</button>
      </footer>
    </div>;
  }

  if(lesson.id==="architecture"){
    return <div className="af-learning af-architecture-page">
      <AirflowArchitectureLab lesson={lesson}/>
      <footer className="af-footer">
        <span>Airflow 3.1 · educational architecture trace · no real services or credentials</span>
        <button onClick={()=>onTab?.("Examples")}>Explore matching code →</button>
      </footer>
    </div>;
  }

  if(lesson.id==="dags-dependencies"){
    return <div className="af-learning af-dependencies-page">
      <AirflowDependenciesLab lesson={lesson}/>
      <footer className="af-footer">
        <span>Airflow 3.1 · educational simulation · no real services or credentials</span>
        <button onClick={()=>onTab?.("Examples")}>Explore matching code →</button>
      </footer>
    </div>;
  }

  if(lesson.id==="introduction"){
    return <div className="af-learning af-control-room-page">
      <AirflowIntroControlRoom lesson={lesson}/>
      <footer className="af-footer">
        <span>Airflow 3.1 · educational simulation · no real services or credentials</span>
        <button onClick={()=>onTab?.("Examples")}>Explore matching code →</button>
      </footer>
    </div>;
  }

  return <div className="af-learning">
    <header className="af-intro">
      <div>
        <h2><BookOpen size={23}/>{lesson.title}</h2>
        <p>Watch the decision, inspect the state, and explain what happens next.</p>
      </div>
      <aside>
        <Lightbulb size={23}/>
        <div><strong>Key takeaway</strong><p><GlossaryText>{lesson.takeaway}</GlossaryText></p></div>
      </aside>
    </header>
    {lesson.visual==="execution"?<AirflowDagLab key={lesson.id} lesson={lesson}/>:<AirflowFlowLab key={lesson.id} lesson={lesson}/>}
    <footer className="af-footer">
      <span>Airflow 3.1 · educational simulation · no real services or credentials</span>
      <button onClick={()=>onTab?.("Examples")}>Explore matching code →</button>
    </footer>
  </div>;
}
