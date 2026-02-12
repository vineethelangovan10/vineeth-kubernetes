import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  Box,
  Layers,
  Server,
  Network,
  Globe,
  FileText,
  Lock,
  HardDrive,
  FolderCog,
  Shield,
  Users,
  Workflow,
  Timer,
  Boxes,
  Container,
  ScrollText,
} from "lucide-react";

const navGroups = [
  {
    label: "Overview",
    items: [
      { title: "Cluster Overview", url: "/", icon: LayoutDashboard },
      { title: "Logs", url: "/logs", icon: ScrollText },
    ],
  },
  {
    label: "Workloads",
    items: [
      { title: "Pods", url: "/pods", icon: Box },
      { title: "Deployments", url: "/deployments", icon: Layers },
      { title: "StatefulSets", url: "/statefulsets", icon: Boxes },
      { title: "DaemonSets", url: "/daemonsets", icon: Container },
      { title: "Jobs", url: "/jobs", icon: Workflow },
      { title: "CronJobs", url: "/cronjobs", icon: Timer },
    ],
  },
  {
    label: "Cluster",
    items: [
      { title: "Nodes", url: "/nodes", icon: Server },
      { title: "Namespaces", url: "/namespaces", icon: FolderCog },
    ],
  },
  {
    label: "Networking",
    items: [
      { title: "Services", url: "/services", icon: Network },
      { title: "Ingresses", url: "/ingresses", icon: Globe },
    ],
  },
  {
    label: "Config & Storage",
    items: [
      { title: "ConfigMaps", url: "/configmaps", icon: FileText },
      { title: "Secrets", url: "/secrets", icon: Lock },
      { title: "PV & PVCs", url: "/storage", icon: HardDrive },
    ],
  },
  {
    label: "Access Control",
    items: [
      { title: "Roles & Bindings", url: "/rbac", icon: Shield },
    ],
  },
];

export function AppSidebar() {
  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Box className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <span className="font-semibold text-sidebar-foreground text-lg">KubeDash</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-sidebar-muted uppercase text-xs tracking-wider">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className="hover:bg-sidebar-accent/50 text-sidebar-foreground"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
