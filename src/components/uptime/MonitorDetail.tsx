import { useState, useEffect } from "react";
import { Monitor, MonitorCheck, useMonitors } from "@/hooks/useMonitors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  monitor: Monitor;
  onBack: () => void;
}

export default function MonitorDetail({ monitor, onBack }: Props) {
  const { runCheck, fetchChecks } = useMonitors();
  const [checks, setChecks] = useState<MonitorCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const loadChecks = async () => {
    setLoading(true);
    const data = await fetchChecks(monitor.id);
    setChecks(data);
    setLoading(false);
  };

  useEffect(() => {
    loadChecks();
  }, [monitor.id]);

  const handleCheck = async () => {
    setChecking(true);
    try {
      await runCheck(monitor.id);
      toast({ title: "Check complete" });
      await loadChecks();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setChecking(false);
  };

  const statusColor = (s: string) => {
    if (s === "up") return "bg-success text-success-foreground";
    if (s === "down") return "bg-destructive text-destructive-foreground";
    return "bg-muted text-muted-foreground";
  };

  const uptimePercent = checks.length > 0
    ? ((checks.filter(c => c.status === "up").length / checks.length) * 100).toFixed(2)
    : "N/A";

  const avgResponseTime = checks.length > 0
    ? Math.round(checks.filter(c => c.response_time_ms).reduce((a, c) => a + (c.response_time_ms || 0), 0) / checks.filter(c => c.response_time_ms).length)
    : "N/A";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{monitor.name}</h1>
          <p className="text-sm text-muted-foreground">{monitor.endpoint}{monitor.request_path || ""}</p>
        </div>
        <Badge className={statusColor(monitor.current_status)}>{monitor.current_status.toUpperCase()}</Badge>
        <Button size="sm" onClick={handleCheck} disabled={checking}>
          <Play className={`mr-2 h-4 w-4 ${checking ? "animate-pulse" : ""}`} />
          Run Check
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <div className="text-sm text-muted-foreground">Type</div>
          <div className="font-medium text-foreground">{monitor.monitor_type.toUpperCase()}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <div className="text-sm text-muted-foreground">Environment</div>
          <div className="font-medium text-foreground">{monitor.environment}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <div className="text-sm text-muted-foreground">Uptime</div>
          <div className="font-medium text-foreground">{uptimePercent}%</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <div className="text-sm text-muted-foreground">Avg Response</div>
          <div className="font-medium text-foreground">{avgResponseTime}ms</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <div className="text-sm text-muted-foreground">SLA Target</div>
          <div className="font-medium text-foreground">{monitor.sla_target}%</div>
        </CardContent></Card>
      </div>

      {/* Config Details */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Configuration</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">Interval:</span> <span className="text-foreground">{monitor.check_interval_seconds}s</span></div>
            <div><span className="text-muted-foreground">Timeout:</span> <span className="text-foreground">{monitor.timeout_seconds}s</span></div>
            <div><span className="text-muted-foreground">Retries:</span> <span className="text-foreground">{monitor.retry_count}</span></div>
            <div><span className="text-muted-foreground">Expected:</span> <span className="text-foreground">{monitor.expected_status_code || "Any"}</span></div>
            <div><span className="text-muted-foreground">Fail Threshold:</span> <span className="text-foreground">{monitor.failure_threshold}</span></div>
            <div><span className="text-muted-foreground">Recovery Threshold:</span> <span className="text-foreground">{monitor.recovery_threshold}</span></div>
            <div><span className="text-muted-foreground">TLS Check:</span> <span className="text-foreground">{monitor.tls_check_enabled ? "Enabled" : "Disabled"}</span></div>
            <div><span className="text-muted-foreground">Owner:</span> <span className="text-foreground">{monitor.owner || "—"}</span></div>
          </div>
          {monitor.tags && Object.keys(monitor.tags).length > 0 && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {Object.entries(monitor.tags).map(([k, v]) => (
                <Badge key={k} variant="outline" className="text-xs">{k}={v}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Check History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Check History</CardTitle>
          <Button variant="ghost" size="sm" onClick={loadChecks}><RefreshCw className="h-3 w-3 mr-1" />Refresh</Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-6 text-muted-foreground">Loading...</div>
          ) : checks.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">No checks yet. Run a check to get started.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Status Code</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checks.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="text-xs">{new Date(c.checked_at).toLocaleString()}</TableCell>
                      <TableCell><Badge className={statusColor(c.status)}>{c.status.toUpperCase()}</Badge></TableCell>
                      <TableCell>{c.response_time_ms ? `${c.response_time_ms}ms` : "—"}</TableCell>
                      <TableCell>{c.status_code || "—"}</TableCell>
                      <TableCell className="text-xs text-destructive max-w-xs truncate">{c.error_message || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
