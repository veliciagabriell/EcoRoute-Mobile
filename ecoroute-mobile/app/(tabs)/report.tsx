import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Modal, Pressable, Alert } from 'react-native';
import { Header } from '@/components/header';
import { ThemedText } from '@/components/themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { get, post } from '@/utils/api';
import { TpsMapView, getRegionForPoints, type MapMarkerData } from '@/components/tps-map-view';
import { 
  useFonts, 
  Manrope_400Regular, 
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold 
} from '@expo-google-fonts/manrope';

const INDICATORS = ['Menumpuk', 'Bau Tidak Sedap', 'Banyak Lalat', 'Meluap ke Jalan'];

export default function ReportScreen() {
  const [severity, setSeverity] = useState('Sedang');
  const [tpsList, setTpsList] = useState<any[]>([]);
  const [selectedTps, setSelectedTps] = useState<any>(null);
  const [showTpsPicker, setShowTpsPicker] = useState(false);
  const [indicators, setIndicators] = useState<string[]>(['Menumpuk']);
  const [description, setDescription] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Load Manrope Fonts
  const [fontsLoaded] = useFonts({
    'Manrope': Manrope_400Regular,
    'Manrope-Medium': Manrope_500Medium,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
  });

  const manrope = { fontFamily: 'Manrope' };

  const selectedMarker = useMemo<MapMarkerData | null>(() => {
    if (!selectedTps?.id) return null;
    const latitude = Number(selectedTps?.latitude);
    const longitude = Number(selectedTps?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return {
      id: String(selectedTps.id),
      name: String(selectedTps.name ?? 'TPS'),
      latitude,
      longitude,
      status: 'normal',
    };
  }, [selectedTps]);

  const selectedRegion = useMemo(() => {
    if (!selectedMarker) return getRegionForPoints([], 0.05);
    return getRegionForPoints(
      [{ latitude: selectedMarker.latitude, longitude: selectedMarker.longitude }],
      0.01
    );
  }, [selectedMarker]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await get('/tps');
        const list = data?.data || data || [];
        if (active) {
          setTpsList(list);
          setSelectedTps(list?.[0]?.tps || list?.[0] || null);
        }
      } catch (err) {
        console.warn('Failed to fetch TPS list', err);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const toggleIndicator = (label: string) => {
    setIndicators((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin diperlukan', 'Aktifkan izin galeri agar bisa memilih foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
      allowsEditing: false,
      selectionLimit: 1,
    });

    if (!result.canceled && result.assets?.[0]) {
      setPhotoBase64(result.assets[0].base64 || null);
      setPhotoMime(result.assets[0].mimeType || 'image/jpeg');
    }
  };

  const submitReport = async () => {
    if (!description.trim()) {
      Alert.alert('Deskripsi wajib', 'Mohon isi deskripsi singkat kondisi TPS.');
      return;
    }
    if (!selectedTps?.id) {
      Alert.alert('TPS belum dipilih', 'Pilih TPS terlebih dahulu sebelum mengirim laporan.');
      return;
    }

    setIsSubmitting(true);
    try {
      await post('/reports', {
        tps_id: selectedTps?.id,
        description,
        indicators,
        severity: severity.toLowerCase(),
        photo_base64: photoBase64,
        photo_mime: photoMime,
      });
      setDescription('');
      setPhotoBase64(null);
      setPhotoMime(null);
      setIndicators([]);
      setSeverity('Sedang');
      Alert.alert('Laporan terkirim', 'Terima kasih, laporan berhasil dikirim.');
    } catch (err: any) {
      const message = typeof err?.message === 'string' ? err.message : 'Gagal mengirim laporan.';
      console.warn('Submit report error', err);
      Alert.alert('Gagal mengirim', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1A365D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Report Waste Condition" 
      />

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Stepper Section */}
        <View style={styles.stepperContainer}>
          <View style={styles.stepperLine} />
          <View style={[styles.stepperLineActive, { width: '50%' }]} />
          
          <View style={styles.stepWrapper}>
            <View style={styles.stepCircleActive}>
              <MaterialIcons name="check" size={16} color="#FFFFFF" />
            </View>
            <ThemedText style={[manrope, styles.stepLabelActive]}>Lokasi</ThemedText>
          </View>

          <View style={styles.stepWrapper}>
            <View style={styles.stepCircleActive}>
              <ThemedText style={[manrope, styles.stepNumber]}>2</ThemedText>
            </View>
            <ThemedText style={[manrope, styles.stepLabelActive]}>Kondisi</ThemedText>
          </View>

          <View style={styles.stepWrapper}>
            <View style={styles.stepCircleInactive}>
              <ThemedText style={[manrope, styles.stepNumberInactive]}>3</ThemedText>
            </View>
            <ThemedText style={[manrope, styles.stepLabelInactive]}>Kirim</ThemedText>
          </View>
        </View>

        {/* Section 1: Detail Lokasi */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[manrope, styles.sectionTitle]}>Detail Lokasi</ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[manrope, styles.inputLabel]}>Pilih TPS</ThemedText>
            <TouchableOpacity style={styles.dropdownInput} onPress={() => setShowTpsPicker(true)}>
              <ThemedText style={[manrope, styles.inputText]}>{selectedTps?.name || 'Pilih TPS'}</ThemedText>
              <MaterialIcons name="expand-more" size={24} color="#43474E" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[manrope, styles.inputLabel]}>Atau Gunakan Lokasi Saat Ini</ThemedText>
            <TouchableOpacity style={styles.locationButton}>
              <MaterialIcons name="my-location" size={20} color="#0061A5" />
              <ThemedText style={[manrope, styles.locationButtonText]}>Gunakan Lokasi Saya</ThemedText>
            </TouchableOpacity>
            
            <View style={styles.mapPreview}>
              {selectedMarker ? (
                <TpsMapView markers={[selectedMarker]} initialRegion={selectedRegion} />
              ) : (
                <View style={styles.mapEmptyState}>
                  <ThemedText style={styles.mapEmptyText}>Pilih TPS untuk melihat peta</ThemedText>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Section 2: Detail Kondisi */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[manrope, styles.sectionTitle]}>Detail Kondisi</ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[manrope, styles.inputLabel]}>Indikator Kondisi (Pilih semua yang sesuai)</ThemedText>
            <View style={styles.checkboxGrid}>
              {INDICATORS.map((label) => (
                <CheckboxLabel key={label} label={label} checked={indicators.includes(label)} onPress={() => toggleIndicator(label)} />
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[manrope, styles.inputLabel]}>Tingkat Keparahan</ThemedText>
            <View style={styles.radioGroup}>
              <RadioButton label="Rendah" selected={severity === 'Rendah'} onPress={() => setSeverity('Rendah')} />
              <RadioButton label="Sedang" selected={severity === 'Sedang'} onPress={() => setSeverity('Sedang')} isWarning />
              <RadioButton label="Tinggi" selected={severity === 'Tinggi'} onPress={() => setSeverity('Tinggi')} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[manrope, styles.inputLabel]}>Foto Kondisi</ThemedText>
            <TouchableOpacity style={styles.uploadArea} onPress={pickImage}>
              <View style={styles.uploadIconCircle}>
                <MaterialIcons name="camera-alt" size={24} color="#1A365D" />
              </View>
              <ThemedText style={[manrope, styles.uploadText]}>{photoBase64 ? 'Foto dipilih' : 'Unggah Foto'}</ThemedText>
              <ThemedText style={[manrope, styles.uploadSubtext]}>JPG, PNG maksimal 5MB</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[manrope, styles.inputLabel]}>Deskripsi Tambahan</ThemedText>
            <TextInput 
              style={[manrope, styles.textArea]}
              placeholder="Tuliskan detail tambahan jika ada..."
              placeholderTextColor="#6B7280"
              multiline={true}
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={submitReport} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialIcons name="send" size={20} color="#FFFFFF" />
              <ThemedText style={[manrope, styles.submitButtonText]}>Kirim Laporan</ThemedText>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>

      <Modal visible={showTpsPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ThemedText style={styles.modalTitle}>Pilih TPS</ThemedText>
            <ScrollView style={{ maxHeight: 280 }}>
              {tpsList.map((item: any, index: number) => {
                const tps = item.tps || item;
                return (
                  <TouchableOpacity
                    key={tps.id || index}
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedTps(tps);
                      setShowTpsPicker(false);
                    }}
                  >
                    <ThemedText>{tps.name}</ThemedText>
                    <ThemedText style={{ color: '#6B7280', fontSize: 12 }}>{tps.area}</ThemedText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowTpsPicker(false)}>
              <ThemedText style={{ color: '#0061A5', fontWeight: '600' }}>Tutup</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Helper Components
function CheckboxLabel({ label, checked, onPress }: any) {
  const manrope = { fontFamily: 'Manrope' };
  return (
    <Pressable
      style={({ pressed }) => [
        styles.checkboxItem,
        checked && styles.checkboxItemChecked,
        pressed && { opacity: 0.85 },
      ]}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      hitSlop={8}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <MaterialIcons name="check" size={14} color="#FFFFFF" />}
      </View>
      <ThemedText style={[manrope, styles.checkboxText]}>{label}</ThemedText>
    </Pressable>
  );
}

function RadioButton({ label, selected, onPress, isWarning }: any) {
  const manrope = { fontFamily: 'Manrope' };
  return (
    <Pressable
      style={({ pressed }) => [styles.radioItem, pressed && { opacity: 0.85 }]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      hitSlop={8}
    >
      <View style={[styles.radioOuter, selected && { borderColor: isWarning ? '#F59E0B' : '#0061A5' }]}>
        {selected && <View style={[styles.radioInner, { backgroundColor: isWarning ? '#F59E0B' : '#0061A5' }]} />}
      </View>
      <ThemedText style={[manrope, styles.radioText]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  stepperContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    elevation: 2,
  },
  stepperLine: { position: 'absolute', height: 4, backgroundColor: '#E5EEFF', left: 40, right: 40, top: 32, borderRadius: 2 },
  stepperLineActive: { position: 'absolute', height: 4, backgroundColor: '#0061A5', left: 40, top: 32, borderRadius: 2 },
  stepWrapper: { alignItems: 'center', zIndex: 2 },
  stepCircleActive: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#0061A5', justifyContent: 'center', alignItems: 'center' },
  stepCircleInactive: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5EEFF', justifyContent: 'center', alignItems: 'center' },
  stepNumber: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  stepNumberInactive: { color: '#43474E', fontSize: 14, fontWeight: '700' },
  stepLabelActive: { fontSize: 12, color: '#0061A5', marginTop: 8, fontWeight: '600' },
  stepLabelInactive: { fontSize: 12, color: '#43474E', marginTop: 8, fontWeight: '500' },

  formSection: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 20, elevation: 2 },
  sectionHeader: { borderBottomWidth: 1, borderBottomColor: '#E5EEFF', paddingBottom: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#0D1C2E' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#43474E', marginBottom: 8 },
  dropdownInput: { backgroundColor: '#F8F9FF', borderWidth: 1, borderColor: '#C4C6CF', borderRadius: 8, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  inputText: { fontSize: 16, color: '#0D1C2E' },
  
  locationButton: { borderWidth: 1, borderColor: '#0061A5', borderRadius: 8, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  locationButtonText: { color: '#0061A5', fontWeight: '700', fontSize: 14 },
  mapPreview: { height: 190, backgroundColor: '#E5EEFF', borderRadius: 8, overflow: 'hidden' },
  mapEmptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mapEmptyText: { fontSize: 12, color: '#1A365D' },

  checkboxGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  checkboxItem: { width: '48%', height: 74, borderWidth: 1, borderColor: '#C4C6CF', borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkboxItemChecked: { borderColor: '#0061A5', backgroundColor: '#F8F9FF' },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: '#C4C6CF', borderRadius: 4, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#0061A5', borderColor: '#0061A5' },
  checkboxText: { fontSize: 14, color: '#0D1C2E', flexShrink: 1, fontWeight: '500' },

  radioGroup: { gap: 12 },
  radioItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: '#C4C6CF', justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  radioText: { fontSize: 16, color: '#0D1C2E', fontWeight: '500' },

  uploadArea: { backgroundColor: '#F8F9FF', borderWidth: 2, borderStyle: 'dashed', borderColor: '#C4C6CF', borderRadius: 8, padding: 24, alignItems: 'center' },
  uploadIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E5EEFF', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  uploadText: { fontSize: 14, fontWeight: '700', color: '#0061A5' },
  uploadSubtext: { fontSize: 12, color: '#43474E', marginTop: 4 },

  textArea: { backgroundColor: '#F8F9FF', borderWidth: 1, borderColor: '#C4C6CF', borderRadius: 8, padding: 12, height: 100, textAlignVertical: 'top', fontSize: 16, color: '#0D1C2E' },

  submitButton: { backgroundColor: '#1A365D', height: 52, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, elevation: 4 },
  submitButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, width: '100%' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0D1C2E', marginBottom: 12 },
  modalItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5EEFF' },
  modalClose: { marginTop: 12, alignItems: 'center' },
});