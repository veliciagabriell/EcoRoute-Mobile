import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { getSensorStatuses } from '@/services/tps-service';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

interface AlertSummary {
  criticalCount: number;
  warningCount: number;
  normalCount: number;
  totalCount: number;
}

interface AlertSummaryWidgetProps {
  colorScheme: 'light' | 'dark';
  onCriticalPress?: () => void;
  onWarningPress?: () => void;
}

export function AlertSummaryWidget({ colorScheme, onCriticalPress, onWarningPress }: AlertSummaryWidgetProps) {
  const colors = Colors[colorScheme];
  const [summary, setSummary] = useState<AlertSummary>({
    criticalCount: 0,
    warningCount: 0,
    normalCount: 0,
    totalCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlertSummary();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAlertSummary, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlertSummary = async () => {
    try {
      const data = await getSensorStatuses();
      const critical = data.filter((s) => s.alert.level === 'critical').length;
      const warning = data.filter((s) => s.alert.level === 'warning').length;
      const normal = data.filter((s) => s.alert.level === 'normal').length;
      setSummary({
        criticalCount: critical,
        warningCount: warning,
        normalCount: normal,
        totalCount: data.length,
      });
    } catch (err) {
      console.error('Error fetching alert summary:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.title, { color: colors.textPrimary }]}>
        ⚡ Status Sensor Realtime
      </ThemedText>

      <View style={styles.alertsGrid}>
        {/* Critical Alert Card */}
        <TouchableOpacity
          style={[
            styles.alertCard,
            {
              backgroundColor: '#FF4444' + '15',
              borderColor: '#FF4444',
              borderWidth: 2,
            },
          ]}
          onPress={onCriticalPress}
          activeOpacity={0.7}
        >
          <View style={styles.alertContent}>
            <MaterialIcons name="error" size={28} color="#FF4444" />
            <ThemedText style={[styles.alertCount, { color: '#FF4444' }]}>
              {summary.criticalCount}
            </ThemedText>
          </View>
          <ThemedText style={[styles.alertLabel, { color: colors.textSecondary }]}>
            Kritis
          </ThemedText>
        </TouchableOpacity>

        {/* Warning Alert Card */}
        <TouchableOpacity
          style={[
            styles.alertCard,
            {
              backgroundColor: '#FFD700' + '15',
              borderColor: '#FFD700',
              borderWidth: 2,
            },
          ]}
          onPress={onWarningPress}
          activeOpacity={0.7}
        >
          <View style={styles.alertContent}>
            <MaterialIcons name="warning" size={28} color="#FF9800" />
            <ThemedText style={[styles.alertCount, { color: '#FF9800' }]}>
              {summary.warningCount}
            </ThemedText>
          </View>
          <ThemedText style={[styles.alertLabel, { color: colors.textSecondary }]}>
            Peringatan
          </ThemedText>
        </TouchableOpacity>

        {/* Normal Status Card */}
        <TouchableOpacity
          style={[
            styles.alertCard,
            {
              backgroundColor: '#4CAF50' + '15',
              borderColor: '#4CAF50',
              borderWidth: 2,
            },
          ]}
          activeOpacity={0.7}
        >
          <View style={styles.alertContent}>
            <MaterialIcons name="check-circle" size={28} color="#4CAF50" />
            <ThemedText style={[styles.alertCount, { color: '#4CAF50' }]}>
              {summary.normalCount}
            </ThemedText>
          </View>
          <ThemedText style={[styles.alertLabel, { color: colors.textSecondary }]}>
            Normal
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ThemedText style={[styles.totalText, { color: colors.textSecondary }]}>
        Total TPS: {summary.totalCount}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  alertsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  alertCard: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  alertContent: {
    alignItems: 'center',
    marginBottom: 8,
  },
  alertCount: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  alertLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  totalText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
