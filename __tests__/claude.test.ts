import { calculateTotals, extractJobFromText, extractJobFromTextAndPhotos } from '../lib/claude';
import { LineItem } from '../types';

// ---------------------------------------------------------------------------
// Mock expo-file-system/legacy so tests don't hit the filesystem
// ---------------------------------------------------------------------------
jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}));

import * as FileSystem from 'expo-file-system/legacy';
const mockReadAsStringAsync = FileSystem.readAsStringAsync as jest.Mock;

// ---------------------------------------------------------------------------
// Helper to mock a successful Claude API response
// ---------------------------------------------------------------------------
const VALID_JOB_JSON = JSON.stringify({
  customer: { name: 'Müller GmbH', address: null, email: null, phone: null },
  description: 'Malerarbeiten Wohnzimmer',
  lineItems: [{ description: 'Wände streichen', quantity: 25, unitPrice: 8, unit: 'm²' }],
  vatRate: 0.19,
  notes: null,
});

const VALID_VISION_JSON = JSON.stringify({
  customer: { name: '', address: null, email: null, phone: null },
  description: 'Malerarbeiten Wohnzimmer',
  lineItems: [{ description: 'Wände streichen', quantity: 25, unitPrice: 8, unit: 'm²' }],
  vatRate: 0.19,
  notes: null,
  analysis: { erkannt: 'Wohnzimmer, ca. 25m² Wandfläche, 2 Fenster', confidence: 'mittel' },
});

function mockFetchSuccess(body: string) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => ({ content: [{ text: body }] }),
  } as unknown as Response);
}

function mockFetchError(status: number) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({}),
  } as unknown as Response);
}

// ---------------------------------------------------------------------------
// extractJobFromText
// ---------------------------------------------------------------------------
describe('extractJobFromText', () => {
  it('happy path — returns valid Partial<Job> from API response', async () => {
    mockFetchSuccess(VALID_JOB_JSON);
    const result = await extractJobFromText('Malerarbeiten bei Müller GmbH');
    expect(result.customer?.name).toBe('Müller GmbH');
    expect(result.lineItems).toHaveLength(1);
    expect(result.vatRate).toBe(0.19);
  });

  it('PARSE_FAILED — throws when API returns malformed JSON', async () => {
    mockFetchSuccess('this is not json at all');
    await expect(extractJobFromText('anything')).rejects.toThrow('PARSE_FAILED');
  });
});

// ---------------------------------------------------------------------------
// extractJobFromTextAndPhotos
// ---------------------------------------------------------------------------
describe('extractJobFromTextAndPhotos', () => {
  beforeEach(() => {
    mockReadAsStringAsync.mockReset();
  });

  it('happy path — returns AnalysisPreview with job and analysis fields', async () => {
    mockReadAsStringAsync.mockResolvedValue('base64data==');
    mockFetchSuccess(VALID_VISION_JSON);

    const result = await extractJobFromTextAndPhotos('Wohnzimmer streichen', ['file://photo1.jpg']);
    expect(result.job.lineItems).toHaveLength(1);
    expect(result.analysis.confidence).toBe('mittel');
    expect(result.analysis.erkannt).toContain('Wohnzimmer');
  });

  it('PHOTO_READ_FAILED — throws when readAsStringAsync fails', async () => {
    mockReadAsStringAsync.mockRejectedValue(new Error('file not found'));
    await expect(
      extractJobFromTextAndPhotos('', ['file://missing.jpg'])
    ).rejects.toThrow('PHOTO_READ_FAILED');
  });

  it('ANALYSE_FAILED — throws when API returns malformed JSON', async () => {
    mockReadAsStringAsync.mockResolvedValue('base64data==');
    mockFetchSuccess('not json');
    await expect(
      extractJobFromTextAndPhotos('', ['file://photo1.jpg'])
    ).rejects.toThrow('ANALYSE_FAILED');
  });

  it('sends multimodal content blocks — text + image type in request body', async () => {
    mockReadAsStringAsync.mockResolvedValue('abc123==');
    mockFetchSuccess(VALID_VISION_JSON);

    await extractJobFromTextAndPhotos('test input', ['file://photo1.jpg']);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    const content = body.messages[0].content;

    expect(content[0].type).toBe('text');
    expect(content[1].type).toBe('image');
    expect(content[1].source.type).toBe('base64');
    expect(content[1].source.data).toBe('abc123==');
  });

  it('photo-only path — sends fallback German text when no input provided', async () => {
    mockReadAsStringAsync.mockResolvedValue('base64data==');
    mockFetchSuccess(VALID_VISION_JSON);

    await extractJobFromTextAndPhotos('', ['file://photo1.jpg']);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    const textBlock = body.messages[0].content[0];

    expect(textBlock.type).toBe('text');
    expect(textBlock.text).toContain('Analysiere die Fotos');
  });
});

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
