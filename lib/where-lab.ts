import { customerTable } from "@/lib/sql-lessons";
export type FilterMode="age"|"city"|"not-city"|"equals-null"|"is-null";
export type Truth="TRUE"|"FALSE"|"UNKNOWN";
export const filterModes:{id:FilterMode;label:string}[]=[{id:"age",label:"Older than an age"},{id:"city",label:"Lives in Chennai"},{id:"not-city",label:"Not Chennai"},{id:"equals-null",label:"Missing city: = NULL"},{id:"is-null",label:"Missing city: IS NULL"}];
export const filterRows=customerTable.rows.map(row=>({id:Number(row[0]),name:String(row[1]),city:row[2]===null?null:String(row[2]),age:Number(row[3])}));
export function predicate(mode:FilterMode,age:number){return mode==="age"?`age > ${age}`:mode==="city"?"city = 'Chennai'":mode==="not-city"?"city <> 'Chennai'":mode==="equals-null"?"city = NULL":"city IS NULL";}
export function evaluateFilter(row:typeof filterRows[number],mode:FilterMode,age:number):Truth{
  if(mode==="age")return row.age>age?"TRUE":"FALSE";
  if(mode==="is-null")return row.city===null?"TRUE":"FALSE";
  if(mode==="equals-null"||row.city===null)return "UNKNOWN";
  return (mode==="city"?row.city==="Chennai":row.city!=="Chennai")?"TRUE":"FALSE";
}
export function filterReason(row:typeof filterRows[number],mode:FilterMode,age:number){const result=evaluateFilter(row,mode,age);return result==="UNKNOWN"?"The city is unknown, or the comparison uses NULL. Ordinary comparisons cannot establish TRUE. WHERE therefore excludes this row.":mode==="is-null"?`${row.name}’s city ${row.city===null?"is missing":"is known"}. IS NULL returns ${result}.`:`${mode==="age"?`${row.age} > ${age}`:`'${row.city}' ${mode==="city"?"=":"<>"} 'Chennai'`} is ${result}. ${result==="TRUE"?"The row passes into the result.":"The row stays in the source table but is not returned."}`;}
export function filterQuery(mode:FilterMode,age:number){return `SELECT name, city, age\nFROM customers\nWHERE ${predicate(mode,age)}\nORDER BY id;`;}


export type WhereCell = string | number | null;
export type WhereColumnType = "number" | "text" | "date";
export type WhereOperator = ">" | "<" | ">=" | "<=" | "=" | "!=" | "BETWEEN" | "IS NULL" | "IS NOT NULL";
export type WhereJoin = "AND" | "OR";
export type WhereSimulationRow = Record<string, WhereCell>;
export type WhereColumn = { key: string; label: string; type: WhereColumnType };
export type WhereDataset = {
  id: string;
  label: string;
  table: string;
  columns: WhereColumn[];
  rows: WhereSimulationRow[];
};
export type WhereCondition = {
  column: string;
  operator: WhereOperator;
  value: string;
  value2?: string;
};
export type WherePlan = {
  conditions: WhereCondition[];
  join: WhereJoin;
};
export type WhereScenario = {
  id: string;
  label: string;
  plan: WherePlan;
};

export const whereDatasets: WhereDataset[] = [
  {
    id: "customers",
    label: "Customers (10 rows)",
    table: "customers",
    columns: [
      { key: "id", label: "id", type: "number" },
      { key: "name", label: "name", type: "text" },
      { key: "city", label: "city", type: "text" },
      { key: "age", label: "age", type: "number" },
      { key: "signup_date", label: "signup_date", type: "date" },
    ],
    rows: [
      { id: 1, name: "Alice", city: "Chennai", age: 28, signup_date: "2023-01-15" },
      { id: 2, name: "Bob", city: "Mumbai", age: 34, signup_date: "2023-02-10" },
      { id: 3, name: "Carol", city: "Delhi", age: 25, signup_date: "2023-02-20" },
      { id: 4, name: "David", city: "Bangalore", age: 41, signup_date: "2023-03-05" },
      { id: 5, name: "Eva", city: "Hyderabad", age: 31, signup_date: "2023-03-18" },
      { id: 6, name: "Frank", city: "Pune", age: 38, signup_date: "2023-04-02" },
      { id: 7, name: "Grace", city: "Kolkata", age: 29, signup_date: "2023-04-12" },
      { id: 8, name: "Henry", city: "Ahmedabad", age: 36, signup_date: "2023-05-01" },
      { id: 9, name: "Irene", city: "Chennai", age: 32, signup_date: "2023-05-14" },
      { id: 10, name: "Jack", city: "Mumbai", age: 27, signup_date: "2023-06-10" },
    ],
  },
  {
    id: "orders",
    label: "Orders (8 rows)",
    table: "orders",
    columns: [
      { key: "id", label: "id", type: "number" },
      { key: "customer_id", label: "customer_id", type: "number" },
      { key: "amount", label: "amount", type: "number" },
      { key: "status", label: "status", type: "text" },
      { key: "order_date", label: "order_date", type: "date" },
    ],
    rows: [
      { id: 101, customer_id: 1, amount: 500, status: "paid", order_date: "2023-06-02" },
      { id: 102, customer_id: 1, amount: 300, status: "paid", order_date: "2023-06-08" },
      { id: 103, customer_id: 3, amount: 200, status: "pending", order_date: "2023-06-11" },
      { id: 104, customer_id: 4, amount: 780, status: "paid", order_date: "2023-06-16" },
      { id: 105, customer_id: 5, amount: 120, status: "refunded", order_date: "2023-06-19" },
      { id: 106, customer_id: 7, amount: 450, status: "paid", order_date: "2023-06-22" },
      { id: 107, customer_id: 9, amount: 640, status: "pending", order_date: "2023-06-24" },
      { id: 108, customer_id: 10, amount: 90, status: "paid", order_date: "2023-06-29" },
    ],
  },
];

const customerScenarios: WhereScenario[] = [
  { id: "age", label: "Age filter", plan: { join: "AND", conditions: [{ column: "age", operator: ">", value: "25" }] } },
  { id: "city", label: "City filter", plan: { join: "AND", conditions: [{ column: "city", operator: "=", value: "Chennai" }] } },
  { id: "multiple", label: "Multiple conditions", plan: { join: "AND", conditions: [{ column: "age", operator: ">=", value: "30" }, { column: "city", operator: "=", value: "Mumbai" }] } },
  { id: "and-or", label: "AND vs OR", plan: { join: "OR", conditions: [{ column: "age", operator: "<", value: "30" }, { column: "city", operator: "=", value: "Chennai" }] } },
  { id: "empty", label: "No matching rows", plan: { join: "AND", conditions: [{ column: "age", operator: ">", value: "99" }] } },
];

const orderScenarios: WhereScenario[] = [
  { id: "amount", label: "Amount filter", plan: { join: "AND", conditions: [{ column: "amount", operator: ">", value: "300" }] } },
  { id: "status", label: "Status filter", plan: { join: "AND", conditions: [{ column: "status", operator: "=", value: "paid" }] } },
  { id: "multiple", label: "Multiple conditions", plan: { join: "AND", conditions: [{ column: "amount", operator: ">=", value: "300" }, { column: "status", operator: "=", value: "paid" }] } },
  { id: "and-or", label: "AND vs OR", plan: { join: "OR", conditions: [{ column: "amount", operator: "<", value: "200" }, { column: "status", operator: "=", value: "pending" }] } },
  { id: "empty", label: "No matching rows", plan: { join: "AND", conditions: [{ column: "amount", operator: ">", value: "5000" }] } },
];

export function whereScenarios(datasetId: string): WhereScenario[] {
  return datasetId === "orders" ? orderScenarios : customerScenarios;
}

export function cloneWherePlan(plan: WherePlan): WherePlan {
  return { join: plan.join, conditions: plan.conditions.map(condition => ({ ...condition })) };
}

export function operatorsForWhere(type: WhereColumnType): { value: WhereOperator; label: string }[] {
  const common: { value: WhereOperator; label: string }[] = [
    { value: "=", label: "= (equals)" },
    { value: "!=", label: "!= (not equal)" },
    { value: "IS NULL", label: "IS NULL" },
    { value: "IS NOT NULL", label: "IS NOT NULL" },
  ];
  if (type === "text") return common;
  return [
    { value: ">", label: "> (greater than)" },
    { value: "<", label: "< (less than)" },
    { value: ">=", label: ">= (greater/equal)" },
    { value: "<=", label: "<= (less/equal)" },
    ...common,
    { value: "BETWEEN", label: "BETWEEN" },
  ];
}

function cleanLiteral(value: string): string {
  const trimmed = value.trim();
  if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) return trimmed.slice(1, -1);
  return trimmed;
}

function compare(left: WhereCell, operator: WhereOperator, rawValue: string, rawValue2: string | undefined, type: WhereColumnType): Truth {
  if (operator === "IS NULL") return left === null ? "TRUE" : "FALSE";
  if (operator === "IS NOT NULL") return left === null ? "FALSE" : "TRUE";
  if (left === null) return "UNKNOWN";

  const value = cleanLiteral(rawValue);
  const value2 = cleanLiteral(rawValue2 ?? "");
  const leftComparable = type === "number" ? Number(left) : String(left);
  const rightComparable = type === "number" ? Number(value) : value;
  const secondComparable = type === "number" ? Number(value2) : value2;

  if (type === "number" && (!Number.isFinite(Number(rightComparable)) || operator === "BETWEEN" && !Number.isFinite(Number(secondComparable)))) return "UNKNOWN";

  switch (operator) {
    case ">": return leftComparable > rightComparable ? "TRUE" : "FALSE";
    case "<": return leftComparable < rightComparable ? "TRUE" : "FALSE";
    case ">=": return leftComparable >= rightComparable ? "TRUE" : "FALSE";
    case "<=": return leftComparable <= rightComparable ? "TRUE" : "FALSE";
    case "=": return leftComparable === rightComparable ? "TRUE" : "FALSE";
    case "!=": return leftComparable !== rightComparable ? "TRUE" : "FALSE";
    case "BETWEEN": return leftComparable >= rightComparable && leftComparable <= secondComparable ? "TRUE" : "FALSE";
    default: return "UNKNOWN";
  }
}

export function evaluateWhereCondition(row: WhereSimulationRow, dataset: WhereDataset, condition: WhereCondition): Truth {
  const column = dataset.columns.find(item => item.key === condition.column);
  if (!column) return "UNKNOWN";
  return compare(row[condition.column], condition.operator, condition.value, condition.value2, column.type);
}

export function evaluateWherePlan(row: WhereSimulationRow, dataset: WhereDataset, plan: WherePlan): Truth {
  if (!plan.conditions.length) return "TRUE";
  const values = plan.conditions.map(condition => evaluateWhereCondition(row, dataset, condition));
  if (plan.join === "AND") {
    if (values.includes("FALSE")) return "FALSE";
    return values.includes("UNKNOWN") ? "UNKNOWN" : "TRUE";
  }
  if (values.includes("TRUE")) return "TRUE";
  return values.includes("UNKNOWN") ? "UNKNOWN" : "FALSE";
}

function sqlLiteral(value: string, type: WhereColumnType): string {
  const clean = cleanLiteral(value);
  if (type === "number" && Number.isFinite(Number(clean))) return clean;
  return "'" + clean.replace(/'/g, "''") + "'";
}

export function whereConditionSql(dataset: WhereDataset, condition: WhereCondition): string {
  const column = dataset.columns.find(item => item.key === condition.column);
  if (!column) return condition.column;
  if (condition.operator === "IS NULL" || condition.operator === "IS NOT NULL") return `${condition.column} ${condition.operator}`;
  if (condition.operator === "BETWEEN") return `${condition.column} BETWEEN ${sqlLiteral(condition.value, column.type)} AND ${sqlLiteral(condition.value2 ?? "", column.type)}`;
  return `${condition.column} ${condition.operator} ${sqlLiteral(condition.value, column.type)}`;
}

export function wherePredicateSql(dataset: WhereDataset, plan: WherePlan): string {
  return plan.conditions.map(condition => whereConditionSql(dataset, condition)).join(` ${plan.join} `);
}

export function buildWhereSimulationQuery(dataset: WhereDataset, plan: WherePlan): string {
  return `SELECT ${dataset.columns.map(column => column.key).join(", ")}\nFROM ${dataset.table}\nWHERE ${wherePredicateSql(dataset, plan)};`;
}

export function explainWherePlan(dataset: WhereDataset, plan: WherePlan): string {
  if (!plan.conditions.length) return "Return every row.";
  const words = plan.conditions.map(condition => {
    const column = dataset.columns.find(item => item.key === condition.column);
    const value = condition.operator === "IS NULL" || condition.operator === "IS NOT NULL"
      ? condition.operator.toLowerCase()
      : condition.operator === "BETWEEN"
        ? `between ${condition.value} and ${condition.value2 ?? ""}`
        : `${condition.operator} ${condition.value}`;
    return `${column?.label ?? condition.column} ${value}`;
  });
  return `Show ${dataset.table} where ${words.join(` ${plan.join.toLowerCase()} `)}.`;
}
