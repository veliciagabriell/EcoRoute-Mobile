import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Header } from '@/components/header';
import { ThemedText } from '@/components/themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { 
  useFonts, 
  Manrope_400Regular, 
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold 
} from '@expo-google-fonts/manrope';

export default function ReportScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [severity, setSeverity] = useState('Sedang');

  // 1. Load Manrope Fonts
  const [fontsLoaded] = useFonts({
    'Manrope': Manrope_400Regular,
    'Manrope-Medium': Manrope_500Medium,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
  });

  const manrope = { fontFamily: 'Manrope' };

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
            <TouchableOpacity style={styles.dropdownInput}>
              <ThemedText style={[manrope, styles.inputText]}>TPS Kebon Jeruk - KJ01</ThemedText>
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
               <View style={styles.mapPinOverlay}>
                  <View style={styles.pinCircle}>
                    <MaterialIcons name="location-on" size={18} color="#FFFFFF" />
                  </View>
               </View>
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
              <CheckboxLabel label="Menumpuk" checked={true} />
              <CheckboxLabel label="Bau Tidak Sedap" checked={false} />
              <CheckboxLabel label="Banyak Lalat" checked={false} />
              <CheckboxLabel label="Meluap ke Jalan" checked={false} />
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
            <TouchableOpacity style={styles.uploadArea}>
              <View style={styles.uploadIconCircle}>
                <MaterialIcons name="camera-alt" size={24} color="#1A365D" />
              </View>
              <ThemedText style={[manrope, styles.uploadText]}>Unggah Foto</ThemedText>
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
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton}>
          <MaterialIcons name="send" size={20} color="#FFFFFF" />
          <ThemedText style={[manrope, styles.submitButtonText]}>Kirim Laporan</ThemedText>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

// Helper Components
function CheckboxLabel({ label, checked }: any) {
  const manrope = { fontFamily: 'Manrope' };
  return (
    <TouchableOpacity style={[styles.checkboxItem, checked && styles.checkboxItemChecked]}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <MaterialIcons name="check" size={14} color="#FFFFFF" />}
      </View>
      <ThemedText style={[manrope, styles.checkboxText]}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

function RadioButton({ label, selected, onPress, isWarning }: any) {
  const manrope = { fontFamily: 'Manrope' };
  return (
    <TouchableOpacity style={styles.radioItem} onPress={onPress}>
      <View style={[styles.radioOuter, selected && { borderColor: isWarning ? '#F59E0B' : '#0061A5' }]}>
        {selected && <View style={[styles.radioInner, { backgroundColor: isWarning ? '#F59E0B' : '#0061A5' }]} />}
      </View>
      <ThemedText style={[manrope, styles.radioText]}>{label}</ThemedText>
    </TouchableOpacity>
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
  mapPreview: { height: 190, backgroundColor: '#E5EEFF', borderRadius: 8, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  mapPinOverlay: { width: 32, height: 32, backgroundColor: '#BA1A1A', borderRadius: 16, borderBottomRightRadius: 2, transform: [{ rotate: '45deg' }], justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  pinCircle: { transform: [{ rotate: '-45deg' }] },

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
});