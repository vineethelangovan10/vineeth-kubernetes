import { useState, useMemo } from "react";
import { mockLogs, LogEntry } from "@/lib/mock-logs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, RotateCcw } from "lucide-react";

const levelColors: Record<string, string> = {
  error: "bg-destructive/15 text-destructive border-destructive/30",
  warn: "bg-warning/15 text-warning border-warning/30",
  info: "bg-primary/10 text-primary border-primary/30",
  debug: "bg-muted text-muted-foreground border-border",
};

export default function Logs() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [namespaceFilter, setNamespaceFilter] = useState<string>("all");

  const namespaces = useMemo(() => [...new Set(mockLogs.map((l) => l.namespace))], []);

  const filtered = useMemo(() => {
    return mockLogs.filter((log) => {
      if (levelFilter !== "all" && log.level !== levelFilter) return false;
      if (namespaceFilter !== "all" && log.namespace !== namespaceFilter) return false;
      if (search && !log.message.toLowerCase().includes(search.toLowerCase()) && !log.pod.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, levelFilter, namespaceFilter]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Logs</h1>
        <p className="text-muted-foreground">Monitor container logs across your cluster</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="warn">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="debug">Debug</SelectItem>
          </SelectContent>
        </Select>
        <Select value={namespaceFilter} onValueChange={setNamespaceFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Namespace" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Namespaces</SelectItem>
            {namespaces.map((ns) => (
              <SelectItem key={ns} value={ns}>{ns}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => { setSearch(""); setLevelFilter("all"); setNamespaceFilter("all"); }}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <ScrollArea className="h-[calc(100vh-260px)]">
          <div className="font-mono text-xs">
            {filtered.map((log, i) => (
              <LogLine key={i} log={log} />
            ))}
            {filtered.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No logs match your filters</div>
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="text-xs text-muted-foreground">{filtered.length} log entries</div>
    </div>
  );
}

function LogLine({ log }: { log: LogEntry }) {
  const time = new Date(log.timestamp).toLocaleTimeString("en-US", { hour12: false } as Intl.DateTimeFormatOptions);
  return (
    <div className="flex gap-2 px-3 py-1.5 border-b border-border/50 hover:bg-muted/50 items-start">
      <span className="text-muted-foreground shrink-0 w-[90px]">{time}</span>
      <Badge variant="outline" className={`shrink-0 text-[10px] px-1.5 py-0 font-medium uppercase ${levelColors[log.level]}`}>
        {log.level}
      </Badge>
      <span className="text-primary/70 shrink-0 w-[100px] truncate">{log.namespace}</span>
      <span className="text-foreground/70 shrink-0 w-[280px] truncate">{log.pod}</span>
      <span className={`flex-1 break-all ${log.level === "error" ? "text-destructive" : log.level === "warn" ? "text-warning" : "text-foreground"}`}>
        {log.message}
      </span>
    </div>
  );
}
