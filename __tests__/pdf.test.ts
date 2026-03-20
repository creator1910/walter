import { buildHTMLTemplate } from '../lib/pdf';
import { Job } from '../types';

const baseJob: Job = {
  id: 'test-1',
  createdAt: '2026-03-20T10:00:00.000Z',
  status: 'draft',
  customer: { name: 'Müller GmbH', address: 'Hauptstraße 5, 10115 Berlin' },
  description: 'Tapezierarbeiten, 3 Zimmer',
  lineItems: [
    { description: 'Arbeitszeit', quantity: 8, unitPrice: 65, unit: 'Std.' },
    { description: 'Material', quantity: 1, unitPrice: 120, unit: 'Pauschale' },
  ],
  vatRate: 0.19,
};

describe('buildHTMLTemplate', () => {
  it('includes customer name', () => {
    const html = buildHTMLTemplate(baseJob);
    expect(html).toContain('Müller GmbH');
  });

  it('includes customer address', () => {
    const html = buildHTMLTemplate(baseJob);
    expect(html).toContain('Hauptstraße 5, 10115 Berlin');
  });

  it('includes document description', () => {
    const html = buildHTMLTemplate(baseJob);
    expect(html).toContain('Tapezierarbeiten, 3 Zimmer');
  });

  it('shows "Angebot" for draft status', () => {
    const html = buildHTMLTemplate(baseJob);
    expect(html).toContain('Angebot');
  });

  it('shows "Rechnung" for invoiced status', () => {
    const html = buildHTMLTemplate({ ...baseJob, status: 'invoiced' });
    expect(html).toContain('Rechnung');
    expect(html).not.toContain('>Angebot<');
  });

  it('includes line item descriptions', () => {
    const html = buildHTMLTemplate(baseJob);
    expect(html).toContain('Arbeitszeit');
    expect(html).toContain('Material');
  });

  it('renders without line items (description-only job)', () => {
    const html = buildHTMLTemplate({ ...baseJob, lineItems: [] });
    expect(html).toContain('Tapezierarbeiten');
    expect(html).not.toContain('<table class="items">');
  });

  it('shows placeholder company info when no profile set', () => {
    const html = buildHTMLTemplate(baseJob);
    expect(html).toContain('[Firmenname]');
  });

  it('shows — when customer name is empty', () => {
    const html = buildHTMLTemplate({ ...baseJob, customer: { name: '' } });
    expect(html).toContain('—');
  });

  it('includes notes when present', () => {
    const html = buildHTMLTemplate({ ...baseJob, notes: 'Zahlung innerhalb 14 Tagen' });
    expect(html).toContain('Zahlung innerhalb 14 Tagen');
  });

  it('omits notes section when no notes', () => {
    const html = buildHTMLTemplate(baseJob);
    expect(html).not.toContain('Hinweise');
  });

  it('shows quote number when present', () => {
    const html = buildHTMLTemplate({ ...baseJob, quoteNumber: 'AN-2026-0001' });
    expect(html).toContain('AN-2026-0001');
  });
});
