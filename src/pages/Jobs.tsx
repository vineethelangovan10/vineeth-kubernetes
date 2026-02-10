import { ResourceTable } from "@/components/shared/ResourceTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { mockJobs } from "@/lib/mock-data";

export default function Jobs() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
        <p className="text-muted-foreground">Manage batch jobs</p>
      </div>
      <ResourceTable
        data={mockJobs}
        searchField="name"
        columns={[
          { header: "Name", accessor: "name", className: "font-medium" },
          { header: "Namespace", accessor: "namespace" },
          { header: "Completions", accessor: "completions" },
          { header: "Duration", accessor: "duration" },
          { header: "Status", accessor: (r) => <StatusBadge status={r.status} /> },
          { header: "Age", accessor: "age" },
        ]}
        onRefresh={() => {}}
      />
    </div>
  );
}
