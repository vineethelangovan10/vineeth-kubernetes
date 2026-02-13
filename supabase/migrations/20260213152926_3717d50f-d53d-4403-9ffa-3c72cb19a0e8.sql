
-- Azure DevOps connections table
CREATE TABLE public.ado_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization TEXT NOT NULL,
  pat TEXT NOT NULL,
  projects TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ado_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ADO connections"
  ON public.ado_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ADO connections"
  ON public.ado_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ADO connections"
  ON public.ado_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ADO connections"
  ON public.ado_connections FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_ado_connections_updated_at
  BEFORE UPDATE ON public.ado_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Scan results table
CREATE TABLE public.ado_scan_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connection_id UUID NOT NULL REFERENCES public.ado_connections(id) ON DELETE CASCADE,
  repository_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  scan_type TEXT NOT NULL, -- 'filesystem', 'dockerfile', 'docker_image'
  severity_summary JSONB NOT NULL DEFAULT '{}',
  vulnerabilities JSONB NOT NULL DEFAULT '[]',
  recommendations JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'scanning', 'completed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ado_scan_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scan results"
  ON public.ado_scan_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scan results"
  ON public.ado_scan_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scan results"
  ON public.ado_scan_results FOR DELETE
  USING (auth.uid() = user_id);

-- Service role access for edge functions
CREATE POLICY "Service role full access ado_connections"
  ON public.ado_connections FOR ALL
  USING (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Service role full access ado_scan_results"
  ON public.ado_scan_results FOR ALL
  USING (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'service_role'::text);
