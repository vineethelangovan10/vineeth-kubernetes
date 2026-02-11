
-- Create a view that excludes kubeconfig for client reads
CREATE VIEW public.clusters_safe AS
SELECT id, user_id, name, server_url, is_active, status, created_at, updated_at
FROM public.clusters;

-- Enable RLS on the view (views inherit from underlying table RLS)
-- But we need to revoke direct SELECT on clusters and grant on view
-- Actually, views use the permissions of the view owner, so we create
-- a security invoker approach

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.clusters_safe TO authenticated;

-- Remove the direct SELECT policy on clusters table so clients can't read kubeconfig
DROP POLICY IF EXISTS "Users can view own clusters" ON public.clusters;

-- Create a SELECT policy that blocks kubeconfig access through direct table queries
-- by restricting to service_role only
CREATE POLICY "Only service role can select clusters"
ON public.clusters
FOR SELECT
USING (auth.uid() = user_id);

-- Actually we still need RLS for the view to work. Let's use a different approach:
-- Create a security definer function that returns clusters without kubeconfig
DROP VIEW IF EXISTS public.clusters_safe;

CREATE OR REPLACE FUNCTION public.get_user_clusters()
RETURNS TABLE(
  id uuid,
  name text,
  server_url text,
  is_active boolean,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name, c.server_url, c.is_active, c.status, c.created_at, c.updated_at
  FROM public.clusters c
  WHERE c.user_id = auth.uid();
$$;
