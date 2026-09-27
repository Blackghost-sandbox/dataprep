export type TaskState="none"|"scheduled"|"queued"|"running"|"success"|"up_for_retry"|"failed"|"upstream_failed"|"skipped"|"up_for_reschedule";
export interface DagNode {id:string;column:number;row:number}
export interface ExecutionFrame {title:string;actor:string;explanation:string;states:Record<string,TaskState>;focus:string;attempt?:number}
export interface ExecutionScenario {nodes:DagNode[];edges:[string,string][];code:string;frames:ExecutionFrame[]}
export type ExecutionKind="etl"|"chain"|"dependencies"|"retries"|"sensors"|"branching"|"mapping";
export const taskStateMeaning:Record<TaskState,string>={none:"No task state yet; dependencies or run eligibility may still be pending.",scheduled:"The scheduler has determined that the task should run.",queued:"Submitted through the executor, waiting for execution capacity.",running:"Task code is executing.",success:"This task instance finished successfully.",up_for_retry:"An attempt failed; another attempt remains and waits for its retry delay.",failed:"The task failed with no automatic retry left in this trace.",upstream_failed:"The required upstream success cannot be satisfied because an upstream task failed.",skipped:"This path was intentionally not selected.",up_for_reschedule:"A reschedule-mode sensor is waiting until its next check; it releases the worker slot."};
export function dependenciesSatisfied(upstream:TaskState[],rule:"all_success"|"none_failed_min_one_success"="all_success"){
  return rule==="all_success"?upstream.every(s=>s==="success"):upstream.every(s=>s==="success"||s==="skipped")&&upstream.some(s=>s==="success");
}
/** Deterministic teaching trace, not a scheduler or runtime. Frames show only
 * selected events; timing, concurrency and executor internals are simplified. */
export function executionScenario(kind:ExecutionKind,exhausted=false):ExecutionScenario{
  const ids=kind==="etl"?["extract","validate","transform","load","quality_check"]:kind==="dependencies"?["extract","validate","enrich","load"]:kind==="branching"?["choose","load","no_data","join"]:kind==="mapping"?["list_files","process_0","process_1","summarize"]:kind==="sensors"?["wait_file","load"]:["extract","transform","load"];
  const fork=["dependencies","branching","mapping"].includes(kind);
  const nodes=ids.map((id,i)=>({id,column:fork&&i===1?0:fork&&i===2?2:1,row:fork?(i===0?0:i===3?2:1):i}));
  const edges:[string,string][]=fork?[[ids[0],ids[1]],[ids[0],ids[2]],[ids[1],ids[3]],[ids[2],ids[3]]]:ids.slice(1).map((id,i)=>[ids[i],id]);
  const states:Record<string,TaskState>=Object.fromEntries(ids.map(id=>[id,"none"]));
  const frames:ExecutionFrame[]=[];
  const add=(title:string,actor:string,explanation:string,focus:string,patch:Record<string,TaskState>={},attempt?:number)=>{Object.assign(states,patch);frames.push({title,actor,explanation,states:{...states},focus,attempt});};
  const run=(id:string,reason:string)=>{
    add(`${id}: scheduled`,"Scheduler",reason,id,{[id]:"scheduled"});
    add(`${id}: queued`,"Scheduler → executor","The task has been submitted. Queued is not running; worker capacity still matters.",id,{[id]:"queued"});
    add(`${id}: running`,"Task execution","A worker/task process executes the task code. A different task can run on a different machine.",id,{[id]:"running"});
  };
  const success=(id:string)=>add(`${id}: success`,"Task execution → state tracking","This task instance completed. The scheduler can reevaluate downstream dependencies.",id,{[id]:"success"});
  add("DAG run created","Run scheduling","Tasks are definitions; these boxes show task instances in one selected run. No task code has executed yet.",ids[0]);
  run(ids[0],"The DAG run is eligible and the root has no upstream task requirements.");
  if(kind==="sensors"){
    add("Condition not ready","Sensor","The file is not present. mode='reschedule' yields the worker slot instead of holding it while waiting.",ids[0],{[ids[0]]:"up_for_reschedule"});
    run(ids[0],"The next check time arrives. A new scheduled check requires execution capacity again.");
    add("File now ready","Sensor","The external condition is true; this is not proof that the data contents are valid.",ids[0],{[ids[0]]:"success"});
    run(ids[1],"The sensor succeeded, satisfying load’s upstream dependency.");success(ids[1]);
  }else if(kind==="retries"){
    success(ids[0]);run(ids[1],"extract succeeded; transform is eligible under all_success.");
    add("Attempt 1 raised an error","Retry policy","A transient error occurred. retries=1 permits one additional attempt; the task enters up_for_retry, not terminal failed.",ids[1],{[ids[1]]:"up_for_retry"},1);
    add("Wait for retry delay","Scheduler","Five illustrative minutes must elapse. load remains unset because transform has not succeeded; no downstream code runs.",ids[2],{},1);
    run(ids[1],"The retry delay has elapsed. The same task instance is eligible for attempt 2.");
    if(exhausted){add("Attempt 2 failed","Retry policy","The additional attempt also failed. No retries remain; transform is now terminal failed.",ids[1],{[ids[1]]:"failed"},2);add("Downstream cannot proceed","Scheduler","load requires all_success, but transform failed. load becomes upstream_failed without executing its code.",ids[2],{[ids[2]]:"upstream_failed"});}
    else{add("Attempt 2 succeeded","Task execution","The transient problem cleared. Safe reruns require idempotent task effects.",ids[1],{[ids[1]]:"success"},2);run(ids[2],"All upstream requirements now succeed. load can be submitted.");success(ids[2]);}
  }else if(kind==="branching"){
    add("Select the load path","Branch task","choose returns 'load'. The direct no_data path is skipped, not failed.",ids[0],{choose:"success",no_data:"skipped"});run("load","The branch selected load.");success("load");
    run("join","none_failed_min_one_success accepts success + skipped. The default all_success would not accept this pair.");success("join");
  }else if(fork){
    success(ids[0]);run(ids[1],kind==="mapping"?"The returned two-item list creates two mapped task instances; this is index 0.":"extract succeeded. validate and enrich are both eligible; this trace shows one possible order.");
    run(ids[2],kind==="mapping"?"Mapped index 1 is independently schedulable; concurrency limits may delay it.":"enrich can run without waiting for validate; there is no edge between the siblings.");success(ids[1]);
    add("Join still waiting","Scheduler","One parent succeeded but the other is running. all_success is not yet satisfied.",ids[3]);success(ids[2]);run(ids[3],"Both parents succeeded; the downstream task is now eligible.");success(ids[3]);
  }else{success(ids[0]);for(const id of ids.slice(1)){run(id,"The preceding task succeeded, satisfying the dependency for this task.");success(id);}}
  return {nodes,edges,frames,code:kind==="etl"?"extract >> validate >> transform >> load >> quality_check":kind==="dependencies"?"extract >> [validate, enrich]\n[validate, enrich] >> load":kind==="branching"?"choose >> [load, no_data]\n[load, no_data] >> join\n# join: none_failed_min_one_success":kind==="mapping"?"parts = process.expand(path=list_files())\nsummarize(parts)":kind==="sensors"?"wait_file >> load\n# sensor mode='reschedule'":kind==="retries"?"extract >> transform >> load\n# transform: retries=1, retry_delay=5 minutes":"extract >> transform >> load"};
}
