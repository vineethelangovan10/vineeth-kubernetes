import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-agent-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { action, ...payload } = await req.json();

    // Agent-token based actions (called from the VM agent itself)
    const agentToken = req.headers.get("x-agent-token");
    if (agentToken) {
      return await handleAgentAction(supabase, action, payload, agentToken);
    }

    // User-authenticated actions (called from the UI)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing authorization" }, 401);
    }
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    switch (action) {
      case "register_agent":
        return await registerAgent(supabase, user.id, payload);
      case "get_install_script":
        return await getInstallScript(supabase, user.id, payload);
      case "get_metrics":
        return await getMetrics(supabase, user.id, payload);
      case "delete_agent":
        return await deleteAgent(supabase, user.id, payload);
      case "rotate_token":
        return await rotateToken(supabase, user.id, payload);
      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (err) {
    return json({ error: "Internal error" }, 500);
  }
});

async function handleAgentAction(supabase: any, action: string, payload: any, token: string) {
  // Validate token
  const { data: agent } = await supabase
    .from("vm_agents")
    .select("*")
    .eq("token", token)
    .single();

  if (!agent) return json({ error: "Invalid agent token" }, 401);

  switch (action) {
    case "heartbeat": {
      await supabase.from("vm_agents").update({
        status: "online",
        last_heartbeat_at: new Date().toISOString(),
        os_info: payload.os_info || agent.os_info,
        agent_version: payload.agent_version || agent.agent_version,
        ip_address: payload.ip_address || agent.ip_address,
      }).eq("id", agent.id);
      return json({ ok: true });
    }
    case "push_metrics": {
      const metrics = payload.metrics || [];
      if (!Array.isArray(metrics) || metrics.length === 0) {
        return json({ error: "No metrics provided" }, 400);
      }
      const rows = metrics.map((m: any) => ({
        agent_id: agent.id,
        category: m.category || "system",
        metric_name: m.name,
        metric_value: m.value,
        unit: m.unit || null,
        labels: m.labels || {},
        collected_at: m.timestamp || new Date().toISOString(),
      }));
      const { error } = await supabase.from("vm_metrics").insert(rows);
      if (error) return json({ error: "Failed to store metrics" }, 500);

      // Check alert rules
      await checkAlerts(supabase, agent, metrics);

      return json({ ok: true, stored: rows.length });
    }
    default:
      return json({ error: "Unknown agent action" }, 400);
  }
}

async function checkAlerts(supabase: any, agent: any, metrics: any[]) {
  const { data: rules } = await supabase
    .from("vm_alerts")
    .select("*")
    .eq("agent_id", agent.id)
    .eq("is_active", true);

  if (!rules?.length) return;

  for (const rule of rules) {
    const metric = metrics.find((m: any) => m.name === rule.condition);
    if (!metric) continue;
    const triggered = metric.value > rule.threshold;
    if (triggered) {
      await supabase.from("vm_alerts").update({
        last_triggered_at: new Date().toISOString(),
      }).eq("id", rule.id);
    }
  }
}

async function registerAgent(supabase: any, userId: string, payload: any) {
  const { name, hostname, environment, tags } = payload;
  if (!name || !hostname) return json({ error: "name and hostname required" }, 400);

  const { data, error } = await supabase.from("vm_agents").insert({
    user_id: userId,
    name,
    hostname,
    environment: environment || "prod",
    tags: tags || {},
    status: "pending",
  }).select().single();

  if (error) return json({ error: "Failed to register agent" }, 500);
  return json({ agent: data });
}

async function getInstallScript(supabase: any, userId: string, payload: any) {
  const { agentId } = payload;
  if (!agentId) return json({ error: "agentId required" }, 400);

  const { data: agent } = await supabase
    .from("vm_agents")
    .select("token")
    .eq("id", agentId)
    .eq("user_id", userId)
    .single();

  if (!agent) return json({ error: "Agent not found" }, 404);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const functionUrl = `${supabaseUrl}/functions/v1/vm-agent`;

  const script = `#!/bin/bash
set -e

AGENT_TOKEN="${agent.token}"
ENDPOINT="${functionUrl}"
INTERVAL=\${INTERVAL:-60}

echo "🔧 KubeDash VM Agent Installer"
echo "================================"

# Create agent user (non-root)
if ! id "kubedash-agent" &>/dev/null; then
  sudo useradd -r -s /bin/false kubedash-agent 2>/dev/null || true
fi

# Create working directory
sudo mkdir -p /opt/kubedash-agent
sudo chown kubedash-agent:kubedash-agent /opt/kubedash-agent

# Create the metrics collector script
cat > /opt/kubedash-agent/collect.sh << 'COLLECTOR'
#!/bin/bash

get_cpu() {
  top -bn1 | grep "Cpu(s)" | awk '{print $2}' 2>/dev/null || echo "0"
}

get_memory() {
  free | awk '/Mem:/ {printf "%.1f", $3/$2 * 100}' 2>/dev/null || echo "0"
}

get_disk() {
  df / | awk 'NR==2 {printf "%.1f", $5}' | tr -d '%' 2>/dev/null || echo "0"
}

get_load() {
  cat /proc/loadavg | awk '{print $1}' 2>/dev/null || echo "0"
}

get_swap() {
  free | awk '/Swap:/ {if($2>0) printf "%.1f", $3/$2*100; else print "0"}' 2>/dev/null || echo "0"
}

get_net_rx() {
  cat /proc/net/dev | awk '/eth0|ens/ {print $2}' | head -1 2>/dev/null || echo "0"
}

get_net_tx() {
  cat /proc/net/dev | awk '/eth0|ens/ {print $10}' | head -1 2>/dev/null || echo "0"
}

get_processes() {
  ps aux | wc -l 2>/dev/null || echo "0"
}

get_docker_containers() {
  docker ps -q 2>/dev/null | wc -l || echo "0"
}

get_docker_running() {
  docker ps --format '{{.Names}}:{{.Status}}' 2>/dev/null || echo ""
}

get_nginx_active() {
  curl -s http://localhost/nginx_status 2>/dev/null | awk '/Active/ {print $3}' || echo "0"
}

NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
OS_INFO=$(uname -srm)
IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "unknown")

# Build metrics JSON
METRICS=$(cat <<EOF
[
  {"category":"system","name":"cpu_usage","value":$(get_cpu),"unit":"%"},
  {"category":"system","name":"memory_usage","value":$(get_memory),"unit":"%"},
  {"category":"system","name":"disk_usage","value":$(get_disk),"unit":"%"},
  {"category":"system","name":"load_avg_1m","value":$(get_load),"unit":""},
  {"category":"system","name":"swap_usage","value":$(get_swap),"unit":"%"},
  {"category":"system","name":"process_count","value":$(get_processes),"unit":""},
  {"category":"network","name":"net_rx_bytes","value":$(get_net_rx),"unit":"bytes"},
  {"category":"network","name":"net_tx_bytes","value":$(get_net_tx),"unit":"bytes"},
  {"category":"docker","name":"container_count","value":$(get_docker_containers),"unit":""},
  {"category":"nginx","name":"active_connections","value":$(get_nginx_active),"unit":""}
]
EOF
)

echo "\$METRICS"
echo "\$OS_INFO"
echo "\$IP"
COLLECTOR

chmod +x /opt/kubedash-agent/collect.sh

# Create the agent runner
cat > /opt/kubedash-agent/agent.sh << AGENT
#!/bin/bash
TOKEN="${agent.token}"
URL="${functionUrl}"
INTERVAL=\${1:-60}

while true; do
  RESULT=\$(/opt/kubedash-agent/collect.sh 2>/dev/null)
  METRICS=\$(echo "\$RESULT" | head -1)
  OS_INFO=\$(echo "\$RESULT" | sed -n '2p')
  IP=\$(echo "\$RESULT" | sed -n '3p')

  # Send heartbeat
  curl -sf -X POST "\$URL" \\
    -H "Content-Type: application/json" \\
    -H "x-agent-token: \$TOKEN" \\
    -d '{"action":"heartbeat","os_info":"'"\$OS_INFO"'","ip_address":"'"\$IP"'","agent_version":"1.0.0"}' \\
    > /dev/null 2>&1

  # Push metrics
  curl -sf -X POST "\$URL" \\
    -H "Content-Type: application/json" \\
    -H "x-agent-token: \$TOKEN" \\
    -d '{"action":"push_metrics","metrics":'\$METRICS'}' \\
    > /dev/null 2>&1

  sleep \$INTERVAL
done
AGENT

chmod +x /opt/kubedash-agent/agent.sh

# Create systemd service
cat > /etc/systemd/system/kubedash-agent.service << SERVICE
[Unit]
Description=KubeDash Monitoring Agent
After=network.target

[Service]
Type=simple
User=kubedash-agent
ExecStart=/opt/kubedash-agent/agent.sh ${INTERVAL}
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICE

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable kubedash-agent
sudo systemctl start kubedash-agent

echo ""
echo "✅ KubeDash Agent installed and running!"
echo "   Status: sudo systemctl status kubedash-agent"
echo "   Logs:   sudo journalctl -u kubedash-agent -f"
`;

  return json({ script });
}

async function getMetrics(supabase: any, userId: string, payload: any) {
  const { agentId, category, limit = 100, since } = payload;
  if (!agentId) return json({ error: "agentId required" }, 400);

  // Verify ownership
  const { data: agent } = await supabase
    .from("vm_agents")
    .select("id")
    .eq("id", agentId)
    .eq("user_id", userId)
    .single();

  if (!agent) return json({ error: "Agent not found" }, 404);

  let query = supabase
    .from("vm_metrics")
    .select("*")
    .eq("agent_id", agentId)
    .order("collected_at", { ascending: false })
    .limit(limit);

  if (category) query = query.eq("category", category);
  if (since) query = query.gte("collected_at", since);

  const { data, error } = await query;
  if (error) return json({ error: "Failed to fetch metrics" }, 500);
  return json({ metrics: data });
}

async function deleteAgent(supabase: any, userId: string, payload: any) {
  const { agentId } = payload;
  const { error } = await supabase
    .from("vm_agents")
    .delete()
    .eq("id", agentId)
    .eq("user_id", userId);
  if (error) return json({ error: "Failed to delete" }, 500);
  return json({ ok: true });
}

async function rotateToken(supabase: any, userId: string, payload: any) {
  const { agentId } = payload;
  const newToken = crypto.randomUUID() + crypto.randomUUID();
  const { error } = await supabase
    .from("vm_agents")
    .update({ token: newToken })
    .eq("id", agentId)
    .eq("user_id", userId);
  if (error) return json({ error: "Failed to rotate token" }, 500);
  return json({ ok: true, token: newToken });
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
