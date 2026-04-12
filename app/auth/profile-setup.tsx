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
import { saveProfile } from '../../lib/storage';
import { supabase } from '../../lib/supabase';
import { F, useTheme } from '../../lib/theme';
import { CompanyProfile } from '../../types';
import { getMigrationState, runMigration } from '../../lib/migration';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EMPTY: CompanyProfile = {
  name: '',
  street: '',
  zip: '',
  city: '',
  phone: '',
  email: '',
  taxNumber: '',
  iban: '',
  bic: '',
};

export default function ProfileSetupScreen() {
  const [profile, setProfile] = useState<CompanyProfile>(EMPTY);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();

  function set(field: keyof CompanyProfile, value: string) {
    setProfile(p => ({ ...p, [field]: value }));
  }

  async function handleContinue() {
    if (!profile.name.trim()) {
      Alert.alert('Pflichtfeld', 'Bitte gib deinen Firmennamen ein.');
      return;
    }

    setSaving(true);
    try {
      // Save profile locally (quick, always succeeds)
      await saveProfile(profile);

      // Also upsert to Supabase profiles table
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from('profiles').upsert({
          id: session.user.id,
          firm_name: profile.name,
          street: profile.street || null,
          zip: profile.zip || null,
          city: profile.city || null,
          phone: profile.phone || null,
          email: profile.email || session.user.email || null,
          tax_number: profile.taxNumber || null,
          iban: profile.iban || null,
          bic: profile.bic || null,
        });
      }

      // Check if there are local jobs to migrate
      const migrationState = await getMigrationState();
      const localJobsRaw = await AsyncStorage.getItem('walter:jobs');
      const localJobs = localJobsRaw ? JSON.parse(localJobsRaw) : [];

      if (migrationState !== 'done' && localJobs.length > 0) {
        // Kick off migration in the background — don't block navigation
        runMigration().catch(() => {
          // Migration errors are non-fatal — user can retry from Settings
        });
      }

      router.replace('/');
    } catch {
      Alert.alert('Fehler', 'Profil konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    router.replace('/');
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: t.surface }]}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: t.on_surface }]}>Dein Firmenprofil</Text>
        <Text style={[styles.subtitle, { color: t.on_surface_variant }]}>
          Diese Daten erscheinen auf deinen Angeboten und Rechnungen.
        </Text>

        <View style={[styles.card, { backgroundColor: t.surface_card }]}>
          <Text style={[styles.sectionLabel, { color: t.outline }]}>FIRMA</Text>
          <Field label="Firmenname *" value={profile.name} onChangeText={v => set('name', v)} placeholder="Mustermann GmbH" t={t} />
          <Field label="Straße" value={profile.street} onChangeText={v => set('street', v)} placeholder="Hauptstraße 1" t={t} />
          <View style={styles.row}>
            <View style={styles.zipField}>
              <Field label="PLZ" value={profile.zip} onChangeText={v => set('zip', v)} placeholder="10115" keyboardType="number-pad" t={t} />
            </View>
            <View style={styles.cityField}>
              <Field label="Ort" value={profile.city} onChangeText={v => set('city', v)} placeholder="Berlin" t={t} />
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: t.surface_card }]}>
          <Text style={[styles.sectionLabel, { color: t.outline }]}>KONTAKT</Text>
          <Field label="Telefon" value={profile.phone} onChangeText={v => set('phone', v)} placeholder="+49 30 123456" keyboardType="phone-pad" t={t} />
          <Field label="E-Mail" value={profile.email} onChangeText={v => set('email', v)} placeholder="info@firma.de" keyboardType="email-address" autoCapitalize="none" t={t} />
        </View>

        <View style={[styles.card, { backgroundColor: t.surface_card }]}>
          <Text style={[styles.sectionLabel, { color: t.outline }]}>STEUER & BANK</Text>
          <Text style={[styles.hint, { color: t.on_surface_variant }]}>
            Pflichtangaben für rechtsgültige Rechnungen (§14 UStG)
          </Text>
          <Field label="Steuernummer" value={profile.taxNumber} onChangeText={v => set('taxNumber', v)} placeholder="12/345/67890" t={t} />
          <Field label="IBAN" value={profile.iban} onChangeText={v => set('iban', v)} placeholder="DE89 3704 0044 0532 0130 00" autoCapitalize="characters" t={t} />
          <Field label="BIC" value={profile.bic} onChangeText={v => set('bic', v)} placeholder="COBADEFFXXX" autoCapitalize="characters" t={t} />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: saving ? t.surface_high : t.primary },
            pressed && !saving && { transform: [{ scale: 1.02 }] },
          ]}
          onPress={handleContinue}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={t.on_surface_variant} />
          ) : (
            <Text style={[styles.primaryButtonText, { color: t.on_primary }]}>
              Weiter zur App
            </Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.skipButton, pressed && { opacity: 0.6 }]}
          onPress={handleSkip}
          disabled={saving}
        >
          <Text style={[styles.skipText, { color: t.outline }]}>
            Später ausfüllen
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
  t,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'words' | 'characters';
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
        autoCapitalize={autoCapitalize ?? 'words'}
        returnKeyType="next"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },

  title: { fontSize: 28, fontFamily: F.displayBold, letterSpacing: -0.5, lineHeight: 34 },
  subtitle: { fontSize: 15, fontFamily: F.body, lineHeight: 22, marginTop: -4 },

  card: { borderRadius: 16, padding: 16, gap: 12 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: F.labelSemi,
    textTransform: 'uppercase',
    letterSpacing: 0.05 * 11,
    marginBottom: 2,
  },
  hint: { fontSize: 13, fontFamily: F.body, marginTop: -4 },

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

  row: { flexDirection: 'row', gap: 10 },
  zipField: { width: 90 },
  cityField: { flex: 1 },

  primaryButton: {
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: { fontSize: 16, fontFamily: F.bodySemi },

  skipButton: { alignItems: 'center', paddingVertical: 12 },
  skipText: { fontSize: 15, fontFamily: F.body },
});
