"use client";
import { useEffect, useState } from "react";

export function useWalkthrough(total:number) {
  const [step,setStep]=useState(0);
  const [auto,setAuto]=useState(false);
  useEffect(()=>{
    if(!auto)return;
    if(step>=total-1)return;
    const timer=window.setTimeout(()=>{setStep(value=>value+1);if(step+1>=total-1)setAuto(false);},4500);
    return ()=>window.clearTimeout(timer);
  },[auto,step,total]);
  return {step,auto,total,change:(value:number)=>{setAuto(false);setStep(Math.max(0,Math.min(value,total-1)));},
    toggle:()=>{if(step===total-1)setStep(0);setAuto(value=>!value);}};
}
export function WalkthroughControls({state,stableNavigation=false}:{state:ReturnType<typeof useWalkthrough>;stableNavigation?:boolean}) {
  return <><div className="walkthrough-controls"><button type="button" disabled={state.step===0} onClick={()=>state.change(state.step-1)}>← Back</button><button type="button" disabled={stableNavigation&&state.step===state.total-1} onClick={()=>state.change(state.step===state.total-1?0:state.step+1)}>{!stableNavigation&&state.step===state.total-1?"Restart":"Next →"}</button><button type="button" aria-pressed={state.auto} onClick={state.toggle}>{state.auto?"Pause":"Auto-play"}</button>{stableNavigation&&<button type="button" onClick={()=>state.change(0)}>Restart</button>}</div><small role="status">{state.auto?"Auto-play advances every 4.5 seconds.":state.step===state.total-1?"Complete — go Back to review or Restart.":"Paused — click Next when you’re ready."}</small></>;
}
