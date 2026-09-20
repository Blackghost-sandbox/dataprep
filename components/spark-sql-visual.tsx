"use client";
import { ArrowRight } from "lucide-react";
import { SimpleExplanation } from "@/components/simple-explanation";
import { useWalkthrough, WalkthroughControls } from "@/components/walkthrough-controls";
import { motion, useReducedMotion } from "framer-motion";

const sales=[{country:"IN",amount:100},{country:"US",amount:50},{country:"IN",amount:20}];
const descriptions=[
  ["Start with three sales","Each row is one sale. We want the total amount sold by each country."],
  ["Keep positive sales","WHERE amount > 0 keeps all three rows here: 100, 50, and 20 are all positive."],
  ["Group matching countries","GROUP BY country puts the two IN sales together. The US sale forms its own group."],
  ["Add amounts inside each group","SUM(amount) adds 100 + 20 for IN and keeps 50 for US. ORDER BY country displays IN first."],
];

export function SparkSqlWalkthrough() {
  const state=useWalkthrough(4);
  const reduced=useReducedMotion();
  return <section className="sql-visual data-walkthrough" aria-label="Spark SQL data walkthrough">
    <small>Follow the data · Step {state.step+1} of 4</small>
    <h3>How much did each country sell?</h3>
    <h4>{descriptions[state.step][0]}</h4><p aria-live="polite">{descriptions[state.step][1]}</p>
    <motion.div key={state.step} initial={{opacity:reduced?1:0}} animate={{opacity:1}} transition={{duration:reduced?0:.25}} className="walkthrough-scene">
      {state.step<2 ? <div className="sql-stage"><table><caption>Sales input · country and amount</caption><thead><tr><th scope="col">Country</th><th scope="col">Amount</th></tr></thead><tbody>{sales.map((row,i)=><tr key={i}><td>{row.country}</td><td>{row.amount}</td></tr>)}</tbody></table></div> :
      <div className="walkthrough-groups">{["IN","US"].map(country=><div key={country}><h5>{country}</h5>{state.step===2 ? sales.filter(row=>row.country===country).map((row,i)=><span key={i}>Sale: {row.amount}</span>) : <><span>{sales.filter(row=>row.country===country).map(row=>row.amount).join(" + ")} =</span><strong>{sales.filter(row=>row.country===country).reduce((sum,row)=>sum+row.amount,0)}</strong></>}</div>)}</div>}
    </motion.div>
    <div className="walkthrough-api"><code>SELECT country, </code><SimpleExplanation label="SUM"/><code>(amount) AS total FROM sales </code><SimpleExplanation label="WHERE"/><code> amount &gt; 0 </code><SimpleExplanation label="GROUP BY"/><code> country ORDER BY country</code></div>
    <WalkthroughControls state={state}/>
    <small>Illustrative data flow, not a live Spark query. The Examples tab creates the sales view and requests results with show().</small>
    <details className="execution-technical"><summary>Explore the complete query and result</summary><SparkSqlOverview/></details>
  </section>;
}

function SparkSqlOverview() {
  return <section className="sql-visual" aria-labelledby="sql-visual-title">
    <div className="sql-visual-heading"><span className="sql-eyebrow">ONE QUESTION, THREE STEPS</span><h3 id="sql-visual-title">How much did each country sell?</h3><p>Start with three sales. Add the amounts for each country.</p></div>
    <div className="sql-visual-grid">
      <div className="sql-stage">
        <h4><span>1</span> Input · sales</h4>
        <table><caption className="sr-only">Three input sales records</caption><thead><tr><th scope="col">country</th><th scope="col">amount</th></tr></thead><tbody>
          <tr className="sql-india"><td>IN</td><td>100</td></tr>
          <tr><td>US</td><td>50</td></tr>
          <tr className="sql-india"><td>IN</td><td>20</td></tr>
        </tbody></table><p className="sql-stage-note">The two IN rows belong to the same group.</p>
      </div>
      <ArrowRight className="sql-connector" size={18} aria-hidden="true"/>
      <div className="sql-stage sql-query-stage">
        <h4><span>2</span> Query</h4>
        <div className="sql-query" role="group" aria-label="SQL query">
          <div><span className="sql-keyword">SELECT</span> country,</div>
          <div>&nbsp;&nbsp;<SimpleExplanation label="SUM"/>(amount) AS total</div>
          <div><span className="sql-keyword">FROM</span> sales</div>
          <div><SimpleExplanation label="GROUP BY"/> country</div>
          <div><span className="sql-keyword">ORDER BY</span> country;</div>
        </div><p className="sql-stage-note">Group matching countries, then add their amounts.</p>
      </div>
      <ArrowRight className="sql-connector" size={18} aria-hidden="true"/>
      <div className="sql-stage sql-result-stage">
        <h4><span>3</span> Result</h4>
        <table><caption className="sr-only">Expected totals by country</caption><thead><tr><th scope="col">country</th><th scope="col">total</th></tr></thead><tbody>
          <tr className="sql-india"><td>IN</td><td>120</td></tr>
          <tr><td>US</td><td>50</td></tr>
        </tbody></table><p className="sql-stage-note"><strong>IN: 100 + 20 = 120</strong><br/>One result row per country.</p>
      </div>
    </div>
    <p className="sql-visual-footnote">Illustrative result, not a live query. The Examples tab shows how to create the sales view in Spark.</p>
  </section>;
}
