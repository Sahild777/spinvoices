export interface Business {
  id: string;
  name: string;
  address: string;
  gst: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  gst: string;
  created_at: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  gstRate: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date?: string;
  business_name: string;
  business_address: string;
  business_gst: string;
  customer_name: string;
  customer_address: string;
  customer_gst: string;
  items: InvoiceItem[];
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  created_at: string;
}
