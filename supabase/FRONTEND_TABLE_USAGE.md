# Frontend Application Table Usage Analysis

## ✅ CRITICAL - Tables Used by Frontend (MUST KEEP)

### Core Application Tables
- `app_users` - User authentication and profiles
- `publishers` - Publisher management
- `mcm_parents` - MCM parent accounts
- `invitations` - User invitation system
- `alerts` - Alert notifications
- `audit_logs` - Audit logging

### Reports & Analytics
- `report_historical` - Historical report data
- `reports_dimensional` - Dimensional report data

### MFA Detection & Site Audits
- `site_audits` - Core audit data (HEAVILY USED)
- `compliance_checks` - **USED in mfaAuditService.ts**
- `content_flags` - **USED in mfaAuditService.ts**
- `mfa_composite_scores` - MFA composite scoring
- `publisher_trend_alerts` - Trend alerts

### AI Monitoring (aiMonitoringService.ts - Lines 58, 94, 110, 164, 181, 197, 204)
- ❌ `ai_analysis_errors` - **USED** for monitoring AI errors
- ❌ `admin_alerts` - **USED** for admin notifications  
- ❌ `ai_model_analysis` - **USED** for model performance tracking
- ❌ `mcm_payment_errors` - **USED** for payment error tracking

## 🔄 Summary of Frontend Findings

### Previously Marked for Deletion BUT Actually Used
The following tables were on our cleanup list but are **ACTIVELY USED** by the frontend:

1. **`compliance_checks`** - Used in `mfaAuditService.ts` (lines 85, 127)
   - Stores audit check results
   - Queried when viewing audit details
   
2. **`content_flags`** - Used in `mfaAuditService.ts` (lines 100, 128)
   - Stores content quality flags
   - Queried when viewing audit details

3. **`ai_analysis_errors`** - Used in `aiMonitoringService.ts` (lines 58, 94, 197)
   - AI monitoring dashboard
   - Performance metrics

4. **`admin_alerts`** - Used in `aiMonitoringService.ts` (lines 110, 126, 143, 204)
   - Admin notification system
   - Alert management

5. **`ai_model_analysis`** - Used in `aiMonitoringService.ts` (line 164)
   - Model analysis history
   - Performance tracking

6. **`mcm_payment_errors`** - Used in `aiMonitoringService.ts` (line 181)
   - MCM payment error tracking

## ⚠️ REVISED CLEANUP DECISION

**MUST KEEP** (Frontend Uses):
- `compliance_checks` ✅
- `content_flags` ✅
- `ai_analysis_errors` ✅
- `admin_alerts` ✅
- `ai_model_analysis` ✅
- `mcm_payment_errors` ✅

**CAN DROP** (Not used by frontend or worker):
- `ai_analysis_cache`
- `ai_analysis_history`
- `ai_analysis_metrics`
- `ai_assistance_error_logs`
- `ai_assistance_history`
- `ai_assistance_interpretation_history`
- `ai_assistance_prompt_templates`
- `ai_assistance_quality_metrics`
- `ai_assistance_recommendation_trends`
- `ai_assistance_results`
- `ai_budget_tracker`
- `ai_error_logs`
- `ai_interpretation_fields`
- `ai_performance_metrics`
- `ai_prompt_templates`
- `ai_response_metadata`
- `ai_response_quality_metrics`

## 📊 Final Count

- **Frontend-only tables**: ~15 (app_users, publishers, reports, etc.)
- **Worker-only tables**: ~35 (ad tracking, crawler data, policy etc.)
- **Shared tables**: ~6 (site_audits, compliance_checks, content_flags, AI monitoring)
- **Safe to drop**: ~70 tables (down from 110)

**Total tables to KEEP**: ~56 tables
**Total tables to DROP**: ~70 tables
