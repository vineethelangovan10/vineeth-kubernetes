import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface Cluster {
  id: string;
  name: string;
  server_url: string | null;
  is_active: boolean;
  status: string;
  created_at: string;
}

interface ClusterContextType {
  clusters: Cluster[];
  activeCluster: Cluster | null;
  loading: boolean;
  namespace: string;
  setNamespace: (ns: string) => void;
  switchCluster: (id: string) => Promise<void>;
  addCluster: (name: string, kubeconfig: string) => Promise<void>;
  removeCluster: (id: string) => Promise<void>;
  refreshClusters: () => Promise<void>;
}

const ClusterContext = createContext<ClusterContextType>({
  clusters: [],
  activeCluster: null,
  loading: true,
  namespace: "all",
  setNamespace: () => {},
  switchCluster: async () => {},
  addCluster: async () => {},
  removeCluster: async () => {},
  refreshClusters: async () => {},
});

async function callManageCluster(action: string, payload: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await supabase.functions.invoke("manage-cluster", {
    body: { action, ...payload },
  });

  if (res.error) throw new Error(res.error.message);
  if (res.data?.error) throw new Error(res.data.error);
  return res.data;
}

export function ClusterProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [namespace, setNamespace] = useState("all");

  const fetchClusters = async () => {
    if (!user) { setClusters([]); setLoading(false); return; }
    const { data, error } = await supabase.rpc("get_user_clusters");
    if (error) {
      toast({ title: "Error loading clusters", description: "Unable to fetch cluster data. Please try again.", variant: "destructive" });
      return;
    }
    setClusters((data as Cluster[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchClusters(); }, [user]);

  const activeCluster = clusters.find((c) => c.is_active) || null;

  const switchCluster = async (id: string) => {
    try {
      await callManageCluster("switch", { id });
      await fetchClusters();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const addCluster = async (name: string, kubeconfig: string) => {
    try {
      await callManageCluster("add", { name, kubeconfig });
      toast({ title: "Cluster added", description: `${name} has been connected.` });
      await fetchClusters();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const removeCluster = async (id: string) => {
    try {
      await callManageCluster("remove", { id });
      toast({ title: "Cluster removed" });
      await fetchClusters();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <ClusterContext.Provider value={{ clusters, activeCluster, loading, namespace, setNamespace, switchCluster, addCluster, removeCluster, refreshClusters: fetchClusters }}>
      {children}
    </ClusterContext.Provider>
  );
}

export const useCluster = () => useContext(ClusterContext);
