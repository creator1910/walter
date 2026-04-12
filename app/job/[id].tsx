import { useCallback, useState } from 'react';
import { FileText, MoreHorizontal, Pencil, Plus, Receipt } from 'lucide-react-native';
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
import { deleteJob, deletePhoto, generateDocNumber, generateId, loadJobs, saveJob, savePhoto } from '../../lib/storage';
import { F, statusColors, STATUS_LABEL, useTheme } from '../../lib/theme';
import { Job, JobStatus } from '../../types';

const NEXT_STATUS: Partial<Record<JobStatus, JobStatus>> = {
  draft: 'quote_sent',
  quote_sent: 'in_progress',
  in_progress: 'invoiced',
  invoiced: 'paid',
};

const NEXT_LABEL: Partial<Record<JobStatus, string>> = {
  draft: 'Angebot versenden',
  quote_sent: 'Auftrag starten',
  in_progress: 'Rechnung stellen',
  invoiced: 'Als bezahlt markieren',
};

function formatJobDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

const DOT_STAGES: Array<{ key: keyof typeof STAGE_DATE_MAP; label: string }> = [
  { key: 'draft',      label: 'Entwurf' },
  { key: 'quote_sent', label: 'Angebot' },
  { key: 'in_progress', label: 'In Arbeit' },
  { key: 'invoiced',   label: 'Rechnung' },
  { key: 'paid',       label: 'Bezahlt' },
];

const STAGE_ORDER: JobStatus[] = ['draft', 'quote_sent', 'in_progress', 'invoiced', 'paid'];

const STAGE_DATE_MAP = {
  draft:      'createdAt',
  quote_sent: 'quoteDate',
  in_progress: 'acceptedAt',
  invoiced:   'invoiceDate',
  paid:       'paidAt',
} as const;


function IconAction({
  icon, label, onPress, loading, disabled, t,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.iconAction, (disabled || loading) && styles.iconActionDisabled, pressed && !(disabled || loading) && styles.iconActionPressed]}
      onPress={disabled ? undefined : onPress}
      hitSlop={8}
    >
      <View style={[styles.iconActionIconWrap, { backgroundColor: t.surface_high }]}>
        {loading ? <ActivityIndicator size="small" color={t.on_surface_variant} /> : icon}
      </View>
      <Text style={[styles.iconActionLabel, { color: t.outline }]}>{label}</Text>
    </Pressable>
  );
}

// --- Main screen ---

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [sharingPDF, setSharingPDF] = useState<'quote' | 'invoice' | null>(null);
  const [advancingStatus, setAdvancingStatus] = useState(false);
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useTheme();

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
  const sc = statusColors(t, job.status);

  async function handleSharePDF(docType: 'quote' | 'invoice') {
    if (!job) return;
    setSharingPDF(docType);
    try {
      await generateAndSharePDF(job, docType);
    } catch {
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
        ...(nextStatus === 'in_progress' ? { acceptedAt: now } : {}),
        ...(nextStatus === 'invoiced' && !job.invoiceNumber
          ? { invoiceNumber: generateDocNumber('RE', jobs), invoiceDate: now }
          : {}),
        ...(nextStatus === 'paid' ? { paidAt: now } : {}),
      };
      await saveJob(updated);
      setJob(updated);

      if (nextStatus === 'quote_sent' || nextStatus === 'invoiced') {
        try {
          await generateAndSharePDF(updated, nextStatus === 'quote_sent' ? 'quote' : 'invoice');
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

  async function handleDuplicateJob() {
    if (!job) return;
    const newJob: Job = {
      ...job,
      id: generateId(),
      createdAt: new Date().toISOString(),
      status: 'draft',
      quoteNumber: undefined,
      quoteDate: undefined,
      invoiceNumber: undefined,
      invoiceDate: undefined,
      acceptedAt: undefined,
      paidAt: undefined,
      photos: [],
    };
    await saveJob(newJob);
    router.replace(`/job/${newJob.id}`);
  }

  async function handleDeleteJob() {
    if (!job) return;
    Alert.alert('Auftrag löschen', 'Diesen Auftrag wirklich löschen?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen', style: 'destructive', onPress: async () => {
          await deleteJob(job.id);
          router.back();
        },
      },
    ]);
  }

  function handleMehr() {
    Alert.alert('Mehr Optionen', undefined, [
      { text: 'Auftrag duplizieren', onPress: handleDuplicateJob },
      { text: 'Auftrag löschen', style: 'destructive', onPress: handleDeleteJob },
      { text: 'Abbrechen', style: 'cancel' },
    ]);
  }

  function formatCurrency(amount: number) {
    return amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  }

  return (
    <View style={[styles.container, { backgroundColor: t.surface }]}>
      {/* Hero block */}
      <View style={[styles.hero, { backgroundColor: t.surface_card }]}>
        {/* Amount + status on one row */}
        <View style={styles.heroRow}>
          <Text style={[styles.heroAmount, { color: t.on_surface }]}>{formatCurrency(gross)}</Text>
          <View style={[styles.heroBadge, { backgroundColor: sc.bg }]}>
            <View style={[styles.heroBadgeDot, { backgroundColor: sc.text }]} />
            <Text style={[styles.heroBadgeText, { color: sc.text }]}>{STATUS_LABEL[job.status]}</Text>
          </View>
        </View>

        {/* Compact stepper */}
        <View style={styles.stepper}>
          <View style={[styles.stepperLine, { backgroundColor: t.outline_variant }]} />
          <View style={styles.stepperRow}>
            {DOT_STAGES.map(({ key, label }) => {
              const currentIndex = STAGE_ORDER.indexOf(job.status);
              const stageIndex = STAGE_ORDER.indexOf(key);
              const isDone = stageIndex < currentIndex;
              const isCurrent = stageIndex === currentIndex;
              const dateField = STAGE_DATE_MAP[key];
              const dateValue = job[dateField as keyof Job] as string | undefined;
              return (
                <View key={key} style={styles.stepCol}>
                  <View style={[
                    styles.stepDot,
                    isDone && { backgroundColor: t.dot_done },
                    isCurrent && { backgroundColor: t.dot_current },
                    !isDone && !isCurrent && { borderWidth: 1.5, borderColor: t.dot_future, backgroundColor: t.surface_card },
                  ]} />
                  {isCurrent && dateValue
                    ? <Text style={[styles.stepDate, { color: t.on_surface_variant }]}>{formatJobDate(dateValue)}</Text>
                    : <View style={styles.stepDatePlaceholder} />
                  }
                  <Text style={[styles.stepLabel, { color: isCurrent ? t.on_surface_variant : t.outline }]} numberOfLines={1}>{label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Icon action row */}
      <View style={[styles.iconRow, { backgroundColor: t.surface_card }]}>
        <IconAction icon={<FileText size={20} color={t.on_surface_variant} strokeWidth={1.5} />} label="Angebot" onPress={() => handleSharePDF('quote')} loading={sharingPDF === 'quote'} t={t} />
        <IconAction icon={<Receipt size={20} color={job.invoiceNumber ? t.on_surface_variant : t.outline} strokeWidth={1.5} />} label="Rechnung" onPress={() => handleSharePDF('invoice')} loading={sharingPDF === 'invoice'} disabled={!job.invoiceNumber} t={t} />
        <IconAction icon={<Pencil size={20} color={t.on_surface_variant} strokeWidth={1.5} />} label="Bearbeiten" onPress={() => router.push(`/job/edit/${job.id}`)} t={t} />
        <IconAction icon={<MoreHorizontal size={20} color={t.on_surface_variant} strokeWidth={1.5} />} label="Mehr" onPress={handleMehr} t={t} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Customer */}
        <View style={[styles.card, { backgroundColor: t.surface_card }]}>
          <Text style={[styles.customerName, { color: t.on_surface }]}>{job.customer.name || '—'}</Text>
          {job.customer.address && <Text style={[styles.meta, { color: t.on_surface_variant }]}>{job.customer.address}</Text>}
          {job.customer.phone && <Text style={[styles.meta, { color: t.on_surface_variant }]}>{job.customer.phone}</Text>}
          {job.customer.email && <Text style={[styles.meta, { color: t.on_surface_variant }]}>{job.customer.email}</Text>}
        </View>

        {/* Document numbers */}
        {(job.quoteNumber || job.invoiceNumber) && (
          <View style={[styles.card, { backgroundColor: t.surface_card }]}>
            {job.quoteNumber && <Row label="Angebotsnr." value={job.quoteNumber} t={t} />}
            {job.invoiceNumber && <Row label="Rechnungsnr." value={job.invoiceNumber} t={t} />}
          </View>
        )}

        {/* Description */}
        <View style={[styles.card, { backgroundColor: t.surface_card }]}>
          <Text style={[styles.sectionTitle, { color: t.outline }]}>LEISTUNGSBESCHREIBUNG</Text>
          <Text style={[styles.description, { color: t.on_surface }]}>{job.description}</Text>
        </View>

        {/* Line items */}
        {job.lineItems.length > 0 && (
          <View style={[styles.card, { backgroundColor: t.surface_card }]}>
            <Text style={[styles.sectionTitle, { color: t.outline }]}>POSITIONEN</Text>
            {job.lineItems.map((item, i) => (
              <View key={i} style={styles.lineItem}>
                <View style={styles.lineItemLeft}>
                  <Text style={[styles.lineItemDesc, { color: t.on_surface }]}>{item.description}</Text>
                  <Text style={[styles.lineItemQty, { color: t.on_surface_variant }]}>
                    {item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}
                  </Text>
                </View>
                <Text style={[styles.lineItemTotal, { color: t.on_surface }]}>
                  {formatCurrency(item.quantity * item.unitPrice)}
                </Text>
              </View>
            ))}
            <View style={{ height: 24 }} />
            <Row label="Netto" value={formatCurrency(net)} t={t} />
            <Row label={`MwSt. ${job.vatRate * 100}%`} value={formatCurrency(vat)} t={t} />
            <Row label="Gesamt" value={formatCurrency(gross)} bold t={t} />
          </View>
        )}

        {/* Notes */}
        {job.notes && (
          <View style={[styles.card, { backgroundColor: t.surface_card }]}>
            <Text style={[styles.sectionTitle, { color: t.outline }]}>HINWEISE</Text>
            <Text style={[styles.description, { color: t.on_surface }]}>{job.notes}</Text>
          </View>
        )}

        {/* Photos */}
        <View style={[styles.card, { backgroundColor: t.surface_card }]}>
          <Text style={[styles.sectionTitle, { color: t.outline }]}>FOTOS</Text>
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
            <Pressable
              style={[styles.addPhotoButton, { borderColor: t.outline_variant }]}
              onPress={handleAddPhoto}
            >
              <Plus size={24} color={t.on_surface_variant} strokeWidth={1.5} />
            </Pressable>
          </View>
          {(job.photos ?? []).length > 0 && (
            <Text style={[styles.photoHint, { color: t.outline }]}>Gedrückt halten zum Löschen</Text>
          )}
        </View>

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

      {/* Fixed bottom CTA */}
      {nextLabel && (
        <View style={[styles.bottomBar, { backgroundColor: t.surface, paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: t.primary },
              (advancingStatus || sharingPDF !== null) && styles.buttonDisabled,
              pressed && !(advancingStatus || sharingPDF !== null) && { transform: [{ scale: 1.02 }] },
            ]}
            onPress={advanceStatus}
            disabled={advancingStatus || sharingPDF !== null}
          >
            {advancingStatus ? (
              <ActivityIndicator color={t.on_primary} />
            ) : (
              <>
                <Text style={[styles.primaryButtonText, { color: t.on_primary }]}>{nextLabel}</Text>
                {(job.status === 'draft' || job.status === 'in_progress') && (
                  <Text style={[styles.primaryButtonSubLabel, { color: t.on_primary }]}>PDF wird automatisch geteilt</Text>
                )}
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

function Row({ label, value, bold, t }: {
  label: string;
  value: string;
  bold?: boolean;
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: bold ? t.on_surface : t.on_surface_variant }, bold && styles.rowLabelBold]}>{label}</Text>
      <Text style={[styles.rowValue, { color: t.on_surface }, bold && styles.rowValueBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Hero
  hero: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 14,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroAmount: {
    fontSize: 36,
    fontFamily: F.dataBold,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  heroBadgeDot: { width: 6, height: 6, borderRadius: 3 },
  heroBadgeText: { fontSize: 12, fontFamily: F.bodyMedium },

  // Compact stepper
  stepper: { width: '100%' },
  stepperLine: {
    position: 'absolute',
    top: 3.5,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepCol: { alignItems: 'center', gap: 2, minWidth: 44 },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  stepDate: { fontSize: 11, fontFamily: F.bodyMedium },
  stepDatePlaceholder: { height: 14 },
  stepLabel: { fontSize: 10, fontFamily: F.body },

  // Icon row
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  iconAction: {
    alignItems: 'center',
    minWidth: 48,
    justifyContent: 'center',
    gap: 4,
  },
  iconActionPressed: { opacity: 0.7 },
  iconActionDisabled: { opacity: 0.35 },
  iconActionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActionLabel: { fontSize: 11, fontFamily: F.labelSemi },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 10 },

  // Cards
  card: {
    borderRadius: 16,
    padding: 16,
  },
  customerName: { fontSize: 15, fontFamily: F.bodySemi, marginBottom: 4 },
  meta: { fontSize: 12, fontFamily: F.body, marginTop: 2 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: F.labelSemi,
    textTransform: 'uppercase',
    letterSpacing: 0.05 * 11,
    marginBottom: 10,
  },
  description: { fontSize: 15, fontFamily: F.body, lineHeight: 22 },

  // Line items
  lineItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8 },
  lineItemLeft: { flex: 1, marginRight: 12 },
  lineItemDesc: { fontSize: 15, fontFamily: F.body },
  lineItemQty: { fontSize: 12, fontFamily: F.body, marginTop: 2 },
  lineItemTotal: { fontSize: 15, fontFamily: F.dataBold, fontVariant: ['tabular-nums'] },

  // Row (totals)
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  rowLabel: { fontSize: 15, fontFamily: F.body },
  rowValue: { fontSize: 15, fontFamily: F.dataBold, fontVariant: ['tabular-nums'] },
  rowLabelBold: { fontFamily: F.bodySemi },
  rowValueBold: { fontFamily: F.dataBold },

  // Photos
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  photoThumb: { width: 80, height: 80, borderRadius: 10, overflow: 'hidden' },
  photoImage: { width: 80, height: 80 },
  addPhotoButton: {
    width: 80, height: 80, borderRadius: 10,
    borderWidth: 1, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  photoHint: { fontSize: 12, fontFamily: F.body, marginTop: 6 },

  // Lightbox
  lightboxBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  lightboxImage: { width: '100%', height: '100%' },

  // Bottom bar
  bottomBar: {
    padding: 16,
  },
  primaryButton: {
    borderRadius: 9999,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: { fontSize: 16, fontFamily: F.bodySemi },
  primaryButtonSubLabel: { fontSize: 11, fontFamily: F.body, marginTop: 2, opacity: 0.65 },
  buttonDisabled: { opacity: 0.4 },
});
