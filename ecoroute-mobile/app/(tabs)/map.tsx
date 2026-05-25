import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { get } from '@/utils/api';
import { normalizeTpsList } from '@/services/tps-service';
import * as Location from 'expo-location';
import { TpsMapView, getRegionForPoints, type MapMarkerData } from '@/components/tps-map-view';
import { useTpsStore } from '@/stores/tps-store';
import type { TPSData, TPSStatus } from '@/types/tps';
import { getTpsStatus, getTpsStatusVisual, type TpsStatusKey } from '@/utils/tps-status';
import { computeOptimalRoute, buildGoogleMapsUrl, type RouteNode } from '@/utils/dijkstra';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';

type SensorReading = {
  fullness_pct: number;
  ammonia_ppm: number;
  temperature_c: number;
  alert_level: string | null;
  timestamp: string;
} | null;

type MapStop = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  latestReading: SensorReading;
};

type FilterKey = 'all' | TpsStatusKey | 'MENUNGGU';

function computeStatus(reading: SensorReading): { key: FilterKey; label: string; color: string; bg: string } {
  if (!reading) {
    return { key: 'MENUNGGU', label: 'MENUNGGU', color: '#74777F', bg: '#E5EEFF' };
  }
  const fullness = reading.fullness_pct ?? 0;
  const ammonia = reading.ammonia_ppm ?? 0;
  const statusKey = getTpsStatus(fullness, ammonia, false);
  const visual = getTpsStatusVisual(statusKey);
  return { key: statusKey, label: visual.label, color: visual.color, bg: visual.bg };
}

function tpsStatusToMarkerStatus(key: FilterKey): 'critical' | 'warning' | 'normal' {
  if (key === 'DARURAT' || key === 'PENUH' || key === 'BAU_EKSTREM') return 'critical';
  if (key === 'PERINGATAN') return 'warning';
  return 'normal';
}

export default function TPSMapScreen() {
  const setSelectedTPSId = useTpsStore((state) => state.setSelectedTPSId);
  const upsertTPSList = useTpsStore((state) => state.upsertTPSList);
  const setNearbyTpsList = useTpsStore((state) => state.setNearbyTpsList);

  const [isLoading, setIsLoading] = useState(true);
  const [stops, setStops] = useState<MapStop[]>([]);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [officerLocation, setOfficerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [dijkstraRoute, setDijkstraRoute] = useState<{ latitude: number; longitude: number }[]>([]);
  const [dijkstraDistKm, setDijkstraDistKm] = useState(0);

  const [fontsLoaded] = useFonts({
    Manrope: Manrope_400Regular,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
  });

  const manrope = { fontFamily: 'Manrope' };

  // Load TPS from backend (same source as explore.tsx) — refresh every 60s
  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const data = await get('/tps');
        const mapped = normalizeTpsList(data)
          .filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
          .map((item): MapStop => ({
            id: item.id,
            name: item.name,
            latitude: item.latitude,
            longitude: item.longitude,
            latestReading: item.latestReading,
          }));

        if (isActive) {
          setStops(mapped);
          // Sync to global store for other screens
          const storeData = mapped.map((s): TPSData => ({
            id: s.id,
            name: s.name,
            fullness: s.latestReading?.fullness_pct ?? 0,
            ammonia: s.latestReading?.ammonia_ppm ?? 0,
            temperature: s.latestReading?.temperature_c ?? 0,
            lastUpdate: s.latestReading?.timestamp ?? '',
            latitude: s.latitude,
            longitude: s.longitude,
          }));
          upsertTPSList(storeData);
          setNearbyTpsList(storeData);
        }
      } catch (err) {
        console.warn('[Map] Gagal memuat TPS:', err);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    setIsLoading(true);
    load();
    const interval = setInterval(load, 60_000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [upsertTPSList, setNearbyTpsList]);

  // Get officer GPS and compute Dijkstra route whenever stops change
  useEffect(() => {
    let cancelled = false;

    (async () => {
      let lat = -6.89148;
      let lng = 107.6107;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          try {
            const last = await Location.getLastKnownPositionAsync();
            if (last) { lat = last.coords.latitude; lng = last.coords.longitude; }
          } catch { /* ignore */ }
          try {
            const loc = await Promise.race([
              Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
              new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
            ]) as Location.LocationObject;
            lat = loc.coords.latitude;
            lng = loc.coords.longitude;
          } catch { /* keep last known */ }
        }
      } catch { /* no permission, use default */ }

      if (cancelled || stops.length === 0) return;

      if (!cancelled) setOfficerLocation({ lat, lng });

      const nodes: RouteNode[] = stops.map((s) => ({
        id: s.id,
        latitude: s.latitude,
        longitude: s.longitude,
      }));

      const { orderedStops, totalDistKm } = computeOptimalRoute(lat, lng, nodes);
      if (!cancelled) {
        setDijkstraRoute(orderedStops.map((s) => ({ latitude: s.latitude, longitude: s.longitude })));
        setDijkstraDistKm(totalDistKm);
      }
    })();

    return () => { cancelled = true; };
  }, [stops]);

  const mapRegion = useMemo(() => {
    const points = stops.map((s) => ({ latitude: s.latitude, longitude: s.longitude }));
    return getRegionForPoints(points.length ? points : [{ latitude: -6.8914, longitude: 107.6107 }], 0.04);
  }, [stops]);

  const filteredStops = useMemo(() => {
    return stops.filter((stop) => {
      const status = computeStatus(stop.latestReading);
      // NORMAL filter also shows MENUNGGU (no reading yet)
      const matchFilter =
        filter === 'all' ||
        filter === status.key ||
        (filter === 'NORMAL' && status.key === 'MENUNGGU');
      const matchSearch = stop.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [stops, filter, searchQuery]);

  const markers: MapMarkerData[] = useMemo(
    () =>
      filteredStops.map((stop) => {
        const status = computeStatus(stop.latestReading);
        return {
          id: stop.id,
          name: stop.name,
          latitude: stop.latitude,
          longitude: stop.longitude,
          status: tpsStatusToMarkerStatus(status.key) as TPSStatus,
        };
      }),
    [filteredStops]
  );

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} color="#002045" />;
  }

  return (
    <View style={styles.container}>
      {/* Full-screen map */}
      <View style={styles.mapContainer}>
        <TpsMapView
          markers={markers}
          routeLine={dijkstraRoute}
          currentLocation={officerLocation ? { latitude: officerLocation.lat, longitude: officerLocation.lng } : undefined}
          initialRegion={mapRegion}
          onMarkerPress={(markerId) => setSelectedTPSId(markerId)}
        />

        {isLoading && (
          <View style={styles.mapLoadingOverlay}>
            <ActivityIndicator size="large" color="#1A365D" />
            <ThemedText style={styles.mapLoadingText}>Memuat data TPS...</ThemedText>
          </View>
        )}

        {!isLoading && stops.length === 0 && (
          <View style={styles.mapLoadingOverlay}>
            <MaterialIcons name="wifi-off" size={36} color="#74777F" />
            <ThemedText style={styles.mapLoadingText}>Tidak ada data TPS</ThemedText>
          </View>
        )}
      </View>

      {/* Search + filter chips */}
      <View style={styles.topArea}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#C4C6CF" style={styles.searchIcon} />
          <TextInput
            placeholder="Cari TPS..."
            placeholderTextColor="#74777F"
            style={[manrope, styles.searchInput]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.tuneButton}>
            <MaterialIcons name="tune" size={18} color="#002045" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          <FilterChip label="Semua"        color="#1A365D" active={filter === 'all'}               onPress={() => setFilter('all')} />
          <FilterChip label="Darurat"      color="#93000A" active={filter === 'DARURAT'}          onPress={() => setFilter('DARURAT')} />
          <FilterChip label="Penuh"        color="#BA1A1A" active={filter === 'PENUH'}             onPress={() => setFilter('PENUH')} />
          <FilterChip label="Bau Ekstrem"  color="#7A4500" active={filter === 'BAU_EKSTREM'}      onPress={() => setFilter('BAU_EKSTREM')} />
          <FilterChip label="Peringatan"   color="#7A5A00" active={filter === 'PERINGATAN'}       onPress={() => setFilter('PERINGATAN')} />
          <FilterChip label="Normal"       color="#4BB278" active={filter === 'NORMAL'}            onPress={() => setFilter('NORMAL')} />
        </ScrollView>
      </View>

      {/* Dijkstra route info + Google Maps button */}
      {dijkstraRoute.length > 1 && (
        <View style={styles.routeInfoBar}>
          <View style={styles.routeInfoBadge}>
            <MaterialCommunityIcons name="brain" size={13} color="#002045" />
            <ThemedText style={[manrope, styles.routeInfoText]}>
              Dijkstra · {dijkstraDistKm.toFixed(1)} km · {stops.length} TPS
            </ThemedText>
          </View>
          <TouchableOpacity
            style={styles.gmapsBtn}
            onPress={() => {
              const url = buildGoogleMapsUrl(
                officerLocation,
                dijkstraRoute
              );
              if (!url) return;
              Linking.openURL(url).catch(() =>
                Alert.alert('Error', 'Tidak dapat membuka Google Maps.')
              );
            }}
          >
            <MaterialIcons name="map" size={15} color="#FFFFFF" />
            <ThemedText style={[manrope, styles.gmapsBtnText]}>Buka Google Maps</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <MaterialIcons name="report-problem" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Bottom sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.dragHandle} />
        <View style={styles.sheetHeader}>
          <ThemedText style={[manrope, styles.sheetTitle]}>
            Daftar TPS {stops.length > 0 ? `(${stops.length})` : ''}
          </ThemedText>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <ThemedText style={[manrope, styles.liveText]}>Live</ThemedText>
          </View>
        </View>

        <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
          {filteredStops.length === 0 && !isLoading && (
            <ThemedText style={[manrope, styles.emptyText]}>
              {stops.length === 0
                ? 'Menunggu data dari server...'
                : 'Tidak ada TPS yang sesuai filter.'}
            </ThemedText>
          )}
          {filteredStops.map((stop, index) => {
            const status = computeStatus(stop.latestReading);
            const fullness = stop.latestReading?.fullness_pct;
            const hasData = stop.latestReading !== null;
            return (
              <TPSItem
                key={stop.id || `${stop.name}-${index}`}
                name={stop.name}
                percent={hasData && Number.isFinite(fullness) ? `${Number(fullness).toFixed(0)}% Penuh` : 'Menunggu data'}
                status={status.label}
                statusColor={status.color}
                bgIcon={status.bg}
                icon={
                  status.key === 'DARURAT'            ? 'warning'
                  : status.key === 'PENUH'            ? 'delete-outline'
                  : status.key === 'BAU_EKSTREM'      ? 'air'
                  : status.key === 'PERINGATAN'       ? 'report-problem'
                  : status.key === 'NORMAL_MQ135_ERROR' ? 'sensors-off'
                  : status.key === 'MENUNGGU'         ? 'access-time'
                  : 'check-circle'
                }
                onPress={() => setSelectedTPSId(stop.id)}
              />
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

function FilterChip({ label, color, active, onPress }: { label: string; color: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <View style={[styles.chipDot, { backgroundColor: color }]} />
      <ThemedText style={styles.chipText}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

function TPSItem({
  name,
  percent,
  status,
  statusColor,
  bgIcon,
  icon,
  onPress,
}: {
  name: string;
  percent: string;
  status: string;
  statusColor: string;
  bgIcon: string;
  icon: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.tpsItem} onPress={onPress}>
      <View style={[styles.tpsIconContainer, { backgroundColor: bgIcon }]}>
        <MaterialIcons name={icon as any} size={20} color={statusColor} />
      </View>
      <View style={styles.tpsInfo}>
        <ThemedText style={styles.tpsName}>{name}</ThemedText>
        <ThemedText style={styles.tpsPercent}>{percent}</ThemedText>
      </View>
      <View style={styles.tpsStatusArea}>
        <View style={[styles.statusBadge, { backgroundColor: bgIcon }]}>
          <ThemedText style={[styles.statusText, { color: statusColor }]}>{status}</ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E5EEFF',
  },
  mapLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    gap: 8,
  },
  mapLoadingText: {
    marginTop: 8,
    color: '#1A365D',
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
  },
  topArea: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#1A365D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0D1C2E',
    fontFamily: 'Manrope',
  },
  tuneButton: {
    padding: 4,
  },
  filterContainer: {
    marginTop: 16,
    paddingLeft: 20,
  },
  filterContent: {
    paddingRight: 40,
    gap: 12,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(196, 198, 207, 0.3)',
    shadowColor: '#1A365D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    elevation: 2,
  },
  chipActive: {
    borderColor: '#1A365D',
    borderWidth: 1.5,
  },
  chipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  chipText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: '#0D1C2E',
  },
  routeInfoBar: {
    position: 'absolute',
    right: 20,
    bottom: 320,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#1A365D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  routeInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  routeInfoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#002045',
  },
  gmapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 5,
  },
  gmapsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 260,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#002045',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A365D',
    shadowOpacity: 0.2,
    elevation: 4,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 240,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#1A365D',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 10,
  },
  dragHandle: {
    width: 48,
    height: 6,
    backgroundColor: 'rgba(196, 198, 207, 0.4)',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: 'Manrope-Bold',
    color: '#002045',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4BB278',
  },
  liveText: {
    fontSize: 12,
    fontFamily: 'Manrope-SemiBold',
    color: '#4BB278',
  },
  sheetList: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#74777F',
    textAlign: 'center',
    marginTop: 16,
    fontFamily: 'Manrope',
  },
  tpsItem: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(196, 198, 207, 0.2)',
    alignItems: 'center',
  },
  tpsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tpsInfo: {
    flex: 1,
    marginLeft: 12,
  },
  tpsName: {
    fontSize: 15,
    fontFamily: 'Manrope-Bold',
    color: '#0D1C2E',
  },
  tpsPercent: {
    fontSize: 13,
    fontFamily: 'Manrope',
    color: '#74777F',
    marginTop: 2,
  },
  tpsStatusArea: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Manrope-Bold',
    letterSpacing: 0.5,
  },
});
