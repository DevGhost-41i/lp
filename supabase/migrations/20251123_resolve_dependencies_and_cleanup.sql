-- Full cleanup in correct dependency order

DROP TABLE IF EXISTS freshness_tracking CASCADE;
DROP TABLE IF EXISTS readability_metrics CASCADE;
DROP TABLE IF EXISTS clickbait_analysis CASCADE;
DROP TABLE IF EXISTS simhash_clusters CASCADE;

DROP TABLE IF EXISTS linguistic_fingerprints CASCADE;

DROP TABLE IF EXISTS audit_job_queue CASCADE;
DROP TABLE IF EXISTS audit_results CASCADE;
DROP TABLE IF EXISTS ad_analysis_results CASCADE;
DROP TABLE IF EXISTS mfa_risk_scores CASCADE;
DROP TABLE IF EXISTS publisher_risk_trends CASCADE;
DROP TABLE IF EXISTS similarity_fingerprints CASCADE;
DROP TABLE IF EXISTS content_risk_trends CASCADE;
DROP TABLE IF EXISTS restricted_keyword_matches CASCADE;
DROP TABLE IF EXISTS category_detections CASCADE;
DROP TABLE IF EXISTS publisher_schedules CASCADE;
DROP TABLE IF EXISTS publisher_sites CASCADE;

ALTER TABLE content_analysis_results ADD COLUMN IF NOT EXISTS simhash TEXT;
ALTER TABLE content_analysis_results ADD COLUMN IF NOT EXISTS similarity_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_content_analysis_simhash
ON content_analysis_results(simhash);
