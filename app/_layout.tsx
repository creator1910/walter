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
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';
import { F, useTheme } from '../lib/theme';
import type { Session } from '@supabase/supabase-js';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Geist_600SemiBold,
    Geist_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const [session, setSession] = useState<Session | null | undefined>(undefined); // undefined = loading
  const scheme = useColorScheme();
  const t = useTheme();
  const router = useRouter();
  const segments = useSegments();

  // Check initial session, then subscribe to auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redirect based on auth state (only after both fonts and session are ready)
  useEffect(() => {
    if (!fontsLoaded || session === undefined) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!session && !inAuthGroup) {
      router.replace('/auth/welcome');
    } else if (session && inAuthGroup) {
      router.replace('/');
    }
  }, [fontsLoaded, session, segments]);

  // Wait for fonts AND initial session check before rendering anything
  if (!fontsLoaded || session === undefined) return null;

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="jobs" options={{ title: 'Alle Aufträge' }} />
        <Stack.Screen name="new-job" options={{ title: 'Neuer Auftrag', presentation: 'modal' }} />
        <Stack.Screen name="job/[id]" options={{ title: 'Auftrag' }} />
        <Stack.Screen name="job/edit/[id]" options={{ title: 'Bearbeiten' }} />
      </Stack>
    </>
  );
}
