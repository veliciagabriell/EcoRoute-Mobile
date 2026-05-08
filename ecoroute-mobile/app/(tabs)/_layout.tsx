import { Tabs, useRouter, usePathname, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';

import { Footer, TabItem } from '@/components/footer';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('home');

  // Detect current route and update active tab
  const updateActiveTab = useCallback(() => {
    if (pathname?.includes('explore')) {
      setActiveTab('tps');
    } else if (pathname?.includes('report')) {
      setActiveTab('report');
    } else if (pathname?.includes('profile')) {
      setActiveTab('profile');
    } else {
      setActiveTab('home');
    }
  }, [pathname]);

  useFocusEffect(updateActiveTab);

  const tabs: TabItem[] = [
    { id: 'home', label: 'EcoBot', icon: 'shopping-bag' },
    { id: 'tps', label: 'TPS', icon: 'location-on' },
    { id: 'report', label: 'Report', icon: 'info' },
    { id: 'profile', label: 'Profile', icon: 'person' },
  ];

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    
    // Navigate based on tab
    switch (tabId) {
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
        router.push('/(tabs)/');
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
            title: 'Home',
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'TPS',
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
