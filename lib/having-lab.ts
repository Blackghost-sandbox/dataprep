export type HavingCell = string | number | null;
export type HavingRow = Record<string, HavingCell>;
export type HavingColumn = { key:string; label:string; type:"number"|"text"|"date"; sqlType:string };
export type HavingDataset = {
  id:string;
  label:string;
  table:string;
  columns:HavingColumn[];
  displayColumns:string[];
  rows:HavingRow[];
};
export type HavingAggregate = "SUM" | "COUNT" | "AVG";
export type HavingOperator = ">" | ">=" | "<" | "<=" | "=";
export type HavingScenario = {
  id:string;
  label:string;
  groupBy:string;
  aggregate:HavingAggregate;
  aggregateColumn:string|"*";
  operator:HavingOperator;
  threshold:number;
  description:string;
};

export type HavingGroup = {
  key:HavingCell;
  aggregate:number;
  count:number;
  rows:HavingRow[];
};

export const havingDatasets:HavingDataset[]=[
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
      {id:1,customer_id:101,city:"Delhi",amount:250,order_date:"2023-01-15"},
      {id:2,customer_id:101,city:"Delhi",amount:540,order_date:"2023-01-21"},
      {id:3,customer_id:102,city:"Mumbai",amount:320,order_date:"2023-02-10"},
      {id:4,customer_id:103,city:"Bangalore",amount:120,order_date:"2023-02-18"},
      {id:5,customer_id:101,city:"Delhi",amount:780,order_date:"2023-03-05"},
      {id:6,customer_id:104,city:"Pune",amount:430,order_date:"2023-03-12"},
      {id:7,customer_id:102,city:"Mumbai",amount:680,order_date:"2023-03-20"},
      {id:8,customer_id:103,city:"Bangalore",amount:210,order_date:"2023-04-02"},
      {id:9,customer_id:105,city:"Chennai",amount:890,order_date:"2023-04-10"},
      {id:10,customer_id:104,city:"Pune",amount:120,order_date:"2023-04-18"},
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

export function havingScenarios(datasetId:string):HavingScenario[]{
  if(datasetId==="customers")return[
    {id:"high-spend-cities",label:"High-spend cities",groupBy:"city",aggregate:"SUM",aggregateColumn:"total_spend",operator:">",threshold:2000,description:"Find cities whose total customer spend is greater than the threshold."},
    {id:"multiple-customers",label:"Cities with 2+ customers",groupBy:"city",aggregate:"COUNT",aggregateColumn:"*",operator:">=",threshold:2,description:"Keep only cities that contain at least two customers."},
    {id:"average-age",label:"Average above threshold",groupBy:"city",aggregate:"AVG",aggregateColumn:"age",operator:">",threshold:30,description:"Filter city groups by their average customer age."},
    {id:"premium-customers",label:"Premium customers",groupBy:"city",aggregate:"AVG",aggregateColumn:"total_spend",operator:">=",threshold:1500,description:"Keep city groups whose average total_spend meets the premium threshold."},
  ];
  return[
    {id:"high-spend-cities",label:"High-spend cities",groupBy:"city",aggregate:"SUM",aggregateColumn:"amount",operator:">",threshold:1000,description:"Find city groups whose total order amount is greater than 1000."},
    {id:"customers-2-orders",label:"Customers with 2+ orders",groupBy:"customer_id",aggregate:"COUNT",aggregateColumn:"*",operator:">=",threshold:2,description:"Keep customer groups with at least two orders."},
    {id:"average-threshold",label:"Average above threshold",groupBy:"city",aggregate:"AVG",aggregateColumn:"amount",operator:">",threshold:500,description:"Filter cities whose average order amount is above 500."},
    {id:"premium-customers",label:"Premium customers",groupBy:"customer_id",aggregate:"SUM",aggregateColumn:"amount",operator:">=",threshold:1000,description:"Keep customers whose total order spend is at least 1000."},
  ];
}

export function havingAggregateExpression(scenario:HavingScenario):string{
  return `${scenario.aggregate}(${scenario.aggregateColumn})`;
}

export function groupForHaving(dataset:HavingDataset,scenario:HavingScenario):HavingGroup[]{
  const buckets=new Map<string,{key:HavingCell;rows:HavingRow[]}>();
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
    return {key:bucket.key,aggregate,count:bucket.rows.length,rows:bucket.rows};
  });
}

export function matchesHaving(value:number,operator:HavingOperator,threshold:number):boolean{
  switch(operator){
    case ">":return value>threshold;
    case ">=":return value>=threshold;
    case "<":return value<threshold;
    case "<=":return value<=threshold;
    case "=":return value===threshold;
    default:return false;
  }
}

export function filteredHavingGroups(dataset:HavingDataset,scenario:HavingScenario):HavingGroup[]{
  return groupForHaving(dataset,scenario).filter(group=>matchesHaving(group.aggregate,scenario.operator,scenario.threshold));
}

export function havingResultAlias(dataset:HavingDataset,scenario:HavingScenario):string{
  if(scenario.aggregate==="COUNT")return dataset.id==="orders"?"order_count":"customer_count";
  if(scenario.aggregate==="AVG")return scenario.aggregateColumn==="amount"?"avg_amount":scenario.aggregateColumn==="age"?"avg_age":"avg_value";
  return scenario.aggregateColumn==="amount"?"total_amount":"total_spend";
}

export function havingQuery(dataset:HavingDataset,scenario:HavingScenario):string{
  const expression=havingAggregateExpression(scenario);
  const alias=havingResultAlias(dataset,scenario);
  return `SELECT ${scenario.groupBy}, ${expression} AS ${alias}\nFROM ${dataset.table}\nGROUP BY ${scenario.groupBy}\nHAVING ${expression} ${scenario.operator} ${scenario.threshold};`;
}

export function formatHavingValue(value:number,aggregate:HavingAggregate):string{
  if(aggregate==="AVG")return value.toFixed(2);
  return Number.isInteger(value)?value.toLocaleString("en-US"):value.toFixed(2);
}
