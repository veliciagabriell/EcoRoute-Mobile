import { useMemo, type ComponentType } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { TPSStatus } from '@/types/tps';

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

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
  initialRegion: Region;
  onMarkerPress?: (markerId: string) => void;
};

const markerColorForStatus = (status?: TPSStatus) => {
  if (status === 'critical') return '#BA1A1A';
  if (status === 'warning') return '#F59E0B';
  return '#4BB278';
};

const labelForStatus = (status?: TPSStatus) => {
  if (status === 'critical') return 'Kritis';
  if (status === 'warning') return 'Perlu perhatian';
  return 'Aman';
};

export function TpsMapView({
  markers,
  routeLine = [],
  currentLocation,
  initialRegion,
  onMarkerPress,
}: TpsMapViewProps) {
  const polylineCoords = useMemo(() => {
    if (routeLine.length > 0) return routeLine;
    return markers.map((stop) => ({ latitude: stop.latitude, longitude: stop.longitude }));
  }, [markers, routeLine]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        <Text style={styles.webTitle}>Peta tidak tersedia di web</Text>
        <Text style={styles.webSubtitle}>
          Gunakan aplikasi mobile untuk melihat peta interaktif.
        </Text>

        {currentLocation && (
          <View style={styles.webCard}>
            <Text style={styles.webCardTitle}>Lokasi Anda</Text>
            <Text style={styles.webCardText}>
              {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </Text>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.webList}>
          {markers.map((marker) => (
            <View key={marker.id} style={styles.webCard}>
              <Text style={styles.webCardTitle}>{marker.name}</Text>
              <Text style={styles.webCardText}>
                {marker.latitude.toFixed(6)}, {marker.longitude.toFixed(6)}
              </Text>
              <Text style={styles.webStatus}>Status: {labelForStatus(marker.status)}</Text>
            </View>
          ))}
          {markers.length === 0 && (
            <Text style={styles.webEmpty}>Belum ada data TPS untuk ditampilkan.</Text>
          )}
        </ScrollView>
      </View>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const MapViewModule = require('react-native-maps');
  const MapView = MapViewModule.default as ComponentType<any>;
  const { Marker, Polyline, UrlTile } = MapViewModule as {
    Marker: ComponentType<any>;
    Polyline: ComponentType<any>;
    UrlTile: ComponentType<any>;
  };

  return (
    <MapView style={styles.map} initialRegion={initialRegion}>
      <UrlTile urlTemplate="https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" maximumZ={19} />

      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
          title={marker.name}
          pinColor={markerColorForStatus(marker.status)}
          onPress={() => onMarkerPress?.(marker.id)}
        />
      ))}

      {currentLocation && (
        <Marker
          key="current-location"
          coordinate={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude }}
          title="Lokasi Anda"
          pinColor="#1A365D"
        />
      )}

      {polylineCoords.length > 1 && (
        <Polyline coordinates={polylineCoords} strokeColor="#1A365D" strokeWidth={4} />
      )}
    </MapView>
  );
}

export const getRegionForPoints = (
  points: { latitude: number; longitude: number }[],
  paddingDelta = 0.01
): Region => {
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
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  webContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#0F172A',
  },
  webTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  webSubtitle: {
    fontSize: 13,
    color: '#CBD5F5',
    marginBottom: 12,
  },
  webList: {
    gap: 12,
    paddingBottom: 24,
  },
  webCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  webCardTitle: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '600',
  },
  webCardText: {
    color: '#9CA3AF',
    marginTop: 4,
  },
  webStatus: {
    marginTop: 6,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  webEmpty: {
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 12,
  },
});
