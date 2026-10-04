"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, BookOpen, Code2, X } from "lucide-react";
import { PythonStoryGraphics } from "@/components/python-story-graphics";
import { pythonStories, type PythonStory } from "@/lib/python-stories";

function Illustration({ id, story, scene }: { id: string; story: PythonStory; scene: number }) {
  return <div className={`py-story-visual visual-${id} phase-${scene}`}>
    <div className="py-story-visual-heading"><Code2 size={20}/><strong>{['Follow the records', 'Connect the code', 'Explain the result'][scene]}</strong><span>Illustration · no execution</span></div>
    <PythonStoryGraphics id={id} story={story} scene={scene}/>
    <div className="py-story-code"><div><span>Python · complete sample</span><span>Expected output</span></div><div className="py-story-code-pair"><pre><code>{story.code.split('\n').map((line, i) => <span className={scene === 1 ? 'is-connected' : ''} key={i} style={{ '--i': i } as CSSProperties}>{line}{'\n'}</span>)}</code></pre><samp className={scene === 2 ? 'is-confirmed' : ''}>{story.result}</samp></div></div>
    <p className="py-story-pitfall"><strong>Watch for:</strong> {story.pitfall}</p>
  </div>;
}

export function PythonBasicsGuide({ lessonId, title }: { lessonId: string; title: string }) {
  const story = pythonStories[lessonId];
  const [open, setOpen] = useState(false);
  const [scene, setScene] = useState(0);
  const [hero, setHero] = useState<HTMLElement | null>(null);
  const [workspace, setWorkspace] = useState<HTMLElement | null>(null);
  const guide = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const storageKey = `dataprep-python-basics-${lessonId}-v1`;
  useEffect(() => {
    // Read browser-only saved preferences after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHero(document.querySelector<HTMLElement>('.python-module-page .lesson-hero, .python-module-page main > section[class$="-hero"]'));
    setWorkspace(document.querySelector<HTMLElement>('.python-module-page .lesson-content'));
    try { setOpen(localStorage.getItem(storageKey) !== 'true'); } catch { setOpen(true); }
  }, [storageKey]);
  useEffect(() => {
    if (guide.current) guide.current.inert = !open;
    const practice = workspace ? [...workspace.children].filter(element => element !== guide.current) : [];
    practice.forEach(element => { (element as HTMLElement).inert = open; });
    if (open) guide.current?.focus({preventScroll:true});
    return () => { practice.forEach(element => { (element as HTMLElement).inert = false; }); };
  }, [open,workspace]);
  const close = () => {
    try { localStorage.setItem(storageKey, 'true'); } catch { /* Basics remain usable without storage. */ }
    setOpen(false);
    toggle.current?.focus({preventScroll:true});
    guide.current?.closest<HTMLElement>('.lesson-content')?.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  };
  const control = <button ref={toggle} className="py-basics-review" onClick={() => { if(open)close();else{setScene(0);setOpen(true);} }} aria-expanded={open} aria-controls={`py-basics-guide-${lessonId}`}><BookOpen size={16}/>{open?'Collapse basics':'Review basics'}<ArrowRight size={16}/></button>;
  return <>
    {hero ? createPortal(control, hero) : control}
    {workspace && createPortal(<div ref={guide} id={`py-basics-guide-${lessonId}`} className={`py-basics-roll ${open?'is-open':''}`} aria-hidden={!open} tabIndex={-1} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();close();}}}>
    <section className="py-basics-story" style={{ '--py-accent': story.color } as CSSProperties} aria-labelledby={`py-story-title-${lessonId}`}>
      <header className="py-story-header"><span>PYTHON FOR DATA ENGINEERING <b>· {title}</b></span><button onClick={close} aria-label="Close basics and return to lesson"><X size={18}/><span>Back to lesson</span></button></header>
      <div className="py-story-layout">
        <article className="py-story-reading"><h2 id={`py-story-title-${lessonId}`}>Understand it. Say it.</h2><section><h3>Definition & vocabulary</h3><p>{story.definition}</p><p className="py-story-vocabulary">{story.vocabulary}</p></section><section><h3>In plain words · data engineering example</h3><p>{story.plain}</p></section><section className="py-story-interview"><h3>Interview practice</h3><p><strong>{story.question}</strong></p><p>{story.answer}</p></section><section className="py-story-recall"><h3>Try saying it aloud</h3><p>{story.recall}</p></section></article>
        <Illustration id={lessonId} story={story} scene={scene}/>
      </div>
      <footer className="py-story-footer"><button disabled={scene === 0} onClick={() => setScene(scene - 1)}>Back</button><span aria-live="polite">{scene + 1} / 3 · {['Records', 'Code', 'Recall'][scene]}</span><button className="py-story-next" onClick={() => scene === 2 ? close() : setScene(scene + 1)}>{scene === 2 ? 'Start practicing' : 'Next'}<ArrowRight size={17}/></button></footer>
    </section></div>,workspace)}
  </>;
}
