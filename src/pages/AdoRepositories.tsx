import { useState, useEffect } from "react";
import { useAdo } from "@/hooks/useAdo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Loader2, GitBranch, Shield, ScanLine, AlertTriangle, FileCode, Sparkles, Copy, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Repo {
  id: string;
  name: string;
  defaultBranch?: string;
  size?: number;
  webUrl?: string;
}

interface BranchRef {
  name: string;
  objectId: string;
}

export default function AdoRepositories() {
  const { activeConnection, callAdo } = useAdo();
  const { user } = useAuth();
  const [project, setProject] = useState<string>("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<Record<string, any>>({});

  // Branch selection
  const [repoBranches, setRepoBranches] = useState<Record<string, BranchRef[]>>({});
  const [selectedBranches, setSelectedBranches] = useState<Record<string, string>>({});
  const [branchLoading, setBranchLoading] = useState<string | null>(null);

  // Pipeline detection
  const [pipelineDetection, setPipelineDetection] = useState<Record<string, { found: boolean; files: string[]; techStack: string[] }>>({});
  const [detecting, setDetecting] = useState<string | null>(null);

  // CI generation dialog
  const [ciDialog, setCiDialog] = useState<{ repoId: string; repoName: string; techStack: string[] } | null>(null);
  const [ciForm, setCiForm] = useState({ serviceConnection: "", dockerfilePath: "Dockerfile", registryName: "", repoName: "" });
  const [generatedYaml, setGeneratedYaml] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (activeConnection?.projects?.length) setProject(activeConnection.projects[0]);
  }, [activeConnection]);

  useEffect(() => {
    if (project && activeConnection) loadRepos();
  }, [project, activeConnection]);

  const loadRepos = async () => {
    setLoading(true);
    try {
      const data = await callAdo("list_repos", { project });
      const repoList = data.value || [];
      setRepos(repoList);
      // Set default branches
      const defaults: Record<string, string> = {};
      repoList.forEach((r: Repo) => {
        if (r.defaultBranch) defaults[r.id] = r.defaultBranch.replace("refs/heads/", "");
      });
      setSelectedBranches(defaults);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async (repoId: string) => {
    if (repoBranches[repoId]) return;
    setBranchLoading(repoId);
    try {
      const data = await callAdo("list_branches", { project, repository: repoId });
      const branches = (data.value || []).map((r: any) => ({
        name: r.name.replace("refs/heads/", ""),
        objectId: r.objectId,
      }));
      setRepoBranches((prev) => ({ ...prev, [repoId]: branches }));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBranchLoading(null);
    }
  };

  const detectPipelines = async (repo: Repo) => {
    const branch = selectedBranches[repo.id] || repo.defaultBranch?.replace("refs/heads/", "");
    if (!branch) return;
    setDetecting(repo.id);
    try {
      const tree = await callAdo("get_file_tree", { project, repository: repo.id, branch });
      const items = tree.value || [];
      const pipelineFiles = items.filter((item: any) =>
        !item.isFolder && (item.path.toLowerCase().endsWith(".yml") || item.path.toLowerCase().endsWith(".yaml")) &&
        (item.path.toLowerCase().includes("azure-pipelines") || item.path.toLowerCase().includes("pipeline") || item.path.startsWith("/.azuredevops"))
      ).map((i: any) => i.path);

      // Detect tech stack
      const techFiles: Record<string, string> = {
        "/package.json": "Node.js/React",
        "/requirements.txt": "Python",
        "/Pipfile": "Python",
        "/go.mod": "Go",
        "/pom.xml": "Java (Maven)",
        "/build.gradle": "Java (Gradle)",
        "/Gemfile": "Ruby",
        "/Cargo.toml": "Rust",
        "/composer.json": "PHP",
      };
      const techStack: string[] = [];
      const hasDockerfile = items.some((i: any) => !i.isFolder && i.path.toLowerCase().includes("dockerfile"));
      if (hasDockerfile) techStack.push("Docker");
      for (const [fp, tech] of Object.entries(techFiles)) {
        if (items.some((i: any) => i.path.toLowerCase() === fp.toLowerCase())) techStack.push(tech);
      }

      setPipelineDetection((prev) => ({
        ...prev,
        [repo.id]: { found: pipelineFiles.length > 0, files: pipelineFiles, techStack },
      }));

      if (pipelineFiles.length > 0) {
        toast.success(`Found ${pipelineFiles.length} pipeline file(s) in ${repo.name}`);
      } else {
        toast.info(`No pipeline files found. Detected: ${techStack.join(", ") || "Unknown"}`);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDetecting(null);
    }
  };

  const generateCiPipeline = async () => {
    if (!ciDialog) return;
    setGenerating(true);
    setGeneratedYaml(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const prompt = `Generate a production-ready Azure DevOps CI pipeline YAML for:
- Technology stack: ${ciDialog.techStack.join(", ")}
- Service connection name: ${ciForm.serviceConnection}
- Dockerfile path: ${ciForm.dockerfilePath}
- Docker registry: ${ciForm.registryName}
- Docker repository: ${ciForm.repoName}
- Docker image tag: $(Build.BuildNumber)

Requirements:
1. Use standard Azure DevOps YAML pipeline syntax
2. Include trigger on the main branch
3. Use pool with ubuntu-latest
4. Build and push Docker image steps
5. Include proper step names and display names
6. Add any relevant lint/test/build steps for the detected tech stack
7. Use the provided service connection for Docker authentication

Return ONLY the YAML content, no explanations.`;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/k8s-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session!.access_token}`,
        },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], clusterContext: "" }),
      });

      if (!resp.ok || !resp.body) throw new Error("Failed to generate");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const p = JSON.parse(json);
            const c = p.choices?.[0]?.delta?.content;
            if (c) { text += c; setGeneratedYaml(text); }
          } catch {}
        }
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const copyYaml = () => {
    if (generatedYaml) {
      navigator.clipboard.writeText(generatedYaml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("YAML copied to clipboard");
    }
  };

  const scanRepo = async (repo: Repo, scanType: string) => {
    if (!activeConnection || !user) return;
    const branch = selectedBranches[repo.id] || repo.defaultBranch?.replace("refs/heads/", "");
    setScanning(`${repo.id}-${scanType}`);
    try {
      const tree = await callAdo("get_file_tree", { project, repository: repo.id, branch });
      const items = tree.value || [];
      const relevantPaths = items
        .filter((item: any) => {
          if (item.isFolder) return false;
          const p = item.path.toLowerCase();
          if (scanType === "dockerfile") return p.includes("dockerfile");
          if (scanType === "pipeline") return p.endsWith(".yml") || p.endsWith(".yaml");
          return p.endsWith("package.json") || p.endsWith("package-lock.json") || p.endsWith("requirements.txt") ||
            p.endsWith("pipfile") || p.endsWith("go.mod") || p.endsWith("pom.xml") || p.endsWith("build.gradle") ||
            p.endsWith("gemfile") || p.endsWith(".csproj");
        })
        .slice(0, 10);

      if (relevantPaths.length === 0) {
        toast.info("No relevant files found for this scan type");
        setScanning(null);
        return;
      }

      const files = await Promise.all(
        relevantPaths.map(async (item: any) => {
          try {
            const result = await callAdo("get_file_content", { project, repository: repo.id, path: item.path, branch });
            return { path: item.path, content: result.content?.substring(0, 5000) || "" };
          } catch {
            return { path: item.path, content: "// Could not fetch file" };
          }
        })
      );

      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ado-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session!.access_token}` },
        body: JSON.stringify({ connectionId: activeConnection.id, project, repository: repo.name, files, scanType }),
      });

      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error);

      setScanResults((prev) => ({ ...prev, [`${repo.id}-${scanType}`]: result.result }));
      toast.success(`${scanType} scan completed for ${repo.name}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setScanning(null);
    }
  };

  if (!activeConnection) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-lg font-medium">No ADO connection active</p>
        <p className="text-sm">Go to ADO Settings to add and activate a connection</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Repositories</h1>
          <p className="text-muted-foreground text-sm">Scan repositories, detect pipelines, and auto-generate CI configurations</p>
        </div>
        <Select value={project} onValueChange={setProject}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select project" /></SelectTrigger>
          <SelectContent>
            {activeConnection.projects.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid gap-4">
          {repos.map((repo) => {
            const detection = pipelineDetection[repo.id];
            const branches = repoBranches[repo.id] || [];
            const currentBranch = selectedBranches[repo.id] || repo.defaultBranch?.replace("refs/heads/", "") || "";

            return (
              <Card key={repo.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">{repo.name}</CardTitle>
                    </div>
                    {/* Branch selector */}
                    <div className="flex items-center gap-2">
                      <Select
                        value={currentBranch}
                        onValueChange={(v) => setSelectedBranches((prev) => ({ ...prev, [repo.id]: v }))}
                        onOpenChange={() => loadBranches(repo.id)}
                      >
                        <SelectTrigger className="w-[200px] h-8 text-xs">
                          <SelectValue placeholder={currentBranch || "Select branch"} />
                        </SelectTrigger>
                        <SelectContent>
                          {branchLoading === repo.id && <div className="p-2 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div>}
                          {branches.map((b) => (
                            <SelectItem key={b.name} value={b.name} className="text-xs">{b.name}</SelectItem>
                          ))}
                          {!branchLoading && branches.length === 0 && currentBranch && (
                            <SelectItem value={currentBranch} className="text-xs">{currentBranch}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    {["filesystem", "dockerfile", "pipeline"].map((type) => (
                      <Button
                        key={type}
                        variant="outline"
                        size="sm"
                        disabled={scanning === `${repo.id}-${type}`}
                        onClick={() => scanRepo(repo, type)}
                      >
                        {scanning === `${repo.id}-${type}` ? (
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        ) : (
                          <ScanLine className="mr-2 h-3 w-3" />
                        )}
                        {type === "filesystem" ? "Dependency Scan" : type === "dockerfile" ? "Dockerfile Scan" : "Pipeline Scan"}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={detecting === repo.id}
                      onClick={() => detectPipelines(repo)}
                    >
                      {detecting === repo.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <FileCode className="mr-2 h-3 w-3" />}
                      Detect Pipelines
                    </Button>
                  </div>

                  {/* Pipeline detection results */}
                  {detection && (
                    <div className="border rounded-lg p-3 space-y-2">
                      {detection.techStack.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-muted-foreground">Tech Stack:</span>
                          {detection.techStack.map((t) => (
                            <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                          ))}
                        </div>
                      )}
                      {detection.found ? (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Pipeline files found:
                          </p>
                          {detection.files.map((f) => (
                            <p key={f} className="text-xs font-mono text-muted-foreground ml-5">{f}</p>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">No pipeline files detected in this branch.</p>
                          <Button
                            size="sm"
                            onClick={() => {
                              setCiDialog({ repoId: repo.id, repoName: repo.name, techStack: detection.techStack });
                              setCiForm({ serviceConnection: "", dockerfilePath: "Dockerfile", registryName: "", repoName: repo.name.toLowerCase() });
                              setGeneratedYaml(null);
                            }}
                          >
                            <Sparkles className="mr-2 h-3 w-3" /> Generate CI Pipeline
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Inline scan results */}
                  {["filesystem", "dockerfile", "pipeline"].map((type) => {
                    const result = scanResults[`${repo.id}-${type}`];
                    if (!result) return null;
                    const summary = result.severity_summary || {};
                    const vulns = result.vulnerabilities || [];
                    return (
                      <div key={type} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4" />
                          <span className="text-sm font-medium capitalize">{type} Scan Results</span>
                          <div className="flex gap-1 ml-auto">
                            {summary.critical > 0 && <Badge variant="destructive">{summary.critical} Critical</Badge>}
                            {summary.high > 0 && <Badge className="bg-orange-500 text-white">{summary.high} High</Badge>}
                            {summary.medium > 0 && <Badge className="bg-yellow-500 text-white">{summary.medium} Medium</Badge>}
                            {summary.low > 0 && <Badge variant="secondary">{summary.low} Low</Badge>}
                          </div>
                        </div>
                        {vulns.slice(0, 5).map((v: any, i: number) => (
                          <div key={i} className="text-xs border rounded p-2 space-y-1">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className={`h-3 w-3 ${v.severity === "critical" ? "text-destructive" : v.severity === "high" ? "text-orange-500" : "text-yellow-500"}`} />
                              <span className="font-medium">{v.title}</span>
                              <Badge variant="outline" className="text-[10px]">{v.id}</Badge>
                            </div>
                            <p className="text-muted-foreground">{v.description}</p>
                            {v.fix && (
                              <div className="bg-muted rounded p-2 mt-1">
                                <span className="font-medium text-primary">Fix: </span>{v.fix}
                              </div>
                            )}
                          </div>
                        ))}
                        {vulns.length > 5 && (
                          <p className="text-xs text-muted-foreground">...and {vulns.length - 5} more</p>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
          {repos.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">No repositories found</CardContent>
            </Card>
          )}
        </div>
      )}

      {/* CI Pipeline Generation Dialog */}
      <Dialog open={!!ciDialog} onOpenChange={(open) => { if (!open) setCiDialog(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate CI Pipeline</DialogTitle>
            <DialogDescription>
              Provide configuration details to auto-generate an Azure DevOps CI pipeline YAML for {ciDialog?.repoName}
            </DialogDescription>
          </DialogHeader>
          {!generatedYaml ? (
            <div className="space-y-4">
              {ciDialog?.techStack && ciDialog.techStack.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">Detected:</span>
                  {ciDialog.techStack.map((t) => (
                    <Badge key={t} variant="outline">{t}</Badge>
                  ))}
                </div>
              )}
              <div className="grid gap-3">
                <div>
                  <Label>Azure DevOps Service Connection Name</Label>
                  <Input
                    value={ciForm.serviceConnection}
                    onChange={(e) => setCiForm((f) => ({ ...f, serviceConnection: e.target.value }))}
                    placeholder="e.g. my-docker-registry-connection"
                  />
                </div>
                <div>
                  <Label>Dockerfile Path</Label>
                  <Input
                    value={ciForm.dockerfilePath}
                    onChange={(e) => setCiForm((f) => ({ ...f, dockerfilePath: e.target.value }))}
                    placeholder="e.g. Dockerfile or src/Dockerfile"
                  />
                </div>
                <div>
                  <Label>Docker Registry Name</Label>
                  <Input
                    value={ciForm.registryName}
                    onChange={(e) => setCiForm((f) => ({ ...f, registryName: e.target.value }))}
                    placeholder="e.g. myregistry.azurecr.io"
                  />
                </div>
                <div>
                  <Label>Docker Repository Name</Label>
                  <Input
                    value={ciForm.repoName}
                    onChange={(e) => setCiForm((f) => ({ ...f, repoName: e.target.value }))}
                    placeholder="e.g. my-app"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCiDialog(null)}>Cancel</Button>
                <Button onClick={generateCiPipeline} disabled={generating || !ciForm.serviceConnection || !ciForm.registryName}>
                  {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Generate YAML
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Generated Pipeline YAML</p>
                <Button variant="outline" size="sm" onClick={copyYaml}>
                  {copied ? <CheckCircle2 className="mr-2 h-3 w-3" /> : <Copy className="mr-2 h-3 w-3" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <ScrollArea className="h-[400px] border rounded-lg">
                <pre className="text-xs p-3 font-mono whitespace-pre-wrap">{generatedYaml}</pre>
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => setGeneratedYaml(null)}>Back</Button>
                <Button onClick={() => setCiDialog(null)}>Done</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}