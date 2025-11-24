-- Fix fk_fingerprint violation and ensure schema compatibility
-- This migration drops the problematic foreign key constraint and ensures all columns used by the worker exist

-- Drop fk_fingerprint constraint from content_analysis_results if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_fingerprint' AND table_name = 'content_analysis_results'
  ) THEN
    ALTER TABLE content_analysis_results DROP CONSTRAINT fk_fingerprint;
  END IF;
END $$;

-- Drop fk_fingerprint constraint from content_fingerprints if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_fingerprint' AND table_name = 'content_fingerprints'
  ) THEN
    ALTER TABLE content_fingerprints DROP CONSTRAINT fk_fingerprint;
  END IF;
END $$;

-- Ensure simhash column exists in content_analysis_results
ALTER TABLE content_analysis_results 
ADD COLUMN IF NOT EXISTS simhash TEXT;

-- Ensure similarity_hash column exists in content_analysis_results (used by worker)
ALTER TABLE content_analysis_results 
ADD COLUMN IF NOT EXISTS similarity_hash TEXT;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
