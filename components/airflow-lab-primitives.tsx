"use client";
import {useState,type ReactNode} from "react";
import {Check,Copy,Eye,Pause,Play,RotateCcw,SkipForward} from "lucide-react";
import {useWalkthrough} from "@/components/walkthrough-controls";
export function LabControls({state,onReset,blocked=false}:{state:ReturnType<typeof useWalkthrough>;onReset:()=>void;blocked?:boolean}){
 const end=state.step===state.total-1;
 return <div className="af-controls"><button className="af-primary" disabled={blocked&&end} onClick={state.toggle}>{state.auto&&!end?<Pause size={14}/>:<Play size={14}/>} {state.auto&&!end?"Pause":end?"Replay":"Run"}</button><button disabled={end} onClick={()=>state.change(state.step+1)}><SkipForward size={14}/>Next step</button><button onClick={onReset}><RotateCcw size={14}/>Reset</button><span>{state.step+1} / {state.total} steps</span></div>;
}
export function ScenarioSwitcher({choices,value,onChange}:{choices:string[];value:string;onChange:(choice:string)=>void}){return <div className="af-scenarios" role="group" aria-label="Choose scenario">{choices.map(choice=><button key={choice} aria-pressed={choice===value} onClick={()=>onChange(choice)}>{choice}</button>)}</div>;}
export function VisualWorkspace({children,title,controls}:{children:ReactNode;title:string;controls:ReactNode}){return <section className="af-workspace"><header className="af-toolbar"><h3><Eye size={20}/>{title}</h3>{controls}</header>{children}</section>;}
export function CodeSync({lines,active,label="Python · teaching fragment"}:{lines:string[];active:number;label?:string}){
 const [copied,setCopied]=useState(false),[error,setError]=useState(false);
 async function copy(){try{await navigator.clipboard.writeText(lines.join("\n"));setCopied(true);setError(false);}catch{setError(true);}}
 return <section className="af-code"><header><strong>{label}</strong><button onClick={copy} aria-label="Copy visual code">{copied?<Check size={13}/>:<Copy size={13}/>} {copied?"Copied":"Copy"}</button></header><pre><code>{lines.map((line,i)=><span key={i} className={i===active?"af-code-current":""} aria-current={i===active?"step":undefined}><small>{i+1}</small>{line.split(/("[^"\n]*"|'[^'\n]*'|\b(?:def|return|from|import|True|False|None)\b|@task)/g).map((part,j)=><span key={j} className={/^["']/.test(part)?"af-code-string":/^(def|return|from|import|True|False|None|@task)$/.test(part)?"af-code-keyword":undefined}>{part}</span>)}{"\n"}</span>)}</code></pre>{error&&<small role="alert">Copy unavailable. Select the code to copy it manually.</small>}</section>;
}
export function Prediction({question,options,correct,explanation,revealed}:{question:string;options:string[];correct:number;explanation:string;revealed:boolean}){
 const [answer,setAnswer]=useState<number|null>(null),[committed,setCommitted]=useState(false);
 return <section className="af-prediction"><strong>Predict · {question}</strong><div>{options.map((option,i)=><button key={option} disabled={committed} aria-pressed={answer===i} onClick={()=>setAnswer(i)}>{option}</button>)}<button disabled={answer===null||committed} onClick={()=>setCommitted(true)}>Commit answer</button></div>{committed&&<p role="status">{revealed?`${answer===correct?"Correct.":"Compare with the flow."} ${explanation}`:"Answer saved for this scenario. Advance the visual to compare."}</p>}</section>;
}
