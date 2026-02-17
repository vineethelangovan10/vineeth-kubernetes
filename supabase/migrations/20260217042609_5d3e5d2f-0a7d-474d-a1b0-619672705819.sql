
-- Table: registered VM agents
CREATE TABLE public.vm_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  hostname TEXT NOT NULL,
  ip_address TEXT,
  os_info TEXT,
  agent_version TEXT,
  token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending',
  last_heartbeat_at TIMESTAMP WITH TIME ZONE,
  tags JSONB NOT NULL DEFAULT '{}'::jsonb,
  environment TEXT NOT NULL DEFAULT 'prod',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vm_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agents" ON public.vm_agents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own agents" ON public.vm_agents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own agents" ON public.vm_agents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own agents" ON public.vm_agents FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access vm_agents" ON public.vm_agents FOR ALL USING (((current_setting('request.jwt.claims'::text, true))::json ->> 'role') = 'service_role');

-- Table: VM metrics (time-series data from agents)
CREATE TABLE public.vm_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.vm_agents(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'system',
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  unit TEXT,
  labels JSONB NOT NULL DEFAULT '{}'::jsonb,
  collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vm_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vm_metrics" ON public.vm_metrics FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.vm_agents WHERE vm_agents.id = vm_metrics.agent_id AND vm_agents.user_id = auth.uid())
);
CREATE POLICY "Service role full access vm_metrics" ON public.vm_metrics FOR ALL USING (((current_setting('request.jwt.claims'::text, true))::json ->> 'role') = 'service_role');

-- Index for efficient time-series queries
CREATE INDEX idx_vm_metrics_agent_time ON public.vm_metrics (agent_id, collected_at DESC);
CREATE INDEX idx_vm_metrics_category ON public.vm_metrics (agent_id, category, metric_name);

-- Table: VM alerts
CREATE TABLE public.vm_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.vm_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  condition TEXT NOT NULL,
  threshold NUMERIC NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vm_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own vm_alerts" ON public.vm_alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role full access vm_alerts" ON public.vm_alerts FOR ALL USING (((current_setting('request.jwt.claims'::text, true))::json ->> 'role') = 'service_role');

-- Trigger for updated_at on vm_agents
CREATE TRIGGER update_vm_agents_updated_at
  BEFORE UPDATE ON public.vm_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
