export const FULLNESS_CRITICAL_PCT = 80;
export const AMMONIA_CRITICAL_PPM = 50;
export const AMMONIA_WARNING_PPM = 30;

export type TpsStatusKey =
  | 'DARURAT'
  | 'PENUH'
  | 'BAU_EKSTREM'
  | 'PERINGATAN'
  | 'NORMAL_MQ135_ERROR'
  | 'NORMAL';

export function getTpsStatus(
  fullnessPct: number,
  ammoniaPpm: number,
  mqSensorError: boolean
): TpsStatusKey {
  const isFull = fullnessPct >= FULLNESS_CRITICAL_PCT;
  const isSmelly = !mqSensorError && ammoniaPpm >= AMMONIA_CRITICAL_PPM;

  if (isFull && isSmelly) return 'DARURAT';
  if (isFull) return 'PENUH';
  if (isSmelly) return 'BAU_EKSTREM';

  if (fullnessPct >= 60.0 || (!mqSensorError && ammoniaPpm >= AMMONIA_WARNING_PPM)) {
    return 'PERINGATAN';
  }

  if (mqSensorError) return 'NORMAL_MQ135_ERROR';

  return 'NORMAL';
}

export type StatusVisual = {
  label: string;
  color: string;
  bg: string;
  icon: string;
  severityKey: 'critical' | 'warning' | 'normal';
};

export function getTpsStatusVisual(status: TpsStatusKey): StatusVisual {
  switch (status) {
    case 'DARURAT':
      return { label: 'DARURAT', color: '#93000A', bg: '#FFDAD6', icon: 'warning', severityKey: 'critical' };
    case 'PENUH':
      return { label: 'PENUH', color: '#BA1A1A', bg: '#FFD9D9', icon: 'delete-empty', severityKey: 'critical' };
    case 'BAU_EKSTREM':
      return { label: 'BAU EKSTREM', color: '#7A4500', bg: '#FFDEC0', icon: 'molecule-co2', severityKey: 'critical' };
    case 'PERINGATAN':
      return { label: 'PERINGATAN', color: '#7A5A00', bg: '#FFDF99', icon: 'alert', severityKey: 'warning' };
    case 'NORMAL_MQ135_ERROR':
      return { label: 'MQ135 ERR', color: '#43474E', bg: '#E5EEFF', icon: 'alert-circle-outline', severityKey: 'normal' };
    case 'NORMAL':
      return { label: 'NORMAL', color: '#002110', bg: '#91F8B8', icon: 'check-circle', severityKey: 'normal' };
  }
}
