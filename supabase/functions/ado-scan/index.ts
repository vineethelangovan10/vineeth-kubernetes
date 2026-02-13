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
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { connectionId, project, repository, files, scanType } = await req.json();

    // Verify connection belongs to user
    const { data: conn, error: connErr } = await supabase
      .from("ado_connections")
      .select("*")
      .eq("id", connectionId)
      .eq("user_id", user.id)
      .single();
    if (connErr || !conn) throw new Error("Connection not found");

    // Build file content for analysis
    const fileContents = files.map((f: { path: string; content: string }) =>
      `--- FILE: ${f.path} ---\n${f.content}\n`
    ).join("\n");

    const systemPrompt = `You are a security vulnerability scanner similar to Trivy. You analyze code files for security issues.

For scan type "${scanType}", analyze the provided files and return a JSON response with this exact structure:
{
  "severity_summary": { "critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0 },
  "vulnerabilities": [
    {
      "id": "CVE-XXXX-XXXX or custom ID",
      "title": "Short vulnerability title",
      "severity": "critical|high|medium|low|info",
      "file": "file path",
      "line": "line number or range",
      "description": "Detailed description",
      "fix": "Exact fix/remediation steps with code examples"
    }
  ],
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "What to do",
      "priority": "high|medium|low",
      "category": "security|performance|best-practice"
    }
  ]
}

Scan types:
- "filesystem": Check package.json, requirements.txt, etc. for known vulnerable dependencies, outdated packages, and insecure configurations.
- "dockerfile": Check Dockerfile for security misconfigurations like running as root, using latest tags, exposing unnecessary ports, missing health checks, large base images.
- "docker_image": Analyze base images referenced in Dockerfiles for known OS package vulnerabilities.
- "pipeline": Analyze Azure Pipeline YAML for security issues like hardcoded secrets, missing artifact signing, insecure script execution, excessive permissions.

Be thorough and realistic. Provide CVE IDs where applicable. Return ONLY valid JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Scan the following files:\n\n${fileContents}` },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response
    let scanResult;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      scanResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { severity_summary: {}, vulnerabilities: [], recommendations: [] };
    } catch {
      scanResult = { severity_summary: {}, vulnerabilities: [], recommendations: [], raw: aiContent };
    }

    // Store result
    const { data: saved, error: saveErr } = await supabase
      .from("ado_scan_results")
      .insert({
        user_id: user.id,
        connection_id: connectionId,
        repository_name: repository,
        project_name: project,
        scan_type: scanType,
        severity_summary: scanResult.severity_summary || {},
        vulnerabilities: scanResult.vulnerabilities || [],
        recommendations: scanResult.recommendations || [],
        status: "completed",
      })
      .select()
      .single();

    if (saveErr) console.error("Save error:", saveErr);

    return new Response(JSON.stringify({ scan: saved, result: scanResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ado-scan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
