import { ResourceTable } from "@/components/shared/ResourceTable";
import { mockCronJobs } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";

export default function CronJobs() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">CronJobs</h1>
        <p className="text-muted-foreground">Manage scheduled jobs</p>
      </div>
      <ResourceTable
        data={mockCronJobs}
        searchField="name"
        columns={[
          { header: "Name", accessor: "name", className: "font-medium" },
          { header: "Namespace", accessor: "namespace" },
          { header: "Schedule", accessor: "schedule", className: "font-mono text-xs" },
          { header: "Last Schedule", accessor: "lastSchedule" },
          { header: "Active", accessor: (r) => r.active },
          { header: "Suspended", accessor: (r) => r.suspend ? <Badge variant="secondary">Yes</Badge> : <Badge variant="outline">No</Badge> },
        ]}
        onRefresh={() => {}}
      />
    </div>
  );
}
