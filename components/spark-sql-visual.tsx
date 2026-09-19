import { ArrowRight } from "lucide-react";
import { SimpleExplanation } from "@/components/simple-explanation";

export function SparkSqlVisual() {
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
