export type PreviewRow = {id?:number;name:string;age:number;city:string;salary?:number;age_group?:string};
export const transformationRows:ReadonlyArray<PreviewRow> = [
  {id:1,name:"Alice",age:23,city:"New York",salary:50000},
  {id:2,name:"Bob",age:30,city:"London",salary:80000},
  {id:3,name:"Charlie",age:27,city:"Berlin",salary:60000},
  {id:4,name:"Diana",age:22,city:"Paris",salary:45000},
  {id:5,name:"Ethan",age:35,city:"Tokyo",salary:95000},
  {id:6,name:"Fiona",age:28,city:"Dubai",salary:70000},
  {id:7,name:"George",age:31,city:"Singapore",salary:85000},
];
export const transformationStages = ["Load Data","Filter Rows","Select Columns","Add Column","Result"] as const;
export const stageExplanation = [
  "Preview seven source rows. Spark has not run a data-processing action.",
  "Keep age > 25: Alice and Diana drop out of the preview. Spark adds a Filter to the plan.",
  "Project name, age and city. Remove id and salary from the preview, not from the original DataFrame.",
  "Add age_group to a new DataFrame. The five surviving ages are all in the 26–35 range.",
  "Logical plan ready. These five rows are a teaching preview—not an executed Spark result.",
];
export function transformationPreview(stage:number):PreviewRow[]{
  const rows=transformationRows.filter(row=>stage<1||row.age>25);
  return rows.map(row=>{
    const projected:PreviewRow=stage>=2?{name:row.name,age:row.age,city:row.city}:{...row};
    return stage>=3?{...projected,age_group:row.age<=25?"18-25":row.age<=35?"26-35":"36+"}:projected;
  });
}
export const transformationCode = [
  'from pyspark.sql.functions import col, when',
  '',
  'transformed_df = (',
  '    df.filter(col("age") > 25)',
  '      .select("name", "age", "city")',
  '      .withColumn("age_group",',
  '          when(col("age") <= 25, "18-25")',
  '          .when(col("age") <= 35, "26-35")',
  '          .otherwise("36+"))',
  ')',
];
export const transformationOptions = {
  filter:{description:"Keep rows that satisfy a condition. It changes which rows appear, not which columns.",example:'df.filter(col("age") > 25)'},
  select:{description:"Choose columns or expressions—a projection. The original DataFrame is unchanged.",example:'df.select("name", "city")'},
  withColumn:{description:"Return a DataFrame with a new column, or replace an existing column of the same name.",example:'df.withColumn("next_age", col("age") + 1)'},
  drop:{description:"Return a DataFrame without the named column.",example:'df.drop("salary")'},
  rename:{description:"Change a column name with withColumnRenamed.",example:'df.withColumnRenamed("city", "location")'},
  cast:{description:"Convert an expression to a different type. Invalid conversions depend on ANSI settings.",example:'df.withColumn("age", col("age").cast("long"))'},
  distinct:{description:"Remove duplicate full rows in a new DataFrame. This can require a shuffle.",example:'df.distinct()'},
  orderBy:{description:"Define a sorted result. Sorting can require distributed data movement.",example:'df.orderBy(col("age").desc())'},
  limit:{description:"Keep at most N rows. Without an explicit order, which rows you get is not guaranteed.",example:'df.limit(3)'},
} as const;
