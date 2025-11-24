# Database Cleanup Plan - Remove Empty Tables

## Analysis of Current Database

**Total Tables**: 130+
**Tables with Data**: ~20
**Empty Tables**: ~110

## Critical Tables (KEEP - Have Data)

### Core Audit Tables
- `site_audits` ✅ (369 rows) - **PRIMARY TABLE**
- `audit_queue` ✅ (281 rows)
- `audit_logs` ✅ (6,315 rows)
- `db_operation_logs` ✅ (2,333 rows)

### Publisher & User Management
- `publishers` ✅ (4 rows)
- `app_users` ✅ (3 rows)
- `invitations` ✅ (5 rows)
- `approval_logs` ✅ (13 rows)

### Module Results Tables (Currently Used)
- `content_analysis_results` ✅ (108 rows)
- `policy_checker_results` ✅ (114 rows)
- `policy_compliance_results` ✅ (18 rows)
- `technical_check_results` ✅ (204 rows)
- `technical_check_history` ✅ (192 rows)
- `crawler_sessions` ✅ (114 rows)
- `crawler_page_metrics` ✅ (114 rows)
- `ai_analysis_results` ✅ (487 rows)
- `ai_interpretation_history` ✅ (207 rows)

### GAM & Reporting
- `reports_dimensional` ✅ (3,035 rows)
- `reports_daily` ✅ (131 rows)
- `report_fetch_logs` ✅ (360 rows)

### Other Active Tables
- `alerts` ✅ (306 rows)
- `email_logs` ✅ (128 rows)
- `exchange_rates` ✅ (11 rows)
- `ad_density_history` ✅ (186 rows)
- `module_comparison_results` ✅ (360 rows)
- `mfa_composite_scores` ✅ (4 rows)
- `confidence_score_weights` ✅ (3 rows)
- `mcm_parents` ✅ (1 row)
- `cron_execution_logs` ✅ (1 row)

## Empty Tables to DELETE

### Ad Analyzer Empty Tables (13 tables)
```sql
DROP TABLE IF EXISTS ad_behavior_history CASCADE;
DROP TABLE IF EXISTS ad_density_metrics CASCADE;
DROP TABLE IF EXISTS ad_element_batch CASCADE;
DROP TABLE IF EXISTS ad_element_batch_insert CASCADE;
DROP TABLE IF EXISTS ad_elements CASCADE;
DROP TABLE IF EXISTS auto_refresh_detection CASCADE;
DROP TABLE IF EXISTS auto_refresh_tracking CASCADE;
DROP TABLE IF EXISTS crawler_ad_elements CASCADE;
DROP TABLE IF EXISTS pattern_correlations CASCADE;
DROP TABLE IF EXISTS visibility_compliance CASCADE;
DROP TABLE IF EXISTS video_detection_history CASCADE;
DROP TABLE IF EXISTS network_identifiers CASCADE;
DROP TABLE IF EXISTS network_idle_metrics CASCADE;
```

### AI Analysis Empty Tables (17 tables)
```sql
DROP TABLE IF EXISTS ai_analysis_cache CASCADE;
DROP TABLE IF EXISTS ai_analysis_errors CASCADE;
DROP TABLE IF EXISTS ai_analysis_history CASCADE;
DROP TABLE IF EXISTS ai_analysis_metrics CASCADE;
DROP TABLE IF EXISTS ai_assistance_error_logs CASCADE;
DROP TABLE IF EXISTS ai_assistance_history CASCADE;
DROP TABLE IF EXISTS ai_assistance_interpretation_history CASCADE;
DROP TABLE IF EXISTS ai_assistance_prompt_templates CASCADE;
DROP TABLE IF EXISTS ai_assistance_quality_metrics CASCADE;
DROP TABLE IF EXISTS ai_assistance_recommendation_trends CASCADE;
DROP TABLE IF EXISTS ai_assistance_results CASCADE;
DROP TABLE IF EXISTS ai_budget_tracker CASCADE;
DROP TABLE IF EXISTS ai_error_logs CASCADE;
DROP TABLE IF EXISTS ai_interpretation_fields CASCADE;
DROP TABLE IF EXISTS ai_model_analysis CASCADE;
DROP TABLE IF EXISTS ai_performance_metrics CASCADE;
DROP TABLE IF EXISTS ai_prompt_templates CASCADE;
DROP TABLE IF EXISTS ai_response_metadata CASCADE;
DROP TABLE IF EXISTS ai_response_quality_metrics CASCADE;
```

### Scorer Empty Tables (15 tables)
```sql
-- Already dropped: mfa_risk_scores, publisher_risk_trends
DROP TABLE IF EXISTS score_benchmarks CASCADE;
DROP TABLE IF EXISTS score_breakdowns CASCADE;
DROP TABLE IF EXISTS scorer_benchmark_comparison CASCADE;
DROP TABLE IF EXISTS scorer_benchmark_comparisons CASCADE;
DROP TABLE IF EXISTS scorer_component_breakdown CASCADE;
DROP TABLE IF EXISTS scorer_explanation_data CASCADE;
DROP TABLE IF EXISTS scorer_history CASCADE;
DROP TABLE IF EXISTS scorer_methodology_log CASCADE;
DROP TABLE IF EXISTS scorer_pattern_drift CASCADE;
DROP TABLE IF EXISTS scorer_results CASCADE;
DROP TABLE IF EXISTS scorer_risk_deltas CASCADE;
DROP TABLE IF EXISTS scorer_risk_history CASCADE;
DROP TABLE IF EXISTS scorer_trend_analysis CASCADE;
DROP TABLE IF EXISTS scorer_version_history CASCADE;
DROP TABLE IF EXISTS risk_models CASCADE;
```

### Crawler Empty Tables (7 tables)
```sql
DROP TABLE IF EXISTS crawler_dom_snapshots CASCADE;
DROP TABLE IF EXISTS crawler_extracted_elements CASCADE;
DROP TABLE IF EXISTS crawler_har_files CASCADE;
DROP TABLE IF EXISTS crawler_historical_comparison CASCADE;
DROP TABLE IF EXISTS crawler_metrics CASCADE;
DROP TABLE IF EXISTS crawler_network_data CASCADE;
DROP TABLE IF EXISTS crawler_results CASCADE;
DROP TABLE IF EXISTS crawler_screenshots CASCADE;
DROP TABLE IF EXISTS crawler_session_history CASCADE;
```

### Content Analysis Empty Tables (9 tables)
```sql
DROP TABLE IF EXISTS content_churn_history CASCADE;
DROP TABLE IF EXISTS content_fingerprints CASCADE;
DROP TABLE IF EXISTS content_flags CASCADE;
DROP TABLE IF EXISTS content_hashes CASCADE;
```

### Policy & Compliance Empty Tables (7 tables)
```sql
DROP TABLE IF EXISTS audit_checks CASCADE;
DROP TABLE IF EXISTS compliance_checks CASCADE;
DROP TABLE IF EXISTS compliance_history CASCADE;
DROP TABLE IF EXISTS compliance_reports CASCADE;
DROP TABLE IF EXISTS policy_checker_history CASCADE;
DROP TABLE IF EXISTS policy_violations CASCADE;
DROP TABLE IF EXISTS jurisdiction_detections CASCADE;
DROP TABLE IF EXISTS domains_detected CASCADE;
DROP TABLE IF EXISTS pattern_detection_results CASCADE;
DROP TABLE IF EXISTS publisher_violation_patterns CASCADE;
```

### Technical Checker Empty Tables (5 tables)
```sql
DROP TABLE IF EXISTS technical_component_details CASCADE;
DROP TABLE IF EXISTS technical_health_history CASCADE;
DROP TABLE IF EXISTS technical_health_results CASCADE;
DROP TABLE IF EXISTS technical_recommendations CASCADE;
```

### Alert & Monitoring Empty Tables (5 tables)
```sql
DROP TABLE IF EXISTS admin_alerts CASCADE;
DROP TABLE IF EXISTS alert_definitions CASCADE;
DROP TABLE IF EXISTS alert_notifications CASCADE;
DROP TABLE IF EXISTS triggered_alerts CASCADE;
DROP TABLE IF EXISTS publisher_trend_alerts CASCADE;
```

### Audit Management Empty Tables (6 tables)
```sql
DROP TABLE IF EXISTS audit_behavioral_metrics CASCADE;
DROP TABLE IF EXISTS audit_failures CASCADE;
DROP TABLE IF EXISTS behavioral_history_snapshots CASCADE;
DROP TABLE IF EXISTS site_audit_history CASCADE;
```

### Publisher Tracking Empty Tables (4 tables)
```sql
DROP TABLE IF EXISTS publisher_metric_aggregations CASCADE;
DROP TABLE IF EXISTS publisher_module_snapshots CASCADE;
DROP TABLE IF EXISTS publisher_risk_profiles CASCADE;
DROP TABLE IF EXISTS publisher_trend_reports CASCADE;
```

### Miscellaneous Empty Tables (15 tables)
```sql
DROP TABLE IF EXISTS data_retention_policies CASCADE;
DROP TABLE IF EXISTS data_retention_policy_logs CASCADE;
DROP TABLE IF EXISTS deletion_backups CASCADE;
DROP TABLE IF EXISTS email_logs CASCADE; -- Check if this has data first
DROP TABLE IF EXISTS gam_job_logs CASCADE;
DROP TABLE IF EXISTS mcm_payment_errors CASCADE;
DROP TABLE IF EXISTS mfa_authentication_metrics CASCADE;
DROP TABLE IF EXISTS mfa_monitoring_events CASCADE;
DROP TABLE IF EXISTS mfa_probability_cache CASCADE;
DROP TABLE IF EXISTS mfa_risk_indicators CASCADE;
DROP TABLE IF EXISTS mfa_security_events CASCADE;
DROP TABLE IF EXISTS report_historical CASCADE;
DROP TABLE IF EXISTS retention_execution_log CASCADE;
DROP TABLE IF EXISTS user_creation_logs CASCADE;
DROP TABLE IF EXISTS worker_status CASCADE;
```

## Migration SQL

```sql
-- Database Cleanup Migration
-- Purpose: Remove 110+ empty tables to improve performance and maintainability
-- Date: 2025-11-24

-- ========================================
-- IMPORTANT: Backup database before running
-- ========================================

-- Ad Analyzer Empty Tables (13)
DROP TABLE IF EXISTS ad_behavior_history CASCADE;
DROP TABLE IF EXISTS ad_density_metrics CASCADE;
DROP TABLE IF EXISTS ad_element_batch CASCADE;
DROP TABLE IF EXISTS ad_element_batch_insert CASCADE;
DROP TABLE IF EXISTS ad_elements CASCADE;
DROP TABLE IF EXISTS auto_refresh_detection CASCADE;
DROP TABLE IF EXISTS auto_refresh_tracking CASCADE;
DROP TABLE IF EXISTS crawler_ad_elements CASCADE;
DROP TABLE IF EXISTS pattern_correlations CASCADE;
DROP TABLE IF EXISTS visibility_compliance CASCADE;
DROP TABLE IF EXISTS video_detection_history CASCADE;
DROP TABLE IF EXISTS network_identifiers CASCADE;
DROP TABLE IF EXISTS network_idle_metrics CASCADE;

-- AI Analysis Empty Tables (17)
DROP TABLE IF EXISTS ai_analysis_cache CASCADE;
DROP TABLE IF EXISTS ai_analysis_errors CASCADE;
DROP TABLE IF EXISTS ai_analysis_history CASCADE;
DROP TABLE IF EXISTS ai_analysis_metrics CASCADE;
DROP TABLE IF EXISTS ai_assistance_error_logs CASCADE;
DROP TABLE IF EXISTS ai_assistance_history CASCADE;
DROP TABLE IF EXISTS ai_assistance_interpretation_history CASCADE;
DROP TABLE IF EXISTS ai_assistance_prompt_templates CASCADE;
DROP TABLE IF EXISTS ai_assistance_quality_metrics CASCADE;
DROP TABLE IF EXISTS ai_assistance_recommendation_trends CASCADE;
DROP TABLE IF EXISTS ai_assistance_results CASCADE;
DROP TABLE IF EXISTS ai_budget_tracker CASCADE;
DROP TABLE IF EXISTS ai_error_logs CASCADE;
DROP TABLE IF EXISTS ai_interpretation_fields CASCADE;
DROP TABLE IF EXISTS ai_model_analysis CASCADE;
DROP TABLE IF EXISTS ai_performance_metrics CASCADE;
DROP TABLE IF EXISTS ai_prompt_templates CASCADE;
DROP TABLE IF EXISTS ai_response_metadata CASCADE;
DROP TABLE IF EXISTS ai_response_quality_metrics CASCADE;

-- Scorer Empty Tables (15)
DROP TABLE IF EXISTS score_benchmarks CASCADE;
DROP TABLE IF EXISTS score_breakdowns CASCADE;
DROP TABLE IF EXISTS scorer_benchmark_comparison CASCADE;
DROP TABLE IF EXISTS scorer_benchmark_comparisons CASCADE;
DROP TABLE IF EXISTS scorer_component_breakdown CASCADE;
DROP TABLE IF EXISTS scorer_explanation_data CASCADE;
DROP TABLE IF EXISTS scorer_history CASCADE;
DROP TABLE IF EXISTS scorer_methodology_log CASCADE;
DROP TABLE IF EXISTS scorer_pattern_drift CASCADE;
DROP TABLE IF EXISTS scorer_results CASCADE;
DROP TABLE IF EXISTS scorer_risk_deltas CASCADE;
DROP TABLE IF EXISTS scorer_risk_history CASCADE;
DROP TABLE IF EXISTS scorer_trend_analysis CASCADE;
DROP TABLE IF EXISTS scorer_version_history CASCADE;
DROP TABLE IF EXISTS risk_models CASCADE;

-- Crawler Empty Tables (9)
DROP TABLE IF EXISTS crawler_dom_snapshots CASCADE;
DROP TABLE IF EXISTS crawler_extracted_elements CASCADE;
DROP TABLE IF EXISTS crawler_har_files CASCADE;
DROP TABLE IF EXISTS crawler_historical_comparison CASCADE;
DROP TABLE IF EXISTS crawler_metrics CASCADE;
DROP TABLE IF EXISTS crawler_network_data CASCADE;
DROP TABLE IF EXISTS crawler_results CASCADE;
DROP TABLE IF EXISTS crawler_screenshots CASCADE;
DROP TABLE IF EXISTS crawler_session_history CASCADE;

-- Content Analysis Empty Tables (4)
DROP TABLE IF EXISTS content_churn_history CASCADE;
DROP TABLE IF EXISTS content_fingerprints CASCADE;
DROP TABLE IF EXISTS content_flags CASCADE;
DROP TABLE IF EXISTS content_hashes CASCADE;

-- Policy & Compliance Empty Tables (10)
DROP TABLE IF EXISTS audit_checks CASCADE;
DROP TABLE IF EXISTS compliance_checks CASCADE;
DROP TABLE IF EXISTS compliance_history CASCADE;
DROP TABLE IF EXISTS compliance_reports CASCADE;
DROP TABLE IF EXISTS policy_checker_history CASCADE;
DROP TABLE IF EXISTS policy_violations CASCADE;
DROP TABLE IF EXISTS jurisdiction_detections CASCADE;
DROP TABLE IF EXISTS domains_detected CASCADE;
DROP TABLE IF EXISTS pattern_detection_results CASCADE;
DROP TABLE IF EXISTS publisher_violation_patterns CASCADE;

-- Technical Checker Empty Tables (4)
DROP TABLE IF EXISTS technical_component_details CASCADE;
DROP TABLE IF EXISTS technical_health_history CASCADE;
DROP TABLE IF EXISTS technical_health_results CASCADE;
DROP TABLE IF EXISTS technical_recommendations CASCADE;

-- Alert & Monitoring Empty Tables (5)
DROP TABLE IF EXISTS admin_alerts CASCADE;
DROP TABLE IF EXISTS alert_definitions CASCADE;
DROP TABLE IF EXISTS alert_notifications CASCADE;
DROP TABLE IF EXISTS triggered_alerts CASCADE;
DROP TABLE IF EXISTS publisher_trend_alerts CASCADE;

-- Audit Management Empty Tables (4)
DROP TABLE IF EXISTS audit_behavioral_metrics CASCADE;
DROP TABLE IF EXISTS audit_failures CASCADE;
DROP TABLE IF EXISTS behavioral_history_snapshots CASCADE;
DROP TABLE IF EXISTS site_audit_history CASCADE;

-- Publisher Tracking Empty Tables (4)
DROP TABLE IF EXISTS publisher_metric_aggregations CASCADE;
DROP TABLE IF EXISTS publisher_module_snapshots CASCADE;
DROP TABLE IF EXISTS publisher_risk_profiles CASCADE;
DROP TABLE IF EXISTS publisher_trend_reports CASCADE;

-- Miscellaneous Empty Tables (13)
DROP TABLE IF EXISTS data_retention_policies CASCADE;
DROP TABLE IF EXISTS data_retention_policy_logs CASCADE;
DROP TABLE IF EXISTS deletion_backups CASCADE;
DROP TABLE IF EXISTS gam_job_logs CASCADE;
DROP TABLE IF EXISTS mcm_payment_errors CASCADE;
DROP TABLE IF EXISTS mfa_authentication_metrics CASCADE;
DROP TABLE IF EXISTS mfa_monitoring_events CASCADE;
DROP TABLE IF EXISTS mfa_probability_cache CASCADE;
DROP TABLE IF EXISTS mfa_risk_indicators CASCADE;
DROP TABLE IF EXISTS mfa_security_events CASCADE;
DROP TABLE IF EXISTS report_historical CASCADE;
DROP TABLE IF EXISTS retention_execution_log CASCADE;
DROP TABLE IF EXISTS user_creation_logs CASCADE;
DROP TABLE IF EXISTS worker_status CASCADE;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Summary: Removed ~110 empty tables
-- Expected Impact:
-- - Reduced database size
-- - Faster schema queries
-- - Cleaner codebase
-- - Easier maintenance
```

## Impact Analysis

### Before Cleanup
- **Total Tables**: 130+
- **Empty Tables**: ~110 (85%)
- **Active Tables**: ~20 (15%)
- **Database Bloat**: High

### After Cleanup
- **Total Tables**: ~25
- **Empty Tables**: 0 (0%)
- **Active Tables**: ~25 (100%)
- **Database Bloat**: Minimal

## Testing Plan

1. **Backup Database** ⚠️
   ```bash
   # Create full backup before cleanup
   pg_dump --clean --create --format=custom dbname > backup_pre_cleanup.dump
   ```

2. **Apply Migration**
   ```bash
   # Apply cleanup migration
   psql -f 20251124_cleanup_empty_tables.sql
   ```

3. **Verify Worker Still Functions**
   ```bash
   cd site-monitoring-worker
   npm start
   # Trigger a test audit
   # Monitor logs for errors
   ```

4. **Check Frontend**
   - Load MFA Buster page
   - Verify data displays correctly
   - Check browser console for errors

5. **Monitor Performance**
   - Query performance should improve
   - Schema introspection faster
   - PostgREST startup faster

## Recommendations

1. **Adopt Minimalist Approach**: Only create tables when actually needed
2. **Use JSONB for Optional Data**: Store variable data in JSONB columns instead of creating new tables
3. **Consolidate Similar Data**: Use polymorphic patterns instead of creating table per type
4. **Regular Audits**: Run quarterly table usage audits to prevent bloat
5. **Migration Discipline**: Each new table must have clear justification

## Final Database Structure (Post-Cleanup)

**Core Tables** (~25 total):
1. Authentication & Users (3): `app_users`, `invitations`, `approval_logs`
2. Publishers (1): `publishers`
3. Audits (4): `site_audits`, `audit_queue`, `audit_logs`, `db_operation_logs`
4. Module Results (7): `content_analysis_results`, `policy_checker_results`, `policy_compliance_results`, `technical_check_results`, `technical_check_history`, `crawler_sessions`, `crawler_page_metrics`
5. AI Analysis (2): `ai_analysis_results`, `ai_interpretation_history`
6. GAM Reporting (4): `reports_dimensional`, `reports_daily`, `report_fetch_logs`, `exchange_rates`
7. Misc (4): `alerts`, `email_logs`, `ad_density_history`, `module_comparison_results`, `mfa_composite_scores`, `confidence_score_weights`, `mcm_parents`, `cron_execution_logs`

**Total: Clean, maintainable, and focused on actual MFA detection needs!**
