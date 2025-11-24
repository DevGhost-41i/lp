-- =====================================================
-- MFA BUSTER DATA INVESTIGATION QUERIES
-- Run these in Supabase Dashboard SQL Editor
-- =====================================================

-- QUERY 1: Check recent audits and their status values
-- This will show what status values actually exist
SELECT 
  id,
  publisher_id, 
  status,
  risk_score,
  mfa_probability,
  risk_level,
  crawler_data IS NOT NULL as has_crawler,
  content_analysis IS NOT NULL as has_content,
  ad_analysis IS NOT NULL as has_ad,
  policy_check IS NOT NULL as has_policy,
  technical_check IS NOT NULL as has_technical,
  ai_report IS NOT NULL as has_ai,
  created_at,
  updated_at
FROM site_audits
ORDER BY updated_at DESC
LIMIT 10;

-- =====================================================

-- QUERY 2: Count audits by status
-- This will reveal which status values are being used
SELECT 
  status,
  COUNT(*) as count
FROM site_audits
GROUP BY status
ORDER BY count DESC;

-- =====================================================

-- QUERY 3: Check the specific publisher from worker logs
-- Publisher: digibliss.in (3be82b25-af7c-4e10-8e70-4ee475d21ea3)
SELECT 
  id,
  status,
  risk_score,
  mfa_probability,
  risk_level,
  crawler_data::text as crawler_preview,
  content_analysis::text as content_preview,
  ad_analysis::text as ad_preview,
  created_at,
  updated_at
FROM site_audits
WHERE publisher_id = '3be82b25-af7c-4e10-8e70-4ee475d21ea3'
ORDER BY updated_at DESC
LIMIT 3;

-- =====================================================

-- QUERY 4: Check module data completeness
-- Shows which modules have data across all audits
SELECT 
  COUNT(*) as total_audits,
  SUM(CASE WHEN crawler_data IS NOT NULL THEN 1 ELSE 0 END) as has_crawler,
  SUM(CASE WHEN content_analysis IS NOT NULL THEN 1 ELSE 0 END) as has_content,
  SUM(CASE WHEN ad_analysis IS NOT NULL THEN 1 ELSE 0 END) as has_ad,
  SUM(CASE WHEN policy_check IS NOT NULL THEN 1 ELSE 0 END) as has_policy,
  SUM(CASE WHEN technical_check IS NOT NULL THEN 1 ELSE 0 END) as has_technical,
  SUM(CASE WHEN ai_report IS NOT NULL THEN 1 ELSE 0 END) as has_ai
FROM site_audits;

-- =====================================================

-- QUERY 5: Check risk score range
-- Verify if scores are 0-1 or 0-100
SELECT 
  MIN(risk_score) as min_score,
  MAX(risk_score) as max_score,
  AVG(risk_score) as avg_score,
  COUNT(*) as total_with_scores
FROM site_audits
WHERE risk_score IS NOT NULL;

-- =====================================================

-- QUERY 6: Sample one complete audit record
-- Get full details of the most recent audit
SELECT *
FROM site_audits
ORDER BY updated_at DESC
LIMIT 1;
