import { useState } from "react";
import { useMonitors, Monitor } from "@/hooks/useMonitors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Activity, Plus, Play, Trash2, Settings, Clock, Shield, Bell, BarChart3, RefreshCw, Eye } from "lucide-react";
import MonitorDetail from "@/components/uptime/MonitorDetail";

export default function UptimeMonitoring() {
  const { monitors, loading, createMonitor, deleteMonitor, runCheck, runAllChecks, fetchMonitors } = useMonitors();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState<Monitor | null>(null);
  const [checking, setChecking] = useState<string | null>(null);
  const [checkingAll, setCheckingAll] = useState(false);

  const statusColor = (s: string) => {
    if (s === "up") return "bg-success text-success-foreground";
    if (s === "down") return "bg-destructive text-destructive-foreground";
    if (s === "maintenance") return "bg-warning text-warning-foreground";
    return "bg-muted text-muted-foreground";
  };

  const handleRunCheck = async (id: string) => {
    setChecking(id);
    try {
      await runCheck(id);
      toast({ title: "Check complete" });
    } catch (e: any) {
      toast({ title: "Check failed", description: e.message, variant: "destructive" });
    }
    setChecking(null);
  };

  const handleRunAll = async () => {
    setCheckingAll(true);
    try {
      await runAllChecks();
      toast({ title: "All checks complete" });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
    setCheckingAll(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMonitor(id);
      toast({ title: "Monitor deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  if (selectedMonitor) {
    return (
      <MonitorDetail
        monitor={selectedMonitor}
        onBack={() => { setSelectedMonitor(null); fetchMonitors(); }}
      />
    );
  }

  const upCount = monitors.filter(m => m.current_status === "up").length;
  const downCount = monitors.filter(m => m.current_status === "down").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Uptime Monitoring</h1>
          <p className="text-muted-foreground text-sm">Probe-style health checks for your applications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRunAll} disabled={checkingAll}>
            <RefreshCw className={`mr-2 h-4 w-4 ${checkingAll ? "animate-spin" : ""}`} />
            Check All
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-2 h-4 w-4" />Add Monitor</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Monitor</DialogTitle>
              </DialogHeader>
              <AddMonitorForm onSuccess={() => { setAddOpen(false); fetchMonitors(); }} createMonitor={createMonitor} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <div className="text-3xl font-bold text-foreground">{monitors.length}</div>
          <p className="text-sm text-muted-foreground">Total Monitors</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <div className="text-3xl font-bold text-success">{upCount}</div>
          <p className="text-sm text-muted-foreground">Up</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <div className="text-3xl font-bold text-destructive">{downCount}</div>
          <p className="text-sm text-muted-foreground">Down</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <div className="text-3xl font-bold text-muted-foreground">{monitors.length - upCount - downCount}</div>
          <p className="text-sm text-muted-foreground">Unknown</p>
        </CardContent></Card>
      </div>

      {/* Monitor List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading monitors...</div>
      ) : monitors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No monitors configured</h3>
            <p className="text-muted-foreground text-sm mt-1">Add your first monitor to start tracking uptime.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {monitors.map((m) => (
            <Card key={m.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <Badge className={statusColor(m.current_status)}>{m.current_status.toUpperCase()}</Badge>
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">{m.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {m.monitor_type.toUpperCase()} • {m.endpoint}{m.request_path || ""} • {m.environment}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {m.last_checked_at && (
                    <span className="hidden md:inline text-xs">
                      Last: {new Date(m.last_checked_at).toLocaleString()}
                    </span>
                  )}
                  <Badge variant="outline" className="text-xs">{m.check_interval_seconds}s</Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedMonitor(m)} title="View details">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleRunCheck(m.id)} disabled={checking === m.id} title="Run check">
                      <Play className={`h-4 w-4 ${checking === m.id ? "animate-pulse" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)} title="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AddMonitorForm({ onSuccess, createMonitor }: { onSuccess: () => void; createMonitor: (m: Partial<Monitor>) => Promise<void> }) {
  const [form, setForm] = useState({
    name: "", description: "", environment: "prod", owner: "",
    monitor_type: "https", endpoint: "", port: "", request_path: "/health",
    http_method: "GET", check_interval_seconds: "60", timeout_seconds: "10",
    retry_count: "3", expected_status_code: "200", expected_body_match: "",
    auth_type: "none", auth_credentials: "",
    failure_threshold: "3", recovery_threshold: "2",
    alert_severity: "critical", sla_target: "99.9",
    business_hours: "24x7", monitoring_region: "global",
    latency_warning_ms: "500", latency_critical_ms: "2000",
    tls_check_enabled: true, tls_expiry_alert_days: "15",
    tags: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.endpoint) {
      toast({ title: "Name and endpoint are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const tags: Record<string, string> = {};
      if (form.tags) {
        form.tags.split(",").forEach(t => {
          const [k, v] = t.split("=").map(s => s.trim());
          if (k) tags[k] = v || "";
        });
      }
      await createMonitor({
        name: form.name,
        description: form.description || null,
        environment: form.environment,
        owner: form.owner || null,
        tags,
        monitor_type: form.monitor_type,
        endpoint: form.endpoint,
        port: form.port ? parseInt(form.port) : null,
        request_path: form.request_path || null,
        http_method: form.http_method,
        check_interval_seconds: parseInt(form.check_interval_seconds),
        timeout_seconds: parseInt(form.timeout_seconds),
        retry_count: parseInt(form.retry_count),
        expected_status_code: form.expected_status_code ? parseInt(form.expected_status_code) : null,
        expected_body_match: form.expected_body_match || null,
        auth_type: form.auth_type,
        auth_credentials: form.auth_credentials || null,
        failure_threshold: parseInt(form.failure_threshold),
        recovery_threshold: parseInt(form.recovery_threshold),
        alert_severity: form.alert_severity,
        sla_target: parseFloat(form.sla_target),
        business_hours: form.business_hours,
        monitoring_region: form.monitoring_region,
        latency_warning_ms: parseInt(form.latency_warning_ms),
        latency_critical_ms: parseInt(form.latency_critical_ms),
        tls_check_enabled: form.tls_check_enabled,
        tls_expiry_alert_days: parseInt(form.tls_expiry_alert_days),
      });
      toast({ title: "Monitor created" });
      onSuccess();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-5 text-xs">
        <TabsTrigger value="basic"><Settings className="h-3 w-3 mr-1" />Basic</TabsTrigger>
        <TabsTrigger value="health"><Clock className="h-3 w-3 mr-1" />Health</TabsTrigger>
        <TabsTrigger value="rules"><Shield className="h-3 w-3 mr-1" />Rules</TabsTrigger>
        <TabsTrigger value="alerts"><Bell className="h-3 w-3 mr-1" />Alerts</TabsTrigger>
        <TabsTrigger value="sla"><BarChart3 className="h-3 w-3 mr-1" />SLA</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-3 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Application Name *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="TPL GIS Backend" /></div>
          <div><Label>Environment</Label>
            <Select value={form.environment} onValueChange={v => set("environment", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dev">Dev</SelectItem>
                <SelectItem value="uat">UAT</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="prod">Prod</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div><Label>Description</Label><Input value={form.description} onChange={e => set("description", e.target.value)} placeholder="Short description" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Owner / Team</Label><Input value={form.owner} onChange={e => set("owner", e.target.value)} /></div>
          <div><Label>Tags (key=value, comma-separated)</Label><Input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="project=app,tier=backend" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Monitoring Type</Label>
            <Select value={form.monitor_type} onValueChange={v => set("monitor_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="https">HTTPS</SelectItem>
                <SelectItem value="http">HTTP</SelectItem>
                <SelectItem value="tcp">TCP</SelectItem>
                <SelectItem value="ping">Ping (ICMP)</SelectItem>
                <SelectItem value="dns">DNS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>HTTP Method</Label>
            <Select value={form.http_method} onValueChange={v => set("http_method", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="HEAD">HEAD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div><Label>Endpoint / URL *</Label><Input value={form.endpoint} onChange={e => set("endpoint", e.target.value)} placeholder="https://api.example.com" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Port (optional)</Label><Input value={form.port} onChange={e => set("port", e.target.value)} placeholder="443" /></div>
          <div><Label>Request Path</Label><Input value={form.request_path} onChange={e => set("request_path", e.target.value)} placeholder="/health" /></div>
        </div>
      </TabsContent>

      <TabsContent value="health" className="space-y-3 mt-4">
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Check Interval (s)</Label><Input value={form.check_interval_seconds} onChange={e => set("check_interval_seconds", e.target.value)} /></div>
          <div><Label>Timeout (s)</Label><Input value={form.timeout_seconds} onChange={e => set("timeout_seconds", e.target.value)} /></div>
          <div><Label>Retry Count</Label><Input value={form.retry_count} onChange={e => set("retry_count", e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Expected Status Code</Label><Input value={form.expected_status_code} onChange={e => set("expected_status_code", e.target.value)} placeholder="200" /></div>
          <div><Label>Response Body Match (optional)</Label><Input value={form.expected_body_match} onChange={e => set("expected_body_match", e.target.value)} placeholder="keyword or regex" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Auth Type</Label>
            <Select value={form.auth_type} onValueChange={v => set("auth_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="basic">Basic Auth</SelectItem>
                <SelectItem value="bearer">Bearer Token</SelectItem>
                <SelectItem value="apikey">API Key</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.auth_type !== "none" && (
            <div><Label>Credentials / Token</Label><Input type="password" value={form.auth_credentials} onChange={e => set("auth_credentials", e.target.value)} /></div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="rules" className="space-y-3 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Failure Threshold</Label><Input value={form.failure_threshold} onChange={e => set("failure_threshold", e.target.value)} /><p className="text-xs text-muted-foreground">Consecutive failures before DOWN</p></div>
          <div><Label>Recovery Threshold</Label><Input value={form.recovery_threshold} onChange={e => set("recovery_threshold", e.target.value)} /><p className="text-xs text-muted-foreground">Consecutive successes before UP</p></div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Switch checked={form.tls_check_enabled} onCheckedChange={v => set("tls_check_enabled", v)} />
          <Label>Enable TLS Certificate Check</Label>
        </div>
        {form.tls_check_enabled && (
          <div><Label>TLS Expiry Alert (days)</Label><Input value={form.tls_expiry_alert_days} onChange={e => set("tls_expiry_alert_days", e.target.value)} /></div>
        )}
      </TabsContent>

      <TabsContent value="alerts" className="space-y-3 mt-4">
        <div><Label>Alert Severity</Label>
          <Select value={form.alert_severity} onValueChange={v => set("alert_severity", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">Alert channels (Email, Slack, Teams, Webhook) can be configured after creation.</p>
      </TabsContent>

      <TabsContent value="sla" className="space-y-3 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>SLA Target (%)</Label>
            <Select value={form.sla_target} onValueChange={v => set("sla_target", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="99.0">99.0%</SelectItem>
                <SelectItem value="99.9">99.9%</SelectItem>
                <SelectItem value="99.99">99.99%</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Business Hours</Label>
            <Select value={form.business_hours} onValueChange={v => set("business_hours", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="24x7">24x7</SelectItem>
                <SelectItem value="business">Business Hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Latency Warning (ms)</Label><Input value={form.latency_warning_ms} onChange={e => set("latency_warning_ms", e.target.value)} /></div>
          <div><Label>Latency Critical (ms)</Label><Input value={form.latency_critical_ms} onChange={e => set("latency_critical_ms", e.target.value)} /></div>
        </div>
        <div><Label>Monitoring Region</Label><Input value={form.monitoring_region} onChange={e => set("monitoring_region", e.target.value)} placeholder="global" /></div>
      </TabsContent>

      <div className="pt-4 flex justify-end">
        <Button onClick={handleSubmit} disabled={saving}>{saving ? "Creating..." : "Create Monitor"}</Button>
      </div>
    </Tabs>
  );
}
