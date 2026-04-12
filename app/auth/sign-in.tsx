import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { F, useTheme } from '../../lib/theme';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();

  async function handleSignIn() {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      Alert.alert('Pflichtfelder', 'Bitte E-Mail und Passwort eingeben.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        Alert.alert(
          'Anmeldung fehlgeschlagen',
          error.message === 'Invalid login credentials'
            ? 'E-Mail oder Passwort falsch.'
            : error.message
        );
      }
      // On success: session fires → _layout.tsx redirects to '/' automatically.
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: t.surface }]}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: t.on_surface }]}>Willkommen zurück</Text>
        <Text style={[styles.subtitle, { color: t.on_surface_variant }]}>
          Melde dich an, um deine Aufträge abzurufen.
        </Text>

        <View style={[styles.card, { backgroundColor: t.surface_card }]}>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: t.on_surface_variant }]}>E-Mail</Text>
            <TextInput
              style={[styles.fieldInput, { color: t.on_surface, borderBottomColor: t.outline_variant + '66' }]}
              value={email}
              onChangeText={setEmail}
              placeholder="name@firma.de"
              placeholderTextColor={t.outline}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: t.on_surface_variant }]}>Passwort</Text>
            <TextInput
              style={[styles.fieldInput, { color: t.on_surface, borderBottomColor: t.outline_variant + '66' }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Dein Passwort"
              placeholderTextColor={t.outline}
              secureTextEntry
              autoComplete="current-password"
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
            />
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: loading ? t.surface_high : t.primary },
            pressed && !loading && { transform: [{ scale: 1.02 }] },
          ]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={t.on_surface_variant} />
          ) : (
            <Text style={[styles.primaryButtonText, { color: loading ? t.outline : t.on_primary }]}>
              Anmelden
            </Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.linkButton, pressed && { opacity: 0.6 }]}
          onPress={() => router.replace('/auth/sign-up')}
        >
          <Text style={[styles.linkText, { color: t.on_surface_variant }]}>
            Noch kein Konto?{' '}
            <Text style={{ color: t.on_surface, fontFamily: F.bodySemi }}>Registrieren</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 24, gap: 20 },

  title: { fontSize: 28, fontFamily: F.displayBold, letterSpacing: -0.5, lineHeight: 34 },
  subtitle: { fontSize: 15, fontFamily: F.body, lineHeight: 22, marginTop: -8 },

  card: { borderRadius: 16, padding: 16, gap: 16 },

  field: { gap: 4 },
  fieldLabel: {
    fontSize: 11,
    fontFamily: F.labelSemi,
    textTransform: 'uppercase',
    letterSpacing: 0.05 * 11,
  },
  fieldInput: {
    fontSize: 15,
    fontFamily: F.body,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },

  primaryButton: {
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: { fontSize: 16, fontFamily: F.bodySemi },

  linkButton: { alignItems: 'center', paddingVertical: 8 },
  linkText: { fontSize: 15, fontFamily: F.body },
});
