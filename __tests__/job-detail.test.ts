import { Job } from '../types';

// formatJobDate — pure function extracted from app/job/[id].tsx
function formatJobDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

// getDotColor — mirrors the logic in the dots row render
type DotColor = 'done' | 'current' | 'future';
const STAGE_ORDER = ['draft', 'quote_sent', 'accepted', 'invoiced', 'paid'];
function getDotColor(stageIndex: number, currentIndex: number): DotColor {
  if (stageIndex < currentIndex) return 'done';
  if (stageIndex === currentIndex) return 'current';
  return 'future';
}

describe('formatJobDate', () => {
  it('formats ISO string to a German locale date string', () => {
    const result = formatJobDate('2026-03-18T10:00:00.000Z');
    // Node and iOS use slightly different short month abbreviations,
    // but both must include the day and some month text.
    expect(result).toMatch(/18/);
    expect(result.toLowerCase()).toMatch(/m[aä]r/); // März / Mrz.
  });

  it('returns a non-empty string for any valid ISO date', () => {
    expect(formatJobDate('2026-01-01T00:00:00.000Z').length).toBeGreaterThan(0);
    expect(formatJobDate('2026-12-31T23:59:59.999Z').length).toBeGreaterThan(0);
  });
});

describe('getDotColor', () => {
  it('returns current for the active stage', () => {
    // draft (index 0) is current
    expect(getDotColor(0, 0)).toBe('current');
    // accepted (index 2) is current
    expect(getDotColor(2, 2)).toBe('current');
  });

  it('returns done for past stages', () => {
    // draft (0) is done when current is quote_sent (1)
    expect(getDotColor(0, 1)).toBe('done');
    // draft+quote_sent (0,1) done when current is accepted (2)
    expect(getDotColor(0, 2)).toBe('done');
    expect(getDotColor(1, 2)).toBe('done');
  });

  it('returns future for upcoming stages', () => {
    // quote_sent (1) is future when current is draft (0)
    expect(getDotColor(1, 0)).toBe('future');
    // paid (4) is future when current is draft (0)
    expect(getDotColor(4, 0)).toBe('future');
  });

  it('all 5 dots are green when job is paid', () => {
    const paidIndex = STAGE_ORDER.indexOf('paid');
    for (let i = 0; i < 5; i++) {
      expect(getDotColor(i, paidIndex)).toBe(i < paidIndex ? 'done' : 'current');
    }
  });
});

describe('Job type — acceptedAt and paidAt fields', () => {
  it('accepts a job with all new optional fields', () => {
    const job: Job = {
      id: 'j1',
      createdAt: '2026-03-18T10:00:00.000Z',
      status: 'paid',
      customer: { name: 'Müller GmbH' },
      description: 'Sanitärarbeiten',
      lineItems: [],
      vatRate: 0.19,
      quoteDate: '2026-03-18T11:00:00.000Z',
      quoteNumber: 'AN-2026-0001',
      acceptedAt: '2026-03-19T09:00:00.000Z',
      invoiceDate: '2026-03-20T10:00:00.000Z',
      invoiceNumber: 'RE-2026-0001',
      paidAt: '2026-03-21T14:00:00.000Z',
    };
    expect(job.acceptedAt).toBe('2026-03-19T09:00:00.000Z');
    expect(job.paidAt).toBe('2026-03-21T14:00:00.000Z');
  });

  it('accepts a job without acceptedAt and paidAt (old job compatibility)', () => {
    const job: Job = {
      id: 'j2',
      createdAt: '2026-03-18T10:00:00.000Z',
      status: 'draft',
      customer: { name: 'Schmidt' },
      description: 'Elektroarbeiten',
      lineItems: [],
      vatRate: 0.19,
    };
    expect(job.acceptedAt).toBeUndefined();
    expect(job.paidAt).toBeUndefined();
  });
});
