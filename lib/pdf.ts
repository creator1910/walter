import * as Print from 'expo-print';
import { CompanyProfile, Job } from '../types';
import { calculateTotals } from './claude';
import { loadProfile } from './storage';

function formatCurrency(amount: number): string {
  return amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE');
}

export function buildHTMLTemplate(job: Job, profile?: CompanyProfile | null): string {
  const isQuote = job.status === 'draft' || job.status === 'quote_sent' || job.status === 'accepted';
  const docType = isQuote ? 'Angebot' : 'Rechnung';
  const docNumber = isQuote ? (job.quoteNumber ?? '—') : (job.invoiceNumber ?? '—');
  const docDate = isQuote
    ? (job.quoteDate ? formatDate(job.quoteDate) : formatDate(job.createdAt))
    : (job.invoiceDate ? formatDate(job.invoiceDate) : formatDate(job.createdAt));

  const { net, vat, gross } = calculateTotals(job.lineItems, job.vatRate);

  const lineItemRows = job.lineItems.map(item => `
    <tr>
      <td class="desc">${item.description}</td>
      <td class="num">${item.quantity} ${item.unit}</td>
      <td class="num">${formatCurrency(item.unitPrice)}</td>
      <td class="num">${formatCurrency(item.quantity * item.unitPrice)}</td>
    </tr>
  `).join('');

  const lineItemsSection = job.lineItems.length > 0 ? `
    <table class="items">
      <thead>
        <tr>
          <th class="desc">Leistung</th>
          <th class="num">Menge</th>
          <th class="num">Einzelpreis</th>
          <th class="num">Gesamt</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemRows}
      </tbody>
    </table>
    <table class="totals">
      <tr><td>Nettobetrag</td><td>${formatCurrency(net)}</td></tr>
      <tr><td>MwSt. ${job.vatRate * 100}%</td><td>${formatCurrency(vat)}</td></tr>
      <tr class="total-row"><td>Gesamtbetrag</td><td>${formatCurrency(gross)}</td></tr>
    </table>
  ` : '';

  const notesSection = job.notes ? `
    <div class="section">
      <h3>Hinweise</h3>
      <p>${job.notes}</p>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docType} ${docNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; font-size: 13px; color: #1a1a1a; padding: 40px; max-width: 794px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .company { color: #666; line-height: 1.6; }
    .company .placeholder { color: #bbb; font-style: italic; }
    .doc-meta { text-align: right; }
    .doc-type { font-size: 22px; font-weight: 700; color: #007AFF; margin-bottom: 4px; }
    .doc-number { font-size: 14px; color: #666; }
    .doc-date { font-size: 13px; color: #666; margin-top: 2px; }
    .recipient { margin-bottom: 32px; }
    .recipient h2 { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
    .recipient p { color: #555; line-height: 1.5; }
    .section { margin-bottom: 24px; }
    .section h3 { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #8E8E93; margin-bottom: 8px; }
    .section p { line-height: 1.6; color: #333; }
    table.items { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    table.items th { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; color: #8E8E93; border-bottom: 1px solid #E5E5EA; padding: 6px 8px; }
    table.items td { padding: 8px; border-bottom: 1px solid #F2F2F7; vertical-align: top; }
    .desc { text-align: left; }
    .num { text-align: right; }
    table.totals { width: 260px; margin-left: auto; border-collapse: collapse; margin-top: 8px; }
    table.totals td { padding: 5px 8px; color: #555; }
    table.totals td:last-child { text-align: right; }
    table.totals .total-row td { font-weight: 700; font-size: 14px; color: #1a1a1a; border-top: 1px solid #E5E5EA; padding-top: 8px; }
    .footer { margin-top: 60px; padding-top: 16px; border-top: 1px solid #E5E5EA; color: #aaa; font-size: 11px; text-align: center; line-height: 1.6; }
    .footer .placeholder { font-style: italic; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">
      ${profile?.name ? `<strong>${profile.name}</strong>` : '<span class="placeholder">[Firmenname]</span>'}<br>
      ${profile?.street ? `${profile.street}<br>${profile.zip} ${profile.city}` : '<span class="placeholder">[Straße, PLZ Ort]</span>'}<br>
      ${profile?.phone ? profile.phone : '<span class="placeholder">[Telefon]</span>'}
      ${profile?.email ? `<br>${profile.email}` : ''}
    </div>
    <div class="doc-meta">
      <div class="doc-type">${docType}</div>
      <div class="doc-number">Nr. ${docNumber}</div>
      <div class="doc-date">Datum: ${docDate}</div>
    </div>
  </div>

  <div class="recipient">
    <h2>${job.customer.name || '—'}</h2>
    ${job.customer.address ? `<p>${job.customer.address}</p>` : ''}
    ${job.customer.phone ? `<p>${job.customer.phone}</p>` : ''}
    ${job.customer.email ? `<p>${job.customer.email}</p>` : ''}
  </div>

  <div class="section">
    <h3>Leistungsbeschreibung</h3>
    <p>${job.description}</p>
  </div>

  ${lineItemsSection}
  ${notesSection}

  <div class="footer">
    ${profile
      ? `${profile.name} · ${profile.street}, ${profile.zip} ${profile.city}${profile.taxNumber ? ` · Steuernummer: ${profile.taxNumber}` : ''}${profile.iban ? ` · IBAN: ${profile.iban}` : ''}${profile.bic ? ` · BIC: ${profile.bic}` : ''}`
      : '<span class="placeholder">[Firmenname] · [Adresse] · Steuernummer: [Steuernummer] · IBAN: [IBAN]</span>'
    }
  </div>
</body>
</html>`;
}

export async function generateAndSharePDF(job: Job, forceDocType?: 'quote' | 'invoice'): Promise<void> {
  const profile = await loadProfile();
  const html = forceDocType
    ? buildHTMLTemplate({ ...job, status: forceDocType === 'quote' ? 'draft' : 'invoiced' }, profile)
    : buildHTMLTemplate(job, profile);
  const isQuote = forceDocType === 'quote' || (!forceDocType && (job.status === 'draft' || job.status === 'quote_sent' || job.status === 'accepted'));
  const docNumber = isQuote ? job.quoteNumber : job.invoiceNumber;
  const filename = docNumber ? `${docNumber}.pdf` : 'Dokument.pdf';

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  // Rename to meaningful filename
  const { shareAsync } = await import('expo-sharing');
  await shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: filename,
    UTI: 'com.adobe.pdf',
  });
}
