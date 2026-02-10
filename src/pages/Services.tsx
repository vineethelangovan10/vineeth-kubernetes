import { ResourceTable } from "@/components/shared/ResourceTable";
import { mockServices } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function Services() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Services</h1>
        <p className="text-muted-foreground">Manage service endpoints and load balancing</p>
      </div>
      <ResourceTable
        data={mockServices}
        searchField="name"
        columns={[
          { header: "Name", accessor: "name", className: "font-medium" },
          { header: "Namespace", accessor: "namespace" },
          { header: "Type", accessor: (r) => <Badge variant="outline">{r.type}</Badge> },
          { header: "Cluster IP", accessor: "clusterIP", className: "font-mono text-xs" },
          { header: "External IP", accessor: "externalIP", className: "font-mono text-xs" },
          { header: "Ports", accessor: "ports", className: "font-mono text-xs" },
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
