import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { 
  useFonts, 
  Manrope_400Regular, 
  Manrope_500Medium,
  Manrope_600SemiBold, 
  Manrope_700Bold 
} from '@expo-google-fonts/manrope';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { setupNotificationChannel, requestNotificationPermission } from '@/services/notification-service';
import { useTpsMonitor } from '@/hooks/use-tps-monitor';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isLoading, isRestoring, isSignedIn, user } = useAuth();
  
  const [fontsLoaded, fontError] = useFonts({
    Manrope: Manrope_400Regular,
    'Manrope-Medium': Manrope_500Medium,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
  });

  const segments = useSegments();
  const router = useRouter();

  // Enable TPS critical monitoring for petugas role
  useTpsMonitor(isSignedIn && user?.role === 'petugas');

  // Request notification permission when petugas signs in
  useEffect(() => {
    if (isSignedIn && user?.role === 'petugas') {
      setupNotificationChannel()
        .then(() => requestNotificationPermission())
        .catch((err) => console.warn('[Layout] Notification setup failed:', err));
    }
  }, [isSignedIn, user?.role]);

  // Hide splash screen once fonts are loaded
  useEffect(() => {
    if (fontError) throw fontError;
    if (fontsLoaded) {
      console.log('[Layout] Fonts loaded, hiding splash screen');
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (!fontsLoaded) {
      console.log('[Navigation] Waiting for fonts...');
      return;
    }

    const inAuthGroup = segments?.[0] === 'login' || segments?.[0] === 'register';
    const inTabsGroup = segments?.[0] === '(tabs)';
    console.log('[Navigation] Check:', { isSignedIn, inAuthGroup, inTabsGroup, segments: segments?.[0], isLoading, isRestoring });

    if (isLoading || isRestoring) return;

    // Jika sudah login dan belum di tab utama, redirect ke dashboard
    if (isSignedIn && !inTabsGroup) {
      const target = (user?.role === 'admin' || user?.role === 'petugas') ? '/(tabs)' : '/(tabs)/profile';
      console.log('[Navigation] Redirecting to:', target);
      router.replace(target);
    }
    // Jika belum login dan bukan di auth screen, redirect ke login
    else if (!isSignedIn && !inAuthGroup) {
      console.log('[Navigation] Redirecting to login');
      router.replace('/login');
    }
  }, [fontsLoaded, isSignedIn, user?.role, segments, router, isLoading, isRestoring]);

  // Show minimal UI while fonts load
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  // Always return the main Stack so expo-router's tree is preserved!
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colors.background },
          animationEnabled: true,
          transitionSpec: {
            open: { animation: 'timing', config: { duration: 300 } },
            close: { animation: 'timing', config: { duration: 300 } },
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, animationTypeForReplace: 'pop' }} />
        <Stack.Screen name="register" options={{ headerShown: false, animationTypeForReplace: 'pop' }} />
        <Stack.Screen 
          name="modal" 
          options={{ 
            presentation: 'modal',
            title: 'Modal',
            animationEnabled: true,
            transitionSpec: {
              open: { animation: 'timing', config: { duration: 400 } },
              close: { animation: 'timing', config: { duration: 400 } },
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
