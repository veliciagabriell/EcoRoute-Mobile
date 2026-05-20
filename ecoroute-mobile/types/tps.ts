export type TPSData = {
  id: string;
  name: string;
  fullness: number;
  ammonia: number;
  temperature: number;
  lastUpdate: string;
  latitude: number;
  longitude: number;
};

export type TPSSensorUpdate = {
  fullness: number;
  ammonia: number;
  temperature: number;
  lastUpdate: string;
};

export type TPSStatus = 'normal' | 'warning' | 'critical';
