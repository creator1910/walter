import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import JobForm, { JobFormValues, jobToFormValues } from '../../../components/JobForm';
import { loadJobs, saveJob } from '../../../lib/storage';
import { Job } from '../../../types';

const SENT_STATUSES = new Set(['quote_sent', 'accepted', 'invoiced', 'paid']);

export default function EditJob() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [values, setValues] = useState<JobFormValues | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

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
        style={({ pressed }) => [styles.saveBtn, saving && styles.saveBtnDisabled, pressed && styles.saveBtnPressed]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>{saving ? 'Speichern…' : 'Speichern'}</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  saveBtn: {
    position: 'absolute', bottom: 32, left: 16, right: 16,
    backgroundColor: '#007AFF', borderRadius: 12, padding: 16, alignItems: 'center',
    shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  saveBtnDisabled: { backgroundColor: '#AEAEB2' },
  saveBtnPressed: { opacity: 0.85 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
