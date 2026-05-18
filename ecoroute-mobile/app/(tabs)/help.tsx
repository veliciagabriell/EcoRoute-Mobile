import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';

// ─── Data ──────────────────────────────────────────────────────────────────────

interface FAQItem {
  id: string;
  question: string;
}

interface FAQCategory {
  id: string;
  title: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  bgColor: string;
  items: FAQItem[];
}

const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: 'akun',
    title: 'Akun',
    iconName: 'person',
    iconColor: '#1A365D',
    bgColor: '#D6E3FF',
    items: [
      { id: 'a1', question: 'Cara mengubah password' },
      { id: 'a2', question: 'Memperbarui informasi kontak' },
    ],
  },
  {
    id: 'ecobot',
    title: 'Penggunaan EcoBot',
    iconName: 'smart-toy',
    iconColor: '#455F88',
    bgColor: '#DCE9FF',
    items: [
      { id: 'e1', question: 'Panduan awal penggunaan' },
      { id: 'e2', question: 'Cara mendapatkan rekomendasi rute' },
    ],
  },
  {
    id: 'teknis',
    title: 'Masalah Teknis',
    iconName: 'build',
    iconColor: '#93000A',
    bgColor: '#FFDAD6',
    items: [
      { id: 't1', question: 'Aplikasi tidak bisa dibuka' },
      { id: 't2', question: 'Peta tidak memuat dengan benar' },
    ],
  },
  {
    id: 'jadwal',
    title: 'Jadwal & Lokasi',
    iconName: 'schedule',
    iconColor: '#003F23',
    bgColor: '#74DB9D',
    items: [
      { id: 'j1', question: 'Cara melihat jadwal pengambilan sampah' },
      { id: 'j2', question: 'Perubahan jadwal area' },
    ],
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function CategoryCard({ category }: { category: FAQCategory }) {
  return (
    <View style={styles.categoryCard}>
      {/* Category header */}
      <View style={styles.categoryHeader}>
        <View style={[styles.iconCircle, { backgroundColor: category.bgColor }]}>
          <MaterialIcons name={category.iconName} size={20} color={category.iconColor} />
        </View>
        <ThemedText style={styles.categoryTitle}>{category.title}</ThemedText>
      </View>

      {/* Divider + FAQ items */}
      <View style={styles.categoryList}>
        {category.items.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.faqItem, index === 0 && styles.faqItemFirst]}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.faqText}>{item.question}</ThemedText>
            <MaterialIcons name="chevron-right" size={18} color="#43474E" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function HelpScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = FAQ_CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.items.filter((item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0 || searchQuery === '');

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

        <ThemedText style={styles.topBarTitle}>Pusat Bantuan</ThemedText>

        {/* Spacer to center the title */}
        <View style={{ width: 40 }} />
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Search ── */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInput}>
            <MaterialIcons name="search" size={20} color="#74777F" style={styles.searchIcon} />
            <TextInput
              style={styles.searchTextInput}
              placeholder="Cari topik bantuan..."
              placeholderTextColor="#74777F"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={18} color="#74777F" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── FAQ Categories ── */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Topik Populer</ThemedText>

          <View style={styles.categoriesContainer}>
            {filteredCategories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}

            {filteredCategories.length === 0 && (
              <View style={styles.emptyState}>
                <MaterialIcons name="search-off" size={48} color="#C4C6CF" />
                <ThemedText style={styles.emptyText}>
                  Tidak ada topik yang cocok dengan &quot;{searchQuery}&quot;
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* ── Contact Us ── */}
        <View style={styles.contactCard}>
          {/* Decorative circle */}
          <View style={styles.contactDecorCircle} />

          {/* Content */}
          <View style={styles.contactContent}>
            <View style={styles.contactHeaderRow}>
              <MaterialIcons name="headset-mic" size={22} color="#002045" />
              <ThemedText style={styles.contactTitle}>Masih butuh bantuan?</ThemedText>
            </View>
            <ThemedText style={styles.contactDesc}>
              Tim dukungan kami siap membantu Anda setiap hari mulai pukul 08.00 – 17.00 WIB.
            </ThemedText>
          </View>

          <View style={styles.contactButtons}>
            {/* WhatsApp */}
            <TouchableOpacity
              style={styles.btnPrimary}
              activeOpacity={0.85}
              onPress={() => Linking.openURL('https://wa.me/6281234567890')}
            >
              <MaterialIcons name="chat" size={20} color="#FFFFFF" />
              <ThemedText style={styles.btnPrimaryText}>Chat via WhatsApp</ThemedText>
            </TouchableOpacity>

            {/* Email */}
            <TouchableOpacity
              style={styles.btnOutline}
              activeOpacity={0.85}
              onPress={() => Linking.openURL('mailto:support@ecoroute.id')}
            >
              <MaterialIcons name="mail" size={20} color="#0061A5" />
              <ThemedText style={styles.btnOutlineText}>Email</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
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
    shadowColor: '#1A365D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.4,
    color: '#002045',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 16,
  },

  // Search
  searchContainer: {
    marginBottom: 8,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C4C6CF',
    borderRadius: 8,
    height: 49,
    paddingHorizontal: 12,
    shadowColor: '#1A365D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchTextInput: {
    flex: 1,
    fontFamily: 'Manrope',
    fontSize: 16,
    color: '#1A1A1A',
    height: '100%',
  },

  // Section
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 20,
    lineHeight: 28,
    color: '#002045',
  },
  categoriesContainer: {
    gap: 16,
  },

  // Category Card
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#1A365D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    lineHeight: 16,
    letterSpacing: 0.28,
    color: '#002045',
    marginLeft: 12,
  },
  categoryList: {
    marginHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#D4E4FC',
    marginBottom: 8,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#D4E4FC',
  },
  faqItemFirst: {
    borderTopWidth: 0,
  },
  faqText: {
    fontFamily: 'Manrope',
    fontSize: 14,
    lineHeight: 20,
    color: '#43474E',
    flex: 1,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontFamily: 'Manrope',
    fontSize: 14,
    color: '#74777F',
    textAlign: 'center',
  },

  // Contact Card
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4E4FC',
    borderRadius: 12,
    shadowColor: '#1A365D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  contactDecorCircle: {
    position: 'absolute',
    width: 128,
    height: 128,
    right: 0,
    top: 0,
    backgroundColor: '#D6E3FF',
    opacity: 0.5,
    borderBottomLeftRadius: 9999,
  },
  contactContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 8,
  },
  contactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 20,
    lineHeight: 28,
    color: '#002045',
  },
  contactDesc: {
    fontFamily: 'Manrope',
    fontSize: 14,
    lineHeight: 20,
    color: '#43474E',
  },
  contactButtons: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A365D',
    borderRadius: 8,
    height: 45,
    gap: 8,
    shadowColor: '#1A365D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 3,
  },
  btnPrimaryText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    letterSpacing: 0.28,
    color: '#FFFFFF',
  },
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0061A5',
    borderRadius: 8,
    height: 44,
    gap: 8,
  },
  btnOutlineText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    letterSpacing: 0.28,
    color: '#0061A5',
  },
});
