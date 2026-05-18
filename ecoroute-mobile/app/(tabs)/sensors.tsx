import { View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { get } from '@/utils/api';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SensorStatusCard, SensorStatus } from '@/components/sensor-status-card';

export default function SensorMonitoringScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [sensors, setSensors] = useState<SensorStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSensorStatus = useCallback(async () => {
    try {
      setError(null);
      const data = await get('/sensors/status');
      setSensors(data);
    } catch (err) {
      console.error('Error fetching sensor status:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat status sensor');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSensorStatus();
  }, [fetchSensorStatus]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchSensorStatus();
    }, [fetchSensorStatus])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSensorStatus();
    setRefreshing(false);
  }, [fetchSensorStatus]);

  // Separate sensors by alert level
  const criticalSensors = sensors.filter(s => s.alert.level === 'critical');
  const warningSensors = sensors.filter(s => s.alert.level === 'warning');
  const normalSensors = sensors.filter(s => s.alert.level === 'normal');

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Monitor Status Sensor
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Total TPS: {sensors.length}
          </ThemedText>
        </View>

        {/* Error Message */}
        {error && (
          <View
            style={[
              styles.errorBox,
              {
                backgroundColor: colors.danger + '20',
              },
            ]}
          >
            <ThemedText style={[styles.errorText, { color: colors.danger }]}>
              ⚠️ {error}
            </ThemedText>
          </View>
        )}

        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <View
            style={[
              styles.statBox,
              {
                backgroundColor: '#FF4444' + '20',
                borderColor: '#FF4444',
              },
            ]}
          >
            <ThemedText style={[styles.statNumber, { color: '#FF4444' }]}>
              {criticalSensors.length}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
              Kritis
            </ThemedText>
          </View>
          <View
            style={[
              styles.statBox,
              {
                backgroundColor: '#FFD700' + '20',
                borderColor: '#FFD700',
              },
            ]}
          >
            <ThemedText style={[styles.statNumber, { color: '#FF9800' }]}>
              {warningSensors.length}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
              Peringatan
            </ThemedText>
          </View>
          <View
            style={[
              styles.statBox,
              {
                backgroundColor: '#4CAF50' + '20',
                borderColor: '#4CAF50',
              },
            ]}
          >
            <ThemedText style={[styles.statNumber, { color: '#4CAF50' }]}>
              {normalSensors.length}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
              Normal
            </ThemedText>
          </View>
        </View>

        {/* Critical Section */}
        {criticalSensors.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: '#FF4444' }]}>
              🔴 STATUS KRITIS ({criticalSensors.length})
            </ThemedText>
            {criticalSensors.map(sensor => (
              <SensorStatusCard
                key={sensor.tps_id}
                sensor={sensor}
                colorScheme={colorScheme ?? 'light'}
              />
            ))}
          </View>
        )}

        {/* Warning Section */}
        {warningSensors.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: '#FF9800' }]}>
              ⚠️ PERINGATAN ({warningSensors.length})
            </ThemedText>
            {warningSensors.map(sensor => (
              <SensorStatusCard
                key={sensor.tps_id}
                sensor={sensor}
                colorScheme={colorScheme ?? 'light'}
              />
            ))}
          </View>
        )}

        {/* Normal Section */}
        {normalSensors.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: '#4CAF50' }]}>
              ✓ NORMAL ({normalSensors.length})
            </ThemedText>
            {normalSensors.map(sensor => (
              <SensorStatusCard
                key={sensor.tps_id}
                sensor={sensor}
                colorScheme={colorScheme ?? 'light'}
              />
            ))}
          </View>
        )}

        {/* No Data */}
        {sensors.length === 0 && !error && (
          <View style={styles.emptyState}>
            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
              Tidak ada data sensor tersedia
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  errorBox: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
  },
});
