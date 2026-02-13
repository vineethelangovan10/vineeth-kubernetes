import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    const { action, connectionId, project, repository, buildId, path } = await req.json();

    // Get connection PAT
    const { data: conn, error: connErr } = await supabase
      .from("ado_connections")
      .select("*")
      .eq("id", connectionId)
      .eq("user_id", user.id)
      .single();
    if (connErr || !conn) throw new Error("Connection not found");

    const pat = conn.pat;
    const org = conn.organization;
    const adoHeaders = {
      Authorization: `Basic ${btoa(`:${pat}`)}`,
      "Content-Type": "application/json",
    };
    const baseUrl = `https://dev.azure.com/${org}`;

    let result: any;

    switch (action) {
      case "list_projects": {
        const resp = await fetch(`${baseUrl}/_apis/projects?api-version=7.1`, { headers: adoHeaders });
        if (!resp.ok) throw new Error(`ADO API error: ${resp.status} ${await resp.text()}`);
        result = await resp.json();
        break;
      }
      case "list_repos": {
        const resp = await fetch(`${baseUrl}/${project}/_apis/git/repositories?api-version=7.1`, { headers: adoHeaders });
        if (!resp.ok) throw new Error(`ADO API error: ${resp.status}`);
        result = await resp.json();
        break;
      }
      case "get_file_tree": {
        const resp = await fetch(
          `${baseUrl}/${project}/_apis/git/repositories/${repository}/items?recursionLevel=Full&api-version=7.1`,
          { headers: adoHeaders }
        );
        if (!resp.ok) throw new Error(`ADO API error: ${resp.status}`);
        result = await resp.json();
        break;
      }
      case "get_file_content": {
        const resp = await fetch(
          `${baseUrl}/${project}/_apis/git/repositories/${repository}/items?path=${encodeURIComponent(path)}&api-version=7.1`,
          { headers: { ...adoHeaders, Accept: "text/plain" } }
        );
        if (!resp.ok) throw new Error(`ADO API error: ${resp.status}`);
        result = { content: await resp.text(), path };
        break;
      }
      case "list_pipelines": {
        const resp = await fetch(
          `${baseUrl}/${project}/_apis/pipelines?api-version=7.1`,
          { headers: adoHeaders }
        );
        if (!resp.ok) throw new Error(`ADO API error: ${resp.status}`);
        result = await resp.json();
        break;
      }
      case "list_builds": {
        const resp = await fetch(
          `${baseUrl}/${project}/_apis/build/builds?$top=20&api-version=7.1`,
          { headers: adoHeaders }
        );
        if (!resp.ok) throw new Error(`ADO API error: ${resp.status}`);
        result = await resp.json();
        break;
      }
      case "get_build_logs": {
        const resp = await fetch(
          `${baseUrl}/${project}/_apis/build/builds/${buildId}/logs?api-version=7.1`,
          { headers: adoHeaders }
        );
        if (!resp.ok) throw new Error(`ADO API error: ${resp.status}`);
        result = await resp.json();
        break;
      }
      case "get_build_log_content": {
        const { logId } = await req.json().catch(() => ({}));
        const resp = await fetch(
          `${baseUrl}/${project}/_apis/build/builds/${buildId}/logs/${path}?api-version=7.1`,
          { headers: { ...adoHeaders, Accept: "text/plain" } }
        );
        if (!resp.ok) throw new Error(`ADO API error: ${resp.status}`);
        result = { content: await resp.text() };
        break;
      }
      case "get_build_timeline": {
        const resp = await fetch(
          `${baseUrl}/${project}/_apis/build/builds/${buildId}/timeline?api-version=7.1`,
          { headers: adoHeaders }
        );
        if (!resp.ok) throw new Error(`ADO API error: ${resp.status}`);
        result = await resp.json();
        break;
      }
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ado-proxy error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
