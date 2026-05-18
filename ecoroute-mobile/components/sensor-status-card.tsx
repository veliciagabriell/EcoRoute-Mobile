import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

export interface SensorStatus {
  tps_id: string;
  tps_name: string;
  location: {
    latitude: number;
    longitude: number;
    area: string;
  };
  sensor_data: {
    ammonia_ppm: number;
    fullness_pct: number;
    timestamp: string;
  };
  alert: {
    level: 'normal' | 'warning' | 'critical';
    color: string;
    critical: boolean;
  };
  thresholds: {
    ammonia: {
      normal: number;
      warning: number;
      critical: number;
      current: number;
      status: string;
    };
    fullness: {
      normal: number;
      warning: number;
      critical: number;
      current: number;
      status: string;
    };
  };
}

interface SensorStatusCardProps {
  sensor: SensorStatus;
  colorScheme: 'light' | 'dark';
  onPress?: () => void;
}

export function SensorStatusCard({ sensor, colorScheme, onPress }: SensorStatusCardProps) {
  const colors = Colors[colorScheme];

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'check-circle';
    }
  };

  const getAlertLabel = (level: string) => {
    switch (level) {
      case 'critical':
        return 'KRITIS';
      case 'warning':
        return 'PERINGATAN';
      default:
        return 'NORMAL';
    }
  };

  const getBackgroundColor = (level: string) => {
    switch (level) {
      case 'critical':
        return '#FF4444' + '20'; // Red with transparency
      case 'warning':
        return '#FFD700' + '20'; // Yellow with transparency
      default:
        return '#4CAF50' + '20'; // Green with transparency
    }
  };

  const getTextColor = (level: string) => {
    switch (level) {
      case 'critical':
        return '#FF4444';
      case 'warning':
        return '#FF9800';
      default:
        return '#4CAF50';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.backgroundAlt,
          borderColor: getTextColor(sensor.alert.level),
          borderWidth: 2,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Alert Header */}
      <View
        style={[
          styles.alertHeader,
          {
            backgroundColor: getBackgroundColor(sensor.alert.level),
          },
        ]}
      >
        <MaterialIcons
          name={getAlertIcon(sensor.alert.level)}
          size={24}
          color={getTextColor(sensor.alert.level)}
        />
        <ThemedText
          style={[
            styles.alertLabel,
            {
              color: getTextColor(sensor.alert.level),
              fontWeight: '700',
            },
          ]}
        >
          {getAlertLabel(sensor.alert.level)}
        </ThemedText>
      </View>

      {/* Location and Name */}
      <View style={styles.nameSection}>
        <ThemedText style={[styles.tpsName, { color: colors.textPrimary }]}>
          {sensor.tps_name}
        </ThemedText>
        <ThemedText style={[styles.areaText, { color: colors.textSecondary }]}>
          Area: {sensor.location.area}
        </ThemedText>
      </View>

      {/* Sensor Readings */}
      <View style={styles.readingsContainer}>
        {/* Ammonia Reading */}
        <View style={styles.readingItem}>
          <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
            MQ-135 (Ammonia)
          </ThemedText>
          <View style={styles.valueContainer}>
            <ThemedText
              style={[
                styles.value,
                {
                  color: getTextColor(sensor.thresholds.ammonia.status),
                },
              ]}
            >
              {sensor.sensor_data.ammonia_ppm.toFixed(2)} ppm
            </ThemedText>
            <ThemedText style={[styles.threshold, { color: colors.textSecondary }]}>
              (Batas: &lt;30 normal, &lt;50 peringatan, ≥50 kritis)
            </ThemedText>
          </View>
        </View>

        {/* Fullness Reading */}
        <View style={styles.readingItem}>
          <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
            Ultrasonic (Penuh)
          </ThemedText>
          <View style={styles.valueContainer}>
            <ThemedText
              style={[
                styles.value,
                {
                  color: getTextColor(sensor.thresholds.fullness.status),
                },
              ]}
            >
              {sensor.sensor_data.fullness_pct.toFixed(2)}%
            </ThemedText>
            <ThemedText style={[styles.threshold, { color: colors.textSecondary }]}>
              (Batas: &lt;60% normal, &lt;80% peringatan, ≥80% kritis)
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Timestamp */}
      <View style={styles.footer}>
        <ThemedText style={[styles.timestamp, { color: colors.textSecondary }]}>
          {new Date(sensor.sensor_data.timestamp).toLocaleString('id-ID')}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  alertLabel: {
    fontSize: 14,
  },
  nameSection: {
    marginBottom: 12,
  },
  tpsName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  areaText: {
    fontSize: 12,
  },
  readingsContainer: {
    gap: 12,
    marginBottom: 12,
  },
  readingItem: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  valueContainer: {
    gap: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
  threshold: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 8,
  },
  timestamp: {
    fontSize: 11,
    textAlign: 'center',
  },
});
