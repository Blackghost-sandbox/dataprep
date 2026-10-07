"use client";
import {useEffect,useRef,type MouseEvent} from "react";
type Mode="framework"|"capacity"|"ingestion"|"storage"|"batch"|"recovery"|"scaling"|"serving"|"operations"|"journey";
const routes:Record<Mode,string[]>={framework:[".sdf-users,.sdf-lb,.sdf-app",".sdf-app,.sdf-cache",".sdf-app,.sdf-db"],capacity:[".sdse-clients,.sdse-lb,.sdse-app",".sdse-app,.sdse-cache",".sdse-app,.sdse-db"],ingestion:[".sdi-pipe-grid .sdi-stage"],storage:[".sdsm-architecture-grid .sdsm-stage"],batch:[".sdbs-arch-row.batch .sdbs-chain-fragment article",".sdbs-arch-row.streaming .sdbs-chain-fragment article"],recovery:[".sdcr-pipeline-flow > .source, .sdcr-pipeline-flow > .ingest, .sdcr-pipeline-flow > .process, .sdcr-pipeline-flow > .sink"],scaling:[".sdsb-pipeline-grid > article, .sdsb-pipeline-grid > section, .sdsb-pipeline-grid > div:not(.sdsb-arrow)"],serving:[".sdsc-arch-grid .sdsc-column"],operations:[".sdoc-pipeline-grid .sdoc-stage"],journey:[".sde2e-arch-flow .sde2e-arch-node"]};
const principles:Record<Mode,string>={framework:"Define requirements → trace data → test trade-offs.",capacity:"Requests consume capacity; peak demand and headroom guide sizing.",ingestion:"Capture records → move them → persist the landing data.",storage:"Raw records remain stored; models organise data for distinct readers.",batch:"Scheduled batches collect work; streaming handles arriving events incrementally.",recovery:"Checkpoint progress; retries need safe writes to avoid duplicate effects.",scaling:"Uneven work or a slower stage creates backlog; more workers alone may not fix it.",serving:"Route each access pattern to a suitable representation and consumer.",operations:"Check access at boundaries and collect evidence of behaviour and resource usage.",journey:"Follow records from source to serving; verify correctness at each boundary."};
function svgNode<K extends keyof SVGElementTagNameMap>(tag:K,attrs:Record<string,string>){const node=document.createElementNS("http://www.w3.org/2000/svg",tag);Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,value));return node;}
export function useSystemDesignMotion(mode:Mode){
 const root=useRef<HTMLElement|null>(null),cleanup=useRef<(()=>void)|null>(null),delay=useRef<ReturnType<typeof setTimeout>|null>(null);
 const clear=()=>{if(delay.current)clearTimeout(delay.current);cleanup.current?.();cleanup.current=null;};
 useEffect(()=>clear,[]);
 const capture=(event:MouseEvent<HTMLElement>)=>{const button=(event.target as HTMLElement).closest("button");if(!button||button.disabled)return;const label=button.textContent?.trim()??"";
  if(/reset|scenario/i.test(label)){clear();return;}
  if(!/^(run|calculate|simulate)/i.test(label))return;
  clear();delay.current=setTimeout(()=>{if(root.current)cleanup.current=animate(root.current,mode);},500);
 };
 return {ref:(node:HTMLElement|null)=>{root.current=node;},"data-system-motion":mode,onClickCapture:capture,onChangeCapture:clear};
}
function animate(root:HTMLElement,mode:Mode){
 const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
 const bounds=root.getBoundingClientRect(),scale=root.offsetWidth/bounds.width;
 const art=svgNode("svg",{class:"system-motion-art",viewBox:`0 0 ${root.offsetWidth} ${root.offsetHeight}`,"aria-hidden":"true"});root.appendChild(art);
 const nodes:HTMLElement[]=[];
 const hops=routes[mode].flatMap((selector,lane)=>{
  const cards=Array.from(root.querySelectorAll<HTMLElement>(selector));nodes.push(...cards);
  return cards.slice(1).map((target,index)=>{
   const source=cards[index],a=source.getBoundingClientRect(),b=target.getBoundingClientRect();
   const x1=(a.right-bounds.left)*scale,y1=(a.top+a.height*.45-bounds.top)*scale,x2=(b.left-bounds.left)*scale,y2=(b.top+b.height*.45-bounds.top)*scale;
   const path=svgNode("path",{d:`M ${x1} ${y1} C ${(x1+x2)/2} ${y1} ${(x1+x2)/2} ${y2} ${x2} ${y2}`,class:"system-motion-route"});art.appendChild(path);const length=path.getTotalLength();
   const packets=Array.from({length:mode==="capacity"||mode==="scaling"?6:3},(_,i)=>{
    const token=svgNode("g",{class:`system-motion-token token-${mode}`,opacity:"0"});
    token.appendChild(svgNode("rect",{x:"-14",y:"-11",width:"28",height:"22",rx:mode==="capacity"?"11":"4"}));
    const symbol=mode==="operations"?"M -7 0 L -2 5 L 8 -5":mode==="recovery"?"M -7 -4 H 7 V 6 H -7 Z M -3 -4 V 1 H 3":mode==="serving"?"M -6 -5 H 4 M -6 0 H 7 M -6 5 H 1":"M -7 -4 H 7 M -7 1 H 3 M -7 6 H 7";
    token.appendChild(svgNode("path",{d:symbol}));art.appendChild(token);return {token,i};
   });
   const note=document.createElement("div");note.className="system-motion-inside";note.setAttribute("role","status");
   const title=document.createElement("strong");title.textContent=target.querySelector("header,h3,strong,b")?.textContent?.trim()??"Next stage";
   const body=document.createElement("span");const heading=title.textContent?.toLowerCase()??"";
   const operation=/load.?balanc/.test(heading)?"Distribute incoming requests across application servers.":/cache/.test(heading)?"Look up hot data in memory; a miss still needs the backing store.":/database/.test(heading)?"Read or write persistent application records.":/landing|raw|storage/.test(heading)?"Persist arriving records; transformations run separately.":/partition/.test(heading)?"Assign records to partitions. Uneven keys can concentrate work on one partition.":/process|applicat/.test(heading)?"Execute the configured processing logic on arriving requests or records.":/ingest|capture/.test(heading)?"Capture arriving data and preserve progress for downstream delivery.":/consumer|dashboard|serving|analy/.test(heading)?"Expose the processed representation to its intended reader.":principles[mode];
   body.textContent=operation;
   const graphic=document.createElement("div");graphic.className=`system-motion-model model-${mode}${mode==="batch"&&lane===1?" model-live-stream":""}`;
   for(let i=0;i<5;i++){const cell=document.createElement("i");cell.style.setProperty("--piece",String(i));graphic.appendChild(cell);}
   note.appendChild(title);note.appendChild(graphic);note.appendChild(body);const tag=document.createElement("small");tag.textContent="Flow illustration · inspect calculated results below";note.appendChild(tag);
   return {path,length,packets,target,note,index:index+((mode==="framework"||mode==="capacity")&&lane>0?2:0),lane,shown:false};
  });
 });
 let raf=0,start:number|undefined;
 const frame=(now:number)=>{start??=now;const elapsed=now-start;
  for(const hop of hops){const local=elapsed-hop.index*7400;
   for(const {token,i} of hop.packets){const batch=mode==="batch"&&hop.lane===0;const t=(local-300-(batch?0:i*160))/1500;
    token.setAttribute("opacity",!reduced&&t>=0&&t<=1?"1":"0");
    if(t>=0&&t<=1){const p=hop.path.getPointAtLength(t*hop.length);const lane=(i-(hop.packets.length-1)/2)*8*Math.sin(t*Math.PI);token.setAttribute("transform",`translate(${p.x} ${p.y+lane})`);}
   }
   const arrival=1800+(hop.packets.length-1)*160;
   if(local>=arrival&&!hop.shown){hop.shown=true;hop.target.classList.add("system-motion-receiving");hop.target.appendChild(hop.note);}
   if(local>=6900){hop.note.remove();hop.target.classList.remove("system-motion-receiving");}
  }
  if(elapsed<(Math.max(0,...hops.map(h=>h.index))+1)*7400)raf=requestAnimationFrame(frame);else art.remove();
 };if(hops.length)raf=requestAnimationFrame(frame);else art.remove();
 return ()=>{cancelAnimationFrame(raf);art.remove();hops.forEach(h=>h.note.remove());nodes.forEach(node=>node.classList.remove("system-motion-receiving"));};
}
