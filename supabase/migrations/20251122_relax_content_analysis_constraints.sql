-- Relax constraints on content_analysis_results
ALTER TABLE IF EXISTS content_analysis_results 
ALTER COLUMN audit_id DROP NOT NULL;

ALTER TABLE IF EXISTS content_analysis_results 
ALTER COLUMN content_hash DROP NOT NULL;

-- Relax constraints on crawler_sessions
ALTER TABLE IF EXISTS crawler_sessions 
ALTER COLUMN site_url DROP NOT NULL;

-- Relax constraints on ad-analyzer tables
ALTER TABLE IF EXISTS ad_density_history 
ALTER COLUMN site_audit_id DROP NOT NULL;

ALTER TABLE IF EXISTS auto_refresh_tracking 
ALTER COLUMN site_audit_id DROP NOT NULL;

ALTER TABLE IF EXISTS visibility_compliance 
ALTER COLUMN site_audit_id DROP NOT NULL;

ALTER TABLE IF EXISTS pattern_correlations 
ALTER COLUMN site_audit_id DROP NOT NULL;

ALTER TABLE IF EXISTS ad_element_batch 
ALTER COLUMN site_audit_id DROP NOT NULL;

-- Relax constraints on ai-assistance tables
ALTER TABLE IF EXISTS ai_analysis_results 
ALTER COLUMN site_audit_id DROP NOT NULL;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
