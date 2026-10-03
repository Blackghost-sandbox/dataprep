export type CostScenarioId = "hourly-analytics" | "daily-batch" | "near-real-time";
export type StorageTierId = "standard" | "intelligent" | "archive";
export type ComputeModeId = "serverless" | "autoscaling-cluster" | "fixed-cluster";
export type ServingModeId = "warehouse" | "lakehouse";
export type OptimizationLeverId = "right-size" | "storage" | "movement" | "operations";

export type CostControls = {
  scenario: CostScenarioId;
  dailyDataGb: number;
  retentionDays: number;
  storageTier: StorageTierId;
  computeMode: ComputeModeId;
  servingMode: ServingModeId;
  autoScaling: boolean;
  lifecyclePolicy: boolean;
  pruneScans: boolean;
  crossRegion: boolean;
  managedServices: boolean;
  cacheServing: boolean;
};

export type CostMetrics = {
  monthlyCost: number;
  costPerTb: number;
  scanTb: number;
  storageTb: number;
  networkGb: number;
  performanceScore: number;
  reliabilityScore: number;
  optimizationScore: number;
};

export type ReviewItem = {
  id: string;
  label: string;
  checked: boolean;
};

export type CostSimulationState = {
  metrics: CostMetrics;
  recommendations: string[];
  selectedLever: OptimizationLeverId;
  reviewItems: ReviewItem[];
  status: string;
};

export const costScenarios = {
  "hourly-analytics": {label:"Hourly analytics",freshnessHours:1,baseScanFactor:1.2},
  "daily-batch": {label:"Daily batch",freshnessHours:24,baseScanFactor:.7},
  "near-real-time": {label:"Near real-time",freshnessHours:.1,baseScanFactor:1.7},
} satisfies Record<CostScenarioId,{label:string;freshnessHours:number;baseScanFactor:number}>;

export const storageTiers = {
  standard:{label:"Standard",monthlyGb:0.023},
  intelligent:{label:"Intelligent Tiering",monthlyGb:0.017},
  archive:{label:"Archive",monthlyGb:0.006},
} satisfies Record<StorageTierId,{label:string;monthlyGb:number}>;

export const computeModes = {
  serverless:{label:"Serverless / managed",baseMonthly:620,performance:88,reliability:94},
  "autoscaling-cluster":{label:"Autoscaling cluster",baseMonthly:760,performance:92,reliability:91},
  "fixed-cluster":{label:"Fixed cluster",baseMonthly:980,performance:86,reliability:84},
} satisfies Record<ComputeModeId,{label:string;baseMonthly:number;performance:number;reliability:number}>;

export const servingModes = {
  warehouse:{label:"Cloud warehouse",baseMonthly:520,performance:93},
  lakehouse:{label:"Lakehouse SQL",baseMonthly:430,performance:88},
} satisfies Record<ServingModeId,{label:string;baseMonthly:number;performance:number}>;

export function defaultCostControls():CostControls{
  return {
    scenario:"hourly-analytics",
    dailyDataGb:500,
    retentionDays:90,
    storageTier:"intelligent",
    computeMode:"serverless",
    servingMode:"warehouse",
    autoScaling:true,
    lifecyclePolicy:true,
    pruneScans:true,
    crossRegion:false,
    managedServices:true,
    cacheServing:true,
  };
}

const baseReviewItems:ReviewItem[] = [
  {id:"sla",label:"Workload shape and SLA requirements",checked:true},
  {id:"storage",label:"Storage layout and data formats",checked:true},
  {id:"compute",label:"Compute model and autoscaling strategy",checked:true},
  {id:"network",label:"Data movement and network costs",checked:true},
  {id:"resilience",label:"Resilience, failure domains and DR",checked:true},
  {id:"observability",label:"Monitoring, logging and alerting",checked:true},
  {id:"unit-cost",label:"Estimated monthly cost and cost per TB/query",checked:true},
  {id:"further",label:"Opportunities for further optimization",checked:true},
];

export function reviewItems():ReviewItem[]{
  return baseReviewItems.map(item=>({...item}));
}

export function computeCostMetrics(controls:CostControls):CostMetrics{
  const scenario=costScenarios[controls.scenario];
  const storage=storageTiers[controls.storageTier];
  const compute=computeModes[controls.computeMode];
  const serving=servingModes[controls.servingMode];

  const monthlyIngestGb=controls.dailyDataGb*30;
  const storageTb=monthlyIngestGb*(controls.retentionDays/30)/1024;
  const storageCost=storageTb*1024*storage.monthlyGb*(controls.lifecyclePolicy ? .86 : 1);

  const scanTb=controls.dailyDataGb/1024*30*scenario.baseScanFactor*(controls.pruneScans ? .42 : 1);
  const computeScale=Math.max(.45,controls.dailyDataGb/500);
  const computeCost=compute.baseMonthly*computeScale*(controls.autoScaling ? .82 : 1);

  const servingCost=serving.baseMonthly*Math.max(.5,controls.dailyDataGb/500)*(controls.cacheServing ? .78 : 1);
  const networkGb=controls.crossRegion?Math.round(monthlyIngestGb*.28):Math.round(monthlyIngestGb*.03);
  const networkCost=networkGb*(controls.crossRegion?.09:.015);
  const opsCost=controls.managedServices?260:420;

  const monthlyCost=Math.round(storageCost+computeCost+servingCost+networkCost+opsCost);
  const costPerTb=Math.round(monthlyCost/Math.max(1,monthlyIngestGb/1024));

  let performance=Math.round((compute.performance+serving.performance)/2);
  if(controls.pruneScans) performance+=4;
  if(controls.cacheServing) performance+=3;
  if(controls.storageTier==="archive") performance-=12;
  performance=Math.max(40,Math.min(99,performance));

  let reliability=compute.reliability;
  if(controls.managedServices) reliability+=3;
  if(controls.crossRegion) reliability+=1;
  if(!controls.autoScaling) reliability-=4;
  reliability=Math.max(40,Math.min(99,reliability));

  let optimization=50;
  optimization+=controls.autoScaling?8:0;
  optimization+=controls.lifecyclePolicy?8:0;
  optimization+=controls.pruneScans?10:0;
  optimization+=controls.crossRegion?-8:7;
  optimization+=controls.managedServices?6:0;
  optimization+=controls.cacheServing?6:0;
  optimization+=controls.storageTier==="intelligent"?5:controls.storageTier==="archive"?3:0;
  optimization=Math.max(0,Math.min(100,optimization));

  return {
    monthlyCost,
    costPerTb,
    scanTb:Math.round(scanTb*10)/10,
    storageTb:Math.round(storageTb*10)/10,
    networkGb,
    performanceScore:performance,
    reliabilityScore:reliability,
    optimizationScore:optimization,
  };
}

export function buildRecommendations(controls:CostControls,metrics:CostMetrics){
  const recommendations:string[]=[];
  if(!controls.autoScaling) recommendations.push("Enable autoscaling or serverless compute to reduce idle capacity.");
  if(!controls.lifecyclePolicy) recommendations.push("Add storage lifecycle rules so colder data moves to lower-cost tiers.");
  if(!controls.pruneScans) recommendations.push("Partition, cluster, or filter earlier to reduce scanned data.");
  if(controls.crossRegion) recommendations.push("Keep related data and compute in the same region unless DR or compliance requires otherwise.");
  if(!controls.cacheServing) recommendations.push("Cache repeated serving-layer queries where freshness requirements allow it.");
  if(!controls.managedServices) recommendations.push("Compare managed-service premium against operational effort and on-call cost.");
  if(metrics.optimizationScore>=85) recommendations.push("Architecture is already well optimized; focus on measurement and workload-specific tuning.");
  return recommendations.slice(0,4);
}

export function referenceCostState():CostSimulationState{
  const controls=defaultCostControls();
  return {
    metrics:computeCostMetrics(controls),
    recommendations:[
      "Right-size compute and keep autoscaling enabled.",
      "Use lifecycle policies and efficient columnar formats.",
      "Avoid unnecessary cross-region movement.",
      "Monitor cost per workload, not only total spend.",
    ],
    selectedLever:"right-size",
    reviewItems:reviewItems(),
    status:"Architecture review ready. Optimize the largest measurable cost driver first.",
  };
}

export function simulateCostReview(controls:CostControls):CostSimulationState{
  const metrics=computeCostMetrics(controls);
  const recommendations=buildRecommendations(controls,metrics);
  return {
    metrics,
    recommendations,
    selectedLever: metrics.optimizationScore<70 ? "right-size" : controls.crossRegion ? "movement" : "operations",
    reviewItems:reviewItems(),
    status:`Review complete: estimated monthly cost $${metrics.monthlyCost.toLocaleString("en-US")} with optimization score ${metrics.optimizationScore}/100.`,
  };
}
