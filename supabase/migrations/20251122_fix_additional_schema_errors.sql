-- Fix Additional Worker Database Schema Errors (Round 5)
-- This migration adds more missing columns identified in latest worker logs

-- Add missing column to ai_interpretation_history
ALTER TABLE ai_interpretation_history 
ADD COLUMN IF NOT EXISTS current_risk_level TEXT DEFAULT 'unknown';

-- Add missing column to crawler_sessions  
ALTER TABLE crawler_sessions 
ADD COLUMN IF NOT EXISTS total_requests INTEGER DEFAULT 0;

-- Add missing column to content_analysis_results
ALTER TABLE content_analysis_results 
ADD COLUMN IF NOT EXISTS clickbait_score NUMERIC DEFAULT 0;
