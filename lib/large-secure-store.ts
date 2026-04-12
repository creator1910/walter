/**
 * LargeSecureStore — Supabase auth storage adapter for expo-secure-store.
 *
 * expo-secure-store has a 2048-byte limit per key. Supabase JWTs routinely
 * exceed this. This adapter chunks large values across multiple keys so the
 * session token lands in the iOS Keychain without truncation.
 *
 * Usage: createClient(url, key, { auth: { storage: LargeSecureStore } })
 */
import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1800; // comfortably under the 2048-byte iOS Keychain limit

export const LargeSecureStore = {
  async getItem(key: string): Promise<string | null> {
    const chunkCountStr = await SecureStore.getItemAsync(`${key}__chunks`);
    if (!chunkCountStr) {
      // Single-chunk value (or doesn't exist)
      return SecureStore.getItemAsync(key);
    }
    const chunkCount = Number(chunkCountStr);
    const chunks = await Promise.all(
      Array.from({ length: chunkCount }, (_, i) =>
        SecureStore.getItemAsync(`${key}__chunk_${i}`)
      )
    );
    // If any chunk is missing the token is corrupt — return null so Supabase
    // treats it as no session (user will need to sign in again).
    if (chunks.some(c => c === null)) return null;
    return chunks.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      // Clean up any stale chunks from a previous large write.
      await SecureStore.deleteItemAsync(`${key}__chunks`).catch(() => {});
      return;
    }
    const chunks = value.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'g'))!;
    await Promise.all(
      chunks.map((chunk, i) =>
        SecureStore.setItemAsync(`${key}__chunk_${i}`, chunk)
      )
    );
    await SecureStore.setItemAsync(`${key}__chunks`, String(chunks.length));
    // Clean up the plain key slot in case a previous value was stored there.
    await SecureStore.deleteItemAsync(key).catch(() => {});
  },

  async removeItem(key: string): Promise<void> {
    const chunkCountStr = await SecureStore.getItemAsync(`${key}__chunks`);
    if (chunkCountStr) {
      await Promise.all(
        Array.from({ length: Number(chunkCountStr) }, (_, i) =>
          SecureStore.deleteItemAsync(`${key}__chunk_${i}`)
        )
      );
    }
    await SecureStore.deleteItemAsync(`${key}__chunks`).catch(() => {});
    await SecureStore.deleteItemAsync(key).catch(() => {});
  },
};
