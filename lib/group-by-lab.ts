export type GroupCell = string | number | null;
export type GroupRow = Record<string, GroupCell>;
export type GroupColumn = { key:string; label:string; type:"number"|"text"|"date"; sqlType:string };
export type GroupDataset = {
  id:string;
  label:string;
  table:string;
  columns:GroupColumn[];
  displayColumns:string[];
  rows:GroupRow[];
};
export type GroupAggregate = "SUM" | "COUNT" | "AVG";
export type GroupScenario = {
  id:string;
  label:string;
  groupBy:string;
  aggregate:GroupAggregate;
  aggregateColumn:string|"*";
  includeCount:boolean;
  description:string;
};

export type GroupResult = {
  key:GroupCell;
  aggregate:number;
  count:number;
  rowIds:number[];
  sourceRows:GroupRow[];
};

export const groupDatasets:GroupDataset[]=[
  {
    id:"orders",
    label:"Orders (10 rows)",
    table:"orders",
    columns:[
      {key:"id",label:"id",type:"number",sqlType:"INT"},
      {key:"customer_id",label:"customer_id",type:"number",sqlType:"INT"},
      {key:"city",label:"city",type:"text",sqlType:"VARCHAR"},
      {key:"amount",label:"amount",type:"number",sqlType:"DECIMAL"},
      {key:"order_date",label:"order_date",type:"date",sqlType:"DATE"},
    ],
    displayColumns:["id","customer_id","city","amount","order_date"],
    rows:[
      {id:1,customer_id:101,city:"Chennai",amount:250,order_date:"2023-01-15"},
      {id:2,customer_id:102,city:"Mumbai",amount:540,order_date:"2023-01-20"},
      {id:3,customer_id:101,city:"Chennai",amount:320,order_date:"2023-02-10"},
      {id:4,customer_id:103,city:"Bangalore",amount:120,order_date:"2023-02-18"},
      {id:5,customer_id:104,city:"Hyderabad",amount:780,order_date:"2023-03-05"},
      {id:6,customer_id:101,city:"Chennai",amount:400,order_date:"2023-03-12"},
      {id:7,customer_id:102,city:"Mumbai",amount:650,order_date:"2023-03-18"},
      {id:8,customer_id:103,city:"Bangalore",amount:230,order_date:"2023-04-02"},
      {id:9,customer_id:104,city:"Hyderabad",amount:890,order_date:"2023-04-10"},
      {id:10,customer_id:101,city:"Chennai",amount:310,order_date:"2023-04-18"},
    ],
  },
  {
    id:"customers",
    label:"Customers (10 rows)",
    table:"customers",
    columns:[
      {key:"id",label:"id",type:"number",sqlType:"INT"},
      {key:"name",label:"name",type:"text",sqlType:"VARCHAR"},
      {key:"city",label:"city",type:"text",sqlType:"VARCHAR"},
      {key:"age",label:"age",type:"number",sqlType:"INT"},
      {key:"total_spend",label:"total_spend",type:"number",sqlType:"DECIMAL"},
    ],
    displayColumns:["id","name","city","age","total_spend"],
    rows:[
      {id:1,name:"Alice",city:"Chennai",age:28,total_spend:1200},
      {id:2,name:"Bob",city:"Mumbai",age:34,total_spend:800},
      {id:3,name:"Carol",city:"Chennai",age:25,total_spend:650},
      {id:4,name:"David",city:"Bangalore",age:41,total_spend:4500},
      {id:5,name:"Eva",city:"Hyderabad",age:31,total_spend:1800},
      {id:6,name:"Frank",city:"Pune",age:38,total_spend:2400},
      {id:7,name:"Grace",city:"Kolkata",age:29,total_spend:950},
      {id:8,name:"Henry",city:"Ahmedabad",age:36,total_spend:2100},
      {id:9,name:"Irene",city:"Chennai",age:32,total_spend:1600},
      {id:10,name:"Jack",city:"Mumbai",age:27,total_spend:700},
    ],
  },
];

export function groupScenarios(datasetId:string):GroupScenario[]{
  if(datasetId==="customers")return[
    {id:"city-sum",label:"Group by city (SUM)",groupBy:"city",aggregate:"SUM",aggregateColumn:"total_spend",includeCount:true,description:"Group customers by city, then sum total_spend in each city."},
    {id:"age-group",label:"Group by age",groupBy:"age",aggregate:"COUNT",aggregateColumn:"*",includeCount:false,description:"Create one group per age and count customers in each group."},
    {id:"count-customers",label:"Count customers",groupBy:"city",aggregate:"COUNT",aggregateColumn:"*",includeCount:false,description:"Count how many customers belong to each city."},
    {id:"average-spend",label:"Average spend",groupBy:"city",aggregate:"AVG",aggregateColumn:"total_spend",includeCount:false,description:"Calculate average total_spend for each city."},
  ];
  return[
    {id:"city-sum",label:"Group by city (SUM)",groupBy:"city",aggregate:"SUM",aggregateColumn:"amount",includeCount:true,description:"Rows with the same city are collected into groups, then amount is summed within each city."},
    {id:"customer-sum",label:"Group by customer",groupBy:"customer_id",aggregate:"SUM",aggregateColumn:"amount",includeCount:true,description:"Collect orders by customer_id and summarize each customer’s order amount."},
    {id:"count-orders",label:"Count orders",groupBy:"city",aggregate:"COUNT",aggregateColumn:"*",includeCount:false,description:"Count the number of orders in each city group."},
    {id:"average-spend",label:"Average spend",groupBy:"city",aggregate:"AVG",aggregateColumn:"amount",includeCount:false,description:"Compute the average order amount separately for each city."},
  ];
}

export function groupRows(dataset:GroupDataset,scenario:GroupScenario):GroupResult[]{
  const buckets=new Map<string,{key:GroupCell;rows:GroupRow[]}>();
  for(const row of dataset.rows){
    const key=row[scenario.groupBy];
    const serialized=JSON.stringify(key);
    const bucket=buckets.get(serialized)??{key,rows:[]};
    bucket.rows.push(row);
    buckets.set(serialized,bucket);
  }
  return Array.from(buckets.values()).map(bucket=>{
    const values=scenario.aggregateColumn==="*" ? [] : bucket.rows
      .map(row=>row[scenario.aggregateColumn])
      .filter((value):value is number=>typeof value==="number"&&Number.isFinite(value));
    let aggregate:number;
    if(scenario.aggregate==="COUNT")aggregate=scenario.aggregateColumn==="*" ? bucket.rows.length : values.length;
    else if(scenario.aggregate==="AVG")aggregate=values.length?values.reduce((sum,value)=>sum+value,0)/values.length:0;
    else aggregate=values.reduce((sum,value)=>sum+value,0);
    return {
      key:bucket.key,
      aggregate,
      count:bucket.rows.length,
      rowIds:bucket.rows.map(row=>Number(row.id)),
      sourceRows:bucket.rows,
    };
  });
}

export function groupAggregateAlias(scenario:GroupScenario):string{
  if(scenario.aggregate==="COUNT")return "order_count";
  if(scenario.aggregate==="AVG")return "avg_amount";
  return scenario.aggregateColumn==="total_spend" ? "total_spend" : "total_amount";
}

export function groupQuery(dataset:GroupDataset,scenario:GroupScenario):string{
  const alias=groupAggregateAlias(scenario);
  const argument=scenario.aggregateColumn;
  const extra=scenario.includeCount ? ", COUNT(*) AS order_count" : "";
  return `SELECT ${scenario.groupBy}, ${scenario.aggregate}(${argument}) AS ${alias}${extra}\nFROM ${dataset.table}\nGROUP BY ${scenario.groupBy};`;
}

export function formatGroupValue(value:number,aggregate:GroupAggregate):string{
  if(aggregate==="AVG")return value.toFixed(2);
  return Number.isInteger(value)?value.toLocaleString("en-US"):value.toFixed(2);
}
