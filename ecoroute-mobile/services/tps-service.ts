import type { SensorStatus } from '@/components/sensor-status-card';
import { get } from '@/utils/api';

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
};

type TpsLocation = {
  id: string;
  name?: string;
  tps_name?: string;
  area?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  latest_reading?: SensorReading | null;
};

type SensorReading = {
  ammonia_ppm?: number | string | null;
  fullness_pct?: number | string | null;
  timestamp?: string | null;
};

type AlertLevel = SensorStatus['alert']['level'];

const THRESHOLDS = {
  ammonia: {
    normal: 30,
    warning: 50,
    critical: 50,
  },
  fullness: {
    normal: 60,
    warning: 80,
    critical: 80,
  },
};

function toNumber(value: number | string | null | undefined): number {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(parsed) ? Number(parsed) : 0;
}

function getLevel(ammonia: number, fullness: number): AlertLevel {
  if (ammonia >= THRESHOLDS.ammonia.critical || fullness >= THRESHOLDS.fullness.critical) {
    return 'critical';
  }

  if (ammonia >= THRESHOLDS.ammonia.normal || fullness >= THRESHOLDS.fullness.normal) {
    return 'warning';
  }

  return 'normal';
}

function getColor(level: AlertLevel): string {
  if (level === 'critical') return '#FF4444';
  if (level === 'warning') return '#FF9800';
  return '#4CAF50';
}

function getMetricStatus(value: number, warningAt: number, criticalAt: number): AlertLevel {
  if (value >= criticalAt) return 'critical';
  if (value >= warningAt) return 'warning';
  return 'normal';
}

function unwrapTpsResponse(response: ApiResponse<TpsLocation[]> | TpsLocation[]): TpsLocation[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (response.error) {
    throw new Error(response.error);
  }

  return Array.isArray(response.data) ? response.data : [];
}

function mapTpsToSensorStatus(tps: TpsLocation): SensorStatus {
  const reading = tps.latest_reading ?? {};
  const ammonia = toNumber(reading.ammonia_ppm);
  const fullness = toNumber(reading.fullness_pct);
  const level = getLevel(ammonia, fullness);

  return {
    tps_id: tps.id,
    tps_name: tps.name || tps.tps_name || 'TPS Tanpa Nama',
    location: {
      latitude: toNumber(tps.latitude),
      longitude: toNumber(tps.longitude),
      area: tps.area || '-',
    },
    sensor_data: {
      ammonia_ppm: ammonia,
      fullness_pct: fullness,
      timestamp: reading.timestamp || new Date().toISOString(),
    },
    alert: {
      level,
      color: getColor(level),
      critical: level === 'critical',
    },
    thresholds: {
      ammonia: {
        ...THRESHOLDS.ammonia,
        current: ammonia,
        status: getMetricStatus(ammonia, THRESHOLDS.ammonia.normal, THRESHOLDS.ammonia.critical),
      },
      fullness: {
        ...THRESHOLDS.fullness,
        current: fullness,
        status: getMetricStatus(fullness, THRESHOLDS.fullness.normal, THRESHOLDS.fullness.critical),
      },
    },
  };
}

export async function getSensorStatuses(): Promise<SensorStatus[]> {
  const response = await get('/tps');
  return unwrapTpsResponse(response).map(mapTpsToSensorStatus);
}
