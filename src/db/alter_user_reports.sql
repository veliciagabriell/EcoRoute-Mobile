-- Alter user_reports to support extended report fields
ALTER TABLE user_reports
  ADD COLUMN IF NOT EXISTS indicators JSONB,
  ADD COLUMN IF NOT EXISTS severity VARCHAR(20),
  ADD COLUMN IF NOT EXISTS photo_base64 TEXT,
  ADD COLUMN IF NOT EXISTS photo_mime VARCHAR(50),
  ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS location_lng DECIMAL(10,7);
