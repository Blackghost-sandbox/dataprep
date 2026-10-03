export type DbtProjectScenarioId = "healthy" | "misplaced" | "undocumented";

export type DbtProjectNode = {
  id: string;
  label: string;
  kind: "folder" | "sql" | "yaml" | "markdown" | "csv";
  path: string;
  description: string;
  role: string;
  documented: boolean;
};

export type DbtProjectScenario = {
  id: DbtProjectScenarioId;
  label: string;
  nodes: DbtProjectNode[];
};

export type DbtProjectIssue = {
  id: string;
  severity: "error" | "warning";
  path: string;
  message: string;
};

export type DbtProjectValidation = {
  issues: DbtProjectIssue[];
  passedChecks: string[];
  score: number;
  terminal: string[];
};

const baseNodes: DbtProjectNode[] = [
  {id:"project",label:"my_dbt_project/",kind:"folder",path:"my_dbt_project/",description:"Root of the dbt project.",role:"Project root",documented:true},
  {id:"config",label:"dbt_project.yml",kind:"yaml",path:"my_dbt_project/dbt_project.yml",description:"Project configuration for name, profile, model paths and defaults.",role:"Project configuration",documented:true},
  {id:"models",label:"models/",kind:"folder",path:"my_dbt_project/models/",description:"SQL models organized into maintainable layers.",role:"Model directory",documented:true},
  {id:"staging",label:"staging/",kind:"folder",path:"my_dbt_project/models/staging/",description:"Source-aligned cleanup and renaming.",role:"Staging layer",documented:true},
  {id:"stg-orders",label:"stg_orders.sql",kind:"sql",path:"my_dbt_project/models/staging/stg_orders.sql",description:"Standardizes raw order records.",role:"Staging model",documented:true},
  {id:"stg-customers",label:"stg_customers.sql",kind:"sql",path:"my_dbt_project/models/staging/stg_customers.sql",description:"Standardizes raw customer records.",role:"Staging model",documented:true},
  {id:"marts",label:"marts/",kind:"folder",path:"my_dbt_project/models/marts/",description:"Business-facing fact and dimension models.",role:"Mart layer",documented:true},
  {id:"fct-orders",label:"fct_orders.sql",kind:"sql",path:"my_dbt_project/models/marts/fct_orders.sql",description:"Order fact table used by analytics.",role:"Fact model",documented:true},
  {id:"fct-customers",label:"fct_customers.sql",kind:"sql",path:"my_dbt_project/models/marts/fct_customers.sql",description:"Customer-facing mart model.",role:"Mart model",documented:true},
  {id:"macros",label:"macros/",kind:"folder",path:"my_dbt_project/macros/",description:"Reusable Jinja macros that reduce repetition.",role:"Macro directory",documented:true},
  {id:"date-utils",label:"date_utils.sql",kind:"sql",path:"my_dbt_project/macros/date_utils.sql",description:"Reusable date helper macros.",role:"Macro file",documented:true},
  {id:"tests",label:"tests/",kind:"folder",path:"my_dbt_project/tests/",description:"Data tests and schema documentation.",role:"Tests directory",documented:true},
  {id:"schema",label:"schema.yml",kind:"yaml",path:"my_dbt_project/tests/schema.yml",description:"Model descriptions, column metadata and tests.",role:"Documentation & tests",documented:true},
  {id:"seeds",label:"seeds/",kind:"folder",path:"my_dbt_project/seeds/",description:"Static CSV reference data loaded by dbt.",role:"Seed directory",documented:true},
  {id:"countries",label:"countries.csv",kind:"csv",path:"my_dbt_project/seeds/countries.csv",description:"Static country reference values.",role:"Seed file",documented:true},
  {id:"docs",label:"docs/",kind:"folder",path:"my_dbt_project/docs/",description:"Project-level documentation and guides.",role:"Documentation directory",documented:true},
  {id:"readme",label:"README.md",kind:"markdown",path:"my_dbt_project/docs/README.md",description:"Project overview, conventions and contributor notes.",role:"Project documentation",documented:true},
];

function clone(nodes: DbtProjectNode[]): DbtProjectNode[] {
  return nodes.map(node=>({...node}));
}

const misplacedNodes=clone(baseNodes).map(node=>{
  if(node.id==="fct-orders") return {...node,path:"my_dbt_project/models/staging/fct_orders.sql",role:"Misplaced mart model"};
  return node;
});

const undocumentedNodes=clone(baseNodes).map(node=>{
  if(node.id==="fct-orders" || node.id==="stg-customers") return {...node,documented:false};
  return node;
});

export const dbtProjectScenarios: DbtProjectScenario[] = [
  {id:"healthy",label:"Healthy Project",nodes:clone(baseNodes)},
  {id:"misplaced",label:"Misplaced Mart Model",nodes:misplacedNodes},
  {id:"undocumented",label:"Missing Documentation",nodes:undocumentedNodes},
];

export function getDbtProjectScenario(id: DbtProjectScenarioId): DbtProjectScenario {
  return dbtProjectScenarios.find(item=>item.id===id) ?? dbtProjectScenarios[0];
}

export function getDbtProjectNode(scenario: DbtProjectScenario,id:string): DbtProjectNode {
  return scenario.nodes.find(node=>node.id===id) ?? scenario.nodes[0];
}

export function validateDbtProject(scenario: DbtProjectScenario): DbtProjectValidation {
  const issues: DbtProjectIssue[]=[];
  const passedChecks:string[]=[];

  const config=scenario.nodes.find(node=>node.id==="config");
  if(config) passedChecks.push("dbt_project.yml is present");
  else issues.push({id:"missing-config",severity:"error",path:"my_dbt_project/",message:"dbt_project.yml is missing"});

  const martInStaging=scenario.nodes.find(node=>node.id==="fct-orders" && node.path.includes("/staging/"));
  if(martInStaging){
    issues.push({id:"layering",severity:"warning",path:martInStaging.path,message:"fct_orders.sql is a mart-style model inside staging/"});
  } else {
    passedChecks.push("Model layering follows the staging / marts convention");
  }

  const undocumented=scenario.nodes.filter(node=>node.kind==="sql" && !node.documented);
  if(undocumented.length){
    undocumented.forEach(node=>issues.push({id:"docs-"+node.id,severity:"warning",path:node.path,message:node.label+" has no model documentation"}));
  } else {
    passedChecks.push("SQL models have documentation metadata");
  }

  const required=["models","macros","tests","seeds","docs"];
  for(const id of required){
    if(scenario.nodes.some(node=>node.id===id)) passedChecks.push(id+"/ directory is present");
    else issues.push({id:"missing-"+id,severity:"warning",path:"my_dbt_project/",message:id+"/ directory is missing"});
  }

  const deductions=issues.reduce((sum,issue)=>sum+(issue.severity==="error"?30:12),0);
  const score=Math.max(0,100-deductions);
  const terminal=[
    "$ dbt parse",
    "Reading dbt_project.yml...",
    "Scanning models, macros, tests, seeds and docs...",
    "Found "+scenario.nodes.filter(node=>node.kind==="sql").length+" SQL files",
    issues.length ? "Project validation completed with "+issues.length+" issue"+(issues.length===1?"":"s") : "Project validation passed with no issues",
    "Maintainability score: "+score+"%",
  ];
  return {issues,passedChecks,score,terminal};
}

export function buildDocsPreview(node: DbtProjectNode): string[] {
  return [
    "# "+node.label,
    "",
    "**Path:** "+node.path,
    "**Role:** "+node.role,
    "",
    node.description,
    "",
    node.documented ? "Documentation status: documented" : "Documentation status: missing metadata",
  ];
}
