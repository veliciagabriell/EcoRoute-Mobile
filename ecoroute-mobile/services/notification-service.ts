import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function setupNotificationChannel() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('tps-critical', {
      name: 'TPS Kritis',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 300, 200, 300],
      lightColor: '#BA1A1A',
      sound: 'default',
      description: 'Notifikasi ketika TPS mencapai kapasitas kritis',
    });
  } catch (err) {
    console.warn('[Notifications] Channel setup failed:', err);
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    console.warn('[Notifications] Permission request failed:', err);
    return false;
  }
}

export async function notifyCriticalTPS(tpsName: string, fullness: number): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'TPS Kritis!',
        body: `${tpsName} sudah ${Math.round(fullness)}% penuh dan perlu segera ditangani.`,
        sound: 'default',
        data: { type: 'tps-critical' },
        ...(Platform.OS === 'android' && { channelId: 'tps-critical' }),
      },
      trigger: null,
    });
  } catch (err) {
    console.warn('[Notifications] Failed to send TPS critical notification:', err);
  }
}
