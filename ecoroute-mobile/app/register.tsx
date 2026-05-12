import RegisterScreen from '@/screens/register-screen';
import { useRouter } from 'expo-router';

export default function RegisterRoute() {
  const router = useRouter();
  return <RegisterScreen onNavigateToLogin={() => router.push('/login')} />;
}
