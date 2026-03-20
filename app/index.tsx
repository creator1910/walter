import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { loadJobs } from '../lib/storage';
import { Job, JobStatus } from '../types';

const STATUS_LABEL: Record<JobStatus, string> = {
  draft: 'Entwurf',
  quote_sent: 'Angebot versendet',
  accepted: 'Angenommen',
  invoiced: 'Rechnung gestellt',
  paid: 'Bezahlt',
};

const STATUS_COLOR: Record<JobStatus, string> = {
  draft: '#8E8E93',
  quote_sent: '#007AFF',
  accepted: '#34C759',
  invoiced: '#FF9500',
  paid: '#30D158',
};

export default function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const router = useRouter();
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      loadJobs().then(setJobs);
      navigation.setOptions({
        headerRight: () => (
          <Pressable
            onPress={() => router.push('/profile')}
            style={({ pressed }) => [{ padding: 8, marginRight: 4 }, pressed && { opacity: 0.5 }]}
            accessibilityLabel="Firmenprofil"
          >
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </Pressable>
        ),
      });
    }, [navigation, router])
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
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => router.push(`/job/${item.id}`)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.customerName}>{item.customer.name || 'Unbekannter Kunde'}</Text>
              <View style={[styles.badge, { backgroundColor: STATUS_COLOR[item.status] + '20' }]}>
                <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status] }]}>
                  {STATUS_LABEL[item.status]}
                </Text>
              </View>
            </View>
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('de-DE')}</Text>
          </Pressable>
        )}
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
  container: { flex: 1 },
  list: { padding: 16, gap: 12 },
  emptyContainer: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#8E8E93', textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: { opacity: 0.7 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  customerName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  description: { fontSize: 14, color: '#6B6B6B', marginBottom: 8, lineHeight: 20 },
  date: { fontSize: 12, color: '#AEAEB2' },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabPressed: { opacity: 0.85 },
  fabIcon: { fontSize: 28, color: '#fff', lineHeight: 32 },
});
