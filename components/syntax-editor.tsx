"use client";
import {useRef,type TextareaHTMLAttributes} from "react";
const keywords=/^(?:select|from|where|group|by|having|order|limit|join|left|right|inner|outer|on|as|with|distinct|union|all|case|when|then|else|end|is|null|not|and|or|in|over|partition|asc|desc|insert|into|values|update|set|delete|create|table|def|class|return|if|elif|for|while|try|except|finally|raise|import|print|yield|lambda|pass|break|continue|true|false|none|async|await|function|const|let|var|export)$/i;
export function SyntaxText({code}:{code:string}){return <>{code.split(/(--[^\n]*|#[^\n]*|\/\/[^\n]*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z_0-9]*\b)/g).map((token,i)=><span key={i} className={/^(--|#|\/\/)/.test(token)?"syntax-comment":/^["']/.test(token)?"syntax-string":/^\d/.test(token)?"syntax-number":keywords.test(token)?"syntax-keyword":/^(sum|count|avg|min|max|coalesce|row_number|rank|dense_rank|len|range|str|int|float)$/i.test(token)?"syntax-function":undefined}>{token}</span>)}</>}
export function CodeEditor(props:TextareaHTMLAttributes<HTMLTextAreaElement>){
 const backdrop=useRef<HTMLPreElement>(null);const code=typeof props.value==="string"?props.value:"";
 return <div className="syntax-editor"><pre ref={backdrop} aria-hidden="true"><code><SyntaxText code={code}/>{"\n"}</code></pre><textarea {...props} spellCheck={false} onScroll={event=>{if(backdrop.current){backdrop.current.scrollTop=event.currentTarget.scrollTop;backdrop.current.scrollLeft=event.currentTarget.scrollLeft;}props.onScroll?.(event);}}/></div>;
}
