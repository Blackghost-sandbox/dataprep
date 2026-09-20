export const sqlSales = [
  {country:"IN",amount:100}, {country:"US",amount:50}, {country:"IN",amount:20},
  {country:"US",amount:-10}, {country:"IN",amount:0},
];
export const positiveSales=sqlSales.filter(row=>row.amount>0);
export const sqlTotals=["IN","US"].map(country=>({country,total:positiveSales.filter(row=>row.country===country).reduce((sum,row)=>sum+row.amount,0)}));
export const sqlSetup=`sales = spark.createDataFrame(\n    [${sqlSales.map(row=>`("${row.country}", ${row.amount})`).join(", ")}],\n    "country STRING, amount INT"\n)\nsales.createOrReplaceTempView("sales")`;
export const sqlQuery=`SELECT country, SUM(amount) AS total
FROM sales
WHERE amount > 0
GROUP BY country
ORDER BY country`;
export const dataframeQuery=`from pyspark.sql import functions as F
result = (sales.filter(F.col("amount") > 0)
    .groupBy("country")
    .agg(F.sum("amount").alias("total"))
    .orderBy("country"))
result.show()`;
export const sqlSteps=[
  {title:"Start with five sales",explanation:"Each row is a sale or adjustment. We will total positive sales by country—not net revenue including refunds.",sql:"FROM sales",df:"sales"},
  {title:"Keep only positive amounts",explanation:"Remove the US refund (−10) and IN zero amount. Three positive sales remain.",sql:"WHERE amount > 0",df:'sales.filter(F.col("amount") > 0)'},
  {title:"Group matching countries",explanation:"IN has amounts 100 and 20. US has 50. Grouping describes which rows will be summarized.",sql:"GROUP BY country",df:'.groupBy("country")'},
  {title:"Add each group and sort",explanation:"IN: 100 + 20 = 120. US: 50. ORDER BY country gives a predictable display order.",sql:"SELECT country, SUM(amount) AS total\nORDER BY country",df:'.agg(F.sum("amount").alias("total"))\n.orderBy("country")'},
];
