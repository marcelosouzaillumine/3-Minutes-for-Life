-- Migration: location_grants
-- Purpose: Grant SELECT access to location tables for anon and authenticated users
-- so they can load state and city dropdowns during sign up and profile editing.

GRANT SELECT ON public.countries TO anon;
GRANT SELECT ON public.states TO anon;
GRANT SELECT ON public.cities TO anon;

GRANT SELECT ON public.countries TO authenticated;
GRANT SELECT ON public.states TO authenticated;
GRANT SELECT ON public.cities TO authenticated;

-- Ensure RLS is enabled to prevent accidental unbounded operations in the future
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Allow read-only access to everyone
CREATE POLICY "Locations are publicly viewable"
    ON public.countries FOR SELECT
    USING (true);

CREATE POLICY "States are publicly viewable"
    ON public.states FOR SELECT
    USING (true);

CREATE POLICY "Cities are publicly viewable"
    ON public.cities FOR SELECT
    USING (true);
