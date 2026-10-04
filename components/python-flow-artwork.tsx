"use client";
/** An illustration of the existing simulator, not an execution trace. */
export function PythonFlowArtwork({kind,stage,active,values=[]}:{kind:'files'|'pandas';stage:number;active:boolean;values?:number[]}){
 const colors=['#2998e8','#9161e8','#e98b35','#23ad84'];
 const color=colors[stage];
 const file=(x:number,label:string,index:number)=><g key={label} className="py-art-file" style={{animationDelay:`${index*180}ms`}} transform={`translate(${x},10)`}><path d="M0 0 H39 L51 12 V51 H0Z" fill="#fff" stroke={color} strokeWidth="2"/><path d="M39 0 V12 H51" fill="none" stroke={color}/><path className="py-art-ink" d="M9 16 H30 M9 23 H39 M9 30 H34" fill="none" stroke={color} strokeWidth="2"/><text x="25" y="44" textAnchor="middle" fontSize="10" fill={color}>{label}</text></g>;
 return <svg className={`py-flow-artwork ${active?'is-active':''}`} viewBox="0 0 280 76" aria-hidden="true">
 <rect x="1" y="1" width="278" height="74" rx="13" fill={color} opacity=".055"/>
 {kind==='files'?stage===1||stage===3?<>{['CSV','JSON','PARQUET'].map((label,i)=>file(28+i*84,label,i))}{stage===3&&<path className="py-art-check" d="M53 63 l5 5 9-10 M137 63 l5 5 9-10 M221 63 l5 5 9-10" fill="none" stroke={color} strokeWidth="3"/>}</>:<>
 {stage===2?file(18,'READ',0):[0,1,2].map(i=><g key={i} className="py-art-record" style={{animationDelay:`${i*180}ms`}}><rect x="15" y={12+i*19} width="75" height="14" rx="4" fill="#fff" stroke={color}/><path d={`M25 ${19+i*19} H40 M48 ${19+i*19} H77`} stroke={color} strokeWidth="2"/></g>)}
 <path className="py-art-route" d="M99 38 H173" stroke={color} fill="none" strokeWidth="3" strokeDasharray="5 6"/>
 <rect x="182" y="13" width="77" height="50" rx="9" fill="#fff" stroke={color} strokeWidth="2"/><path d="M191 28 H249 M191 39 H249 M191 50 H249 M211 20 V57 M231 20 V57" stroke={color} opacity=".6"/>
 </>:stage===2?<>
 {['IN','US'].map((label,i)=><g key={label} className="py-art-record" style={{animationDelay:`${i*250}ms`}}><rect x={20+i*130} y="13" width="110" height="50" rx="12" fill="#fff" stroke={color} strokeWidth="2"/><text x={75+i*130} y="33" textAnchor="middle" fill={color} fontSize="13">{label}</text><text x={75+i*130} y="53" textAnchor="middle" fill={color} fontSize="14">{values[i]??0}</text></g>)}
 </>:<>
 {(values.length?values:[120,80,45,60]).slice(0,4).map((value,i)=><g key={i} className={`py-art-record ${stage===1&&value<=50?'is-excluded':''}`} style={{animationDelay:`${i*160}ms`}}><rect x={14+i*65} y="14" width="55" height="45" rx="9" fill="#fff" stroke={color} strokeWidth="2"/><text x={41+i*65} y="42" textAnchor="middle" fill={color} fontSize="16">{value}</text>{stage===1&&value<=50&&<path d={`M${20+i*65} 20 l42 33`} stroke="#e27087" strokeWidth="2"/>}</g>)}
 {stage===3&&<text x="140" y="71" textAnchor="middle" fill={color} fontSize="10">country → sum(amount)</text>}
 </>}
 </svg>;
}
