"use client";

import { Fragment, createContext, useContext, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight, Check } from "lucide-react";
import { DataWalkthrough } from "@/components/data-walkthrough";

const rows = [["Alice",31,"Chennai"],["Bob",22,"Chennai"],["Carol",29,"Mumbai"],["Dan",19,"Mumbai"],["Eva",35,"Chennai"]];
const filtered = rows.filter(row => Number(row[1]) > 25);
const totals = Array.from(filtered.reduce((map,row) => map.set(String(row[2]),(map.get(String(row[2])) ?? 0)+1),new Map<string,number>()));
const FlowProgress = createContext({tick:0, playing:false});

function DataTable({ title, columns, data }: { title: string; columns: string[]; data: (string|number)[][] }) {
  return <div className="detail-table"><h5>{title}</h5><table><thead><tr>{columns.map(column=><th key={column} scope="col">{column}</th>)}</tr></thead><tbody>{data.map((row,i)=><tr key={i}>{row.map((value,j)=><td key={j}>{value}</td>)}</tr>)}</tbody></table></div>;
}

function Flow({ items }: { items: string[] }) {
  const {tick,playing} = useContext(FlowProgress);
  const active = Math.min(tick,items.length-1);
  return <div className="detail-flow">{items.map((item,i)=><Fragment key={item}><code className={i===active ? "flow-current" : i<active ? "flow-complete" : ""}>{item}</code>{i<items.length-1&&<span className={`detail-flow-link ${i===active && playing ? "flow-moving" : ""}`}><ArrowDown size={14} aria-hidden="true"/><i/></span>}</Fragment>)}</div>;
}

function DataFlow({ kind }: { kind: "rdd"|"dataframe" }) {
  const {tick,playing} = useContext(FlowProgress);
  return <div className="detail-data"><h4>Data flowing {kind === "rdd" ? "through transformations" : "with the optimized plan"}</h4><div className={`detail-data-grid data-phase-${Math.min(tick,2)} ${playing ? "data-playing" : ""}`}>
    {kind === "rdd" ? <DataTable title="After filter()" columns={["Name","Age","City"]} data={filtered}/> : <DataTable title="Input (selected columns)" columns={["Age","City"]} data={rows.map(row=>row.slice(1))}/>}
    <ArrowRight size={17} aria-hidden="true"/>
    {kind === "rdd" ? <DataTable title="After map()" columns={["(City, 1)"]} data={filtered.map(row=>[`(${row[2]}, 1)`])}/> : <DataTable title="After filter(age > 25)" columns={["Age","City"]} data={filtered.map(row=>row.slice(1))}/>}
    <ArrowRight size={17} aria-hidden="true"/><DataTable title={kind === "rdd" ? "After reduceByKey()" : "After groupBy & count"} columns={["City","Count"]} data={totals}/>
  </div><small>Illustrative results when an action requests execution; transformations alone are lazy.</small></div>;
}

function Catalyst() {
  return <><div className="detail-plans"><div><h5>Before optimization</h5><Flow items={["COUNT","GROUP BY city","FILTER age > 25","Scan sales.csv (all columns)"]}/></div><div className="detail-plan-arrow">Catalyst<ArrowRight size={24}/></div><div><h5>After optimization</h5><Flow items={["COUNT","GROUP BY city","FILTER age > 25","Scan sales.csv (age, city)"]}/></div></div><div className="detail-optimizations"><span><Check size={13}/> Column pruning</span><span><Check size={13}/> Required columns: <b>5 → 2</b></span></div><p className="detail-caveat">Example schema: name, age, city, amount, date. CSV pruning reduces columns parsed, not necessarily bytes read. Filter pushdown depends on the reader and settings; it is not claimed here. Plan shown root-to-source.</p></>;
}

const flows: Record<string,string[][]> = {
  rdd: [
    ['textFile("sales.csv")','Parse CSV → (name, age, city)','filter → map → reduceByKey','collect() requests results'],
    ['filter(age > 25)','map(city → (city, 1))','reduceByKey(add counts)'],
    ['textFile("sales.csv")','parse CSV → typed records','filter(lambda x: x[1] > 25)','map(lambda x: (x[2], 1))','reduceByKey(lambda a, b: a + b)'],
    ['Dependency graph','Split work at shuffle boundary','Prepare tasks for each partition'],
    ['Stage 1: filter + map + local combine','Shuffle: bring matching cities together','Stage 2: merge city counts','collect(): return small result to driver'],
  ],
  dataframe: [
    ['Read sales.csv with explicit schema','filter(col("age") > 25)','groupBy("city").count()','show() requests results'],
    ['Aggregate: city, count(*)','Filter: age > 25','Relation: sales.csv'],
    [],
    ['Final HashAggregate (city, count)','Exchange: hash partition by city','Partial HashAggregate','Filter: age > 25','CSV scan: age, city'],
    ['Physical operators','Create tasks for input partitions','Schedule work on executors'],
    ['Stage 1: scan + filter + partial counts','Shuffle city keys between executors','Stage 2: combine counts per city','Return result rows'],
  ],
};

export function DetailedExecution({ kind, stages, selected, onSelect, playing }: { kind: "rdd"|"dataframe"; stages: {title:string;explanation:string}[]; selected:number; onSelect:(index:number)=>void; playing:boolean }) {
  const reduced = useReducedMotion();
  const [tick,setTick] = useState(0);
  useEffect(()=>setTick(0),[selected]);
  useEffect(()=>{
    if(!playing || reduced) return;
    const timer=window.setInterval(()=>setTick(value=>Math.min(value+1,5)),800);
    return ()=>window.clearInterval(timer);
  },[playing,reduced,selected]);
  return <><DataWalkthrough kind={kind}/><details className="execution-technical"><summary>Explore how Spark runs this</summary><FlowProgress.Provider value={{tick,playing:playing && !reduced}}><div className="detailed-execution"><nav aria-label={`${kind === "rdd" ? "RDD" : "DataFrame"} execution stages`}>{stages.map((stage,i)=><button type="button" key={stage.title} aria-current={i===selected ? "step" : undefined} onClick={()=>onSelect(i)}><span>{i+1}</span>{stage.title}</button>)}</nav><motion.div className="detail-canvas" key={selected} initial={{opacity:reduced?1:0,y:reduced?0:5}} animate={{opacity:1,y:0}} transition={{duration:reduced?0:.25}}><h4>{selected+1}. {kind === "rdd" && selected===2 ? "Transformation Lineage (DAG)" : stages[selected].title}</h4><p>{stages[selected].explanation}</p>
    {kind === "dataframe" && selected===2 ? <Catalyst/> : <Flow items={flows[kind][selected]}/>}
    {kind === "rdd" && selected===2 && <p className="detail-caveat">Each transformation is recorded in the lineage, not executed immediately. CSV parsing is shown explicitly so age comparisons use numbers.</p>}
    {selected>=3 && <div className="detail-workers"><span>Executor A<br/><b>Partition 0 → Task</b></span><span>Executor B<br/><b>Partition 1 → Task</b></span></div>}
    <DataFlow kind={kind}/>
    <div className="detail-flow-controls"><button type="button" onClick={()=>setTick(value=>value>=5?0:value+1)}>{tick>=5 ? "Replay flow" : "Next flow step"} →</button><span aria-live="polite">Flow step {tick+1} / 6</span></div>
  </motion.div></div></FlowProgress.Provider></details></>;
}
