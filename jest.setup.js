global.fetch = jest.fn();

// Expo 55 new arch runtime requires __ExpoImportMetaRegistry global
global.__ExpoImportMetaRegistry = {};

// Supabase requires these env vars at module init time — use dummy values in tests
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
