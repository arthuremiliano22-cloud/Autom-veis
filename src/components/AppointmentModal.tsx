import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertTriangle, User, Car, Plus, Loader2, Trash2 } from 'lucide-react';
import { api } from '../services/api.ts';
import { Appointment, Client, Vehicle, AppointmentStatus } from '../types/index.ts';
import { formatPlate, formatPhone } from '../utils/formatters.ts';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialAppointment?: Appointment | null;
  preselectedClientId?: string;
  preselectedVehicleId?: string;
  preselectedDate?: string;
}

const COMMON_SERVICES = [
  'Revisão Geral e Troca de Óleo',
  'Alinhamento 3D e Balanceamento',
  'Troca de Pastilhas de Freio',
  'Higienização Interna e Oxi-sanitização',
  'Polimento Técnico e Cristalização',
  'Troca de Amortecedores e Suspensão',
  'Diagnóstico Eletrônico / Scanner',
  'Revisão Periódica Preventiva',
  'Manutenção de Ar Condicionado',
];

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialAppointment,
  preselectedClientId,
  preselectedVehicleId,
  preselectedDate,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [clientId, setClientId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [serviceName, setServiceName] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState('');
  const [observations, setObservations] = useState('');
  const [status, setStatus] = useState<AppointmentStatus>('agendado');

  // Inline Quick Client Creation
  const [isCreatingNewClient, setIsCreatingNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // Inline Quick Vehicle Creation
  const [isCreatingNewVehicle, setIsCreatingNewVehicle] = useState(false);
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVehicleModel, setNewVehicleModel] = useState('');

  // Scheduling Conflict State
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      loadClients();
      setError(null);
      setConflictWarning(null);
      setShowDeleteConfirm(false);

      if (initialAppointment) {
        setClientId(initialAppointment.client_id);
        setVehicleId(initialAppointment.vehicle_id);
        const [d, t] = initialAppointment.scheduled_at.split('T');
        setDate(d);
        setTime(t ? t.substring(0, 5) : '09:00');
        setServiceName(initialAppointment.service_name);
        setEstimatedAmount(String(initialAppointment.estimated_amount || ''));
        setObservations(initialAppointment.observations || '');
        setStatus(initialAppointment.status);
        setIsCreatingNewClient(false);
        setIsCreatingNewVehicle(false);
      } else {
        const today = preselectedDate || new Date().toISOString().split('T')[0];
        setDate(today);
        setTime('09:00');
        setServiceName('');
        setEstimatedAmount('');
        setObservations('');
        setStatus('agendado');
        setIsCreatingNewClient(false);
        setIsCreatingNewVehicle(false);
        setNewClientName('');
        setNewClientPhone('');
        setNewVehiclePlate('');
        setNewVehicleModel('');

        if (preselectedClientId) {
          setClientId(preselectedClientId);
        } else {
          setClientId('');
        }

        if (preselectedVehicleId) {
          setVehicleId(preselectedVehicleId);
        } else {
          setVehicleId('');
        }
      }
    }
  }, [isOpen, initialAppointment, preselectedClientId, preselectedVehicleId, preselectedDate]);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const data = await api.getClients();
      setClients(data);

      if (data.length === 0 && !initialAppointment) {
        setIsCreatingNewClient(true);
        setIsCreatingNewVehicle(true);
      }

      // If preselected, match
      if (preselectedClientId && !clientId) {
        setClientId(preselectedClientId);
      }
    } catch (err: any) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoadingClients(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === clientId);
  const clientVehicles = selectedClient?.vehicles || [];

  // When client changes and has vehicles, auto-select first vehicle if none chosen
  useEffect(() => {
    if (selectedClient && selectedClient.vehicles && selectedClient.vehicles.length > 0 && !vehicleId) {
      setVehicleId(selectedClient.vehicles[0].id);
    }
  }, [selectedClient, vehicleId]);

  // Check for conflicts whenever date or time changes
  useEffect(() => {
    if (!date || !time) return;

    const scheduledAt = `${date}T${time}:00`;
    const checkTimer = setTimeout(async () => {
      try {
        const res = await api.checkConflict(scheduledAt, initialAppointment?.id);
        if (res.hasConflict && res.conflicts.length > 0) {
          const first = res.conflicts[0];
          const conflictTime = first.scheduled_at.split('T')[1]?.substring(0, 5) || '';
          setConflictWarning(
            `Já existe outro agendamento neste horário (${conflictTime}): ${first.client?.name || 'Cliente'} — ${first.service_name}`
          );
        } else {
          setConflictWarning(null);
        }
      } catch (err) {
        console.error('Error checking conflict:', err);
      }
    }, 300);

    return () => clearTimeout(checkTimer);
  }, [date, time, initialAppointment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let activeClientId = clientId;
    let activeVehicleId = vehicleId;

    if (!date || !time) {
      setError('Data e horário são obrigatórios.');
      return;
    }

    if (!serviceName.trim()) {
      setError('Nome do serviço é obrigatório.');
      return;
    }

    setSaving(true);
    try {
      // Step 1: Create client inline if toggled
      if (isCreatingNewClient) {
        if (!newClientName.trim()) {
          throw new Error('Nome do novo cliente é obrigatório.');
        }
        const createdClient = await api.createClient({
          name: newClientName.trim(),
          phone: newClientPhone.trim() || undefined,
        });
        activeClientId = createdClient.id;
      } else if (!activeClientId) {
        throw new Error('Selecione um cliente ou cadastre um novo.');
      }

      // Step 2: Create vehicle inline if toggled or if client had no vehicles
      if (isCreatingNewVehicle || (!activeVehicleId && (newVehiclePlate || newVehicleModel))) {
        if (!newVehiclePlate.trim() || !newVehicleModel.trim()) {
          throw new Error('Placa e modelo do veículo são obrigatórios.');
        }
        const createdVeh = await api.createVehicle({
          client_id: activeClientId,
          plate: newVehiclePlate.trim(),
          model: newVehicleModel.trim(),
        });
        activeVehicleId = createdVeh.id;
      } else if (!activeVehicleId) {
        throw new Error('Selecione ou cadastre um veículo para este agendamento.');
      }

      const scheduledAt = `${date}T${time}:00`;
      const numEstimated = parseFloat(estimatedAmount.replace(',', '.')) || 0;

      if (initialAppointment) {
        await api.updateAppointment(initialAppointment.id, {
          client_id: activeClientId,
          vehicle_id: activeVehicleId,
          scheduled_at: scheduledAt,
          service_name: serviceName.trim(),
          observations: observations.trim() || undefined,
          status,
          estimated_amount: numEstimated,
        });
      } else {
        await api.createAppointment({
          client_id: activeClientId,
          vehicle_id: activeVehicleId,
          scheduled_at: scheduledAt,
          service_name: serviceName.trim(),
          observations: observations.trim() || undefined,
          status,
          estimated_amount: numEstimated,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar agendamento.');
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!initialAppointment) return;

    setDeleting(true);
    setError(null);
    try {
      await api.deleteAppointment(initialAppointment.id);
      setShowDeleteConfirm(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir agendamento.');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#131D2E] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden transition-colors">
        {/* Pinned Sticky Header - Always visible at top without scrolling */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-[#182C45] text-white border-b border-white/10 shadow-xs z-10">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-300" />
              {initialAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
            </h2>
            <p className="text-xs text-blue-200 mt-0.5">
              {initialAppointment ? 'Altere as informações do compromisso' : 'Preencha os dados do cliente, veículo e serviço'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            title="Fechar janela (Esc)"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body with scrollable content and pinned footer */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {conflictWarning && (
            <div className="p-3 text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="font-semibold">Aviso de Horário Conflitante</p>
                <p className="mt-0.5">{conflictWarning}</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">Você pode salvar normalmente se desejar encaixar o cliente.</p>
              </div>
            </div>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                Data do Agendamento *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                Horário Previsto *
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Client Selection / Inline Creation */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 bg-slate-50/70 dark:bg-[#101928]/70">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                Cliente *
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNewClient(!isCreatingNewClient);
                  if (!isCreatingNewClient) {
                    setIsCreatingNewVehicle(true);
                  }
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
              >
                {isCreatingNewClient ? '← Selecionar cliente existente' : '+ Cadastrar novo cliente'}
              </button>
            </div>

            {isCreatingNewClient ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Nome completo do cliente *"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Telefone / WhatsApp"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <select
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value);
                    setVehicleId('');
                  }}
                  className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
                  disabled={loadingClients}
                >
                  <option value="">
                    {clients.length === 0 ? 'Nenhum cliente cadastrado ainda' : 'Selecione um cliente...'}
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${formatPhone(c.phone)})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Vehicle Selection / Inline Creation */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 bg-slate-50/70 dark:bg-[#101928]/70">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                Veículo *
              </label>
              {!isCreatingNewClient && selectedClient && (
                <button
                  type="button"
                  onClick={() => setIsCreatingNewVehicle(!isCreatingNewVehicle)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
                >
                  {isCreatingNewVehicle ? '← Escolher veículo da lista' : '+ Cadastrar novo veículo para este cliente'}
                </button>
              )}
            </div>

            {isCreatingNewClient || isCreatingNewVehicle || clientVehicles.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Placa (ex: BRA2E19) *"
                    value={newVehiclePlate}
                    onChange={(e) => setNewVehiclePlate(e.target.value.toUpperCase())}
                    className="w-full text-sm uppercase px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Modelo (ex: Corolla XEi 2.0) *"
                    value={newVehicleModel}
                    onChange={(e) => setNewVehicleModel(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
                  disabled={!clientId}
                >
                  <option value="">Selecione o veículo...</option>
                  {clientVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {formatPlate(v.plate)} — {v.model} {v.color ? `(${v.color})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Service Name & Suggestions */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Serviço a Realizar *
            </label>
            <input
              type="text"
              required
              placeholder="Descreva o serviço (ex: Troca de pastilhas dianteiras)"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
            />
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_SERVICES.slice(0, 4).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setServiceName(s)}
                  className="text-[11px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Amount & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Valor Previsto (R$)
              </label>
              <input
                type="text"
                placeholder="0,00"
                value={estimatedAmount}
                onChange={(e) => setEstimatedAmount(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Situação do Agendamento
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
              >
                <option value="agendado">Agendado</option>
                <option value="confirmado">Confirmado</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Observações Adicionais (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Instruções para a equipe, peças a encomendar, horário limite de entrega..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Actions - Pinned at bottom */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#101928]">
          {initialAppointment ? (
            showDeleteConfirm ? (
              <div className="flex flex-wrap items-center gap-2 p-2 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 rounded-lg">
                <span className="text-xs font-semibold text-rose-800 dark:text-rose-200">
                  Confirmar exclusão definitiva?
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={executeDelete}
                    disabled={deleting}
                    className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 rounded transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Sim, Excluir
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={saving || deleting}
                className="px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-rose-100 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir Agendamento
              </button>
            )
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || deleting}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || deleting}
              className="px-5 py-2 text-sm font-medium text-white bg-[#182C45] hover:bg-[#122237] dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {initialAppointment ? 'Salvar Alterações' : 'Confirmar Agendamento'}
            </button>
          </div>
        </div>
      </form>
      </div>
    </div>
  );
};
