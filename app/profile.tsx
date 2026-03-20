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
        placeholderTextColor="#AEAEB2"
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'words'}
        returnKeyType="next"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  hint: { fontSize: 13, color: '#8E8E93', marginTop: -4 },
  field: { gap: 4 },
  label: { fontSize: 13, fontWeight: '500', color: '#6B6B6B' },
  input: {
    fontSize: 15,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
  },
  row: { flexDirection: 'row', gap: 10 },
  zipField: { width: 90 },
  cityField: { flex: 1 },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#AEAEB2' },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
