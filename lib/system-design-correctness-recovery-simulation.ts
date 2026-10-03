export type CorrectnessScenarioId = "worker-retry" | "network-timeout" | "duplicate-burst";
export type FailureMode = "none" | "worker-crash" | "network-timeout" | "duplicate-events";

export type CorrectnessScenario = {
  id: CorrectnessScenarioId;
  label: string;
  totalEvents: number;
  baseDuplicates: number;
  baseDlq: number;
  processedUnique: number;
};

export type CorrectnessResult = {
  totalEvents: number;
  processedUnique: number;
  duplicatesReceived: number;
  failedDlq: number;
  logs: string[];
  takeaways: string[];
};

export const correctnessScenarios: CorrectnessScenario[] = [
  { id: "worker-retry", label: "Scenario 1: Worker Failure & Retry", totalEvents: 10_000, baseDuplicates: 240, baseDlq: 20, processedUnique: 9_980 },
  { id: "network-timeout", label: "Scenario 2: Network Timeout", totalEvents: 12_000, baseDuplicates: 180, baseDlq: 35, processedUnique: 11_965 },
  { id: "duplicate-burst", label: "Scenario 3: Duplicate Event Burst", totalEvents: 8_500, baseDuplicates: 620, baseDlq: 12, processedUnique: 8_488 },
];

export function getCorrectnessScenario(id: CorrectnessScenarioId): CorrectnessScenario {
  return correctnessScenarios.find(item => item.id === id) ?? correctnessScenarios[0];
}

export function simulateCorrectness(scenario: CorrectnessScenario, failureMode: FailureMode): CorrectnessResult {
  const duplicateMultiplier =
    failureMode === "duplicate-events" ? 2.2 :
    failureMode === "worker-crash" ? 1 :
    failureMode === "network-timeout" ? 1.25 : .35;
  const dlqMultiplier =
    failureMode === "worker-crash" ? 1 :
    failureMode === "network-timeout" ? 1.4 :
    failureMode === "duplicate-events" ? .7 : .2;

  const duplicatesReceived = Math.max(0, Math.round(scenario.baseDuplicates * duplicateMultiplier));
  const failedDlq = Math.max(0, Math.round(scenario.baseDlq * dlqMultiplier));
  const processedUnique = Math.max(0, scenario.totalEvents - failedDlq);

  const logs = [
    "[PRODUCE] order_id=1001",
    "[PRODUCE] order_id=1002",
    "[CONSUME] order_id=1001",
    "[PROCESS] order_id=1001 ✓",
    "[PROCESS] order_id=1002 ✓",
  ];

  if (failureMode === "worker-crash") {
    logs.push("[FAILURE] Worker crashed", "[RETRY] Reprocessing last batch");
  } else if (failureMode === "network-timeout") {
    logs.push("[TIMEOUT] Sink acknowledgement timed out", "[RETRY] Replaying from checkpoint");
  } else if (failureMode === "duplicate-events") {
    logs.push("[DUPLICATE] Broker redelivered recent events", "[RETRY] Consumer receives duplicate keys");
  } else {
    logs.push("[HEALTHY] No simulated failure");
  }

  logs.push(
    "[CONSUME] order_id=1001 (dup)",
    "[CONSUME] order_id=1002 (dup)",
    "[DEDUPE] Skipped duplicate 1001",
    "[DEDUPE] Skipped duplicate 1002",
    "[SINK] Upserted 2 new records ✓",
  );

  return {
    totalEvents: scenario.totalEvents,
    processedUnique,
    duplicatesReceived,
    failedDlq,
    logs,
    takeaways: [
      "Idempotent writes prevent duplicates during retries.",
      "Checkpoints allow safe recovery after failures.",
      "At-least-once delivery requires deduplication downstream.",
      "Dead-letter queues capture corrupt or repeatedly failing events.",
    ],
  };
}
