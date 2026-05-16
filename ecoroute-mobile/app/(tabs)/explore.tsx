import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ImageBackground, Image } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/header';
import { useEffect, useState } from 'react';
import { get } from '@/utils/api';

export default function TPSDetailScreen() {
  const router = useRouter();
  const [tpsList, setTpsList] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await get('/tps');
        if (mounted) setTpsList(data || []);
      } catch (err) {
        console.warn('Failed to fetch TPS list', err);
      }
    }
    load();
    return () => { mounted = false };
  }, []);

  return (
    <View style={styles.container}>
      <Header title="Detail TPS" showBack={false} />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Simple TPS list fetched from backend */}
        {tpsList.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            {tpsList.map((item: any) => (
              <TouchableOpacity key={item.tps.id} style={{ padding: 12, backgroundColor: '#FFFFFF', borderRadius: 8, marginBottom: 8 }} onPress={() => router.push((`/(tabs)/explore/${item.tps.id}`) as any)}>
                <ThemedText style={{ fontWeight: '600' }}>{item.tps.name}</ThemedText>
                <ThemedText style={{ color: '#666' }}>{item.tps.area} — {item.latestReading ? `${item.latestReading.fullness_pct}%` : 'No data'}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={styles.statusBanner}>
          <View style={styles.statusIconBox}>
            <MaterialIcons name="warning" size={16} color="#FFFFFF" />
          </View>
          <View style={styles.statusTextBox}>
            <ThemedText style={styles.statusTitle}>STATUS: KRITIS</ThemedText>
            <ThemedText style={styles.statusDesc}>Kapasitas hampir penuh. Segera jadwalkan pengangkutan.</ThemedText>
          </View>
        </View>

        <View style={styles.locationCard}>
          <View style={styles.locationImagePlaceholder}>
            <ImageBackground 
              source={{ uri: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=600&auto=format&fit=crop' }} 
              style={StyleSheet.absoluteFillObject}
              imageStyle={{ borderRadius: 12 }}
            >
              <View style={styles.locationGradient} />
              <View style={styles.locationTextContainer}>
                <ThemedText style={styles.locationTitle}>TPS Kebon Jeruk #04</ThemedText>
                <View style={styles.locationAddressBox}>
                  <MaterialIcons name="location-on" size={12} color="#EFF4FF" />
                  <ThemedText style={styles.locationAddress}>Jl. Panjang Kebon Jeruk, Jakarta Barat</ThemedText>
                </View>
              </View>
            </ImageBackground>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconBox, { backgroundColor: '#FFDAD6' }]}>
                <MaterialCommunityIcons name="delete-empty" size={14} color="#BA1A1A" />
              </View>
              <ThemedText style={[styles.metricTitle, { color: '#BA1A1A' }]}>Fullness</ThemedText>
            </View>
            <View style={styles.metricRow}>
              <ThemedText style={styles.metricValueLarge}>98</ThemedText>
              <ThemedText style={styles.metricUnit}>%</ThemedText>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '98%', backgroundColor: '#BA1A1A' }]} />
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconBox, { backgroundColor: '#E5EEFF' }]}>
                <MaterialCommunityIcons name="molecule-co2" size={14} color="#43474E" />
              </View>
              <ThemedText style={styles.metricTitle}>Ammonia</ThemedText>
            </View>
            <View style={styles.metricRow}>
              <ThemedText style={styles.metricValueLarge}>67</ThemedText>
              <ThemedText style={styles.metricUnit}>ppm</ThemedText>
            </View>
            <ThemedText style={styles.metricFootnote}>Normal &lt; 50 ppm</ThemedText>
          </View>

          <View style={[styles.metricCard, { minHeight: 82 }]}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconBox, { backgroundColor: '#E5EEFF' }]}>
                <MaterialCommunityIcons name="thermometer" size={14} color="#43474E" />
              </View>
              <ThemedText style={styles.metricTitle}>Temperature</ThemedText>
            </View>
            <View style={styles.metricRow}>
              <ThemedText style={styles.metricValueLarge}>32</ThemedText>
              <ThemedText style={styles.metricUnit}>�C</ThemedText>
            </View>
          </View>

          <View style={[styles.metricCard, { minHeight: 82 }]}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconBox, { backgroundColor: '#E5EEFF' }]}>
                <MaterialIcons name="access-time" size={14} color="#43474E" />
              </View>
              <ThemedText style={styles.metricTitle}>Last Update</ThemedText>
            </View>
            <View style={styles.metricRow}>
              <ThemedText style={styles.metricValueLarge}>10:45</ThemedText>
            </View>
            <ThemedText style={styles.metricFootnote}>Hari ini</ThemedText>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <ThemedText style={styles.sectionHeading}>Estimasi Jadwal</ThemedText>
          <View style={styles.scheduleBox}>
            <View style={styles.truckIconCircle}>
              <MaterialCommunityIcons name="truck-outline" size={24} color="#86A0CD" />
            </View>
            <ThemedText style={styles.scheduleSubtitle}>Truk B-1234-XYZ</ThemedText>
            <ThemedText style={styles.scheduleText}>Sedang menuju lokasi. Perkiraan tiba dalam 15 menit.</ThemedText>
            <TouchableOpacity style={styles.outlineButton}>
              <ThemedText style={styles.outlineButtonText}>Lacak Truk</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.trendHeader}>
            <ThemedText style={styles.sectionHeading}>Tren Volume</ThemedText>
            <View style={styles.dropdownBox}>
              <ThemedText style={styles.dropdownText}>Mingguan</ThemedText>
              <MaterialIcons name="keyboard-arrow-down" size={16} color="#43474E" />
            </View>
          </View>
          <View style={styles.chartBox}>
            <View style={styles.chartPlaceholder}>
              <View style={[styles.chartBar, { height: 48, backgroundColor: 'rgba(0,32,69,0.2)' }]} />
              <View style={[styles.chartBar, { height: 66, backgroundColor: 'rgba(0,32,69,0.4)' }]} />
              <View style={[styles.chartBar, { height: 84, backgroundColor: 'rgba(0,32,69,0.6)' }]} />
              <View style={[styles.chartBar, { height: 108, backgroundColor: 'rgba(186,26,26,0.8)' }]} />
            </View>
            <View style={styles.chartDivider} />
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <ThemedText style={styles.sectionHeading}>Riwayat Pengangkutan</ThemedText>
          <View style={styles.historyTimeline}>
            <View style={styles.timelineLine} />
            
            <View style={styles.historyItem}>
              <View style={[styles.timelineDot, { borderColor: '#002045' }]} />
              <ThemedText style={styles.historyDate}>Kemarin, 15:20</ThemedText>
              <ThemedText style={styles.historyDesc}>Diangkut oleh B-9876-ABC</ThemedText>
              <View style={styles.weightBadge}>
                <MaterialCommunityIcons name="weight-kilogram" size={10} color="#0D1C2E" style={{marginRight: 4}} />
                <ThemedText style={styles.weightText}>850 kg</ThemedText>
              </View>
            </View>

            <View style={styles.historyItem}>
              <View style={styles.timelineDot} />
              <ThemedText style={styles.historyDate}>12 Okt, 14:10</ThemedText>
              <ThemedText style={styles.historyDesc}>Diangkut oleh B-1234-XYZ</ThemedText>
              <View style={styles.weightBadge}>
                <MaterialCommunityIcons name="weight-kilogram" size={10} color="#0D1C2E" style={{marginRight: 4}} />
                <ThemedText style={styles.weightText}>820 kg</ThemedText>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.fullWidthOutlineButton}>
            <ThemedText style={styles.fullWidthOutlineButtonText}>Lihat Semua Riwayat</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomActionArea}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/route')}
        >
          <MaterialCommunityIcons name="routes" size={20} color="#FFFFFF" style={{marginRight: 8}} />
          <ThemedText style={styles.actionButtonText}>Lihat Rute</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  scrollView: {
    flex: 1,
  },
  statusBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFDAD6',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 8,
    padding: 12,
    shadowColor: '#BA1A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statusIconBox: {
    width: 24,
    height: 24,
    backgroundColor: '#93000A',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  statusTextBox: {
    flex: 1,
    marginLeft: 12,
  },
  statusTitle: {
    fontFamily: 'Manrope',
    fontSize: 16,
    color: '#93000A',
    marginBottom: 4,
  },
  statusDesc: {
    fontFamily: 'Manrope',
    fontSize: 14,
    color: '#93000A',
    lineHeight: 20,
  },
  locationCard: {
    marginHorizontal: 20,
    marginTop: 24,
    height: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(196, 198, 207, 0.3)',
    shadowColor: '#1A365D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  locationImagePlaceholder: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  locationGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 28, 46, 0.6)',
  },
  locationTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  locationTitle: {
    fontFamily: 'Manrope',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  locationAddressBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationAddress: {
    fontFamily: 'Manrope',
    fontSize: 14,
    color: '#EFF4FF',
    marginLeft: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 16,
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(196, 198, 207, 0.3)',
    shadowColor: '#1A365D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    minHeight: 110,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIconBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  metricTitle: {
    fontFamily: 'Manrope',
    fontSize: 14,
    color: '#43474E',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricValueLarge: {
    fontFamily: 'Manrope',
    fontSize: 24,
    color: '#0D1C2E',
  },
  metricUnit: {
    fontFamily: 'Manrope',
    fontSize: 14,
    color: '#43474E',
    marginLeft: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E5EEFF',
    borderRadius: 3,
    marginTop: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  metricFootnote: {
    fontFamily: 'Manrope',
    fontSize: 11,
    color: '#43474E',
    marginTop: 8,
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(196, 198, 207, 0.3)',
    shadowColor: '#1A365D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeading: {
    fontFamily: 'Manrope',
    fontSize: 16,
    color: '#0D1C2E',
    marginBottom: 16,
  },
  scheduleBox: {
    backgroundColor: '#F8F9FF',
    borderWidth: 1,
    borderColor: 'rgba(196, 198, 207, 0.2)',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  truckIconCircle: {
    width: 46,
    height: 46,
    backgroundColor: '#1A365D',
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleSubtitle: {
    fontFamily: 'Manrope',
    fontSize: 16,
    color: '#0D1C2E',
    marginBottom: 4,
  },
  scheduleText: {
    fontFamily: 'Manrope',
    fontSize: 14,
    color: '#43474E',
    textAlign: 'center',
    marginBottom: 16,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#74777F',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  outlineButtonText: {
    fontFamily: 'Manrope',
    fontSize: 14,
    color: '#43474E',
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C4C6CF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dropdownText: {
    fontFamily: 'Manrope',
    fontSize: 14,
    color: '#0D1C2E',
    marginRight: 4,
  },
  chartBox: {
    backgroundColor: '#EFF4FF',
    borderWidth: 1,
    borderColor: 'rgba(196, 198, 207, 0.2)',
    borderRadius: 8,
    height: 160,
    padding: 16,
    justifyContent: 'flex-end',
  },
  chartPlaceholder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  chartBar: {
    width: 32,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  chartDivider: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    height: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.3)',
    borderStyle: 'dashed',
    zIndex: 1,
  },
  historyTimeline: {
    paddingLeft: 12,
  },
  timelineLine: {
    position: 'absolute',
    left: 20,
    top: 10,
    bottom: 20,
    width: 2,
    backgroundColor: '#E5EEFF',
  },
  historyItem: {
    paddingLeft: 32,
    paddingBottom: 24,
    position: 'relative',
  },
  timelineDot: {
    position: 'absolute',
    left: -4,
    top: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#C4C6CF',
    zIndex: 2,
  },
  historyDate: {
    fontFamily: 'Manrope',
    fontSize: 14,
    color: '#0D1C2E',
    marginBottom: 4,
  },
  historyDesc: {
    fontFamily: 'Manrope',
    fontSize: 14,
    color: '#43474E',
    marginBottom: 8,
  },
  weightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF4FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  weightText: {
    fontFamily: 'Manrope',
    fontSize: 11,
    color: '#0D1C2E',
  },
  fullWidthOutlineButton: {
    borderWidth: 1,
    borderColor: '#C4C6CF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  fullWidthOutlineButtonText: {
    fontFamily: 'Manrope',
    fontSize: 14,
    color: '#0D1C2E',
  },
  bottomActionArea: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  actionButton: {
    backgroundColor: '#002045',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 52,
    borderRadius: 12,
    shadowColor: '#1A365D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  actionButtonText: {
    fontFamily: 'Manrope',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
