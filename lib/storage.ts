import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { CompanyProfile, Job } from '../types';

const JOBS_KEY = 'walter:jobs';
const PROFILE_KEY = 'walter:profile';

export async function loadProfile(): Promise<CompanyProfile | null> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function saveProfile(profile: CompanyProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function loadJobs(): Promise<Job[]> {
  const raw = await AsyncStorage.getItem(JOBS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveJob(job: Job): Promise<void> {
  const jobs = await loadJobs();
  const idx = jobs.findIndex(j => j.id === job.id);
  if (idx >= 0) {
    jobs[idx] = job;
  } else {
    jobs.unshift(job);
  }
  await AsyncStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
}

export async function deleteJob(id: string): Promise<void> {
  const jobs = await loadJobs();
  await AsyncStorage.setItem(JOBS_KEY, JSON.stringify(jobs.filter(j => j.id !== id)));
}

export function isThisMonth(isoString?: string): boolean {
  if (!isoString) return false;
  const d = new Date(isoString);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const PHOTOS_DIR = `${FileSystem.documentDirectory}walter-photos/`;

async function ensurePhotosDir(jobId: string): Promise<string> {
  const dir = `${PHOTOS_DIR}${jobId}/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  return dir;
}

export async function savePhoto(jobId: string, sourceUri: string): Promise<string> {
  const dir = await ensurePhotosDir(jobId);
  const ext = sourceUri.split('.').pop()?.split('?')[0] ?? 'jpg';
  const filename = `${Date.now()}.${ext}`;
  const dest = `${dir}${filename}`;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}

export async function deletePhoto(uri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // ignore — file may already be gone
  }
}

export function generateDocNumber(prefix: 'AN' | 'RE', jobs: Job[]): string {
  const year = new Date().getFullYear();
  const existing = jobs
    .map(j => prefix === 'AN' ? j.quoteNumber : j.invoiceNumber)
    .filter(Boolean)
    .filter(n => n!.startsWith(`${prefix}-${year}`))
    .map(n => parseInt(n!.split('-')[2], 10))
    .filter(n => !isNaN(n));
  const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
  return `${prefix}-${year}-${String(next).padStart(4, '0')}`;
}
