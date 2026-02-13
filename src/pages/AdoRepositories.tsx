import { useState, useEffect } from "react";
import { useAdo } from "@/hooks/useAdo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, GitBranch, Shield, ScanLine, AlertTriangle } from "lucide-react";
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

export default function AdoRepositories() {
  const { activeConnection, callAdo } = useAdo();
  const { user } = useAuth();
  const [project, setProject] = useState<string>("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<Record<string, any>>({});

  useEffect(() => {
    if (activeConnection?.projects?.length) {
      setProject(activeConnection.projects[0]);
    }
  }, [activeConnection]);

  useEffect(() => {
    if (project && activeConnection) loadRepos();
  }, [project, activeConnection]);

  const loadRepos = async () => {
    setLoading(true);
    try {
      const data = await callAdo("list_repos", { project });
      setRepos(data.value || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const scanRepo = async (repo: Repo, scanType: string) => {
    if (!activeConnection || !user) return;
    setScanning(`${repo.id}-${scanType}`);
    try {
      // Fetch file tree
      const tree = await callAdo("get_file_tree", { project, repository: repo.id });
      const items = tree.value || [];

      // Filter relevant files based on scan type
      const relevantPaths = items
        .filter((item: any) => {
          if (item.isFolder) return false;
          const p = item.path.toLowerCase();
          if (scanType === "dockerfile") return p.includes("dockerfile");
          if (scanType === "pipeline") return p.endsWith(".yml") || p.endsWith(".yaml");
          // filesystem scan
          return (
            p.endsWith("package.json") ||
            p.endsWith("package-lock.json") ||
            p.endsWith("requirements.txt") ||
            p.endsWith("pipfile") ||
            p.endsWith("go.mod") ||
            p.endsWith("pom.xml") ||
            p.endsWith("build.gradle") ||
            p.endsWith("gemfile") ||
            p.endsWith(".csproj")
          );
        })
        .slice(0, 10); // limit to 10 files

      if (relevantPaths.length === 0) {
        toast.info("No relevant files found for this scan type");
        setScanning(null);
        return;
      }

      // Fetch file contents
      const files = await Promise.all(
        relevantPaths.map(async (item: any) => {
          try {
            const result = await callAdo("get_file_content", { project, repository: repo.id, path: item.path });
            return { path: item.path, content: result.content?.substring(0, 5000) || "" };
          } catch {
            return { path: item.path, content: "// Could not fetch file" };
          }
        })
      );

      // Call scan edge function
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ado-scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session!.access_token}`,
        },
        body: JSON.stringify({
          connectionId: activeConnection.id,
          project,
          repository: repo.name,
          files,
          scanType,
        }),
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
          <p className="text-muted-foreground text-sm">Scan repositories for vulnerabilities and misconfigurations</p>
        </div>
        <Select value={project} onValueChange={setProject}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {activeConnection.projects.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4">
          {repos.map((repo) => (
            <Card key={repo.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">{repo.name}</CardTitle>
                    {repo.defaultBranch && (
                      <Badge variant="outline" className="text-xs">{repo.defaultBranch}</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
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
                </div>

                {/* Inline scan results */}
                {["filesystem", "dockerfile", "pipeline"].map((type) => {
                  const result = scanResults[`${repo.id}-${type}`];
                  if (!result) return null;
                  const summary = result.severity_summary || {};
                  const vulns = result.vulnerabilities || [];
                  return (
                    <div key={type} className="mt-3 border rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4" />
                        <span className="text-sm font-medium capitalize">{type} Scan Results</span>
                        <div className="flex gap-1 ml-auto">
                          {summary.critical > 0 && <Badge variant="destructive">{summary.critical} Critical</Badge>}
                          {summary.high > 0 && <Badge className="bg-orange-500">{summary.high} High</Badge>}
                          {summary.medium > 0 && <Badge className="bg-yellow-500">{summary.medium} Medium</Badge>}
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
          ))}
          {repos.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No repositories found in this project
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
