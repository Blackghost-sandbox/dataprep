"use client";
import {useEffect,useRef,useState,type MouseEvent} from "react";

// Local explanatory accents only. Each cloud lesson continues to calculate its own outcomes.
export function useCloudMotion(selector:string){
 const root=useRef<HTMLElement|null>(null),timers=useRef<ReturnType<typeof setTimeout>[]>([]);
 const flowCleanup=useRef<(()=>void)|null>(null);
 const [cycle,setCycle]=useState(0);
 const removeCaptions=()=>root.current?.querySelectorAll(".cloud-arrival-note").forEach(el=>el.remove());
 const clear=()=>{root.current?.removeAttribute("data-cloud-reading");root.current?.querySelectorAll(".cloud-card-arrival").forEach(card=>card.classList.remove("cloud-card-arrival"));root.current?.dispatchEvent(new Event("cloud-guide-reset"));flowCleanup.current?.();flowCleanup.current=null;removeCaptions();timers.current.forEach(clearTimeout);timers.current=[];root.current?.querySelectorAll("[data-cloud-stage]").forEach(el=>{el.removeAttribute("data-cloud-stage");el.classList.remove("cloud-card-arrival");});};
 useEffect(()=>()=>{flowCleanup.current?.();timers.current.forEach(clearTimeout);},[]);
 useEffect(()=>{if(!cycle)return;
  const cards=Array.from(root.current?.querySelectorAll<HTMLElement>(selector)??[]);
  let cancelled=false;
  const wait=(ms:number)=>new Promise<void>(resolve=>timers.current.push(setTimeout(resolve,ms)));
  const showArrival=async(index:number)=>{
   const slot=cards[index+1];if(cancelled||!root.current||!slot)return;
   const card=slot.matches(".cloud-pipeline-slot")?slot.querySelector<HTMLElement>(".cloud-stage-card")??slot:slot;
   {
    const note=document.createElement("div");note.className="cloud-arrival-note";note.setAttribute("role","status");
    const colours=getComputedStyle(card);note.style.setProperty("--arrival-bg",colours.backgroundColor);note.style.setProperty("--arrival-accent",colours.borderTopColor);
    const scene=arrivalGraphic(root.current!,card,index+1);note.appendChild(scene);
    const copy=document.createElement("div");copy.className="cloud-arrival-copy";note.appendChild(copy);
    const heading=document.createElement("strong");heading.className="cloud-arrival-title";heading.textContent=card.querySelector("h3,.cloud-stage-heading,strong")?.textContent?.trim()??"Inside this service";copy.appendChild(heading);
    const explanation=document.createElement("p");explanation.textContent=arrivalAction(root.current!,card,index+1);copy.appendChild(explanation);
    const detail=document.createElement("small");detail.className="cloud-arrival-detail";detail.textContent=arrivalDetail(root.current!,card);copy.appendChild(detail);
    card.appendChild(note);
    const bounds=card.getBoundingClientRect(),scale=bounds.width/card.offsetWidth;
    const width=Math.min(480,(window.innerWidth-64)/(scale*1.24));
    note.style.width=`${width}px`;
    const centre=bounds.left+bounds.width/2;
    const half=width*scale*1.24/2;
    const shift=Math.max(24+half-centre,Math.min(0,window.innerWidth-24-half-centre));
    note.style.left=`${(card.offsetWidth-width)/2+shift/(scale*1.24)}px`;
    note.style.setProperty("--arrival-origin-x",`${card.offsetWidth/2-parseFloat(note.style.left)}px`);
    note.style.setProperty("--arrival-origin-y",`${note.offsetHeight-card.offsetHeight/2+8}px`);
    note.style.setProperty("--arrival-start-x",String(Math.min(1,card.offsetWidth/width)));
    note.style.setProperty("--arrival-start-y",String(Math.min(1,card.offsetHeight/note.offsetHeight)));
    card.classList.add("cloud-card-arrival");
    root.current.setAttribute("data-cloud-reading","");
    await wait(1250);if(cancelled)return;
    const animations=card.getAnimations({subtree:true});animations.forEach(animation=>animation.pause());
    let readingRemaining=6000;
    while(readingRemaining>0){await wait(100);if(cancelled)return;if(!note.matches(":hover")&&!note.contains(document.activeElement)&&document.visibilityState==="visible")readingRemaining-=100;}
    if(cancelled)return;
    animations.forEach(animation=>{animation.currentTime=3950;animation.play();});
    await wait(1250);if(cancelled)return;
    note.remove();card.classList.remove("cloud-card-arrival");root.current?.removeAttribute("data-cloud-reading");
   }
  };
  if(root.current){
   if(!matchMedia("(prefers-reduced-motion: reduce)").matches)flowCleanup.current=drawCloudFlow(root.current,cards,index=>{void showArrival(index);});
   else void (async()=>{for(let index=0;index<cards.length-1;index++){await wait(500);if(cancelled)return;await showArrival(index);}})();
  }
  return ()=>{cancelled=true;root.current?.removeAttribute("data-cloud-reading");root.current?.querySelectorAll(".cloud-card-arrival").forEach(card=>card.classList.remove("cloud-card-arrival"));flowCleanup.current?.();flowCleanup.current=null;removeCaptions();timers.current.forEach(clearTimeout);cards.forEach(card=>card.removeAttribute("data-cloud-stage"));};
 },[cycle,selector]);
 const capture=(event:MouseEvent<HTMLElement>)=>{const button=(event.target as HTMLElement).closest<HTMLButtonElement>("button");if(!button||button.disabled)return;const label=button.textContent?.trim()||"";if(/reset|clear|pause|scenario/i.test(label)){clear();return;}if(/^(run|start|upload|execute|trigger)/i.test(label)){clear();root.current?.dispatchEvent(new Event("cloud-guide-run"));setCycle(value=>value+1);}};
 return {ref:(node:HTMLElement|null)=>{root.current=node;},"data-cloud-motion":"",onClickCapture:capture,onChangeCapture:clear};
}

function arrivalGraphic(root:HTMLElement,card:HTMLElement,index:number){
 const scene=document.createElement("div");scene.className="cloud-arrival-graphic";scene.setAttribute("aria-hidden","true");
 const title=card.querySelector("h3,strong,.cloud-stage-heading")?.textContent?.toLowerCase()??"";
 const storage=root.matches(".os-lab")||/stor|lake|load/.test(title);
 const security=root.matches(".sec-lab"),stream=root.matches(".sm-lab"),task=root.matches(".oi-lab");
 const mode=security?"security":task?"task":stream?"stream":storage?"storage":"compute";
 scene.classList.add(`scene-${mode}`);
 const drawing=element("svg",{viewBox:"0 0 300 120",class:"cloud-arrival-machine"});
 const shell=element("g",{class:"cloud-arrival-shell"});
 shell.appendChild(element("path",{d:"M 107 28 L 126 15 H 202 L 184 28 Z",class:"machine-top"}));
 shell.appendChild(element("path",{d:"M 184 28 L 202 15 V 87 L 184 102 Z",class:"machine-side"}));
 shell.appendChild(element("rect",{x:"107",y:"28",width:"77",height:"74",rx:"8",class:"machine-front"}));
 drawing.appendChild(shell);
 if(storage){
  for(let i=0;i<3;i++){const tray=element("rect",{x:"118",y:String(44+i*17),width:"54",height:"10",rx:"3",class:"machine-tray"});drawing.appendChild(tray);}
 }else if(security){drawing.appendChild(element("path",{d:"M 145 43 L 166 50 V 66 Q 165 80 145 89 Q 125 80 124 66 V 50 Z",class:"machine-shield"}));drawing.appendChild(element("path",{d:"M 135 65 L 142 72 L 156 57",class:"machine-check"}));}
 else if(task){for(let i=0;i<3;i++){drawing.appendChild(element("circle",{cx:String(123+i*22),cy:"64",r:"7",class:"machine-worker"}));}drawing.appendChild(element("path",{d:"M 130 64 H 160",class:"machine-link"}));}
 else{for(let i=0;i<3;i++){drawing.appendChild(element("rect",{x:"119",y:String(42+i*17),width:"52",height:"11",rx:"3",class:"machine-worker"}));for(let j=0;j<4;j++)drawing.appendChild(element("rect",{x:String(124+j*11),y:String(45+i*17),width:"6",height:"5",rx:"1",class:"machine-bit"}));}}
 for(let i=0;i<3;i++){
  const input=element("g",{class:"machine-input",style:`animation-delay:${i*180}ms`});
  input.appendChild(element("rect",{x:"33",y:String(43+i*12),width:"24",height:"29",rx:"4",class:"machine-file"}));input.appendChild(element("path",{d:`M 39 ${51+i*12} H 51 M 39 ${57+i*12} H 49`,class:"machine-file-lines"}));drawing.appendChild(input);
  if(!storage){const output=element("g",{class:"machine-output",style:`animation-delay:${i*180}ms`});output.appendChild(element("rect",{x:"223",y:String(42+i*14),width:"29",height:"10",rx:"3",class:"machine-result"}));drawing.appendChild(output);}
 }
 const label=element("text",{x:"150",y:"116","text-anchor":"middle",class:"machine-label"});label.textContent=storage?"STORE OBJECTS":security?"CHECK ACCESS":task?"RUN DEPENDENCIES":stream?(index===1?"APPEND TO LOG":"READ EVENTS"):"PROCESS RECORDS";drawing.appendChild(label);scene.appendChild(drawing);return scene;
}

function arrivalDetail(root:HTMLElement,card:HTMLElement){
 const title=card.querySelector("h3,strong,.cloud-stage-heading")?.textContent?.toLowerCase()??"";
 if(root.matches(".sec-lab"))return "The identity, requested action and target resource are checked against permissions. Authentication alone does not grant access.";
 if(root.matches(".oi-lab"))return "The scheduler checks dependencies and invokes task code. A failed prerequisite can prevent downstream work from starting.";
 if(root.matches(".sm-lab"))return "Events occupy offsets within partitions. Consumers track their reading positions; reading normally leaves the retained events in the log.";
 if(root.matches(".lh-lab"))return "Table metadata selects which files belong to the snapshot. The query engine reads that selection rather than every object in storage.";
 if(root.matches(".no-lab"))return "Routing determines connectivity; permissions determine authorisation. Metrics, logs and traces provide evidence of the request’s behaviour.";
 if(root.matches(".ca-lab"))return "Storage, processing, requests and transfers contribute differently to cost. Review workload usage before changing capacity or retention.";
 if(root.matches(".os-lab")||/stor|lake|load/.test(title))return "An object is file content plus metadata, identified by a key inside a bucket. Storing or reading a file does not automatically clean its records.";
 if(root.matches(".ms-lab"))return "The driver coordinates partition tasks on workers. Workers process their assigned data, then the job combines or writes the output partitions.";
 if(root.matches(".dw-lab"))return "Query compute scans the stored tables and applies SQL operations such as filtering or aggregation. A read-only query leaves source rows unchanged.";
 return "Compute provides CPU and memory to execute your code. The configured transformation determines how input records become output; storage and processing have separate roles.";
}

function arrivalAction(root:HTMLElement,card:HTMLElement,index:number){
 const title=card.querySelector("h3,strong,.cloud-stage-heading")?.textContent?.toLowerCase()??"";
 if(root.matches(".sec-lab"))return ["","Check the requested action against the policy.","Show the access decision for this request.","Record the request and decision in the audit log."][index]??"Evaluate the request using the configured permissions.";
 if(root.matches(".os-lab"))return ["","Store the uploaded file as an object with a key and metadata.","Organise object keys so readers can locate the data.","Read the stored files to produce the query result."][index]??"Read the stored object; the original remains in storage.";
 if(root.matches(".oi-lab"))return "Check prerequisites, then run this task. Its status shows whether the next task can start.";
 if(root.matches(".sm-lab"))return ["","Append events to partition logs at their offsets.","Consumers read events from their tracked positions.","Write the processed events to the configured destination."][index]??"Process the arriving events.";
 if(root.matches(".lh-lab"))return ["","Update table metadata to describe the data files.","Read the files selected by the table snapshot.","Return rows from the selected table version."][index]??"Use table metadata to locate the required files.";
 if(root.matches(".no-lab"))return ["","Check whether the configured route permits connectivity.","Handle the incoming request at the destination service.","Deliver the response to the consuming application.","Collect metrics, logs and traces from the request."][index]??"Observe the request as it crosses the service boundary.";
 if(root.matches(".ca-lab"))return "Account for this stage’s usage in the architecture cost estimate.";
 if(/stor|lake|load/.test(title))return "Persist arriving data so a separate processing or query engine can read it.";
 if(/result|output|analytic/.test(title))return "Return the processed rows to the downstream reader.";
 if(root.matches(".ms-lab"))return index===1?"Split input into partitions and assign processing tasks to workers.":index===2?"Track the job stages as worker tasks execute.":"Write the processed partitions to the output destination.";
 if(root.matches(".dw-lab"))return index===1?"Provide compute resources for analytical processing.":"Scan the stored table data and build the query result.";
 if(root.matches(".cc-lab"))return index===1?"Run the configured processing code on the selected compute resources.":"Write the transformed output to its destination.";
 return "Process the arriving records and pass the output to the next stage.";
}

function element<K extends keyof SVGElementTagNameMap>(tag:K,attrs:Record<string,string>){const el=document.createElementNS("http://www.w3.org/2000/svg",tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));return el;}
function drawCloudFlow(root:HTMLElement,cards:HTMLElement[],onArrival:(index:number)=>void){
 if(cards.length<2)return ()=>{};
 const bounds=root.getBoundingClientRect(),scale=root.offsetWidth/bounds.width;
 const svg=element("svg",{class:"cloud-flow-art",viewBox:`0 0 ${root.offsetWidth} ${root.offsetHeight}`,"aria-hidden":"true"});root.appendChild(svg);
 const hops=cards.slice(1).map((target,index)=>{
  const a=cards[index].getBoundingClientRect(),b=target.getBoundingClientRect();
  const horizontal=Math.abs(b.left-a.left)>Math.abs(b.top-a.top),forward=horizontal?b.left>a.left:b.top>a.top;
  const x1=((horizontal?(forward?a.right:a.left):a.left+a.width/2)-bounds.left)*scale,y1=((horizontal?a.top+a.height/2:(forward?a.bottom:a.top))-bounds.top)*scale,x2=((horizontal?(forward?b.left:b.right):b.left+b.width/2)-bounds.left)*scale,y2=((horizontal?b.top+b.height/2:(forward?b.top:b.bottom))-bounds.top)*scale;
  const d=horizontal?`M ${x1} ${y1} C ${(x1+x2)/2} ${y1} ${(x1+x2)/2} ${y2} ${x2} ${y2}`:`M ${x1} ${y1} C ${x1} ${(y1+y2)/2} ${x2} ${(y1+y2)/2} ${x2} ${y2}`;
  const path=element("path",{d,class:"cloud-transfer-path"});svg.appendChild(path);
  const length=path.getTotalLength();
  const packets=[0,1,2].map(()=>{
   const packet=element("g",{class:"cloud-transfer-payload",opacity:"0"});
   packet.appendChild(element("rect",{x:"-21",y:"-17",width:"42",height:"34",rx:"6"}));
   const security=root.matches(".sec-lab"),job=root.matches(".oi-lab");
   if(!security&&!job){
    const raw=element("g",{"data-cloud-raw":"",class:"cloud-morph-files"});
    [-1,0,1].forEach(sheet=>{const file=element("g",{transform:`translate(${sheet*5} ${Math.abs(sheet)*-5}) rotate(${sheet*8})`});
     file.appendChild(element("rect",{x:"-17",y:"-17",width:"34",height:"34",rx:"4",class:"cloud-morph-paper"}));
     file.appendChild(element("path",{d:"M -10 -7 H 9 M -10 0 H 5 M -10 7 H 9"}));raw.appendChild(file);
    });packet.appendChild(raw);
    const structured=index>0&&!root.matches(".os-lab");
    const grid=element("g",{"data-cloud-grid":"",opacity:structured?"1":"0",class:"cloud-morph-block"});
    grid.appendChild(element("path",{d:"M -20 -14 L -12 -22 L 28 -22 L 20 -14 Z",class:"cloud-morph-top"}));
    grid.appendChild(element("path",{d:"M 20 -14 L 28 -22 L 28 12 L 20 20 Z",class:"cloud-morph-side"}));
    grid.appendChild(element("rect",{x:"-20",y:"-14",width:"40",height:"34",rx:"3",class:"cloud-morph-front"}));
    for(let row=0;row<3;row++)for(let col=0;col<3;col++)grid.appendChild(element("rect",{x:String(-14+col*10),y:String(-8+row*9),width:"7",height:"5",rx:"1",class:"cloud-transfer-cell"}));
    packet.appendChild(grid);if(structured)raw.setAttribute("opacity","0");
   }else{const label=element("text",{x:"0",y:"4","text-anchor":"middle"});label.textContent=security?"IAM":"TASK";packet.appendChild(label);}
   const text=element("text",{x:"0",y:"29","text-anchor":"middle",class:"cloud-transfer-label"});text.textContent=security?"access request":job?"dependency":root.matches(".os-lab")?"stored objects":index===0?"input records":"downstream data";packet.appendChild(text);svg.appendChild(packet);return packet;
  });return {path,length,packets,index,arrived:false};
 });
 let animation=0,start:number|undefined,last:number|undefined,paused=0;
 const frame=(now:number)=>{start??=now;if(root.hasAttribute("data-cloud-reading"))paused+=last===undefined?0:now-last;last=now;const elapsed=now-start-paused;
  hops.forEach(({path,length,packets,index})=>packets.forEach((packet,i)=>{
   const t=(elapsed-index*7600-900-i*220)/1200;
   const dock=Math.max(0,Math.min(1,(t-1)/.55));
   packet.setAttribute("opacity",t>=0&&t<=1.55?String(t>1?1-dock*.65:1):"0");
   if(t>=0&&t<=1.55){const progress=Math.min(1,t),point=path.getPointAtLength(progress*progress*(3-2*progress)*length);
    const lane=(i-1)*23*Math.sin(progress*Math.PI),settle=(i-1)*26*dock;
    packet.setAttribute("transform",`translate(${point.x+settle} ${point.y+lane}) scale(${1-dock*.3})`);
    if(index===0&&root.matches(".cc-lab,.ms-lab,.dw-lab,.lh-lab")){const morph=Math.max(0,Math.min(1,(t-.35)/.45));
     const raw=packet.querySelector("[data-cloud-raw]"),grid=packet.querySelector("[data-cloud-grid]");
     raw?.setAttribute("opacity",String(1-morph));raw?.setAttribute("transform",`scale(${1-morph*.25})`);
     grid?.setAttribute("opacity",String(morph));grid?.setAttribute("transform",`scale(${.7+morph*.3})`);
    }}
  }));
  // Signal only after the final staggered record has entered the destination.
  for(const hop of hops){if(!hop.arrived&&elapsed>=hop.index*7600+900+2*220+1200+150){hop.arrived=true;onArrival(hop.index);}}
  if(elapsed<cards.length*7600)animation=requestAnimationFrame(frame);else svg.remove();
 };animation=requestAnimationFrame(frame);return ()=>{cancelAnimationFrame(animation);svg.remove();};
}
