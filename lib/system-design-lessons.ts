import type { SparkLesson } from "@/lib/spark-lessons";

export const systemDesignLessons: SparkLesson[] = [
  {
    "id": "design-framework",
    "title": "System Design Framework",
    "minutes": 22,
    "description": "Use a repeatable interview framework: clarify requirements, estimate scale, draw the data path, choose components, then test reliability and trade-offs.",
    "concepts": [
      [
        "Start with the problem, not the stack",
        "Before naming Kafka, Spark, or a warehouse, clarify what the system must ingest, transform, store, serve, and guarantee. Good architecture follows requirements."
      ],
      [
        "Separate functional and non-functional requirements",
        "Functional requirements describe what the system does. Non-functional requirements describe latency, throughput, freshness, durability, availability, security, recovery, and cost constraints."
      ],
      [
        "Design in passes",
        "A strong interview flow is: requirements → rough scale → high-level data flow → critical component choices → failure/recovery → bottlenecks → trade-offs. This keeps the design coherent instead of becoming a list of technologies."
      ]
    ],
    "flow": [
      "Requirements",
      "Scale",
      "Data flow",
      "Components",
      "Failures & trade-offs"
    ],
    "example": {
      "code": "Prompt: Design an analytics pipeline for an e-commerce company.\n\nClarify:\n- sources: orders, customers, payments\n- volume: 50M order events/day\n- freshness: dashboards < 15 min behind\n- consumers: BI + analysts\n- retention: 2 years\n- recovery: replay last 7 days\n- security: PII restricted",
      "output": "The requirements already imply durable landing storage, incremental ingestion, scalable processing, governed serving, and replayability.",
      "walkthrough": [
        "Ask what data enters the system and who consumes the output.",
        "Quantify freshness, volume, retention, and recovery expectations.",
        "Only then choose ingestion, storage, processing, serving, and operational components."
      ]
    },
    "practice": {
      "task": "For 'Design a clickstream analytics platform', write five clarifying questions before choosing any technology.",
      "hint": "Cover scale, freshness, consumers, retention, and correctness/recovery.",
      "solution": "1. How many events per second at average and peak?\n2. How fresh must dashboards or downstream features be?\n3. Who consumes the data: BI, ML, APIs, or all three?\n4. How long must raw and curated data be retained?\n5. What delivery/correctness and replay requirements exist?",
      "output": "A useful clarification set turns a vague prompt into measurable constraints."
    },
    "interview": [
      {
        "question": "How do you structure a data system design interview?",
        "answer": "Clarify requirements first, estimate scale, sketch the end-to-end data path, choose components based on constraints, then discuss reliability, bottlenecks, security, observability, cost, and alternatives. Keep returning to the stated requirements.",
        "followup": "What would make you change from batch to streaming?"
      },
      {
        "question": "Why avoid naming technologies immediately?",
        "answer": "Because technology choices depend on workload constraints. Starting with products can lead to overbuilding or choosing components that do not match latency, scale, or operational needs.",
        "followup": "Which requirement usually has the biggest impact on architecture?"
      }
    ],
    "mistakes": [
      {
        "title": "Jumping straight to a favorite stack",
        "why": "The design becomes technology-led instead of requirement-led.",
        "better": "State the workload and constraints first, then justify every major component.",
        "before": "Use Kafka + Spark + Snowflake because that is a standard stack.",
        "after": "Need 10-minute freshness at 50M events/day → durable ingestion + incremental processing + analytical serving."
      },
      {
        "title": "Drawing boxes without explaining trade-offs",
        "why": "A diagram does not show why the choices satisfy reliability, scale, or cost goals.",
        "better": "For each major component, explain the requirement it addresses and one limitation.",
        "before": "Queue → Spark → Warehouse",
        "after": "Queue buffers bursts; Spark handles stateful transforms; warehouse serves BI concurrency; each choice has cost/latency trade-offs."
      }
    ],
    "quiz": [
      {
        "question": "What should come before selecting technologies?",
        "options": [
          "Clarified requirements",
          "A vendor logo",
          "A final schema"
        ],
        "correct": 0,
        "explanation": "Architecture choices should follow the workload's actual needs."
      },
      {
        "question": "Which is a non-functional requirement?",
        "options": [
          "Dashboard freshness under 15 minutes",
          "Create an orders table",
          "Load customer records"
        ],
        "correct": 0,
        "explanation": "Freshness is a quality/behavior constraint on the system."
      },
      {
        "question": "What is a useful final design step?",
        "options": [
          "Review failure modes and trade-offs",
          "Add more technologies",
          "Remove all assumptions"
        ],
        "correct": 0,
        "explanation": "Testing the design against failures and constraints reveals weak points."
      }
    ]
  },
  {
    "id": "scale-estimation",
    "title": "Requirements & Scale Estimation",
    "minutes": 26,
    "description": "Turn business traffic into rough throughput, storage, retention, and concurrency numbers that guide architecture choices.",
    "concepts": [
      [
        "Back-of-the-envelope numbers are enough",
        "System design rarely needs exact forecasts. Approximate events per second, bytes per event, daily volume, peak factor, retention, and query concurrency are enough to expose orders of magnitude."
      ],
      [
        "Peak matters more than average for capacity",
        "A system averaging 1,000 events/sec may need to survive 5,000/sec during bursts. Queues, partitions, worker concurrency, and downstream limits should consider peak behavior."
      ],
      [
        "Retention multiplies quickly",
        "Daily data volume × retention period gives a first-order storage estimate before compression, replication, indexes, metadata, and intermediate copies."
      ]
    ],
    "flow": [
      "Traffic assumptions",
      "Throughput",
      "Storage",
      "Peak capacity",
      "Architecture constraints"
    ],
    "example": {
      "code": "Given:\n100M events/day\n1 KB/event\n5× peak over average\n90-day raw retention\n\nAverage ≈ 1,157 events/sec\nPeak ≈ 5,800 events/sec\nRaw/day ≈ 100 GB\n90-day raw ≈ 9 TB before compression/replication",
      "output": "The system is not 'web-scale' just because 100M sounds large; the estimates show a manageable but meaningful streaming/batch workload.",
      "walkthrough": [
        "Convert daily events to per-second throughput.",
        "Multiply average throughput by a peak factor.",
        "Estimate raw storage from event size and retention, then discuss overhead separately."
      ]
    },
    "practice": {
      "task": "Estimate average events/sec and 30-day raw storage for 43.2M events/day at 2 KB/event.",
      "hint": "Divide by 86,400 seconds/day; multiply daily bytes by 30.",
      "solution": "Average = 43,200,000 / 86,400 ≈ 500 events/sec.\nDaily raw ≈ 86.4 GB using decimal units.\n30-day raw ≈ 2.59 TB before compression, replication, and metadata.",
      "output": "Use rough numbers and state your units/assumptions."
    },
    "interview": [
      {
        "question": "What numbers do you estimate in a data system design?",
        "answer": "Usually average and peak event rate, bytes per event, daily data volume, retention, state size, batch window, query concurrency, and expected read/write patterns. Only estimate what can change design choices.",
        "followup": "How would 20× peak bursts affect ingestion design?"
      },
      {
        "question": "Why does event size matter?",
        "answer": "Throughput in events/sec alone hides network, storage, serialization, and processing volume. Ten thousand 100-byte events and ten thousand 1-MB events are completely different workloads.",
        "followup": "What other payload properties can affect processing cost?"
      }
    ],
    "mistakes": [
      {
        "title": "Using only daily volume",
        "why": "Daily totals hide short burst windows that can overload producers, brokers, or sinks.",
        "better": "Estimate both average and peak rates and describe buffering behavior.",
        "before": "100M/day is all we need.",
        "after": "100M/day ≈ 1.2k/sec average; design for an explicit peak factor."
      },
      {
        "title": "Pretending estimates are exact",
        "why": "Input assumptions usually have uncertainty and future growth.",
        "better": "Use ranges, label assumptions, and identify which thresholds would trigger a redesign.",
        "before": "Peak is exactly 5,787 events/sec.",
        "after": "Plan for roughly 6k/sec now and test a 2× growth case."
      }
    ],
    "quiz": [
      {
        "question": "Why estimate peak throughput?",
        "options": [
          "To size burst handling and capacity",
          "To calculate table names",
          "To choose SQL aliases"
        ],
        "correct": 0,
        "explanation": "Peak traffic can determine partitioning, buffering, and worker capacity."
      },
      {
        "question": "What is a first-order retention estimate?",
        "options": [
          "Daily volume × retention days",
          "Peak events × column count",
          "Queries × dashboards"
        ],
        "correct": 0,
        "explanation": "It gives the approximate raw storage before overheads."
      },
      {
        "question": "Should estimates be presented as perfect predictions?",
        "options": [
          "No",
          "Yes",
          "Only for streaming"
        ],
        "correct": 0,
        "explanation": "They are decision-support approximations based on stated assumptions."
      }
    ]
  },
  {
    "id": "ingestion-design",
    "title": "Ingestion: Batch, CDC & Events",
    "minutes": 28,
    "description": "Choose how data enters the platform using scheduled extracts, change data capture, event streams, APIs, and durable landing zones.",
    "concepts": [
      [
        "Ingestion pattern follows source and freshness",
        "Scheduled batch is simple and efficient for periodic data. CDC captures database changes incrementally. Event ingestion fits systems that already emit business or telemetry events."
      ],
      [
        "Land raw data when replay matters",
        "A durable raw landing zone can decouple source availability from downstream processing and provide a replay path after transformation bugs or schema changes."
      ],
      [
        "Ingestion must handle duplicates and schema change",
        "Retries, CDC reconnects, producer behavior, and backfills can repeat records. Schemas evolve. The ingestion layer should preserve identifiers, timestamps, source metadata, and enough context for deterministic downstream handling."
      ]
    ],
    "flow": [
      "Sources",
      "Batch / CDC / events",
      "Durable buffer or landing",
      "Validated ingest",
      "Processing"
    ],
    "example": {
      "code": "Operational DB ──CDC──────┐\nApp events ─────stream────┼→ durable ingest → raw storage → processing\nSaaS API ─────hourly pull──┘",
      "output": "Different sources can use different ingestion modes while converging on common durable processing boundaries.",
      "walkthrough": [
        "Use CDC when database changes must be propagated incrementally without repeated full extracts.",
        "Use event streams when producers already emit domain events and low latency matters.",
        "Use batch pulls for sources where periodic freshness is sufficient and simpler operations are preferred."
      ]
    },
    "practice": {
      "task": "Choose an ingestion pattern for: a transactional Postgres orders table needing <5-minute freshness, a daily partner CSV, and mobile click events.",
      "hint": "Do not force one mechanism onto every source.",
      "solution": "Orders table → CDC.\nPartner CSV → scheduled batch landing.\nMobile clicks → event stream/managed messaging.\nAll three should preserve source metadata and support replay where required.",
      "output": "A mixed ingestion architecture is normal when source capabilities differ."
    },
    "interview": [
      {
        "question": "When would you choose CDC over periodic full extracts?",
        "answer": "When changes must arrive incrementally, source tables are large, freshness requirements are tighter, or repeated full scans are costly. CDC also introduces ordering, delete, schema, and recovery concerns that must be managed.",
        "followup": "How would you handle a CDC connector outage?"
      },
      {
        "question": "Why keep a raw landing zone?",
        "answer": "It can provide replayability, auditability, decoupling from downstream transforms, and a stable record of received source data. Retention should match recovery and compliance requirements.",
        "followup": "When might you intentionally avoid storing every raw event forever?"
      }
    ],
    "mistakes": [
      {
        "title": "Using full-table extracts for rapidly growing sources",
        "why": "Repeated scans can overload the source and move mostly unchanged data.",
        "better": "Use incremental keys, CDC, or source-native change feeds where appropriate.",
        "before": "SELECT * from orders every 5 minutes",
        "after": "capture changes since checkpoint / CDC position"
      },
      {
        "title": "Dropping source identifiers during ingest",
        "why": "Without stable IDs and source metadata, deduplication and replay become harder.",
        "better": "Preserve event/business key, source timestamp, ingestion timestamp, and source position where available.",
        "before": "store only transformed payload",
        "after": "store key + source metadata + payload"
      }
    ],
    "quiz": [
      {
        "question": "What fits a database requiring near-real-time change propagation?",
        "options": [
          "CDC",
          "Annual full dump",
          "Manual export"
        ],
        "correct": 0,
        "explanation": "CDC incrementally captures source changes."
      },
      {
        "question": "Why keep raw landing data?",
        "options": [
          "Replay and auditability",
          "To replace all curated models",
          "To avoid schemas forever"
        ],
        "correct": 0,
        "explanation": "Raw data can support recovery and reprocessing."
      },
      {
        "question": "What helps deduplication?",
        "options": [
          "Stable identifiers and source metadata",
          "Random file names only",
          "Dropping timestamps"
        ],
        "correct": 0,
        "explanation": "Stable event/business identities let downstream systems recognize repeated deliveries."
      }
    ]
  },
  {
    "id": "storage-modeling",
    "title": "Storage & Data Modeling Choices",
    "minutes": 30,
    "description": "Choose between operational databases, object storage, lakehouse tables, warehouses, and serving stores based on access patterns and guarantees.",
    "concepts": [
      [
        "One system rarely serves every workload well",
        "Operational writes, cheap durable history, large analytical scans, low-latency key lookups, and high-concurrency BI have different access patterns."
      ],
      [
        "Model for consumers and processing",
        "Raw data favors faithful source capture. Curated analytics favors stable schemas, facts/dimensions, or domain-oriented models. Serving layers may denormalize further for latency or product needs."
      ],
      [
        "Partitioning and keys are physical design decisions",
        "Logical schema describes meaning; partitioning, clustering, indexes, sort/distribution strategies, and file layout affect how much work the system performs."
      ]
    ],
    "flow": [
      "Raw storage",
      "Curated model",
      "Analytical store",
      "Serving model",
      "Consumers"
    ],
    "example": {
      "code": "Need                         Typical fit\ncheap durable history        object storage / lake\nlarge analytical SQL         warehouse / lakehouse engine\ntransactional point writes   OLTP database\nlow-latency key lookup       KV/document/cache depending on semantics\nBI semantic dataset          curated warehouse/lakehouse model",
      "output": "Choose based on access pattern and guarantees, not because one store is 'modern'.",
      "walkthrough": [
        "Identify whether the workload is write-heavy, scan-heavy, key-lookup-heavy, or mixed.",
        "Separate durable historical storage from specialized serving when that improves cost or performance.",
        "Keep lineage between representations so the system remains explainable."
      ]
    },
    "practice": {
      "task": "Design storage layers for raw clickstream history, a daily customer revenue mart, and a millisecond profile lookup used by an application.",
      "hint": "These have three different access patterns.",
      "solution": "Raw clicks → object storage/lake for cheap replayable history.\nCustomer revenue mart → warehouse/lakehouse analytical table.\nProfile lookup → low-latency serving store such as key-value/document/database chosen for consistency/query needs.",
      "output": "The same source data may legitimately have multiple derived storage representations."
    },
    "interview": [
      {
        "question": "How do you choose a storage technology?",
        "answer": "Start from write pattern, read pattern, data size, latency, consistency, query flexibility, retention, concurrency, recovery, governance, and cost. Then choose the simplest store that satisfies the requirements.",
        "followup": "When is duplicating data across analytical and serving stores justified?"
      },
      {
        "question": "Data lake versus warehouse?",
        "answer": "A lake commonly provides low-cost object storage for broad data formats and multiple engines; a warehouse provides managed analytical table/query capabilities and strong BI ergonomics. Lakehouse approaches add richer table semantics to object storage. Boundaries vary by product.",
        "followup": "What workload could reasonably use both?"
      }
    ],
    "mistakes": [
      {
        "title": "Putting every workload into one database",
        "why": "A store optimized for transactions may struggle with huge analytical scans, while an analytics engine may not fit millisecond operational writes.",
        "better": "Use workload-specific storage only when the additional complexity is justified.",
        "before": "OLTP database serves ingestion + 5 TB scans + profile cache",
        "after": "OLTP source → analytical storage → optional serving store"
      },
      {
        "title": "Choosing partition keys from business meaning alone",
        "why": "A semantically important column can still be a terrible physical partition key if cardinality or query usage is wrong.",
        "better": "Match physical layout to common access patterns and data distribution.",
        "before": "partition by unique transaction_id",
        "after": "partition by date; cluster/index finer-grained fields where supported"
      }
    ],
    "quiz": [
      {
        "question": "What should drive storage choice?",
        "options": [
          "Access patterns and guarantees",
          "Brand popularity",
          "File extension only"
        ],
        "correct": 0,
        "explanation": "Latency, consistency, scale, query shape, and cost determine fit."
      },
      {
        "question": "Can one dataset exist in multiple stores?",
        "options": [
          "Yes, when serving different justified workloads",
          "Never",
          "Only if copied manually"
        ],
        "correct": 0,
        "explanation": "Derived representations can serve analytics and low-latency product needs differently."
      },
      {
        "question": "Is logical modeling the same as physical partitioning?",
        "options": [
          "No",
          "Yes",
          "Only in OLTP"
        ],
        "correct": 0,
        "explanation": "Logical models describe meaning; physical layout controls execution behavior."
      }
    ]
  },
  {
    "id": "batch-streaming",
    "title": "Batch vs Streaming Architecture",
    "minutes": 30,
    "description": "Decide freshness boundaries, understand event-time processing, and avoid using streaming when periodic incremental processing is enough.",
    "concepts": [
      [
        "Freshness is a business requirement",
        "Streaming is justified when the value of lower latency exceeds its operational complexity. A 15-minute micro-batch can be a better design than sub-second streaming for many analytics workloads."
      ],
      [
        "Event time differs from processing time",
        "Events can arrive late or out of order. Event-time windows, watermarks, and allowed lateness define how long the system waits for delayed data before finalizing results."
      ],
      [
        "Batch and streaming can share storage and models",
        "Modern platforms often use a common table/lakehouse or warehouse layer even if ingestion and computation happen at different cadences."
      ]
    ],
    "flow": [
      "Events",
      "Buffer",
      "Window / batch boundary",
      "Stateful processing",
      "Updated output"
    ],
    "example": {
      "code": "Requirement A: finance dashboard by 08:00 daily → batch is sufficient.\nRequirement B: fraud feature within 2 sec → streaming likely required.\nRequirement C: product KPI < 15 min old → micro-batch may be enough.",
      "output": "Choose the least complex processing mode that satisfies the freshness requirement.",
      "walkthrough": [
        "Translate 'real time' into an actual freshness SLA.",
        "Account for late events and retry behavior before promising final results.",
        "Consider whether downstream consumers can benefit from the lower latency."
      ]
    },
    "practice": {
      "task": "A dashboard requirement says 'near real time' but stakeholders confirm that 10-minute freshness is acceptable. Propose a processing cadence.",
      "hint": "Avoid sub-second architecture unless it adds value.",
      "solution": "Use an incremental micro-batch or scheduled job every 5–10 minutes, with durable ingestion between runs. Reassess only if a consumer truly requires lower latency.",
      "output": "The simpler architecture satisfies the stated SLA with less stateful operational complexity."
    },
    "interview": [
      {
        "question": "Batch or streaming—how do you choose?",
        "answer": "Use the freshness SLA, source behavior, state complexity, volume, correctness requirements, operational maturity, and downstream value. Streaming is not inherently better; it buys lower latency at additional complexity.",
        "followup": "What is the simplest design for 15-minute dashboard freshness?"
      },
      {
        "question": "What problem do watermarks address?",
        "answer": "They help stateful stream processors reason about late event-time data and decide when old window state can be considered complete enough to evict or finalize according to configured semantics.",
        "followup": "What trade-off changes when you allow more lateness?"
      }
    ],
    "mistakes": [
      {
        "title": "Calling every pipeline real-time",
        "why": "The architecture may pay streaming complexity without a consumer that needs it.",
        "better": "Translate vague language into a measurable freshness target.",
        "before": "Need real time.",
        "after": "95% of events visible in analytics within 5 minutes."
      },
      {
        "title": "Ignoring late events",
        "why": "Event-time aggregates can become incorrect or unstable when delayed records arrive after windows appear complete.",
        "better": "Define watermark/lateness behavior and reconciliation or backfill paths.",
        "before": "window closes exactly at clock time",
        "after": "process event time with explicit lateness policy"
      }
    ],
    "quiz": [
      {
        "question": "What should determine batch versus streaming?",
        "options": [
          "Freshness and workload requirements",
          "Which tool is newer",
          "Whether data is JSON"
        ],
        "correct": 0,
        "explanation": "Latency value and operational constraints should drive the choice."
      },
      {
        "question": "What is event time?",
        "options": [
          "When the event occurred at the source/domain level",
          "When a dashboard opened",
          "Only the broker timestamp"
        ],
        "correct": 0,
        "explanation": "Event time reflects when the business event happened."
      },
      {
        "question": "What can a watermark help manage?",
        "options": [
          "Late event-time data and state",
          "Passwords",
          "Table names"
        ],
        "correct": 0,
        "explanation": "Watermarks support bounded handling of delayed events in stateful streams."
      }
    ]
  },
  {
    "id": "correctness-reliability",
    "title": "Correctness, Idempotency & Recovery",
    "minutes": 32,
    "description": "Design retry-safe pipelines with checkpoints, deduplication, replay, dead-letter paths, and explicit recovery objectives.",
    "concepts": [
      [
        "Retries are normal",
        "Networks time out, workers fail, and services throttle. A reliable design assumes tasks and messages may be retried instead of treating every retry as exceptional."
      ],
      [
        "Idempotency protects side effects",
        "Processing the same logical input more than once should not create duplicate business effects. Stable event keys, upserts, conditional writes, or transaction boundaries can make retries safe."
      ],
      [
        "Recovery requires durable positions and replayable inputs",
        "Checkpoints, source offsets, batch run metadata, immutable raw data, and backfill procedures allow the pipeline to resume or recompute after failures."
      ]
    ],
    "flow": [
      "Durable input",
      "Process",
      "Idempotent commit",
      "Checkpoint",
      "Replay if needed"
    ],
    "example": {
      "code": "event_id=evt-91\npayment_id=p-17\namount=500\n\nconsumer retry:\n1. lookup/commit by event_id or payment version\n2. write only if not already applied\n3. advance durable checkpoint after successful sink commit",
      "output": "The same delivery can be retried without creating a second logical payment.",
      "walkthrough": [
        "Use a stable identity for the logical event or change.",
        "Commit sink effects in a way that detects prior application.",
        "Advance progress only after the durable effect is safely recorded."
      ]
    },
    "practice": {
      "task": "A daily job writes customer aggregates and can be rerun after failure. Make the output retry-safe.",
      "hint": "Avoid blind append using the run date as the natural replacement boundary.",
      "solution": "Write the day's result to a staging location/table, validate it, then replace/merge the target partition for that business date atomically where supported. Record the run ID and input snapshot/checkpoint.",
      "output": "Rerunning the same business date replaces or deterministically merges results rather than duplicating them."
    },
    "interview": [
      {
        "question": "What does idempotent mean in a data pipeline?",
        "answer": "Repeating the same logical operation produces the same intended state rather than duplicating effects. Common techniques include stable keys, upserts, partition replacement, conditional writes, and transaction boundaries.",
        "followup": "Where can idempotency break in a multi-step pipeline?"
      },
      {
        "question": "How do you recover from a bad transformation deployed for six hours?",
        "answer": "Identify the affected input range, fix the transformation, replay from durable raw data or source positions, write deterministically into affected outputs, validate, and reconcile downstream consumers. Recovery is much easier when lineage and checkpoints are retained.",
        "followup": "What data would you keep specifically to support replay?"
      }
    ],
    "mistakes": [
      {
        "title": "Checkpointing before the sink commit",
        "why": "A crash after advancing progress but before persisting output can lose data because the source position says the record is already processed.",
        "better": "Align checkpoint/offset advancement with successful durable output semantics.",
        "before": "advance offset → write sink",
        "after": "process → durable sink commit → advance checkpoint according to system guarantees"
      },
      {
        "title": "Using blind append for rerunnable batches",
        "why": "A retry can duplicate an entire partition or business period.",
        "better": "Use deterministic partition replacement, merge/upsert, or dedupe keys.",
        "before": "INSERT every rerun",
        "after": "replace partition date=2026-09-20 or MERGE by stable key"
      }
    ],
    "quiz": [
      {
        "question": "What property makes retries safer?",
        "options": [
          "Idempotency",
          "Random output keys",
          "No checkpoints"
        ],
        "correct": 0,
        "explanation": "Idempotent effects can be repeated without duplicating logical outcomes."
      },
      {
        "question": "What helps a pipeline resume after failure?",
        "options": [
          "Durable checkpoints/source positions",
          "Changing table names",
          "Dropping raw data"
        ],
        "correct": 0,
        "explanation": "Durable progress metadata lets the pipeline know where to continue or replay."
      },
      {
        "question": "What is a replay path?",
        "options": [
          "A way to reprocess durable historical input",
          "A dashboard refresh button only",
          "A cache eviction"
        ],
        "correct": 0,
        "explanation": "Replay lets corrected logic recompute previously received data."
      }
    ]
  },
  {
    "id": "scaling-bottlenecks",
    "title": "Scaling, Partitioning & Bottlenecks",
    "minutes": 32,
    "description": "Find the actual bottleneck, partition work safely, handle skew and hotspots, and use backpressure rather than adding workers blindly.",
    "concepts": [
      [
        "Scale the constrained stage",
        "Throughput is limited by the slowest meaningful part of the pipeline: source reads, broker partitions, shuffle, compute, sink writes, network, or downstream concurrency."
      ],
      [
        "Partitioning creates parallelism and hotspots",
        "A partition key should distribute load while preserving required ordering or locality. A highly popular key can create skew even when total traffic is moderate."
      ],
      [
        "Backpressure protects the system",
        "When downstream capacity falls below incoming rate, consumers must slow, buffer, shed optional work, or scale. Infinite buffering only postpones failure."
      ]
    ],
    "flow": [
      "Incoming load",
      "Partition",
      "Parallel workers",
      "Sink capacity",
      "Lag / backpressure"
    ],
    "example": {
      "code": "Input: 20k events/sec\nBroker: 24 partitions\nConsumers: 24 workers × ~1k/sec capacity\nSink: only 10k writes/sec\n\nResult: adding more consumers cannot exceed the sink bottleneck; lag continues to grow.",
      "output": "Scale or redesign the sink path, batch writes, reduce write amplification, or accept/shape the input rate.",
      "walkthrough": [
        "Calculate capacity at each major stage.",
        "Find the stage with sustainable throughput below incoming load.",
        "Optimize or scale that stage before adding capacity elsewhere."
      ]
    },
    "practice": {
      "task": "A stream has 12 partitions and 30 consumers in one consumer group. Only 12 are active. Explain why.",
      "hint": "One partition is normally processed by at most one active group member at a time in partition-based consumption models.",
      "solution": "The group has only 12 independent partition assignments, so at most 12 consumers can actively process those partitions simultaneously. More consumers remain idle unless partition count or consumption model changes.",
      "output": "Parallelism is constrained by the partitioning model, not only worker count."
    },
    "interview": [
      {
        "question": "How do you find a bottleneck in a data pipeline?",
        "answer": "Measure per-stage throughput, latency, queue depth/lag, resource saturation, error/throttle rates, and downstream capacity. Identify where work accumulates or service time dominates before scaling anything.",
        "followup": "What would increasing workers do if the sink is already throttling?"
      },
      {
        "question": "How do you handle a hot partition?",
        "answer": "First identify the skewed key pattern. Options include better partition keys, key salting with later recombination, isolating hot tenants, adaptive repartitioning, or increasing capacity—while preserving required ordering and correctness.",
        "followup": "When would salting be unsafe?"
      }
    ],
    "mistakes": [
      {
        "title": "Adding workers without checking partition limits",
        "why": "Workers can remain idle when the source exposes fewer independent work units.",
        "better": "Match worker concurrency to source partitions and downstream capacity.",
        "before": "12 partitions + 100 consumers",
        "after": "size partitions and consumers together based on throughput/order needs"
      },
      {
        "title": "Treating queue growth as a storage problem only",
        "why": "Growing lag means sustainable processing is below incoming rate.",
        "better": "Measure producer rate, processing rate, sink capacity, and recovery time; use explicit backpressure/scaling.",
        "before": "Increase retention forever",
        "after": "fix capacity mismatch and keep retention as recovery buffer"
      }
    ],
    "quiz": [
      {
        "question": "What usually limits throughput?",
        "options": [
          "The constrained stage in the end-to-end path",
          "The component with the most CPUs",
          "The first diagram box"
        ],
        "correct": 0,
        "explanation": "A pipeline is bounded by its effective bottleneck."
      },
      {
        "question": "What can cause a hot partition?",
        "options": [
          "Skewed keys",
          "Perfectly uniform keys",
          "More documentation"
        ],
        "correct": 0,
        "explanation": "Uneven key distribution can concentrate load on one partition."
      },
      {
        "question": "What does growing consumer lag indicate?",
        "options": [
          "Processing is not keeping up with arrivals",
          "Everything is necessarily healthy",
          "The schema is normalized"
        ],
        "correct": 0,
        "explanation": "Lag grows when sustainable consumption falls behind input."
      }
    ]
  },
  {
    "id": "serving-layer",
    "title": "Serving Layers & Consumer Design",
    "minutes": 28,
    "description": "Design how BI, APIs, data products, and ML consumers access curated data without forcing every consumer onto the same physical model.",
    "concepts": [
      [
        "Consumers define serving requirements",
        "BI cares about analytical scans and concurrency. Product APIs may need millisecond key lookups. ML training may need large historical snapshots. One curated dataset can feed multiple serving representations."
      ],
      [
        "Precompute when repeated work justifies it",
        "Materialized aggregates, marts, caches, search indexes, or feature tables can move computation earlier to meet latency/concurrency goals, at the cost of freshness and additional state."
      ],
      [
        "Contracts reduce downstream breakage",
        "Stable schemas, ownership, semantic definitions, compatibility rules, and freshness expectations make data products safer to consume."
      ]
    ],
    "flow": [
      "Curated data",
      "Serving model",
      "Access layer",
      "Consumer",
      "SLA"
    ],
    "example": {
      "code": "curated orders\n  ├─→ warehouse mart → BI dashboards\n  ├─→ feature table  → ML training/serving\n  └─→ key-value view → customer-facing API",
      "output": "Multiple serving paths are justified only when consumer latency/query patterns differ enough to warrant them.",
      "walkthrough": [
        "Keep business definitions aligned across representations.",
        "Choose a serving store based on consumer access pattern.",
        "Track freshness and lineage so consumers know what each representation means."
      ]
    },
    "practice": {
      "task": "A BI team needs flexible SQL, while an API needs p99 < 50 ms lookup by customer_id. Propose serving layers.",
      "hint": "Do not force the API to issue complex warehouse scans per request.",
      "solution": "BI → curated warehouse/lakehouse marts with SQL access.\nAPI → derived key-addressable serving store/cache updated from the curated pipeline.\nKeep lineage and versioned business definitions between them.",
      "output": "Different access patterns justify separate serving representations."
    },
    "interview": [
      {
        "question": "When would you add a serving database or cache?",
        "answer": "When downstream latency, query pattern, throughput, or availability requirements cannot be met efficiently by the analytical store. The extra representation is justified only if the operational complexity buys real consumer value.",
        "followup": "How would you keep it synchronized?"
      },
      {
        "question": "What is a data contract in system design?",
        "answer": "A data contract defines expectations between producers and consumers—such as schema, semantics, compatibility, ownership, freshness, and sometimes quality/SLA guarantees—so changes are managed deliberately.",
        "followup": "How would you roll out a breaking schema change?"
      }
    ],
    "mistakes": [
      {
        "title": "Letting every dashboard query raw events",
        "why": "Repeated parsing, joins, and business logic increase cost and inconsistency.",
        "better": "Publish curated marts or semantic models for common business questions.",
        "before": "BI → raw click JSON",
        "after": "BI → curated session/funnel models"
      },
      {
        "title": "Creating a new serving store for every consumer",
        "why": "Each copy adds synchronization, lineage, cost, and operational burden.",
        "better": "Add specialized serving only when access requirements materially differ.",
        "before": "one database per dashboard",
        "after": "shared curated serving + specialized low-latency stores only where justified"
      }
    ],
    "quiz": [
      {
        "question": "What should drive serving design?",
        "options": [
          "Consumer access patterns and SLAs",
          "The raw file format only",
          "Team logo"
        ],
        "correct": 0,
        "explanation": "Latency, concurrency, query shape, and flexibility determine the right serving layer."
      },
      {
        "question": "What is a cost of precomputation?",
        "options": [
          "Additional state and freshness management",
          "No storage",
          "No maintenance"
        ],
        "correct": 0,
        "explanation": "Materialized outputs must be refreshed, governed, and kept consistent."
      },
      {
        "question": "What helps consumers survive producer changes?",
        "options": [
          "Data contracts and compatibility rules",
          "Undocumented renames",
          "Deleting old fields immediately"
        ],
        "correct": 0,
        "explanation": "Explicit contracts make interface evolution deliberate."
      }
    ]
  },
  {
    "id": "operations-security-cost",
    "title": "Observability, Security & Cost",
    "minutes": 30,
    "description": "Complete the design with data-quality signals, access boundaries, recovery objectives, lineage, and cost controls tied to the workload.",
    "concepts": [
      [
        "Observe the data outcome, not just infrastructure",
        "CPU and job success can be green while data is stale or empty. Monitor freshness, volume, schema, quality, lag, run duration, errors, and consumer-facing SLAs."
      ],
      [
        "Security belongs in the architecture diagram",
        "Show identity boundaries, least-privilege access, encryption, secret handling, PII zones, network exposure, and auditability rather than mentioning security as an afterthought."
      ],
      [
        "Cost is a design constraint",
        "Storage retention, scan volume, idle compute, cross-region transfer, duplicate processing, excessive replicas, and high-cardinality state all have architectural cost implications."
      ]
    ],
    "flow": [
      "Workload",
      "Telemetry & lineage",
      "Alerts / controls",
      "Security boundary",
      "Cost & SLO review"
    ],
    "example": {
      "code": "For each pipeline stage record:\n- run/job ID\n- input checkpoint/range\n- rows/events read & written\n- freshness timestamp\n- duration + lag\n- quality/test result\n- error/retry count\n- estimated cost driver",
      "output": "These signals make failures explainable and support both reliability and cost reviews.",
      "walkthrough": [
        "Tie metrics to the data path so you can locate where freshness or volume changed.",
        "Restrict sensitive datasets by workload identity and consumer role.",
        "Alert on business-relevant symptoms and track high-cost stages."
      ]
    },
    "practice": {
      "task": "A pipeline reports success but a dashboard is 6 hours stale. Name four observability checks that should expose this.",
      "hint": "Look at data outcomes and handoffs, not just process exit codes.",
      "solution": "- source/ingestion freshness\n- last successful curated partition/model timestamp\n- event/row volume compared with baseline\n- downstream publish/dashboard refresh timestamp\nAlso useful: queue lag, quality checks, lineage/run IDs.",
      "output": "A successful process is not equivalent to a fresh data product."
    },
    "interview": [
      {
        "question": "What would you monitor in a production data platform?",
        "answer": "End-to-end freshness, event/row volume, task duration and failures, stream lag, data-quality/schema checks, storage/warehouse errors, checkpoint progress, consumer SLAs, and important cost/resource signals.",
        "followup": "Which metrics would page someone versus create a non-urgent ticket?"
      },
      {
        "question": "How do you include security in a system design interview?",
        "answer": "Identify trust boundaries, sensitive data, workload identities, least-privilege policies, encryption, secret management, network exposure, auditing, retention, and deletion requirements. Tie controls to specific data paths.",
        "followup": "How would analyst access differ from pipeline-writer access?"
      }
    ],
    "mistakes": [
      {
        "title": "Using job success as the only health metric",
        "why": "The job can run successfully on empty, stale, or malformed input.",
        "better": "Monitor freshness, volume, quality, and consumer-facing output alongside system health.",
        "before": "exit code 0 = healthy",
        "after": "success + expected input/output + freshness + quality"
      },
      {
        "title": "Discussing cost only as instance price",
        "why": "Scan volume, retention, data transfer, idle resources, replicas, and retries can dominate spend.",
        "better": "Identify the workload's major cost drivers and design to reduce waste without weakening requirements.",
        "before": "choose cheapest VM",
        "after": "measure bytes scanned, compute time, storage retention, transfer, and idle capacity"
      }
    ],
    "quiz": [
      {
        "question": "Can a successful job still produce a bad data product?",
        "options": [
          "Yes",
          "No",
          "Only in streaming"
        ],
        "correct": 0,
        "explanation": "Freshness, completeness, and correctness can fail even when execution succeeds."
      },
      {
        "question": "What should security design identify?",
        "options": [
          "Trust boundaries and least-privilege identities",
          "Only UI colors",
          "Only SQL syntax"
        ],
        "correct": 0,
        "explanation": "Security must be tied to real access paths and sensitive data."
      },
      {
        "question": "What is a common data-platform cost driver?",
        "options": [
          "Bytes scanned / compute time / retention",
          "Variable names",
          "Number of comments"
        ],
        "correct": 0,
        "explanation": "Architecture affects how much data and compute the platform consumes."
      }
    ]
  },
  {
    "id": "case-study",
    "title": "End-to-End Design Case Study",
    "minutes": 40,
    "description": "Design a production-ready event analytics system from requirements through ingestion, storage, processing, serving, recovery, security, and cost.",
    "concepts": [
      [
        "Case: marketplace event analytics",
        "A marketplace emits 200M events/day with 8× peak bursts. Product dashboards need 5-minute freshness, analysts need two years of history, and bad deployments must be replayable for seven days."
      ],
      [
        "Build the simplest architecture that meets the SLA",
        "Use durable event ingestion, replayable raw storage, incremental processing, curated analytical tables, BI serving, orchestration/stream processing state, and quality/observability controls."
      ],
      [
        "Defend alternatives",
        "A good interview answer explains when the design would change—for example, sub-second personalization, stricter transactional guarantees, larger ML feature workloads, or a smaller team that prefers more managed services."
      ]
    ],
    "flow": [
      "Producers",
      "Durable ingest",
      "Raw replay",
      "Incremental processing",
      "Curated analytics",
      "BI consumers"
    ],
    "example": {
      "code": "Marketplace apps\n   ↓ events\nDurable stream / broker ─────→ raw object storage (7+ day replay)\n   ↓\n5-minute stream or micro-batch processing\n   ↓\ncurated lakehouse / warehouse tables\n   ↓\nBI dashboards + analyst SQL\n\nControl plane:\nidentity • schema rules • checkpoints • quality • lineage • alerts • budgets",
      "output": "The architecture satisfies burst buffering, 5-minute freshness, historical analytics, and replay without requiring every stage to be sub-second.",
      "walkthrough": [
        "The durable ingest layer absorbs peak bursts and decouples producers from processing.",
        "Raw storage provides cheap history and a replay path after code defects.",
        "Incremental processing updates curated analytical tables within the 5-minute SLA, while observability checks freshness and quality."
      ]
    },
    "practice": {
      "task": "Extend the case study for a new fraud consumer requiring decisions within 500 ms. What part of the architecture changes?",
      "hint": "Do not force the BI serving path to satisfy operational latency.",
      "solution": "Keep the durable event ingest, but add a low-latency streaming branch with keyed state/features and a fast serving/decision path. Preserve the analytical branch for BI/history. Define event-time, duplicate handling, state recovery, and p99 latency monitoring for the fraud path.",
      "output": "One ingestion backbone can feed separate analytical and operational serving paths when their SLAs differ."
    },
    "interview": [
      {
        "question": "Design a scalable event analytics platform.",
        "answer": "Clarify rate, peak, freshness, retention, consumers, recovery, and security. Use durable ingestion for buffering/replay, raw historical storage, incremental or streaming processing based on SLA, curated analytical tables, and a serving layer for BI. Add checkpoints, idempotency, schema/quality controls, lineage, alerts, access boundaries, and cost controls.",
        "followup": "Where is the first likely bottleneck if event rate triples?"
      },
      {
        "question": "How would you evolve the architecture as requirements grow?",
        "answer": "Change only the constrained paths: increase partitions/capacity for ingestion, split hot keys, scale processing, introduce specialized serving for lower latency, improve table layout for larger scans, or strengthen recovery/security when requirements demand it.",
        "followup": "What would you avoid changing if it is not the bottleneck?"
      }
    ],
    "mistakes": [
      {
        "title": "Making every stage streaming because one consumer is low-latency",
        "why": "Historical BI and batch-quality workloads may not benefit from the extra state and operational complexity.",
        "better": "Branch the architecture by consumer SLA while reusing durable inputs and shared business definitions.",
        "before": "all pipelines must be <500 ms",
        "after": "fraud branch <500 ms; analytics branch <5 min"
      },
      {
        "title": "Ignoring backfill in the final design",
        "why": "Real systems need to recover from code bugs, late data, schema issues, and historical corrections.",
        "better": "Keep replayable inputs, deterministic transforms, run metadata, and controlled backfill procedures.",
        "before": "only process new events forever",
        "after": "new path + explicit replay/backfill path"
      }
    ],
    "quiz": [
      {
        "question": "What protects producers from temporary processing slowdown?",
        "options": [
          "Durable buffering/ingestion",
          "A dashboard cache only",
          "Dropping all events"
        ],
        "correct": 0,
        "explanation": "A durable broker or queue can absorb bursts and decouple producers from consumers."
      },
      {
        "question": "Why keep raw replay data?",
        "options": [
          "To recover from transformation defects and backfills",
          "To replace all curated tables",
          "To avoid retention policies"
        ],
        "correct": 0,
        "explanation": "Replayable history supports deterministic reprocessing."
      },
      {
        "question": "What should change when one new consumer needs much lower latency?",
        "options": [
          "Add or adapt the path that has the new SLA",
          "Rewrite every historical batch path",
          "Delete the analytical store"
        ],
        "correct": 0,
        "explanation": "Evolve the architecture around the requirement rather than making every component equally complex."
      }
    ]
  }
];
