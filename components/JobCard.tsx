import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { calculateTotals } from '../lib/claude';
import { F, statusColors, STATUS_LABEL, useTheme } from '../lib/theme';
import { Job } from '../types';

const fmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

export default function JobCard({ job, onPress }: { job: Job; onPress: () => void }) {
  const t = useTheme();
  const sc = statusColors(t, job.status);
  const gross = calculateTotals(job.lineItems, job.vatRate).gross;
  const photo = job.photos?.[0];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: t.surface_card },
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      {/* Photo background — subtle texture bleeding in from the right */}
      {photo && (
        <Image
          source={{ uri: photo }}
          style={[StyleSheet.absoluteFillObject, styles.cardBg]}
          resizeMode="cover"
        />
      )}
      {/* Wipe gradient — card color → transparent, left to right, covers ~65% */}
      {photo && (
        <LinearGradient
          colors={[t.surface_card, t.surface_card + '00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.65, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      {/* Top row: customer name + status badge */}
      <View style={styles.cardTop}>
        <Text style={[styles.customerName, { color: t.on_surface }]} numberOfLines={1}>
          {job.customer.name || 'Unbekannter Kunde'}
        </Text>
        <View style={[styles.badge, { backgroundColor: sc.bg }]}>
          <View style={[styles.badgeDot, { backgroundColor: sc.text }]} />
          <Text style={[styles.badgeText, { color: sc.text }]}>{STATUS_LABEL[job.status]}</Text>
        </View>
      </View>

      {/* Bottom row: description (clipped) + amount */}
      <View style={styles.cardBottom}>
        <MaskedView
          style={styles.descriptionClip}
          maskElement={
            <LinearGradient
              colors={['#000000ff', '#000000ff', '#00000000']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              locations={[0, 0.75, 1]}
              style={StyleSheet.absoluteFillObject}
            />
          }
        >
          <Text style={[styles.description, { color: t.on_surface_variant }]} numberOfLines={1}>
            {job.description}
          </Text>
        </MaskedView>
        <Text style={[styles.amount, { color: t.on_surface }]}>
          {gross > 0 ? fmt.format(gross) : '—'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    gap: 8,
    overflow: 'hidden',
  },
  cardBg: {
    opacity: 0.13,
  },
  cardPressed: { opacity: 0.7 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  descriptionClip: {
    flex: 1,
    overflow: 'hidden',
  },
  description: {
    fontSize: 14,
    fontFamily: F.body,
  },
  customerName: { fontSize: 16, fontFamily: F.bodySemi, flex: 1 },
  amount: {
    fontSize: 16,
    fontFamily: F.dataBold,
    fontVariant: ['tabular-nums'],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontFamily: F.bodyMedium },
});
