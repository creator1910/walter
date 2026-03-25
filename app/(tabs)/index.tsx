import { useCallback, useState } from 'react';
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
import { loadJobs, loadProfile } from '../../lib/storage';
import { F, useTheme } from '../../lib/theme';
import { Job } from '../../types';

const dateFmt = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

function daysSince(isoDate: string | undefined): number {
  if (!isoDate) return 0;
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000);
}

function daysLabel(days: number): string {
  if (days === 0) return 'heute';
  if (days === 1) return 'gestern';
  return `vor ${days} Tagen`;
}

type OverdueItem = { job: Job; daysAgo: number };
type QuoteItem = { job: Job; daysAgo: number };
type InvoiceItem = { job: Job; daysAgo: number };

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const today = dateFmt.format(new Date());

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([loadJobs(), loadProfile()]).then(([loaded, profile]) => {
        setJobs(loaded);
        setGreeting(profile?.name ? `Hey, ${profile.name}` : 'Hey');
        setLoading(false);
        setVersion(v => v + 1);
      });
    }, [])
  );

  // Überfällig: invoiced & sent ≥14 days ago, oldest first
  const overdueJobs: OverdueItem[] = jobs
    .filter(j => j.status === 'invoiced')
    .map(j => ({ job: j, daysAgo: daysSince(j.invoiceDate ?? j.createdAt) }))
    .filter(({ daysAgo }) => daysAgo >= 14)
    .sort((a, b) => b.daysAgo - a.daysAgo);

  // Läuft gerade: in_progress
  const activeJobs: Job[] = jobs
    .filter(j => j.status === 'in_progress')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Rechnung versandt but not overdue
  const invoicedJobs: InvoiceItem[] = jobs
    .filter(j => j.status === 'invoiced')
    .map(j => ({ job: j, daysAgo: daysSince(j.invoiceDate ?? j.createdAt) }))
    .filter(({ daysAgo }) => daysAgo < 14)
    .sort((a, b) => b.daysAgo - a.daysAgo);

  // Angebot ausstehend
  const quoteJobs: QuoteItem[] = jobs
    .filter(j => j.status === 'quote_sent')
    .map(j => ({ job: j, daysAgo: daysSince(j.quoteDate ?? j.createdAt) }))
    .sort((a, b) => b.daysAgo - a.daysAgo);

  // Entwurf
  const draftJobs: Job[] = jobs
    .filter(j => j.status === 'draft')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const hasAnything = overdueJobs.length > 0 || activeJobs.length > 0 ||
    invoicedJobs.length > 0 || quoteJobs.length > 0 || draftJobs.length > 0;

  // Build status line
  function statusLine(): string {
    const parts: string[] = [];
    if (overdueJobs.length > 0) {
      parts.push(`${overdueJobs.length} überfällig`);
    }
    if (activeJobs.length > 0) {
      parts.push(`${activeJobs.length} aktiv`);
    }
    if (quoteJobs.length > 0) {
      parts.push(`${quoteJobs.length} Angebot offen`);
    }
    return parts.join(' · ');
  }

  if (!loading && jobs.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: t.surface, paddingTop: insets.top }]}>
        <Text style={[styles.emptyGreeting, { color: t.on_surface_variant }]}>{greeting}</Text>
        <Text style={[styles.emptyDate, { color: t.on_surface }]}>{today}</Text>
        <Text style={[styles.emptyTitle, { color: t.on_surface }]}>Noch keine Aufträge</Text>
        <Text style={[styles.emptySubtitle, { color: t.on_surface_variant }]}>
          Beschreibe einen Auftrag und Walter erstellt Angebot und Rechnung automatisch.
        </Text>
        <Pressable
          style={[styles.emptyButton, { backgroundColor: t.primary }]}
          onPress={() => router.push('/new-job')}
        >
          <Text style={[styles.emptyButtonText, { color: t.on_primary }]}>Ersten Auftrag anlegen</Text>
        </Pressable>
      </View>
    );
  }

  let cardIndex = 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.surface }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: t.on_surface_variant }]}>
          {loading ? '' : greeting}
        </Text>
        <Text style={[styles.dateText, { color: t.on_surface }]}>
          {today}
        </Text>
        {!loading && hasAnything && (
          <Text style={[styles.statusLine, { color: t.on_surface_variant }]}>
            {statusLine()}
          </Text>
        )}
        {!loading && !hasAnything && (
          <Text style={[styles.allClearText, { color: t.on_surface_variant }]}>
            Alles im Griff.
          </Text>
        )}
      </View>

      {/* ÜBERFÄLLIG */}
      {!loading && overdueJobs.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: t.error }]}>ÜBERFÄLLIG</Text>
          {overdueJobs.map(({ job, daysAgo }) => {
            const idx = cardIndex++;
            return (
              <Animated.View
                key={`${job.id}-${version}`}
                entering={FadeInUp.delay(idx * 55).duration(260)}
              >
                <View style={styles.annotationRow}>
                  <View style={[styles.urgencyDot, { backgroundColor: t.error }]} />
                  <Text style={[styles.annotationText, { color: t.error }]}>
                    Rechnung seit {daysAgo} Tagen offen
                  </Text>
                </View>
                <JobCard job={job} onPress={() => router.push(`/job/${job.id}`)} />
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* LÄUFT GERADE */}
      {!loading && activeJobs.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: t.outline }]}>LÄUFT GERADE</Text>
          {activeJobs.map(job => {
            const idx = cardIndex++;
            return (
              <Animated.View
                key={`${job.id}-${version}`}
                entering={FadeInUp.delay(idx * 55).duration(260)}
              >
                <JobCard job={job} onPress={() => router.push(`/job/${job.id}`)} />
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* RECHNUNG VERSANDT */}
      {!loading && invoicedJobs.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: t.outline }]}>RECHNUNG VERSANDT</Text>
          {invoicedJobs.map(({ job, daysAgo }) => {
            const idx = cardIndex++;
            return (
              <Animated.View
                key={`${job.id}-${version}`}
                entering={FadeInUp.delay(idx * 55).duration(260)}
              >
                <View style={styles.annotationRow}>
                  <Text style={[styles.annotationText, { color: t.on_surface_variant }]}>
                    Gesendet {daysLabel(daysAgo)}
                  </Text>
                </View>
                <JobCard job={job} onPress={() => router.push(`/job/${job.id}`)} />
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* ANGEBOT AUSSTEHEND */}
      {!loading && quoteJobs.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: t.outline }]}>ANGEBOT AUSSTEHEND</Text>
          {quoteJobs.map(({ job, daysAgo }) => {
            const idx = cardIndex++;
            return (
              <Animated.View
                key={`${job.id}-${version}`}
                entering={FadeInUp.delay(idx * 55).duration(260)}
              >
                <View style={styles.annotationRow}>
                  <Text style={[styles.annotationText, { color: t.on_surface_variant }]}>
                    Gesendet {daysLabel(daysAgo)}
                  </Text>
                </View>
                <JobCard job={job} onPress={() => router.push(`/job/${job.id}`)} />
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* ENTWURF */}
      {!loading && draftJobs.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: t.outline }]}>ENTWURF</Text>
          {draftJobs.map(job => {
            const idx = cardIndex++;
            return (
              <Animated.View
                key={`${job.id}-${version}`}
                entering={FadeInUp.delay(idx * 55).duration(260)}
              >
                <JobCard job={job} onPress={() => router.push(`/job/${job.id}`)} />
              </Animated.View>
            );
          })}
        </View>
      )}

      {!loading && jobs.length > 0 && (
        <Pressable
          style={({ pressed }) => [styles.allJobsRow, pressed && { opacity: 0.5 }]}
          onPress={() => router.push('/jobs')}
        >
          <Text style={[styles.allJobsText, { color: t.outline }]}>Alle Aufträge →</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 120, gap: 0 },

  // Header
  header: {
    paddingBottom: 28,
  },
  greeting: {
    fontSize: 13,
    fontFamily: F.body,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 28,
    fontFamily: F.displayBold,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  statusLine: {
    fontSize: 13,
    fontFamily: F.body,
    marginTop: 6,
  },
  allClearText: {
    fontSize: 15,
    fontFamily: F.body,
    marginTop: 6,
    fontStyle: 'italic',
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: F.labelSemi,
    letterSpacing: 0.08 * 10,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  // Annotation above card
  annotationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
    marginLeft: 2,
  },
  urgencyDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  annotationText: {
    fontSize: 11,
    fontFamily: F.body,
    letterSpacing: 0.01 * 11,
  },

  // Empty state
  emptyContainer: { flex: 1, alignItems: 'flex-start', justifyContent: 'center', padding: 28, paddingBottom: 80 },
  emptyGreeting: { fontSize: 13, fontFamily: F.body, marginBottom: 4 },
  emptyDate: { fontSize: 28, fontFamily: F.displayBold, letterSpacing: -0.5, lineHeight: 34, marginBottom: 32 },
  emptyTitle: { fontSize: 18, fontFamily: F.headlineSemi, marginBottom: 8 },
  emptySubtitle: { fontSize: 15, fontFamily: F.body, lineHeight: 22, marginBottom: 32 },
  emptyButton: { borderRadius: 9999, paddingVertical: 14, paddingHorizontal: 28 },
  emptyButtonText: { fontSize: 15, fontFamily: F.bodySemi },

  // Footer
  allJobsRow: { paddingVertical: 20, alignItems: 'center' },
  allJobsText: { fontSize: 13, fontFamily: F.body },
});
