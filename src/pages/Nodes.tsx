import { ResourceTable } from "@/components/shared/ResourceTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { mockNodes } from "@/lib/mock-data";
import { Progress } from "@/components/ui/progress";

export default function Nodes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nodes</h1>
        <p className="text-muted-foreground">View node status and resource allocation</p>
      </div>
      <ResourceTable
        data={mockNodes}
        searchField="name"
        columns={[
          { header: "Name", accessor: "name", className: "font-medium" },
          { header: "Status", accessor: (r) => <StatusBadge status={r.status} /> },
          { header: "Roles", accessor: "roles" },
          { header: "CPU", accessor: (r) => {
            const pct = (parseFloat(r.cpuUsed) / parseFloat(r.cpuCapacity)) * 100;
            return (
              <div className="w-24 space-y-1">
                <Progress value={pct} className="h-1.5" />
                <span className="text-xs text-muted-foreground">{r.cpuUsed}/{r.cpuCapacity}</span>
              </div>
            );
          }},
          { header: "Memory", accessor: (r) => {
            const pct = (parseFloat(r.memoryUsed) / parseFloat(r.memoryCapacity)) * 100;
            return (
              <div className="w-24 space-y-1">
                <Progress value={pct} className="h-1.5" />
                <span className="text-xs text-muted-foreground">{r.memoryUsed}/{r.memoryCapacity}</span>
              </div>
            );
          }},
          { header: "Pods", accessor: (r) => r.pods },
          { header: "Version", accessor: "version", className: "font-mono text-xs" },
          { header: "Age", accessor: "age" },
        ]}
        onRefresh={() => {}}
      />
    </div>
  );
}
