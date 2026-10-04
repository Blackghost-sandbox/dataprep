"use client";
import type {CSSProperties} from 'react';
type Row={country:string;amount:number};
/** Record movement illustrates the simulator's actual filtering/grouping rules. */
export function PythonRecordExecution({rows,stage,active}:{rows:readonly Row[];stage:number;active:boolean}){
 const countries=[...new Set(rows.map(r=>r.country))];
 const groups=countries.map(country=>({country,rows:rows.filter(r=>r.country===country)}));
 const chip=(label:string,x:number,y:number,color:string)=><g transform={`translate(${x},${y})`}><rect width="73" height="22" rx="6" fill="white" stroke={color} strokeWidth="1.7"/><text x="36" y="15" textAnchor="middle" fill={color} fontSize="12">{label}</text></g>;
 const motion=(label:string,x:number,y:number,dx:number,dy:number,i:number,color:string)=><g key={i} transform={`translate(${x},${y})`}><g className="py-moving-record" style={{'--dx':`${dx}px`,'--dy':`${dy}px`,animationDelay:`${i*650}ms`} as CSSProperties}>{chip(label,0,0,color)}</g></g>;
 return <svg className={`py-record-execution ${active?'is-active':''}`} viewBox="0 0 300 150" role="img" aria-label={stage===1?'Each record is tested against amount greater than 50':stage===2?'Kept records move into country groups':stage===3?'Group amounts are added to produce country totals':'Four source records enter the DataFrame'}>
 <rect width="300" height="150" rx="12" fill={stage===1?'#f6f0ff':stage===2?'#eafaf1':stage===3?'#fff4e5':'#edf7ff'}/>
 {stage<2?<>
 <text x="14" y="15" fontSize="11" fill="#596b85">Source records</text><text x="213" y="15" fontSize="11" fill="#596b85">{stage===1?'Pass / fail':'DataFrame'}</text>
 {rows.map((row,i)=>{const y=23+i*29,pass=stage===0||row.amount>50;return <g key={i}>
 <path d={`M90 ${y+11} H208`} stroke={pass?'#72b6a1':'#e797a6'} strokeDasharray="4 4"/>
 {chip(`${row.country} ${row.amount}`,12,y,'#5489bb')}
 {chip(stage===1?`${row.amount} ${pass?'✓':'×'}`:`${row.country} ${row.amount}`,214,y,pass?'#20936e':'#c94a67')}
 {motion(`${row.country} ${row.amount}`,12,y,202,0,i,pass?'#7b55cc':'#c94a67')}
 </g>;})}
 {stage===1&&<text x="149" y="15" textAnchor="middle" fontSize="12" fill="#7950ba">amount &gt; 50</text>}
 </>:stage===2?<>
 {groups.map((group,i)=><g key={group.country}><rect x="213" y={15+i*67} width="77" height="55" rx="9" fill="white" stroke={i?'#8262ce':'#259779'}/><text x="251" y={33+i*67} textAnchor="middle" fontSize="12" fill="#526783">{group.country} group</text><text x="251" y={53+i*67} textAnchor="middle" fontSize="12" fill="#526783">{group.rows.map(r=>r.amount).join(', ')}</text></g>)}
 {rows.map((row,i)=>{const y=18+i*35,target=24+countries.indexOf(row.country)*67;return <g key={i}><path d={`M87 ${y+11} C143 ${y+11} 159 ${target+11} 211 ${target+11}`} fill="none" stroke="#83bea7" strokeDasharray="4 4"/>{chip(`${row.country} ${row.amount}`,10,y,'#427e9e')}{motion(`${row.country} ${row.amount}`,10,y,205,target-y,i,'#279a7c')}</g>;})}
 </>:<>
 {groups.map((group,i)=>{const y=23+i*63,total=group.rows.reduce((sum,r)=>sum+r.amount,0);return <g key={group.country}><text x="15" y={y-6} fontSize="12" fill="#967144">{group.country}: {group.rows.map(r=>r.amount).join(' + ')} = {total}</text><path d={`M88 ${y+11} H207`} stroke="#dab780" strokeDasharray="4 4"/>{chip(group.rows.map(r=>r.amount).join(' + '),12,y,'#b5803b')}{chip(`${group.country} ${total}`,213,y,'#21936e')}{motion(String(total),12,y,201,0,i,'#bd842d')}</g>;})}
 </>}
 </svg>;
}



