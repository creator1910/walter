/**
 * lib/jobs.ts — CRUD for jobs with dual-write strategy.
 *
 * Every write goes to AsyncStorage first (offline resilience), then
 * attempts a background Supabase sync. Reads merge Supabase (source
 * of truth) with the local pending queue so offline-created jobs
 * appear immediately.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Job } from '../types';
import { supabase } from './supabase';

const JOBS_KEY = 'walter:jobs';
const PENDING_KEY = 'walter:jobs_pending'; // ids of jobs awaiting sync

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

async function readLocal(): Promise<Job[]> {
  const raw = await AsyncStorage.getItem(JOBS_KEY);
  if (!raw) return [];
  const jobs: Job[] = JSON.parse(raw);
  return jobs.map(j =>
    (j.status as string) === 'accepted' ? { ...j, status: 'in_progress' as const } : j
  );
}

async function writeLocal(jobs: Job[]): Promise<void> {
  await AsyncStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
}

async function getPendingIds(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(PENDING_KEY);
  return new Set(raw ? JSON.parse(raw) : []);
}

async function addPending(id: string): Promise<void> {
  const pending = await getPendingIds();
  pending.add(id);
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify([...pending]));
}

async function removePending(id: string): Promise<void> {
  const pending = await getPendingIds();
  pending.delete(id);
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify([...pending]));
}

// ---------------------------------------------------------------------------
// Map between local Job shape and Supabase row shape
// ---------------------------------------------------------------------------

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
    photos: job.photos ?? [],
    updated_at: new Date().toISOString(),
  };
}

function fromRow(row: Record<string, unknown>): Job {
  return {
    id: row.id as string,
    createdAt: row.created_at as string,
    status: row.status as Job['status'],
    customer: row.customer as Job['customer'],
    description: (row.description as string) ?? '',
    lineItems: (row.line_items as Job['lineItems']) ?? [],
    vatRate: Number(row.vat_rate),
    notes: (row.notes as string | undefined) ?? undefined,
    quoteNumber: (row.quote_number as string | undefined) ?? undefined,
    invoiceNumber: (row.invoice_number as string | undefined) ?? undefined,
    quoteDate: (row.quote_date as string | undefined) ?? undefined,
    invoiceDate: (row.invoice_date as string | undefined) ?? undefined,
    acceptedAt: (row.accepted_at as string | undefined) ?? undefined,
    paidAt: (row.paid_at as string | undefined) ?? undefined,
    photos: (row.photos as string[]) ?? [],
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load jobs. If signed in: merge Supabase jobs (source of truth) with the
 * local pending queue. If not signed in: return local jobs only.
 */
export async function loadJobs(): Promise<Job[]> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return readLocal();
  }

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    // Network down — fall back to local
    return readLocal();
  }

  const remoteJobs = data.map(fromRow);

  // Merge with local pending queue (jobs created offline not yet in Supabase)
  const pendingIds = await getPendingIds();
  const localJobs = await readLocal();
  const pendingJobs = localJobs.filter(j => pendingIds.has(j.id));

  // Pending jobs go at the front; remote jobs fill the rest (deduped by id)
  const remoteIds = new Set(remoteJobs.map(j => j.id));
  const merged = [
    ...pendingJobs.filter(j => !remoteIds.has(j.id)),
    ...remoteJobs,
  ];

  // Keep local cache in sync with remote for offline fallback
  await writeLocal(merged);

  return merged;
}

/**
 * Save (create or update) a job. Writes locally first, then syncs to Supabase.
 */
export async function saveJob(job: Job): Promise<void> {
  // 1. Write locally (always succeeds)
  const jobs = await readLocal();
  const idx = jobs.findIndex(j => j.id === job.id);
  if (idx >= 0) {
    jobs[idx] = job;
  } else {
    jobs.unshift(job);
  }
  await writeLocal(jobs);

  // 2. Attempt Supabase sync
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    await addPending(job.id);
    return;
  }

  const { error } = await supabase
    .from('jobs')
    .upsert(toRow(job, session.user.id), { onConflict: 'id' });

  if (error) {
    await addPending(job.id);
  } else {
    await removePending(job.id);
  }
}

/**
 * Delete a job locally and from Supabase.
 */
export async function deleteJob(id: string): Promise<void> {
  const jobs = await readLocal();
  await writeLocal(jobs.filter(j => j.id !== id));
  await removePending(id);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  await supabase.from('jobs').delete().eq('id', id);
}

/**
 * Flush all pending (offline-created) jobs to Supabase.
 * Call this when the app regains network connectivity.
 */
export async function flushPendingJobs(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const pendingIds = await getPendingIds();
  if (pendingIds.size === 0) return;

  const localJobs = await readLocal();
  const pendingJobs = localJobs.filter(j => pendingIds.has(j.id));

  await Promise.all(
    pendingJobs.map(async job => {
      const { error } = await supabase
        .from('jobs')
        .upsert(toRow(job, session.user.id), { onConflict: 'id' });
      if (!error) await removePending(job.id);
    })
  );
}

/**
 * Returns true if a job has a pending sync (created offline).
 */
export async function isJobPending(id: string): Promise<boolean> {
  const pending = await getPendingIds();
  return pending.has(id);
}

/**
 * Generate the next document number via the Supabase DB function.
 * Falls back to local generation if not signed in.
 */
export async function generateDocNumber(
  prefix: 'AN' | 'RE',
  jobs: Job[]
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return generateDocNumberLocal(prefix, jobs);
  }

  const year = new Date().getFullYear();
  const { data, error } = await supabase.rpc('next_doc_number', {
    p_user_id: session.user.id,
    p_year: year,
    p_type: prefix,
  });

  if (error || !data) {
    return generateDocNumberLocal(prefix, jobs);
  }
  return data as string;
}

function generateDocNumberLocal(prefix: 'AN' | 'RE', jobs: Job[]): string {
  const year = new Date().getFullYear();
  const existing = jobs
    .map(j => (prefix === 'AN' ? j.quoteNumber : j.invoiceNumber))
    .filter(Boolean)
    .filter(n => n!.startsWith(`${prefix}-${year}`))
    .map(n => parseInt(n!.split('-')[2], 10))
    .filter(n => !isNaN(n));
  const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
  return `${prefix}-${year}-${String(next).padStart(4, '0')}`;
}
