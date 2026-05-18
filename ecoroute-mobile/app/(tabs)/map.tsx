import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { get } from '@/utils/api';
import { 
  useFonts, 
  Manrope_400Regular, 
  Manrope_600SemiBold, 
  Manrope_700Bold 
} from '@expo-google-fonts/manrope';

const { width, height } = Dimensions.get('window');

export default function TPSMapScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [isLoading, setIsLoading] = useState(true);
  const [routeStops, setRouteStops] = useState<any[]>([]);
  const [routeLine, setRouteLine] = useState<{ latitude: number; longitude: number }[]>([]);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'normal'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fallbackStops = useMemo(
    () => [
      {
        id: 'start-itb',
        name: 'ITB Ganesha (Start)',
        latitude: -6.89148,
        longitude: 107.6107,
        status: 'start',
        latestReading: {
          fullness_pct: 10,
          alert_level: 'normal',
        },
      },
      {
        id: 'tps-sarijadi',
        name: 'TPS Sarijadi',
        latitude: -6.8929,
        longitude: 107.6079,
        status: 'critical',
        latestReading: {
          fullness_pct: 92,
          alert_level: 'critical',
        },
      },
      {
        id: 'tps-dago',
        name: 'TPS Dago',
        latitude: -6.8952,
        longitude: 107.6131,
        status: 'warning',
        latestReading: {
          fullness_pct: 70,
          alert_level: 'warning',
        },
      },
      {
        id: 'tps-tamansari',
        name: 'TPS Tamansari (End)',
        latitude: -6.90035,
        longitude: 107.60657,
        status: 'end',
        latestReading: {
          fullness_pct: 30,
          alert_level: 'normal',
        },
      },
    ],
    []
  );

  // 1. Load Manrope Fonts
  const [fontsLoaded] = useFonts({
    'Manrope': Manrope_400Regular,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
  });

  const manrope = { fontFamily: 'Manrope' };

  useEffect(() => {
    let isActive = true;

    const loadRoute = async () => {
      setIsLoading(true);
      try {
        const [routeData, nearbyData] = await Promise.all([
          get('/routes/optimal?withMaps=true'),
          get('/tps/nearby?lat=-6.89148&lng=107.6107&radiusKm=5&limit=12'),
        ]);

        const stops = nearbyData?.data
          ?.map((item: any, index: number) => ({
            id: item?.tps?.id || `nearby-${index}`,
            name: item?.tps?.name,
            latitude: Number(item?.tps?.latitude),
            longitude: Number(item?.tps?.longitude),
            latestReading: item?.latestReading,
            distanceFromPrevKm: item?.distance_km,
          }))
          .filter((stop: any) => Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude));

        const fallbackRouteStops = routeData?.stops
          ?.map((stop: any, index: number) => ({
            ...stop,
            id: stop.id || `stop-${index}`,
          }))
          .filter((stop: any) => Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude));

        const geometry = routeData?.maps?.geometry?.coordinates || [];
        const line = geometry.map((coord: [number, number]) => ({
          latitude: coord[1],
          longitude: coord[0],
        }));

        if (isActive) {
          setRouteStops(stops?.length ? stops : (fallbackRouteStops?.length ? fallbackRouteStops : fallbackStops));
          setRouteLine(line);
        }
      } catch (err) {
        if (isActive) {
          setRouteStops(fallbackStops);
          setRouteLine([]);
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadRoute();

    return () => {
      isActive = false;
    };
  }, [fallbackStops]);

  const mapRegion = useMemo(() => {
    const points = routeStops.length ? routeStops : fallbackStops;
    const latitudes = points.map((p) => p.latitude);
    const longitudes = points.map((p) => p.longitude);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(0.01, maxLat - minLat + 0.01),
      longitudeDelta: Math.max(0.01, maxLng - minLng + 0.01),
    };
  }, [routeStops, fallbackStops]);

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} color="#002045" />;
  }

  const visibleStops = routeStops.length ? routeStops : fallbackStops;
  const polylineCoords = routeLine.length
    ? routeLine
    : visibleStops.map((stop) => ({ latitude: stop.latitude, longitude: stop.longitude }));

  const mapStatus = (stop: any) => {
    const level = stop?.latestReading?.alert_level || stop?.status || 'normal';
    if (level === 'critical') return { key: 'critical', label: 'KRITIS', color: '#BA1A1A', bg: '#FFDAD6' };
    if (level === 'warning') return { key: 'warning', label: 'WASPADA', color: '#D97706', bg: '#FEF3C7' };
    return { key: 'normal', label: 'NORMAL', color: '#2E7D32', bg: '#E8F5E9' };
  };

  const filteredStops = visibleStops.filter((stop) => {
    const status = mapStatus(stop);
  const matchFilter = filter === 'all' || status.key === filter;
    const matchSearch = stop?.name?.toLowerCase?.().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <View style={styles.container}>
      {/* OpenStreetMap View */}
      <View style={styles.mapContainer}>
        <MapView style={styles.map} initialRegion={mapRegion}>
          <UrlTile urlTemplate="https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" maximumZ={19} />
          {filteredStops.map((stop) => (
            <Marker
              key={stop.id}
              coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
              title={stop.name}
              pinColor={stop.status === 'critical' ? '#BA1A1A' : stop.status === 'warning' ? '#F59E0B' : '#4BB278'}
            />
          ))}
          <Polyline coordinates={polylineCoords} strokeColor="#1A365D" strokeWidth={4} />
        </MapView>

        {isLoading && (
          <View style={styles.mapLoadingOverlay}>
            <ActivityIndicator size="large" color="#1A365D" />
            <ThemedText style={styles.mapLoadingText}>Memuat rute...</ThemedText>
          </View>
        )}
      </View>

      {/* Top Search & Filter Area */}
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

      {/* Floating Action Button (Reports) */}
      <TouchableOpacity style={styles.fab}>
        <MaterialIcons name="report-problem" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Bottom Sheet (Peeking) */}
      <View style={styles.bottomSheet}>
        <View style={styles.dragHandle} />
        <View style={styles.sheetHeader}>
          <ThemedText style={[manrope, styles.sheetTitle]}>TPS Terdekat</ThemedText>
          <TouchableOpacity>
            <ThemedText style={[manrope, styles.viewAll]}>Lihat Semua</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.sheetList}>
          {filteredStops.map((stop, index) => {
            const status = mapStatus(stop);
            const distance = stop?.distanceFromPrevKm;
            const fullness = stop?.latestReading?.fullness_pct;
            return (
              <TPSItem
                key={stop.id || `${stop.name}-${index}`}
                name={stop.name}
                dist={Number.isFinite(distance) ? `${distance.toFixed(1)} km` : '-'}
                percent={Number.isFinite(fullness) ? `${Number(fullness).toFixed(0)}% Penuh` : '-'}
                status={status.label}
                statusColor={status.color}
                bgIcon={status.bg}
                icon={status.label === 'KRITIS' ? 'delete-outline' : status.label === 'WASPADA' ? 'warning' : 'check-circle'}
              />
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

// --- Sub Components ---

function FilterChip({ label, color, active, onPress }: any) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <View style={[styles.chipDot, { backgroundColor: color }]} />
      <ThemedText style={styles.chipText}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

function TPSItem({ name, dist, percent, status, statusColor, bgIcon, icon }: any) {
  const manrope = { fontFamily: 'Manrope' };
  return (
    <TouchableOpacity style={styles.tpsItem}>
      <View style={[styles.tpsIconContainer, { backgroundColor: bgIcon }]}>
        <MaterialIcons name={icon || "delete-outline"} size={20} color={statusColor} />
      </View>
      <View style={styles.tpsInfo}>
        <ThemedText style={[manrope, styles.tpsName]}>{name}</ThemedText>
        <View style={styles.tpsRow}>
          <MaterialIcons name="location-on" size={14} color="#74777F" />
          <ThemedText style={[manrope, styles.tpsDist]}>{dist}</ThemedText>
        </View>
      </View>
      <View style={styles.tpsStatusArea}>
        <View style={[styles.statusBadge, { backgroundColor: bgIcon }]}>
          <ThemedText style={[manrope, styles.statusText, { color: statusColor }]}>{status}</ThemedText>
        </View>
        <ThemedText style={[manrope, styles.tpsPercent]}>{percent}</ThemedText>
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
    backgroundColor: '#E5EEFF', // Placeholder warna peta
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  mapLoadingText: {
    marginTop: 8,
    color: '#1A365D',
    fontWeight: '600',
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
  markerContainer: {
    position: 'absolute',
  },
  markerPin: {
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
    shadowColor: '#1A365D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 5,
  },
  markerText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    transform: [{ rotate: '-45deg' }],
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 260, // Di atas bottom sheet peeking
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
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#002045',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0061A5',
  },
  sheetList: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  tpsItem: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(196, 198, 207, 0.2)',
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
    fontWeight: '700',
    color: '#0D1C2E',
  },
  tpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  tpsDist: {
    fontSize: 13,
    color: '#74777F',
    marginLeft: 4,
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
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tpsPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D1C2E',
    marginTop: 4,
  },
});