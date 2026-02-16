import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ClusterProvider } from "@/hooks/useCluster";
import { AdoProvider } from "@/hooks/useAdo";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Auth from "@/pages/Auth";
import ClusterOverview from "@/pages/ClusterOverview";
import Pods from "@/pages/Pods";
import Logs from "@/pages/Logs";
import Deployments from "@/pages/Deployments";
import StatefulSets from "@/pages/StatefulSets";
import DaemonSets from "@/pages/DaemonSets";
import Jobs from "@/pages/Jobs";
import CronJobs from "@/pages/CronJobs";
import Nodes from "@/pages/Nodes";
import Namespaces from "@/pages/Namespaces";
import Services from "@/pages/Services";
import Ingresses from "@/pages/Ingresses";
import ConfigMaps from "@/pages/ConfigMaps";
import Secrets from "@/pages/Secrets";
import Storage from "@/pages/Storage";
import RBAC from "@/pages/RBAC";
import AddCluster from "@/pages/AddCluster";
import AdoSettings from "@/pages/AdoSettings";
import AdoRepositories from "@/pages/AdoRepositories";
import AdoPipelines from "@/pages/AdoPipelines";
import AdoScanReports from "@/pages/AdoScanReports";
import AdoReleases from "@/pages/AdoReleases";
import UptimeMonitoring from "@/pages/UptimeMonitoring";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return (
    <ClusterProvider>
      <AdoProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </AdoProvider>
    </ClusterProvider>
  );
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/" element={<ProtectedRoute><ClusterOverview /></ProtectedRoute>} />
            <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
            <Route path="/pods" element={<ProtectedRoute><Pods /></ProtectedRoute>} />
            <Route path="/deployments" element={<ProtectedRoute><Deployments /></ProtectedRoute>} />
            <Route path="/statefulsets" element={<ProtectedRoute><StatefulSets /></ProtectedRoute>} />
            <Route path="/daemonsets" element={<ProtectedRoute><DaemonSets /></ProtectedRoute>} />
            <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
            <Route path="/cronjobs" element={<ProtectedRoute><CronJobs /></ProtectedRoute>} />
            <Route path="/nodes" element={<ProtectedRoute><Nodes /></ProtectedRoute>} />
            <Route path="/namespaces" element={<ProtectedRoute><Namespaces /></ProtectedRoute>} />
            <Route path="/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
            <Route path="/ingresses" element={<ProtectedRoute><Ingresses /></ProtectedRoute>} />
            <Route path="/configmaps" element={<ProtectedRoute><ConfigMaps /></ProtectedRoute>} />
            <Route path="/secrets" element={<ProtectedRoute><Secrets /></ProtectedRoute>} />
            <Route path="/storage" element={<ProtectedRoute><Storage /></ProtectedRoute>} />
            <Route path="/rbac" element={<ProtectedRoute><RBAC /></ProtectedRoute>} />
            <Route path="/clusters/add" element={<ProtectedRoute><AddCluster /></ProtectedRoute>} />
            <Route path="/ado/settings" element={<ProtectedRoute><AdoSettings /></ProtectedRoute>} />
            <Route path="/ado/repositories" element={<ProtectedRoute><AdoRepositories /></ProtectedRoute>} />
            <Route path="/ado/pipelines" element={<ProtectedRoute><AdoPipelines /></ProtectedRoute>} />
            <Route path="/ado/releases" element={<ProtectedRoute><AdoReleases /></ProtectedRoute>} />
            <Route path="/ado/reports" element={<ProtectedRoute><AdoScanReports /></ProtectedRoute>} />
            <Route path="/uptime" element={<ProtectedRoute><UptimeMonitoring /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
