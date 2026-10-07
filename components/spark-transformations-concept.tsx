"use client";
import {SyntaxText} from "@/components/syntax-editor";

import {useEffect,useState} from "react";
import {AnimatePresence,motion,useReducedMotion} from "framer-motion";
import {ArrowDown,ArrowRight,BarChart3,BookOpen,Check,Copy,Database,Filter,Lightbulb,Pause,Play,Plus,RotateCcw,Table2,Timer} from "lucide-react";
import {toast} from "sonner";
import {GlossaryText} from "@/components/glossary";
import {stageExplanation,transformationCode,transformationOptions,transformationPreview,transformationRows,transformationStages,type PreviewRow} from "@/lib/transformation-simulation";

function PreviewTable({rows,stage,source=false}:{rows:ReadonlyArray<PreviewRow>;stage:number;source?:boolean}){
  const reduce=useReducedMotion();
  const columns:(keyof PreviewRow)[]=source||stage<2?["id","name","age","city","salary"]:stage>=3?["name","age","city","age_group"]:["name","age","city"];
  return <div className="tx-table-scroll"><table aria-label={source?"Original DataFrame":"Transformation preview"}><thead><tr>{columns.map(column=><th key={column} className={source&&stage>=2&&(column==="id"||column==="salary")?"tx-removed-column":""}>{column}</th>)}</tr></thead><tbody>
    <AnimatePresence initial={false}>{rows.map(row=><motion.tr key={row.id??row.name} initial={reduce?false:{opacity:0,y:5}} animate={{opacity:source&&stage>=1&&row.age<=25?.28:1,y:0}} exit={{opacity:0,scale:reduce?1:.96}} transition={{duration:reduce?0:.22}} className={source&&stage>=1&&row.age<=25?"tx-rejected-row":""}>
      <AnimatePresence initial={false}>{columns.map(column=><motion.td key={column} initial={reduce?false:{opacity:0}} animate={{opacity:1,backgroundColor:column==="age_group"&&stage===3?"#ede8ff":"rgba(255,255,255,0)"}} exit={{opacity:0}} transition={{duration:reduce?0:.25}} className={source&&stage>=2&&(column==="id"||column==="salary")?"tx-removed-column":""}>{column==="salary"?String((row.salary??0)/1000)+"k":row[column]}</motion.td>)}</AnimatePresence>
    </motion.tr>)}</AnimatePresence>
  </tbody></table></div>;
}

export function SparkTransformationsConcept(){
  const [stage,setStage]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [selected,setSelected]=useState<keyof typeof transformationOptions>("filter");
  const reduce=useReducedMotion();
  useEffect(()=>{
    if(!playing)return;
    const timer=setTimeout(()=>{if(stage===4)setPlaying(false);else setStage(s=>s+1);},1200);
    return ()=>clearTimeout(timer);
  },[playing,stage]);
  const rows=transformationPreview(stage);
  const operations=[{title:"Filter",code:'df.filter(col("age") > 25)',Icon:Filter},{title:"Select",code:'.select("name", "age", "city")',Icon:Table2},{title:"Add Column",code:'.withColumn("age_group", …)',Icon:Plus}];
  const plan=["Scan df","Filter (age > 25)","Project name, age, city","Add age_group"];
  function go(next:number){setPlaying(false);setStage(next);}
  return <div className="tx-learning">
    <section className="tx-intro"><div><h2><BookOpen size={25}/>Understand Transformations</h2><p><GlossaryText>Transformations create a new DataFrame from existing data. They are lazy and build a logical plan.</GlossaryText></p></div><aside><Lightbulb size={23}/><div><strong>Key takeaway</strong><p>Define what to do now. Execution begins when an action is triggered.</p></div></aside></section>
    <section className="tx-workspace" aria-label="Visual transformation notebook">
      <header className="tx-workspace-header"><h3><BarChart3 size={21}/>Visual Notebook <span>— See Transformations in Action</span></h3><div className="tx-controls">
        <button className="tx-primary" disabled={stage===4} onClick={()=>go(Math.min(stage+1,4))}><Play size={13}/>{stage===0?"Run step by step":"Next step"}</button>
        <button onClick={()=>{if(playing){setPlaying(false);return;}if(stage===4)setStage(0);setPlaying(true);}}>{playing?<Pause size={13}/>:<Play size={13}/>} {playing?"Pause":"Run all"}</button>
        <button onClick={()=>go(0)}><RotateCcw size={13}/>Reset</button>
      </div></header>
      <div className="tx-columns">
        <section className="tx-stage"><header><b>1</b><div><h4>Original DataFrame</h4><small>df · 7 rows · unchanged</small></div></header><PreviewTable source rows={transformationRows} stage={stage}/><p className="tx-table-caption">{stage>=1?"Faded rows fail age > 25. Source data stays intact.":"Fixed sample · ages and salaries shown as supplied."}</p></section>
        <ArrowRight className="tx-connector" size={22}/>
        <section className="tx-stage tx-operations"><header><b>2</b><h4>Apply Transformations <small>(Lazy)</small></h4></header>
          {operations.map(({title,code,Icon},i)=><div key={title}><button className={"tx-operation tx-operation-"+i+(stage===i+1?" tx-active":"")} aria-current={stage===i+1?"step":undefined} onClick={()=>go(i+1)}><Icon size={28}/><span><strong>{title}</strong><code><SyntaxText code={code}/></code></span>{stage>i+1&&<Check size={14} className="tx-operation-done"/>}</button>{i<2&&<ArrowDown className="tx-down" size={13}/>}</div>)}
        </section>
        <ArrowRight className="tx-connector" size={22}/>
        <section className="tx-stage"><header><b>3</b><div><h4>{stage===4?"Result":"Preview"} <small>(Still Lazy)</small></h4><small>{stage>=3?"transformed_df":"Intermediate preview"} · {rows.length} rows</small></div></header><PreviewTable rows={rows} stage={stage}/><p className="tx-table-caption">Educational preview only · no Spark execution</p></section>
      </div>
      <nav className="tx-stepper" aria-label="Transformation steps">{transformationStages.map((label,i)=><button key={label} onClick={()=>go(i)} aria-current={stage===i?"step":undefined} className={stage===i?"tx-selected":stage>i?"tx-past":""}><b>{stage>i?<Check size={12}/>:i+1}</b><span>{label}</span></button>)}</nav>
      <p className="tx-status" role="status" aria-live={playing?"off":"polite"}>{stageExplanation[stage]}</p>
      <div className="tx-bottom">
        <section className="tx-code"><header><strong>PySpark Code <small>Python</small></strong><button aria-label="Copy transformation code" onClick={async()=>{try{await navigator.clipboard.writeText(transformationCode.join("\n"));toast.success("PySpark copied");}catch{toast.error("Copy unavailable. Select the code to copy it.");}}}><Copy size={14}/></button></header><pre>{transformationCode.map((line,i)=><code key={i} className={(stage===1&&i===3||stage===2&&i===4||stage===3&&i>=5&&i<=8)?"tx-code-active":""}><span className="tx-line-number">{i+1}</span>{line.split(/(".*?"|\b(?:from|import|when|col)\b|\b\d+\b)/g).map((part,j)=><span key={j} className={part.startsWith('"')?"tx-syntax-string":/^(from|import|when|col)$/.test(part)?"tx-syntax-keyword":/^\d+$/.test(part)?"tx-syntax-number":undefined}>{part}</span>)}</code>)}</pre></section>
        <section className="tx-plan"><h4>Logical Plan <small>(Simplified)</small></h4>{plan.map((name,i)=><div key={name}><motion.div initial={false} animate={{opacity:i<=stage?1:.38}} transition={{duration:reduce?0:.2}} className={"tx-plan-node"+(Math.min(stage,3)===i?" tx-plan-active":"")}>{i===0?<Database size={17}/>:i===1?<Filter size={17}/>:i===2?<Table2 size={17}/>:<Plus size={20}/>}<span>{name}</span>{i>stage&&<small>next</small>}</motion.div>{i<3&&<ArrowDown size={12}/>}</div>)}<p>{stage===4?"✓ Logical plan ready · not executed":"Building a plan, not running tasks"}</p></section>
        <div className="tx-extras"><aside className="tx-lazy"><Timer size={22}/><div><h4>Execution does not run yet</h4><p>This UI previews row changes. Spark waits for an action such as <code>show()</code>, <code>count()</code>, <code>collect()</code>, or a write such as <code>write.save()</code>.</p></div></aside>
          <section className="tx-explorer"><h4><Timer size={16}/>Try different transformations</h4><div className="tx-options">{(Object.keys(transformationOptions) as Array<keyof typeof transformationOptions>).map(name=><button key={name} aria-pressed={selected===name} onClick={()=>setSelected(name)}>{name}</button>)}</div><div className="tx-option-detail" aria-live="polite"><p>{transformationOptions[selected].description}</p><code>{transformationOptions[selected].example}</code></div></section>
        </div>
      </div>
    </section>
  </div>;
}
