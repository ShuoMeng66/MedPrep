-- Migration: restrict shares INSERT to authenticated users + cleanup function
-- Run in Supabase SQL Editor if shares_insert_public already exists

DROP POLICY IF EXISTS "shares_insert_public" ON public.shares;

CREATE POLICY "shares_insert_authenticated" ON public.shares
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION public.cleanup_expired_shares()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.shares WHERE created_at < now() - interval '7 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
