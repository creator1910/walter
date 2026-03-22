import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import JobForm, { JobFormValues, jobToFormValues } from '../../../components/JobForm';
import { loadJobs, saveJob } from '../../../lib/storage';
import { F, useTheme } from '../../../lib/theme';
import { Job } from '../../../types';

const SENT_STATUSES = new Set(['quote_sent', 'accepted', 'invoiced', 'paid']);

export default function EditJob() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [values, setValues] = useState<JobFormValues | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useTheme();

  useFocusEffect(
    useCallback(() => {
      loadJobs().then(jobs => {
        const found = jobs.find(j => j.id === id);
        if (found) {
          setJob(found);
          setValues(jobToFormValues(found));
        }
      });
    }, [id])
  );

  async function handleSave() {
    if (!job || !values) return;

    if (SENT_STATUSES.has(job.status)) {
      await new Promise<void>(resolve => {
        Alert.alert(
          'Dokument bereits versendet',
          'Dieses Dokument wurde bereits versendet. Änderungen können zu Widersprüchen führen.',
          [
            { text: 'Abbrechen', style: 'cancel', onPress: () => resolve() },
            { text: 'Trotzdem speichern', style: 'destructive', onPress: () => { doSave(); resolve(); } },
          ]
        );
      });
      return;
    }

    doSave();
  }

  async function doSave() {
    if (!job || !values) return;
    setSaving(true);
    try {
      const updated: Job = {
        ...job,
        customer: values.customer,
        description: values.description,
        lineItems: values.lineItems,
        vatRate: values.vatRate,
        notes: values.notes || undefined,
      };
      await saveJob(updated);
      router.back();
    } catch (e) {
      Alert.alert('Fehler', 'Speichern fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setSaving(false);
    }
  }

  if (!job || !values) return null;

  return (
    <>
      <JobForm values={values} onChange={setValues} />
      <Pressable
        style={({ pressed }) => [
          styles.saveBtn,
          { bottom: insets.bottom + 16, backgroundColor: saving ? t.surface_high : t.primary },
          pressed && { transform: [{ scale: 1.02 }] },
        ]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={[styles.saveBtnText, { color: saving ? t.outline : t.on_primary }]}>
          {saving ? 'Speichern…' : 'Speichern'}
        </Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  saveBtn: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 9999,
    padding: 16,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 16, fontFamily: F.bodySemi },
});
