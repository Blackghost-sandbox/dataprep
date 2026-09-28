"use client";

import {useEffect,useMemo,useState} from "react";
import {
  AlertTriangle,
  Braces,
  Check,
  CheckCircle2,
  ChevronDown,
  Code2,
  Copy,
  Database,
  HelpCircle,
  KeyRound,
  Lightbulb,
  Link2,
  Play,
  RotateCcw,
  ShieldCheck,
  SkipForward,
  SlidersHorizontal,
  Sparkles,
  Workflow,
} from "lucide-react";
import type {AirflowLesson} from "@/lib/airflow-lessons";

type ConfigMode="params"|"variables"|"connections";
type DetailTab="explanation"|"schema"|"best"|"related";

const modeMeta:Record<ConfigMode,{
  title:string;
  subtitle:string;
  tone:string;
  takeaway:string;
  result:string;
}> = {
  params:{
    title:"Params",
    subtitle:"Run-time inputs for a DAG run",
    tone:"violet",
    takeaway:"Use Params for validated inputs that can vary for each DAG run.",
    result:"Params loaded successfully",
  },
  variables:{
    title:"Variables",
    subtitle:"Shared non-secret configuration",
    tone:"blue",
    takeaway:"Use Variables for shared, non-secret values that multiple runs may read.",
    result:"Variable resolved at task runtime",
  },
  connections:{
    title:"Connections",
    subtitle:"External services and credentials",
    tone:"orange",
    takeaway:"Use Connections / secret backends for service access; never place credentials in Params or Variables.",
    result:"Connection resolved through configured secret path",
  },
};

const steps:Record<ConfigMode,Array<{title:string;subtitle:string;tone:string}>>={
  params:[
    {title:"Params",subtitle:"Run-specific validated input",tone:"violet"},
    {title:"Task runtime",subtitle:"Resolve supported configuration",tone:"blue"},
    {title:"Validate",subtitle:"Check expected input",tone:"green"},
    {title:"Use safely",subtitle:"No secret logging",tone:"orange"},
  ],
  variables:[
    {title:"Variable",subtitle:"Shared non-secret setting",tone:"blue"},
    {title:"Task runtime",subtitle:"Resolve only when needed",tone:"violet"},
    {title:"Apply setting",subtitle:"Use a bounded config value",tone:"green"},
    {title:"Observe safely",subtitle:"Log meaning, not secrets",tone:"orange"},
  ],
  connections:[
    {title:"Connection ID",subtitle:"Name the external service",tone:"orange"},
    {title:"Resolve access",subtitle:"Use configured connection / secrets",tone:"violet"},
    {title:"Create client",subtitle:"Hook or provider uses access config",tone:"blue"},
    {title:"Use safely",subtitle:"Never print passwords or URIs",tone:"green"},
  ],
};

const modeCode:Record<ConfigMode,string[]>={
  params:[
    "from airflow.sdk import DAG, Param, get_current_context, task",
    "import pendulum",
    "",
    "with DAG(",
    '    dag_id="example_with_params",',
    '    start_date=pendulum.datetime(2026, 1, 1, tz="UTC"),',
    "    schedule=None,",
    "    catchup=False,",
    "    params={",
    '        "region": Param("US", type="string", enum=["US","IN"]),',
    '        "limit": Param(100, type="integer", minimum=1, maximum=1000),',
    "    },",
    ") as dag:",
    "    @task",
    "    def inspect():",
    "        context = get_current_context()",
    '        region = context["params"]["region"]',
    '        limit = context["params"]["limit"]',
    "        print(region, limit)",
    "",
    "    inspect()",
  ],
  variables:[
    "from airflow.sdk import Variable, task",
    "",
    "@task",
    "def inspect_mode():",
    '    mode = Variable.get("sales_mode", default="daily")',
    '    print("sales mode:", mode)',
    "    return mode",
    "",
    "inspect_mode()",
  ],
  connections:[
    "from airflow.sdk import Connection, task",
    "",
    "@task",
    "def inspect_service():",
    '    warehouse = Connection.get("warehouse")',
    '    print("connection id: warehouse")',
    "    # Never print password, token, URI or connection object.",
    "    return warehouse.conn_type",
    "",
    "inspect_service()",
  ],
};

export function AirflowConfigurationLab({lesson}:{lesson:AirflowLesson}){
  const [mode,setMode]=useState<ConfigMode>("params");
  const [step,setStep]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [detailTab,setDetailTab]=useState<DetailTab>("explanation");
  const [copied,setCopied]=useState(false);
  const [region,setRegion]=useState("US");
  const [limit,setLimit]=useState(100);

  const meta=modeMeta[mode];
  const currentSteps=steps[mode];
  const codeLines=modeCode[mode];
  const complete=step===3;

  useEffect(()=>{
    setStep(0);
    setPlaying(false);
    setDetailTab("explanation");
  },[mode]);

  useEffect(()=>{
    if(!playing)return;
    if(complete){setPlaying(false);return;}
    const timer=window.setTimeout(()=>setStep(value=>Math.min(3,value+1)),900);
    return ()=>window.clearTimeout(timer);
  },[playing,complete]);

  const resultText=useMemo(()=>{
    if(mode==="params")return meta.result+" · region="+region+" · limit="+limit;
    if(mode==="variables")return meta.result+" · sales_mode=daily";
    return meta.result+" · warehouse";
  },[mode,meta.result,region,limit]);

  const activeLine=mode==="params"?[8,15,16,18][step]:mode==="variables"?[3,4,4,5][step]:[3,4,4,6][step];

  async function copyCode(){
    try{
      await navigator.clipboard.writeText(codeLines.join("\n"));
      setCopied(true);
      window.setTimeout(()=>setCopied(false),1200);
    }catch{setCopied(false);}
  }

  function run(){
    if(complete)setStep(0);
    setPlaying(v=>!v||complete);
  }

  function reset(){
    setPlaying(false);
    setStep(0);
  }

  return <section className="af-config" aria-label={lesson.title+" visual configuration lab"}>
    <header className="af-config-intro">
      <div>
        <span><Sparkles size={20}/></span>
        <div><h2>Visual Learning Lab</h2><p>See how Params, Variables and Connections work together in an Airflow DAG.</p></div>
      </div>
      <aside><Lightbulb size={19}/><div><strong>Key takeaway</strong><p>Separate shared settings, run-specific inputs and service credentials.</p></div></aside>
    </header>

    <nav className="af-config-mode-tabs" aria-label="Configuration source">
      {(Object.keys(modeMeta) as ConfigMode[]).map(key=>{
        const item=modeMeta[key];
        return <button key={key} className={"tone-"+item.tone} aria-pressed={mode===key} onClick={()=>setMode(key)}>
          <span>{key==="params"?<Braces size={19}/>:key==="variables"?<Database size={19}/>:<KeyRound size={19}/>}</span>
          <div><strong>{item.title}</strong><small>{item.subtitle}</small></div>
        </button>;
      })}
    </nav>

    <section className="af-config-runbar">
      <div><strong>{meta.title} learning flow</strong><small>{meta.takeaway}</small></div>
      <div>
        <button className="af-primary" onClick={run}><Play size={14}/>{playing?"Pause":complete?"Replay":"Run"}</button>
        <button disabled={complete} onClick={()=>{setPlaying(false);setStep(v=>Math.min(3,v+1));}}><SkipForward size={14}/>Next step</button>
        <button onClick={reset}><RotateCcw size={14}/>Reset</button>
        <b>{step+1} / 4 steps</b>
      </div>
    </section>

    <section className="af-config-steps">
      {currentSteps.map((item,index)=><article key={item.title} className={"tone-"+item.tone+(index===step?" is-current":index<step?" is-done":"")}>
        <header><span>{index+1}</span><div><strong>{item.title}</strong><small>{item.subtitle}</small></div>{index<step?<CheckCircle2 size={16}/>:null}</header>

        {mode==="params"&&index===0&&<div className="af-config-param-form">
          <label><span>date</span><b>2026-01-01</b></label>
          <label><span>region</span><select value={region} onChange={e=>setRegion(e.target.value)}><option value="US">US</option><option value="IN">IN</option></select><ChevronDown size={12}/></label>
          <label><span>limit</span><input type="number" min={1} max={1000} value={limit} onChange={e=>setLimit(Math.max(1,Math.min(1000,Number(e.target.value)||1)))}/></label>
        </div>}

        {mode==="params"&&index===1&&<pre className="af-config-mini-code"><code>{"{{ params.region }}"}{"\n"}{"{{ params.limit }}"}</code></pre>}
        {mode==="params"&&index===2&&<ul className="af-config-checks"><li><Check size={11}/>Type validation</li><li><Check size={11}/>Required fields</li><li><Check size={11}/>Allowed values</li><li><Check size={11}/>Default values</li></ul>}
        {mode==="params"&&index===3&&<div className="af-config-shield"><ShieldCheck size={38}/><p>Use validated input. Never treat a Param as trusted executable code.</p></div>}

        {mode==="variables"&&index===0&&<div className="af-config-variable"><Database size={28}/><div><strong>sales_mode</strong><small>daily</small></div></div>}
        {mode==="variables"&&index===1&&<pre className="af-config-mini-code"><code>{'Variable.get("sales_mode")'}</code></pre>}
        {mode==="variables"&&index===2&&<ul className="af-config-checks"><li><Check size={11}/>Shared across runs</li><li><Check size={11}/>Non-secret setting</li><li><Check size={11}/>Default supported</li></ul>}
        {mode==="variables"&&index===3&&<div className="af-config-shield"><ShieldCheck size={38}/><p>Read at task runtime when possible. Avoid heavy configuration I/O during DAG parsing.</p></div>}

        {mode==="connections"&&index===0&&<div className="af-config-variable connection"><KeyRound size={28}/><div><strong>warehouse</strong><small>Connection ID</small></div></div>}
        {mode==="connections"&&index===1&&<pre className="af-config-mini-code"><code>{'Connection.get("warehouse")'}</code></pre>}
        {mode==="connections"&&index===2&&<ul className="af-config-checks"><li><Check size={11}/>Host / service metadata</li><li><Check size={11}/>Secret-backed credentials</li><li><Check size={11}/>Provider / hook compatible</li></ul>}
        {mode==="connections"&&index===3&&<div className="af-config-shield"><ShieldCheck size={38}/><p>Log safe identifiers only. Never print the connection object, password, token or URI.</p></div>}

        <p>{index===0?"Choose the correct source for this kind of configuration.":index===1?"Resolve configuration where the task actually uses it.":index===2?"Validate assumptions before external work.":"Use configuration without turning logs or source control into secret channels."}</p>
      </article>)}
    </section>

    <div className="af-config-result">
      <span><CheckCircle2 size={16}/></span>
      <strong>Current result</strong>
      <p>{resultText}</p>
      <em><Check size={11}/>{mode==="connections"?"Safe access path":"Valid configuration"}</em>
    </div>

    <div className="af-config-bottom">
      <section className="af-config-code">
        <header><div><Code2 size={15}/><strong>Python / DAG code example</strong></div><button onClick={copyCode}>{copied?<Check size={13}/>:<Copy size={13}/>} {copied?"Copied":"Copy"}</button></header>
        <nav><button aria-pressed={mode==="params"} onClick={()=>setMode("params")}>DAG with Params</button><button aria-pressed={mode==="variables"} onClick={()=>setMode("variables")}>Variables</button><button aria-pressed={mode==="connections"} onClick={()=>setMode("connections")}>Connections</button></nav>
        <pre><code>{codeLines.map((line,index)=><span key={index} className={index===activeLine?"is-active":""}><i>{index+1}</i><b>{line}</b>{"\n"}</span>)}</code></pre>
      </section>

      <section className="af-config-explain">
        <nav>
          <button aria-pressed={detailTab==="explanation"} onClick={()=>setDetailTab("explanation")}><Workflow size={14}/>Explanation</button>
          <button aria-pressed={detailTab==="schema"} onClick={()=>setDetailTab("schema")}><Braces size={14}/>Param schema</button>
          <button aria-pressed={detailTab==="best"} onClick={()=>setDetailTab("best")}><HelpCircle size={14}/>Best practices</button>
          <button aria-pressed={detailTab==="related"} onClick={()=>setDetailTab("related")}><Link2 size={14}/>Related topics</button>
        </nav>

        <div className="af-config-explain-body">
          {detailTab==="explanation"&&<>
            <header><span className={"tone-"+meta.tone}>{mode==="params"?<Braces size={18}/>:mode==="variables"?<Database size={18}/>:<KeyRound size={18}/>}</span><div><strong>About {meta.title}</strong><p>{mode==="params"?"Params define validated inputs for an individual DAG run. Tasks read the resolved values from runtime context.":mode==="variables"?"Variables are shared key/value configuration. Keep them non-secret and fetch them at task runtime when practical.":"Connections describe external service access. Resolve them through the deployment's configured connection and secrets mechanism."}</p></div></header>
            <aside><strong>Key benefits</strong><div><span><Check size={10}/>{mode==="params"?"Validated run inputs":"Clear configuration ownership"}</span><span><Check size={10}/>{mode==="connections"?"Secret-management path":"Runtime resolution"}</span><span><Check size={10}/>Safer separation of concerns</span><span><Check size={10}/>Explicit configuration contract</span></div></aside>
          </>}

          {detailTab==="schema"&&<><header><span className="tone-violet"><Braces size={18}/></span><div><strong>Param schema</strong><p>Use Param definitions to constrain type, enum, minimum/maximum and defaults. Validation prevents unsupported input from silently becoming task behavior.</p></div></header><aside><strong>Current example</strong><div><span><Check size={10}/>region ∈ US, IN</span><span><Check size={10}/>limit is integer</span><span><Check size={10}/>1 ≤ limit ≤ 1000</span><span><Check size={10}/>default region = US</span></div></aside></>}

          {detailTab==="best"&&<><header><span className="tone-green"><ShieldCheck size={18}/></span><div><strong>Best practices</strong><p>Keep Params for run input, Variables for shared non-secret settings, and Connections for external service access. Avoid fetching secrets into printable values.</p></div></header><aside><strong>Safety checks</strong><div><span><Check size={10}/>Validate inputs</span><span><Check size={10}/>Do not log credentials</span><span><Check size={10}/>Prefer runtime lookup</span><span><Check size={10}/>Use parameterized APIs</span></div></aside></>}

          {detailTab==="related"&&<><header><span className="tone-blue"><SlidersHorizontal size={18}/></span><div><strong>Related topics</strong><p>Configuration touches secret backends, provider hooks, deployment settings, templating, Params validation and safe task logging.</p></div></header><aside><strong>Interview connections</strong><div><span><Check size={10}/>Params vs Variables</span><span><Check size={10}/>Connections vs secrets</span><span><Check size={10}/>Parse-time vs runtime lookup</span><span><Check size={10}/>Input validation</span></div></aside></>}
        </div>
      </section>
    </div>

    <p className="af-config-caveat"><AlertTriangle size={12}/> Airflow 3.1 educational configuration lab. The UI demonstrates configuration contracts only; it does not connect to an external service or expose real credentials.</p>
  </section>;
}
