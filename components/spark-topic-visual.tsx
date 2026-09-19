import type { ReactNode } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { SimpleExplanation } from "@/components/simple-explanation";

function Box({title, children, tone = ""}: {title: ReactNode; children: ReactNode; tone?: string}) {
  return <div className={"topic-box " + tone}><h4>{title}</h4>{children}</div>;
}
function Chips({values}: {values: string[]}) {
  return <div className="topic-chips">{values.map((value,i)=><span key={i}>{value}</span>)}</div>;
}
function Row({children}: {children: ReactNode}) {return <div className="topic-row">{children}</div>;}
function Arrow() {return <ArrowRight className="topic-arrow" size={18} aria-hidden="true"/>;}
function Frame({title, subtitle, children, note}: {title: string; subtitle: string; children: ReactNode; note: string}) {
  return <section className="topic-visual" aria-label={title}><span className="sql-eyebrow">SEE THE IDEA</span><h3>{title}</h3><p className="topic-subtitle">{subtitle}</p>{children}<p className="topic-note">{note}</p></section>;
}

export function SparkTopicVisual({id}: {id: string}) {
  if(id === "introduction") return <Frame title="One request, shared work" subtitle="Count six records using two pieces of data." note="Simplified count example. Executors run tasks; the driver coordinates and receives the final count. Partitions are not permanently tied to executors.">
    <div className="topic-driver"><SimpleExplanation label="Driver"/><span>“How many rows?”</span></div>
    <ArrowDown className="topic-down" size={18} aria-hidden="true"/>
    <Row><Box title="Executor A"><Chips values={["1","2","3"]}/><p>Task counts 3 rows</p></Box><Box title="Executor B"><Chips values={["4","5","6"]}/><p>Task counts 3 rows</p></Box></Row>
    <ArrowDown className="topic-down" size={18} aria-hidden="true"/>
    <div className="topic-result">Counts combined → <strong>6 rows</strong></div>
    <div className="topic-help"><SimpleExplanation label="Executors"/><SimpleExplanation label="Tasks"/><SimpleExplanation label="partition"/></div>
  </Frame>;
  if(id === "transformations") return <Frame title="Same input, a new result" subtitle="Keep prices of at least 20, then double them." note="These are planned transformations. An action such as show() requests the result; the original input stays unchanged.">
    <Row><Box title="Original prices"><Chips values={["10","30","20"]}/><p>Three input rows</p></Box><Arrow/><Box title={<SimpleExplanation label="filter"/>}><code>price &gt;= 20</code><Chips values={["30","20"]}/></Box><Arrow/><Box title={<SimpleExplanation label="select"/>} tone="topic-green"><code>price * 2</code><Chips values={["60","40"]}/></Box></Row>
    <div className="topic-result"><SimpleExplanation label="Action"/> <span>→ show the two calculated values</span></div>
  </Frame>;
  if(id === "partitioning") return <Frame title="Redistribute, don’t duplicate" subtitle="Six records move from two partitions into three." note="Illustrative distribution only: repartition does not promise these exact rows or order in each partition. The record count remains six.">
    <Row><Box title="Before · 2 partitions"><div className="topic-partition"><span>P1</span><Chips values={["1","2","3"]}/></div><div className="topic-partition"><span>P2</span><Chips values={["4","5","6"]}/></div></Box><div className="topic-operation"><SimpleExplanation label="repartition"/><code>(3)</code><Arrow/><SimpleExplanation label="shuffle"/></div><Box title="After · 3 partitions" tone="topic-green"><div className="topic-partition"><span>P1</span><Chips values={["1","4"]}/></div><div className="topic-partition"><span>P2</span><Chips values={["2","5"]}/></div><div className="topic-partition"><span>P3</span><Chips values={["3","6"]}/></div></Box></Row>
  </Frame>;
  if(id === "performance") return <Frame title="Compute once, reuse when useful" subtitle="Compare two actions on the same filtered data." note="Caching is not automatically faster. The first action populates the cache; reuse helps only when the saved work justifies its storage and setup costs.">
    <div className="topic-cache"><span className="topic-lane-label">Without cache</span><div><p><span>Read + filter</span> → count</p><p><span>Read + filter again</span> → sum</p></div></div>
    <div className="topic-cache topic-green"><span className="topic-lane-label">With cache</span><div><p><span>Read + filter → store</span> → count</p><p><span>Reuse stored rows</span> → sum</p></div></div>
    <div className="topic-help"><SimpleExplanation label="cache"/><SimpleExplanation label="unpersist"/><span>Release stored rows when finished.</span></div>
  </Frame>;
  if(id === "hands-on-task") return <Frame title="From messy orders to checked totals" subtitle="Follow the sales exercise’s explicit quality rules." note="Expected results for this toy exercise, not a live run. Excluding refunds measures positive sales, not net revenue.">
    <Row><Box title="6 input records"><Chips values={["IN 100","IN 100","US 50","IN 20","Missing country","US −5"]}/></Box><Arrow/><Box title="Clean before summing"><p>Exclude missing country and non-positive amounts.</p><p>Remove one identical duplicate.</p><strong>3 valid, unique records</strong></Box><Arrow/><Box title="2 output groups" tone="topic-green"><p><strong>IN → 120</strong></p><p><strong>US → 50</strong></p></Box></Row>
    <div className="topic-help"><SimpleExplanation label="Validate"/><SimpleExplanation label="Deduplicate"/><SimpleExplanation label="Aggregate"/></div>
  </Frame>;
  if(id === "interview-questions") return <Frame title="A slow job: what would you inspect?" subtitle="Most tasks finish quickly, but one is still running." note="Illustrative task durations, not measured performance. Uneven data is one possibility; compare task sizes and runtime evidence before choosing a fix.">
    <div className="topic-bars" role="img" aria-label="Task A: 2 seconds. Task B: 3 seconds. Task C: 19 seconds.">
      {[["Task A","2 s",11],["Task B","3 s",16],["Task C","19 s",100]].map(([name,time,width])=><div key={name}><span>{name}</span><div><span style={{width:width+"%"}}/></div><strong>{time}</strong></div>)}
    </div>
    <div className="topic-result">Explain: observation → possible cause → evidence to check → trade-off</div>
  </Frame>;
  if(id === "quiz") return <Frame title="Trace the work before you answer" subtitle="Use this small pipeline to reason about the concepts in the quiz." note="This diagram is a thinking prompt, not an answer key. Submit your choices below to see explanations.">
    <Row><Box title="Input"><Chips values={["1","2","3","4"]}/></Box><Arrow/><Box title="Keep values > 2"><code>filter(...)</code><p>What does this describe?</p></Box><Arrow/><Box title="Request row count"><code>count()</code><p>When does work run?</p></Box></Row>
  </Frame>;
  if(id === "summary") return <Frame title="Your Spark decision map" subtitle="Correctness first. Performance decisions follow evidence." note="Use this map to explain the complete sales pipeline out loud, including why each step is needed.">
    <div className="topic-recap">
      <Box title="1 · Define the answer"><p>Schema, valid rows, duplicate rules, expected totals.</p></Box>
      <Box title="2 · Describe the work"><p>Use table expressions; understand which operations move data.</p></Box>
      <Box title="3 · Request and check"><p>Run an action. Compare the output with the expected result.</p></Box>
      <Box title="4 · Inspect and improve" tone="topic-green"><p>Measure tasks and plans. Justify partitioning, reuse, and join choices.</p></Box>
    </div>
  </Frame>;
  return null;
}
