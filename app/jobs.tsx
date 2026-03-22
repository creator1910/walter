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
import { F, statusColors, STATUS_LABEL, useTheme } from '../lib/theme';
import { Job } from '../types';

export default function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const router = useRouter();
  const t = useTheme();

  useFocusEffect(
    useCallback(() => {
      loadJobs().then(setJobs);
    }, [])
  );

  return (
    <View style={[styles.container, { backgroundColor: t.surface }]}>
      <FlatList
        data={jobs}
        keyExtractor={j => j.id}
        contentContainerStyle={jobs.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: t.on_surface }]}>Noch keine Aufträge</Text>
            <Text style={[styles.emptySubtitle, { color: t.on_surface_variant }]}>Tippe auf + um einen neuen Auftrag anzulegen</Text>
          </View>
        }
        renderItem={({ item }) => {
          const sc = statusColors(t, item.status);
          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: t.surface_card },
                pressed && styles.cardPressed,
              ]}
              onPress={() => router.push(`/job/${item.id}`)}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.customerName, { color: t.on_surface }]}>{item.customer.name || 'Unbekannter Kunde'}</Text>
                <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                  <View style={[styles.badgeDot, { backgroundColor: sc.text }]} />
                  <Text style={[styles.badgeText, { color: sc.text }]}>
                    {STATUS_LABEL[item.status]}
                  </Text>
                </View>
              </View>
              <Text style={[styles.description, { color: t.on_surface_variant }]} numberOfLines={2}>{item.description}</Text>
              <Text style={[styles.date, { color: t.outline }]}>{new Date(item.createdAt).toLocaleDateString('de-DE')}</Text>
            </Pressable>
          );
        }}
      />
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: t.primary },
          pressed && { transform: [{ scale: 1.02 }] },
        ]}
        onPress={() => router.push('/new-job')}
      >
        <Text style={[styles.fabIcon, { color: t.on_primary }]}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, gap: 10 },
  emptyContainer: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 17, fontFamily: F.headlineSemi, marginBottom: 8 },
  emptySubtitle: { fontSize: 15, fontFamily: F.body, textAlign: 'center' },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  cardPressed: { opacity: 0.7 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  customerName: { fontSize: 15, fontFamily: F.bodySemi, flex: 1, marginRight: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontFamily: F.bodyMedium },
  description: { fontSize: 14, fontFamily: F.body, marginBottom: 8, lineHeight: 20 },
  date: { fontSize: 12, fontFamily: F.body },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 54,
    height: 54,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: { fontSize: 28, lineHeight: 32, fontFamily: F.body },
});
