import { ResourceTable } from "@/components/shared/ResourceTable";
import { mockDaemonSets } from "@/lib/mock-data";

export default function DaemonSets() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">DaemonSets</h1>
        <p className="text-muted-foreground">Manage node-level daemons</p>
      </div>
      <ResourceTable
        data={mockDaemonSets}
        searchField="name"
        columns={[
          { header: "Name", accessor: "name", className: "font-medium" },
          { header: "Namespace", accessor: "namespace" },
          { header: "Desired", accessor: (r) => r.desired },
          { header: "Current", accessor: (r) => r.current },
          { header: "Ready", accessor: (r) => r.ready },
          { header: "Image", accessor: "image", className: "font-mono text-xs text-muted-foreground" },
          { header: "Age", accessor: "age" },
        ]}
        onRefresh={() => {}}
      />
    </div>
  );
}
