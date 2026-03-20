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
import { useFocusEffect, useRouter } from 'expo-router';
import { loadProfile, saveProfile } from '../lib/storage';
import { C } from '../lib/theme';
import { CompanyProfile } from '../types';

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
  const router = useRouter();

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
      router.back();
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
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Firma</Text>
          <Field label="Firmenname *" value={profile.name} onChangeText={v => set('name', v)} placeholder="Mustermann GmbH" />
          <Field label="Straße" value={profile.street} onChangeText={v => set('street', v)} placeholder="Hauptstraße 1" />
          <View style={styles.row}>
            <View style={styles.zipField}>
              <Field label="PLZ" value={profile.zip} onChangeText={v => set('zip', v)} placeholder="10115" keyboardType="number-pad" />
            </View>
            <View style={styles.cityField}>
              <Field label="Ort" value={profile.city} onChangeText={v => set('city', v)} placeholder="Berlin" />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kontakt</Text>
          <Field label="Telefon" value={profile.phone} onChangeText={v => set('phone', v)} placeholder="+49 30 123456" keyboardType="phone-pad" />
          <Field label="E-Mail" value={profile.email} onChangeText={v => set('email', v)} placeholder="info@firma.de" keyboardType="email-address" autoCapitalize="none" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Steuer & Bank</Text>
          <Text style={styles.hint}>Pflichtangaben für rechtsgültige Rechnungen (§14 UStG)</Text>
          <Field label="Steuernummer" value={profile.taxNumber} onChangeText={v => set('taxNumber', v)} placeholder="12/345/67890" />
          <Field label="IBAN" value={profile.iban} onChangeText={v => set('iban', v)} placeholder="DE89 3704 0044 0532 0130 00" autoCapitalize="characters" />
          <Field label="BIC" value={profile.bic} onChangeText={v => set('bic', v)} placeholder="COBADEFFXXX" autoCapitalize="characters" />
        </View>

        <Pressable
          style={({ pressed }) => [styles.button, saving && styles.buttonDisabled, pressed && styles.buttonPressed]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.buttonText}>{saving ? 'Speichern…' : 'Speichern'}</Text>
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
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textDim}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'words'}
        returnKeyType="next"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  section: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    color: C.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  hint: { fontSize: 13, fontFamily: 'DMSans_400Regular', color: C.textMid, marginTop: -4 },
  field: { gap: 4 },
  label: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: C.textMid },
  input: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: C.text,
    borderWidth: 1,
    borderColor: C.border2,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: C.surface2,
  },
  row: { flexDirection: 'row', gap: 10 },
  zipField: { width: 90 },
  cityField: { flex: 1 },
  button: {
    backgroundColor: C.amber,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: C.border2 },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: '#111111', fontSize: 16, fontFamily: 'DMSans_600SemiBold' },
});
