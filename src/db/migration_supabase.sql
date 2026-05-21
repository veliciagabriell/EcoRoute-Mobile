-- ================================================================
-- MIGRATION: EcoRoute - TPS Data & user_reports Table
-- Jalankan seluruh script ini di Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > paste > Run
-- ================================================================

-- ----------------------------------------------------------------
-- STEP 1: Pastikan extension UUID tersedia
-- ----------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------
-- STEP 2: Pastikan ENUM types ada (skip jika sudah ada)
-- ----------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('umum', 'petugas', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('pending', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE alert_level AS ENUM ('normal', 'warning', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notif_status AS ENUM ('sent', 'failed', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------------------------------
-- STEP 3: Pastikan tabel tps_locations ada
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tps_locations (
  id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                VARCHAR(100)  NOT NULL,
  latitude            DECIMAL(10,7) NOT NULL,
  longitude           DECIMAL(10,7) NOT NULL,
  container_height_cm INTEGER       NOT NULL DEFAULT 120,
  area                VARCHAR(100),
  created_at          TIMESTAMP     DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- STEP 4: Tambahkan unique constraint pada nama TPS
--         agar INSERT ... ON CONFLICT (name) bisa bekerja
-- ----------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tps_locations_name_key'
      AND conrelid = 'tps_locations'::regclass
  ) THEN
    ALTER TABLE tps_locations ADD CONSTRAINT tps_locations_name_key UNIQUE (name);
  END IF;
END $$;

-- ----------------------------------------------------------------
-- STEP 5: Masukkan 4 TPS yang dibutuhkan
--         ON CONFLICT (name) DO UPDATE = upsert, aman dijalankan
--         berkali-kali tanpa duplikasi
-- ----------------------------------------------------------------
INSERT INTO tps_locations (name, latitude, longitude, container_height_cm, area)
VALUES
  ('TPS ITB Ganesha', -6.8914800, 107.6107000, 120, 'Bandung - ITB Ganesha'),
  ('TPS Sarijadi',    -6.8773000, 107.5965000, 120, 'Bandung - Sarijadi'),
  ('TPS Dago',        -6.8952000, 107.6131000, 120, 'Bandung - Dago'),
  ('TPS Tamansari',   -6.9003500, 107.6065700, 140, 'Bandung - Tamansari')
ON CONFLICT (name) DO UPDATE SET
  latitude            = EXCLUDED.latitude,
  longitude           = EXCLUDED.longitude,
  container_height_cm = EXCLUDED.container_height_cm,
  area                = EXCLUDED.area;

-- ----------------------------------------------------------------
-- STEP 6: Pastikan tabel users ada (dibutuhkan oleh FK user_reports)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100),
  email         VARCHAR(255)  UNIQUE NOT NULL,
  password_hash VARCHAR       NOT NULL,
  role          user_role     DEFAULT 'umum',
  work_area     VARCHAR(100),
  fcm_token     VARCHAR,
  created_at    TIMESTAMP     DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- STEP 7: Buat tabel user_reports (tabel laporan dari pengguna)
--         Menyimpan semua laporan kondisi TPS dari pengguna umum
--         yang nantinya bisa dilihat oleh petugas
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_reports (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  tps_id        UUID          REFERENCES tps_locations(id) ON DELETE SET NULL,
  reporter_id   UUID          REFERENCES users(id)         ON DELETE SET NULL,
  description   TEXT          NOT NULL,
  indicators    JSONB,
  severity      VARCHAR(20)   DEFAULT 'sedang',
  photo_base64  TEXT,
  photo_mime    VARCHAR(50),
  location_lat  DECIMAL(10,7),
  location_lng  DECIMAL(10,7),
  reported_at   TIMESTAMP     DEFAULT NOW(),
  status        report_status DEFAULT 'pending'
);

-- ----------------------------------------------------------------
-- STEP 8: Tambahkan kolom yang mungkin belum ada (idempotent)
-- ----------------------------------------------------------------
ALTER TABLE user_reports ADD COLUMN IF NOT EXISTS indicators   JSONB;
ALTER TABLE user_reports ADD COLUMN IF NOT EXISTS severity     VARCHAR(20)   DEFAULT 'sedang';
ALTER TABLE user_reports ADD COLUMN IF NOT EXISTS photo_base64 TEXT;
ALTER TABLE user_reports ADD COLUMN IF NOT EXISTS photo_mime   VARCHAR(50);
ALTER TABLE user_reports ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10,7);
ALTER TABLE user_reports ADD COLUMN IF NOT EXISTS location_lng DECIMAL(10,7);

-- ----------------------------------------------------------------
-- STEP 9: Buat indexes untuk performa query
-- ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_reports_tps_id     ON user_reports(tps_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reporter   ON user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported   ON user_reports(reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_reports_status     ON user_reports(status);

-- ----------------------------------------------------------------
-- STEP 10: Pastikan tabel sensor_readings ada (opsional)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sensor_readings (
  id           UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  tps_id       UUID          REFERENCES tps_locations(id) NOT NULL,
  device_id    VARCHAR(50)   NOT NULL,
  ammonia_ppm  DECIMAL(6,2)  NOT NULL DEFAULT 0,
  fullness_pct DECIMAL(5,2)  NOT NULL DEFAULT 0,
  temperature_c DECIMAL(5,2) DEFAULT 0,
  is_critical  BOOLEAN       DEFAULT FALSE,
  alert_level  alert_level   DEFAULT 'normal',
  timestamp    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sensor_timestamp   ON sensor_readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_sensor_tps_alert   ON sensor_readings(tps_id, alert_level);

-- ----------------------------------------------------------------
-- STEP 11: Buat tabel notifications (log notifikasi TPS kritis)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  tps_id          UUID          REFERENCES tps_locations(id) ON DELETE SET NULL,
  triggered_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
  ammonia_ppm     DECIMAL(6,2),
  fullness_pct    DECIMAL(5,2),
  alert_level     alert_level   DEFAULT 'normal',
  delivery_status notif_status  DEFAULT 'pending',
  created_at      TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_tps        ON notifications(tps_id);
CREATE INDEX IF NOT EXISTS idx_notifications_triggered  ON notifications(triggered_at DESC);

-- ----------------------------------------------------------------
-- SELESAI - Verifikasi dengan query berikut:
-- SELECT name, latitude, longitude, area FROM tps_locations ORDER BY name;
-- SELECT COUNT(*) FROM user_reports;
-- SELECT COUNT(*) FROM notifications;
-- ----------------------------------------------------------------
