const fs=require('fs'),ts=require('typescript'),vm=require('vm'),assert=require('assert/strict');
const base=require('path').resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(base+'/lib/python-execution-traces.json','utf8'));
const slots=[];let cursor=0,effects=[],pending=new Map(),seq=0,reduced=false;
const scope=new EventTarget(),win=new EventTarget();
const react={useState:(initial)=>{let i=cursor++;if(!(i in slots))slots[i]=initial;return[slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v]},useRef:(initial)=>{let i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i]},useEffect:f=>{let i=cursor++;if(!(i in slots)){slots[i]=true;effects.push(f)}}};
const jsx=(type,props)=>({type,props});let loaded={exports:{}};
const context={require:n=>n==='react'?react:n==='react/jsx-runtime'?{jsx,jsxs:jsx}:n==='lucide-react'?{}:data,module:loaded,exports:loaded.exports,window:win,matchMedia:()=>({matches:reduced}),setTimeout:f=>{pending.set(++seq,f);return seq},clearTimeout:id=>pending.delete(id)};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(base+'/components/python-execution-visual.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,context);
function render(){cursor=0;return loaded.exports.PythonExecutionVisual({lessonId:'py-quiz',code:data['py-quiz'].example.code})}
function nodes(tree){return tree&&typeof tree==='object'?[tree,...[].concat(tree.props?.children??[]).flatMap(nodes)]:[]}
let tree=render();tree.props.ref.current={closest:()=>scope,contains:()=>false};let cleanup=effects[0]();
function button(name){return nodes(render()).find(n=>n.type==='button'&&JSON.stringify(n.props.children).includes(name)).props.onClick}
button('Run Code')();assert.equal(render().props.className,'py-execution execution-playing');button('Pause')();assert.equal(render().props.className,'py-execution execution-paused');assert.equal(pending.size,0);button('Resume')();assert.equal(render().props.className,'py-execution execution-playing');let stale=[...pending.values()][0];button('Reset')();stale();assert.equal(render().props.className,'py-execution execution-idle');assert.equal(pending.size,0);
button('Run Code')();win.dispatchEvent(new Event('hashchange'));assert.equal(pending.size,0);assert.equal(render().props.className,'py-execution execution-idle');
button('Run Code')();scope.dispatchEvent(new Event('input'));assert.equal(pending.size,0);
button('Run Code')();scope.dispatchEvent(new Event('change'));assert.equal(pending.size,0);
button('Run Code')();stale=[...pending.values()][0];button('Run Code')();let snapshot=JSON.stringify(slots);stale();assert.equal(JSON.stringify(slots),snapshot);
while(pending.size){let [id,f]=pending.entries().next().value;pending.delete(id);f()};assert.equal(render().props.className,'py-execution execution-done');assert(JSON.stringify(render()).includes('[60, 40]'));
reduced=true;button('Run Code')();assert.equal(pending.size,0);assert.equal(render().props.className,'py-execution execution-done');
data['py-quiz'].example.error='ValueError: invalid test input';button('Run Code')();assert.equal(render().props.className,'py-execution execution-error');assert(JSON.stringify(render()).includes('ValueError: invalid test input'));data['py-quiz'].example.error='';
reduced=false;button('Run Code')();stale=[...pending.values()][0];cleanup();snapshot=JSON.stringify(slots);stale();assert.equal(JSON.stringify(slots),snapshot);assert.equal(pending.size,0);
console.log('PASS: reset, edits, scenario changes, reruns, navigation, unmount, completion/output reveal and reduced-motion cancellation.');



