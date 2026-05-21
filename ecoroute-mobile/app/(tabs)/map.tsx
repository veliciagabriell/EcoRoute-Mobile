import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { get } from '@/utils/api';
import { TpsMapView, getRegionForPoints, type MapMarkerData } from '@/components/tps-map-view';
import { useTpsStore } from '@/stores/tps-store';
import type { TPSData, TPSStatus } from '@/types/tps';
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

type FilterKey = 'all' | 'critical' | 'warning' | 'normal';

function computeStatus(reading: SensorReading): { key: string; label: string; color: string; bg: string } {
  if (!reading) {
    return { key: 'waiting', label: 'MENUNGGU', color: '#74777F', bg: '#E5EEFF' };
  }
  const fullness = reading.fullness_pct ?? 0;
  const ammonia = reading.ammonia_ppm ?? 0;
  // Trust backend alert_level if present, otherwise compute
  const level = reading.alert_level;
  if (level === 'critical' || fullness >= 80 || ammonia >= 50) {
    return { key: 'critical', label: 'KRITIS', color: '#BA1A1A', bg: '#FFDAD6' };
  }
  if (level === 'warning' || fullness >= 60 || ammonia >= 30) {
    return { key: 'warning', label: 'WASPADA', color: '#D97706', bg: '#FEF3C7' };
  }
  return { key: 'normal', label: 'NORMAL', color: '#2E7D32', bg: '#E8F5E9' };
}

export default function TPSMapScreen() {
  const setSelectedTPSId = useTpsStore((state) => state.setSelectedTPSId);
  const upsertTPSList = useTpsStore((state) => state.upsertTPSList);
  const setNearbyTpsList = useTpsStore((state) => state.setNearbyTpsList);

  const [isLoading, setIsLoading] = useState(true);
  const [stops, setStops] = useState<MapStop[]>([]);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
        const list: any[] = data?.data || data || [];

        const mapped = list
          .map((item: any): MapStop | null => {
            const tps = item?.tps ?? item;
            const reading = item?.latestReading ?? null;
            const lat = Number(tps?.latitude);
            const lng = Number(tps?.longitude);
            if (!tps?.id || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

            return {
              id: String(tps.id),
              name: String(tps.name ?? 'TPS'),
              latitude: lat,
              longitude: lng,
              latestReading: reading
                ? {
                    fullness_pct: Number(reading.fullness_pct ?? reading.fullness ?? 0),
                    ammonia_ppm: Number(reading.ammonia_ppm ?? reading.ammonia ?? 0),
                    temperature_c: Number(reading.temperature_c ?? reading.temperature ?? 0),
                    alert_level: reading.alert_level ?? null,
                    timestamp: reading.timestamp ?? '',
                  }
                : null,
            };
          })
          .filter(Boolean) as MapStop[];

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

  const mapRegion = useMemo(() => {
    const points = stops.map((s) => ({ latitude: s.latitude, longitude: s.longitude }));
    return getRegionForPoints(points.length ? points : [{ latitude: -6.8914, longitude: 107.6107 }], 0.04);
  }, [stops]);

  const filteredStops = useMemo(() => {
    return stops.filter((stop) => {
      const status = computeStatus(stop.latestReading);
      const matchFilter =
        filter === 'all' ||
        filter === status.key ||
        // "normal" chip also shows "waiting" TPS that have no data yet
        (filter === 'normal' && status.key === 'waiting');
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
          // Map 'waiting' to 'normal' for the marker color (tps-map-view only knows 3 statuses)
          status: (status.key === 'waiting' ? 'normal' : status.key) as TPSStatus,
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
          <FilterChip label="Semua" color="#1A365D" active={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterChip label="Kritis" color="#BA1A1A" active={filter === 'critical'} onPress={() => setFilter('critical')} />
          <FilterChip label="Waspada" color="#F59E0B" active={filter === 'warning'} onPress={() => setFilter('warning')} />
          <FilterChip label="Normal" color="#4BB278" active={filter === 'normal'} onPress={() => setFilter('normal')} />
        </ScrollView>
      </View>

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
                  status.key === 'critical'
                    ? 'delete-outline'
                    : status.key === 'warning'
                    ? 'warning'
                    : status.key === 'waiting'
                    ? 'access-time'
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
