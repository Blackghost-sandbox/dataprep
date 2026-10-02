"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  CircleAlert,
  Database,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";
import { DarkCodeCard } from "@/components/rdd-dataframe-experience";
import { useCompanion } from "@/components/companion-context";
import {
  buildWhereSimulationQuery,
  cloneWherePlan,
  evaluateWherePlan,
  explainWherePlan,
  operatorsForWhere,
  whereDatasets,
  wherePredicateSql,
  whereScenarios,
  type Truth,
  type WhereCondition,
  type WhereDataset,
  type WherePlan,
} from "@/lib/where-lab";

function valueFor(row: Record<string, string | number | null>, key: string) {
  const value = row[key];
  return value === null ? <em>NULL</em> : value;
}

function truthClass(truth: Truth | "PENDING") {
  return truth === "TRUE" ? "where-truth-true" : truth === "FALSE" ? "where-truth-false" : truth === "UNKNOWN" ? "where-truth-unknown" : "where-truth-pending";
}

function defaultValue(dataset: WhereDataset, columnKey: string) {
  const column = dataset.columns.find(item => item.key === columnKey);
  if (!column) return "";
  if (column.type === "number") {
    if (columnKey === "age") return "25";
    if (columnKey === "amount") return "300";
    return String(dataset.rows.find(row => typeof row[columnKey] === "number")?.[columnKey] ?? 1);
  }
  return String(dataset.rows.find(row => typeof row[columnKey] === "string")?.[columnKey] ?? "");
}

function planLabel(dataset: WhereDataset, plan: WherePlan) {
  return wherePredicateSql(dataset, plan);
}

function DataGrid({
  dataset,
  rows,
  evaluated,
  plan,
  result = false,
}: {
  dataset: WhereDataset;
  rows: Record<string, string | number | null>[];
  evaluated: number;
  plan: WherePlan;
  result?: boolean;
}) {
  const primary = plan.conditions[0]?.column;
  return <div className={"where-data-table" + (result ? " where-data-table-result" : "")} tabIndex={0} role="region" aria-label={result ? "Filtered result table" : "Input data table"}>
    <table>
      <thead><tr>{dataset.columns.map(column => <th key={column.key} scope="col">{column.label}</th>)}</tr></thead>
      <tbody>{rows.map((row, rowIndex) => {
        const truth = rowIndex < evaluated ? evaluateWherePlan(row, dataset, plan) : "PENDING";
        return <tr key={String(row.id ?? rowIndex)}>
          {dataset.columns.map(column => <td key={column.key} className={!result && column.key === primary && truth !== "PENDING" ? truthClass(truth) : undefined}>{valueFor(row, column.key)}</td>)}
        </tr>;
      })}</tbody>
    </table>
  </div>;
}

export function WhereLearningLab() {
  const companion = useCompanion();
  const [datasetId, setDatasetId] = useState("customers");
  const dataset = useMemo(() => whereDatasets.find(item => item.id === datasetId) ?? whereDatasets[0], [datasetId]);
  const scenarios = useMemo(() => whereScenarios(datasetId), [datasetId]);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [draftPlan, setDraftPlan] = useState<WherePlan>(() => cloneWherePlan(whereScenarios("customers")[0].plan));
  const [executedPlan, setExecutedPlan] = useState<WherePlan>(() => cloneWherePlan(whereScenarios("customers")[0].plan));
  const [evaluatedCount, setEvaluatedCount] = useState(whereDatasets[0].rows.length);
  const [running, setRunning] = useState(false);
  const [dirty, setDirty] = useState(false);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    if (typeof window === "undefined") return;
    timers.current.forEach(timer => window.clearTimeout(timer));
    timers.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const resultRows = useMemo(
    () => dataset.rows.slice(0, evaluatedCount).filter(row => evaluateWherePlan(row, dataset, executedPlan) === "TRUE"),
    [dataset, evaluatedCount, executedPlan],
  );

  const query = buildWhereSimulationQuery(dataset, draftPlan);
  const firstCondition = executedPlan.conditions[0];
  const evaluationColumns = executedPlan.conditions.map(condition => condition.column);
  const evaluationHeader = evaluationColumns.join(" / ") || "value";
  const evaluationPredicate = planLabel(dataset, executedPlan);

  const setScenario = (index: number) => {
    clearTimers();
    const next = cloneWherePlan(scenarios[index].plan);
    setScenarioIndex(index);
    setDraftPlan(next);
    setExecutedPlan(cloneWherePlan(next));
    setEvaluatedCount(dataset.rows.length);
    setRunning(false);
    setDirty(false);
  };

  const changeDataset = (nextId: string) => {
    clearTimers();
    const nextDataset = whereDatasets.find(item => item.id === nextId) ?? whereDatasets[0];
    const next = cloneWherePlan(whereScenarios(nextId)[0].plan);
    setDatasetId(nextId);
    setScenarioIndex(0);
    setDraftPlan(next);
    setExecutedPlan(cloneWherePlan(next));
    setEvaluatedCount(nextDataset.rows.length);
    setRunning(false);
    setDirty(false);
  };

  const run = () => {
    clearTimers();
    const snapshot = cloneWherePlan(draftPlan);
    setExecutedPlan(snapshot);
    setEvaluatedCount(0);
    setRunning(true);
    setDirty(false);
    companion?.emit({ type: "exercise_started", lesson: "WHERE / Filtering", source: "runner" });

    dataset.rows.forEach((_, index) => {
      const timer = window.setTimeout(() => setEvaluatedCount(index + 1), 90 + index * 55);
      timers.current.push(timer);
    });
    const finish = window.setTimeout(() => {
      setRunning(false);
      const matches = dataset.rows.filter(row => evaluateWherePlan(row, dataset, snapshot) === "TRUE").length;
      companion?.emit({ type: matches ? "exercise_correct" : "exercise_error", lesson: "WHERE / Filtering", source: "runner" });
    }, 120 + dataset.rows.length * 55);
    timers.current.push(finish);
  };

  const reset = () => {
    clearTimers();
    const index = scenarioIndex >= 0 ? scenarioIndex : 0;
    const next = cloneWherePlan(scenarios[index].plan);
    setDraftPlan(next);
    setExecutedPlan(cloneWherePlan(next));
    setEvaluatedCount(dataset.rows.length);
    setRunning(false);
    setDirty(false);
  };

  const nextScenario = () => setScenario((Math.max(0, scenarioIndex) + 1) % scenarios.length);

  const changeCondition = (index: number, patch: Partial<WhereCondition>) => {
    setDraftPlan(current => {
      const conditions = current.conditions.map((condition, position) => {
        if (position !== index) return condition;
        if (patch.column && patch.column !== condition.column) {
          const column = dataset.columns.find(item => item.key === patch.column)!;
          return {
            column: patch.column,
            operator: operatorsForWhere(column.type)[0].value,
            value: defaultValue(dataset, patch.column),
            value2: defaultValue(dataset, patch.column),
          };
        }
        return { ...condition, ...patch };
      });
      return { ...current, conditions };
    });
    setScenarioIndex(-1);
    setDirty(true);
  };

  const setJoin = (join: "AND" | "OR") => {
    setDraftPlan(current => ({ ...current, join }));
    setScenarioIndex(-1);
    setDirty(true);
  };

  const applyChallenge = (plan: WherePlan) => {
    setDraftPlan(cloneWherePlan(plan));
    setScenarioIndex(-1);
    setDirty(true);
  };

  const challengePlans = dataset.id === "customers"
    ? [
      { label: "age < 30", plan: { join: "AND" as const, conditions: [{ column: "age", operator: "<" as const, value: "30" }] } },
      { label: "age >= 30 AND city = 'Mumbai'", plan: { join: "AND" as const, conditions: [{ column: "age", operator: ">=" as const, value: "30" }, { column: "city", operator: "=" as const, value: "Mumbai" }] } },
      { label: "city = 'Chennai'", plan: { join: "AND" as const, conditions: [{ column: "city", operator: "=" as const, value: "Chennai" }] } },
      { label: "age BETWEEN 25 AND 35", plan: { join: "AND" as const, conditions: [{ column: "age", operator: "BETWEEN" as const, value: "25", value2: "35" }] } },
    ]
    : [
      { label: "amount < 300", plan: { join: "AND" as const, conditions: [{ column: "amount", operator: "<" as const, value: "300" }] } },
      { label: "amount >= 300 AND status = 'paid'", plan: { join: "AND" as const, conditions: [{ column: "amount", operator: ">=" as const, value: "300" }, { column: "status", operator: "=" as const, value: "paid" }] } },
      { label: "status = 'pending'", plan: { join: "AND" as const, conditions: [{ column: "status", operator: "=" as const, value: "pending" }] } },
      { label: "amount BETWEEN 200 AND 600", plan: { join: "AND" as const, conditions: [{ column: "amount", operator: "BETWEEN" as const, value: "200", value2: "600" }] } },
    ];

  return <section className="where-simulator" aria-label="Interactive WHERE simulation">
    <header className="where-sim-header">
      <div className="where-sim-title">
        <span><Box size={24}/></span>
        <div><h2>Interactive Simulation</h2><p>Set a condition, run the query, and see how WHERE filters the rows in real time.</p></div>
      </div>
      <div className="where-sim-actions">
        <label><span>Dataset</span><select aria-label="WHERE dataset" value={datasetId} onChange={event => changeDataset(event.target.value)}>{whereDatasets.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <button className="where-run" type="button" disabled={running} onClick={run}><Play size={15} fill="currentColor"/>{running ? "Running…" : "Run Query"}</button>
        <button className="where-reset" type="button" onClick={reset}><RotateCcw size={15}/>Reset</button>
        <button className="where-next" type="button" onClick={nextScenario}>Next Scenario <ArrowRight size={15}/></button>
      </div>
    </header>

    <div className="where-scenarios" role="group" aria-label="WHERE scenarios">
      <strong>Scenario</strong>
      {scenarios.map((scenario, index) => <button type="button" key={scenario.id} aria-pressed={scenarioIndex === index} onClick={() => setScenario(index)}><span>{index + 1}</span>{scenario.label}</button>)}
    </div>

    <div className="where-sim-grid">
      <section className="where-condition-card">
        <h3><span>1.</span> Set the condition</h3>
        <p>Choose a column, operator and value.</p>
        <div className="where-condition-stack">
          {draftPlan.conditions.map((condition, index) => {
            const column = dataset.columns.find(item => item.key === condition.column) ?? dataset.columns[0];
            const operators = operatorsForWhere(column.type);
            const needsValue = condition.operator !== "IS NULL" && condition.operator !== "IS NOT NULL";
            return <div className="where-condition-row" key={index}>
              {index > 0 && <select className="where-join-select" aria-label="Condition join" value={draftPlan.join} onChange={event => setJoin(event.target.value as "AND" | "OR")}><option>AND</option><option>OR</option></select>}
              <label><span>Column</span><select aria-label={`Condition ${index + 1} column`} value={condition.column} onChange={event => changeCondition(index, { column: event.target.value })}>{dataset.columns.filter(item => item.key !== "id").map(item => <option value={item.key} key={item.key}>{item.label}</option>)}</select></label>
              <label><span>Operator</span><select aria-label={`Condition ${index + 1} operator`} value={condition.operator} onChange={event => changeCondition(index, { operator: event.target.value as WhereCondition["operator"] })}>{operators.map(operator => <option value={operator.value} key={operator.value}>{operator.label}</option>)}</select></label>
              {needsValue && <label><span>Value</span><input aria-label={`Condition ${index + 1} value`} type={column.type === "number" ? "number" : column.type === "date" ? "date" : "text"} value={condition.value} onChange={event => changeCondition(index, { value: event.target.value })}/></label>}
              {condition.operator === "BETWEEN" && <label><span>And</span><input aria-label={`Condition ${index + 1} second value`} type={column.type === "number" ? "number" : column.type === "date" ? "date" : "text"} value={condition.value2 ?? ""} onChange={event => changeCondition(index, { value2: event.target.value })}/></label>}
            </div>;
          })}
        </div>
        <div className="where-condition-hint"><Lightbulb size={16}/><span>{explainWherePlan(dataset, draftPlan)}</span></div>
        {dirty && <small className="where-ready" role="status">Condition changed · run the query to update the result.</small>}
      </section>

      <section className="where-query-card">
        <h3><span>2.</span> Query being executed</h3>
        <DarkCodeCard title="SQL" code={query}/>
      </section>

      <section className="where-evaluation-card">
        <div className="where-panel-title"><span><CircleAlert size={16}/></span><div><h3>Row-by-row evaluation</h3><p>See how each row is evaluated.</p></div></div>
        <div className="where-eval-scroll">
          <table>
            <thead><tr><th>id</th><th>{evaluationHeader}</th><th>{evaluationPredicate}</th><th>Result</th></tr></thead>
            <tbody>{dataset.rows.map((row, index) => {
              const truth: Truth | "PENDING" = index < evaluatedCount ? evaluateWherePlan(row, dataset, executedPlan) : "PENDING";
              const included = truth === "TRUE";
              return <tr key={String(row.id ?? index)}>
                <td>{valueFor(row, "id")}</td>
                <td>{evaluationColumns.map(column => String(row[column] ?? "NULL")).join(" · ")}</td>
                <td><span className={"where-truth-pill " + truthClass(truth)}>{truth === "TRUE" ? "✓ TRUE" : truth === "FALSE" ? "✕ FALSE" : truth === "UNKNOWN" ? "? UNKNOWN" : "… WAIT"}</span></td>
                <td><span className={"where-result-pill " + (truth === "PENDING" ? "pending" : included ? "included" : "excluded")}>{truth === "PENDING" ? "Waiting" : included ? "Included" : "Excluded"}</span></td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      </section>

      <section className="where-input-card">
        <div className="where-table-heading"><h3><Database size={16}/>3. Input table ({dataset.table})</h3><span>{dataset.rows.length} rows</span></div>
        <DataGrid dataset={dataset} rows={dataset.rows} evaluated={evaluatedCount} plan={executedPlan}/>
        <span className="where-transfer-arrow" aria-hidden="true"><ArrowRight size={18}/></span>
      </section>

      <section className="where-result-card">
        <div className="where-table-heading"><h3><CheckCircle2 size={17}/>4. Result table (filtered)</h3><span>{resultRows.length} rows ({planLabel(dataset, executedPlan)})</span></div>
        {resultRows.length
          ? <DataGrid dataset={dataset} rows={resultRows} evaluated={resultRows.length} plan={executedPlan} result/>
          : <div className="where-empty-result"><Target size={28}/><strong>No matching rows</strong><p>The query ran successfully, but no row evaluated to TRUE.</p></div>}
      </section>
    </div>

    <div className="where-bottom-grid">
      <section className="where-try-card">
        <div className="where-try-copy"><span><Target size={25}/></span><div><h3>Try it yourself!</h3><p>Change the condition and run the query. Try different values.</p></div></div>
        <div className="where-challenges"><strong><Sparkles size={16}/> Suggested challenges:</strong><div>{challengePlans.map(challenge => <button type="button" key={challenge.label} onClick={() => applyChallenge(challenge.plan)}><span aria-hidden="true"/> {challenge.label}</button>)}</div></div>
      </section>
      <section className="where-takeaways">
        <h3><Database size={17}/>Key takeaways</h3>
        <ul>
          <li><CheckCircle2 size={14}/>WHERE keeps rows that match the condition.</li>
          <li><CheckCircle2 size={14}/>Rows with false or unknown conditions are excluded.</li>
          <li><CheckCircle2 size={14}/>You can use comparison, logical, and pattern operators.</li>
          <li><CheckCircle2 size={14}/>It does not change the original data.</li>
        </ul>
      </section>
    </div>
  </section>;
}
