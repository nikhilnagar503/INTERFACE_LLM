-- Fix: Make user_id nullable in prompts table for system prompts
-- Run this BEFORE seed_prompts.sql if the table already exists

-- Remove the NOT NULL constraint from user_id
ALTER TABLE prompts ALTER COLUMN user_id DROP NOT NULL;

-- Verify the change
SELECT 
  column_name, 
  is_nullable,
  data_type
FROM information_schema.columns 
WHERE table_name = 'prompts' AND column_name = 'user_id';
