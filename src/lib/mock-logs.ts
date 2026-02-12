// Mock Kubernetes pod/container logs

export interface LogEntry {
  timestamp: string;
  pod: string;
  container: string;
  namespace: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
}

const now = Date.now();
const min = 60_000;

function ts(offsetMin: number) {
  return new Date(now - offsetMin * min).toISOString();
}

export const mockLogs: LogEntry[] = [
  { timestamp: ts(0), pod: "api-gateway-7d8f9c6b5-xk2mn", container: "api-gateway", namespace: "default", level: "info", message: "GET /api/v1/users 200 12ms" },
  { timestamp: ts(0.2), pod: "api-gateway-7d8f9c6b5-xk2mn", container: "api-gateway", namespace: "default", level: "info", message: "POST /api/v1/auth/login 200 45ms" },
  { timestamp: ts(0.5), pod: "worker-processor-3b2a1c9d8-xy5za", container: "worker", namespace: "default", level: "error", message: "FATAL: unable to connect to database at postgres.database.svc:5432 - connection refused" },
  { timestamp: ts(0.7), pod: "worker-processor-3b2a1c9d8-xy5za", container: "worker", namespace: "default", level: "error", message: "Liveness probe failed: HTTP probe failed with statuscode: 503" },
  { timestamp: ts(1), pod: "worker-processor-3b2a1c9d8-xy5za", container: "worker", namespace: "default", level: "warn", message: "Back-off restarting failed container worker in pod worker-processor-3b2a1c9d8-xy5za" },
  { timestamp: ts(1.5), pod: "auth-service-5c4d3b2a1-pq9rs", container: "auth-service", namespace: "default", level: "warn", message: "JWT token expiry window approaching for user session sid_a8f3c2" },
  { timestamp: ts(2), pod: "redis-cache-6a5b4c3d2-tu7vw", container: "redis", namespace: "cache", level: "info", message: "DB saved on disk" },
  { timestamp: ts(2.5), pod: "redis-cache-6a5b4c3d2-tu7vw", container: "redis", namespace: "cache", level: "warn", message: "Memory usage above 75% threshold: 192Mi / 256Mi" },
  { timestamp: ts(3), pod: "postgres-0", container: "postgres", namespace: "database", level: "info", message: "checkpoint starting: time" },
  { timestamp: ts(3.5), pod: "postgres-0", container: "postgres", namespace: "database", level: "info", message: "checkpoint complete: wrote 245 buffers (1.5%); 0 WAL file(s) added" },
  { timestamp: ts(5), pod: "frontend-app-8e7f6d5c4-lm3no", container: "nginx", namespace: "default", level: "info", message: '10.244.1.1 - - "GET / HTTP/1.1" 200 2048 "-" "Mozilla/5.0"' },
  { timestamp: ts(6), pod: "monitoring-agent-9f8e7d6c5-bc1de", container: "monitoring-agent", namespace: "monitoring", level: "error", message: "FailedScheduling: 0/3 nodes are available: insufficient memory on all nodes" },
  { timestamp: ts(7), pod: "monitoring-agent-9f8e7d6c5-bc1de", container: "monitoring-agent", namespace: "monitoring", level: "warn", message: "Pod stuck in Pending state for 5m, no suitable node found" },
  { timestamp: ts(10), pod: "batch-job-runner-1a2b3c4d5-fg6hi", container: "batch-runner", namespace: "jobs", level: "info", message: "Processing batch item 1482/2000 - estimated completion: 25 minutes" },
  { timestamp: ts(12), pod: "api-gateway-7d8f9c6b5-xk2mn", container: "api-gateway", namespace: "default", level: "error", message: "Upstream service auth-service returned 504 Gateway Timeout after 30s" },
  { timestamp: ts(15), pod: "api-gateway-7d8f9c6b5-xk2mn", container: "api-gateway", namespace: "default", level: "warn", message: "Circuit breaker OPEN for auth-service after 5 consecutive failures" },
  { timestamp: ts(20), pod: "postgres-0", container: "postgres", namespace: "database", level: "warn", message: "connection pool exhausted: 100/100 connections in use, 12 waiting" },
  { timestamp: ts(25), pod: "worker-processor-3b2a1c9d8-xy5za", container: "worker", namespace: "default", level: "error", message: "CrashLoopBackOff: back-off 5m0s restarting failed container=worker pod=worker-processor-3b2a1c9d8-xy5za" },
  { timestamp: ts(30), pod: "batch-job-runner-1a2b3c4d5-fg6hi", container: "batch-runner", namespace: "jobs", level: "debug", message: "Checkpoint saved at item 1400, resumable" },
  { timestamp: ts(35), pod: "redis-cache-6a5b4c3d2-tu7vw", container: "redis", namespace: "cache", level: "error", message: "OOM command not allowed when used memory > maxmemory: eviction policy noeviction" },
  { timestamp: ts(40), pod: "auth-service-5c4d3b2a1-pq9rs", container: "auth-service", namespace: "default", level: "info", message: "Refreshed OIDC discovery document from https://accounts.google.com/.well-known/openid-configuration" },
  { timestamp: ts(45), pod: "frontend-app-8e7f6d5c4-lm3no", container: "nginx", namespace: "default", level: "warn", message: "upstream timed out (110: Connection timed out) while reading response header from upstream" },
  { timestamp: ts(50), pod: "api-gateway-7d8f9c6b5-xk2mn", container: "api-gateway", namespace: "default", level: "info", message: "Health check passed - all downstream services healthy" },
  { timestamp: ts(55), pod: "postgres-0", container: "postgres", namespace: "database", level: "error", message: "FATAL: too many connections for role \"app_user\"" },
  { timestamp: ts(60), pod: "worker-processor-3b2a1c9d8-xy5za", container: "worker", namespace: "default", level: "error", message: "OOMKilled: container exceeded memory limit of 512Mi" },
];

export function getClusterContext() {
  // Build a summary string for the AI chatbot
  return {
    pods: [
      { name: "worker-processor", status: "CrashLoopBackOff", restarts: 15, namespace: "default" },
      { name: "monitoring-agent", status: "Pending", restarts: 0, namespace: "monitoring" },
      { name: "api-gateway", status: "Running", restarts: 0, namespace: "default" },
      { name: "auth-service", status: "Running", restarts: 1, namespace: "default" },
      { name: "postgres-0", status: "Running", restarts: 0, namespace: "database" },
      { name: "redis-cache", status: "Running", restarts: 2, namespace: "cache" },
    ],
    events: [
      { type: "Warning", reason: "BackOff", object: "pod/worker-processor", message: "Back-off restarting failed container" },
      { type: "Warning", reason: "FailedScheduling", object: "pod/monitoring-agent", message: "0/3 nodes are available: insufficient memory" },
      { type: "Warning", reason: "OOMKilled", object: "pod/worker-processor", message: "Container exceeded memory limit" },
    ],
    nodes: [
      { name: "node-1", cpu: "3.2/8", memory: "10.5Gi/16Gi", pods: 12 },
      { name: "node-2", cpu: "8.7/16", memory: "22.1Gi/32Gi", pods: 28 },
      { name: "node-3", cpu: "12.1/16", memory: "28.4Gi/32Gi", pods: 35 },
    ],
    recentErrors: [
      "worker-processor: FATAL: unable to connect to database - connection refused",
      "worker-processor: CrashLoopBackOff after 15 restarts",
      "worker-processor: OOMKilled - exceeded 512Mi memory limit",
      "monitoring-agent: FailedScheduling - insufficient memory on all nodes",
      "api-gateway: Upstream auth-service returned 504 Gateway Timeout",
      "postgres: connection pool exhausted - 100/100 connections",
      "redis: OOM command not allowed - eviction policy noeviction",
      "postgres: FATAL too many connections for role app_user",
    ],
  };
}
