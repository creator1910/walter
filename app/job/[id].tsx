import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { calculateTotals } from '../../lib/claude';
import { generateAndSharePDF } from '../../lib/pdf';
import { deletePhoto, generateDocNumber, loadJobs, saveJob, savePhoto } from '../../lib/storage';
import { C, STATUS_BG, STATUS_LABEL, STATUS_TEXT } from '../../lib/theme';
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

function formatJobDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

const DOT_STAGES: Array<{ key: keyof typeof STAGE_DATE_MAP; label: string }> = [
  { key: 'draft',      label: 'Entwurf' },
  { key: 'quote_sent', label: 'Angebot' },
  { key: 'accepted',   label: 'Angenom.' },
  { key: 'invoiced',   label: 'Rechnung' },
  { key: 'paid',       label: 'Bezahlt' },
];

const STAGE_ORDER: JobStatus[] = ['draft', 'quote_sent', 'accepted', 'invoiced', 'paid'];

// Keys map each stage to the Job field that records when it was reached
const STAGE_DATE_MAP = {
  draft:      'createdAt',
  quote_sent: 'quoteDate',
  accepted:   'acceptedAt',
  invoiced:   'invoiceDate',
  paid:       'paidAt',
} as const;

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [sharingPDF, setSharingPDF] = useState<'quote' | 'invoice' | null>(null);
  const [advancingStatus, setAdvancingStatus] = useState(false);
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

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

  async function handleSharePDF(docType: 'quote' | 'invoice') {
    if (!job) return;
    setSharingPDF(docType);
    try {
      await generateAndSharePDF(job, docType);
    } catch (e) {
      Alert.alert('Fehler', 'PDF konnte nicht erstellt werden.');
    } finally {
      setSharingPDF(null);
    }
  }

  async function advanceStatus() {
    if (!job || !nextStatus || advancingStatus) return;
    setAdvancingStatus(true);
    try {
      const jobs = await loadJobs();
      const now = new Date().toISOString();
      const updated: Job = {
        ...job,
        status: nextStatus,
        ...(nextStatus === 'quote_sent' && !job.quoteNumber
          ? { quoteNumber: generateDocNumber('AN', jobs), quoteDate: now }
          : {}),
        ...(nextStatus === 'accepted'
          ? { acceptedAt: now }
          : {}),
        ...(nextStatus === 'invoiced' && !job.invoiceNumber
          ? { invoiceNumber: generateDocNumber('RE', jobs), invoiceDate: now }
          : {}),
        ...(nextStatus === 'paid'
          ? { paidAt: now }
          : {}),
      };
      await saveJob(updated);
      setJob(updated);

      if (nextStatus === 'quote_sent') {
        try {
          await generateAndSharePDF(updated, 'quote');
        } catch {
          Alert.alert('Fehler', 'PDF konnte nicht erstellt werden.');
        }
      } else if (nextStatus === 'invoiced') {
        try {
          await generateAndSharePDF(updated, 'invoice');
        } catch {
          Alert.alert('Fehler', 'PDF konnte nicht erstellt werden.');
        }
      }
    } finally {
      setAdvancingStatus(false);
    }
  }

  async function handleAddPhoto() {
    if (!job) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: false,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      const uri = await savePhoto(job.id, result.assets[0].uri);
      const updated = { ...job, photos: [...(job.photos ?? []), uri] };
      await saveJob(updated);
      setJob(updated);
    } catch {
      Alert.alert('Fehler', 'Foto konnte nicht gespeichert werden.');
    }
  }

  async function handleDeletePhoto(uri: string) {
    if (!job) return;
    Alert.alert('Foto löschen', 'Dieses Foto wirklich löschen?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen', style: 'destructive', onPress: async () => {
          await deletePhoto(uri);
          const updated = { ...job, photos: (job.photos ?? []).filter(p => p !== uri) };
          await saveJob(updated);
          setJob(updated);
        },
      },
    ]);
  }

  function formatCurrency(amount: number) {
    return amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  }

  return (
    <View style={styles.container}>
      {/* Hero block — Gesamtbetrag at top */}
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Gesamtbetrag inkl. MwSt.</Text>
        <Text style={styles.heroAmount}>{formatCurrency(gross)}</Text>
        <View style={[styles.heroBadge, { backgroundColor: STATUS_BG[job.status] }]}>
          <View style={[styles.heroBadgeDot, { backgroundColor: STATUS_TEXT[job.status] }]} />
          <Text style={[styles.heroBadgeText, { color: STATUS_TEXT[job.status] }]}>
            {STATUS_LABEL[job.status]}
          </Text>
        </View>
        {/* Progress dots row */}
        <View style={styles.dotsRow}>
          {DOT_STAGES.map(({ key, label }) => {
            const currentIndex = STAGE_ORDER.indexOf(job.status);
            const stageIndex = STAGE_ORDER.indexOf(key);
            const isDone = stageIndex < currentIndex;
            const isCurrent = stageIndex === currentIndex;
            const dateField = STAGE_DATE_MAP[key];
            const dateValue = job[dateField as keyof Job] as string | undefined;
            return (
              <View key={key} style={styles.dotColumn}>
                <View style={[
                  styles.dot,
                  isDone && styles.dotDone,
                  isCurrent && styles.dotCurrent,
                  !isDone && !isCurrent && styles.dotFuture,
                ]} />
                {dateValue ? (
                  <Text style={styles.dotDate}>{formatJobDate(dateValue)}</Text>
                ) : (
                  <View style={styles.dotDatePlaceholder} />
                )}
                <Text style={styles.dotLabel}>{label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Customer */}
        <View style={styles.card}>
          <Text style={styles.customerName}>{job.customer.name || '—'}</Text>
          {job.customer.address && <Text style={styles.meta}>{job.customer.address}</Text>}
          {job.customer.phone && <Text style={styles.meta}>{job.customer.phone}</Text>}
          {job.customer.email && <Text style={styles.meta}>{job.customer.email}</Text>}
        </View>

        {/* Document numbers */}
        {(job.quoteNumber || job.invoiceNumber) && (
          <View style={styles.card}>
            {job.quoteNumber && <Row label="Angebotsnr." value={job.quoteNumber} />}
            {job.invoiceNumber && <Row label="Rechnungsnr." value={job.invoiceNumber} />}
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

        {/* Photos */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Fotos</Text>
          <View style={styles.photoGrid}>
            {(job.photos ?? []).map(uri => (
              <Pressable
                key={uri}
                onPress={() => setLightboxUri(uri)}
                onLongPress={() => handleDeletePhoto(uri)}
                style={styles.photoThumb}
              >
                <Image source={{ uri }} style={styles.photoImage} />
              </Pressable>
            ))}
            <Pressable style={styles.addPhotoButton} onPress={handleAddPhoto}>
              <View style={styles.addPhotoIcon}>
                <View style={styles.addPhotoH} />
                <View style={styles.addPhotoV} />
              </View>
            </Pressable>
          </View>
          {(job.photos ?? []).length > 0 && (
            <Text style={styles.photoHint}>Gedrückt halten zum Löschen</Text>
          )}
        </View>

        {/* Bottom spacer so content clears the fixed bar */}
        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Lightbox */}
      <Modal visible={lightboxUri !== null} transparent animationType="fade" onRequestClose={() => setLightboxUri(null)}>
        <Pressable style={styles.lightboxBackdrop} onPress={() => setLightboxUri(null)}>
          {lightboxUri && (
            <Image source={{ uri: lightboxUri }} style={styles.lightboxImage} resizeMode="contain" />
          )}
        </Pressable>
      </Modal>

      {/* Fixed bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.secondaryRow}>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            onPress={() => router.push(`/job/edit/${job.id}`)}
          >
            <Text style={styles.secondaryButtonText}>Bearbeiten</Text>
          </Pressable>

          {job.quoteNumber && job.invoiceNumber ? (
            <>
              <Pressable
                style={({ pressed }) => [styles.secondaryButton, sharingPDF === 'quote' && styles.buttonDisabled, pressed && styles.buttonPressed]}
                onPress={() => handleSharePDF('quote')}
                disabled={sharingPDF !== null}
              >
                <Text style={styles.secondaryButtonText}>{sharingPDF === 'quote' ? 'PDF…' : 'Angebot'}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.secondaryButton, sharingPDF === 'invoice' && styles.buttonDisabled, pressed && styles.buttonPressed]}
                onPress={() => handleSharePDF('invoice')}
                disabled={sharingPDF !== null}
              >
                <Text style={styles.secondaryButtonText}>{sharingPDF === 'invoice' ? 'PDF…' : 'Rechnung'}</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, sharingPDF !== null && styles.buttonDisabled, pressed && styles.buttonPressed]}
              onPress={() => handleSharePDF(job.invoiceNumber ? 'invoice' : 'quote')}
              disabled={sharingPDF !== null}
            >
              <Text style={styles.secondaryButtonText}>{sharingPDF !== null ? 'PDF…' : 'PDF teilen'}</Text>
            </Pressable>
          )}
        </View>

        {nextLabel && (
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              (advancingStatus || sharingPDF !== null) && styles.buttonDisabled,
              pressed && !(advancingStatus || sharingPDF !== null) && styles.buttonPressed,
            ]}
            onPress={advanceStatus}
            disabled={advancingStatus || sharingPDF !== null}
          >
            {advancingStatus ? (
              <ActivityIndicator color="#111111" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>{nextLabel}</Text>
                {(job.status === 'draft' || job.status === 'accepted') && (
                  <Text style={styles.primaryButtonSubLabel}>PDF wird automatisch geteilt</Text>
                )}
              </>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.rowLabelBold]}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.rowValueBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // Hero
  hero: {
    backgroundColor: C.surface,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    alignItems: 'flex-start',
    gap: 6,
  },
  heroLabel: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: C.textMid, textTransform: 'uppercase', letterSpacing: 1 },
  heroAmount: {
    fontSize: 36,
    fontFamily: 'DMSans_700Bold',
    color: C.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1.5,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    marginTop: 2,
  },
  heroBadgeDot: { width: 6, height: 6, borderRadius: 3 },
  heroBadgeText: { fontSize: 12, fontFamily: 'DMSans_500Medium' },

  // Progress dots row
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 8,
  },
  dotColumn: { alignItems: 'center', gap: 3 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotDone: { backgroundColor: '#3D9B6B' },
  dotCurrent: { backgroundColor: '#E8A030' },
  dotFuture: { borderWidth: 1.5, borderColor: '#3A3A3A' },
  dotDate: { fontSize: 11, fontFamily: 'DMSans_500Medium', color: '#8A8A8A' },
  dotDatePlaceholder: { height: 14 }, // same height as dotDate text line
  dotLabel: { fontSize: 10, fontFamily: 'DMSans_400Regular', color: '#4A4A4A' },

  // Scroll
  scroll: { flex: 1 },
  content: { padding: 16, gap: 10 },

  // Cards
  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  customerName: { fontSize: 15, fontFamily: 'DMSans_600SemiBold', color: C.text, marginBottom: 4 },
  meta: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: C.textMid, marginTop: 2 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    color: C.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  description: { fontSize: 15, fontFamily: 'DMSans_400Regular', color: C.text, lineHeight: 22 },

  // Line items
  lineItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8 },
  lineItemLeft: { flex: 1, marginRight: 12 },
  lineItemDesc: { fontSize: 15, fontFamily: 'DMSans_400Regular', color: C.text },
  lineItemQty: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: C.textMid, marginTop: 2 },
  lineItemTotal: { fontSize: 15, fontFamily: 'DMSans_500Medium', color: C.text, fontVariant: ['tabular-nums'] },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 8 },

  // Row (totals)
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  rowLabel: { fontSize: 15, fontFamily: 'DMSans_400Regular', color: C.textMid },
  rowValue: { fontSize: 15, fontFamily: 'DMSans_400Regular', color: C.text, fontVariant: ['tabular-nums'] },
  rowLabelBold: { fontFamily: 'DMSans_600SemiBold', color: C.text },
  rowValueBold: { fontFamily: 'DMSans_700Bold', color: C.text },

  // Photos
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  photoThumb: { width: 80, height: 80, borderRadius: 8, overflow: 'hidden' },
  photoImage: { width: 80, height: 80 },
  addPhotoButton: {
    width: 80, height: 80, borderRadius: 8,
    borderWidth: 1, borderColor: C.border2, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  addPhotoIcon: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  addPhotoH: { position: 'absolute', width: 24, height: 2, backgroundColor: C.textMid, borderRadius: 1 },
  addPhotoV: { position: 'absolute', width: 2, height: 24, backgroundColor: C.textMid, borderRadius: 1 },
  photoHint: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: C.textDim, marginTop: 6 },

  // Lightbox
  lightboxBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  lightboxImage: { width: '100%', height: '100%' },

  // Bottom bar
  bottomBar: {
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
    padding: 16,
    gap: 10,
  },
  secondaryRow: { flexDirection: 'row', gap: 10 },
  secondaryButton: {
    flex: 1,
    backgroundColor: C.surface2,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  secondaryButtonText: { color: C.text, fontSize: 15, fontFamily: 'DMSans_500Medium' },
  primaryButton: {
    backgroundColor: C.amber,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#111111', fontSize: 16, fontFamily: 'DMSans_600SemiBold' },
  primaryButtonSubLabel: { color: 'rgba(17,17,17,0.65)', fontSize: 11, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  buttonDisabled: { opacity: 0.4 },
  buttonPressed: { opacity: 0.85 },
});
