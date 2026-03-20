import { calculateTotals } from '../lib/claude';
import { LineItem } from '../types';

describe('calculateTotals', () => {
  const items: LineItem[] = [
    { description: 'Arbeitszeit', quantity: 8, unitPrice: 65, unit: 'Std.' },
    { description: 'Material', quantity: 1, unitPrice: 120, unit: 'Pauschale' },
  ];

  it('calculates net correctly', () => {
    const { net } = calculateTotals(items, 0.19);
    expect(net).toBeCloseTo(640); // 8*65 + 1*120
  });

  it('calculates VAT at 19%', () => {
    const { vat } = calculateTotals(items, 0.19);
    expect(vat).toBeCloseTo(121.6);
  });

  it('calculates gross correctly', () => {
    const { gross } = calculateTotals(items, 0.19);
    expect(gross).toBeCloseTo(761.6);
  });

  it('calculates VAT at 7%', () => {
    const { vat } = calculateTotals(items, 0.07);
    expect(vat).toBeCloseTo(44.8);
  });

  it('returns zero totals for empty line items', () => {
    const { net, vat, gross } = calculateTotals([], 0.19);
    expect(net).toBe(0);
    expect(vat).toBe(0);
    expect(gross).toBe(0);
  });

  it('handles fractional quantities', () => {
    const { net } = calculateTotals(
      [{ description: 'Test', quantity: 0.5, unitPrice: 100, unit: 'Std.' }],
      0.19
    );
    expect(net).toBeCloseTo(50);
  });
});
