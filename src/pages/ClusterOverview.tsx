import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { mockPods, mockDeployments, mockNodes, mockNamespaces, mockServices, mockEvents } from "@/lib/mock-data";
import { Server, Box, Layers, Network, FolderCog, AlertTriangle, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const stats = [
  { label: "Nodes", value: mockNodes.length, icon: Server, ready: mockNodes.filter((n) => n.status === "Ready").length },
  { label: "Namespaces", value: mockNamespaces.length, icon: FolderCog },
  { label: "Pods", value: mockPods.length, icon: Box, running: mockPods.filter((p) => p.status === "Running").length },
  { label: "Deployments", value: mockDeployments.length, icon: Layers },
  { label: "Services", value: mockServices.length, icon: Network },
];

export default function ClusterOverview() {
  const warningEvents = mockEvents.filter((e) => e.type === "Warning");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cluster Overview</h1>
        <p className="text-muted-foreground">Monitor your Kubernetes cluster health and resources</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <s.icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{s.value}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Node Resource Usage */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              CPU Usage by Node
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockNodes.map((node) => {
              const pct = (parseFloat(node.cpuUsed) / parseFloat(node.cpuCapacity)) * 100;
              return (
                <div key={node.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{node.name}</span>
                    <span className="text-muted-foreground">{node.cpuUsed}/{node.cpuCapacity} cores ({pct.toFixed(0)}%)</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Memory Usage by Node
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockNodes.map((node) => {
              const used = parseFloat(node.memoryUsed);
              const total = parseFloat(node.memoryCapacity);
              const pct = (used / total) * 100;
              return (
                <div key={node.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{node.name}</span>
                    <span className="text-muted-foreground">{node.memoryUsed}/{node.memoryCapacity} ({pct.toFixed(0)}%)</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Recent Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockEvents.map((event, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <StatusBadge status={event.type === "Warning" ? "Failed" : "Running"} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{event.reason} — <span className="font-normal text-muted-foreground">{event.object}</span></p>
                  <p className="text-muted-foreground truncate">{event.message}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{event.age}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
