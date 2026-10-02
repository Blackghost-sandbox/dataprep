export type OrderCell = string | number | boolean | null;
export type OrderColumnType = "number" | "text" | "date";
export type OrderColumn = { key:string; label:string; type:OrderColumnType };
export type OrderRow = Record<string, OrderCell>;
export type OrderDataset = {
  id:string;
  label:string;
  table:string;
  columns:OrderColumn[];
  displayColumns:string[];
  rows:OrderRow[];
};
export type SortDirection = "ASC" | "DESC";
export type OrderScenario = {
  id:string;
  label:string;
  column:string;
  direction:SortDirection;
  description:string;
};

export const orderDatasets:OrderDataset[]=[
  {
    id:"customers",
    label:"Customers (10 rows)",
    table:"customers",
    columns:[
      {key:"id",label:"id",type:"number"},
      {key:"name",label:"name",type:"text"},
      {key:"city",label:"city",type:"text"},
      {key:"age",label:"age",type:"number"},
      {key:"signup_date",label:"signup_date",type:"date"},
      {key:"total_spend",label:"total_spend",type:"number"},
    ],
    displayColumns:["id","name","city","age","signup_date"],
    rows:[
      {id:1,name:"Alice",city:"Chennai",age:28,signup_date:"2023-01-15",total_spend:1200},
      {id:2,name:"Bob",city:"Mumbai",age:34,signup_date:"2023-02-10",total_spend:800},
      {id:3,name:"Carol",city:"Delhi",age:25,signup_date:"2023-02-20",total_spend:650},
      {id:4,name:"David",city:"Bangalore",age:41,signup_date:"2023-03-05",total_spend:4500},
      {id:5,name:"Eva",city:"Hyderabad",age:31,signup_date:"2023-03-18",total_spend:1800},
      {id:6,name:"Frank",city:"Pune",age:38,signup_date:"2023-04-02",total_spend:2400},
      {id:7,name:"Grace",city:"Kolkata",age:29,signup_date:"2023-04-12",total_spend:950},
      {id:8,name:"Henry",city:"Ahmedabad",age:36,signup_date:"2023-05-01",total_spend:2100},
      {id:9,name:"Irene",city:"Chennai",age:32,signup_date:"2023-05-14",total_spend:1600},
      {id:10,name:"Jack",city:"Mumbai",age:27,signup_date:"2023-06-10",total_spend:700},
    ],
  },
  {
    id:"orders",
    label:"Orders (8 rows)",
    table:"orders",
    columns:[
      {key:"id",label:"id",type:"number"},
      {key:"customer_id",label:"customer_id",type:"number"},
      {key:"amount",label:"amount",type:"number"},
      {key:"status",label:"status",type:"text"},
      {key:"order_date",label:"order_date",type:"date"},
    ],
    displayColumns:["id","customer_id","amount","status","order_date"],
    rows:[
      {id:101,customer_id:1,amount:500,status:"paid",order_date:"2023-06-02"},
      {id:102,customer_id:1,amount:300,status:"paid",order_date:"2023-06-08"},
      {id:103,customer_id:3,amount:200,status:"pending",order_date:"2023-06-11"},
      {id:104,customer_id:4,amount:780,status:"paid",order_date:"2023-06-16"},
      {id:105,customer_id:5,amount:120,status:"refunded",order_date:"2023-06-19"},
      {id:106,customer_id:7,amount:450,status:"paid",order_date:"2023-06-22"},
      {id:107,customer_id:9,amount:640,status:"pending",order_date:"2023-06-24"},
      {id:108,customer_id:10,amount:90,status:"paid",order_date:"2023-06-29"},
    ],
  },
];

export function orderScenarios(datasetId:string):OrderScenario[]{
  if(datasetId==="orders")return[
    {id:"amount-asc",label:"Sort by amount",column:"amount",direction:"ASC",description:"Sort numeric order amounts from smallest to largest."},
    {id:"status-asc",label:"Sort by status",column:"status",direction:"ASC",description:"Sort text alphabetically by order status."},
    {id:"date-desc",label:"Sort by order_date",column:"order_date",direction:"DESC",description:"Put the newest orders first with descending date order."},
    {id:"amount-desc",label:"Highest amount",column:"amount",direction:"DESC",description:"Reverse the numeric order to place the largest amount first."},
  ];
  return[
    {id:"age-asc",label:"Sort by age",column:"age",direction:"ASC",description:"Sort customers from youngest to oldest."},
    {id:"name-asc",label:"Sort by name",column:"name",direction:"ASC",description:"Sort customer names alphabetically from A to Z."},
    {id:"city-asc",label:"Sort by city",column:"city",direction:"ASC",description:"Sort rows alphabetically by city."},
    {id:"signup-date",label:"Sort by signup_date",column:"signup_date",direction:"ASC",description:"Sort customers by signup date from earliest to latest."},
  ];
}

function compareValues(a:OrderCell,b:OrderCell,type:OrderColumnType):number{
  if(a===null&&b===null)return 0;
  if(a===null)return 1;
  if(b===null)return -1;
  if(type==="number")return Number(a)-Number(b);
  if(type==="date")return String(a).localeCompare(String(b));
  return String(a).localeCompare(String(b),undefined,{sensitivity:"base"});
}

export function sortRows(dataset:OrderDataset,columnKey:string,direction:SortDirection):OrderRow[]{
  const column=dataset.columns.find(item=>item.key===columnKey);
  if(!column)return [...dataset.rows];
  const multiplier=direction==="ASC"?1:-1;
  return dataset.rows
    .map((row,index)=>({row,index}))
    .sort((left,right)=>{
      const compared=compareValues(left.row[columnKey],right.row[columnKey],column.type)*multiplier;
      return compared||left.index-right.index;
    })
    .map(item=>item.row);
}

export function orderQuery(dataset:OrderDataset,column:string,direction:SortDirection):string{
  const projection=dataset.id==="customers"?"name, age, city":"id, amount, status";
  return `SELECT ${projection}\nFROM ${dataset.table}\nORDER BY ${column} ${direction};`;
}
