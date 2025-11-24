-- Fix Worker Database Schema Errors
-- This migration adds missing columns and functions identified in worker.logs

-- Add missing column to ai_analysis_results
ALTER TABLE ai_analysis_results 
ADD COLUMN IF NOT EXISTS model_used TEXT;

-- Add missing column to content_analysis_results
ALTER TABLE content_analysis_results 
ADD COLUMN IF NOT EXISTS ai_metrics JSONB DEFAULT '{}'::jsonb;

-- Add missing column to crawler_sessions
ALTER TABLE crawler_sessions 
ADD COLUMN IF NOT EXISTS iframes_count INTEGER DEFAULT 0;

-- Create missing function for risk trajectory calculation
CREATE OR REPLACE FUNCTION public.calculate_publisher_risk_trajectory(
    days_back INTEGER DEFAULT 30,
    p_publisher_id UUID DEFAULT NULL
)
RETURNS TABLE (
    publisher_id UUID,
    date DATE,
    risk_score NUMERIC,
    mfa_probability NUMERIC,
    trend_direction TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sa.publisher_id,
        sa.created_at::DATE as date,
        sa.risk_score,
        sa.mfa_probability,
        CASE 
            WHEN LAG(sa.risk_score) OVER (PARTITION BY sa.publisher_id ORDER BY sa.created_at) < sa.risk_score THEN 'increasing'
            WHEN LAG(sa.risk_score) OVER (PARTITION BY sa.publisher_id ORDER BY sa.created_at) > sa.risk_score THEN 'decreasing'
            ELSE 'stable'
        END as trend_direction
    FROM site_audits sa
    WHERE sa.created_at >= NOW() - (days_back || ' days')::INTERVAL
        AND (p_publisher_id IS NULL OR sa.publisher_id = p_publisher_id)
        AND sa.status = 'completed'
    ORDER BY sa.publisher_id, sa.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;
