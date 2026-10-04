"use client";

import { PythonCodeLine } from "./python-code-line";

import { useState } from "react";
import Image from "next/image";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

type StructureKey = "list" | "dict" | "set" | "tuple";

const structures = [
  {
    key: "list" as const,
    number: "1",
    name: "List",
    subtitle: "Ordered records",
    glyph: "≡",
    intro: "Preserves order and allows duplicates — good for a stream of records.",
    code: [
      "orders_list = [",
      "  {'order_id': 1001, ...},",
      "  {'order_id': 1002, ...},",
      "  {'order_id': 1001, ...},",
      "  {'order_id': 1003, ...}",
      "]",
    ],
    bullets: ["Preserves insertion order", "Duplicates allowed", "Good for sequential processing"],
    use: "Sequence of records",
    action: "Use a List",
  },
  {
    key: "dict" as const,
    number: "2",
    name: "Dict",
    subtitle: "Key to value",
    glyph: "{}",
    intro: "Maps a key to a value — fast lookup by order_id.",
    code: [
      "orders_dict = {",
      "  1001: {'item': 'Laptop', ...},",
      "  1002: {'item': 'Mouse', ...},",
      "  1003: {'item': 'Keyboard', ...}",
      "}",
    ],
    bullets: ["Fast lookup by key", "Unique keys", "Great for indexing and joins"],
    use: "Fast lookup by key",
    action: "Use a Dict",
  },
  {
    key: "set" as const,
    number: "3",
    name: "Set",
    subtitle: "Unique values",
    glyph: "○○",
    intro: "Stores unique values — useful for membership tests and deduplication.",
    code: [
      "order_ids = {",
      "  1001, 1002, 1003",
      "}",
      "",
    ],
    bullets: ["Only unique values", "Fast membership test (in)", "Useful for deduplication"],
    use: "Unique values / deduplication",
    action: "Use a Set",
  },
  {
    key: "tuple" as const,
    number: "4",
    name: "Tuple",
    subtitle: "Fixed grouping",
    glyph: "◯◯",
    intro: "Immutable, fixed-size grouping — safe to share as a stable key.",
    code: [
      "order_key = (1001, 'Laptop')",
      "",
      "# can be used as a key in a dict",
      "order_map = {",
      "  order_key: 'processed'",
      "}",
    ],
    bullets: ["Immutable (cannot change)", "Fixed size and ordered", "Safe to share as a stable key"],
    use: "Fixed, immutable grouping",
    action: "Use a Tuple",
  },
];

const conceptCards = [
  {
    number: "1",
    icon: "◎",
    title: "Choose the structure for the operation",
    body: "A list preserves order and allows duplicates — good for a stream of records. A dict maps keys to values for fast lookups by key. A set stores unique items and supports fast membership tests. A tuple is an immutable, fixed-size grouping.",
  },
  {
    number: "2",
    icon: "</>",
    title: "Comprehensions describe, not loop",
    body: "A list, dict, or set comprehension states what the result should contain, similar to how SELECT states which rows and columns you want. It usually reads clearer than an equivalent append-in-a-loop for a single transformation.",
  },
  {
    number: "3",
    icon: "◇",
    title: "Mutability is a hidden dependency",
    body: "Lists, dicts, and sets are mutable; two variables can reference the same object, so mutating one affects the other. Tuples and strings are immutable and safe to share without that risk.",
  },
];

function PythonMark() {
  return (
    <svg className="pyds-python-logo" viewBox="0 0 78 78" aria-label="Python">
      <defs>
        <linearGradient id="pydsBlue" x1="0" x2="1"><stop stopColor="#2b84c6"/><stop offset="1" stopColor="#1f69ac"/></linearGradient>
        <linearGradient id="pydsYellow" x1="0" x2="1"><stop stopColor="#ffd955"/><stop offset="1" stopColor="#f4ba2a"/></linearGradient>
      </defs>
      <path d="M38 9c-14 0-14 6-14 6v13h22v4H17S7 31 7 47c0 16 12 15 12 15h8V50c0-8 7-15 15-15h18c7 0 11-6 11-13 0-7-6-13-13-13H38Z" fill="url(#pydsBlue)"/>
      <circle cx="34" cy="17" r="2.7" fill="#fff"/>
      <path d="M40 69c14 0 14-6 14-6V50H32v-4h29s10 1 10-15c0-16-12-15-12-15h-8v12c0 8-7 15-15 15H18c-7 0-11 6-11 13 0 7 6 13 13 13h20Z" fill="url(#pydsYellow)"/>
      <circle cx="44" cy="61" r="2.7" fill="#fff"/>
    </svg>
  );
}

export function PythonDataStructuresHero({
  onPrevious,
  onNext,
}: {
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <section className="pyds-hero">
      <div className="pyds-hero-copy">
        <div className="pyds-breadcrumb">
          <span>Python for Data Engineering</span><ChevronRight size={14}/><strong>Data Structures for ETL</strong>
        </div>
        <div className="pyds-hero-main">
          <div className="pyds-hero-icon"><Zap size={34}/></div>
          <div>
            <h1>Data Structures for ETL</h1>
            <p>Choose the right built-in structure for a transformation, and understand what makes them safe to share.</p>
            <div className="pyds-meta">
              <span><Clock3 size={15}/>15 min</span>
              <span><BookOpen size={15}/>Lesson 2/10</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pyds-hero-art" aria-hidden="true">
        <span className="pyds-star pyds-star-a">✦</span>
        <span className="pyds-star pyds-star-b">✦</span>
        <span className="pyds-star pyds-star-c">✦</span>
        <span className="pyds-star pyds-star-d">✦</span>
        <div className="pyds-db">
          <span/><span/><span/>
        </div>
        <div className="pyds-python-orb"><PythonMark/></div>
        <div className="pyds-data-card pyds-data-card-top"><i/><i/><i/><i/></div>
        <div className="pyds-data-card pyds-data-card-bottom"><i/><i/><i/><i/></div>
        <div className="pyds-art-line pyds-art-line-one"/>
        <div className="pyds-art-line pyds-art-line-two"/>
        <div className="pyds-art-line pyds-art-line-three"/>
      </div>

      <div className="pyds-hero-actions">
        <span className="pyds-difficulty">Intermediate</span>
        <div>
          <button type="button" aria-label="Previous lesson" onClick={onPrevious}><ChevronLeft size={19}/></button>
          <button type="button" className="pyds-next" onClick={onNext}>Next <ChevronRight size={18}/></button>
        </div>
      </div>
    </section>
  );
}

function StructureCard({
  item,
  active,
  onClick,
}: {
  item: (typeof structures)[number];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={"pyds-structure-card pyds-" + item.key + (active ? " is-active" : "")}>
      <div className="pyds-card-heading">
        <span className="pyds-number">{item.number}</span>
        <span className="pyds-type-icon">{item.glyph}</span>
        <span className="pyds-title-block"><strong>{item.name}</strong><small>— {item.subtitle}</small></span>
      </div>
      <p>{item.intro}</p>
      <pre><code>{item.code.map((line, index)=><span key={index}><PythonCodeLine code={line || " "} /></span>)}</code></pre>
      <ul>
        {item.bullets.map((bullet)=><li key={bullet}><span>✓</span>{bullet}</li>)}
      </ul>
    </button>
  );
}

export function PythonDataStructuresConcept() {
  const [active, setActive] = useState<StructureKey>("list");

  return (
    <div className="pyds-concept">
      <header className="pyds-concept-header">
        <BookOpen size={24}/>
        <div>
          <h2>Understand Data Structures for ETL</h2>
          <p>The same order records can be represented in different Python data structures. Each structure has unique strengths<br className="pyds-wide-break"/> that make it useful for specific ETL tasks.</p>
        </div>
      </header>

      <section className="pyds-visual-shell">
        <div className="pyds-source-row">
          <div className="pyds-source-label">
            <span className="pyds-source-icon"><Database size={25}/></span>
            <div><strong>Sample order records</strong><small>(from an ETL pipeline)</small></div>
          </div>

          <pre className="pyds-source-code"><code>
            <span>orders = [</span>
            <span>  <b>{"{'order_id': 1001, 'item': 'Laptop',  'qty': 1},"}</b></span>
            <span>  <b>{"{'order_id': 1002, 'item': 'Mouse',   'qty': 2},"}</b></span>
            <span>  <b>{"{'order_id': 1001, 'item': 'Laptop',  'qty': 1},"}</b> <em># duplicate</em></span>
            <span>  <b>{"{'order_id': 1003, 'item': 'Keyboard','qty': 1}"}</b></span>
            <span>]</span>
          </code></pre>

          <div className="pyds-same-data">
            <strong>Same data,<br/>different structures</strong>
            <p>Choose the right structure based on your ETL operation and performance needs.</p>
          </div>
        </div>

        <div className="pyds-connectors" aria-hidden="true">
          <span className="pyds-conn pyds-conn-1"/><span className="pyds-conn pyds-conn-2"/><span className="pyds-conn pyds-conn-3"/><span className="pyds-conn pyds-conn-4"/>
        </div>

        <div className="pyds-structure-grid">
          {structures.map((item)=><StructureCard key={item.key} item={item} active={active===item.key} onClick={()=>setActive(item.key)}/>)}
        </div>

        <div className="pyds-when-row">
          <div className="pyds-when-title"><span><Target size={21}/></span><div><strong>When to use what?</strong><small>Match the structure to your ETL operation.</small></div></div>
          {structures.map((item, index)=>(
            <div key={item.key} className={"pyds-when-item pyds-" + item.key + (active===item.key ? " is-active" : "")} onMouseEnter={()=>setActive(item.key)}>
              <span className="pyds-type-icon">{item.glyph}</span>
              <span><small>{item.use}</small><strong>→ {item.action}</strong></span>
              {index < structures.length-1 && <ChevronRight className="pyds-when-arrow" size={16}/>}
            </div>
          ))}
        </div>
      </section>

      <div className="pyds-concept-cards">
        {conceptCards.map((item, index)=>(
          <article key={item.title}>
            <span className={"pyds-concept-number pyds-concept-number-" + (index+1)}>{item.number}</span>
            <span className="pyds-concept-icon">{item.icon}</span>
            <div><strong>{item.title}</strong><p>{item.body}</p></div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function PythonDataStructuresCompanion() {
  return (
    <section className="pyds-companion">
      <header><span><Sparkles size={16}/></span><strong>Mithoo · Learning Companion</strong><button type="button" aria-label="Close companion">×</button></header>
      <div className="pyds-companion-body">
        <div>
          <p>Learning Data Structures for ETL?<br/>I’m Mithoo. Let’s make it simple,<br/>one step at a time.</p>
        </div>
        <Image src="/nila-avatar.png" alt="Mithoo learning companion" width={108} height={132}/>
      </div>
      <div className="pyds-companion-actions">
        <button type="button" onClick={()=>toast("Mithoo is ready — open the learning companion for a question.")}>Ask a Question</button>
        <button type="button" onClick={()=>toast("Example: use a dict when you need fast lookup by order_id.")}>Explain with Example</button>
      </div>
    </section>
  );
}
