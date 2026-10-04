import sys,json,tempfile,os,io,contextlib,types,logging
from pathlib import Path
# Pass exported lesson content as the first argument; only trusted shipped code is run.
lessons=json.loads(Path(sys.argv[1]).read_text())
project=Path(__file__).resolve().parent.parent
records=[{'order_id':1,'country':'IN','amount':100},{'order_id':2,'country':'US','amount':50},{'order_id':3,'country':'IN','amount':20}]
def record(code):
 frames=[]; out=io.StringIO(); err=io.StringIO()
 def value(v):
  if isinstance(v,(str,int,float,bool,type(None))): return repr(v)
  if isinstance(v,(list,dict,set,tuple)): return repr(v)
  if type(v).__module__.startswith('pandas'): return v.to_string()
  return None
 def trace(frame,event,arg):
  if frame.f_code.co_filename!='<lesson>' or event not in ('line','call','return','exception'): return trace
  variables={k:value(v) for k,v in frame.f_locals.items() if not k.startswith('__') and value(v) is not None}
  frames.append({'line':frame.f_lineno,'event':event,'scope':frame.f_code.co_name,'variables':variables,'detail':str(arg[1]) if event=='exception' else repr(arg) if event=='return' and not isinstance(arg,types.GeneratorType) else '', 'stdout':out.getvalue(),'stderr':err.getvalue()})
  return trace
 old=os.getcwd()
 with contextlib.nullcontext(str((project/'.python-trace-fixtures').resolve())) as folder:
  Path(folder).mkdir(exist_ok=True)
  os.chdir(folder)
  Path('orders.csv').write_text('order_id,country,amount\n1,IN,100\n2,US,50\n3,IN,20\n')
  Path('orders.json').write_text(json.dumps(records))
  error=''
  try:
   with contextlib.redirect_stdout(out),contextlib.redirect_stderr(err):
    logging.basicConfig(stream=err,level=logging.WARNING,force=True)
    sys.settrace(trace)
    try: exec(compile(code,'<lesson>','exec'),{'__name__':'__main__'})
    except Exception as ex: error=type(ex).__name__+': '+str(ex)
    finally: sys.settrace(None)
  finally: os.chdir(old)
 return {'code':code,'frames':frames,'stdout':out.getvalue(),'stderr':err.getvalue(),'error':error}
result={}
for lesson in lessons:
 result[lesson['id']]={mode:record(lesson['example']['code'] if mode=='example' else lesson['practice']['solution']) for mode in ('example','solution')}
 for mode,r in result[lesson['id']].items():
  assert not r['error'],(lesson['id'],mode,r['error'])
  print(lesson['id'],mode,len(r['frames']),repr(r['stdout']))
assert record('raise ValueError("test")')['error']=='ValueError: test'
(project/'lib/python-execution-traces.json').write_text(json.dumps(result,indent=2))


