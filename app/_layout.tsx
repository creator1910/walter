import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  useFonts,
} from '@expo-google-fonts/dm-sans';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1C1C1C' },
          headerTintColor: '#F5F4F2',
          headerTitleStyle: { fontFamily: 'DMSans_600SemiBold', fontSize: 17 },
          contentStyle: { backgroundColor: '#111111' },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Walter' }} />
        <Stack.Screen name="new-job" options={{ title: 'Neuer Auftrag', presentation: 'modal' }} />
        <Stack.Screen name="job/[id]" options={{ title: 'Auftrag' }} />
        <Stack.Screen name="job/edit/[id]" options={{ title: 'Bearbeiten' }} />
        <Stack.Screen name="profile" options={{ title: 'Firmenprofil', presentation: 'modal' }} />
      </Stack>
    </>
  );
}
