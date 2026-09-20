import type { SparkLesson } from "@/lib/spark-lessons";

export const dbtLessons: SparkLesson[] = [
  {
    "id": "dbt-introduction",
    "title": "Introduction to dbt",
    "minutes": 18,
    "description": "Understand where dbt fits in a modern data stack and how it turns warehouse SQL into governed transformation workflows.",
    "concepts": [
      [
        "Transform inside the data platform",
        "dbt is primarily a transformation framework. It compiles project code into SQL and runs that SQL against a supported data platform; it is not the warehouse itself and does not replace ingestion or orchestration."
      ],
      [
        "Treat analytics SQL like software",
        "Models live in version-controlled files, dependencies are explicit, tests check assumptions, and documentation travels with the project."
      ],
      [
        "Build trusted datasets in layers",
        "A common flow is raw sources → staging models → intermediate transformations → marts that downstream analytics can use."
      ]
    ],
    "flow": [
      "Raw source",
      "dbt model",
      "Tested relation",
      "Analytics-ready data"
    ],
    "example": {
      "code": "-- models/staging/stg_orders.sql\nselect\n  order_id,\n  customer_id,\n  amount,\n  status\nfrom {{ source('raw', 'orders') }}",
      "output": "Model dependency: raw.orders → stg_orders\nWarehouse relation: analytics.stg_orders (materialization-dependent)",
      "walkthrough": [
        "The source() call names a governed raw input instead of hardcoding a relation everywhere.",
        "The SQL model defines the shape of stg_orders.",
        "When dbt runs the model, the configured adapter executes compiled SQL in the target data platform."
      ]
    },
    "practice": {
      "task": "You have raw.orders and need a clean staging model with order_id, customer_id, amount, and status. Write the model using source('raw', 'orders').",
      "hint": "Keep the transformation simple: select the required columns from the source() reference.",
      "solution": "select\n  order_id,\n  customer_id,\n  amount,\n  status\nfrom {{ source('raw', 'orders') }}",
      "output": "Expected dependency: raw.orders → stg_orders"
    },
    "interview": [
      {
        "question": "What problem does dbt solve?",
        "answer": "dbt organizes SQL transformations as version-controlled models with explicit dependencies, testing, documentation, and repeatable execution against a data platform.",
        "followup": "What work would still belong to ingestion or orchestration tools?"
      },
      {
        "question": "Does dbt store the data itself?",
        "answer": "No. dbt compiles and executes transformations against the configured data platform. The resulting tables or views live there.",
        "followup": "Where would raw data usually come from before dbt runs?"
      }
    ],
    "mistakes": [
      {
        "title": "Treating dbt as a database",
        "why": "dbt manages transformation logic but the target platform performs the storage and query execution.",
        "better": "Describe dbt as the transformation layer that works with a warehouse or supported data platform.",
        "before": "# dbt stores my tables",
        "after": "# The warehouse stores relations; dbt builds them"
      },
      {
        "title": "Putting every pipeline concern in dbt",
        "why": "Extraction, long-running external tasks, and cross-system orchestration may belong elsewhere.",
        "better": "Keep dbt focused on transformation, tests, lineage, and related analytics-engineering concerns.",
        "before": "# use dbt as the entire orchestration platform",
        "after": "# orchestrator → dbt build → downstream steps"
      }
    ],
    "quiz": [
      {
        "question": "Where does dbt normally execute transformation SQL?",
        "options": [
          "Only in the browser",
          "In the configured data platform",
          "Inside a CSV file"
        ],
        "correct": 1,
        "explanation": "dbt compiles project code and the adapter executes SQL against the configured platform."
      },
      {
        "question": "Which sequence best matches a common dbt project?",
        "options": [
          "Raw → staging → intermediate → marts",
          "Dashboard → raw → source",
          "Macro → database server → ingestion"
        ],
        "correct": 0,
        "explanation": "Layered models make transformations easier to reason about and maintain."
      },
      {
        "question": "What is dbt primarily responsible for?",
        "options": [
          "Transformations and their project metadata",
          "Replacing the warehouse",
          "Operating the network"
        ],
        "correct": 0,
        "explanation": "dbt focuses on transformation workflows, dependencies, testing, documentation, and related metadata."
      }
    ]
  },
  {
    "id": "models-ref",
    "title": "Models & ref()",
    "minutes": 22,
    "description": "Learn how SQL files become dbt models and how ref() turns separate models into an ordered dependency graph.",
    "concepts": [
      [
        "A model starts as project code",
        "A SQL model is typically a select statement stored in the project. Its materialization determines how the compiled query becomes a warehouse relation or is inlined."
      ],
      [
        "ref() creates a dependency",
        "{{ ref('stg_orders') }} tells dbt that the current model depends on stg_orders and lets dbt resolve the relation name for the active target."
      ],
      [
        "Dependencies determine order",
        "dbt can build the DAG from ref() calls and schedule upstream models before downstream models when required."
      ]
    ],
    "flow": [
      "stg_orders",
      "ref()",
      "fct_orders",
      "Downstream analytics"
    ],
    "example": {
      "code": "-- models/marts/fct_orders.sql\nselect\n  order_id,\n  customer_id,\n  amount\nfrom {{ ref('stg_orders') }}\nwhere status = 'completed'",
      "output": "Lineage: stg_orders → fct_orders",
      "walkthrough": [
        "ref('stg_orders') identifies an upstream model.",
        "dbt records the dependency in the project graph.",
        "At compile/run time dbt resolves the correct relation for stg_orders and can order execution accordingly."
      ]
    },
    "practice": {
      "task": "Replace a hardcoded analytics.stg_customers reference with a dbt model dependency.",
      "hint": "Use ref() with the model name, not a database.schema.table string.",
      "solution": "select customer_id, email\nfrom {{ ref('stg_customers') }}",
      "output": "Expected dependency: stg_customers → current model"
    },
    "interview": [
      {
        "question": "What does ref() do?",
        "answer": "ref() records a model dependency and resolves the referenced model to the appropriate relation for the active target. That dependency becomes part of dbt's DAG.",
        "followup": "Why is this better than hardcoding a schema-qualified model name?"
      },
      {
        "question": "How does dbt know model build order?",
        "answer": "Dependencies discovered from ref(), source(), and other project metadata form a DAG. dbt uses that graph to understand upstream and downstream relationships.",
        "followup": "What happens if two models are independent?"
      }
    ],
    "mistakes": [
      {
        "title": "Hardcoding another dbt model's relation",
        "why": "The project loses an explicit dependency and becomes more environment-specific.",
        "better": "Use ref() for dependencies between dbt models.",
        "before": "from analytics.stg_orders",
        "after": "from {{ ref('stg_orders') }}"
      },
      {
        "title": "Using ref() for a raw source table",
        "why": "A raw external table is conceptually different from a dbt-managed model.",
        "better": "Declare raw inputs as sources and use source() for them.",
        "before": "{{ ref('raw_orders') }}",
        "after": "{{ source('raw', 'orders') }}"
      }
    ],
    "quiz": [
      {
        "question": "What relationship does ref('stg_orders') create?",
        "options": [
          "fct_orders depends on stg_orders",
          "stg_orders depends on fct_orders",
          "No dependency"
        ],
        "correct": 0,
        "explanation": "The model containing ref() depends on the referenced model."
      },
      {
        "question": "Why avoid hardcoding dbt model schemas?",
        "options": [
          "ref() can resolve targets and lineage",
          "SQL forbids schemas",
          "Hardcoding makes queries faster"
        ],
        "correct": 0,
        "explanation": "ref() keeps dependencies explicit and lets dbt resolve relation names across targets."
      },
      {
        "question": "Which model should run first?",
        "options": [
          "A downstream model",
          "Its required upstream model",
          "Always alphabetically first"
        ],
        "correct": 1,
        "explanation": "Dependencies, not file-name order, determine the graph."
      }
    ]
  },
  {
    "id": "sources",
    "title": "Sources & source()",
    "minutes": 20,
    "description": "Model raw inputs explicitly with source() so freshness, lineage, naming, and data contracts are easier to reason about.",
    "concepts": [
      [
        "Sources describe external inputs",
        "A dbt source represents a relation loaded outside the current dbt model graph, such as a raw.orders table populated by an ingestion system."
      ],
      [
        "source() is a dependency too",
        "{{ source('raw', 'orders') }} resolves the configured source relation and places that input in lineage."
      ],
      [
        "Configuration centralizes metadata",
        "Source YAML can carry descriptions, tests, freshness configuration where supported, and physical database/schema mappings."
      ]
    ],
    "flow": [
      "Ingestion",
      "raw.orders",
      "source()",
      "stg_orders"
    ],
    "example": {
      "code": "version: 2\n\nsources:\n  - name: raw\n    schema: raw\n    tables:\n      - name: orders\n        columns:\n          - name: order_id\n            data_tests:\n              - not_null\n              - unique",
      "output": "Declared source: raw.orders\nLineage entry available to models using source('raw', 'orders')",
      "walkthrough": [
        "The YAML declares raw as a logical source group.",
        "orders becomes addressable through source('raw', 'orders').",
        "Column tests document and check assumptions about order_id when those tests are executed."
      ]
    },
    "practice": {
      "task": "Declare a raw customers source, then show the SQL reference you would use from stg_customers.",
      "hint": "The YAML name and table name become the two source() arguments.",
      "solution": "version: 2\nsources:\n  - name: raw\n    schema: raw\n    tables:\n      - name: customers\n\n-- stg_customers.sql\nselect * from {{ source('raw', 'customers') }}",
      "output": "Expected lineage: raw.customers → stg_customers"
    },
    "interview": [
      {
        "question": "source() versus ref()?",
        "answer": "source() points to declared external input relations; ref() points to dbt models. Both contribute dependencies and help dbt resolve the correct relation.",
        "followup": "Which would you use for a table loaded by Fivetran or another ingestion service?"
      },
      {
        "question": "Why declare sources instead of hardcoding raw tables?",
        "answer": "Source declarations centralize metadata and improve lineage, environment mapping, testing, and freshness workflows.",
        "followup": "What source metadata would you add for an important production feed?"
      }
    ],
    "mistakes": [
      {
        "title": "Scattering raw table names through models",
        "why": "Renames, environment changes, and lineage become harder to manage.",
        "better": "Declare the source once and reference it with source().",
        "before": "from raw.orders",
        "after": "from {{ source('raw', 'orders') }}"
      },
      {
        "title": "Assuming freshness checks run automatically",
        "why": "Freshness configuration and execution behavior depend on the commands/workflow you run.",
        "better": "Configure freshness where appropriate and schedule the relevant dbt command explicitly.",
        "before": "# freshness exists, so it must be monitored",
        "after": "# configure + execute freshness checks in the workflow"
      }
    ],
    "quiz": [
      {
        "question": "Which function should usually reference raw.orders?",
        "options": [
          "ref()",
          "source()",
          "var()"
        ],
        "correct": 1,
        "explanation": "source() addresses declared external source relations."
      },
      {
        "question": "What can source declarations improve?",
        "options": [
          "Lineage and metadata",
          "Network bandwidth",
          "Python package installation"
        ],
        "correct": 0,
        "explanation": "Sources centralize metadata and make raw inputs explicit in the graph."
      },
      {
        "question": "Is source() only string substitution?",
        "options": [
          "No, it also represents a dependency/metadata relationship",
          "Yes, always",
          "Only for CSV files"
        ],
        "correct": 0,
        "explanation": "The source reference is part of dbt's project graph and relation resolution."
      }
    ]
  },
  {
    "id": "lineage",
    "title": "Dependencies & Lineage",
    "minutes": 22,
    "description": "Read a dbt DAG, trace upstream and downstream impact, and use lineage to reason about safe changes.",
    "concepts": [
      [
        "The project becomes a DAG",
        "ref() and source() relationships create directed dependencies between sources and models."
      ],
      [
        "Lineage answers impact questions",
        "If stg_orders changes, downstream nodes such as int_order_payments and fct_orders may be affected; upstream lineage shows where their data originates."
      ],
      [
        "Graph selection enables focused work",
        "dbt supports selecting parts of the graph so teams can build or test relevant nodes instead of always running every model."
      ]
    ],
    "flow": [
      "raw.orders",
      "stg_orders",
      "int_order_payments",
      "fct_orders",
      "Dashboard"
    ],
    "example": {
      "code": "# Conceptual lineage\nraw.orders\n   ↓\nstg_orders\n   ├─→ int_order_items ─┐\n   └─→ int_payments ────┼─→ fct_orders\n                        └─→ order_metrics",
      "output": "Changing stg_orders can affect every downstream branch shown above.",
      "walkthrough": [
        "Start at the raw source and follow dependencies into staging.",
        "Branches represent models that can depend on the same upstream node.",
        "Impact analysis moves downstream; root-cause analysis often moves upstream."
      ]
    },
    "practice": {
      "task": "Given A → B → C and A → D, list the downstream nodes affected by a breaking change in A.",
      "hint": "Follow every outgoing path from A.",
      "solution": "B, C, and D are downstream of A. C is affected transitively through B.",
      "output": "Affected downstream set: {B, C, D}"
    },
    "interview": [
      {
        "question": "What is dbt lineage?",
        "answer": "Lineage is the dependency graph connecting sources, models, and other supported resources. It shows where data comes from and what can be affected by a change.",
        "followup": "How would lineage help before renaming a column?"
      },
      {
        "question": "Why is a DAG useful?",
        "answer": "It makes dependencies explicit, supports valid execution ordering, and enables targeted selection of upstream or downstream work.",
        "followup": "Can two independent branches run without depending on each other?"
      }
    ],
    "mistakes": [
      {
        "title": "Reading only one hop of impact",
        "why": "A change can affect transitive downstream models several levels away.",
        "better": "Trace the full downstream graph for breaking changes.",
        "before": "stg_orders → int_orders",
        "after": "stg_orders → int_orders → fct_orders → dashboard"
      },
      {
        "title": "Encoding dependencies in comments only",
        "why": "Humans may understand the comment but dbt cannot schedule from it.",
        "better": "Use ref() and source() so dependencies are machine-readable.",
        "before": "-- depends on stg_orders\nfrom analytics.stg_orders",
        "after": "from {{ ref('stg_orders') }}"
      }
    ],
    "quiz": [
      {
        "question": "If A → B → C, what is downstream of A?",
        "options": [
          "Only B",
          "B and C",
          "Only C"
        ],
        "correct": 1,
        "explanation": "Downstream impact includes direct and transitive dependencies."
      },
      {
        "question": "Which direction helps root-cause analysis?",
        "options": [
          "Often upstream toward inputs",
          "Always downstream only",
          "Alphabetical order"
        ],
        "correct": 0,
        "explanation": "Tracing upstream can reveal the input/model where a problem originated."
      },
      {
        "question": "What creates machine-readable model dependencies?",
        "options": [
          "ref()/source() relationships",
          "Comments only",
          "Folder color"
        ],
        "correct": 0,
        "explanation": "dbt builds its graph from project references and metadata."
      }
    ]
  },
  {
    "id": "tests",
    "title": "Tests & Data Quality",
    "minutes": 23,
    "description": "Use dbt data tests to turn assumptions such as uniqueness and non-nullability into repeatable checks.",
    "concepts": [
      [
        "Tests encode expectations",
        "A data test is a query whose failing rows represent violations. Generic tests such as not_null, unique, relationships, and accepted_values cover common expectations."
      ],
      [
        "Failure is information",
        "A failing test should point to a violated assumption—duplicate keys, missing values, invalid categories, or broken relationships—not merely show a red badge."
      ],
      [
        "Testing belongs near model logic",
        "Keeping expectations in project metadata makes quality checks reviewable alongside transformations."
      ]
    ],
    "flow": [
      "Model",
      "Expectation",
      "dbt test/build",
      "Pass or failing rows"
    ],
    "example": {
      "code": "version: 2\nmodels:\n  - name: dim_customers\n    columns:\n      - name: customer_id\n        data_tests:\n          - not_null\n          - unique",
      "output": "If customer_id contains 102, 102, NULL:\nnot_null → FAIL\nunique → FAIL",
      "walkthrough": [
        "not_null identifies rows where customer_id is null.",
        "unique checks whether non-null key values repeat according to the test semantics.",
        "The failure means the model violates its declared expectation and should be investigated."
      ]
    },
    "practice": {
      "task": "Add a test requiring orders.status to be one of completed, cancelled, or pending.",
      "hint": "Use accepted_values with a values list.",
      "solution": "version: 2\nmodels:\n  - name: stg_orders\n    columns:\n      - name: status\n        data_tests:\n          - accepted_values:\n              arguments:\n                values: ['completed', 'cancelled', 'pending']",
      "output": "Rows with any other status should be returned as test failures."
    },
    "interview": [
      {
        "question": "How do dbt data tests work conceptually?",
        "answer": "They execute SQL that identifies records violating an expectation. A passing test returns no failing rows under the test's semantics; failures reveal records to investigate.",
        "followup": "How would you test a foreign-key-like relationship?"
      },
      {
        "question": "Should every model have the same tests?",
        "answer": "No. Tests should reflect meaningful business and structural expectations, with stronger coverage around important keys and contracts.",
        "followup": "Which tests would you prioritize for a fact table?"
      }
    ],
    "mistakes": [
      {
        "title": "Adding tests without understanding the business rule",
        "why": "A technically valid test can enforce the wrong assumption, such as uniqueness where duplicates are legitimate.",
        "better": "Tie each test to an explicit data contract or business expectation.",
        "before": "# add unique everywhere",
        "after": "# unique only on keys that must truly be unique"
      },
      {
        "title": "Ignoring failing rows",
        "why": "Repeatedly bypassing failures removes the value of the quality signal.",
        "better": "Inspect failures, fix data/model logic, or deliberately revise the expectation.",
        "before": "# rerun until green",
        "after": "# inspect failing rows → diagnose → fix or revise rule"
      }
    ],
    "quiz": [
      {
        "question": "What does a failing not_null test indicate?",
        "options": [
          "At least one checked value violates the non-null expectation",
          "The warehouse is offline",
          "The model has no SQL"
        ],
        "correct": 0,
        "explanation": "The test identifies rows that violate the declared expectation."
      },
      {
        "question": "Which test fits a controlled status column?",
        "options": [
          "accepted_values",
          "unique only",
          "No test can do this"
        ],
        "correct": 0,
        "explanation": "accepted_values can check membership in an allowed set."
      },
      {
        "question": "What should drive test selection?",
        "options": [
          "Meaningful data expectations",
          "The number of files",
          "Random coverage"
        ],
        "correct": 0,
        "explanation": "Useful tests encode assumptions that matter to consumers and model correctness."
      }
    ]
  },
  {
    "id": "materializations",
    "title": "Materializations",
    "minutes": 24,
    "description": "Understand how the same model SQL can become a view, table, incremental relation, or ephemeral SQL depending on its materialization.",
    "concepts": [
      [
        "Materialization controls persistence strategy",
        "A model's SQL describes the dataset; materialization tells dbt how to represent that dataset in the target platform."
      ],
      [
        "View and table trade storage for compute differently",
        "Views generally store a query definition while tables persist results. Exact behavior and performance depend on the data platform."
      ],
      [
        "Incremental and ephemeral solve different problems",
        "Incremental models process selected new/changed data into an existing relation. Ephemeral models are inlined into dependent SQL instead of creating their own persistent relation."
      ]
    ],
    "flow": [
      "Model SQL",
      "Materialization",
      "Compiled statements",
      "Warehouse relation"
    ],
    "example": {
      "code": "{{ config(materialized='table') }}\n\nselect\n  customer_id,\n  count(*) as order_count\nfrom {{ ref('stg_orders') }}\ngroup by customer_id",
      "output": "Configured result: a table relation for this model (adapter-specific SQL is generated).",
      "walkthrough": [
        "The select statement defines the desired result.",
        "config(materialized='table') chooses the table strategy.",
        "The adapter generates platform-appropriate statements to create/replace the relation according to dbt behavior."
      ]
    },
    "practice": {
      "task": "Choose a materialization for a small reusable model that should always reflect current upstream data without storing a separate result copy. Explain the trade-off.",
      "hint": "A view is a common starting point, though platform behavior and workload matter.",
      "solution": "{{ config(materialized='view') }}\nselect * from {{ ref('stg_customers') }}",
      "output": "Expected reasoning: simple and current, but query cost/performance is deferred to consumers and the platform."
    },
    "interview": [
      {
        "question": "View versus table materialization?",
        "answer": "A view commonly stores a query definition while a table persists query results. Tables may improve repeated-read performance at the cost of rebuild/storage; views keep logic lightweight but may recompute work. Platform behavior matters.",
        "followup": "When might a table be preferable?"
      },
      {
        "question": "What is an ephemeral model?",
        "answer": "An ephemeral model is not built as its own warehouse relation; dbt inlines its logic into dependent models, typically as generated SQL such as CTEs.",
        "followup": "Why can overusing ephemeral models make compiled SQL harder to debug?"
      }
    ],
    "mistakes": [
      {
        "title": "Using table for everything",
        "why": "Persisting every intermediate model can increase build time and storage without improving the workload.",
        "better": "Choose materialization based on reuse, cost, freshness, complexity, and platform behavior.",
        "before": "{{ config(materialized='table') }}  -- everywhere",
        "after": "# choose view/table/incremental/ephemeral intentionally"
      },
      {
        "title": "Assuming materializations behave identically on every adapter",
        "why": "Generated SQL and platform capabilities differ.",
        "better": "Keep dbt's abstraction in mind but verify adapter/platform-specific behavior for production decisions.",
        "before": "# one platform rule applies everywhere",
        "after": "# check adapter docs for platform-specific details"
      }
    ],
    "quiz": [
      {
        "question": "Which materialization normally persists query results?",
        "options": [
          "table",
          "ephemeral",
          "comment"
        ],
        "correct": 0,
        "explanation": "A table materialization persists a relation containing model results."
      },
      {
        "question": "Which does not normally create its own persistent relation?",
        "options": [
          "ephemeral",
          "table",
          "view"
        ],
        "correct": 0,
        "explanation": "Ephemeral model SQL is inlined into downstream compiled SQL."
      },
      {
        "question": "Is one materialization universally best?",
        "options": [
          "No",
          "Yes, table",
          "Yes, incremental"
        ],
        "correct": 0,
        "explanation": "The right choice depends on workload, platform, cost, freshness, and model role."
      }
    ]
  },
  {
    "id": "jinja-macros",
    "title": "Jinja, Variables & Macros",
    "minutes": 24,
    "description": "See how Jinja generates SQL and use small reusable abstractions without hiding the data logic.",
    "concepts": [
      [
        "Jinja runs before warehouse SQL",
        "dbt renders Jinja during parsing/compilation so constructs such as ref(), conditionals, loops, and macros can generate SQL."
      ],
      [
        "Macros package reusable generation logic",
        "A macro can reduce repetition, but the compiled SQL still needs to be understandable and valid for the target platform."
      ],
      [
        "Keep abstractions smaller than the problem",
        "Heavy metaprogramming can make lineage and debugging harder; prefer plain SQL when it communicates the transformation clearly."
      ]
    ],
    "flow": [
      "Model + Jinja",
      "dbt render/compile",
      "SQL",
      "Data platform"
    ],
    "example": {
      "code": "{% macro cents_to_dollars(column_name) %}\n  ({{ column_name }} / 100.0)\n{% endmacro %}\n\n-- model usage\nselect\n  order_id,\n  {{ cents_to_dollars('amount_cents') }} as amount\nfrom {{ ref('stg_orders') }}",
      "output": "Conceptual compiled expression:\nselect order_id, (amount_cents / 100.0) as amount ...",
      "walkthrough": [
        "The macro receives a column expression.",
        "Jinja renders the macro into SQL text before execution.",
        "The resulting SQL—not the macro itself—is what the target platform executes."
      ]
    },
    "practice": {
      "task": "Write a simple macro that wraps a column in lower(trim(...)) and use it for email.",
      "hint": "Return SQL text from the macro body and pass the column name as an argument.",
      "solution": "{% macro normalize_text(column_name) %}\n  lower(trim({{ column_name }}))\n{% endmacro %}\n\nselect {{ normalize_text('email') }} as email\nfrom {{ ref('stg_customers') }}",
      "output": "Conceptual compiled expression: lower(trim(email)) as email"
    },
    "interview": [
      {
        "question": "What is Jinja doing in dbt?",
        "answer": "Jinja generates or configures SQL before that SQL is sent to the data platform. It enables functions such as ref(), macros, variables, conditionals, and loops.",
        "followup": "Why should you inspect compiled SQL when debugging?"
      },
      {
        "question": "When is a macro useful?",
        "answer": "When repeated SQL-generation logic has a stable meaning across models. Avoid macros that obscure straightforward business logic.",
        "followup": "What is the downside of very dynamic macro-heavy models?"
      }
    ],
    "mistakes": [
      {
        "title": "Treating Jinja as runtime row processing",
        "why": "Jinja is rendered before the warehouse evaluates rows; it does not loop over query result rows at SQL execution time.",
        "better": "Use Jinja to generate SQL and SQL to process data rows.",
        "before": "{% for row in query_results %} ... {% endfor %}",
        "after": "-- generate SQL structure with Jinja; let SQL process rows"
      },
      {
        "title": "Hiding simple SQL behind macros",
        "why": "Excessive abstraction makes compiled behavior harder to read and debug.",
        "better": "Extract a macro when reuse and consistency outweigh the indirection.",
        "before": "{{ mysterious_transform('amount') }}",
        "after": "amount / 100.0  -- when this is clearer and not reused"
      }
    ],
    "quiz": [
      {
        "question": "When is Jinja rendered?",
        "options": [
          "Before warehouse SQL execution",
          "After every output row",
          "Only after tests"
        ],
        "correct": 0,
        "explanation": "dbt renders Jinja to produce SQL before the platform executes the query."
      },
      {
        "question": "What does a macro primarily generate?",
        "options": [
          "SQL/text used by the project",
          "A new database server",
          "Network packets"
        ],
        "correct": 0,
        "explanation": "Macros are reusable Jinja constructs that generate SQL or project logic."
      },
      {
        "question": "Why inspect compiled SQL?",
        "options": [
          "To see what the platform will execute",
          "To change Git history",
          "To count dashboards"
        ],
        "correct": 0,
        "explanation": "Compiled SQL exposes the concrete query after Jinja rendering and reference resolution."
      }
    ]
  },
  {
    "id": "incremental",
    "title": "Incremental Models",
    "minutes": 28,
    "description": "Process selected new or changed records without rebuilding the full result every run, while handling keys and late-arriving data deliberately.",
    "concepts": [
      [
        "Incremental is a strategy, not magic",
        "An incremental model needs logic that identifies the records to process on incremental runs; the exact merge/insert behavior depends on configuration and adapter support."
      ],
      [
        "Keys shape update behavior",
        "Where supported, a unique_key can help the materialization match existing records for update/merge strategies, but it does not invent data quality guarantees by itself."
      ],
      [
        "Late data changes the filter design",
        "Filtering only by max timestamp can miss late-arriving updates. Production logic needs a deliberate lookback, change-data strategy, or other recovery plan."
      ]
    ],
    "flow": [
      "Existing relation",
      "New/changed source rows",
      "Incremental strategy",
      "Updated relation"
    ],
    "example": {
      "code": "{{ config(materialized='incremental', unique_key='order_id') }}\n\nselect *\nfrom {{ ref('stg_orders') }}\n{% if is_incremental() %}\nwhere updated_at >= (select max(updated_at) from {{ this }})\n{% endif %}",
      "output": "Full refresh: scans the selected source set.\nIncremental run: applies the conditional filter, then adapter strategy updates/inserts according to configuration.",
      "walkthrough": [
        "is_incremental() is true only when dbt is performing an incremental run under the required conditions.",
        "The filter narrows source rows considered on incremental runs.",
        "A production design must decide how to handle equal timestamps, late updates, deletes, schema changes, and adapter-specific merge behavior."
      ]
    },
    "practice": {
      "task": "Improve a timestamp incremental filter so it reprocesses a one-day lookback window instead of only rows at or after the current maximum timestamp.",
      "hint": "Subtract an interval from the current target max timestamp using syntax appropriate to your target platform.",
      "solution": "{% if is_incremental() %}\nwhere updated_at >= (\n  select max(updated_at) - interval '1 day' from {{ this }}\n)\n{% endif %}",
      "output": "Expected reasoning: the lookback can catch some late arrivals, while unique-key merge/update semantics prevent unintended duplication where supported and configured."
    },
    "interview": [
      {
        "question": "When would you use an incremental model?",
        "answer": "For large models where rebuilding all history is unnecessarily expensive and the team can reliably identify and reconcile new or changed records.",
        "followup": "What makes an incremental model risky?"
      },
      {
        "question": "Why is max(timestamp) filtering sometimes insufficient?",
        "answer": "Records can arrive late or be corrected with older timestamps, so a strict high-water mark may miss changes. A lookback or stronger change-capture strategy may be required.",
        "followup": "How would you make reprocessing idempotent?"
      }
    ],
    "mistakes": [
      {
        "title": "Assuming incremental means append-only",
        "why": "Many datasets contain updates, corrections, or late records; blindly appending can duplicate business keys.",
        "better": "Choose a strategy and unique key appropriate to change semantics and adapter support.",
        "before": "# insert every new batch without keys",
        "after": "# define change logic + unique_key/strategy where supported"
      },
      {
        "title": "Using a timestamp filter without recovery logic",
        "why": "Late-arriving or corrected records can fall behind the high-water mark.",
        "better": "Design a lookback, CDC approach, periodic rebuild, or other explicit recovery path.",
        "before": "updated_at > max(updated_at)",
        "after": "reprocess a safe window or use a stronger change signal"
      }
    ],
    "quiz": [
      {
        "question": "What does is_incremental() help control?",
        "options": [
          "Logic that should apply only on incremental runs",
          "Git branch names",
          "Dashboard colors"
        ],
        "correct": 0,
        "explanation": "It is commonly used to conditionally limit source rows on incremental executions."
      },
      {
        "question": "Does unique_key alone guarantee source uniqueness?",
        "options": [
          "No",
          "Yes",
          "Only in YAML"
        ],
        "correct": 0,
        "explanation": "The key guides incremental matching behavior; data quality still needs validation."
      },
      {
        "question": "What can a one-day lookback help with?",
        "options": [
          "Some late-arriving records",
          "Creating a warehouse account",
          "Installing dbt"
        ],
        "correct": 0,
        "explanation": "Reprocessing a window can catch changes that arrive after their original event time."
      }
    ]
  },
  {
    "id": "project-structure",
    "title": "Project Structure & Documentation",
    "minutes": 22,
    "description": "Organize a maintainable dbt project, document important models, and connect development work to a production workflow.",
    "concepts": [
      [
        "Structure communicates model purpose",
        "Folders such as staging, intermediate, and marts are conventions—not dbt requirements—but they help teams separate cleanup, reusable transformation logic, and business-facing datasets."
      ],
      [
        "Metadata belongs with the project",
        "Descriptions, tests, ownership-style metadata, and documentation make important models easier to discover and trust."
      ],
      [
        "Production is a workflow, not one command",
        "Teams typically review code, run CI checks, deploy project changes, and schedule dbt commands in an appropriate execution environment."
      ]
    ],
    "flow": [
      "Developer change",
      "Review/CI",
      "Deploy",
      "Scheduled dbt run",
      "Documented datasets"
    ],
    "example": {
      "code": "models/\n  staging/\n    stg_orders.sql\n    stg_customers.sql\n  intermediate/\n    int_order_payments.sql\n  marts/\n    fct_orders.sql\n    dim_customers.sql\nmacros/\nseeds/\nsnapshots/\ndbt_project.yml",
      "output": "A layered project keeps raw cleanup, reusable transformations, and business-facing models easier to navigate.",
      "walkthrough": [
        "Staging models standardize source data with minimal business logic.",
        "Intermediate models hold reusable transformation steps that are not usually direct consumer interfaces.",
        "Marts expose fact, dimension, or business-oriented datasets to downstream users."
      ]
    },
    "practice": {
      "task": "Place these models into sensible layers: cleaned_orders, order_payment_rollup, customer_lifetime_value.",
      "hint": "Think source cleanup → reusable transformation → business-facing mart.",
      "solution": "staging/stg_orders.sql\nintermediate/int_order_payment_rollup.sql\nmarts/customer_lifetime_value.sql",
      "output": "Reasoning: cleanup in staging, reusable transformation in intermediate, consumer-facing metric model in marts."
    },
    "interview": [
      {
        "question": "How would you structure a dbt project?",
        "answer": "Use consistent layers and naming that make model purpose clear—for example staging for source cleanup, intermediate for reusable transformations, and marts for business-facing datasets—while keeping conventions proportional to project size.",
        "followup": "When can too many layers become counterproductive?"
      },
      {
        "question": "What belongs in a production dbt workflow?",
        "answer": "Version control and review, CI checks, environment-aware configuration, scheduled runs/builds, failure visibility, and a controlled deployment process appropriate to the team.",
        "followup": "How would you keep credentials out of source code?"
      }
    ],
    "mistakes": [
      {
        "title": "One huge marts folder with no conventions",
        "why": "Consumers and engineers struggle to understand ownership, model purpose, and dependency boundaries.",
        "better": "Adopt simple naming/layering conventions and enforce them consistently.",
        "before": "models/model1.sql\nmodels/final2.sql",
        "after": "models/staging/stg_orders.sql\nmodels/marts/fct_orders.sql"
      },
      {
        "title": "Committing secrets into project files",
        "why": "Repository history can expose credentials even after the file is edited later.",
        "better": "Use environment/secret-management mechanisms supported by the execution platform.",
        "before": "password: super-secret",
        "after": "password: {{ env_var('DBT_PASSWORD') }}"
      }
    ],
    "quiz": [
      {
        "question": "Which layer commonly standardizes raw source data?",
        "options": [
          "staging",
          "dashboard",
          "network"
        ],
        "correct": 0,
        "explanation": "Staging is a common convention for source-aligned cleanup and renaming."
      },
      {
        "question": "Are staging/intermediate/marts mandatory dbt folder names?",
        "options": [
          "No, they are conventions",
          "Yes, dbt will fail otherwise",
          "Only marts is mandatory"
        ],
        "correct": 0,
        "explanation": "Teams choose project conventions; dbt does not require these exact folder names."
      },
      {
        "question": "Where should production secrets live?",
        "options": [
          "A secure environment/secret mechanism",
          "Committed in dbt_project.yml",
          "In a SQL comment"
        ],
        "correct": 0,
        "explanation": "Credentials should not be committed to project source."
      }
    ]
  },
  {
    "id": "real-world-review",
    "title": "Real-World Project & Interview Review",
    "minutes": 35,
    "description": "Connect sources, models, lineage, tests, materializations, and incremental thinking in one small e-commerce project.",
    "concepts": [
      [
        "Trace one business output end to end",
        "A useful review starts with fct_orders and follows every upstream dependency back to raw orders, payments, and customers."
      ],
      [
        "Choose controls at the right layer",
        "Sources describe external inputs, staging standardizes them, tests protect important expectations, and materializations are selected for workload needs."
      ],
      [
        "Explain trade-offs, not slogans",
        "Strong interview answers describe why a design was chosen, what can fail, and how the design changes with scale or platform constraints."
      ]
    ],
    "flow": [
      "raw sources",
      "staging models",
      "intermediate joins",
      "facts/dimensions",
      "BI consumers"
    ],
    "example": {
      "code": "raw.orders ─────→ stg_orders ────────┐\n                                          ├→ int_order_payments → fct_orders\nraw.payments ───→ stg_payments ──────────┘\n\nraw.customers ──→ stg_customers ───────────→ dim_customers",
      "output": "Review target: explain source(), ref(), tests, lineage, and materialization choices for every arrow and node.",
      "walkthrough": [
        "Raw tables are declared as sources and enter dbt through source().",
        "Staging models clean and standardize each source.",
        "Intermediate models combine reusable logic; marts expose stable business datasets with tests and appropriate materializations."
      ]
    },
    "practice": {
      "task": "Design a dbt plan for raw.orders, raw.payments, and raw.customers that produces fct_orders and dim_customers. Name the core models and identify at least three tests.",
      "hint": "Start with one staging model per raw table, then add only the intermediate logic you actually need.",
      "solution": "Sources: raw.orders, raw.payments, raw.customers\nStaging: stg_orders, stg_payments, stg_customers\nIntermediate: int_order_payments\nMarts: fct_orders, dim_customers\nTests: not_null + unique on primary business keys; relationships from fct_orders.customer_id to dim_customers.customer_id; accepted_values on order status.",
      "output": "Expected lineage:\nraw.orders → stg_orders ─┐\nraw.payments → stg_payments ─┼→ int_order_payments → fct_orders\nraw.customers → stg_customers → dim_customers"
    },
    "interview": [
      {
        "question": "dbt versus Airflow?",
        "answer": "dbt focuses on transformation/modeling, dependencies, tests, and metadata inside supported data platforms. Airflow is a general workflow orchestrator that can coordinate dbt alongside ingestion, APIs, files, and other tasks.",
        "followup": "How would you combine them in one pipeline?"
      },
      {
        "question": "How would you debug a failing dbt model?",
        "answer": "Start with the failing node and error, inspect compiled SQL, verify refs/sources and target configuration, reproduce the query in the platform when useful, then trace upstream data and recent changes. For test failures, inspect the failing records.",
        "followup": "How would lineage reduce the search space?"
      }
    ],
    "mistakes": [
      {
        "title": "Giving tool-first interview answers",
        "why": "Naming features without explaining data flow and trade-offs does not show system understanding.",
        "better": "Trace inputs → transformation → output → quality checks → operational trade-offs.",
        "before": "I would use dbt because it has ref().",
        "after": "I would use ref() to make dependencies explicit, then test keys and choose materializations based on workload."
      },
      {
        "title": "Building every possible dbt feature into a small project",
        "why": "Unnecessary macros, snapshots, hooks, and layers add maintenance cost.",
        "better": "Use the smallest set of features that clearly solves the data and operational requirements.",
        "before": "# add a feature because dbt supports it",
        "after": "# add it only when the project has the matching need"
      }
    ],
    "quiz": [
      {
        "question": "Which function connects a mart to another dbt model?",
        "options": [
          "ref()",
          "source() for every case",
          "env_var()"
        ],
        "correct": 0,
        "explanation": "ref() expresses dependencies between dbt models."
      },
      {
        "question": "Which function connects staging to an externally loaded raw table?",
        "options": [
          "source()",
          "ref() only",
          "macro()"
        ],
        "correct": 0,
        "explanation": "source() references a declared external source relation."
      },
      {
        "question": "What makes a strong production dbt design?",
        "options": [
          "Clear lineage, meaningful tests, deliberate materializations, and maintainable project structure",
          "Maximum number of macros",
          "One table for every line of SQL"
        ],
        "correct": 0,
        "explanation": "The design should make transformations reliable, understandable, and proportionate to the workload."
      }
    ]
  }
];
