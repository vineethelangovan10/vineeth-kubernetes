import { useState, useEffect } from "react";
import { VmAgent, VmMetric, VmAlert, useVmAgents } from "@/hooks/useVmAgents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, RefreshCw, Cpu, MemoryStick, HardDrive, Network, Container, Server, Plus, Trash2, Key } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface Props {
  agent: VmAgent;
  onBack: () => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  system: Cpu,
  docker: Container,
  nginx: Server,
  network: Network,
};

export function VmAgentDetail({ agent, onBack }: Props) {
  const { getMetrics, rotateToken, createAlert, fetchAlerts, deleteAlert } = useVmAgents();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<VmMetric[]>([]);
  const [alerts, setAlerts] = useState<VmAlert[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [activeCategory, setActiveCategory] = useState("system");
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [alertForm, setAlertForm] = useState({ rule_name: "", condition: "cpu_usage", threshold: 80, severity: "warning" });

  const loadMetrics = async (category?: string) => {
    setLoadingMetrics(true);
    try {
      const data = await getMetrics(agent.id, category, 200);
      setMetrics(data);
    } catch {}
    setLoadingMetrics(false);
  };

  const loadAlerts = async () => {
    try {
      const data = await fetchAlerts(agent.id);
      setAlerts(data);
    } catch {}
  };

  useEffect(() => {
    loadMetrics(activeCategory);
    loadAlerts();
  }, [agent.id, activeCategory]);

  const handleRotateToken = async () => {
    try {
      await rotateToken(agent.id);
      toast({ title: "Token rotated", description: "The agent will need to be reconfigured with the new token." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleAddAlert = async () => {
    try {
      await createAlert({
        agent_id: agent.id,
        ...alertForm,
      });
      setShowAddAlert(false);
      await loadAlerts();
      toast({ title: "Alert rule created" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await deleteAlert(id);
      await loadAlerts();
      toast({ title: "Alert rule deleted" });
    } catch {}
  };

  // Group metrics by name for charting
  const metricsByName = metrics.reduce((acc, m) => {
    if (!acc[m.metric_name]) acc[m.metric_name] = [];
    acc[m.metric_name].push(m);
    return acc;
  }, {} as Record<string, VmMetric[]>);

  // Get latest value per metric
  const latestMetrics = Object.entries(metricsByName).map(([name, items]) => ({
    name,
    value: items[0]?.metric_value ?? 0,
    unit: items[0]?.unit || "",
    history: [...items].reverse().map(m => ({
      time: new Date(m.collected_at).toLocaleTimeString(),
      value: Number(m.metric_value),
    })),
  }));

  const gaugeColor = (name: string, val: number) => {
    if (name.includes("usage") && val > 85) return "text-destructive";
    if (name.includes("usage") && val > 70) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{agent.name}</h1>
          <p className="text-sm text-muted-foreground">{agent.hostname} • {agent.ip_address || "No IP"}</p>
        </div>
        <Badge variant={agent.status === "online" ? "default" : agent.status === "offline" ? "destructive" : "secondary"}>
          {agent.status}
        </Badge>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={() => loadMetrics(activeCategory)}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={handleRotateToken}>
            <Key className="h-4 w-4 mr-1" /> Rotate Token
          </Button>
        </div>
      </div>

      {/* Agent Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Environment</p>
            <p className="text-lg font-semibold text-foreground">{agent.environment}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">OS Info</p>
            <p className="text-lg font-semibold text-foreground truncate">{agent.os_info || "Unknown"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Agent Version</p>
            <p className="text-lg font-semibold text-foreground">{agent.agent_version || "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Last Heartbeat</p>
            <p className="text-lg font-semibold text-foreground">
              {agent.last_heartbeat_at ? new Date(agent.last_heartbeat_at).toLocaleString() : "Never"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Metric Categories */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList>
          <TabsTrigger value="system">🖥️ System</TabsTrigger>
          <TabsTrigger value="docker">🐳 Docker</TabsTrigger>
          <TabsTrigger value="nginx">🌐 Nginx</TabsTrigger>
          <TabsTrigger value="network">📡 Network</TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="space-y-4 mt-4">
          {loadingMetrics ? (
            <p className="text-muted-foreground">Loading metrics...</p>
          ) : latestMetrics.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No {activeCategory} metrics received yet. Install the agent on your VM to start collecting data.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Current Values */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {latestMetrics.map(m => (
                  <Card key={m.name}>
                    <CardContent className="pt-6">
                      <p className="text-xs text-muted-foreground capitalize">{m.name.replace(/_/g, " ")}</p>
                      <p className={`text-2xl font-bold ${gaugeColor(m.name, m.value)}`}>
                        {typeof m.value === "number" ? m.value.toFixed(1) : m.value}
                        {m.unit && <span className="text-sm text-muted-foreground ml-1">{m.unit}</span>}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {latestMetrics.filter(m => m.history.length > 1).map(m => (
                  <Card key={m.name}>
                    <CardHeader>
                      <CardTitle className="text-sm capitalize">{m.name.replace(/_/g, " ")} {m.unit && `(${m.unit})`}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={m.history}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="time" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                          <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Alert Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Alert Rules</CardTitle>
            <Dialog open={showAddAlert} onOpenChange={setShowAddAlert}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Rule</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Alert Rule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Rule Name</Label>
                    <Input placeholder="e.g. High CPU Alert" value={alertForm.rule_name} onChange={e => setAlertForm(f => ({ ...f, rule_name: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Metric (condition)</Label>
                    <Select value={alertForm.condition} onValueChange={v => setAlertForm(f => ({ ...f, condition: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpu_usage">CPU Usage (%)</SelectItem>
                        <SelectItem value="memory_usage">Memory Usage (%)</SelectItem>
                        <SelectItem value="disk_usage">Disk Usage (%)</SelectItem>
                        <SelectItem value="load_avg_1m">Load Average (1m)</SelectItem>
                        <SelectItem value="swap_usage">Swap Usage (%)</SelectItem>
                        <SelectItem value="container_count">Docker Containers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Threshold (alert if value exceeds)</Label>
                    <Input type="number" value={alertForm.threshold} onChange={e => setAlertForm(f => ({ ...f, threshold: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <Label>Severity</Label>
                    <Select value={alertForm.severity} onValueChange={v => setAlertForm(f => ({ ...f, severity: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddAlert} className="w-full">Create Rule</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No alert rules configured for this agent.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Metric</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Last Triggered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.rule_name}</TableCell>
                    <TableCell className="font-mono text-sm">{a.condition}</TableCell>
                    <TableCell>{a.threshold}</TableCell>
                    <TableCell>
                      <Badge variant={a.severity === "critical" ? "destructive" : "secondary"}>{a.severity}</Badge>
                    </TableCell>
                    <TableCell>{a.last_triggered_at ? new Date(a.last_triggered_at).toLocaleString() : "Never"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteAlert(a.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
