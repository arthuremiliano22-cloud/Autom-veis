import {
  Client,
  Vehicle,
  Appointment,
  Transaction,
  StoreSettings,
  DashboardStats,
  AppointmentStatus,
  TransactionStatus,
  TransactionType,
  PaymentMethod,
} from '../types/index.ts';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Erro ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.error) {
        errorMsg = errorData.error;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // --- Dashboard ---
  getDashboard: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<{
      stats: DashboardStats;
      todayAppointments: Appointment[];
      pendingTransactions: Transaction[];
    }>(`/api/dashboard${qs}`);
  },

  // --- Search ---
  search: (q: string) => {
    return request<{
      clients: Client[];
      vehicles: Vehicle[];
      appointments: Appointment[];
    }>(`/api/search?q=${encodeURIComponent(q)}`);
  },

  // --- Settings ---
  getSettings: () => request<StoreSettings>('/api/settings'),
  updateSettings: (data: Partial<StoreSettings>) =>
    request<StoreSettings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // --- Clients ---
  getClients: (query?: string) => {
    const qs = query ? `?q=${encodeURIComponent(query)}` : '';
    return request<Client[]>(`/api/clients${qs}`);
  },
  getClientById: (id: string) =>
    request<Client & { appointments: Appointment[]; transactions: Transaction[] }>(`/api/clients/${id}`),
  createClient: (data: {
    name: string;
    phone?: string;
    email?: string;
    notes?: string;
    vehiclePlate?: string;
    vehicleModel?: string;
    vehicleYear?: string;
    vehicleColor?: string;
  }) =>
    request<Client>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateClient: (id: string, data: Partial<Client>) =>
    request<Client>(`/api/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteClient: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/clients/${id}`, {
      method: 'DELETE',
    }),

  // --- Vehicles ---
  getVehicles: (clientId?: string) => {
    const qs = clientId ? `?clientId=${encodeURIComponent(clientId)}` : '';
    return request<Vehicle[]>(`/api/vehicles${qs}`);
  },
  getVehicleById: (id: string) => request<Vehicle>(`/api/vehicles/${id}`),
  getVehicleHistory: (id: string) =>
    request<{
      vehicle: Vehicle;
      appointments: Appointment[];
      transactions: Transaction[];
    }>(`/api/vehicles/${id}/history`),
  createVehicle: (data: {
    client_id: string;
    plate: string;
    model: string;
    year?: string;
    color?: string;
    notes?: string;
  }) =>
    request<Vehicle>('/api/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateVehicle: (id: string, data: Partial<Vehicle>) =>
    request<Vehicle>(`/api/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteVehicle: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/vehicles/${id}`, {
      method: 'DELETE',
    }),

  // --- Appointments ---
  getAppointments: (params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    status?: AppointmentStatus;
    q?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.date) query.append('date', params.date);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.status) query.append('status', params.status);
    if (params?.q) query.append('q', params.q);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<Appointment[]>(`/api/appointments${qs}`);
  },
  getAppointmentById: (id: string) => request<Appointment>(`/api/appointments/${id}`),
  createAppointment: (data: {
    client_id: string;
    vehicle_id: string;
    scheduled_at: string;
    service_name: string;
    observations?: string;
    status?: AppointmentStatus;
    estimated_amount: number;
    final_amount?: number | null;
  }) =>
    request<Appointment>('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAppointment: (id: string, data: Partial<Appointment>) =>
    request<Appointment>(`/api/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteAppointment: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/appointments/${id}`, {
      method: 'DELETE',
    }),
  completeAppointment: (
    id: string,
    data: {
      final_amount: number;
      create_transaction?: boolean;
      is_paid?: boolean;
      paid_at?: string;
      due_date?: string;
      payment_method?: PaymentMethod;
    }
  ) =>
    request<Appointment>(`/api/appointments/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  checkConflict: (scheduled_at: string, exclude_id?: string) =>
    request<{ conflicts: Appointment[]; hasConflict: boolean }>('/api/appointments/check-conflict', {
      method: 'POST',
      body: JSON.stringify({ scheduled_at, exclude_id }),
    }),

  // --- Transactions ---
  getTransactions: (params?: {
    type?: TransactionType;
    status?: TransactionStatus;
    category?: string;
    startDate?: string;
    endDate?: string;
    clientId?: string;
    appointmentId?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.type) query.append('type', params.type);
    if (params?.status) query.append('status', params.status);
    if (params?.category) query.append('category', params.category);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.clientId) query.append('clientId', params.clientId);
    if (params?.appointmentId) query.append('appointmentId', params.appointmentId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<Transaction[]>(`/api/transactions${qs}`);
  },
  createTransaction: (data: {
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
  }) =>
    request<Transaction>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTransaction: (id: string, data: Partial<Transaction>) =>
    request<Transaction>(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTransaction: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/transactions/${id}`, {
      method: 'DELETE',
    }),
  clearFinancialTransactions: () =>
    request<{ success: boolean; message: string }>('/api/transactions/clear', {
      method: 'POST',
    }),
  addPayment: (
    transactionId: string,
    data: {
      amount: number;
      paid_at: string;
      payment_method?: PaymentMethod;
      notes?: string;
    }
  ) =>
    request<{ payment: any; transaction: Transaction }>(`/api/transactions/${transactionId}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // --- Backup & Restore ---
  exportBackup: () => request<any>('/api/backup'),
  restoreBackup: (data: any) =>
    request<{ success: boolean; message: string }>('/api/backup/restore', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  resetDefaultData: () =>
    request<{ success: boolean; message: string }>('/api/backup/reset', {
      method: 'POST',
    }),
};
