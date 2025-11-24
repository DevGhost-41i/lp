-- =====================================================
-- VERIFY ALL AUDIT FIELDS ARE SAVED
-- Run this in Supabase Dashboard SQL Editor
-- =====================================================

-- Check if risk_score, mfa_probability, risk_level, and ai_report exist
SELECT 
  id,
  site_name,
  status,
  risk_score,
  mfa_probability,  
  risk_level,
  (ai_report IS NOT NULL) as has_ai_report,
  (ai_report->>'llmResponse') IS NOT NULL as has_ai_response,
  (ai_report->>'interpretation') IS NOT NULL as has_ai_interpretation,
  length(ai_report::text) as ai_report_size,
  created_at,
  updated_at
FROM site_audits
WHERE id = '93e4b4b8-a2d8-4c25-9d35-2cb33b5d71a6';

-- =====================================================
-- If the above returns NULL for risk_score/mfa_probability/risk_level:
-- There is a worker save issue
--
-- If they are populated but UI doesn't show them:
-- There is an RLS policy or frontend query issue
-- =====================================================

-- Check all recent completed audits
SELECT 
  id,
  site_name,
  status,
  risk_score,
  mfa_probability,
  risk_level,
  (ai_report IS NOT NULL) as has_ai,
  updated_at
FROM site_audits
WHERE status = 'completed'
ORDER BY updated_at DESC
LIMIT 10;
