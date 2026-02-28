// Root routing - directs to user or admin interface based on role
import { AuthRouter } from '@/template';
import { Redirect } from 'expo-router';
import { useEwaste } from '@/hooks/useEwaste';
import { useAuth } from '@/template';
import { View, ActivityIndicator } from 'react-native';
import { theme } from '@/constants/theme';

export default function RootScreen() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: ewasteLoading } = useEwaste();

  if (authLoading || ewasteLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <AuthRouter loginRoute="/login">
      {isAdmin ? <Redirect href="/(admin)" /> : <Redirect href="/(tabs)" />}
    </AuthRouter>
  );
}