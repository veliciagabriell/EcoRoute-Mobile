import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Header } from '@/components/header';
import { ThemedText } from '@/components/themed-text';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { 
  useFonts, 
  Manrope_400Regular, 
  Manrope_600SemiBold, 
  Manrope_700Bold 
} from '@expo-google-fonts/manrope';

const { width } = Dimensions.get('window');

export default function TPSDetailScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [fontsLoaded] = useFonts({
    'Manrope': Manrope_400Regular,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
  });

  const manrope = { fontFamily: 'Manrope' };

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
        title="Detail TPS" 
        showBack={true}
        onMenuPress={() => console.log('Menu pressed')}
      />

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Status Banner */}
        <View style={styles.statusBanner}>
          <MaterialIcons name="error-outline" size={22} color="#93000A" style={styles.bannerIcon} />
          <View style={styles.bannerTextContainer}>
            <ThemedText style={[manrope, styles.statusTitle]}>STATUS: KRITIS</ThemedText>
            <ThemedText style={[manrope, styles.statusSubtitle]}>
              Kapasitas hampir penuh. Segera jadwalkan pengangkutan.
            </ThemedText>
          </View>
        </View>

        {/* Hero Image / Map Placeholder */}
        <View style={styles.heroCard}>
          <View style={styles.mapPlaceholder}>
             <View style={styles.mapOverlay}>
                <ThemedText style={[manrope, styles.tpsTitle]}>TPS Kebon Jeruk #04</ThemedText>
                <View style={styles.locationContainer}>
                   <MaterialIcons name="location-on" size={14} color="#EFF4FF" />
                   <ThemedText style={[manrope, styles.locationText]}>Jl. Panjang Kebon Jeruk, Jakarta Barat</ThemedText>
                </View>
             </View>
          </View>
        </View>

        {/* 2x2 Metrics Grid - Berdasarkan Desain Baru */}
        <View style={styles.metricsGrid}>
          
          {/* Card: Fullness */}
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <MaterialCommunityIcons name="delete-outline" size={24} color="#BA1A1A" />
              <ThemedText style={[manrope, styles.metricLabel, { color: '#BA1A1A' }]}>Fullness</ThemedText>
            </View>
            <ThemedText style={[manrope, styles.metricValue]}>85%</ThemedText>
            <View style={styles.segmentedProgressContainer}>
              <View style={[styles.segment, { backgroundColor: '#BA1A1A' }]} />
              <View style={[styles.segment, { backgroundColor: '#BA1A1A' }]} />
              <View style={[styles.segment, { backgroundColor: '#BA1A1A' }]} />
              <View style={[styles.segment, { backgroundColor: '#E5EEFF' }]} />
            </View>
          </View>

          {/* Card: Ammonia */}
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <MaterialCommunityIcons name="beaker-outline" size={24} color="#43474E" />
              <ThemedText style={[manrope, styles.metricLabel]}>Ammonia</ThemedText>
            </View>
            <ThemedText style={[manrope, styles.metricValue]}>
              67 <ThemedText style={styles.unitText}>ppm</ThemedText>
            </ThemedText>
            <ThemedText style={[manrope, styles.metricHint]}>Normal {"<"} 50 ppm</ThemedText>
          </View>

          {/* Card: Temperature */}
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <MaterialCommunityIcons name="thermometer-lines" size={24} color="#43474E" />
              <ThemedText style={[manrope, styles.metricLabel]}>Temperature</ThemedText>
            </View>
            <ThemedText style={[manrope, styles.metricValue]}>32°C</ThemedText>
          </View>

          {/* Card: Last Update */}
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <MaterialCommunityIcons name="history" size={24} color="#43474E" />
              <ThemedText style={[manrope, styles.metricLabel]}>Last Update</ThemedText>
            </View>
            <ThemedText style={[manrope, styles.metricValue]}>10:45</ThemedText>
            <ThemedText style={[manrope, styles.metricHint]}>Hari ini</ThemedText>
          </View>

        </View>

        {/* Estimasi Jadwal Section */}
        <View style={styles.sectionCard}>
          <ThemedText style={[manrope, styles.sectionTitle]}>Estimasi Jadwal</ThemedText>
          <View style={styles.innerGrayCard}>
            <View style={styles.truckIconContainer}>
              <MaterialCommunityIcons name="truck-delivery" size={24} color="#86A0CD" />
            </View>
            <ThemedText style={[manrope, styles.truckPlate]}>Truk B-1234-XYZ</ThemedText>
            <ThemedText style={[manrope, styles.truckTime]}>Dijadwalkan tiba dalam{"\n"}15 Menit (11:00 AM)</ThemedText>
            <TouchableOpacity style={styles.outlineButton}>
              <ThemedText style={[manrope, styles.outlineButtonText]}>Lacak Truk</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Riwayat Section */}
        <View style={styles.sectionCard}>
          <ThemedText style={[manrope, styles.sectionTitle]}>Riwayat Pengangkutan</ThemedText>
          <View style={styles.timelineContainer}>
            <View style={styles.timelineLine} />
            <View style={styles.historyItem}>
              <View style={[styles.timelineDot, { borderColor: '#002045' }]} />
              <ThemedText style={[manrope, styles.historyDate]}>Kemarin, 15:20</ThemedText>
              <ThemedText style={[manrope, styles.historyDesc]}>Diangkut oleh B-9876-ABC</ThemedText>
              <View style={styles.volumeBadge}>
                <MaterialCommunityIcons name="scale" size={12} color="#0D1C2E" />
                <ThemedText style={[manrope, styles.volumeText]}>2.4 Ton</ThemedText>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.textButton}>
            <ThemedText style={[manrope, styles.textButtonLabel]}>Lihat Semua Riwayat</ThemedText>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* STICKY BOTTOM ACTION BUTTON */}
      <View style={styles.bottomActionContainer}>
        <TouchableOpacity 
          style={styles.mainActionButton}
          onPress={() => router.push('/route')}
        >
          <MaterialCommunityIcons name="map-marker-path" size={28} color="#FFFFFF" />
          <ThemedText style={[manrope, styles.mainActionButtonText]}>Lihat Rute</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  scrollView: { flex: 1 },
  statusBanner: {
    margin: 20,
    backgroundColor: '#FFDAD6',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    elevation: 2,
  },
  bannerIcon: { marginRight: 12, marginTop: 2 },
  bannerTextContainer: { flex: 1 },
  statusTitle: { color: '#93000A', fontWeight: '700', fontSize: 14, marginBottom: 4 },
  statusSubtitle: { color: '#93000A', fontSize: 14, lineHeight: 20 },
  heroCard: {
    marginHorizontal: 20,
    height: 256,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(196, 198, 207, 0.3)',
  },
  mapPlaceholder: { flex: 1, backgroundColor: '#E5EEFF', justifyContent: 'flex-end' },
  mapOverlay: { height: 84, backgroundColor: 'rgba(13, 28, 46, 0.8)', padding: 16 },
  tpsTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  locationContainer: { flexDirection: 'row', alignItems: 'center' },
  locationText: { color: '#EFF4FF', fontSize: 14, marginLeft: 4 },
  
  // Metrics Grid Updated
  metricsGrid: {
    marginHorizontal: 20,
    marginTop: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: (width - 56) / 2,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#1A365D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  metricHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  metricLabel: { fontSize: 18, fontWeight: '400', color: '#43474E', marginLeft: 8 },
  metricValue: { fontSize: 24, fontWeight: '700', color: '#0D1C2E', textAlign: 'left' },
  unitText: { fontSize: 18, fontWeight: '400', color: '#43474E' },
  metricHint: { fontSize: 14, color: '#74777F', marginTop: 4 },
  
  // Segmented Progress Bar
  segmentedProgressContainer: { flexDirection: 'row', height: 6, marginTop: 12, gap: 4 },
  segment: { flex: 1, borderRadius: 2 },

  sectionCard: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(196, 198, 207, 0.3)',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0D1C2E', marginBottom: 16 },
  innerGrayCard: { backgroundColor: '#F8F9FF', borderRadius: 8, padding: 16, alignItems: 'center' },
  truckIconContainer: {
    backgroundColor: '#1A365D',
    width: 46,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  truckPlate: { fontSize: 16, fontWeight: '600', color: '#0D1C2E', marginBottom: 4 },
  truckTime: { fontSize: 14, color: '#43474E', textAlign: 'center', marginBottom: 16 },
  outlineButton: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#74777F',
    alignItems: 'center',
  },
  outlineButtonText: { color: '#43474E', fontWeight: '600' },
  timelineContainer: { marginLeft: 12, paddingLeft: 24 },
  timelineLine: { position: 'absolute', left: 0, top: 4, bottom: 20, width: 2, backgroundColor: '#E5EEFF' },
  historyItem: { marginBottom: 24 },
  timelineDot: {
    position: 'absolute',
    left: -31,
    top: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#C4C6CF',
  },
  historyDate: { fontSize: 15, color: '#0D1C2E', fontWeight: '600' },
  historyDesc: { fontSize: 14, color: '#43474E', marginTop: 2 },
  volumeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF4FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  volumeText: { fontSize: 11, color: '#0D1C2E', fontWeight: '700', marginLeft: 4 },
  textButton: { alignItems: 'center', paddingTop: 8 },
  textButtonLabel: { color: '#002045', fontWeight: '700', fontSize: 18 },
  bottomActionContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 20,
    backgroundColor: 'rgba(248, 249, 255, 0.9)',
  },
  mainActionButton: {
    backgroundColor: '#002045',
    height: 60,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  mainActionButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 18, marginLeft: 12 },
});