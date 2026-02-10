import { ResourceTable } from "@/components/shared/ResourceTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { mockNamespaces } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function Namespaces() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Namespaces</h1>
        <p className="text-muted-foreground">Manage cluster namespaces</p>
      </div>
      <ResourceTable
        data={mockNamespaces}
        searchField="name"
        columns={[
          { header: "Name", accessor: "name", className: "font-medium" },
          { header: "Status", accessor: (r) => <StatusBadge status={r.status} /> },
          { header: "Pods", accessor: (r) => r.pods },
          { header: "Services", accessor: (r) => r.services },
          { header: "Age", accessor: "age" },
        ]}
        actions={(row) => (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
        )}
        onRefresh={() => {}}
      />
    </div>
  );
}
