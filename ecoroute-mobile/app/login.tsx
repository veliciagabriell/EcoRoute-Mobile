import LoginScreen from '@/screens/login-screen';
import { useRouter } from 'expo-router';

export default function LoginRoute() {
  const router = useRouter();
  return <LoginScreen onNavigateToRegister={() => router.push('/register')} />;
}
