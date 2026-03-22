import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import JobCard from '../components/JobCard';
import { loadJobs } from '../lib/storage';
import { F, useTheme } from '../lib/theme';
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
        renderItem={({ item }) => (
          <JobCard job={item} onPress={() => router.push(`/job/${item.id}`)} />
        )}
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
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: { fontSize: 28, lineHeight: 32, fontFamily: F.body },
});
