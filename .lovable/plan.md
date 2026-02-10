

# Kubernetes Dashboard

A full-featured, light & professional Kubernetes management dashboard with user authentication and kubeconfig-based cluster connection.

## 1. Authentication & User Management
- **Login & signup pages** with email/password authentication via Supabase
- **User profiles** to store display name and associated cluster connections
- Protected routes — unauthenticated users are redirected to login

## 2. Cluster Connection
- **Kubeconfig upload page** where users can upload their kubeconfig file to connect a cluster
- Support for **multiple clusters** — users can add, switch between, and remove clusters
- Cluster connection status indicator (connected/disconnected) in the header
- Kubeconfig files stored securely in Supabase (encrypted at rest)
- A **proxy edge function** that receives API requests from the frontend and forwards them to the connected K8s cluster API server using the stored kubeconfig credentials

## 3. Dashboard Layout
- **Sidebar navigation** with collapsible menu organized by resource categories
- **Top header** with cluster selector dropdown, connection status, and user menu
- Light, professional design inspired by Rancher/Datadog with clean typography and card-based layouts

## 4. Cluster Overview Page
- Summary cards showing total counts: Nodes, Namespaces, Pods, Deployments, Services
- Cluster health status at a glance
- Recent events feed
- Resource utilization summary (CPU/memory across nodes)

## 5. Workloads Management
- **Pods**: List view with status indicators, logs viewer, restart/delete actions, filtering by namespace
- **Deployments**: List with replica counts, scale up/down controls, rollout status, restart/delete
- **StatefulSets**: List with replica management and status
- **DaemonSets**: List with node coverage and status
- **Jobs & CronJobs**: List with completion status, logs, create/delete actions

## 6. Nodes & Resources
- **Node list** with status, roles, CPU/memory usage bars
- Node detail view with conditions, capacity, allocatable resources, and running pods
- Resource usage charts (CPU and memory) using Recharts

## 7. Services & Networking
- **Services**: List with type (ClusterIP/NodePort/LoadBalancer), ports, endpoints, create/delete
- **Ingresses**: List with hosts, paths, backends, create/edit/delete

## 8. Configuration & Storage
- **ConfigMaps**: List, view content, create/edit/delete
- **Secrets**: List (values masked by default, reveal on click), create/edit/delete
- **Persistent Volumes & PVCs**: List with capacity, status, storage class, access modes

## 9. Namespaces & RBAC
- **Namespace management**: List, create, delete namespaces
- **Global namespace filter** in the header that applies across all resource views
- **Roles & RoleBindings**: View existing roles, cluster roles, and their bindings

## 10. Common Features Across All Views
- Search and filter by name, namespace, labels
- Bulk actions (delete multiple resources)
- YAML viewer/editor for any resource
- Refresh button and auto-refresh toggle
- Pagination for large resource lists
- Toast notifications for action success/failure

