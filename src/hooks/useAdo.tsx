import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AdoConnection {
  id: string;
  organization: string;
  projects: string[];
  is_active: boolean;
  created_at: string;
}

interface AdoContextType {
  connections: AdoConnection[];
  activeConnection: AdoConnection | null;
  loading: boolean;
  refreshConnections: () => Promise<void>;
  addConnection: (org: string, pat: string, projects: string[]) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  setActiveConnection: (conn: AdoConnection | null) => void;
  callAdo: (action: string, params?: Record<string, any>) => Promise<any>;
}

const AdoContext = createContext<AdoContextType>({
  connections: [],
  activeConnection: null,
  loading: true,
  refreshConnections: async () => {},
  addConnection: async () => {},
  deleteConnection: async () => {},
  setActiveConnection: () => {},
  callAdo: async () => {},
});

export function AdoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [connections, setConnections] = useState<AdoConnection[]>([]);
  const [activeConnection, setActiveConnection] = useState<AdoConnection | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshConnections = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("ado_connections")
      .select("id, organization, projects, is_active, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    const conns = (data || []) as AdoConnection[];
    setConnections(conns);
    if (!activeConnection && conns.length > 0) {
      setActiveConnection(conns[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshConnections();
  }, [user]);

  const addConnection = async (org: string, pat: string, projects: string[]) => {
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase.from("ado_connections").insert({
      user_id: user.id,
      organization: org,
      pat,
      projects,
    });
    if (error) throw error;
    await refreshConnections();
  };

  const deleteConnection = async (id: string) => {
    const { error } = await supabase.from("ado_connections").delete().eq("id", id);
    if (error) throw error;
    if (activeConnection?.id === id) setActiveConnection(null);
    await refreshConnections();
  };

  const callAdo = async (action: string, params: Record<string, any> = {}) => {
    if (!activeConnection) throw new Error("No active ADO connection");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ado-proxy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ connectionId: activeConnection.id, action, ...params }),
    });

    const result = await resp.json();
    if (!resp.ok) throw new Error(result.error || "ADO API call failed");
    return result;
  };

  return (
    <AdoContext.Provider value={{
      connections, activeConnection, loading,
      refreshConnections, addConnection, deleteConnection,
      setActiveConnection, callAdo,
    }}>
      {children}
    </AdoContext.Provider>
  );
}

export const useAdo = () => useContext(AdoContext);
