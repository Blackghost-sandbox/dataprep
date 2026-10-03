export type StorageScenarioId = "ecommerce" | "media" | "fintech";
export type OperationalDb = "postgres" | "mysql" | "dynamodb";
export type EventStorage = "kafka-s3" | "kinesis-s3" | "pubsub-gcs";
export type AnalyticsStore = "snowflake" | "bigquery" | "redshift";
export type ServingStore = "redis" | "dynamodb" | "elastic";

export type StorageScenario = {
  id: StorageScenarioId;
  label: string;
  useCase: string;
  dailyOrders: number;
  products: number;
  eventsPerDay: number;
  analyticsQueries: string;
  retentionYears: number;
  baseIngestionRate: number;
  baseQueryLatencyMs: number;
  baseStorageTb: number;
  baseMonthlyCost: number;
};

export type StorageChoices = {
  operationalDb: OperationalDb;
  eventStorage: EventStorage;
  analyticsStore: AnalyticsStore;
  servingStore: ServingStore;
};

export type StorageResult = {
  ingestionRate: number;
  queryLatencyMs: number;
  storageTb: number;
  monthlyCost: number;
  logs: string[];
};

export const storageScenarios: StorageScenario[] = [
  {
    id: "ecommerce",
    label: "Scenario 1: E-commerce Platform",
    useCase: "E-commerce Platform",
    dailyOrders: 10_000_000,
    products: 500_000,
    eventsPerDay: 50_000_000,
    analyticsQueries: "Complex (BI)",
    retentionYears: 3,
    baseIngestionRate: 52_300,
    baseQueryLatencyMs: 320,
    baseStorageTb: 2.8,
    baseMonthlyCost: 1240,
  },
  {
    id: "media",
    label: "Scenario 2: Media Streaming",
    useCase: "Media Streaming",
    dailyOrders: 2_000_000,
    products: 8_000_000,
    eventsPerDay: 160_000_000,
    analyticsQueries: "Heavy scans",
    retentionYears: 2,
    baseIngestionRate: 91_600,
    baseQueryLatencyMs: 410,
    baseStorageTb: 6.2,
    baseMonthlyCost: 1980,
  },
  {
    id: "fintech",
    label: "Scenario 3: Fintech Transactions",
    useCase: "Fintech Transactions",
    dailyOrders: 18_000_000,
    products: 150_000,
    eventsPerDay: 82_000_000,
    analyticsQueries: "Low-latency audit",
    retentionYears: 7,
    baseIngestionRate: 68_400,
    baseQueryLatencyMs: 245,
    baseStorageTb: 4.6,
    baseMonthlyCost: 2210,
  },
];

export const defaultStorageChoices: StorageChoices = {
  operationalDb: "postgres",
  eventStorage: "kafka-s3",
  analyticsStore: "snowflake",
  servingStore: "redis",
};

export function getStorageScenario(id: StorageScenarioId): StorageScenario {
  return storageScenarios.find(item => item.id === id) ?? storageScenarios[0];
}

const analyticsLatencyFactor: Record<AnalyticsStore, number> = {
  snowflake: 1,
  bigquery: 1.08,
  redshift: 1.14,
};

const eventRateFactor: Record<EventStorage, number> = {
  "kafka-s3": 1,
  "kinesis-s3": 0.94,
  "pubsub-gcs": 1.03,
};

const costFactor: Record<AnalyticsStore, number> = {
  snowflake: 1,
  bigquery: 0.92,
  redshift: 0.86,
};

const servingCostFactor: Record<ServingStore, number> = {
  redis: 1,
  dynamodb: 1.08,
  elastic: 1.17,
};

export function simulateStoragePlatform(
  scenario: StorageScenario,
  choices: StorageChoices,
): StorageResult {
  const ingestionRate = Math.round(scenario.baseIngestionRate * eventRateFactor[choices.eventStorage]);
  const queryLatencyMs = Math.round(scenario.baseQueryLatencyMs * analyticsLatencyFactor[choices.analyticsStore]);
  const storageFactor = choices.eventStorage === "kafka-s3" ? 1 : choices.eventStorage === "kinesis-s3" ? 1.04 : 0.98;
  const storageTb = Number((scenario.baseStorageTb * storageFactor).toFixed(1));
  const monthlyCost = Math.round(
    scenario.baseMonthlyCost *
      costFactor[choices.analyticsStore] *
      servingCostFactor[choices.servingStore],
  );

  const logs = [
    "[SRC] Order created (id: 10023)",
    "[KAFKA] Event published → orders_topic",
    "[CDC] DB change captured (orders)",
    "[S3] Raw data written (parquet)",
    "[TRANSFORM] Curated table updated",
    "[WAREHOUSE] Data synced (" + analyticsLabel(choices.analyticsStore) + ")",
    "[CACHE] " + servingLabel(choices.servingStore) + " refreshed",
    "[API] Order available for serving",
  ];

  return { ingestionRate, queryLatencyMs, storageTb, monthlyCost, logs };
}

export function operationalLabel(value: OperationalDb): string {
  return value === "postgres"
    ? "PostgreSQL (Relational)"
    : value === "mysql"
      ? "MySQL (Relational)"
      : "DynamoDB (Key-value)";
}

export function eventStorageLabel(value: EventStorage): string {
  return value === "kafka-s3"
    ? "Kafka + S3 (Data Lake)"
    : value === "kinesis-s3"
      ? "Kinesis + S3"
      : "Pub/Sub + GCS";
}

export function analyticsLabel(value: AnalyticsStore): string {
  return value === "snowflake"
    ? "Snowflake (Warehouse)"
    : value === "bigquery"
      ? "BigQuery (Warehouse)"
      : "Redshift (Warehouse)";
}

export function servingLabel(value: ServingStore): string {
  return value === "redis"
    ? "Redis (Cache)"
    : value === "dynamodb"
      ? "DynamoDB (Serving)"
      : "Elasticsearch (Search)";
}
