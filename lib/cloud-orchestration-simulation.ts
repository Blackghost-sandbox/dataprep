export type OrchestratorId = "airflow" | "step-functions" | "adf" | "composer";
export type PipelineTaskId = "extract" | "transform" | "load" | "quality" | "publish";
export type PipelineTaskStatus = "success" | "running" | "failed" | "waiting";

export type OrchestrationTask = {
  id: PipelineTaskId;
  order: number;
  title: string;
  subtitle: string;
  duration: string;
  status: PipelineTaskStatus;
  operator: string;
  startTime: string;
  endTime: string;
  inputRows: string;
  output: string;
  processed: string;
};

export type OrchestrationLog = {
  id: string;
  time: string;
  text: string;
  tone: "muted" | "info" | "success" | "accent";
};

export type OrchestrationState = {
  runId: number;
  pipelineStatus: "success" | "running" | "failed" | "waiting";
  tasks: OrchestrationTask[];
  logs: OrchestrationLog[];
  selectedTask: PipelineTaskId;
  status: string;
};

export const orchestrators = {
  airflow:{label:"Apache Airflow (Managed)",short:"Apache Airflow",accent:"airflow"},
  "step-functions":{label:"AWS Step Functions",short:"AWS Step Functions",accent:"aws"},
  adf:{label:"Azure Data Factory",short:"Azure Data Factory",accent:"azure"},
  composer:{label:"Google Cloud Composer",short:"Google Cloud Composer",accent:"gcp"},
} satisfies Record<OrchestratorId,{label:string;short:string;accent:string}>;

const taskBlueprints: Omit<OrchestrationTask,"status">[] = [
  {
    id:"extract",order:1,title:"Extract Data",subtitle:"From S3 (CSV)",duration:"2 min",
    operator:"S3ToDataFrameOperator",startTime:"2026-10-01 10:24:02",endTime:"2026-10-01 10:26:03",
    inputRows:"1,000,000",output:"s3://raw/sales/sales_2026-10.csv",processed:"120 MB"
  },
  {
    id:"transform",order:2,title:"Transform",subtitle:"Run Spark job",duration:"4 min",
    operator:"SparkSubmitOperator",startTime:"2026-10-01 10:26:04",endTime:"2026-10-01 10:30:12",
    inputRows:"1,000,000",output:"s3://stage/sales/daily/",processed:"118 MB"
  },
  {
    id:"load",order:3,title:"Load to Warehouse",subtitle:"Write to BigQuery",duration:"1 min",
    operator:"BigQueryInsertJobOperator",startTime:"2026-10-01 10:30:13",endTime:"2026-10-01 10:31:20",
    inputRows:"1,000,000",output:"sales.analytics.daily_sales",processed:"120 MB"
  },
  {
    id:"quality",order:4,title:"Data Quality",subtitle:"Run checks",duration:"1 min",
    operator:"SQLCheckOperator",startTime:"2026-10-01 10:31:21",endTime:"2026-10-01 10:32:18",
    inputRows:"1,000,000",output:"quality://daily_sales",processed:"57 checks"
  },
  {
    id:"publish",order:5,title:"Publish",subtitle:"Update dashboard",duration:"30 sec",
    operator:"HttpOperator",startTime:"2026-10-01 10:32:19",endTime:"2026-10-01 10:32:48",
    inputRows:"1,000,000",output:"dashboard://daily-sales",processed:"1 refresh"
  },
];

function log(id:string,time:string,text:string,tone:OrchestrationLog["tone"]="muted"):OrchestrationLog{
  return {id,time,text,tone};
}

export const dagDefinition = `with DAG(
    dag_id="daily_sales_pipeline",
    schedule="@daily",
    start_date=days_ago(1),
) as dag:
    extract = S3ToDataFrameOperator(
        task_id="extract",
        bucket="sales-data",
        key="sales_{{ ds }}.csv"
    )

    transform = SparkSubmitOperator(
        task_id="transform",
        application="transform_sales.py"
    )

    load = BigQueryInsertJobOperator(
        task_id="load",
        configuration=load_config
    )

    quality = SQLCheckOperator(
        task_id="data_quality",
        sql="checks/daily_sales.sql"
    )

    publish = HttpOperator(
        task_id="publish",
        endpoint="/refresh/dashboard"
    )

    extract >> transform >> load >> quality >> publish`;

export function successTasks():OrchestrationTask[]{
  return taskBlueprints.map(task=>({...task,status:"success"}));
}

export function waitingTasks():OrchestrationTask[]{
  return taskBlueprints.map(task=>({...task,status:"waiting"}));
}

export function referenceOrchestrationState():OrchestrationState{
  return {
    runId:1,
    pipelineStatus:"success",
    tasks:successTasks(),
    selectedTask:"load",
    logs:[
      log("1","10:24:01","DAG run started: 2026-10-01","muted"),
      log("2","10:24:02","Task extract started","info"),
      log("3","10:24:04","Reading sales_2026-10.csv from S3...","accent"),
      log("4","10:26:03","Task extract completed ✓ (2m 1s)","success"),
      log("5","10:26:04","Task transform started","info"),
      log("6","10:26:05","Submitting Spark job to EMR...","accent"),
      log("7","10:30:12","Spark job completed ✓ (4m 8s)","success"),
      log("8","10:30:13","Task load started","info"),
      log("9","10:30:15","Writing to BigQuery (sales_2026_10_01)...","accent"),
      log("10","10:31:20","Task load completed ✓ (1m 7s)","success"),
      log("11","10:31:21","Task data_quality started","info"),
      log("12","10:32:18","Data quality checks passed ✓ (57s)","success"),
      log("13","10:32:19","Task publish started","info"),
      log("14","10:32:48","Dashboard updated ✓ (29s)","success"),
      log("15","10:32:48","DAG run completed successfully 🎉","success"),
    ],
    status:"Daily Sales Analytics pipeline completed successfully.",
  };
}

export function runningOrchestrationState(runId:number,selectedTask:PipelineTaskId="extract"):OrchestrationState{
  const tasks=waitingTasks().map((task,index)=>({...task,status:index===0?"running":"waiting"} as OrchestrationTask));
  return {
    runId,pipelineStatus:"running",tasks,selectedTask,
    logs:[
      log(`${runId}-1`,"10:24:01",`DAG run #${runId} started: 2026-10-01`,"muted"),
      log(`${runId}-2`,"10:24:02","Task extract started","info"),
      log(`${runId}-3`,"10:24:04","Reading sales_2026-10.csv from S3...","accent"),
    ],
    status:"Pipeline is running. Dependencies are being executed in order.",
  };
}

export function completedOrchestrationState(runId:number,orchestrator:OrchestratorId):OrchestrationState{
  const meta=orchestrators[orchestrator];
  const base=referenceOrchestrationState();
  return {
    ...base,
    runId,
    selectedTask:"load",
    logs:base.logs.map((entry,index)=>index===0
      ? {...entry,id:`${runId}-${entry.id}`,text:`${meta.short} run #${runId} started: 2026-10-01`}
      : {...entry,id:`${runId}-${entry.id}`}
    ),
    status:`${meta.short} completed the Daily Sales Analytics pipeline successfully.`,
  };
}

export function taskById(tasks:OrchestrationTask[],id:PipelineTaskId){
  return tasks.find(task=>task.id===id) ?? tasks[0];
}
