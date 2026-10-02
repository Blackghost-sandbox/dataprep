"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import Image from "next/image";
import { ArrowUp, Brain, FlaskConical, Lightbulb, MessageCircle, Minus, Pause, Play, RotateCcw, Sparkles, Square, Volume2, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCompanion } from "@/components/companion-context";
import { AICompanionService, ReactionEngine, type ChatTurn, type CompanionAction, type CompanionMode, type Expression, type LearningEvent } from "@/lib/companion";
import { BrowserTTSProvider, type VoiceState } from "@/lib/companion-voice";

const expressions:Record<Expression,string>={idle:"✦",greeting:"👋",listening:"🎧",thinking:"…",explaining:"💬",success:"✨",celebration:"🎉",hint:"💡",encouragement:"🌱"};
const labels:Partial<Record<CompanionAction,string>>={explain:"Explain this lesson",simply:"Explain simply",example:"Give me an example",hint:"Give me a hint",error:"Explain error",solution:"Show worked solution"};
function EmbeddedPanel({children,className,"aria-label":label}:ComponentProps<typeof PopoverContent>){
  return <section className={className} aria-label={label}>{children}</section>;
}
export function NilaCompanion({completionEvent,embedded=false}:{completionEvent?:LearningEvent|null;embedded?:boolean}) {
  const companion=useCompanion();
  const [reactions]=useState(()=>new ReactionEngine());
  const [quiet,setQuiet]=useState(false);
  if(!companion)return null;
  // Reset conversation and voice on navigation; the shared provider remains mounted.
  return <NilaSession key={companion.context.course+companion.context.lesson.id} embedded={embedded} completionEvent={completionEvent} reactions={reactions} quiet={quiet} setQuiet={setQuiet}/>;
}
function NilaSession({completionEvent,reactions,quiet,setQuiet,embedded=false}:{completionEvent?:LearningEvent|null;reactions:ReactionEngine;quiet:boolean;setQuiet:(value:boolean)=>void;embedded?:boolean}) {
  const Panel=embedded?EmbeddedPanel:PopoverContent;
  const companion=useCompanion()!;
  const {context,emit,event}=companion;
  const [open,setOpen]=useState(false);
  const [bubble,setBubble]=useState("");
  const [expression,setExpression]=useState<Expression>("greeting");
  const [mode,setMode]=useState<CompanionMode>("idle");
  const [messages,setMessages]=useState<ChatTurn[]>([]);
  const [input,setInput]=useState("");
  const [busy,setBusy]=useState(false);
  const [hintLevel,setHintLevel]=useState(0);
  const [quizIndex,setQuizIndex]=useState<number|null>(null);
  const [choice,setChoice]=useState<number|null>(null);
  const [voiceState,setVoiceState]=useState<VoiceState>("idle");
  const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI,setVoiceURI]=useState("");
  const [rate,setRate]=useState(1);
  const [spoken,setSpoken]=useState("");
  const service=useRef(new AICompanionService());
  const voice=useRef<BrowserTTSProvider|null>(null);
  const abort=useRef<AbortController|null>(null);
  const failures=useRef(0);
  const seenEvent=useRef<LearningEvent|string|null>(null);
  const bubbleTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const closeRef=useRef<HTMLButtonElement>(null);
  const chatEnd=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    let mounted=true;
    voice.current=new BrowserTTSProvider(state=>{if(mounted)setVoiceState(state);});
    try{const saved=localStorage.getItem("dataprep.nila.voice")||"";voice.current.setVoice(saved);queueMicrotask(()=>{if(mounted)setVoiceURI(saved);});}catch{}
    const updateVoices=()=>{if(mounted)setVoices(window.speechSynthesis.getVoices().filter(v=>/^en(?:-|_)/i.test(v.lang)));};
    if("speechSynthesis" in window){queueMicrotask(()=>{if(mounted)updateVoices();});window.speechSynthesis.addEventListener("voiceschanged",updateVoices);}
    return ()=>{mounted=false;if("speechSynthesis" in window)window.speechSynthesis.removeEventListener("voiceschanged",updateVoices);voice.current?.dispose();abort.current?.abort();if(bubbleTimer.current)clearTimeout(bubbleTimer.current);};
  },[]);
  useEffect(()=>{
    const timer=setTimeout(()=>{
      const candidate=[event,completionEvent].filter((value):value is LearningEvent=>Boolean(value&&value.lesson===context.lesson.title)).sort((a,b)=>(b.emittedAt??0)-(a.emittedAt??0))[0]??context.lesson.title;
      if(seenEvent.current===candidate)return;
      seenEvent.current=candidate;
      if(quiet || open)return;
      const latest=typeof candidate==="string"?{type:"lesson_opened" as const,lesson:candidate}:candidate;
      const reaction=reactions.react(latest);
      if(reaction){setBubble(reaction.text);setExpression(reaction.expression);setMode("reactive");bubbleTimer.current=setTimeout(()=>{setBubble("");setMode("idle");},8000);}
    },800);
    return ()=>clearTimeout(timer);
  },[event,completionEvent,context.lesson.title,open,quiet,reactions]);
  useEffect(()=>{chatEnd.current?.scrollIntoView({block:"nearest",behavior:"instant"});},[messages,quizIndex,choice]);
  useEffect(()=>()=>{voice.current?.stop();},[context.tab]);
  function changeOpen(value:boolean){
    setOpen(value);setBubble("");setMode(value?"conversation":"idle");
    if(!value){voice.current?.stop();abort.current?.abort();setBusy(false);}
  }
  async function request(action:CompanionAction,question=""){
    if(busy)return;
    voice.current?.stop();setQuizIndex(null);setBusy(true);setExpression("thinking");
    setMode(action==="ask"?"conversation":"teaching");
    const controller=new AbortController();abort.current=controller;
    const level=action==="hint"?Math.min(hintLevel+1,3):hintLevel;
    if(action==="hint")setHintLevel(level);
    const user:ChatTurn={role:"user",text:question||labels[action]||action};
    setMessages(previous=>[...previous,user].slice(-8));setInput("");
    try{
      const reply=await service.current.respond(action,context,question,messages,level,controller.signal);
      if(controller.signal.aborted)return;
      setMessages(previous=>[...previous,{role:"assistant" as const,text:reply.text}].slice(-8));
      setExpression(reply.expression);setSpoken(reply.text);
    }catch{
      if(!controller.signal.aborted)setMessages(previous=>[...previous,{role:"assistant",text:"I couldn’t get an answer. Please try again; the local lesson tools still work."}].slice(-8) as ChatTurn[]);
    }finally{if(!controller.signal.aborted)setBusy(false);}
  }
  const quiz=quizIndex===null?null:context.lesson.quiz[quizIndex];
  function startQuiz(){voice.current?.stop();setQuizIndex(previous=>previous===null?0:(previous+1)%context.lesson.quiz.length);setChoice(null);setMode("teaching");setExpression("thinking");}
  function answer(index:number){
    if(!quiz)return;
    setChoice(index);
    const correct=index===quiz.correct;
    setExpression(correct?"success":"encouragement");
    if(!correct)failures.current++;
    emit({type:correct?"exercise_correct":failures.current>=2?"repeated_error":"exercise_error",lesson:context.lesson.title,source:"quiz"});
  }
  return <div className="nila-root" data-mode={mode} data-expression={expression}>
    <Popover open={open} onOpenChange={changeOpen}>
      <div className="nila-dock">
{embedded&&!open&&!bubble&&<div className="nila-bubble"><strong>Follow the data ✨</strong><p>{context.course==="SQL Fundamentals"&&context.lesson.id==="distinct"?"Ask me why duplicates disappeared, what happens when you add another selected column, or how NULL participates in DISTINCT.":context.course==="Apache Airflow"?"Watch task eligibility, states and dependencies. Ask me why a task can run—or why it is waiting.":context.course==="Apache Kafka"?"Ask me about producers, partitions, offsets, or why a slow consumer builds lag.":context.lesson.id==="partitioning"?"Follow a record through the shuffle, or compare how coalesce groups partitions. Ask me about any step.":context.lesson.id==="transformations"?"Step through the filter, selected columns and new age group. Ask me if a step feels unclear.":"Run both paths, then step through the cache reuse. Ask me if a step feels unclear."}</p></div>}
        {!open&&bubble&&<div className="nila-bubble" role="status"><button aria-label="Dismiss Mithoo’s message" onClick={()=>setBubble("")}><X size={13}/></button>{bubble}</div>}
        {!open&&<Image className="nila-idle-avatar" src="/nila-avatar.png" alt="Mithoo, your friendly learning companion" width={105} height={128}/>}
        <PopoverTrigger asChild><button className="nila-launcher" aria-label="Open Mithoo learning companion"><Sparkles size={17}/><span>Mithoo · Learning companion</span><ArrowUp size={17}/></button></PopoverTrigger>
      </div>
      {(!embedded||open)&&<Panel className="nila-panel" align="end" side="top" sideOffset={12} collisionPadding={12} aria-label="Mithoo learning companion" onOpenAutoFocus={e=>{e.preventDefault();closeRef.current?.focus();}} onInteractOutside={e=>e.preventDefault()}>
        <header className="nila-header"><span className="nila-mark"><Sparkles size={17}/></span><div><strong>Mithoo</strong><small>Your learning companion</small></div><span className="nila-local">Local mode</span><button onClick={()=>changeOpen(false)} aria-label="Minimize Mithoo"><Minus size={17}/></button><button ref={closeRef} onClick={()=>changeOpen(false)} aria-label="Close Mithoo"><X size={17}/></button></header>
        <div className="nila-body">
          <section className="nila-hero" data-expression={voiceState==="speaking"?"explaining":expression}>
            <div className="nila-welcome">Hi! I’m <strong>Mithoo.</strong> <span aria-hidden="true">{expressions[expression]}</span><p>You’re learning <strong>{context.lesson.title}</strong> — let’s make it simple, one step at a time.</p></div>
            <Image src="/nila-avatar.png" alt="Mithoo waving hello" width={190} height={231} priority/>
          </section>
          <div className="nila-actions">
            {([["explain",Volume2],["simply",Lightbulb],["example",FlaskConical]] as const).map(([action,Icon])=><button key={action} disabled={busy} onClick={()=>request(action)}><span><Icon size={18}/></span>{labels[action]}</button>)}
            <button disabled={busy||!context.lesson.quiz.length} onClick={startQuiz}><span><Brain size={18}/></span>Quiz me</button>
            {context.tab==="Hands-on"&&<button disabled={busy} onClick={()=>request("hint")}><span><MessageCircle size={18}/></span>{hintLevel?`Next hint · ${Math.min(hintLevel+1,3)}/3`:"Give me a hint"}</button>}
            {context.exercise?.executionError&&<button disabled={busy} onClick={()=>request("error")}><span><Lightbulb size={18}/></span>Explain error</button>}
          </div>
          {messages.length>0&&<div className="nila-chat" role="log" aria-label="Conversation with Mithoo" aria-live="polite">{messages.map((message,index)=><div key={index} className={"nila-message nila-"+message.role}><small>{message.role==="user"?"You":"Mithoo · lesson guidance"}</small><p>{message.text}</p></div>)}</div>}
          {busy&&<p className="nila-status" role="status">Mithoo is thinking…</p>}
          {quiz&&<section className="nila-quiz"><small>Quick check · {quizIndex!+1}/{context.lesson.quiz.length}</small><h3>{quiz.question}</h3>{quiz.options.map((option,index)=><button key={option} aria-pressed={choice===index} disabled={choice===quiz.correct} onClick={()=>answer(index)}>{option}</button>)}{choice!==null&&<p role="status">{choice===quiz.correct?`Correct! ${quiz.explanation}`:"Not quite. Revisit the key idea and try another answer."}</p>}{choice===quiz.correct&&<button onClick={startQuiz}>Next question →</button>}</section>}
          {spoken&&<section className="nila-voice" aria-label="Voice controls"><div><Volume2 size={15}/><strong>Listen to Mithoo</strong><small aria-live="polite">{voiceState}</small></div><div>
            <button onClick={()=>voiceState==="paused"?voice.current?.resume():voice.current?.play(spoken,rate)} disabled={voiceState==="speaking"}><Play size={14}/>{voiceState==="paused"?"Resume":"Play"}</button>
            <button aria-label="Pause voice" disabled={voiceState!=="speaking"} onClick={()=>voice.current?.pause()}><Pause size={14}/></button>
            <button aria-label="Replay voice" onClick={()=>voice.current?.play(spoken,rate)}><RotateCcw size={14}/></button>
            <button aria-label="Stop voice" disabled={voiceState!=="speaking"&&voiceState!=="paused"} onClick={()=>voice.current?.stop()}><Square size={14}/></button>
            <select aria-label="Speaking speed (applies on next play)" value={rate} onChange={e=>setRate(Number(e.target.value))}><option value={.8}>0.8×</option><option value={1}>1×</option><option value={1.2}>1.2×</option></select>
          </div><label className="block mt-2">Mithoo’s voice<select className="mt-1 w-full max-w-full" aria-label="Mithoo’s voice" value={voices.some(v=>v.voiceURI===voiceURI)?voiceURI:""} onChange={e=>{const uri=e.target.value;setVoiceURI(uri);voice.current?.setVoice(uri);try{localStorage.setItem("dataprep.nila.voice",uri);}catch{}}}><option value="">Auto · prefer female English voice</option>{voices.map(v=><option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}</select></label>{voiceState==="choose-voice"&&<p>No recognized female English voice is available. Choose a voice above, or install a female English speech voice in your device settings, then reload.</p>}{voiceState==="unavailable"&&<p>Your browser does not support spoken playback. Read the response above.</p>}{voiceState==="error"&&<p>Voice playback failed. Try Play again or read the response.</p>}</section>}
          <div ref={chatEnd}/>
        </div>
        <footer className="nila-footer"><form onSubmit={e=>{e.preventDefault();if(input.trim())void request("ask",input.trim());}}><input aria-label="Ask Mithoo" placeholder={`Ask about ${context.lesson.title}…`} maxLength={1200} value={input} onFocus={()=>setExpression("listening")} onChange={e=>setInput(e.target.value)}/><button disabled={busy||!input.trim()} aria-label="Send question"><ArrowUp size={20}/></button></form><p>Local lesson tools · Custom AI not connected. Nothing is sent to an AI provider. Voice uses your browser/device.</p><label><input type="checkbox" checked={quiet} onChange={e=>{setQuiet(e.target.checked);setBubble("");}}/> Quiet mode · hide proactive messages</label></footer>
      </Panel>}
    </Popover>
  </div>;
}
