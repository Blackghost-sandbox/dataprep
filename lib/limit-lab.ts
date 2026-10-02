export type LimitCell = string | number | boolean | null;
export type LimitColumnType = "number" | "text" | "date";
export type LimitColumn = { key:string; label:string; type:LimitColumnType };
export type LimitRow = Record<string, LimitCell>;
export type LimitDataset = {
  id:string;
  label:string;
  table:string;
  columns:LimitColumn[];
  displayColumns:string[];
  rows:LimitRow[];
};
export type LimitDirection = "ASC" | "DESC";
export type LimitScenario = {
  id:string;
  label:string;
  column:string;
  direction:LimitDirection;
  limit:number;
  description:string;
};

export const limitDatasets:LimitDataset[]=[
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

export function limitScenarios(datasetId:string):LimitScenario[]{
  if(datasetId==="orders")return[
    {id:"top-3-amount",label:"Top 3 by amount",column:"amount",direction:"DESC",limit:3,description:"Take the three largest order amounts after sorting descending."},
    {id:"top-5-amount",label:"Top 5 by amount",column:"amount",direction:"DESC",limit:5,description:"Increase LIMIT to five while keeping the same descending amount order."},
    {id:"top-2-date",label:"Top 2 by order_date",column:"order_date",direction:"DESC",limit:2,description:"Sort newest orders first, then keep only two rows."},
  ];
  return[
    {id:"top-3-age",label:"Top 3 by age",column:"age",direction:"DESC",limit:3,description:"LIMIT 3 returns only the first 3 rows after sorting by age in descending order."},
    {id:"top-5-age",label:"Top 5 by age",column:"age",direction:"DESC",limit:5,description:"Keep the five oldest customers after sorting age from highest to lowest."},
    {id:"top-2-date",label:"Top 2 by signup_date",column:"signup_date",direction:"DESC",limit:2,description:"Sort by newest signup_date first and return only two customers."},
  ];
}

function compareValues(a:LimitCell,b:LimitCell,type:LimitColumnType):number{
  if(a===null&&b===null)return 0;
  if(a===null)return 1;
  if(b===null)return -1;
  if(type==="number")return Number(a)-Number(b);
  if(type==="date")return String(a).localeCompare(String(b));
  return String(a).localeCompare(String(b),undefined,{sensitivity:"base"});
}

export function sortedLimitRows(dataset:LimitDataset,columnKey:string,direction:LimitDirection,limit:number):LimitRow[]{
  const column=dataset.columns.find(item=>item.key===columnKey);
  if(!column)return [];
  const multiplier=direction==="ASC"?1:-1;
  const sorted=dataset.rows
    .map((row,index)=>({row,index}))
    .sort((left,right)=>{
      const compared=compareValues(left.row[columnKey],right.row[columnKey],column.type)*multiplier;
      return compared||left.index-right.index;
    })
    .map(item=>item.row);
  return sorted.slice(0,Math.max(0,Math.floor(limit)));
}

export function limitQuery(dataset:LimitDataset,column:string,direction:LimitDirection,limit:number):string{
  const projection=dataset.displayColumns.join(", ");
  return `SELECT ${projection}\nFROM ${dataset.table}\nORDER BY ${column} ${direction}\nLIMIT ${Math.max(0,Math.floor(limit))};`;
}
