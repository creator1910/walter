import { generateDocNumber, generateId } from '../lib/storage';
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
