import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isRestoring } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments?.[0] === 'login' || segments?.[0] === 'register';
    if (!isRestoring && !isSignedIn && !inAuthGroup) {
      router.replace('/login');
    }
  }, [isRestoring, isSignedIn, router, segments]);

  if (isRestoring) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#1A365D" />
      </View>
    );
  }

  return <>{children}</>;
}
