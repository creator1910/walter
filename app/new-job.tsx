import { useEffect, useRef, useState } from 'react';
import { Camera, Mic, Square, X } from 'lucide-react-native';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { extractJobFromText, extractJobFromTextAndPhotos } from '../lib/claude';
import { generateId, loadJobs, saveJob, savePhoto } from '../lib/storage';
import { F, useTheme } from '../lib/theme';
import { AnalysisPreview, Job } from '../types';
import AnalysisPreviewCard from '../components/AnalysisPreviewCard';

type VoiceState = 'idle' | 'recording' | 'processing';

export default function NewJob() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [analyseError, setAnalyseError] = useState<'photo' | 'analyse' | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [photos, setPhotos] = useState<string[]>([]);
  const [analysisPreview, setAnalysisPreview] = useState<AnalysisPreview | null>(null);
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

  function handleCameraPress() {
    if (photos.length >= 3) return;
    ActionSheetIOS.showActionSheetWithOptions(
      { options: ['Abbrechen', 'Kamera', 'Fotobibliothek'], cancelButtonIndex: 0 },
      async buttonIndex => {
        if (buttonIndex === 1) {
          const { granted } = await ImagePicker.requestCameraPermissionsAsync();
          if (!granted) {
            Alert.alert(
              'Kamera nicht freigegeben',
              'Bitte erlaube Walter den Kamerazugriff in den Einstellungen.'
            );
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
          });
          if (!result.canceled && result.assets[0]) {
            setPhotos(prev => [...prev, result.assets[0].uri].slice(0, 3));
          }
        } else if (buttonIndex === 2) {
          const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!granted) {
            Alert.alert(
              'Fotobibliothek nicht freigegeben',
              'Bitte erlaube Walter den Zugriff auf die Fotos in den Einstellungen.'
            );
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
          });
          if (!result.canceled && result.assets[0]) {
            setPhotos(prev => [...prev, result.assets[0].uri].slice(0, 3));
          }
        }
      }
    );
  }

  async function handleAnalyse() {
    setAnalysing(true);
    setAnalyseError(null);
    try {
      const preview = await extractJobFromTextAndPhotos(input, photos);
      setAnalysisPreview(preview);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === 'PHOTO_READ_FAILED') {
        setAnalyseError('photo');
      } else {
        setAnalyseError('analyse');
      }
    } finally {
      setAnalysing(false);
    }
  }

  async function handleCreate() {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const extracted = await extractJobFromText(input);
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
      if (msg === 'PARSE_FAILED') {
        Alert.alert('Fehler', 'Antwort konnte nicht verarbeitet werden. Bitte erneut versuchen.');
      } else {
        Alert.alert('Fehler', msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptAnalysis(mode: 'detail' | 'edit') {
    if (!analysisPreview) return;
    setLoading(true);
    try {
      const jobId = generateId();
      const savedPhotos = await Promise.all(photos.map(uri => savePhoto(jobId, uri)));
      const job: Job = {
        id: jobId,
        createdAt: new Date().toISOString(),
        status: 'draft',
        customer: analysisPreview.job.customer ?? { name: '' },
        description: analysisPreview.job.description ?? input,
        lineItems: analysisPreview.job.lineItems ?? [],
        vatRate: analysisPreview.job.vatRate ?? 0.19,
        notes: analysisPreview.job.notes ?? undefined,
        photos: savedPhotos,
      };
      await saveJob(job);
      if (mode === 'detail') {
        router.replace(`/job/${job.id}`);
      } else {
        router.replace(`/job/edit/${job.id}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Fehler', msg);
      setLoading(false);
    }
  }

  const isRecording = voiceState === 'recording';
  const hasPhotos = photos.length > 0;
  const canSubmit =
    (input.trim().length > 0 || hasPhotos) && !loading && !analysing && !isRecording;
  const atPhotoLimit = photos.length >= 3;

  return (
    <View style={[styles.flex, { backgroundColor: t.surface }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.label, { color: t.on_surface }]}>Beschreibe den Auftrag</Text>
          <Text style={[styles.hint, { color: t.on_surface_variant }]}>
            Z.B.: „Tapezierarbeiten bei Müller GmbH, Hauptstraße 5. 3 Zimmer, je 20m². Material und Arbeit."
          </Text>

          {/* Pill input container */}
          {analysing ? (
            <View style={[styles.analysingContainer, { backgroundColor: t.surface_card }]}>
              <ActivityIndicator color={t.on_surface_variant} />
              <Text style={[styles.analysingText, { color: t.on_surface_variant }]}>
                Walter analysiert...
              </Text>
            </View>
          ) : analyseError ? (
            <View style={[styles.analysingContainer, { backgroundColor: t.surface_card }]}>
              <Text style={[styles.errorText, { color: t.error }]}>
                {analyseError === 'photo'
                  ? 'Foto konnte nicht gelesen werden. Bitte erneut versuchen.'
                  : 'Analyse fehlgeschlagen. Bitte erneut versuchen.'}
              </Text>
              <Pressable
                style={[styles.retryButton, { backgroundColor: t.surface_high }]}
                onPress={() => { setAnalyseError(null); handleAnalyse(); }}
              >
                <Text style={[styles.retryButtonText, { color: t.on_surface }]}>
                  Erneut versuchen
                </Text>
              </Pressable>
            </View>
          ) : (
            <View
              style={[
                styles.pillContainer,
                { backgroundColor: isRecording ? t.surface_high : t.surface_card },
              ]}
            >
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
              {/* Camera button — left of mic */}
              <Pressable
                style={[
                  styles.iconButton,
                  styles.cameraButton,
                  { backgroundColor: t.surface_high, opacity: atPhotoLimit ? 0.4 : 1 },
                ]}
                onPress={handleCameraPress}
                disabled={atPhotoLimit}
                accessibilityLabel="Foto hinzufügen"
              >
                <Camera size={20} color={t.on_surface_variant} strokeWidth={1.5} />
              </Pressable>
              {/* Mic button */}
              <Pressable
                style={({ pressed }) => [
                  styles.iconButton,
                  styles.micButton,
                  { backgroundColor: isRecording ? t.error : t.surface_high },
                  pressed && styles.iconButtonPressed,
                ]}
                onPress={handleVoicePress}
                accessibilityLabel={isRecording ? 'Aufnahme stoppen' : 'Spracheingabe starten'}
              >
                {isRecording ? (
                  <Square size={14} color={t.on_primary} fill={t.on_primary} strokeWidth={0} />
                ) : (
                  <Mic size={20} color={t.on_surface_variant} strokeWidth={1.5} />
                )}
              </Pressable>
            </View>
          )}

          {isRecording && (
            <View style={styles.recordingHint}>
              <View style={[styles.recordingDot, { backgroundColor: t.error }]} />
              <Text style={[styles.recordingText, { color: t.error }]}>
                Aufnahme läuft — tippe zum Stoppen
              </Text>
            </View>
          )}

          {/* Photo thumbnails */}
          {photos.length > 0 && (
            <View style={styles.thumbnailRow}>
              {photos.map((uri, i) => (
                <View key={uri} style={styles.thumbnailWrapper}>
                  <Image source={{ uri }} style={styles.thumbnail} />
                  <Pressable
                    style={[styles.removeButton, { backgroundColor: t.surface_card }]}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    onPress={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                    accessibilityLabel={`Foto ${i + 1} entfernen`}
                  >
                    <X size={10} color={t.on_surface_variant} strokeWidth={2.5} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: canSubmit ? t.primary : t.surface_high },
              pressed && { transform: [{ scale: 1.02 }] },
            ]}
            onPress={hasPhotos ? handleAnalyse : handleCreate}
            disabled={!canSubmit}
          >
            {loading ? (
              <ActivityIndicator color={t.on_primary} />
            ) : (
              <Text style={[styles.buttonText, { color: canSubmit ? t.on_primary : t.outline }]}>
                {hasPhotos ? 'Analysieren' : 'Auftrag erstellen'}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Backdrop + preview card — outside KeyboardAvoidingView */}
      {analysisPreview && (
        <>
          <Pressable
            style={[StyleSheet.absoluteFillObject, styles.backdrop]}
            onPress={() => setAnalysisPreview(null)}
          />
          <AnalysisPreviewCard
            preview={analysisPreview}
            onAccept={() => handleAcceptAnalysis('detail')}
            onEdit={() => handleAcceptAnalysis('edit')}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: 20, gap: 12 },
  label: { fontSize: 20, fontFamily: F.headlineSemi },
  hint: { fontSize: 15, fontFamily: F.body, lineHeight: 21 },

  pillContainer: {
    borderRadius: 20,
    minHeight: 160,
  },
  input: {
    padding: 16,
    paddingRight: 116, // space for 2 icon buttons (44+8+44+8=104) + right margin
    fontSize: 16,
    fontFamily: F.body,
    minHeight: 160,
    textAlignVertical: 'top',
  },

  iconButton: {
    position: 'absolute',
    top: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: { opacity: 0.8 },
  cameraButton: { right: 64 }, // 12 (mic margin) + 44 (mic) + 8 (gap)
  micButton: { right: 12 },


  recordingHint: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordingDot: { width: 8, height: 8, borderRadius: 4 },
  recordingText: { fontSize: 13, fontFamily: F.body },

  // Analysing / error state
  analysingContainer: {
    borderRadius: 20,
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
  },
  analysingText: { fontSize: 15, fontFamily: F.body },
  errorText: { fontSize: 15, fontFamily: F.body, textAlign: 'center' },
  retryButton: {
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: { fontSize: 15, fontFamily: F.bodySemi },

  // Photo thumbnails
  thumbnailRow: { flexDirection: 'row', gap: 8 },
  thumbnailWrapper: { position: 'relative' },
  thumbnail: { width: 48, height: 48, borderRadius: 8 },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  button: {
    borderRadius: 9999,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { fontSize: 16, fontFamily: F.bodySemi },

  backdrop: { backgroundColor: 'rgba(0,0,0,0.4)' },
});
