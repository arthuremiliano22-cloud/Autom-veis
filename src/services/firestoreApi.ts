import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase.ts';
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

const DEFAULT_BUSINESS_ID = 'loja_oficial';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
}

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        cleaned[key] = stripUndefined(val);
      } else {
        cleaned[key] = val;
      }
    }
  }
  return cleaned as T;
}

function safeSetDoc<T extends Record<string, any>>(docRef: any, data: T, options?: any) {
  return setDoc(docRef, stripUndefined(data), options);
}

export const firestoreApi = {
  // --- Settings ---
  async getSettings(): Promise<StoreSettings> {
    const path = 'settings';
    try {
      const docRef = doc(db, path, 'store_config');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as StoreSettings;
      }

      const defaultSettings: StoreSettings = {
        id: 'store_config',
        business_id: DEFAULT_BUSINESS_ID,
        business_name: 'Minha Loja de Carros',
        document: '',
        phone: '',
        address: '',
        opening_balance: 0,
        currency: 'BRL',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await safeSetDoc(docRef, defaultSettings);
      return defaultSettings;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  },

  async updateSettings(data: Partial<StoreSettings>): Promise<StoreSettings> {
    const path = 'settings';
    try {
      const current = await this.getSettings();
      const updated: StoreSettings = {
        ...current,
        ...data,
        updated_at: new Date().toISOString(),
      };
      await safeSetDoc(doc(db, path, 'store_config'), updated);
      return updated;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  // --- Clients ---
  async getClients(searchQuery?: string): Promise<Client[]> {
    const path = 'clients';
    try {
      const colRef = collection(db, path);
      const snapshot = await getDocs(colRef);
      const clients = snapshot.docs.map((d) => d.data() as Client);

      // Fetch vehicles to attach
      const vehSnap = await getDocs(collection(db, 'vehicles'));
      const vehicles = vehSnap.docs.map((d) => d.data() as Vehicle);

      const clientsWithVehicles = clients.map((c) => ({
        ...c,
        vehicles: vehicles.filter((v) => v.client_id === c.id),
      }));

      clientsWithVehicles.sort((a, b) => a.name.localeCompare(b.name));

      if (!searchQuery?.trim()) {
        return clientsWithVehicles;
      }

      const q = searchQuery.toLowerCase().trim();
      return clientsWithVehicles.filter((c) => {
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesPhone = c.phone?.toLowerCase().includes(q) || false;
        const matchesEmail = c.email?.toLowerCase().includes(q) || false;
        const matchesVeh = c.vehicles?.some(
          (v) => v.plate.toLowerCase().includes(q) || v.model.toLowerCase().includes(q)
        );
        return matchesName || matchesPhone || matchesEmail || matchesVeh;
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  async getClientById(id: string): Promise<Client & { appointments: Appointment[]; transactions: Transaction[] }> {
    const path = `clients/${id}`;
    try {
      const clientDoc = await getDoc(doc(db, 'clients', id));
      if (!clientDoc.exists()) {
        throw new Error('Cliente não encontrado.');
      }
      const client = clientDoc.data() as Client;

      // Vehicles
      const vehSnap = await getDocs(query(collection(db, 'vehicles'), where('client_id', '==', id)));
      const vehicles = vehSnap.docs.map((d) => d.data() as Vehicle);

      // Appointments
      const aptSnap = await getDocs(query(collection(db, 'appointments'), where('client_id', '==', id)));
      const appointments = aptSnap.docs.map((d) => d.data() as Appointment);

      // Transactions
      const txSnap = await getDocs(query(collection(db, 'transactions'), where('client_id', '==', id)));
      const transactions = txSnap.docs.map((d) => d.data() as Transaction);

      return {
        ...client,
        vehicles,
        appointments: appointments.sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at)),
        transactions: transactions.sort((a, b) => b.created_at.localeCompare(a.created_at)),
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  },

  async createClient(data: {
    name: string;
    phone?: string;
    email?: string;
    notes?: string;
    vehiclePlate?: string;
    vehicleModel?: string;
    vehicleYear?: string;
    vehicleColor?: string;
  }): Promise<Client> {
    const path = 'clients';
    try {
      const clientId = generateId();
      const now = new Date().toISOString();

      const newClient: Client = {
        id: clientId,
        business_id: DEFAULT_BUSINESS_ID,
        name: data.name.trim(),
        phone: data.phone?.trim() || undefined,
        email: data.email?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        created_at: now,
        updated_at: now,
      };

      await safeSetDoc(doc(db, 'clients', clientId), newClient);

      // If initial vehicle provided, create vehicle
      if (data.vehiclePlate?.trim() && data.vehicleModel?.trim()) {
        const vehicleId = generateId();
        const newVehicle: Vehicle = {
          id: vehicleId,
          business_id: DEFAULT_BUSINESS_ID,
          client_id: clientId,
          plate: data.vehiclePlate.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''),
          model: data.vehicleModel.trim(),
          year: data.vehicleYear?.trim() || undefined,
          color: data.vehicleColor?.trim() || undefined,
          created_at: now,
          updated_at: now,
        };
        await safeSetDoc(doc(db, 'vehicles', vehicleId), newVehicle);
        newClient.vehicles = [newVehicle];
      } else {
        newClient.vehicles = [];
      }

      return newClient;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async updateClient(id: string, data: Partial<Client>): Promise<Client> {
    const path = `clients/${id}`;
    try {
      const docRef = doc(db, 'clients', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        throw new Error('Cliente não encontrado.');
      }
      const existing = snap.data() as Client;
      const updated: Client = {
        ...existing,
        ...data,
        updated_at: new Date().toISOString(),
      };
      await safeSetDoc(docRef, updated);
      return updated;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  async deleteClient(id: string): Promise<{ success: boolean; message: string }> {
    const path = `clients/${id}`;
    try {
      // Check for appointments
      const apts = await getDocs(query(collection(db, 'appointments'), where('client_id', '==', id)));
      if (!apts.empty) {
        throw new Error('Não é possível excluir o cliente pois ele possui agendamentos registrados.');
      }

      // Check for transactions
      const txs = await getDocs(query(collection(db, 'transactions'), where('client_id', '==', id)));
      if (!txs.empty) {
        throw new Error('Não é possível excluir o cliente pois ele possui lançamentos financeiros vinculados.');
      }

      // Delete associated vehicles
      const vehs = await getDocs(query(collection(db, 'vehicles'), where('client_id', '==', id)));
      const batch = writeBatch(db);
      vehs.docs.forEach((v) => batch.delete(v.ref));
      batch.delete(doc(db, 'clients', id));
      await batch.commit();

      return { success: true, message: 'Cliente e veículos excluídos com sucesso.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // --- Vehicles ---
  async getVehicles(clientId?: string): Promise<Vehicle[]> {
    const path = 'vehicles';
    try {
      let q = collection(db, path);
      let snapshot = clientId
        ? await getDocs(query(q, where('client_id', '==', clientId)))
        : await getDocs(q);

      const vehicles = snapshot.docs.map((d) => d.data() as Vehicle);

      // Attach client information
      const clientSnap = await getDocs(collection(db, 'clients'));
      const clientsMap = new Map(clientSnap.docs.map((d) => [d.id, d.data() as Client]));

      return vehicles.map((v) => ({
        ...v,
        client: clientsMap.get(v.client_id),
      }));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  async getVehicleById(id: string): Promise<Vehicle> {
    const path = `vehicles/${id}`;
    try {
      const snap = await getDoc(doc(db, 'vehicles', id));
      if (!snap.exists()) {
        throw new Error('Veículo não encontrado.');
      }
      const vehicle = snap.data() as Vehicle;
      const clientDoc = await getDoc(doc(db, 'clients', vehicle.client_id));
      if (clientDoc.exists()) {
        vehicle.client = clientDoc.data() as Client;
      }
      return vehicle;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  },

  async getVehicleHistory(id: string): Promise<{ vehicle: Vehicle; appointments: Appointment[]; transactions: Transaction[] }> {
    const path = `vehicles/${id}/history`;
    try {
      const vehicle = await this.getVehicleById(id);

      const aptSnap = await getDocs(query(collection(db, 'appointments'), where('vehicle_id', '==', id)));
      const appointments = aptSnap.docs.map((d) => d.data() as Appointment);

      const txSnap = await getDocs(query(collection(db, 'transactions'), where('vehicle_id', '==', id)));
      const transactions = txSnap.docs.map((d) => d.data() as Transaction);

      return {
        vehicle,
        appointments: appointments.sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at)),
        transactions: transactions.sort((a, b) => b.created_at.localeCompare(a.created_at)),
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  },

  async createVehicle(data: {
    client_id: string;
    plate: string;
    model: string;
    year?: string;
    color?: string;
    notes?: string;
  }): Promise<Vehicle> {
    const path = 'vehicles';
    try {
      const vehicleId = generateId();
      const now = new Date().toISOString();

      const newVehicle: Vehicle = {
        id: vehicleId,
        business_id: DEFAULT_BUSINESS_ID,
        client_id: data.client_id,
        plate: data.plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''),
        model: data.model.trim(),
        year: data.year?.trim() || undefined,
        color: data.color?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        created_at: now,
        updated_at: now,
      };

      await safeSetDoc(doc(db, 'vehicles', vehicleId), newVehicle);

      const clientDoc = await getDoc(doc(db, 'clients', data.client_id));
      if (clientDoc.exists()) {
        newVehicle.client = clientDoc.data() as Client;
      }

      return newVehicle;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    const path = `vehicles/${id}`;
    try {
      const docRef = doc(db, 'vehicles', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        throw new Error('Veículo não encontrado.');
      }
      const existing = snap.data() as Vehicle;
      const updated: Vehicle = {
        ...existing,
        ...data,
        plate: data.plate ? data.plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') : existing.plate,
        updated_at: new Date().toISOString(),
      };
      await safeSetDoc(docRef, updated);
      return updated;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  async deleteVehicle(id: string): Promise<{ success: boolean; message: string }> {
    const path = `vehicles/${id}`;
    try {
      const apts = await getDocs(query(collection(db, 'appointments'), where('vehicle_id', '==', id)));
      if (!apts.empty) {
        throw new Error('Não é possível excluir o veículo pois existem agendamentos para ele.');
      }
      await deleteDoc(doc(db, 'vehicles', id));
      return { success: true, message: 'Veículo excluído com sucesso.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // --- Appointments ---
  async getAppointments(params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    status?: AppointmentStatus;
    q?: string;
  }): Promise<Appointment[]> {
    const path = 'appointments';
    try {
      const snap = await getDocs(collection(db, 'appointments'));
      let appointments = snap.docs.map((d) => d.data() as Appointment);

      // Attach client & vehicle
      const clientSnap = await getDocs(collection(db, 'clients'));
      const clientsMap = new Map(clientSnap.docs.map((d) => [d.id, d.data() as Client]));

      const vehSnap = await getDocs(collection(db, 'vehicles'));
      const vehsMap = new Map(vehSnap.docs.map((d) => [d.id, d.data() as Vehicle]));

      appointments = appointments.map((a) => ({
        ...a,
        client: clientsMap.get(a.client_id),
        vehicle: vehsMap.get(a.vehicle_id),
      }));

      // Apply Filters
      if (params?.date) {
        appointments = appointments.filter((a) => a.scheduled_at.startsWith(params.date!));
      }
      if (params?.startDate) {
        appointments = appointments.filter((a) => a.scheduled_at.split('T')[0] >= params.startDate!);
      }
      if (params?.endDate) {
        appointments = appointments.filter((a) => a.scheduled_at.split('T')[0] <= params.endDate!);
      }
      if (params?.status) {
        appointments = appointments.filter((a) => a.status === params.status);
      }
      if (params?.q?.trim()) {
        const q = params.q.toLowerCase().trim();
        appointments = appointments.filter(
          (a) =>
            a.client?.name.toLowerCase().includes(q) ||
            a.vehicle?.plate.toLowerCase().includes(q) ||
            a.vehicle?.model.toLowerCase().includes(q) ||
            a.service_name.toLowerCase().includes(q)
        );
      }

      appointments.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
      return appointments;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  async getAppointmentById(id: string): Promise<Appointment> {
    const path = `appointments/${id}`;
    try {
      const snap = await getDoc(doc(db, 'appointments', id));
      if (!snap.exists()) {
        throw new Error('Agendamento não encontrado.');
      }
      const apt = snap.data() as Appointment;
      const clientDoc = await getDoc(doc(db, 'clients', apt.client_id));
      if (clientDoc.exists()) apt.client = clientDoc.data() as Client;

      const vehDoc = await getDoc(doc(db, 'vehicles', apt.vehicle_id));
      if (vehDoc.exists()) apt.vehicle = vehDoc.data() as Vehicle;

      return apt;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  },

  async createAppointment(data: {
    client_id: string;
    vehicle_id: string;
    scheduled_at: string;
    service_name: string;
    observations?: string;
    status?: AppointmentStatus;
    estimated_amount: number;
    final_amount?: number | null;
  }): Promise<Appointment> {
    const path = 'appointments';
    try {
      const appointmentId = generateId();
      const now = new Date().toISOString();

      const newAppointment: Appointment = {
        id: appointmentId,
        business_id: DEFAULT_BUSINESS_ID,
        client_id: data.client_id,
        vehicle_id: data.vehicle_id,
        scheduled_at: data.scheduled_at,
        service_name: data.service_name.trim(),
        observations: data.observations?.trim() || undefined,
        status: data.status || 'agendado',
        estimated_amount: data.estimated_amount,
        final_amount: data.final_amount ?? null,
        created_at: now,
        updated_at: now,
      };

      await safeSetDoc(doc(db, 'appointments', appointmentId), newAppointment);
      return this.getAppointmentById(appointmentId);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async updateAppointment(id: string, data: Partial<Appointment>): Promise<Appointment> {
    const path = `appointments/${id}`;
    try {
      const docRef = doc(db, 'appointments', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        throw new Error('Agendamento não encontrado.');
      }
      const existing = snap.data() as Appointment;
      const updated: Appointment = {
        ...existing,
        ...data,
        updated_at: new Date().toISOString(),
      };
      await safeSetDoc(docRef, updated);
      return this.getAppointmentById(id);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  async deleteAppointment(id: string): Promise<{ success: boolean; message: string }> {
    const path = `appointments/${id}`;
    try {
      await deleteDoc(doc(db, 'appointments', id));
      return { success: true, message: 'Agendamento excluído com sucesso.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  async completeAppointment(
    id: string,
    data: {
      final_amount: number;
      create_transaction?: boolean;
      is_paid?: boolean;
      paid_at?: string;
      due_date?: string;
      payment_method?: PaymentMethod;
    }
  ): Promise<Appointment> {
    const path = `appointments/${id}/complete`;
    try {
      const apt = await this.getAppointmentById(id);
      const now = new Date().toISOString();

      const updatedApt: Appointment = {
        ...apt,
        status: 'concluido',
        final_amount: data.final_amount,
        updated_at: now,
      };
      await safeSetDoc(doc(db, 'appointments', id), updatedApt);

      // Create linked financial transaction if requested
      if (data.create_transaction) {
        const txId = generateId();
        const plate = apt.vehicle?.plate ? ` (${apt.vehicle.plate})` : '';
        const desc = `Serviço: ${apt.service_name}${plate}`;

        const isPaid = !!data.is_paid;
        const initialStatus: TransactionStatus = isPaid ? 'pago' : 'pendente';

        const newTx: Transaction = {
          id: txId,
          business_id: DEFAULT_BUSINESS_ID,
          appointment_id: id,
          client_id: apt.client_id,
          vehicle_id: apt.vehicle_id,
          type: 'income',
          description: desc,
          category: 'Serviços',
          amount: data.final_amount,
          paid_amount: isPaid ? data.final_amount : 0,
          due_date: data.due_date || now.split('T')[0],
          status: initialStatus,
          payment_method: data.payment_method || (isPaid ? 'pix' : null),
          notes: `Conclusão do agendamento #${id.substring(0, 6)}`,
          created_at: now,
          updated_at: now,
        };

        await safeSetDoc(doc(db, 'transactions', txId), newTx);

        if (isPaid) {
          const payId = generateId();
          const paymentRecord: TransactionPayment = {
            id: payId,
            business_id: DEFAULT_BUSINESS_ID,
            transaction_id: txId,
            amount: data.final_amount,
            paid_at: data.paid_at || now.split('T')[0],
            payment_method: data.payment_method || 'pix',
            notes: 'Pagamento total na conclusão do serviço',
            created_at: now,
          };
          await safeSetDoc(doc(db, 'transactions', txId, 'payments', payId), paymentRecord);
        }
      }

      return updatedApt;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  async checkConflict(scheduled_at: string, exclude_id?: string): Promise<{ conflicts: Appointment[]; hasConflict: boolean }> {
    const path = 'appointments/check-conflict';
    try {
      const snap = await getDocs(
        query(collection(db, 'appointments'), where('scheduled_at', '==', scheduled_at))
      );
      let conflicts = snap.docs
        .map((d) => d.data() as Appointment)
        .filter((a) => a.status !== 'cancelado');

      if (exclude_id) {
        conflicts = conflicts.filter((a) => a.id !== exclude_id);
      }

      return {
        conflicts,
        hasConflict: conflicts.length > 0,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  },

  // --- Transactions ---
  async getTransactions(params?: {
    type?: TransactionType;
    status?: TransactionStatus;
    category?: string;
    startDate?: string;
    endDate?: string;
    clientId?: string;
    appointmentId?: string;
  }): Promise<Transaction[]> {
    const path = 'transactions';
    try {
      const snap = await getDocs(collection(db, 'transactions'));
      let transactions = snap.docs.map((d) => d.data() as Transaction);

      const clientSnap = await getDocs(collection(db, 'clients'));
      const clientsMap = new Map(clientSnap.docs.map((d) => [d.id, d.data() as Client]));

      const vehSnap = await getDocs(collection(db, 'vehicles'));
      const vehsMap = new Map(vehSnap.docs.map((d) => [d.id, d.data() as Vehicle]));

      const today = new Date().toISOString().split('T')[0];

      transactions = transactions.map((t) => {
        let dynamicStatus = t.status;
        const paid = t.paid_amount || 0;

        if (dynamicStatus !== 'cancelado') {
          if (paid >= t.amount && t.amount > 0) {
            dynamicStatus = 'pago';
          } else if (paid > 0 && paid < t.amount) {
            dynamicStatus = 'parcial';
          } else if (t.due_date && t.due_date < today) {
            dynamicStatus = 'vencido';
          } else {
            dynamicStatus = 'pendente';
          }
        }

        return {
          ...t,
          status: dynamicStatus,
          client: t.client_id ? clientsMap.get(t.client_id) : undefined,
          vehicle: t.vehicle_id ? vehsMap.get(t.vehicle_id) : undefined,
        };
      });

      if (params?.type) {
        transactions = transactions.filter((t) => t.type === params.type);
      }
      if (params?.status) {
        transactions = transactions.filter((t) => t.status === params.status);
      }
      if (params?.category) {
        transactions = transactions.filter((t) => t.category === params.category);
      }
      if (params?.startDate) {
        transactions = transactions.filter(
          (t) => (t.due_date || t.created_at.split('T')[0]) >= params.startDate!
        );
      }
      if (params?.endDate) {
        transactions = transactions.filter(
          (t) => (t.due_date || t.created_at.split('T')[0]) <= params.endDate!
        );
      }
      if (params?.clientId) {
        transactions = transactions.filter((t) => t.client_id === params.clientId);
      }
      if (params?.appointmentId) {
        transactions = transactions.filter((t) => t.appointment_id === params.appointmentId);
      }

      transactions.sort((a, b) => b.created_at.localeCompare(a.created_at));
      return transactions;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  async createTransaction(data: {
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
  }): Promise<Transaction> {
    const path = 'transactions';
    try {
      const txId = generateId();
      const now = new Date().toISOString();

      let paidAmount = 0;
      let status: TransactionStatus = data.status || 'pendente';

      if (data.immediate_payment && data.immediate_payment.amount > 0) {
        paidAmount = data.immediate_payment.amount;
        if (paidAmount >= data.amount) {
          status = 'pago';
        } else {
          status = 'parcial';
        }
      }

      const newTx: Transaction = {
        id: txId,
        business_id: DEFAULT_BUSINESS_ID,
        type: data.type,
        description: data.description.trim(),
        category: data.category.trim(),
        amount: data.amount,
        paid_amount: paidAmount,
        due_date: data.due_date || now.split('T')[0],
        status,
        payment_method: data.payment_method || null,
        notes: data.notes?.trim() || undefined,
        appointment_id: data.appointment_id || null,
        client_id: data.client_id || null,
        vehicle_id: data.vehicle_id || null,
        created_at: now,
        updated_at: now,
      };

      await safeSetDoc(doc(db, 'transactions', txId), newTx);

      if (data.immediate_payment && data.immediate_payment.amount > 0) {
        const payId = generateId();
        const paymentRecord: TransactionPayment = {
          id: payId,
          business_id: DEFAULT_BUSINESS_ID,
          transaction_id: txId,
          amount: data.immediate_payment.amount,
          paid_at: data.immediate_payment.paid_at || now.split('T')[0],
          payment_method: data.immediate_payment.payment_method || data.payment_method || 'pix',
          notes: data.immediate_payment.notes || 'Pagamento imediato registrado na criação',
          created_at: now,
        };
        await safeSetDoc(doc(db, 'transactions', txId, 'payments', payId), paymentRecord);
        newTx.payments = [paymentRecord];
      }

      return newTx;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction> {
    const path = `transactions/${id}`;
    try {
      const docRef = doc(db, 'transactions', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        throw new Error('Transação não encontrada.');
      }
      const existing = snap.data() as Transaction;
      const updated: Transaction = {
        ...existing,
        ...data,
        updated_at: new Date().toISOString(),
      };
      await safeSetDoc(docRef, updated);
      return updated;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  async deleteTransaction(id: string): Promise<{ success: boolean; message: string }> {
    const path = `transactions/${id}`;
    try {
      // Delete any payment subcollection docs
      const paymentsSnap = await getDocs(collection(db, 'transactions', id, 'payments'));
      const batch = writeBatch(db);
      paymentsSnap.docs.forEach((p) => batch.delete(p.ref));
      batch.delete(doc(db, 'transactions', id));
      await batch.commit();

      return { success: true, message: 'Lançamento financeiro excluído com sucesso.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  async clearFinancialTransactions(): Promise<{ success: boolean; message: string }> {
    const path = 'transactions';
    try {
      const snap = await getDocs(collection(db, path));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      return { success: true, message: 'Todos os registros financeiros foram limpos no banco de dados oficial.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  async addPayment(
    transactionId: string,
    data: {
      amount: number;
      paid_at: string;
      payment_method?: PaymentMethod;
      notes?: string;
    }
  ): Promise<{ payment: TransactionPayment; transaction: Transaction }> {
    const path = `transactions/${transactionId}/payments`;
    try {
      const txDocRef = doc(db, 'transactions', transactionId);
      const txSnap = await getDoc(txDocRef);
      if (!txSnap.exists()) {
        throw new Error('Transação não encontrada.');
      }
      const tx = txSnap.data() as Transaction;
      const now = new Date().toISOString();

      const payId = generateId();
      const paymentRecord: TransactionPayment = {
        id: payId,
        business_id: DEFAULT_BUSINESS_ID,
        transaction_id: transactionId,
        amount: data.amount,
        paid_at: data.paid_at || now.split('T')[0],
        payment_method: data.payment_method || 'pix',
        notes: data.notes?.trim() || undefined,
        created_at: now,
      };

      await safeSetDoc(doc(db, 'transactions', transactionId, 'payments', payId), paymentRecord);

      // Recalculate total paid
      const allPaymentsSnap = await getDocs(collection(db, 'transactions', transactionId, 'payments'));
      const totalPaid = allPaymentsSnap.docs.reduce((acc, p) => acc + (p.data().amount || 0), 0);

      let newStatus: TransactionStatus = tx.status;
      if (totalPaid >= tx.amount) {
        newStatus = 'pago';
      } else if (totalPaid > 0) {
        newStatus = 'parcial';
      }

      const updatedTx: Transaction = {
        ...tx,
        paid_amount: totalPaid,
        status: newStatus,
        payment_method: data.payment_method || tx.payment_method,
        updated_at: now,
      };
      await safeSetDoc(txDocRef, updatedTx);

      return {
        payment: paymentRecord,
        transaction: updatedTx,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  // --- Dashboard Aggregations ---
  async getDashboard(params?: { startDate?: string; endDate?: string }): Promise<{
    stats: DashboardStats;
    todayAppointments: Appointment[];
    pendingTransactions: Transaction[];
  }> {
    const path = 'dashboard';
    try {
      const [settings, clients, vehicles, appointments, transactions] = await Promise.all([
        this.getSettings(),
        this.getClients(),
        this.getVehicles(),
        this.getAppointments(),
        this.getTransactions(),
      ]);

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
      const currentMonthPrefix = `${currentYear}-${currentMonth}`;

      let totalIncomePaid = 0;
      let totalExpensePaid = 0;
      let monthIncome = 0;
      let monthExpense = 0;
      let receivables = 0;
      let payables = 0;

      transactions.forEach((tx) => {
        if (tx.status === 'cancelado') return;

        const paid = tx.paid_amount || 0;
        const remaining = Math.max(0, tx.amount - paid);

        if (tx.type === 'income') {
          totalIncomePaid += paid;
          receivables += remaining;

          const txDate = tx.due_date || tx.created_at.split('T')[0];
          if (txDate.startsWith(currentMonthPrefix)) {
            monthIncome += paid;
          }
        } else if (tx.type === 'expense') {
          totalExpensePaid += paid;
          payables += remaining;

          const txDate = tx.due_date || tx.created_at.split('T')[0];
          if (txDate.startsWith(currentMonthPrefix)) {
            monthExpense += paid;
          }
        }
      });

      const currentBalance = (settings.opening_balance || 0) + totalIncomePaid - totalExpensePaid;

      const todayAppointments = appointments.filter((a) => a.scheduled_at.startsWith(todayStr));
      const pendingTransactions = transactions.filter(
        (t) => t.status !== 'pago' && t.status !== 'cancelado'
      );

      const stats: DashboardStats = {
        current_balance: currentBalance,
        opening_balance: settings.opening_balance || 0,
        month_income: monthIncome,
        month_expense: monthExpense,
        receivables,
        payables,
        today_appointments_count: todayAppointments.length,
        pending_transactions_count: pendingTransactions.length,
      };

      return {
        stats,
        todayAppointments,
        pendingTransactions: pendingTransactions.slice(0, 10),
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  },

  // --- Search ---
  async search(q: string): Promise<{
    clients: Client[];
    vehicles: Vehicle[];
    appointments: Appointment[];
  }> {
    const path = 'search';
    try {
      if (!q.trim()) {
        return { clients: [], vehicles: [], appointments: [] };
      }

      const queryLower = q.toLowerCase().trim();
      const [clients, vehicles, appointments] = await Promise.all([
        this.getClients(),
        this.getVehicles(),
        this.getAppointments(),
      ]);

      const matchedClients = clients.filter((c) => {
        return (
          c.name.toLowerCase().includes(queryLower) ||
          (c.phone && c.phone.includes(queryLower)) ||
          (c.email && c.email.toLowerCase().includes(queryLower)) ||
          c.vehicles?.some(
            (v) =>
              v.plate.toLowerCase().includes(queryLower) ||
              v.model.toLowerCase().includes(queryLower)
          )
        );
      });

      const matchedVehicles = vehicles.filter((v) => {
        return (
          v.plate.toLowerCase().includes(queryLower) ||
          v.model.toLowerCase().includes(queryLower) ||
          (v.client?.name && v.client.name.toLowerCase().includes(queryLower))
        );
      });

      const matchedAppointments = appointments.filter((a) => {
        return (
          a.service_name.toLowerCase().includes(queryLower) ||
          (a.client?.name && a.client.name.toLowerCase().includes(queryLower)) ||
          (a.vehicle?.plate && a.vehicle.plate.toLowerCase().includes(queryLower)) ||
          (a.vehicle?.model && a.vehicle.model.toLowerCase().includes(queryLower))
        );
      });

      return {
        clients: matchedClients.slice(0, 8),
        vehicles: matchedVehicles.slice(0, 8),
        appointments: matchedAppointments.slice(0, 8),
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  // --- Backup & Restore ---
  async exportBackup(): Promise<any> {
    const path = 'backup';
    try {
      const [settings, clients, vehicles, appointments, transactions] = await Promise.all([
        this.getSettings(),
        this.getClients(),
        this.getVehicles(),
        this.getAppointments(),
        this.getTransactions(),
      ]);

      return {
        version: 1,
        exported_at: new Date().toISOString(),
        database: 'firestore',
        project_id: 'gestor-fabe6',
        data: {
          settings: [settings],
          clients,
          vehicles,
          appointments,
          transactions,
        },
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  },

  async restoreBackup(data: any): Promise<{ success: boolean; message: string }> {
    const path = 'backup/restore';
    try {
      if (!data || !data.data) {
        throw new Error('Formato de backup inválido.');
      }
      const batch = writeBatch(db);

      if (Array.isArray(data.data.clients)) {
        for (const c of data.data.clients) {
          batch.set(doc(db, 'clients', c.id), stripUndefined(c));
        }
      }
      if (Array.isArray(data.data.vehicles)) {
        for (const v of data.data.vehicles) {
          batch.set(doc(db, 'vehicles', v.id), stripUndefined(v));
        }
      }
      if (Array.isArray(data.data.appointments)) {
        for (const a of data.data.appointments) {
          batch.set(doc(db, 'appointments', a.id), stripUndefined(a));
        }
      }
      if (Array.isArray(data.data.transactions)) {
        for (const t of data.data.transactions) {
          batch.set(doc(db, 'transactions', t.id), stripUndefined(t));
        }
      }

      await batch.commit();
      return { success: true, message: 'Dados restaurados com sucesso no banco oficial Firestore.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async resetDefaultData(): Promise<{ success: boolean; message: string }> {
    const path = 'backup/reset';
    try {
      // Clear data
      await this.clearFinancialTransactions();

      const [cSnap, vSnap, aSnap] = await Promise.all([
        getDocs(collection(db, 'clients')),
        getDocs(collection(db, 'vehicles')),
        getDocs(collection(db, 'appointments')),
      ]);

      const batch = writeBatch(db);
      cSnap.docs.forEach((d) => batch.delete(d.ref));
      vSnap.docs.forEach((d) => batch.delete(d.ref));
      aSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      return { success: true, message: 'Banco de dados oficial limpo com sucesso para início operacional.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },
};
