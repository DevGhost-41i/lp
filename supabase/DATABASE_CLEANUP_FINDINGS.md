# CRITICAL FINDINGS - Worker Uses These Tables!

## ⚠️ DO NOT DROP - ACTIVELY USED BY WORKER

After comprehensive code search, found the following tables **ARE BEING USED** and MUST BE KEPT:

### Ad Analyzer Module (`modules/ad-analyzer/db.js`)
- ✅ **KEEP**: `ad_density_history` (line 34, 317-321, 343-348, 497-500, 588-593)
- ✅ **KEEP**: `auto_refresh_tracking` (line 70, 376-380, 402-405, 502-505, 595-599)
- ✅ **KEEP**: `visibility_compliance` (line 106, 602-606)
- ✅ **KEEP**: `pattern_correlations` (line 144, 445-449, 468-472, 507-510, 609-613)
- ✅ **KEEP**: `ad_element_batch` (line 187, 616-620)
- ✅ **KEEP**: `video_detection_history` (line 296)

### Crawler Module (`modules/crawler/db.js`)
- ✅ **KEEP**: `crawler_har_files` (lines 124, 494)
- ✅ **KEEP**: `crawler_dom_snapshots` (lines 180, 495)
- ✅ **KEEP**: `crawler_screenshots` (lines 364, 498)
- ✅ **KEEP**: `crawler_ad_elements` (line 306) - **NOTE**: Different from `ad_element_batch`!

### Policy Checker Module (`modules/policy-checker/db.js`)
- ✅ **KEEP**: `policy_violations` (lines 112, 186, 257, 384, 442)
- ✅ **KEEP**: `compliance_history` (lines 333, 442)

### Scorer Module (`modules/scoerer/db.js`, `benchmarks.js`, `trend-analyzer.js`)
- ✅ **KEEP**: `score_benchmarks` (line 270 in trend-analyzer.js, line 93 & 131 in benchmarks.js)
- ✅ **KEEP**: `scorer_methodology_log` (line 131)
- ✅ **KEEP**: `scorer_version_history` (lines 160, 179, 213, 584, 706)
- ✅ **KEEP**: `scorer_risk_deltas` (line 249, 614, 713)
- ✅ **KEEP**: `scorer_trend_analysis` (line 295, 644, 720)
- ✅ **KEEP**: `scorer_benchmark_comparisons` (line 336, 674, 727)
- ✅ **KEEP**: `scorer_risk_history` (line 88, 483, 513)

### Alert & Trend Modules
- ✅ **KEEP**: `publisher_trend_alerts` (used in trend-reporter, retention-manager, cross-module-analyzer, alert-engine)

### Audit Failures
- ✅ **KEEP**: `audit_failures` (used in webhook-handler.js lines 103, 353)

## ❌ SAFE TO DROP - NOT REFERENCED

These tables have NO references in worker code:

### Ad Analyzer (Can Drop - 7 tables)
-ad_behavior_history
- ad_density_metrics
- auto_refresh_detection
- network_identifiers
- network_idle_metrics

### AI Analysis (Can Drop - 17 tables)  
- ai_analysis_cache
- ai_analysis_errors
- ai_analysis_history
- ai_analysis_metrics
- ai_assistance_error_logs
- ai_assistance_history
- ai_assistance_interpretation_history
- ai_assistance_prompt_templates
- ai_assistance_quality_metrics
- ai_assistance_recommendation_trends
- ai_assistance_results
- ai_budget_tracker
- ai_error_logs
- ai_interpretation_fields
- ai_model_analysis
- ai_performance_metrics
- ai_prompt_templates
- ai_response_metadata
- ai_response_quality_metrics

### Scorer (Can Drop - 3 tables)
- score_breakdowns
- scorer_component_breakdown
- scorer_explanation_data
- scorer_pattern_drift
- scorer_results
- risk_models

### Crawler (Can Drop - 6 tables)
- crawler_extracted_elements
- crawler_historical_comparison
- crawler_metrics
- crawler_network_data
- crawler_results
- crawler_session_history

### Content (Can Drop - 4 tables)
- content_churn_history
- content_fingerprints
- content_flags
- content_hashes

### Policy (Can Drop - 6 tables)
- audit_checks
- compliance_checks
- compliance_reports
- policy_checker_history
- jurisdiction_detections
- domains_detected
- pattern_detection_results
- publisher_violation_patterns

### Technical (Can Drop - 4 tables)
- technical_component_details
- technical_health_history
- technical_health_results
- technical_recommendations

### Alerts (Can Drop - 4 tables)
- admin_alerts
- alert_definitions
- alert_notifications
- triggered_alerts

### Audit (Can Drop - 3 tables)
- audit_behavioral_metrics
- behavioral_history_snapshots
- site_audit_history

### Publisher (Can Drop - 4 tables)
- publisher_metric_aggregations
- publisher_module_snapshots
- publisher_risk_profiles
- publisher_trend_reports

### Misc (Can Drop - 11 tables)
- data_retention_policies
- data_retention_policy_logs
- deletion_backups
- gam_job_logs
- mcm_payment_errors
- mfa_authentication_metrics
- mfa_monitoring_events
- mfa_probability_cache
- mfa_risk_indicators
- mfa_security_events
- report_historical
- retention_execution_log
- user_creation_logs
- worker_status

## Revised Summary

**Before**: Planned to drop 110 tables  
**After Code Analysis**: Can SAFELY drop ~75 tables, MUST KEEP ~35 tables

The worker code actively uses more tables than expected for historical tracking and analysis features.
