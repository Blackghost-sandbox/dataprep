import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {createRequire} from "node:module";
import assert from "node:assert/strict";
import ts from "typescript";
import React from "react";
import {renderToString} from "react-dom/server";

const root=path.resolve(import.meta.dirname,"..");
const require=createRequire(import.meta.url);
const cache=new Map();

function load(file){
  if(cache.has(file))return cache.get(file).exports;
  const loaded={exports:{}};cache.set(file,loaded);
  const source=fs.readFileSync(file,"utf8");
  const code=ts.transpileModule(source,{compilerOptions:{
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,
    jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true
  }}).outputText;
  const localRequire=name=>{
    if(name.startsWith("@/")||name.startsWith(".")){
      const base=name.startsWith("@/")?path.join(root,name.slice(2)):path.resolve(path.dirname(file),name);
      const found=[".tsx",".ts","/index.tsx","/index.ts"].map(ext=>base+ext).find(fs.existsSync);
      assert.ok(found,"Module not found: "+name);
      return load(found);
    }
    return require(name);
  };
  vm.runInThisContext("(function(require,module,exports){"+code+"\n})",{filename:file})(localRequire,loaded,loaded.exports);
  return loaded.exports;
}

const model=load(path.join(root,"lib/cloud-identity-security-simulation.ts"));
const defaults=model.defaultPermissions();
assert.equal(defaults["s3-read"],true);
assert.equal(defaults["redshift-read"],true);
assert.equal(defaults["secrets-read"],false);
assert.equal(defaults.admin,false);

const least=model.evaluateSecurityAccess(defaults,"least-privilege");
assert.equal(least.allowed["raw-data"],true);
assert.equal(least.allowed["curated-data"],false);
assert.equal(least.allowed["glue-catalog"],true);
assert.equal(least.allowed.redshift,true);
assert.equal(least.allowed["db-secret"],false);
assert.equal(least.effect,"Allow");
assert.ok(least.audit.some(event=>event.title==="s3:DeleteObject"&&event.outcome==="denied"));

const withSecret={...defaults,"secrets-read":true};
const secret=model.evaluateSecurityAccess(withSecret,"secret-retrieval");
assert.equal(secret.allowed["db-secret"],true);
assert.equal(secret.effect,"Allow");
assert.ok(secret.reason.includes("AWSSecretsManagerReadOnly"));

const admin=model.evaluateSecurityAccess({...defaults,admin:true},"admin-overreach");
for(const resource of model.securityResources)assert.equal(admin.allowed[resource.id],true);
assert.ok(admin.reason.includes("AdministratorAccess"));

const denied=model.evaluateSecurityAccess({"s3-read":false,"redshift-read":false,"secrets-read":false,admin:false},"least-privilege");
assert.equal(denied.effect,"Deny");
assert.equal(denied.allowed["raw-data"],false);

const policy=model.policyDocument(defaults);
assert.ok(policy.includes("s3:GetObject"));
assert.ok(policy.includes("redshift:ExecuteQuery"));
assert.ok(policy.includes("raw-data"));
assert.ok(model.secretMetadata("aws").includes("AWS"));
assert.ok(model.secretMetadata("azure").includes("vault.azure.net"));
assert.ok(model.secretMetadata("gcp").includes("projects/dataprep"));

const {CloudIdentitySecurityLab,CloudIdentitySecurityHero}=load(path.join(root,"components/cloud-identity-security-lab.tsx"));
const html=renderToString(React.createElement(CloudIdentitySecurityLab));
for(const text of [
  "Run Simulation","Least Privilege Access","Select User / Identity","IAM User","Service Account","Role",
  "AmazonS3ReadOnlyAccess","AmazonRedshiftReadOnlyAccess","AWSSecretsManagerReadOnly","AdministratorAccess",
  "Access Data Resources","S3 Bucket","Glue Catalog","Redshift","Secrets Manager","Access Allowed",
  "Audit Trail","Policy Document","Secrets Management","AWS Secrets Manager","Azure Key Vault",
  "Google Secret Manager","Retrieve Secret","Key Takeaways"
])assert.ok(html.includes(text),text);

const hero=renderToString(React.createElement(CloudIdentitySecurityHero,{
  description:"Apply least privilege, encryption, secret management, and separation of duties to cloud data workloads.",
  minutes:25,currentLesson:2,total:11,onPrevious:()=>{},onNext:()=>{}
}));
for(const text of ["Identity, Security &amp; Secrets","25 min","Lesson 3/11","Intermediate","Previous","Next"]){
  assert.ok(hero.includes(text),text);
}

console.log("PASS: identity, least-privilege policies, allowed/denied resources, secret access, audit state, SSR controls and hero.");
