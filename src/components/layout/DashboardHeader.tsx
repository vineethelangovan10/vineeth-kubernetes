import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useCluster } from "@/hooks/useCluster";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CircleDot, LogOut, Plus, User, Server } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function DashboardHeader() {
  const { user, signOut } = useAuth();
  const { clusters, activeCluster, namespace, setNamespace, switchCluster } = useCluster();
  const navigate = useNavigate();

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger />

        {/* Cluster selector */}
        <Select
          value={activeCluster?.id || ""}
          onValueChange={(v) => {
            if (v === "__add") { navigate("/clusters/add"); return; }
            switchCluster(v);
          }}
        >
          <SelectTrigger className="w-[200px] h-9">
            <div className="flex items-center gap-2">
              <Server className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Select cluster" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {clusters.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <div className="flex items-center gap-2">
                  <CircleDot className={`h-3 w-3 ${c.status === "connected" ? "text-success" : "text-muted-foreground"}`} />
                  {c.name}
                </div>
              </SelectItem>
            ))}
            <SelectItem value="__add">
              <div className="flex items-center gap-2 text-primary">
                <Plus className="h-3 w-3" />
                Add Cluster
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Namespace filter */}
        <Select value={namespace} onValueChange={setNamespace}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Namespace" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Namespaces</SelectItem>
            <SelectItem value="default">default</SelectItem>
            <SelectItem value="kube-system">kube-system</SelectItem>
            <SelectItem value="kube-public">kube-public</SelectItem>
          </SelectContent>
        </Select>

        {activeCluster && (
          <Badge variant={activeCluster.status === "connected" ? "default" : "secondary"} className="h-6 text-xs">
            {activeCluster.status}
          </Badge>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <User className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="px-2 py-1.5 text-sm text-muted-foreground">{user?.email}</div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/clusters/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Cluster
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
