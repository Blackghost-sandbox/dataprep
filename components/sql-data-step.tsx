"use client";
import { sqlSales,positiveSales,sqlTotals,sqlSteps } from "@/lib/spark-sql-example";
import { motion,useReducedMotion } from "framer-motion";
export function SqlDataStep({step,api}:{step:number;api:"sql"|"df"}){
  const reduced=useReducedMotion();
  return <section className="data-walkthrough"><small>Shared data · Step {step+1} / 4</small><h4>{sqlSteps[step].title}</h4><p>{sqlSteps[step].explanation}</p><pre className="sql-step-code"><code>{sqlSteps[step][api]}</code></pre><motion.div key={step} initial={{opacity:reduced?1:0}} animate={{opacity:1}} transition={{duration:reduced?0:.3}} className="walkthrough-scene">
  {step<2?<div className="sql-stage"><table><caption>{step===0?"Five input records":"Three matching records"}</caption><thead><tr><th scope="col">Country</th><th scope="col">Amount</th></tr></thead><tbody>{(step===0?sqlSales:positiveSales).map((row,i)=><tr key={i}><td>{row.country}</td><td>{row.amount}</td></tr>)}</tbody></table></div>:<div className="walkthrough-groups">{sqlTotals.map(row=><div key={row.country}><h5>{row.country}</h5>{step===2?positiveSales.filter(sale=>sale.country===row.country).map((sale,i)=><span key={i}>{sale.amount}</span>):<><span>Total positive sales</span><strong>{row.total}</strong></>}</div>)}</div>}
  </motion.div><small>Illustrative logical data flow, not a literal physical execution schedule. show() requests execution.</small></section>;
}
