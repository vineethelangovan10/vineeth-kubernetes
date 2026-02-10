import { ResourceTable } from "@/components/shared/ResourceTable";
import { mockRoles, mockRoleBindings } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RBAC() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Roles & Bindings</h1>
        <p className="text-muted-foreground">View RBAC configuration</p>
      </div>

      <Tabs defaultValue="roles">
        <TabsList>
          <TabsTrigger value="roles">Roles & ClusterRoles</TabsTrigger>
          <TabsTrigger value="bindings">RoleBindings</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="mt-4">
          <ResourceTable
            data={mockRoles}
            searchField="name"
            columns={[
              { header: "Name", accessor: "name", className: "font-medium" },
              { header: "Kind", accessor: (r) => <Badge variant="outline">{r.kind}</Badge> },
              { header: "Namespace", accessor: (r) => r.namespace || "—" },
              { header: "Rules", accessor: (r) => r.rules },
              { header: "Age", accessor: "age" },
            ]}
            onRefresh={() => {}}
          />
        </TabsContent>

        <TabsContent value="bindings" className="mt-4">
          <ResourceTable
            data={mockRoleBindings}
            searchField="name"
            columns={[
              { header: "Name", accessor: "name", className: "font-medium" },
              { header: "Kind", accessor: (r) => <Badge variant="outline">{r.kind}</Badge> },
              { header: "Namespace", accessor: (r) => r.namespace || "—" },
              { header: "Role", accessor: "role" },
              { header: "Subjects", accessor: "subjects", className: "font-mono text-xs" },
              { header: "Age", accessor: "age" },
            ]}
            onRefresh={() => {}}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
