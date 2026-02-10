import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, string> = {
  Running: "bg-success/10 text-success border-success/20",
  Succeeded: "bg-success/10 text-success border-success/20",
  Active: "bg-success/10 text-success border-success/20",
  Ready: "bg-success/10 text-success border-success/20",
  Bound: "bg-success/10 text-success border-success/20",
  Available: "bg-success/10 text-success border-success/20",
  Pending: "bg-warning/10 text-warning border-warning/20",
  ContainerCreating: "bg-warning/10 text-warning border-warning/20",
  Terminating: "bg-warning/10 text-warning border-warning/20",
  Failed: "bg-destructive/10 text-destructive border-destructive/20",
  CrashLoopBackOff: "bg-destructive/10 text-destructive border-destructive/20",
  Error: "bg-destructive/10 text-destructive border-destructive/20",
  Released: "bg-muted text-muted-foreground border-border",
  Complete: "bg-success/10 text-success border-success/20",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = statusColors[status] || "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={`${cls} font-medium`}>
      {status}
    </Badge>
  );
}
