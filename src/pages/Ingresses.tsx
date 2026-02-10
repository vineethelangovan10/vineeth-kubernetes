import { ResourceTable } from "@/components/shared/ResourceTable";
import { mockIngresses } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";

export default function Ingresses() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ingresses</h1>
        <p className="text-muted-foreground">Manage ingress routing rules</p>
      </div>
      <ResourceTable
        data={mockIngresses}
        searchField="name"
        columns={[
          { header: "Name", accessor: "name", className: "font-medium" },
          { header: "Namespace", accessor: "namespace" },
          { header: "Hosts", accessor: "hosts", className: "font-mono text-xs" },
          { header: "Address", accessor: "address", className: "font-mono text-xs" },
          { header: "Ports", accessor: "ports" },
          { header: "Age", accessor: "age" },
        ]}
        actions={(row) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        )}
        onRefresh={() => {}}
      />
    </div>
  );
}
