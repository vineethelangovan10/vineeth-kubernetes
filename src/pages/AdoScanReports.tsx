import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Shield, AlertTriangle, CheckCircle2, Info, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface ScanResult {
  id: string;
  repository_name: string;
  project_name: string;
  scan_type: string;
  severity_summary: Record<string, number>;
  vulnerabilities: any[];
  recommendations: any[];
  status: string;
  created_at: string;
}

export default function AdoScanReports() {
  const { user } = useAuth();
  const [results, setResults] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    loadResults();
  }, [user]);

  const loadResults = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("ado_scan_results")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setResults((data || []) as ScanResult[]);
    setLoading(false);
  };

  const deleteResult = async (id: string) => {
    await supabase.from("ado_scan_results").delete().eq("id", id);
    setResults((prev) => prev.filter((r) => r.id !== id));
    toast.success("Report deleted");
  };

  const severityColor = (sev: string) => {
    switch (sev) {
      case "critical": return "text-destructive";
      case "high": return "text-orange-500";
      case "medium": return "text-yellow-500";
      case "low": return "text-muted-foreground";
      default: return "text-muted-foreground";
    }
  };

  const severityBadge = (sev: string) => {
    switch (sev) {
      case "critical": return "destructive" as const;
      case "high": return "destructive" as const;
      default: return "secondary" as const;
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  // Summary stats
  const totalCritical = results.reduce((a, r) => a + (r.severity_summary?.critical || 0), 0);
  const totalHigh = results.reduce((a, r) => a + (r.severity_summary?.high || 0), 0);
  const totalMedium = results.reduce((a, r) => a + (r.severity_summary?.medium || 0), 0);
  const totalVulns = results.reduce((a, r) => a + (r.vulnerabilities?.length || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scan Reports</h1>
        <p className="text-muted-foreground text-sm">Security scan results with vulnerability details and remediation</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{results.length}</p>
            <p className="text-xs text-muted-foreground">Total Scans</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-destructive">{totalCritical}</p>
            <p className="text-xs text-muted-foreground">Critical</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-orange-500">{totalHigh}</p>
            <p className="text-xs text-muted-foreground">High</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-yellow-500">{totalMedium}</p>
            <p className="text-xs text-muted-foreground">Medium</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports list */}
      <div className="space-y-3">
        {results.map((result) => {
          const vulns = result.vulnerabilities || [];
          const recs = result.recommendations || [];
          const isExpanded = expanded === result.id;

          return (
            <Card key={result.id}>
              <CardContent className="p-0">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : result.id)}
                >
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{result.repository_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {result.project_name} · {result.scan_type} · {new Date(result.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(result.severity_summary?.critical || 0) > 0 && (
                      <Badge variant="destructive">{result.severity_summary.critical} Critical</Badge>
                    )}
                    {(result.severity_summary?.high || 0) > 0 && (
                      <Badge className="bg-orange-500 text-white">{result.severity_summary.high} High</Badge>
                    )}
                    <Badge variant="secondary">{vulns.length} issues</Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t p-4 space-y-4">
                    {/* Vulnerabilities */}
                    {vulns.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" /> Vulnerabilities ({vulns.length})
                        </h3>
                        <ScrollArea className="max-h-[400px]">
                          <div className="space-y-2">
                            {vulns.map((v: any, i: number) => (
                              <div key={i} className="border rounded-lg p-3 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <AlertTriangle className={`h-3.5 w-3.5 ${severityColor(v.severity)}`} />
                                  <Badge variant={severityBadge(v.severity)} className="text-[10px]">
                                    {v.severity?.toUpperCase()}
                                  </Badge>
                                  <span className="font-medium text-sm">{v.title}</span>
                                  {v.id && <Badge variant="outline" className="text-[10px] font-mono">{v.id}</Badge>}
                                </div>
                                {v.file && <p className="text-xs text-muted-foreground font-mono">📄 {v.file}{v.line ? `:${v.line}` : ""}</p>}
                                <p className="text-xs text-muted-foreground">{v.description}</p>
                                {v.fix && (
                                  <div className="bg-primary/5 border border-primary/20 rounded p-2">
                                    <p className="text-xs font-medium text-primary mb-1">✅ Fix</p>
                                    <p className="text-xs whitespace-pre-wrap">{v.fix}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}

                    {/* Recommendations */}
                    {recs.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Info className="h-4 w-4" /> Recommendations ({recs.length})
                        </h3>
                        <div className="space-y-2">
                          {recs.map((r: any, i: number) => (
                            <div key={i} className="border rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                                <span className="text-sm font-medium">{r.title}</span>
                                <Badge variant="outline" className="text-[10px]">{r.priority}</Badge>
                                <Badge variant="outline" className="text-[10px]">{r.category}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{r.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => deleteResult(result.id)}>
                        <Trash2 className="mr-2 h-3 w-3" /> Delete Report
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {results.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No scan reports yet</p>
              <p className="text-sm">Go to Repositories to run your first scan</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
