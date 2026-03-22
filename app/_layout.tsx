import {
  Geist_600SemiBold,
  Geist_700Bold,
} from '@expo-google-fonts/geist';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../lib/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Geist_600SemiBold,
    Geist_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const scheme = useColorScheme();
  const t = useTheme();

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.surface },
          headerTintColor: t.on_surface,
          headerTitleStyle: { fontFamily: 'Geist_600SemiBold', fontSize: 17 },
          contentStyle: { backgroundColor: t.surface },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="jobs" options={{ title: 'Alle Aufträge' }} />
        <Stack.Screen name="new-job" options={{ title: 'Neuer Auftrag', presentation: 'modal' }} />
        <Stack.Screen name="job/[id]" options={{ title: 'Auftrag' }} />
        <Stack.Screen name="job/edit/[id]" options={{ title: 'Bearbeiten' }} />
      </Stack>
    </>
  );
}
