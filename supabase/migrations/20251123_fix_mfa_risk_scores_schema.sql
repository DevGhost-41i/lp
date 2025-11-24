-- Fix schema for mfa_risk_scores table
-- This migration adds missing columns that are causing errors in the worker

DO $$
BEGIN
    -- Add audit_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mfa_risk_scores' AND column_name = 'audit_id') THEN
        ALTER TABLE mfa_risk_scores ADD COLUMN audit_id uuid;
        CREATE INDEX IF NOT EXISTS idx_mfa_risk_scores_audit_id ON mfa_risk_scores(audit_id);
    END IF;

    -- Add fraud_probability if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mfa_risk_scores' AND column_name = 'fraud_probability') THEN
        ALTER TABLE mfa_risk_scores ADD COLUMN fraud_probability numeric DEFAULT 0;
    END IF;

    -- Add confidence_level if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mfa_risk_scores' AND column_name = 'confidence_level') THEN
        ALTER TABLE mfa_risk_scores ADD COLUMN confidence_level numeric DEFAULT 0;
    END IF;

    -- Add risk_factors if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mfa_risk_scores' AND column_name = 'risk_factors') THEN
        ALTER TABLE mfa_risk_scores ADD COLUMN risk_factors jsonb;
    END IF;

    -- Add reasoning if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mfa_risk_scores' AND column_name = 'reasoning') THEN
        ALTER TABLE mfa_risk_scores ADD COLUMN reasoning jsonb;
    END IF;

    -- Add model_version if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mfa_risk_scores' AND column_name = 'model_version') THEN
        ALTER TABLE mfa_risk_scores ADD COLUMN model_version text DEFAULT 'risk-probability-model-v1';
    END IF;

    -- Add domain if it doesn't exist (just in case)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mfa_risk_scores' AND column_name = 'domain') THEN
        ALTER TABLE mfa_risk_scores ADD COLUMN domain text;
        CREATE INDEX IF NOT EXISTS idx_mfa_risk_scores_domain ON mfa_risk_scores(domain);
    END IF;

END $$;
