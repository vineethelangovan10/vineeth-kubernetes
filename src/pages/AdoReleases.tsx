import { useState, useEffect } from "react";
import { useAdo } from "@/hooks/useAdo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Loader2, Rocket, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp,
  GitCommit, Package, User, Calendar, Layers
} from "lucide-react";
import { toast } from "sonner";

interface Release {
  id: number;
  name: string;
  status: string;
  reason: string;
  createdOn: string;
  createdBy: { displayName: string; uniqueName?: string };
  releaseDefinition: { name: string; id: number };
  environments: {
    id: number;
    name: string;
    status: string;
    deploySteps?: {
      status: string;
      requestedFor?: { displayName: string };
      lastModifiedOn?: string;
    }[];
  }[];
  artifacts: {
    alias: string;
    type: string;
    definitionReference: Record<string, { id?: string; name?: string }>;
  }[];
}

interface ReleaseDetail extends Release {
  _commits?: { value: { id: string; message: string; author: { displayName: string; date: string } }[] };
}

export default function AdoReleases() {
  const { activeConnection, callAdo } = useAdo();
  const [project, setProject] = useState("");
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRelease, setExpandedRelease] = useState<number | null>(null);
  const [releaseDetail, setReleaseDetail] = useState<ReleaseDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (activeConnection?.projects?.length) setProject(activeConnection.projects[0]);
  }, [activeConnection]);

  useEffect(() => {
    if (project && activeConnection) loadReleases();
  }, [project, activeConnection]);

  const loadReleases = async () => {
    setLoading(true);
    try {
      const data = await callAdo("list_releases", { project });
      setReleases(data.value || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRelease = async (releaseId: number) => {
    if (expandedRelease === releaseId) {
      setExpandedRelease(null);
      return;
    }
    setExpandedRelease(releaseId);
    setDetailLoading(true);
    try {
      const data = await callAdo("get_release", { project, releaseId });
      setReleaseDetail(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatIST = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  };

  const getStageIcon = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "succeeded") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (s === "rejected" || s === "failed" || s === "canceled") return <XCircle className="h-4 w-4 text-destructive" />;
    if (s === "inprogress" || s === "queued") return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusVariant = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "active") return "default" as const;
    if (s === "abandoned" || s === "canceled") return "destructive" as const;
    return "secondary" as const;
  };

  if (!activeConnection) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Rocket className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-lg font-medium">No ADO connection active</p>
        <p className="text-sm">Go to ADO Settings to add and activate a connection</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Releases</h1>
          <p className="text-muted-foreground text-sm">Monitor Azure Pipeline releases, stages, artifacts, and commits</p>
        </div>
        <div className="flex gap-2">
          <Select value={project} onValueChange={setProject}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {activeConnection.projects.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadReleases} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {releases.map((release) => (
            <Card key={release.id}>
              <CardContent className="p-0">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                  onClick={() => toggleRelease(release.id)}
                >
                  <div className="flex items-center gap-3">
                    <Rocket className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{release.releaseDefinition?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {release.name} · {release.createdBy?.displayName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusVariant(release.status)}>{release.status}</Badge>
                    <span className="text-xs text-muted-foreground">{formatIST(release.createdOn)}</span>
                    {expandedRelease === release.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {expandedRelease === release.id && (
                  <div className="border-t p-4 space-y-4">
                    {detailLoading ? (
                      <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
                    ) : releaseDetail ? (
                      <>
                        {/* Release Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          <div className="space-y-1">
                            <p className="text-muted-foreground text-xs font-medium">Pipeline</p>
                            <p className="font-medium">{releaseDetail.releaseDefinition?.name}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground text-xs font-medium">Release</p>
                            <p className="font-medium">{releaseDetail.name}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground text-xs font-medium flex items-center gap-1"><User className="h-3 w-3" />Created By</p>
                            <p className="font-medium">{releaseDetail.createdBy?.displayName}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground text-xs font-medium flex items-center gap-1"><Calendar className="h-3 w-3" />Created On (IST)</p>
                            <p className="font-medium">{formatIST(releaseDetail.createdOn)}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground text-xs font-medium">Status</p>
                            <Badge variant={getStatusVariant(releaseDetail.status)}>{releaseDetail.status}</Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground text-xs font-medium">Reason</p>
                            <p className="font-medium capitalize">{releaseDetail.reason || "N/A"}</p>
                          </div>
                        </div>

                        <Separator />

                        {/* Stages */}
                        <div>
                          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <Layers className="h-4 w-4" /> Stages
                          </h3>
                          <div className="space-y-2">
                            {(releaseDetail.environments || []).map((env) => {
                              const lastDeploy = env.deploySteps?.[env.deploySteps.length - 1];
                              return (
                                <div key={env.id} className="flex items-center gap-3 border rounded-lg p-3">
                                  {getStageIcon(env.status)}
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{env.name}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{env.status}</p>
                                  </div>
                                  {lastDeploy && (
                                    <div className="text-right text-xs text-muted-foreground">
                                      {lastDeploy.requestedFor?.displayName && (
                                        <p>by {lastDeploy.requestedFor.displayName}</p>
                                      )}
                                      {lastDeploy.lastModifiedOn && (
                                        <p>{formatIST(lastDeploy.lastModifiedOn)}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Artifacts */}
                        {(releaseDetail.artifacts || []).length > 0 && (
                          <>
                            <Separator />
                            <div>
                              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <Package className="h-4 w-4" /> Artifacts
                              </h3>
                              <div className="space-y-2">
                                {releaseDetail.artifacts.map((art, i) => (
                                  <div key={i} className="border rounded-lg p-3 space-y-1 text-sm">
                                    <p className="font-medium">{art.alias}</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                      {art.definitionReference?.version?.name && (
                                        <p>Build: {art.definitionReference.version.name}</p>
                                      )}
                                      {art.definitionReference?.branch?.name && (
                                        <p>Branch: {art.definitionReference.branch.name}</p>
                                      )}
                                      {art.definitionReference?.definition?.name && (
                                        <p>Definition: {art.definitionReference.definition.name}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {/* Commits from artifacts */}
                        {releaseDetail._commits?.value && releaseDetail._commits.value.length > 0 && (
                          <>
                            <Separator />
                            <div>
                              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <GitCommit className="h-4 w-4" /> Commits (Latest 5)
                              </h3>
                              <div className="space-y-2">
                                {releaseDetail._commits.value.slice(0, 5).map((c: any, i: number) => (
                                  <div key={i} className="border rounded-lg p-3 text-sm space-y-1">
                                    <div className="flex items-start gap-2">
                                      <code className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                        {c.id?.substring(0, 12)}
                                      </code>
                                      <p className="text-xs flex-1">{c.message}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {c.author?.displayName}, {formatIST(c.author?.date || c.timestamp)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {releases.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Rocket className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No releases found</p>
                <p className="text-sm">This project may use YAML pipelines instead of classic releases</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}