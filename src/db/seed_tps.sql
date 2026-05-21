-- Seed TPS locations: 4 lokasi utama EcoRoute Bandung
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
