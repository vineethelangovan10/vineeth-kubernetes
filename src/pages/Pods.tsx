import { ResourceTable } from "@/components/shared/ResourceTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { mockPods } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trash2 } from "lucide-react";

export default function Pods() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pods</h1>
        <p className="text-muted-foreground">Manage running pods across your cluster</p>
      </div>
      <ResourceTable
        data={mockPods}
        searchField="name"
        columns={[
          { header: "Name", accessor: "name", className: "font-medium font-mono text-xs" },
          { header: "Namespace", accessor: "namespace" },
          { header: "Status", accessor: (r) => <StatusBadge status={r.status} /> },
          { header: "Restarts", accessor: (r) => <span className={r.restarts > 5 ? "text-destructive font-medium" : ""}>{r.restarts}</span> },
          { header: "Node", accessor: "node" },
          { header: "CPU", accessor: "cpu" },
          { header: "Memory", accessor: "memory" },
          { header: "Age", accessor: "age" },
        ]}
        actions={(row) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7"><RotateCcw className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        )}
        onRefresh={() => {}}
      />
    </div>
  );
}
