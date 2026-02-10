// Mock K8s data for the dashboard UI

export const mockPods = [
  { name: "api-gateway-7d8f9c6b5-xk2mn", namespace: "default", status: "Running", restarts: 0, age: "2d", cpu: "45m", memory: "128Mi", node: "node-1", ip: "10.244.1.15" },
  { name: "auth-service-5c4d3b2a1-pq9rs", namespace: "default", status: "Running", restarts: 1, age: "5d", cpu: "120m", memory: "256Mi", node: "node-2", ip: "10.244.2.22" },
  { name: "frontend-app-8e7f6d5c4-lm3no", namespace: "default", status: "Running", restarts: 0, age: "1d", cpu: "30m", memory: "64Mi", node: "node-1", ip: "10.244.1.18" },
  { name: "postgres-0", namespace: "database", status: "Running", restarts: 0, age: "14d", cpu: "200m", memory: "512Mi", node: "node-3", ip: "10.244.3.10" },
  { name: "redis-cache-6a5b4c3d2-tu7vw", namespace: "cache", status: "Running", restarts: 2, age: "7d", cpu: "80m", memory: "192Mi", node: "node-2", ip: "10.244.2.30" },
  { name: "worker-processor-3b2a1c9d8-xy5za", namespace: "default", status: "CrashLoopBackOff", restarts: 15, age: "3h", cpu: "0m", memory: "0Mi", node: "node-1", ip: "10.244.1.25" },
  { name: "monitoring-agent-9f8e7d6c5-bc1de", namespace: "monitoring", status: "Pending", restarts: 0, age: "5m", cpu: "0m", memory: "0Mi", node: "", ip: "" },
  { name: "batch-job-runner-1a2b3c4d5-fg6hi", namespace: "jobs", status: "Running", restarts: 0, age: "12h", cpu: "500m", memory: "1Gi", node: "node-3", ip: "10.244.3.15" },
];

export const mockDeployments = [
  { name: "api-gateway", namespace: "default", replicas: "3/3", available: 3, upToDate: 3, age: "30d", strategy: "RollingUpdate", image: "api-gateway:v2.1.0" },
  { name: "auth-service", namespace: "default", replicas: "2/2", available: 2, upToDate: 2, age: "30d", strategy: "RollingUpdate", image: "auth-service:v1.8.3" },
  { name: "frontend-app", namespace: "default", replicas: "2/2", available: 2, upToDate: 2, age: "15d", strategy: "RollingUpdate", image: "frontend:v3.0.1" },
  { name: "worker-processor", namespace: "default", replicas: "1/3", available: 1, upToDate: 3, age: "30d", strategy: "RollingUpdate", image: "worker:v1.2.0" },
  { name: "monitoring-agent", namespace: "monitoring", replicas: "0/1", available: 0, upToDate: 1, age: "2d", strategy: "Recreate", image: "monitor:v0.9.0" },
];

export const mockStatefulSets = [
  { name: "postgres", namespace: "database", replicas: "3/3", ready: 3, age: "60d", image: "postgres:15.4" },
  { name: "elasticsearch", namespace: "logging", replicas: "3/3", ready: 3, age: "45d", image: "elasticsearch:8.10" },
  { name: "redis-cluster", namespace: "cache", replicas: "6/6", ready: 6, age: "30d", image: "redis:7.2" },
];

export const mockDaemonSets = [
  { name: "fluentd", namespace: "logging", desired: 3, current: 3, ready: 3, available: 3, age: "90d", image: "fluentd:v1.16" },
  { name: "node-exporter", namespace: "monitoring", desired: 3, current: 3, ready: 3, available: 3, age: "60d", image: "prom/node-exporter:v1.7" },
  { name: "calico-node", namespace: "kube-system", desired: 3, current: 3, ready: 3, available: 3, age: "120d", image: "calico/node:v3.26" },
];

export const mockJobs = [
  { name: "db-migration-v2", namespace: "database", completions: "1/1", duration: "45s", age: "2d", status: "Complete" },
  { name: "backup-20240115", namespace: "database", completions: "1/1", duration: "5m", age: "1d", status: "Complete" },
  { name: "data-cleanup", namespace: "default", completions: "0/1", duration: "-", age: "10m", status: "Active" },
];

export const mockCronJobs = [
  { name: "daily-backup", namespace: "database", schedule: "0 2 * * *", lastSchedule: "8h ago", active: 0, suspend: false },
  { name: "hourly-report", namespace: "monitoring", schedule: "0 * * * *", lastSchedule: "15m ago", active: 1, suspend: false },
  { name: "weekly-cleanup", namespace: "default", schedule: "0 0 * * 0", lastSchedule: "3d ago", active: 0, suspend: true },
];

export const mockNodes = [
  { name: "node-1", status: "Ready", roles: "control-plane,master", version: "v1.28.4", cpuCapacity: "8", cpuUsed: "3.2", memoryCapacity: "16Gi", memoryUsed: "10.5Gi", pods: 12, age: "120d", os: "Ubuntu 22.04", kernel: "5.15.0", containerRuntime: "containerd://1.7.2" },
  { name: "node-2", status: "Ready", roles: "worker", version: "v1.28.4", cpuCapacity: "16", cpuUsed: "8.7", memoryCapacity: "32Gi", memoryUsed: "22.1Gi", pods: 28, age: "120d", os: "Ubuntu 22.04", kernel: "5.15.0", containerRuntime: "containerd://1.7.2" },
  { name: "node-3", status: "Ready", roles: "worker", version: "v1.28.4", cpuCapacity: "16", cpuUsed: "12.1", memoryCapacity: "32Gi", memoryUsed: "28.4Gi", pods: 35, age: "90d", os: "Ubuntu 22.04", kernel: "5.15.0", containerRuntime: "containerd://1.7.2" },
];

export const mockServices = [
  { name: "api-gateway", namespace: "default", type: "LoadBalancer", clusterIP: "10.96.0.15", externalIP: "34.120.55.10", ports: "80:30080/TCP,443:30443/TCP", age: "30d" },
  { name: "auth-service", namespace: "default", type: "ClusterIP", clusterIP: "10.96.0.22", externalIP: "<none>", ports: "8080/TCP", age: "30d" },
  { name: "postgres", namespace: "database", type: "ClusterIP", clusterIP: "10.96.0.50", externalIP: "<none>", ports: "5432/TCP", age: "60d" },
  { name: "redis", namespace: "cache", type: "ClusterIP", clusterIP: "10.96.0.55", externalIP: "<none>", ports: "6379/TCP", age: "30d" },
  { name: "frontend", namespace: "default", type: "NodePort", clusterIP: "10.96.0.30", externalIP: "<none>", ports: "80:31080/TCP", age: "15d" },
];

export const mockIngresses = [
  { name: "main-ingress", namespace: "default", hosts: "app.example.com", address: "34.120.55.10", ports: "80, 443", age: "30d", paths: [{ path: "/api", backend: "api-gateway:80" }, { path: "/", backend: "frontend:80" }] },
  { name: "monitoring-ingress", namespace: "monitoring", hosts: "grafana.example.com", address: "34.120.55.10", ports: "80, 443", age: "15d", paths: [{ path: "/", backend: "grafana:3000" }] },
];

export const mockConfigMaps = [
  { name: "app-config", namespace: "default", data: 5, age: "30d" },
  { name: "nginx-config", namespace: "default", data: 2, age: "15d" },
  { name: "feature-flags", namespace: "default", data: 12, age: "7d" },
  { name: "coredns", namespace: "kube-system", data: 1, age: "120d" },
];

export const mockSecrets = [
  { name: "db-credentials", namespace: "database", type: "Opaque", data: 3, age: "60d" },
  { name: "tls-cert", namespace: "default", type: "kubernetes.io/tls", data: 2, age: "30d" },
  { name: "api-keys", namespace: "default", type: "Opaque", data: 4, age: "14d" },
  { name: "registry-pull-secret", namespace: "default", type: "kubernetes.io/dockerconfigjson", data: 1, age: "90d" },
];

export const mockPVs = [
  { name: "pv-postgres-0", capacity: "50Gi", accessModes: "RWO", reclaimPolicy: "Retain", status: "Bound", claim: "database/postgres-data-0", storageClass: "gp3", age: "60d" },
  { name: "pv-postgres-1", capacity: "50Gi", accessModes: "RWO", reclaimPolicy: "Retain", status: "Bound", claim: "database/postgres-data-1", storageClass: "gp3", age: "60d" },
  { name: "pv-elasticsearch-0", capacity: "100Gi", accessModes: "RWO", reclaimPolicy: "Delete", status: "Bound", claim: "logging/es-data-0", storageClass: "gp3", age: "45d" },
  { name: "pv-available", capacity: "20Gi", accessModes: "RWO", reclaimPolicy: "Delete", status: "Available", claim: "", storageClass: "gp3", age: "2d" },
];

export const mockNamespaces = [
  { name: "default", status: "Active", age: "120d", pods: 8, services: 3 },
  { name: "kube-system", status: "Active", age: "120d", pods: 12, services: 2 },
  { name: "kube-public", status: "Active", age: "120d", pods: 0, services: 0 },
  { name: "database", status: "Active", age: "60d", pods: 3, services: 1 },
  { name: "cache", status: "Active", age: "30d", pods: 7, services: 1 },
  { name: "monitoring", status: "Active", age: "60d", pods: 5, services: 3 },
  { name: "logging", status: "Active", age: "45d", pods: 4, services: 1 },
  { name: "jobs", status: "Active", age: "14d", pods: 2, services: 0 },
];

export const mockRoles = [
  { name: "admin", namespace: "default", kind: "Role", rules: 15, age: "120d" },
  { name: "viewer", namespace: "default", kind: "Role", rules: 5, age: "90d" },
  { name: "cluster-admin", namespace: "", kind: "ClusterRole", rules: 50, age: "120d" },
  { name: "node-reader", namespace: "", kind: "ClusterRole", rules: 3, age: "60d" },
];

export const mockRoleBindings = [
  { name: "admin-binding", namespace: "default", kind: "RoleBinding", role: "admin", subjects: "user:admin@example.com", age: "120d" },
  { name: "viewer-binding", namespace: "default", kind: "RoleBinding", role: "viewer", subjects: "group:developers", age: "90d" },
  { name: "cluster-admin-binding", namespace: "", kind: "ClusterRoleBinding", role: "cluster-admin", subjects: "user:admin@example.com", age: "120d" },
];

export const mockEvents = [
  { type: "Warning", reason: "BackOff", object: "pod/worker-processor-3b2a1c9d8-xy5za", message: "Back-off restarting failed container", age: "2m", count: 15 },
  { type: "Normal", reason: "Scheduled", object: "pod/monitoring-agent-9f8e7d6c5-bc1de", message: "Successfully assigned monitoring/monitoring-agent", age: "5m", count: 1 },
  { type: "Warning", reason: "FailedScheduling", object: "pod/monitoring-agent-9f8e7d6c5-bc1de", message: "0/3 nodes are available: insufficient memory", age: "5m", count: 3 },
  { type: "Normal", reason: "ScalingReplicaSet", object: "deployment/api-gateway", message: "Scaled up replica set api-gateway-7d8f9c6b5 to 3", age: "2d", count: 1 },
  { type: "Normal", reason: "Pulling", object: "pod/frontend-app-8e7f6d5c4-lm3no", message: "Pulling image frontend:v3.0.1", age: "1d", count: 1 },
];
