import { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { calculateTotals } from '../../lib/claude';
import { isThisMonth, loadJobs, loadProfile } from '../../lib/storage';
import { ACTIVE_STATUSES, C, STATUS_BG, STATUS_LABEL, STATUS_TEXT } from '../../lib/theme';
import { Job } from '../../types';

const fmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([loadJobs(), loadProfile()]).then(([loaded, profile]) => {
        setJobs(loaded);
        // TODO: replace with user account name when auth is added
        setGreeting(profile?.name ? `Hey, ${profile.name}` : 'Hey');
        setLoading(false);
      });
    }, [])
  );

  const bezahltMonat = jobs
    .filter(j => j.status === 'paid' && isThisMonth(j.paidAt))
    .reduce((sum, j) => sum + calculateTotals(j.lineItems, j.vatRate).gross, 0);
  const ausstehend = jobs
    .filter(j => j.status === 'invoiced')
    .reduce((sum, j) => sum + calculateTotals(j.lineItems, j.vatRate).gross, 0);
  const pipeline = jobs
    .filter(j => j.status === 'quote_sent')
    .reduce((sum, j) => sum + calculateTotals(j.lineItems, j.vatRate).gross, 0);

  const activeJobs = jobs
    .filter(j => ACTIVE_STATUSES.has(j.status))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const recentOtherJobs = jobs
    .filter(j => !ACTIVE_STATUSES.has(j.status))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  if (!loading && jobs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.emptyTitle}>Noch keine Aufträge</Text>
        <Text style={styles.emptySubtitle}>Tippe auf + um deinen ersten Auftrag anzulegen</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>{loading ? '' : greeting}</Text>

      <View style={styles.statsRow}>
        <StatTile
          label="Bezahlt diesen Monat"
          value={loading ? '—' : fmt.format(bezahltMonat)}
          valueColor={C.paid}
        />
        <StatTile
          label="Ausstehend"
          value={loading ? '—' : fmt.format(ausstehend)}
          valueColor={C.amber}
        />
        <StatTile
          label="Pipeline"
          value={loading ? '—' : fmt.format(pipeline)}
        />
      </View>

      {!loading && activeJobs.length > 0 && (
        <View>
          <Text style={styles.sectionHeader}>AKTIVE AUFTRÄGE</Text>
          {activeJobs.map(job => (
            <JobCard key={job.id} job={job} onPress={() => router.push(`/job/${job.id}`)} active />
          ))}
        </View>
      )}

      {!loading && recentOtherJobs.length > 0 && (
        <View>
          <Text style={styles.sectionHeader}>ZULETZT ERSTELLT</Text>
          {recentOtherJobs.map(job => (
            <JobCard key={job.id} job={job} onPress={() => router.push(`/job/${job.id}`)} />
          ))}
        </View>
      )}

      {!loading && jobs.length > 0 && (
        <Pressable
          style={({ pressed }) => [styles.allJobsRow, pressed && { opacity: 0.6 }]}
          onPress={() => router.push('/jobs')}
        >
          <Text style={styles.allJobsText}>Alle Aufträge →</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function StatTile({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.tileValue, valueColor ? { color: valueColor } : undefined]}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

function JobCard({ job, onPress, active }: { job: Job; onPress: () => void; active?: boolean }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, active && styles.cardActive, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.customerName}>{job.customer.name || 'Unbekannter Kunde'}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_BG[job.status] }]}>
          <View style={[styles.badgeDot, { backgroundColor: STATUS_TEXT[job.status] }]} />
          <Text style={[styles.badgeText, { color: STATUS_TEXT[job.status] }]}>{STATUS_LABEL[job.status]}</Text>
        </View>
      </View>
      <Text style={styles.description} numberOfLines={2}>{job.description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: C.bg },
  emptyTitle: { fontSize: 17, fontFamily: 'DMSans_600SemiBold', color: C.text, marginBottom: 8, marginTop: 24 },
  emptySubtitle: { fontSize: 15, fontFamily: 'DMSans_400Regular', color: C.textMid, textAlign: 'center' },
  greeting: {
    fontSize: 24,
    fontFamily: 'DMSans_700Bold',
    color: C.text,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tile: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    gap: 4,
  },
  tileValue: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: C.text,
    fontVariant: ['tabular-nums'],
  },
  tileLabel: {
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    color: C.textDim,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    color: C.textDim,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
  },
  cardActive: {
    borderLeftWidth: 2,
    borderLeftColor: C.amber,
  },
  cardPressed: { opacity: 0.7 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  customerName: { fontSize: 15, fontFamily: 'DMSans_600SemiBold', color: C.text, flex: 1, marginRight: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontFamily: 'DMSans_500Medium' },
  description: { fontSize: 14, fontFamily: 'DMSans_400Regular', color: C.textMid, lineHeight: 20 },
  allJobsRow: { paddingVertical: 16, alignItems: 'center' },
  allJobsText: { fontSize: 15, fontFamily: 'DMSans_500Medium', color: C.amber },
});
