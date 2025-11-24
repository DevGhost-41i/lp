-- Migration: Add directory website detection columns to site_audits
-- Description: Adds columns to store directory website detection results

BEGIN;

-- Add is_directory column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'site_audits' AND column_name = 'is_directory'
  ) THEN
    ALTER TABLE site_audits ADD COLUMN is_directory BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add directory_type column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'site_audits' AND column_name = 'directory_type'
  ) THEN
    ALTER TABLE site_audits ADD COLUMN directory_type VARCHAR(100);
  END IF;
END $$;

-- Add directory_confidence column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'site_audits' AND column_name = 'directory_confidence'
  ) THEN
    ALTER TABLE site_audits ADD COLUMN directory_confidence INTEGER;
  END IF;
END $$;

-- Add directory_data column (JSONB for structured data)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'site_audits' AND column_name = 'directory_data'
  ) THEN
    ALTER TABLE site_audits ADD COLUMN directory_data JSONB;
  END IF;
END $$;

-- Create index on is_directory for filtering
CREATE INDEX IF NOT EXISTS idx_site_audits_is_directory 
  ON site_audits (is_directory) WHERE is_directory = TRUE;

-- Create index on directory_type for grouping
CREATE INDEX IF NOT EXISTS idx_site_audits_directory_type 
  ON site_audits (directory_type) WHERE directory_type IS NOT NULL;

-- Add comment to columns
COMMENT ON COLUMN site_audits.is_directory IS 'Whether the site is detected as a directory website';
COMMENT ON COLUMN site_audits.directory_type IS 'Type of directory plugin detected (e.g., geodirectory, directorist)';
COMMENT ON COLUMN site_audits.directory_confidence IS 'Confidence score (0-100) for directory detection';
COMMENT ON COLUMN site_audits.directory_data IS 'Structured data extracted from directory (listings, categories, locations)';

COMMIT;
