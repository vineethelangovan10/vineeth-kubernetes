import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface VmAgent {
  id: string;
  name: string;
  hostname: string;
  ip_address: string | null;
  os_info: string | null;
  agent_version: string | null;
  token: string;
  status: string;
  last_heartbeat_at: string | null;
  tags: Record<string, string>;
  environment: string;
  created_at: string;
  updated_at: string;
}

export interface VmMetric {
  id: string;
  agent_id: string;
  category: string;
  metric_name: string;
  metric_value: number;
  unit: string | null;
  labels: Record<string, string>;
  collected_at: string;
}

export interface VmAlert {
  id: string;
  agent_id: string;
  rule_name: string;
  condition: string;
  threshold: number;
  severity: string;
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
}

export function useVmAgents() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<VmAgent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("vm_agents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setAgents((data as any as VmAgent[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const callFunction = async (action: string, payload: any = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vm-agent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action, ...payload }),
      }
    );
    const result = await resp.json();
    if (!resp.ok) throw new Error(result.error || "Request failed");
    return result;
  };

  const registerAgent = async (data: { name: string; hostname: string; environment?: string; tags?: Record<string, string> }) => {
    const result = await callFunction("register_agent", data);
    await fetchAgents();
    return result.agent;
  };

  const deleteAgent = async (agentId: string) => {
    await callFunction("delete_agent", { agentId });
    await fetchAgents();
  };

  const getInstallScript = async (agentId: string) => {
    const result = await callFunction("get_install_script", { agentId });
    return result.script;
  };

  const getMetrics = async (agentId: string, category?: string, limit = 100): Promise<VmMetric[]> => {
    const result = await callFunction("get_metrics", { agentId, category, limit });
    return result.metrics || [];
  };

  const rotateToken = async (agentId: string) => {
    const result = await callFunction("rotate_token", { agentId });
    await fetchAgents();
    return result.token;
  };

  const createAlert = async (alert: Partial<VmAlert>) => {
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase.from("vm_alerts").insert({
      ...alert,
      user_id: user.id,
    } as any);
    if (error) throw error;
  };

  const fetchAlerts = async (agentId: string): Promise<VmAlert[]> => {
    const { data } = await supabase
      .from("vm_alerts")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false });
    return (data as any as VmAlert[]) || [];
  };

  const deleteAlert = async (alertId: string) => {
    await supabase.from("vm_alerts").delete().eq("id", alertId);
  };

  return {
    agents,
    loading,
    fetchAgents,
    registerAgent,
    deleteAgent,
    getInstallScript,
    getMetrics,
    rotateToken,
    createAlert,
    fetchAlerts,
    deleteAlert,
  };
}
