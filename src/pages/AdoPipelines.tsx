import { useState, useEffect } from "react";
import { useAdo } from "@/hooks/useAdo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Play, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Build {
  id: number;
  buildNumber: string;
  status: string;
  result: string;
  definition: { name: string };
  sourceBranch: string;
  startTime: string;
  finishTime: string;
  requestedFor: { displayName: string };
}

export default function AdoPipelines() {
  const { activeConnection, callAdo } = useAdo();
  const [project, setProject] = useState("");
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedBuild, setExpandedBuild] = useState<number | null>(null);
  const [buildTimeline, setBuildTimeline] = useState<any>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  useEffect(() => {
    if (activeConnection?.projects?.length) setProject(activeConnection.projects[0]);
  }, [activeConnection]);

  useEffect(() => {
    if (project && activeConnection) loadBuilds();
  }, [project, activeConnection]);

  const loadBuilds = async () => {
    setLoading(true);
    try {
      const data = await callAdo("list_builds", { project });
      setBuilds(data.value || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleBuild = async (buildId: number) => {
    if (expandedBuild === buildId) {
      setExpandedBuild(null);
      return;
    }
    setExpandedBuild(buildId);
    setTimelineLoading(true);
    setAnalysis(null);
    try {
      const data = await callAdo("get_build_timeline", { project, buildId });
      setBuildTimeline(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setTimelineLoading(false);
    }
  };

  const analyzeBuild = async (build: Build) => {
    setAnalyzing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const LOVABLE_API_KEY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/k8s-chat`;

      const buildInfo = `Azure DevOps Build Analysis Request:
- Pipeline: ${build.definition.name}
- Build #: ${build.buildNumber}
- Status: ${build.status}, Result: ${build.result}
- Branch: ${build.sourceBranch}
- Started: ${build.startTime}
- Finished: ${build.finishTime || "Still running"}
- Duration: ${build.finishTime ? `${Math.round((new Date(build.finishTime).getTime() - new Date(build.startTime).getTime()) / 1000)}s` : "N/A"}

Timeline steps:
${buildTimeline?.records?.map((r: any) => `- ${r.name}: ${r.state} / ${r.result || "pending"} (${r.workerName || ""})`).join("\n") || "No timeline data"}

Please analyze this build and provide:
1. If failed: Root cause analysis and fix suggestions
2. Performance optimization recommendations
3. Pipeline best practices that could improve build time
4. Security recommendations for the pipeline`;

      const resp = await fetch(LOVABLE_API_KEY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session!.access_token}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: buildInfo }],
          clusterContext: "",
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("Failed to analyze");

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
            if (c) { text += c; setAnalysis(text); }
          } catch {}
        }
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const getStatusIcon = (result: string) => {
    if (result === "succeeded") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (result === "failed") return <XCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getDuration = (start: string, end: string) => {
    if (!end) return "Running...";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  if (!activeConnection) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Play className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-lg font-medium">No ADO connection active</p>
        <p className="text-sm">Go to ADO Settings to add and activate a connection</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipelines & Builds</h1>
          <p className="text-muted-foreground text-sm">Monitor build status, logs, and get AI-powered optimization insights</p>
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
          <Button variant="outline" onClick={loadBuilds} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {builds.map((build) => (
            <Card key={build.id}>
              <CardContent className="p-0">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                  onClick={() => toggleBuild(build.id)}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(build.result)}
                    <div>
                      <p className="font-medium text-sm">{build.definition.name} #{build.buildNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {build.sourceBranch?.replace("refs/heads/", "")} · {build.requestedFor?.displayName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={build.result === "succeeded" ? "default" : build.result === "failed" ? "destructive" : "secondary"}>
                      {build.result || build.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {getDuration(build.startTime, build.finishTime)}
                    </span>
                    {expandedBuild === build.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {expandedBuild === build.id && (
                  <div className="border-t p-4 space-y-3">
                    {timelineLoading ? (
                      <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
                    ) : (
                      <>
                        <div className="space-y-1">
                          {buildTimeline?.records
                            ?.filter((r: any) => r.type === "Task")
                            ?.map((r: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 text-xs py-1">
                                {getStatusIcon(r.result)}
                                <span className="flex-1 font-mono">{r.name}</span>
                                {r.startTime && r.finishTime && (
                                  <span className="text-muted-foreground">
                                    {getDuration(r.startTime, r.finishTime)}
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => analyzeBuild(build)}
                          disabled={analyzing}
                        >
                          {analyzing ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Sparkles className="mr-2 h-3 w-3" />}
                          AI Analysis & Optimization
                        </Button>
                        {analysis && (
                          <ScrollArea className="h-[300px] border rounded-lg p-3">
                            <div className="prose prose-sm dark:prose-invert max-w-none text-xs">
                              <pre className="whitespace-pre-wrap">{analysis}</pre>
                            </div>
                          </ScrollArea>
                        )}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {builds.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">No builds found</CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
