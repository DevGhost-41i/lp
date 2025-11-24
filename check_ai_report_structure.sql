-- Check actual AI report structure in database
SELECT 
  id,
  site_name,
  status,
  -- Check if ai_report exists and its structure
  (ai_report IS NOT NULL) as has_ai_report,
  (ai_report->>'llmResponse') IS NOT NULL as has_llm_response,
  (ai_report->>'interpretation') IS NOT NULL as has_interpretation_string,
  (ai_report->'interpretation') IS NOT NULL as has_interpretation_object,
  (ai_report->'interpretation'->>'summary') as interpretation_summary,
  substring(ai_report->>'llmResponse', 1, 100) as llm_response_preview,
  -- Show full structure
  jsonb_typeof(ai_report) as ai_report_type,
  jsonb_pretty(ai_report) as ai_report_full
FROM site_audits
WHERE status = 'completed'
  AND ai_report IS NOT NULL
ORDER BY updated_at DESC
LIMIT 1;
