"use client";
import {useState} from "react";
import {Database,Monitor,ArrowLeftRight} from "lucide-react";
export function ArchitectureServices(){
 const [service,setService]=useState<"metadata"|"ui">("metadata");
 return <section className="af-services"><div><button aria-pressed={service==="metadata"} onClick={()=>setService("metadata")}><Database size={17}/>Metadata database<ArrowLeftRight size={13}/>Scheduling services</button><button aria-pressed={service==="ui"} onClick={()=>setService("ui")}><Monitor size={17}/>Web UI / API<ArrowLeftRight size={13}/>Airflow services</button></div><p>{service==="metadata"?"Stores DAG/task orchestration state used by the control plane. It is not a warehouse for your business dataset; Airflow 3 tasks use supported SDK/API boundaries.":"Inspect run state and task logs through the UI/API. The UI does not execute task bodies. Service boundaries and physical placement depend on the deployment."}</p></section>;
}
export function IntervalTimeline({choice,step}:{choice:string;step:number}){
 const hour=choice.startsWith("06")?"06":"02";
 return <div className="af-interval"><span><b>Jan 1 · {hour}:00</b><small>Logical date / inclusive start</small></span><div className={step>=1?"af-interval-filled":""}>Data interval · 24h UTC</div><span><b>Jan 2 · {hour}:00</b><small>Exclusive end · run due after</small></span></div>;
}
