export type AppointmentStatus = 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado';

export type TransactionType = 'income' | 'expense';

export type TransactionStatus = 'pendente' | 'parcial' | 'pago' | 'vencido' | 'cancelado';

export type PaymentMethod = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'boleto' | 'transferencia';

export interface Client {
  id: string;
  business_id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  vehicles?: Vehicle[];
}

export interface Vehicle {
  id: string;
  business_id: string;
  client_id: string;
  plate: string;
  model: string;
  year?: string;
  color?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface Appointment {
  id: string;
  business_id: string;
  client_id: string;
  vehicle_id: string;
  scheduled_at: string; // ISO string e.g. 2026-10-29T14:00:00
  service_name: string;
  observations?: string;
  status: AppointmentStatus;
  estimated_amount: number;
  final_amount?: number | null;
  created_at: string;
  updated_at: string;
  client?: Client;
  vehicle?: Vehicle;
  transaction?: Transaction;
}

export interface TransactionPayment {
  id: string;
  business_id: string;
  transaction_id: string;
  amount: number;
  paid_at: string;
  payment_method?: PaymentMethod;
  notes?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  business_id: string;
  appointment_id?: string | null;
  client_id?: string | null;
  vehicle_id?: string | null;
  type: TransactionType;
  description: string;
  category: string;
  amount: number; // Total amount due
  paid_amount?: number; // Calculated from transaction_payments
  due_date?: string | null;
  status: TransactionStatus;
  payment_method?: PaymentMethod | null;
  notes?: string;
  created_at: string;
  updated_at: string;
  payments?: TransactionPayment[];
  client?: Client;
  vehicle?: Vehicle;
}

export interface StoreSettings {
  id: string;
  business_id: string;
  business_name: string;
  document?: string;
  phone?: string;
  address?: string;
  opening_balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  current_balance: number;
  opening_balance: number;
  month_income: number;
  month_expense: number;
  receivables: number;
  payables: number;
  today_appointments_count: number;
  pending_transactions_count: number;
}
