"use client";



import { useEffect, useRef, useState, type ReactNode } from "react";

import { createPortal } from "react-dom";

import { X } from "lucide-react";

import { glossary, getGlossaryItem, type GlossaryItem } from "@/lib/glossary";

import { sqlRichTerms } from "@/lib/sql-keywords";

import { useGlossary } from "@/components/glossary";



const items = glossary.filter(item => item.category === "SQL" && item.style === "sql");

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const names = [...new Set(items.flatMap(item => [item.term, ...(item.aliases ?? [])]))].sort((a,b) => b.length-a.length);

const pattern = new RegExp(`(?<![\\p{L}\\p{N}_])(${names.map(escape).join("|")})(?![\\p{L}\\p{N}_])`, "giu");

type Preview = {item: GlossaryItem; left: number; top: number};



function helpItem(term: string, definition: string): GlossaryItem {

  return {id:`ui-${term}`,term,definition,explanation:"",category:"SQL",style:"tool",difficulty:"Easy",interviewFrequency:0,related:[],questions:[],mistakes:[],flow:[]};

}

const fields: Record<string,string> = {

  id:"The identifier for this record. In these sample tables it uniquely identifies a customer or order.",

  customer_id:"The customer linked to this order. Match it to the customer table’s id when joining tables.",

  name:"The customer’s name. This is a text value, not a unique identifier.",

  city:"The city recorded for the customer. Customers can share the same city.",

  age:"The customer’s age in years, stored as a number.",

  signup_date:"The date this customer signed up, displayed as year-month-day.",

  order_date:"The date the order was placed, displayed as year-month-day.",

  amount:"The numeric value of this order. Aggregates such as SUM and AVG calculate across these values.",

  total:"A calculated sum for the group, rather than an individual order amount.",

  total_amount:"The sum of order amounts for this customer or group.",

  order_count:"The number of matching orders counted for the customer or group.",

  rn:"The sequential row number calculated by ROW_NUMBER within its window.",

  rank:"The position assigned by a ranking function according to its window ordering.",

  customer_total:"The total for this customer, repeated on each order when calculated by a window function.",

};

function codeTokenHelp(token: string): GlossaryItem | undefined {
  const known=getGlossaryItem(token);if(known&&items.includes(known))return known;
  if(fields[token.toLowerCase()])return helpItem(token,fields[token.toLowerCase()]);
  if(/^(customers|orders|employees|products|sales|totals|ranked)$/i.test(token))return helpItem(token,`The ${token} relation supplies rows to this query. It may be a sample table or a named intermediate query.`);
  if(/^\d/.test(token))return helpItem(token,"A literal number used by this query, for example as a comparison threshold or row limit.");
  if(/^['"]/.test(token))return helpItem(token,"A quoted text value used in the query. Single quotes delimit string literals; double quotes identify names in standard SQL.");
  const symbols:Record<string,string>={'>':'Greater than: keeps values above the comparison value.','<':'Less than: keeps values below the comparison value.','=':'Equality: compares whether two values match.',',':'Separates expressions, columns, or values.','(':'Starts a function argument list or a grouped expression.',')':'Ends a function argument list or a grouped expression.',';':'Marks the end of the SQL statement.'};
  if(symbols[token])return helpItem(token,symbols[token]);
}
const editorPattern=new RegExp(pattern.source+"|[A-Za-z_][A-Za-z_0-9]*|[0-9]+(?:\\.[0-9]+)?|['\"][^'\"]*['\"]|[><=(),;]",'giu');

function elementHelp(target: HTMLElement): GlossaryItem | undefined {

  const explicit=target.closest<HTMLElement>('[data-sql-help]');

  if(explicit)return helpItem(explicit.getAttribute('aria-label')||explicit.textContent?.trim()||'Help',explicit.dataset.sqlHelp!);

  const cell=target.closest<HTMLTableCellElement>('th,td');

  if(cell){

    const table=cell.closest('table'), header=cell.matches('th')?cell:table?.querySelectorAll('thead th')[cell.cellIndex];

    const field=(header?.textContent||'').trim();

    const description=fields[field.toLowerCase()]||`The ${field||'column'} field in this sample table.`;

    if(cell.matches('th'))return helpItem(field||'Column',description);

    const value=cell.textContent?.trim()||'empty';

    const stage=table?.closest('[class*=result]')?'returned by the query':'in the sample input';

    const color=cell.classList.contains('having-pass-value')?' Green means this aggregate satisfies the current HAVING condition.':cell.classList.contains('having-fail-value')?' Red means this group fails the current HAVING condition and is removed from the final result.':/amount-(low|mid|high|max)/.test(cell.className)?' The background color helps compare amount ranges; the actual query condition determines which records qualify.':'';
    return helpItem(field||'Cell',`${description} This record’s value ${stage} is ${value}.${color}`);

  }

  const block=target.closest<HTMLElement>('h1,h2,h3,h4,[class*=flow]>div,[class*=status],small');

  if(block){

    const title=block.textContent?.trim()||'';

    if(/result/i.test(title))return helpItem(title,"The rows produced by the current query. Compare them with the input to see what was filtered, grouped, or calculated.");

    if(/input|the data/i.test(title))return helpItem(title,"The original sample records used by the query. Reading them helps you predict the result.");

    if(/summary|grouped/i.test(title))return helpItem(title,"An intermediate summary: rows with the same grouping values are combined and aggregate values are calculated.");

    if(/ready|running|updated|rows returned|rows$/i.test(title))return helpItem(title,"This status describes the simulation or result size. If settings changed, run the query to update the result.");

    const description=block.nextElementSibling?.matches('p')?block.nextElementSibling.textContent?.trim():block.querySelector('small,p')?.textContent?.trim();

    if(title&&description&&block.matches('[class*=flow]>div'))return helpItem(title.split(description)[0].trim(),description);

  }


}



/** Hit-test text without rewriting lesson DOM or inserting buttons into buttons. */

function textHit(root: HTMLElement, x: number, y: number): GlossaryItem | undefined {

  const doc = root.ownerDocument as Document & { caretRangeFromPoint?: (x:number,y:number)=>Range|null };

  const caret = doc.caretRangeFromPoint?.(x,y);

  if (!caret || caret.startContainer.nodeType !== Node.TEXT_NODE || !root.contains(caret.startContainer)) return;

  const node = caret.startContainer;

  const parent = node.parentElement;

  if (!parent || parent.closest(".glossary-term,.sql-keyword-guide,input,select,textarea,[contenteditable=true]")) return;

  const block = parent.closest("code,pre,h2,h3,h4,p,li,legend,label,button,th,td,strong") ?? parent;

  const range = doc.createRange();

  range.selectNodeContents(block);

  range.setEnd(node, caret.startOffset);

  const offset = range.toString().length;

  const text = block.textContent ?? "";

  for (const match of text.matchAll(pattern)) {

    if (offset >= match.index! && offset <= match.index! + match[0].length) {

      const item = getGlossaryItem(match[0]);

      if (!item || !items.includes(item)) return;

      // Ordinary connecting prose such as "from" is not a SQL clause.

      if (["FROM","AS","ON","IN","AND","OR","NOT","WHEN","THEN","ELSE","END"].includes(item.term) && match[0] !== item.term && !block.closest("code,pre")) return;

      // Caret APIs return the closest text; reject blank space beside it.

      const char = doc.createRange();

      char.setStart(node, Math.min(caret.startOffset, Math.max(0,(node.textContent?.length ?? 1)-1)));

      char.setEnd(node, Math.min((node.textContent?.length ?? 0),char.startOffset+1));

      const box = char.getBoundingClientRect();

      if (x < box.left-8 || x > box.right+8 || y < box.top-3 || y > box.bottom+3) return;

      return item;

    }

  }

  if(block.closest('code,pre')){

    const content=node.textContent??'';

    for(const match of content.matchAll(/[A-Za-z_][A-Za-z_0-9]*|[0-9]+(?:\.[0-9]+)?|[><=(),;]/g)){

      if(caret.startOffset<match.index!||caret.startOffset>match.index!+match[0].length)continue;

      const token=match[0];

      if(fields[token.toLowerCase()])return helpItem(token,fields[token.toLowerCase()]);

      if(/^(customers|orders|employees|products|sales|totals|ranked)$/i.test(token))return helpItem(token,`The ${token} relation supplies rows to this query. It may be a sample table or a named intermediate query.`);

      if(/^\d/.test(token))return helpItem(token,"A literal number used by this query, for example as a comparison threshold or row limit.");

      const symbols:Record<string,string>={'>':'Greater than: keeps values above the comparison value.','<':'Less than: keeps values below the comparison value.','=':'Equality: compares whether two values match.',',':'Separates expressions, columns, or values.','(':'Starts a function argument list or a grouped expression.',')':'Ends a function argument list or a grouped expression.',';':'Marks the end of the SQL statement.'};

      if(symbols[token])return helpItem(token,symbols[token]);

    }

  }

}



/** Native textareas cannot contain hover triggers; mirror their text for hit testing. */

function editorHit(editor: HTMLTextAreaElement, x:number, y:number): GlossaryItem | undefined {

  const painted = editor.parentElement?.querySelector("pre");

  if (painted) {

    for (const token of painted.querySelectorAll("span")) {

      const item = codeTokenHelp(token.textContent?.trim() ?? "");

      if (item && [...token.getClientRects()].some(rect=>x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom)) return item;

    }

  }

  const style = getComputedStyle(editor), box = editor.getBoundingClientRect();

  const scale = Number.parseFloat(getComputedStyle(document.documentElement).zoom) || 1;

  const mirror = document.createElement("div");

  Object.assign(mirror.style, {position:"fixed",visibility:"hidden",pointerEvents:"none",left:`${box.left/scale}px`,top:`${box.top/scale-editor.scrollTop}px`,width:`${box.width/scale}px`,boxSizing:style.boxSizing,font:style.font,lineHeight:style.lineHeight,padding:style.padding,border:style.border,whiteSpace:"pre-wrap",overflowWrap:style.overflowWrap,letterSpacing:style.letterSpacing,tabSize:style.tabSize});

  let cursor = 0;

  const spans: {span:HTMLSpanElement;item:GlossaryItem}[] = [];

  for(const match of editor.value.matchAll(editorPattern)) {

    mirror.appendChild(document.createTextNode(editor.value.slice(cursor,match.index)));

    const span = document.createElement("span"); span.textContent=match[0]; mirror.appendChild(span);

    const item=codeTokenHelp(match[0]); if(item)spans.push({span,item});

    cursor=match.index!+match[0].length;

  }

  mirror.appendChild(document.createTextNode(editor.value.slice(cursor))); document.body.appendChild(mirror);

  const found = spans.find(({span})=>[...span.getClientRects()].some(rect=>x>=rect.left-editor.scrollLeft*scale&&x<=rect.right-editor.scrollLeft*scale&&y>=rect.top&&y<=rect.bottom))?.item;

  mirror.remove(); return found;

}



export function SqlKeywordHelp({children}:{children:ReactNode}) {

  const root=useRef<HTMLDivElement>(null), timer=useRef<ReturnType<typeof setTimeout>|null>(null);

  const [preview,setPreview]=useState<Preview|null>(null);

  const context=useGlossary();

  const cancel=()=>{if(timer.current)clearTimeout(timer.current);};

  const closeSoon=()=>{cancel();timer.current=setTimeout(()=>setPreview(null),220);};

  useEffect(()=>{
    const lesson=root.current?.closest<HTMLElement>('.lesson-content');
    if(lesson)lesson.scrollTop=0;
    return ()=>{if(timer.current)clearTimeout(timer.current);};
  },[]);

  useEffect(()=>{

    const scope=root.current?.closest<HTMLElement>('.sql-module-page') ?? root.current;

    if(!scope)return;

    const close=()=>{if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setPreview(null),220);};

    const inspect=(event:globalThis.PointerEvent|FocusEvent)=>{

      if(context?.drawerOpen || ('pointerType' in event && event.pointerType==='touch'))return;

      const target=event.target as HTMLElement;
      if(!target.closest('.lesson-content') || target.closest('.lesson-tabs,.sql-progress-edge,.sql-basics-header-toggle,.sql-basics-roll,button,select,input,[role=tab],summary,a')){if(timer.current)clearTimeout(timer.current);setPreview(null);return;}

      if(!scope.contains(target)||target.closest('.sql-keyword-preview,.glossary-term'))return;

      const box=target.getBoundingClientRect();

      const x='clientX' in event?event.clientX:box.left+box.width/2;

      const y='clientY' in event?event.clientY:box.top;

      const keyword=target instanceof HTMLTextAreaElement && target.closest('[class*=editor],[class*=code-shell]')

        ? editorHit(target,x,y) : textHit(scope,x,y);

      // Controls and cells explain their purpose; code and prose explain the term.

      const item=target.closest('button,select,input,th,td,[role=tab],summary')

        ? elementHelp(target)??keyword : keyword??elementHelp(target);

      if(!item){close();return;}

      if(timer.current)clearTimeout(timer.current);

      const rich=item.style==='sql'&&sqlRichTerms.has(item.term);

      const scale=Number.parseFloat(getComputedStyle(document.documentElement).zoom)||1;

      const width=Math.min((rich?360:300)*scale,window.innerWidth-32),height=(rich?260:140)*scale;

      setPreview(current=>current?.item.id===item.id?current:{item,left:Math.max(16,Math.min(x-24,window.innerWidth-width-16))/scale,top:Math.max(16,Math.min(y>height+20?y-height:y+20,window.innerHeight-height-16))/scale});

    };

    const leave=()=>close();

    scope.addEventListener('pointermove',inspect);scope.addEventListener('focusin',inspect);scope.addEventListener('pointerleave',leave);scope.addEventListener('focusout',leave);

    const dismiss=()=>setPreview(null);
    const escapeKey=(event:KeyboardEvent)=>{if(event.key==='Escape')dismiss();};
    scope.addEventListener('keydown',escapeKey);

    window.addEventListener('scroll',dismiss,true);window.addEventListener('resize',dismiss);

    return ()=>{if(timer.current)clearTimeout(timer.current);scope.removeEventListener('pointermove',inspect);scope.removeEventListener('focusin',inspect);scope.removeEventListener('pointerleave',leave);scope.removeEventListener('focusout',leave);scope.removeEventListener('keydown',escapeKey);window.removeEventListener('scroll',dismiss,true);window.removeEventListener('resize',dismiss);};

  },[context]);

  return <div className="sql-keyword-surface" ref={root} onKeyDown={event=>{if(event.key==='Escape')setPreview(null);}}>


    {children}

    {preview && !context?.drawerOpen && createPortal(<div className={`sql-keyword-preview ${(preview.item.style==='sql'&&sqlRichTerms.has(preview.item.term))?'is-rich':'is-simple'}`} style={{left:preview.left,top:preview.top}} role={(preview.item.style==='sql'&&sqlRichTerms.has(preview.item.term))?'dialog':'tooltip'} aria-label={`${preview.item.term} explanation`} onPointerEnter={cancel} onPointerMove={event=>{event.stopPropagation();cancel();}} onPointerOver={event=>event.stopPropagation()} onPointerDown={event=>event.stopPropagation()} onPointerLeave={closeSoon} onFocusCapture={cancel} onBlurCapture={closeSoon} onKeyDown={event=>{if(event.key==='Escape')setPreview(null);}}>

      <header><strong>{preview.item.term}</strong><button aria-label="Close keyword explanation" onClick={()=>setPreview(null)}><X size={16}/></button></header>

      <p>{preview.item.definition}</p>

      {(preview.item.style==='sql'&&sqlRichTerms.has(preview.item.term))&&<><p className="sql-keyword-detail">{preview.item.explanation}</p><button className="sql-keyword-deep-dive" onClick={()=>{context?.open(preview.item);setPreview(null);}}>Open Deep Dive →</button></>}

    </div>,document.body)}

  </div>;

}

