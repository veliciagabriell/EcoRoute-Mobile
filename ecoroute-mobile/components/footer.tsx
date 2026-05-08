import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

export interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
}

interface FooterProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (tabId: string) => void;
}

export function Footer({ tabs, activeTab, onTabPress }: FooterProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onTabPress(tab.id)}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.tabContent,
                  {
                    backgroundColor: isActive ? colors.accent + '15' : 'transparent',
                  },
                ]}
              >
                <MaterialIcons
                  name={tab.icon}
                  size={24}
                  color={isActive ? colors.accent : colors.icon}
                />
                <ThemedText
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? colors.accent : colors.textSecondary,
                      fontSize: 11,
                      marginTop: 4,
                    },
                  ]}
                >
                  {tab.label}
                </ThemedText>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  tabLabel: {
    fontWeight: '500',
    textAlign: 'center',
  },
});
