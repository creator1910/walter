import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Customer, Job, LineItem } from '../types';
import { F, useTheme } from '../lib/theme';

export interface JobFormValues {
  customer: Customer;
  description: string;
  lineItems: LineItem[];
  vatRate: number;
  notes: string;
}

interface Props {
  values: JobFormValues;
  onChange: (values: JobFormValues) => void;
}

const VAT_OPTIONS = [0.19, 0.07];

export function jobToFormValues(job: Job): JobFormValues {
  return {
    customer: { ...job.customer },
    description: job.description,
    lineItems: job.lineItems.map(li => ({ ...li })),
    vatRate: job.vatRate,
    notes: job.notes ?? '',
  };
}

export default function JobForm({ values, onChange }: Props) {
  const t = useTheme();

  function updateCustomer(field: keyof Customer, value: string) {
    onChange({ ...values, customer: { ...values.customer, [field]: value } });
  }

  function updateLineItem(index: number, field: keyof LineItem, value: string) {
    const updated = values.lineItems.map((item, i) => {
      if (i !== index) return item;
      if (field === 'quantity' || field === 'unitPrice') {
        return { ...item, [field]: parseFloat(value) || 0 };
      }
      return { ...item, [field]: value };
    });
    onChange({ ...values, lineItems: updated });
  }

  function addLineItem() {
    onChange({
      ...values,
      lineItems: [
        ...values.lineItems,
        { description: '', quantity: 1, unitPrice: 0, unit: 'Std.' },
      ],
    });
  }

  function removeLineItem(index: number) {
    onChange({ ...values, lineItems: values.lineItems.filter((_, i) => i !== index) });
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: t.surface }]} keyboardShouldPersistTaps="handled">
      {/* Customer */}
      <Text style={[styles.sectionTitle, { color: t.outline }]}>KUNDE</Text>
      <View style={[styles.card, { backgroundColor: t.surface_card }]}>
        <FormField label="Name" value={values.customer.name} onChangeText={v => updateCustomer('name', v)} placeholder="Firmenname oder Nachname" t={t} />
        <FormField label="Adresse" value={values.customer.address ?? ''} onChangeText={v => updateCustomer('address', v)} placeholder="Straße, PLZ Ort" t={t} />
        <FormField label="Telefon" value={values.customer.phone ?? ''} onChangeText={v => updateCustomer('phone', v)} placeholder="+49 ..." keyboardType="phone-pad" t={t} />
        <FormField label="E-Mail" value={values.customer.email ?? ''} onChangeText={v => updateCustomer('email', v)} placeholder="email@beispiel.de" keyboardType="email-address" t={t} />
      </View>

      {/* Description */}
      <Text style={[styles.sectionTitle, { color: t.outline }]}>LEISTUNGSBESCHREIBUNG</Text>
      <View style={[styles.card, { backgroundColor: t.surface_card }]}>
        <TextInput
          style={[styles.textArea, { color: t.on_surface }]}
          multiline
          value={values.description}
          onChangeText={v => onChange({ ...values, description: v })}
          placeholder="Beschreibung der Arbeiten…"
          placeholderTextColor={t.outline}
          textAlignVertical="top"
        />
      </View>

      {/* Line items */}
      <Text style={[styles.sectionTitle, { color: t.outline }]}>POSITIONEN</Text>
      {values.lineItems.map((item, i) => (
        <View key={i} style={[styles.card, { backgroundColor: t.surface_card }]}>
          <View style={styles.lineItemHeader}>
            <Text style={[styles.lineItemNum, { color: t.on_surface_variant }]}>Position {i + 1}</Text>
            <Pressable onPress={() => removeLineItem(i)} hitSlop={8}>
              <Text style={[styles.removeBtn, { color: t.error }]}>Entfernen</Text>
            </Pressable>
          </View>
          <FormField label="Beschreibung" value={item.description} onChangeText={v => updateLineItem(i, 'description', v)} placeholder="Leistung oder Material" t={t} />
          <View style={styles.row}>
            <View style={styles.rowField}>
              <FormField label="Menge" value={item.quantity.toString()} onChangeText={v => updateLineItem(i, 'quantity', v)} keyboardType="decimal-pad" placeholder="1" t={t} />
            </View>
            <View style={styles.rowField}>
              <FormField label="Einheit" value={item.unit} onChangeText={v => updateLineItem(i, 'unit', v)} placeholder="Std." t={t} />
            </View>
            <View style={styles.rowField}>
              <FormField label="Preis (netto)" value={item.unitPrice.toString()} onChangeText={v => updateLineItem(i, 'unitPrice', v)} keyboardType="decimal-pad" placeholder="0" t={t} />
            </View>
          </View>
        </View>
      ))}
      <Pressable
        style={[styles.addBtn, { borderColor: t.outline_variant }]}
        onPress={addLineItem}
      >
        <Text style={[styles.addBtnText, { color: t.primary }]}>+ Position hinzufügen</Text>
      </Pressable>

      {/* VAT */}
      <Text style={[styles.sectionTitle, { color: t.outline }]}>MWST.-SATZ</Text>
      <View style={[styles.card, styles.vatRow, { backgroundColor: t.surface_card }]}>
        {VAT_OPTIONS.map(rate => {
          const active = values.vatRate === rate;
          return (
            <Pressable
              key={rate}
              style={[
                styles.vatChip,
                { borderColor: active ? t.primary : t.outline_variant },
                active && { backgroundColor: t.primary },
              ]}
              onPress={() => onChange({ ...values, vatRate: rate })}
            >
              <Text style={[
                styles.vatChipText,
                { color: active ? t.on_primary : t.on_surface_variant },
              ]}>
                {rate * 100}%
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Notes */}
      <Text style={[styles.sectionTitle, { color: t.outline }]}>HINWEISE (OPTIONAL)</Text>
      <View style={[styles.card, { backgroundColor: t.surface_card }]}>
        <TextInput
          style={[styles.textArea, { color: t.on_surface }]}
          multiline
          value={values.notes}
          onChangeText={v => onChange({ ...values, notes: v })}
          placeholder="Zahlungsbedingungen, Anmerkungen…"
          placeholderTextColor={t.outline}
          textAlignVertical="top"
        />
      </View>
    </ScrollView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  t,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'decimal-pad';
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: t.on_surface_variant }]}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, { color: t.on_surface, borderBottomColor: t.outline_variant }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.outline}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8, paddingBottom: 120 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: F.labelSemi,
    textTransform: 'uppercase',
    letterSpacing: 0.05 * 11,
    marginTop: 8,
    marginBottom: 4,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  field: { paddingHorizontal: 14, paddingVertical: 10 },
  fieldLabel: { fontSize: 12, fontFamily: F.body, marginBottom: 2 },
  fieldInput: {
    fontSize: 15,
    fontFamily: F.body,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  textArea: {
    padding: 14,
    fontSize: 15,
    fontFamily: F.body,
    minHeight: 80,
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  lineItemNum: { fontSize: 13, fontFamily: F.bodySemi },
  removeBtn: { fontSize: 13, fontFamily: F.body },
  row: { flexDirection: 'row' },
  rowField: { flex: 1 },
  addBtn: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  addBtnText: { fontSize: 15, fontFamily: F.bodyMedium },
  vatRow: { flexDirection: 'row', padding: 12, gap: 10 },
  vatChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
  },
  vatChipText: { fontSize: 15, fontFamily: F.bodyMedium },
});
