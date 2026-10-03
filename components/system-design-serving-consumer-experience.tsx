"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  BarChart3, Boxes, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  Circle, Clock3, Code2, Database, DollarSign, Gauge, GraduationCap, Lightbulb,
  Network, Play, RefreshCcw, Server, Share2, Sparkles, Users, Zap
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useCompanion } from "@/components/companion-context";
import {
  defaultServingState,
  getServingScenario,
  servingScenarios,
  simulateServing,
  type AccessToggleId,
  type ConsumerId,
  type ServingResult,
  type ServingScenarioId,
  type ServingToggleId,
} from "@/lib/system-design-serving-consumer-simulation";

export function SystemServingConsumerHero({
  description, minutes, currentLesson, total, onPrevious, onNext,
}: {
  description: string;
  minutes: number;
  currentLesson: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return <section className="sdsc-hero">
    <div>
      <div className="sdsc-breadcrumb"><span>System Design</span><ChevronRight size={14}/><strong>Serving Layers &amp; Consumer Design</strong></div>
      <div className="sdsc-title-row"><span className="sdsc-hero-icon"><Zap size={28}/></span><div><h1>Serving Layers &amp; Consumer Design</h1><p>{description}</p></div></div>
      <div className="sdsc-meta"><span><Clock3 size={14}/>{minutes} min</span><span><GraduationCap size={14}/>Lesson {currentLesson + 1}/{total}</span><span className="sdsc-level">Intermediate</span></div>
    </div>
    <div className="sdsc-hero-actions"><button type="button" onClick={onPrevious}><ChevronLeft size={18}/></button><button type="button" onClick={onNext} disabled={currentLesson === total - 1}>Next <ChevronRight size={17}/></button></div>
  </section>;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return <button type="button" aria-pressed={checked} className={"sdsc-switch " + (checked ? "is-on" : "")} onClick={onChange}><i/></button>;
}

const consumerMeta: Record<ConsumerId,{title:string;subtitle:string;hint:string;tone:string;icon:React.ReactNode}> = {
  bi:{title:"BI Dashboard",subtitle:"(Analysts)",hint:"Aggregations, ad-hoc queries",tone:"blue",icon:<BarChart3 size={19}/>},
  api:{title:"Product API",subtitle:"(Real-time)",hint:"Low latency, key lookups",tone:"green",icon:<Server size={19}/>},
  ml:{title:"ML Training",subtitle:"(Data Science)",hint:"Large scans, feature data",tone:"purple",icon:<Sparkles size={19}/>},
  partner:{title:"External Partner",subtitle:"(Data Share)",hint:"Filtered, governed access",tone:"pink",icon:<Users size={19}/>},
};

function ConsumerCard({id,checked,onToggle}:{id:ConsumerId;checked:boolean;onToggle:()=>void}) {
  const meta=consumerMeta[id];
  return <article className={"sdsc-consumer-card "+meta.tone+(checked?" is-on":"")}><span>{meta.icon}</span><div><strong>{meta.title} <small>{meta.subtitle}</small></strong><p>{meta.hint}</p></div><Toggle checked={checked} onChange={onToggle}/></article>;
}

function LayerNode({title,subtitle,checked,onToggle,tone,icon}:{title:string;subtitle:string;checked:boolean;onToggle:()=>void;tone:string;icon:React.ReactNode}) {
  return <article className={"sdsc-layer-node "+tone+(checked?" is-on":"")}><span>{icon}</span><div><strong>{title}</strong><small>{subtitle}</small></div><Toggle checked={checked} onChange={onToggle}/></article>;
}

function Architecture({
  state,
  toggleServing,
  toggleAccess,
}:{
  state:typeof defaultServingState;
  toggleServing:(id:ServingToggleId)=>void;
  toggleAccess:(id:AccessToggleId)=>void;
}) {
  return <section className="sdsc-architecture">
    <h3>2. Serving Architecture (Interactive)</h3>
    <p>Toggle layers on/off and see how different consumers access the data.</p>
    <div className="sdsc-arch-grid">
      <section className="sdsc-column curated">
        <header>Curated Data</header>
        <div className="sdsc-curated-core"><Database size={27}/><strong>Curated Tables</strong><small>(S3 / Delta)</small></div>
        {["Orders","Customers","Products","Features"].map(item=><div className="sdsc-data-row" key={item}><Boxes size={14}/>{item}</div>)}
      </section>
      <span className="sdsc-col-arrow">→</span>
      <section className="sdsc-column serving">
        <header>Serving Layer</header>
        <LayerNode tone="orange" icon={<BarChart3 size={18}/>} title="Warehouse" subtitle="(Snowflake)" checked={state.serving.warehouse} onToggle={()=>toggleServing("warehouse")}/>
        <LayerNode tone="orange" icon={<Network size={18}/>} title="Query Engine" subtitle="(Trino)" checked={state.serving.query} onToggle={()=>toggleServing("query")}/>
        <LayerNode tone="orange" icon={<Sparkles size={18}/>} title="Feature Store" subtitle="(Feast)" checked={state.serving.feature} onToggle={()=>toggleServing("feature")}/>
        <LayerNode tone="orange" icon={<Boxes size={18}/>} title="Materialized Views" subtitle="" checked={state.serving.views} onToggle={()=>toggleServing("views")}/>
      </section>
      <span className="sdsc-col-arrow">→</span>
      <section className="sdsc-column access">
        <header>Access Layer</header>
        <LayerNode tone="purple" icon={<Database size={18}/>} title="SQL Endpoint" subtitle="" checked={state.access.sql} onToggle={()=>toggleAccess("sql")}/>
        <LayerNode tone="purple" icon={<Code2 size={18}/>} title="REST API" subtitle="" checked={state.access.rest} onToggle={()=>toggleAccess("rest")}/>
        <LayerNode tone="purple" icon={<Network size={18}/>} title="Feature API" subtitle="" checked={state.access["feature-api"]} onToggle={()=>toggleAccess("feature-api")}/>
        <LayerNode tone="purple" icon={<Share2 size={18}/>} title="Data Share" subtitle="" checked={state.access.share} onToggle={()=>toggleAccess("share")}/>
      </section>
      <span className="sdsc-col-arrow">→</span>
      <section className="sdsc-column consumers">
        <header>Consumers</header>
        <div><BarChart3 size={18}/><strong>BI Dashboard</strong><small>(Tableau / Looker)</small></div>
        <div><Server size={18}/><strong>Product API</strong><small>(Web / Mobile)</small></div>
        <div><Sparkles size={18}/><strong>ML Training</strong><small>(Training Pipelines)</small></div>
        <div><Users size={18}/><strong>External Partner</strong><small>(Partner Apps)</small></div>
      </section>
    </div>
  </section>;
}

function Metric({icon,label,value,detail,tone}:{icon:React.ReactNode;label:string;value:string;detail:string;tone:string}) {
  return <article className={"sdsc-metric "+tone}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{detail}</em></div></article>;
}

export function SystemServingConsumerLab() {
  const companion=useCompanion();
  const [scenarioId,setScenarioId]=useState<ServingScenarioId>("multi-consumer");
  const scenario=useMemo(()=>getServingScenario(scenarioId),[scenarioId]);
  const [state,setState]=useState(()=>structuredClone(defaultServingState));
  const [result,setResult]=useState<ServingResult>(()=>simulateServing(getServingScenario("multi-consumer"),defaultServingState));
  const [running,setRunning]=useState(false);
  const [queryRan,setQueryRan]=useState(true);
  const [queryConsumer,setQueryConsumer]=useState<ConsumerId>("bi");

  const toggleConsumer=(id:ConsumerId)=>setState(current=>({...current,consumers:{...current.consumers,[id]:!current.consumers[id]}}));
  const toggleServing=(id:ServingToggleId)=>setState(current=>({...current,serving:{...current.serving,[id]:!current.serving[id]}}));
  const toggleAccess=(id:AccessToggleId)=>setState(current=>({...current,access:{...current.access,[id]:!current.access[id]}}));

  const chooseScenario=(id:ServingScenarioId)=>{
    const next=getServingScenario(id);
    setScenarioId(id);
    setState(structuredClone(defaultServingState));
    setResult(simulateServing(next,defaultServingState));
    setQueryRan(true);
  };

  const reset=()=>chooseScenario("multi-consumer");

  const run=()=>{
    setRunning(true);
    window.setTimeout(()=>{
      setResult(simulateServing(scenario,state));
      setRunning(false);
      companion?.emit({type:"exercise_correct",lesson:"Serving Layers & Consumer Design",source:"runner"});
    },320);
  };

  const queryText=queryConsumer==="bi"
    ? "SELECT\n  product_category,\n  COUNT(*) AS total_orders,\n  SUM(revenue) AS total_revenue\nFROM curated_orders\nWHERE order_date >= '2024-01-01'\nGROUP BY product_category;"
    : queryConsumer==="api"
      ? "GET /v1/products/{id}\nCACHE redis\nTARGET p99 < 50ms"
      : queryConsumer==="ml"
        ? "SELECT feature_vector, label\nFROM feature_store.training_set\nWHERE snapshot_date = CURRENT_DATE"
        : "CREATE DATA SHARE partner_orders\nFILTER region = 'approved'";

  return <section className="sdsc-lab">
    <header className="sdsc-sim-header">
      <div className="sdsc-sim-heading"><span><Play size={20} fill="currentColor"/></span><div><h2>Interactive Simulation</h2><p>Configure different consumers and see how a serving layer design handles their needs. Compare patterns and observe trade-offs.</p></div></div>
      <div className="sdsc-toolbar"><button type="button" className="sdsc-reset" onClick={reset}><RefreshCcw size={15}/>Reset</button><button type="button" className="sdsc-run" onClick={run} disabled={running}><Play size={15} fill="currentColor"/>{running?"Running…":"Run Simulation"}</button><label className="sdsc-scenario"><span>{scenario.label}</span><select value={scenarioId} onChange={e=>chooseScenario(e.target.value as ServingScenarioId)}>{servingScenarios.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select><ChevronDown size={14}/></label></div>
    </header>

    <div className="sdsc-workspace">
      <section className="sdsc-config">
        <h3>1. Configure Consumers</h3><p>Select consumers and set their query patterns.</p>
        {(Object.keys(consumerMeta) as ConsumerId[]).map(id=><ConsumerCard key={id} id={id} checked={state.consumers[id]} onToggle={()=>toggleConsumer(id)}/>)}
        <h4>Consumer Query Pattern</h4>
        <label className="sdsc-pattern"><span>{consumerMeta[queryConsumer].title} {consumerMeta[queryConsumer].subtitle}</span><select value={queryConsumer} onChange={e=>{setQueryConsumer(e.target.value as ConsumerId);setQueryRan(false);}}>{(Object.keys(consumerMeta) as ConsumerId[]).map(id=><option key={id} value={id}>{consumerMeta[id].title} {consumerMeta[id].subtitle}</option>)}</select><ChevronDown size={13}/></label>
        <div className="sdsc-query-editor"><pre>{queryText}</pre></div>
        <button type="button" className="sdsc-run-query" onClick={()=>setQueryRan(true)}><Play size={14} fill="currentColor"/>Run Query</button>
      </section>

      <div className="sdsc-main">
        <Architecture state={state} toggleServing={toggleServing} toggleAccess={toggleAccess}/>

        <div className="sdsc-bottom">
          <section className="sdsc-results"><header><h3>3. Simulation Results</h3><span><CheckCircle2 size={14}/>Running</span></header><div className="sdsc-metrics-grid">
            <Metric tone="blue" icon={<Zap size={18}/>} label="Query Latency" value={result.queryLatencyMs+" ms"} detail="↓ 45%"/>
            <Metric tone="green" icon={<Gauge size={18}/>} label="Concurrent Users" value={result.concurrentQueriesPerMin.toLocaleString()} detail="queries/min · ↑ 32%"/>
            <Metric tone="pink" icon={<Users size={18}/>} label="Cost / Month" value={result.consumerCount.toLocaleString()} detail="↑ 25%"/>
            <Metric tone="gold" icon={<DollarSign size={18}/>} label="Cost / Month" value={"$"+result.monthlyCost.toLocaleString()} detail="↓ 18%"/>
          </div></section>

          <section className="sdsc-output"><header><h3>4. Live Query Output</h3></header><div className="sdsc-output-console">{queryRan ? queryConsumer==="bi" ? <table><thead><tr><th>product_category</th><th>total_orders</th><th>total_revenue</th></tr></thead><tbody>{result.queryRows.map(row=><tr key={row[0]}>{row.map(cell=><td key={cell}>{cell}</td>)}</tr>)}</tbody></table> : <div className="sdsc-api-output"><code>{queryConsumer==="api"?"200 OK · product payload returned in "+result.queryLatencyMs+" ms":queryConsumer==="ml"?"training set ready · feature snapshot materialized":"share created · governed rows exposed"}</code></div> : <div className="sdsc-api-output"><code>Run Query to execute this access pattern.</code></div>}<footer><CheckCircle2 size={14}/><span>Query completed in {result.queryLatencyMs} ms</span></footer></div></section>

          <section className="sdsc-compare"><header><h3>5. Compare Serving Patterns</h3></header>
            <div className="sdsc-pattern-card selected"><strong><CheckCircle2 size={14}/>Single Warehouse</strong><span>✓ Simple to operate</span><span>✓ Good for BI and ad-hoc</span><span>✓ Higher cost at scale</span></div>
            <div className="sdsc-pattern-card"><strong>Warehouse + Cache</strong><span>✓ Lower latency for APIs</span><span>✓ Handles high concurrency</span><span>✓ More moving parts</span></div>
            <div className="sdsc-pattern-card"><strong>Feature Store for ML</strong><span>✓ Optimized for ML workloads</span><span>✓ Point-in-time features</span><span>✓ Additional operational cost</span></div>
          </section>
        </div>
      </div>
    </div>
  </section>;
}

export function SystemServingConsumerRightRail({
  lessonTitles,currentLesson,completed,onLesson,onNotes,
}:{
  lessonTitles:string[];
  currentLesson:number;
  completed:number[];
  onLesson:(lesson:string)=>void;
  onNotes:()=>void;
}) {
  return <div className="sdsc-right-rail">
    <section className="sdsc-progress-card"><header><strong>Lesson Progress <ChevronDown size={14}/></strong><span>{completed.length} / {lessonTitles.length} done</span></header><Progress value={completed.length/lessonTitles.length*100} className="sdsc-progress"/><div className="sdsc-progress-list">{lessonTitles.map((lesson,index)=>{const done=completed.includes(index),current=index===currentLesson;return <button type="button" key={lesson} className={current?"is-current":""} onClick={()=>onLesson(lesson)}>{done?<CheckCircle2 size={17}/>:current?<Play size={17} fill="currentColor"/>:<Circle size={17}/>}<span>{index+1}. {lesson}</span><small>{done?"Completed":current?"Learning":"Not started"}</small></button>;})}</div></section>
    <section className="sdsc-notes-card"><header><Lightbulb size={18}/><strong>Quick Notes</strong><button type="button" onClick={onNotes}>+ Add Note</button></header><p>Jot down key points, questions, or your own notes…</p><div className="sdsc-notes-visual"><div><Sparkles size={18}/><span>Different access patterns justify different serving representations.</span></div><Image src="/nila-avatar.png" alt="Mithoo learning companion" width={88} height={108}/></div></section>
  </div>;
}
