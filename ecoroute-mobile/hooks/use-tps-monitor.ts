import { useEffect, useRef } from 'react';
import { get } from '@/utils/api';
import { notifyCriticalTPS } from '@/services/notification-service';

const POLL_INTERVAL_MS = 3 * 60 * 1000; // Poll every 3 minutes
const CRITICAL_THRESHOLD = 80;

export function useTpsMonitor(enabled: boolean) {
  const notifiedIds = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const data = await get('/tps');
        const list: any[] = data?.data || data || [];

        if (!Array.isArray(list) || !mounted) return;

        for (const item of list) {
          const tps = item?.tps ?? item;
          const latest = item?.latestReading ?? item?.latest_reading ?? item?.sensor_data;
          const fullness = Number(latest?.fullness_pct ?? latest?.fullness ?? 0);
          const id = String(tps?.id ?? '');
          const name = String(tps?.name ?? 'TPS');

          if (!id) continue;

          if (fullness >= CRITICAL_THRESHOLD && !notifiedIds.current.has(id)) {
            notifiedIds.current.add(id);
            await notifyCriticalTPS(name, fullness);
          } else if (fullness < CRITICAL_THRESHOLD - 10) {
            // Reset so we can notify again next time it goes critical
            notifiedIds.current.delete(id);
          }
        }
      } catch (err) {
        console.warn('[TPS Monitor] Poll failed:', err);
      }

      if (mounted) {
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    poll();

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [enabled]);
}
