import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  Clock,
  Car,
  User,
  ExternalLink,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { Appointment } from '../types/index.ts';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPlate,
  APPOINTMENT_STATUS_INFO,
  TRANSACTION_STATUS_INFO,
} from '../utils/formatters.ts';

interface ServicesViewProps {
  appointments: Appointment[];
  onOpenVehicleTimeline: (vehicleId: string) => void;
  onEditAppointment: (apt: Appointment) => void;
  onCompleteAppointment: (apt: Appointment) => void;
  onDeleteAppointment?: (apt: Appointment) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  appointments,
  onOpenVehicleTimeline,
  onEditAppointment,
  onCompleteAppointment,
  onDeleteAppointment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  const filtered = useMemo(() => {
    return appointments.filter((apt) => {
      if (statusFilter !== 'todos' && apt.status !== statusFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const clientName = apt.client?.name.toLowerCase() || '';
        const plate = apt.vehicle?.plate.toLowerCase() || '';
        const model = apt.vehicle?.model.toLowerCase() || '';
        const service = apt.service_name.toLowerCase();

        if (
          !clientName.includes(q) &&
          !plate.includes(q) &&
          !model.includes(q) &&
          !service.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [appointments, statusFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="bg-white dark:bg-[#131D2E] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Pesquisar por cliente, placa (ex: BRA2E19) ou nome do serviço..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-white dark:bg-[#18263D] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none bg-white dark:bg-[#18263D]"
          >
            <option value="todos">Todos os Serviços</option>
            <option value="concluido">Apenas Concluídos</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="confirmado">Confirmados</option>
            <option value="agendado">Agendados</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white dark:bg-[#131D2E] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-[#101928] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
          <span>Histórico Operacional de Serviços ({filtered.length})</span>
          <span className="text-slate-500 dark:text-slate-400 font-normal">
            Dica: clique na placa para abrir a linha do tempo completa do carro
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-[#101928]/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Placa / Veículo</th>
                <th className="py-3 px-4">Serviço Realizado</th>
                <th className="py-3 px-4 text-right">Valor Previsto</th>
                <th className="py-3 px-4 text-right">Valor Final</th>
                <th className="py-3 px-4 text-center">Status Serviço</th>
                <th className="py-3 px-4 text-center">Financeiro</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    {appointments.length === 0 ? (
                      <div className="max-w-md mx-auto space-y-2">
                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#182C45] dark:text-blue-400 flex items-center justify-center mx-auto">
                          <Wrench className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          Nenhum serviço registrado ainda
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          O histórico operacional e a linha do tempo dos veículos serão exibidos aqui à medida que os atendimentos forem realizados.
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 text-xs">
                        Nenhum serviço encontrado para o filtro selecionado.
                      </span>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((apt) => {
                  const st = APPOINTMENT_STATUS_INFO[apt.status];
                  const tx = apt.transaction;
                  const txStatus = tx ? TRANSACTION_STATUS_INFO[tx.status] : null;

                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/80 dark:hover:bg-[#1A273D]/60 transition-colors">
                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatDateTime(apt.scheduled_at)}
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {apt.client?.name || 'Cliente'}
                      </td>

                      {/* Vehicle & Plate */}
                      <td className="py-3.5 px-4">
                        {apt.vehicle ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onOpenVehicleTimeline(apt.vehicle_id)}
                              className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-900 dark:bg-black text-white hover:bg-blue-900 dark:hover:bg-blue-950 border border-transparent dark:border-slate-700 rounded tracking-wider cursor-pointer"
                              title="Ver linha do tempo deste carro"
                            >
                              {formatPlate(apt.vehicle.plate)}
                            </button>
                            <span className="text-slate-600 dark:text-slate-300 truncate max-w-[140px]">
                              {apt.vehicle.model}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* Service */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{apt.service_name}</div>
                        {apt.observations && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-0.5 line-clamp-1">
                            {apt.observations}
                          </div>
                        )}
                      </td>

                      {/* Previsto */}
                      <td className="py-3.5 px-4 text-right text-slate-600 dark:text-slate-400">
                        {formatCurrency(apt.estimated_amount)}
                      </td>

                      {/* Final */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                        {apt.final_amount !== null && apt.final_amount !== undefined
                          ? formatCurrency(apt.final_amount)
                          : '-'}
                      </td>

                      {/* Service Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${st.bg} ${st.text} border ${st.border}`}
                        >
                          {st.label}
                        </span>
                      </td>

                      {/* Financial Status */}
                      <td className="py-3.5 px-4 text-center">
                        {txStatus ? (
                          <span
                            className={`inline-block text-[10px] px-2 py-0.5 rounded font-medium ${txStatus.bg} ${txStatus.text} border ${txStatus.border}`}
                          >
                            {txStatus.label}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">Não faturado</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                        {apt.status !== 'concluido' && apt.status !== 'cancelado' && (
                          <button
                            type="button"
                            onClick={() => onCompleteAppointment(apt)}
                            className="px-2 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-800/60 rounded transition-colors"
                          >
                            Concluir
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onEditAppointment(apt)}
                          className="px-2 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded border border-blue-200 dark:border-blue-800/60 transition-colors"
                        >
                          Editar
                        </button>
                        {onDeleteAppointment && (
                          <button
                            type="button"
                            onClick={() => onDeleteAppointment(apt)}
                            className="px-2 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-rose-100 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded border border-rose-200 dark:border-rose-800/60 transition-colors"
                          >
                            Excluir
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
