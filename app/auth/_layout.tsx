import { Stack } from 'expo-router';
import { useTheme } from '../../lib/theme';
import { F } from '../../lib/theme';

export default function AuthLayout() {
  const t = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: t.surface },
        headerTintColor: t.on_surface,
        headerTitleStyle: { fontFamily: F.headlineSemi, fontSize: 17 },
        contentStyle: { backgroundColor: t.surface },
        headerShadowVisible: false,
        headerBackTitle: 'Zurück',
      }}
    >
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up" options={{ title: 'Registrieren' }} />
      <Stack.Screen name="sign-in" options={{ title: 'Anmelden' }} />
      <Stack.Screen name="verify-email" options={{ headerShown: false }} />
      <Stack.Screen name="profile-setup" options={{ headerShown: false }} />
    </Stack>
  );
}
