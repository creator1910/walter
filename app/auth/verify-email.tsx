import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { F, useTheme } from '../../lib/theme';

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Check if the user already filled in their profile (e.g. re-confirming)
        const { data } = await supabase
          .from('profiles')
          .select('firm_name')
          .eq('id', session.user.id)
          .single();

        if (data?.firm_name) {
          router.replace('/');
        } else {
          router.replace('/auth/profile-setup');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleResend() {
    if (!email) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) {
        Alert.alert('Fehler', 'E-Mail konnte nicht erneut gesendet werden.');
      } else {
        Alert.alert('Gesendet', 'Wir haben dir eine neue E-Mail geschickt.');
      }
    } finally {
      setResending(false);
    }
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: t.surface,
          paddingTop: insets.top + 48,
          paddingBottom: insets.bottom + 32,
        },
      ]}
    >
      {/* Envelope icon — drawn, no emoji */}
      <View style={[styles.iconWrap, { backgroundColor: t.surface_card }]}>
        <View style={[styles.envFlap, { borderColor: t.on_surface }]} />
        <View style={[styles.envBody, { borderColor: t.on_surface }]}>
          <View style={[styles.envLine, { backgroundColor: t.outline }]} />
          <View style={[styles.envLineShort, { backgroundColor: t.outline }]} />
        </View>
      </View>

      <Text style={[styles.title, { color: t.on_surface }]}>
        Posteingang prüfen
      </Text>

      <Text style={[styles.body, { color: t.on_surface_variant }]}>
        Wir haben einen Bestätigungslink an
      </Text>
      <Text style={[styles.email, { color: t.on_surface }]}>
        {email ?? 'deine E-Mail-Adresse'}
      </Text>
      <Text style={[styles.body, { color: t.on_surface_variant }]}>
        geschickt. Öffne die E-Mail und tippe auf den Link — danach geht es automatisch weiter.
      </Text>

      <View style={styles.spacer} />

      {/* Resend */}
      <Pressable
        style={({ pressed }) => [
          styles.resendButton,
          { backgroundColor: t.surface_high },
          pressed && { opacity: 0.7 },
        ]}
        onPress={handleResend}
        disabled={resending}
      >
        {resending ? (
          <ActivityIndicator color={t.on_surface_variant} />
        ) : (
          <Text style={[styles.resendText, { color: t.on_surface }]}>
            E-Mail erneut senden
          </Text>
        )}
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
        onPress={() => router.replace('/auth/sign-up')}
      >
        <Text style={[styles.backText, { color: t.outline }]}>
          Andere E-Mail verwenden
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
  },

  // Envelope icon
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  envFlap: {
    width: 36,
    height: 18,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    position: 'absolute',
    top: 18,
  },
  envBody: {
    width: 36,
    height: 22,
    borderWidth: 2,
    borderRadius: 2,
    position: 'absolute',
    bottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  envLine: {
    width: 20,
    height: 1.5,
    borderRadius: 1,
  },
  envLineShort: {
    width: 14,
    height: 1.5,
    borderRadius: 1,
  },

  title: {
    fontSize: 28,
    fontFamily: F.headlineSemi,
    letterSpacing: -0.5,
    lineHeight: 34,
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    fontSize: 15,
    fontFamily: F.body,
    lineHeight: 22,
    textAlign: 'center',
  },
  email: {
    fontSize: 15,
    fontFamily: F.bodySemi,
    lineHeight: 22,
    textAlign: 'center',
  },

  spacer: { flex: 1 },

  resendButton: {
    width: '100%',
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  resendText: { fontSize: 16, fontFamily: F.bodySemi },

  backButton: { paddingVertical: 12, alignItems: 'center' },
  backText: { fontSize: 15, fontFamily: F.body },
});
