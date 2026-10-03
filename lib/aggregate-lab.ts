export type AggregateCell = string | number | boolean | null;
export type AggregateColumnType = "number" | "text" | "date" | "boolean";
export type AggregateColumn = { key:string; label:string; type:AggregateColumnType; sqlType:string };
export type AggregateRow = Record<string, AggregateCell>;
export type AggregateDataset = {
  id:string;
  label:string;
  table:string;
  columns:AggregateColumn[];
  displayColumns:string[];
  rows:AggregateRow[];
};
export type AggregateFunction = "COUNT" | "SUM" | "AVG" | "MIN" | "MAX";
export type AggregateScenario = {
  id:string;
  label:string;
  fn:AggregateFunction;
  column:string | "*";
};

export const aggregateDatasets:AggregateDataset[]=[
  {
    id:"orders",
    label:"Orders (10 rows)",
    table:"orders",
    columns:[
      {key:"id",label:"id",type:"number",sqlType:"INT"},
      {key:"customer_id",label:"customer_id",type:"number",sqlType:"INT"},
      {key:"amount",label:"amount",type:"number",sqlType:"DECIMAL"},
      {key:"order_date",label:"order_date",type:"date",sqlType:"DATE"},
      {key:"city",label:"city",type:"text",sqlType:"VARCHAR"},
    ],
    displayColumns:["id","customer_id","amount","order_date","city"],
    rows:[
      {id:1,customer_id:101,amount:250,order_date:"2023-01-15",city:"Chennai"},
      {id:2,customer_id:102,amount:540,order_date:"2023-02-10",city:"Mumbai"},
      {id:3,customer_id:101,amount:320,order_date:"2023-02-20",city:"Delhi"},
      {id:4,customer_id:103,amount:780,order_date:"2023-03-05",city:"Bangalore"},
      {id:5,customer_id:104,amount:120,order_date:"2023-03-18",city:"Hyderabad"},
      {id:6,customer_id:101,amount:400,order_date:"2023-04-02",city:"Pune"},
      {id:7,customer_id:105,amount:650,order_date:"2023-04-12",city:"Kolkata"},
      {id:8,customer_id:102,amount:230,order_date:"2023-05-01",city:"Ahmedabad"},
      {id:9,customer_id:103,amount:890,order_date:"2023-05-14",city:"Chennai"},
      {id:10,customer_id:104,amount:310,order_date:"2023-06-10",city:"Mumbai"},
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
      {id:3,name:"Carol",city:"Delhi",age:25,total_spend:650},
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

export const aggregateFunctions:AggregateFunction[]=["COUNT","SUM","AVG","MIN","MAX"];

export function aggregateScenarios(datasetId:string):AggregateScenario[]{
  if(datasetId==="customers")return[
    {id:"count-age",label:"COUNT(age)",fn:"COUNT",column:"age"},
    {id:"sum-spend",label:"SUM(total_spend)",fn:"SUM",column:"total_spend"},
    {id:"avg-age",label:"AVG(age)",fn:"AVG",column:"age"},
    {id:"min-age",label:"MIN(age)",fn:"MIN",column:"age"},
    {id:"max-spend",label:"MAX(total_spend)",fn:"MAX",column:"total_spend"},
  ];
  return[
    {id:"count-amount",label:"COUNT(amount)",fn:"COUNT",column:"amount"},
    {id:"sum-amount",label:"SUM(amount)",fn:"SUM",column:"amount"},
    {id:"avg-amount",label:"AVG(amount)",fn:"AVG",column:"amount"},
    {id:"min-amount",label:"MIN(amount)",fn:"MIN",column:"amount"},
    {id:"max-amount",label:"MAX(amount)",fn:"MAX",column:"amount"},
  ];
}

export function selectableColumns(dataset:AggregateDataset,fn:AggregateFunction):Array<AggregateColumn|{key:"*";label:"* (all rows)";type:"number";sqlType:"ALL"}>{
  const columns=fn==="SUM"||fn==="AVG" ? dataset.columns.filter(column=>column.type==="number") : dataset.columns;
  return fn==="COUNT" ? [{key:"*",label:"* (all rows)",type:"number",sqlType:"ALL"},...columns] : columns;
}

export function aggregateValue(dataset:AggregateDataset,fn:AggregateFunction,columnKey:string|"*"):AggregateCell{
  if(fn==="COUNT"&&columnKey==="*")return dataset.rows.length;
  const values=dataset.rows.map(row=>row[columnKey]).filter(value=>value!==null&&value!==undefined);
  if(fn==="COUNT")return values.length;
  if(!values.length)return null;
  const column=dataset.columns.find(item=>item.key===columnKey);
  if(!column)return null;
  if(fn==="SUM"){
    const numbers=values.map(Number).filter(Number.isFinite);
    return numbers.reduce((sum,value)=>sum+value,0);
  }
  if(fn==="AVG"){
    const numbers=values.map(Number).filter(Number.isFinite);
    return numbers.length?numbers.reduce((sum,value)=>sum+value,0)/numbers.length:null;
  }
  const compare=(left:AggregateCell,right:AggregateCell)=>{
    if(column.type==="number")return Number(left)-Number(right);
    return String(left).localeCompare(String(right),undefined,{sensitivity:"base"});
  };
  return values.reduce((best,value)=>fn==="MIN"?(compare(value,best)<0?value:best):(compare(value,best)>0?value:best));
}

export function formatAggregateValue(value:AggregateCell,fn:AggregateFunction):string{
  if(value===null)return "NULL";
  if(fn==="AVG"&&typeof value==="number")return value.toFixed(2);
  if(typeof value==="number")return Number.isInteger(value)?value.toLocaleString("en-US"):value.toFixed(2);
  return String(value);
}

export function aggregateAlias(fn:AggregateFunction,column:string|"*"):string{
  if(fn==="COUNT"&&column==="*")return "total_rows";
  if(fn==="COUNT")return "total_orders";
  const safe=column==="*"?"rows":column;
  return `${fn.toLowerCase()}_${safe}`;
}

export function aggregateQuery(dataset:AggregateDataset,fn:AggregateFunction,column:string|"*"):string{
  return `SELECT ${fn}(${column}) AS ${aggregateAlias(fn,column)}\nFROM ${dataset.table};`;
}

export function aggregateSteps(dataset:AggregateDataset,fn:AggregateFunction,column:string|"*"):string[]{
  const target=column==="*"?"all rows":column;
  if(fn==="COUNT")return column==="*"
    ? ["Scan every row in the table","Count each input row",`Total rows = ${dataset.rows.length}`]
    : [`Scan each row in ${column} column`,"Count non-null values",`Total non-null values = ${aggregateValue(dataset,fn,column)}`];
  if(fn==="SUM")return [`Read numeric values from ${target}`,"Add the values together",`Return the total = ${formatAggregateValue(aggregateValue(dataset,fn,column),fn)}`];
  if(fn==="AVG")return [`Read numeric values from ${target}`,"Sum values and count non-null rows",`Divide sum by count = ${formatAggregateValue(aggregateValue(dataset,fn,column),fn)}`];
  if(fn==="MIN")return [`Scan values in ${target}`,"Keep the smallest value seen",`Minimum = ${formatAggregateValue(aggregateValue(dataset,fn,column),fn)}`];
  return [`Scan values in ${target}`,"Keep the largest value seen",`Maximum = ${formatAggregateValue(aggregateValue(dataset,fn,column),fn)}`];
}

