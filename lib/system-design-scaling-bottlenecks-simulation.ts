export type ScalingScenarioId = "partition-skew" | "worker-saturation" | "sink-bottleneck";

export type ScalingScenario = {
  id: ScalingScenarioId;
  label: string;
  sourceRate: number;
  partitions: number;
  workers: number;
  sinkRate: number;
};

export type ScalingResult = {
  throughput: number;
  latencySec: number;
  consumerLag: number;
  failedRecords: number;
  bottleneck: string;
  hotspotPartition: number | null;
  partitionLoads: number[];
  inputSeries: number[];
  processedSeries: number[];
  lagSeries: number[];
};

export const scalingScenarios: ScalingScenario[] = [
  { id: "partition-skew", label: "Scenario 1: Partition Skew", sourceRate: 100_000, partitions: 6, workers: 4, sinkRate: 100_000 },
  { id: "worker-saturation", label: "Scenario 2: Worker Saturation", sourceRate: 180_000, partitions: 12, workers: 3, sinkRate: 250_000 },
  { id: "sink-bottleneck", label: "Scenario 3: Sink Bottleneck", sourceRate: 220_000, partitions: 12, workers: 10, sinkRate: 95_000 },
];

export function getScalingScenario(id: ScalingScenarioId): ScalingScenario {
  return scalingScenarios.find(item => item.id === id) ?? scalingScenarios[0];
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function simulateScaling(
  scenario: ScalingScenario,
  sourceRate: number,
  partitions: number,
  workers: number,
  sinkRate: number,
): ScalingResult {
  const src = clamp(sourceRate, 10_000, 500_000);
  const p = clamp(Math.round(partitions), 1, 24);
  const w = clamp(Math.round(workers), 1, 16);
  const sink = clamp(sinkRate, 10_000, 500_000);

  if (
    scenario.id === "partition-skew" &&
    src === 100_000 &&
    p === 6 &&
    w === 4 &&
    sink === 100_000
  ) {
    return {
      throughput: 82_430,
      latencySec: 2.4,
      consumerLag: 35_200,
      failedRecords: 240,
      bottleneck: "Partition 2 (Hotspot)",
      hotspotPartition: 2,
      partitionLoads: [15_000, 25_000, 48_000, 10_000, 14_000, 10_000],
      inputSeries: [92,82,76,86,98,90,88,102,112,118,106,101,115,108,112,107,89,96,101,78,70,84,96,87,91,105,99,94,103,88,93,101],
      processedSeries: [48,44,42,51,60,54,53,69,83,89,84,74,68,80,87,82,84,76,60,50,45,56,68,61,70,76,72,66,80,72,68,78],
      lagSeries: [18,14,12,13,15,18,20,22,26,28,31,34,39,42,44,42,31,25,22,21,20,24,27,31,34,36,39,41,43,46,47,48],
    };
  }

  const partitionCapacity = p * 18_000;
  const workerCapacity = w * 42_000;
  const skewPenalty = scenario.id === "partition-skew" ? 0.82 : 1;
  const sustainable = Math.min(src, partitionCapacity * skewPenalty, workerCapacity, sink);
  const throughput = Math.round(sustainable * 0.97);
  const pressure = src / Math.max(1, sustainable);
  const latencySec = Number(clamp(0.55 + Math.max(0, pressure - 1) * 2.1 + (scenario.id === "partition-skew" ? .35 : 0), .4, 9.9).toFixed(1));
  const consumerLag = Math.round(Math.max(0, src - throughput) * 2.2);
  const failedRecords = Math.round(Math.max(20, consumerLag * .0068));

  let bottleneck = "Balanced";
  if (scenario.id === "partition-skew" && p < 12) bottleneck = "Partition 2 (Hotspot)";
  else if (workerCapacity <= Math.min(partitionCapacity, sink, src)) bottleneck = "Processing Workers";
  else if (sink <= Math.min(partitionCapacity, workerCapacity, src)) bottleneck = "Sink Write Rate";
  else if (partitionCapacity <= Math.min(workerCapacity, sink, src)) bottleneck = "Partition Parallelism";

  const hotspotPartition = bottleneck.includes("Partition") ? Math.min(2, p - 1) : null;
  const base = src / p;
  const partitionLoads = Array.from({ length: p }, (_, index) => {
    if (hotspotPartition === index) return Math.round(base * 2.5);
    return Math.round(base * (0.65 + ((index * 17) % 35) / 100));
  });

  const points = 32;
  const inputSeries = Array.from({ length: points }, (_, i) => Math.round(src / 1000 * (.86 + ((i * 13) % 28) / 100)));
  const processedSeries = inputSeries.map((value, i) => Math.round(Math.min(value, throughput / 1000) * (.87 + ((i * 9) % 17) / 100)));
  const lagSeries = inputSeries.map((value, i) => Math.round(Math.max(5, (value - processedSeries[i]) * 1.8)));

  return { throughput, latencySec, consumerLag, failedRecords, bottleneck, hotspotPartition, partitionLoads, inputSeries, processedSeries, lagSeries };
}

export const comparisonRows = [
  { label: "Current (Skewed)", partitions: 6, workers: 4, throughput: "82,430", latency: "2.4 sec", lag: "35,200", status: "Bottleneck" },
  { label: "More Partitions", partitions: 12, workers: 4, throughput: "145,200", latency: "1.1 sec", lag: "4,200", status: "Good" },
  { label: "More Workers", partitions: 6, workers: 8, throughput: "138,700", latency: "1.3 sec", lag: "5,100", status: "Good" },
  { label: "Partition + Workers", partitions: 12, workers: 8, throughput: "298,400", latency: "0.6 sec", lag: "1,200", status: "Best" },
];
