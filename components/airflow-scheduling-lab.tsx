"use client";

import {useEffect,useMemo,useState} from "react";
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock3,
  Globe2,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Sparkles,
} from "lucide-react";
import {motion,useReducedMotion} from "framer-motion";
import {CodeSync} from "@/components/airflow-lab-primitives";
import type {AirflowLesson} from "@/lib/airflow-lessons";

type ScheduleHour=2|6;
type DisplayZone="UTC"|"America/New_York";
type AnswerId="interval-start"|"midnight"|"run-due"|"worker";

const orderOffsets=[
  {label:"Order A",hours:1,minutes:15,tone:"green"},
  {label:"Order B",hours:6,minutes:20,tone:"orange"},
  {label:"Order C",hours:12,minutes:10,tone:"blue"},
  {label:"Order D",hours:18,minutes:45,tone:"pink"},
] as const;

function pad(value:number){return String(value).padStart(2,"0");}
function fmtHour(hour:number){return pad((hour+24)%24)+":00";}
function addTime(hour:number,addHours:number,addMinutes=0){
  const total=hour*60+addHours*60+addMinutes;
  const dayShift=Math.floor(total/(24*60));
  const minutes=((total%(24*60))+(24*60))%(24*60);
  return {hour:Math.floor(minutes/60),minute:minutes%60,dayShift};
}
function clockLabel(hour:number,minute=0){return pad(hour)+":"+pad(minute);}

export function AirflowSchedulingLab({lesson}:{lesson:AirflowLesson}){
  const reduce=useReducedMotion();
  const [scheduleHour,setScheduleHour]=useState<ScheduleHour>(2);
  const [zone,setZone]=useState<DisplayZone>("UTC");
  const [step,setStep]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [answer,setAnswer]=useState<AnswerId>("run-due");
  const [submitted,setSubmitted]=useState(false);

  const actualStart=addTime(scheduleHour,0,7);
  const complete=step===3;

  useEffect(()=>{
    setStep(0);
    setPlaying(false);
    setAnswer("run-due");
    setSubmitted(false);
  },[scheduleHour]);

  useEffect(()=>{
    if(!playing)return;
    if(complete){setPlaying(false);return;}
    const timer=window.setTimeout(()=>setStep(value=>Math.min(value+1,3)),reduce?0:1250);
    return ()=>window.clearTimeout(timer);
  },[playing,complete,reduce]);

  const timeline=useMemo(()=>({
    start:"Jan 1, "+fmtHour(scheduleHour)+" UTC",
    end:"Jan 2, "+fmtHour(scheduleHour)+" UTC",
    logical:"Jan 1 · "+fmtHour(scheduleHour)+" UTC",
    due:"Jan 2 · "+fmtHour(scheduleHour)+" UTC",
    current:step===0
      ? "Jan 2 · "+clockLabel((scheduleHour+23)%24,59)+" UTC"
      : step===1
        ? "Jan 2 · "+fmtHour(scheduleHour)+" UTC"
        : step===2
          ? "Jan 2 · "+clockLabel(scheduleHour,1)+" UTC"
          : "Jan 2 · "+clockLabel(actualStart.hour,actualStart.minute)+" UTC",
  }),[scheduleHour,step,actualStart.hour,actualStart.minute]);

  const currentPct=step===0?72:step===1?84:step===2?87:91;
  const runCreated=step>=1;
  const eligible=step>=2;
  const started=step>=3;

  const statusItems=[
    {
      label:step===0?"Data interval is open":"Data interval is closed",
      detail:step===0
        ?"Collecting data from Jan 1, "+fmtHour(scheduleHour)+" → Jan 2, "+fmtHour(scheduleHour)
        :"Interval end reached; the scheduled run is now due",
      state:"done",
    },
    {
      label:"Current time",
      detail:step===0
        ? timeline.current+" · 1 minute before the interval closes"
        : timeline.current,
      state:"active",
    },
    {
      label:"DAG run",
      detail:runCreated?"Created for the closed interval":"Not created yet",
      state:runCreated?"done":"waiting",
    },
    {
      label:"Task eligibility",
      detail:eligible?"Scheduler evaluated · task can be considered":"Not evaluated yet",
      state:eligible?"done":"waiting",
    },
    {
      label:"Task execution",
      detail:started?"Started at "+clockLabel(actualStart.hour,actualStart.minute)+" UTC":"Not started yet",
      state:started?"done":"waiting",
    },
  ];

  const codeLines=[
    "from airflow.timetables.interval import CronDataIntervalTimetable",
    "",
    "timetable = CronDataIntervalTimetable(",
    '    cron="0 '+scheduleHour+' * * *",',
    '    timezone="UTC",',
    ")",
  ];

  const answerOptions:{id:AnswerId;label:string}[]=[
    {id:"interval-start",label:"Jan 1, 2024 · "+fmtHour(scheduleHour)+" UTC"},
    {id:"midnight",label:"Jan 2, 2024 · 00:00 UTC"},
    {id:"run-due",label:"Jan 2, 2024 · "+fmtHour(scheduleHour)+" UTC"},
    {id:"worker",label:"Whenever a worker is free"},
  ];

  function run(){
    if(complete)setStep(0);
    setPlaying(value=>!value||complete);
  }

  function reset(){
    setPlaying(false);
    setStep(0);
    setAnswer("run-due");
    setSubmitted(false);
  }

  const localEquivalent=scheduleHour===2
    ? "21:00 (previous day) in New York"
    : "01:00 in New York";

  return <section className="af-sched" aria-label={lesson.title+" interactive scheduling lesson"}>
    <div className="af-sched-main">
      <div className="af-sched-left">
        <div className="af-sched-top">
          <section className="af-sched-control-card">
            <header>
              <span><CalendarClock size={19}/></span>
              <div><strong>Schedule (timetable)</strong><small>Runs daily at:</small></div>
            </header>
            <div className="af-sched-segment">
              <button aria-pressed={scheduleHour===2} onClick={()=>setScheduleHour(2)}>02:00 UTC</button>
              <button aria-pressed={scheduleHour===6} onClick={()=>setScheduleHour(6)}>06:00 UTC</button>
            </div>
          </section>

          <section className="af-sched-control-card">
            <header>
              <span><Globe2 size={19}/></span>
              <div><strong>Timezone</strong><small>Display conversion</small></div>
            </header>
            <div className="af-sched-zone-row">
              <div className="af-sched-segment">
                <button aria-pressed={zone==="UTC"} onClick={()=>setZone("UTC")}>UTC</button>
                <button aria-pressed={zone==="America/New_York"} onClick={()=>setZone("America/New_York")}>America/New_York</button>
              </div>
              <p><b>{fmtHour(scheduleHour)} UTC</b><span>=</span><strong>{localEquivalent}</strong></p>
            </div>
          </section>

          <section className="af-sched-control-card">
            <header>
              <span><Clock3 size={19}/></span>
              <div><strong>Time controls</strong><small>Current time: {timeline.current}</small></div>
            </header>
            <div className="af-sched-time-buttons">
              <button className="af-primary" onClick={run}>{playing?<Pause size={14}/>:<Play size={14}/>} {playing?"Pause":complete?"Replay":"Play Day"}</button>
              <button disabled={complete} onClick={()=>{setPlaying(false);setStep(value=>Math.min(value+1,3));}}><SkipForward size={14}/>Next step</button>
              <button onClick={reset}><RotateCcw size={14}/>Reset</button>
            </div>
          </section>
        </div>

        <section className="af-sched-interval-card">
          <header>
            <span><Sparkles size={19}/></span>
            <div>
              <strong>Data interval for this run</strong>
              <p>The run will process data from Jan 1, {fmtHour(scheduleHour)} to Jan 2, {fmtHour(scheduleHour)} (UTC).</p>
            </div>
          </header>

          <div className="af-sched-timeline">
            <div className="af-sched-day af-sched-day-left"><strong>Jan 1, 2024</strong></div>
            <div className="af-sched-day af-sched-day-right"><strong>Jan 2, 2024</strong></div>

            <div className="af-sched-scale">
              <span className="af-sched-midnight">00:00</span>
              <i className="af-sched-tick tick-a"/>
              <i className="af-sched-tick tick-b"/>
              <i className="af-sched-tick tick-c"/>
              <i className="af-sched-tick tick-d"/>
              <i className="af-sched-tick tick-e"/>
              <i className="af-sched-tick tick-f"/>
            </div>

            <div className="af-sched-boundary start"><b>{fmtHour(scheduleHour)}</b><i/></div>
            <div className="af-sched-boundary end"><b>{fmtHour(scheduleHour)}</b><i/></div>

            <div className="af-sched-interval-bar">
              <strong>DATA INTERVAL</strong>
              <span>Jan 1, {fmtHour(scheduleHour)} → Jan 2, {fmtHour(scheduleHour)}</span>
            </div>

            {orderOffsets.map((order,index)=>{
              const time=addTime(scheduleHour,order.hours,order.minutes);
              const label=(time.dayShift>0?"Jan 2 ":"")+clockLabel(time.hour,time.minute);
              return <div key={order.label} className={"af-sched-order order-"+(index+1)+" tone-"+order.tone}>
                <i/><strong>{order.label}</strong><small>{label}</small>
              </div>;
            })}

            <div className="af-sched-callout start">
              <strong>Logical date (interval start)</strong>
              <b>{timeline.logical}</b>
              <p>Start of the data period<br/>(this is the run&apos;s logical date)</p>
            </div>

            <motion.div
              className="af-sched-current"
              animate={{left:currentPct+"%"}}
              transition={{duration:reduce?0:.28}}
            >
              <i/>
              <span><strong>Current time</strong><b>{timeline.current}</b></span>
            </motion.div>

            <div className="af-sched-callout end">
              <strong>Run due (interval end)</strong>
              <b>{timeline.due}</b>
              <p>When the data interval closes,<br/>the scheduled run becomes due.</p>
            </div>
          </div>
        </section>

        <section className="af-sched-concepts" aria-label="Scheduling mental model">
          <article className="tone-orange">
            <span><CalendarClock size={22}/></span>
            <div><strong>Timetable</strong><p>Defines the schedule<br/><code>{"0 "+scheduleHour+" * * *"}</code></p></div>
          </article>
          <em><b>→</b><strong>determines</strong><small>when the next<br/>interval starts</small></em>
          <article className="tone-blue">
            <span><Clock3 size={22}/></span>
            <div><strong>Time interval</strong><p>Represents the period<br/>of data to process</p></div>
          </article>
          <em><b>→</b><strong>closes at</strong><small>the interval<br/>end time</small></em>
          <article className="tone-coral">
            <span><Play size={22}/></span>
            <div><strong>Run becomes due</strong><p>A scheduled DAG run<br/>is created</p></div>
          </article>
          <em><b>→</b><strong>scheduler</strong><small>evaluates</small></em>
          <article className="tone-violet">
            <span><Sparkles size={22}/></span>
            <div><strong>Task eligibility</strong><p>Tasks become eligible based on<br/>dependencies and capacity</p></div>
          </article>
        </section>

        <div className="af-sched-bottom">
          <section className="af-sched-details">
            <header><strong>Run Details (current run)</strong></header>
            <div>
              <span><b>DAG ID</b><code>daily_sales</code></span>
              <span><b>Logical date</b><code>{timeline.logical}</code></span>
              <span><b>Data interval start</b><code>{timeline.start}</code></span>
              <span><b>Data interval end</b><code>{timeline.end}</code></span>
              <span><b>Run due</b><code>{timeline.due}</code></span>
              <span><b>Actual start</b><code>{started?"Jan 2 · "+clockLabel(actualStart.hour,actualStart.minute)+" UTC":"Not started yet"}</code></span>
              <span><b>State</b><code className={"state-"+(started?"running":eligible?"eligible":runCreated?"created":"none")}>{started?"Running":eligible?"Eligible":runCreated?"Created":"Not created"}</code></span>
            </div>
          </section>
          <CodeSync lines={codeLines} active={3} label="Timetable Code"/>
        </div>
      </div>

      <aside className="af-sched-side">
        <section className="af-sched-predict">
          <header><Lightbulb size={20}/><strong>Predict before you run</strong></header>
          <p>When should the scheduled DAG run become due for this data interval?</p>
          <div>
            {answerOptions.map(option=><button key={option.id} aria-pressed={answer===option.id} onClick={()=>{setAnswer(option.id);setSubmitted(false);}}>
              <i>{answer===option.id?<Play size={10}/>:null}</i><span>{option.label}</span>
            </button>)}
          </div>
          <button className="af-primary" onClick={()=>setSubmitted(true)}>Submit Answer</button>
          {submitted&&<small className={answer==="run-due"?"is-correct":"is-wrong"}>
            {answer==="run-due"?"Correct — a scheduled run becomes due at the interval end.":"Compare the answer with the interval-end marker."}
          </small>}
        </section>

        <section className="af-sched-now">
          <header><Clock3 size={19}/><strong>What&apos;s happening now?</strong></header>
          <div>
            {statusItems.map((item,index)=><span key={item.label} className={"state-"+item.state}>
              <i>{item.state==="done"?<CheckCircle2 size={14}/>:<Circle size={11}/>}</i>
              <div><strong>{item.label}</strong><small>{item.detail}</small></div>
              {index<statusItems.length-1&&<em/>}
            </span>)}
          </div>
        </section>

        <section className="af-sched-takeaway">
          <Lightbulb size={21}/>
          <div>
            <strong>Key Takeaway</strong>
            <p>A scheduled DAG run is created when the data interval closes, not at the beginning. The logical date (interval start), run due time (interval end), and actual task start time are different.</p>
          </div>
        </section>
      </aside>
    </div>

    <p className="af-sched-caveat">Airflow 3.1 · deterministic educational timeline. The 7-minute capacity delay is illustrative only; it is not a performance claim. This lesson uses an explicit CronDataIntervalTimetable in UTC.</p>
  </section>;
}
