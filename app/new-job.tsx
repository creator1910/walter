import { useEffect, useRef, useState } from 'react';
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
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { extractJobFromText } from '../lib/claude';
import { generateId, loadJobs, saveJob } from '../lib/storage';
import { Job } from '../types';

type VoiceState = 'idle' | 'recording' | 'processing';

export default function NewJob() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const router = useRouter();
  const partialRef = useRef('');

  // Accumulate partial results while recording
  useSpeechRecognitionEvent('result', event => {
    const transcript = event.results[0]?.transcript ?? '';
    partialRef.current = transcript;
    setInput(transcript);
  });

  useSpeechRecognitionEvent('end', () => {
    if (voiceState === 'recording') {
      setVoiceState('idle');
    }
  });

  useSpeechRecognitionEvent('error', event => {
    setVoiceState('idle');
    if (event.error !== 'aborted') {
      Alert.alert('Spracherkennung fehlgeschlagen', 'Bitte versuche es erneut.');
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ExpoSpeechRecognitionModule.abort();
    };
  }, []);

  async function handleVoicePress() {
    if (voiceState === 'recording') {
      ExpoSpeechRecognitionModule.stop();
      setVoiceState('idle');
      return;
    }

    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      Alert.alert(
        'Mikrofon nicht freigegeben',
        'Bitte erlaube Walter den Zugriff auf Mikrofon und Spracherkennung in den Einstellungen.'
      );
      return;
    }

    partialRef.current = '';
    setInput('');
    setVoiceState('recording');
    ExpoSpeechRecognitionModule.start({
      lang: 'de-DE',
      interimResults: true,
      continuous: false,
    });
  }

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

  const isRecording = voiceState === 'recording';
  const canSubmit = input.trim().length > 0 && !loading && !isRecording;

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

        {/* Input row with mic button */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            multiline
            placeholder="Beschreibung eingeben oder Mikrofon tippen…"
            placeholderTextColor="#AEAEB2"
            value={input}
            onChangeText={setInput}
            autoFocus
            textAlignVertical="top"
            editable={!isRecording}
          />
          <Pressable
            style={({ pressed }) => [
              styles.micButton,
              isRecording && styles.micButtonActive,
              pressed && styles.micButtonPressed,
            ]}
            onPress={handleVoicePress}
            accessibilityLabel={isRecording ? 'Aufnahme stoppen' : 'Spracheingabe starten'}
          >
            <Text style={styles.micIcon}>{isRecording ? '⏹' : '🎙'}</Text>
          </Pressable>
        </View>

        {isRecording && (
          <View style={styles.recordingHint}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Aufnahme läuft — tippe ⏹ zum Stoppen</Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            !canSubmit && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleCreate}
          disabled={!canSubmit}
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
  inputRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  input: {
    flex: 1,
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
  micButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 4,
  },
  micButtonActive: {
    backgroundColor: '#FF3B30',
    shadowColor: '#FF3B30',
    shadowOpacity: 0.35,
  },
  micButtonPressed: { opacity: 0.8 },
  micIcon: { fontSize: 22 },
  recordingHint: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordingDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30',
  },
  recordingText: { fontSize: 13, color: '#FF3B30' },
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
