-- PostgreSQL schema for EcoRoute
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('umum','petugas','admin');
CREATE TYPE notif_status AS ENUM ('sent','failed','pending');
CREATE TYPE report_status AS ENUM ('pending','resolved');
CREATE TYPE alert_level AS ENUM ('normal','warning','critical');

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  role user_role DEFAULT 'umum',
  work_area VARCHAR(100),
  fcm_token VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tps_locations (
  id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                VARCHAR(100)  NOT NULL UNIQUE,
  latitude            DECIMAL(10,7) NOT NULL,
  longitude           DECIMAL(10,7) NOT NULL,
  container_height_cm INTEGER       NOT NULL DEFAULT 120,
  area                VARCHAR(100),
  created_at          TIMESTAMP     DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sensor_readings (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  tps_id        UUID          REFERENCES tps_locations(id) NOT NULL,
  device_id     VARCHAR(50)   NOT NULL,
  ammonia_ppm   DECIMAL(6,2)  NOT NULL DEFAULT 0,
  fullness_pct  DECIMAL(5,2)  NOT NULL DEFAULT 0,
  temperature_c DECIMAL(5,2)  DEFAULT 0,
  is_critical   BOOLEAN       DEFAULT FALSE,
  alert_level   alert_level   DEFAULT 'normal',
  timestamp     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sensor_timestamp ON sensor_readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_sensor_tps_alert ON sensor_readings(tps_id, alert_level);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tps_id UUID REFERENCES tps_locations(id),
  triggered_at TIMESTAMP NOT NULL,
  alert_level alert_level DEFAULT 'normal',
  ammonia_ppm DECIMAL(6,2),
  fullness_pct DECIMAL(5,2),
  delivery_status notif_status DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tps_id UUID REFERENCES tps_locations(id),
  reporter_id UUID REFERENCES users(id),
  description TEXT NOT NULL,
  indicators JSONB,
  severity VARCHAR(20),
  photo_base64 TEXT,
  photo_mime VARCHAR(50),
  location_lat DECIMAL(10,7),
  location_lng DECIMAL(10,7),
  reported_at TIMESTAMP DEFAULT NOW(),
  status report_status DEFAULT 'pending'
);
