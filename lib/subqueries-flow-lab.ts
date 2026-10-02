export type SubqueryFlowCell = string | number | null;
export type SubqueryFlowSort = "total_amount" | "name" | "city" | "id";
export type SubqueryFlowOrder = "ASC" | "DESC";

export type SubqueryFlowCustomer = {
  id:number;
  name:string;
  city:string;
};

export type SubqueryFlowOrderRow = {
  id:number;
  customer_id:number;
  amount:number;
  order_date:string;
};

export type SubqueryFlowDataset = {
  id:string;
  label:string;
  customers:SubqueryFlowCustomer[];
  orders:SubqueryFlowOrderRow[];
};

export type SubqueryFlowResult = SubqueryFlowCustomer & {
  total_amount:number;
};

export const subqueryFlowDatasets:SubqueryFlowDataset[]=[
  {
    id:"orders",
    label:"Orders (10 rows)",
    customers:[
      {id:101,name:"Alice",city:"Chennai"},
      {id:102,name:"Bob",city:"Mumbai"},
      {id:103,name:"Carol",city:"Delhi"},
      {id:104,name:"David",city:"Bangalore"},
      {id:105,name:"Frank",city:"Pune"},
    ],
    orders:[
      {id:1,customer_id:101,amount:250,order_date:"2023-01-15"},
      {id:2,customer_id:102,amount:540,order_date:"2023-02-10"},
      {id:3,customer_id:101,amount:320,order_date:"2023-02-20"},
      {id:4,customer_id:103,amount:780,order_date:"2023-03-05"},
      {id:5,customer_id:104,amount:120,order_date:"2023-03-18"},
      {id:6,customer_id:101,amount:400,order_date:"2023-04-02"},
      {id:7,customer_id:105,amount:650,order_date:"2023-04-12"},
      {id:8,customer_id:102,amount:230,order_date:"2023-05-01"},
      {id:9,customer_id:103,amount:890,order_date:"2023-05-14"},
      {id:10,customer_id:104,amount:310,order_date:"2023-06-10"},
    ],
  },
  {
    id:"regional",
    label:"Regional Orders (8 rows)",
    customers:[
      {id:201,name:"Maya",city:"Delhi"},
      {id:202,name:"Noah",city:"Pune"},
      {id:203,name:"Isha",city:"Mumbai"},
      {id:204,name:"Liam",city:"Chennai"},
    ],
    orders:[
      {id:11,customer_id:201,amount:260,order_date:"2023-07-01"},
      {id:12,customer_id:201,amount:420,order_date:"2023-07-03"},
      {id:13,customer_id:202,amount:150,order_date:"2023-07-04"},
      {id:14,customer_id:203,amount:700,order_date:"2023-07-06"},
      {id:15,customer_id:203,amount:330,order_date:"2023-07-08"},
      {id:16,customer_id:204,amount:200,order_date:"2023-07-11"},
      {id:17,customer_id:204,amount:240,order_date:"2023-07-12"},
      {id:18,customer_id:202,amount:410,order_date:"2023-07-13"},
    ],
  },
];

export function subqueryFlowTotals(dataset:SubqueryFlowDataset):Map<number,number>{
  const totals=new Map<number,number>();
  for(const order of dataset.orders){
    totals.set(order.customer_id,(totals.get(order.customer_id)??0)+order.amount);
  }
  return totals;
}

export function subqueryFlowCustomerIds(dataset:SubqueryFlowDataset,threshold:number):number[]{
  const totals=subqueryFlowTotals(dataset);
  return dataset.customers
    .filter(customer=>(totals.get(customer.id)??0)>threshold)
    .map(customer=>customer.id);
}

export function subqueryFlowResult(
  dataset:SubqueryFlowDataset,
  threshold:number,
  sortBy:SubqueryFlowSort,
  sortOrder:SubqueryFlowOrder,
):SubqueryFlowResult[]{
  const totals=subqueryFlowTotals(dataset);
  const multiplier=sortOrder==="ASC"?1:-1;
  const rows=dataset.customers
    .map(customer=>({...customer,total_amount:totals.get(customer.id)??0}))
    .filter(row=>row.total_amount>threshold);

  return rows.sort((left,right)=>{
    const a=left[sortBy];
    const b=right[sortBy];
    let compared:number;
    if(typeof a==="number"&&typeof b==="number")compared=a-b;
    else compared=String(a).localeCompare(String(b),undefined,{sensitivity:"base"});
    return compared*multiplier || left.id-right.id;
  });
}

export function subqueryFlowSql(
  threshold:number,
  sortBy:SubqueryFlowSort,
  sortOrder:SubqueryFlowOrder,
):string{
  const sortExpression=sortBy==="total_amount"?"total_amount":`c.${sortBy}`;
  return `SELECT c.id, c.name, c.city,\n  (SELECT SUM(o2.amount)\n   FROM orders o2\n   WHERE o2.customer_id = c.id) AS total_amount\nFROM customers c\nWHERE c.id IN (\n  SELECT customer_id\n  FROM orders\n  GROUP BY customer_id\n  HAVING SUM(amount) > ${threshold}\n)\nORDER BY ${sortExpression} ${sortOrder};`;
}

export function subqueryFlowInnerSql(threshold:number):string{
  return `SELECT customer_id\nFROM orders\nGROUP BY customer_id\nHAVING SUM(amount) > ${threshold}`;
}

export function formatSubqueryFlowNumber(value:number):string{
  return value.toLocaleString("en-US");
}
