
-- Create monitors table
CREATE TABLE public.monitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  environment TEXT NOT NULL DEFAULT 'prod',
  owner TEXT,
  tags JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Monitoring Target
  monitor_type TEXT NOT NULL DEFAULT 'https',
  endpoint TEXT NOT NULL,
  port INTEGER,
  request_path TEXT DEFAULT '/health',
  http_method TEXT DEFAULT 'GET',
  custom_headers JSONB DEFAULT '{}'::jsonb,
  
  -- Health Check Config
  check_interval_seconds INTEGER NOT NULL DEFAULT 60,
  timeout_seconds INTEGER NOT NULL DEFAULT 10,
  retry_count INTEGER NOT NULL DEFAULT 3,
  expected_status_code INTEGER DEFAULT 200,
  expected_body_match TEXT,
  
  -- Authentication
  auth_type TEXT DEFAULT 'none',
  auth_credentials TEXT,
  
  -- Availability Rules
  failure_threshold INTEGER NOT NULL DEFAULT 3,
  recovery_threshold INTEGER NOT NULL DEFAULT 2,
  maintenance_start TIMESTAMP WITH TIME ZONE,
  maintenance_end TIMESTAMP WITH TIME ZONE,
  
  -- Alerting
  alert_channels JSONB DEFAULT '[]'::jsonb,
  alert_severity TEXT DEFAULT 'critical',
  notify_on TEXT[] DEFAULT '{DOWN,RECOVERED}'::text[],
  
  -- SLA & Reporting
  sla_target NUMERIC(5,2) DEFAULT 99.9,
  business_hours TEXT DEFAULT '24x7',
  monitoring_region TEXT DEFAULT 'global',
  latency_warning_ms INTEGER DEFAULT 500,
  latency_critical_ms INTEGER DEFAULT 2000,
  
  -- Security
  tls_check_enabled BOOLEAN DEFAULT true,
  tls_expiry_alert_days INTEGER DEFAULT 15,
  
  -- Status
  current_status TEXT NOT NULL DEFAULT 'unknown',
  last_checked_at TIMESTAMP WITH TIME ZONE,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  consecutive_successes INTEGER NOT NULL DEFAULT 0,
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create monitor checks history table
CREATE TABLE public.monitor_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  monitor_id UUID NOT NULL REFERENCES public.monitors(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  response_time_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  tls_expiry_days INTEGER,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitor_checks ENABLE ROW LEVEL SECURITY;

-- Monitors RLS policies
CREATE POLICY "Users can view own monitors" ON public.monitors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own monitors" ON public.monitors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own monitors" ON public.monitors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own monitors" ON public.monitors FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access monitors" ON public.monitors FOR ALL USING (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'service_role'::text);

-- Monitor checks RLS policies
CREATE POLICY "Users can view own monitor checks" ON public.monitor_checks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.monitors WHERE monitors.id = monitor_checks.monitor_id AND monitors.user_id = auth.uid())
);
CREATE POLICY "Service role full access monitor_checks" ON public.monitor_checks FOR ALL USING (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'service_role'::text);

-- Index for fast lookups
CREATE INDEX idx_monitor_checks_monitor_id ON public.monitor_checks(monitor_id, checked_at DESC);
CREATE INDEX idx_monitors_user_id ON public.monitors(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_monitors_updated_at BEFORE UPDATE ON public.monitors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
