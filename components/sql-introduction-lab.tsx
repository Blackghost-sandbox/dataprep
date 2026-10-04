"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SqlTopicStory } from "@/components/sql-topic-story";
import {
  ArrowRight,
  BookOpen,
  Store,
  Users,
  Box,
  Check,
  CheckCircle2,
  Copy,
  Database,
  FileCode2,
  Lightbulb,
  Play,
  RotateCcw,
  Table2,
  KeyRound,
  UserRound,
  CalendarDays,
  Hash,
  MapPin,
  TriangleAlert,
} from "lucide-react";
import { useCompanion } from "@/components/companion-context";

type Cell = string | number | null;
type Dataset = {
  id: string;
  label: string;
  table: string;
  columns: string[];
  rows: Cell[][];
};

type QueryResult = {
  columns: string[];
  rows: Cell[][];
  elapsed: number;
};

const datasets: Dataset[] = [
  {
    id: "customers",
    label: "Customers (10 rows)",
    table: "customers",
    columns: ["id", "name", "city", "age", "signup_date"],
    rows: [
      [1, "Alice", "Chennai", 28, "2023-01-15"],
      [2, "Bob", "Mumbai", 34, "2023-02-10"],
      [3, "Carol", "Delhi", 25, "2023-02-20"],
      [4, "David", "Bangalore", 41, "2023-03-05"],
      [5, "Eva", "Hyderabad", 31, "2023-03-18"],
      [6, "Frank", "Pune", 38, "2023-04-02"],
      [7, "Grace", "Kolkata", 29, "2023-04-12"],
      [8, "Henry", "Ahmedabad", 36, "2023-05-01"],
      [9, "Irene", "Chennai", 32, "2023-05-14"],
      [10, "Jack", "Mumbai", 27, "2023-06-10"],
    ],
  },
  {
    id: "orders",
    label: "Orders (8 rows)",
    table: "orders",
    columns: ["id", "customer_id", "amount", "status", "order_date"],
    rows: [
      [101, 1, 500, "paid", "2023-06-02"],
      [102, 1, 300, "paid", "2023-06-08"],
      [103, 3, 200, "pending", "2023-06-11"],
      [104, 4, 780, "paid", "2023-06-16"],
      [105, 5, 120, "refunded", "2023-06-19"],
      [106, 7, 450, "paid", "2023-06-22"],
      [107, 9, 640, "pending", "2023-06-24"],
      [108, 10, 90, "paid", "2023-06-29"],
    ],
  },
];

const scenarios: Record<string, string[]> = {
  customers: [
    "SELECT *\nFROM customers;",
    "SELECT id, name\nFROM customers;",
    "SELECT name, city\nFROM customers;",
    "SELECT name, city, age\nFROM customers;",
  ],
  orders: [
    "SELECT *\nFROM orders;",
    "SELECT id, amount\nFROM orders;",
    "SELECT customer_id, status\nFROM orders;",
    "SELECT id, customer_id, amount\nFROM orders;",
  ],
};

function evaluate(query: string): QueryResult {
  const normalized = query.trim().replace(/;\s*$/, "").replace(/\s+/g, " ");
  const match = normalized.match(/^SELECT\s+(.+?)\s+FROM\s+([A-Za-z_][A-Za-z0-9_]*)$/i);
  if (!match) {
    throw new Error("Use the introductory shape SELECT columns FROM table; for this lesson.");
  }

  const [, selectedText, tableNameRaw] = match;
  const tableName = tableNameRaw.toLowerCase();
  const dataset = datasets.find(item => item.table === tableName);
  if (!dataset) {
    throw new Error(`Unknown table “${tableNameRaw}”. Try customers or orders.`);
  }

  const selected = selectedText.trim() === "*"
    ? dataset.columns
    : selectedText.split(",").map(value => value.trim().replace(/^[`"]|[`"]$/g, ""));

  if (!selected.length || selected.some(column => !column)) {
    throw new Error("Choose at least one column after SELECT.");
  }

  const unknown = selected.find(column => !dataset.columns.includes(column));
  if (unknown) {
    throw new Error(`Unknown column “${unknown}” in ${dataset.table}.`);
  }

  const indexes = selected.map(column => dataset.columns.indexOf(column));
  return {
    columns: selected,
    rows: dataset.rows.map(row => indexes.map(index => row[index])),
    elapsed: Math.max(2, Math.min(12, Math.round(dataset.rows.length * 0.8))),
  };
}

function DataTable({ dataset, result = false }: { dataset: Dataset | QueryResult; result?: boolean }) {
  return <div className={"sql-intro-table-wrap" + (result ? " sql-intro-result-table" : "")} tabIndex={0} role="region" aria-label={result ? "Query result table" : "Source data table"}>
    <table>
      <thead><tr>{dataset.columns.map(column => {
        const Icon = column === "id" || column.endsWith("_id") ? KeyRound : column.includes("date") ? CalendarDays : column === "name" ? UserRound : column === "city" ? MapPin : Hash;
        return <th scope="col" key={column}><span className="sql-semantic-header"><Icon size={14} aria-hidden="true"/>{column}</span></th>;
      })}</tr></thead>
      <tbody>{dataset.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, columnIndex) => <td key={dataset.columns[columnIndex]}>{value === null ? <em>NULL</em> : dataset.columns[columnIndex] === "city" ? <span className="sql-city-pill">{value}</span> : value}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}

function SqlHighlight({ value }: { value: string }) {
  const tokens = value.split(/(\bSELECT\b|\bFROM\b|\*|,|;)/gi);
  return <>{tokens.map((token, index) => {
    const upper = token.toUpperCase();
    const className = upper === "SELECT" || upper === "FROM"
      ? "sql-token-keyword"
      : token === "*" ? "sql-token-operator" : token === "," || token === ";" ? "sql-token-punctuation" : "sql-token-name";
    return <span className={className} key={index}>{token}</span>;
  })}</>;
}

export function SqlIntroductionLab() {
  const companion = useCompanion();
  const [datasetId, setDatasetId] = useState("customers");
  const [scenario, setScenario] = useState(0);
  const dataset = useMemo(() => datasets.find(item => item.id === datasetId) ?? datasets[0], [datasetId]);
  const [query, setQuery] = useState(scenarios.customers[0]);
  const [result, setResult] = useState<QueryResult>(() => evaluate(scenarios.customers[0]));
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dirty, setDirty] = useState(false);

  const applyQuery = (nextQuery = query, nextScenario = scenario) => {
    setRunning(true);
    setError("");
    window.setTimeout(() => {
      try {
        const next = evaluate(nextQuery);
        setResult(next);
        setDirty(false);
        companion?.emit({ type: "exercise_correct", lesson: "SQL Introduction", source: "runner" });
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : "Could not run this query.";
        setError(message);
        companion?.emit({ type: "exercise_error", lesson: "SQL Introduction", source: "runner" });
      } finally {
        setRunning(false);
        setScenario(nextScenario);
      }
    }, 160);
  };

  const changeDataset = (nextId: string) => {
    const nextQuery = scenarios[nextId][0];
    setDatasetId(nextId);
    setScenario(0);
    setQuery(nextQuery);
    setError("");
    setResult(evaluate(nextQuery));
    setDirty(false);
  };

  const reset = () => {
    const nextQuery = scenarios[datasetId][0];
    setScenario(0);
    setQuery(nextQuery);
    setResult(evaluate(nextQuery));
    setError("");
    setRunning(false);
    setDirty(false);
  };

  const nextScenario = () => {
    const nextIndex = (scenario + 1) % scenarios[datasetId].length;
    const nextQuery = scenarios[datasetId][nextIndex];
    setQuery(nextQuery);
    setDirty(false);
    applyQuery(nextQuery, nextIndex);
  };

  const quickQuery = (columns: string) => {
    const nextQuery = `SELECT ${columns}\nFROM ${dataset.table};`;
    setQuery(nextQuery);
    setDirty(false);
    applyQuery(nextQuery, scenario);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(query);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const lines = Math.max(2, query.split("\n").length);

  return <><SqlBasicsGuide/><section id="sql-first-exploration" className="sql-intro-lab" aria-label="Interactive SQL introduction">
    <header className="sql-intro-lab-header">
      <div className="sql-intro-lab-title">
        <span className="sql-intro-lab-icon"><Box size={24}/></span>
        <div><h2>Interactive Exploration</h2><p>Explore a real table, write your first SQL query, and see how SQL returns the data you want.</p></div>
      </div>
      <div className="sql-intro-controls">
        <label className="sql-intro-dataset"><span>Dataset</span><select aria-label="Dataset" value={datasetId} onChange={event => changeDataset(event.target.value)}>{datasets.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <button type="button" className="sql-intro-run" disabled={running} onClick={() => applyQuery()}><Play size={16} fill="currentColor"/>{running ? "Running…" : "Run Query"}</button>
        <button type="button" className="sql-intro-reset" onClick={reset}><RotateCcw size={15}/>Reset</button>
        <button type="button" className="sql-intro-next" onClick={nextScenario}>Next Scenario <ArrowRight size={16}/></button>
      </div>
    </header>

    <div className="sql-intro-workspace">
      <article className="sql-intro-stage">
        <div className="sql-intro-stage-heading"><span>1.</span><div><h3>The data</h3><p>This is the source table we will query.</p></div></div>
        <DataTable dataset={dataset}/>
      </article>

      <article className="sql-intro-stage sql-intro-query-stage">
        <div className="sql-intro-stage-heading"><Database size={17}/><div><h3>2. Write your first query</h3><p>Select all columns from the {dataset.table} table.</p></div></div>
        <div className="sql-intro-editor-shell">
          <div className="sql-intro-editor-top"><span><Database size={14}/> SQL</span><button type="button" onClick={copy}>{copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? "Copied" : "Copy"}</button></div>
          <div className="sql-intro-editor">
            <div className="sql-intro-line-numbers" aria-hidden="true">{Array.from({ length: lines }, (_, index) => <span key={index}>{index + 1}</span>)}</div>
            <pre aria-hidden="true"><code><SqlHighlight value={query}/></code></pre>
            <textarea
              aria-label="SQL query editor"
              spellCheck={false}
              value={query}
              onChange={event => { setQuery(event.target.value); setDirty(true); }}
            />
          </div>
        </div>
        <div className="sql-intro-query-chips" aria-label="Suggested queries">
          {["*", "id, name", "name, city"].map(columns => <button type="button" onClick={() => quickQuery(columns)} key={columns}>SELECT {columns}</button>)}
        </div>
        {dirty && <p className="sql-intro-ready" role="status">Query changed · choose Run Query to update the result.</p>}
      </article>

      <article className="sql-intro-stage sql-intro-result-stage">
        <div className="sql-intro-stage-heading sql-intro-result-heading"><CheckCircle2 size={21}/><div><h3>3. Query result</h3><p aria-live="polite">{error ? "Fix the query and run it again." : running ? "Executing query…" : `${result.rows.length} rows returned in ${result.elapsed} ms`}</p></div></div>
        {error ? <div className="sql-intro-error" role="alert"><TriangleAlert size={20}/><div><strong>Query error</strong><p>{error}</p></div></div> : <DataTable dataset={result} result/>}
      </article>
    </div>

    <div className="sql-intro-bottom">
      <section className="sql-intro-how">
        <h3><Lightbulb size={21}/>How it works?</h3>
        <div className="sql-intro-flow">
          <div><span className="sql-intro-flow-icon"><Database size={23}/></span><strong>Table rows</strong><p>Data is stored in rows<br/>and columns</p></div>
          <ArrowRight className="sql-intro-flow-arrow" size={22}/>
          <div><span className="sql-intro-flow-icon"><FileCode2 size={23}/></span><strong>SQL request</strong><p>You specify what<br/>columns/rows you want</p></div>
          <ArrowRight className="sql-intro-flow-arrow" size={22}/>
          <div><span className="sql-intro-flow-icon sql-intro-flow-success"><Table2 size={23}/></span><strong>Result rows</strong><p>Only the requested<br/>data is returned</p></div>
        </div>
      </section>

      <section className="sql-intro-takeaways">
        <h3><Table2 size={21}/>Key takeaways</h3>
        <ul>
          <li><CheckCircle2 size={17}/>A table stores data in rows and columns.</li>
          <li><CheckCircle2 size={17}/>SELECT chooses which columns to return.</li>
          <li><CheckCircle2 size={17}/>It does not modify the original data.</li>
          <li><CheckCircle2 size={17}/>It does not remove duplicate rows automatically.</li>
        </ul>
      </section>
    </div>
  </section></>;
}

type SqlBasicsDefinition={term:string;definition:string;plain:string;interview:string;question:string;answer:string};
const sqlBasicsDefinitions:SqlBasicsDefinition[][]=[
  [
    {term:'SQL',definition:'SQL stands for Structured Query Language. It is used to retrieve and manage data in relational databases.',plain:'You tell the database what data you want or what change you want to make.',interview:'SQL is used to query and manage relational data. For example, I can use SELECT to retrieve customer names from a customers table.',question:'What is SQL, and what is it used for?',answer:'Structured Query Language. It is used to retrieve and manage data in relational databases.'},
    {term:'Database',definition:'A database is an organized collection of data that can be accessed and managed.',plain:'The shop needs a reliable place to keep its customer information.',interview:'A database stores organized data. Applications use a database management system to read and update that data.',question:'Is SQL itself a database?',answer:'No. SQL is a language. A database holds the data, and a database management system processes SQL statements.'},
    {term:'Relational database',definition:'A relational database stores data in tables. Keys connect related records across tables.',plain:'Customers can be in one table and orders in another. A customer ID connects an order to its customer.',interview:'A relational database stores data in tables of rows and columns. Primary and foreign keys identify records and represent relationships between tables.',question:'How can customers and orders be related?',answer:'An orders table can store a customer_id that refers to a customer’s primary key in the customers table.'},
  ],
  [
    {term:'Table',definition:'A table organizes related data into rows and named columns.',plain:'The customers table gives every customer record the same structure: id, name, and city.',interview:'A table represents a set of related records. Its columns describe the attributes, and its rows contain individual records.',question:'What is the difference between a table and a database?',answer:'A table holds a set of related records. A relational database can contain many tables, such as customers and orders.'},
    {term:'Row',definition:'A row is one record in a table, containing values for that table’s columns.',plain:'Alice’s ID, name, and city together make one customer row.',interview:'A row represents one record. For example, one row in a customers table contains the details of one customer.',question:'If a table has 10 customers, how many customer rows does it have?',answer:'10 rows, assuming each customer is represented by one record.'},
    {term:'Column',definition:'A column is a named attribute, such as city. Its data type controls the values it stores.',plain:'The city column stores a city value for each customer. One value at a row and column intersection is a cell.',interview:'A column represents an attribute, such as name or age. Each row provides a value for that attribute, subject to its type and constraints.',question:'How is a column different from a row?',answer:'A column describes one attribute across records. A row contains the attribute values for one record.'},
  ],
  [
    {term:'Query',definition:'A query is a request to retrieve data from a database. In SQL, SELECT statements express those requests.',plain:'“Show every customer” is your request. SELECT * FROM customers; expresses it in SQL.',interview:'A query requests data from a database. A SELECT query specifies the columns and tables to read and can filter, group, or sort the results.',question:'What does SELECT * FROM customers; request?',answer:'All columns and all rows from the customers table. It does not guarantee a particular row order.'},
    {term:'SELECT',definition:'SELECT is the SQL statement used to retrieve data. FROM identifies the table to read, and * means all columns.',plain:'SELECT chooses what to return. FROM says where to find it. WHERE can keep only matching rows.',interview:'SELECT retrieves data without modifying the source records. For example, SELECT name FROM customers returns the name column from that table.',question:'Does running this SELECT change the original customer records?',answer:'No. This SELECT reads the records and returns a result. It does not insert, update, or delete them.'},
  ],
  [
    {term:'Interview recap',definition:'SQL is a language for retrieving and managing data in relational databases, where data is organized into tables of rows and columns.',plain:'Database → tables → records. SQL is how you ask for the data you need.',interview:'SQL stands for Structured Query Language. It queries and manages relational data. Tables contain rows (records) and columns (attributes). For example, SELECT name FROM customers retrieves customer names without changing the records.',question:'Explain SQL, tables, rows, and columns in your own words. Give one query example.',answer:'Name the language and its purpose, explain that tables organize records into rows and attributes into columns, then give a SELECT example. You do not need to repeat the suggested wording exactly.'},
  ],
];
function SqlDefinitionLesson({scene}:{scene:number}){
  const entries=sqlBasicsDefinitions[scene];
  const main=entries[0];
  return <aside className="sql-definition-panel sql-definition-overview" aria-label="Definitions and interview practice">
    <div className="sql-definition-heading"><BookOpen size={21}/><div><span>UNDERSTAND IT. SAY IT.</span><h3>Read it. Make it yours.</h3></div></div>
    <section className="sql-definition-core"><span>THE BASICS</span><dl>{entries.map(item=><div key={item.term}><dt>{item.term}</dt><dd>{item.definition}</dd></div>)}</dl></section>
    <section className="sql-definition-plain"><span>IN PLAIN WORDS</span><p>{main.plain}</p></section>
    <section className="sql-definition-interview"><span>AN INTERVIEW ANSWER</span><p>{main.interview}</p></section>
    <section className="sql-definition-recall"><span>TRY SAYING IT ALOUD</span><p>{scene===0?'What is SQL? How is it different from a database?':scene===1?'Explain a table, a row, and a column using one customer as your example.':main.question}</p></section>
  </aside>;
}

function SqlBeginnerIntroduction({onStart}:{onStart:()=>void}){
  const [scene,setScene]=useState<0|1|2|3>(0);
  const [highlight,setHighlight]=useState<'row'|'column'|'cell'>('row');
  const [running,setRunning]=useState(false);
  const [onlyChennai,setOnlyChennai]=useState(false);
  const [customer,setCustomer]=useState(0);
  const customers=[['Alice','Chennai'],['Bob','Mumbai'],['Carol','Delhi']];
  const [recordVisit,setRecordVisit]=useState(0);
  const selectCustomer=(index:number)=>{setCustomer(index);setRecordVisit(value=>value+1);};
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
  const definitions={row:`One row tells us about one customer. Here, it is ${customers[customer][0]}.`,column:'One column stores one kind of detail. This column contains cities.',cell:`One cell holds one value. ${customers[customer][1]} is ${customers[customer][0]}’s city.`};
  const run=()=>{setRunning(true);timer.current=setTimeout(()=>{setRunning(false);setScene(3);},1400);};
  return <section className="sql-story" aria-label="Ask the database animated introduction">
    <header className="sql-story-header"><button className="sql-story-mobile-exit" onClick={onStart}>Back to lesson</button><span>YOUR FIRST SQL STORY</span><div className="sql-story-steps" aria-label="Story progress">{['Collect','Organize','Ask','Discover'].map((label,index)=><span key={label} aria-current={scene===index?'step':undefined} className={scene>=index?'is-reached':''}>{index+1}<small>{label}</small></span>)}</div></header>
    <div className="sql-story-title"><span className="sql-story-chapter">0{scene+1} / A LITTLE SHOP, A LOT OF DATA</span><h2>{['Every customer has a story.','Give those stories a structure.','Ask a question. Get an answer.','You just asked a database.'][scene]}</h2><p>{['An online shop needs to remember who its customers are. A database keeps that information organized.','A table organizes records into rows and columns. Click below to see how the pieces fit together.','SQL stands for Structured Query Language. It lets you ask a database questions using clear instructions.','The database read your query and returned the customer records. Your first SQL query is complete.'][scene]}</p></div>
    <div className="sql-story-learning-layout"><div key={scene} className={`sql-story-stage scene-${scene} ${running?'is-running':''}`} aria-live="polite">
      {scene===0&&<div className="sql-story-collection"><svg className="sql-story-network" viewBox="0 0 1200 500" aria-hidden="true"><defs><linearGradient id="sql-story-route"><stop stopColor="#ae8aee"/><stop offset="1" stopColor="#51cfac"/></linearGradient><filter id="sql-story-glow"><feGaussianBlur stdDeviation="4"/></filter></defs><path className="sql-story-network-glow" d="M160 260 C310 260 330 150 530 220 S810 360 1010 220"/><path className="sql-story-network-line" d="M160 260 C310 260 330 150 530 220 S810 360 1010 220"/><g className="sql-story-network-packets">{[0,1,2].map(index=><circle key={index} r="6" fill={index===1?'#d1b4ff':'#70d7bb'}><animateMotion dur="4s" begin={`${index*-1.3}s`} repeatCount="indefinite" path="M160 260 C310 260 330 150 530 220 S810 360 1010 220"/></circle>)}</g><circle className="sql-story-network-node" cx="160" cy="260" r="12"/><circle className="sql-story-network-node" cx="1010" cy="220" r="12"/></svg><div className="sql-story-world-label"><span>01</span> A RECORD’S JOURNEY <i/> Shop → customer record → database</div><div className="sql-story-shop"><div className="sql-story-city" aria-hidden="true"><i/><i/><i/><i/><i/><span>DATA DISTRICT</span></div><div className="sql-story-shop-spark">OPEN · COME ON IN</div><div className="sql-story-building"><div className="sql-story-awning" aria-hidden="true"><i/><i/><i/><i/><i/></div><Store size={88} strokeWidth={1.25}/><span>THE LITTLE SHOP</span><div className="sql-story-shop-door" aria-hidden="true"/></div><div className="sql-story-receipt"><span>NEW CUSTOMER</span><strong>{customers[customer][0]}</strong><small>City: {customers[customer][1]}</small><i>Saved as a record</i></div><span className="sql-story-scene-label">Every visit leaves a little data</span></div><div className="sql-story-card-stream"><span className="sql-story-stream-label">PICK A CUSTOMER · FOLLOW THE RECORD</span>{customers.map(([name,city],index)=><button type="button" aria-label={`Follow ${name}’s customer record`} data-sql-help={`Send ${name}’s name, city, and ID into the database preview. These three values form one customer record.`} aria-pressed={customer===index} onClick={()=>selectCustomer(index)} className={`sql-story-person ${customer===index?'is-selected':''}`} key={name} style={{'--card-index':index} as React.CSSProperties}><span>{name.charAt(0)}</span><div><strong>{name}</strong><small>{city}</small></div><span className="sql-story-passport-stamp" aria-hidden="true">CHECKED IN</span></button>)}<div className="sql-story-trail"><i/><i/><i/><i/><i/></div></div><div key={recordVisit} className="sql-story-record-flight" aria-hidden="true"><span>{customers[customer][0].charAt(0)}</span><strong>{customers[customer][0]}</strong><small>{customers[customer][1]}</small></div><div className="sql-story-database"><div className="sql-story-db-terminal"><i/><i/><i/><span>RECORDS ONLINE</span></div><div className="sql-story-server-halo" aria-hidden="true"><i/><i/><i/></div><Database size={100} strokeWidth={1.2}/><strong>Database</strong><span>A home for organized data</span><div key={recordVisit} className="sql-story-record-preview" aria-live="polite"><span>ONE CUSTOMER RECORD</span><dl><div><dt>id</dt><dd>{customer+1}</dd></div><div><dt>name</dt><dd>{customers[customer][0]}</dd></div><div><dt>city</dt><dd>{customers[customer][1]}</dd></div></dl></div><div className="sql-story-orbit"/><span className="sql-story-db-note">Names</span><span className="sql-story-db-note note-two">Cities</span><span className="sql-story-db-note note-three">Customer IDs</span></div></div>}
      {scene===1&&<div className="sql-story-organize"><div className="sql-story-table-caption">THREE PEOPLE. ONE SHARED STRUCTURE.</div><div className="sql-story-table-heading"><Table2 size={22}/><strong>customers</strong><span>3 records · 3 details each</span></div><div className="sql-story-table"><div className="sql-story-table-scan" aria-hidden="true"/><table aria-label="Story customer table"><thead><tr>{['id','name','city'].map((name,index)=><th key={name} className={highlight==='column'&&index===2?'spotlight':''}>{name}</th>)}</tr></thead><tbody>{[[1,'Alice','Chennai'],[2,'Bob','Mumbai'],[3,'Carol','Delhi']].map((row,index)=><tr key={index}>{row.map((value,column)=><td key={column} className={(highlight==='row'&&index===customer)||(highlight==='column'&&column===2)||(highlight==='cell'&&index===customer&&column===2)?'spotlight':'subdued'}>{value}</td>)}</tr>)}</tbody></table></div><div className="sql-story-structure-controls">{(['row','column','cell'] as const).map(kind=><button key={kind} aria-pressed={highlight===kind} onClick={()=>setHighlight(kind)}>{kind.charAt(0).toUpperCase()+kind.slice(1)}</button>)}</div><p className="sql-story-structure-definition">{definitions[highlight]}</p><div className="sql-story-row-picker" aria-label="Choose a customer row">{customers.map(([name],index)=><button key={name} data-sql-help={`Highlight ${name}’s row, or the city value inside it. Each row represents one customer.`} aria-pressed={customer===index} onClick={()=>selectCustomer(index)}>{name}</button>)}</div></div>}
      {(scene===2||scene===3)&&<div className="sql-story-query-scene"><div className="sql-story-question"><span>YOUR QUESTION</span><strong>{onlyChennai?"“Show customers from Chennai.”":"“Show every customer.”"}</strong><ArrowRight size={24}/></div><div className="sql-story-code"><div className="sql-story-terminal-chrome" aria-hidden="true"><i/><i/><i/><span>query.sql</span></div><span className="sql-story-code-label">THE SAME QUESTION, IN SQL</span><code><b>SELECT</b> * <b>FROM</b> customers{onlyChennai&&<><br/><b>WHERE</b> city = <em>&apos;Chennai&apos;</em></>};</code><div className="sql-story-code-meaning"><span><b>SELECT</b> Choose what to return</span><span><b>*</b> Every column</span><span><b>FROM</b> Which table to read</span>{onlyChennai&&<span><b>WHERE</b> Keep matching records</span>}</div></div>{scene===2&&<div className="sql-story-question-options" aria-label="Choose a question"><button disabled={running} aria-pressed={!onlyChennai} onClick={()=>setOnlyChennai(false)}>Everyone</button><button disabled={running} aria-pressed={onlyChennai} onClick={()=>setOnlyChennai(true)}>Only Chennai <span>Try a different question</span></button></div>}<div className="sql-story-query-flow"><div className="sql-story-query-chip"><FileCode2 size={25}/><span>{scene===3?'Query sent':'Your query'}</span></div><div className="sql-story-query-track"><span/><span/><span/></div><div className="sql-story-query-db"><div className="sql-story-db-scanner" aria-hidden="true"/><Database size={50}/><span>Database</span></div><div className="sql-story-query-track"><span/><span/><span/></div><div className={`sql-story-output ${scene===3?'is-ready':''}`}><Users size={25}/><strong>{scene===3?(onlyChennai?'1 customer returned':'3 customers returned'):'Result'}</strong></div></div>{scene===3?<div className="sql-story-results">{[['Alice','Chennai'],['Bob','Mumbai'],['Carol','Delhi']].filter(([,city])=>!onlyChennai||city==='Chennai').map(([name,city],index)=><div key={name} style={{'--card-index':index} as React.CSSProperties}><CheckCircle2 size={18}/><strong>{name}</strong><span>{city}</span></div>)}<div className="sql-story-success-seal"><CheckCircle2 size={22}/><span>FIRST QUERY COMPLETE</span></div><div className="sql-story-confetti" aria-hidden="true">{Array.from({length:12},(_,index)=><i key={index} style={{'--particle':index} as React.CSSProperties}/>)}</div><p>The original records are unchanged. This query only reads them.</p></div>:<p className="sql-story-execution-status">{running?'Your query is travelling to the database…':'Ready to ask? Run the query and watch the records come back.'}</p>}</div>}
    </div>
    <SqlDefinitionLesson key={`definition-${scene}`} scene={scene}/></div>
    <footer className="sql-story-footer"><button className="sql-story-back" disabled={scene===0||running} onClick={()=>setScene((scene-1) as 0|1|2)}>Back</button><span>{['Data has a home.','Tables give data structure.','SQL turns questions into instructions.','You are ready to explore.'][scene]}</span><button className="sql-story-next" disabled={running} onClick={()=>scene===2?run():scene===3?onStart():setScene((scene+1) as 1|2)}>{scene===0?'See how data is organized':scene===1?'Ask the database':scene===2?(running?'Reading records…':'Run my first query'):'Explore it yourself'}<ArrowRight size={18}/></button></footer>
  </section>;
}

const SQL_BASICS_KEY='dataprep-sql-story-read-v1';
export function SqlBasicsGuide({lessonId="introduction"}:{lessonId?:string}){
  const storageKey=lessonId==="introduction"?SQL_BASICS_KEY:`dataprep-sql-story-${lessonId}-read-v1`;
  const guideId=`sql-basics-guide-${lessonId}`;
  const [open,setOpen]=useState(false);
  const [hero,setHero]=useState<HTMLElement|null>(null);
  const guide=useRef<HTMLDivElement>(null);
  const toggle=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    // The saved preference and header destination are available after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHero(document.querySelector<HTMLElement>('.sql-module-page .lesson-hero'));
    try{setOpen(localStorage.getItem(storageKey)!=='true');}catch{setOpen(true);}
  },[storageKey]);
  useEffect(()=>{if(guide.current)guide.current.inert=!open;},[open]);
  const collapse=()=>{
    try{localStorage.setItem(storageKey,'true');}catch{}
    toggle.current?.focus();
    setOpen(false);
    guide.current?.closest<HTMLElement>('.lesson-content')?.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  };
  const control=<button ref={toggle} className="sql-basics-header-toggle" aria-expanded={open} aria-controls={guideId} onClick={()=>open?collapse():setOpen(true)}><FileCode2 size={16} aria-hidden="true"/>{open?'Collapse basics':'Review basics'}<ArrowRight size={16} aria-hidden="true"/></button>;
  return <>
    {hero?createPortal(control,hero):control}
    <div className={`sql-basics-roll ${open?'is-open':''}`} id={guideId} aria-hidden={!open}>
      <div ref={guide} className="sql-basics-roll-inner"><div className="sql-basics-roll-content">{lessonId==="introduction"?<SqlBeginnerIntroduction key={open ? "active" : "inactive"} onStart={collapse}/>:<SqlTopicStory key={`${lessonId}-${open}`} lessonId={lessonId} onStart={collapse}/>}</div></div>
    </div>
  </>;
}
