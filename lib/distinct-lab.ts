export type DistinctCell = string | number | boolean | null;
export type DistinctColumn = { key:string; label:string; type:string };
export type DistinctRow = Record<string, DistinctCell>;
export type DistinctDataset = {
  id:string;
  label:string;
  table:string;
  columns:DistinctColumn[];
  displayColumns:string[];
  rows:DistinctRow[];
};
export type DistinctScenario = {
  id:string;
  label:string;
  columns:string[];
  description:string;
};

export const distinctDatasets:DistinctDataset[]=[
  {
    id:"customers",
    label:"Customers (10 rows)",
    table:"customers",
    columns:[
      {key:"id",label:"id",type:"INT"},
      {key:"name",label:"name",type:"VARCHAR"},
      {key:"city",label:"city",type:"VARCHAR"},
      {key:"age",label:"age",type:"INT"},
      {key:"signup_date",label:"signup_date",type:"DATE"},
      {key:"country",label:"country",type:"VARCHAR"},
      {key:"plan",label:"plan",type:"VARCHAR"},
      {key:"total_spend",label:"total_spend",type:"DECIMAL"},
      {key:"is_active",label:"is_active",type:"BOOLEAN"},
    ],
    displayColumns:["id","name","city","age","plan"],
    rows:[
      {id:1,name:"Alice",city:"Chennai",age:28,signup_date:"2023-01-15",country:"India",plan:"Pro",total_spend:1200,is_active:true},
      {id:2,name:"Bob",city:"Mumbai",age:34,signup_date:"2023-02-10",country:"India",plan:"Basic",total_spend:800,is_active:true},
      {id:3,name:"Alice",city:"Chennai",age:31,signup_date:"2023-02-20",country:"India",plan:"Basic",total_spend:650,is_active:true},
      {id:4,name:"David",city:"Bangalore",age:41,signup_date:"2023-03-05",country:"India",plan:"Enterprise",total_spend:4500,is_active:true},
      {id:5,name:"Bob",city:"Mumbai",age:29,signup_date:"2023-03-18",country:"India",plan:"Pro",total_spend:1800,is_active:true},
      {id:6,name:"Eva",city:"Hyderabad",age:31,signup_date:"2023-04-02",country:"India",plan:"Basic",total_spend:720,is_active:false},
      {id:7,name:"Alice",city:"Chennai",age:28,signup_date:"2023-01-15",country:"India",plan:"Pro",total_spend:1200,is_active:true},
      {id:8,name:"Frank",city:"Pune",age:38,signup_date:"2023-04-12",country:"India",plan:"Pro",total_spend:2400,is_active:true},
      {id:9,name:"Eva",city:"Hyderabad",age:31,signup_date:"2023-04-02",country:"India",plan:"Basic",total_spend:720,is_active:false},
      {id:10,name:"Bob",city:"Mumbai",age:34,signup_date:"2023-02-10",country:"India",plan:"Basic",total_spend:800,is_active:true},
    ],
  },
  {
    id:"products",
    label:"Products (8 rows)",
    table:"products",
    columns:[
      {key:"id",label:"id",type:"INT"},
      {key:"name",label:"name",type:"VARCHAR"},
      {key:"category",label:"category",type:"VARCHAR"},
      {key:"brand",label:"brand",type:"VARCHAR"},
      {key:"price",label:"price",type:"DECIMAL"},
      {key:"country",label:"country",type:"VARCHAR"},
      {key:"is_active",label:"is_active",type:"BOOLEAN"},
    ],
    displayColumns:["id","name","category","brand","price"],
    rows:[
      {id:1,name:"Alpha",category:"Electronics",brand:"Acme",price:999,country:"India",is_active:true},
      {id:2,name:"Alpha",category:"Electronics",brand:"Acme",price:999,country:"India",is_active:true},
      {id:3,name:"Beta",category:"Home",brand:"Nova",price:199,country:"India",is_active:true},
      {id:4,name:"Gamma",category:"Electronics",brand:"Acme",price:499,country:"India",is_active:false},
      {id:5,name:"Delta",category:"Home",brand:"Nova",price:299,country:"India",is_active:true},
      {id:6,name:"Epsilon",category:"Garden",brand:"Terra",price:159,country:"India",is_active:true},
      {id:7,name:"Beta",category:"Home",brand:"Nova",price:199,country:"India",is_active:true},
      {id:8,name:"Zeta",category:"Electronics",brand:"Orbit",price:799,country:"India",is_active:true},
    ],
  },
];

export function distinctScenarios(datasetId:string):DistinctScenario[]{
  if(datasetId==="products")return[
    {id:"duplicate-names",label:"Duplicate names",columns:["name","category"],description:"This dataset repeats product names in the same category. DISTINCT keeps one row per unique name/category pair."},
    {id:"duplicate-categories",label:"Duplicate categories",columns:["category"],description:"Several products share a category. DISTINCT collapses those duplicates into unique category values."},
    {id:"multiple-columns",label:"Multiple columns",columns:["name","category","brand"],description:"Adding columns changes what counts as a duplicate combination."},
    {id:"no-duplicates",label:"No duplicates",columns:["id","name"],description:"Including a unique id means every row remains unique."},
  ];
  return[
    {id:"duplicate-names",label:"Duplicate names",columns:["name","city"],description:"This dataset contains multiple customers from the same city. Observe how DISTINCT returns only unique city values."},
    {id:"duplicate-cities",label:"Duplicate cities",columns:["city"],description:"Several customers share the same city. DISTINCT returns one row per unique city."},
    {id:"multiple-columns",label:"Multiple columns",columns:["name","city","plan"],description:"DISTINCT removes duplicate combinations across all selected columns, not one column in isolation."},
    {id:"no-duplicates",label:"No duplicates",columns:["id","name"],description:"Including the unique id makes every selected row distinct."},
  ];
}

export function distinctKey(row:DistinctRow,columns:string[]):string{
  return JSON.stringify(columns.map(column=>row[column]??null));
}

export function distinctRows(dataset:DistinctDataset,columns:string[]):DistinctRow[]{
  if(!columns.length)return[];
  const seen=new Set<string>(),result:DistinctRow[]=[];
  for(const row of dataset.rows){
    const key=distinctKey(row,columns);
    if(seen.has(key))continue;
    seen.add(key);
    const output:DistinctRow={};
    for(const column of columns)output[column]=row[column]??null;
    result.push(output);
  }
  return result;
}

export function duplicateGroupCounts(dataset:DistinctDataset,columns:string[]):Map<string,number>{
  const counts=new Map<string,number>();
  if(!columns.length)return counts;
  for(const row of dataset.rows){
    const key=distinctKey(row,columns);
    counts.set(key,(counts.get(key)??0)+1);
  }
  return counts;
}

export function distinctQuery(dataset:DistinctDataset,columns:string[]):string{
  const selection=columns.length?columns.join(", "):"/* select columns */";
  return `SELECT DISTINCT ${selection}\nFROM ${dataset.table};`;
}
