import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import SplashScreen from '@/components/splash-screen';
import LoginScreen from '@/screens/login-screen';
import RegisterScreen from '@/screens/register-screen';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isLoading, isSignedIn } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register'>('login');

  // Show splash screen while checking auth
  if (isLoading) {
    return <SplashScreen />;
  }

  // Show login/register screens if not signed in
  if (!isSignedIn) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {currentScreen === 'login' ? (
          <LoginScreen onNavigateToRegister={() => setCurrentScreen('register')} />
        ) : (
          <RegisterScreen onNavigateToLogin={() => setCurrentScreen('login')} />
        )}
      </View>
    );
  }

  // Show main app if signed in
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colors.background },
          animationEnabled: true,
          animationTypeForReplace: false,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="modal" 
          options={{ 
            presentation: 'modal',
            title: 'Modal',
            animationEnabled: true,
            transitionSpec: {
              open: {
                animation: 'timing',
                config: {
                  duration: 400,
                },
              },
              close: {
                animation: 'timing',
                config: {
                  duration: 400,
                },
              },
            },
          }} 
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}
