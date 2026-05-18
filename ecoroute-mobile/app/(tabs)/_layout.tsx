import { Tabs, useRouter, usePathname, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';

import { Footer, TabItem } from '@/components/footer';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/auth-context';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(user?.role === 'admin' ? 'home' : 'profile');

  // Detect current route and update active tab
  const updateActiveTab = useCallback(() => {
    if (pathname?.includes('sensors')) {
      setActiveTab('sensors');
    } else if (pathname?.includes('explore')) {
      setActiveTab('tps');
    } else if (pathname?.includes('ecobot')) {
      setActiveTab('ecobot');
    } else if (pathname?.includes('report')) {
      setActiveTab('report');
    } else if (pathname?.includes('profile')) {
      setActiveTab('profile');
    } else if (pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/') {
      setActiveTab('home');
    }
  }, [pathname]);

  useFocusEffect(updateActiveTab);

  // Define tabs based on user role
  const tabs: TabItem[] = [];
  
  if (user?.role === 'admin') {
    tabs.push({ id: 'home', label: 'Dashboard', icon: 'dashboard' });
  } else {
    tabs.push({ id: 'ecobot', label: 'EcoBot', icon: 'chat' });
  }
  
  // Add sensors tab for officers (petugas)
  if (user?.role === 'petugas') {
    tabs.push({ id: 'sensors', label: 'Sensor', icon: 'sensors' });
  }
  
  tabs.push(
    { id: 'tps', label: 'TPS', icon: 'location-on' },
    { id: 'report', label: 'Report', icon: 'info' },
    { id: 'profile', label: 'Profile', icon: 'person' }
  );

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    
    // Navigate based on tab
    switch (tabId) {
      case 'sensors':
        router.push('/(tabs)/sensors');
        break;
      case 'ecobot':
        router.push('/(tabs)/ecobot');
        break;
      case 'tps':
        router.push('/(tabs)/explore');
        break;
      case 'report':
        router.push('/(tabs)/report');
        break;
      case 'profile':
        router.push('/(tabs)/profile');
        break;
      case 'home':
      default:
        router.push('/(tabs)');
        break;
    }
  };

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            href: user?.role === 'admin' ? '/(tabs)' : null,
          }}
        />
        <Tabs.Screen
          name="ecobot"
          options={{
            title: 'EcoBot',
            href: user?.role !== 'admin' ? '/(tabs)/ecobot' : null,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'TPS',
          }}
        />
        <Tabs.Screen
          name="sensors"
          options={{
            title: 'Monitor Sensor',
            href: user?.role === 'petugas' ? '/(tabs)/sensors' : null,
          }}
        />
        <Tabs.Screen
          name="report"
          options={{
            title: 'Report',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
          }}
        />
        <Tabs.Screen
          name="help"
          options={{
            title: 'Pusat Bantuan',
            href: null,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Pengaturan',
            href: null,
          }}
        />
      </Tabs>
      
      <Footer 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabPress={handleTabPress} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
