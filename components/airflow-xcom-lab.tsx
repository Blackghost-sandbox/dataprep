"use client";

import {useEffect,useState} from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Cloud,
  Code2,
  Copy,
  Database,
  FileText,
  Link2,
  PackageOpen,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  SkipForward,
  Workflow,
} from "lucide-react";
import {motion,useReducedMotion} from "framer-motion";
import type {AirflowLesson} from "@/lib/airflow-lessons";

type Mode="reference"|"bulk";
type InspectorTab="xcom"|"tasks"|"storage";

const referencePayload={
  path:"s3://example-data/sales/2026-01-01.parquet",
  row_count:12543,
  file_format:"parquet",
};

const referenceSteps=[
  {title:"Task A runs",detail:"Processes data and writes to storage",tone:"orange"},
  {title:"Push to XCom",detail:"Stores the compact reference",tone:"violet"},
  {title:"Task B runs",detail:"Reads reference and processes data",tone:"blue"},
  {title:"Data available",detail:"Downstream tasks can use results",tone:"green"},
];

const bulkSteps=[
  {title:"Task A runs",detail:"Builds a large in-memory dataset",tone:"orange"},
  {title:"Push bulk payload",detail:"XCom receives the dataset itself",tone:"red"},
  {title:"Task B runs",detail:"Consumes orchestration-carried bulk data",tone:"red"},
  {title:"Tight coupling",detail:"Metadata transport became data storage",tone:"amber"},
];

export function AirflowXcomLab({lesson}:{lesson:AirflowLesson}){
  const reduce=useReducedMotion();
  const [mode,setMode]=useState<Mode>("reference");
  const [step,setStep]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [tab,setTab]=useState<InspectorTab>("xcom");
  const [copied,setCopied]=useState(false);

  const steps=mode==="reference"?referenceSteps:bulkSteps;
  const complete=step===steps.length-1;
  const messageJson=JSON.stringify(referencePayload,null,2);
  const payloadBytes=messageJson.length;

  useEffect(()=>{
    setStep(0);
    setPlaying(false);
    setTab("xcom");
  },[mode]);

  useEffect(()=>{
    if(!playing)return;
    if(complete){setPlaying(false);return;}
    const timer=window.setTimeout(()=>setStep(value=>Math.min(value+1,steps.length-1)),reduce?0:1050);
    return ()=>window.clearTimeout(timer);
  },[playing,complete,steps.length,reduce]);

  function run(){
    if(complete)setStep(0);
    setPlaying(value=>!value||complete);
  }

  function reset(){
    setPlaying(false);
    setStep(0);
    setTab("xcom");
  }

  const codeLines=mode==="reference"?[
    "from airflow.sdk import dag, task",
    "import pendulum",
    "",
    "@dag(",
    '    start_date=pendulum.datetime(2026, 1, 1, tz="UTC"),',
    "    schedule=None,",
    "    catchup=False,",
    ")",
    "def xcom_reference_demo():",
    "    @task",
    "    def produce_data():",
    '        path = "s3://example-data/sales/2026-01-01.parquet"',
    "        row_count = 12543",
    "        # Teaching stand-in: write + validate the object first.",
    "        return {",
    '            "path": path,',
    '            "row_count": row_count,',
    '            "file_format": "parquet",',
    "        }",
    "",
    "    @task",
    "    def consume_data(ref: dict):",
    '        print(ref["path"], ref["row_count"])',
    "",
    "    consume_data(produce_data())",
    "",
    "xcom_reference_demo()",
  ]:[
    "from airflow.sdk import task",
    "",
    "@task",
    "def produce_data():",
    "    rows = build_large_dataset()",
    "    return rows  # avoid: bulk data through XCom",
    "",
    "@task",
    "def consume_data(rows):",
    "    process(rows)",
    "",
    "consume_data(produce_data())",
  ];

  const activeLine=mode==="reference"?[11,14,21,24][step]:[4,5,8,9][step];

  async function copyCode(){
    try{
      await navigator.clipboard.writeText(codeLines.join("\n"));
      setCopied(true);
      window.setTimeout(()=>setCopied(false),1200);
    }catch{
      setCopied(false);
    }
  }

  return <section className="af-xcom-ref" aria-label={lesson.title+" visual XCom lesson"}>
    <section className="af-xcom-ref-toolbar">
      <div className="af-xcom-ref-toolbar-title">
        <span><Workflow size={19}/></span>
        <div><strong>XCom Communication Flow</strong><small>Watch how tasks share a compact reference while bulk data stays in external storage.</small></div>
      </div>
      <div className="af-xcom-ref-toolbar-actions">
        <div className="af-xcom-ref-modes">
          <button aria-pressed={mode==="reference"} onClick={()=>setMode("reference")}><Database size={14}/>Storage reference</button>
          <button aria-pressed={mode==="bulk"} onClick={()=>setMode("bulk")}><AlertTriangle size={14}/>Bulk payload <span>(avoid)</span></button>
        </div>
        <i/>
        <button className="af-primary" onClick={run}>{playing?<Pause size={14}/>:<Play size={14}/>} {playing?"Pause":complete?"Replay":"Run"}</button>
        <button disabled={complete} onClick={()=>{setPlaying(false);setStep(value=>Math.min(value+1,steps.length-1));}}><SkipForward size={14}/>Next step</button>
        <button onClick={reset}><RotateCcw size={14}/>Reset</button>
        <b>{step+1} / {steps.length} steps</b>
      </div>
    </section>

    <div className="af-xcom-ref-main">
      <div className="af-xcom-ref-left">
        <section className={"af-xcom-ref-flow mode-"+mode}>
          <div className="af-xcom-ref-flow-grid">
            <article className="af-xcom-ref-stage producer" onClick={()=>setTab("tasks")}>
              <header><span><PackageOpen size={19}/></span><div><strong>Task A</strong><small>Process data and store it in external storage</small></div><em>Producer</em></header>
              <div className="af-xcom-ref-stage-body">
                <span><FileText size={18}/></span>
                <div><strong>Process orders data</strong><p>Build / validate the dataset, then publish the durable object.</p></div>
                {step>=1&&<CheckCircle2 size={15}/>}
              </div>
              <div className="af-xcom-ref-stage-tag">Store in S3 / GCS / ADLS</div>
            </article>

            <article className={"af-xcom-ref-stage xcom "+(mode==="bulk"?"danger":"")} onClick={()=>setTab("xcom")}>
              <header><span>{mode==="reference"?<Database size={19}/>:<AlertTriangle size={19}/>}</span><div><strong>XCom</strong><small>{mode==="reference"?"Small task-scoped message (shared via metadata DB)":"Bulk payload anti-pattern"}</small></div></header>
              <div className="af-xcom-ref-json-card">
                <label>{mode==="reference"?"XCom message":"Oversized task message"}</label>
                <pre>{mode==="reference"?<>
                  <span className="brace">{"{"}</span>{"\n"}
                  {"  "}<span className="key">"path"</span><span className="punct">: </span><span className="string">"{referencePayload.path}"</span><span className="punct">,</span>{"\n"}
                  {"  "}<span className="key">"row_count"</span><span className="punct">: </span><span className="number">{referencePayload.row_count}</span><span className="punct">,</span>{"\n"}
                  {"  "}<span className="key">"file_format"</span><span className="punct">: </span><span className="string">"{referencePayload.file_format}"</span>{"\n"}
                  <span className="brace">{"}"}</span>
                </>:<>
                  <span className="brace">{"{"}</span>{"\n"}
                  {"  "}<span className="key">"rows"</span><span className="punct">: </span><span className="danger-string">"large in-memory dataset ..."</span>{"\n"}
                  <span className="brace">{"}"}</span>
                </>}</pre>
              </div>
            </article>

            <article className="af-xcom-ref-stage consumer" onClick={()=>setTab("tasks")}>
              <header><span><Workflow size={19}/></span><div><strong>Task B</strong><small>{mode==="reference"?"Read reference from XCom and load the data":"Receives bulk data from orchestration transport"}</small></div><em>Consumer</em></header>
              <div className="af-xcom-ref-stage-body">
                <span><Database size={18}/></span>
                <div><strong>{mode==="reference"?"Read object from storage":"Consume bulk payload"}</strong><p>{mode==="reference"?"Use the XCom reference to resolve the durable object.":"This makes XCom carry bulk-storage responsibility."}</p></div>
                {step>=3&&<CheckCircle2 size={15}/>}
              </div>
            </article>
          </div>

          <svg className="af-xcom-ref-wires" viewBox="0 0 1000 330" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <marker id="xc-ref-orange" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#f07f13"/></marker>
              <marker id="xc-ref-violet" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#7048ef"/></marker>
              <marker id="xc-ref-blue" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#2676e8"/></marker>
              <marker id="xc-ref-red" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#e9365c"/></marker>
            </defs>
            <motion.path className={"message "+(mode==="bulk"?"danger ":"")+(step>=1?"is-live":"")} d="M294,135 C307,135 315,135 329,135" markerEnd={mode==="bulk"?"url(#xc-ref-red)":"url(#xc-ref-orange)"} initial={false} animate={{opacity:mode==="bulk"||step>=1?1:.72}}/>
            <motion.path className={"message "+(mode==="bulk"?"danger ":"")+(step>=2?"is-live":"")} d="M672,135 C686,135 694,135 708,135" markerEnd={mode==="bulk"?"url(#xc-ref-red)":"url(#xc-ref-orange)"} initial={false} animate={{opacity:mode==="bulk"||step>=2?1:.72}}/>
            <motion.path className={"storage-write "+(mode==="reference"?"is-live":"")} d="M190,190 C190,260 306,278 430,278" markerEnd="url(#xc-ref-orange)" initial={false} animate={{opacity:mode==="reference"?1:.12}}/>
            <motion.path className={"storage-read "+(mode==="reference"?"is-live":"")} d="M590,278 C720,278 816,258 816,190" markerEnd="url(#xc-ref-blue)" initial={false} animate={{opacity:mode==="reference"?1:.12}}/>
          </svg>

          <button className={"af-xcom-ref-storage "+(mode==="bulk"?"is-muted":"")} onClick={()=>setTab("storage")}>
            <span><Database size={25}/></span>
            <div><strong>External Storage</strong><small>S3 / GCS / ADLS / warehouse/object store</small></div>
          </button>
          <span className="af-xcom-ref-wire-label write">Write dataset</span>
          <span className="af-xcom-ref-wire-label read">Read using reference</span>
        </section>

        <section className="af-xcom-ref-timeline">
          <header><Play size={15}/><strong>Execution Timeline</strong><small>illustrative sequence, not elapsed runtime</small></header>
          <div>
            {steps.map((item,index)=><button key={item.title} className={"tone-"+item.tone+(index<step?" is-done":index===step?" is-current":"")} onClick={()=>{setPlaying(false);setStep(index);}}>
              <span>{index+1}</span>
              <div><strong>{item.title}</strong><small>{item.detail}</small></div>
              {index<=step?<CheckCircle2 size={14}/>:null}
              {index<steps.length-1&&<i>→</i>}
            </button>)}
          </div>
        </section>
      </div>

      <aside className="af-xcom-ref-inspector">
        <header><Database size={16}/><strong>Communication Inspector</strong></header>
        <nav>
          <button aria-pressed={tab==="xcom"} onClick={()=>setTab("xcom")}>XCom</button>
          <button aria-pressed={tab==="tasks"} onClick={()=>setTab("tasks")}>Task Details</button>
          <button aria-pressed={tab==="storage"} onClick={()=>setTab("storage")}>External Storage</button>
        </nav>

        {tab==="xcom"&&<>
          <div className="af-xcom-ref-field"><span>XCom Key</span><b>return_value</b></div>
          <section className="af-xcom-ref-message">
            <header><strong>Message (JSON)</strong><button onClick={()=>navigator.clipboard?.writeText(messageJson)}><Copy size={13}/></button></header>
            <pre>{mode==="reference"?<>
              <span className="brace">{"{"}</span>{"\n"}
              {"  "}<span className="key">"path"</span><span className="punct">: </span><span className="string">"{referencePayload.path}"</span><span className="punct">,</span>{"\n"}
              {"  "}<span className="key">"row_count"</span><span className="punct">: </span><span className="number">{referencePayload.row_count}</span><span className="punct">,</span>{"\n"}
              {"  "}<span className="key">"file_format"</span><span className="punct">: </span><span className="string">"{referencePayload.file_format}"</span>{"\n"}
              <span className="brace">{"}"}</span>
            </>:<>
              <span className="brace">{"{"}</span>{"\n"}
              {"  "}<span className="key">"payload"</span><span className="punct">: </span><span className="danger-string">"bulk dataset ..."</span>{"\n"}
              <span className="brace">{"}"}</span>
            </>}</pre>
          </section>
          <dl>
            <div><dt>Size</dt><dd>{mode==="reference"?payloadBytes+" bytes":"large / unsuitable"}</dd></div>
            <div><dt>Visible to</dt><dd>Tasks in this DAG run</dd></div>
            <div><dt>Scope</dt><dd>Task-scoped output</dd></div>
            <div><dt>Stored in</dt><dd>{mode==="reference"?"Configured XCom backend":"Configured XCom backend"}</dd></div>
          </dl>
        </>}

        {tab==="tasks"&&<>
          <section className="af-xcom-ref-inspector-card orange"><span><PackageOpen size={18}/></span><div><strong>Task A · producer</strong><p>Writes the bulk dataset durably before returning a compact manifest.</p></div></section>
          <section className="af-xcom-ref-inspector-card green"><span><Workflow size={18}/></span><div><strong>Task B · consumer</strong><p>Receives the task output, then resolves the durable object using authorized access.</p></div></section>
          <dl>
            <div><dt>Worker boundary</dt><dd>May be different workers</dd></div>
            <div><dt>Credentials</dt><dd>Resolve separately</dd></div>
            <div><dt>Bulk rows in XCom?</dt><dd>{mode==="reference"?"No":"Yes — avoid"}</dd></div>
          </dl>
        </>}

        {tab==="storage"&&<>
          <section className="af-xcom-ref-inspector-card blue"><span><Cloud size={19}/></span><div><strong>Durable shared storage</strong><p>Holds the actual Parquet/table/model data. XCom carries only the locator and small metadata.</p></div></section>
          <dl>
            <div><dt>Example object</dt><dd>sales/2026-01-01.parquet</dd></div>
            <div><dt>Producer</dt><dd>Task A</dd></div>
            <div><dt>Consumer</dt><dd>Task B</dd></div>
            <div><dt>Access contract</dt><dd>Both need authorized access</dd></div>
          </dl>
          <div className="af-xcom-ref-note"><ShieldCheck size={15}/><p>A URI is useful only after the producer has finished and validated the durable write.</p></div>
        </>}
      </aside>
    </div>

    <div className="af-xcom-ref-bottom">
      <section className="af-xcom-ref-code">
        <header><div><Code2 size={15}/><strong>Python (TaskFlow) · XCom with storage reference</strong></div><button onClick={copyCode}>{copied?<Check size={13}/>:<Copy size={13}/>} {copied?"Copied":"Copy"}</button></header>
        <pre><code>{codeLines.map((line,index)=><span key={index} className={index===activeLine?"is-active":""}><i>{index+1}</i><b>{line}</b>{"\n"}</span>)}</code></pre>
      </section>

      <section className="af-xcom-ref-concepts">
        <header><strong>Key Concepts</strong></header>
        <div>
          <article className="violet"><span><Database size={19}/></span><p><strong>XCom is for small messages</strong><small>Pass references, metadata and compact task outputs.</small></p></article>
          <article className="blue"><span><Cloud size={19}/></span><p><strong>Store bulk data externally</strong><small>Write large datasets to shared durable storage.</small></p></article>
          <article className="green"><span><Link2 size={19}/></span><p><strong>Pass a reference</strong><small>Share a URI/path and useful validation metadata.</small></p></article>
          <article className="red"><span><AlertTriangle size={19}/></span><p><strong>Keep it lightweight</strong><small>Avoid large payloads, DataFrames, files or credentials in XCom.</small></p></article>
        </div>
      </section>
    </div>

    <p className="af-xcom-ref-caveat">Airflow 3.1 · deterministic educational simulation. The example object is illustrative and is not created or read by this website. XCom storage depends on the configured backend; the default deployment pattern commonly uses Airflow metadata storage unless another XCom backend is configured.</p>
  </section>;
}
