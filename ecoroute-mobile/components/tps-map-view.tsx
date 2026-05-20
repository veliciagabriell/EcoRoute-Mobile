import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, UrlTile, type Region } from 'react-native-maps';
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
  initialRegion: Region;
  onMarkerPress?: (markerId: string) => void;
};

const markerColorForStatus = (status?: TPSStatus) => {
  if (status === 'critical') return '#BA1A1A';
  if (status === 'warning') return '#F59E0B';
  return '#4BB278';
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
});
