import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = [
  "https://vineeth-kubernetes.lovable.app",
  "https://id-preview--98a94d8d-4a15-47de-892c-d3b9e49c5a97.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: authError } = await userClient.auth.getClaims(token);
    if (authError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = { id: claimsData.claims.sub as string };

    // Use service role for DB operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { action, ...payload } = await req.json();

    if (action === "add") {
      const { name, kubeconfig } = payload;

      // Validate inputs
      if (!name || typeof name !== "string" || name.length > 255) {
        return new Response(JSON.stringify({ error: "Invalid cluster name" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!kubeconfig || typeof kubeconfig !== "string" || kubeconfig.length < 50 || kubeconfig.length > 50000) {
        return new Response(JSON.stringify({ error: "Invalid kubeconfig (must be 50-50000 chars)" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check existing cluster count
      const { count } = await adminClient
        .from("clusters")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      const isFirst = (count ?? 0) === 0;

      const { error } = await adminClient.from("clusters").insert({
        user_id: user.id,
        name: name.trim(),
        kubeconfig,
        is_active: isFirst,
        status: "connected",
      });

      if (error) {
        console.error("Cluster insert failed:", error);
        let userMessage = "Failed to add cluster. Please try again.";
        if (error.code === "23505") {
          userMessage = "A cluster with this name already exists.";
        }
        return new Response(JSON.stringify({ error: userMessage }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "remove") {
      const { id } = payload;
      if (!id) {
        return new Response(JSON.stringify({ error: "Missing cluster id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify ownership
      const { data: cluster } = await adminClient
        .from("clusters")
        .select("user_id")
        .eq("id", id)
        .single();

      if (!cluster || cluster.user_id !== user.id) {
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await adminClient.from("clusters").delete().eq("id", id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "switch") {
      const { id } = payload;
      if (!id) {
        return new Response(JSON.stringify({ error: "Missing cluster id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify ownership
      const { data: cluster } = await adminClient
        .from("clusters")
        .select("user_id")
        .eq("id", id)
        .single();

      if (!cluster || cluster.user_id !== user.id) {
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await adminClient.from("clusters").update({ is_active: false }).eq("user_id", user.id);
      await adminClient.from("clusters").update({ is_active: true }).eq("id", id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
