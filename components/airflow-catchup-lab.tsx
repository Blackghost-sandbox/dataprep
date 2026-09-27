"use client";

import {useEffect,useMemo,useState} from "react";
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock3,
  Database,
  Lightbulb,
  Network,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Sparkles,
  X,
} from "lucide-react";
import {motion,useReducedMotion} from "framer-motion";
import type {AirflowLesson} from "@/lib/airflow-lessons";

type Mode="catchup-off"|"catchup-on"|"backfill";
type RunVisualState="future"|"interval"|"skipped"|"queued"|"running";

type IntervalDef={
  id:string;
  short:string;
  start:string;
  end:string;
  due:string;
};

const intervals:IntervalDef[]=[
  {id:"jan1",short:"Jan 1 → Jan 2",start:"Jan 1, 02:00",end:"Jan 2, 02:00",due:"Jan 2 · 02:00 UTC"},
  {id:"jan2",short:"Jan 2 → Jan 3",start:"Jan 2, 02:00",end:"Jan 3, 02:00",due:"Jan 3 · 02:00 UTC"},
  {id:"jan3",short:"Jan 3 → Jan 4",start:"Jan 3, 02:00",end:"Jan 4, 02:00",due:"Jan 4 · 02:00 UTC"},
  {id:"jan4",short:"Jan 4 → Jan 5",start:"Jan 4, 02:00",end:"Jan 5, 02:00",due:"Jan 5 · 02:00 UTC"},
  {id:"jan5",short:"Jan 5 → Jan 6",start:"Jan 5, 02:00",end:"Jan 6, 02:00",due:"Jan 6 · 02:00 UTC"},
];

const modeCopy:Record<Mode,{label:string;summary:string}>={
  "catchup-off":{
    label:"Catchup off",
    summary:"Only the latest eligible scheduled interval gets a new run. Earlier missed intervals are skipped.",
  },
  "catchup-on":{
    label:"Catchup on",
    summary:"Missing eligible historical intervals can each receive a DAG run, subject to existing runs and scheduler limits.",
  },
  "backfill":{
    label:"Bounded backfill",
    summary:"An explicit historical request creates runs only for the selected range, independent of automatic catchup.",
  },
};

function createdIndexes(mode:Mode,revealed:number){
  const closed=Math.min(revealed,intervals.length);
  if(closed<=0)return [] as number[];
  if(mode==="catchup-off")return [closed-1];
  if(mode==="catchup-on")return Array.from({length:closed},(_,index)=>index);
  return [1,2,3].filter(index=>index<closed);
}

function intervalState(index:number,mode:Mode,revealed:number,maxActive:number):RunVisualState{
  if(index>=revealed)return "future";
  const created=createdIndexes(mode,revealed);
  if(!created.includes(index)){
    return mode==="catchup-off"?"skipped":"interval";
  }
  const position=created.indexOf(index);
  return position<maxActive?"running":"queued";
}

function stateLabel(state:RunVisualState,mode:Mode,index:number){
  if(state==="future")return "Waiting for interval close";
  if(state==="skipped")return "Skipped (catchup off)";
  if(state==="interval")return mode==="backfill"?"Outside backfill range":"Closed interval";
  if(state==="queued")return "DAG run queued";
  if(state==="running")return index===intervals.length-1&&mode==="catchup-off"?"Run created · ready to run":"DAG run running";
  return "";
}

function StateGlyph({state}:{state:RunVisualState}){
  if(state==="skipped")return <X size={20}/>;
  if(state==="running")return <Play size={18}/>;
  if(state==="queued")return <Database size={17}/>;
  return <Circle size={13}/>;
}

export function AirflowCatchupLab({lesson}:{lesson:AirflowLesson}){
  const reduce=useReducedMotion();
  const [mode,setMode]=useState<Mode>("catchup-off");
  const [revealed,setRevealed]=useState(intervals.length);
  const [playing,setPlaying]=useState(false);
  const [maxActive,setMaxActive]=useState(2);
  const [taskConcurrency,setTaskConcurrency]=useState(1);
  const [answer,setAnswer]=useState<number|null>(null);
  const [submitted,setSubmitted]=useState(false);

  const complete=revealed===intervals.length;
  const created=useMemo(()=>createdIndexes(mode,revealed),[mode,revealed]);
  const running=created.slice(0,maxActive);
  const queued=created.slice(maxActive);
  const currentDay=revealed===0?"Jan 1, 2024 · 01:59 UTC":revealed>=5?"Jan 6, 2024 · 10:30 UTC":"Jan "+(revealed+1)+", 2024 · 02:00 UTC";

  useEffect(()=>{
    setAnswer(null);
    setSubmitted(false);
  },[mode,revealed,maxActive]);

  useEffect(()=>{
    if(!playing)return;
    if(complete){setPlaying(false);return;}
    const timer=window.setTimeout(()=>setRevealed(value=>Math.min(value+1,intervals.length)),reduce?0:1050);
    return ()=>window.clearTimeout(timer);
  },[playing,complete,reduce]);

  function play(){
    if(complete)setRevealed(0);
    setPlaying(value=>!value||complete);
  }
  function reset(){
    setPlaying(false);
    setRevealed(intervals.length);
    setAnswer(null);
    setSubmitted(false);
  }

  const expectedRuns=mode==="catchup-off"?(revealed>0?1:0):mode==="catchup-on"?revealed:[1,2,3].filter(index=>index<revealed).length;
  const answerOptions=Array.from(new Set([0,1,Math.max(0,expectedRuns-1),expectedRuns,Math.min(5,expectedRuns+1)])).sort((a,b)=>a-b);
  const correctAnswer=answerOptions.indexOf(expectedRuns);

  const currentResult=mode==="catchup-off"
    ? `With catchup off, only the latest closed interval (${revealed?intervals[Math.max(0,revealed-1)].short:"none yet"}) is considered for a new scheduled run.`
    : mode==="catchup-on"
      ? `Catchup on produces ${created.length} missing historical run${created.length===1?"":"s"} in this teaching state; execution limits decide how many run now.`
      : `Bounded backfill targets ${created.length} interval${created.length===1?"":"s"} inside Jan 2 → Jan 5; intervals outside the range are untouched.`;

  const statusItems=[
    {
      label:"Data intervals",
      detail:`${revealed} of ${intervals.length} intervals closed in the simulation`,
      state:revealed>0?"done":"waiting",
    },
    {
      label:"DAG run creation",
      detail:created.length?`${created.length} run${created.length===1?"":"s"} created by ${modeCopy[mode].label.toLowerCase()}`:"No runs created yet",
      state:created.length?"active":"waiting",
    },
    {
      label:"Task execution",
      detail:running.length?`${running.length} active run${running.length===1?"":"s"} · max_active_runs = ${maxActive}`:"No active runs",
      state:running.length?"active":"waiting",
    },
    {
      label:"Queue",
      detail:queued.length?`${queued.length} run${queued.length===1?"":"s"} waiting for run capacity`:"No queued runs",
      state:queued.length?"active":"waiting",
    },
    {
      label:"Next interval",
      detail:complete?"Next scheduled boundary: Jan 7 · 02:00 UTC":intervals[revealed]?.due??"All shown",
      state:"waiting",
    },
  ];

  return <section className="af-catch" aria-label={lesson.title+" interactive catchup and backfill lesson"}>
    <div className="af-catch-controls">
      <section className="af-catch-control">
        <header><CalendarClock size={18}/><div><strong>Schedule (timetable)</strong><small>Runs daily at:</small></div></header>
        <button className="af-catch-static">0 2 * * * <span>(02:00 UTC)</span></button>
      </section>

      <section className="af-catch-control">
        <header><Clock3 size={18}/><div><strong>Time range</strong><small>Simulate missing scheduled runs</small></div></header>
        <div className="af-catch-range">
          <span><small>Start date</small><b>Jan 1, 2024</b></span>
          <span><small>Current time</small><b>{currentDay}</b></span>
        </div>
      </section>

      <section className="af-catch-control">
        <header><Sparkles size={18}/><div><strong>Mode</strong><small>Choose historical-run behavior</small></div></header>
        <div className="af-catch-segment" role="group" aria-label="Catchup mode">
          {(Object.keys(modeCopy) as Mode[]).map(item=><button key={item} aria-pressed={mode===item} onClick={()=>setMode(item)}>{modeCopy[item].label}</button>)}
        </div>
      </section>

      <section className="af-catch-control">
        <header><Network size={18}/><div><strong>Execution limits</strong><small>Control how much work can overlap</small></div></header>
        <div className="af-catch-selects">
          <label><span>max_active_runs</span><select value={maxActive} onChange={event=>setMaxActive(Number(event.target.value))}><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option></select></label>
          <label><span>task concurrency</span><select value={taskConcurrency} onChange={event=>setTaskConcurrency(Number(event.target.value))}><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option></select></label>
        </div>
      </section>
    </div>

    <div className="af-catch-main">
      <div className="af-catch-left">
        <section className="af-catch-simulator">
          <header className="af-catch-sim-head">
            <div><span><Network size={19}/></span><div><strong>Scheduled intervals & DAG runs</strong><p>Each box is one data interval. Change the mode to see which historical runs Airflow creates.</p></div></div>
            <div className="af-catch-actions">
              <button className="af-primary" onClick={play}>{playing?<Pause size={14}/>:<Play size={14}/>} {playing?"Pause":complete?"Replay":"Play"}</button>
              <button disabled={complete} onClick={()=>{setPlaying(false);setRevealed(value=>Math.min(value+1,intervals.length));}}><SkipForward size={14}/>Next day</button>
              <button onClick={reset}><RotateCcw size={14}/>Reset</button>
            </div>
          </header>

          <div className="af-catch-mode-note"><strong>{modeCopy[mode].label}</strong><span>{modeCopy[mode].summary}</span></div>

          <div className="af-catch-legend">
            <span><i className="interval"/>Interval / no run</span>
            <span><i className="queued"/>DAG run queued</span>
            <span><i className="running"/>DAG run running</span>
            <span><i className="success"/>Run capacity available</span>
            <span><i className="skipped"/>Skipped / no run</span>
          </div>

          <div className="af-catch-history">
            <div className="af-catch-track"/>
            {intervals.map((interval,index)=>{
              const state=intervalState(index,mode,revealed,maxActive);
              const selectedBackfill=mode==="backfill"&&[1,2,3].includes(index);
              return <motion.article
                key={interval.id}
                className={"af-catch-interval state-"+state+(selectedBackfill?" is-backfill":"")}
                initial={false}
                animate={{y:state==="running"&&!reduce?-2:0,opacity:state==="future"?.52:1}}
              >
                <div className="af-catch-date"><strong>{"Jan "+(index+1)}</strong><small>02:00</small></div>
                <div className="af-catch-box">
                  <span className="af-catch-state-icon"><StateGlyph state={state}/></span>
                  <strong>{state==="running"?"Run created":state==="queued"?"Run queued":state==="skipped"?"No run":selectedBackfill?"Backfill target":"Interval"}</strong>
                  <small>{stateLabel(state,mode,index)}</small>
                </div>
                <div className="af-catch-interval-name">{interval.short}</div>
              </motion.article>;
            })}
            <div className="af-catch-now" style={{left:"95%"}}><i/><strong>Now</strong><small>Jan 6 · 10:30</small></div>
          </div>

          <div className="af-catch-result">
            <CheckCircle2 size={18}/>
            <div><strong>Current result</strong><p>{currentResult}</p></div>
            <div className="af-catch-result-stats">
              <span><CalendarClock size={14}/><b>{revealed}</b><small>Closed intervals</small></span>
              <span><Database size={14}/><b>{created.length}</b><small>Runs created</small></span>
              <span><Play size={14}/><b>{running.length}</b><small>Running now</small></span>
              <span><Circle size={11}/><b>{queued.length}</b><small>Queued</small></span>
            </div>
          </div>
        </section>

        <section className="af-catch-execution">
          <header><div><Network size={17}/><div><strong>Execution (concurrency simulation)</strong><p>Created runs are not all guaranteed to execute at once.</p></div></div><span>max_active_runs = {maxActive} · task concurrency = {taskConcurrency}</span></header>
          <div className="af-catch-lanes">
            {Array.from({length:Math.max(2,maxActive)},(_,slot)=>{
              const run=running[slot];
              return <div className="af-catch-lane" key={slot}><strong>{"Worker slot "+(slot+1)}</strong><div>{run!==undefined?<motion.span initial={false} animate={{width:complete?"72%":"54%"}}><Play size={12}/>{"Run "+intervals[run].short.split(" → ")[0]}<small>Running</small></motion.span>:<em>Idle</em>}</div></div>;
            })}
            <div className="af-catch-lane queue"><strong>Queue</strong><div>{queued.length?queued.map(index=><span key={index}><Database size={11}/>{"Run "+intervals[index].short.split(" → ")[0]}</span>):<em>No runs in queue</em>}</div></div>
          </div>
        </section>

        <div className="af-catch-concepts">
          <article className="tone-orange"><span><CalendarClock size={20}/></span><div><strong>Timetable</strong><p>Defines the scheduled interval boundaries.</p></div></article>
          <article className="tone-blue"><span><Clock3 size={20}/></span><div><strong>Closed intervals</strong><p>Historical periods become eligible for run creation.</p></div></article>
          <article className="tone-coral"><span><Database size={20}/></span><div><strong>Run creation</strong><p>Catchup or backfill decides which intervals get runs.</p></div></article>
          <article className="tone-violet"><span><Network size={20}/></span><div><strong>Execution capacity</strong><p>Concurrency decides which created runs execute now.</p></div></article>
        </div>
      </div>

      <aside className="af-catch-side">
        <section className="af-catch-predict">
          <header><Lightbulb size={19}/><strong>Predict before you run</strong></header>
          <p>With <b>{modeCopy[mode].label}</b> and {revealed} closed interval{revealed===1?"":"s"}, how many DAG runs should be created in this teaching state?</p>
          <div>{answerOptions.map((value,index)=><button key={value} aria-pressed={answer===index} onClick={()=>{setAnswer(index);setSubmitted(false);}}><i>{answer===index?<Circle size={8}/>:null}</i><span>{value} run{value===1?"":"s"}</span></button>)}</div>
          <button className="af-primary" disabled={answer===null} onClick={()=>setSubmitted(true)}>Submit Answer</button>
          {submitted&&<small className={answer===correctAnswer?"is-correct":"is-wrong"}>{answer===correctAnswer?"Correct — compare the highlighted intervals with the created-run count.":"Compare the selected mode with the interval states above."}</small>}
        </section>

        <section className="af-catch-now-panel">
          <header><Clock3 size={18}/><strong>What&apos;s happening now?</strong></header>
          <div>{statusItems.map((item,index)=><span key={item.label} className={"state-"+item.state}><i>{item.state==="done"?<CheckCircle2 size={13}/>:item.state==="active"?<Play size={11}/>:<Circle size={9}/>}</i><div><strong>{item.label}</strong><small>{item.detail}</small></div>{index<statusItems.length-1&&<em/>}</span>)}</div>
        </section>

        <section className="af-catch-insight">
          <Sparkles size={18}/><div><strong>Visual rule</strong><p><b>Run creation</b> and <b>execution capacity</b> are separate decisions. Catchup/backfill chooses historical runs; concurrency controls how many can execute together.</p></div>
        </section>
      </aside>
    </div>

    <p className="af-catch-caveat">Airflow 3.1 · deterministic educational simulation. Existing DAG runs, start dates, reprocessing policies, pools and deployment limits affect real behavior. Bounded backfill here represents an explicit selected historical range; it is not blocked by catchup=False.</p>
  </section>;
}
