-- Create video_detection_history table
CREATE TABLE IF NOT EXISTS video_detection_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publisher_id UUID NOT NULL REFERENCES publishers(id) ON DELETE CASCADE,
    site_audit_id UUID NOT NULL REFERENCES site_audits(id) ON DELETE CASCADE,
    video_player_count INTEGER DEFAULT 0,
    autoplay_count INTEGER DEFAULT 0,
    video_stuffing_detected BOOLEAN DEFAULT FALSE,
    risk_score FLOAT DEFAULT 0,
    video_players_data JSONB DEFAULT '[]'::jsonb,
    audit_timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE video_detection_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON video_detection_history
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON video_detection_history
    FOR INSERT WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_video_detection_publisher_id ON video_detection_history(publisher_id);
CREATE INDEX IF NOT EXISTS idx_video_detection_audit_id ON video_detection_history(site_audit_id);
