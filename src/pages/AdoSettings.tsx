import { useState } from "react";
import { useAdo } from "@/hooks/useAdo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Link, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdoSettings() {
  const { connections, addConnection, deleteConnection, activeConnection, setActiveConnection, callAdo } = useAdo();
  const [org, setOrg] = useState("");
  const [pat, setPat] = useState("");
  const [adding, setAdding] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [discoveredProjects, setDiscoveredProjects] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [step, setStep] = useState<"credentials" | "projects">("credentials");

  const testAndDiscover = async () => {
    if (!org.trim() || !pat.trim()) return toast.error("Organization and PAT are required");
    setTesting(true);
    try {
      const headers = { Authorization: `Basic ${btoa(`:${pat}`)}`, "Content-Type": "application/json" };
      const resp = await fetch(`https://dev.azure.com/${org}/_apis/projects?api-version=7.1`, { headers });
      if (!resp.ok) throw new Error(`Invalid credentials or organization (${resp.status})`);
      const data = await resp.json();
      const projects = (data.value || []).map((p: any) => p.name);
      setDiscoveredProjects(projects);
      setSelectedProjects(projects);
      setStep("projects");
      toast.success(`Found ${projects.length} projects`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setTesting(false);
    }
  };

  const handleAdd = async () => {
    if (selectedProjects.length === 0) return toast.error("Select at least one project");
    setAdding(true);
    try {
      await addConnection(org.trim(), pat.trim(), selectedProjects);
      toast.success("Connection added successfully");
      resetForm();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAdding(false);
    }
  };

  const resetForm = () => {
    setOrg("");
    setPat("");
    setShowForm(false);
    setStep("credentials");
    setDiscoveredProjects([]);
    setSelectedProjects([]);
  };

  const toggleProject = (name: string) => {
    setSelectedProjects((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Azure DevOps Connections</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Connect to your Azure DevOps organizations using Personal Access Tokens
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Connection
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New Connection</CardTitle>
            <CardDescription>
              {step === "credentials"
                ? "Enter your Azure DevOps organization name and Personal Access Token"
                : "Select projects to monitor"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === "credentials" ? (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">Organization Name</label>
                  <Input placeholder="my-org" value={org} onChange={(e) => setOrg(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Personal Access Token (PAT)</label>
                  <Input type="password" placeholder="Enter PAT" value={pat} onChange={(e) => setPat(e.target.value)} />
                  <p className="text-xs text-muted-foreground mt-1">
                    Needs Code (Read), Build (Read), Pipeline (Read) scopes
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={testAndDiscover} disabled={testing}>
                    {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link className="mr-2 h-4 w-4" />}
                    Test & Discover Projects
                  </Button>
                  <Button variant="outline" onClick={resetForm}>Cancel</Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {discoveredProjects.map((p) => (
                    <Badge
                      key={p}
                      variant={selectedProjects.includes(p) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleProject(p)}
                    >
                      {selectedProjects.includes(p) && <CheckCircle2 className="mr-1 h-3 w-3" />}
                      {p}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAdd} disabled={adding}>
                    {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Connection
                  </Button>
                  <Button variant="outline" onClick={() => setStep("credentials")}>Back</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {connections.map((conn) => (
          <Card key={conn.id} className={activeConnection?.id === conn.id ? "ring-2 ring-primary" : ""}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Link className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{conn.organization}</p>
                  <p className="text-xs text-muted-foreground">{conn.projects.length} projects</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeConnection?.id !== conn.id && (
                  <Button variant="outline" size="sm" onClick={() => setActiveConnection(conn)}>
                    Set Active
                  </Button>
                )}
                {activeConnection?.id === conn.id && (
                  <Badge variant="default">Active</Badge>
                )}
                <Button variant="ghost" size="icon" onClick={() => deleteConnection(conn.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {connections.length === 0 && !showForm && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Link className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No Azure DevOps connections configured</p>
              <p className="text-sm">Add a connection to start scanning repositories</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
