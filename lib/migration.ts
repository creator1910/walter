/**
 * lib/migration.ts — One-time AsyncStorage → Supabase migration.
 *
 * State machine persisted in AsyncStorage as `walter:migration_state`:
 *   not_started → jobs_migrated → photos_migrating:{jobId} → done
 *
 * Each phase is idempotent: safe to run multiple times, no duplicates.
 * The state key checkpoints progress so a crash mid-migration resumes
 * from the last completed phase on retry.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Job } from '../types';
import { supabase } from './supabase';
import { uploadPhoto } from './photos';

const STATE_KEY = 'walter:migration_state';
const JOBS_KEY = 'walter:jobs';

export type MigrationState =
  | 'not_started'
  | 'jobs_migrated'
  | `photos_migrating:${string}`
  | 'done';

export type MigrationProgress = {
  state: MigrationState;
  totalJobs: number;
  migratedJobs: number;
  failedPhotoJobs: string[]; // job IDs where at least one photo failed
};

export async function getMigrationState(): Promise<MigrationState> {
  const raw = await AsyncStorage.getItem(STATE_KEY);
  return (raw as MigrationState) ?? 'not_started';
}

async function setMigrationState(state: MigrationState): Promise<void> {
  await AsyncStorage.setItem(STATE_KEY, state);
}

function toRow(job: Job, userId: string) {
  return {
    id: job.id,
    user_id: userId,
    created_at: job.createdAt,
    status: job.status,
    customer: job.customer,
    description: job.description ?? null,
    line_items: job.lineItems,
    vat_rate: job.vatRate,
    notes: job.notes ?? null,
    quote_number: job.quoteNumber ?? null,
    invoice_number: job.invoiceNumber ?? null,
    quote_date: job.quoteDate ?? null,
    invoice_date: job.invoiceDate ?? null,
    accepted_at: job.acceptedAt ?? null,
    paid_at: job.paidAt ?? null,
    photos: [],                    // photos migrated separately in Phase 2
    updated_at: new Date().toISOString(),
  };
}

/**
 * Run the full migration. Resumes from wherever it left off.
 * Call this after the user signs in for the first time.
 *
 * @param onProgress Optional callback for UI progress updates.
 */
export async function runMigration(
  onProgress?: (p: MigrationProgress) => void
): Promise<MigrationProgress> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not signed in');

  const userId = session.user.id;
  const raw = await AsyncStorage.getItem(JOBS_KEY);
  const localJobs: Job[] = raw
    ? (JSON.parse(raw) as Job[]).map(j =>
        (j.status as string) === 'accepted' ? { ...j, status: 'in_progress' as const } : j
      )
    : [];

  const progress: MigrationProgress = {
    state: await getMigrationState(),
    totalJobs: localJobs.length,
    migratedJobs: 0,
    failedPhotoJobs: [],
  };

  // Nothing to migrate
  if (localJobs.length === 0) {
    await setMigrationState('done');
    progress.state = 'done';
    onProgress?.(progress);
    return progress;
  }

  // Already done
  if (progress.state === 'done') {
    progress.migratedJobs = localJobs.length;
    onProgress?.(progress);
    return progress;
  }

  // -------------------------------------------------------------------------
  // Phase 1: Upsert all jobs (without photos) to Supabase
  // -------------------------------------------------------------------------
  if (progress.state === 'not_started') {
    const rows = localJobs.map(j => toRow(j, userId));

    // Upsert in one batch — idempotent (ON CONFLICT DO UPDATE)
    const { error } = await supabase
      .from('jobs')
      .upsert(rows, { onConflict: 'id' });

    if (error) throw new Error(`Phase 1 failed: ${error.message}`);

    await setMigrationState('jobs_migrated');
    progress.state = 'jobs_migrated';
    progress.migratedJobs = localJobs.length;
    onProgress?.(progress);
  }

  // -------------------------------------------------------------------------
  // Phase 2: Upload photos job-by-job, checkpointing after each
  // -------------------------------------------------------------------------
  const jobsWithPhotos = localJobs.filter(
    j => (j.photos?.length ?? 0) > 0 && j.photos!.some(p => !p.startsWith('http'))
  );

  // Figure out where we left off
  let startFromJobId: string | null = null;
  if (typeof progress.state === 'string' && progress.state.startsWith('photos_migrating:')) {
    startFromJobId = progress.state.split(':')[1];
  }

  let resuming = startFromJobId !== null;

  for (const job of jobsWithPhotos) {
    // Skip jobs already processed in a previous run
    if (resuming) {
      if (job.id === startFromJobId) resuming = false;
      else continue;
    }

    await setMigrationState(`photos_migrating:${job.id}`);
    progress.state = `photos_migrating:${job.id}`;

    const remoteUrls: string[] = [];
    let jobFailed = false;

    for (const localUri of job.photos ?? []) {
      if (localUri.startsWith('http')) {
        remoteUrls.push(localUri);
        continue;
      }

      try {
        const filename = localUri.split('/').pop() ?? `${Date.now()}.jpg`;
        const remoteUrl = await uploadPhoto(userId, job.id, filename, localUri);
        remoteUrls.push(remoteUrl);
      } catch {
        // Photo upload failed — keep local URI, mark for retry
        remoteUrls.push(localUri);
        jobFailed = true;
      }
    }

    if (jobFailed) {
      progress.failedPhotoJobs.push(job.id);
    }

    // Update the job's photos array in Supabase
    await supabase
      .from('jobs')
      .update({ photos: remoteUrls, updated_at: new Date().toISOString() })
      .eq('id', job.id);

    onProgress?.({ ...progress });
  }

  await setMigrationState('done');
  progress.state = 'done';
  onProgress?.(progress);

  return progress;
}

/**
 * Reset migration state (for testing or manual retry from Settings).
 */
export async function resetMigration(): Promise<void> {
  await AsyncStorage.removeItem(STATE_KEY);
}
