import { Client, Vehicle, Appointment, Transaction, TransactionPayment, StoreSettings } from '../types/index.ts';

export const DEFAULT_BUSINESS_ID = 'biz_loja_principal';

export const initialSettings: StoreSettings = {
  id: 'set_1',
  business_id: DEFAULT_BUSINESS_ID,
  business_name: 'Minha Loja de Carros',
  document: '',
  phone: '',
  address: '',
  opening_balance: 0.00,
  currency: 'BRL',
  created_at: new Date('2026-01-01T08:00:00Z').toISOString(),
  updated_at: new Date('2026-01-01T08:00:00Z').toISOString(),
};

export const initialClients: Client[] = [];

export const initialVehicles: Vehicle[] = [];

export const initialAppointments: Appointment[] = [];

export const initialTransactions: Transaction[] = [];

export const initialPayments: TransactionPayment[] = [];
