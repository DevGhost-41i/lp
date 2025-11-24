-- Consolidated migration to fix all schema issues

-- 1. Restore publisher_risk_trends if missing
CREATE TABLE IF NOT EXISTS publisher_risk_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id uuid NOT NULL,
  site_url text,
  mfa_probability float,
  ctr_vs_benchmark float,
  ecpm_vs_benchmark float,
  fill_rate_change float,
  is_anomaly boolean DEFAULT false,
  anomaly_reasons text[],
  created_at timestamptz DEFAULT now()
);

-- 2. Restore policy_compliance_results if missing
CREATE TABLE IF NOT EXISTS policy_compliance_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id text NOT NULL,
  domain text NOT NULL,
  compliance_level text CHECK (compliance_level IN ('compliant', 'warning', 'non_compliant')),
  total_policies_checked integer DEFAULT 0,
  compliant_policies integer DEFAULT 0,
  violating_policies integer DEFAULT 0,
  total_violations integer DEFAULT 0,
  critical_violations integer DEFAULT 0,
  high_violations integer DEFAULT 0,
  medium_violations integer DEFAULT 0,
  low_violations integer DEFAULT 0,
  violations_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Add missing columns safely - COMPREHENSIVE CHECK

-- publisher_risk_trends columns
DO $$
BEGIN
    -- recorded_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'publisher_risk_trends' AND column_name = 'recorded_at') THEN
        ALTER TABLE publisher_risk_trends ADD COLUMN recorded_at timestamptz DEFAULT now();
    END IF;
    -- mfa_probability
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'publisher_risk_trends' AND column_name = 'mfa_probability') THEN
        ALTER TABLE publisher_risk_trends ADD COLUMN mfa_probability float;
    END IF;
    -- ctr_vs_benchmark
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'publisher_risk_trends' AND column_name = 'ctr_vs_benchmark') THEN
        ALTER TABLE publisher_risk_trends ADD COLUMN ctr_vs_benchmark float;
    END IF;
    -- ecpm_vs_benchmark
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'publisher_risk_trends' AND column_name = 'ecpm_vs_benchmark') THEN
        ALTER TABLE publisher_risk_trends ADD COLUMN ecpm_vs_benchmark float;
    END IF;
    -- fill_rate_change
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'publisher_risk_trends' AND column_name = 'fill_rate_change') THEN
        ALTER TABLE publisher_risk_trends ADD COLUMN fill_rate_change float;
    END IF;
    -- is_anomaly
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'publisher_risk_trends' AND column_name = 'is_anomaly') THEN
        ALTER TABLE publisher_risk_trends ADD COLUMN is_anomaly boolean DEFAULT false;
    END IF;
    -- anomaly_reasons
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'publisher_risk_trends' AND column_name = 'anomaly_reasons') THEN
        ALTER TABLE publisher_risk_trends ADD COLUMN anomaly_reasons text[];
    END IF;
END $$;

-- policy_compliance_results columns
DO $$
BEGIN
    -- detected_jurisdiction
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'policy_compliance_results' AND column_name = 'detected_jurisdiction') THEN
        ALTER TABLE policy_compliance_results ADD COLUMN detected_jurisdiction text DEFAULT 'Unknown';
    END IF;
    -- policies_status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'policy_compliance_results' AND column_name = 'policies_status') THEN
        ALTER TABLE policy_compliance_results ADD COLUMN policies_status jsonb DEFAULT '{}'::jsonb;
    END IF;
    -- timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'policy_compliance_results' AND column_name = 'timestamp') THEN
        ALTER TABLE policy_compliance_results ADD COLUMN timestamp timestamptz DEFAULT now();
    END IF;
    -- site_audit_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'policy_compliance_results' AND column_name = 'site_audit_id') THEN
        ALTER TABLE policy_compliance_results ADD COLUMN site_audit_id uuid;
    END IF;
    -- total_policies_checked
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'policy_compliance_results' AND column_name = 'total_policies_checked') THEN
        ALTER TABLE policy_compliance_results ADD COLUMN total_policies_checked integer DEFAULT 0;
    END IF;
    -- compliant_policies
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'policy_compliance_results' AND column_name = 'compliant_policies') THEN
        ALTER TABLE policy_compliance_results ADD COLUMN compliant_policies integer DEFAULT 0;
    END IF;
    -- violating_policies
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'policy_compliance_results' AND column_name = 'violating_policies') THEN
        ALTER TABLE policy_compliance_results ADD COLUMN violating_policies integer DEFAULT 0;
    END IF;
    -- total_violations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'policy_compliance_results' AND column_name = 'total_violations') THEN
        ALTER TABLE policy_compliance_results ADD COLUMN total_violations integer DEFAULT 0;
    END IF;
    -- critical_violations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'policy_compliance_results' AND column_name = 'critical_violations') THEN
        ALTER TABLE policy_compliance_results ADD COLUMN critical_violations integer DEFAULT 0;
    END IF;
    -- high_violations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'policy_compliance_results' AND column_name = 'high_violations') THEN
        ALTER TABLE policy_compliance_results ADD COLUMN high_violations integer DEFAULT 0;
    END IF;
    -- medium_violations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'policy_compliance_results' AND column_name = 'medium_violations') THEN
        ALTER TABLE policy_compliance_results ADD COLUMN medium_violations integer DEFAULT 0;
    END IF;
    -- low_violations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'policy_compliance_results' AND column_name = 'low_violations') THEN
        ALTER TABLE policy_compliance_results ADD COLUMN low_violations integer DEFAULT 0;
    END IF;
END $$;

-- 5. Force schema cache reload
NOTIFY pgrst, 'reload schema';
