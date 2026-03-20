import { Job, LineItem } from '../types';

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
  return JSON.parse(text);
}

export function calculateTotals(lineItems: LineItem[], vatRate: number) {
  const net = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const vat = net * vatRate;
  const gross = net + vat;
  return { net, vat, gross };
}
