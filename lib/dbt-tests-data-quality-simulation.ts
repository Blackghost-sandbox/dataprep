export type DbtTestDatasetId = "ecommerce" | "clean" | "customer";

export type DbtTestRow = {
  row: number;
  order_id: string;
  customer_id: string;
  order_date: string;
  total_amount: string;
};

export type DbtTestFailure = {
  id: string;
  test: string;
  detail: string;
  rowIndexes: number[];
};

export type DbtTestDataset = {
  id: DbtTestDatasetId;
  label: string;
  rows: DbtTestRow[];
};

const goodRows: DbtTestRow[] = [
  {row:1,order_id:"1001",customer_id:"C001",order_date:"2024-01-01",total_amount:"120.50"},
  {row:2,order_id:"1002",customer_id:"C002",order_date:"2024-01-02",total_amount:"75.20"},
  {row:3,order_id:"1003",customer_id:"C003",order_date:"2024-01-03",total_amount:"65.00"},
  {row:4,order_id:"1004",customer_id:"C004",order_date:"2024-01-04",total_amount:"310.00"},
  {row:5,order_id:"1005",customer_id:"C005",order_date:"2024-01-05",total_amount:"88.00"},
  {row:6,order_id:"1006",customer_id:"C006",order_date:"2024-01-06",total_amount:"999.00"},
  {row:7,order_id:"1007",customer_id:"C007",order_date:"2024-01-07",total_amount:"10.00"},
  {row:8,order_id:"1008",customer_id:"C008",order_date:"2024-01-08",total_amount:"40.00"},
  {row:9,order_id:"1009",customer_id:"C009",order_date:"2024-01-09",total_amount:"55.00"},
  {row:10,order_id:"1010",customer_id:"C010",order_date:"2024-01-10",total_amount:"205.00"},
];

export const dbtTestDatasets: DbtTestDataset[] = [
  {
    id:"ecommerce",
    label:"E-commerce Orders (Sample)",
    rows:goodRows.map((row)=>({...row})).map((row,index)=>{
      if(index===3)return {...row,order_id:""};
      if(index===4)return {...row,total_amount:""};
      if(index===5)return {...row,order_id:"1005"};
      if(index===6)return {...row,total_amount:"-10.00"};
      if(index===7)return {...row,customer_id:""};
      return row;
    }),
  },
  {
    id:"clean",
    label:"Clean Orders",
    rows:goodRows.map(row=>({...row})),
  },
  {
    id:"customer",
    label:"Customer Quality Issues",
    rows:goodRows.map((row)=>({...row})).map((row,index)=>{
      if(index===1)return {...row,customer_id:""};
      if(index===2)return {...row,order_id:"1002"};
      if(index===8)return {...row,total_amount:"-5.00"};
      return row;
    }),
  },
];

export const dbtTestsYaml = [
  "version: 2",
  "models:",
  "  - name: stg_orders",
  "    columns:",
  "      - name: order_id",
  "        tests:",
  "          - not_null",
  "          - unique",
  "      - name: customer_id",
  "        tests:",
  "          - not_null",
  "      - name: total_amount",
  "        tests:",
  "          - not_null",
  "          - accepted_values:",
  "              values: [0, 10, 50, 100, 500]",
].join("\n");

export function cloneDataset(id: DbtTestDatasetId): DbtTestRow[] {
  const dataset=dbtTestDatasets.find(item=>item.id===id) ?? dbtTestDatasets[0];
  return dataset.rows.map(row=>({...row}));
}

export function runDbtDataTests(rows: DbtTestRow[]): DbtTestFailure[] {
  const failures: DbtTestFailure[]=[];

  const nullOrder=rows.flatMap((row,index)=>row.order_id.trim()===""?[index]:[]);
  if(nullOrder.length)failures.push({
    id:"not-null-order",
    test:"not_null_stg_orders_order_id",
    detail:nullOrder.length+" null value"+(nullOrder.length===1?"":"s"),
    rowIndexes:nullOrder,
  });

  const counts=new Map<string,number[]>();
  rows.forEach((row,index)=>{
    const value=row.order_id.trim();
    if(!value)return;
    counts.set(value,[...(counts.get(value)??[]),index]);
  });
  const duplicateIndexes=[...counts.values()].filter(indexes=>indexes.length>1).flat();
  if(duplicateIndexes.length)failures.push({
    id:"unique-order",
    test:"unique_stg_orders_order_id",
    detail:(duplicateIndexes.length/2)+" duplicate value"+(duplicateIndexes.length===2?"":"s"),
    rowIndexes:duplicateIndexes,
  });

  const nullCustomer=rows.flatMap((row,index)=>row.customer_id.trim()===""?[index]:[]);
  if(nullCustomer.length)failures.push({
    id:"not-null-customer",
    test:"not_null_stg_orders_customer_id",
    detail:nullCustomer.length+" null value"+(nullCustomer.length===1?"":"s"),
    rowIndexes:nullCustomer,
  });

  const invalidAmount=rows.flatMap((row,index)=>{
    const value=Number(row.total_amount);
    return row.total_amount.trim()!=="" && (!Number.isFinite(value)||value<0)?[index]:[];
  });
  if(invalidAmount.length)failures.push({
    id:"accepted-amount",
    test:"accepted_values_stg_orders_total_amount",
    detail:invalidAmount.length+" invalid value"+(invalidAmount.length===1?"":"s")+" ("+rows[invalidAmount[0]].total_amount+")",
    rowIndexes:invalidAmount,
  });

  return failures;
}

export function buildDbtTestTerminal(failures: DbtTestFailure[]): string[] {
  const configured=[
    "not_null_stg_orders_order_id",
    "unique_stg_orders_order_id",
    "not_null_stg_orders_customer_id",
    "accepted_values_stg_orders_total_amount",
  ];
  return [
    "$ dbt test --select stg_orders",
    "Running with dbt=1.7.0",
    "Found 4 tests, 4 nodes",
    ...configured.map((test,index)=>{
      const failed=failures.some(item=>item.test===test);
      return "["+(index+1)+"/4] test "+test+"   ... "+(failed?"FAIL":"PASS");
    }),
    "Finished running 4 tests in 1.62s",
    failures.length
      ? "Completed with "+failures.length+" error"+(failures.length===1?"":"s")+" and "+(4-Math.min(4,failures.length))+" successes."
      : "Completed successfully with 4 passes and 0 errors.",
  ];
}
