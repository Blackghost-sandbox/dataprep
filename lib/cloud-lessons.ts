import type { SparkLesson } from "@/lib/spark-lessons";

export const cloudLessons: SparkLesson[] = [
  {
    "id": "cloud-introduction",
    "title": "Cloud Platforms for Data Engineering",
    "minutes": 20,
    "description": "Build a vendor-neutral mental model for cloud data systems before mapping the same responsibilities to AWS, Google Cloud, and Azure.",
    "concepts": [
      [
        "Start with responsibilities, not logos",
        "A cloud data platform still needs storage, compute, identity, networking, orchestration, observability, and cost controls. Provider product names differ, but these responsibilities remain recognizable."
      ],
      [
        "Managed services trade control for operations",
        "Managed services can reduce infrastructure work such as provisioning, patching, scaling, and failover, but they introduce provider-specific limits, pricing models, and operational conventions."
      ],
      [
        "Separate the data path from the control path",
        "The data path moves and transforms records. The control path schedules work, grants permissions, stores configuration, and reports health. Mixing these concerns makes architectures harder to reason about."
      ]
    ],
    "flow": [
      "Source systems",
      "Cloud storage",
      "Processing",
      "Analytics store",
      "Consumers"
    ],
    "example": {
      "code": "Responsibility      AWS examples        Google Cloud examples   Azure examples\nStorage             S3                  Cloud Storage            ADLS / Blob Storage\nWarehouse           Redshift            BigQuery                 Fabric Warehouse / Synapse\nStreaming           Kinesis             Pub/Sub                  Event Hubs\nOrchestration       MWAA / Step Fn       Cloud Composer           Data Factory",
      "output": "Mental model: map each service to a responsibility before comparing product details.",
      "walkthrough": [
        "Identify what the system must do: store, process, secure, schedule, and serve data.",
        "Map provider services only after the responsibility is clear.",
        "Expect overlap: a provider can offer several valid services for the same responsibility."
      ]
    },
    "practice": {
      "task": "A team needs durable raw storage, daily batch transformations, a SQL analytics layer, and scheduled execution. Name the four responsibilities before choosing any cloud products.",
      "hint": "Think storage, compute/processing, analytics serving, and orchestration.",
      "solution": "1. Durable object storage / data lake\n2. Batch compute or managed transformation engine\n3. Cloud warehouse or lakehouse query layer\n4. Orchestration / scheduling",
      "output": "A valid design starts from responsibilities; provider products can be selected afterward."
    },
    "interview": [
      {
        "question": "How do you compare cloud platforms for data engineering?",
        "answer": "Compare capabilities by responsibility: storage, compute, warehouse/lakehouse, streaming, orchestration, security, networking, reliability, observability, and cost. Then evaluate provider-specific trade-offs for the workload rather than treating product names as direct equivalents.",
        "followup": "Which workload details would most change your service choices?"
      },
      {
        "question": "Managed service versus self-managed software?",
        "answer": "A managed service can reduce operational work and provide integrated scaling or reliability features, while self-managed software can offer more control and portability. The choice depends on team skills, compliance, cost, performance, and platform constraints.",
        "followup": "What operational work disappears—and what new dependencies appear—with a managed service?"
      }
    ],
    "mistakes": [
      {
        "title": "Choosing a provider from a feature checklist alone",
        "why": "The same feature can behave differently under real scale, networking, security, and cost constraints.",
        "better": "Start from workload requirements and operational constraints, then compare service behavior.",
        "before": "Pick cloud X because it lists more services.",
        "after": "Define SLA, scale, latency, skills, security, and cost constraints first."
      },
      {
        "title": "Assuming similarly named services are identical",
        "why": "APIs, scaling behavior, pricing, quotas, consistency, and integration patterns differ.",
        "better": "Compare responsibility and behavior, not marketing categories.",
        "before": "Service A = Service B in every way",
        "after": "Compare storage semantics, execution model, limits, integrations, and cost."
      }
    ],
    "quiz": [
      {
        "question": "What should come before choosing provider products?",
        "options": [
          "Workload responsibilities and constraints",
          "Logo preference",
          "The longest service catalog"
        ],
        "correct": 0,
        "explanation": "Architecture choices are easier to reason about when requirements are explicit first."
      },
      {
        "question": "What does the control path mainly handle?",
        "options": [
          "Scheduling, permissions, configuration, and health",
          "Only row storage",
          "Only dashboard colors"
        ],
        "correct": 0,
        "explanation": "The control path coordinates and governs the data work rather than being the data itself."
      },
      {
        "question": "Are cloud services always one-to-one equivalents across providers?",
        "options": [
          "No",
          "Yes",
          "Only for storage"
        ],
        "correct": 0,
        "explanation": "Products overlap in purpose but can differ substantially in execution and operational behavior."
      }
    ]
  },
  {
    "id": "object-storage",
    "title": "Object Storage & Data Lakes",
    "minutes": 25,
    "description": "Understand why object storage is the foundation of many cloud data lakes and how layout, formats, lifecycle rules, and small files affect real workloads.",
    "concepts": [
      [
        "Object storage is durable shared storage",
        "Services such as Amazon S3, Google Cloud Storage, and Azure Data Lake Storage/Blob Storage store objects rather than traditional database pages. They are commonly used for raw, staged, and curated data zones."
      ],
      [
        "File format matters",
        "Columnar formats such as Parquet can reduce scan volume for analytics because engines can read selected columns and use metadata. Compression, partitioning, and schema choices should match access patterns."
      ],
      [
        "Layout affects both performance and operations",
        "Too many tiny files increase metadata and scheduling overhead. Over-partitioning can create sparse directories and inefficient scans. Lifecycle policies can move or expire objects according to retention rules."
      ]
    ],
    "flow": [
      "Landing zone",
      "Validated files",
      "Curated tables",
      "Query engines"
    ],
    "example": {
      "code": "s3://company-data/raw/orders/dt=2026-09-20/part-000.parquet\ngs://company-data/curated/orders/order_date=2026-09-20/part-000.parquet\nabfss://curated@account.dfs.core.windows.net/orders/order_date=2026-09-20/part-000.parquet",
      "output": "The URI syntax changes by provider; the design idea is the same: durable objects organized for downstream processing.",
      "walkthrough": [
        "Raw zones preserve incoming data with minimal mutation.",
        "Curated zones use validated schemas and analytics-friendly formats.",
        "Partition folders should reflect common filters, but only when they produce useful pruning without excessive fragmentation."
      ]
    },
    "practice": {
      "task": "Design a folder layout for daily order events queried mostly by order_date and country. Avoid creating one folder per customer.",
      "hint": "Use low-to-moderate-cardinality columns that match frequent filters.",
      "solution": "curated/orders/order_date=2026-09-20/country=IN/part-*.parquet\ncurated/orders/order_date=2026-09-20/country=US/part-*.parquet",
      "output": "Reasoning: date and country can support pruning; customer_id would usually create excessive partition cardinality."
    },
    "interview": [
      {
        "question": "Why is object storage common in data lakes?",
        "answer": "It provides durable, scalable storage decoupled from compute and can hold many file formats at relatively low operational complexity. Multiple engines can read the same data, though governance and table semantics still need to be designed.",
        "followup": "What problems appear if every job writes thousands of tiny files?"
      },
      {
        "question": "How do you choose partition columns in a data lake?",
        "answer": "Use columns frequently used for pruning that have suitable cardinality and distribution. Avoid partitions so fine-grained that they create many tiny directories or files.",
        "followup": "Would you partition a billion-row table by customer_id?"
      }
    ],
    "mistakes": [
      {
        "title": "Partitioning by a very high-cardinality key",
        "why": "It can create a huge number of small directories/files and poor write/read efficiency.",
        "better": "Partition by common filters with manageable cardinality; rely on file statistics or table features for finer pruning.",
        "before": "orders/customer_id=123456789/...",
        "after": "orders/order_date=2026-09-20/country=IN/..."
      },
      {
        "title": "Using CSV for every analytics layer",
        "why": "Text formats lack efficient column pruning and richer type metadata compared with columnar formats.",
        "better": "Keep raw formats when needed, but use analytics-friendly columnar formats for repeated analytical scans.",
        "before": "curated/orders/*.csv",
        "after": "curated/orders/*.parquet"
      }
    ],
    "quiz": [
      {
        "question": "Which format is commonly used for columnar analytics?",
        "options": [
          "Parquet",
          "Plain TXT only",
          "PNG"
        ],
        "correct": 0,
        "explanation": "Parquet stores columnar data with metadata that analytical engines can use."
      },
      {
        "question": "What is a common small-file problem?",
        "options": [
          "More metadata and task overhead",
          "Objects become relational tables automatically",
          "Encryption stops working"
        ],
        "correct": 0,
        "explanation": "Large numbers of tiny files increase planning, metadata, and execution overhead."
      },
      {
        "question": "What makes a good partition key?",
        "options": [
          "Frequent filter use with manageable cardinality",
          "The highest-cardinality column available",
          "A random UUID"
        ],
        "correct": 0,
        "explanation": "Useful partitions enable pruning without exploding the file layout."
      }
    ]
  },
  {
    "id": "identity-security",
    "title": "Identity, Security & Secrets",
    "minutes": 25,
    "description": "Apply least privilege, encryption, secret management, and separation of duties to cloud data workloads.",
    "concepts": [
      [
        "Identity is the first control plane",
        "Cloud permissions are usually attached to users, roles, service identities, groups, or workload identities. Data jobs should receive only the actions and resources they require."
      ],
      [
        "Encrypt in transit and at rest",
        "Major cloud services commonly support transport encryption and storage encryption, but key ownership, rotation, and policy enforcement still require deliberate configuration."
      ],
      [
        "Secrets should not live in code",
        "Passwords, API keys, and tokens belong in managed secret stores or workload identity flows rather than repositories, notebooks, or plain environment files committed to source control."
      ]
    ],
    "flow": [
      "Workload identity",
      "Policy check",
      "Authorized resource",
      "Audit trail"
    ],
    "example": {
      "code": "# Principle, not provider-specific syntax\nETL role:\n  allow: read raw/orders/*\n  allow: write curated/orders/*\n  deny: delete raw/*\n  no access: payroll/*",
      "output": "Least-privilege result: the job can perform its required data path without broad account-wide permissions.",
      "walkthrough": [
        "Grant permissions to a workload identity rather than embedding long-lived user credentials.",
        "Scope access to required actions and resources.",
        "Use audit logs to trace sensitive access and investigate unexpected behavior."
      ]
    },
    "practice": {
      "task": "A batch job reads raw orders, writes curated orders, and reads one database credential. List the minimum categories of access it needs.",
      "hint": "Separate storage permissions from secret access.",
      "solution": "- Read access to raw order objects\n- Write access to curated order objects\n- Read access to the specific database secret\n- Network access to the required database endpoint\n- Logging/metrics permissions if the platform requires explicit grants",
      "output": "Do not grant account-wide storage admin or secret-admin permissions to the job."
    },
    "interview": [
      {
        "question": "What does least privilege mean for a data pipeline?",
        "answer": "Grant the pipeline identity only the operations and resources required for its tasks, with narrower scope for sensitive actions such as deletion or secret access. Review permissions as responsibilities change.",
        "followup": "How would you avoid long-lived credentials for a cloud-native job?"
      },
      {
        "question": "Encryption versus access control?",
        "answer": "Encryption protects data confidentiality at rest or in transit, while access control determines who or what can use the resource. Strong systems use both rather than treating one as a replacement for the other.",
        "followup": "Why can an encrypted bucket still be insecure?"
      }
    ],
    "mistakes": [
      {
        "title": "Using one admin identity for every pipeline",
        "why": "A compromise or bug can affect unrelated datasets and makes audit trails less meaningful.",
        "better": "Use separate workload identities with narrow permissions and clear ownership.",
        "before": "All jobs use data-platform-admin",
        "after": "orders-etl-role → only orders resources"
      },
      {
        "title": "Committing secrets to Git",
        "why": "Repository history can preserve credentials even after later edits.",
        "better": "Use managed secret storage or workload identity and rotate any exposed credential.",
        "before": "DB_PASSWORD=prod-secret",
        "after": "read credential from managed secret service at runtime"
      }
    ],
    "quiz": [
      {
        "question": "What is least privilege?",
        "options": [
          "Grant only required access",
          "Grant admin to simplify setup",
          "Share one account across teams"
        ],
        "correct": 0,
        "explanation": "Permissions should be limited to the actions and resources the workload actually needs."
      },
      {
        "question": "Where should long-lived secrets be avoided?",
        "options": [
          "Source code and committed config",
          "Managed secret stores",
          "Short-lived identity flows"
        ],
        "correct": 0,
        "explanation": "Secrets in code are difficult to control and rotate safely."
      },
      {
        "question": "Does encryption replace authorization?",
        "options": [
          "No",
          "Yes",
          "Only for object storage"
        ],
        "correct": 0,
        "explanation": "Encryption and access control protect different aspects of the system."
      }
    ]
  },
  {
    "id": "compute-serverless",
    "title": "Compute: VMs, Containers & Serverless",
    "minutes": 24,
    "description": "Choose an execution model based on workload duration, scaling, startup behavior, isolation, operational ownership, and cost.",
    "concepts": [
      [
        "Virtual machines maximize control",
        "VM-based workloads can customize operating systems, runtimes, and local resources, but the team owns more patching, sizing, scaling, and lifecycle management."
      ],
      [
        "Containers standardize packaging",
        "Containers make dependencies and runtime configuration portable across managed container services or Kubernetes, while the platform still needs scheduling, networking, and observability."
      ],
      [
        "Serverless favors event-driven and elastic work",
        "Serverless functions or managed serverless compute can remove server management and scale with demand, but runtime limits, cold starts, concurrency, state, and pricing models may not fit every data workload."
      ]
    ],
    "flow": [
      "Workload shape",
      "Execution model",
      "Autoscaling/runtime",
      "Result"
    ],
    "example": {
      "code": "Workload                          Likely starting point\n15-second file validation          Serverless function / event compute\n30-minute custom Python service    Managed container job\nLong-lived specialized daemon      VM or container service\nLarge distributed Spark batch      Managed Spark / distributed data service",
      "output": "Choose by workload behavior, not by assuming one compute model is always cheaper or simpler.",
      "walkthrough": [
        "Short event-triggered tasks can fit serverless execution.",
        "Custom dependencies and longer jobs often fit containers well.",
        "Distributed data processing is usually better served by engines designed for parallel data work than by manually coordinating many general-purpose functions."
      ]
    },
    "practice": {
      "task": "Classify these workloads: image metadata validation on upload, a nightly 40-minute Python enrichment job, and a multi-terabyte Spark aggregation.",
      "hint": "Match execution duration and scaling model to the runtime.",
      "solution": "Upload validation → serverless/event compute\n40-minute Python enrichment → managed container job or batch compute\nMulti-terabyte aggregation → managed Spark/distributed processing service",
      "output": "The exact cloud product can vary; the execution-model reasoning is the important part."
    },
    "interview": [
      {
        "question": "When would you avoid serverless functions for data processing?",
        "answer": "Avoid them when the workload exceeds runtime/resource limits, requires long-lived state, has heavy startup dependencies, needs specialized networking, or is better handled by a distributed data engine.",
        "followup": "Could serverless still trigger the larger job?"
      },
      {
        "question": "Containers versus VMs?",
        "answer": "Containers package an application and dependencies consistently while sharing a host kernel; VMs virtualize a fuller machine boundary. Managed container platforms reduce infrastructure work, while VMs offer lower-level control.",
        "followup": "Which operational concerns remain even with managed containers?"
      }
    ],
    "mistakes": [
      {
        "title": "Breaking a large batch into thousands of functions by default",
        "why": "Coordination, retries, limits, and data movement can become more complex than using a distributed engine.",
        "better": "Use serverless for suitable event/task granularity and a data engine for large distributed transformations.",
        "before": "1 TB Spark-style aggregation → thousands of ad hoc functions",
        "after": "event function → submit managed Spark/Dataflow-style job"
      },
      {
        "title": "Ignoring startup and dependency size",
        "why": "Large images or packages can increase cold-start and scheduling latency.",
        "better": "Keep runtime artifacts lean and choose an execution model whose startup profile fits the SLA.",
        "before": "Install gigabytes of dependencies at invocation",
        "after": "prebuild a right-sized image/runtime"
      }
    ],
    "quiz": [
      {
        "question": "Which model usually offers the most OS-level control?",
        "options": [
          "VMs",
          "Object storage",
          "SQL views"
        ],
        "correct": 0,
        "explanation": "VMs expose a fuller machine environment and therefore more operational responsibility."
      },
      {
        "question": "What is a container's main value?",
        "options": [
          "Consistent application packaging",
          "It replaces all networking",
          "It is automatically a data warehouse"
        ],
        "correct": 0,
        "explanation": "Containers package runtimes and dependencies consistently across environments."
      },
      {
        "question": "What can limit serverless fit?",
        "options": [
          "Runtime/resource constraints and startup behavior",
          "SQL syntax only",
          "File names"
        ],
        "correct": 0,
        "explanation": "Execution limits, state, concurrency, and startup characteristics matter."
      }
    ]
  },
  {
    "id": "managed-batch",
    "title": "Managed Batch & Spark Processing",
    "minutes": 28,
    "description": "Understand when to use managed distributed processing services and how storage, cluster lifecycle, scaling, and job boundaries affect batch pipelines.",
    "concepts": [
      [
        "Managed does not mean no design",
        "Services such as Amazon EMR, Google Cloud Dataproc, and managed Spark platforms reduce infrastructure work, but you still choose job sizing, storage layout, autoscaling, dependency packaging, and failure behavior."
      ],
      [
        "Decouple durable data from ephemeral compute",
        "A common cloud pattern keeps source and output data in object storage while compute clusters or jobs are created, scaled, and terminated independently."
      ],
      [
        "Short-lived job clusters can improve isolation",
        "Ephemeral job-scoped compute can reduce idle cost and configuration drift, while long-lived interactive clusters can improve startup time and exploration. The workload determines the trade-off."
      ]
    ],
    "flow": [
      "Object storage",
      "Managed batch/Spark job",
      "Shuffle/compute",
      "Curated output"
    ],
    "example": {
      "code": "raw/orders/*.parquet\n        ↓\nmanaged Spark job\n  - validate schema\n  - join customers\n  - aggregate daily metrics\n        ↓\ncurated/order_metrics/order_date=2026-09-20/",
      "output": "Durable data survives independently of the compute environment.",
      "walkthrough": [
        "The raw data stays in cloud object storage.",
        "The processing service reads, shuffles, and writes results using temporary compute resources.",
        "Outputs return to durable storage or an analytics system, so the processing environment can be replaced safely."
      ]
    },
    "practice": {
      "task": "A nightly Spark job runs for 25 minutes and the cluster is otherwise idle. Propose a compute lifecycle.",
      "hint": "Separate job runtime from all-day cluster uptime.",
      "solution": "Use job-scoped or ephemeral managed Spark compute: provision/submit → run → persist outputs/logs → terminate. Keep durable inputs/outputs outside the cluster.",
      "output": "Goal: reduce idle compute while preserving reproducible dependencies and logs."
    },
    "interview": [
      {
        "question": "Why separate object storage from Spark compute?",
        "answer": "Durable storage can persist independently while compute scales or is replaced. This reduces coupling, supports ephemeral processing, and lets multiple engines access the same data.",
        "followup": "What still needs to be considered for shuffle and local temporary storage?"
      },
      {
        "question": "Ephemeral versus long-lived clusters?",
        "answer": "Ephemeral clusters improve isolation and can reduce idle cost, but add startup time. Long-lived clusters can improve interactive latency but require stronger lifecycle, patching, concurrency, and cost controls.",
        "followup": "Which would you choose for a predictable nightly batch?"
      }
    ],
    "mistakes": [
      {
        "title": "Leaving large clusters running after the job",
        "why": "Idle resources create cost without processing value.",
        "better": "Use auto-termination, job-scoped compute, or carefully managed shared clusters.",
        "before": "Cluster runs 24/7 for a 25-minute batch",
        "after": "Create/run/terminate or auto-stop"
      },
      {
        "title": "Storing only on cluster-local disks",
        "why": "Ephemeral compute can be terminated or replaced, losing data that was not persisted externally.",
        "better": "Keep source, checkpoints where appropriate, and final outputs in durable cloud storage.",
        "before": "final output only on worker disk",
        "after": "write final output to durable object storage/warehouse"
      }
    ],
    "quiz": [
      {
        "question": "What commonly enables ephemeral Spark clusters?",
        "options": [
          "Durable external storage",
          "Keeping the only copy on worker disks",
          "Disabling logs"
        ],
        "correct": 0,
        "explanation": "External durable storage decouples data from replaceable compute."
      },
      {
        "question": "What is a main trade-off of ephemeral clusters?",
        "options": [
          "Less idle time but more startup latency",
          "They cannot run Spark",
          "They always cost more"
        ],
        "correct": 0,
        "explanation": "Job-scoped compute can reduce idle resources but has provisioning/startup overhead."
      },
      {
        "question": "Does managed Spark remove the need for data layout decisions?",
        "options": [
          "No",
          "Yes",
          "Only on weekends"
        ],
        "correct": 0,
        "explanation": "File size, partitioning, shuffle, dependencies, and job design still matter."
      }
    ]
  },
  {
    "id": "cloud-warehouses",
    "title": "Cloud Data Warehouses",
    "minutes": 28,
    "description": "Compare warehouse execution models, separate storage from compute where relevant, and design for concurrency, partitioning, clustering, and predictable analytics workloads.",
    "concepts": [
      [
        "Warehouses optimize analytical SQL",
        "Cloud warehouses are designed for scans, joins, aggregations, and concurrent analytical queries, with managed storage/compute patterns that differ by product."
      ],
      [
        "Architecture differs across products",
        "Amazon Redshift, Google BigQuery, Microsoft Fabric Warehouse, and Azure Synapse offerings do not share one execution model. Some emphasize provisioned capacity, some serverless consumption, and some support multiple modes."
      ],
      [
        "Data modeling still matters",
        "Column pruning, partitioning, clustering/sort strategies, statistics, and workload isolation can materially affect cost and performance even when infrastructure is managed."
      ]
    ],
    "flow": [
      "Curated data",
      "Warehouse load/external access",
      "SQL compute",
      "BI / analysts"
    ],
    "example": {
      "code": "-- Analytics pattern\nselect\n  order_date,\n  country,\n  sum(net_amount) as revenue\nfrom analytics.fct_orders\nwhere order_date >= date '2026-09-01'\ngroup by order_date, country;",
      "output": "The SQL pattern is portable; physical execution, storage layout, and billing behavior depend on the warehouse.",
      "walkthrough": [
        "Filter early on a date column when the platform can prune data.",
        "Aggregate only the columns required by consumers.",
        "Use the warehouse's native observability and query plan tools to understand scan volume and bottlenecks."
      ]
    },
    "practice": {
      "task": "A dashboard scans three years of orders but displays only the last 30 days. Identify the first optimization question you would ask.",
      "hint": "Focus on whether the engine can avoid scanning irrelevant history.",
      "solution": "Check whether the table layout and query predicate allow partition/date pruning (or the platform's equivalent) so only the required date range is scanned.",
      "output": "Then inspect query plans, clustering/sort strategy, concurrency, materialization, and workload-specific platform controls."
    },
    "interview": [
      {
        "question": "How do cloud warehouses differ from traditional self-managed databases?",
        "answer": "They typically provide managed infrastructure, analytical execution, integrated scaling or elasticity features, and cloud-native storage/operations. Exact separation of storage and compute, scaling, and pricing varies by product.",
        "followup": "Why should you avoid saying every cloud warehouse is serverless?"
      },
      {
        "question": "How would you reduce warehouse query cost?",
        "answer": "Reduce unnecessary scans and computation: select needed columns, filter effectively, use platform-appropriate partitioning/clustering, precompute repeated expensive logic when justified, and manage concurrency/capacity based on workload.",
        "followup": "When can materialized aggregates help?"
      }
    ],
    "mistakes": [
      {
        "title": "Using SELECT * in repeated BI queries",
        "why": "It can scan and transfer columns the dashboard never uses.",
        "better": "Select required columns and design curated models for consumer access patterns.",
        "before": "select * from fct_orders",
        "after": "select order_date, country, net_amount from fct_orders"
      },
      {
        "title": "Assuming warehouse tuning is provider-neutral",
        "why": "Partitioning, clustering, sort keys, distribution, caching, and capacity controls vary.",
        "better": "Keep the logical principles portable while validating physical tuning in provider documentation.",
        "before": "Apply one Redshift rule to BigQuery and Fabric unchanged",
        "after": "Map the goal—pruning, locality, concurrency—to provider-specific controls"
      }
    ],
    "quiz": [
      {
        "question": "What workload are cloud warehouses primarily optimized for?",
        "options": [
          "Analytical SQL",
          "Hosting image files only",
          "Operating-system patching"
        ],
        "correct": 0,
        "explanation": "Warehouses focus on analytical scans, joins, aggregations, and BI workloads."
      },
      {
        "question": "Do all cloud warehouses have the same execution model?",
        "options": [
          "No",
          "Yes",
          "Only if SQL is ANSI"
        ],
        "correct": 0,
        "explanation": "The SQL surface can look similar while storage, compute, scaling, and billing differ."
      },
      {
        "question": "What can reduce unnecessary scan cost?",
        "options": [
          "Effective pruning and selecting needed columns",
          "Adding unused columns",
          "Removing filters"
        ],
        "correct": 0,
        "explanation": "Reading less data is often a direct path to lower analytical cost."
      }
    ]
  },
  {
    "id": "lakehouse",
    "title": "Lakehouse & Open Table Formats",
    "minutes": 28,
    "description": "Understand why table formats add transactions, metadata, schema management, and table semantics on top of object storage.",
    "concepts": [
      [
        "Files alone are not a table protocol",
        "A directory of Parquet files can hold analytics data, but concurrent writes, schema evolution, snapshots, deletes, and reliable table state need additional metadata and coordination."
      ],
      [
        "Table formats add a metadata layer",
        "Formats such as Apache Iceberg, Delta Lake, and Apache Hudi maintain table metadata and versioning semantics on top of object storage. Feature details differ by format and engine."
      ],
      [
        "Engine interoperability needs verification",
        "Using an open format can improve portability, but readers/writers must support the same features and protocol versions. Catalog integration, locking/commit behavior, and advanced features still matter."
      ]
    ],
    "flow": [
      "Object files",
      "Table metadata",
      "Query/processing engines",
      "Consistent table view"
    ],
    "example": {
      "code": "Object storage:\n  data/part-000.parquet\n  data/part-001.parquet\n  metadata/... snapshots/manifests/logs ...\n\nEngines → table catalog/metadata → current valid file set",
      "output": "Readers use table metadata to understand which files belong to a consistent table snapshot.",
      "walkthrough": [
        "Data files hold the records.",
        "Metadata tracks table state and versions.",
        "Compatible engines consult metadata rather than treating every object in a folder as current table data."
      ]
    },
    "practice": {
      "task": "Explain why deleting a Parquet file manually from a managed lakehouse table is risky.",
      "hint": "The table metadata may still reference that file.",
      "solution": "The table's metadata/catalog can still consider the file part of a valid snapshot. Manual object deletion bypasses table commit semantics and can corrupt reads or historical snapshots. Use table-aware operations and maintenance commands.",
      "output": "Key idea: manage the dataset through the table protocol, not arbitrary file operations."
    },
    "interview": [
      {
        "question": "What does a lakehouse table format add to object storage?",
        "answer": "It adds metadata and table semantics such as snapshots/transactions, schema evolution controls, partition metadata, and reliable file-set management. Exact capabilities vary across Iceberg, Delta Lake, and Hudi.",
        "followup": "Why is a catalog important?"
      },
      {
        "question": "Does an open table format guarantee full multi-engine compatibility?",
        "answer": "No. Engines can support different subsets or protocol versions. Verify read/write support for the features you depend on before assuming interchangeability.",
        "followup": "Which advanced features are most likely to expose compatibility gaps?"
      }
    ],
    "mistakes": [
      {
        "title": "Treating table-managed files as ordinary folders",
        "why": "Manual moves/deletes can diverge from the table metadata and corrupt logical state.",
        "better": "Use table-aware writes, deletes, compaction, and expiration procedures.",
        "before": "rm object://lake/orders/data/part-000.parquet",
        "after": "execute supported table delete/maintenance operation"
      },
      {
        "title": "Assuming every engine supports every table-format feature",
        "why": "Support can vary by version, connector, catalog, and read/write capability.",
        "better": "Test the exact engine/format/version combination used in production.",
        "before": "Open format = every feature works everywhere",
        "after": "Verify snapshots, deletes, schema evolution, writes, and catalog integration"
      }
    ],
    "quiz": [
      {
        "question": "What does a table format primarily add?",
        "options": [
          "Metadata and table semantics over files",
          "A new physical disk",
          "A dashboard theme"
        ],
        "correct": 0,
        "explanation": "The format coordinates table state, snapshots, schema, and file membership."
      },
      {
        "question": "Should you manually delete data files from a managed table?",
        "options": [
          "Usually no",
          "Always yes",
          "Only if the file is large"
        ],
        "correct": 0,
        "explanation": "Bypassing table metadata can break table consistency or snapshots."
      },
      {
        "question": "Does open format mean universal feature compatibility?",
        "options": [
          "No",
          "Yes",
          "Only for Parquet"
        ],
        "correct": 0,
        "explanation": "Engine/version support still needs verification."
      }
    ]
  },
  {
    "id": "streaming",
    "title": "Streaming & Messaging",
    "minutes": 28,
    "description": "Design cloud event pipelines around partitions, ordering scope, retention, consumer scaling, delivery semantics, and recovery.",
    "concepts": [
      [
        "Messaging decouples producers and consumers",
        "Managed services such as Amazon Kinesis, Google Cloud Pub/Sub, and Azure Event Hubs buffer event streams so producers and consumers can scale or fail independently within service limits."
      ],
      [
        "Ordering is usually scoped",
        "Many distributed messaging systems preserve order only within a partition, shard, key, or ordering domain—not as one global stream. Partitioning strategy affects both parallelism and ordering."
      ],
      [
        "Delivery semantics require end-to-end reasoning",
        "At-least-once delivery can produce duplicates, so consumers often need idempotent writes or deduplication. Exactly-once claims are usually scoped to specific services, APIs, or processing paths."
      ]
    ],
    "flow": [
      "Producers",
      "Managed stream",
      "Consumer group",
      "Stream processor",
      "Sink"
    ],
    "example": {
      "code": "order_id=42, status=created   ─┐\norder_id=42, status=paid      ─┼─ key/order partition → ordered consumer path\norder_id=99, status=created   ─┘\n\nDifferent keys may be processed in parallel.",
      "output": "Partition/key design balances per-key ordering needs with throughput.",
      "walkthrough": [
        "Use a stable business key when related events must stay in the same ordering scope.",
        "Scale consumers across partitions/shards where the service allows.",
        "Make sink writes resilient to retries and duplicate delivery."
      ]
    },
    "practice": {
      "task": "A payment consumer occasionally receives the same event twice after retry. Describe one safe sink strategy.",
      "hint": "Use a stable event or business key and make writes idempotent.",
      "solution": "Store/process with an idempotency key such as event_id or (payment_id, version). Use an upsert/conditional write or deduplication record so replaying the same event does not create a second payment effect.",
      "output": "Retries remain safe even under at-least-once delivery."
    },
    "interview": [
      {
        "question": "How do you scale a cloud streaming consumer?",
        "answer": "Increase consumer parallelism within the stream's partition/shard model, ensure enough partitions for the desired concurrency, and watch lag, throughput, throttling, processing time, and sink capacity.",
        "followup": "Why can't consumers always scale past the number of partitions?"
      },
      {
        "question": "How do you handle duplicate events?",
        "answer": "Design idempotent processing using stable event keys, deduplication state, conditional writes, or transactional mechanisms supported by the stack. Treat retry behavior as part of normal operation.",
        "followup": "Where should deduplication state live?"
      }
    ],
    "mistakes": [
      {
        "title": "Assuming global ordering across the stream",
        "why": "Distributed systems usually scope ordering to a partition/key or specific feature.",
        "better": "Define exactly which events must be ordered and key/partition accordingly.",
        "before": "All events are globally ordered",
        "after": "Orders for one order_id stay in one ordering scope"
      },
      {
        "title": "Treating consumer retries as exceptional",
        "why": "Retries and redelivery are normal in reliable distributed processing.",
        "better": "Make sink effects idempotent and monitor lag/dead-letter paths where available.",
        "before": "INSERT every delivery blindly",
        "after": "UPSERT/conditional write using stable event identity"
      }
    ],
    "quiz": [
      {
        "question": "What commonly limits consumer parallelism?",
        "options": [
          "Partition/shard count and service model",
          "Table column names",
          "Git tags"
        ],
        "correct": 0,
        "explanation": "Parallel consumers need independent stream partitions or equivalent capacity."
      },
      {
        "question": "What is a safe response to duplicate delivery?",
        "options": [
          "Idempotent processing",
          "Assume duplicates never occur",
          "Disable retries"
        ],
        "correct": 0,
        "explanation": "Reliable consumers should tolerate retries and repeated events."
      },
      {
        "question": "Is ordering usually global?",
        "options": [
          "No, usually scoped",
          "Always global",
          "Only in object storage"
        ],
        "correct": 0,
        "explanation": "Ordering is typically defined within a partition, key, or service-specific domain."
      }
    ]
  },
  {
    "id": "orchestration-integration",
    "title": "Orchestration & Managed Data Integration",
    "minutes": 26,
    "description": "Coordinate cloud jobs, retries, dependencies, schedules, and managed integrations without turning orchestration into transformation logic.",
    "concepts": [
      [
        "Orchestration coordinates work",
        "Managed Airflow services, workflow engines, and data-integration services can schedule tasks, express dependencies, retry failures, and record run state."
      ],
      [
        "Keep transformations in the right engine",
        "An orchestrator should trigger Spark, dbt, SQL, container, or API work rather than embedding every transformation inside orchestration code."
      ],
      [
        "Managed connectors reduce custom code but add contracts",
        "Services such as AWS Glue integrations, Google Cloud Dataflow/connectors, and Azure Data Factory/Fabric Data Factory can accelerate ingestion or movement, but schema behavior, retries, rate limits, and incremental semantics still need verification."
      ]
    ],
    "flow": [
      "Schedule/event",
      "Orchestrator",
      "Data task(s)",
      "Quality check",
      "Publish"
    ],
    "example": {
      "code": "daily_orders DAG\n  ingest_orders\n       ↓\n  build_staging\n       ↓\n  dbt_build_marts\n       ↓\n  quality_gate\n       ↓\n  publish_dashboard_refresh",
      "output": "The orchestrator coordinates task state; each data engine owns its transformation logic.",
      "walkthrough": [
        "Express dependencies explicitly so downstream work waits for successful prerequisites.",
        "Retry idempotent tasks safely and route persistent failures to alerting.",
        "Pass references and metadata between tasks rather than moving large datasets through the orchestrator itself."
      ]
    },
    "practice": {
      "task": "A pipeline copies source data, runs Spark, then dbt, then checks row-count freshness. Which responsibilities belong to orchestration?",
      "hint": "Think scheduling, dependency state, retries, and triggering—not row-by-row transformation.",
      "solution": "Orchestration owns the schedule/event trigger, task dependency order, retries/timeouts, run state, and alerts. Spark owns distributed transformation, dbt owns warehouse modeling/tests, and the storage/warehouse systems hold data.",
      "output": "Keep data movement through systems designed for data, not through the orchestrator's metadata channel."
    },
    "interview": [
      {
        "question": "Why not put all transformation logic in Airflow or a workflow engine?",
        "answer": "Orchestrators are best at coordination and state. Data transformations belong in engines designed for SQL, Spark, dbt, streaming, or application processing, which improves maintainability and observability.",
        "followup": "What information should an orchestrator pass between tasks?"
      },
      {
        "question": "When are managed data-integration services useful?",
        "answer": "They can reduce custom connector, scheduling, and infrastructure work for common sources/sinks. Evaluate schema handling, throughput, incremental behavior, retry semantics, network connectivity, and pricing before relying on them.",
        "followup": "When would you build a custom connector instead?"
      }
    ],
    "mistakes": [
      {
        "title": "Passing large datasets through orchestration metadata",
        "why": "Schedulers and metadata databases are not designed to carry bulk data.",
        "better": "Pass storage locations, table names, run IDs, or small metadata; keep bulk data in storage/processing systems.",
        "before": "task output = millions of rows",
        "after": "task output = object URI / table identifier"
      },
      {
        "title": "Retrying non-idempotent tasks blindly",
        "why": "A retry can duplicate side effects such as inserts, notifications, or external API actions.",
        "better": "Design retry-safe operations or use explicit deduplication/transaction guards.",
        "before": "append rows on every retry",
        "after": "upsert by run/business key or stage then commit"
      }
    ],
    "quiz": [
      {
        "question": "What is orchestration primarily for?",
        "options": [
          "Coordinating task dependencies and state",
          "Storing all raw data",
          "Replacing every transformation engine"
        ],
        "correct": 0,
        "explanation": "Orchestration controls when and how tasks run rather than being the data-processing engine for every task."
      },
      {
        "question": "What should flow between orchestrated tasks when possible?",
        "options": [
          "References and small metadata",
          "Entire multi-terabyte datasets",
          "Admin passwords"
        ],
        "correct": 0,
        "explanation": "Bulk data should remain in systems designed for storage and processing."
      },
      {
        "question": "What must be considered before enabling retries?",
        "options": [
          "Idempotency and side effects",
          "Dashboard font",
          "Repository name"
        ],
        "correct": 0,
        "explanation": "Repeated execution must not accidentally duplicate business effects."
      }
    ]
  },
  {
    "id": "networking-reliability",
    "title": "Networking, Reliability & Observability",
    "minutes": 30,
    "description": "Connect private data services safely, design for failure domains, and monitor pipelines with metrics, logs, traces, lineage, and data-quality signals.",
    "concepts": [
      [
        "Networks define reachability",
        "Private subnets/VPCs/VNets, routing, firewalls/security groups, private endpoints, DNS, and egress controls determine which data services can communicate."
      ],
      [
        "Availability and recovery are different goals",
        "High availability reduces interruption within supported failure scenarios; disaster recovery plans restore service after larger incidents. Multi-zone and multi-region strategies have different cost and complexity."
      ],
      [
        "Observe both systems and data",
        "Infrastructure metrics alone cannot tell you that a pipeline wrote zero valid rows. Combine task health, latency, throughput, cost, data freshness, volume, schema, and quality checks."
      ]
    ],
    "flow": [
      "Private network",
      "Data services",
      "Metrics/logs",
      "Alerts",
      "Recovery action"
    ],
    "example": {
      "code": "Pipeline SLO signals:\n- orchestration success/failure\n- processing duration\n- streaming lag\n- rows/files processed\n- data freshness timestamp\n- schema/test failures\n- warehouse query errors\n- cost anomaly",
      "output": "Operational health + data health together provide a more complete picture.",
      "walkthrough": [
        "Network failures can look like application timeouts, so connectivity must be observable.",
        "Use service-native logs/metrics plus pipeline-level run metadata.",
        "Alert on symptoms tied to user/business impact rather than every low-level metric change."
      ]
    },
    "practice": {
      "task": "A warehouse is healthy, but today's dashboard is empty. List three signals that could have caught the problem earlier.",
      "hint": "Look beyond CPU and service uptime.",
      "solution": "Examples:\n- freshness check shows no new curated partition\n- row-count/volume check drops to zero\n- orchestration run failed or skipped upstream task\n- source ingestion lag increased\n- dbt/data-quality test failed",
      "output": "System availability does not guarantee correct or fresh data."
    },
    "interview": [
      {
        "question": "High availability versus disaster recovery?",
        "answer": "High availability aims to keep service running through expected component/failure-zone problems, while disaster recovery defines how to restore service and data after larger failures. RTO and RPO guide the recovery design.",
        "followup": "What would justify multi-region data replication?"
      },
      {
        "question": "What would you monitor in a data platform?",
        "answer": "Task failures and duration, resource/throughput limits, stream lag, storage/warehouse errors, data freshness, volume, schema and quality checks, cost, and end-to-end SLA indicators.",
        "followup": "Which signals would page someone immediately versus create a ticket?"
      }
    ],
    "mistakes": [
      {
        "title": "Monitoring only infrastructure uptime",
        "why": "A pipeline can be 'up' while producing stale, empty, or invalid data.",
        "better": "Add freshness, volume, schema, and quality signals tied to data outcomes.",
        "before": "CPU healthy = pipeline healthy",
        "after": "system metrics + run state + data-quality/freshness checks"
      },
      {
        "title": "Making everything multi-region by default",
        "why": "Cross-region architectures add replication, consistency, operational, and cost complexity.",
        "better": "Use business RTO/RPO and failure requirements to justify resilience levels.",
        "before": "multi-region for every dev table",
        "after": "match resilience to criticality and recovery objectives"
      }
    ],
    "quiz": [
      {
        "question": "What does RPO describe?",
        "options": [
          "Acceptable data-loss window",
          "CPU count",
          "Query syntax"
        ],
        "correct": 0,
        "explanation": "Recovery Point Objective describes how much data loss is acceptable after a disruption."
      },
      {
        "question": "What does RTO describe?",
        "options": [
          "Target time to restore service",
          "Row-transfer object",
          "Retention tier only"
        ],
        "correct": 0,
        "explanation": "Recovery Time Objective is the target duration to restore acceptable service."
      },
      {
        "question": "Can green infrastructure metrics guarantee fresh data?",
        "options": [
          "No",
          "Yes",
          "Only in warehouses"
        ],
        "correct": 0,
        "explanation": "Data freshness and correctness need their own signals."
      }
    ]
  },
  {
    "id": "cost-architecture-review",
    "title": "Cost Optimization & Architecture Review",
    "minutes": 35,
    "description": "Design a complete cloud data pipeline and reason about cost using workload shape, data scanned, compute time, storage tiers, network movement, and operational effort.",
    "concepts": [
      [
        "Cost follows architecture decisions",
        "Major cost drivers can include compute duration/capacity, bytes scanned or processed, storage volume/tier, requests, streaming throughput, data transfer, managed-service premiums, and idle resources."
      ],
      [
        "Optimize useful work, not only unit price",
        "Reducing unnecessary scans, terminating idle clusters, compacting small files, right-sizing retention, and avoiding accidental cross-region transfer can matter more than chasing a cheaper instance type."
      ],
      [
        "A good design explains trade-offs",
        "Interview-ready architecture connects source → ingestion → storage → processing → serving → orchestration → security → observability and explains why each choice matches requirements."
      ]
    ],
    "flow": [
      "Ingest",
      "Store",
      "Process",
      "Serve",
      "Observe & optimize"
    ],
    "example": {
      "code": "E-commerce analytics\nApps/DBs\n   ↓ batch + events\nObject storage / managed stream\n   ↓\nSpark / managed transforms\n   ↓\nLakehouse tables + cloud warehouse\n   ↓\nBI / data products\n\nControl: IAM • orchestration • quality • logs • budgets",
      "output": "Review every arrow for scale, latency, security, retry behavior, recovery, and cost.",
      "walkthrough": [
        "Land raw data durably before expensive transformation where replayability matters.",
        "Use batch or streaming based on freshness requirements rather than fashion.",
        "Serve curated data through the warehouse/lakehouse layer best suited to consumer latency, concurrency, and governance needs."
      ]
    },
    "practice": {
      "task": "Design a cloud pipeline for 500 GB/day of order data: hourly dashboard freshness, 90-day raw retention, daily backfills, and strict separation between raw and analyst access. Describe components by responsibility, not vendor.",
      "hint": "Include ingestion, durable storage, processing, serving, orchestration, identity, observability, and cost controls.",
      "solution": "- Ingestion: batch/hourly connectors or event stream based on source capability\n- Raw storage: object storage with 90-day lifecycle and restricted writer/reader roles\n- Processing: managed distributed batch every hour; replayable from raw\n- Curated storage: columnar lakehouse or warehouse staging\n- Serving: cloud warehouse/lakehouse SQL for dashboards\n- Orchestration: hourly DAG with retries and data-quality gates\n- Security: separate workload identities; analysts read curated only\n- Observability: run state, freshness, volume, failures, cost alerts\n- Cost: auto-terminate compute, prune scans, compact files, lifecycle old raw data",
      "output": "A strong answer ties each component to the workload's freshness, replay, access, and cost requirements."
    },
    "interview": [
      {
        "question": "How would you reduce cloud data-platform cost without hurting reliability?",
        "answer": "Measure the major drivers first, then reduce waste: idle compute, repeated full scans, tiny files, excessive retention, unnecessary cross-region transfer, overprovisioned concurrency, or redundant pipelines. Preserve recovery paths, quality checks, and required SLAs.",
        "followup": "Which cost metric would you inspect first for a warehouse-heavy platform?"
      },
      {
        "question": "Design a cloud data platform for analytics.",
        "answer": "Start with requirements: sources, daily volume, freshness, consumers, SLA, security, recovery, and team skills. Then choose durable landing storage, processing, curated serving, orchestration, identity/networking, quality/observability, and cost controls. Explain failure and replay paths.",
        "followup": "How would the design change for sub-second operational analytics?"
      }
    ],
    "mistakes": [
      {
        "title": "Optimizing cost without measuring the driver",
        "why": "Reducing one rate can be irrelevant if scan volume, idle time, or data transfer dominates spend.",
        "better": "Attribute cost by workload/service and target the largest avoidable driver first.",
        "before": "Switch instance type without usage data",
        "after": "measure compute-hours, bytes scanned, storage, transfer, and idle capacity"
      },
      {
        "title": "Removing redundancy that protects recovery",
        "why": "A cheaper design can become fragile if it deletes raw replay data, backups, or quality controls required by the SLA.",
        "better": "Separate waste from deliberate resilience and retention.",
        "before": "delete raw immediately to save storage",
        "after": "retain raw according to recovery/compliance needs, then lifecycle it"
      }
    ],
    "quiz": [
      {
        "question": "What should cost optimization start with?",
        "options": [
          "Measured cost drivers",
          "Random service changes",
          "Deleting all retained data"
        ],
        "correct": 0,
        "explanation": "Attribution and workload measurements show where optimization can actually matter."
      },
      {
        "question": "Which is a common avoidable cost?",
        "options": [
          "Idle compute",
          "Documented recovery copies required by policy",
          "Required encryption"
        ],
        "correct": 0,
        "explanation": "Idle compute can often be stopped or right-sized without reducing workload value."
      },
      {
        "question": "What makes an architecture answer strong?",
        "options": [
          "Requirements, data flow, trade-offs, failure/recovery, security, and cost reasoning",
          "Listing every cloud product",
          "Choosing a provider without constraints"
        ],
        "correct": 0,
        "explanation": "A good architecture connects choices to the workload and its operational constraints."
      }
    ]
  }
];
