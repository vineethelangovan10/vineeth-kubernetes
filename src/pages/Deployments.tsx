import { ResourceTable } from "@/components/shared/ResourceTable";
import { mockDeployments } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Minus, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Deployments() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Deployments</h1>
        <p className="text-muted-foreground">Manage deployment rollouts and scaling</p>
      </div>
      <ResourceTable
        data={mockDeployments}
        searchField="name"
        columns={[
          { header: "Name", accessor: "name", className: "font-medium" },
          { header: "Namespace", accessor: "namespace" },
          { header: "Replicas", accessor: (r) => {
            const [ready, total] = r.replicas.split("/");
            const ok = ready === total;
            return <Badge variant={ok ? "default" : "destructive"} className="font-mono">{r.replicas}</Badge>;
          }},
          { header: "Available", accessor: (r) => r.available },
          { header: "Strategy", accessor: "strategy" },
          { header: "Image", accessor: "image", className: "font-mono text-xs text-muted-foreground" },
          { header: "Age", accessor: "age" },
        ]}
        actions={(row) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7"><Minus className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7"><Plus className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7"><RotateCcw className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        )}
        onRefresh={() => {}}
      />
    </div>
  );
}
