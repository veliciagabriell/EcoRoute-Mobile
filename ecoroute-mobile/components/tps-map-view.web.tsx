import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { TPSStatus } from '@/types/tps';

export type MapMarkerData = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status?: TPSStatus;
};

type TpsMapViewProps = {
  markers: MapMarkerData[];
  routeLine?: { latitude: number; longitude: number }[];
  currentLocation?: { latitude: number; longitude: number };
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onMarkerPress?: (markerId: string) => void;
};

const labelForStatus = (status?: TPSStatus) => {
  if (status === 'critical') return 'Kritis';
  if (status === 'warning') return 'Perlu perhatian';
  return 'Aman';
};

export function TpsMapView({ markers, currentLocation }: TpsMapViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Peta tidak tersedia di web</Text>
      <Text style={styles.subtitle}>
        Gunakan aplikasi mobile untuk melihat peta interaktif.
      </Text>

      {currentLocation && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lokasi Anda</Text>
          <Text style={styles.cardText}>
            {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.list}>
        {markers.map((marker) => (
          <View key={marker.id} style={styles.card}>
            <Text style={styles.cardTitle}>{marker.name}</Text>
            <Text style={styles.cardText}>
              {marker.latitude.toFixed(6)}, {marker.longitude.toFixed(6)}
            </Text>
            <Text style={styles.status}>Status: {labelForStatus(marker.status)}</Text>
          </View>
        ))}

        {markers.length === 0 && (
          <Text style={styles.empty}>Belum ada data TPS untuk ditampilkan.</Text>
        )}
      </ScrollView>
    </View>
  );
}

export const getRegionForPoints = (
  points: { latitude: number; longitude: number }[],
  paddingDelta = 0.01
) => {
  const latitudes = points.map((point) => point.latitude).filter(Number.isFinite);
  const longitudes = points.map((point) => point.longitude).filter(Number.isFinite);

  if (!latitudes.length || !longitudes.length) {
    return {
      latitude: 0,
      longitude: 0,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(paddingDelta, maxLat - minLat + paddingDelta),
    longitudeDelta: Math.max(paddingDelta, maxLng - minLng + paddingDelta),
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#0F172A',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#CBD5F5',
    marginBottom: 12,
  },
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  cardTitle: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '600',
  },
  cardText: {
    color: '#9CA3AF',
    marginTop: 4,
  },
  status: {
    marginTop: 6,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  empty: {
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 12,
  },
});
