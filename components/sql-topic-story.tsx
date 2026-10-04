"use client";
import {useEffect,useRef,useState} from "react";
import {ArrowRight,BookOpen,CheckCircle2,Database,Table2,Filter,ArrowDownWideNarrow,Layers,Link2,Calculator,Workflow} from "lucide-react";
import {sqlLessons,sqlVisuals,type SqlTable} from "@/lib/sql-lessons";
import {sqlConceptGuides} from "@/lib/sql-concepts";

const topicIcons={select:Table2,where:Filter,"order-by":ArrowDownWideNarrow,distinct:Layers,limit:Filter,aggregates:Calculator,"group-by":Layers,having:Filter,joins:Link2,"subqueries-ctes":Workflow,"window-functions":Calculator,"null-case":Workflow,"query-execution":Workflow};
const topicDefinitions:Record<string,[string,string][]>={
 select:[["Projection","Choosing which columns or expressions appear in a result."],["Alias","An output name assigned with AS; it does not rename the stored column."]],
 where:[["Condition","A test that evaluates to true, false, or unknown."],["AND / OR","AND requires both conditions to be true; OR requires at least one."]],
 "order-by":[["ASC / DESC","Ascending sorts smaller values first; descending sorts larger values first."],["Tie-breaker","Another sort key that determines the order of equal values."]],
 distinct:[["Distinct combination","A unique combination of all selected column values."]],
 limit:[["Top N","The first N rows of a defined ordering, with a tie-breaker when needed."]],
 aggregates:[["COUNT / SUM / AVG","Count records, add values, or calculate their average."],["MIN / MAX","Find the smallest or largest non-null value."]],
 "group-by":[["Grouping key","The column or columns that determine which rows belong together."],["Grain","What one result row represents, such as one customer total."]],
 having:[["Aggregate condition","A test on a group, such as SUM(amount) > 500."]],
 joins:[["Matching condition","The ON expression that identifies related pairs of rows."],["INNER / LEFT JOIN","INNER keeps matching pairs. LEFT also keeps unmatched left rows."]],
 "subqueries-ctes":[["Subquery","A query nested inside another query."],["CTE","A query-scoped named expression defined with WITH."]],
 "window-functions":[["OVER","Defines the window used for a calculation."],["PARTITION BY","Separates rows into independent sets without collapsing them."]],
 "null-case":[["NULL","A missing or unknown value, not zero or empty text."],["CASE WHEN","Chooses a result value based on conditions."]],
 "query-execution":[["Logical order","FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT."],["Physical plan","The execution strategy chosen by the database optimizer."]],
};
function StoryTable({table,result=false}:{table:SqlTable;result?:boolean}){
 return <div className={`sql-topic-table ${result?'is-result':''}`}><div className="sql-topic-table-label"><Table2 size={17}/><strong>{table.title}</strong><span>{table.rows.length} rows</span></div><table aria-label={`${table.title} story ${result?'result':'input'}`}><thead><tr>{table.columns.map(column=><th key={column}>{column}</th>)}</tr></thead><tbody>{table.rows.map((row,index)=><tr key={index} style={{'--card-index':index} as React.CSSProperties}>{row.map((value,column)=><td key={column}>{value===null?<em>NULL</em>:value}</td>)}</tr>)}</tbody></table></div>;
}
export function SqlTopicStory({lessonId,onStart}:{lessonId:string;onStart:()=>void}){
 const lesson=sqlLessons.find(item=>item.id===lessonId)!;
 const guide=sqlConceptGuides[lessonId];
 const visual=sqlVisuals[lessonId];
 const [scene,setScene]=useState(0);
 const [running,setRunning]=useState(false);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 const Icon=topicIcons[lessonId as keyof typeof topicIcons]??Database;
 const run=()=>{setRunning(true);timer.current=setTimeout(()=>{setScene(3);setRunning(false);},1100);};
 const definition=guide.definition??lesson.description;
 const question=lessonId==='query-execution'?'Does logical clause order determine the physical execution plan?':lesson.interview[0].question;
 const interview=lessonId==='query-execution'?guide.remember:lesson.interview[0].answer;
 return <section className={`sql-story sql-topic-story topic-${lessonId}`} aria-label={`${lesson.title} animated introduction`}>
 <header className="sql-story-header"><button className="sql-story-mobile-exit" onClick={onStart}>Back to lesson</button><span>YOUR SQL STORY · {lesson.title}</span><div className="sql-story-steps" aria-label="Story progress">{['Understand','Transform','Query','Discover'].map((label,index)=><span key={label} aria-current={scene===index?'step':undefined} className={scene>=index?'is-reached':''}>{index+1}<small>{label}</small></span>)}</div></header>
 <div className="sql-story-title"><h2>{[guide.question,guide.model[1],`Put ${lesson.title} into SQL`,'See what changed.'][scene]}</h2><p>{guide.takeaway}</p></div>
 <div className="sql-story-learning-layout"><div key={scene} className={`sql-story-stage scene-${scene} ${running?'is-running':''}`} aria-live="polite">
 {scene===0&&<div className="sql-topic-inputs"><div className="sql-topic-source-heading"><Database size={36}/><span>The original records</span></div>{visual.inputs.map((table,index)=><StoryTable key={`${table.title}-${index}`} table={table}/>)}</div>}
 {scene===1&&<div className="sql-topic-transform"><div className="sql-topic-scenery" aria-hidden="true"><i/><i/><i/><i/><i/><span>THE DATA WORKSHOP</span></div><div className="sql-topic-lane"><span className="sql-topic-node"><Database size={42}/></span><strong>{guide.model[0]}</strong><small>{visual.inputs.reduce((total,table)=>total+table.rows.length,0)} sample rows</small></div><div className="sql-topic-route"><i/><i/><i/><span className="sql-topic-travel-card" aria-hidden="true"><Table2 size={15}/></span></div><div className="sql-topic-lane sql-topic-engine"><span className="sql-topic-node"><div className="sql-topic-engine-lights" aria-hidden="true"><i/><i/><i/></div><Icon size={58}/><span className="sql-topic-engine-badge">{lesson.title}</span></span><strong>{guide.model[1]}</strong><small>{lesson.title}</small><div className="sql-topic-engine-orbit"/></div><div className="sql-topic-route"><i/><i/><i/><span className="sql-topic-travel-card" aria-hidden="true"><Table2 size={15}/></span></div><div className="sql-topic-lane"><span className="sql-topic-node"><Table2 size={42}/></span><strong>{guide.model[2]}</strong><small>{visual.result.rows.length} result {visual.result.rows.length===1?'row':'rows'}</small></div><p className="sql-topic-transform-note">{guide.takeaway}</p></div>}
 {scene===2&&<div className="sql-topic-query"><div className="sql-story-code"><div className="sql-story-terminal-chrome" aria-hidden="true"><i/><i/><i/><span>query.sql</span></div><span className="sql-story-code-label">FROM THE IDEA TO A WORKING QUERY</span><code>{lesson.example.code}</code></div><div className="sql-topic-syntax-parts">{guide.parts.map(([term,meaning])=><div key={term}><code>{term}</code><span>{meaning}</span></div>)}</div>{running&&<div className="sql-topic-running"><span/><span/><span/> Processing the sample records…</div>}</div>}
 {scene===3&&<div className="sql-topic-result"><StoryTable table={visual.result} result/><div className="sql-topic-result-sparkles" aria-hidden="true">{Array.from({length:8},(_,index)=><i key={index} style={{'--spark':index} as React.CSSProperties}/>)}</div><div className="sql-topic-result-stamp"><CheckCircle2 size={24}/><span>{guide.takeaway}</span></div><small>The example reads data. The source records stay unchanged.</small></div>}
 </div><aside className="sql-definition-panel sql-definition-overview" aria-label={`${lesson.title} definitions and interview practice`}>
 <div className="sql-definition-heading"><BookOpen size={21}/><div><span>UNDERSTAND IT. SAY IT.</span><h3>Read it. Make it yours.</h3></div></div>
 <section className="sql-definition-core"><span>THE BASICS</span><dl><div><dt>{lesson.title}</dt><dd>{definition}</dd></div>{(scene===0||scene===1)&&topicDefinitions[lessonId]?.map(([term,meaning])=><div key={term}><dt>{term}</dt><dd>{meaning}</dd></div>)}</dl></section>
 <section className="sql-definition-plain"><span>IN PLAIN WORDS</span><p>{guide.takeaway}</p></section>
 <section className="sql-definition-interview"><span>AN INTERVIEW ANSWER</span><p className="sql-topic-interview-question">{question}</p><p>{interview}</p></section>
 <section className="sql-definition-recall"><span>TRY SAYING IT ALOUD</span><p>{scene===3?question:`Explain ${lesson.title} using the sample records.`}</p></section>
 </aside></div>
 <footer className="sql-story-footer"><button className="sql-story-back" disabled={scene===0||running} onClick={()=>setScene(scene-1)}>Back</button><span>{scene===3?guide.remember:'Read, connect, and explain.'}</span><button className="sql-story-next" disabled={running} onClick={()=>scene===2?run():scene===3?onStart():setScene(scene+1)}>{scene===0?'See how it works':scene===1?'See the SQL':scene===2?(running?'Running…':'Run the example'):'Explore it yourself'}<ArrowRight size={18}/></button></footer>
 </section>;
}
