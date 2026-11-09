import { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { db } from './db.ts';

// Helper to parse JSON body from incoming message
async function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({});
      }
    });
  });
}

function sendJson(res: ServerResponse, data: any, statusCode = 200) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function sendError(res: ServerResponse, message: string, statusCode = 400) {
  sendJson(res, { error: message }, statusCode);
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse, next?: () => void) {
  const reqUrl = req.url || '';
  if (!reqUrl.startsWith('/api')) {
    if (next) return next();
    return sendError(res, 'Not found', 404);
  }

  const parsedUrl = new URL(reqUrl, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method?.toUpperCase();
  const query = Object.fromEntries(parsedUrl.searchParams.entries());

  try {
    // --- DASHBOARD ---
    if (pathname === '/api/dashboard' && method === 'GET') {
      const stats = db.getDashboardStats(
        undefined,
        query.startDate && query.endDate ? { startDate: query.startDate, endDate: query.endDate } : undefined
      );

      const todayStr = new Date().toISOString().split('T')[0];
      const todayAppointments = db.getAppointments(undefined, { date: todayStr });
      const pendingTransactions = db.getTransactions(undefined, { status: 'pendente' }).slice(0, 5);
      const overdueTransactions = db.getTransactions(undefined, { status: 'vencido' }).slice(0, 5);

      return sendJson(res, {
        stats,
        todayAppointments,
        pendingTransactions: [...overdueTransactions, ...pendingTransactions].slice(0, 8),
      });
    }

    // --- SEARCH ---
    if (pathname === '/api/search' && method === 'GET') {
      const q = query.q || '';
      const results = db.searchGlobal(q);
      return sendJson(res, results);
    }

    // --- SETTINGS ---
    if (pathname === '/api/settings') {
      if (method === 'GET') {
        const settings = db.getSettings();
        return sendJson(res, settings);
      }
      if (method === 'PUT') {
        const body = await parseBody(req);
        const updated = db.updateSettings(body);
        return sendJson(res, updated);
      }
    }

    // --- CLIENTS ---
    if (pathname === '/api/clients') {
      if (method === 'GET') {
        const clients = db.getClients(undefined, query.q);
        return sendJson(res, clients);
      }
      if (method === 'POST') {
        const body = await parseBody(req);
        if (!body.name || !body.name.trim()) {
          return sendError(res, 'Nome do cliente é obrigatório');
        }
        const newClient = db.createClient(body);

        // If an initial vehicle was provided in the client form, create it
        if (body.vehiclePlate && body.vehicleModel) {
          db.createVehicle({
            client_id: newClient.id,
            plate: body.vehiclePlate,
            model: body.vehicleModel,
            year: body.vehicleYear,
            color: body.vehicleColor,
          });
        }

        const freshClient = db.getClientById(newClient.id);
        return sendJson(res, freshClient || newClient, 201);
      }
    }

    // Specific Client: /api/clients/:id
    const clientMatch = pathname.match(/^\/api\/clients\/([a-zA-Z0-9_\-]+)$/);
    if (clientMatch) {
      const clientId = clientMatch[1];
      if (method === 'GET') {
        const client = db.getClientById(clientId);
        if (!client) return sendError(res, 'Cliente não encontrado', 404);

        const appointments = db.getAppointments(undefined).filter((a) => a.client_id === clientId);
        const transactions = db.getTransactions(undefined, { clientId });

        return sendJson(res, {
          ...client,
          appointments,
          transactions,
        });
      }
      if (method === 'PUT') {
        const body = await parseBody(req);
        const updated = db.updateClient(clientId, body);
        if (!updated) return sendError(res, 'Cliente não encontrado', 404);
        return sendJson(res, updated);
      }
      if (method === 'DELETE') {
        const deleted = db.deleteClient(clientId);
        if (!deleted) return sendError(res, 'Cliente não encontrado', 404);
        return sendJson(res, { success: true, message: 'Cliente excluído com sucesso' });
      }
    }

    // --- VEHICLES ---
    if (pathname === '/api/vehicles') {
      if (method === 'GET') {
        const vehicles = db.getVehicles(undefined, query.clientId);
        return sendJson(res, vehicles);
      }
      if (method === 'POST') {
        const body = await parseBody(req);
        if (!body.plate || !body.model || !body.client_id) {
          return sendError(res, 'Placa, modelo e cliente são obrigatórios');
        }
        const newVehicle = db.createVehicle(body);
        return sendJson(res, newVehicle, 201);
      }
    }

    const vehicleMatch = pathname.match(/^\/api\/vehicles\/([a-zA-Z0-9_\-]+)$/);
    if (vehicleMatch) {
      const vehicleId = vehicleMatch[1];
      if (method === 'GET') {
        const vehicle = db.getVehicleById(vehicleId);
        if (!vehicle) return sendError(res, 'Veículo não encontrado', 404);
        return sendJson(res, vehicle);
      }
      if (method === 'PUT') {
        const body = await parseBody(req);
        const updated = db.updateVehicle(vehicleId, body);
        if (!updated) return sendError(res, 'Veículo não encontrado', 404);
        return sendJson(res, updated);
      }
      if (method === 'DELETE') {
        const deleted = db.deleteVehicle(vehicleId);
        if (!deleted) return sendError(res, 'Veículo não encontrado', 404);
        return sendJson(res, { success: true, message: 'Veículo excluído com sucesso' });
      }
    }

    // Vehicle History / Timeline: /api/vehicles/:id/history
    const vehicleHistoryMatch = pathname.match(/^\/api\/vehicles\/([a-zA-Z0-9_\-]+)\/history$/);
    if (vehicleHistoryMatch && method === 'GET') {
      const vehicleId = vehicleHistoryMatch[1];
      const vehicle = db.getVehicleById(vehicleId);
      if (!vehicle) return sendError(res, 'Veículo não encontrado', 404);

      const appointments = db.getAppointments(undefined).filter((a) => a.vehicle_id === vehicleId);
      const transactions = db.getTransactions(undefined).filter((t) => t.vehicle_id === vehicleId);

      return sendJson(res, {
        vehicle,
        appointments,
        transactions,
      });
    }

    // --- APPOINTMENTS ---
    if (pathname === '/api/appointments') {
      if (method === 'GET') {
        const appointments = db.getAppointments(undefined, {
          date: query.date,
          startDate: query.startDate,
          endDate: query.endDate,
          status: query.status as any,
          query: query.q,
        });
        return sendJson(res, appointments);
      }
      if (method === 'POST') {
        const body = await parseBody(req);
        if (!body.client_id || !body.vehicle_id || !body.scheduled_at || !body.service_name) {
          return sendError(res, 'Cliente, veículo, data/horário e serviço são obrigatórios');
        }

        const newAppointment = db.createAppointment(body);
        return sendJson(res, newAppointment, 201);
      }
    }

    // Check conflict: POST /api/appointments/check-conflict
    if (pathname === '/api/appointments/check-conflict' && method === 'POST') {
      const body = await parseBody(req);
      if (!body.scheduled_at) {
        return sendError(res, 'Data/horário é obrigatória para verificar conflito');
      }
      const conflicts = db.checkConflicts(body.scheduled_at, body.exclude_id);
      return sendJson(res, { conflicts, hasConflict: conflicts.length > 0 });
    }

    // Complete appointment: POST /api/appointments/:id/complete
    const completeMatch = pathname.match(/^\/api\/appointments\/([a-zA-Z0-9_\-]+)\/complete$/);
    if (completeMatch && method === 'POST') {
      const appointmentId = completeMatch[1];
      const body = await parseBody(req);

      const apt = db.getAppointmentById(appointmentId);
      if (!apt) return sendError(res, 'Agendamento não encontrado', 404);

      const finalAmount = body.final_amount !== undefined ? Number(body.final_amount) : apt.estimated_amount;

      // Update appointment status to 'concluido' and set final_amount
      const updatedApt = db.updateAppointment(appointmentId, {
        status: 'concluido',
        final_amount: finalAmount,
      });

      // If user chose to create income transaction
      if (body.create_transaction) {
        const existingTx = db.getTransactions(undefined, { appointmentId });
        if (existingTx.length === 0) {
          const client = db.getClientById(apt.client_id);
          const vehicle = db.getVehicleById(apt.vehicle_id);

          db.createTransaction({
            type: 'income',
            description: `Serviço: ${apt.service_name} - ${vehicle?.model || ''} (${vehicle?.plate || ''})`,
            category: 'Serviços',
            amount: finalAmount,
            due_date: body.due_date || new Date().toISOString().split('T')[0],
            status: body.is_paid ? 'pago' : 'pendente',
            payment_method: body.payment_method || 'pix',
            appointment_id: appointmentId,
            client_id: apt.client_id,
            vehicle_id: apt.vehicle_id,
            immediate_payment: body.is_paid
              ? {
                  amount: finalAmount,
                  paid_at: body.paid_at || new Date().toISOString().split('T')[0],
                  payment_method: body.payment_method || 'pix',
                  notes: 'Recebimento na conclusão do serviço',
                }
              : undefined,
          });
        }
      }

      const freshApt = db.getAppointmentById(appointmentId);
      return sendJson(res, freshApt || updatedApt);
    }

    // Specific appointment: /api/appointments/:id
    const appointmentMatch = pathname.match(/^\/api\/appointments\/([a-zA-Z0-9_\-]+)$/);
    if (appointmentMatch) {
      const appointmentId = appointmentMatch[1];
      if (method === 'GET') {
        const apt = db.getAppointmentById(appointmentId);
        if (!apt) return sendError(res, 'Agendamento não encontrado', 404);
        return sendJson(res, apt);
      }
      if (method === 'PUT') {
        const body = await parseBody(req);
        const updated = db.updateAppointment(appointmentId, body);
        if (!updated) return sendError(res, 'Agendamento não encontrado', 404);
        return sendJson(res, updated);
      }
      if (method === 'DELETE') {
        const deleted = db.deleteAppointment(appointmentId);
        if (!deleted) return sendError(res, 'Agendamento não encontrado', 404);
        return sendJson(res, { success: true, message: 'Agendamento excluído com sucesso' });
      }
    }

    // --- TRANSACTIONS ---
    if (pathname === '/api/transactions') {
      if (method === 'GET') {
        const transactions = db.getTransactions(undefined, {
          type: query.type as any,
          status: query.status as any,
          category: query.category,
          startDate: query.startDate,
          endDate: query.endDate,
          clientId: query.clientId,
          appointmentId: query.appointmentId,
        });
        return sendJson(res, transactions);
      }
      if (method === 'POST') {
        const body = await parseBody(req);
        if (!body.type || !body.description || body.amount === undefined) {
          return sendError(res, 'Tipo, descrição e valor são obrigatórios');
        }
        const newTx = db.createTransaction(body);
        return sendJson(res, newTx, 201);
      }
    }

    // Specific Transaction: /api/transactions/:id
    const transactionMatch = pathname.match(/^\/api\/transactions\/([a-zA-Z0-9_\-]+)$/);
    if (transactionMatch) {
      const txId = transactionMatch[1];
      if (method === 'GET') {
        const tx = db.getTransactionById(txId);
        if (!tx) return sendError(res, 'Transação não encontrada', 404);
        return sendJson(res, tx);
      }
      if (method === 'PUT') {
        const body = await parseBody(req);
        const updated = db.updateTransaction(txId, body);
        if (!updated) return sendError(res, 'Transação não encontrada', 404);
        return sendJson(res, updated);
      }
      if (method === 'DELETE') {
        const deleted = db.deleteTransaction(txId);
        if (!deleted) return sendError(res, 'Transação não encontrada', 404);
        return sendJson(res, { success: true, message: 'Lançamento financeiro excluído com sucesso' });
      }
    }

    if (pathname === '/api/transactions/clear' && method === 'POST') {
      db.clearFinancialTransactions();
      return sendJson(res, { success: true, message: 'Todos os lançamentos financeiros foram zerados com sucesso' });
    }

    // Add Payment to Transaction: POST /api/transactions/:id/payments
    const paymentMatch = pathname.match(/^\/api\/transactions\/([a-zA-Z0-9_\-]+)\/payments$/);
    if (paymentMatch && method === 'POST') {
      const txId = paymentMatch[1];
      const body = await parseBody(req);
      if (!body.amount || Number(body.amount) <= 0) {
        return sendError(res, 'Valor do pagamento deve ser maior que zero');
      }

      const payment = db.addPayment({
        transaction_id: txId,
        amount: Number(body.amount),
        paid_at: body.paid_at || new Date().toISOString().split('T')[0],
        payment_method: body.payment_method || 'pix',
        notes: body.notes,
      });

      const updatedTx = db.getTransactionById(txId);
      return sendJson(res, { payment, transaction: updatedTx }, 201);
    }

    // --- BACKUP & RESTORE ---
    if (pathname === '/api/backup') {
      if (method === 'GET') {
        const backup = db.exportData();
        return sendJson(res, backup);
      }
    }

    if (pathname === '/api/backup/restore' && method === 'POST') {
      const body = await parseBody(req);
      db.importData(body);
      return sendJson(res, { success: true, message: 'Dados restaurados com sucesso!' });
    }

    if (pathname === '/api/backup/reset' && method === 'POST') {
      db.resetToDefault();
      return sendJson(res, { success: true, message: 'Banco de dados restaurado para os dados padrão!' });
    }

    // Unhandled endpoint
    return sendError(res, `Rota da API não encontrada: ${pathname}`, 404);
  } catch (error: any) {
    console.error('API Error:', error);
    return sendError(res, error.message || 'Erro interno no servidor', 500);
  }
}
