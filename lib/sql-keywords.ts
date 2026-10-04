import type { GlossaryItem } from "@/lib/glossary";

export const sqlKeywordEntries: GlossaryItem[] = [
  {
    "id": "sql-sql",
    "term": "SQL",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Medium",
    "interviewFrequency": 0,
    "definition": "Structured Query Language: a language for reading and changing relational data.",
    "explanation": "Describe the result you need; the database chooses an execution plan.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does SQL affect the returned rows?"
    ],
    "mistakes": [
      "Describe the result you need; the database chooses an execution plan."
    ],
    "flow": [
      "SELECT name FROM customers;"
    ]
  },
  {
    "id": "sql-order-by",
    "term": "ORDER BY",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Medium",
    "interviewFrequency": 0,
    "definition": "Sorts the result by one or more expressions.",
    "explanation": "Without ORDER BY, returned row order is not guaranteed.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does ORDER BY affect the returned rows?"
    ],
    "mistakes": [
      "Without ORDER BY, returned row order is not guaranteed."
    ],
    "flow": [
      "ORDER BY age DESC"
    ]
  },
  {
    "id": "sql-distinct",
    "term": "DISTINCT",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Medium",
    "interviewFrequency": 0,
    "definition": "Removes duplicate combinations of the selected values.",
    "explanation": "It applies to the entire selected row, not just the first column.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does DISTINCT affect the returned rows?"
    ],
    "mistakes": [
      "It applies to the entire selected row, not just the first column."
    ],
    "flow": [
      "SELECT DISTINCT city FROM customers;"
    ]
  },
  {
    "id": "sql-limit",
    "term": "LIMIT",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Caps the number of rows returned.",
    "explanation": "Combine it with ORDER BY to choose a meaningful, deterministic Top N.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does LIMIT affect the returned rows?"
    ],
    "mistakes": [
      "Combine it with ORDER BY to choose a meaningful, deterministic Top N."
    ],
    "flow": [
      "ORDER BY amount DESC LIMIT 3"
    ]
  },
  {
    "id": "sql-group-by",
    "term": "GROUP BY",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Medium",
    "interviewFrequency": 0,
    "definition": "Combines rows with equal grouping keys into groups.",
    "explanation": "Aggregate each group; ungrouped detail rows are collapsed.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does GROUP BY affect the returned rows?"
    ],
    "mistakes": [
      "Aggregate each group; ungrouped detail rows are collapsed."
    ],
    "flow": [
      "SELECT city, COUNT(*) FROM customers GROUP BY city;"
    ]
  },
  {
    "id": "sql-having",
    "term": "HAVING",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Medium",
    "interviewFrequency": 0,
    "definition": "Filters groups after aggregation.",
    "explanation": "WHERE filters individual rows before grouping; HAVING tests group results.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does HAVING affect the returned rows?"
    ],
    "mistakes": [
      "WHERE filters individual rows before grouping; HAVING tests group results."
    ],
    "flow": [
      "GROUP BY city HAVING COUNT(*) > 2"
    ]
  },
  {
    "id": "sql-subquery",
    "term": "Subquery",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Medium",
    "interviewFrequency": 0,
    "definition": "A query nested inside another SQL query.",
    "explanation": "The inner result can be a value, a set of rows, or a derived table.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does Subquery affect the returned rows?"
    ],
    "mistakes": [
      "The inner result can be a value, a set of rows, or a derived table."
    ],
    "flow": [
      "WHERE id IN (SELECT customer_id FROM orders)"
    ]
  },
  {
    "id": "sql-with",
    "term": "WITH",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Medium",
    "interviewFrequency": 0,
    "definition": "Introduces named common table expressions (CTEs).",
    "explanation": "A CTE names a query result for use in the statement; it is not necessarily materialized.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does WITH affect the returned rows?"
    ],
    "mistakes": [
      "A CTE names a query result for use in the statement; it is not necessarily materialized."
    ],
    "flow": [
      "WITH totals AS (SELECT customer_id, SUM(amount) FROM orders GROUP BY customer_id)"
    ]
  },
  {
    "id": "sql-over",
    "term": "OVER",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Medium",
    "interviewFrequency": 0,
    "definition": "Defines the window used by a window function.",
    "explanation": "A window calculation preserves detail rows instead of collapsing them into groups.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does OVER affect the returned rows?"
    ],
    "mistakes": [
      "A window calculation preserves detail rows instead of collapsing them into groups."
    ],
    "flow": [
      "SUM(amount) OVER (PARTITION BY customer_id)"
    ]
  },
  {
    "id": "sql-partition-by",
    "term": "PARTITION BY",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Medium",
    "interviewFrequency": 0,
    "definition": "Splits rows into separate windows for a window function.",
    "explanation": "Each partition is calculated independently, while all original rows remain.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does PARTITION BY affect the returned rows?"
    ],
    "mistakes": [
      "Each partition is calculated independently, while all original rows remain."
    ],
    "flow": [
      "PARTITION BY customer_id"
    ]
  },
  {
    "id": "sql-row_number",
    "term": "ROW_NUMBER",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Medium",
    "interviewFrequency": 0,
    "definition": "Assigns a distinct sequential number within each window.",
    "explanation": "Include a stable tie-breaker in the window ORDER BY for repeatable numbering.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does ROW_NUMBER affect the returned rows?"
    ],
    "mistakes": [
      "Include a stable tie-breaker in the window ORDER BY for repeatable numbering."
    ],
    "flow": [
      "ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY amount DESC, id)"
    ]
  },
  {
    "id": "sql-rank",
    "term": "RANK",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Medium",
    "interviewFrequency": 0,
    "definition": "Ranks ordered rows, assigning equal ranks to ties and leaving gaps.",
    "explanation": "Unlike ROW_NUMBER, tied values share a rank.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does RANK affect the returned rows?"
    ],
    "mistakes": [
      "Unlike ROW_NUMBER, tied values share a rank."
    ],
    "flow": [
      "RANK() OVER (ORDER BY amount DESC)"
    ]
  },
  {
    "id": "sql-dense_rank",
    "term": "DENSE_RANK",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Medium",
    "interviewFrequency": 0,
    "definition": "Ranks ordered rows with shared ranks for ties and no gaps.",
    "explanation": "Compare with RANK: 1, 1, 2 versus 1, 1, 3.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does DENSE_RANK affect the returned rows?"
    ],
    "mistakes": [
      "Compare with RANK: 1, 1, 2 versus 1, 1, 3."
    ],
    "flow": [
      "DENSE_RANK() OVER (ORDER BY amount DESC)"
    ]
  },
  {
    "id": "sql-case-when",
    "term": "CASE WHEN",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Medium",
    "interviewFrequency": 0,
    "definition": "Chooses a value using conditional branches.",
    "explanation": "The first true WHEN branch wins; ELSE supplies a fallback.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does CASE WHEN affect the returned rows?"
    ],
    "mistakes": [
      "The first true WHEN branch wins; ELSE supplies a fallback."
    ],
    "flow": [
      "CASE WHEN age >= 18 THEN 'adult' ELSE 'minor' END"
    ]
  },
  {
    "id": "sql-case",
    "term": "CASE",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Medium",
    "interviewFrequency": 0,
    "definition": "Starts a conditional expression.",
    "explanation": "The expression returns one value per row based on the first matching branch.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does CASE affect the returned rows?"
    ],
    "mistakes": [
      "The expression returns one value per row based on the first matching branch."
    ],
    "flow": [
      "CASE WHEN city IS NULL THEN 'Unknown' ELSE city END"
    ]
  },
  {
    "id": "sql-when",
    "term": "WHEN",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Introduces a condition in a CASE expression.",
    "explanation": "Conditions are checked in order; the first true condition wins.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does WHEN affect the returned rows?"
    ],
    "mistakes": [
      "Conditions are checked in order; the first true condition wins."
    ],
    "flow": [
      "WHEN amount > 500 THEN 'High'"
    ]
  },
  {
    "id": "sql-then",
    "term": "THEN",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Supplies the result for a matching CASE branch.",
    "explanation": "Use compatible result types across THEN and ELSE branches.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does THEN affect the returned rows?"
    ],
    "mistakes": [
      "Use compatible result types across THEN and ELSE branches."
    ],
    "flow": [
      "WHEN age >= 18 THEN 'Adult'"
    ]
  },
  {
    "id": "sql-else",
    "term": "ELSE",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Supplies a fallback when no CASE condition is true.",
    "explanation": "If omitted and no condition matches, CASE returns NULL.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does ELSE affect the returned rows?"
    ],
    "mistakes": [
      "If omitted and no condition matches, CASE returns NULL."
    ],
    "flow": [
      "ELSE 'Unknown'"
    ]
  },
  {
    "id": "sql-end",
    "term": "END",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Closes a CASE expression.",
    "explanation": "An optional AS alias can name the calculated result column.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does END affect the returned rows?"
    ],
    "mistakes": [
      "An optional AS alias can name the calculated result column."
    ],
    "flow": [
      "END AS category"
    ]
  },
  {
    "id": "sql-count",
    "term": "COUNT",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Counts rows or non-NULL expression values.",
    "explanation": "COUNT(*) counts rows; COUNT(column) skips NULL values.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does COUNT affect the returned rows?"
    ],
    "mistakes": [
      "COUNT(*) counts rows; COUNT(column) skips NULL values."
    ],
    "flow": [
      "COUNT(*) / COUNT(city)"
    ]
  },
  {
    "id": "sql-sum",
    "term": "SUM",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Adds the non-NULL values of a numeric expression.",
    "explanation": "An empty input or all-NULL input yields NULL.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does SUM affect the returned rows?"
    ],
    "mistakes": [
      "An empty input or all-NULL input yields NULL."
    ],
    "flow": [
      "SUM(amount)"
    ]
  },
  {
    "id": "sql-avg",
    "term": "AVG",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Computes the average of non-NULL numeric values.",
    "explanation": "NULLs are excluded from both the sum and the count.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does AVG affect the returned rows?"
    ],
    "mistakes": [
      "NULLs are excluded from both the sum and the count."
    ],
    "flow": [
      "AVG(amount)"
    ]
  },
  {
    "id": "sql-min",
    "term": "MIN",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Returns the lowest non-NULL value.",
    "explanation": "The comparison follows the data type and collation.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does MIN affect the returned rows?"
    ],
    "mistakes": [
      "The comparison follows the data type and collation."
    ],
    "flow": [
      "MIN(order_date)"
    ]
  },
  {
    "id": "sql-max",
    "term": "MAX",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Returns the highest non-NULL value.",
    "explanation": "The comparison follows the data type and collation.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does MAX affect the returned rows?"
    ],
    "mistakes": [
      "The comparison follows the data type and collation."
    ],
    "flow": [
      "MAX(amount)"
    ]
  },
  {
    "id": "sql-asc",
    "term": "ASC",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Sorts values in ascending order.",
    "explanation": "ASC is the default ordering direction.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does ASC affect the returned rows?"
    ],
    "mistakes": [
      "ASC is the default ordering direction."
    ],
    "flow": [
      "ORDER BY age ASC"
    ]
  },
  {
    "id": "sql-desc",
    "term": "DESC",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Sorts values in descending order.",
    "explanation": "For Top N highest values, sort descending before applying LIMIT.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does DESC affect the returned rows?"
    ],
    "mistakes": [
      "For Top N highest values, sort descending before applying LIMIT."
    ],
    "flow": [
      "ORDER BY amount DESC"
    ]
  },
  {
    "id": "sql-and",
    "term": "AND",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Requires both conditions to be true.",
    "explanation": "AND binds more tightly than OR; parentheses make intent clear.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does AND affect the returned rows?"
    ],
    "mistakes": [
      "AND binds more tightly than OR; parentheses make intent clear."
    ],
    "flow": [
      "age > 25 AND city = 'Chennai'"
    ]
  },
  {
    "id": "sql-or",
    "term": "OR",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Requires at least one condition to be true.",
    "explanation": "Use parentheses when combining OR with AND.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does OR affect the returned rows?"
    ],
    "mistakes": [
      "Use parentheses when combining OR with AND."
    ],
    "flow": [
      "city = 'Mumbai' OR city = 'Chennai'"
    ]
  },
  {
    "id": "sql-not",
    "term": "NOT",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Negates a condition.",
    "explanation": "Negating an unknown (NULL) condition still yields unknown.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does NOT affect the returned rows?"
    ],
    "mistakes": [
      "Negating an unknown (NULL) condition still yields unknown."
    ],
    "flow": [
      "WHERE NOT (age > 25)"
    ]
  },
  {
    "id": "sql-in",
    "term": "IN",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Tests membership in a list or a subquery result.",
    "explanation": "Be careful with NULLs, particularly with NOT IN.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does IN affect the returned rows?"
    ],
    "mistakes": [
      "Be careful with NULLs, particularly with NOT IN."
    ],
    "flow": [
      "WHERE city IN ('Mumbai', 'Chennai')"
    ]
  },
  {
    "id": "sql-between",
    "term": "BETWEEN",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Tests an inclusive lower and upper bound.",
    "explanation": "Both endpoints are included; timestamp end dates need careful handling.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does BETWEEN affect the returned rows?"
    ],
    "mistakes": [
      "Both endpoints are included; timestamp end dates need careful handling."
    ],
    "flow": [
      "WHERE age BETWEEN 20 AND 30"
    ]
  },
  {
    "id": "sql-like",
    "term": "LIKE",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Matches text against a pattern.",
    "explanation": "% matches any sequence; _ matches one character.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does LIKE affect the returned rows?"
    ],
    "mistakes": [
      "% matches any sequence; _ matches one character."
    ],
    "flow": [
      "WHERE name LIKE 'A%'"
    ]
  },
  {
    "id": "sql-is-null",
    "term": "IS NULL",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Tests whether a value is missing or unknown.",
    "explanation": "Use IS NULL instead of = NULL.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does IS NULL affect the returned rows?"
    ],
    "mistakes": [
      "Use IS NULL instead of = NULL."
    ],
    "flow": [
      "WHERE city IS NULL"
    ]
  },
  {
    "id": "sql-is-not-null",
    "term": "IS NOT NULL",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Tests whether a value is present.",
    "explanation": "A zero or empty string is still a present value.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does IS NOT NULL affect the returned rows?"
    ],
    "mistakes": [
      "A zero or empty string is still a present value."
    ],
    "flow": [
      "WHERE city IS NOT NULL"
    ]
  },
  {
    "id": "sql-as",
    "term": "AS",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Gives a column expression or table an alias.",
    "explanation": "Aliases make calculated results readable.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does AS affect the returned rows?"
    ],
    "mistakes": [
      "Aliases make calculated results readable."
    ],
    "flow": [
      "SUM(amount) AS total_amount"
    ]
  },
  {
    "id": "sql-inner-join",
    "term": "INNER JOIN",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Medium",
    "interviewFrequency": 0,
    "definition": "Returns combinations whose join condition matches.",
    "explanation": "A key with multiple matches produces multiple joined rows.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does INNER JOIN affect the returned rows?"
    ],
    "mistakes": [
      "A key with multiple matches produces multiple joined rows."
    ],
    "flow": [
      "customers INNER JOIN orders ON customers.id = orders.customer_id"
    ]
  },
  {
    "id": "sql-left-join",
    "term": "LEFT JOIN",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Medium",
    "interviewFrequency": 0,
    "definition": "Keeps every left-side row and any matching right-side rows.",
    "explanation": "Missing right-side matches are represented by NULL values.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does LEFT JOIN affect the returned rows?"
    ],
    "mistakes": [
      "Missing right-side matches are represented by NULL values."
    ],
    "flow": [
      "customers LEFT JOIN orders ON customers.id = orders.customer_id"
    ]
  },
  {
    "id": "sql-full-join",
    "term": "FULL JOIN",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Medium",
    "interviewFrequency": 0,
    "definition": "Keeps matched rows and unmatched rows from both sides.",
    "explanation": "Unmatched values from the opposite side are represented by NULL.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does FULL JOIN affect the returned rows?"
    ],
    "mistakes": [
      "Unmatched values from the opposite side are represented by NULL."
    ],
    "flow": [
      "customers FULL JOIN orders ON customers.id = orders.customer_id"
    ]
  },
  {
    "id": "sql-on",
    "term": "ON",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Specifies the matching condition for a JOIN.",
    "explanation": "For outer joins, ON and WHERE conditions can produce different results.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does ON affect the returned rows?"
    ],
    "mistakes": [
      "For outer joins, ON and WHERE conditions can produce different results."
    ],
    "flow": [
      "ON customers.id = orders.customer_id"
    ]
  },
  {
    "id": "sql-coalesce",
    "term": "COALESCE",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Returns the first non-NULL argument.",
    "explanation": "Use a fallback that makes sense for the business meaning of missing data.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does COALESCE affect the returned rows?"
    ],
    "mistakes": [
      "Use a fallback that makes sense for the business meaning of missing data."
    ],
    "flow": [
      "COALESCE(city, 'Unknown')"
    ]
  },
  {
    "id": "sql-offset",
    "term": "OFFSET",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Skips rows before returning the result subset.",
    "explanation": "Use a deterministic ORDER BY; large offsets can be expensive.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does OFFSET affect the returned rows?"
    ],
    "mistakes": [
      "Use a deterministic ORDER BY; large offsets can be expensive."
    ],
    "flow": [
      "ORDER BY id LIMIT 10 OFFSET 20"
    ]
  },
  {
    "id": "sql-union",
    "term": "UNION",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Combines compatible query results and removes duplicate rows.",
    "explanation": "UNION ALL preserves duplicates and usually avoids deduplication work.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does UNION affect the returned rows?"
    ],
    "mistakes": [
      "UNION ALL preserves duplicates and usually avoids deduplication work."
    ],
    "flow": [
      "SELECT city FROM customers UNION SELECT city FROM suppliers"
    ]
  },
  {
    "id": "sql-rows",
    "term": "rows",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Individual records in a table or query result.",
    "explanation": "Each row contains values for the defined columns.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does rows affect the returned rows?"
    ],
    "mistakes": [
      "Each row contains values for the defined columns."
    ],
    "flow": [
      "One customer = one source row"
    ]
  },
  {
    "id": "sql-columns",
    "term": "columns",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "Named fields in a table or query result.",
    "explanation": "SELECT chooses which columns or calculated expressions to return.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does columns affect the returned rows?"
    ],
    "mistakes": [
      "SELECT chooses which columns or calculated expressions to return."
    ],
    "flow": [
      "id, name, city"
    ]
  },
  {
    "id": "sql-table",
    "term": "table",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "A relational structure containing rows and named columns.",
    "explanation": "Queries read a table without changing it unless a modifying statement is used.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does table affect the returned rows?"
    ],
    "mistakes": [
      "Queries read a table without changing it unless a modifying statement is used."
    ],
    "flow": [
      "FROM customers"
    ]
  },
  {
    "id": "sql-dataset",
    "term": "dataset",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "The collection of source records used in the simulation.",
    "explanation": "Changing datasets changes the available source rows and scenarios.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does dataset affect the returned rows?"
    ],
    "mistakes": [
      "Changing datasets changes the available source rows and scenarios."
    ],
    "flow": [
      "Customers or Orders"
    ]
  },
  {
    "id": "sql-all-columns",
    "term": "*",
    "contextOnly": true,
    "category": "SQL",
    "style": "sql",
    "difficulty": "Easy",
    "interviewFrequency": 0,
    "definition": "In SELECT *, returns every available column.",
    "explanation": "COUNT(*) has a different meaning: count all rows.",
    "related": [
      "SELECT",
      "WHERE",
      "JOIN"
    ],
    "questions": [
      "How does * affect the returned rows?"
    ],
    "mistakes": [
      "COUNT(*) has a different meaning: count all rows."
    ],
    "flow": [
      "SELECT * FROM customers;"
    ]
  }
];

export const sqlRichTerms = new Set(["PARTITION BY", "Subquery", "SQL", "GROUP BY", "DISTINCT", "LEFT JOIN", "FULL JOIN", "CASE WHEN", "CASE", "HAVING", "OVER", "WITH", "DENSE_RANK", "INNER JOIN", "RANK", "ROW_NUMBER", "ORDER BY", "SELECT", "WHERE", "JOIN", "CTE", "Aggregate", "Primary Key", "Foreign Key", "NULL", "Window Function"]);
