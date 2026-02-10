import { ResourceTable } from "@/components/shared/ResourceTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { mockPVs } from "@/lib/mock-data";

export default function Storage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Persistent Volumes & PVCs</h1>
        <p className="text-muted-foreground">Manage cluster storage resources</p>
      </div>
      <ResourceTable
        data={mockPVs}
        searchField="name"
        columns={[
          { header: "Name", accessor: "name", className: "font-medium" },
          { header: "Capacity", accessor: "capacity" },
          { header: "Access Modes", accessor: "accessModes" },
          { header: "Reclaim Policy", accessor: "reclaimPolicy" },
          { header: "Status", accessor: (r) => <StatusBadge status={r.status} /> },
          { header: "Claim", accessor: "claim", className: "font-mono text-xs text-muted-foreground" },
          { header: "Storage Class", accessor: "storageClass" },
          { header: "Age", accessor: "age" },
        ]}
        onRefresh={() => {}}
      />
    </div>
  );
}
