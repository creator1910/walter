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
import { extractJobFromText } from '../lib/claude';
import { generateId, loadJobs, saveJob } from '../lib/storage';
import { Job } from '../types';

export default function NewJob() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCreate() {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const extracted = await extractJobFromText(input);
      const jobs = await loadJobs();
      const job: Job = {
        id: generateId(),
        createdAt: new Date().toISOString(),
        status: 'draft',
        customer: extracted.customer ?? { name: '' },
        description: extracted.description ?? input,
        lineItems: extracted.lineItems ?? [],
        vatRate: extracted.vatRate ?? 0.19,
        notes: extracted.notes ?? undefined,
      };
      await saveJob(job);
      router.replace(`/job/${job.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Fehler', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Beschreibe den Auftrag</Text>
        <Text style={styles.hint}>
          Z.B.: „Tapezierarbeiten bei Müller GmbH, Hauptstraße 5. 3 Zimmer, je 20m². Material und Arbeit."
        </Text>
        <TextInput
          style={styles.input}
          multiline
          placeholder="Beschreibung eingeben…"
          placeholderTextColor="#AEAEB2"
          value={input}
          onChangeText={setInput}
          autoFocus
          textAlignVertical="top"
        />
        <Pressable
          style={({ pressed }) => [
            styles.button,
            (!input.trim() || loading) && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleCreate}
          disabled={!input.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Auftrag erstellen</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 20, gap: 12 },
  label: { fontSize: 17, fontWeight: '600', color: '#1a1a1a' },
  hint: { fontSize: 14, color: '#8E8E93', lineHeight: 20 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    minHeight: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { backgroundColor: '#AEAEB2' },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
