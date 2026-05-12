import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { type Href } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/auth-context';

// ─── Sub-components ────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeading}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      {subtitle ? (
        <ThemedText style={styles.sectionSubtitle}>{subtitle}</ThemedText>
      ) : null}
    </View>
  );
}

interface ToggleItemProps {
  iconName: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  isFirst?: boolean;
}

function ToggleItem({
  iconName,
  iconColor,
  iconBg,
  label,
  description,
  value,
  onValueChange,
  isFirst = false,
}: ToggleItemProps) {
  return (
    <View style={[styles.toggleItem, !isFirst && styles.borderTop]}>
      <View style={styles.toggleLeft}>
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          <MaterialIcons name={iconName} size={20} color={iconColor} />
        </View>
        <View style={styles.toggleTextBlock}>
          <ThemedText style={styles.toggleLabel}>{label}</ThemedText>
          <ThemedText style={styles.toggleDesc}>{description}</ThemedText>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#C4C6CF', true: '#0061A5' }}
        thumbColor="#FFFFFF"
        style={styles.switch}
      />
    </View>
  );
}

interface ActionRowProps {
  iconName: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  rightLabel?: string;
  onPress?: () => void;
  isFirst?: boolean;
}

function ActionRow({
  iconName,
  iconColor,
  iconBg,
  label,
  rightLabel,
  onPress,
  isFirst = false,
}: ActionRowProps) {
  return (
    <TouchableOpacity
      style={[styles.actionRow, !isFirst && styles.borderTop]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.actionLeft}>
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          <MaterialIcons name={iconName} size={20} color={iconColor} />
        </View>
        <ThemedText style={styles.actionLabel}>{label}</ThemedText>
      </View>
      <View style={styles.actionRight}>
        {rightLabel ? (
          <ThemedText style={styles.actionRightLabel}>{rightLabel}</ThemedText>
        ) : null}
        <MaterialIcons name="chevron-right" size={20} color="#43474E" />
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  // Notification toggles
  const [notifKeluhan, setNotifKeluhan] = useState(true);
  const [notifJadwal, setNotifJadwal] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Keluar',
      'Apakah Anda yakin ingin keluar dari akun?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      {/* ── Top App Bar ── */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="arrow-back" size={20} color="#002045" />
        </TouchableOpacity>
        <ThemedText style={styles.topBarTitle}>Pengaturan</ThemedText>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section: Notifikasi ── */}
        <View style={styles.card}>
          <View style={styles.cardHeadingBorder}>
            <SectionHeader
              title="Notifikasi"
              subtitle="Kelola preferensi pemberitahuan Anda."
            />
          </View>

          <ToggleItem
            isFirst
            iconName="notifications"
            iconColor="#BA1A1A"
            iconBg="#FFDAD6"
            label="Notifikasi Keluhan"
            description="Pembaruan status keluhan yang Anda ajukan"
            value={notifKeluhan}
            onValueChange={setNotifKeluhan}
          />
          <ToggleItem
            iconName="schedule"
            iconColor="#0061A5"
            iconBg="#DCE9FF"
            label="Jadwal"
            description="Perubahan jadwal pengangkutan sampah"
            value={notifJadwal}
            onValueChange={setNotifJadwal}
          />
        </View>

        {/* ── Section: Preferensi ── */}
        <View style={styles.card}>
          <View style={styles.cardHeadingBorder}>
            <SectionHeader title="Preferensi" />
          </View>

          <ActionRow
            isFirst
            iconName="language"
            iconColor="#002045"
            iconBg="#DCE9FF"
            label="Bahasa"
            rightLabel="Indonesia"
            onPress={() => {}}
          />
          <ActionRow
            iconName="contrast"
            iconColor="#002045"
            iconBg="#DCE9FF"
            label="Mode Tampilan"
            rightLabel="Terang"
            onPress={() => {}}
          />
        </View>

        {/* ── Section: Info Aplikasi ── */}
        <View style={styles.card}>
          <ActionRow
            isFirst
            iconName="info"
            iconColor="#002045"
            iconBg="#DCE9FF"
            label="Info Aplikasi"
            onPress={() => {}}
          />
          <ActionRow
            iconName="headset-mic"
            iconColor="#002045"
            iconBg="#DCE9FF"
            label="Bantuan & Dukungan"
            onPress={() => router.push('/(tabs)/help' as Href)}
          />
        </View>

        {/* ── Logout Button ── */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <MaterialIcons name="logout" size={18} color="#BA1A1A" />
          <ThemedText style={styles.logoutText}>Keluar</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.5,
    color: '#002045',
  },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 16,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#1A365D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },

  // Section heading inside card
  cardHeadingBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5EEFF',
  },
  sectionHeading: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 4,
  },
  sectionTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 20,
    lineHeight: 28,
    color: '#002045',
  },
  sectionSubtitle: {
    fontFamily: 'Manrope',
    fontSize: 14,
    lineHeight: 20,
    color: '#43474E',
  },

  // Toggle item
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 100,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  toggleTextBlock: {
    flex: 1,
    gap: 4,
  },
  toggleLabel: {
    fontFamily: 'Manrope',
    fontSize: 18,
    lineHeight: 28,
    color: '#0D1C2E',
  },
  toggleDesc: {
    fontFamily: 'Manrope',
    fontSize: 14,
    lineHeight: 20,
    color: '#43474E',
  },
  switch: {
    marginLeft: 12,
  },

  // Action row
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 72,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  actionLabel: {
    fontFamily: 'Manrope',
    fontSize: 18,
    lineHeight: 28,
    color: '#0D1C2E',
  },
  actionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionRightLabel: {
    fontFamily: 'Manrope',
    fontSize: 16,
    lineHeight: 24,
    color: '#43474E',
  },

  // Icon circle
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  // Borders between items
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#E5EEFF',
  },

  // Logout button
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFDAD6',
    borderRadius: 8,
    height: 42,
    gap: 8,
    shadowColor: '#BA1A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 8,
  },
  logoutText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    lineHeight: 16,
    letterSpacing: 0.28,
    color: '#BA1A1A',
  },
});
