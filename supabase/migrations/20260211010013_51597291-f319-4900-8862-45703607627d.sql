
-- Remove the existing SELECT policy that allows users to read kubeconfig directly
DROP POLICY IF EXISTS "Only service role can select clusters" ON public.clusters;

-- Create a restrictive policy: only service_role can SELECT from clusters table
-- Users must use get_user_clusters() RPC which excludes kubeconfig
CREATE POLICY "Service role only select clusters"
ON public.clusters
FOR SELECT
USING ((current_setting('request.jwt.claims', true)::json->>'role') = 'service_role');
