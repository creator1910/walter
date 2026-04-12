/**
 * lib/photos.ts — Photo storage: local filesystem + Supabase Storage.
 *
 * Local path: walter-photos/{jobId}/{filename}  (used during job creation and PDF)
 * Remote path: job-photos/{userId}/{jobId}/{filename}  (Supabase Storage bucket)
 *
 * When signed in, photos are uploaded to Supabase Storage after local save.
 * The remote URL is what gets stored in job.photos[]. For PDF generation on
 * historical jobs the remote URL is downloaded to a temp path first.
 */
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

const PHOTOS_DIR = `${FileSystem.documentDirectory}walter-photos/`;

// ---------------------------------------------------------------------------
// Local filesystem helpers (unchanged from original storage.ts)
// ---------------------------------------------------------------------------

async function ensurePhotosDir(jobId: string): Promise<string> {
  const dir = `${PHOTOS_DIR}${jobId}/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  return dir;
}

/**
 * Copy a picked photo to the local walter-photos directory.
 * Returns the local URI. If signed in, also uploads to Supabase Storage
 * and returns the remote URL instead (so job.photos[] stores the remote URL).
 */
export async function savePhoto(jobId: string, sourceUri: string): Promise<string> {
  const dir = await ensurePhotosDir(jobId);
  const ext = sourceUri.split('.').pop()?.split('?')[0] ?? 'jpg';
  const filename = `${Date.now()}.${ext}`;
  const localPath = `${dir}${filename}`;
  await FileSystem.copyAsync({ from: sourceUri, to: localPath });

  // Try uploading to Supabase Storage
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return localPath;

  try {
    const remoteUrl = await uploadPhoto(session.user.id, jobId, filename, localPath);
    return remoteUrl;
  } catch {
    // Upload failed (offline) — return local path, caller can retry
    return localPath;
  }
}

/**
 * Upload a local photo file to Supabase Storage.
 * Returns the public URL.
 */
export async function uploadPhoto(
  userId: string,
  jobId: string,
  filename: string,
  localPath: string
): Promise<string> {
  const remotePath = `${userId}/${jobId}/${filename}`;

  // Read file as base64 for upload
  const base64 = await FileSystem.readAsStringAsync(localPath, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Convert base64 to Uint8Array for Supabase upload
  const byteCharacters = atob(base64);
  const byteArray = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteArray[i] = byteCharacters.charCodeAt(i);
  }

  const { error } = await supabase.storage
    .from('job-photos')
    .upload(remotePath, byteArray, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage.from('job-photos').getPublicUrl(remotePath);
  return data.publicUrl;
}

/**
 * Delete a photo. Handles both local URIs and Supabase Storage URLs.
 */
export async function deletePhoto(uri: string): Promise<void> {
  if (uri.startsWith('http')) {
    // Remote Supabase Storage URL
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // Extract path after the bucket name
      const match = uri.match(/job-photos\/(.+)$/);
      if (match) {
        await supabase.storage.from('job-photos').remove([match[1]]);
      }
    }
  } else {
    // Local file URI
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch {
      // ignore
    }
  }
}

/**
 * Ensure a photo is available as a local temp file for PDF generation.
 * For local URIs: returns the URI as-is.
 * For remote Supabase URLs: downloads to a temp file and returns that path.
 */
export async function localUriForPhoto(remoteOrLocalUri: string): Promise<string> {
  if (!remoteOrLocalUri.startsWith('http')) return remoteOrLocalUri;

  const filename = remoteOrLocalUri.split('/').pop() ?? 'photo.jpg';
  const tempPath = `${FileSystem.cacheDirectory}walter-pdf-photos/${filename}`;

  // Create temp dir
  await FileSystem.makeDirectoryAsync(
    `${FileSystem.cacheDirectory}walter-pdf-photos/`,
    { intermediates: true }
  );

  // Download if not already cached
  const info = await FileSystem.getInfoAsync(tempPath);
  if (!info.exists) {
    const result = await FileSystem.downloadAsync(remoteOrLocalUri, tempPath);
    if (result.status !== 200) {
      throw new Error(`Photo download failed: HTTP ${result.status}`);
    }
  }

  return tempPath;
}
