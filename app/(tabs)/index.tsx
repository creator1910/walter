import { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import JobCard from '../../components/JobCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { calculateTotals } from '../../lib/claude';
import { isThisMonth, loadJobs, loadProfile } from '../../lib/storage';
import { ACTIVE_STATUSES, F, useTheme } from '../../lib/theme';
import { Job } from '../../types';

const fmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const monthFmt = new Intl.DateTimeFormat('de-DE', { month: 'long' });

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const currentMonth = monthFmt.format(new Date()).toUpperCase();

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([loadJobs(), loadProfile()]).then(([loaded, profile]) => {
        setJobs(loaded);
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
      <View style={[styles.emptyContainer, { backgroundColor: t.surface, paddingTop: insets.top }]}>
        <Text style={[styles.emptyGreeting, { color: t.on_surface }]}>{greeting}</Text>
        <Text style={[styles.emptyTitle, { color: t.on_surface }]}>Noch keine Aufträge</Text>
        <Text style={[styles.emptySubtitle, { color: t.on_surface_variant }]}>Beschreibe einen Auftrag und Walter erstellt Angebot und Rechnung automatisch.</Text>
        <Pressable
          style={[styles.emptyButton, { backgroundColor: t.primary }]}
          onPress={() => router.push('/new-job')}
        >
          <Text style={[styles.emptyButtonText, { color: t.on_primary }]}>Ersten Auftrag anlegen</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.surface }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
    >
      {/* Hero card — primary background, "Bezahlt" as north star metric */}
      <View style={[styles.hero, { backgroundColor: t.primary }]}>
        <View style={styles.heroTop}>
          <Text style={[styles.heroGreeting, { color: t.on_primary }]}>
            {loading ? '' : greeting}
          </Text>
          <Text style={[styles.heroMonth, { color: t.on_primary }]}>
            {currentMonth}
          </Text>
        </View>
        <Text
          style={[styles.heroAmount, { color: t.on_primary }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {loading ? '—' : fmt.format(bezahltMonat)}
        </Text>
        <Text style={[styles.heroLabel, { color: t.on_primary }]}>
          Bezahlt diesen Monat
        </Text>
      </View>

      {/* Secondary metrics */}
      <View style={styles.metricsRow}>
        <View style={[styles.metricTile, { backgroundColor: t.surface_card }]}>
          <Text style={[styles.metricLabel, { color: t.outline }]}>AUSSTEHEND</Text>
          <Text style={[styles.metricValue, { color: t.warning }]}>
            {loading ? '—' : fmt.format(ausstehend)}
          </Text>
        </View>
        <View style={[styles.metricTile, { backgroundColor: t.surface_card }]}>
          <Text style={[styles.metricLabel, { color: t.outline }]}>PIPELINE</Text>
          <Text style={[styles.metricValue, { color: t.on_surface }]}>
            {loading ? '—' : fmt.format(pipeline)}
          </Text>
        </View>
      </View>

      {!loading && activeJobs.length > 0 && (
        <View>
          <Text style={[styles.sectionHeader, { color: t.outline }]}>AKTIVE AUFTRÄGE</Text>
          {activeJobs.map(job => (
            <JobCard key={job.id} job={job} onPress={() => router.push(`/job/${job.id}`)} />
          ))}
        </View>
      )}

      {!loading && recentOtherJobs.length > 0 && (
        <View>
          <Text style={[styles.sectionHeader, { color: t.outline }]}>ZULETZT ERSTELLT</Text>
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
          <Text style={[styles.allJobsText, { color: t.primary }]}>Alle Aufträge</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 120, gap: 12 },

  // Empty state
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyGreeting: { fontSize: 28, fontFamily: F.displayBold, letterSpacing: -0.01 * 28, marginBottom: 4 },
  emptyTitle: { fontSize: 20, fontFamily: F.headlineSemi, marginBottom: 8, marginTop: 24 },
  emptySubtitle: { fontSize: 15, fontFamily: F.body, textAlign: 'center', marginBottom: 32 },
  emptyButton: { borderRadius: 9999, paddingVertical: 14, paddingHorizontal: 28 },
  emptyButtonText: { fontSize: 15, fontFamily: F.bodySemi },

  // Hero card
  hero: {
    borderRadius: 24,
    padding: 24,
    paddingBottom: 28,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroGreeting: {
    fontSize: 14,
    fontFamily: F.body,
  },
  heroMonth: {
    fontSize: 11,
    fontFamily: F.labelSemi,
    letterSpacing: 0.05 * 11,
  },
  heroAmount: {
    fontSize: 52,
    fontFamily: F.displayBold,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.02 * 52,
    lineHeight: 56,
  },
  heroLabel: {
    fontSize: 13,
    fontFamily: F.body,
    marginTop: 6,
    opacity: 0.55,
  },

  // Secondary metrics
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricTile: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  metricLabel: {
    fontSize: 11,
    fontFamily: F.labelSemi,
    textTransform: 'uppercase',
    letterSpacing: 0.05 * 11,
  },
  metricValue: {
    fontSize: 18,
    fontFamily: F.dataBold,
    fontVariant: ['tabular-nums'],
  },

  // Job sections
  sectionHeader: {
    fontSize: 11,
    fontFamily: F.labelSemi,
    letterSpacing: 0.05 * 11,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  allJobsRow: { paddingVertical: 16, alignItems: 'center' },
  allJobsText: { fontSize: 15, fontFamily: F.bodyMedium, textDecorationLine: 'underline' },
});
