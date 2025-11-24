-- COMPREHENSIVE FIX: All Missing Worker Database Columns
-- Apply this migration to fix ALL schema errors at once

-- ============================================
-- ai_interpretation_history fixes
-- ============================================
ALTER TABLE ai_interpretation_history 
ADD COLUMN IF NOT EXISTS changes_detected JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS current_recommendations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS current_risk_level TEXT DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS previous_recommendations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS previous_risk_level TEXT DEFAULT 'unknown';

-- ============================================
-- content_analysis_results fixes
-- ============================================
ALTER TABLE content_analysis_results 
ADD COLUMN IF NOT EXISTS analysis_timestamp TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS clickbait_metrics JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS ai_metrics JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS clickbait_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS entropy_metrics JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS entropy_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS flag_status TEXT DEFAULT 'clean',
ADD COLUMN IF NOT EXISTS readability_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS readability_metrics JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS ai_likelihood_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS similarity_hash TEXT,
ADD COLUMN IF NOT EXISTS freshness_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS freshness_metrics JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS risk_assessment JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS analysis_data JSONB DEFAULT '{}'::jsonb;

-- ============================================
-- crawler_sessions fixes
-- ============================================
ALTER TABLE crawler_sessions 
ADD COLUMN IF NOT EXISTS mutations_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS screenshot_path TEXT,
ADD COLUMN IF NOT EXISTS iframes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_requests INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS viewport_height INTEGER DEFAULT 1080,
ADD COLUMN IF NOT EXISTS viewport_width INTEGER DEFAULT 1920;

-- ============================================
-- ai_analysis_results fixes
-- ============================================
ALTER TABLE ai_analysis_results 
ADD COLUMN IF NOT EXISTS model_used TEXT,
ADD COLUMN IF NOT EXISTS token_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS categorization JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS risk_categorization JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS risk_level TEXT,
ADD COLUMN IF NOT EXISTS recommendations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS action_items JSONB DEFAULT '[]'::jsonb;

-- ============================================
-- Create missing function (drop existing first)
-- ============================================
DROP FUNCTION IF EXISTS calculate_publisher_risk_trajectory(INTEGER, UUID);

CREATE OR REPLACE FUNCTION calculate_publisher_risk_trajectory(
    days_back INTEGER DEFAULT 30,
    p_publisher_id UUID DEFAULT NULL
)
RETURNS TABLE (
    publisher_id UUID,
    risk_score NUMERIC,
    mfa_probability NUMERIC,
    trend_direction TEXT,
    date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sa.publisher_id,
        COALESCE(sa.risk_score, 0) as risk_score,
        COALESCE(sa.mfa_probability, 0) as mfa_probability,
        'stable'::TEXT as trend_direction,
        sa.created_at::DATE as date
    FROM site_audits sa
    WHERE sa.created_at >= NOW() - (days_back || ' days')::INTERVAL
    AND (p_publisher_id IS NULL OR sa.publisher_id = p_publisher_id)
    ORDER BY sa.created_at DESC;
END;
$$ LANGUAGE plpgsql;
