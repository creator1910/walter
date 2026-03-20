import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { calculateTotals } from '../../lib/claude';
import { generateAndSharePDF } from '../../lib/pdf';
import { generateDocNumber, loadJobs, saveJob } from '../../lib/storage';
import { Job, JobStatus } from '../../types';

const NEXT_STATUS: Partial<Record<JobStatus, JobStatus>> = {
  draft: 'quote_sent',
  quote_sent: 'accepted',
  accepted: 'invoiced',
  invoiced: 'paid',
};

const NEXT_LABEL: Partial<Record<JobStatus, string>> = {
  draft: 'Angebot versenden',
  quote_sent: 'Als angenommen markieren',
  accepted: 'Rechnung stellen',
  invoiced: 'Als bezahlt markieren',
};

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [sharingPDF, setSharingPDF] = useState(false);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadJobs().then(jobs => {
        const found = jobs.find(j => j.id === id);
        if (found) setJob(found);
      });
    }, [id])
  );

  if (!job) return null;

  const { net, vat, gross } = calculateTotals(job.lineItems, job.vatRate);
  const nextStatus = NEXT_STATUS[job.status];
  const nextLabel = NEXT_LABEL[job.status];

  async function handleSharePDF() {
    if (!job) return;
    setSharingPDF(true);
    try {
      await generateAndSharePDF(job);
    } catch (e) {
      Alert.alert('Fehler', 'PDF konnte nicht erstellt werden.');
    } finally {
      setSharingPDF(false);
    }
  }

  async function advanceStatus() {
    if (!job || !nextStatus) return;
    const jobs = await loadJobs();
    const updated: Job = {
      ...job,
      status: nextStatus,
      ...(nextStatus === 'quote_sent' && !job.quoteNumber
        ? { quoteNumber: generateDocNumber('AN', jobs), quoteDate: new Date().toISOString() }
        : {}),
      ...(nextStatus === 'invoiced' && !job.invoiceNumber
        ? { invoiceNumber: generateDocNumber('RE', jobs), invoiceDate: new Date().toISOString() }
        : {}),
    };
    await saveJob(updated);
    setJob(updated);
  }

  function formatCurrency(amount: number) {
    return amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.card}>
        <Text style={styles.customerName}>{job.customer.name || '—'}</Text>
        {job.customer.address && <Text style={styles.meta}>{job.customer.address}</Text>}
        {job.customer.phone && <Text style={styles.meta}>{job.customer.phone}</Text>}
        {job.customer.email && <Text style={styles.meta}>{job.customer.email}</Text>}
      </View>

      {/* Document numbers */}
      {(job.quoteNumber || job.invoiceNumber) && (
        <View style={styles.card}>
          {job.quoteNumber && (
            <Row label="Angebotsnr." value={job.quoteNumber} />
          )}
          {job.invoiceNumber && (
            <Row label="Rechnungsnr." value={job.invoiceNumber} />
          )}
        </View>
      )}

      {/* Description */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Leistungsbeschreibung</Text>
        <Text style={styles.description}>{job.description}</Text>
      </View>

      {/* Line items */}
      {job.lineItems.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Positionen</Text>
          {job.lineItems.map((item, i) => (
            <View key={i} style={styles.lineItem}>
              <View style={styles.lineItemLeft}>
                <Text style={styles.lineItemDesc}>{item.description}</Text>
                <Text style={styles.lineItemQty}>
                  {item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}
                </Text>
              </View>
              <Text style={styles.lineItemTotal}>
                {formatCurrency(item.quantity * item.unitPrice)}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <Row label="Netto" value={formatCurrency(net)} />
          <Row label={`MwSt. ${job.vatRate * 100}%`} value={formatCurrency(vat)} />
          <Row label="Gesamt" value={formatCurrency(gross)} bold />
        </View>
      )}

      {/* Notes */}
      {job.notes && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Hinweise</Text>
          <Text style={styles.description}>{job.notes}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          onPress={() => router.push(`/job/edit/${job.id}`)}
        >
          <Text style={styles.secondaryButtonText}>Bearbeiten</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, sharingPDF && styles.buttonDisabled, pressed && styles.buttonPressed]}
          onPress={handleSharePDF}
          disabled={sharingPDF}
        >
          <Text style={styles.secondaryButtonText}>{sharingPDF ? 'PDF…' : 'PDF teilen'}</Text>
        </Pressable>
      </View>
      {nextLabel && (
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={advanceStatus}
        >
          <Text style={styles.buttonText}>{nextLabel}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.bold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  customerName: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  meta: { fontSize: 14, color: '#6B6B6B', marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  description: { fontSize: 15, color: '#1a1a1a', lineHeight: 22 },
  lineItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8 },
  lineItemLeft: { flex: 1, marginRight: 12 },
  lineItemDesc: { fontSize: 15, color: '#1a1a1a' },
  lineItemQty: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  lineItemTotal: { fontSize: 15, color: '#1a1a1a', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginVertical: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { fontSize: 15, color: '#6B6B6B' },
  rowValue: { fontSize: 15, color: '#1a1a1a' },
  bold: { fontWeight: '700', color: '#1a1a1a' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  secondaryButton: {
    flex: 1, borderWidth: 1.5, borderColor: '#007AFF',
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  secondaryButtonText: { color: '#007AFF', fontSize: 15, fontWeight: '600' },
  buttonDisabled: { borderColor: '#AEAEB2' },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
