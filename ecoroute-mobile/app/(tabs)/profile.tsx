import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Header } from '@/components/header';
import { useAuth } from '@/contexts/auth-context';
import { ThemedText } from '@/components/themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { 
  useFonts, 
  Manrope_400Regular, 
  Manrope_600SemiBold, 
  Manrope_700Bold 
} from '@expo-google-fonts/manrope';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, logout } = useAuth();

  // 1. Load Fonts di dalam komponen
  const [fontsLoaded] = useFonts({
    Manrope: Manrope_400Regular,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
  });
  
  const [formData, setFormData] = useState({
    namaLengkap: user?.namaLengkap || 'Admin User',
    email: user?.email || 'admin.user@ecoroute.com',
    nomorTelepon: '+62 812 3456 7890',
    password: 'password123', // Ganti bulatan statis menjadi text password asli agar bisa diketik
    bahasa: 'Bahasa Indonesia',
    kotaOperasional: 'Jakarta Selatan',
  });

  const [showPassword, setShowPassword] = useState(false);

  // Helper style font
  const manrope = { fontFamily: 'Manrope' };

  // 2. Tampilkan loading jika font belum siap
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
        title="Profil Akun" 
        showBack={false}

        onProfilePress={() => console.log('Profile pressed')}
      />

      <View style={[styles.subtitleContainer, { paddingHorizontal: 20 }]}>
        <ThemedText style={[manrope, {
          fontWeight: '600',
          fontSize: 30,
          lineHeight: 38,
          letterSpacing: -0.6,
          color: '#0D1C2E',
          marginBottom: 8
        }]}>
          Profil Akun
        </ThemedText>
        <ThemedText style={[manrope, {
          fontWeight: '400',
          fontSize: 14,
          lineHeight: 20,
          color: '#43474E',
          textAlign: 'left'
        }]}>
          Kelola informasi pribadi dan preferensi keamanan Anda.
        </ThemedText>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card */}
        <View style={[styles.profileCard, { 
          backgroundColor: '#FFFFFF', 
          borderColor: '#E5EEFF', 
          borderWidth: 1, 
          shadowColor: '#1A365D', 
          shadowOffset: { width: 0, height: 2 }, 
          shadowOpacity: 0.08, 
          shadowRadius: 8, 
          elevation: 3,
          borderRadius: 12,
          height: 260,
          justifyContent: 'center',
          alignItems: 'center'
        }]}>
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'relative' }}>
              <View style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: '#C4C6CF',
                borderWidth: 4,
                borderColor: '#FFFFFF',
                ...StyleSheet.absoluteFillObject
              }} />
              <View style={{ width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialIcons name="person" size={50} color="#FFFFFF" />
              </View>
              <TouchableOpacity style={styles.editButton}>
                <MaterialIcons name="edit" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center', marginTop: 16 }}>
              <ThemedText style={[manrope, {
                fontWeight: '600',
                fontSize: 24,
                lineHeight: 32,
                color: '#0D1C2E',
                textAlign: 'center'
              }]}>
                {user?.namaLengkap || 'Admin User'}
              </ThemedText>
              
              <ThemedText style={[manrope, {
                fontWeight: '400',
                fontSize: 16,
                color: '#43474E',
                textAlign: 'center',
                marginTop: 4
              }]}>
                {user?.email || 'admin.user@ecoroute.com'}
              </ThemedText>

              <View style={styles.badge}>
                <MaterialIcons name="verified" size={12} color="#00497E" />
                <ThemedText style={[manrope, {
                  fontWeight: '600',
                  fontSize: 12,
                  color: '#00497E',
                  marginLeft: 4
                }]}>
                  Akun Terverifikasi
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          
          {/* Personal Info Section */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="person" size={20} color="#1A365D" />
              <ThemedText style={[manrope, { fontWeight: '600', fontSize: 20, color: '#0D1C2E', marginLeft: 8 }]}>
                Informasi Pribadi
              </ThemedText>
            </View>
            
            <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
              <View style={{ marginBottom: 16 }}>
                <ThemedText style={[manrope, styles.inputLabel]}>
                  Nama Lengkap
                </ThemedText>
                <TextInput
                  style={[manrope, styles.textInput]}
                  value={formData.namaLengkap}
                  onChangeText={(text) => setFormData({ ...formData, namaLengkap: text })}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <ThemedText style={[manrope, styles.inputLabel]}>
                  Email
                </ThemedText>
                <TextInput
                  style={[manrope, styles.textInput, { opacity: 0.7 }]}
                  value={formData.email}
                  editable={false}
                />
              </View>

              <View>
                <ThemedText style={[manrope, styles.inputLabel]}>
                  Nomor Telepon
                </ThemedText>
                <TextInput
                  style={[manrope, styles.textInput]}
                  value={formData.nomorTelepon}
                  onChangeText={(text) => setFormData({ ...formData, nomorTelepon: text })}
                />
              </View>
            </View>
          </View>

          {/* Security Section */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="lock" size={20} color="#1A365D" />
              <ThemedText style={[manrope, { fontWeight: '600', fontSize: 20, color: '#0D1C2E', marginLeft: 8 }]}>
                Keamanan
              </ThemedText>
            </View>
            
            <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
              <ThemedText style={[manrope, styles.inputLabel]}>
                Kata Sandi
              </ThemedText>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={[manrope, { flex: 1, fontSize: 16, color: '#0D1C2E' }]}
                  value={formData.password}
                  secureTextEntry={!showPassword}
                  editable={true} // Diubah jadi TRUE agar bisa diketik
                  onChangeText={(text) => setFormData({ ...formData, password: text })} // Ditambah agar teks terupdate
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <MaterialIcons 
                    name={showPassword ? "visibility" : "visibility-off"} 
                    size={20} 
                    color="#43474E"
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={{ marginTop: 8 }}>
                <ThemedText style={[manrope, { fontWeight: '600', fontSize: 14, color: '#0061A5' }]}>
                  Ubah Kata Sandi
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Preferences Section */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="settings" size={20} color="#1A365D" />
              <ThemedText style={[manrope, { fontWeight: '600', fontSize: 20, color: '#0D1C2E', marginLeft: 8 }]}>
                Preferensi
              </ThemedText>
            </View>
            
            <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
              <View style={{ marginBottom: 16 }}>
                <ThemedText style={[manrope, styles.inputLabel]}>
                  Bahasa
                </ThemedText>
                <View style={styles.dropdownFake}>
                  <ThemedText style={[manrope, { flex: 1, fontSize: 16, color: '#0D1C2E' }]}>
                    {formData.bahasa}
                  </ThemedText>
                  <MaterialIcons name="expand-more" size={20} color="#43474E" />
                </View>
              </View>

              <View>
                <ThemedText style={[manrope, styles.inputLabel]}>
                  Kota Operasional
                </ThemedText>
                <View style={styles.dropdownFake}>
                  <ThemedText style={[manrope, { flex: 1, fontSize: 16, color: '#0D1C2E' }]}>
                    {formData.kotaOperasional}
                  </ThemedText>
                  <MaterialIcons name="expand-more" size={20} color="#43474E" />
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <MaterialIcons name="logout" size={18} color="#BA1A1A" />
              <ThemedText style={[manrope, { fontWeight: '600', fontSize: 14, color: '#BA1A1A' }]}>
                Keluar dari Akun
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => console.log('Save', formData)} style={styles.saveBtn}>
              <MaterialIcons name="save" size={18} color="#FFFFFF" />
              <ThemedText style={[manrope, { fontWeight: '600', fontSize: 14, color: '#FFFFFF' }]}>
                Simpan Perubahan
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  subtitleContainer: { paddingVertical: 8 },
  profileCard: { marginHorizontal: 16, marginVertical: 16 },
  sectionWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EEFF',
    borderRadius: 12,
    shadowColor: '#1A365D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    paddingTop: 18,
    paddingBottom: 24,
    marginBottom: 24
  },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingBottom: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5EEFF' 
  },
  inputLabel: {
    fontWeight: '600',
    fontSize: 14,
    color: '#43474E',
    letterSpacing: 0.28,
    marginBottom: 8
  },
  textInput: {
    backgroundColor: '#EFF4FF',
    borderWidth: 1,
    borderColor: '#C4C6CF',
    borderRadius: 8,
    height: 42,
    paddingHorizontal: 13,
    fontSize: 16,
    color: '#0D1C2E'
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF4FF',
    borderWidth: 1,
    borderColor: '#C4C6CF',
    borderRadius: 8,
    height: 42,
    paddingHorizontal: 13
  },
  dropdownFake: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF4FF',
    borderWidth: 1,
    borderColor: '#C4C6CF',
    borderRadius: 8,
    height: 42,
    paddingHorizontal: 13
  },
  editButton: {
    position: 'absolute',
    width: 32,
    height: 32,
    right: 0,
    bottom: 0,
    backgroundColor: '#1A365D',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D2E4FF',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 12
  },
  actionContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5EEFF',
    paddingTop: 16,
    marginBottom: 24,
    gap: 16
  },
  logoutBtn: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  saveBtn: {
    backgroundColor: '#1A365D',
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  }
});
