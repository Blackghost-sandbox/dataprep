export type QueryCell = string | number | null;
export type QueryTable = { columns:string[]; rows:QueryCell[][] };
export type QueryStageId = "from" | "where" | "group" | "having" | "select" | "order" | "limit";

export type QueryExecutionStage = {
  id:QueryStageId;
  label:string;
  short:string;
  description:string;
  table:QueryTable;
  skipped?:boolean;
};

export type QueryExecutionResult = {
  final:QueryTable;
  stages:QueryExecutionStage[];
  error?:string;
  explanation:string;
};

export type OrderRow = {
  id:number;
  customer_id:number;
  order_date:string;
  amount:number;
};

export const executionOrders:OrderRow[] = [
  {id:1,customer_id:101,order_date:"2023-01-15",amount:250},
  {id:2,customer_id:101,order_date:"2023-02-10",amount:540},
  {id:3,customer_id:102,order_date:"2023-02-20",amount:320},
  {id:4,customer_id:102,order_date:"2023-03-05",amount:780},
  {id:5,customer_id:103,order_date:"2023-04-12",amount:120},
  {id:6,customer_id:103,order_date:"2023-05-01",amount:650},
  {id:7,customer_id:104,order_date:"2023-06-10",amount:210},
  {id:8,customer_id:104,order_date:"2023-06-15",amount:860},
  {id:9,customer_id:105,order_date:"2023-07-01",amount:310},
  {id:10,customer_id:105,order_date:"2023-07-18",amount:450},
];

export const executionCustomers = [
  {customer_id:101,name:"Alice",segment:"Enterprise"},
  {customer_id:102,name:"Bob",segment:"Growth"},
  {customer_id:103,name:"Carol",segment:"Starter"},
  {customer_id:104,name:"David",segment:"Enterprise"},
  {customer_id:105,name:"Eva",segment:"Growth"},
];

export type QueryVariationId = "full" | "where" | "group" | "having" | "order" | "limit";

export const queryExecutionVariations:Array<{
  id:QueryVariationId;
  label:string;
  query:string;
  note:string;
}> = [
  {
    id:"full",
    label:"Full review",
    query:
      "SELECT\n" +
      "  customer_id,\n" +
      "  COUNT(*) AS total_orders,\n" +
      "  SUM(amount) AS total_amount\n" +
      "FROM orders\n" +
      "WHERE amount > 200\n" +
      "GROUP BY customer_id\n" +
      "HAVING COUNT(*) > 1\n" +
      "ORDER BY total_amount DESC\n" +
      "LIMIT 5;",
    note:"Trace every logical stage from FROM through LIMIT.",
  },
  {
    id:"where",
    label:"Change WHERE",
    query:
      "SELECT id, customer_id, order_date, amount\n" +
      "FROM orders\n" +
      "WHERE amount > 500\n" +
      "ORDER BY amount DESC;",
    note:"See row filtering happen before SELECT and ORDER BY.",
  },
  {
    id:"group",
    label:"Add GROUP BY",
    query:
      "SELECT customer_id, COUNT(*) AS total_orders, SUM(amount) AS total_amount\n" +
      "FROM orders\n" +
      "WHERE amount > 200\n" +
      "GROUP BY customer_id;",
    note:"Watch detail rows collapse into one row per customer.",
  },
  {
    id:"having",
    label:"Add HAVING",
    query:
      "SELECT customer_id, COUNT(*) AS total_orders, SUM(amount) AS total_amount\n" +
      "FROM orders\n" +
      "WHERE amount > 200\n" +
      "GROUP BY customer_id\n" +
      "HAVING COUNT(*) > 1;",
    note:"HAVING filters completed groups after GROUP BY.",
  },
  {
    id:"order",
    label:"Add ORDER BY",
    query:
      "SELECT customer_id, COUNT(*) AS total_orders, SUM(amount) AS total_amount\n" +
      "FROM orders\n" +
      "WHERE amount > 200\n" +
      "GROUP BY customer_id\n" +
      "HAVING COUNT(*) > 1\n" +
      "ORDER BY total_amount DESC;",
    note:"ORDER BY reorders the selected result after grouping and HAVING.",
  },
  {
    id:"limit",
    label:"Add LIMIT",
    query:
      "SELECT customer_id, COUNT(*) AS total_orders, SUM(amount) AS total_amount\n" +
      "FROM orders\n" +
      "WHERE amount > 200\n" +
      "GROUP BY customer_id\n" +
      "HAVING COUNT(*) > 1\n" +
      "ORDER BY total_amount DESC\n" +
      "LIMIT 2;",
    note:"LIMIT keeps only the first N rows after sorting.",
  },
];

const sourceTable:QueryTable = {
  columns:["id","customer_id","order_date","amount"],
  rows:executionOrders.map(row=>[row.id,row.customer_id,row.order_date,row.amount]),
};

function compare(value:number,operator:string,threshold:number){
  if(operator===">")return value>threshold;
  if(operator===">=")return value>=threshold;
  if(operator==="<")return value<threshold;
  if(operator==="<=")return value<=threshold;
  return value===threshold;
}

function splitSelectList(value:string){
  const parts:string[]=[];
  let depth=0,start=0;
  for(let i=0;i<value.length;i++){
    if(value[i]==="(")depth++;
    else if(value[i]===")")depth=Math.max(0,depth-1);
    else if(value[i]===","&&depth===0){parts.push(value.slice(start,i).trim());start=i+1;}
  }
  parts.push(value.slice(start).trim());
  return parts.filter(Boolean);
}

export function evaluateQueryExecution(query:string):QueryExecutionResult {
  const clean=query.replace(/--.*$/gm," ").trim();
  const compact=clean.replace(/\s+/g," ");
  const upper=compact.toUpperCase();

  if(!upper.startsWith("SELECT ")||!upper.includes(" FROM ")){
    return {final:{columns:[],rows:[]},stages:[],error:"Expected a SELECT query with a FROM clause.",explanation:"Start with SELECT and read from the orders table."};
  }

  const fromTable=compact.match(/\bFROM\s+([A-Za-z_][A-Za-z0-9_]*)/i)?.[1]?.toLowerCase();
  if(fromTable!=="orders"){
    return {final:{columns:[],rows:[]},stages:[],error:`Unknown table "${fromTable||"?"}". This review uses orders.`,explanation:"Use FROM orders for the review dataset."};
  }

  const selectBody=compact.match(/^SELECT\s+(.+?)\s+FROM\s+/i)?.[1]||"";
  const selected=splitSelectList(selectBody);
  if(!selected.length){
    return {final:{columns:[],rows:[]},stages:[],error:"SELECT must choose at least one column or expression.",explanation:"Choose detail columns or supported aggregates."};
  }

  const stages:QueryExecutionStage[]=[];

  stages.push({
    id:"from",label:"FROM / JOIN",short:"Build base dataset",
    description:"FROM is the logical starting point here. It loads the orders rows before filters or output shaping.",
    table:sourceTable,
  });

  const whereMatch=compact.match(/\bWHERE\s+amount\s*(>=|<=|>|<|=)\s*(\d+(?:\.\d+)?)/i);
  let detailRows=[...executionOrders];
  if(/\bWHERE\b/i.test(compact)&&!whereMatch){
    return {final:{columns:[],rows:[]},stages,error:"This lesson runner supports WHERE amount <operator> number.",explanation:"Try a numeric amount filter such as WHERE amount > 200."};
  }
  if(whereMatch){
    const [,operator,raw]=whereMatch;
    const threshold=Number(raw);
    detailRows=detailRows.filter(row=>compare(row.amount,operator,threshold));
    stages.push({
      id:"where",label:"WHERE",short:"Filter rows",
      description:`WHERE tests each order before grouping. ${detailRows.length} of ${executionOrders.length} rows pass amount ${operator} ${threshold}.`,
      table:{columns:sourceTable.columns,rows:detailRows.map(row=>[row.id,row.customer_id,row.order_date,row.amount])},
    });
  }else{
    stages.push({id:"where",label:"WHERE",short:"Filter rows",description:"No WHERE clause is present, so every source row continues.",table:sourceTable,skipped:true});
  }

  const hasGroup=/\bGROUP\s+BY\s+customer_id\b/i.test(compact);
  if(/\bGROUP\s+BY\b/i.test(compact)&&!hasGroup){
    return {final:{columns:[],rows:[]},stages,error:"This lesson runner supports GROUP BY customer_id.",explanation:"Group the review data by customer_id."};
  }

  type GroupRow={customer_id:number;total_orders:number;total_amount:number};
  let grouped:GroupRow[]=[];
  if(hasGroup){
    const map=new Map<number,GroupRow>();
    for(const row of detailRows){
      const current=map.get(row.customer_id)||{customer_id:row.customer_id,total_orders:0,total_amount:0};
      current.total_orders+=1;current.total_amount+=row.amount;map.set(row.customer_id,current);
    }
    grouped=[...map.values()].sort((a,b)=>a.customer_id-b.customer_id);
    stages.push({
      id:"group",label:"GROUP BY",short:"Create groups",
      description:`GROUP BY changes the grain from ${detailRows.length} order rows to ${grouped.length} customer groups.`,
      table:{columns:["customer_id","group_rows","sum_amount"],rows:grouped.map(row=>[row.customer_id,row.total_orders,row.total_amount])},
    });
  }else{
    stages.push({
      id:"group",label:"GROUP BY",short:"Create groups",
      description:"No GROUP BY clause is present, so detail-row grain is preserved.",
      table:{columns:sourceTable.columns,rows:detailRows.map(row=>[row.id,row.customer_id,row.order_date,row.amount])},
      skipped:true,
    });
  }

  const havingMatch=compact.match(/\bHAVING\s+(COUNT\s*\(\s*\*\s*\)|SUM\s*\(\s*amount\s*\))\s*(>=|<=|>|<|=)\s*(\d+(?:\.\d+)?)/i);
  let groupedAfterHaving=[...grouped];
  if(/\bHAVING\b/i.test(compact)&&!hasGroup){
    return {final:{columns:[],rows:[]},stages,error:"HAVING requires grouped rows in this lesson. Add GROUP BY customer_id first.",explanation:"WHERE filters source rows; HAVING filters groups."};
  }
  if(/\bHAVING\b/i.test(compact)&&!havingMatch){
    return {final:{columns:[],rows:[]},stages,error:"Supported HAVING expressions use COUNT(*) or SUM(amount) with a numeric comparison.",explanation:"Try HAVING COUNT(*) > 1."};
  }
  if(havingMatch){
    const [,aggregate,operator,raw]=havingMatch;
    const threshold=Number(raw);
    const useCount=/COUNT/i.test(aggregate);
    groupedAfterHaving=grouped.filter(row=>compare(useCount?row.total_orders:row.total_amount,operator,threshold));
    stages.push({
      id:"having",label:"HAVING",short:"Filter groups",
      description:`HAVING evaluates completed groups. ${groupedAfterHaving.length} of ${grouped.length} groups remain.`,
      table:{columns:["customer_id","group_rows","sum_amount"],rows:groupedAfterHaving.map(row=>[row.customer_id,row.total_orders,row.total_amount])},
    });
  }else{
    stages.push({
      id:"having",label:"HAVING",short:"Filter groups",
      description:"No HAVING clause is present, so no grouped result is removed at this stage.",
      table:hasGroup?{columns:["customer_id","group_rows","sum_amount"],rows:grouped.map(row=>[row.customer_id,row.total_orders,row.total_amount])}:{columns:sourceTable.columns,rows:detailRows.map(row=>[row.id,row.customer_id,row.order_date,row.amount])},
      skipped:true,
    });
  }

  const hasCount=/COUNT\s*\(\s*\*\s*\)/i.test(selectBody);
  const hasSum=/SUM\s*\(\s*amount\s*\)/i.test(selectBody);
  const countAlias=selectBody.match(/COUNT\s*\(\s*\*\s*\)\s+AS\s+([A-Za-z_][A-Za-z0-9_]*)/i)?.[1]||"total_orders";
  const sumAlias=selectBody.match(/SUM\s*\(\s*amount\s*\)\s+AS\s+([A-Za-z_][A-Za-z0-9_]*)/i)?.[1]||"total_amount";

  let selectedTable:QueryTable;
  if(hasGroup){
    const invalid=selected.find(item=>{
      const normalized=item.replace(/\s+AS\s+[A-Za-z_][A-Za-z0-9_]*$/i,"").trim().toUpperCase();
      return !["CUSTOMER_ID","COUNT(*)","SUM(AMOUNT)"].includes(normalized);
    });
    if(invalid){
      return {final:{columns:[],rows:[]},stages,error:`Unsupported grouped SELECT expression "${invalid}".`,explanation:"For this review use customer_id, COUNT(*), and SUM(amount)."};
    }
    const columns:string[]=[];
    if(selected.some(item=>/^customer_id$/i.test(item.trim())))columns.push("customer_id");
    if(hasCount)columns.push(countAlias);
    if(hasSum)columns.push(sumAlias);
    const source=havingMatch?groupedAfterHaving:grouped;
    selectedTable={
      columns,
      rows:source.map(row=>columns.map(column=>column==="customer_id"?row.customer_id:column===countAlias?row.total_orders:row.total_amount)),
    };
  }else{
    const allowed=new Set(["id","customer_id","order_date","amount"]);
    const columns=selected.map(item=>item.trim()).filter(item=>allowed.has(item.toLowerCase()));
    if(columns.length!==selected.length){
      const bad=selected.find(item=>!allowed.has(item.toLowerCase()));
      return {final:{columns:[],rows:[]},stages,error:`Unsupported detail SELECT expression "${bad}".`,explanation:"Without GROUP BY, select id, customer_id, order_date, or amount."};
    }
    selectedTable={columns,rows:detailRows.map(row=>columns.map(column=>row[column.toLowerCase() as keyof OrderRow]))};
  }
  stages.push({id:"select",label:"SELECT",short:"Choose columns",description:`SELECT shapes the output into ${selectedTable.columns.join(", ")}.`,table:selectedTable});

  const orderMatch=compact.match(/\bORDER\s+BY\s+([A-Za-z_][A-Za-z0-9_]*)(?:\s+(ASC|DESC))?/i);
  let orderedTable={columns:[...selectedTable.columns],rows:selectedTable.rows.map(row=>[...row])};
  if(orderMatch){
    const column=orderMatch[1];
    const direction=(orderMatch[2]||"ASC").toUpperCase();
    const index=orderedTable.columns.findIndex(value=>value.toLowerCase()===column.toLowerCase());
    if(index<0){
      return {final:{columns:[],rows:[]},stages,error:`ORDER BY column "${column}" is not available in the selected result.`,explanation:"Order by a selected output column or alias."};
    }
    orderedTable.rows.sort((a,b)=>{
      const left=a[index],right=b[index];
      const cmp=typeof left==="number"&&typeof right==="number"?left-right:String(left).localeCompare(String(right));
      return direction==="DESC"?-cmp:cmp;
    });
    stages.push({id:"order",label:"ORDER BY",short:"Sort results",description:`ORDER BY sorts ${column} ${direction} after SELECT.`,table:orderedTable});
  }else{
    stages.push({id:"order",label:"ORDER BY",short:"Sort results",description:"No ORDER BY clause is present, so display order is not defined by the query.",table:selectedTable,skipped:true});
  }

  const limitMatch=compact.match(/\bLIMIT\s+(\d+)\b/i);
  let finalTable={columns:[...orderedTable.columns],rows:orderedTable.rows.map(row=>[...row])};
  if(limitMatch){
    const limit=Number(limitMatch[1]);
    finalTable.rows=finalTable.rows.slice(0,limit);
    stages.push({id:"limit",label:"LIMIT",short:"Return top N",description:`LIMIT keeps at most ${limit} rows after sorting.`,table:finalTable});
  }else{
    stages.push({id:"limit",label:"LIMIT",short:"Return top N",description:"No LIMIT clause is present, so all rows from the previous stage remain.",table:orderedTable,skipped:true});
  }

  return {
    final:finalTable,
    stages,
    explanation:`Logical processing produced ${finalTable.rows.length} result row${finalTable.rows.length===1?"":"s"}. The optimizer may use a different physical plan while preserving this meaning.`,
  };
}
