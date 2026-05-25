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
  temperature_c?: number | string | null;
  temperature?: number | string | null;
  alert_level?: string | null;
  fullness?: number | string | null;
  ammonia?: number | string | null;
  timestamp?: string | null;
};

type TpsResponseItem =
  | TpsLocation
  | {
      tps?: TpsLocation | null;
      latestReading?: SensorReading | null;
      latest_reading?: SensorReading | null;
      sensor_data?: SensorReading | null;
      distance_km?: number | string | null;
    };

export type NormalizedTps = {
  id: string;
  name: string;
  area: string;
  latitude: number;
  longitude: number;
  latestReading: {
    ammonia_ppm: number;
    fullness_pct: number;
    temperature_c: number;
    alert_level: AlertLevel | null;
    timestamp: string;
  } | null;
  distanceKm?: number;
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

function unwrapTpsResponse(response: ApiResponse<TpsResponseItem[]> | TpsResponseItem[]): TpsResponseItem[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (response.error) {
    throw new Error(response.error);
  }

  return Array.isArray(response.data) ? response.data : [];
}

function normalizeAlertLevel(value: unknown): AlertLevel | null {
  return value === 'critical' || value === 'warning' || value === 'normal' ? value : null;
}

export function normalizeTpsItem(item: TpsResponseItem): NormalizedTps | null {
  const source = (item as any)?.tps ?? item;
  if (!source?.id) return null;

  const reading =
    (item as any)?.latestReading ??
    (item as any)?.latest_reading ??
    (item as any)?.sensor_data ??
    source.latest_reading ??
    null;

  const ammonia = reading ? toNumber(reading.ammonia_ppm ?? reading.ammonia) : 0;
  const fullness = reading ? toNumber(reading.fullness_pct ?? reading.fullness) : 0;
  const temperature = reading ? toNumber(reading.temperature_c ?? reading.temperature) : 0;
  const distanceKm = (item as any)?.distance_km;
  const parsedDistanceKm = distanceKm === null || distanceKm === undefined ? undefined : toNumber(distanceKm);
  const computedLevel = getLevel(ammonia, fullness);

  return {
    id: String(source.id),
    name: String(source.name || source.tps_name || 'TPS Tanpa Nama'),
    area: String(source.area || '-'),
    latitude: toNumber(source.latitude),
    longitude: toNumber(source.longitude),
    latestReading: reading
      ? {
          ammonia_ppm: ammonia,
          fullness_pct: fullness,
          temperature_c: temperature,
          alert_level: normalizeAlertLevel(reading.alert_level) ?? computedLevel,
          timestamp: reading.timestamp || new Date().toISOString(),
        }
      : null,
    distanceKm: Number.isFinite(parsedDistanceKm) ? parsedDistanceKm : undefined,
  };
}

export function normalizeTpsList(response: ApiResponse<TpsResponseItem[]> | TpsResponseItem[]): NormalizedTps[] {
  return unwrapTpsResponse(response).map(normalizeTpsItem).filter(Boolean) as NormalizedTps[];
}

function mapTpsToSensorStatus(tps: NormalizedTps): SensorStatus {
  const reading = tps.latestReading;
  const ammonia = reading?.ammonia_ppm ?? 0;
  const fullness = reading?.fullness_pct ?? 0;
  const level = getLevel(ammonia, fullness);

  return {
    tps_id: tps.id,
    tps_name: tps.name,
    location: {
      latitude: tps.latitude,
      longitude: tps.longitude,
      area: tps.area,
    },
    sensor_data: {
      ammonia_ppm: ammonia,
      fullness_pct: fullness,
      timestamp: reading?.timestamp || new Date().toISOString(),
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
  return normalizeTpsList(response).map(mapTpsToSensorStatus);
}
