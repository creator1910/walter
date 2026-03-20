import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1a1a1a',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#f5f5f5' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Walter' }} />
        <Stack.Screen name="new-job" options={{ title: 'Neuer Auftrag', presentation: 'modal' }} />
        <Stack.Screen name="job/[id]" options={{ title: 'Auftrag' }} />
      </Stack>
    </>
  );
}
