"use client";

import type { CSSProperties, ReactNode } from 'react';
import type { PythonStory } from '@/lib/python-stories';

function Card({x,y,w=150,h=48,label,kind='input',index=0}:{x:number;y:number;w?:number;h?:number;label:string;kind?:string;index?:number}){
 return <g transform={`translate(${x} ${y})`}><g className={`py-g-card ${kind}`} style={{'--record':index} as CSSProperties}><rect width={w} height={h} rx="12"/><text x={w/2} y={h/2+7} textAnchor="middle">{label}</text></g></g>;
}
function Route({d,recovery=false}:{d:string;recovery?:boolean}){return <path d={d} className={`py-g-route ${recovery?'recovery':''}`}/>;}
function Heading({x,y,children}:{x:number;y:number;children:ReactNode}){return <text x={x} y={y} textAnchor="middle" className="py-g-label">{children}</text>;}

export function PythonStoryGraphics({id,story,scene}:{id:string;story:PythonStory;scene:number}){
 let picture:ReactNode;
 if(id==='py-data-structures')picture=<>
   <Heading x={115} y={30}>LIST · ordered records</Heading><Card x={25} y={53} w={180} label="(1, 100)"/><Card x={25} y={120} w={180} label="(2, 50)" index={1}/>
   <Route d="M215 77 C280 77 275 83 330 83"/><Route d="M215 144 C280 144 275 145 330 145"/>
   <g className="py-g-index"><rect x={325} y={48} width={290} height={136} rx={18}/><text x={350} y={91}>1</text><text x={395} y={91}>→</text><text x={530} y={91}>100</text><path d="M346 112 H590"/><text x={350} y={153}>2</text><text x={395} y={153}>→</text><text x={530} y={153}>50</text></g>
   <Heading x={470} y={30}>DICT · look up by key</Heading><Heading x={320} y={220}>by_id[2] finds 50 directly</Heading>
 </>;
 else if(id==='py-functions-modules')picture=<>
   <Heading x={100} y={30}>Different inputs</Heading><Card x={20} y={56} w={160} label={'"100"'}/><Card x={20} y={132} w={160} label={'"50"'} index={1}/>
   <Route d="M190 80 C220 80 215 110 250 110"/><Route d="M190 155 C220 155 215 126 250 126"/>
   <g className="py-g-function"><rect x={250} y={60} width={180} height={120} rx={24}/><text x={340} y={104} textAnchor="middle">clean(raw)</text><text x={340} y={145} textAnchor="middle">return int(raw)</text></g>
   <Route d="M435 109 C460 109 465 80 490 80"/><Route d="M435 127 C460 127 465 155 490 155"/><Card x={490} y={56} w={130} label="100" kind="output"/><Card x={490} y={132} w={130} label="50" kind="output" index={1}/>
   <Heading x={320} y={220}>One function · reused for each value</Heading>
 </>;
 else if(id==='py-files-formats')picture=<>
   <Heading x={105} y={30}>File contents · text</Heading><g className="py-g-document"><path d="M35 50 H146 L176 80 V185 H35 Z"/><path d="M146 50 V80 H176"/><text x={104} y={111} textAnchor="middle">{'{"amount":'}</text><text x={104} y={144} textAnchor="middle">{'100}'}</text></g>
   <Route d="M185 119 H260"/><g className="py-g-function"><rect x={260} y={75} width={170} height={87} rx={18}/><text x={345} y={112} textAnchor="middle">json.loads</text><text x={345} y={143} textAnchor="middle" className="py-g-label">parse the text</text></g><Route d="M437 119 H487"/>
   <Heading x={555} y={30}>Python dict</Heading><Card x={485} y={92} w={135} h={60} label="100 · int" kind="output"/><Heading x={320} y={220}>Text becomes a typed Python value</Heading>
 </>;
 else if(id==='py-error-handling')picture=<>
   <Card x={15} y={47} w={145} label={'"100"'}/><Card x={15} y={135} w={145} label={'"bad"'} index={1}/><Route d="M166 70 H237"/><Route d="M166 159 C208 159 199 106 237 106"/>
   <g className="py-g-function"><rect x={240} y={45} width={160} height={130} rx={22}/><text x={320} y={96} textAnchor="middle">try int(x)</text><text x={320} y={137} textAnchor="middle" className="py-g-label">ValueError?</text></g>
   <Route d="M405 78 H470"/><Route d="M405 133 C447 133 426 170 470 170" recovery/>
   <Card x={477} y={51} w={145} label="100 · valid" kind="output"/><Card x={477} y={146} w={145} label="None" kind="recovery" index={1}/><Heading x={550} y={132}>recovery path</Heading><Heading x={320} y={225}>Keep good data · identify rejected values</Heading>
 </>;
 else if(id==='py-pandas-basics')picture=<>
   <Heading x={125} y={28}>DataFrame</Heading><g className="py-g-table"><rect x={30} y={47} width={190} height={136} rx={13}/><path d="M30 92 H220 M30 137 H220"/><text x={125} y={78} textAnchor="middle">amount</text><text x={125} y={124} textAnchor="middle">100</text><text x={125} y={167} textAnchor="middle">50</text></g>
   <Route d="M225 116 H288"/><g className="py-g-function"><rect x={291} y={68} width={150} height={96} rx={20}/><text x={366} y={108} textAnchor="middle">sum()</text><text x={366} y={141} textAnchor="middle" className="py-g-label">whole column</text></g><Route d="M447 116 H493"/><Card x={495} y={90} w={123} h={60} label="150" kind="output"/>
   <Heading x={320} y={220}>100 + 50 · one column operation</Heading>
 </>;
 else if(id==='py-hands-on-task')picture=<>
   <Heading x={95} y={28}>Incoming orders</Heading><Card x={15} y={45} w={160} h={42} label="(1, 100)"/><Card x={15} y={97} w={160} h={42} label="(1, 100)" kind="duplicate" index={1}/><Card x={15} y={149} w={160} h={42} label="(2, 50)" index={2}/>
   <Route d="M180 67 C230 67 220 100 265 100"/><Route d="M180 171 C230 171 220 135 265 135"/><g className="py-g-function"><rect x={265} y={65} width={160} height={111} rx={20}/><text x={345} y={107} textAnchor="middle">ID → amount</text><text x={345} y={147} textAnchor="middle" className="py-g-label">one per key</text></g><Route d="M432 116 H488"/><Card x={491} y={86} w={132} h={60} label="150" kind="output"/>
   <Heading x={320} y={224}>Remove the repeat before summing</Heading>
 </>;
 else if(id==='py-interview-questions')picture=<>
   <Heading x={125} y={29}>Generator · suspended</Heading><g className="py-g-function"><rect x={25} y={63} width={190} height={109} rx={22}/><text x={120} y={106} textAnchor="middle">yield 100</text><text x={120} y={148} textAnchor="middle">yield 50</text></g>
   <Route d="M223 118 H325"/><Card x={338} y={87} w={120} h={58} label="100" kind="yield-first"/><Card x={338} y={87} w={120} h={58} label="50" kind="yield-second"/><Route d="M463 118 H515"/><Card x={514} y={87} w={111} h={58} label="150" kind="output"/>
   <Heading x={395} y={49}>one at a time</Heading><Heading x={568} y={49}>sum</Heading><Heading x={320} y={220}>Request → yield → pause → request again</Heading>
 </>;
 else if(id==='py-quiz')picture=<>
   <Heading x={320} y={29}>range(3) · stop before 3</Heading><Route d="M70 112 H575"/>{['0','1','2','3'].map((n,i)=><g key={n}><Card x={40+i*155} y={83} w={95} h={60} label={n} kind={i===3?'excluded':'loop'} index={i}/>{i<3&&<Heading x={88+i*155} y={176}>visit {i+1}</Heading>}</g>)}<Heading x={320} y={223}>Three iterations · indices 0, 1 and 2</Heading>
 </>;
 else if(id==='py-summary')picture=<>
   <Card x={20} y={48} w={145} label="100"/><Card x={20} y={132} w={145} label="50" index={1}/><Route d="M172 74 C210 74 210 112 247 112"/><Route d="M172 158 C210 158 210 129 247 129"/>
   <g className="py-g-function"><rect x={250} y={52} width={188} height={129} rx={22}/><text x={344} y={94} textAnchor="middle">✓ nonnegative</text><text x={344} y={138} textAnchor="middle">✓ total = 150</text></g><Route d="M444 117 H485"/><Card x={485} y={85} w={140} h={60} label="validated" kind="output"/><Heading x={320} y={220}>Known input → explicit checks → trusted output</Heading>
 </>;
 else picture=<>
   <Heading x={100} y={30}>Raw strings</Heading><Card x={20} y={56} w={155} label={'"100"'}/><Card x={20} y={134} w={155} label={'"50"'} index={1}/><Route d="M182 80 H251"/><Route d="M182 158 H251"/>
   <g className="py-g-function"><rect x={255} y={56} width={135} height={126} rx={22}/><text x={323} y={106} textAnchor="middle">int(x)</text><text x={323} y={151} textAnchor="middle" className="py-g-label">100 · 50</text></g><Route d="M396 120 H464"/><Card x={469} y={87} w={151} h={60} label="sum → 150" kind="output"/><Heading x={320} y={220}>Convert text first · then add numbers</Heading>
 </>;
 const compact:Record<string,[string,string]>={
  'py-introduction':['100 · 50','150'], 'py-data-structures':['(2, 50)','2 → 50'],
  'py-functions-modules':['"50"','50'], 'py-files-formats':['JSON text','dict'],
  'py-error-handling':['"bad"','None'], 'py-pandas-basics':['100 + 50','150'],
  'py-hands-on-task':['1, 1, 2','1, 2'], 'py-interview-questions':['next()','yield 50'],
  'py-quiz':['range(3)','0, 1, 2'], 'py-summary':['100, 50','✓ valid'],
 };
 const [before,after]=compact[id];
 return <>
 <svg className={`py-topic-graphic py-graphic-desktop graphic-${id} phase-${scene}`} viewBox="0 0 640 245" role="img" aria-label={`${story.station}: ${story.input.join(', ')} becomes ${story.output.join(', ')}`}><defs><linearGradient id={`py-graphic-bg-${id}`} x2="1" y2="1"><stop stopColor="white"/><stop offset="1" stopColor={story.color} stopOpacity=".1"/></linearGradient></defs><rect x="1" y="1" width="638" height="243" rx="22" fill={`url(#py-graphic-bg-${id})`}/>{picture}</svg>
 <svg className={`py-topic-graphic py-graphic-compact graphic-${id}`} viewBox="0 0 340 175" role="img" aria-label={`${before} → ${story.station} → ${after}`}><rect x="1" y="1" width="338" height="173" rx="18" fill="white"/><Heading x={170} y={30}>{story.station}</Heading><Card x={14} y={57} w={125} h={60} label={before}/><Route d="M145 87 H191"/><Card x={200} y={57} w={125} h={60} label={after} kind={id==='py-error-handling'?'recovery':'output'}/><Heading x={170} y={151}>{id==='py-error-handling'?'Specific error → recovery':'Input → operation → result'}</Heading></svg>
 </>;
}



