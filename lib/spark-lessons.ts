export interface SparkLesson {
  id: string; title: string; minutes: number; description: string;
  concepts: string[][]; flow: string[];
  example: {code: string; output: string; walkthrough: string[]};
  practice: {task: string; hint: string; solution: string; output: string};
  interview: {question: string; answer: string; followup: string}[];
  mistakes: {title: string; why: string; better: string; before: string; after: string}[];
  quiz: {question: string; options: string[]; correct: number; explanation: string}[];
}

export const sparkLessons: SparkLesson[] = [
  {
    "id": "introduction",
    "title": "Introduction",
    "minutes": 15,
    "description": "Understand what Spark does, who runs the work, and when distributed processing is useful.",
    "concepts": [
      [
        "A team, not a bigger spreadsheet",
        "Spark divides a large processing job into pieces that can run in parallel. Imagine several people counting separate boxes, then combining their totals. For tiny data, organizing that team may cost more time than doing the task locally."
      ],
      [
        "Who does what?",
        "The driver coordinates the application. Executors run tasks and can store reused data. A cluster manager allocates resources; it does not replace the driver’s job scheduling."
      ],
      [
        "Plan before processing",
        "Transformations describe changes. Actions request results. Spark can recover many failed tasks by recomputing from their dependencies, but this does not make every external side effect safe to repeat."
      ]
    ],
    "flow": [
      "Driver",
      "Tasks",
      "Executors",
      "Result"
    ],
    "example": {
      "code": "numbers = spark.range(1, 6)\nselected = numbers.filter(\"id >= 3\")\nselected.orderBy(\"id\").show()",
      "output": "id\n3\n4\n5",
      "walkthrough": [
        "range creates the values 1 through 5; its upper bound is excluded.",
        "filter describes which rows to keep. It does not change numbers.",
        "show requests a result; orderBy makes the displayed order explicit."
      ]
    },
    "practice": {
      "task": "Create the numbers 1 through 10, keep the even numbers, and count them.",
      "hint": "Use range(1, 11), the remainder operator %, and count().",
      "solution": "numbers = spark.range(1, 11)\neven = numbers.filter(\"id % 2 = 0\")\nprint(even.count())",
      "output": "5"
    },
    "interview": [
      {
        "question": "What are the driver and executors?",
        "answer": "The driver plans and coordinates the application; executors perform assigned tasks. Explain where data is processed rather than saying Spark runs everything on the driver.",
        "followup": "Why could collect() overload the driver?"
      },
      {
        "question": "When would you avoid Spark?",
        "answer": "For a small dataset and simple calculation, a local tool may be simpler and faster. Consider startup, network, and operational overhead before choosing a distributed engine.",
        "followup": "How would you measure whether Spark is justified?"
      }
    ],
    "mistakes": [
      {
        "title": "Collecting every record to inspect the data",
        "why": "collect() brings the entire result into driver memory.",
        "better": "Inspect a small sample with show() or a bounded limit.",
        "before": "rows = spark.range(1000000)\nall_rows = rows.collect()",
        "after": "rows = spark.range(1000000)\nrows.show(5)"
      },
      {
        "title": "Assuming more computers always means faster",
        "why": "Coordination and moving data have costs; some work cannot use additional resources effectively.",
        "better": "Measure a representative workload and identify the limiting step.",
        "before": "# Add workers without measuring",
        "after": "# Check task duration and data movement first"
      }
    ],
    "quiz": [
      {
        "question": "Which component coordinates an application?",
        "options": [
          "Driver",
          "Executor",
          "CSV file"
        ],
        "correct": 0,
        "explanation": "The driver coordinates; executors carry out the tasks."
      },
      {
        "question": "Which requests a computed result?",
        "options": [
          "filter()",
          "select()",
          "count()"
        ],
        "correct": 2,
        "explanation": "count() is an action; filter and select describe transformations."
      },
      {
        "question": "Why can Spark be excessive for a tiny dataset?",
        "options": [
          "It cannot read small files",
          "Distributed coordination adds overhead",
          "It requires SQL"
        ],
        "correct": 1,
        "explanation": "Startup and scheduling can cost more than a small calculation."
      }
    ]
  },
  {
    "id": "rdd-vs-dataframe",
    "title": "RDD vs DataFrame",
    "minutes": 20,
    "description": "Understand Spark’s two core abstractions, when to use each, and how their execution models shape real-world performance.",
    "concepts": [],
    "flow": [],
    "example": {
      "code": "numbers = spark.range(1, 6)\nselected = numbers.filter(\"id >= 3\")\nselected.orderBy(\"id\").show()",
      "output": "id\n3\n4\n5",
      "walkthrough": [
        "range creates the values 1 through 5; its upper bound is excluded.",
        "filter describes which rows to keep. It does not change numbers.",
        "show requests a result; orderBy makes the displayed order explicit."
      ]
    },
    "practice": {
      "task": "Create the numbers 1 through 10, keep the even numbers, and count them.",
      "hint": "Use range(1, 11), the remainder operator %, and count().",
      "solution": "numbers = spark.range(1, 11)\neven = numbers.filter(\"id % 2 = 0\")\nprint(even.count())",
      "output": "5"
    },
    "interview": [],
    "mistakes": [],
    "quiz": []
  },
  {
    "id": "spark-sql",
    "title": "Spark SQL",
    "minutes": 25,
    "description": "Ask questions about tables using SQL, then connect those queries to DataFrame operations.",
    "concepts": [
      [
        "Name a table for your session",
        "A temporary view gives a DataFrame a SQL name. It is not a saved copy of the data and normally lives only in the Spark session that created it."
      ],
      [
        "Choose rows, then summarize",
        "WHERE keeps matching rows. GROUP BY forms groups, and SUM adds values within each group. SQL and DataFrame expressions use the same Spark SQL engine."
      ],
      [
        "Handle missing values intentionally",
        "NULL means missing or unknown. Compare with IS NULL, not = NULL. Aggregates such as SUM ignore null inputs; decide whether that matches your business rules."
      ]
    ],
    "flow": [
      "Temporary view",
      "SQL query",
      "Catalyst Optimizer",
      "Physical Plan"
    ],
    "example": {
      "code": "sales = spark.createDataFrame(\n    [(\"IN\", 100), (\"US\", 50), (\"IN\", 20)],\n    \"country STRING, amount INT\"\n)\nsales.createOrReplaceTempView(\"sales\")\nspark.sql(\"\"\"\n    SELECT country, SUM(amount) AS total\n    FROM sales WHERE amount > 0\n    GROUP BY country ORDER BY country\n\"\"\").show()",
      "output": "country | total\nIN      | 120\nUS      | 50",
      "walkthrough": [
        "Create a three-row table with explicit column types.",
        "Register a session-scoped view named sales.",
        "Filter positive amounts, group by country, sum each group, and sort for display."
      ]
    },
    "practice": {
      "task": "Using the example sales view, return only countries whose total sales exceed 100.",
      "hint": "Filter grouped results with HAVING SUM(amount) > 100.",
      "solution": "sales = spark.createDataFrame([(\"IN\", 100), (\"US\", 50), (\"IN\", 20)], \"country STRING, amount INT\")\nsales.createOrReplaceTempView(\"sales\")\nspark.sql(\"\"\"SELECT country, SUM(amount) AS total\nFROM sales GROUP BY country\nHAVING SUM(amount) > 100 ORDER BY country\"\"\").show()",
      "output": "country | total\nIN      | 120"
    },
    "interview": [
      {
        "question": "Is Spark SQL faster than equivalent DataFrame code?",
        "answer": "Both use Spark SQL’s execution engine. Equivalent built-in expressions often produce similar plans; inspect explain() rather than assuming a language makes a query faster.",
        "followup": "When could the two expressions produce different plans?"
      },
      {
        "question": "WHERE versus HAVING?",
        "answer": "WHERE filters input rows before grouping. HAVING filters the grouped results. For example, use WHERE for positive transactions and HAVING for total sales above a threshold.",
        "followup": "What changes if negative refunds are filtered before summing?"
      },
      {
        "question": "Does a temporary view save data?",
        "answer": "No. It names a queryable DataFrame within a session. Use a deliberate write to persist data; a temporary view is not a durable table.",
        "followup": "What happens when that Spark session ends?"
      }
    ],
    "mistakes": [
      {
        "title": "Using = NULL to find missing values",
        "why": "Equality with NULL is unknown, not true.",
        "better": "Use IS NULL or the DataFrame isNull() expression.",
        "before": "SELECT * FROM sales WHERE amount = NULL",
        "after": "SELECT * FROM sales WHERE amount IS NULL"
      },
      {
        "title": "Filtering an aggregate in WHERE",
        "why": "WHERE runs before the aggregate result is available.",
        "better": "Use HAVING to filter grouped totals.",
        "before": "SELECT country, SUM(amount) FROM sales\nWHERE SUM(amount) > 100 GROUP BY country",
        "after": "SELECT country, SUM(amount) FROM sales\nGROUP BY country HAVING SUM(amount) > 100"
      }
    ],
    "quiz": [
      {
        "question": "Which clause filters grouped totals?",
        "options": [
          "WHERE",
          "HAVING",
          "ORDER BY"
        ],
        "correct": 1,
        "explanation": "HAVING evaluates conditions on grouped results."
      },
      {
        "question": "How do you find missing amounts?",
        "options": [
          "amount = NULL",
          "amount IS NULL",
          "amount = 0"
        ],
        "correct": 1,
        "explanation": "NULL is not zero; use IS NULL."
      },
      {
        "question": "A temporary view is…",
        "options": [
          "A permanent copy",
          "A session-scoped query name",
          "A cache"
        ],
        "correct": 1,
        "explanation": "It names a DataFrame in a session without making a durable copy."
      }
    ]
  },
  {
    "id": "transformations",
    "title": "Transformations",
    "minutes": 25,
    "description": "Build a sequence of data changes and understand when Spark actually performs the work.",
    "concepts": [
      [
        "Describe a new result",
        "A transformation creates a new logical result without changing the original. filter keeps rows, select chooses columns, and withColumn computes or replaces a column in the new DataFrame."
      ],
      [
        "Local versus redistributed work",
        "A narrow transformation can work from individual input partitions. A wide operation, such as grouping by a key, can require a shuffle to bring matching records together."
      ],
      [
        "Actions trigger computation",
        "count, show, and writes request results. Chaining transformations lets Spark plan the work together. Repeated actions can recompute work unless suitable results are reused."
      ]
    ],
    "flow": [
      "Source",
      "filter",
      "select",
      "Action"
    ],
    "example": {
      "code": "from pyspark.sql import functions as F\nitems = spark.createDataFrame([(1, 10), (2, 30), (3, 20)], \"id INT, price INT\")\nresult = items.filter(\"price >= 20\").select(\n    \"id\", (F.col(\"price\") * 2).alias(\"double_price\")\n)\nresult.orderBy(\"id\").show()",
      "output": "id | double_price\n2  | 60\n3  | 40",
      "walkthrough": [
        "Create three items with integer prices.",
        "Keep items priced at least 20 and describe a computed column.",
        "orderBy and show produce a predictable displayed result; items is unchanged."
      ]
    },
    "practice": {
      "task": "Keep prices strictly above 10 and add 5 to each price. Display id and the new price.",
      "hint": "Use filter followed by select and alias; finish with orderBy and show.",
      "solution": "from pyspark.sql import functions as F\nitems = spark.createDataFrame([(1, 10), (2, 30), (3, 20)], \"id INT, price INT\")\nitems.filter(\"price > 10\").select(\"id\", (F.col(\"price\") + 5).alias(\"new_price\")).orderBy(\"id\").show()",
      "output": "id | new_price\n2  | 35\n3  | 25"
    },
    "interview": [
      {
        "question": "Transformation versus action?",
        "answer": "A transformation describes another dataset; an action requests a result. filter is a transformation and count is an action. Lazy processing allows Spark to optimize a chain before running it.",
        "followup": "Why is timing only filter() misleading?"
      },
      {
        "question": "Narrow versus wide dependencies?",
        "answer": "Narrow work uses limited parent partitions without redistributing all matching keys. Wide work can require a shuffle, such as groupBy aggregations, creating additional stage boundaries.",
        "followup": "Why might a shuffle be unavoidable for an aggregation?"
      }
    ],
    "mistakes": [
      {
        "title": "Discarding a returned DataFrame",
        "why": "Transformations do not mutate the original variable.",
        "better": "Keep the new result or chain the operation.",
        "before": "items.filter(\"price > 10\")\nitems.show()",
        "after": "filtered = items.filter(\"price > 10\")\nfiltered.show()"
      },
      {
        "title": "Using actions inside every processing step",
        "why": "Repeated result requests can cause extra jobs and unnecessary data transfer.",
        "better": "Build the required expression chain, then request the result.",
        "before": "items.count()\nitems.filter(\"price > 10\").count()\nitems.filter(\"price > 10\").show()",
        "after": "filtered = items.filter(\"price > 10\")\nfiltered.show()"
      }
    ],
    "quiz": [
      {
        "question": "Does filter mutate its input DataFrame?",
        "options": [
          "Yes",
          "No"
        ],
        "correct": 1,
        "explanation": "It returns a new DataFrame."
      },
      {
        "question": "Which operation commonly needs a shuffle?",
        "options": [
          "select a column",
          "filter a row",
          "groupBy a key"
        ],
        "correct": 2,
        "explanation": "Grouping usually brings matching keys together across partitions."
      },
      {
        "question": "What should you retain after a transformation?",
        "options": [
          "The returned DataFrame",
          "Only the old variable"
        ],
        "correct": 0,
        "explanation": "The new DataFrame represents the requested change."
      }
    ]
  },
  {
    "id": "partitioning",
    "title": "Partitioning",
    "minutes": 30,
    "description": "Understand how Spark shares data and work, and why moving records can become expensive.",
    "concepts": [
      [
        "Data comes in pieces",
        "A partition is a portion of a distributed dataset. Tasks process partitions, allowing multiple workers to work at once. Partitions are not the same as worker machines."
      ],
      [
        "Moving records has a cost",
        "A shuffle redistributes records, often across the network. repartition can increase or decrease partition count by shuffling; coalesce usually reduces it with less movement but may reduce parallelism."
      ],
      [
        "Balance matters more than a magic number",
        "Data skew means some partitions have far more work than others. Inspect task sizes and duration. Execution partitions and folders created by partitionBy during a file write are different concepts."
      ]
    ],
    "flow": [
      "Input partitions",
      "shuffle",
      "Key groups",
      "Tasks"
    ],
    "example": {
      "code": "rows = spark.range(0, 12, 1, 2)\nbalanced = rows.repartition(3)\nprint(balanced.rdd.getNumPartitions())\nprint(balanced.count())",
      "output": "3\n12",
      "walkthrough": [
        "Create twelve rows in two starting partitions.",
        "Request three partitions; this introduces redistribution.",
        "Inspect the count with the classic RDD API, then verify no rows were lost. This small example is not a speed benchmark."
      ]
    },
    "practice": {
      "task": "Create 20 rows in four partitions, reduce to two with coalesce, and verify the row count.",
      "hint": "Use range(0, 20, 1, 4), coalesce(2), and count().",
      "solution": "rows = spark.range(0, 20, 1, 4)\nsmaller = rows.coalesce(2)\nprint(smaller.rdd.getNumPartitions())\nprint(smaller.count())",
      "output": "2\n20"
    },
    "interview": [
      {
        "question": "repartition versus coalesce?",
        "answer": "repartition redistributes with a shuffle and can increase or decrease count. coalesce is typically used to reduce count with less movement, but can leave uneven or insufficient parallelism.",
        "followup": "When could coalesce(1) become a bottleneck?"
      },
      {
        "question": "What is data skew?",
        "answer": "A few keys or partitions contain much more work than others. You may see most tasks finish while a few take much longer. Inspect the distribution before choosing a remedy.",
        "followup": "Would randomly adding workers fix one dominant key?"
      }
    ],
    "mistakes": [
      {
        "title": "Always forcing one partition",
        "why": "One task may have to process the final dataset, limiting throughput.",
        "better": "Keep enough parallel work unless a genuinely small output requires one partition.",
        "before": "large_result = rows.coalesce(1)",
        "after": "# Choose output size and parallelism deliberately\nresult = rows"
      },
      {
        "title": "Confusing partitionBy with execution partition count",
        "why": "Output directory organization does not guarantee balanced processing tasks.",
        "better": "Treat file layout and runtime parallelism as separate design choices.",
        "before": "# partitionBy(\"country\") does not mean one worker per country",
        "after": "# Inspect runtime tasks separately from output folders"
      }
    ],
    "quiz": [
      {
        "question": "Can repartition increase the number of partitions?",
        "options": [
          "Yes",
          "No"
        ],
        "correct": 0,
        "explanation": "It can redistribute into more or fewer partitions."
      },
      {
        "question": "A long-running task with far more data may indicate…",
        "options": [
          "Data skew",
          "A temporary view",
          "A schema alias"
        ],
        "correct": 0,
        "explanation": "Skew creates uneven amounts of work."
      },
      {
        "question": "Does coalesce(1) guarantee faster output?",
        "options": [
          "Yes",
          "No"
        ],
        "correct": 1,
        "explanation": "It can funnel work into a bottleneck."
      }
    ]
  },
  {
    "id": "performance",
    "title": "Performance",
    "minutes": 30,
    "description": "Diagnose expensive work before changing settings, and learn when reuse and join strategies help.",
    "concepts": [
      [
        "Measure before tuning",
        "Inspect the execution plan and Spark UI. Look for large shuffles, long tasks, unexpected row growth, and repeated scans. Change one thing at a time with the same inputs and required output."
      ],
      [
        "Reuse intentionally",
        "Caching stores computed data for reuse. It is lazy: an action materializes the cache. Keeping a result that is used only once can waste resources; release cached data with unpersist when finished."
      ],
      [
        "Reduce unnecessary work",
        "Select required columns and filter when logically safe. A broadcast join can avoid shuffling a large side when the other side is small enough; it is not safe to broadcast arbitrarily large tables. Adaptive execution can adjust plans using runtime statistics."
      ]
    ],
    "flow": [
      "Measure",
      "Inspect plan",
      "Change one thing",
      "Compare"
    ],
    "example": {
      "code": "from pyspark.sql import functions as F\nrows = spark.range(100)\nreused = rows.filter(\"id % 2 = 0\").cache()\nprint(reused.count())\nreused.agg(F.sum(\"id\").alias(\"total\")).show()\nreused.unpersist()",
      "output": "50\ntotal\n2450",
      "walkthrough": [
        "Describe and cache the even-number result.",
        "The count action computes it; a later aggregate can reuse it.",
        "Release cached data when no longer needed. This illustrates reuse, not a guaranteed speed improvement."
      ]
    },
    "practice": {
      "task": "Cache numbers 0 through 9, request a count and maximum, then release the cache.",
      "hint": "Use cache(), count(), agg(max()), and unpersist().",
      "solution": "from pyspark.sql import functions as F\nrows = spark.range(10).cache()\nprint(rows.count())\nrows.agg(F.max(\"id\").alias(\"maximum\")).show()\nrows.unpersist()",
      "output": "10\nmaximum\n9"
    },
    "interview": [
      {
        "question": "Why can caching make a job worse?",
        "answer": "Caching consumes resources and adds materialization cost. A result used once, a cheap computation, or pressure on storage can make reuse unattractive. Measure the complete workload.",
        "followup": "How would you distinguish cold-cache and warm-cache timings?"
      },
      {
        "question": "When would you use a broadcast join?",
        "answer": "When one side is small enough to distribute safely to executors. Check size and memory limits, the join type, and the chosen plan; do not force it merely because a join is slow.",
        "followup": "What could happen if that small table grows dramatically?"
      },
      {
        "question": "How do you compare two implementations fairly?",
        "answer": "Use the same input and required output, trigger full computation, control resources and cache state, and repeat runs. Inspect the plan to ensure the actions actually measure the intended work.",
        "followup": "Why is timing only DataFrame construction insufficient?"
      }
    ],
    "mistakes": [
      {
        "title": "Caching everything",
        "why": "Unused cached results compete with useful work.",
        "better": "Cache expensive reused results and release them after use.",
        "before": "rows.cache()  # No reuse planned",
        "after": "rows.show(5)  # No cache needed for one inspection"
      },
      {
        "title": "Tuning based on a single quick run",
        "why": "Warm caches and startup costs can distort results.",
        "better": "Repeat comparable end-to-end runs and record plan changes.",
        "before": "# Time only filter()",
        "after": "# Trigger the intended action; control cache state"
      }
    ],
    "quiz": [
      {
        "question": "When is a cache first populated?",
        "options": [
          "When cache() is called",
          "When an action computes it"
        ],
        "correct": 1,
        "explanation": "cache() marks the result; an action materializes it."
      },
      {
        "question": "What should you check before forcing a broadcast?",
        "options": [
          "The table name",
          "Actual size and memory safety"
        ],
        "correct": 1,
        "explanation": "Each executor must be able to handle the distributed side."
      },
      {
        "question": "What makes a benchmark fair?",
        "options": [
          "Different inputs",
          "Same work and controlled conditions"
        ],
        "correct": 1,
        "explanation": "Match inputs, outputs, resources, and cache state."
      }
    ]
  },
  {
    "id": "hands-on-task",
    "title": "Hands-on Task",
    "minutes": 40,
    "description": "Build a small sales-quality pipeline: validate rows, calculate totals, and explain the result.",
    "concepts": [
      [
        "Your brief",
        "A sales team needs positive revenue totals by country. Incoming rows contain duplicate order IDs, missing countries, and refunds. For this exercise, exclude non-positive amounts; a real revenue definition might include refunds."
      ],
      [
        "Acceptance criteria",
        "Keep one copy of identical orders, remove missing countries and non-positive amounts, then sum by country. Expected totals: IN = 120 and US = 50. Sort only to make the displayed answer predictable."
      ],
      [
        "Explain your decisions",
        "State why the schema uses a whole-number amount in this toy dataset. Real currency usually needs an agreed decimal representation. Conflicting records with the same order ID require a business rule—not arbitrary deduplication."
      ]
    ],
    "flow": [
      "Source",
      "Validate",
      "Deduplicate",
      "Aggregate"
    ],
    "example": {
      "code": "sales = spark.createDataFrame([\n    (1, \"IN\", 100), (1, \"IN\", 100), (2, \"US\", 50),\n    (3, \"IN\", 20), (4, None, 10), (5, \"US\", -5)\n], \"order_id INT, country STRING, amount INT\")\nsales.orderBy(\"order_id\").show()",
      "output": "6 input rows. One identical duplicate, one missing country, and one negative amount.",
      "walkthrough": [
        "Six toy orders make the data-quality cases visible.",
        "An explicit schema supplies predictable names and types.",
        "Inspect the data before deciding which rows should contribute."
      ]
    },
    "practice": {
      "task": "Produce valid positive totals by country. Verify two result rows, IN = 120 and US = 50, and explain what you excluded.",
      "hint": "Filter missing countries and amounts <= 0, drop identical duplicate rows, group by country, then sum amount.",
      "solution": "from pyspark.sql import functions as F\nsales = spark.createDataFrame([\n    (1, \"IN\", 100), (1, \"IN\", 100), (2, \"US\", 50),\n    (3, \"IN\", 20), (4, None, 10), (5, \"US\", -5)\n], \"order_id INT, country STRING, amount INT\")\nvalid = sales.filter(\"country IS NOT NULL AND amount > 0\")\nunique = valid.dropDuplicates()\ntotals = unique.groupBy(\"country\").agg(F.sum(\"amount\").alias(\"total\"))\ntotals.orderBy(\"country\").show()\nprint(totals.count())",
      "output": "country | total\nIN      | 120\nUS      | 50\n2"
    },
    "interview": [
      {
        "question": "How would you handle two different values for the same order ID?",
        "answer": "Define an authoritative ordering or rejection policy, such as keeping the latest valid event using a trusted timestamp and tie-breaker. Dropping duplicates by ID alone can select an arbitrary row.",
        "followup": "What if two updates have the same timestamp?"
      },
      {
        "question": "Why did this exercise exclude refunds?",
        "answer": "It measures positive sales, not net revenue. The choice is part of the stated requirement; production metrics must agree on how refunds, cancellations, and currencies are represented.",
        "followup": "How would the US total change if the refund were included?"
      }
    ],
    "mistakes": [
      {
        "title": "Deduplicating after aggregation",
        "why": "Duplicated transactions already inflate the totals by then.",
        "better": "Remove the intended duplicates before summing.",
        "before": "sales.groupBy(\"country\").sum(\"amount\").dropDuplicates()",
        "after": "sales.dropDuplicates().groupBy(\"country\").sum(\"amount\")"
      },
      {
        "title": "Treating all repeated IDs as identical",
        "why": "The same ID can describe conflicting values or legitimate updates.",
        "better": "Distinguish identical copies from updates using a defined business rule.",
        "before": "sales.dropDuplicates([\"order_id\"])  # Arbitrary with conflicting values",
        "after": "# Resolve conflicts using a trusted timestamp and deterministic tie-breaker"
      }
    ],
    "quiz": [
      {
        "question": "When should identical duplicate orders be removed?",
        "options": [
          "Before totals",
          "After totals"
        ],
        "correct": 0,
        "explanation": "Once duplicates have inflated an aggregate, dropping duplicate aggregate rows cannot fix it."
      },
      {
        "question": "Why is IN 120?",
        "options": [
          "100 + 100 + 20",
          "100 + 20"
        ],
        "correct": 1,
        "explanation": "The repeated identical 100 order contributes only once."
      },
      {
        "question": "A missing country should be…",
        "options": [
          "Handled according to a stated quality rule",
          "Silently invented"
        ],
        "correct": 0,
        "explanation": "This exercise excludes it; another workflow might quarantine it for investigation."
      }
    ]
  },
  {
    "id": "interview-questions",
    "title": "Interview Questions",
    "minutes": 30,
    "description": "Practice explaining Spark decisions, diagnosing bottlenecks, and stating trade-offs clearly.",
    "concepts": [
      [
        "Structure a useful answer",
        "Start with a direct answer. Explain the mechanism in plain words. Give one example, then name a limitation or trade-off."
      ],
      [
        "Reason from evidence",
        "When a job is slow, ask about input size, plans, task duration, skew, and repeated work before suggesting settings."
      ],
      [
        "Practice out loud",
        "Aim for a clear initial answer, then expand when prompted. The self-check is for your own review; the website does not grade free-text answers."
      ]
    ],
    "flow": [
      "Answer",
      "Mechanism",
      "Example",
      "Trade-off"
    ],
    "example": {
      "code": "from pyspark.sql import functions as F\nrows = spark.range(100)\nreused = rows.filter(\"id % 2 = 0\").cache()\nprint(reused.count())\nreused.agg(F.sum(\"id\").alias(\"total\")).show()\nreused.unpersist()",
      "output": "50\ntotal\n2450",
      "walkthrough": [
        "Describe and cache the even-number result.",
        "The count action computes it; a later aggregate can reuse it.",
        "Release cached data when no longer needed. This illustrates reuse, not a guaranteed speed improvement."
      ]
    },
    "practice": {
      "task": "Explain why a repeated aggregation might benefit from caching, and when it would not. Run the Performance example to ground your explanation.",
      "hint": "Distinguish the initial materialization cost from subsequent reuse.",
      "solution": "from pyspark.sql import functions as F\nrows = spark.range(100)\nreused = rows.filter(\"id % 2 = 0\").cache()\nprint(reused.count())\nreused.agg(F.sum(\"id\").alias(\"total\")).show()\nreused.unpersist()",
      "output": "50\ntotal\n2450"
    },
    "interview": [
      {
        "question": "What are the driver and executors?",
        "answer": "The driver plans and coordinates the application; executors perform assigned tasks. Explain where data is processed rather than saying Spark runs everything on the driver.",
        "followup": "Why could collect() overload the driver?"
      },
      {
        "question": "When would you avoid Spark?",
        "answer": "For a small dataset and simple calculation, a local tool may be simpler and faster. Consider startup, network, and operational overhead before choosing a distributed engine.",
        "followup": "How would you measure whether Spark is justified?"
      },
      {
        "question": "Is Spark SQL faster than equivalent DataFrame code?",
        "answer": "Both use Spark SQL’s execution engine. Equivalent built-in expressions often produce similar plans; inspect explain() rather than assuming a language makes a query faster.",
        "followup": "When could the two expressions produce different plans?"
      },
      {
        "question": "WHERE versus HAVING?",
        "answer": "WHERE filters input rows before grouping. HAVING filters the grouped results. For example, use WHERE for positive transactions and HAVING for total sales above a threshold.",
        "followup": "What changes if negative refunds are filtered before summing?"
      },
      {
        "question": "Does a temporary view save data?",
        "answer": "No. It names a queryable DataFrame within a session. Use a deliberate write to persist data; a temporary view is not a durable table.",
        "followup": "What happens when that Spark session ends?"
      },
      {
        "question": "Transformation versus action?",
        "answer": "A transformation describes another dataset; an action requests a result. filter is a transformation and count is an action. Lazy processing allows Spark to optimize a chain before running it.",
        "followup": "Why is timing only filter() misleading?"
      },
      {
        "question": "Narrow versus wide dependencies?",
        "answer": "Narrow work uses limited parent partitions without redistributing all matching keys. Wide work can require a shuffle, such as groupBy aggregations, creating additional stage boundaries.",
        "followup": "Why might a shuffle be unavoidable for an aggregation?"
      },
      {
        "question": "repartition versus coalesce?",
        "answer": "repartition redistributes with a shuffle and can increase or decrease count. coalesce is typically used to reduce count with less movement, but can leave uneven or insufficient parallelism.",
        "followup": "When could coalesce(1) become a bottleneck?"
      },
      {
        "question": "What is data skew?",
        "answer": "A few keys or partitions contain much more work than others. You may see most tasks finish while a few take much longer. Inspect the distribution before choosing a remedy.",
        "followup": "Would randomly adding workers fix one dominant key?"
      },
      {
        "question": "Why can caching make a job worse?",
        "answer": "Caching consumes resources and adds materialization cost. A result used once, a cheap computation, or pressure on storage can make reuse unattractive. Measure the complete workload.",
        "followup": "How would you distinguish cold-cache and warm-cache timings?"
      },
      {
        "question": "When would you use a broadcast join?",
        "answer": "When one side is small enough to distribute safely to executors. Check size and memory limits, the join type, and the chosen plan; do not force it merely because a join is slow.",
        "followup": "What could happen if that small table grows dramatically?"
      },
      {
        "question": "How do you compare two implementations fairly?",
        "answer": "Use the same input and required output, trigger full computation, control resources and cache state, and repeat runs. Inspect the plan to ensure the actions actually measure the intended work.",
        "followup": "Why is timing only DataFrame construction insufficient?"
      }
    ],
    "mistakes": [
      {
        "title": "Answering only with product names",
        "why": "Naming Catalyst or AQE does not show that you understand their role.",
        "better": "Explain what work changes and why it matters.",
        "before": "\"Use Catalyst.\"",
        "after": "\"Spark can improve a structured query plan before running it.\""
      },
      {
        "title": "Claiming one API is always fastest",
        "why": "Performance depends on the actual workload and execution.",
        "better": "State the usual case, the exception, and how you would measure.",
        "before": "\"DataFrames always win.\"",
        "after": "\"Start with DataFrames for table operations; compare actual plans and work.\""
      }
    ],
    "quiz": [
      {
        "question": "Which component coordinates an application?",
        "options": [
          "Driver",
          "Executor",
          "CSV file"
        ],
        "correct": 0,
        "explanation": "The driver coordinates; executors carry out the tasks."
      },
      {
        "question": "Why can Spark be excessive for a tiny dataset?",
        "options": [
          "It cannot read small files",
          "Distributed coordination adds overhead",
          "It requires SQL"
        ],
        "correct": 1,
        "explanation": "Startup and scheduling can cost more than a small calculation."
      },
      {
        "question": "How do you find missing amounts?",
        "options": [
          "amount = NULL",
          "amount IS NULL",
          "amount = 0"
        ],
        "correct": 1,
        "explanation": "NULL is not zero; use IS NULL."
      },
      {
        "question": "Does filter mutate its input DataFrame?",
        "options": [
          "Yes",
          "No"
        ],
        "correct": 1,
        "explanation": "It returns a new DataFrame."
      },
      {
        "question": "What should you retain after a transformation?",
        "options": [
          "The returned DataFrame",
          "Only the old variable"
        ],
        "correct": 0,
        "explanation": "The new DataFrame represents the requested change."
      },
      {
        "question": "A long-running task with far more data may indicate…",
        "options": [
          "Data skew",
          "A temporary view",
          "A schema alias"
        ],
        "correct": 0,
        "explanation": "Skew creates uneven amounts of work."
      },
      {
        "question": "When is a cache first populated?",
        "options": [
          "When cache() is called",
          "When an action computes it"
        ],
        "correct": 1,
        "explanation": "cache() marks the result; an action materializes it."
      },
      {
        "question": "What makes a benchmark fair?",
        "options": [
          "Different inputs",
          "Same work and controlled conditions"
        ],
        "correct": 1,
        "explanation": "Match inputs, outputs, resources, and cache state."
      }
    ]
  },
  {
    "id": "quiz",
    "title": "Quiz",
    "minutes": 20,
    "description": "Check your understanding across Spark architecture, SQL, transformations, partitioning, and tuning.",
    "concepts": [
      [
        "How to take this check",
        "Choose an answer for every question, then submit to see your score and explanations. You can retry; your answers are not sent to a server."
      ],
      [
        "Review the reason",
        "A correct guess is not the same as understanding. Explain why the alternative choices do not fit."
      ],
      [
        "Return to a weak topic",
        "Use the lesson playlist to revisit a topic, then retake this check. Your latest submitted result stays on this device when storage is available."
      ]
    ],
    "flow": [
      "Attempt",
      "Submit",
      "Review",
      "Retry"
    ],
    "example": {
      "code": "from pyspark.sql import functions as F\nitems = spark.createDataFrame([(1, 10), (2, 30), (3, 20)], \"id INT, price INT\")\nresult = items.filter(\"price >= 20\").select(\n    \"id\", (F.col(\"price\") * 2).alias(\"double_price\")\n)\nresult.orderBy(\"id\").show()",
      "output": "id | double_price\n2  | 60\n3  | 40",
      "walkthrough": [
        "Create three items with integer prices.",
        "Keep items priced at least 20 and describe a computed column.",
        "orderBy and show produce a predictable displayed result; items is unchanged."
      ]
    },
    "practice": {
      "task": "Keep prices strictly above 10 and add 5 to each price. Display id and the new price.",
      "hint": "Use filter followed by select and alias; finish with orderBy and show.",
      "solution": "from pyspark.sql import functions as F\nitems = spark.createDataFrame([(1, 10), (2, 30), (3, 20)], \"id INT, price INT\")\nitems.filter(\"price > 10\").select(\"id\", (F.col(\"price\") + 5).alias(\"new_price\")).orderBy(\"id\").show()",
      "output": "id | new_price\n2  | 35\n3  | 25"
    },
    "interview": [
      {
        "question": "Transformation versus action?",
        "answer": "A transformation describes another dataset; an action requests a result. filter is a transformation and count is an action. Lazy processing allows Spark to optimize a chain before running it.",
        "followup": "Why is timing only filter() misleading?"
      },
      {
        "question": "Narrow versus wide dependencies?",
        "answer": "Narrow work uses limited parent partitions without redistributing all matching keys. Wide work can require a shuffle, such as groupBy aggregations, creating additional stage boundaries.",
        "followup": "Why might a shuffle be unavoidable for an aggregation?"
      }
    ],
    "mistakes": [
      {
        "title": "Discarding a returned DataFrame",
        "why": "Transformations do not mutate the original variable.",
        "better": "Keep the new result or chain the operation.",
        "before": "items.filter(\"price > 10\")\nitems.show()",
        "after": "filtered = items.filter(\"price > 10\")\nfiltered.show()"
      },
      {
        "title": "Using actions inside every processing step",
        "why": "Repeated result requests can cause extra jobs and unnecessary data transfer.",
        "better": "Build the required expression chain, then request the result.",
        "before": "items.count()\nitems.filter(\"price > 10\").count()\nitems.filter(\"price > 10\").show()",
        "after": "filtered = items.filter(\"price > 10\")\nfiltered.show()"
      }
    ],
    "quiz": [
      {
        "question": "Which component coordinates an application?",
        "options": [
          "Driver",
          "Executor",
          "CSV file"
        ],
        "correct": 0,
        "explanation": "The driver coordinates; executors carry out the tasks."
      },
      {
        "question": "Which requests a computed result?",
        "options": [
          "filter()",
          "select()",
          "count()"
        ],
        "correct": 2,
        "explanation": "count() is an action; filter and select describe transformations."
      },
      {
        "question": "Why can Spark be excessive for a tiny dataset?",
        "options": [
          "It cannot read small files",
          "Distributed coordination adds overhead",
          "It requires SQL"
        ],
        "correct": 1,
        "explanation": "Startup and scheduling can cost more than a small calculation."
      },
      {
        "question": "Which clause filters grouped totals?",
        "options": [
          "WHERE",
          "HAVING",
          "ORDER BY"
        ],
        "correct": 1,
        "explanation": "HAVING evaluates conditions on grouped results."
      },
      {
        "question": "How do you find missing amounts?",
        "options": [
          "amount = NULL",
          "amount IS NULL",
          "amount = 0"
        ],
        "correct": 1,
        "explanation": "NULL is not zero; use IS NULL."
      },
      {
        "question": "A temporary view is…",
        "options": [
          "A permanent copy",
          "A session-scoped query name",
          "A cache"
        ],
        "correct": 1,
        "explanation": "It names a DataFrame in a session without making a durable copy."
      },
      {
        "question": "Does filter mutate its input DataFrame?",
        "options": [
          "Yes",
          "No"
        ],
        "correct": 1,
        "explanation": "It returns a new DataFrame."
      },
      {
        "question": "Which operation commonly needs a shuffle?",
        "options": [
          "select a column",
          "filter a row",
          "groupBy a key"
        ],
        "correct": 2,
        "explanation": "Grouping usually brings matching keys together across partitions."
      },
      {
        "question": "What should you retain after a transformation?",
        "options": [
          "The returned DataFrame",
          "Only the old variable"
        ],
        "correct": 0,
        "explanation": "The new DataFrame represents the requested change."
      },
      {
        "question": "Can repartition increase the number of partitions?",
        "options": [
          "Yes",
          "No"
        ],
        "correct": 0,
        "explanation": "It can redistribute into more or fewer partitions."
      },
      {
        "question": "A long-running task with far more data may indicate…",
        "options": [
          "Data skew",
          "A temporary view",
          "A schema alias"
        ],
        "correct": 0,
        "explanation": "Skew creates uneven amounts of work."
      },
      {
        "question": "Does coalesce(1) guarantee faster output?",
        "options": [
          "Yes",
          "No"
        ],
        "correct": 1,
        "explanation": "It can funnel work into a bottleneck."
      },
      {
        "question": "When is a cache first populated?",
        "options": [
          "When cache() is called",
          "When an action computes it"
        ],
        "correct": 1,
        "explanation": "cache() marks the result; an action materializes it."
      },
      {
        "question": "What should you check before forcing a broadcast?",
        "options": [
          "The table name",
          "Actual size and memory safety"
        ],
        "correct": 1,
        "explanation": "Each executor must be able to handle the distributed side."
      },
      {
        "question": "What makes a benchmark fair?",
        "options": [
          "Different inputs",
          "Same work and controlled conditions"
        ],
        "correct": 1,
        "explanation": "Match inputs, outputs, resources, and cache state."
      },
      {
        "question": "When should identical duplicate orders be removed?",
        "options": [
          "Before totals",
          "After totals"
        ],
        "correct": 0,
        "explanation": "Once duplicates have inflated an aggregate, dropping duplicate aggregate rows cannot fix it."
      },
      {
        "question": "Why is IN 120?",
        "options": [
          "100 + 100 + 20",
          "100 + 20"
        ],
        "correct": 1,
        "explanation": "The repeated identical 100 order contributes only once."
      },
      {
        "question": "A missing country should be…",
        "options": [
          "Handled according to a stated quality rule",
          "Silently invented"
        ],
        "correct": 0,
        "explanation": "This exercise excludes it; another workflow might quarantine it for investigation."
      }
    ]
  },
  {
    "id": "summary",
    "title": "Summary",
    "minutes": 10,
    "description": "Connect the module’s ideas and prepare to explain a complete Spark workflow.",
    "concepts": [
      [
        "Start with the right model",
        "Spark coordinates parallel work. Prefer structured expressions for common table operations, and reach for lower-level control when you can explain why it is needed."
      ],
      [
        "Plan, execute, inspect",
        "Transformations describe a result; actions request it. SQL and DataFrames share an engine. Inspect plans and actual task behavior instead of inferring performance from code length."
      ],
      [
        "Make correctness explicit",
        "Define types, missing-value rules, duplicate handling, and expected output. Then consider partition balance, caching, and joins. Faster wrong answers are still wrong."
      ],
      [
        "What you should now demonstrate",
        "Explain driver and executors; write a grouped SQL query; distinguish transformations and actions; explain a shuffle; justify caching; and complete the sales mini-project."
      ]
    ],
    "flow": [
      "Define result",
      "Build pipeline",
      "Check correctness",
      "Measure"
    ],
    "example": {
      "code": "sales = spark.createDataFrame([\n    (1, \"IN\", 100), (1, \"IN\", 100), (2, \"US\", 50),\n    (3, \"IN\", 20), (4, None, 10), (5, \"US\", -5)\n], \"order_id INT, country STRING, amount INT\")\nsales.orderBy(\"order_id\").show()",
      "output": "6 input rows. One identical duplicate, one missing country, and one negative amount.",
      "walkthrough": [
        "Six toy orders make the data-quality cases visible.",
        "An explicit schema supplies predictable names and types.",
        "Inspect the data before deciding which rows should contribute."
      ]
    },
    "practice": {
      "task": "Produce valid positive totals by country. Verify two result rows, IN = 120 and US = 50, and explain what you excluded.",
      "hint": "Filter missing countries and amounts <= 0, drop identical duplicate rows, group by country, then sum amount.",
      "solution": "from pyspark.sql import functions as F\nsales = spark.createDataFrame([\n    (1, \"IN\", 100), (1, \"IN\", 100), (2, \"US\", 50),\n    (3, \"IN\", 20), (4, None, 10), (5, \"US\", -5)\n], \"order_id INT, country STRING, amount INT\")\nvalid = sales.filter(\"country IS NOT NULL AND amount > 0\")\nunique = valid.dropDuplicates()\ntotals = unique.groupBy(\"country\").agg(F.sum(\"amount\").alias(\"total\"))\ntotals.orderBy(\"country\").show()\nprint(totals.count())",
      "output": "country | total\nIN      | 120\nUS      | 50\n2"
    },
    "interview": [
      {
        "question": "Walk through a Spark pipeline from input to result.",
        "answer": "Define the input schema and quality rules, express transformations, request the output, verify correctness, then inspect expensive stages. Choose performance changes based on evidence and explain their trade-offs.",
        "followup": "Which checks would you automate before shipping it?"
      }
    ],
    "mistakes": [
      {
        "title": "Skipping correctness before optimization",
        "why": "A fast pipeline can still double-count or lose records.",
        "better": "Write expected results and quality checks before tuning.",
        "before": "# Tune partition count before checking totals",
        "after": "# Validate totals and excluded rows, then inspect the plan"
      }
    ],
    "quiz": [
      {
        "question": "Which component coordinates an application?",
        "options": [
          "Driver",
          "Executor",
          "CSV file"
        ],
        "correct": 0,
        "explanation": "The driver coordinates; executors carry out the tasks."
      },
      {
        "question": "Which clause filters grouped totals?",
        "options": [
          "WHERE",
          "HAVING",
          "ORDER BY"
        ],
        "correct": 1,
        "explanation": "HAVING evaluates conditions on grouped results."
      },
      {
        "question": "Which operation commonly needs a shuffle?",
        "options": [
          "select a column",
          "filter a row",
          "groupBy a key"
        ],
        "correct": 2,
        "explanation": "Grouping usually brings matching keys together across partitions."
      },
      {
        "question": "A long-running task with far more data may indicate…",
        "options": [
          "Data skew",
          "A temporary view",
          "A schema alias"
        ],
        "correct": 0,
        "explanation": "Skew creates uneven amounts of work."
      },
      {
        "question": "When is a cache first populated?",
        "options": [
          "When cache() is called",
          "When an action computes it"
        ],
        "correct": 1,
        "explanation": "cache() marks the result; an action materializes it."
      }
    ]
  }
];

