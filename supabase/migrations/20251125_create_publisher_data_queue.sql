-- Migration: Add publisher data queue system
-- Description: Creates table for tracking historical data fetch queue and adds status column to publishers

-- Create publisher_data_queue table
CREATE TABLE IF NOT EXISTS publisher_data_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  publisher_id UUID NOT NULL REFERENCES publishers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  fetch_type TEXT NOT NULL DEFAULT 'historical_2_months',
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  CONSTRAINT unique_publisher_queue UNIQUE(publisher_id, fetch_type)
);

-- Add index for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_queue_status_created 
  ON publisher_data_queue(status, created_at) 
  WHERE status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS idx_queue_publisher 
  ON publisher_data_queue(publisher_id);

-- Add data_fetch_status column to publishers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'publishers' AND column_name = 'data_fetch_status'
  ) THEN
    ALTER TABLE publishers 
    ADD COLUMN data_fetch_status TEXT DEFAULT 'pending' 
    CHECK (data_fetch_status IN ('pending', 'fetching', 'completed', 'failed'));
  END IF;
END $$;

-- Create index for filtering publishers by data fetch status
CREATE INDEX IF NOT EXISTS idx_publishers_data_fetch_status 
  ON publishers(data_fetch_status) 
  WHERE data_fetch_status IN ('pending', 'fetching');

-- Enable RLS on publisher_data_queue
ALTER TABLE publisher_data_queue ENABLE ROW LEVEL SECURITY;

-- Service role can manage queue
CREATE POLICY "Service role can manage publisher_data_queue"
  ON publisher_data_queue FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can view queue for their publishers
CREATE POLICY "Authenticated users can view queue for their publishers"
  ON publisher_data_queue FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM publishers
      WHERE publishers.id = publisher_data_queue.publisher_id
      AND publishers.created_by = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON TABLE publisher_data_queue IS 'Queue for tracking historical data fetch jobs for bulk uploaded publishers';
COMMENT ON COLUMN publishers.data_fetch_status IS 'Status of historical data fetch: pending, fetching, completed, failed';
