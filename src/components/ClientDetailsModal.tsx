import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Car, Calendar, DollarSign, Plus, ArrowRight, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api.ts';
import { Client, Appointment, Transaction, Vehicle } from '../types/index.ts';
import { formatCurrency, formatPlate, formatPhone, formatDateTime, APPOINTMENT_STATUS_INFO, TRANSACTION_STATUS_INFO } from '../utils/formatters.ts';

interface ClientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  onNewAppointment?: (clientId: string, vehicleId?: string) => void;
  onAddVehicle?: (clientId: string) => void;
  onEditClient?: (client: Client) => void;
}

export const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({
  isOpen,
  onClose,
  clientId,
  onNewAppointment,
  onAddVehicle,
  onEditClient,
}) => {
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<(Client & { appointments: Appointment[]; transactions: Transaction[] }) | null>(null);
  const [activeTab, setActiveTab] = useState<'veiculos' | 'historico' | 'financeiro'>('veiculos');

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
    if (isOpen && clientId) {
      loadDetails();
    }
  }, [isOpen, clientId]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const data = await api.getClientById(clientId);
      setClientData(data);
    } catch (err) {
      console.error('Error loading client details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalInvoiced = clientData?.transactions
    .filter((t) => t.type === 'income' && t.status !== 'cancelado')
    .reduce((acc, t) => acc + t.amount, 0) || 0;

  const totalPaid = clientData?.transactions
    .filter((t) => t.type === 'income' && t.status !== 'cancelado')
    .reduce((acc, t) => acc + (t.paid_amount || 0), 0) || 0;

  const totalPending = Math.max(0, totalInvoiced - totalPaid);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#131D2E] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* Pinned Sticky Header - Always visible at top without scrolling */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-[#182C45] text-white border-b border-white/10 shadow-xs z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm">
              {clientData?.name ? clientData.name.substring(0, 2).toUpperCase() : <User className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-semibold">{clientData?.name || 'Carregando cliente...'}</h2>
              <div className="flex items-center gap-3 text-xs text-blue-200 mt-0.5">
                {clientData?.phone && <span>{formatPhone(clientData.phone)}</span>}
                {clientData?.email && <span>{clientData.email}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {clientData && onEditClient && (
              <button
                type="button"
                onClick={() => {
                  onEditClient(clientData);
                  onClose();
                }}
                className="px-2.5 py-1 text-xs text-blue-200 hover:text-white bg-white/10 hover:bg-white/20 rounded transition-colors"
              >
                Editar
              </button>
            )}
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
        </div>

        {/* Financial Highlights Bar */}
        <div className="grid grid-cols-3 bg-slate-50 dark:bg-[#101928] border-b border-slate-200 dark:border-slate-800 px-6 py-2.5 text-xs shrink-0 transition-colors">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Total Faturado</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(totalInvoiced)}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Total Efetivamente Pago</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">{formatCurrency(totalPaid)}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Pendências a Receber</span>
            <span className={`font-semibold ${totalPending > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-400'}`}>
              {formatCurrency(totalPending)}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-[#131D2E] shrink-0 transition-colors">
          <button
            onClick={() => setActiveTab('veiculos')}
            className={`py-3 text-xs font-semibold border-b-2 mr-6 transition-colors flex items-center gap-1.5 ${
              activeTab === 'veiculos'
                ? 'border-[#182C45] dark:border-blue-400 text-[#182C45] dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Car className="w-4 h-4" />
            Veículos ({clientData?.vehicles?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`py-3 text-xs font-semibold border-b-2 mr-6 transition-colors flex items-center gap-1.5 ${
              activeTab === 'historico'
                ? 'border-[#182C45] dark:border-blue-400 text-[#182C45] dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Agendamentos & Serviços ({clientData?.appointments?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('financeiro')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'financeiro'
                ? 'border-[#182C45] dark:border-blue-400 text-[#182C45] dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Histórico Financeiro ({clientData?.transactions?.length || 0})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#182C45] dark:text-blue-400" />
              <p className="text-xs">Carregando dados completos...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: VEHICLES */}
              {activeTab === 'veiculos' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Garagem do Cliente</span>
                    {onAddVehicle && (
                      <button
                        type="button"
                        onClick={() => {
                          onAddVehicle(clientId);
                          onClose();
                        }}
                        className="text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar Veículo
                      </button>
                    )}
                  </div>

                  {(!clientData?.vehicles || clientData.vehicles.length === 0) ? (
                    <div className="text-center py-8 bg-slate-50 dark:bg-[#101928] border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 dark:text-slate-500 text-xs">
                      Nenhum veículo cadastrado para este cliente.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {clientData.vehicles.map((v) => (
                        <div
                          key={v.id}
                          className="p-3.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-[#18263D] hover:bg-slate-50 dark:hover:bg-[#1E2D44] transition-colors flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-mono font-bold text-xs px-2 py-0.5 bg-slate-900 dark:bg-black text-white rounded border border-transparent dark:border-slate-700 tracking-wider">
                                {formatPlate(v.plate)}
                              </span>
                              {v.year && <span className="text-[11px] text-slate-500 dark:text-slate-400">{v.year}</span>}
                            </div>
                            <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">{v.model}</div>
                            {v.color && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Cor: {v.color}</div>}
                            {v.notes && <div className="text-xs text-slate-600 dark:text-slate-300 italic mt-1">{v.notes}</div>}
                          </div>

                          {onNewAppointment && (
                            <button
                              type="button"
                              onClick={() => {
                                onNewAppointment(clientId, v.id);
                                onClose();
                              }}
                              className="mt-3 w-full py-1.5 text-xs font-semibold text-[#182C45] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded border border-blue-200 dark:border-blue-800/60 transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Calendar className="w-3.5 h-3.5" /> Agendar para este Carro
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: APPOINTMENTS & SERVICES */}
              {activeTab === 'historico' && (
                <div className="space-y-3">
                  {(!clientData?.appointments || clientData.appointments.length === 0) ? (
                    <div className="text-center py-8 bg-slate-50 dark:bg-[#101928] border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 dark:text-slate-500 text-xs">
                      Nenhum agendamento registrado até o momento.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {clientData.appointments.map((a) => {
                        const st = APPOINTMENT_STATUS_INFO[a.status];
                        return (
                          <div
                            key={a.id}
                            className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors bg-white dark:bg-[#18263D] flex items-center justify-between gap-4"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{a.service_name}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.bg} ${st.text} border ${st.border}`}>
                                  {st.label}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                                <span>{formatDateTime(a.scheduled_at)}</span>
                                {a.vehicle && (
                                  <span>
                                    • {a.vehicle.model} ({formatPlate(a.vehicle.plate)})
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                                {formatCurrency(a.final_amount ?? a.estimated_amount)}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                {a.final_amount !== null && a.final_amount !== undefined ? 'Final' : 'Previsto'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: FINANCIAL */}
              {activeTab === 'financeiro' && (
                <div className="space-y-3">
                  {(!clientData?.transactions || clientData.transactions.length === 0) ? (
                    <div className="text-center py-8 bg-slate-50 dark:bg-[#101928] border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 dark:text-slate-500 text-xs">
                      Nenhuma transação financeira vinculada a este cliente.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {clientData.transactions.map((tx) => {
                        const st = TRANSACTION_STATUS_INFO[tx.status];
                        return (
                          <div
                            key={tx.id}
                            className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-[#18263D] flex items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{tx.description}</div>
                              <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                                Categoria: {tx.category} • Vencimento: {tx.due_date || '-'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(tx.amount)}</div>
                              <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-medium mt-0.5 ${st.bg} ${st.text} border ${st.border}`}>
                                {st.label} ({formatCurrency(tx.paid_amount || 0)} pagos)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-[#101928] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 transition-colors">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Cliente cadastrado em {formatDateTime(clientData?.created_at)}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
