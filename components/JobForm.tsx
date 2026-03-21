import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Customer, Job, LineItem } from '../types';
import { C } from '../lib/theme';

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
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Customer */}
      <Text style={styles.sectionTitle}>Kunde</Text>
      <View style={styles.card}>
        <Field
          label="Name"
          value={values.customer.name}
          onChangeText={v => updateCustomer('name', v)}
          placeholder="Firmenname oder Nachname"
        />
        <Field
          label="Adresse"
          value={values.customer.address ?? ''}
          onChangeText={v => updateCustomer('address', v)}
          placeholder="Straße, PLZ Ort"
        />
        <Field
          label="Telefon"
          value={values.customer.phone ?? ''}
          onChangeText={v => updateCustomer('phone', v)}
          placeholder="+49 ..."
          keyboardType="phone-pad"
        />
        <Field
          label="E-Mail"
          value={values.customer.email ?? ''}
          onChangeText={v => updateCustomer('email', v)}
          placeholder="email@beispiel.de"
          keyboardType="email-address"
          isLast
        />
      </View>

      {/* Description */}
      <Text style={styles.sectionTitle}>Leistungsbeschreibung</Text>
      <View style={styles.card}>
        <TextInput
          style={styles.textArea}
          multiline
          value={values.description}
          onChangeText={v => onChange({ ...values, description: v })}
          placeholder="Beschreibung der Arbeiten…"
          placeholderTextColor={C.textDim}
          textAlignVertical="top"
        />
      </View>

      {/* Line items */}
      <Text style={styles.sectionTitle}>Positionen</Text>
      {values.lineItems.map((item, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.lineItemHeader}>
            <Text style={styles.lineItemNum}>Position {i + 1}</Text>
            <Pressable onPress={() => removeLineItem(i)} hitSlop={8}>
              <Text style={styles.removeBtn}>Entfernen</Text>
            </Pressable>
          </View>
          <Field
            label="Beschreibung"
            value={item.description}
            onChangeText={v => updateLineItem(i, 'description', v)}
            placeholder="Leistung oder Material"
          />
          <View style={styles.row}>
            <View style={styles.rowField}>
              <Field
                label="Menge"
                value={item.quantity.toString()}
                onChangeText={v => updateLineItem(i, 'quantity', v)}
                keyboardType="decimal-pad"
                placeholder="1"
              />
            </View>
            <View style={styles.rowField}>
              <Field
                label="Einheit"
                value={item.unit}
                onChangeText={v => updateLineItem(i, 'unit', v)}
                placeholder="Std."
              />
            </View>
            <View style={styles.rowField}>
              <Field
                label="Preis (netto)"
                value={item.unitPrice.toString()}
                onChangeText={v => updateLineItem(i, 'unitPrice', v)}
                keyboardType="decimal-pad"
                placeholder="0"
                isLast
              />
            </View>
          </View>
        </View>
      ))}
      <Pressable style={styles.addBtn} onPress={addLineItem}>
        <Text style={styles.addBtnText}>+ Position hinzufügen</Text>
      </Pressable>

      {/* VAT */}
      <Text style={styles.sectionTitle}>MwSt.-Satz</Text>
      <View style={[styles.card, styles.vatRow]}>
        {VAT_OPTIONS.map(rate => (
          <Pressable
            key={rate}
            style={[styles.vatChip, values.vatRate === rate && styles.vatChipActive]}
            onPress={() => onChange({ ...values, vatRate: rate })}
          >
            <Text style={[styles.vatChipText, values.vatRate === rate && styles.vatChipTextActive]}>
              {rate * 100}%
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Notes */}
      <Text style={styles.sectionTitle}>Hinweise (optional)</Text>
      <View style={styles.card}>
        <TextInput
          style={styles.textArea}
          multiline
          value={values.notes}
          onChangeText={v => onChange({ ...values, notes: v })}
          placeholder="Zahlungsbedingungen, Anmerkungen…"
          placeholderTextColor={C.textDim}
          textAlignVertical="top"
        />
      </View>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  isLast,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'decimal-pad';
  isLast?: boolean;
}) {
  return (
    <View style={[styles.field, !isLast && styles.fieldBorder]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textDim}
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
    fontFamily: 'DMSans_600SemiBold',
    color: C.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 4,
    marginLeft: 4,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  field: { paddingHorizontal: 14, paddingVertical: 10 },
  fieldBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  fieldLabel: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: C.textMid, marginBottom: 2 },
  fieldInput: { fontSize: 15, fontFamily: 'DMSans_400Regular', color: C.text },
  textArea: {
    padding: 14,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: C.text,
    minHeight: 80,
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  lineItemNum: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: C.textMid },
  removeBtn: { fontSize: 13, fontFamily: 'DMSans_400Regular', color: C.error },
  row: { flexDirection: 'row' },
  rowField: { flex: 1 },
  addBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.amber,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  addBtnText: { color: C.amber, fontSize: 15, fontFamily: 'DMSans_500Medium' },
  vatRow: { flexDirection: 'row', padding: 12, gap: 10 },
  vatChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border2,
    alignItems: 'center',
  },
  vatChipActive: { backgroundColor: C.amber, borderColor: C.amber },
  vatChipText: { fontSize: 15, fontFamily: 'DMSans_500Medium', color: C.textMid },
  vatChipTextActive: { color: '#111111' },
});
