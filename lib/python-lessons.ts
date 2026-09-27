import type { SparkLesson } from "@/lib/spark-lessons";

// Content module for "Python for Data Engineering". Lesson ids are prefixed
// with "py-" so they never collide with the Spark module's ids inside
// SparkTopicVisual, which switches purely on lesson.id.
export const pythonLessons: SparkLesson[] = [
  {
    id: "py-introduction",
    title: "Introduction",
    minutes: 15,
    description: "Understand where plain Python fits in a data engineering stack, and when to reach for something else.",
    concepts: [
      [
        "Python as the glue language",
        "Data engineers use Python to orchestrate, connect, and transform — calling APIs, scheduling tasks, writing small ETL scripts, and gluing together warehouses, queues, and cloud storage. It complements SQL and Spark rather than replacing them.",
      ],
      [
        "Interpreted and dynamically typed",
        "Python checks most types at runtime, not before running. A TypeError you might catch at compile time in a typed language instead surfaces mid-pipeline, in production, unless you add validation or type hints plus a checker like mypy.",
      ],
      [
        "One process, one interpreter lock",
        "CPython's Global Interpreter Lock lets only one thread execute Python bytecode at a time. Threads still help for I/O-bound waiting, such as API calls; CPU-bound transformation work usually needs multiprocessing or a different engine, not more threads.",
      ],
    ],
    flow: ["Extract", "Transform", "Load", "Validate"],
    example: {
      code: 'import csv\n\ndef total_amount(path):\n    total = 0\n    with open(path, newline="") as handle:\n        for row in csv.DictReader(handle):\n            total += int(row["amount"])\n    return total\n\nprint(total_amount("orders.csv"))',
      output: "170",
      walkthrough: [
        "csv.DictReader turns each row into a dict keyed by the header, so row['amount'] is a plain string.",
        "int(row['amount']) converts before adding — Python will not do this for you inside +=.",
        "The with block closes the file automatically, even if a row raises an exception midway.",
      ],
    },
    practice: {
      task: "Write a function that reads the same orders.csv and returns the number of orders with amount greater than 60, without using pandas.",
      hint: "Use csv.DictReader, compare int(row['amount']) > 60 inside the loop, and increment a counter.",
      solution: 'import csv\n\ndef count_large_orders(path, threshold=60):\n    count = 0\n    with open(path, newline="") as handle:\n        for row in csv.DictReader(handle):\n            if int(row["amount"]) > threshold:\n                count += 1\n    return count\n\nprint(count_large_orders("orders.csv"))',
      output: "1",
    },
    interview: [
      {
        question: "Why would a data engineer reach for Python instead of SQL for a task?",
        answer: "When the logic needs branching, external calls, file-format handling, or orchestration that SQL doesn't express well — SQL stays the better tool for set-based transformations over data already in a warehouse.",
        followup: "How would you decide whether a transformation belongs in SQL or in a Python step?",
      },
      {
        question: "What does the GIL mean for a CPU-heavy transformation script?",
        answer: "Only one thread runs Python bytecode at a time, so adding threads won't speed up pure computation. Use multiprocessing to use multiple cores, or move the heavy lifting into a vectorized library or a different engine.",
        followup: "Why do threads still help for a script that mostly waits on network calls?",
      },
    ],
    mistakes: [
      {
        title: "Assuming CSV values arrive typed",
        why: "csv.DictReader returns every field as a string, including numbers.",
        better: "Convert explicitly (int(), float(), or a validation step) right after reading.",
        before: 'total = 0\nfor row in csv.DictReader(handle):\n    total += row["amount"]  # TypeError: str + int',
        after: 'total = 0\nfor row in csv.DictReader(handle):\n    total += int(row["amount"])',
      },
    ],
    quiz: [
      {
        question: "What type is row['amount'] when read with csv.DictReader?",
        options: ["int", "str", "float"],
        correct: 1,
        explanation: "csv.DictReader always returns string values; the caller must convert them.",
      },
    ],
  },
  {
    id: "py-data-structures",
    title: "Data Structures for ETL",
    minutes: 15,
    description: "Choose the right built-in structure for a transformation, and understand what makes them safe to share.",
    concepts: [
      [
        "Choose the structure for the operation",
        "A list preserves order and allows duplicates — good for a stream of records. A dict maps keys to values for fast lookups by key. A set stores unique items and supports fast membership tests. A tuple is an immutable, fixed-size grouping.",
      ],
      [
        "Comprehensions describe, not loop",
        "A list, dict, or set comprehension states what the result should contain, similar to how SELECT states which rows and columns you want. It usually reads clearer than an equivalent append-in-a-loop for a single transformation.",
      ],
      [
        "Mutability is a hidden dependency",
        "Lists, dicts, and sets are mutable; two variables can reference the same object, so mutating one affects the other. Tuples and strings are immutable and safe to share without that risk.",
      ],
    ],
    flow: ["Records", "Filter", "Transform", "Structure"],
    example: {
      code: 'orders = [\n    {"order_id": 1, "country": "IN", "amount": 100},\n    {"order_id": 2, "country": "US", "amount": 50},\n    {"order_id": 3, "country": "IN", "amount": 20},\n]\n\nin_amounts = [o["amount"] for o in orders if o["country"] == "IN"]\nprint(in_amounts)',
      output: "[100, 20]",
      walkthrough: [
        "The list comprehension keeps only orders where country == 'IN', mirroring a WHERE clause.",
        "orders itself is unchanged; the comprehension builds a new list.",
        "For very large inputs, a generator expression (parentheses instead of brackets) avoids building the whole list in memory.",
      ],
    },
    practice: {
      task: "Build a dict mapping each distinct country to the number of orders from that country, without pandas.",
      hint: "Loop once and use dict.get(key, 0) + 1, or collections.Counter.",
      solution: 'from collections import Counter\n\norders = [\n    {"order_id": 1, "country": "IN", "amount": 100},\n    {"order_id": 2, "country": "US", "amount": 50},\n    {"order_id": 3, "country": "IN", "amount": 20},\n]\n\ncounts = Counter(o["country"] for o in orders)\nprint(dict(counts))',
      output: "{'IN': 2, 'US': 1}",
    },
    interview: [
      {
        question: "When would you choose a dict over a list of tuples for the same data?",
        answer: "When you need to look up a record by a known key in roughly constant time; a list requires scanning every element, which costs time proportional to the list's length per lookup.",
        followup: "How does that change if the key is not unique across records?",
      },
      {
        question: "Why might a list comprehension be preferred over a for-loop with .append() for a single transformation?",
        answer: "It reads as one expression describing the whole result, and it can't accidentally mutate an unrelated variable the way a loop with a shared accumulator sometimes can. Performance is usually similar.",
        followup: "When would a plain loop still be the clearer choice?",
      },
    ],
    mistakes: [
      {
        title: "Mutating a list while iterating over it",
        why: "Removing or appending items during iteration skips elements or produces surprising results.",
        better: "Build a new filtered list instead of mutating the one you're iterating over.",
        before: 'for order in orders:\n    if order["amount"] < 30:\n        orders.remove(order)  # can skip the next item',
        after: 'orders = [o for o in orders if o["amount"] >= 30]',
      },
    ],
    quiz: [
      {
        question: "Which structure guarantees unique elements?",
        options: ["list", "set", "tuple"],
        correct: 1,
        explanation: "A set discards duplicate values automatically.",
      },
    ],
  },
  {
    id: "py-functions-modules",
    title: "Functions & Modules",
    minutes: 15,
    description: "Write functions that are safe to reuse, and understand a classic Python pitfall before it bites you in production.",
    concepts: [
      [
        "Functions document intent",
        "A well-named function with clear parameters communicates what a transformation does without reading its body. Keep functions small and single-purpose — it makes them easier to test and reuse across pipelines.",
      ],
      [
        "Default arguments are evaluated once",
        "A mutable default value, like [] or {}, is created a single time when the function is defined, and shared across every call that doesn't override it. Default to None and create the mutable object inside the function body instead.",
      ],
      [
        "Modules keep pipelines organized",
        "import splits a pipeline into files — extraction, transformation, loading. if __name__ == \"__main__\": lets a file be both an importable module and a runnable script without executing the script logic on import.",
      ],
    ],
    flow: ["Define", "Import", "Call", "Reuse"],
    example: {
      code: 'def clean_amount(raw, default=0):\n    try:\n        return int(raw)\n    except (TypeError, ValueError):\n        return default\n\nraw_amounts = ["100", "50", None, "bad"]\ncleaned = [clean_amount(value) for value in raw_amounts]\nprint(cleaned)',
      output: "[100, 50, 0, 0]",
      walkthrough: [
        "clean_amount isolates one responsibility: turn a raw value into a safe integer.",
        "The except clause names the specific exceptions int() actually raises, rather than catching everything.",
        "Reusing this function everywhere amounts are parsed avoids duplicating the same conversion logic.",
      ],
    },
    practice: {
      task: "Write add_order(order, orders) that appends order to orders and returns the updated list, without using a mutable default argument.",
      hint: "Default orders to None, then create a new list inside the function only if orders is None.",
      solution: 'def add_order(order, orders=None):\n    if orders is None:\n        orders = []\n    orders.append(order)\n    return orders\n\nfirst = add_order({"order_id": 1, "amount": 100})\nsecond = add_order({"order_id": 2, "amount": 50}, first)\nprint(second)',
      output: "[{'order_id': 1, 'amount': 100}, {'order_id': 2, 'amount': 50}]",
    },
    interview: [
      {
        question: "Why is a mutable default argument considered a bug magnet?",
        answer: "It's created once, at function definition time, and shared across every call — leading to state accumulating silently across unrelated calls that all rely on the default.",
        followup: "How would you refactor a function that already has this problem?",
      },
      {
        question: "What do *args and **kwargs let a function do?",
        answer: "Accept a variable number of positional and keyword arguments. They're useful for wrapper or decorator functions that forward a call without needing to know its exact signature in advance.",
        followup: "When would using them hurt readability instead of helping?",
      },
    ],
    mistakes: [
      {
        title: "Using a mutable default argument",
        why: "The same list or dict object is reused across every call, silently accumulating state.",
        better: "Default to None and create the mutable object inside the function.",
        before: "def add_item(item, items=[]):\n    items.append(item)\n    return items",
        after: "def add_item(item, items=None):\n    if items is None:\n        items = []\n    items.append(item)\n    return items",
      },
    ],
    quiz: [
      {
        question: "When is a default argument value created?",
        options: ["Once, when the function is defined", "Every time the function is called"],
        correct: 0,
        explanation: "Default values are evaluated once at definition time, which is why mutable defaults can leak state across calls.",
      },
    ],
  },
  {
    id: "py-files-formats",
    title: "Files & Data Formats",
    minutes: 20,
    description: "Read and write files safely, and pick the right format for moving data between pipeline stages.",
    concepts: [
      [
        "with closes what you open",
        "A context manager — the with statement — guarantees a file or connection is closed even if an exception is raised inside the block. A manual close() call risks being skipped whenever an earlier line raises.",
      ],
      [
        "Pick the format for the job",
        "CSV is simple and universal but untyped and row-oriented. JSON preserves nested structure and types like booleans, but isn't tabular. Parquet is columnar, typed, and compressed — the usual default for large data moving between pipeline stages.",
      ],
      [
        "Paths are not just strings",
        "pathlib.Path represents a filesystem path as an object with methods, such as .exists() and / for joining, which is safer across operating systems than concatenating strings with a hardcoded separator.",
      ],
    ],
    flow: ["Open", "Read", "Parse", "Close"],
    example: {
      code: 'import json\nfrom pathlib import Path\n\npath = Path("orders.json")\ndata = json.loads(path.read_text())\ntotal = sum(order["amount"] for order in data if order["country"] == "IN")\nprint(total)',
      output: "120",
      walkthrough: [
        "Path.read_text() opens, reads, and closes the file in one call — fine for small, config-sized files.",
        "json.loads parses the text into native Python lists and dicts; no manual type conversion is needed, unlike CSV.",
        "A generator expression inside sum() avoids building an intermediate list just to add its values.",
      ],
    },
    practice: {
      task: "Read orders.json and write a new file, valid_orders.json, containing only orders with a non-null country and a positive amount.",
      hint: "Filter with a list comprehension, then json.dump the result inside a with block that opens the new file for writing.",
      solution: 'import json\nfrom pathlib import Path\n\ndata = json.loads(Path("orders.json").read_text())\nvalid = [o for o in data if o.get("country") and o["amount"] > 0]\n\nwith open("valid_orders.json", "w") as handle:\n    json.dump(valid, handle, indent=2)\n\nprint(len(valid))',
      output: "3",
    },
    interview: [
      {
        question: "Why prefer Parquet over CSV between pipeline stages?",
        answer: "Parquet is columnar and typed, so downstream readers know the schema and can skip columns they don't need; CSV forces every consumer to reinfer or hardcode types and reads whole rows regardless of which columns are needed.",
        followup: "When might CSV still be the right choice?",
      },
      {
        question: "What does a context manager guarantee that a manual open()/close() does not?",
        answer: "The file closes even if an exception occurs inside the block, because the exit logic runs during unwinding; a manual close() call further down the function is skipped if an earlier line raises.",
        followup: "What's another common context manager used in data pipelines?",
      },
    ],
    mistakes: [
      {
        title: "Opening a file without a context manager",
        why: "If an exception happens before close(), the file handle can leak, holding a lock or descriptor open.",
        better: 'Use with open(...) as handle: so the file always closes when the block exits.',
        before: 'handle = open("orders.json")\ndata = json.load(handle)\nprocess(data)  # if this raises, close() never runs\nhandle.close()',
        after: 'with open("orders.json") as handle:\n    data = json.load(handle)\nprocess(data)',
      },
    ],
    quiz: [
      {
        question: "Which format is columnar and typed?",
        options: ["CSV", "JSON", "Parquet"],
        correct: 2,
        explanation: "Parquet stores data by column with an explicit schema, unlike row-oriented CSV or untyped-on-disk JSON.",
      },
    ],
  },
  {
    id: "py-error-handling",
    title: "Error Handling & Logging",
    minutes: 20,
    description: "Catch the errors you expect, let the rest surface, and make failures visible with logging instead of print.",
    concepts: [
      [
        "Catch what you expect",
        "A bare except: or except Exception: hides bugs by catching everything, including typos. Name the specific exception you anticipate — ValueError, KeyError, FileNotFoundError — so unexpected errors still surface.",
      ],
      [
        "finally always runs",
        "Code in a finally block executes whether the try block succeeds, raises a caught exception, or raises an uncaught one — a reasonable place to release a resource that isn't already handled by a context manager.",
      ],
      [
        "Logging beats print in a pipeline",
        "print() output is easy to lose once a script runs on a schedule; the logging module adds severity levels, timestamps, and configurable destinations, so failures stay visible without changing application code.",
      ],
    ],
    flow: ["Try", "Catch specific error", "Log", "Continue or raise"],
    example: {
      code: 'import logging\n\nlogging.basicConfig(level=logging.INFO)\nlogger = logging.getLogger("orders")\n\ndef parse_amount(raw):\n    try:\n        return int(raw)\n    except ValueError:\n        logger.warning("Could not parse amount: %r", raw)\n        return None\n\nresults = [parse_amount(v) for v in ["100", "bad", "50"]]\nprint(results)',
      output: "WARNING:orders:Could not parse amount: 'bad'\n[100, None, 50]",
      walkthrough: [
        "except ValueError only catches the conversion failure int() actually raises, letting other bugs surface normally.",
        "logger.warning records the bad value with a level a scheduler can filter on, unlike a plain print().",
        "The function returns None for an unparseable value instead of crashing the whole batch.",
      ],
    },
    practice: {
      task: "Write safe_divide(total, count) that returns total / count, logs a warning and returns 0 when count is 0, and lets any other exception propagate.",
      hint: "Catch only ZeroDivisionError; let other exceptions, like a TypeError from bad input, raise normally.",
      solution: 'import logging\nlogger = logging.getLogger("orders")\n\ndef safe_divide(total, count):\n    try:\n        return total / count\n    except ZeroDivisionError:\n        logger.warning("count was 0; returning 0 instead of dividing")\n        return 0\n\nprint(safe_divide(150, 3))\nprint(safe_divide(150, 0))',
      output: "50.0\nWARNING:orders:count was 0; returning 0 instead of dividing\n0",
    },
    interview: [
      {
        question: "Why is a broad except Exception: risky in a production pipeline?",
        answer: "It swallows every error, including ones you didn't anticipate — a typo or a missing import alongside the expected ones — which can silently corrupt output instead of failing loudly where the problem actually is.",
        followup: "When, if ever, is a broad except acceptable?",
      },
      {
        question: "What's the difference between logging a warning and raising an exception?",
        answer: "A warning records that something unexpected happened while letting the pipeline continue; raising stops execution at that point. The right choice depends on whether the pipeline can still produce a correct result without that record.",
        followup: "How would you decide which failures should stop a whole batch job?",
      },
    ],
    mistakes: [
      {
        title: "Catching every exception the same way",
        why: "A bare except or except Exception: hides programming errors alongside expected ones, making debugging much harder.",
        better: "Catch only the specific exception(s) the code can actually raise and handle meaningfully.",
        before: "try:\n    amount = int(raw)\nexcept:\n    amount = 0",
        after: "try:\n    amount = int(raw)\nexcept ValueError:\n    amount = 0",
      },
    ],
    quiz: [
      {
        question: "When does a finally block run?",
        options: ["Only if no exception occurs", "Only if an exception occurs", "Whether or not an exception occurs"],
        correct: 2,
        explanation: "finally always executes: on normal completion, a caught exception, or an uncaught one.",
      },
    ],
  },
  {
    id: "py-pandas-basics",
    title: "pandas for Data Wrangling",
    minutes: 20,
    description: "Use pandas' vectorized operations to filter, group, and aggregate tabular data without row-by-row loops.",
    concepts: [
      [
        "A DataFrame is columns of typed Series",
        "Each column in a pandas DataFrame is a Series with one dtype. A row-wise Python loop over a DataFrame is usually much slower than a vectorized operation across a whole column.",
      ],
      [
        "Filtering describes a boolean mask",
        "df[df['amount'] > 50] builds a Series of True/False values, one per row, and keeps the rows where it's True — the pandas equivalent of a SQL WHERE clause.",
      ],
      [
        "groupby splits, applies, combines",
        "df.groupby('country')['amount'].sum() splits rows into groups by country, applies sum() within each group, and combines the results into one Series indexed by country — directly analogous to SQL's GROUP BY.",
      ],
    ],
    flow: ["Load", "Filter", "Group", "Aggregate"],
    example: {
      code: 'import pandas as pd\n\norders = pd.DataFrame([\n    {"order_id": 1, "country": "IN", "amount": 100},\n    {"order_id": 2, "country": "US", "amount": 50},\n    {"order_id": 3, "country": "IN", "amount": 20},\n])\n\ntotals = orders.groupby("country")["amount"].sum()\nprint(totals)',
      output: "country\nIN    120\nUS     50\nName: amount, dtype: int64",
      walkthrough: [
        "pd.DataFrame([...]) builds a table from a list of row dicts, inferring one column per key.",
        "groupby('country') creates one group per distinct country value.",
        "['amount'].sum() aggregates only the amount column within each group, mirroring GROUP BY country in SQL.",
      ],
    },
    practice: {
      task: "Using the same orders DataFrame, return only the rows where amount is greater than 30, sorted by amount descending.",
      hint: "Build a boolean mask with orders['amount'] > 30, then call sort_values.",
      solution: 'import pandas as pd\n\norders = pd.DataFrame([\n    {"order_id": 1, "country": "IN", "amount": 100},\n    {"order_id": 2, "country": "US", "amount": 50},\n    {"order_id": 3, "country": "IN", "amount": 20},\n])\n\nresult = orders[orders["amount"] > 30].sort_values("amount", ascending=False)\nprint(result)',
      output: "   order_id country  amount\n0         1      IN     100\n1         2      US      50",
    },
    interview: [
      {
        question: "Why is a vectorized pandas operation usually faster than a Python for-loop over rows?",
        answer: "pandas pushes the loop into compiled code operating on contiguous typed arrays, instead of interpreting Python bytecode once per row with per-row object overhead.",
        followup: "When might a row-wise .apply() still be necessary?",
      },
      {
        question: "What's the pandas equivalent of a SQL GROUP BY ... HAVING?",
        answer: "groupby(...).agg(...) to compute the aggregate, then filter the resulting DataFrame or Series with a boolean mask — filtering after the aggregate is the HAVING step.",
        followup: "How would you keep only groups with more than one row?",
      },
    ],
    mistakes: [
      {
        title: "Looping over DataFrame rows with iterrows()",
        why: "Row-wise iteration reintroduces Python-level looping and loses most of pandas' vectorized speed advantage.",
        better: "Express the transformation as a vectorized column operation or a groupby aggregation.",
        before: 'total = 0\nfor _, row in orders.iterrows():\n    total += row["amount"]',
        after: 'total = orders["amount"].sum()',
      },
    ],
    quiz: [
      {
        question: "What does orders[orders['amount'] > 50] return?",
        options: ["A single number", "Rows where the condition is True", "An error"],
        correct: 1,
        explanation: "Boolean indexing keeps only the rows where the mask evaluates to True.",
      },
    ],
  },
  {
    id: "py-hands-on-task",
    title: "Hands-on Task",
    minutes: 40,
    description: "Build a small validation-and-aggregation script in plain Python: clean messy order records and total valid sales by country.",
    concepts: [
      [
        "Your brief",
        "A batch job receives order records with a duplicate entry, a missing country, and a refund. Produce valid positive totals by country using nothing beyond the standard library.",
      ],
      [
        "Acceptance criteria",
        "Keep one copy of identical orders, drop records with a missing country or a non-positive amount, then sum by country. Expected totals: IN = 120 and US = 50.",
      ],
      [
        "Explain your decisions",
        "State why identical duplicates are removed before summing, and why a refund — a negative amount — is excluded from this positive-sales figure rather than netted against it.",
      ],
    ],
    flow: ["Load", "Validate", "Deduplicate", "Aggregate"],
    example: {
      code: 'orders = [\n    {"order_id": 1, "country": "IN", "amount": 100},\n    {"order_id": 1, "country": "IN", "amount": 100},\n    {"order_id": 2, "country": "US", "amount": 50},\n    {"order_id": 3, "country": "IN", "amount": 20},\n    {"order_id": 4, "country": None, "amount": 10},\n    {"order_id": 5, "country": "US", "amount": -5},\n]\nprint(len(orders))',
      output: "6 input rows. One identical duplicate, one missing country, and one negative amount.",
      walkthrough: [
        "Six toy orders make the data-quality cases visible, matching the dataset used earlier in this module.",
        "Plain dicts keep the exercise dependency-free; the same logic applies to rows read from CSV or JSON.",
        "Inspect the data before deciding which records should contribute to the total.",
      ],
    },
    practice: {
      task: "Produce valid positive totals by country using only the standard library. Verify IN = 120 and US = 50, and explain what you excluded.",
      hint: "Deduplicate identical dict records first (a tuple of sorted items works as a hashable key), filter out a missing country or amount <= 0, then accumulate totals in a dict.",
      solution: 'orders = [\n    {"order_id": 1, "country": "IN", "amount": 100},\n    {"order_id": 1, "country": "IN", "amount": 100},\n    {"order_id": 2, "country": "US", "amount": 50},\n    {"order_id": 3, "country": "IN", "amount": 20},\n    {"order_id": 4, "country": None, "amount": 10},\n    {"order_id": 5, "country": "US", "amount": -5},\n]\n\nseen = set()\nunique = []\nfor order in orders:\n    key = tuple(sorted(order.items()))\n    if key not in seen:\n        seen.add(key)\n        unique.append(order)\n\ntotals = {}\nfor order in unique:\n    if order["country"] and order["amount"] > 0:\n        totals[order["country"]] = totals.get(order["country"], 0) + order["amount"]\n\nfor country in sorted(totals):\n    print(country, totals[country])',
      output: "IN 120\nUS 50",
    },
    interview: [
      {
        question: "How would you handle two records with the same order ID but different amounts?",
        answer: "Define an authoritative rule — such as keeping the value from the latest trusted timestamp — rather than arbitrarily keeping the first or last one seen. Treat it as a data-quality decision, not a coding detail.",
        followup: "What if both records have the same timestamp?",
      },
      {
        question: "Why exclude the refund instead of subtracting it from the total?",
        answer: "This exercise measures positive sales, a specifically defined metric; a net-revenue metric would need refunds included by design. The two numbers should not be confused with each other.",
        followup: "How would you name these two metrics so they aren't mixed up downstream?",
      },
    ],
    mistakes: [
      {
        title: "Deduplicating after summing",
        why: "Once a duplicate has already been added to a running total, removing it from the output afterward can't undo the inflated number.",
        better: "Remove duplicates before any aggregation step.",
        before: 'totals = {}\nfor order in orders:\n    key = order["country"]\n    totals[key] = totals.get(key, 0) + order["amount"]\n# de-duplicating the totals now is too late',
        after: "unique = deduplicate(orders)\ntotals = aggregate(unique)",
      },
      {
        title: "Treating a missing country as its own group",
        why: 'order.get("country") returning None would otherwise create a None-keyed group in the totals, silently including unvalidated data.',
        better: "Filter out records with a falsy or missing country before aggregating.",
        before: 'totals[order["country"]] = totals.get(order["country"], 0) + order["amount"]  # runs even when country is None',
        after: 'if order["country"] and order["amount"] > 0:\n    totals[order["country"]] = totals.get(order["country"], 0) + order["amount"]',
      },
    ],
    quiz: [
      {
        question: "When should identical duplicate orders be removed?",
        options: ["Before totals", "After totals"],
        correct: 0,
        explanation: "Once duplicates have inflated a total, removing duplicate output rows afterward cannot fix it.",
      },
      {
        question: "Why is IN 120?",
        options: ["100 + 100 + 20", "100 + 20"],
        correct: 1,
        explanation: "The repeated identical 100 order counts only once after deduplication.",
      },
      {
        question: "A missing country should be…",
        options: ["Handled according to a stated quality rule", "Silently invented"],
        correct: 0,
        explanation: "This exercise excludes it; another pipeline might quarantine it instead.",
      },
    ],
  },
  {
    id: "py-interview-questions",
    title: "Interview Questions",
    minutes: 30,
    description: "Practice explaining Python decisions clearly: a direct answer, the mechanism, an example, then a trade-off.",
    concepts: [
      [
        "Structure a useful answer",
        "Start with a direct answer. Explain the mechanism in plain words. Give one example, then name a limitation or trade-off.",
      ],
      [
        "Reason from evidence",
        "When a script is slow or wrong, check input assumptions and actual types with a small reproducible example before guessing at a fix.",
      ],
      [
        "Practice out loud",
        "Aim for a clear initial answer, then expand when prompted. The self-check is for your own review; this page does not grade free-text answers.",
      ],
    ],
    flow: ["Answer", "Mechanism", "Example", "Trade-off"],
    example: {
      code: 'def clean_amount(raw, default=0):\n    try:\n        return int(raw)\n    except (TypeError, ValueError):\n        return default\n\nprint([clean_amount(v) for v in ["100", None, "bad", "50"]])',
      output: "[100, 0, 0, 50]",
      walkthrough: [
        "Naming both TypeError and ValueError shows you considered what int() actually raises for None and for a non-numeric string.",
        "Returning a default keeps the pipeline running instead of crashing on one bad record.",
        "State the trade-off out loud: a default of 0 hides the bad record unless it's also logged or counted somewhere.",
      ],
    },
    practice: {
      task: "Explain, out loud, why clean_amount catches (TypeError, ValueError) specifically instead of using a bare except. Then run the example and confirm the output.",
      hint: "Name the two situations that raise each of those two exceptions from int(...).",
      solution: 'def clean_amount(raw, default=0):\n    try:\n        return int(raw)\n    except (TypeError, ValueError):\n        return default\n\nprint([clean_amount(v) for v in ["100", None, "bad", "50"]])',
      output: "[100, 0, 0, 50]",
    },
    interview: [],
    mistakes: [
      {
        title: "Answering only with a keyword",
        why: "Naming \"the GIL\" or \"a context manager\" doesn't show you understand what problem it actually solves.",
        better: "Explain the mechanism and give a concrete example before naming the term.",
        before: '"Use a context manager."',
        after: '"A with block closes the file even if an exception is raised inside it — here\'s an example where that matters."',
      },
    ],
    quiz: [
      {
        question: "What does int('bad') raise?",
        options: ["TypeError", "ValueError", "KeyError"],
        correct: 1,
        explanation: "int() raises ValueError when the string can't be parsed as a number.",
      },
      {
        question: "Which module keeps failure records visible in a scheduled job?",
        options: ["print", "logging", "input"],
        correct: 1,
        explanation: "logging adds severity levels and configurable output; print() output is easy to lose in a scheduler.",
      },
      {
        question: "What does groupby(...).sum() correspond to in SQL?",
        options: ["WHERE", "GROUP BY with an aggregate", "ORDER BY"],
        correct: 1,
        explanation: "groupby splits rows into groups and applies an aggregate within each, like GROUP BY.",
      },
    ],
  },
  {
    id: "py-quiz",
    title: "Quiz",
    minutes: 20,
    description: "Check your understanding across data structures, functions, files, error handling, and pandas.",
    concepts: [
      [
        "How to take this check",
        "Choose an answer for every question, then submit to see your score and explanations. You can retry; your answers are not sent to a server.",
      ],
      [
        "Review the reason",
        "A correct guess is not the same as understanding. Explain why the other options don't fit.",
      ],
      [
        "Return to a weak topic",
        "Use the lesson playlist to revisit a topic, then retake this check. Your latest submitted result stays on this device when storage is available.",
      ],
    ],
    flow: ["Attempt", "Submit", "Review", "Retry"],
    example: {
      code: "prices = [10, 30, 20]\ndoubled = [p * 2 for p in prices if p >= 20]\nprint(doubled)",
      output: "[60, 40]",
      walkthrough: [
        "The comprehension keeps values >= 20 before doubling them.",
        "prices itself is unchanged; a new list is returned.",
        "No sorting step is needed here — the order reflects the order of the input list.",
      ],
    },
    practice: {
      task: "Keep values strictly above 10, add 5 to each, and print the result as a list.",
      hint: "One comprehension: [p + 5 for p in prices if p > 10]",
      solution: "prices = [10, 30, 20]\nresult = [p + 5 for p in prices if p > 10]\nprint(result)",
      output: "[35, 25]",
    },
    interview: [
      {
        question: "Why is a mutable default argument considered a bug magnet?",
        answer: "It's created once, at function definition time, and shared across every call — leading to state accumulating silently across unrelated calls that all rely on the default.",
        followup: "How would you refactor a function that already has this problem?",
      },
      {
        question: "Why is a vectorized pandas operation usually faster than a Python for-loop over rows?",
        answer: "pandas pushes the loop into compiled code operating on contiguous typed arrays, instead of interpreting Python bytecode once per row with per-row object overhead.",
        followup: "When might a row-wise .apply() still be necessary?",
      },
    ],
    mistakes: [
      {
        title: "Comparing floats with ==",
        why: "Floating-point arithmetic can produce tiny rounding differences, so two mathematically equal values may not compare equal.",
        better: "Compare with a tolerance, such as abs(a - b) < 1e-9, or use Decimal for exact money math.",
        before: "if total == 150.30:\n    apply_discount()",
        after: "if abs(total - 150.30) < 1e-9:\n    apply_discount()",
      },
      {
        title: "Off-by-one with range()",
        why: "range(n) stops before n, not at n, so a loop meant to cover n items can miss the last one or run one too many.",
        better: "Check the boundary explicitly: range(len(items)) covers every index.",
        before: "for i in range(len(items) - 1):\n    process(items[i])  # skips the last item",
        after: "for i in range(len(items)):\n    process(items[i])",
      },
    ],
    quiz: [],
  },
  {
    id: "py-summary",
    title: "Summary",
    minutes: 10,
    description: "Connect the module's ideas and prepare to explain a complete, correct Python data pipeline.",
    concepts: [
      [
        "Start with the right tool",
        "Python glues systems together and handles small-to-medium transformations well. Reach for SQL or Spark when data no longer fits comfortably in memory or when set-based operations express the logic more directly.",
      ],
      [
        "Write it once, run it safely",
        "Use functions with clear responsibilities, context managers for resources, and specific exception handling, so a pipeline fails loudly on real bugs and recovers gracefully from expected bad data.",
      ],
      [
        "Make correctness explicit",
        "Define types, missing-value rules, and duplicate handling before optimizing. A fast pipeline that double-counts orders is still wrong.",
      ],
      [
        "What you should now demonstrate",
        "Explain when Python is, and isn't, the right tool; write a comprehension and a groupby aggregation; explain the mutable-default-argument pitfall; use a context manager and specific exception handling; and complete the order-validation mini-project.",
      ],
    ],
    flow: ["Define result", "Build pipeline", "Check correctness", "Handle failures"],
    example: {
      code: 'orders = [\n    {"order_id": 1, "country": "IN", "amount": 100},\n    {"order_id": 1, "country": "IN", "amount": 100},\n    {"order_id": 2, "country": "US", "amount": 50},\n    {"order_id": 3, "country": "IN", "amount": 20},\n    {"order_id": 4, "country": None, "amount": 10},\n    {"order_id": 5, "country": "US", "amount": -5},\n]\nprint(len(orders))',
      output: "6 input rows. One identical duplicate, one missing country, and one negative amount.",
      walkthrough: [
        "Six toy orders make the data-quality cases visible, matching the dataset used earlier in this module.",
        "Plain dicts keep the exercise dependency-free; the same logic applies to rows read from CSV or JSON.",
        "Inspect the data before deciding which records should contribute to the total.",
      ],
    },
    practice: {
      task: "Produce valid positive totals by country using only the standard library. Verify IN = 120 and US = 50, and explain what you excluded.",
      hint: "Deduplicate identical dict records first (a tuple of sorted items works as a hashable key), filter out a missing country or amount <= 0, then accumulate totals in a dict.",
      solution: 'orders = [\n    {"order_id": 1, "country": "IN", "amount": 100},\n    {"order_id": 1, "country": "IN", "amount": 100},\n    {"order_id": 2, "country": "US", "amount": 50},\n    {"order_id": 3, "country": "IN", "amount": 20},\n    {"order_id": 4, "country": None, "amount": 10},\n    {"order_id": 5, "country": "US", "amount": -5},\n]\n\nseen = set()\nunique = []\nfor order in orders:\n    key = tuple(sorted(order.items()))\n    if key not in seen:\n        seen.add(key)\n        unique.append(order)\n\ntotals = {}\nfor order in unique:\n    if order["country"] and order["amount"] > 0:\n        totals[order["country"]] = totals.get(order["country"], 0) + order["amount"]\n\nfor country in sorted(totals):\n    print(country, totals[country])',
      output: "IN 120\nUS 50",
    },
    interview: [
      {
        question: "Walk through how you'd take a batch of raw order records to a validated, aggregated result.",
        answer: "Load and inspect the input, define validation and deduplication rules explicitly, express the transformation with functions or vectorized pandas operations, request and check the output against expected values, and log anything that fails validation.",
        followup: "Which of these steps would you automate as a test before shipping the script?",
      },
    ],
    mistakes: [
      {
        title: "Skipping correctness checks before scaling up",
        why: "A script that runs fast on a sample can still be silently wrong at full volume if duplicate or malformed records weren't handled.",
        better: "Validate against known expected totals on a small sample before pointing the script at the full dataset.",
        before: "# Run directly on the full dataset",
        after: "# Validate totals on a known sample, then run on the full dataset",
      },
    ],
    quiz: [
      {
        question: "What type does csv.DictReader return for every field?",
        options: ["Its original type", "Always a string"],
        correct: 1,
        explanation: "csv.DictReader returns string values regardless of the underlying data; convert explicitly.",
      },
      {
        question: "When is a mutable default argument evaluated?",
        options: ["Once, at function definition", "Every call"],
        correct: 0,
        explanation: "It's created once and shared across calls unless you default to None instead.",
      },
      {
        question: "Which pandas operation matches SQL's GROUP BY?",
        options: ["filter", "groupby", "merge"],
        correct: 1,
        explanation: "groupby splits rows into groups before an aggregate is applied within each.",
      },
      {
        question: "What should a specific except clause do that a bare except doesn't?",
        options: ["Catch every error the same way", "Let unexpected errors surface instead of hiding them"],
        correct: 1,
        explanation: "Naming the expected exception keeps unrelated bugs from being silently swallowed.",
      },
    ],
  },
];

// The interview-questions lesson aggregates every earlier lesson's interview
// bank; the quiz lesson aggregates every earlier lesson's quiz, including
// the interview-questions lesson's own quiz. Mirrors the aggregation
// pattern used at the bottom of lib/sql-lessons.ts.
pythonLessons[7].interview = pythonLessons.slice(0, 7).flatMap(lesson => lesson.interview);
pythonLessons[8].quiz = pythonLessons.slice(0, 8).flatMap(lesson => lesson.quiz);
