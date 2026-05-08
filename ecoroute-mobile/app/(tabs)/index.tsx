import { View, StyleSheet, ScrollView } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Header } from '@/components/header';
import { ScreenLayout } from '@/components/screen-layout';
import { Card } from '@/components/card';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { MaterialIcons } from '@expo/vector-icons';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const statusCards = [
    {
      id: 1,
      title: 'TPS Kritis',
      count: 12,
      label: 'locations',
      color: colors.danger,
      icon: 'warning' as const,
    },
    {
      id: 2,
      title: 'Laporan Hari Ini',
      count: 45,
      label: 'reports',
      color: colors.primary,
      icon: 'assignment' as const,
    },
    {
      id: 3,
      title: 'Armada Aktif',
      count: 8,
      label: 'trucks online',
      color: colors.success,
      icon: 'local-shipping' as const,
    },
  ];

  const quickActions = [
    { id: 1, label: 'Cari TPS', icon: 'search' as const },
    { id: 2, label: 'Buat Laporan', icon: 'add-circle' as const },
    { id: 3, label: 'Chat EcoBot', icon: 'chat' as const },
  ];

  const recentActivities = [
    {
      id: 1,
      title: 'Truck 04 completed collection at Zone B.',
      time: '10 mins ago',
      icon: 'check-circle' as const,
    },
    {
      id: 2,
      title: 'TPS Central reported full capacity.',
      time: '32 mins ago',
      icon: 'warning' as const,
    },
    {
      id: 3,
      title: 'Route Optimization triggered for Sector 7.',
      time: '1 hour ago',
      icon: 'map' as const,
    },
    {
      id: 4,
      title: 'Truck 02 completed collection at Zone A.',
      time: '2 hours ago',
      icon: 'check-circle' as const,
    },
  ];

  return (
    <View style={styles.container}>
      <Header 
        title="EcoRoute" 
        showBack={false}
        onMenuPress={() => console.log('Menu pressed')}
        onProfilePress={() => console.log('Profile pressed')}
      />

      <ScreenLayout scrollable={true}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <ThemedText style={styles.greeting}>Halo, Admin User</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
            Here's the current overview of your fleet and collection points.
          </ThemedText>
        </View>

        {/* Status Cards */}
        {statusCards.map((card) => (
          <View key={card.id} style={styles.statusCardContainer}>
            <Card noPadding={true}>
              <View
                style={[
                  styles.statusCardHeader,
                  { borderBottomColor: card.color },
                ]}
              >
                <View style={styles.statusCardContent}>
                  <ThemedText style={styles.statusCardTitle}>{card.title}</ThemedText>
                  <ThemedText style={[styles.statusCardCount, { color: card.color }]}>
                    {card.count}
                  </ThemedText>
                  <ThemedText style={[styles.statusCardLabel, { color: colors.textSecondary }]}>
                    {card.label}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.statusCardIcon,
                    { backgroundColor: card.color + '15' },
                  ]}
                >
                  <MaterialIcons name={card.icon} size={24} color={card.color} />
                </View>
              </View>
            </Card>
          </View>
        ))}

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <Card key={action.id} style={styles.quickActionCard}>
                <View style={styles.quickActionContent}>
                  <View
                    style={[
                      styles.quickActionIconContainer,
                      { backgroundColor: colors.accent + '15' },
                    ]}
                  >
                    <MaterialIcons name={action.icon} size={28} color={colors.accent} />
                  </View>
                  <ThemedText style={styles.quickActionLabel}>{action.label}</ThemedText>
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionContainer}>
          <ThemedText style={styles.sectionTitle}>Recent Activity</ThemedText>
          {recentActivities.map((activity, index) => (
            <Card key={activity.id}>
              <View style={styles.activityItem}>
                <View
                  style={[
                    styles.activityIcon,
                    {
                      backgroundColor:
                        activity.icon === 'warning' ? colors.danger + '15' : colors.success + '15',
                    },
                  ]}
                >
                  <MaterialIcons
                    name={activity.icon}
                    size={20}
                    color={activity.icon === 'warning' ? colors.danger : colors.success}
                  />
                </View>
                <View style={styles.activityContent}>
                  <ThemedText style={styles.activityTitle}>{activity.title}</ThemedText>
                  <ThemedText style={[styles.activityTime, { color: colors.textSecondary }]}>
                    {activity.time}
                  </ThemedText>
                </View>
              </View>
            </Card>
          ))}
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
});
