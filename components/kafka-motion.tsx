"use client";
import {useEffect,useRef,useState,type MouseEvent} from "react";

// Presentation only: lesson handlers remain responsible for every simulation result.
export function useKafkaMotion(options?:{nodes:string;theme:"dbt"}){
 const routeNodes=options?.nodes,dbtTheme=options?.theme;
 const [phase,setPhase]=useState("idle");
 const [cycle,setCycle]=useState(0);
 const root=useRef<HTMLElement>(null);
 const artwork=useRef<SVGSVGElement|null>(null);
 const action=useRef("");
 const timers=useRef<ReturnType<typeof setTimeout>[]>([]);
 const removeArtwork=()=>{artwork.current?.remove();artwork.current=null;root.current?.querySelectorAll("[data-kafka-receiving]").forEach(el=>el.removeAttribute("data-kafka-receiving"));};
 const cancel=()=>{removeArtwork();timers.current.forEach(clearTimeout);timers.current=[];setPhase("idle");};
 useEffect(()=>()=>{timers.current.forEach(clearTimeout);artwork.current?.remove();},[]);
 useEffect(()=>{if(phase!=="signal")return;const node=root.current;if(!node)return;
  const stops=routeNodes?Array.from(node.querySelectorAll<HTMLElement>(routeNodes)).filter(el=>el.getBoundingClientRect().width>0):resolveStops(node);
  if(stops.length<2){timers.current.push(setTimeout(()=>setPhase("idle"),0));return;}
  const consuming=/consume/i.test(action.current);const sending=/send|produce/i.test(action.current);
  const points=consuming?stops.slice(-2):sending?stops.slice(0,2):stops;
  const bounds=node.getBoundingClientRect();const scale=node.offsetWidth/bounds.width;
  const svg=svgElement("svg",{viewBox:`0 0 ${node.offsetWidth} ${node.offsetHeight}`,class:"kafka-motion-art","aria-hidden":"true"});
  artwork.current=svg;node.appendChild(svg);
  const gradientId=`kafka-stream-${Date.now()}-${cycle}`;
  const defs=svgElement("defs",{}),gradient=svgElement("linearGradient",{id:gradientId,x1:"0%",y1:"0%",x2:"100%",y2:"100%"});
  [["0%","#b69aff"],["50%","#78b8f4"],["100%","#69d9bc"]].forEach(([offset,color])=>gradient.appendChild(svgElement("stop",{offset,"stop-color":color})));defs.appendChild(gradient);svg.appendChild(defs);
  const journeys:{path:SVGPathElement;packet:SVGGElement;trail:SVGCircleElement[];target:HTMLElement;beam:SVGPathElement;length:number}[]=[];
  points.slice(1).forEach((target,index)=>{
   const from=points[index].getBoundingClientRect(),to=target.getBoundingClientRect();
   const horizontal=Math.abs(to.left-from.left)>Math.abs(to.top-from.top),forward=horizontal?to.left>from.left:to.top>from.top;
   const x1=((horizontal?(forward?from.right:from.left):from.left+from.width/2)-bounds.left)*scale,y1=((horizontal?from.top+from.height/2:(forward?from.bottom:from.top))-bounds.top)*scale,x2=((horizontal?(forward?to.left:to.right):to.left+to.width/2)-bounds.left)*scale,y2=((horizontal?to.top+to.height/2:(forward?to.top:to.bottom))-bounds.top)*scale;
   const path=svgElement("path",{d:horizontal?`M ${x1} ${y1} C ${(x1+x2)/2} ${y1} ${(x1+x2)/2} ${y2} ${x2} ${y2}`:`M ${x1} ${y1} C ${x1} ${(y1+y2)/2} ${x2} ${(y1+y2)/2} ${x2} ${y2}`,class:"kafka-motion-route",style:`animation-delay:${index*1100}ms`});svg.appendChild(path);
   const color=(dbtTheme?["#ee895c","#a78bfa","#62bba8"]:["#a78bfa","#45c6b1","#62a7ef"])[index%3];
   const length=path.getTotalLength();const beam=svgElement("path",{d:path.getAttribute("d")!,class:"kafka-motion-beam",stroke:color,opacity:"0"});svg.appendChild(beam);
   svg.appendChild(svgElement("circle",{cx:String(x1),cy:String(y1),r:"6",class:"kafka-motion-port",stroke:color,style:`animation-delay:${index*1.1}s`}));
   const orbit=svgElement("g",{class:"kafka-motion-orbit",transform:`translate(${x1} ${y1})`,style:`animation-delay:${index*1.1}s`});
   orbit.appendChild(svgElement("ellipse",{rx:"24",ry:"9",class:"kafka-motion-orbit-ring",stroke:color}));
   const rotor=svgElement("g",{class:"kafka-motion-orbit-rotor"});
   [0,1,2].forEach(i=>{const angle=i*Math.PI*2/3;rotor.appendChild(svgElement("rect",{x:String(Math.cos(angle)*21-3),y:String(Math.sin(angle)*9-3),width:"6",height:"6",rx:"2",fill:color}));});orbit.appendChild(rotor);svg.appendChild(orbit);
   const gate=svgElement("g",{transform:`translate(${x2} ${y2})`,class:"kafka-motion-gate",style:`animation-delay:${index*1.1+.65}s`});
   const gateRotor=svgElement("g",{class:"kafka-motion-gate-rotor"});
   gateRotor.appendChild(svgElement("circle",{r:"24",fill:"none",stroke:color,"stroke-width":"2","stroke-dasharray":"18 12"}));gateRotor.appendChild(svgElement("circle",{r:"19",fill:"none",stroke:color,"stroke-width":"1",opacity:".4"}));gate.appendChild(gateRotor);svg.appendChild(gate);
   beam.setAttribute("stroke",`url(#${gradientId})`);
   const packet=svgElement("g",{class:"kafka-motion-envelope",opacity:"0"});
   packet.style.setProperty("--packet-tone",color);packet.appendChild(svgElement("rect",{x:"-16",y:"-17",width:"36",height:"25",rx:"7",class:"kafka-motion-sheet"}));
   packet.appendChild(svgElement("ellipse",{cx:"0",cy:"0",rx:"29",ry:"20",class:"kafka-motion-capsule-aura"}));
   packet.appendChild(svgElement("rect",{x:"-29",y:"-15",width:"58",height:"30",rx:"8"}));
   packet.appendChild(svgElement("path",{d:"M -14 -10 H 8",class:"kafka-motion-capsule-shine"}));const partition=target.getAttribute("data-kafka-partition");
   const heading=target.querySelector("h3,h4,strong")?.textContent?.trim()||"record";
   const label=partition!==null?`P${partition}`:heading.replace(/^Kafka /," ").trim().slice(0,11);
   const glyph=svgElement("text",{x:"-23",y:"4",class:"kafka-motion-payload-glyph"});glyph.textContent="{}";packet.appendChild(glyph);
   const destination=svgElement("text",{x:"-7",y:"0",class:"kafka-motion-destination"});destination.textContent=label;packet.appendChild(destination);
   [-7,0,7].forEach((x,i)=>packet.appendChild(svgElement("rect",{x:String(x),y:"5",width:String(4+i*2),height:"2",rx:"1",class:"kafka-motion-payload-bit"})));packet.appendChild(svgElement("circle",{cx:"23",cy:"-9",r:"2.5",class:"kafka-motion-seal"}));const trail=[0,1,2,3,4].map(index=>{const dot=svgElement("circle",{r:String(Math.max(1,3-index*.45)),class:"kafka-motion-trail",opacity:"0"});svg.appendChild(dot);return dot;});   svg.appendChild(packet);journeys.push({path,packet,trail,target,beam,length});
   svg.appendChild(svgElement("circle",{cx:String(x2),cy:String(y2),r:"17",class:"kafka-motion-arrival",style:`animation-delay:${index*1.1+.9}s`}));
   const dock=svgElement("g",{class:"kafka-motion-dock",style:`animation-delay:${index*1.1+.9}s`,transform:`translate(${x2} ${y2})`});
   for(let ray=0;ray<6;ray++){const angle=ray*Math.PI/3;dock.appendChild(svgElement("line",{x1:String(Math.cos(angle)*19),y1:String(Math.sin(angle)*19),x2:String(Math.cos(angle)*27),y2:String(Math.sin(angle)*27),stroke:color}));}svg.appendChild(dock);
  });
  // One envelope completes a hop before the next starts. No shared middle-card destination.
  let animation=0,startTime:number|undefined;
  const frame=(time:number)=>{startTime??=time;const elapsed=time-startTime;
   journeys.forEach(({path,packet,trail,target,beam,length},index)=>{const progress=(elapsed-index*1100)/950;if(progress>=1&&!target.hasAttribute("data-kafka-receiving"))target.setAttribute("data-kafka-receiving","true");
    packet.setAttribute("opacity",progress>=0&&progress<=1?"1":"0");
    trail.forEach((dot,i)=>{const t=progress-(i+1)*.055;dot.setAttribute("opacity",progress>=0&&progress<=1&&t>=0?String(Math.max(.1,.55-i*.09)):"0");if(t>=0&&t<=1){const point=path.getPointAtLength(t*t*(3-2*t)*length);dot.setAttribute("cx",String(point.x));dot.setAttribute("cy",String(point.y));}});
    if(progress>=0&&progress<=1){const eased=progress*progress*(3-2*progress),point=path.getPointAtLength(eased*length);packet.setAttribute("transform",`translate(${point.x} ${point.y}) scale(${.88+Math.sin(progress*Math.PI)*.12})`);beam.setAttribute("opacity",".6");beam.setAttribute("stroke-dasharray",`${Math.min(45,eased*length)} ${length}`);beam.setAttribute("stroke-dashoffset",String(-Math.max(0,eased*length-45)));}else{beam.setAttribute("opacity","0");}
   });if(elapsed<journeys.length*1100)animation=requestAnimationFrame(frame);
  };animation=requestAnimationFrame(frame);
  const flight=journeys.length*1100+100;
  timers.current.push(setTimeout(()=>setPhase("processing"),flight),setTimeout(()=>setPhase("output"),flight+450),setTimeout(()=>setPhase("idle"),flight+1100));
  return ()=>{cancelAnimationFrame(animation);removeArtwork();};
 },[phase,cycle,routeNodes,dbtTheme]);
 const capture=(event:MouseEvent<HTMLElement>)=>{
  const button=(event.target as HTMLElement).closest<HTMLButtonElement>("button");
  if(!button||button.disabled)return;
  const label=button.textContent?.trim()||"";
  if(/^(pause|reset|clear|next scenario)$/i.test(label)){cancel();return;}
  if(!(options?/^(run(?: simulation| model| tests)?|compile(?: model)?|dbt run)$/i:/^(auto run|run(?: simulation| next| again)?|send (?:event|message)|produce message|consume messages|next step|step|apply)$/i).test(label))return;
  cancel();action.current=label;
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  setCycle(value=>value+1);setPhase("signal");
 };
 return {ref:(node:HTMLElement|null)=>{root.current=node;},"data-kafka-motion":phase,"data-pipeline-theme":options?.theme,onClickCapture:capture,onChangeCapture:cancel};
}

const routes:[string,string[]][]=[
 [".kpc-lab",[".kpc-producer",".kpc-partition:has(.is-selected)",".kpc-consumer"]],
 [".kar-lab",[".kar-producer",".kar-cluster",".kar-consumers"]],
 [".kbc-lab",[".kbc-producer",".kbc-cluster",".kbc-consumer"]],
 [".kcn-lab",[".kcn-source-system",".kcn-source-connector",".kcn-topic",".kcn-transform",".kcn-sink-connector",".kcn-destination"]],
 [".ksp-lab",[".ksp-input",".ksp-topology",".ksp-output"]],
 [".kcg-lab",[".kcg-partition",".kcg-consumer"]],
 [".kco-lab",[".kco-topic",".kco-consumer"]],
 [".ki-learning",[".ki-producer",".ki-topic",".ki-readers"]],
 [".kmk-lab",[".kmk-producer",".kmk-partition[data-motion-selected=true]"]],
 [".kod-lab",[".kod-producer",".kod-topic",".kod-consumers"]],
 [".kpo-lab",[".kpo-producer",".kpo-partition.is-selected",".kpo-consumer"]],
 [".krp-lab",[".krp-stage:first-child",".krp-stage:nth-of-type(2)",".krp-stage:last-child"]],
 [".krf-lab",[".krf-broker:first-child",".krf-broker:nth-child(2)",".krf-broker:nth-child(3)"]],
 [".kse-lab",[".kse-writer",".kse-topic",".kse-reader"]],
];
function svgElement<K extends keyof SVGElementTagNameMap>(tag:K,attributes:Record<string,string>):SVGElementTagNameMap[K]{const el=document.createElementNS("http://www.w3.org/2000/svg",tag);Object.entries(attributes).forEach(([key,value])=>el.setAttribute(key,value));return el;}

function resolveStops(node:HTMLElement):HTMLElement[]{
 const selectors=routes.find(([selector])=>node.matches(selector))?.[1]??[];
 const stops=selectors.map(selector=>node.querySelector<HTMLElement>(selector)).filter((el):el is HTMLElement=>!!el);
 if(node.matches(".kpc-lab")){const partition=stops[1]?.getAttribute("data-kafka-partition");const consumer=node.querySelector<HTMLElement>(`.kpc-consumer[data-kafka-partition="${partition}"]`);return consumer?[...stops.slice(0,2),consumer]:stops.slice(0,2);}
 if(node.matches(".kcg-lab")){const partition=node.querySelector<HTMLElement>(".kcg-partition.is-selected");const owner=partition?.getAttribute("data-kafka-owner");const consumer=node.querySelector<HTMLElement>(`.kcg-consumer[data-kafka-consumer="${owner}"]`);return partition&&consumer?[partition,consumer]:[];}
 return stops;
}
