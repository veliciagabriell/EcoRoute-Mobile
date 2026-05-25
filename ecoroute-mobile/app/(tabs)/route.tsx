import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { Header } from '@/components/header';
import { ThemedText } from '@/components/themed-text';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { get } from '@/utils/api';
import { normalizeTpsList } from '@/services/tps-service';
import { TpsMapView, getRegionForPoints, type MapMarkerData } from '@/components/tps-map-view';
import { useTpsStore } from '@/stores/tps-store';
import type { TPSData } from '@/types/tps';
import { getTpsStatus, getTpsStatusVisual } from '@/utils/tps-status';
import { computeOptimalRoute, buildGoogleMapsUrl, type RouteNode } from '@/utils/dijkstra';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold
} from '@expo-google-fonts/manrope';

export default function RouteScreen() {
  const router = useRouter();
  const nearbyTpsList = useTpsStore((state) => state.nearbyTpsList);
  const [routeStops, setRouteStops] = useState<any[]>([]);
  const [routeLine, setRouteLine] = useState<{ latitude: number; longitude: number }[]>([]);
  const [summary, setSummary] = useState({ distanceKm: 0, durationMin: 0 });
  const [algorithmInfo, setAlgorithmInfo] = useState<{ algorithm: string; usedRealDistances: boolean } | null>(null);
  const [officerLocation, setOfficerLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [fontsLoaded] = useFonts({
    'Manrope': Manrope_400Regular,
    'Manrope-Medium': Manrope_500Medium,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
  });

  const manrope = { fontFamily: 'Manrope' };

  const getStopStatusVisual = useCallback((stop: any) => {
    const reading = stop?.latestReading ?? null;
    if (!reading) {
      return {
        label: 'MENUNGGU',
        color: '#74777F',
        bg: '#E5EEFF',
        severityKey: 'normal' as const,
      };
    }

    const fullnessPct = Number(reading.fullness_pct ?? 0);
    const ammoniaPpm = Number(reading.ammonia_ppm ?? 0);
    return getTpsStatusVisual(getTpsStatus(fullnessPct, ammoniaPpm, false));
  }, []);

  const cachedStops = useMemo(
    () =>
      nearbyTpsList.map((tps: TPSData) => ({
        id: tps.id,
        name: tps.name,
        latitude: tps.latitude,
        longitude: tps.longitude,
        latestReading: {
          fullness_pct: tps.fullness,
          alert_level: 'normal',
          ammonia_ppm: tps.ammonia,
          temperature_c: tps.temperature,
          timestamp: tps.lastUpdate,
        },
      })),
    [nearbyTpsList]
  );

  const mapMarkers: MapMarkerData[] = useMemo(
    () =>
      routeStops
        .filter((stop: any) => Number.isFinite(stop?.latitude) && Number.isFinite(stop?.longitude))
        .map((stop: any) => ({
          id: stop.id || stop.name,
          name: stop.name,
          latitude: Number(stop.latitude),
          longitude: Number(stop.longitude),
          status: getStopStatusVisual(stop).severityKey,
        })),
    [getStopStatusVisual, routeStops]
  );

  const mapRegion = useMemo(() => {
    const points = mapMarkers.map((marker) => ({ latitude: marker.latitude, longitude: marker.longitude }));
    return getRegionForPoints(points, 0.01);
  }, [mapMarkers]);

  // Request location permission and get officer's current GPS position.
  // Wrapped in defensive try/catch + timeout so any GPS failure never breaks
  // the route screen — the backend will fall back to default coordinates.
  useEffect(() => {
    let cancelled = false;

    const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
      new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('GPS timeout')), ms);
        promise.then(
          (value) => { clearTimeout(timer); resolve(value); },
          (err) => { clearTimeout(timer); reject(err); },
        );
      });

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || cancelled) return;

        // Try a fast last-known fix first, then fall back to a fresh fix.
        try {
          const last = await Location.getLastKnownPositionAsync();
          if (last && !cancelled) {
            setOfficerLocation({ lat: last.coords.latitude, lng: last.coords.longitude });
          }
        } catch {
          /* last-known fix unavailable */
        }

        try {
          const loc = await withTimeout(
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
            8000,
          );
          if (!cancelled) {
            setOfficerLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
          }
        } catch {
          /* fresh fix timed out — keep last-known (or null) */
        }
      } catch {
        /* permission check itself failed — fall back silently */
      }
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        // Build route API URL — include officer GPS when available
        const routeParams = new URLSearchParams({ withMaps: 'true', algorithm: 'dijkstra' });
        if (officerLocation) {
          routeParams.set('startLat', String(officerLocation.lat));
          routeParams.set('startLng', String(officerLocation.lng));
        }
        const nearbyLat = officerLocation?.lat ?? -6.89148;
        const nearbyLng = officerLocation?.lng ?? 107.6107;

        const [routeData, nearbyData, tpsData] = await Promise.all([
          get(`/routes/optimal?${routeParams.toString()}`),
          get(`/tps/nearby?lat=${nearbyLat}&lng=${nearbyLng}&radiusKm=5&limit=12`),
          get('/tps'),
        ]);

        const routeStops = (routeData?.stops || [])
          .slice()
          .sort((a: any, b: any) => (a?.order || 0) - (b?.order || 0))
          .map((stop: any) => {
            const normalized = normalizeTpsList([stop])[0];
            if (!normalized) return stop;

            return {
              ...stop,
              id: normalized.id,
              name: normalized.name,
              latitude: normalized.latitude,
              longitude: normalized.longitude,
              latestReading: normalized.latestReading,
              distanceFromPrevKm: stop?.distanceFromPrevKm ?? stop?.distance_km,
            };
          });
        const routeDistanceKm = routeData?.maps?.distance_m
          ? routeData.maps.distance_m / 1000
          : routeData?.totalDistanceKm || 0;
        const routeDurationMin = routeData?.maps?.duration_s ? routeData.maps.duration_s / 60 : 0;
        const geometry = routeData?.maps?.geometry?.coordinates || [];
        const routeLine = geometry.map((coord: [number, number]) => ({
          latitude: coord[1],
          longitude: coord[0],
        }));

        const nearbyStops = normalizeTpsList(nearbyData)
          .map((item) => ({
            id: item.id,
            name: item.name,
            latitude: item.latitude,
            longitude: item.longitude,
            latestReading: item.latestReading,
            distanceFromPrevKm: item.distanceKm,
          }))
          .filter((stop: any) => Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude));

        const tpsList = normalizeTpsList(tpsData)
          .filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
          .map((item) => ({
            id: item.id,
            name: item.name,
            latitude: item.latitude,
            longitude: item.longitude,
            latestReading: item.latestReading,
            distanceFromPrevKm: undefined,
          }));

        let preferredStops = cachedStops.length
          ? cachedStops
          : nearbyStops.length
            ? nearbyStops
            : routeStops.length
              ? routeStops
              : tpsList;
        const usingOptimalRoute = !cachedStops.length && !nearbyStops.length && routeStops.length > 0;

        // Client-side Dijkstra when the backend didn't provide an ordered route
        let clientDistanceKm = 0;
        if (!usingOptimalRoute && preferredStops.length > 1) {
          const startLat = officerLocation?.lat ?? -6.89148;
          const startLng = officerLocation?.lng ?? 107.6107;
          const nodes: RouteNode[] = preferredStops.map((s: any) => ({
            id: s.id,
            latitude: Number(s.latitude),
            longitude: Number(s.longitude),
            ...s,
          }));
          const { orderedStops, totalDistKm } = computeOptimalRoute(startLat, startLng, nodes);
          preferredStops = orderedStops;
          clientDistanceKm = totalDistKm;
        }

        const nextLine = usingOptimalRoute
          ? routeLine
          : preferredStops.map((stop: any) => ({ latitude: stop.latitude, longitude: stop.longitude }));

        if (active) {
          setRouteStops(preferredStops);
          setSummary({
            distanceKm: usingOptimalRoute ? routeDistanceKm : clientDistanceKm,
            durationMin: usingOptimalRoute ? routeDurationMin : 0,
          });
          setRouteLine(nextLine);
          if (routeData?.algorithm) {
            setAlgorithmInfo({
              algorithm: routeData.algorithm,
              usedRealDistances: routeData.usedRealDistances ?? false,
            });
          }
        }
      } catch {
        if (active) {
          setRouteStops([]);
          setSummary({ distanceKm: 0, durationMin: 0 });
          setRouteLine([]);
        }
      }
    };
    load();
    return () => { active = false; };
  }, [cachedStops, officerLocation]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1A365D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Rute Pengangkutan" 
      />

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={{ paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Text Section */}
        <View style={styles.headerTextSection}>
          <ThemedText style={[manrope, styles.mainHeading]}>Rute Optimal</ThemedText>
          <ThemedText style={[manrope, styles.subHeading]}>
            Rekomendasi jalur pengangkutan hari ini.
          </ThemedText>
          {/* Algorithm badge */}
          {algorithmInfo && (
            <View style={styles.algorithmBadgeRow}>
              <View style={[styles.algorithmBadge, algorithmInfo.algorithm === 'dijkstra' && styles.algorithmBadgeAI]}>
                <MaterialCommunityIcons
                  name={algorithmInfo.algorithm === 'dijkstra' ? 'brain' : 'routes'}
                  size={12}
                  color={algorithmInfo.algorithm === 'dijkstra' ? '#002045' : '#74777F'}
                />
                <ThemedText style={[manrope, styles.algorithmBadgeText, algorithmInfo.algorithm === 'dijkstra' && styles.algorithmBadgeTextAI]}>
                  {algorithmInfo.algorithm === 'dijkstra' ? 'AI Dijkstra' : 'Greedy'}
                </ThemedText>
              </View>
              {algorithmInfo.usedRealDistances && (
                <View style={styles.realDistBadge}>
                  <MaterialCommunityIcons name="road-variant" size={12} color="#1B6E3A" />
                  <ThemedText style={[manrope, styles.realDistBadgeText]}>Jarak Jalan Nyata</ThemedText>
                </View>
              )}
              {officerLocation && (
                <View style={styles.gpsBadge}>
                  <MaterialCommunityIcons name="crosshairs-gps" size={12} color="#7A4500" />
                  <ThemedText style={[manrope, styles.gpsBadgeText]}>Posisi GPS</ThemedText>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Map Snippet Hero */}
        <View style={styles.mapHero}>
          <View style={styles.mapPlaceholder}>
            <TpsMapView markers={mapMarkers} routeLine={routeLine} initialRegion={mapRegion} />
          </View>
        </View>

        {/* Summary Bento Box */}
        <View style={styles.summaryBento}>
          <View style={styles.bentoItem}>
            <MaterialCommunityIcons name="map-marker-distance" size={20} color="#002045" />
            <ThemedText style={[manrope, styles.bentoValue]}>{summary.distanceKm.toFixed(1)}</ThemedText>
            <ThemedText style={[manrope, styles.bentoLabel]}>JARAK (KM)</ThemedText>
          </View>
          
          <View style={styles.verticalDivider} />

          <View style={styles.bentoItem}>
            <MaterialCommunityIcons name="clock-outline" size={18} color="#002045" />
            <ThemedText style={[manrope, styles.bentoValue]}>{Math.round(summary.durationMin)}</ThemedText>
            <ThemedText style={[manrope, styles.bentoLabel]}>WAKTU (MIN)</ThemedText>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.bentoItem}>
            <MaterialCommunityIcons name="flag-outline" size={16} color="#002045" />
            <ThemedText style={[manrope, styles.bentoValue]}>{routeStops.length}</ThemedText>
            <ThemedText style={[manrope, styles.bentoLabel]}>TITIK TPS</ThemedText>
          </View>
        </View>

        {/* Route Sequence List */}
        <View style={styles.sequenceSection}>
          <ThemedText style={[manrope, styles.sequenceHeading]}>Urutan Pengambilan</ThemedText>
          
          <View style={styles.listContainer}>
            <View style={styles.connectingLine} />

            {routeStops.map((stop: any, index: number) => {
              const fullnessPct = Number(stop?.latestReading?.fullness_pct ?? 0);
              const hasReading = Boolean(stop?.latestReading);
              const visual = getStopStatusVisual(stop);
              const distance = stop?.distanceFromPrevKm;
              return (
                <RouteItem
                  key={stop.id || `${stop.name}-${index}`}
                  number={`${index + 1}`}
                  name={stop.name}
                  status={visual.label}
                  statusColor={visual.color}
                  statusBg={visual.bg}
                  desc={`${hasReading && Number.isFinite(fullnessPct) ? `${fullnessPct.toFixed(0)}%` : '-'} Penuh • ${Number.isFinite(distance) ? `${distance.toFixed(1)} km` : '-'}`}
                />
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button Area */}
      <View style={styles.floatingActionArea}>
        <TouchableOpacity
          style={styles.gmapsButton}
          onPress={() => {
            const mapsUrl = buildGoogleMapsUrl(
              officerLocation,
              routeStops.map((s: any) => ({ latitude: Number(s.latitude), longitude: Number(s.longitude) }))
            );
            if (!mapsUrl) {
              Alert.alert('Info', 'Belum ada data rute untuk dibuka di Google Maps.');
              return;
            }
            Linking.openURL(mapsUrl).catch(() =>
              Alert.alert('Error', 'Tidak dapat membuka Google Maps.')
            );
          }}
        >
          <MaterialIcons name="map" size={18} color="#002045" />
          <ThemedText style={[manrope, styles.gmapsButtonText]}>Google Maps</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.push('/map')}
        >
          <MaterialCommunityIcons name="navigation-variant" size={18} color="#FFFFFF" />
          <ThemedText style={[manrope, styles.navButtonText]}>Mulai Navigasi</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function RouteItem({ number, name, status, statusColor, statusBg, desc }: {
  number: string;
  name: string;
  status: string;
  statusColor: string;
  statusBg: string;
  desc: string;
}) {
  const manrope = { fontFamily: 'Manrope' };

  return (
    <View style={styles.routeItemRow}>
      <View style={[styles.stopCircle, { backgroundColor: statusBg }]}>
        <ThemedText style={[manrope, styles.stopNumber, { color: statusColor }]}>{number}</ThemedText>
      </View>

      <View style={styles.routeCard}>
        <View style={styles.cardHeader}>
          <ThemedText style={[manrope, styles.routeName]}>{name}</ThemedText>
          <View style={[styles.statusTag, { backgroundColor: statusBg, borderColor: 'transparent' }]}>
            <ThemedText style={[manrope, styles.statusTagText, { color: statusColor }]}>{status}</ThemedText>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <MaterialIcons name="info-outline" size={12} color="#74777F" />
          <ThemedText style={[manrope, styles.routeDesc]}>{desc}</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  scrollView: { flex: 1 },
  headerTextSection: { paddingHorizontal: 20, paddingTop: 24, marginBottom: 20 },
  mainHeading: { fontSize: 30, fontWeight: '700', color: '#0D1C2E', letterSpacing: -0.6 },
  subHeading: { fontSize: 16, color: '#74777F', marginTop: 4, fontWeight: '400' },

  algorithmBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 6 },
  algorithmBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#E8EDF5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  algorithmBadgeAI: { backgroundColor: '#DCE9FF' },
  algorithmBadgeText: { fontSize: 11, fontWeight: '600', color: '#74777F' },
  algorithmBadgeTextAI: { color: '#002045' },
  realDistBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#D4F5E2', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  realDistBadgeText: { fontSize: 11, fontWeight: '600', color: '#1B6E3A' },
  gpsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FDEFD9', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  gpsBadgeText: { fontSize: 11, fontWeight: '600', color: '#7A4500' },
  
  mapHero: {
    marginHorizontal: 20,
    height: 192,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C4C6CF',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 3,
  },
  mapPlaceholder: { flex: 1, backgroundColor: '#EFF4FF' },

  summaryBento: {
    marginHorizontal: 20,
    marginTop: -24,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(196, 198, 207, 0.5)',
    elevation: 4,
  },
  bentoItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bentoValue: { fontSize: 20, fontWeight: '700', color: '#0D1C2E', marginTop: 4 },
  bentoLabel: { fontSize: 10, fontWeight: '600', color: '#74777F', letterSpacing: 0.5, marginTop: 2 },
  verticalDivider: { width: 1, height: 40, backgroundColor: 'rgba(196, 198, 207, 0.6)' },

  sequenceSection: { paddingHorizontal: 20, marginTop: 32 },
  sequenceHeading: { fontSize: 20, fontWeight: '700', color: '#0D1C2E', marginBottom: 20 },
  listContainer: { paddingLeft: 0 },
  connectingLine: { 
    position: 'absolute', 
    left: 19, 
    top: 20, 
    bottom: 40, 
    width: 2, 
    backgroundColor: '#DCE9FF' 
  },

  routeItemRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'center' },
  stopCircle: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#F8F9FF',
    elevation: 2,
    zIndex: 2
  },
  stopNumber: { fontSize: 14, fontWeight: '800' },
  routeCard: { 
    flex: 1, 
    marginLeft: 16, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(196, 198, 207, 0.3)',
    elevation: 1
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  routeName: { fontSize: 14, fontWeight: '600', color: '#0D1C2E' },
  statusTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusTagText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  routeDesc: { fontSize: 13, color: '#74777F', marginLeft: 4, fontWeight: '400' },

  floatingActionArea: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(248,249,255,0.95)',
  },
  gmapsButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#002045',
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  gmapsButtonText: { color: '#002045', fontWeight: '700', fontSize: 14, letterSpacing: 0.2 },
  navButton: {
    flex: 2,
    backgroundColor: '#002045',
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A365D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    gap: 6,
  },
  navButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },
});
