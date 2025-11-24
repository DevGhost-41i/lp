-- Fix Content Analysis Schema Cache
-- This migration ensures all required columns exist and forces a schema cache reload

-- Add page_url if it doesn't exist
ALTER TABLE content_analysis_results 
ADD COLUMN IF NOT EXISTS page_url TEXT;

-- Add clickbait_metrics if it doesn't exist
ALTER TABLE content_analysis_results 
ADD COLUMN IF NOT EXISTS clickbait_metrics JSONB DEFAULT '{}'::jsonb;

-- Force schema cache refresh by notifying PostgREST
NOTIFY pgrst, 'reload config';
