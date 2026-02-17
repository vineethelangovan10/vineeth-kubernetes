import { useState } from "react";
import { useVmAgents, VmAgent } from "@/hooks/useVmAgents";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Server, Activity, Shield, Terminal, Trash2, RefreshCw, Copy, Download, AlertTriangle, Cpu, HardDrive, MemoryStick, Network, Container } from "lucide-react";
import { VmAgentDetail } from "@/components/vm/VmAgentDetail";

export default function VmMonitoring() {
  const { agents, loading, registerAgent, deleteAgent, getInstallScript } = useVmAgents();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<VmAgent | null>(null);
  const [form, setForm] = useState({ name: "", hostname: "", environment: "prod" });
  const [installScript, setInstallScript] = useState<string | null>(null);
  const [scriptAgentId, setScriptAgentId] = useState<string | null>(null);

  const onlineCount = agents.filter(a => a.status === "online").length;
  const offlineCount = agents.filter(a => a.status === "offline").length;
  const pendingCount = agents.filter(a => a.status === "pending").length;

  const handleRegister = async () => {
    if (!form.name || !form.hostname) {
      toast({ title: "Error", description: "Name and hostname are required", variant: "destructive" });
      return;
    }
    try {
      const agent = await registerAgent(form);
      setShowAdd(false);
      setForm({ name: "", hostname: "", environment: "prod" });
      // Show install script
      const script = await getInstallScript(agent.id);
      setInstallScript(script);
      setScriptAgentId(agent.id);
      toast({ title: "Agent registered", description: "Run the install script on your VM" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAgent(id);
      if (selectedAgent?.id === id) setSelectedAgent(null);
      toast({ title: "Agent deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleShowScript = async (agentId: string) => {
    try {
      const script = await getInstallScript(agentId);
      setInstallScript(script);
      setScriptAgentId(agentId);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const copyScript = () => {
    if (installScript) {
      navigator.clipboard.writeText(installScript);
      toast({ title: "Copied to clipboard" });
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "online": return "default";
      case "offline": return "destructive";
      default: return "secondary";
    }
  };

  if (selectedAgent) {
    return <VmAgentDetail agent={selectedAgent} onBack={() => setSelectedAgent(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Infrastructure Monitoring</h1>
          <p className="text-muted-foreground">Agent-based VM, Docker, Nginx & service monitoring</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add VM</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New VM Agent</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>VM Name</Label>
                <Input placeholder="e.g. prod-api-01" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Hostname / IP</Label>
                <Input placeholder="e.g. 10.0.1.42 or api-server.local" value={form.hostname} onChange={e => setForm(f => ({ ...f, hostname: e.target.value }))} />
              </div>
              <div>
                <Label>Environment</Label>
                <Select value={form.environment} onValueChange={v => setForm(f => ({ ...f, environment: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dev">Dev</SelectItem>
                    <SelectItem value="uat">UAT</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="prod">Prod</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleRegister} className="w-full">Register Agent</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Server className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{agents.length}</p>
                <p className="text-sm text-muted-foreground">Total VMs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10"><Activity className="h-5 w-5 text-green-500" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{onlineCount}</p>
                <p className="text-sm text-muted-foreground">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{offlineCount}</p>
                <p className="text-sm text-muted-foreground">Offline</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted"><Shield className="h-5 w-5 text-muted-foreground" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Install Script Dialog */}
      {installScript && (
        <Card className="border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" /> Install Script
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyScript}>
                  <Copy className="h-4 w-4 mr-1" /> Copy
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setInstallScript(null); setScriptAgentId(null); }}>
                  Close
                </Button>
              </div>
            </div>
            <CardDescription>Run this script on your VM to install the monitoring agent. It runs as a non-root systemd service.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-64 text-foreground font-mono">
              {installScript}
            </pre>
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-foreground">Quick Install (one-liner):</p>
              <pre className="bg-muted p-3 rounded-lg text-xs text-foreground font-mono">
                curl -s "{import.meta.env.VITE_SUPABASE_URL}/functions/v1/vm-agent" | sudo bash
              </pre>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline">🔒 No SSH required</Badge>
                <Badge variant="outline">👤 Non-root agent</Badge>
                <Badge variant="outline">🔐 TLS encrypted</Badge>
                <Badge variant="outline">🔄 Token rotation</Badge>
                <Badge variant="outline">📤 Outbound-only</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered VMs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading agents...</p>
          ) : agents.length === 0 ? (
            <div className="text-center py-12">
              <Server className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">No VMs registered yet. Add your first VM to start monitoring.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Hostname</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Heartbeat</TableHead>
                  <TableHead>OS</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map(agent => (
                  <TableRow key={agent.id} className="cursor-pointer" onClick={() => setSelectedAgent(agent)}>
                    <TableCell className="font-medium">{agent.name}</TableCell>
                    <TableCell className="font-mono text-sm">{agent.hostname}</TableCell>
                    <TableCell className="font-mono text-sm">{agent.ip_address || "—"}</TableCell>
                    <TableCell><Badge variant="outline">{agent.environment}</Badge></TableCell>
                    <TableCell><Badge variant={statusColor(agent.status)}>{agent.status}</Badge></TableCell>
                    <TableCell className="text-sm">
                      {agent.last_heartbeat_at
                        ? new Date(agent.last_heartbeat_at).toLocaleString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-sm">{agent.os_info || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" onClick={() => handleShowScript(agent.id)}>
                          <Terminal className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(agent.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Security & Architecture Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Security Model</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow><TableCell className="font-medium">User</TableCell><TableCell>Non-root (kubedash-agent)</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Auth</TableCell><TableCell>Token-based (rotatable)</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Transport</TableCell><TableCell>HTTPS (TLS encrypted)</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Firewall</TableCell><TableCell>Outbound-only allowed</TableCell></TableRow>
                <TableRow><TableCell className="font-medium">SSH</TableCell><TableCell>Not required ✅</TableCell></TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Metrics Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm"><Cpu className="h-4 w-4 text-primary" /> CPU (per core)</div>
              <div className="flex items-center gap-2 text-sm"><MemoryStick className="h-4 w-4 text-primary" /> Memory / Swap</div>
              <div className="flex items-center gap-2 text-sm"><HardDrive className="h-4 w-4 text-primary" /> Disk Usage & IO</div>
              <div className="flex items-center gap-2 text-sm"><Activity className="h-4 w-4 text-primary" /> System Load</div>
              <div className="flex items-center gap-2 text-sm"><Network className="h-4 w-4 text-primary" /> Network IO</div>
              <div className="flex items-center gap-2 text-sm"><Container className="h-4 w-4 text-primary" /> Docker Containers</div>
              <div className="flex items-center gap-2 text-sm"><Server className="h-4 w-4 text-primary" /> Process Health</div>
              <div className="flex items-center gap-2 text-sm"><Shield className="h-4 w-4 text-primary" /> Nginx Status</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
