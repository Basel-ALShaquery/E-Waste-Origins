import { AlertProvider, AuthProvider, useAuth } from '@/template';
import { EwasteProvider } from '@/contexts/EwasteContext';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

// This component handles navigation logic based on auth state
function RootLayoutNav() {
  const { user, loading } = useAuth(); // Get user and loading state from AuthProvider
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Wait until auth state is loaded
    if (loading) return;

    // Check if we are in an auth screen (login) or in protected screens (tabs/admin)
    const inAuthScreen = segments[0] === 'login';
    const inTabs = segments[0] === '(tabs)';
    const inAdmin = segments[0] === '(admin)';

    // If user is not logged in and we are not on the login screen, redirect to login
    if (!user && !inAuthScreen) {
      router.replace('/login');
    }
    // If user is logged in and we are on the login screen, redirect to tabs
    else if (user && inAuthScreen) {
      router.replace('/(tabs)');
    }
    // If user is logged in and in (tabs) or (admin), do nothing
  }, [user, loading, segments]);

  // Show nothing while loading (optional)
  if (loading) {
    return null; // Or a loading spinner component
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(admin)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <EwasteProvider>
            <StatusBar style="light" />
            <RootLayoutNav />
          </EwasteProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}