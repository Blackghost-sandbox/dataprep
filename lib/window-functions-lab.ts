import { orderTable } from "@/lib/sql-lessons";

export type WindowScenarioId = "partition-total" | "running-total" | "average" | "row-number";
export type WindowResultRow = {
  id: number;
  customer_id: number;
  amount: number;
  value: number;
};

export const windowScenarios: Array<{
  id: WindowScenarioId;
  label: string;
  short: string;
  alias: string;
  query: string;
  explanation: string;
}> = [
  {
    id: "partition-total",
    label: "Partition total",
    short: "SUM per customer",
    alias: "customer_total",
    query:
      "SELECT id, customer_id, amount,\n" +
      "       SUM(amount) OVER (PARTITION BY customer_id) AS customer_total\n" +
      "FROM orders\n" +
      "ORDER BY id;",
    explanation:
      "PARTITION BY creates a window for each customer. SUM reads every row in that customer's window, but the original order rows stay visible.",
  },
  {
    id: "running-total",
    label: "Running total",
    short: "SUM in row order",
    alias: "running_total",
    query:
      "SELECT id, customer_id, amount,\n" +
      "       SUM(amount) OVER (\n" +
      "         PARTITION BY customer_id\n" +
      "         ORDER BY id\n" +
      "         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n" +
      "       ) AS running_total\n" +
      "FROM orders\n" +
      "ORDER BY id;",
    explanation:
      "Adding ORDER BY inside OVER turns the partition total into a running total. The frame grows from the first row in the partition to the current row.",
  },
  {
    id: "average",
    label: "Partition average",
    short: "AVG per customer",
    alias: "customer_avg",
    query:
      "SELECT id, customer_id, amount,\n" +
      "       AVG(amount) OVER (PARTITION BY customer_id) AS customer_avg\n" +
      "FROM orders\n" +
      "ORDER BY id;",
    explanation:
      "AVG uses the same customer partition as SUM. Every detail row is preserved and receives the average for its own customer.",
  },
  {
    id: "row-number",
    label: "ROW_NUMBER",
    short: "Rank within customer",
    alias: "row_number",
    query:
      "SELECT id, customer_id, amount,\n" +
      "       ROW_NUMBER() OVER (\n" +
      "         PARTITION BY customer_id\n" +
      "         ORDER BY amount DESC, id\n" +
      "       ) AS row_number\n" +
      "FROM orders\n" +
      "ORDER BY customer_id, row_number;",
    explanation:
      "ROW_NUMBER assigns a sequence inside each customer partition. The numbering restarts when customer_id changes.",
  },
];

export function sourceWindowRows(): WindowResultRow[] {
  return orderTable.rows.map((row) => ({
    id: Number(row[0]),
    customer_id: Number(row[1]),
    amount: Number(row[2]),
    value: 0,
  }));
}

export function evaluateWindowQuery(query: string): {
  alias: string;
  rows: WindowResultRow[];
  error?: string;
  mode: WindowScenarioId;
} {
  const normalized = query.replace(/\s+/g, " ").trim();
  const upper = normalized.toUpperCase();

  if (!upper.includes("SELECT ") || !upper.includes(" FROM ")) {
    return { alias: "result", rows: [], mode: "partition-total", error: "Expected a SELECT query with a FROM clause." };
  }
  const table = upper.match(/\bFROM\s+([A-Z_][A-Z0-9_]*)/)?.[1];
  if (table !== "ORDERS") {
    return { alias: "result", rows: [], mode: "partition-total", error: `Unknown table "${table?.toLowerCase() || "?"}". This lesson uses orders.` };
  }
  if (!upper.includes("OVER")) {
    return { alias: "result", rows: [], mode: "partition-total", error: "This lesson expects a window expression with OVER (...)." };
  }

  const partitionColumn = upper.match(/PARTITION\s+BY\s+([A-Z_][A-Z0-9_]*)/)?.[1];
  if (partitionColumn && partitionColumn !== "CUSTOMER_ID") {
    return { alias: "result", rows: [], mode: "partition-total", error: `Unknown partition column "${partitionColumn.toLowerCase()}". Try customer_id.` };
  }

  const allowedOrderColumns = new Set(["ID", "AMOUNT", "CUSTOMER_ID", "ROW_NUMBER"]);
  const overBody = upper.match(/OVER\s*\(([^)]*)\)/)?.[1] || "";
  const orderMatch = overBody.match(/ORDER\s+BY\s+(.+?)(?:ROWS|$)/)?.[1];
  if (orderMatch) {
    const columns = orderMatch.split(",").map((part) => part.trim().split(/\s+/)[0]).filter(Boolean);
    const invalid = columns.find((column) => !allowedOrderColumns.has(column));
    if (invalid) {
      return { alias: "result", rows: [], mode: "partition-total", error: `Unknown ORDER BY column "${invalid.toLowerCase()}".` };
    }
  }

  const hasRowNumber = /ROW_NUMBER\s*\(\s*\)/i.test(query);
  const hasAvg = /AVG\s*\(\s*AMOUNT\s*\)/i.test(query);
  const hasSum = /SUM\s*\(\s*AMOUNT\s*\)/i.test(query);
  if (!hasRowNumber && !hasAvg && !hasSum) {
    return { alias: "result", rows: [], mode: "partition-total", error: "Supported lesson functions are SUM(amount), AVG(amount), and ROW_NUMBER()." };
  }

  const alias =
    normalized.match(/\bAS\s+([A-Za-z_][A-Za-z0-9_]*)\s+FROM\b/i)?.[1] ||
    (hasRowNumber ? "row_number" : hasAvg ? "customer_avg" : "customer_total");

  const source = sourceWindowRows().map(({ value: _value, ...row }) => row);
  const groups = new Map<number, typeof source>();
  for (const row of source) groups.set(row.customer_id, [...(groups.get(row.customer_id) || []), row]);

  if (hasRowNumber) {
    const ranking = new Map<number, number>();
    for (const rows of groups.values()) {
      [...rows].sort((a, b) => b.amount - a.amount || a.id - b.id).forEach((row, index) => ranking.set(row.id, index + 1));
    }
    return { alias, mode: "row-number", rows: source.map((row) => ({ ...row, value: ranking.get(row.id) || 0 })) };
  }

  if (hasAvg) {
    const averages = new Map<number, number>();
    for (const [customer, rows] of groups) averages.set(customer, rows.reduce((sum, row) => sum + row.amount, 0) / rows.length);
    return { alias, mode: "average", rows: source.map((row) => ({ ...row, value: averages.get(row.customer_id) || 0 })) };
  }

  const running =
    /ORDER\s+BY\s+ID/i.test(overBody) &&
    /UNBOUNDED\s+PRECEDING/i.test(overBody) &&
    /CURRENT\s+ROW/i.test(overBody);

  if (running) {
    const runningValues = new Map<number, number>();
    for (const rows of groups.values()) {
      let total = 0;
      for (const row of [...rows].sort((a, b) => a.id - b.id)) {
        total += row.amount;
        runningValues.set(row.id, total);
      }
    }
    return { alias, mode: "running-total", rows: source.map((row) => ({ ...row, value: runningValues.get(row.id) || 0 })) };
  }

  const totals = new Map<number, number>();
  for (const [customer, rows] of groups) totals.set(customer, rows.reduce((sum, row) => sum + row.amount, 0));
  return { alias, mode: "partition-total", rows: source.map((row) => ({ ...row, value: totals.get(row.customer_id) || 0 })) };
}
