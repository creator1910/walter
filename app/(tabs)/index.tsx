import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';
import JobCard from '../../components/JobCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { calculateTotals } from '../../lib/claude';
import { isThisMonth, loadJobs, loadProfile } from '../../lib/storage';
import { ACTIVE_STATUSES, F, useTheme } from '../../lib/theme';
import { Job } from '../../types';

const fmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const monthFmt = new Intl.DateTimeFormat('de-DE', { month: 'long' });

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading] = useState(true);
  const [displayAmount, setDisplayAmount] = useState(0);
  const [version, setVersion] = useState(0);
  const animTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const currentMonth = monthFmt.format(new Date()).toUpperCase();

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setDisplayAmount(0);
      Promise.all([loadJobs(), loadProfile()]).then(([loaded, profile]) => {
        setJobs(loaded);
        setGreeting(profile?.name ? `Hey, ${profile.name}` : 'Hey');
        setLoading(false);
        setVersion(v => v + 1);
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

  // Count-up animation for hero amount
  useEffect(() => {
    if (loading) return;
    if (animTimerRef.current) clearInterval(animTimerRef.current);

    const DURATION = 700;
    const FPS = 60;
    const STEPS = Math.round((DURATION / 1000) * FPS);
    let step = 0;

    animTimerRef.current = setInterval(() => {
      step++;
      const progress = easeOutCubic(step / STEPS);
      setDisplayAmount(bezahltMonat * progress);
      if (step >= STEPS) {
        setDisplayAmount(bezahltMonat);
        clearInterval(animTimerRef.current!);
        animTimerRef.current = null;
      }
    }, 1000 / FPS);

    return () => {
      if (animTimerRef.current) clearInterval(animTimerRef.current);
    };
  }, [bezahltMonat, loading]);

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
      {/* Hero — command center */}
      <View style={[styles.hero, { backgroundColor: t.primary }]}>
        <View style={styles.heroHeader}>
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
          minimumFontScale={0.5}
        >
          {loading ? '—' : fmt.format(displayAmount)}
        </Text>
        <Text style={[styles.heroAmountLabel, { color: t.on_primary }]}>
          Bezahlt diesen Monat
        </Text>

        {/* Compact secondary metrics */}
        <View style={styles.metricRow}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricKey, { color: t.on_primary }]}>OFFEN</Text>
            <Text style={[styles.metricVal, { color: t.on_primary }]}>
              {loading ? '—' : fmt.format(ausstehend)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricKey, { color: t.on_primary }]}>PIPELINE</Text>
            <Text style={[styles.metricVal, { color: t.on_primary }]}>
              {loading ? '—' : fmt.format(pipeline)}
            </Text>
          </View>
        </View>
      </View>

      {/* Active jobs */}
      {!loading && activeJobs.length > 0 && (
        <View>
          <Text style={[styles.sectionHeader, { color: t.outline }]}>AKTIV</Text>
          {activeJobs.map((job, index) => (
            <Animated.View
              key={`${job.id}-${version}`}
              entering={FadeInUp.delay(index * 60).duration(280)}
            >
              <JobCard job={job} onPress={() => router.push(`/job/${job.id}`)} />
            </Animated.View>
          ))}
        </View>
      )}

      {/* Recent other jobs */}
      {!loading && recentOtherJobs.length > 0 && (
        <View>
          <Text style={[styles.sectionHeader, { color: t.outline }]}>ZULETZT</Text>
          {recentOtherJobs.map((job, index) => (
            <Animated.View
              key={`${job.id}-${version}`}
              entering={FadeInUp.delay((activeJobs.length + index) * 60).duration(280)}
            >
              <JobCard job={job} onPress={() => router.push(`/job/${job.id}`)} />
            </Animated.View>
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
    padding: 20,
    paddingBottom: 20,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroGreeting: {
    fontSize: 12,
    fontFamily: F.body,
    opacity: 0.65,
  },
  heroMonth: {
    fontSize: 10,
    fontFamily: F.labelSemi,
    letterSpacing: 0.05 * 10,
    opacity: 0.65,
  },
  heroAmount: {
    fontSize: 60,
    fontFamily: F.displayBold,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.025 * 60,
    lineHeight: 64,
  },
  heroAmountLabel: {
    fontSize: 12,
    fontFamily: F.body,
    opacity: 0.45,
    marginTop: 3,
    marginBottom: 18,
  },

  // Compact metric row inside hero
  metricRow: {
    flexDirection: 'row',
    gap: 20,
  },
  metricItem: {
    gap: 3,
  },
  metricKey: {
    fontSize: 10,
    fontFamily: F.labelSemi,
    letterSpacing: 0.06 * 10,
    opacity: 0.5,
  },
  metricVal: {
    fontSize: 15,
    fontFamily: F.dataBold,
    fontVariant: ['tabular-nums'],
    opacity: 0.85,
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
