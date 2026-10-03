export type SecurityScenarioId = "least-privilege" | "secret-retrieval" | "admin-overreach" | "service-pipeline";
export type SecurityIdentityType = "iam-user" | "service-account" | "role";
export type SecurityResourceId = "raw-data" | "curated-data" | "glue-catalog" | "redshift" | "db-secret";
export type SecurityPermissionId = "s3-read" | "redshift-read" | "secrets-read" | "admin";
export type SecretProviderId = "aws" | "azure" | "gcp";

export type SecurityResource = {
  id: SecurityResourceId;
  icon: "bucket" | "catalog" | "warehouse" | "secret";
  title: string;
  subtitle: string;
  action: string;
  required: SecurityPermissionId;
};

export type SecurityAuditEvent = {
  id: string;
  time: string;
  title: string;
  detail: string;
  outcome: "allowed" | "denied";
};

export type SecuritySimulationState = {
  allowed: Record<SecurityResourceId, boolean>;
  action: string;
  resource: string;
  reason: string;
  effect: "Allow" | "Deny";
  audit: SecurityAuditEvent[];
  status: string;
};

export const securityScenarios: Array<{id:SecurityScenarioId;label:string;description:string}> = [
  {id:"least-privilege",label:"Least Privilege Access",description:"Grant the analyst only the actions and resources required for read-only analytics."},
  {id:"secret-retrieval",label:"Secret Retrieval",description:"Allow the workload to retrieve one managed database secret without broader administrative access."},
  {id:"admin-overreach",label:"Admin Overreach",description:"Compare a broad administrator grant with a narrowly scoped data-access policy."},
  {id:"service-pipeline",label:"Service Account Pipeline",description:"Use a non-human workload identity for a cloud-native data pipeline."},
];

export const securityResources: SecurityResource[] = [
  {id:"raw-data",icon:"bucket",title:"S3 Bucket",subtitle:"raw-data",action:"s3:GetObject",required:"s3-read"},
  {id:"curated-data",icon:"bucket",title:"S3 Bucket",subtitle:"curated-data",action:"s3:DeleteObject",required:"admin"},
  {id:"glue-catalog",icon:"catalog",title:"Glue Catalog",subtitle:"sales_db",action:"glue:GetTable",required:"s3-read"},
  {id:"redshift",icon:"warehouse",title:"Redshift",subtitle:"analytics",action:"redshift:ExecuteQuery",required:"redshift-read"},
  {id:"db-secret",icon:"secret",title:"Secrets Manager",subtitle:"db-password",action:"secretsmanager:GetSecretValue",required:"secrets-read"},
];

export const permissionLabels: Record<SecurityPermissionId,string> = {
  "s3-read":"AmazonS3ReadOnlyAccess",
  "redshift-read":"AmazonRedshiftReadOnlyAccess",
  "secrets-read":"AWSSecretsManagerReadOnly",
  "admin":"AdministratorAccess",
};

export const secretProviders = {
  aws:{label:"AWS Secrets Manager",resource:"arn:aws:secretsmanager:us-east-1:123456789012:secret:db-password",version:"AWSCURRENT"},
  azure:{label:"Azure Key Vault",resource:"https://dataprep-vault.vault.azure.net/secrets/db-password",version:"7c4512"},
  gcp:{label:"Google Secret Manager",resource:"projects/dataprep/secrets/db-password/versions/latest",version:"latest"},
} satisfies Record<SecretProviderId,{label:string;resource:string;version:string}>;

export function defaultPermissions():Record<SecurityPermissionId,boolean>{
  return {"s3-read":true,"redshift-read":true,"secrets-read":false,"admin":false};
}

function hasPermission(required:SecurityPermissionId, permissions:Record<SecurityPermissionId,boolean>){
  return permissions.admin || permissions[required];
}

export function evaluateSecurityAccess(
  permissions:Record<SecurityPermissionId,boolean>,
  scenario:SecurityScenarioId,
):SecuritySimulationState{
  const allowed=Object.fromEntries(securityResources.map(resource=>[
    resource.id,
    hasPermission(resource.required,permissions),
  ])) as Record<SecurityResourceId,boolean>;

  if(scenario==="secret-retrieval") allowed["db-secret"]=permissions["secrets-read"]||permissions.admin;
  if(scenario==="admin-overreach"&&permissions.admin){
    for(const resource of securityResources)allowed[resource.id]=true;
  }

  const rawAllowed=allowed["raw-data"];
  const target=scenario==="secret-retrieval"?securityResources.find(r=>r.id==="db-secret")!:securityResources.find(r=>r.id==="raw-data")!;
  const targetAllowed=allowed[target.id];

  const audit:SecurityAuditEvent[]=[
    {id:"login",time:"10:24:01",title:"Login successful",detail:"(data-analyst)",outcome:"allowed"},
    {id:"read",time:"10:24:05",title:"s3:GetObject",detail:"s3://raw-data/sales.csv",outcome:rawAllowed?"allowed":"denied"},
    {id:"delete",time:"10:24:08",title:"s3:DeleteObject",detail:"s3://raw-data/sales.csv",outcome:permissions.admin?"allowed":"denied"},
    {id:"query",time:"10:24:12",title:"redshift:ExecuteQuery",detail:"analytics",outcome:allowed.redshift?"allowed":"denied"},
  ];
  if(scenario==="secret-retrieval"){
    audit.push({id:"secret",time:"10:24:15",title:"secretsmanager:GetSecretValue",detail:"db-password",outcome:allowed["db-secret"]?"allowed":"denied"});
  }

  const reason=targetAllowed
    ? scenario==="secret-retrieval"
      ? permissions.admin?"Allowed by AdministratorAccess":"Allowed by AWSSecretsManagerReadOnly"
      : permissions.admin?"Allowed by AdministratorAccess":"Allowed by AmazonS3ReadOnlyAccess"
    : "Missing required permission";

  return {
    allowed,
    action:target.action,
    resource:target.id==="db-secret"?"secret://db-password":"s3://raw-data/sales.csv",
    reason,
    effect:targetAllowed?"Allow":"Deny",
    audit,
    status:targetAllowed?"Access evaluation completed: requested action allowed.":"Access evaluation completed: requested action denied.",
  };
}

export function policyDocument(permissions:Record<SecurityPermissionId,boolean>){
  const actions:string[]=[];
  if(permissions["s3-read"])actions.push("s3:GetObject","s3:ListBucket");
  if(permissions["redshift-read"])actions.push("redshift:ExecuteQuery");
  if(permissions["secrets-read"])actions.push("secretsmanager:GetSecretValue");
  if(permissions.admin)actions.push("*");
  return JSON.stringify({
    Version:"2012-10-17",
    Statement:[{
      Effect:"Allow",
      Action:actions.length?actions:["none"],
      Resource:permissions.admin?"*":[
        "arn:aws:s3:::raw-data",
        "arn:aws:s3:::raw-data/*",
        ...(permissions["redshift-read"]?["arn:aws:redshift:*:*:cluster:analytics"]:[]),
        ...(permissions["secrets-read"]?["arn:aws:secretsmanager:*:*:secret:db-password*"]:[]),
      ],
    }],
  },null,2);
}

export function secretMetadata(provider:SecretProviderId){
  const p=secretProviders[provider];
  return JSON.stringify({
    SecretId:"db-password",
    Resource:p.resource,
    VersionStage:p.version,
    CreatedDate:"2026-10-02T10:15:00Z",
  },null,2);
}
