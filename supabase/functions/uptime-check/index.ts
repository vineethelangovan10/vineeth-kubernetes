import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();
    const { action, monitorId } = body;

    if (action === "check_single") {
      // Fetch monitor config
      const { data: monitor, error } = await supabase
        .from("monitors")
        .select("*")
        .eq("id", monitorId)
        .single();
      if (error || !monitor) throw new Error("Monitor not found");

      const result = await performCheck(monitor);

      // Insert check result
      await supabase.from("monitor_checks").insert({
        monitor_id: monitor.id,
        status: result.status,
        response_time_ms: result.responseTime,
        status_code: result.statusCode,
        error_message: result.error,
        tls_expiry_days: result.tlsExpiryDays,
      });

      // Update monitor status
      const newConsecFail =
        result.status === "down" ? monitor.consecutive_failures + 1 : 0;
      const newConsecSuccess =
        result.status === "up" ? monitor.consecutive_successes + 1 : 0;

      let currentStatus = monitor.current_status;
      if (newConsecFail >= monitor.failure_threshold) currentStatus = "down";
      if (newConsecSuccess >= monitor.recovery_threshold) currentStatus = "up";
      if (result.status === "up" && monitor.current_status === "unknown")
        currentStatus = "up";

      await supabase
        .from("monitors")
        .update({
          current_status: currentStatus,
          last_checked_at: new Date().toISOString(),
          consecutive_failures: newConsecFail,
          consecutive_successes: newConsecSuccess,
        })
        .eq("id", monitor.id);

      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "check_all") {
      // Check all active monitors for a user
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("Missing auth");

      const {
        data: { user },
      } = await createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      ).auth.getUser();

      if (!user) throw new Error("Unauthorized");

      const { data: monitors } = await supabase
        .from("monitors")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);

      const results = [];
      for (const monitor of monitors || []) {
        // Skip if in maintenance window
        if (monitor.maintenance_start && monitor.maintenance_end) {
          const now = new Date();
          if (
            now >= new Date(monitor.maintenance_start) &&
            now <= new Date(monitor.maintenance_end)
          ) {
            results.push({ id: monitor.id, status: "maintenance" });
            continue;
          }
        }

        const result = await performCheck(monitor);

        await supabase.from("monitor_checks").insert({
          monitor_id: monitor.id,
          status: result.status,
          response_time_ms: result.responseTime,
          status_code: result.statusCode,
          error_message: result.error,
          tls_expiry_days: result.tlsExpiryDays,
        });

        const newConsecFail =
          result.status === "down" ? monitor.consecutive_failures + 1 : 0;
        const newConsecSuccess =
          result.status === "up" ? monitor.consecutive_successes + 1 : 0;

        let currentStatus = monitor.current_status;
        if (newConsecFail >= monitor.failure_threshold) currentStatus = "down";
        if (newConsecSuccess >= monitor.recovery_threshold)
          currentStatus = "up";
        if (result.status === "up" && monitor.current_status === "unknown")
          currentStatus = "up";

        await supabase
          .from("monitors")
          .update({
            current_status: currentStatus,
            last_checked_at: new Date().toISOString(),
            consecutive_failures: newConsecFail,
            consecutive_successes: newConsecSuccess,
          })
          .eq("id", monitor.id);

        results.push({ id: monitor.id, ...result });
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unknown action");
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function performCheck(monitor: any) {
  const start = Date.now();
  let status = "up";
  let statusCode: number | null = null;
  let error: string | null = null;
  let tlsExpiryDays: number | null = null;

  const type = monitor.monitor_type?.toLowerCase();

  for (let attempt = 0; attempt <= (monitor.retry_count || 0); attempt++) {
    try {
      if (type === "http" || type === "https" || type === "tcp") {
        let url = monitor.endpoint;
        if (
          !url.startsWith("http://") &&
          !url.startsWith("https://")
        ) {
          url = `${type === "http" ? "http" : "https"}://${url}`;
        }
        if (monitor.request_path && !url.includes(monitor.request_path)) {
          url = url.replace(/\/$/, "") + monitor.request_path;
        }
        if (monitor.port) {
          const u = new URL(url);
          u.port = String(monitor.port);
          url = u.toString();
        }

        const headers: Record<string, string> = {};
        if (monitor.custom_headers) {
          Object.assign(headers, monitor.custom_headers);
        }
        if (monitor.auth_type === "bearer" && monitor.auth_credentials) {
          headers["Authorization"] = `Bearer ${monitor.auth_credentials}`;
        } else if (monitor.auth_type === "basic" && monitor.auth_credentials) {
          headers["Authorization"] = `Basic ${btoa(monitor.auth_credentials)}`;
        } else if (monitor.auth_type === "apikey" && monitor.auth_credentials) {
          headers["X-API-Key"] = monitor.auth_credentials;
        }

        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(),
          (monitor.timeout_seconds || 10) * 1000
        );

        const resp = await fetch(url, {
          method: monitor.http_method || "GET",
          headers,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        statusCode = resp.status;

        if (
          monitor.expected_status_code &&
          resp.status !== monitor.expected_status_code
        ) {
          status = "down";
          error = `Expected ${monitor.expected_status_code}, got ${resp.status}`;
        } else if (monitor.expected_body_match) {
          const text = await resp.text();
          if (!text.includes(monitor.expected_body_match)) {
            status = "down";
            error = "Response body match failed";
          } else {
            status = "up";
            error = null;
          }
        } else {
          status = "up";
          error = null;
        }

        if (status === "up") break;
      } else if (type === "dns") {
        // Simple DNS check via fetch to a known DNS-over-HTTPS resolver
        const hostname = monitor.endpoint.replace(/https?:\/\//, "");
        const resp = await fetch(
          `https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`
        );
        const data = await resp.json();
        if (data.Status === 0 && data.Answer?.length > 0) {
          status = "up";
          error = null;
          break;
        } else {
          status = "down";
          error = "DNS resolution failed";
        }
      } else {
        // Ping - attempt via HTTP HEAD as ICMP not available in edge
        const url = monitor.endpoint.startsWith("http")
          ? monitor.endpoint
          : `https://${monitor.endpoint}`;
        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(),
          (monitor.timeout_seconds || 10) * 1000
        );
        const resp = await fetch(url, {
          method: "HEAD",
          signal: controller.signal,
        });
        clearTimeout(timeout);
        statusCode = resp.status;
        status = resp.ok ? "up" : "down";
        if (status === "up") break;
      }
    } catch (e) {
      status = "down";
      error = e.message || "Connection failed";
    }
  }

  return {
    status,
    responseTime: Date.now() - start,
    statusCode,
    error,
    tlsExpiryDays,
  };
}
