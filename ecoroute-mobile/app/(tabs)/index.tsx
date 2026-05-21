import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Header } from '@/components/header';
import { ScreenLayout } from '@/components/screen-layout';
import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'expo-router';
import { get } from '@/utils/api';

interface DashboardStats {
  tpsKritis: number;
  laporanHariIni: number;
  totalTPS: number;
  isLoading: boolean;
}

interface RecentReport {
  id?: string | number;
  description?: string;
  severity?: string;
  created_at?: string;
  createdAt?: string;
  tps?: { name?: string };
  tps_id?: string | number;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    tpsKritis: 0,
    laporanHariIni: 0,
    totalTPS: 0,
    isLoading: true,
  });
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      try {
        const tpsData = await get('/tps');
        const tpsList: any[] = tpsData?.data || tpsData || [];

        let tpsKritis = 0;
        const totalTPS = Array.isArray(tpsList) ? tpsList.length : 0;

        if (Array.isArray(tpsList)) {
          tpsList.forEach((item: any) => {
            const latest = item?.latestReading ?? item?.latest_reading ?? item?.sensor_data;
            const fullness = Number(latest?.fullness_pct ?? latest?.fullness ?? 0);
            if (fullness >= 80) tpsKritis++;
          });
        }

        if (mounted) {
          setStats(prev => ({ ...prev, tpsKritis, totalTPS }));
        }
      } catch (err) {
        console.warn('[Dashboard] TPS fetch failed:', err);
      }

      try {
        const reportsData = await get('/reports');
        const reports: any[] = reportsData?.data || reportsData || [];

        if (Array.isArray(reports)) {
          const today = new Date().toDateString();
          const todayReports = reports.filter((r: any) => {
            const dateStr = r.created_at || r.createdAt || r.date || r.timestamp;
            if (!dateStr) return false;
            return new Date(dateStr).toDateString() === today;
          });

          if (mounted) {
            setStats(prev => ({
              ...prev,
              laporanHariIni: todayReports.length > 0 ? todayReports.length : reports.length,
            }));
            setRecentReports(reports.slice(0, 4));
          }
        }
      } catch (err) {
        console.warn('[Dashboard] Reports fetch failed:', err);
      }

      if (mounted) {
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    }

    loadStats();
    return () => { mounted = false; };
  }, []);

  const statusCards = [
    {
      id: 1,
      title: 'TPS Kritis',
      count: stats.isLoading ? '...' : String(stats.tpsKritis),
      label: 'lokasi penuh (≥80%)',
      color: colors.danger,
      icon: 'warning' as const,
    },
    {
      id: 2,
      title: 'Laporan Hari Ini',
      count: stats.isLoading ? '...' : String(stats.laporanHariIni),
      label: 'laporan masuk',
      color: colors.primary,
      icon: 'assignment' as const,
    },
    {
      id: 3,
      title: 'Total TPS',
      count: stats.isLoading ? '...' : String(stats.totalTPS),
      label: 'titik pembuangan',
      color: colors.success,
      icon: 'location-on' as const,
    },
  ];

  const quickActions = [
    { id: 1, label: 'Cari TPS', icon: 'search' as const, route: '/(tabs)/explore' },
    { id: 2, label: 'Buat Laporan', icon: 'add-circle' as const, route: '/(tabs)/report' },
    { id: 3, label: 'Profil Saya', icon: 'person' as const, route: '/(tabs)/profile' },
  ];

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeStyle: 'short' }).format(date);
  };

  const getSeverityColor = (severity?: string) => {
    if (!severity) return colors.primary;
    const s = severity.toLowerCase();
    if (s === 'tinggi' || s === 'high') return colors.danger;
    if (s === 'sedang' || s === 'medium') return '#F59E0B';
    return colors.success;
  };

  return (
    <View style={styles.container}>
      <Header
        title="EcoRoute"
        showBack={false}
        onProfilePress={() => router.push('/(tabs)/profile')}
      />

      <ScreenLayout scrollable={true}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <ThemedText style={[styles.greeting, { fontFamily: 'Manrope-Bold' }]}>
            Halo, {user?.name || 'Petugas'}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary, fontFamily: 'Manrope' }]}>
            Berikut ringkasan kondisi TPS dan laporan terkini.
          </ThemedText>
        </View>

        {/* Status Cards */}
        {statusCards.map((card) => (
          <View key={card.id} style={styles.statusCardContainer}>
            <Card noPadding={true}>
              <View style={[styles.statusCardHeader, { borderBottomColor: card.color }]}>
                <View style={styles.statusCardContent}>
                  <ThemedText style={styles.statusCardTitle}>{card.title}</ThemedText>
                  <ThemedText style={[styles.statusCardCount, { color: card.color }]}>
                    {card.count}
                  </ThemedText>
                  <ThemedText style={[styles.statusCardLabel, { color: colors.textSecondary }]}>
                    {card.label}
                  </ThemedText>
                </View>
                <View style={[styles.statusCardIcon, { backgroundColor: card.color + '15' }]}>
                  <MaterialIcons name={card.icon} size={24} color={card.color} />
                </View>
              </View>
            </Card>
          </View>
        ))}


        {/* Recent Reports */}
        <View style={styles.sectionContainer}>
          <ThemedText style={styles.sectionTitle}>Laporan Terbaru</ThemedText>

          {stats.isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : recentReports.length > 0 ? (
            recentReports.map((report, index) => (
              <Card key={report.id ?? index}>
                <View style={styles.activityItem}>
                  <View
                    style={[
                      styles.activityIcon,
                      { backgroundColor: getSeverityColor(report.severity) + '20' },
                    ]}
                  >
                    <MaterialIcons
                      name="assignment"
                      size={20}
                      color={getSeverityColor(report.severity)}
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <ThemedText style={styles.activityTitle} numberOfLines={2}>
                      {report.description || report.tps?.name || 'Laporan kondisi TPS'}
                    </ThemedText>
                    <ThemedText style={[styles.activityTime, { color: colors.textSecondary }]}>
                      {formatDate(report.created_at || report.createdAt)}
                    </ThemedText>
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <Card>
              <View style={styles.emptyActivity}>
                <MaterialIcons name="inbox" size={32} color={colors.textSecondary} />
                <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Belum ada laporan terbaru.
                </ThemedText>
              </View>
            </Card>
          )}
        </View>
      </ScreenLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  statusCardContainer: {
    marginBottom: 8,
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 3,
  },
  statusCardContent: {
    flex: 1,
  },
  statusCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  statusCardCount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusCardLabel: {
    fontSize: 12,
  },
  statusCardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionCard: {
    flex: 1,
    marginHorizontal: 0,
    marginVertical: 0,
  },
  quickActionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  quickActionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    lineHeight: 20,
  },
  activityTime: {
    fontSize: 12,
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
  },
});
