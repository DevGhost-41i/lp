-- Add missing columns to ai_analysis_results
ALTER TABLE ai_analysis_results 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add missing columns to crawler_sessions
ALTER TABLE crawler_sessions 
ADD COLUMN IF NOT EXISTS ad_elements_count INTEGER DEFAULT 0;

-- Add missing columns to content_analysis_results
ALTER TABLE content_analysis_results 
ADD COLUMN IF NOT EXISTS ai_likelihood_score FLOAT;

-- Create get_previous_audit_id function
CREATE OR REPLACE FUNCTION get_previous_audit_id(current_audit_id UUID)
RETURNS UUID AS $$
DECLARE
    current_publisher_id UUID;
    current_created_at TIMESTAMP WITH TIME ZONE;
    previous_audit_id UUID;
BEGIN
    -- Get publisher_id and created_at for the current audit
    SELECT publisher_id, created_at INTO current_publisher_id, current_created_at
    FROM site_audits
    WHERE id = current_audit_id;

    -- Find the most recent previous audit for the same publisher
    SELECT id INTO previous_audit_id
    FROM site_audits
    WHERE publisher_id = current_publisher_id
      AND created_at < current_created_at
    ORDER BY created_at DESC
    LIMIT 1;

    RETURN previous_audit_id;
END;
$$ LANGUAGE plpgsql;
