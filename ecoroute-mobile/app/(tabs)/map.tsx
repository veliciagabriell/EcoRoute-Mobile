import React, { useState } from 'react';
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
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
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

  // 1. Load Manrope Fonts
  const [fontsLoaded] = useFonts({
    'Manrope': Manrope_400Regular,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
  });

  const manrope = { fontFamily: 'Manrope' };

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} color="#002045" />;
  }

  return (
    <View style={styles.container}>
      {/* Background Map Placeholder */}
      <View style={styles.mapContainer}>
        {/* Di sini nantinya tempat library MapView. 
            Sekarang menggunakan placeholder visual rute sesuai Figma */}
        <MapMarker top="34%" left="43%" color="#BA1A1A" text="K" isLarge />
        <MapMarker top="24%" left="18%" color="#BA1A1A" text="K" />
        <MapMarker top="49%" left="68%" color="#BA1A1A" text="K" />
        <MapMarker top="39%" left="58%" color="#4BB278" text="N" />
        <MapMarker top="44%" left="23%" color="#F59E0B" text="W" />
      </View>

      {/* Top Search & Filter Area */}
      <View style={styles.topArea}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#C4C6CF" style={styles.searchIcon} />
          <TextInput 
            placeholder="Cari TPS..." 
            placeholderTextColor="#74777F"
            style={[manrope, styles.searchInput]} 
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
          <FilterChip label="Kritis" color="#BA1A1A" />
          <FilterChip label="Waspada" color="#F59E0B" />
          <FilterChip label="Normal" color="#4BB278" />
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
          <TPSItem 
            name="TPS Kebon Jeruk #04" 
            dist="1.2 km" 
            percent="98% Penuh" 
            status="KRITIS" 
            statusColor="#BA1A1A"
            bgIcon="#FFDAD6"
          />
          <TPSItem 
            name="TPS Blok M" 
            dist="2.5 km" 
            percent="75% Penuh" 
            status="WASPADA" 
            statusColor="#D97706"
            bgIcon="#FEF3C7"
            icon="warning"
          />
        </ScrollView>
      </View>
    </View>
  );
}

// --- Sub Components ---

function MapMarker({ top, left, color, text, isLarge }: any) {
  const size = isLarge ? 40 : 32;
  return (
    <View style={[styles.markerContainer, { top, left }]}>
      <View style={[
        styles.markerPin, 
        { 
          backgroundColor: color, 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          borderBottomRightRadius: 2,
        }
      ]}>
        <ThemedText style={styles.markerText}>{text}</ThemedText>
      </View>
    </View>
  );
}

function FilterChip({ label, color }: any) {
  return (
    <TouchableOpacity style={styles.chip}>
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