"use client";
import {useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {Database,FileText,Cpu,Shield,GitBranch,Network,Table2,Radio,Coins} from "lucide-react";
type Kind="storage"|"compute"|"security"|"tasks"|"network"|"table"|"snapshot"|"stream"|"cost";
type Term={name:string;definition:string;inside:string;unchanged:string;kind:Kind};
const t=(name:string,definition:string,inside:string,unchanged:string,kind:Kind):Term=>({name,definition,inside,unchanged,kind});
const topics:Record<string,Term[]>={
 introduction:[t("Object storage","A service that stores files as objects in buckets.","Files, object keys and metadata.","Storing a file does not clean its rows.","storage"),t("Compute","Resources that execute your processing code.","A running program, memory and CPU.","Storage and compute have different responsibilities.","compute"),t("Data warehouse","A platform for storing tables and querying them for analytics.","Table rows and query execution resources.","A query can read data without modifying it.","table")],
 "object-storage":[t("Amazon S3 / object storage","Amazon S3 is AWS’s object storage service. Azure Blob Storage and Google Cloud Storage serve similar storage roles.","A bucket holds objects, such as raw/orders.csv.","Reading an object leaves the original stored.","storage"),t("Bucket, object and key","A bucket is a container. An object is a file plus metadata. Its key is its name within the bucket.","sales-data → raw/orders.csv → size and metadata.","A slash in a key is a naming convention, not a filesystem directory.","storage"),t("Data lake","Stored datasets used by separate processing and query engines.","Raw and curated datasets, often in CSV, JSON or Parquet.","The lake itself does not run the transformation.","storage")],
 compute:[t("Virtual machine","A virtual computer with CPU, memory and an operating system.","Your application runs on provisioned machine resources.","The application still needs code to process data.","compute"),t("Container","A packaged application with the dependencies it needs to run.","An application image starts as a process on compute.","A container is a software package, not a storage service.","compute"),t("Serverless function","A service that runs your function in response to a request or event.","An event triggers code, which returns or writes an output.","Execution time, memory and service limits still apply.","compute")],
 "identity-security":[t("IAM principal and role","An identity makes a request. A role provides permissions that an authorised identity can assume.","Who requests an action on which resource.","Having an identity does not grant every action.","security"),t("Policy","Rules used to decide whether an action is allowed.","Actions, resources and conditions; explicit denies override allows in AWS IAM.","A read permission is different from a delete permission.","security"),t("Secret","A protected credential or other sensitive configuration.","An authorised application retrieves it from a secret store.","Secrets should not be embedded in source code or logs.","security")],
 "managed-spark":[t("Spark cluster","A driver coordinates workers that process partitions of a dataset.","Input partitions → worker tasks → output partitions.","Workers do not each need to read the entire dataset.","compute"),t("Managed service","The provider operates parts of the infrastructure for your workload.","Provisioning, job execution and service-managed operations.","You still choose code, configuration and workload limits.","compute")],
 "data-warehouse":[t("Warehouse storage","Persisted table data used for analytical queries.","Tables hold rows and named columns.","Query compute and stored data are separate concerns.","table"),t("Query compute","Resources that scan, join and aggregate table data.","An example SUM reads amounts 20 and 30 and returns 50.","This read-only query leaves the source rows unchanged.","table")],
 lakehouse:[t("Open table format","Metadata and protocols that organise data files as a table.","A snapshot identifies the files that belong to one table version.","The format is not the engine that executes your SQL.","snapshot"),t("Snapshot","A recorded table state that a reader can select consistently.","Version 1 references files A and B; a later version may reference A and C.","Readers use the selected snapshot rather than every file in the bucket.","snapshot")],
 orchestration:[t("Orchestrator","A service that schedules and coordinates tasks.","Extract must finish before transform, then load can start.","The scheduler invokes processing; it does not replace your processing code.","tasks"),t("Dependency and retry","A dependency controls when a task may run. A retry repeats an unsuccessful attempt.","Task states, attempts and prerequisites.","Retries require safe task behaviour to avoid duplicate effects.","tasks")],
 streaming:[t("Event stream","A retained sequence of events that consumers read over time.","An event is appended to a partition at an offset.","Reading does not normally delete the event immediately.","stream"),t("Consumer and offset","A consumer processes events; an offset identifies a position within a partition.","Different consumer groups can track different positions.","There is no single global ordering across all partitions.","stream")],
 "networking-observability":[t("Networking","Connectivity and routing rules that let services communicate.","A request follows an allowed route to its destination.","Network reachability and IAM authorisation are separate checks.","network"),t("Metrics, logs and traces","Three ways to observe a running system.","Metrics count; logs describe events; traces follow a request through services.","Observability reveals behaviour rather than fixing it automatically.","network")],
 "cost-architecture":[t("Cloud cost","Charges depend on resource usage and the provider’s pricing model.","Storage, compute, requests and transfers contribute differently.","The cheapest individual service may not make the cheapest pipeline.","cost"),t("Cost optimisation","Reduce unnecessary work while retaining required performance and reliability.","Prune unnecessary scans, right-size compute and choose retention deliberately.","Less processing cost should not come from silently losing required data.","cost")],
};
const icons={storage:Database,compute:Cpu,security:Shield,tasks:GitBranch,network:Network,table:Table2,snapshot:FileText,stream:Radio,cost:Coins};
const placements:Record<string,string[]>={
 introduction:[".cloud-pipeline-slot:nth-child(3) .cloud-stage-card",".cloud-pipeline-slot:nth-child(4) .cloud-stage-card",".cloud-pipeline-slot:nth-child(5) .cloud-stage-card"],
 "object-storage":[".os-stage.storage",".os-stage.layout",".os-stage.analyze"],
 compute:[".cc-compute-card.vm",".cc-compute-card.container",".cc-compute-card.serverless"],
 "identity-security":[".identity-stage",".resources-stage",".sec-secrets"],
 "managed-spark":[".ms-card.spark",".ms-card.stages"],
 "data-warehouse":[".dw-card.load",".dw-card.compute"],
 lakehouse:[".lh-card.operations",".lh-card.query"],
 orchestration:[".oi-pipeline-board",".oi-task-meta"],
 streaming:[".sm-card.platform",".sm-card.consumers"],
 "networking-observability":[".no-card.network",".no-card.monitor"],
 "cost-architecture":[".ca-stage.storage",".ca-stage.compute"],
};
// Mount explanations in the existing service cards, without another teaching panel.
export function CloudServiceExplainer({topic}:{topic:string}){
 const host=useRef<HTMLSpanElement>(null);
 const [targets,setTargets]=useState<{node:HTMLElement;term:Term}[]>([]);
 const [running,setRunning]=useState(false);
 useEffect(()=>{
  const root=host.current?.closest("[data-cloud-motion]");if(!root)return;
  const nodes:{node:HTMLElement;term:Term}[]=[];
  (placements[topic]??[]).forEach((selector,i)=>{
   const card=root.querySelector(selector);const term=topics[topic]?.[i];if(!card||!term)return;
   const node=document.createElement("div");node.className="cloud-inline-service";
   const heading=card.querySelector(":scope > header, :scope > .cloud-stage-heading");
   if(heading)card.insertBefore(node,heading.nextSibling);else card.appendChild(node);
   nodes.push({node,term});
  });
  setTargets(nodes);
  const play=()=>setRunning(true),reset=()=>setRunning(false);
  root.addEventListener("cloud-guide-run",play);root.addEventListener("cloud-guide-reset",reset);
  return()=>{nodes.forEach(({node})=>node.remove());root.removeEventListener("cloud-guide-run",play);root.removeEventListener("cloud-guide-reset",reset);};
 },[topic]);
 return <><span ref={host} hidden/>{targets.map(({node,term})=>{const Icon=icons[term.kind];return createPortal(<div className={`cloud-inline-meaning ${running?"is-running":""}`}><div className="cloud-inline-definition"><Icon size={15}/><p><strong>{term.name}. </strong>{term.definition}</p></div><p className="cloud-inline-operation"><span className="cloud-inline-signal" aria-hidden="true"/>{term.inside}</p><small>{term.unchanged}</small></div>,node,term.name);})}</>;
}
