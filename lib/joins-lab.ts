export type JoinCell = string | number | null;
export type JoinRow = Record<string, JoinCell>;
export type JoinKind = "INNER" | "LEFT" | "FULL";
export type JoinScenarioId = "inner" | "left" | "full" | "missing" | "multiple";

export type CustomerRow = {
  id:number;
  name:string;
  city:string;
};

export type OrderRow = {
  order_id:number;
  customer_id:number;
  amount:number;
  order_date:string;
};

export type JoinedRow = {
  customer_id:number|null;
  name:string|null;
  city:string|null;
  order_id:number|null;
  amount:number|null;
  order_date:string|null;
};

export type JoinScenario = {
  id:JoinScenarioId;
  label:string;
  subtitle:string;
  kind:JoinKind;
  description:string;
};

export type JoinDataset = {
  id:string;
  label:string;
  customers:CustomerRow[];
  orders:OrderRow[];
};

export const joinDatasets:JoinDataset[]=[
  {
    id:"orders",
    label:"Orders (10 rows)",
    customers:[
      {id:101,name:"Alice",city:"Chennai"},
      {id:102,name:"Bob",city:"Mumbai"},
      {id:103,name:"Carol",city:"Bangalore"},
      {id:104,name:"David",city:"Pune"},
      {id:105,name:"Eva",city:"Hyderabad"},
    ],
    orders:[
      {order_id:201,customer_id:101,amount:250,order_date:"2023-01-15"},
      {order_id:202,customer_id:101,amount:540,order_date:"2023-02-10"},
      {order_id:203,customer_id:103,amount:120,order_date:"2023-03-05"},
      {order_id:204,customer_id:102,amount:320,order_date:"2023-03-12"},
      {order_id:205,customer_id:103,amount:780,order_date:"2023-03-28"},
      {order_id:206,customer_id:104,amount:410,order_date:"2023-04-02"},
    ],
  },
  {
    id:"support",
    label:"Support (8 rows)",
    customers:[
      {id:201,name:"Maya",city:"Delhi"},
      {id:202,name:"Noah",city:"Pune"},
      {id:203,name:"Isha",city:"Mumbai"},
      {id:204,name:"Liam",city:"Chennai"},
    ],
    orders:[
      {order_id:301,customer_id:201,amount:180,order_date:"2023-05-01"},
      {order_id:302,customer_id:203,amount:720,order_date:"2023-05-03"},
      {order_id:303,customer_id:203,amount:260,order_date:"2023-05-04"},
      {order_id:304,customer_id:999,amount:450,order_date:"2023-05-06"},
    ],
  },
];

export const joinScenarios:JoinScenario[]=[
  {id:"inner",label:"INNER JOIN",subtitle:"Only matching rows",kind:"INNER",description:"Return one row for every customer/order pair whose keys match."},
  {id:"left",label:"LEFT JOIN",subtitle:"All customers + matches",kind:"LEFT",description:"Keep every customer and attach matching orders; unmatched customers receive NULL order columns."},
  {id:"full",label:"FULL JOIN",subtitle:"All rows from both tables",kind:"FULL",description:"Keep matched pairs plus unmatched rows from either side."},
  {id:"missing",label:"Missing matches",subtitle:"Customers with no orders",kind:"LEFT",description:"Start with a LEFT JOIN, then keep only customers whose order side is NULL."},
  {id:"multiple",label:"Multiple orders",subtitle:"One customer, many orders",kind:"INNER",description:"Show customers that produce more than one joined row because they have multiple matching orders."},
];

function matchedPair(customer:CustomerRow,order:OrderRow):JoinedRow{
  return {
    customer_id:customer.id,
    name:customer.name,
    city:customer.city,
    order_id:order.order_id,
    amount:order.amount,
    order_date:order.order_date,
  };
}

export function runJoin(dataset:JoinDataset,scenario:JoinScenario):JoinedRow[]{
  const customerById=new Map(dataset.customers.map(customer=>[customer.id,customer]));
  const ordersByCustomer=new Map<number,OrderRow[]>();
  for(const order of dataset.orders){
    const list=ordersByCustomer.get(order.customer_id)??[];
    list.push(order);
    ordersByCustomer.set(order.customer_id,list);
  }

  if(scenario.id==="missing"){
    return dataset.customers
      .filter(customer=>(ordersByCustomer.get(customer.id)??[]).length===0)
      .map(customer=>({
        customer_id:customer.id,name:customer.name,city:customer.city,
        order_id:null,amount:null,order_date:null,
      }));
  }

  if(scenario.id==="multiple"){
    const multiIds=new Set(
      Array.from(ordersByCustomer.entries())
        .filter(([,orders])=>orders.length>1)
        .map(([customerId])=>customerId),
    );
    return dataset.orders
      .filter(order=>multiIds.has(order.customer_id)&&customerById.has(order.customer_id))
      .map(order=>matchedPair(customerById.get(order.customer_id)!,order));
  }

  const result:JoinedRow[]=[];
  for(const customer of dataset.customers){
    const orders=ordersByCustomer.get(customer.id)??[];
    if(orders.length){
      for(const order of orders)result.push(matchedPair(customer,order));
    }else if(scenario.kind==="LEFT"||scenario.kind==="FULL"){
      result.push({
        customer_id:customer.id,name:customer.name,city:customer.city,
        order_id:null,amount:null,order_date:null,
      });
    }
  }
  if(scenario.kind==="FULL"){
    for(const order of dataset.orders){
      if(!customerById.has(order.customer_id)){
        result.push({
          customer_id:order.customer_id,name:null,city:null,
          order_id:order.order_id,amount:order.amount,order_date:order.order_date,
        });
      }
    }
  }
  return result;
}

export function joinQuery(scenario:JoinScenario):string{
  if(scenario.id==="missing"){
    return "SELECT c.name, o.order_id, o.amount\nFROM customers c\nLEFT JOIN orders o ON c.id = o.customer_id\nWHERE o.order_id IS NULL;";
  }
  if(scenario.id==="multiple"){
    return "SELECT c.name, o.order_id, o.amount\nFROM customers c\nINNER JOIN orders o ON c.id = o.customer_id\nWHERE c.id IN (\n  SELECT customer_id FROM orders\n  GROUP BY customer_id HAVING COUNT(*) > 1\n);";
  }
  const keyword=scenario.kind==="FULL"?"FULL OUTER JOIN":`${scenario.kind} JOIN`;
  return `SELECT c.name, o.order_id, o.amount\nFROM customers c\n${keyword} orders o ON c.id = o.customer_id;`;
}

export function joinParts(scenario:JoinScenario):Array<[string,string]>{
  const joinLabel=scenario.id==="full"?"FULL OUTER JOIN":`${scenario.kind} JOIN`;
  const parts:Array<[string,string]>=[
    ["c, o","Table aliases (short names for tables)"],
    [joinLabel,scenario.kind==="INNER"?"Keep only matching rows from both tables":scenario.kind==="LEFT"?"Keep all rows from customers plus matches":"Keep matched rows plus unmatched rows from both tables"],
    ["ON c.id = o.customer_id","Match rows where customer id is the same"],
  ];
  if(scenario.id==="missing")parts.push(["WHERE o.order_id IS NULL","Keep only customers without a matching order"]);
  if(scenario.id==="multiple")parts.push(["HAVING COUNT(*) > 1","Focus on customers that have multiple orders"]);
  return parts;
}
