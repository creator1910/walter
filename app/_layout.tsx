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
import * as Linking from 'expo-linking';
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
  const [hasProfile, setHasProfile] = useState<boolean | undefined>(undefined);
  const scheme = useColorScheme();
  const t = useTheme();
  const router = useRouter();
  const segments = useSegments();

  // Exchange deep-link auth tokens (arrives after email confirmation tap)
  async function handleDeepLink(url: string) {
    const fragment = url.includes('#') ? url.split('#')[1] : '';
    if (!fragment) return;
    const params = new URLSearchParams(fragment);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (accessToken && refreshToken) {
      await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    }
  }

  // Check initial session, subscribe to auth changes, and handle deep links
  useEffect(() => {
    // Initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
    });

    // Auth state changes (login, logout, token refresh, email confirmation)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    // Deep link: app already open (background → foreground via confirmation link)
    const linkSub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));

    // Deep link: app was closed and opened via confirmation link
    Linking.getInitialURL().then(url => { if (url) handleDeepLink(url); });

    return () => {
      subscription.unsubscribe();
      linkSub.remove();
    };
  }, []);

  // When session appears, check whether this user has filled in their profile
  useEffect(() => {
    if (!session) {
      setHasProfile(undefined);
      return;
    }
    supabase
      .from('profiles')
      .select('firm_name')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        setHasProfile(!!(data as { firm_name?: string } | null)?.firm_name);
      });
  }, [session?.user.id]);

  // Redirect based on auth state (only after fonts, session, and profile check are ready)
  useEffect(() => {
    if (!fontsLoaded || session === undefined) return;

    const segs = segments as string[];
    const inAuthGroup = segs[0] === 'auth';
    const inVerifyEmail = segs[1] === 'verify-email';

    if (!session && !inAuthGroup) {
      router.replace('/auth/welcome');
    } else if (session && inAuthGroup && !inVerifyEmail) {
      // Profile check not yet complete → wait
      if (hasProfile === undefined) return;
      router.replace(hasProfile ? '/' : '/auth/profile-setup');
    }
  }, [fontsLoaded, session, segments, hasProfile]);

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
