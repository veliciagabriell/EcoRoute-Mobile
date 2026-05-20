import { useEffect, useMemo, useState } from 'react';
import { mqttService, type MqttStatus } from '@/services/mqtt-service';
import { useTpsStore } from '@/stores/tps-store';
import type { TPSSensorUpdate } from '@/types/tps';

type MqttSensorState = {
  status: MqttStatus;
  isLive: boolean;
  error: string | null;
};

const parseSensorPayload = (payload: string): TPSSensorUpdate | null => {
  try {
    const data = JSON.parse(payload) as {
      fullness?: number;
      ammonia?: number;
      temperature?: number;
      timestamp?: string;
    };

    const fullness = Number(data.fullness);
    const ammonia = Number(data.ammonia);
    const temperature = Number(data.temperature);
    const lastUpdate = typeof data.timestamp === 'string' ? data.timestamp : '';

    if (!Number.isFinite(fullness) || !Number.isFinite(ammonia) || !Number.isFinite(temperature)) {
      return null;
    }

    return {
      fullness,
      ammonia,
      temperature,
      lastUpdate,
    };
  } catch {
    return null;
  }
};

export function useMqttSensor(tpsId: string | null): MqttSensorState {
  const updateSensorData = useTpsStore((state) => state.updateSensorData);
  const [status, setStatus] = useState<MqttStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  const topic = useMemo(() => (tpsId ? `tps/${tpsId}/sensor` : null), [tpsId]);

  useEffect(() => {
    setIsLive(false);
    setError(null);

    if (!topic || !tpsId) {
      return;
    }

    mqttService.connect();

    const statusUnsub = mqttService.onStatusChange((nextStatus, err) => {
      setStatus(nextStatus);
      setError(err ? err.message : null);
    });

    const messageHandler = (payload: string) => {
      const update = parseSensorPayload(payload);
      if (!update) return;
      updateSensorData(tpsId, update);
      setIsLive(true);
    };

    mqttService.subscribe(topic, messageHandler);

    return () => {
      mqttService.unsubscribe(topic, messageHandler);
      statusUnsub();
    };
  }, [topic, tpsId, updateSensorData]);

  return { status, isLive, error };
}
