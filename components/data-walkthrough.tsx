"use client";

import { useWalkthrough, WalkthroughControls } from "@/components/walkthrough-controls";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const people = [
  {name:"Alice",age:31,city:"Chennai"}, {name:"Bob",age:22,city:"Chennai"},
  {name:"Carol",age:29,city:"Mumbai"}, {name:"Dan",age:19,city:"Mumbai"},
  {name:"Eva",age:35,city:"Chennai"},
];
const steps = [
  ["Start with five people", "We want to count people older than 25 in each city."],
  ["Keep people older than 25", "Bob (22) and Dan (19) do not qualify. Alice, Carol, and Eva remain."],
  ["Put matching cities together", "Alice and Eva belong to Chennai. Carol belongs to Mumbai."],
  ["Count the people in each city", "Chennai has 2 people older than 25. Mumbai has 1. Both APIs produce this same answer."],
];

export function DataWalkthrough({kind}:{kind:"rdd"|"dataframe"}) {
  const state=useWalkthrough(4);
  const {step}=state;
  const reduced=useReducedMotion();
  return <section className="data-walkthrough" aria-label={kind+" data walkthrough"}>
    <small>Follow the data · Step {step+1} of 4</small>
    <h4>{steps[step][0]}</h4><p aria-live="polite">{steps[step][1]}</p>
    <div className="walkthrough-scene">
      {step<2 ? <div className="walkthrough-people"><AnimatePresence>{people.filter(person=>step===0||person.age>25).map(person=><motion.div layout={!reduced} key={person.name} exit={{opacity:0,x:reduced?0:20}} transition={{duration:reduced?0:.4}}><b>{person.name}</b><span>{person.age} years</span><span>{person.city}</span></motion.div>)}</AnimatePresence></div>
      : <div className="walkthrough-groups">{["Chennai","Mumbai"].map(city=><div key={city}><h5>{city}</h5>{step===2 ? people.filter(person=>person.age>25&&person.city===city).map(person=><span key={person.name}>{person.name} · {person.age}</span>) : <strong>{people.filter(person=>person.age>25&&person.city===city).length}</strong>}</div>)}</div>}
    </div>
    <p className="walkthrough-api">{kind==="rdd" ? ["RDD starts with individual records.","filter() keeps matching records.","map() creates (city, 1) pairs; reduceByKey() brings matching keys together and adds them.","reduceByKey() returns (Chennai, 2) and (Mumbai, 1)."][step] : ["DataFrame starts with named columns.","filter() keeps rows where age > 25.","groupBy(\"city\") describes the groups to summarize.","count() computes each group’s size when execution is requested."][step]}</p>
    <WalkthroughControls state={state}/>
    <small>This illustrates results after an action requests execution.</small>
  </section>;
}
