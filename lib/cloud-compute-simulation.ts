export type ComputeScenarioId = "daily-sales" | "event-validation" | "api-enrichment" | "nightly-python";
export type VmInstanceType = "t3.medium" | "m6i.large" | "c6i.xlarge";
export type VmScalingMode = "Manual" | "Auto Scaling Group";
export type ContainerOrchestrator = "Kubernetes (EKS/GKE/AKS)" | "Managed Container Jobs" | "ECS / Cloud Run Jobs";
export type ServerlessMemory = 512 | 1024 | 2048;

export type ComputeControls = {
  vmInstanceType: VmInstanceType;
  vmScaling: VmScalingMode;
  vmInstances: number;
  containerImage: string;
  orchestrator: ContainerOrchestrator;
  replicas: number;
  functionName: string;
  memoryMb: ServerlessMemory;
  invocations: number;
};

export type ComputeMetrics = {
  startup: string;
  processingMinutes: number;
  scalability: string;
  isolation: string;
  cost: number;
};

export type ComputeLog = {
  id: string;
  time: string;
  text: string;
  tone: "muted" | "info" | "success" | "accent";
};

export type ComputeSimulationResult = {
  vm: ComputeMetrics;
  container: ComputeMetrics;
  serverless: ComputeMetrics;
  logs: ComputeLog[];
  winner: "vm" | "container" | "serverless";
  status: string;
};

export const computeScenarios: Array<{
  id:ComputeScenarioId;
  label:string;
  input:string;
  transform:string;
  output:string;
  baseMinutes:number;
  dataGb:number;
}> = [
  {id:"daily-sales",label:"ETL: Daily Sales Processing",input:"Input Data (1 GB)",transform:"Processing (Transform)",output:"Write Output (Parquet)",baseMinutes:4.2,dataGb:1},
  {id:"event-validation",label:"Event: File Validation",input:"Object Upload (150 MB)",transform:"Validate Schema",output:"Publish Result",baseMinutes:.3,dataGb:.15},
  {id:"api-enrichment",label:"API: Customer Enrichment",input:"API Requests",transform:"Enrich Records",output:"Return JSON",baseMinutes:1.1,dataGb:.4},
  {id:"nightly-python",label:"Batch: Nightly Python Job",input:"Raw Files (8 GB)",transform:"Python Enrichment",output:"Curated Dataset",baseMinutes:38,dataGb:8},
];

export const vmTypes: Record<VmInstanceType,{label:string;hourly:number;startup:number;capacity:number}> = {
  "t3.medium":{label:"t3.medium (2 vCPU, 4 GB)",hourly:.0335,startup:2.5,capacity:1},
  "m6i.large":{label:"m6i.large (2 vCPU, 8 GB)",hourly:.061,startup:2.2,capacity:1.3},
  "c6i.xlarge":{label:"c6i.xlarge (4 vCPU, 8 GB)",hourly:.102,startup:2.1,capacity:1.8},
};

export const serverlessMemories: ServerlessMemory[]=[512,1024,2048];

export function defaultComputeControls():ComputeControls{
  return {
    vmInstanceType:"t3.medium",
    vmScaling:"Manual",
    vmInstances:2,
    containerImage:"data-processor:latest",
    orchestrator:"Kubernetes (EKS/GKE/AKS)",
    replicas:3,
    functionName:"ETL Processor",
    memoryMb:1024,
    invocations:1000,
  };
}

function round3(n:number){return Math.round(n*1000)/1000;}
function round1(n:number){return Math.round(n*10)/10;}

function vmMetrics(controls:ComputeControls,scenario:ComputeScenarioId):ComputeMetrics{
  const meta=computeScenarios.find(s=>s.id===scenario)??computeScenarios[0];
  const vm=vmTypes[controls.vmInstanceType];
  const parallel=Math.max(1,controls.vmInstances*vm.capacity);
  const processing=Math.max(.4,meta.baseMinutes*(scenario==="daily-sales"?1.19:1.12)/Math.min(1.2,parallel/2));
  return {
    startup:`~ ${vm.startup.toFixed(1).replace(".0","")}–${Math.ceil(vm.startup+.6)} min`,
    processingMinutes:round1(processing),
    scalability:controls.vmScaling==="Manual"?"Manual":"Automatic",
    isolation:"Strong",
    cost:round3(vm.hourly*controls.vmInstances),
  };
}

function containerMetrics(controls:ComputeControls,scenario:ComputeScenarioId):ComputeMetrics{
  const meta=computeScenarios.find(s=>s.id===scenario)??computeScenarios[0];
  const replicaFactor=Math.max(.78,1-(Math.max(1,controls.replicas)-3)*.06);
  const processing=Math.max(.3,meta.baseMinutes*1.071*replicaFactor);
  const orchestratorFactor=controls.orchestrator==="Kubernetes (EKS/GKE/AKS)"?1:controls.orchestrator==="Managed Container Jobs"?.92:.88;
  return {
    startup:controls.orchestrator==="Kubernetes (EKS/GKE/AKS)"?"~ 10–30 sec":"~ 5–20 sec",
    processingMinutes:round1(processing),
    scalability:"Automatic",
    isolation:"Strong",
    cost:round3(.014*Math.max(1,controls.replicas)*orchestratorFactor),
  };
}

function serverlessMetrics(controls:ComputeControls,scenario:ComputeScenarioId):ComputeMetrics{
  const meta=computeScenarios.find(s=>s.id===scenario)??computeScenarios[0];
  const memoryFactor=1024/controls.memoryMb;
  const processing=Math.max(.08,meta.baseMinutes*Math.min(1.35,Math.max(.7,memoryFactor)));
  const invocationFactor=Math.max(.15,controls.invocations/1000);
  const cost=.021*invocationFactor*(controls.memoryMb/1024);
  return {
    startup:controls.memoryMb===2048?"~ 80 ms":controls.memoryMb===1024?"~ 100 ms":"~ 140 ms",
    processingMinutes:round1(processing),
    scalability:"Automatic",
    isolation:"Per Function",
    cost:round3(cost),
  };
}

function time(index:number){
  const second=1+index*3;
  return `10:24:${String(second).padStart(2,"0")}`;
}
function log(index:number,text:string,tone:ComputeLog["tone"]="muted"):ComputeLog{
  return {id:`${index}-${text.slice(0,14)}`,time:time(index),text,tone};
}

export function simulateCompute(controls:ComputeControls,scenario:ComputeScenarioId):ComputeSimulationResult{
  const vm=vmMetrics(controls,scenario);
  const container=containerMetrics(controls,scenario);
  const serverless=serverlessMetrics(controls,scenario);
  const metrics={vm,container,serverless};
  const winner=(Object.entries(metrics) as Array<["vm"|"container"|"serverless",ComputeMetrics]>)
    .sort((a,b)=>a[1].processingMinutes-b[1].processingMinutes||a[1].cost-b[1].cost)[0][0];
  const winnerMetric=metrics[winner];
  const winnerLabel=winner==="vm"?"VMs":winner==="container"?"Containers":"Serverless";
  return {
    vm,container,serverless,winner,
    logs:[
      log(0,"Starting simulation..."),
      log(1,`Provisioning ${winnerLabel} compute resources...`,"info"),
      log(2,`Running ETL job (${(computeScenarios.find(s=>s.id===scenario)?.dataGb??1).toFixed(0)} GB data)`,"muted"),
      log(3,"Transforming data...","accent"),
      log(4,"Writing to output (Parquet)","info"),
      log(5,`Job completed successfully ✓`,"success"),
      log(6,`Total time: ${winnerMetric.processingMinutes.toFixed(1)} min`,"success"),
      log(7,`Total cost: $${winnerMetric.cost.toFixed(3)}`,"success"),
    ],
    status:`${winnerLabel} finished this simulated workload fastest under the current settings.`,
  };
}
