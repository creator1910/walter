export type JobStatus = 'draft' | 'quote_sent' | 'accepted' | 'invoiced' | 'paid';

export interface Customer {
  name: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string; // e.g. "Std.", "m²", "Stück"
}

export interface Job {
  id: string;
  createdAt: string;
  status: JobStatus;
  customer: Customer;
  description: string;       // free-text summary of the work
  lineItems: LineItem[];
  vatRate: number;            // 0.19 or 0.07
  notes?: string;
  quoteNumber?: string;
  invoiceNumber?: string;
  quoteDate?: string;
  invoiceDate?: string;
}
