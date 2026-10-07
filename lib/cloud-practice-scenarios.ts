export const cloudPracticeScenarios:Record<string,{title:string;control:string;options:string[];outcomes:string[];correct:number;input:string;principle:string}> = {
  "cloud-introduction": {
    "title": "Paid revenue from three orders",
    "control": "Processing rule",
    "options": [
      "Store only",
      "Filter paid and sum",
      "Sum every order"
    ],
    "outcomes": [
      "Three raw orders stored; revenue has not been calculated.",
      "Two paid orders; revenue 50. All three raw records remain stored.",
      "Revenue 60: the cancelled amount 10 was incorrectly included."
    ],
    "correct": 1,
    "input": "Paid amounts 20 and 30; cancelled amount 10.",
    "principle": "Storage preserves input; processing applies business rules."
  },
  "object-storage": {
    "title": "Read a daily partition",
    "control": "Objects to read",
    "options": [
      "All dates",
      "Required date only",
      "No objects"
    ],
    "outcomes": [
      "More files are scanned than the requested date needs.",
      "Only the requested date is read; other stored objects remain available.",
      "No records can be returned because no input files are read."
    ],
    "correct": 1,
    "input": "Three equally sized date partitions; the request needs one date.",
    "principle": "Pruning input reduces unnecessary reading; it does not delete other partitions."
  },
  "identity-security": {
    "title": "Read raw orders safely",
    "control": "Workload permission",
    "options": [
      "No read permission",
      "Scoped read permission",
      "Read and delete permission"
    ],
    "outcomes": [
      "The read request is denied.",
      "The job can read the required input without delete permission.",
      "The job can read but also has unnecessary destructive permission."
    ],
    "correct": 1,
    "input": "A processing job needs to read raw/orders.csv; deletion is not required.",
    "principle": "Grant only the actions needed on the required resources."
  },
  "compute-serverless": {
    "title": "Choose execution for a long job",
    "control": "Execution choice",
    "options": [
      "Function with 15-minute configured limit",
      "Container job sized for the workload",
      "Storage bucket alone"
    ],
    "outcomes": [
      "The 40-minute workload exceeds this configured execution limit.",
      "The job can run if its resources and job limits support the workload.",
      "Files can be stored, but no processing code runs."
    ],
    "correct": 1,
    "input": "A batch transformation takes 40 minutes; the proposed function limit is 15 minutes in this exercise.",
    "principle": "Execution duration, resources and operational requirements determine fit."
  },
  "managed-batch": {
    "title": "Distribute twelve records",
    "control": "Partition assignment",
    "options": [
      "One task for all records",
      "Three tasks of four records",
      "Every worker processes all twelve"
    ],
    "outcomes": [
      "All twelve records are handled by one task; no task-level parallelism in this example.",
      "Three tasks each receive four records; twelve assigned records in total.",
      "Each worker repeats the full input; combining outputs can duplicate results."
    ],
    "correct": 1,
    "input": "Twelve independent records and three available workers.",
    "principle": "Partition tasks divide work; adding workers does not automatically fix skew."
  },
  "cloud-warehouses": {
    "title": "Calculate total amount",
    "control": "Query operation",
    "options": [
      "SUM(amount)",
      "COUNT(*)",
      "Read rows only"
    ],
    "outcomes": [
      "The two amounts sum to 50.",
      "The count is 2, not the total amount.",
      "The query returns 20 and 30 without calculating their sum."
    ],
    "correct": 0,
    "input": "A stored table contains amount values 20 and 30.",
    "principle": "SQL operations determine the result; read-only queries preserve the table."
  },
  "lakehouse": {
    "title": "Read snapshot version one",
    "control": "File selection",
    "options": [
      "Files A and B from snapshot one",
      "Every object A, B and C",
      "Latest snapshot A and C"
    ],
    "outcomes": [
      "The reader uses the requested snapshot file set A and B.",
      "The read ignores snapshot membership and may mix versions.",
      "The read uses a different table version from the requested one."
    ],
    "correct": 0,
    "input": "Snapshot one references A+B; snapshot two references A+C.",
    "principle": "Metadata identifies the files belonging to the selected table version."
  },
  "streaming": {
    "title": "Track two consumer groups",
    "control": "Position handling",
    "options": [
      "Separate group positions",
      "One shared position for all groups",
      "Delete each event immediately after reading"
    ],
    "outcomes": [
      "Each group can progress independently through retained events.",
      "Independent groups lose their separate progress tracking in this design.",
      "Other readers or replay may lose required retained events."
    ],
    "correct": 0,
    "input": "Group A is at offset 3 and group B at offset 1 in the same partition.",
    "principle": "Offsets are partition positions; consumer groups track independent progress."
  },
  "orchestration-integration": {
    "title": "Recover a failed transform",
    "control": "Downstream action",
    "options": [
      "Load anyway",
      "Block load and investigate",
      "Retry forever without checks"
    ],
    "outcomes": [
      "Load can publish missing or invalid transformation output.",
      "The failed prerequisite prevents load; investigate and retry safely.",
      "Repeated attempts can waste resources or repeat unsafe side effects."
    ],
    "correct": 1,
    "input": "Extract succeeds; transform fails; load depends on transform success.",
    "principle": "Dependencies gate tasks; retries require deliberate limits and safe effects."
  },
  "networking-reliability": {
    "title": "Diagnose a denied request",
    "control": "Investigation",
    "options": [
      "Check route and IAM separately",
      "Change network route only",
      "Treat every error as an outage"
    ],
    "outcomes": [
      "Separate connectivity evidence from access-policy evidence to locate the failure.",
      "A working route does not fix denied authorisation.",
      "The diagnosis skips evidence and can miss a permissions issue."
    ],
    "correct": 0,
    "input": "A request reaches the service but receives an access-denied response.",
    "principle": "Reachability and authorisation are different checks."
  },
  "cost-architecture-review": {
    "title": "Reduce avoidable scanning",
    "control": "Optimisation",
    "options": [
      "Read required partition",
      "Delete required historical data",
      "Add compute without checking the scan"
    ],
    "outcomes": [
      "Read less unnecessary data while retaining required records.",
      "Lower storage use comes at the cost of losing required data.",
      "More compute may increase cost without addressing unnecessary input scans."
    ],
    "correct": 0,
    "input": "A query needs one of ten equally sized date partitions; history must be retained.",
    "principle": "Optimise unnecessary work while preserving required correctness and retention."
  }
};
