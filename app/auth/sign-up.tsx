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

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();

  async function handleSignUp() {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      Alert.alert('Pflichtfelder', 'Bitte E-Mail und Passwort eingeben.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Passwort zu kurz', 'Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      if (error) {
        Alert.alert('Registrierung fehlgeschlagen', error.message);
        return;
      }

      // Session is set automatically — _layout.tsx will detect it and redirect.
      // But we navigate to profile-setup first to collect firm details.
      router.replace('/auth/profile-setup');
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
        <Text style={[styles.title, { color: t.on_surface }]}>Konto erstellen</Text>
        <Text style={[styles.subtitle, { color: t.on_surface_variant }]}>
          Deine Daten bleiben in der EU und gehören nur dir.
        </Text>

        <View style={[styles.card, { backgroundColor: t.surface_card }]}>
          <Field
            label="E-Mail"
            value={email}
            onChangeText={setEmail}
            placeholder="name@firma.de"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            t={t}
          />
          <Field
            label="Passwort"
            value={password}
            onChangeText={setPassword}
            placeholder="Mindestens 8 Zeichen"
            secureTextEntry
            autoComplete="new-password"
            t={t}
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: loading ? t.surface_high : t.primary },
            pressed && !loading && { transform: [{ scale: 1.02 }] },
          ]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={t.on_surface_variant} />
          ) : (
            <Text style={[styles.primaryButtonText, { color: t.on_primary }]}>
              Konto erstellen
            </Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.linkButton, pressed && { opacity: 0.6 }]}
          onPress={() => router.replace('/auth/sign-in')}
        >
          <Text style={[styles.linkText, { color: t.on_surface_variant }]}>
            Bereits ein Konto?{' '}
            <Text style={{ color: t.on_surface, fontFamily: F.bodySemi }}>Anmelden</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  autoComplete,
  secureTextEntry,
  t,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words';
  autoComplete?: 'email' | 'new-password' | 'current-password';
  secureTextEntry?: boolean;
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: t.on_surface_variant }]}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, { color: t.on_surface, borderBottomColor: t.outline_variant + '66' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.outline}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'none'}
        autoComplete={autoComplete}
        secureTextEntry={secureTextEntry}
        returnKeyType="next"
      />
    </View>
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
