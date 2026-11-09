import fs from 'fs';
import path from 'path';
import {
  Client,
  Vehicle,
  Appointment,
  Transaction,
  TransactionPayment,
  StoreSettings,
  DashboardStats,
  AppointmentStatus,
  TransactionStatus,
  TransactionType,
  PaymentMethod,
} from '../types/index.ts';
import {
  initialClients,
  initialVehicles,
  initialAppointments,
  initialTransactions,
  initialPayments,
  initialSettings,
  DEFAULT_BUSINESS_ID,
} from './seed.ts';

interface DatabaseSchema {
  settings: StoreSettings[];
  clients: Client[];
  vehicles: Vehicle[];
  appointments: Appointment[];
  transactions: Transaction[];
  payments: TransactionPayment[];
  version: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'automanager.json');

class DatabaseEngine {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content) as DatabaseSchema;
        if (parsed && Array.isArray(parsed.clients)) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Error loading database file, initializing with seed data:', err);
    }

    const defaultDb: DatabaseSchema = {
      settings: [initialSettings],
      clients: initialClients,
      vehicles: initialVehicles,
      appointments: initialAppointments,
      transactions: initialTransactions,
      payments: initialPayments,
      version: 1,
    };

    this.saveToDisk(defaultDb);
    return defaultDb;
  }

  private saveToDisk(dataToSave: DatabaseSchema = this.data) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Error saving database to disk:', err);
    }
  }

  // --- SETTINGS ---
  public getSettings(businessId = DEFAULT_BUSINESS_ID): StoreSettings {
    let settings = this.data.settings.find((s) => s.business_id === businessId);
    if (!settings) {
      settings = {
        ...initialSettings,
        business_id: businessId,
        id: `set_${Date.now()}`,
      };
      this.data.settings.push(settings);
      this.saveToDisk();
    }
    return settings;
  }

  public updateSettings(updates: Partial<StoreSettings>, businessId = DEFAULT_BUSINESS_ID): StoreSettings {
    const idx = this.data.settings.findIndex((s) => s.business_id === businessId);
    const now = new Date().toISOString();
    if (idx >= 0) {
      this.data.settings[idx] = {
        ...this.data.settings[idx],
        ...updates,
        updated_at: now,
      };
      this.saveToDisk();
      return this.data.settings[idx];
    } else {
      const newSettings: StoreSettings = {
        ...initialSettings,
        ...updates,
        business_id: businessId,
        id: `set_${Date.now()}`,
        updated_at: now,
      };
      this.data.settings.push(newSettings);
      this.saveToDisk();
      return newSettings;
    }
  }

  // --- CLIENTS ---
  public getClients(businessId = DEFAULT_BUSINESS_ID, query?: string): Client[] {
    let list = this.data.clients.filter((c) => c.business_id === businessId);

    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      // Match client name, phone or vehicle plate
      const matchingVehicleClientIds = new Set(
        this.data.vehicles
          .filter((v) => v.business_id === businessId && (v.plate.toLowerCase().includes(q) || v.model.toLowerCase().includes(q)))
          .map((v) => v.client_id)
      );

      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.toLowerCase().includes(q)) ||
          matchingVehicleClientIds.has(c.id)
      );
    }

    // Populate vehicles for each client
    return list.map((client) => ({
      ...client,
      vehicles: this.data.vehicles.filter((v) => v.client_id === client.id),
    }));
  }

  public getClientById(id: string, businessId = DEFAULT_BUSINESS_ID): Client | null {
    const client = this.data.clients.find((c) => c.id === id && c.business_id === businessId);
    if (!client) return null;

    return {
      ...client,
      vehicles: this.data.vehicles.filter((v) => v.client_id === client.id),
    };
  }

  public createClient(
    clientData: Omit<Client, 'id' | 'business_id' | 'created_at' | 'updated_at'>,
    businessId = DEFAULT_BUSINESS_ID
  ): Client {
    const now = new Date().toISOString();
    const newClient: Client = {
      id: `cli_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      business_id: businessId,
      name: clientData.name.trim(),
      phone: clientData.phone?.trim() || undefined,
      email: clientData.email?.trim() || undefined,
      notes: clientData.notes?.trim() || undefined,
      created_at: now,
      updated_at: now,
    };

    this.data.clients.unshift(newClient);
    this.saveToDisk();
    return { ...newClient, vehicles: [] };
  }

  public updateClient(id: string, updates: Partial<Client>, businessId = DEFAULT_BUSINESS_ID): Client | null {
    const idx = this.data.clients.findIndex((c) => c.id === id && c.business_id === businessId);
    if (idx === -1) return null;

    const now = new Date().toISOString();
    this.data.clients[idx] = {
      ...this.data.clients[idx],
      ...updates,
      updated_at: now,
    };

    this.saveToDisk();
    return this.getClientById(id, businessId);
  }

  public deleteClient(id: string, businessId = DEFAULT_BUSINESS_ID): boolean {
    const idx = this.data.clients.findIndex((c) => c.id === id && c.business_id === businessId);
    if (idx === -1) return false;

    this.data.clients.splice(idx, 1);
    this.data.vehicles = this.data.vehicles.filter((v) => v.client_id !== id);
    this.data.appointments = this.data.appointments.filter((a) => a.client_id !== id);
    this.data.transactions = this.data.transactions.filter((t) => t.client_id !== id);
    this.saveToDisk();
    return true;
  }

  // --- VEHICLES ---
  public getVehicles(businessId = DEFAULT_BUSINESS_ID, clientId?: string): Vehicle[] {
    let list = this.data.vehicles.filter((v) => v.business_id === businessId);
    if (clientId) {
      list = list.filter((v) => v.client_id === clientId);
    }
    return list.map((v) => ({
      ...v,
      client: this.data.clients.find((c) => c.id === v.client_id),
    }));
  }

  public getVehicleById(id: string, businessId = DEFAULT_BUSINESS_ID): Vehicle | null {
    const v = this.data.vehicles.find((veh) => veh.id === id && veh.business_id === businessId);
    if (!v) return null;
    return {
      ...v,
      client: this.data.clients.find((c) => c.id === v.client_id),
    };
  }

  public createVehicle(
    vehicleData: Omit<Vehicle, 'id' | 'business_id' | 'created_at' | 'updated_at'>,
    businessId = DEFAULT_BUSINESS_ID
  ): Vehicle {
    const now = new Date().toISOString();
    // Normalize plate: remove spaces and hyphens, convert to uppercase
    const normalizedPlate = vehicleData.plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    const newVehicle: Vehicle = {
      id: `veh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      business_id: businessId,
      client_id: vehicleData.client_id,
      plate: normalizedPlate,
      model: vehicleData.model.trim(),
      year: vehicleData.year?.trim() || undefined,
      color: vehicleData.color?.trim() || undefined,
      notes: vehicleData.notes?.trim() || undefined,
      created_at: now,
      updated_at: now,
    };

    this.data.vehicles.unshift(newVehicle);
    this.saveToDisk();
    return {
      ...newVehicle,
      client: this.data.clients.find((c) => c.id === newVehicle.client_id),
    };
  }

  public updateVehicle(id: string, updates: Partial<Vehicle>, businessId = DEFAULT_BUSINESS_ID): Vehicle | null {
    const idx = this.data.vehicles.findIndex((v) => v.id === id && v.business_id === businessId);
    if (idx === -1) return null;

    const now = new Date().toISOString();
    if (updates.plate) {
      updates.plate = updates.plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    }

    this.data.vehicles[idx] = {
      ...this.data.vehicles[idx],
      ...updates,
      updated_at: now,
    };

    this.saveToDisk();
    return this.getVehicleById(id, businessId);
  }

  public deleteVehicle(id: string, businessId = DEFAULT_BUSINESS_ID): boolean {
    const idx = this.data.vehicles.findIndex((v) => v.id === id && v.business_id === businessId);
    if (idx === -1) return false;

    this.data.vehicles.splice(idx, 1);
    this.data.appointments = this.data.appointments.filter((a) => a.vehicle_id !== id);
    this.data.transactions = this.data.transactions.filter((t) => t.vehicle_id !== id);
    this.saveToDisk();
    return true;
  }

  // --- APPOINTMENTS ---
  public getAppointments(
    businessId = DEFAULT_BUSINESS_ID,
    filters?: {
      date?: string; // YYYY-MM-DD
      startDate?: string;
      endDate?: string;
      status?: AppointmentStatus;
      query?: string;
    }
  ): Appointment[] {
    let list = this.data.appointments.filter((a) => a.business_id === businessId);

    if (filters?.date) {
      list = list.filter((a) => a.scheduled_at.startsWith(filters.date!));
    } else if (filters?.startDate && filters?.endDate) {
      list = list.filter((a) => {
        const itemDate = a.scheduled_at.split('T')[0];
        return itemDate >= filters.startDate! && itemDate <= filters.endDate!;
      });
    }

    if (filters?.status) {
      list = list.filter((a) => a.status === filters.status);
    }

    if (filters?.query && filters.query.trim()) {
      const q = filters.query.trim().toLowerCase();
      list = list.filter((a) => {
        const client = this.data.clients.find((c) => c.id === a.client_id);
        const vehicle = this.data.vehicles.find((v) => v.id === a.vehicle_id);
        return (
          a.service_name.toLowerCase().includes(q) ||
          (client && client.name.toLowerCase().includes(q)) ||
          (vehicle && (vehicle.plate.toLowerCase().includes(q) || vehicle.model.toLowerCase().includes(q)))
        );
      });
    }

    // Sort by scheduled_at ascending
    list.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

    return list.map((a) => this.populateAppointment(a));
  }

  public getAppointmentById(id: string, businessId = DEFAULT_BUSINESS_ID): Appointment | null {
    const apt = this.data.appointments.find((a) => a.id === id && a.business_id === businessId);
    if (!apt) return null;
    return this.populateAppointment(apt);
  }

  private populateAppointment(apt: Appointment): Appointment {
    const client = this.data.clients.find((c) => c.id === apt.client_id);
    const vehicle = this.data.vehicles.find((v) => v.id === apt.vehicle_id);
    const transaction = this.data.transactions.find((t) => t.appointment_id === apt.id);
    return {
      ...apt,
      client,
      vehicle,
      transaction: transaction ? this.populateTransaction(transaction) : undefined,
    };
  }

  // Conflict detection: returns appointments scheduled within 30 minutes on the same day
  public checkConflicts(scheduledAt: string, excludeId?: string, businessId = DEFAULT_BUSINESS_ID): Appointment[] {
    const targetTime = new Date(scheduledAt).getTime();
    const thresholdMs = 30 * 60 * 1000; // 30 minutes

    return this.data.appointments
      .filter((a) => {
        if (a.business_id !== businessId) return false;
        if (excludeId && a.id === excludeId) return false;
        if (a.status === 'cancelado') return false;

        const time = new Date(a.scheduled_at).getTime();
        return Math.abs(time - targetTime) <= thresholdMs;
      })
      .map((a) => this.populateAppointment(a));
  }

  public createAppointment(
    aptData: Omit<Appointment, 'id' | 'business_id' | 'created_at' | 'updated_at'>,
    businessId = DEFAULT_BUSINESS_ID
  ): Appointment {
    const now = new Date().toISOString();
    const newApt: Appointment = {
      id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      business_id: businessId,
      client_id: aptData.client_id,
      vehicle_id: aptData.vehicle_id,
      scheduled_at: aptData.scheduled_at,
      service_name: aptData.service_name.trim(),
      observations: aptData.observations?.trim() || undefined,
      status: aptData.status || 'agendado',
      estimated_amount: Number(aptData.estimated_amount) || 0,
      final_amount: aptData.final_amount !== undefined ? (aptData.final_amount !== null ? Number(aptData.final_amount) : null) : null,
      created_at: now,
      updated_at: now,
    };

    this.data.appointments.push(newApt);
    this.saveToDisk();
    return this.populateAppointment(newApt);
  }

  public updateAppointment(id: string, updates: Partial<Appointment>, businessId = DEFAULT_BUSINESS_ID): Appointment | null {
    const idx = this.data.appointments.findIndex((a) => a.id === id && a.business_id === businessId);
    if (idx === -1) return null;

    const now = new Date().toISOString();
    this.data.appointments[idx] = {
      ...this.data.appointments[idx],
      ...updates,
      updated_at: now,
    };

    this.saveToDisk();
    return this.populateAppointment(this.data.appointments[idx]);
  }

  public deleteAppointment(id: string, businessId = DEFAULT_BUSINESS_ID): boolean {
    const idx = this.data.appointments.findIndex((a) => a.id === id && a.business_id === businessId);
    if (idx === -1) return false;

    // Remove the appointment
    this.data.appointments.splice(idx, 1);

    // If an associated transaction exists without payments, we can unlink or clean it
    const tx = this.data.transactions.find((t) => t.appointment_id === id);
    if (tx) {
      const hasPayments = this.data.payments.some((p) => p.transaction_id === tx.id);
      if (!hasPayments) {
        const txIdx = this.data.transactions.findIndex((t) => t.id === tx.id);
        if (txIdx !== -1) {
          this.data.transactions.splice(txIdx, 1);
        }
      } else {
        tx.appointment_id = null; // Unlink if payments already made
      }
    }

    this.saveToDisk();
    return true;
  }

  // --- TRANSACTIONS & PAYMENTS ---
  public getTransactions(
    businessId = DEFAULT_BUSINESS_ID,
    filters?: {
      type?: TransactionType;
      status?: TransactionStatus;
      category?: string;
      startDate?: string;
      endDate?: string;
      clientId?: string;
      appointmentId?: string;
    }
  ): Transaction[] {
    let list = this.data.transactions.filter((t) => t.business_id === businessId);

    if (filters?.type) {
      list = list.filter((t) => t.type === filters.type);
    }

    if (filters?.category) {
      list = list.filter((t) => t.category.toLowerCase() === filters.category!.toLowerCase());
    }

    if (filters?.clientId) {
      list = list.filter((t) => t.client_id === filters.clientId);
    }

    if (filters?.appointmentId) {
      list = list.filter((t) => t.appointment_id === filters.appointmentId);
    }

    let populated = list.map((t) => this.populateTransaction(t));

    if (filters?.status) {
      populated = populated.filter((t) => t.status === filters.status);
    }

    if (filters?.startDate && filters?.endDate) {
      populated = populated.filter((t) => {
        const d = (t.due_date || t.created_at).split('T')[0];
        return d >= filters.startDate! && d <= filters.endDate!;
      });
    }

    // Sort by created_at or due_date descending
    populated.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return populated;
  }

  public getTransactionById(id: string, businessId = DEFAULT_BUSINESS_ID): Transaction | null {
    const tx = this.data.transactions.find((t) => t.id === id && t.business_id === businessId);
    if (!tx) return null;
    return this.populateTransaction(tx);
  }

  private populateTransaction(tx: Transaction): Transaction {
    const payments = this.data.payments.filter((p) => p.transaction_id === tx.id);
    const paidAmount = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    // Compute status dynamically unless cancelled
    let computedStatus = tx.status;
    if (computedStatus !== 'cancelado') {
      if (paidAmount >= tx.amount && tx.amount > 0) {
        computedStatus = 'pago';
      } else if (paidAmount > 0) {
        computedStatus = 'parcial';
      } else {
        const today = new Date().toISOString().split('T')[0];
        if (tx.due_date && tx.due_date < today) {
          computedStatus = 'vencido';
        } else {
          computedStatus = 'pendente';
        }
      }
    }

    const client = tx.client_id ? this.data.clients.find((c) => c.id === tx.client_id) : undefined;
    const vehicle = tx.vehicle_id ? this.data.vehicles.find((v) => v.id === tx.vehicle_id) : undefined;

    return {
      ...tx,
      paid_amount: paidAmount,
      status: computedStatus,
      payments,
      client,
      vehicle,
    };
  }

  public createTransaction(
    txData: {
      type: TransactionType;
      description: string;
      category: string;
      amount: number;
      due_date?: string | null;
      status?: TransactionStatus;
      payment_method?: PaymentMethod | null;
      notes?: string;
      appointment_id?: string | null;
      client_id?: string | null;
      vehicle_id?: string | null;
      immediate_payment?: {
        amount: number;
        paid_at: string;
        payment_method?: PaymentMethod;
        notes?: string;
      };
    },
    businessId = DEFAULT_BUSINESS_ID
  ): Transaction {
    const now = new Date().toISOString();
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newTx: Transaction = {
      id: txId,
      business_id: businessId,
      appointment_id: txData.appointment_id || null,
      client_id: txData.client_id || null,
      vehicle_id: txData.vehicle_id || null,
      type: txData.type,
      description: txData.description.trim(),
      category: txData.category.trim(),
      amount: Number(txData.amount) || 0,
      due_date: txData.due_date || now.split('T')[0],
      status: txData.status || 'pendente',
      payment_method: txData.payment_method || null,
      notes: txData.notes?.trim() || undefined,
      created_at: now,
      updated_at: now,
    };

    this.data.transactions.unshift(newTx);

    // If an immediate payment was made (e.g. at the counter), record it in transaction_payments
    if (txData.immediate_payment && txData.immediate_payment.amount > 0) {
      const pay: TransactionPayment = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        business_id: businessId,
        transaction_id: txId,
        amount: Number(txData.immediate_payment.amount),
        paid_at: txData.immediate_payment.paid_at || now.split('T')[0],
        payment_method: txData.immediate_payment.payment_method || txData.payment_method || 'pix',
        notes: txData.immediate_payment.notes || 'Pagamento no ato',
        created_at: now,
      };
      this.data.payments.push(pay);
    }

    this.saveToDisk();
    return this.populateTransaction(newTx);
  }

  public addPayment(
    paymentData: {
      transaction_id: string;
      amount: number;
      paid_at: string;
      payment_method?: PaymentMethod;
      notes?: string;
    },
    businessId = DEFAULT_BUSINESS_ID
  ): TransactionPayment {
    const tx = this.data.transactions.find((t) => t.id === paymentData.transaction_id && t.business_id === businessId);
    if (!tx) {
      throw new Error('Transação não encontrada para registrar pagamento');
    }

    const now = new Date().toISOString();
    const newPayment: TransactionPayment = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      business_id: businessId,
      transaction_id: paymentData.transaction_id,
      amount: Number(paymentData.amount) || 0,
      paid_at: paymentData.paid_at || now.split('T')[0],
      payment_method: paymentData.payment_method || 'pix',
      notes: paymentData.notes?.trim() || undefined,
      created_at: now,
    };

    this.data.payments.push(newPayment);

    // Update transaction updated_at
    tx.updated_at = now;
    this.saveToDisk();
    return newPayment;
  }

  public updateTransaction(
    id: string,
    updates: Partial<Transaction>,
    businessId = DEFAULT_BUSINESS_ID
  ): Transaction | null {
    const idx = this.data.transactions.findIndex((t) => t.id === id && t.business_id === businessId);
    if (idx === -1) return null;

    const now = new Date().toISOString();
    this.data.transactions[idx] = {
      ...this.data.transactions[idx],
      ...updates,
      updated_at: now,
    };

    this.saveToDisk();
    return this.populateTransaction(this.data.transactions[idx]);
  }

  public deleteTransaction(id: string, businessId = DEFAULT_BUSINESS_ID): boolean {
    const idx = this.data.transactions.findIndex((t) => t.id === id && t.business_id === businessId);
    if (idx === -1) return false;

    this.data.transactions.splice(idx, 1);
    this.data.payments = this.data.payments.filter((p) => p.transaction_id !== id);
    this.saveToDisk();
    return true;
  }

  public clearFinancialTransactions(businessId = DEFAULT_BUSINESS_ID): boolean {
    this.data.transactions = this.data.transactions.filter((t) => t.business_id !== businessId);
    this.data.payments = this.data.payments.filter((p) => p.business_id !== businessId);
    this.saveToDisk();
    return true;
  }

  // --- DASHBOARD AND FINANCIAL METRICS ---
  public getDashboardStats(businessId = DEFAULT_BUSINESS_ID, period?: { startDate: string; endDate: string }): DashboardStats {
    const settings = this.getSettings(businessId);
    const openingBalance = Number(settings.opening_balance) || 0;

    // Filter payments for incomes vs expenses
    // Rule:
    // Saldo atual = Saldo inicial + total de todas as entradas recebidas - total de todas as saídas pagas
    let allReceivedIncomes = 0;
    let allPaidExpenses = 0;

    for (const payment of this.data.payments) {
      if (payment.business_id !== businessId) continue;
      const tx = this.data.transactions.find((t) => t.id === payment.transaction_id);
      if (!tx || tx.status === 'cancelado') continue;

      if (tx.type === 'income') {
        allReceivedIncomes += Number(payment.amount) || 0;
      } else if (tx.type === 'expense') {
        allPaidExpenses += Number(payment.amount) || 0;
      }
    }

    const currentBalance = openingBalance + allReceivedIncomes - allPaidExpenses;

    // Period calculations (default to current month if not specified)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const startOfCurrentMonth = `${currentYear}-${currentMonth}-01`;
    // Last day of month
    const endOfCurrentMonth = new Date(currentYear, now.getMonth() + 1, 0).toISOString().split('T')[0];

    const periodStart = period?.startDate || startOfCurrentMonth;
    const periodEnd = period?.endDate || endOfCurrentMonth;

    let periodIncome = 0;
    let periodExpense = 0;

    for (const payment of this.data.payments) {
      if (payment.business_id !== businessId) continue;
      if (payment.paid_at < periodStart || payment.paid_at > periodEnd) continue;

      const tx = this.data.transactions.find((t) => t.id === payment.transaction_id);
      if (!tx || tx.status === 'cancelado') continue;

      if (tx.type === 'income') {
        periodIncome += Number(payment.amount) || 0;
      } else if (tx.type === 'expense') {
        periodExpense += Number(payment.amount) || 0;
      }
    }

    // Receivables and Payables (remaining unpaid amount for non-cancelled transactions)
    let receivables = 0;
    let payables = 0;
    let pendingCount = 0;

    for (const tx of this.data.transactions) {
      if (tx.business_id !== businessId || tx.status === 'cancelado') continue;

      const txPayments = this.data.payments.filter((p) => p.transaction_id === tx.id);
      const paid = txPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
      const remaining = Math.max(0, tx.amount - paid);

      if (remaining > 0) {
        pendingCount++;
        if (tx.type === 'income') {
          receivables += remaining;
        } else if (tx.type === 'expense') {
          payables += remaining;
        }
      }
    }

    // Today's appointments count
    const today = now.toISOString().split('T')[0];
    const todayAppointments = this.data.appointments.filter(
      (a) => a.business_id === businessId && a.scheduled_at.startsWith(today) && a.status !== 'cancelado'
    );

    return {
      current_balance: Math.round(currentBalance * 100) / 100,
      opening_balance: openingBalance,
      month_income: Math.round(periodIncome * 100) / 100,
      month_expense: Math.round(periodExpense * 100) / 100,
      receivables: Math.round(receivables * 100) / 100,
      payables: Math.round(payables * 100) / 100,
      today_appointments_count: todayAppointments.length,
      pending_transactions_count: pendingCount,
    };
  }

  // --- GLOBAL SEARCH (Plates, Clients, Vehicles) ---
  public searchGlobal(query: string, businessId = DEFAULT_BUSINESS_ID) {
    if (!query || !query.trim()) {
      return { clients: [], vehicles: [], appointments: [] };
    }
    const q = query.trim().toLowerCase();
    const cleanPlateQ = query.replace(/[^A-Za-z0-9]/g, '').toLowerCase();

    const matchedVehicles = this.data.vehicles
      .filter(
        (v) =>
          v.business_id === businessId &&
          (v.plate.toLowerCase().includes(cleanPlateQ) || v.model.toLowerCase().includes(q))
      )
      .slice(0, 10)
      .map((v) => ({
        ...v,
        client: this.data.clients.find((c) => c.id === v.client_id),
      }));

    const matchedClients = this.data.clients
      .filter(
        (c) =>
          c.business_id === businessId &&
          (c.name.toLowerCase().includes(q) || (c.phone && c.phone.toLowerCase().includes(q)))
      )
      .slice(0, 10)
      .map((c) => ({
        ...c,
        vehicles: this.data.vehicles.filter((v) => v.client_id === c.id),
      }));

    const matchedAppointments = this.data.appointments
      .filter((a) => a.business_id === businessId && a.service_name.toLowerCase().includes(q))
      .slice(0, 10)
      .map((a) => this.populateAppointment(a));

    return {
      clients: matchedClients,
      vehicles: matchedVehicles,
      appointments: matchedAppointments,
    };
  }

  // Full export & backup / restore
  public exportData(): DatabaseSchema {
    return JSON.parse(JSON.stringify(this.data));
  }

  public importData(importedData: DatabaseSchema) {
    if (!importedData || !Array.isArray(importedData.clients)) {
      throw new Error('Formato de backup inválido');
    }
    this.data = importedData;
    this.saveToDisk();
    return true;
  }

  public resetToDefault() {
    const currentSettings = this.data.settings[0] || initialSettings;
    this.data = {
      settings: [currentSettings],
      clients: initialClients,
      vehicles: initialVehicles,
      appointments: initialAppointments,
      transactions: initialTransactions,
      payments: initialPayments,
      version: 1,
    };
    this.saveToDisk();
  }
}

export const db = new DatabaseEngine();
