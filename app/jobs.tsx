import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { loadJobs } from '../lib/storage';
import { ACTIVE_STATUSES, C, STATUS_BG, STATUS_LABEL, STATUS_TEXT } from '../lib/theme';
import { Job } from '../types';

export default function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadJobs().then(setJobs);
    }, [])
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={jobs}
        keyExtractor={j => j.id}
        contentContainerStyle={jobs.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Noch keine Aufträge</Text>
            <Text style={styles.emptySubtitle}>Tippe auf + um einen neuen Auftrag anzulegen</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isActive = ACTIVE_STATUSES.has(item.status);
          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                isActive && styles.cardActive,
                pressed && styles.cardPressed,
              ]}
              onPress={() => router.push(`/job/${item.id}`)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.customerName}>{item.customer.name || 'Unbekannter Kunde'}</Text>
                <View style={[styles.badge, { backgroundColor: STATUS_BG[item.status] }]}>
                  <View style={[styles.badgeDot, { backgroundColor: STATUS_TEXT[item.status] }]} />
                  <Text style={[styles.badgeText, { color: STATUS_TEXT[item.status] }]}>
                    {STATUS_LABEL[item.status]}
                  </Text>
                </View>
              </View>
              <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('de-DE')}</Text>
            </Pressable>
          );
        }}
      />
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => router.push('/new-job')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  list: { padding: 16, gap: 10 },
  emptyContainer: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 17, fontFamily: 'DMSans_600SemiBold', color: C.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 15, fontFamily: 'DMSans_400Regular', color: C.textMid, textAlign: 'center' },
  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 1,
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
  description: { fontSize: 14, fontFamily: 'DMSans_400Regular', color: C.textMid, marginBottom: 8, lineHeight: 20 },
  date: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: C.textDim },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 54,
    height: 54,
    borderRadius: 9999,
    backgroundColor: C.amber,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.amber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  fabPressed: { opacity: 0.85 },
  fabIcon: { fontSize: 28, color: '#111111', lineHeight: 32, fontFamily: 'DMSans_400Regular' },
});
