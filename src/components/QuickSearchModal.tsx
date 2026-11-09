import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Car, User, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api.ts';
import { Client, Vehicle, Appointment } from '../types/index.ts';
import { formatPlate, formatPhone, formatDateTime, APPOINTMENT_STATUS_INFO } from '../utils/formatters.ts';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClient?: (client: Client) => void;
  onSelectVehicle?: (vehicle: Vehicle) => void;
  onSelectAppointment?: (apt: Appointment) => void;
  onNewAppointmentWithVehicle?: (vehicle: Vehicle) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectClient,
  onSelectVehicle,
  onSelectAppointment,
  onNewAppointmentWithVehicle,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    clients: Client[];
    vehicles: Vehicle[];
    appointments: Appointment[];
  }>({ clients: [], vehicles: [], appointments: [] });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults({ clients: [], vehicles: [], appointments: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ clients: [], vehicles: [], appointments: [] });
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.search(query);
        setResults(data);
      } catch (err) {
        console.error('Error searching:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults = results.clients.length + results.vehicles.length + results.appointments.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#131D2E] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] transition-colors">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 gap-3 bg-white dark:bg-[#131D2E]">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por placa (ex: BRA2E19), nome do cliente, veículo ou serviço..."
            className="w-full text-base bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
          />
          {loading ? (
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin shrink-0" />
          ) : query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
              ESC
            </kbd>
          )}
        </div>

        {/* Results Area */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          {!query.trim() ? (
            <div className="text-center py-10 text-slate-400 dark:text-slate-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Digite uma placa, nome de cliente ou modelo de carro</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Busca instantânea em todo o sistema</p>
            </div>
          ) : totalResults === 0 && !loading ? (
            <div className="text-center py-10 text-slate-500 dark:text-slate-400">
              <p className="text-sm font-medium">Nenhum resultado encontrado para &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Verifique a digitação ou cadastre um novo registro</p>
            </div>
          ) : (
            <>
              {/* Vehicles Section */}
              {results.vehicles.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2 flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5" />
                    Veículos Encontrados ({results.vehicles.length})
                  </div>
                  <div className="space-y-1.5">
                    {results.vehicles.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-[#18263D] border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors group cursor-pointer"
                        onClick={() => {
                          if (onSelectVehicle) onSelectVehicle(v);
                          onClose();
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-xs px-2.5 py-1 bg-slate-900 dark:bg-black text-white rounded border border-slate-700 tracking-wider">
                            {formatPlate(v.plate)}
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{v.model}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              Proprietário: {v.client?.name || 'Cliente'} {v.client?.phone ? `• ${formatPhone(v.client.phone)}` : ''}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {onNewAppointmentWithVehicle && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNewAppointmentWithVehicle(v);
                                onClose();
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-[#182C45] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded border border-blue-200 dark:border-blue-800/60"
                            >
                              + Agendar
                            </button>
                          )}
                          <ArrowRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clients Section */}
              {results.clients.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Clientes ({results.clients.length})
                  </div>
                  <div className="space-y-1.5">
                    {results.clients.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-[#18263D] border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors group cursor-pointer"
                        onClick={() => {
                          if (onSelectClient) onSelectClient(c);
                          onClose();
                        }}
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{c.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                            {c.phone && <span>{formatPhone(c.phone)}</span>}
                            {c.vehicles && c.vehicles.length > 0 && (
                              <span className="text-slate-600 dark:text-slate-400 font-medium">
                                • {c.vehicles.length} veículo(s): {c.vehicles.map((veh) => formatPlate(veh.plate)).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appointments Section */}
              {results.appointments.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Agendamentos & Serviços ({results.appointments.length})
                  </div>
                  <div className="space-y-1.5">
                    {results.appointments.map((a) => {
                      const st = APPOINTMENT_STATUS_INFO[a.status];
                      return (
                        <div
                          key={a.id}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-[#18263D] border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors group cursor-pointer"
                          onClick={() => {
                            if (onSelectAppointment) onSelectAppointment(a);
                            onClose();
                          }}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{a.service_name}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.bg} ${st.text} border ${st.border}`}>
                                {st.label}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {a.client?.name} • {a.vehicle?.model} ({formatPlate(a.vehicle?.plate)}) • {formatDateTime(a.scheduled_at)}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-[#101928] border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex justify-between items-center transition-colors">
          <span>Pressione <kbd className="font-semibold text-slate-700 dark:text-slate-300">ESC</kbd> para fechar</span>
          <span>Dica: use <kbd className="font-semibold text-slate-700 dark:text-slate-300">Ctrl + K</kbd> para abrir a qualquer momento</span>
        </div>
      </div>
    </div>
  );
};
