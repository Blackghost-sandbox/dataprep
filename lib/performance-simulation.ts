export const sampleRows = [{age:22,salary:40000},{age:31,salary:75000},{age:27,salary:60000},{age:19,salary:35000},{age:42,salary:90000}];
export const retainedRows = sampleRows.filter(row=>row.age>25);
export type PerformanceNode = 'read'|'filter'|'cache'|'count'|'sum';
export const nodeHelp: Record<PerformanceNode,string> = {
  read:'Read Data: load the five sample rows. Without persistence, a later action can repeat this upstream work.',
  filter:'Filter: keep rows where age > 25. Ages 22 and 19 do not pass. A transformation describes work; an action requests it.',
  cache:'cache(): mark the filtered DataFrame for persistence. No rows are computed yet. The first action populates cached partitions; later actions can reuse them while available.',
  count:'count(): an action that computes the number of filtered rows. Here the result is 3.',
  sum:'sum(): an aggregate expression. agg(...).collect() requests execution and returns the total salary: 225,000.',
};
export const performanceSteps = [
  {lane:'plain',node:'read',line:1,text:'Without cache · count() requests the first read: five input rows.'},
  {lane:'plain',node:'filter',line:1,text:'Apply age > 25. Two rows drop out; three continue to count().'},
  {lane:'plain',node:'count',line:1,text:'First action complete: count() = 3. The filtered rows were not persisted.'},
  {lane:'plain',node:'read',line:2,text:'Second action requested: collect the salary sum. Read all five rows AGAIN.'},
  {lane:'plain',node:'filter',line:2,text:'Filter AGAIN: recreate the same three qualifying rows.'},
  {lane:'plain',node:'sum',line:2,text:'sum(salary) = 225,000. Read + filter ran twice in this illustration.'},
  {lane:'cached',node:'cache',line:0,text:'With cache · cache() marks the result for persistence. The cache is still empty.'},
  {lane:'cached',node:'read',line:1,text:'count() requests execution: read five rows to begin populating the cache.'},
  {lane:'cached',node:'filter',line:1,text:'Filter once. Keep ages 31, 27 and 42; reject 22 and 19.'},
  {lane:'cached',node:'cache',line:1,text:'As the first action computes the data, store the three filtered rows for reuse.'},
  {lane:'cached',node:'count',line:1,text:'count() = 3. Cached rows remain available after this action.'},
  {lane:'cached',node:'cache',line:2,text:'Second action: read the cached rows. Do not repeat the source read or filter.'},
  {lane:'cached',node:'sum',line:2,text:'sum(salary) = 225,000. Repeated upstream computation avoided.'},
] as const;
export function performanceSnapshot(step:number,cached:boolean){
  const current=performanceSteps[step];
  const active=current?.lane===(cached?'cached':'plain') ? current.node : null;
  return {active,line:active?current.line:-1,populated:cached&&step>=9,countReady:step>=(cached?10:2),sumReady:step>=(cached?12:5),reads:cached?(step>=7?1:0):(step>=3?2:step>=0?1:0),filters:cached?(step>=8?1:0):(step>=4?2:step>=1?1:0)};
}
