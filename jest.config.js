module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  setupFiles: ['./jest.setup.js'],
  modulePathIgnorePatterns: ['.claude/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  moduleNameMapper: {
    'expo-print': '<rootDir>/__mocks__/expo-print.js',
    'expo-sharing': '<rootDir>/__mocks__/expo-sharing.js',
    'expo-speech-recognition': '<rootDir>/__mocks__/expo-speech-recognition.js',
    '@react-native-async-storage/async-storage': '<rootDir>/__mocks__/async-storage.js',
    'expo/src/winter/runtime\\.native': '<rootDir>/__mocks__/expo-winter-runtime.js',
    'expo/src/winter/installGlobal': '<rootDir>/__mocks__/expo-winter-runtime.js',
    'expo/src/winter/ImportMetaRegistry': '<rootDir>/__mocks__/expo-winter-runtime.js',
    'expo/src/winter$': '<rootDir>/__mocks__/expo-winter-runtime.js',
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
};
