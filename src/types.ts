export interface Product {
  id: number;
  code: string;
  name: string;
  category: string;
  unit: string;
  price_ex_gst: number;
  gst_rate: number;
  hsn_code: string;
  stock: number;
}

export interface Customer {
  id: number;
  name: string;
  mobile?: string;
  address?: string;
  gstin?: string;
  state?: string;
  lifetime_value: number;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  date: string;
  customer_id?: number;
  customer_name?: string;
  customer_mobile?: string;
  type: string;
  subtotal: number;
  discount: number;
  cgst_total: number;
  sgst_total: number;
  igst_total: number;
  grand_total: number;
  status: string;
  payment_status: string;
  amount_paid: number;
}

export interface AnalyticsData {
  last7Days: { day: string; sales: number }[];
  topProducts: { name: string; qty: number }[];
  lowStock: Product[];
}

export interface DashboardStats {
  todaySales: number;
  todayInvoices: number;
  totalProducts: number;
  totalCustomers: number;
}
