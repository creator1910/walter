import { generateDocNumber, generateId, isThisMonth } from '../lib/storage';
import { Job } from '../types';

const baseJob: Job = {
  id: 'j1',
  createdAt: '2026-03-20T10:00:00.000Z',
  status: 'draft',
  customer: { name: 'Test' },
  description: 'Test job',
  lineItems: [],
  vatRate: 0.19,
};

describe('isThisMonth', () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  it('returns true for a date in the current month', () => {
    const d = new Date(year, month, 15);
    expect(isThisMonth(d.toISOString())).toBe(true);
  });

  it('returns false for a date in the previous month', () => {
    const prev = new Date(year, month - 1, 15);
    expect(isThisMonth(prev.toISOString())).toBe(false);
  });

  it('returns false for a date in the previous year', () => {
    const d = new Date(year - 1, month, 15);
    expect(isThisMonth(d.toISOString())).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isThisMonth(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isThisMonth('')).toBe(false);
  });

  it('handles year-rollover correctly (December vs January)', () => {
    // A date in December of last year should NOT match if current month is January
    // A date in January of this year should NOT match if current month is December
    // We test by fixing the dates explicitly:
    const dec = new Date(year, 11, 31).toISOString(); // December
    const jan = new Date(year, 0, 1).toISOString();   // January
    const decResult = isThisMonth(dec);
    const janResult = isThisMonth(jan);
    // Only one of them can match the current month (they're both year boundaries)
    // Verify they don't both return true when months differ
    if (month === 0) {
      expect(janResult).toBe(true);
      expect(decResult).toBe(false);
    } else if (month === 11) {
      expect(decResult).toBe(true);
      expect(janResult).toBe(false);
    } else {
      expect(janResult).toBe(false);
      expect(decResult).toBe(false);
    }
  });
});

describe('generateId', () => {
  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, generateId));
    expect(ids.size).toBe(100);
  });

  it('generates non-empty strings', () => {
    expect(generateId().length).toBeGreaterThan(0);
  });
});

describe('generateDocNumber', () => {
  const year = new Date().getFullYear();

  it('starts at 0001 with no existing docs', () => {
    expect(generateDocNumber('AN', [])).toBe(`AN-${year}-0001`);
  });

  it('increments from existing quote numbers', () => {
    const jobs: Job[] = [
      { ...baseJob, quoteNumber: `AN-${year}-0003` },
      { ...baseJob, quoteNumber: `AN-${year}-0001` },
    ];
    expect(generateDocNumber('AN', jobs)).toBe(`AN-${year}-0004`);
  });

  it('generates invoice numbers independently of quote numbers', () => {
    const jobs: Job[] = [
      { ...baseJob, quoteNumber: `AN-${year}-0005` },
    ];
    expect(generateDocNumber('RE', jobs)).toBe(`RE-${year}-0001`);
  });

  it('ignores numbers from previous years', () => {
    const jobs: Job[] = [
      { ...baseJob, quoteNumber: `AN-${year - 1}-0099` },
    ];
    expect(generateDocNumber('AN', jobs)).toBe(`AN-${year}-0001`);
  });

  it('pads to 4 digits', () => {
    expect(generateDocNumber('AN', [])).toMatch(/AN-\d{4}-\d{4}/);
  });
});
