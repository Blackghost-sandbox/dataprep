"use client";
import {SyntaxText} from "@/components/syntax-editor";
import {useCloudMotion} from "@/components/cloud-motion";

import {useMemo,useState} from "react";
import {
  Box, CheckCircle2, ChevronLeft, ChevronRight, Cloud, Database, Eye, EyeOff,
  FileCode2, FolderKey, GraduationCap, KeyRound, LockKeyhole, Play, RotateCcw,
  ShieldCheck, UserRound, XCircle
} from "lucide-react";
import {
  defaultPermissions, evaluateSecurityAccess, permissionLabels, policyDocument,
  secretMetadata, secretProviders, securityResources, securityScenarios,
  type SecretProviderId, type SecurityIdentityType, type SecurityPermissionId,
  type SecurityResourceId, type SecurityScenarioId
} from "@/lib/cloud-identity-security-simulation";

const secretValue="ProdDb#2026!";

function SecurityCloudArtwork(){
  return <div className="sec-hero-art" aria-label="Cloud identity, permission, secret and audit controls">
    <div className="sec-cloud sec-aws"><Cloud size={57}/><strong>AWS</strong></div>
    <div className="sec-cloud sec-gcp"><Cloud size={57}/><strong>G</strong></div>
    <div className="sec-cloud sec-azure"><Cloud size={57}/><strong>A</strong></div>
    <div className="sec-shield"><ShieldCheck size={44}/><LockKeyhole size={18}/></div>
    <div className="sec-art-lines" aria-hidden="true"><span/><span/><span/><span/></div>
    <div className="sec-art-card identity"><UserRound size={17}/><strong>Identity</strong><small>(Who)</small></div>
    <div className="sec-art-card permissions"><KeyRound size={17}/><strong>Permissions</strong><small>(What)</small></div>
    <div className="sec-art-card secrets"><FolderKey size={17}/><strong>Secrets</strong><small>(Securely)</small></div>
    <div className="sec-art-card audit"><FileCode2 size={17}/><strong>Audit</strong><small>(Track)</small></div>
  </div>;
}

export function CloudIdentitySecurityHero({description,minutes,currentLesson,total,onPrevious,onNext}:{
  description:string;minutes:number;currentLesson:number;total:number;onPrevious:()=>void;onNext:()=>void;
}){
  return <section className="sec-hero">
    <div className="sec-breadcrumb"><span>Cloud Platforms</span><ChevronRight size={14}/><strong>Identity, Security &amp; Secrets</strong></div>
    <div className="sec-hero-grid">
      <div className="sec-hero-copy">
        <div className="sec-title-row">
          <span className="sec-title-icon"><LockKeyhole size={31}/></span>
          <div><h1>Identity, Security &amp; Secrets</h1><p>{description}</p></div>
        </div>
        <div className="sec-meta">
          <span><Box size={14}/>{minutes} min</span>
          <span><GraduationCap size={14}/>Lesson {currentLesson+1}/{total}</span>
          <span className="is-intermediate"><ShieldCheck size={13}/>Intermediate</span>
        </div>
      </div>
      <div className="sec-hero-right">
        <div className="sec-hero-nav"><button onClick={onPrevious} disabled={currentLesson===0}><ChevronLeft size={16}/>Previous</button><button className="is-next" onClick={onNext} disabled={currentLesson===total-1}>Next<ChevronRight size={16}/></button></div>
        <SecurityCloudArtwork/>
      </div>
    </div>
  </section>;
}

function ResourceIcon({id}:{id:SecurityResourceId}){
  if(id==="glue-catalog")return <Database size={16}/>;
  if(id==="redshift")return <Box size={16}/>;
  if(id==="db-secret")return <FolderKey size={16}/>;
  return <Database size={16}/>;
}

export function CloudIdentitySecurityLab(){
 const cloudMotion=useCloudMotion(".sec-stage");
  const [scenario,setScenario]=useState<SecurityScenarioId>("least-privilege");
  const [identityType,setIdentityType]=useState<SecurityIdentityType>("iam-user");
  const [user,setUser]=useState("data-analyst");
  const [group,setGroup]=useState("analysts");
  const [permissions,setPermissions]=useState<Record<SecurityPermissionId,boolean>>(()=>defaultPermissions());
  const [result,setResult]=useState(()=>evaluateSecurityAccess(defaultPermissions(),"least-privilege"));
  const [secretProvider,setSecretProvider]=useState<SecretProviderId>("aws");
  const [showSecret,setShowSecret]=useState(false);
  const [secretRetrieved,setSecretRetrieved]=useState(false);
  const [fullPolicy,setFullPolicy]=useState(false);

  const policy=useMemo(()=>policyDocument(permissions),[permissions]);
  const secretInfo=useMemo(()=>secretMetadata(secretProvider),[secretProvider]);
  const identityLabel=identityType==="iam-user"?user:identityType==="service-account"?"orders-etl-service":"analytics-read-role";

  const togglePermission=(id:SecurityPermissionId)=>{
    setPermissions(previous=>({...previous,[id]:!previous[id]}));
  };

  const run=()=>{
    if(scenario==="service-pipeline")setIdentityType("service-account");
    const next=evaluateSecurityAccess(permissions,scenario);
    setResult({...next,audit:next.audit.map(event=>event.id==="login"?{...event,detail:`(${identityLabel})`}:event)});
  };

  const reset=()=>{
    const defaults=defaultPermissions();
    setScenario("least-privilege");setIdentityType("iam-user");setUser("data-analyst");setGroup("analysts");
    setPermissions(defaults);setResult(evaluateSecurityAccess(defaults,"least-privilege"));
    setSecretProvider("aws");setShowSecret(false);setSecretRetrieved(false);setFullPolicy(false);
  };

  const retrieveSecret=()=>{
    const authorized=permissions["secrets-read"]||permissions.admin;
    setSecretRetrieved(authorized);setShowSecret(authorized);
    setResult(previous=>({...previous,status:authorized?"Secret retrieved from managed secret storage.":"Secret retrieval denied: missing secrets permission.",audit:[
      ...previous.audit,
      {id:"secret-manual",time:"10:24:15",title:"secretsmanager:GetSecretValue",detail:"db-password",outcome:authorized?"allowed":"denied"}
    ]}));
  };

  const resultJson=JSON.stringify({
    user:identityLabel,
    action:result.action,
    resource:result.resource,
    effect:result.effect,
    reason:result.reason,
  },null,2);

  return <section {...cloudMotion} className="sec-lab" aria-label="Identity security and secrets interactive simulation">
    <header className="sec-toolbar">
      <div className="sec-sim-title"><span><Play size={20} fill="currentColor"/></span><div><h2>Run Simulation</h2><p>See how identity, permissions, and secrets control access to a cloud data pipeline.</p></div></div>
      <div className="sec-toolbar-actions">
        <label><span>Scenario</span><select value={scenario} onChange={e=>setScenario(e.target.value as SecurityScenarioId)}>{securityScenarios.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <button className="sec-run" onClick={run}><Play size={15} fill="currentColor"/>Run Simulation</button>
        <button onClick={reset}><RotateCcw size={15}/>Reset</button>
      </div>
    </header>

    <div className="sec-stage-grid">
      <article className="sec-stage identity-stage">
        <h3><span>1</span>Select User / Identity</h3>
        <div className="sec-identity-tabs" role="tablist">
          <button className={identityType==="iam-user"?"is-active":""} onClick={()=>setIdentityType("iam-user")}>IAM User</button>
          <button className={identityType==="service-account"?"is-active":""} onClick={()=>setIdentityType("service-account")}>Service Account</button>
          <button className={identityType==="role"?"is-active":""} onClick={()=>setIdentityType("role")}>Role</button>
        </div>
        <label>User<select value={user} onChange={e=>setUser(e.target.value)}><option>data-analyst</option><option>data-engineer</option><option>platform-admin</option></select></label>
        <label>Group<select value={group} onChange={e=>setGroup(e.target.value)}><option>analysts</option><option>engineering</option><option>platform-team</option></select></label>
        <fieldset>
          <legend>Permissions (Attached Policies)</legend>
          {(Object.keys(permissionLabels) as SecurityPermissionId[]).map(id=><label className="sec-policy-check" key={id}><input type="checkbox" checked={permissions[id]} onChange={()=>togglePermission(id)}/><span>{permissions[id]?"✓":""}</span>{permissionLabels[id]}</label>)}
        </fieldset>
      </article>

      <article className="sec-stage resources-stage">
        <h3><span>2</span>Access Data Resources</h3>
        <div className="sec-resource-list">{securityResources.map(resource=>{
          const allowed=result.allowed[resource.id];
          return <button key={resource.id} onClick={()=>setScenario(resource.id==="db-secret"?"secret-retrieval":"least-privilege")} className={allowed?"is-allowed":"is-denied"}>
            <span className="sec-resource-icon"><ResourceIcon id={resource.id}/></span>
            <span><strong>{resource.title}</strong><small>{resource.subtitle}</small></span>
            {allowed?<CheckCircle2 size={17}/>:<XCircle size={17}/>}
          </button>;
        })}</div>
      </article>

      <article className="sec-stage result-stage">
        <h3><span>3</span>Result</h3>
        <div className={`sec-result-banner ${result.effect==="Allow"?"is-allowed":"is-denied"}`}>
          {result.effect==="Allow"?<CheckCircle2 size={34}/>:<XCircle size={34}/>}
          <div><strong>{result.effect==="Allow"?"Access Allowed":"Access Denied"}</strong><p>User '{identityLabel}' {result.effect==="Allow"?"can":"cannot"} perform the requested action.</p></div>
        </div>
        <pre className="sec-result-json"><code><SyntaxText code={resultJson}/></code></pre>
      </article>

      <article className="sec-stage audit-stage">
        <h3><span>4</span>Audit Trail</h3>
        <ol>{result.audit.slice(-5).map(event=><li key={event.id} className={event.outcome}>
          <span>{event.outcome==="allowed"?<CheckCircle2 size={16}/>:<XCircle size={16}/>}</span>
          <div><time>{event.time}</time><strong>{event.title}</strong><small>{event.detail}</small><b>{event.outcome.toUpperCase()}</b></div>
        </li>)}</ol>
      </article>
    </div>

    <div className="sec-lower-grid">
      <section className="sec-policy-document">
        <header><h3><FileCode2 size={16}/>Policy Document</h3><button onClick={()=>setFullPolicy(v=>!v)}>{fullPolicy?"Compact View":"View Full Policy"}</button></header>
        <pre className={fullPolicy?"is-full":""}><code><SyntaxText code={policy}/></code></pre>
      </section>

      <section className="sec-secrets">
        <header><h3><KeyRound size={16}/>Secrets Management</h3></header>
        <div className="sec-secret-tabs" role="tablist">{(Object.keys(secretProviders) as SecretProviderId[]).map(id=><button key={id} className={secretProvider===id?"is-active":""} onClick={()=>{setSecretProvider(id);setSecretRetrieved(false);setShowSecret(false);}}>{secretProviders[id].label}</button>)}</div>
        <div className="sec-secret-body">
          <div className="sec-secret-form">
            <label>Secret Name<input value="db-password" readOnly/></label>
            <label>Value {showSecret?"(revealed)":"(hidden)"}<span className="sec-secret-input"><input value={showSecret?secretValue:"••••••••••••••"} readOnly/><button onClick={()=>setShowSecret(v=>!v)} aria-label={showSecret?"Hide secret":"Show secret"}>{showSecret?<EyeOff size={14}/>:<Eye size={14}/>}</button></span></label>
            <button className="sec-retrieve" onClick={retrieveSecret}><KeyRound size={14}/>{secretRetrieved?"Secret Retrieved":"Retrieve Secret"}</button>
          </div>
          <pre className="sec-secret-json"><code><SyntaxText code={secretInfo}/></code></pre>
        </div>
      </section>

      <section className="sec-takeaways">
        <header><h3><KeyRound size={16}/>Key Takeaways</h3></header>
        <ol>
          <li><b>1</b><span>Use least privilege access</span></li>
          <li><b>2</b><span>Separate identities for users, services, and workloads</span></li>
          <li><b>3</b><span>Store secrets in managed services (not in code)</span></li>
          <li><b>4</b><span>Enable audit logging and monitoring</span></li>
          <li><b>5</b><span>Use different policies for different environments</span></li>
        </ol>
      </section>
    </div>

    <footer className="sec-status"><span><ShieldCheck size={14}/>{result.status}</span><span>{securityScenarios.find(item=>item.id===scenario)?.description}</span></footer>
  </section>;
}
