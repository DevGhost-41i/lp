-- Add simhash column to content_analysis_results
ALTER TABLE IF EXISTS content_analysis_results 
ADD COLUMN IF NOT EXISTS simhash TEXT;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
