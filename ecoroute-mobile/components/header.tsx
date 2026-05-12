import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { useRouter, type Href } from 'expo-router';

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
  const router = useRouter();
  
  const [menuVisible, setMenuVisible] = useState(false);

  const handleMenuClick = () => {
    if (onMenuPress) {
      onMenuPress();
    } else {
      setMenuVisible(true);
    }
  };

  return (
    <>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.leftSection}>
            {showBack ? (
              <TouchableOpacity onPress={onBackPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialIcons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
            ) : showMenu ? (
              <TouchableOpacity onPress={handleMenuClick} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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

      {/* Sidebar Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <ThemedText style={styles.sidebarTitle}>Menu</ThemedText>
              <TouchableOpacity onPress={() => setMenuVisible(false)}>
                <MaterialIcons name="close" size={24} color="#0D1C2E" />
              </TouchableOpacity>
            </View>
            <View style={styles.sidebarContent}>
              <TouchableOpacity
                style={styles.sidebarItem}
                onPress={() => {
                  setMenuVisible(false);
                  router.push('/(tabs)/help' as Href);
                }}
              >
                <MaterialIcons name="help-outline" size={24} color="#0D1C2E" />
                <ThemedText style={styles.sidebarItemText}>Pusat Bantuan</ThemedText>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.sidebarItem}
                onPress={() => {
                  setMenuVisible(false);
                  router.push('/(tabs)/settings' as Href);
                }}
              >
                <MaterialIcons name="settings" size={24} color="#0D1C2E" />
                <ThemedText style={styles.sidebarItemText}>Pengaturan</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
    fontSize: 20,
    fontFamily: 'Manrope-Bold',
    letterSpacing: -0.5,
    color: '#002045',
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
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sidebar: {
    width: 250,
    height: '100%',
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5EEFF',
  },
  sidebarTitle: {
    fontSize: 20,
    fontFamily: 'Manrope-Bold',
    color: '#002045',
  },
  sidebarContent: {
    paddingTop: 20,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  sidebarItemText: {
    fontSize: 16,
    fontFamily: 'Manrope-Medium',
    color: '#0D1C2E',
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5EEFF',
    marginHorizontal: 20,
  },
});
