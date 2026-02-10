import { ResourceTable } from "@/components/shared/ResourceTable";
import { mockSecrets } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Secrets() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Secrets</h1>
        <p className="text-muted-foreground">Manage sensitive configuration data</p>
      </div>
      <ResourceTable
        data={mockSecrets}
        searchField="name"
        columns={[
          { header: "Name", accessor: "name", className: "font-medium" },
          { header: "Namespace", accessor: "namespace" },
          { header: "Type", accessor: (r) => <Badge variant="outline" className="font-mono text-xs">{r.type}</Badge> },
          { header: "Data Keys", accessor: (r) => r.data },
          { header: "Age", accessor: "age" },
        ]}
        actions={(row) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        )}
        onRefresh={() => {}}
      />
    </div>
  );
}
