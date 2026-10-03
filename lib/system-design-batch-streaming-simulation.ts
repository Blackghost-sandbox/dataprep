export type BatchStreamingScenarioId = "ecommerce-orders" | "fraud-signals" | "product-metrics";

export type BatchStreamingScenario = {
  id: BatchStreamingScenarioId;
  label: string;
  dataSource: string;
  incomingEventsPerMinute: number;
  orderRange: string;
  analysisType: string;
  batchWindowMinutes: number;
  streamLatencySeconds: number;
  streamingProcessed: number;
  batchCostIndex: number;
  streamingCostIndex: number;
};

export type BatchStreamingOptions = {
  lateEvents: boolean;
  outOfOrder: boolean;
  failures: boolean;
};

export type BatchStreamingResult = {
  batchOrders: number;
  batchLatencyMinutes: number;
  batchFreshnessMinutes: number;
  streamingOrders: number;
  streamLatencySeconds: number;
  throughput: "High";
  logs: string[];
};

export const batchStreamingScenarios: BatchStreamingScenario[] = [
  {
    id: "ecommerce-orders",
    label: "Scenario 1: E-commerce Orders",
    dataSource: "E-commerce Orders",
    incomingEventsPerMinute: 10_000,
    orderRange: "$10 - $500",
    analysisType: "Real-time Revenue Dashboard",
    batchWindowMinutes: 60,
    streamLatencySeconds: 2.4,
    streamingProcessed: 35_420,
    batchCostIndex: 1,
    streamingCostIndex: 1.55,
  },
  {
    id: "fraud-signals",
    label: "Scenario 2: Fraud Detection",
    dataSource: "Payment Events",
    incomingEventsPerMinute: 24_000,
    orderRange: "$1 - $5,000",
    analysisType: "Fraud Risk Scoring",
    batchWindowMinutes: 30,
    streamLatencySeconds: 1.2,
    streamingProcessed: 72_800,
    batchCostIndex: 1.15,
    streamingCostIndex: 1.8,
  },
  {
    id: "product-metrics",
    label: "Scenario 3: Product Metrics",
    dataSource: "Product Events",
    incomingEventsPerMinute: 6_500,
    orderRange: "$0 - $250",
    analysisType: "Live Product KPI Dashboard",
    batchWindowMinutes: 15,
    streamLatencySeconds: 3.6,
    streamingProcessed: 22_600,
    batchCostIndex: .85,
    streamingCostIndex: 1.35,
  },
];

export const defaultBatchStreamingOptions: BatchStreamingOptions = {
  lateEvents: true,
  outOfOrder: true,
  failures: false,
};

export function getBatchStreamingScenario(id: BatchStreamingScenarioId): BatchStreamingScenario {
  return batchStreamingScenarios.find(item => item.id === id) ?? batchStreamingScenarios[0];
}

export function simulateBatchStreaming(
  scenario: BatchStreamingScenario,
  incomingEventsPerMinute: number,
  options: BatchStreamingOptions,
): BatchStreamingResult {
  const incoming = Math.max(1, incomingEventsPerMinute);
  const latePenalty = options.lateEvents ? 0.15 : 0;
  const orderPenalty = options.outOfOrder ? 0.12 : 0;
  const failurePenalty = options.failures ? 0.55 : 0;
  const streamLatencySeconds = Number(
    Math.max(.4, scenario.streamLatencySeconds + latePenalty + orderPenalty + failurePenalty).toFixed(1),
  );
  const batchOrders = Math.round(incoming * scenario.batchWindowMinutes);
  const streamScale = incoming / scenario.incomingEventsPerMinute;
  const streamingOrders = Math.round(
    scenario.streamingProcessed * streamScale * (options.failures ? .92 : 1),
  );
  const batchLatencyMinutes = scenario.batchWindowMinutes;
  const batchFreshnessMinutes = scenario.batchWindowMinutes;
  const logs = [
    "[PRODUCER] New order received: #10823",
    "[KAFKA] Event published to orders_topic",
    "[STREAM] Processing order #10823",
    "[STREAM] Updated revenue metrics",
    "[STORE] Written to ClickHouse",
    "[DASHBOARD] Dashboard updated (" + streamLatencySeconds.toFixed(1) + "s)",
    "[BATCH] Hourly job started",
    "[BATCH] Extracted " + batchOrders.toLocaleString() + " records",
    "[BATCH] Transform completed",
    "[BATCH] Loaded to warehouse",
    "[BATCH] Dashboard refreshed (" + batchLatencyMinutes + " min)",
  ];
  if (options.failures) logs.splice(5, 0, "[RETRY] Stream task recovered after transient failure");
  if (options.lateEvents) logs.splice(4, 0, "[WATERMARK] Late event accepted within allowed lateness");
  if (options.outOfOrder) logs.splice(5, 0, "[ORDERING] Event-time reorder applied");

  return {
    batchOrders,
    batchLatencyMinutes,
    batchFreshnessMinutes,
    streamingOrders,
    streamLatencySeconds,
    throughput: "High",
    logs,
  };
}
