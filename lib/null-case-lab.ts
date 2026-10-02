export type NullCaseCell = string | number | null;
export type NullCaseRow = {
  id:number;
  name:string;
  city:string|null;
  signup_date:string|null;
};

export type NullCaseScenarioId = "city-label" | "signup-status" | "count-nulls" | "multiple-conditions" | "custom";

export type NullCaseResult = {
  columns:string[];
  rows:NullCaseCell[][];
  error?:string;
  explanation:string;
};

export const nullCaseRows:NullCaseRow[] = [
  {id:1,name:"Alice",city:"Mumbai",signup_date:"2023-01-15"},
  {id:2,name:"Bob",city:null,signup_date:"2023-02-10"},
  {id:3,name:"Carol",city:"Delhi",signup_date:null},
  {id:4,name:"David",city:"Bangalore",signup_date:"2023-03-05"},
  {id:5,name:"Eva",city:null,signup_date:"2023-04-12"},
  {id:6,name:"Frank",city:"Chennai",signup_date:"2023-05-01"},
  {id:7,name:"Grace",city:"Hyderabad",signup_date:null},
  {id:8,name:"Henry",city:"Pune",signup_date:"2023-06-15"},
  {id:9,name:"Irene",city:null,signup_date:"2023-07-10"},
  {id:10,name:"Jack",city:"Kolkata",signup_date:"2023-08-01"},
];

export const nullCaseScenarios:Array<{
  id:NullCaseScenarioId;
  label:string;
  description:string;
  query:string;
}> = [
  {
    id:"city-label",
    label:"Label NULL cities",
    description:"Replace a missing city with a display label while preserving the stored value.",
    query:
      "SELECT\n" +
      "  id,\n" +
      "  name,\n" +
      "  city,\n" +
      "  CASE WHEN city IS NULL THEN 'Unknown' ELSE city END AS city_label,\n" +
      "  signup_date,\n" +
      "  CASE WHEN signup_date IS NULL THEN 'Not Signed Up' ELSE 'Signed Up' END AS signup_status\n" +
      "FROM customers\n" +
      "ORDER BY id;",
  },
  {
    id:"signup-status",
    label:"Label signup status",
    description:"Use CASE to translate a missing signup date into a meaningful status.",
    query:
      "SELECT\n" +
      "  id, name, signup_date,\n" +
      "  CASE\n" +
      "    WHEN signup_date IS NULL THEN 'Not Signed Up'\n" +
      "    ELSE 'Signed Up'\n" +
      "  END AS signup_status\n" +
      "FROM customers\n" +
      "ORDER BY id;",
  },
  {
    id:"count-nulls",
    label:"Count NULLs",
    description:"Summarize how many customer rows have missing city or signup-date values.",
    query:
      "SELECT\n" +
      "  COUNT(*) AS total_rows,\n" +
      "  SUM(CASE WHEN city IS NULL THEN 1 ELSE 0 END) AS null_cities,\n" +
      "  SUM(CASE WHEN signup_date IS NULL THEN 1 ELSE 0 END) AS null_signup_dates\n" +
      "FROM customers;",
  },
  {
    id:"multiple-conditions",
    label:"Multiple conditions",
    description:"Evaluate CASE branches from most specific to least specific.",
    query:
      "SELECT\n" +
      "  id, name, city, signup_date,\n" +
      "  CASE\n" +
      "    WHEN city IS NULL AND signup_date IS NULL THEN 'Needs profile'\n" +
      "    WHEN city IS NULL THEN 'Missing city'\n" +
      "    WHEN signup_date IS NULL THEN 'Not signed up'\n" +
      "    ELSE 'Complete'\n" +
      "  END AS profile_status\n" +
      "FROM customers\n" +
      "ORDER BY id;",
  },
  {
    id:"custom",
    label:"Custom query",
    description:"Edit the CASE labels or switch the tested nullable column, then run it.",
    query:
      "SELECT id, name, city,\n" +
      "  CASE WHEN city IS NULL THEN 'Missing' ELSE city END AS display_city\n" +
      "FROM customers\n" +
      "ORDER BY id;",
  },
];

const allowedColumns = new Set(["id","name","city","signup_date"]);

function cleanIdentifier(value:string){return value.trim().replace(/["`]/g,"");}

export function evaluateNullCaseQuery(query:string):NullCaseResult {
  const compact=query.replace(/--.*$/gm," ").replace(/\s+/g," ").trim();
  const upper=compact.toUpperCase();

  if(!upper.startsWith("SELECT ") || !upper.includes(" FROM ")){
    return {columns:[],rows:[],error:"Expected a SELECT query with a FROM clause.",explanation:"Start with SELECT and read from the customers table."};
  }
  const table=compact.match(/\bFROM\s+([A-Za-z_][A-Za-z0-9_]*)/i)?.[1];
  if(table?.toLowerCase()!=="customers"){
    return {columns:[],rows:[],error:`Unknown table "${table||"?"}". This lesson uses customers.`,explanation:"Use FROM customers for this lesson dataset."};
  }

  const unknownReference=compact.match(/\b(?:WHEN|ELSE|SELECT|,)\s+([A-Za-z_][A-Za-z0-9_]*)\s+IS\s+NULL/i)?.[1];
  if(unknownReference && !allowedColumns.has(unknownReference.toLowerCase())){
    return {columns:[],rows:[],error:`Unknown column "${unknownReference}".`,explanation:"Available nullable columns are city and signup_date."};
  }

  if(/\b(?:CITY|SIGNUP_DATE)\s*=\s*NULL\b/i.test(compact)){
    return {columns:[],rows:[],error:"Use IS NULL instead of = NULL. Equality with NULL is UNKNOWN.",explanation:"NULL is tested with IS NULL or IS NOT NULL, not equality."};
  }

  if(/COUNT\s*\(\s*\*\s*\)/i.test(compact) && /SUM\s*\(\s*CASE/i.test(compact)){
    const cityCount=nullCaseRows.filter(row=>row.city===null).length;
    const signupCount=nullCaseRows.filter(row=>row.signup_date===null).length;
    return {
      columns:["total_rows","null_cities","null_signup_dates"],
      rows:[[nullCaseRows.length,cityCount,signupCount]],
      explanation:"CASE turns each NULL test into 1 or 0, then SUM counts the matching rows.",
    };
  }

  const cityCase=compact.match(/CASE\s+WHEN\s+city\s+IS\s+NULL\s+THEN\s+'([^']*)'\s+ELSE\s+city\s+END\s+AS\s+([A-Za-z_][A-Za-z0-9_]*)/i);
  const signupCase=compact.match(/CASE\s+WHEN\s+signup_date\s+IS\s+NULL\s+THEN\s+'([^']*)'\s+ELSE\s+'([^']*)'\s+END\s+AS\s+([A-Za-z_][A-Za-z0-9_]*)/i);
  if(cityCase && signupCase){
    const [,cityNull,cityAlias]=cityCase;
    const [,signupNull,signupElse,signupAlias]=signupCase;
    return {
      columns:["id","name","city",cityAlias,"signup_date",signupAlias],
      rows:nullCaseRows.map(row=>[
        row.id,row.name,row.city,row.city===null?cityNull:row.city,row.signup_date,row.signup_date===null?signupNull:signupElse,
      ]),
      explanation:"Each CASE expression evaluates independently: missing cities receive a display label and missing signup dates receive a status.",
    };
  }

  const profileAlias=compact.match(/END\s+AS\s+([A-Za-z_][A-Za-z0-9_]*)/i)?.[1] || "result";
  if(/CITY\s+IS\s+NULL\s+AND\s+SIGNUP_DATE\s+IS\s+NULL/i.test(compact)){
    const labels=[...compact.matchAll(/THEN\s+'([^']*)'/gi)].map(match=>match[1]);
    const elseLabel=compact.match(/ELSE\s+'([^']*)'/i)?.[1] || "Complete";
    const [both="Needs profile",cityOnly="Missing city",signupOnly="Not signed up"]=labels;
    return {
      columns:["id","name","city","signup_date",profileAlias],
      rows:nullCaseRows.map(row=>[
        row.id,row.name,row.city,row.signup_date,
        row.city===null&&row.signup_date===null?both:row.city===null?cityOnly:row.signup_date===null?signupOnly:elseLabel,
      ]),
      explanation:"CASE checks branches in order. The first TRUE branch supplies the output label.",
    };
  }

  const caseMatch=compact.match(/CASE\s+WHEN\s+(city|signup_date)\s+IS\s+NULL\s+THEN\s+'([^']*)'\s+ELSE\s+([^]+?)\s+END\s+AS\s+([A-Za-z_][A-Za-z0-9_]*)/i);
  if(!caseMatch){
    return {columns:[],rows:[],error:"This lesson supports CASE WHEN city/signup_date IS NULL ... END expressions.",explanation:"Try one of the scenario buttons, then edit its labels or nullable column."};
  }

  const tested=caseMatch[1].toLowerCase() as "city"|"signup_date";
  const nullLabel=caseMatch[2];
  const elseExpression=caseMatch[3].trim();
  const alias=caseMatch[4];

  let baseColumns:string[]=[];
  const selectBody=compact.match(/^SELECT\s+(.+?)\s+FROM\s+/i)?.[1] || "";
  const beforeCase=selectBody.split(/\bCASE\b/i)[0];
  baseColumns=beforeCase.split(",").map(cleanIdentifier).filter(Boolean).filter(column=>allowedColumns.has(column.toLowerCase()));
  if(!baseColumns.length) baseColumns=["id","name",tested];

  function getValue(row:NullCaseRow,column:string):NullCaseCell{
    const key=column.toLowerCase() as keyof NullCaseRow;
    return row[key] as NullCaseCell;
  }

  const elseLiteral=elseExpression.match(/^'([^']*)'$/)?.[1];
  const elseColumn=allowedColumns.has(cleanIdentifier(elseExpression).toLowerCase())?cleanIdentifier(elseExpression).toLowerCase():null;
  if(elseLiteral===undefined && !elseColumn){
    return {columns:[],rows:[],error:`Unsupported ELSE expression "${elseExpression}". Use a quoted label or a lesson column.`,explanation:"The deterministic lesson runner supports a literal ELSE label or an existing customer column."};
  }

  return {
    columns:[...baseColumns,alias],
    rows:nullCaseRows.map(row=>{
      const testedValue=getValue(row,tested);
      const output=testedValue===null?nullLabel:(elseLiteral!==undefined?elseLiteral:getValue(row,elseColumn!));
      return [...baseColumns.map(column=>getValue(row,column)),output];
    }),
    explanation:`IS NULL tests ${tested}. CASE writes ${alias} without changing the source row.`,
  };
}
