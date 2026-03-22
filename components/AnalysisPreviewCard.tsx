import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { F, useTheme } from '../lib/theme';
import { AnalysisPreview } from '../types';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const CARD_HEIGHT = Math.round(SCREEN_HEIGHT * 0.6);

const CONFIDENCE_DOTS = 4;
const FILLED: Record<AnalysisPreview['analysis']['confidence'], number> = {
  hoch: 4,
  mittel: 3,
  niedrig: 2,
};
const CONFIDENCE_LABEL: Record<AnalysisPreview['analysis']['confidence'], string> = {
  hoch: 'Hoch',
  mittel: 'Mittel',
  niedrig: 'Niedrig',
};

interface Props {
  preview: AnalysisPreview;
  onAccept: () => void;
  onEdit: () => void;
}

export default function AnalysisPreviewCard({ preview, onAccept, onEdit }: Props) {
  const t = useTheme();
  const translateY = useRef(new Animated.Value(CARD_HEIGHT)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 150,
    }).start();
  }, [translateY]);

  const filledDots = FILLED[preview.analysis.confidence];
  const confidenceLabel = CONFIDENCE_LABEL[preview.analysis.confidence];

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: t.surface_card, transform: [{ translateY }] },
      ]}
    >
      {/* Drag handle */}
      <View style={[styles.dragHandle, { backgroundColor: t.outline_variant }]} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: t.outline }]}>WALTER'S ANALYSE</Text>

        <Text style={[styles.sectionLabel, { color: t.outline, marginTop: 16 }]}>ERKANNT</Text>
        <Text style={[styles.body, { color: t.on_surface }]}>{preview.analysis.erkannt}</Text>

        {preview.job.lineItems && preview.job.lineItems.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: t.outline, marginTop: 16 }]}>
              POSITIONEN ({preview.job.lineItems.length})
            </Text>
            {preview.job.lineItems.map((item, i) => (
              <View key={i} style={styles.lineItem}>
                <Text style={[styles.body, { color: t.on_surface, flex: 1 }]} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={[styles.lineItemMeta, { color: t.on_surface }]}>
                  {item.quantity} {item.unit}
                </Text>
                <Text style={[styles.lineItemPrice, { color: t.on_surface }]}>
                  {(item.quantity * item.unitPrice).toLocaleString('de-DE', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </Text>
              </View>
            ))}
          </>
        )}

        <View style={styles.confidenceRow}>
          <Text style={[styles.body, { color: t.on_surface_variant }]}>Vertrauen:</Text>
          <View style={styles.dots}>
            {Array.from({ length: CONFIDENCE_DOTS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: i < filledDots ? t.primary : t.outline_variant },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.body, { color: t.on_surface_variant }]}>{confidenceLabel}</Text>
        </View>
      </ScrollView>

      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: t.surface_high, opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={onEdit}
        >
          <Text style={[styles.actionButtonText, { color: t.on_surface }]}>Anpassen</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: t.primary, opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={onAccept}
        >
          <Text style={[styles.actionButtonText, { color: t.on_primary }]}>Übernehmen</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CARD_HEIGHT,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  dragHandle: {
    width: 32,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 16 },

  sectionLabel: {
    fontSize: 11,
    fontFamily: F.labelSemi,
    textTransform: 'uppercase',
    letterSpacing: 0.05 * 11,
  },
  body: {
    fontSize: 15,
    fontFamily: F.body,
    marginTop: 4,
  },

  lineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  lineItemMeta: {
    fontSize: 15,
    fontFamily: F.displayBold,
    fontVariant: ['tabular-nums'],
  },
  lineItemPrice: {
    fontSize: 15,
    fontFamily: F.displayBold,
    fontVariant: ['tabular-nums'],
    minWidth: 72,
    textAlign: 'right',
  },

  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },

  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 32,
  },
  actionButton: {
    flex: 1,
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: F.bodySemi,
  },
});
