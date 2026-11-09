import React, { useState, useEffect } from 'react';
import { X, Car, Calendar, User, Wrench, CheckCircle, Clock, DollarSign, Loader2 } from 'lucide-react';
import { api } from '../services/api.ts';
import { Vehicle, Appointment, Transaction } from '../types/index.ts';
import { formatCurrency, formatPlate, formatDateTime, APPOINTMENT_STATUS_INFO } from '../utils/formatters.ts';

interface VehicleTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  onNewAppointment?: (clientId: string, vehicleId: string) => void;
}

export const VehicleTimelineModal: React.FC<VehicleTimelineModalProps> = ({
  isOpen,
  onClose,
  vehicleId,
  onNewAppointment,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    vehicle: Vehicle;
    appointments: Appointment[];
    transactions: Transaction[];
  } | null>(null);

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
    if (isOpen && vehicleId) {
      loadHistory();
    }
  }, [isOpen, vehicleId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await api.getVehicleHistory(vehicleId);
      setData(res);
    } catch (err) {
      console.error('Error fetching vehicle history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#131D2E] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* Pinned Sticky Header - Always visible at top without scrolling */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-[#182C45] text-white border-b border-white/10 shadow-xs z-10">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-sm px-3 py-1 bg-white dark:bg-black text-[#182C45] dark:text-blue-300 rounded-md shadow-xs tracking-wider border border-transparent dark:border-slate-700">
              {formatPlate(data?.vehicle?.plate)}
            </span>
            <div>
              <h2 className="text-base font-semibold">{data?.vehicle?.model || 'Ficha do Veículo'}</h2>
              <p className="text-xs text-blue-200">
                {data?.vehicle?.color ? `${data.vehicle.color} • ` : ''}
                {data?.vehicle?.year ? `Ano ${data.vehicle.year} • ` : ''}
                Proprietário: {data?.vehicle?.client?.name || 'Cliente'}
              </p>
            </div>
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#182C45] dark:text-blue-400" />
              <p className="text-xs">Carregando linha do tempo do veículo...</p>
            </div>
          ) : (
            <>
              {/* Technical notes */}
              {data?.vehicle?.notes && (
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg text-xs text-blue-900 dark:text-blue-300">
                  <span className="font-semibold block mb-0.5">Observações Técnicas do Carro:</span>
                  {data.vehicle.notes}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  Linha do Tempo de Passagens na Loja / Oficina
                </h3>
                {onNewAppointment && data?.vehicle && (
                  <button
                    type="button"
                    onClick={() => {
                      onNewAppointment(data.vehicle.client_id, data.vehicle.id);
                      onClose();
                    }}
                    className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline"
                  >
                    + Novo Agendamento
                  </button>
                )}
              </div>

              {(!data?.appointments || data.appointments.length === 0) ? (
                <div className="text-center py-10 bg-slate-50 dark:bg-[#101928] border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 dark:text-slate-500 text-xs">
                  Este veículo ainda não possui serviços registrados.
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 space-y-6 my-2">
                  {data.appointments.map((a) => {
                    const st = APPOINTMENT_STATUS_INFO[a.status];
                    const isConcluded = a.status === 'concluido';

                    return (
                      <div key={a.id} className="relative group">
                        {/* Timeline dot */}
                        <div
                          className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#131D2E] ring-2 ${
                            isConcluded ? 'bg-emerald-600 ring-emerald-200 dark:ring-emerald-900' : 'bg-[#182C45] dark:bg-blue-500 ring-slate-200 dark:ring-blue-900/50'
                          }`}
                        />

                        <div className="p-3.5 bg-slate-50 dark:bg-[#18263D] border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {formatDateTime(a.scheduled_at)}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.bg} ${st.text} border ${st.border}`}
                            >
                              {st.label}
                            </span>
                          </div>

                          <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                            {a.service_name}
                          </div>

                          {a.observations && (
                            <div className="text-xs text-slate-600 dark:text-slate-300 italic mt-1 bg-white dark:bg-[#131D2E] p-2 rounded border border-slate-100 dark:border-slate-800">
                              &ldquo;{a.observations}&rdquo;
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                            <span className="text-slate-500 dark:text-slate-400">Valor do serviço:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {formatCurrency(a.final_amount ?? a.estimated_amount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-[#101928] border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0 transition-colors">
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
