export type PartitionRecord={id:number;name:string;age:number;city:string};
export type PartitionOperation="repartition"|"coalesce";
export const partitionRecords:PartitionRecord[]=[
 {id:1,name:"Alice",age:23,city:"NY"},{id:2,name:"Bob",age:30,city:"London"},
 {id:3,name:"Charlie",age:27,city:"Berlin"},{id:4,name:"Diana",age:22,city:"Paris"},
 {id:5,name:"Ethan",age:35,city:"Tokyo"},{id:6,name:"Fiona",age:28,city:"Dubai"},
 {id:7,name:"George",age:31,city:"Singapore"},{id:8,name:"Hana",age:29,city:"Rome"},
 {id:9,name:"Ivan",age:34,city:"Oslo"},{id:10,name:"Julia",age:26,city:"Madrid"},
 {id:11,name:"Kai",age:38,city:"Seoul"},{id:12,name:"Lina",age:24,city:"Lima"},
];
export function initialPartitions(count:number,partitions:number,skew=false):PartitionRecord[][]{
 const rows=partitionRecords.slice(0,count);
 const result:PartitionRecord[][]=Array.from({length:partitions},()=>[]);
 rows.forEach((row,i)=>{const bucket=skew?(i<count-partitions+1?0:i-(count-partitions)):Math.min(partitions-1,Math.floor(i*partitions/count));result[bucket].push(row);});
 return result;
}
export function redistribute(before:PartitionRecord[][],target:number,operation:PartitionOperation):PartitionRecord[][]{
 const actual=operation==="coalesce"?Math.min(target,before.length):target;
 const after:PartitionRecord[][]=Array.from({length:actual},()=>[]);
 if(operation==="coalesce")before.forEach((rows,i)=>after[Math.floor(i*actual/before.length)].push(...rows));
 else before.flat().forEach((row,i)=>after[i%actual].push(row));
 return after;
}
export const partitionStages=["Initial partitions","Partition count requested","Movement begins","Records move","New partitions formed","Explain result"];
export function partitionCode(target:number,operation:PartitionOperation){
 const variable=operation==="coalesce"?"reduced_df":"repartitioned_df";
 return [`# ${operation==="coalesce"?"Reduce":"Redistribute"} to ${target} partitions`,`${variable} = df.${operation}(${target})`,`${variable}.show()`];
}
