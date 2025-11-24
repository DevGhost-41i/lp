-- Relax constraint on crawler_sessions
ALTER TABLE IF EXISTS crawler_sessions 
ALTER COLUMN site_name DROP NOT NULL;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
