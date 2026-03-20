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
import { C } from '../lib/theme';
import { Job } from '../types';

type VoiceState = 'idle' | 'recording' | 'processing';

export default function NewJob() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const router = useRouter();
  const partialRef = useRef('');

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

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            multiline
            placeholder="Beschreibung eingeben oder Mikrofon tippen…"
            placeholderTextColor={C.textDim}
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
            {isRecording ? (
              <View style={styles.stopIcon} />
            ) : (
              <View style={styles.micIconView}>
                <View style={styles.micCapsule} />
                <View style={styles.micStand} />
                <View style={styles.micBase} />
              </View>
            )}
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
            <ActivityIndicator color="#111111" />
          ) : (
            <Text style={styles.buttonText}>Auftrag erstellen</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20, gap: 12 },
  label: { fontSize: 17, fontFamily: 'DMSans_600SemiBold', color: C.text },
  hint: { fontSize: 14, fontFamily: 'DMSans_400Regular', color: C.textMid, lineHeight: 20 },
  inputRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  input: {
    flex: 1,
    backgroundColor: C.surface2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border2,
    padding: 16,
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
    color: C.text,
    minHeight: 160,
  },
  micButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  micButtonActive: {
    backgroundColor: '#D95535',
    borderColor: '#D95535',
  },
  micButtonPressed: { opacity: 0.8 },
  stopIcon: { width: 14, height: 14, borderRadius: 2, backgroundColor: '#fff' },
  micIconView: { alignItems: 'center' },
  micCapsule: { width: 10, height: 16, borderRadius: 5, backgroundColor: C.amber },
  micStand: {
    width: 16, height: 6,
    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
    borderWidth: 2, borderTopWidth: 0, borderColor: C.amber,
    marginTop: 1,
  },
  micBase: { width: 12, height: 2, backgroundColor: C.amber, marginTop: 1 },
  recordingHint: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D95535' },
  recordingText: { fontSize: 13, fontFamily: 'DMSans_400Regular', color: '#D95535' },
  button: {
    backgroundColor: C.amber,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { backgroundColor: C.border2 },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: '#111111', fontSize: 16, fontFamily: 'DMSans_600SemiBold' },
});
