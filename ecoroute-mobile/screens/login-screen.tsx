import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/button';
import { MaterialIcons } from '@expo/vector-icons';

export default function LoginScreen({ onNavigateToRegister }: { onNavigateToRegister: () => void }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('admin@ecoroute.com');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (isLoading) return; // Prevent double-click
    console.log('[LoginScreen] handleLogin called with:', email);
    try {
      await login(email, password);
      console.log('[LoginScreen] Login successful');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login gagal';
      console.log('[LoginScreen] Login error:', errorMsg);
      setError(errorMsg);
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
        {/* Logo and Title */}
        <View style={styles.headerContainer}>
          <View style={styles.logoRow}>
            {/* Custom Logo shape to match design (dark blue leaf container) */}
            <View style={[styles.logoIconContainer, { backgroundColor: colors.primary }]}>
              <MaterialIcons name="eco" size={24} color="#FFFFFF" />
            </View>
            <ThemedText style={[styles.appName, { color: colors.primary }]}>EcoRoute</ThemedText>
          </View>
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
            Masuk untuk melanjutkan ke akun{'\n'}Anda.
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

        {/* Password Input */}
        <View style={styles.formGroup}>
          <View style={styles.passwordLabelContainer}>
            <ThemedText style={[styles.label, { color: colors.primary }]}>Kata Sandi</ThemedText>
            <TouchableOpacity>
              <ThemedText style={[styles.forgotPassword, { color: colors.primary }]}>
                Lupa sandi?
              </ThemedText>
            </TouchableOpacity>
          </View>
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
              placeholder="••••••••"
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

        {/* Remember Me */}
        <View style={styles.rememberContainer}>
          <TouchableOpacity
            style={[
              styles.checkbox,
              { 
                borderColor: rememberMe ? colors.primary : colors.border,
                backgroundColor: rememberMe ? colors.primary : 'transparent'
              }
            ]}
            onPress={() => setRememberMe(!rememberMe)}
            disabled={isLoading}
          >
            {rememberMe && <MaterialIcons name="check" size={14} color="#FFFFFF" />}
          </TouchableOpacity>
          <ThemedText style={[styles.rememberText, { color: colors.textSecondary }]}>
            Ingat saya
          </ThemedText>
        </View>

        {/* Login Button */}
        <View style={{ marginTop: 20 }}>
          <TouchableOpacity 
            style={[
              styles.loginButton, 
              { 
                backgroundColor: colors.primary,
                opacity: isLoading ? 0.6 : 1,
              }
            ]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={isLoading ? 1 : 0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.loginButtonText}>Masuk</ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ThemedText style={[styles.dividerText, { color: colors.textSecondary }]}>
            Atau
          </ThemedText>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        {/* Register Button */}
        <TouchableOpacity
          style={[
            styles.registerButton,
            {
              borderColor: colors.border,
              borderWidth: 1,
            },
          ]}
          onPress={onNavigateToRegister}
          disabled={isLoading}
        >
          <ThemedText style={[styles.registerButtonText, { color: colors.primary }]}>
            Daftar Akun
          </ThemedText>
        </TouchableOpacity>
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
  passwordLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotPassword: {
    fontSize: 13,
    fontWeight: '600',
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
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rememberText: {
    fontSize: 14,
  },
  loginButton: {
    paddingVertical: 14,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  registerButton: {
    paddingVertical: 14,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
