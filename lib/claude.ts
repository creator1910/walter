import * as FileSystem from 'expo-file-system/legacy';
import { AnalysisPreview, Job, LineItem } from '../types';

const SYSTEM_PROMPT = `Du bist Walter, ein KI-Assistent für Handwerker in Deutschland.
Deine Aufgabe ist es, aus der Beschreibung eines Auftrags strukturierte Daten für ein Angebot oder eine Rechnung zu extrahieren.

Antworte immer mit einem validen JSON-Objekt in diesem Format:
{
  "customer": {
    "name": "string",
    "address": "string oder null",
    "email": "string oder null",
    "phone": "string oder null"
  },
  "description": "string (kurze Zusammenfassung der Arbeit)",
  "lineItems": [
    {
      "description": "string",
      "quantity": number,
      "unitPrice": number,
      "unit": "string (z.B. Std., m², Stück, Pauschale)"
    }
  ],
  "vatRate": 0.19,
  "notes": "string oder null"
}

Regeln:
- Preise immer als Netto (ohne MwSt) angeben
- Wenn kein Preis genannt, schätze einen marktüblichen Preis für Deutschland
- MwSt ist 19% (Standard) oder 7% (selten im Handwerk)
- Sei sparsam mit Annahmen — wenn etwas unklar ist, setze einen Platzhalter
- Antworte NUR mit dem JSON, kein Text davor oder danach`;

const VISION_EXTENSION = `

Wenn Fotos beigefügt sind, analysiere sie zusätzlich für: Raumgröße, Wandfläche, Fenster/Türen, sichtbare Materialien und Zustand. Schätze Mengen basierend auf dem, was du siehst.

Füge dem JSON-Objekt ein "analysis"-Feld hinzu:
{
  ...(alle bisherigen Felder),
  "analysis": {
    "erkannt": "string — was du auf den Fotos gesehen hast (z.B. 'Wohnzimmer, ca. 25m² Wandfläche, 2 Fenster, 1 Tür')",
    "confidence": "hoch" | "mittel" | "niedrig"
  }
}`;

function getMimeType(uri: string): 'image/jpeg' | 'image/png' {
  if (uri.toLowerCase().endsWith('.png')) return 'image/png';
  return 'image/jpeg'; // jpg, heic (converted by picker to jpeg), and others
}

export async function extractJobFromText(input: string): Promise<Partial<Job>> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: input }],
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const raw = data.content[0].text;
  const text = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('PARSE_FAILED');
  }
}

export async function extractJobFromTextAndPhotos(
  input: string,
  photoUris: string[]
): Promise<AnalysisPreview> {
  let base64Photos: { data: string; mimeType: 'image/jpeg' | 'image/png' }[];
  try {
    base64Photos = await Promise.all(
      photoUris.map(async uri => ({
        data: await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        }),
        mimeType: getMimeType(uri),
      }))
    );
  } catch {
    throw new Error('PHOTO_READ_FAILED');
  }

  const userText = input.trim()
    ? `Fotos sind beigefügt. Analysiere sie für: Raumgröße, Wandfläche, Fenster/Türen, sichtbare Materialien, Zustand. Schätze Mengen basierend auf dem, was du siehst.\n\n${input}`
    : 'Analysiere die Fotos und erstelle ein Angebot basierend auf dem, was du siehst.';

  const content = [
    { type: 'text', text: userText },
    ...base64Photos.map(({ data, mimeType }) => ({
      type: 'image',
      source: { type: 'base64', media_type: mimeType, data },
    })),
  ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT + VISION_EXTENSION,
      messages: [{ role: 'user', content }],
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const raw = data.content[0].text;
  const text = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  try {
    const parsed = JSON.parse(text);
    return {
      job: {
        customer: parsed.customer,
        description: parsed.description,
        lineItems: parsed.lineItems,
        vatRate: parsed.vatRate,
        notes: parsed.notes ?? undefined,
      },
      analysis: parsed.analysis ?? {
        erkannt: 'Keine Details erkannt',
        confidence: 'niedrig' as const,
      },
    };
  } catch {
    throw new Error('ANALYSE_FAILED');
  }
}

export function calculateTotals(lineItems: LineItem[], vatRate: number) {
  const net = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const vat = net * vatRate;
  const gross = net + vat;
  return { net, vat, gross };
}
