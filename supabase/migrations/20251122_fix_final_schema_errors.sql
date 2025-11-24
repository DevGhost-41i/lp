-- Fix Final Worker Database Schema Errors
-- This migration adds the last missing columns identified in worker logs

-- Add missing column to crawler_sessions
ALTER TABLE crawler_sessions 
ADD COLUMN IF NOT EXISTS screenshot_path TEXT;

-- Add missing column to content_analysis_results  
ALTER TABLE content_analysis_results 
ADD COLUMN IF NOT EXISTS clickbait_metrics JSONB DEFAULT '{}'::jsonb;

-- Add missing column to ai_interpretation_history
ALTER TABLE ai_interpretation_history 
ADD COLUMN IF NOT EXISTS current_recommendations JSONB DEFAULT '[]'::jsonb;
