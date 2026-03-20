import AsyncStorage from '@react-native-async-storage/async-storage';
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

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
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
