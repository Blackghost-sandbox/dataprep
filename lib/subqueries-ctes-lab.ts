export type SubqueryCell = string | number | null;
export type SubqueryMode = "subquery" | "cte" | "select";
export type CustomerRow = { id:number; name:string; city:string };
export type OrderRow = { id:number; customer_id:number; amount:number; order_date:string };
export type SubqueryDataset = {
  id:string;
  label:string;
  customers:CustomerRow[];
  orders:OrderRow[];
};
export type CustomerTotal = {
  id:number;
  name:string;
  city:string;
  total_amount:number;
  avg_amount:number|null;
  order_count:number;
};

export type SubqueryScenario = {
  id:SubqueryMode;
  label:string;
  subtitle:string;
  description:string;
};

export const subqueryDatasets:SubqueryDataset[]=[
  {
    id:"customers-orders",
    label:"Customers & Orders (10 rows)",
    customers:[
      {id:1,name:"Alice",city:"Chennai"},
      {id:2,name:"Bob",city:"Mumbai"},
      {id:3,name:"Carol",city:"Delhi"},
      {id:4,name:"David",city:"Bangalore"},
      {id:5,name:"Eva",city:"Hyderabad"},
    ],
    orders:[
      {id:101,customer_id:1,amount:250,order_date:"2023-01-15"},
      {id:102,customer_id:2,amount:540,order_date:"2023-02-10"},
      {id:103,customer_id:1,amount:320,order_date:"2023-02-20"},
      {id:104,customer_id:3,amount:780,order_date:"2023-03-05"},
      {id:105,customer_id:4,amount:120,order_date:"2023-03-18"},
      {id:106,customer_id:2,amount:660,order_date:"2023-03-24"},
      {id:107,customer_id:3,amount:110,order_date:"2023-04-02"},
      {id:108,customer_id:5,amount:760,order_date:"2023-04-12"},
      {id:109,customer_id:4,amount:300,order_date:"2023-04-18"},
      {id:110,customer_id:1,amount:-100,order_date:"2023-04-25"},
    ],
  },
  {
    id:"regional",
    label:"Regional Orders (8 rows)",
    customers:[
      {id:11,name:"Maya",city:"Delhi"},
      {id:12,name:"Noah",city:"Pune"},
      {id:13,name:"Isha",city:"Mumbai"},
      {id:14,name:"Liam",city:"Chennai"},
    ],
    orders:[
      {id:301,customer_id:11,amount:260,order_date:"2023-05-01"},
      {id:302,customer_id:11,amount:420,order_date:"2023-05-03"},
      {id:303,customer_id:12,amount:150,order_date:"2023-05-04"},
      {id:304,customer_id:13,amount:700,order_date:"2023-05-06"},
      {id:305,customer_id:13,amount:330,order_date:"2023-05-08"},
      {id:306,customer_id:14,amount:200,order_date:"2023-05-11"},
      {id:307,customer_id:14,amount:240,order_date:"2023-05-12"},
      {id:308,customer_id:12,amount:410,order_date:"2023-05-13"},
    ],
  },
];

export const subqueryScenarios:SubqueryScenario[]=[
  {id:"subquery",label:"Subquery",subtitle:"Find customers with total orders > threshold using a subquery in WHERE.",description:"The inner query computes customer IDs whose total order amount passes the threshold. The outer query keeps those customers."},
  {id:"cte",label:"CTE (WITH)",subtitle:"Use a CTE to compute total orders per customer and then filter.",description:"The WITH clause names the totals step, making the intermediate result explicit before filtering customers."},
  {id:"select",label:"Subquery in SELECT",subtitle:"Show each customer with their average order amount using a subquery.",description:"A correlated scalar subquery calculates one average amount for each customer row."},
];

export function customerTotals(dataset:SubqueryDataset):CustomerTotal[]{
  const byCustomer=new Map<number,number[]>();
  for(const order of dataset.orders){
    const values=byCustomer.get(order.customer_id)??[];
    values.push(order.amount);
    byCustomer.set(order.customer_id,values);
  }
  return dataset.customers.map(customer=>{
    const amounts=byCustomer.get(customer.id)??[];
    const total=amounts.reduce((sum,value)=>sum+value,0);
    return {
      ...customer,
      total_amount:total,
      avg_amount:amounts.length?total/amounts.length:null,
      order_count:amounts.length,
    };
  });
}

export function subqueryResult(dataset:SubqueryDataset,mode:SubqueryMode,threshold:number):CustomerTotal[]{
  const totals=customerTotals(dataset);
  if(mode==="select")return totals;
  return totals.filter(row=>row.total_amount>threshold);
}

export function subqueryIds(dataset:SubqueryDataset,threshold:number):number[]{
  return customerTotals(dataset).filter(row=>row.total_amount>threshold).map(row=>row.id);
}

export function subquerySql(mode:SubqueryMode,threshold:number):string{
  if(mode==="cte"){
    return `WITH totals AS (\n  SELECT customer_id, SUM(amount) AS total_amount\n  FROM orders\n  GROUP BY customer_id\n)\nSELECT c.id, c.name, c.city, t.total_amount\nFROM customers c\nJOIN totals t ON c.id = t.customer_id\nWHERE t.total_amount > ${threshold}\nORDER BY c.id;`;
  }
  if(mode==="select"){
    return `SELECT c.id, c.name, c.city,\n  (SELECT AVG(o.amount)\n   FROM orders o\n   WHERE o.customer_id = c.id) AS avg_amount\nFROM customers c\nORDER BY c.id;`;
  }
  return `SELECT c.id, c.name, c.city,\n  (SELECT SUM(o2.amount) FROM orders o2 WHERE o2.customer_id = c.id) AS total_amount\nFROM customers c\nWHERE c.id IN (\n  SELECT customer_id\n  FROM orders\n  GROUP BY customer_id\n  HAVING SUM(amount) > ${threshold}\n)\nORDER BY c.id;`;
}

export function formatSubqueryNumber(value:number|null):string{
  if(value===null)return "NULL";
  if(Number.isInteger(value))return value.toLocaleString("en-US");
  return value.toFixed(2);
}
