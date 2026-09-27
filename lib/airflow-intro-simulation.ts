import {executionScenario,type ExecutionScenario,type TaskState} from "@/lib/airflow-execution";

export type IntroScenarioKey="normal"|"failure"|"retry"|"branching"|"worker-busy"|"sensor";

export const introScenarioChoices:{id:IntroScenarioKey;label:string;short:string}[]=[
  {id:"normal",label:"Normal run (success)",short:"Normal"},
  {id:"failure",label:"Transform fails",short:"Failure"},
  {id:"retry",label:"Retry once",short:"Retry"},
  {id:"branching",label:"Branching (skip path)",short:"Branch"},
  {id:"worker-busy",label:"Worker busy (queued)",short:"Capacity"},
  {id:"sensor",label:"Sensor waiting",short:"Sensor"},
];

function terminalFailure():ExecutionScenario{
  const base=executionScenario("chain");
  const running=base.frames.findIndex(frame=>frame.focus==="transform"&&frame.states.transform==="running");
  const before=base.frames.slice(0,running+1);
  const failed={...before[before.length-1].states,transform:"failed" as TaskState};
  const blocked={...failed,load:"upstream_failed" as TaskState};
  return {
    ...base,
    frames:[
      ...before,
      {title:"transform: failed",actor:"Task execution",explanation:"The transform attempt fails and no retry is configured in this scenario. The failure is terminal for this task instance.",focus:"transform",states:failed,attempt:1},
      {title:"load stays blocked",actor:"Scheduler",explanation:"load requires upstream success. Because transform failed, load becomes upstream_failed without running its task body.",focus:"load",states:blocked},
    ],
    code:"extract >> transform >> load\n# transform: retries=0",
  };
}

function workerBusy():ExecutionScenario{
  const base=executionScenario("chain");
  const queued=base.frames.findIndex(frame=>frame.focus==="transform"&&frame.states.transform==="queued");
  const before=base.frames.slice(0,queued+1);
  const states={...before[before.length-1].states};
  return {
    ...base,
    frames:[
      ...before,
      {title:"transform is still queued",actor:"Executor / worker capacity",explanation:"The scheduler has submitted transform, but no execution slot is available. Queued is not running; task code has not started.",focus:"transform",states},
    ],
    code:"extract >> transform >> load\n# transform is queued until execution capacity is available",
  };
}

export function introScenario(key:IntroScenarioKey):ExecutionScenario{
  if(key==="failure")return terminalFailure();
  if(key==="retry")return executionScenario("retries");
  if(key==="branching")return executionScenario("branching");
  if(key==="worker-busy")return workerBusy();
  if(key==="sensor")return executionScenario("sensors");
  return executionScenario("chain");
}
