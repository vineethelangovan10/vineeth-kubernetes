import { ResourceTable } from "@/components/shared/ResourceTable";
import { mockStatefulSets } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";

export default function StatefulSets() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">StatefulSets</h1>
        <p className="text-muted-foreground">Manage stateful applications</p>
      </div>
      <ResourceTable
        data={mockStatefulSets}
        searchField="name"
        columns={[
          { header: "Name", accessor: "name", className: "font-medium" },
          { header: "Namespace", accessor: "namespace" },
          { header: "Replicas", accessor: (r) => <Badge variant="default" className="font-mono">{r.replicas}</Badge> },
          { header: "Ready", accessor: (r) => r.ready },
          { header: "Image", accessor: "image", className: "font-mono text-xs text-muted-foreground" },
          { header: "Age", accessor: "age" },
        ]}
        onRefresh={() => {}}
      />
    </div>
  );
}
