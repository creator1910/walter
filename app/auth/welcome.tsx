import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { F, useTheme } from '../../lib/theme';

export default function WelcomeScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: t.surface, paddingTop: insets.top, paddingBottom: insets.bottom + 32 }]}>
      {/* Wordmark */}
      <View style={styles.wordmarkBlock}>
        <Text style={[styles.wordmark, { color: t.on_surface }]}>Walter</Text>
        <Text style={[styles.tagline, { color: t.on_surface_variant }]}>
          Angebote und Rechnungen{'\n'}in Sekunden — nicht Stunden.
        </Text>
      </View>

      {/* Value props */}
      <View style={styles.props}>
        <Prop icon="→" text="Auftrag per Sprache oder Text beschreiben" t={t} />
        <Prop icon="→" text="Angebot und Rechnung automatisch erstellt" t={t} />
        <Prop icon="→" text="Alle Aufträge sicher in der Cloud" t={t} />
      </View>

      {/* CTAs */}
      <View style={styles.ctas}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: t.primary },
            pressed && { transform: [{ scale: 1.02 }] },
          ]}
          onPress={() => router.push('/auth/sign-up')}
        >
          <Text style={[styles.primaryButtonText, { color: t.on_primary }]}>
            Kostenlos starten
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.6 }]}
          onPress={() => router.push('/auth/sign-in')}
        >
          <Text style={[styles.secondaryButtonText, { color: t.on_surface_variant }]}>
            Ich habe bereits ein Konto
          </Text>
        </Pressable>
      </View>

      {/* Legal */}
      <Text style={[styles.legal, { color: t.outline }]}>
        Mit der Registrierung stimmst du der{' '}
        <Text style={{ color: t.on_surface_variant }}>Datenschutzerklärung</Text>
        {' '}zu.
      </Text>
    </View>
  );
}

function Prop({ icon, text, t }: { icon: string; text: string; t: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.propRow}>
      <Text style={[styles.propIcon, { color: t.outline }]}>{icon}</Text>
      <Text style={[styles.propText, { color: t.on_surface_variant }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },

  wordmarkBlock: {
    paddingTop: 48,
  },
  wordmark: {
    fontSize: 56,
    fontFamily: F.displayBold,
    letterSpacing: -2,
    lineHeight: 60,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 20,
    fontFamily: F.headlineSemi,
    lineHeight: 28,
    letterSpacing: -0.3,
  },

  props: {
    gap: 14,
  },
  propRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  propIcon: {
    fontSize: 15,
    fontFamily: F.body,
    marginTop: 1,
  },
  propText: {
    fontSize: 15,
    fontFamily: F.body,
    flex: 1,
    lineHeight: 22,
  },

  ctas: {
    gap: 12,
  },
  primaryButton: {
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: F.bodySemi,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontFamily: F.body,
  },

  legal: {
    fontSize: 12,
    fontFamily: F.body,
    textAlign: 'center',
    lineHeight: 18,
  },
});
