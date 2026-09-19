"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight, Check, Network, X } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { getGlossaryItem, tokenizeGlossary, type GlossaryItem } from "@/lib/glossary";

type GlossaryContextValue = { open: (item: GlossaryItem, trigger?: HTMLElement) => void; drawerOpen: boolean };
const GlossaryContext = createContext<GlossaryContextValue | null>(null);

function Frequency({ item }: { item: GlossaryItem }) {
  const level = item.interviewFrequency > 70 ? "High" : item.interviewFrequency >= 40 ? "Medium" : "Low";
  return <span className={`glossary-frequency glossary-frequency-${level.toLowerCase()}`}>{level} Frequency</span>;
}

export function GlossaryDiagram({ item }: { item: GlossaryItem }) {
  return <figure className="glossary-diagram" aria-label={`${item.term} architecture`}>
    <figcaption><Network size={16} aria-hidden/>How it fits together</figcaption>
    <ol>{item.flow.map((step, index) => <li key={step}><span>{step}</span>{index < item.flow.length - 1 && <ArrowDown size={17} aria-hidden/>}</li>)}</ol>
  </figure>;
}

export function GlossaryDetails({ item }: { item: GlossaryItem }) {
  const context = useContext(GlossaryContext);
  return <div className="glossary-details">
    <section><h3>Why it matters in interviews</h3><p>{item.explanation}</p></section>
    <GlossaryDiagram item={item}/>
    <section><h3>Common interview questions</h3><ol className="glossary-questions">{item.questions.map(question => <li key={question}>{question}</li>)}</ol></section>
    <section><h3>Common mistakes</h3><ul className="glossary-mistakes">{item.mistakes.map(mistake => <li key={mistake}>{mistake}</li>)}</ul></section>
    <section><h3>Related concepts</h3><div className="glossary-related">{item.related.map(term => {
      const related = getGlossaryItem(term);
      return related && (context ? <button key={term} onClick={() => context.open(related)}>{term}<ArrowRight size={13}/></button> : <Link key={term} href={`/lessons/glossary/${related.id}`}>{term}<ArrowRight size={13}/></Link>);
    })}</div></section>
  </div>;
}

export function GlossaryProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<GlossaryItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const origin = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  function open(item: GlossaryItem, trigger?: HTMLElement) {
    if (!drawerOpen) origin.current = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setSelected(item); setDrawerOpen(true);
  }
  return <GlossaryContext.Provider value={{ open, drawerOpen }}>{children}
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent className="glossary-sheet" showCloseButton={false} onCloseAutoFocus={event => { event.preventDefault(); origin.current?.focus(); }}>
        {selected && <motion.div className="glossary-sheet-inner" initial={{ x: reduced ? 0 : 420 }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 320, damping: 34 }}>
          <header className="glossary-sheet-header"><div className="glossary-eyebrow">DATAPREP / GLOSSARY</div><button className="glossary-close" aria-label="Close glossary" onClick={() => setDrawerOpen(false)}><X size={19}/></button>
            <SheetTitle className="glossary-title">{selected.term}</SheetTitle>{selected.expanded && <p className="glossary-expanded">{selected.expanded}</p>}
            <SheetDescription className="glossary-definition">{selected.definition}</SheetDescription><div className="glossary-meta"><span>{selected.category}</span><Frequency item={selected}/></div>
          </header>
          <div className="glossary-sheet-scroll" key={selected.id}><GlossaryDetails item={selected}/></div>
          <footer className="glossary-sheet-footer"><Link className="glossary-cta" href={`/lessons/glossary/${selected.id}`} onClick={() => setDrawerOpen(false)}>Open Full Lesson<ArrowRight size={17}/></Link></footer>
        </motion.div>}
      </SheetContent>
    </Sheet>
  </GlossaryContext.Provider>;
}

export function GlossaryTerm({ term, children }: { term: string; children?: ReactNode }) {
  const item = getGlossaryItem(term);
  const context = useContext(GlossaryContext);
  const [preview, setPreview] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  const cancelClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current); };
  const closeSoon = () => { cancelClose(); closeTimer.current = setTimeout(() => setPreview(false), 180); };
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);
  useEffect(() => { if (context?.drawerOpen) setPreview(false); }, [context?.drawerOpen]);
  if (!item) return <>{children ?? term}</>;
  if (!context) throw new Error("GlossaryTerm requires a GlossaryProvider above the lesson.");
  const deepDive = () => { cancelClose(); setPreview(false); context.open(item, trigger.current ?? undefined); };
  return <Popover open={preview && !context.drawerOpen} onOpenChange={setPreview}>
    <PopoverAnchor asChild><button ref={trigger} type="button" className={`glossary-term glossary-term-${item.style}`} aria-label={`${item.term}: open glossary deep dive`} aria-haspopup="dialog"
      onPointerEnter={event => { if (event.pointerType !== "touch") { cancelClose(); setPreview(true); } }} onPointerLeave={closeSoon}
      onFocus={() => { cancelClose(); if (!context.drawerOpen) setPreview(true); }} onBlur={closeSoon}
      onKeyDown={event => { if (event.key === "Escape") { setPreview(false); event.stopPropagation(); } }} onClick={deepDive}>{children ?? item.term}</button></PopoverAnchor>
    <PopoverContent side="top" sideOffset={10} collisionPadding={16} className="glossary-popover" aria-label={`${item.term} glossary preview`} onOpenAutoFocus={event => event.preventDefault()} onCloseAutoFocus={event => event.preventDefault()}
      onPointerEnter={cancelClose} onPointerLeave={closeSoon} onFocusCapture={cancelClose} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) closeSoon(); }}>
      <motion.div initial={{ opacity: 0, y: reduced ? 0 : 6, scale: reduced ? 1 : .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: reduced ? 0 : .22 }}>
        <div className="glossary-preview-heading"><h3>{item.term}</h3><Frequency item={item}/></div>{item.expanded && <p className="glossary-expanded">{item.expanded}</p>}
        <p className="glossary-definition">{item.definition}</p>
        <div className="glossary-preview-stats"><span className="glossary-category">● {item.category === "Spark" ? "Apache Spark" : item.category}</span><span title="Editorial demo estimate; not measured statistics">Interview frequency: {item.interviewFrequency}% <small>(estimate)</small></span><span>{item.difficulty === "Medium" ? "Intermediate" : item.difficulty === "Easy" ? "Beginner" : "Advanced"}</span></div>
        {item.interviewFrequency > 70 && <p className="glossary-frequent"><Check size={14}/>Frequently Asked</p>}
        <div className="glossary-related"><span>Related</span>{item.related.map(related => <button key={related} onClick={() => { const next = getGlossaryItem(related); if (next) { setPreview(false); context.open(next, trigger.current ?? undefined); } }}>{related}</button>)}</div>
        <button className="glossary-cta" onClick={deepDive}>Open Deep Dive<ArrowRight size={16}/></button>
      </motion.div>
    </PopoverContent>
  </Popover>;
}

/** Safe plain-text parsing: no HTML injection, substring matches, or code-block rewriting. */
export function GlossaryText({ children }: { children: string }) {
  return <>{tokenizeGlossary(children).map((token, index) => token.item ? <GlossaryTerm key={`${index}-${token.item.id}`} term={token.item.id}>{token.text}</GlossaryTerm> : token.text)}</>;
}
