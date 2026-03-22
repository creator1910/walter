import { useCallback, useState } from 'react';
import {
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
import { useFocusEffect } from 'expo-router';
import { loadProfile, saveProfile } from '../../lib/storage';
import { F, useTheme } from '../../lib/theme';
import { CompanyProfile } from '../../types';

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

export default function ProfileScreen() {
  const [profile, setProfile] = useState<CompanyProfile>(EMPTY);
  const [saving, setSaving] = useState(false);
  const t = useTheme();

  useFocusEffect(
    useCallback(() => {
      loadProfile().then(p => {
        if (p) setProfile(p);
      });
    }, [])
  );

  function set(field: keyof CompanyProfile, value: string) {
    setProfile(p => ({ ...p, [field]: value }));
  }

  async function handleSave() {
    if (!profile.name.trim()) {
      Alert.alert('Pflichtfeld', 'Bitte Firmenname eingeben.');
      return;
    }
    setSaving(true);
    try {
      await saveProfile(profile);
      Alert.alert('Gespeichert', 'Firmenprofil wurde gespeichert.');
    } catch {
      Alert.alert('Fehler', 'Profil konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: t.surface }]}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.section, { backgroundColor: t.surface_card }]}>
          <Text style={[styles.sectionTitle, { color: t.outline }]}>FIRMA</Text>
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

        <View style={[styles.section, { backgroundColor: t.surface_card }]}>
          <Text style={[styles.sectionTitle, { color: t.outline }]}>KONTAKT</Text>
          <Field label="Telefon" value={profile.phone} onChangeText={v => set('phone', v)} placeholder="+49 30 123456" keyboardType="phone-pad" t={t} />
          <Field label="E-Mail" value={profile.email} onChangeText={v => set('email', v)} placeholder="info@firma.de" keyboardType="email-address" autoCapitalize="none" t={t} />
        </View>

        <View style={[styles.section, { backgroundColor: t.surface_card }]}>
          <Text style={[styles.sectionTitle, { color: t.outline }]}>STEUER & BANK</Text>
          <Text style={[styles.hint, { color: t.on_surface_variant }]}>Pflichtangaben für rechtsgültige Rechnungen (§14 UStG)</Text>
          <Field label="Steuernummer" value={profile.taxNumber} onChangeText={v => set('taxNumber', v)} placeholder="12/345/67890" t={t} />
          <Field label="IBAN" value={profile.iban} onChangeText={v => set('iban', v)} placeholder="DE89 3704 0044 0532 0130 00" autoCapitalize="characters" t={t} />
          <Field label="BIC" value={profile.bic} onChangeText={v => set('bic', v)} placeholder="COBADEFFXXX" autoCapitalize="characters" t={t} />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: saving ? t.surface_high : t.primary },
            pressed && { transform: [{ scale: 1.02 }] },
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={[styles.buttonText, { color: saving ? t.outline : t.on_primary }]}>
            {saving ? 'Speichern…' : 'Speichern'}
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
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: t.on_surface_variant }]}>{label}</Text>
      <TextInput
        style={[styles.input, { color: t.on_surface, borderBottomColor: t.outline_variant }]}
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
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  section: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: F.labelSemi,
    textTransform: 'uppercase',
    letterSpacing: 0.05 * 11,
    marginBottom: 2,
  },
  hint: { fontSize: 13, fontFamily: F.body, marginTop: -4 },
  field: { gap: 4 },
  label: { fontSize: 13, fontFamily: F.bodyMedium },
  input: {
    fontSize: 15,
    fontFamily: F.body,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  row: { flexDirection: 'row', gap: 10 },
  zipField: { width: 90 },
  cityField: { flex: 1 },
  button: {
    borderRadius: 9999,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: { fontSize: 16, fontFamily: F.bodySemi },
});
