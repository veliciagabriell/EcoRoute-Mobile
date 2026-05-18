-- Seed TPS locations for ITB Ganesha and Tamansari
INSERT INTO tps_locations (name, latitude, longitude, container_height_cm, area)
VALUES
  ('TPS ITB Ganesha', -6.89148, 107.61070, 120, 'Bandung - ITB Ganesha'),
  ('TPS Tamansari', -6.90035, 107.60657, 140, 'Bandung - Tamansari'),
  ('TPS Dago', -6.89520, 107.61310, 120, 'Bandung - Dago'),
  ('TPS Cisitu', -6.88990, 107.61260, 110, 'Bandung - Cisitu'),
  ('TPS Lebak Siliwangi', -6.89750, 107.60980, 130, 'Bandung - Lebak Siliwangi'),
  ('TPS Siliwangi', -6.89890, 107.60690, 120, 'Bandung - Siliwangi')
ON CONFLICT DO NOTHING;
