import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/button';
import { MaterialIcons } from '@expo/vector-icons';

export default function RegisterScreen({ onNavigateToLogin }: { onNavigateToLogin: () => void }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { register, isLoading } = useAuth();

  const [namaLengkap, setNamaLengkap] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('umum');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const handleRegister = async () => {
    setError('');

    // Validation
    if (!namaLengkap.trim()) {
      setError('Nama lengkap tidak boleh kosong');
      return;
    }
    if (!email.trim()) {
      setError('Email tidak boleh kosong');
      return;
    }
    if (password.length < 8) {
      setError('Kata sandi minimal 8 karakter');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak sesuai');
      return;
    }

    try {
      await register(email, password, namaLengkap, role);
      // After successful registration, navigate back to login
      onNavigateToLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrasi gagal');
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Form Card */}
      <View
        style={[
          styles.formCard,
          {
            backgroundColor: colors.backgroundAlt,
            borderColor: colors.border,
            borderWidth: 1,
          },
        ]}
      >
        {/* Header containing Logo and Back Button */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={onNavigateToLogin} disabled={isLoading} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.logoRow}>
            {/* Custom Logo shape to match design (dark blue leaf container) */}
            <View style={[styles.logoIconContainer, { backgroundColor: colors.primary }]}>
              <MaterialIcons name="eco" size={24} color="#FFFFFF" />
            </View>
            <ThemedText style={[styles.appName, { color: colors.primary }]}>EcoRoute</ThemedText>
          </View>
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
            Bergabunglah untuk masa{'\n'}depan yang lebih hijau.
          </ThemedText>
        </View>

        {/* Error Message */}
        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.danger + '20' }]}>
            <MaterialIcons name="error" size={16} color={colors.danger} />
            <ThemedText style={[styles.errorText, { color: colors.danger }]}>
              {error}
            </ThemedText>
          </View>
        ) : null}

        {/* Nama Lengkap Input */}
        <View style={styles.formGroup}>
          <ThemedText style={[styles.label, { color: colors.primary }]}>Nama Lengkap</ThemedText>
          <View
            style={[
              styles.inputContainer,
              {
                borderColor: colors.border,
                backgroundColor: colors.backgroundAlt,
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Masukkan nama lengkap Anda"
              placeholderTextColor={colors.textSecondary}
              value={namaLengkap}
              onChangeText={setNamaLengkap}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Email Input */}
        <View style={styles.formGroup}>
          <ThemedText style={[styles.label, { color: colors.primary }]}>Email</ThemedText>
          <View
            style={[
              styles.inputContainer,
              {
                borderColor: colors.border,
                backgroundColor: colors.backgroundAlt,
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="nama@email.com"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        {/* Role Dropdown */}
        <View style={styles.formGroup}>
          <ThemedText style={[styles.label, { color: colors.primary }]}>Peran</ThemedText>
          <TouchableOpacity
            style={[
              styles.inputContainer,
              {
                borderColor: colors.border,
                backgroundColor: colors.backgroundAlt,
              },
            ]}
            onPress={() => setShowRoleDropdown(!showRoleDropdown)}
            disabled={isLoading}
          >
            <ThemedText style={[styles.dropdownText, { color: colors.textPrimary }]}>
              {role === 'petugas' ? 'Petugas' : 'Pengguna Umum'}
            </ThemedText>
            <MaterialIcons name="expand-more" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          {showRoleDropdown && (
            <View style={[styles.dropdownMenu, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setRole('umum');
                  setShowRoleDropdown(false);
                }}
              >
                <ThemedText style={[styles.dropdownItemText, { color: colors.textPrimary }]}>
                  Pengguna Umum
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setRole('petugas');
                  setShowRoleDropdown(false);
                }}
              >
                <ThemedText style={[styles.dropdownItemText, { color: colors.textPrimary }]}>
                  Petugas
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Password Input */}
        <View style={styles.formGroup}>
          <ThemedText style={[styles.label, { color: colors.primary }]}>Kata Sandi</ThemedText>
          <View
            style={[
              styles.inputContainer,
              {
                borderColor: colors.border,
                backgroundColor: colors.backgroundAlt,
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Minimal 8 karakter"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!isLoading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={isLoading}>
              <MaterialIcons
                name={showPassword ? 'visibility' : 'visibility-off'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password Input */}
        <View style={styles.formGroup}>
          <ThemedText style={[styles.label, { color: colors.primary }]}>Konfirmasi Kata Sandi</ThemedText>
          <View
            style={[
              styles.inputContainer,
              {
                borderColor: colors.border,
                backgroundColor: colors.backgroundAlt,
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Ulangi kata sandi"
              placeholderTextColor={colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              editable={!isLoading}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} disabled={isLoading}>
              <MaterialIcons
                name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Register Button */}
        <View style={{ marginTop: 24 }}>
          {isLoading ? (
            <View
              style={[
                styles.registerButton,
                {
                  backgroundColor: colors.primary,
                  opacity: 0.6,
                },
              ]}
            >
              <ActivityIndicator color="#FFFFFF" />
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.registerButton, { backgroundColor: colors.primary }]}
              onPress={handleRegister}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.registerButtonText}>Daftar Akun</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Login Link */}
        <View style={styles.loginLinkContainer}>
          <ThemedText style={[styles.loginLinkText, { color: colors.textSecondary }]}>
            Sudah punya akun?{' '}
          </ThemedText>
          <TouchableOpacity onPress={onNavigateToLogin} disabled={isLoading}>
            <ThemedText style={[styles.loginLink, { color: colors.primary, textDecorationLine: 'underline' }]}>
              Masuk di sini
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  formCard: {
    borderRadius: 8,
    padding: 32,
    marginVertical: 'auto',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: -12,
    top: 0,
    padding: 8,
    zIndex: 10,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  logoIconContainer: {
    width: 40,
    height: 48,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 14,
  },
  dropdownMenu: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  dropdownItemText: {
    fontSize: 15,
  },
  registerButton: {
    paddingVertical: 14,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginLinkText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
