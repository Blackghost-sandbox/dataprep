import { customerTable } from "@/lib/sql-lessons";
export type FilterMode="age"|"city"|"not-city"|"equals-null"|"is-null";
export type Truth="TRUE"|"FALSE"|"UNKNOWN";
export const filterModes:{id:FilterMode;label:string}[]=[{id:"age",label:"Older than an age"},{id:"city",label:"Lives in Chennai"},{id:"not-city",label:"Not Chennai"},{id:"equals-null",label:"Missing city: = NULL"},{id:"is-null",label:"Missing city: IS NULL"}];
export const filterRows=customerTable.rows.map(row=>({id:Number(row[0]),name:String(row[1]),city:row[2]===null?null:String(row[2]),age:Number(row[3])}));
export function predicate(mode:FilterMode,age:number){return mode==="age"?`age > ${age}`:mode==="city"?"city = 'Chennai'":mode==="not-city"?"city <> 'Chennai'":mode==="equals-null"?"city = NULL":"city IS NULL";}
export function evaluateFilter(row:typeof filterRows[number],mode:FilterMode,age:number):Truth{
  if(mode==="age")return row.age>age?"TRUE":"FALSE";
  if(mode==="is-null")return row.city===null?"TRUE":"FALSE";
  if(mode==="equals-null"||row.city===null)return "UNKNOWN";
  return (mode==="city"?row.city==="Chennai":row.city!=="Chennai")?"TRUE":"FALSE";
}
export function filterReason(row:typeof filterRows[number],mode:FilterMode,age:number){const result=evaluateFilter(row,mode,age);return result==="UNKNOWN"?"The city is unknown, or the comparison uses NULL. Ordinary comparisons cannot establish TRUE. WHERE therefore excludes this row.":mode==="is-null"?`${row.name}’s city ${row.city===null?"is missing":"is known"}. IS NULL returns ${result}.`:`${mode==="age"?`${row.age} > ${age}`:`'${row.city}' ${mode==="city"?"=":"<>"} 'Chennai'`} is ${result}. ${result==="TRUE"?"The row passes into the result.":"The row stays in the source table but is not returned."}`;}
export function filterQuery(mode:FilterMode,age:number){return `SELECT name, city, age\nFROM customers\nWHERE ${predicate(mode,age)}\nORDER BY id;`;}
