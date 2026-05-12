import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
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
import SplashScreen from '@/components/splash-screen';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isLoading, isSignedIn, user } = useAuth();
  
  const [fontsLoaded] = useFonts({
    Manrope: Manrope_400Regular,
    'Manrope-Medium': Manrope_500Medium,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
  });

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !fontsLoaded) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (!isSignedIn && !inAuthGroup) {
      // Redirect to login if user is not signed in and trying to access other screens
      router.replace('/login');
    } else if (isSignedIn && inAuthGroup) {
      // Redirect to specific tab based on role
      if (user?.role === 'admin') {
        router.replace('/(tabs)');
      } else {
        router.replace('/(tabs)/profile');
      }
    }
  }, [isLoading, isSignedIn, user, segments, router, fontsLoaded]);

  // Show splash screen while checking auth
  if (isLoading || !fontsLoaded) {
    return <SplashScreen />;
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
