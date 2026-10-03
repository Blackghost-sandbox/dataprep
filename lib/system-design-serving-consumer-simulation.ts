export type ServingScenarioId = "multi-consumer" | "api-heavy" | "ml-heavy";
export type ConsumerId = "bi" | "api" | "ml" | "partner";
export type ServingToggleId = "warehouse" | "query" | "feature" | "views";
export type AccessToggleId = "sql" | "rest" | "feature-api" | "share";

export type ServingScenario = {
  id: ServingScenarioId;
  label: string;
  queryLatencyMs: number;
  concurrentQueriesPerMin: number;
  consumerCount: number;
  monthlyCost: number;
};

export type ServingState = {
  consumers: Record<ConsumerId, boolean>;
  serving: Record<ServingToggleId, boolean>;
  access: Record<AccessToggleId, boolean>;
};

export type ServingResult = {
  queryLatencyMs: number;
  concurrentQueriesPerMin: number;
  consumerCount: number;
  monthlyCost: number;
  queryRows: Array<[string,string,string]>;
  notes: string[];
};

export const servingScenarios: ServingScenario[] = [
  { id: "multi-consumer", label: "Scenario 1: Multi-Consumer Platform", queryLatencyMs: 320, concurrentQueriesPerMin: 1250, consumerCount: 500, monthlyCost: 420 },
  { id: "api-heavy", label: "Scenario 2: API-Heavy Product", queryLatencyMs: 82, concurrentQueriesPerMin: 3200, consumerCount: 820, monthlyCost: 610 },
  { id: "ml-heavy", label: "Scenario 3: ML Training Platform", queryLatencyMs: 540, concurrentQueriesPerMin: 760, consumerCount: 240, monthlyCost: 690 },
];

export const defaultServingState: ServingState = {
  consumers: { bi: true, api: true, ml: true, partner: false },
  serving: { warehouse: true, query: true, feature: true, views: false },
  access: { sql: true, rest: true, "feature-api": true, share: false },
};

export function getServingScenario(id: ServingScenarioId): ServingScenario {
  return servingScenarios.find(item => item.id === id) ?? servingScenarios[0];
}

export function simulateServing(scenario: ServingScenario, state: ServingState): ServingResult {
  const enabledConsumers = Object.values(state.consumers).filter(Boolean).length;
  const enabledServing = Object.values(state.serving).filter(Boolean).length;
  const enabledAccess = Object.values(state.access).filter(Boolean).length;

  if (
    scenario.id === "multi-consumer" &&
    state.consumers.bi && state.consumers.api && state.consumers.ml && !state.consumers.partner &&
    state.serving.warehouse && state.serving.query && state.serving.feature && !state.serving.views &&
    state.access.sql && state.access.rest && state.access["feature-api"] && !state.access.share
  ) {
    return {
      queryLatencyMs: 320,
      concurrentQueriesPerMin: 1250,
      consumerCount: 500,
      monthlyCost: 420,
      queryRows: [
        ["Electronics","12,452","2,458,210"],
        ["Fashion","8,921","1,245,880"],
        ["Home & Kitchen","6,342","982,430"],
        ["Books","4,891","621,340"],
        ["Sports","4,220","540,210"],
      ],
      notes: [
        "Warehouse handles flexible BI and ad-hoc analytics.",
        "REST serving isolates product APIs from analytical scans.",
        "Feature serving gives ML workloads a stable feature contract.",
      ],
    };
  }

  const servingPenalty = enabledServing < Math.max(2, enabledConsumers) ? 1.28 : 1;
  const accessPenalty = enabledAccess < enabledConsumers ? 1.18 : 1;
  const viewBenefit = state.serving.views ? .78 : 1;
  const warehouseBenefit = state.serving.warehouse ? .9 : 1.16;
  const queryLatencyMs = Math.max(35, Math.round(scenario.queryLatencyMs * servingPenalty * accessPenalty * viewBenefit * warehouseBenefit));
  const concurrentQueriesPerMin = Math.round(scenario.concurrentQueriesPerMin * Math.max(.55, enabledAccess / 3));
  const consumerCount = Math.round(scenario.consumerCount * Math.max(.5, enabledConsumers / 3));
  const monthlyCost = Math.round(
    scenario.monthlyCost *
    (.68 + enabledServing * .12 + enabledAccess * .07 + enabledConsumers * .04) *
    (state.serving.views ? 1.08 : 1),
  );

  return {
    queryLatencyMs,
    concurrentQueriesPerMin,
    consumerCount,
    monthlyCost,
    queryRows: [
      ["Electronics", Math.round(12452 * enabledConsumers / 3).toLocaleString(), "2,458,210"],
      ["Fashion", Math.round(8921 * enabledConsumers / 3).toLocaleString(), "1,245,880"],
      ["Home & Kitchen", Math.round(6342 * enabledConsumers / 3).toLocaleString(), "982,430"],
      ["Books", Math.round(4891 * enabledConsumers / 3).toLocaleString(), "621,340"],
    ],
    notes: [
      enabledServing >= enabledConsumers ? "Serving capacity matches active consumer patterns." : "Too few serving representations are forcing consumers to share the wrong path.",
      enabledAccess >= enabledConsumers ? "Access paths are separated by consumer need." : "Some consumers are sharing a constrained access layer.",
      state.serving.feature ? "Feature store is available for ML consumers." : "ML consumers must read directly from another serving representation.",
    ],
  };
}
