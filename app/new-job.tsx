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
import { F, useTheme } from '../lib/theme';
import { Job } from '../types';

type VoiceState = 'idle' | 'recording' | 'processing';

export default function NewJob() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const router = useRouter();
  const partialRef = useRef('');
  const t = useTheme();

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
      style={[styles.container, { backgroundColor: t.surface }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.label, { color: t.on_surface }]}>Beschreibe den Auftrag</Text>
        <Text style={[styles.hint, { color: t.on_surface_variant }]}>
          Z.B.: „Tapezierarbeiten bei Müller GmbH, Hauptstraße 5. 3 Zimmer, je 20m². Material und Arbeit."
        </Text>

        {/* Pill input container with inset mic button */}
        <View style={[
          styles.pillContainer,
          { backgroundColor: t.surface_card },
          isRecording && { borderWidth: 1, borderColor: t.error },
        ]}>
          <TextInput
            style={[styles.input, { color: t.on_surface }]}
            multiline
            placeholder="Beschreibung eingeben oder Mikrofon tippen…"
            placeholderTextColor={t.outline}
            value={input}
            onChangeText={setInput}
            autoFocus
            textAlignVertical="top"
            editable={!isRecording}
          />
          <Pressable
            style={({ pressed }) => [
              styles.micButton,
              { backgroundColor: isRecording ? t.error : t.surface_high },
              pressed && styles.micButtonPressed,
            ]}
            onPress={handleVoicePress}
            accessibilityLabel={isRecording ? 'Aufnahme stoppen' : 'Spracheingabe starten'}
          >
            {isRecording ? (
              <View style={styles.stopIcon} />
            ) : (
              <View style={styles.micIconView}>
                <View style={[styles.micCapsule, { backgroundColor: t.on_surface_variant }]} />
                <View style={[styles.micStand, { borderColor: t.on_surface_variant }]} />
                <View style={[styles.micBase, { backgroundColor: t.on_surface_variant }]} />
              </View>
            )}
          </Pressable>
        </View>

        {isRecording && (
          <View style={styles.recordingHint}>
            <View style={[styles.recordingDot, { backgroundColor: t.error }]} />
            <Text style={[styles.recordingText, { color: t.error }]}>Aufnahme läuft — tippe zum Stoppen</Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: canSubmit ? t.primary : t.surface_high },
            pressed && { transform: [{ scale: 1.02 }] },
          ]}
          onPress={handleCreate}
          disabled={!canSubmit}
        >
          {loading ? (
            <ActivityIndicator color={t.on_primary} />
          ) : (
            <Text style={[styles.buttonText, { color: canSubmit ? t.on_primary : t.outline }]}>Auftrag erstellen</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, gap: 12 },
  label: { fontSize: 17, fontFamily: F.headlineSemi },
  hint: { fontSize: 15, fontFamily: F.body, lineHeight: 21 },

  pillContainer: {
    borderRadius: 24,
    minHeight: 160,
  },
  input: {
    padding: 16,
    paddingRight: 60,
    fontSize: 16,
    fontFamily: F.body,
    minHeight: 160,
    textAlignVertical: 'top',
  },

  micButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonPressed: { opacity: 0.8 },
  stopIcon: { width: 14, height: 14, borderRadius: 2, backgroundColor: '#fff' },
  micIconView: { alignItems: 'center' },
  micCapsule: { width: 10, height: 16, borderRadius: 5 },
  micStand: {
    width: 16, height: 6,
    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
    borderWidth: 2, borderTopWidth: 0,
    marginTop: 1,
  },
  micBase: { width: 12, height: 2, marginTop: 1 },

  recordingHint: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordingDot: { width: 8, height: 8, borderRadius: 4 },
  recordingText: { fontSize: 13, fontFamily: F.body },
  button: {
    borderRadius: 9999,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { fontSize: 16, fontFamily: F.bodySemi },
});
