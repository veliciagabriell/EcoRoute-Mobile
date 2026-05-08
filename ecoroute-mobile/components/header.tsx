import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

interface HeaderProps {
  title?: string;
  showMenu?: boolean;
  showProfile?: boolean;
  onMenuPress?: () => void;
  onProfilePress?: () => void;
  showBack?: boolean;
  onBackPress?: () => void;
}

export function Header({
  title = 'EcoRoute',
  showMenu = true,
  showProfile = true,
  onMenuPress,
  onProfilePress,
  showBack = false,
  onBackPress,
}: HeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.leftSection}>
          {showBack ? (
            <TouchableOpacity onPress={onBackPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ) : showMenu ? (
            <TouchableOpacity onPress={onMenuPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialIcons name="menu" size={24} color={colors.text} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.centerSection}>
          <ThemedText style={styles.title}>{title}</ThemedText>
        </View>

        <View style={styles.rightSection}>
          {showProfile && (
            <TouchableOpacity onPress={onProfilePress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <View
                style={[
                  styles.profileIcon,
                  { backgroundColor: colors.accent, borderColor: colors.primary },
                ]}
              >
                <MaterialIcons name="person" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  leftSection: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  rightSection: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  profileIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
});
