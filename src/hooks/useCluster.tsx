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

export function ClusterProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [namespace, setNamespace] = useState("all");

  const fetchClusters = async () => {
    if (!user) { setClusters([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("clusters")
      .select("id, name, server_url, is_active, status, created_at")
      .order("created_at", { ascending: true });
    if (error) { console.error(error); return; }
    setClusters(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchClusters(); }, [user]);

  const activeCluster = clusters.find((c) => c.is_active) || null;

  const switchCluster = async (id: string) => {
    // Deactivate all, then activate selected
    await supabase.from("clusters").update({ is_active: false }).eq("user_id", user!.id);
    await supabase.from("clusters").update({ is_active: true }).eq("id", id);
    await fetchClusters();
  };

  const addCluster = async (name: string, kubeconfig: string) => {
    const isFirst = clusters.length === 0;
    const { error } = await supabase.from("clusters").insert({
      user_id: user!.id,
      name,
      kubeconfig,
      is_active: isFirst,
      status: "connected",
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Cluster added", description: `${name} has been connected.` });
    await fetchClusters();
  };

  const removeCluster = async (id: string) => {
    await supabase.from("clusters").delete().eq("id", id);
    toast({ title: "Cluster removed" });
    await fetchClusters();
  };

  return (
    <ClusterContext.Provider value={{ clusters, activeCluster, loading, namespace, setNamespace, switchCluster, addCluster, removeCluster, refreshClusters: fetchClusters }}>
      {children}
    </ClusterContext.Provider>
  );
}

export const useCluster = () => useContext(ClusterContext);
