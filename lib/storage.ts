/**
 * lib/storage.ts — Barrel re-export.
 *
 * All screens import from 'lib/storage'. This file now delegates to the
 * focused modules (jobs, photos, supabase) while keeping the import paths
 * unchanged across the codebase.
 */

// Profile — still AsyncStorage-backed (will move to Supabase profiles table
// once auth screens land and the user has a session)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CompanyProfile } from '../types';

const PROFILE_KEY = 'walter:profile';

export async function loadProfile(): Promise<CompanyProfile | null> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function saveProfile(profile: CompanyProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

// Jobs
export { loadJobs, saveJob, deleteJob, generateDocNumber, flushPendingJobs, isJobPending } from './jobs';

// Photos
export { savePhoto, deletePhoto, localUriForPhoto } from './photos';

// Utilities (no cloud dependency)
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function isThisMonth(isoString?: string): boolean {
  if (!isoString) return false;
  const d = new Date(isoString);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}
