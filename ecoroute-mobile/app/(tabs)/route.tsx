import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Header } from '@/components/header';
import { ThemedText } from '@/components/themed-text';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // 1. Import useRouter
import { get } from '@/utils/api';
import { TpsMapView, getRegionForPoints, type MapMarkerData } from '@/components/tps-map-view';
import { useTpsStore } from '@/stores/tps-store';
import type { TPSData } from '@/types/tps';
import { 
  useFonts, 
  Manrope_400Regular, 
  Manrope_500Medium,
  Manrope_600SemiBold, 
  Manrope_700Bold 
} from '@expo-google-fonts/manrope';

export default function RouteScreen() {
  const router = useRouter(); // 2. Inisialisasi router
  const nearbyTpsList = useTpsStore((state) => state.nearbyTpsList);
  const [routeStops, setRouteStops] = useState<any[]>([]);
  const [routeLine, setRouteLine] = useState<{ latitude: number; longitude: number }[]>([]);
  const [summary, setSummary] = useState({ distanceKm: 0, durationMin: 0 });

  const [fontsLoaded] = useFonts({
    'Manrope': Manrope_400Regular,
    'Manrope-Medium': Manrope_500Medium,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
  });

  const manrope = { fontFamily: 'Manrope' };

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
          status: stop?.latestReading?.alert_level || 'normal',
        })),
    [routeStops]
  );

  const mapRegion = useMemo(() => {
    const points = mapMarkers.map((marker) => ({ latitude: marker.latitude, longitude: marker.longitude }));
    return getRegionForPoints(points, 0.01);
  }, [mapMarkers]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [routeData, nearbyData, tpsData] = await Promise.all([
          get('/routes/optimal?withMaps=true'),
          get('/tps/nearby?lat=-6.89148&lng=107.6107&radiusKm=5&limit=12'),
          get('/tps'),
        ]);

        const routeStops = (routeData?.stops || [])
          .slice()
          .sort((a: any, b: any) => (a?.order || 0) - (b?.order || 0));
        const routeDistanceKm = routeData?.maps?.distance_m
          ? routeData.maps.distance_m / 1000
          : routeData?.totalDistanceKm || 0;
        const routeDurationMin = routeData?.maps?.duration_s ? routeData.maps.duration_s / 60 : 0;
        const geometry = routeData?.maps?.geometry?.coordinates || [];
        const routeLine = geometry.map((coord: [number, number]) => ({
          latitude: coord[1],
          longitude: coord[0],
        }));

        const nearbyStops = (nearbyData?.data || [])
          .map((item: any, index: number) => ({
            id: item?.tps?.id || `nearby-${index}`,
            name: item?.tps?.name || 'TPS',
            latitude: Number(item?.tps?.latitude),
            longitude: Number(item?.tps?.longitude),
            latestReading: item?.latestReading,
            distanceFromPrevKm: item?.distance_km,
          }))
          .filter((stop: any) => Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude));

        const tpsList = (tpsData?.data || tpsData || [])
          .map((item: any, index: number) => {
            const tps = item?.tps ?? item;
            if (!tps?.id) return null;
            const latitude = Number(tps?.latitude);
            const longitude = Number(tps?.longitude);
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
            return {
              id: String(tps.id),
              name: String(tps.name ?? `TPS ${index + 1}`),
              latitude,
              longitude,
              latestReading: item?.latestReading ?? item?.latest_reading ?? item?.sensor_data,
              distanceFromPrevKm: undefined,
            };
          })
          .filter(Boolean) as any[];

        const preferredStops = cachedStops.length
          ? cachedStops
          : nearbyStops.length
            ? nearbyStops
            : routeStops.length
              ? routeStops
              : tpsList;
        const usingOptimalRoute = !cachedStops.length && !nearbyStops.length && routeStops.length > 0;
        const nextLine = usingOptimalRoute
          ? routeLine
          : preferredStops.map((stop) => ({ latitude: stop.latitude, longitude: stop.longitude }));

        if (active) {
          setRouteStops(preferredStops);
          setSummary({
            distanceKm: usingOptimalRoute ? routeDistanceKm : 0,
            durationMin: usingOptimalRoute ? routeDurationMin : 0,
          });
          setRouteLine(nextLine);
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
  }, [cachedStops]);

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
              const level = stop?.latestReading?.alert_level || 'normal';
              const statusType = level === 'critical' ? 'danger' : level === 'warning' ? 'warning' : 'success';
              const statusLabel = level === 'critical' ? 'Kritis' : level === 'warning' ? 'Waspada' : 'Normal';
              const fullness = stop?.latestReading?.fullness_pct;
              const distance = stop?.distanceFromPrevKm;
              return (
                <RouteItem
                  key={stop.id || `${stop.name}-${index}`}
                  number={`${index + 1}`}
                  name={stop.name}
                  status={statusLabel}
                  desc={`${Number.isFinite(fullness) ? `${Number(fullness).toFixed(0)}%` : '-'} Penuh • ${Number.isFinite(distance) ? `${distance.toFixed(1)} km` : '-'}`}
                  statusType={statusType}
                />
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button Area */}
      <View style={styles.floatingActionArea}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => router.push('/map')} // 3. Arahkan ke file map.tsx
        >
          <MaterialCommunityIcons name="navigation-variant" size={18} color="#FFFFFF" />
          <ThemedText style={[manrope, styles.navButtonText]}>Mulai Navigasi</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function RouteItem({ number, name, status, desc, statusType }: any) {
  const manrope = { fontFamily: 'Manrope' };
  
  const getColors = () => {
    switch(statusType) {
      case 'danger': return { bg: '#FFDAD6', text: '#BA1A1A' };
      case 'warning': return { bg: '#FFDF99', text: '#7A5A00' };
      default: return { bg: '#91F8B8', text: '#002110' };
    }
  };

  const styleSet = getColors();

  return (
    <View style={styles.routeItemRow}>
      <View style={[styles.stopCircle, { backgroundColor: styleSet.bg }]}>
        <ThemedText style={[manrope, styles.stopNumber, { color: styleSet.text }]}>{number}</ThemedText>
      </View>
      
      <View style={styles.routeCard}>
        <View style={styles.cardHeader}>
          <ThemedText style={[manrope, styles.routeName]}>{name}</ThemedText>
          <View style={[styles.statusTag, { backgroundColor: styleSet.bg, borderColor: 'transparent' }]}>
            <ThemedText style={[manrope, styles.statusTagText, { color: styleSet.text }]}>{status}</ThemedText>
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
    padding: 20,
    paddingBottom: 30,
  },
  navButton: {
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
    elevation: 8
  },
  navButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, marginLeft: 8, letterSpacing: 0.3 },
});