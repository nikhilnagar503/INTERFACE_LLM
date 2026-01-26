-- Fix profile RLS policies to allow profile creation during signup
-- Run this in Supabase SQL Editor

-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "Profiles: insert self" on profiles;

-- Add a more permissive insert policy that allows service role to create profiles
CREATE POLICY "Profiles: allow insert" on profiles
  FOR INSERT WITH CHECK (true);

-- Keep the select/update/delete policies restrictive
-- (they already exist as "Profiles: owner access")
