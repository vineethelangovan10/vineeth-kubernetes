import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Monitor {
  id: string;
  name: string;
  description: string | null;
  environment: string;
  owner: string | null;
  tags: Record<string, string>;
  monitor_type: string;
  endpoint: string;
  port: number | null;
  request_path: string | null;
  http_method: string;
  custom_headers: Record<string, string>;
  check_interval_seconds: number;
  timeout_seconds: number;
  retry_count: number;
  expected_status_code: number | null;
  expected_body_match: string | null;
  auth_type: string;
  auth_credentials: string | null;
  failure_threshold: number;
  recovery_threshold: number;
  maintenance_start: string | null;
  maintenance_end: string | null;
  alert_channels: any[];
  alert_severity: string;
  notify_on: string[];
  sla_target: number;
  business_hours: string;
  monitoring_region: string;
  latency_warning_ms: number;
  latency_critical_ms: number;
  tls_check_enabled: boolean;
  tls_expiry_alert_days: number;
  current_status: string;
  last_checked_at: string | null;
  consecutive_failures: number;
  consecutive_successes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MonitorCheck {
  id: string;
  monitor_id: string;
  status: string;
  response_time_ms: number | null;
  status_code: number | null;
  error_message: string | null;
  tls_expiry_days: number | null;
  checked_at: string;
}

export function useMonitors() {
  const { user } = useAuth();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMonitors = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("monitors")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setMonitors((data as any as Monitor[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchMonitors();
  }, [fetchMonitors]);

  const createMonitor = async (monitor: Partial<Monitor>) => {
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase.from("monitors").insert({
      ...monitor,
      user_id: user.id,
    } as any);
    if (error) throw error;
    await fetchMonitors();
  };

  const updateMonitor = async (id: string, updates: Partial<Monitor>) => {
    const { error } = await supabase
      .from("monitors")
      .update(updates as any)
      .eq("id", id);
    if (error) throw error;
    await fetchMonitors();
  };

  const deleteMonitor = async (id: string) => {
    const { error } = await supabase.from("monitors").delete().eq("id", id);
    if (error) throw error;
    await fetchMonitors();
  };

  const runCheck = async (monitorId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/uptime-check`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: "check_single", monitorId }),
      }
    );
    const result = await resp.json();
    if (!resp.ok) throw new Error(result.error);
    await fetchMonitors();
    return result;
  };

  const runAllChecks = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/uptime-check`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: "check_all" }),
      }
    );
    const result = await resp.json();
    if (!resp.ok) throw new Error(result.error);
    await fetchMonitors();
    return result;
  };

  const fetchChecks = async (monitorId: string, limit = 50): Promise<MonitorCheck[]> => {
    const { data } = await supabase
      .from("monitor_checks")
      .select("*")
      .eq("monitor_id", monitorId)
      .order("checked_at", { ascending: false })
      .limit(limit);
    return (data as any as MonitorCheck[]) || [];
  };

  return {
    monitors,
    loading,
    fetchMonitors,
    createMonitor,
    updateMonitor,
    deleteMonitor,
    runCheck,
    runAllChecks,
    fetchChecks,
  };
}
