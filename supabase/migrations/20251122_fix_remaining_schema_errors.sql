-- Fix Remaining Worker Database Schema Errors
-- This migration adds the additional missing columns identified in worker logs

-- Add missing column to ai_interpretation_history
ALTER TABLE ai_interpretation_history 
ADD COLUMN IF NOT EXISTS changes_detected JSONB DEFAULT '{}'::jsonb;

-- Add missing column to content_analysis_results
ALTER TABLE content_analysis_results 
ADD COLUMN IF NOT EXISTS analysis_timestamp TIMESTAMPTZ DEFAULT NOW();

-- Add missing column to crawler_sessions
ALTER TABLE crawler_sessions 
ADD COLUMN IF NOT EXISTS mutations_count INTEGER DEFAULT 0;
