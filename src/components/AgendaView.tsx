import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Plus,
  Clock,
  Car,
  User,
  CheckCircle,
  XCircle,
  Edit2,
  List,
  CalendarDays,
  Sun,
  Trash2,
  X,
  ExternalLink,
} from 'lucide-react';
import { Appointment, AppointmentStatus } from '../types/index.ts';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTime,
  formatPlate,
  APPOINTMENT_STATUS_INFO,
} from '../utils/formatters.ts';

interface AgendaViewProps {
  appointments: Appointment[];
  onNewAppointment: (preselectedDate?: string) => void;
  onEditAppointment: (apt: Appointment) => void;
  onCompleteAppointment: (apt: Appointment) => void;
  onCancelAppointment: (apt: Appointment) => void;
  onDeleteAppointment: (apt: Appointment) => void;
  onSelectVehicleHistory?: (vehicleId: string) => void;
}

type AgendaMode = 'hoje' | 'semana' | 'mes' | 'lista';

export const AgendaView: React.FC<AgendaViewProps> = ({
  appointments,
  onNewAppointment,
  onEditAppointment,
  onCompleteAppointment,
  onCancelAppointment,
  onDeleteAppointment,
  onSelectVehicleHistory,
}) => {
  const [mode, setMode] = useState<AgendaMode>('hoje');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  // Selected day for the Teams-style day popover in Month view
  const [expandedDayDate, setExpandedDayDate] = useState<string | null>(null);

  // Close day popover on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expandedDayDate) {
        setExpandedDayDate(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedDayDate]);

  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    if (mode === 'mes') {
      const prevDate = new Date(y, m - 2, Math.min(d, 28), 12, 0, 0);
      const prevY = prevDate.getFullYear();
      const prevM = String(prevDate.getMonth() + 1).padStart(2, '0');
      const prevD = String(prevDate.getDate()).padStart(2, '0');
      setSelectedDate(`${prevY}-${prevM}-${prevD}`);
    } else if (mode === 'semana') {
      const dateObj = new Date(y, m - 1, d, 12, 0, 0);
      dateObj.setDate(dateObj.getDate() - 7);
      const resY = dateObj.getFullYear();
      const resM = String(dateObj.getMonth() + 1).padStart(2, '0');
      const resD = String(dateObj.getDate()).padStart(2, '0');
      setSelectedDate(`${resY}-${resM}-${resD}`);
    } else {
      const dateObj = new Date(y, m - 1, d, 12, 0, 0);
      dateObj.setDate(dateObj.getDate() - 1);
      const resY = dateObj.getFullYear();
      const resM = String(dateObj.getMonth() + 1).padStart(2, '0');
      const resD = String(dateObj.getDate()).padStart(2, '0');
      setSelectedDate(`${resY}-${resM}-${resD}`);
    }
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    if (mode === 'mes') {
      const nextDate = new Date(y, m, Math.min(d, 28), 12, 0, 0);
      const nextY = nextDate.getFullYear();
      const nextM = String(nextDate.getMonth() + 1).padStart(2, '0');
      const nextD = String(nextDate.getDate()).padStart(2, '0');
      setSelectedDate(`${nextY}-${nextM}-${nextD}`);
    } else if (mode === 'semana') {
      const dateObj = new Date(y, m - 1, d, 12, 0, 0);
      dateObj.setDate(dateObj.getDate() + 7);
      const resY = dateObj.getFullYear();
      const resM = String(dateObj.getMonth() + 1).padStart(2, '0');
      const resD = String(dateObj.getDate()).padStart(2, '0');
      setSelectedDate(`${resY}-${resM}-${resD}`);
    } else {
      const dateObj = new Date(y, m - 1, d, 12, 0, 0);
      dateObj.setDate(dateObj.getDate() + 1);
      const resY = dateObj.getFullYear();
      const resM = String(dateObj.getMonth() + 1).padStart(2, '0');
      const resD = String(dateObj.getDate()).padStart(2, '0');
      setSelectedDate(`${resY}-${resM}-${resD}`);
    }
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const formattedMonthTitle = useMemo(() => {
    const [y, m] = selectedDate.split('-').map(Number);
    const d = new Date(y, m - 1, 1, 12, 0, 0);
    const str = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, [selectedDate]);

  const weekDays = useMemo(() => {
    const curr = new Date(`${selectedDate}T12:00:00`);
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(curr.setDate(diff));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      days.push(nextDay.toISOString().split('T')[0]);
    }
    return days;
  }, [selectedDate]);

  // Microsoft Teams 7-Column Calendar Month Matrix
  const monthDays = useMemo(() => {
    const [y, m] = selectedDate.split('-').map(Number);
    const pad = (n: number) => String(n).padStart(2, '0');

    // First day of current month (at noon to avoid timezone shift)
    const firstDay = new Date(y, m - 1, 1, 12, 0, 0);
    const startDayOfWeek = firstDay.getDay(); // 0 = Domingo, 1 = Segunda, ...

    // Total days in current month
    const lastDay = new Date(y, m, 0, 12, 0, 0);
    const totalDaysInMonth = lastDay.getDate();

    // Total days in previous month
    const prevMonthLastDay = new Date(y, m - 1, 0, 12, 0, 0).getDate();

    const todayStr = new Date().toISOString().split('T')[0];

    const days: {
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
    }[] = [];

    // Leading days from previous month
    const prevYear = m === 1 ? y - 1 : y;
    const prevMonth = m === 1 ? 12 : m - 1;
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const dateStr = `${prevYear}-${pad(prevMonth)}-${pad(dayNum)}`;
      days.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
      });
    }

    // Days in current month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateStr = `${y}-${pad(m)}-${pad(day)}`;
      days.push({
        dateStr,
        dayNum: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
      });
    }

    // Trailing days from next month to complete standard weeks
    const remaining = (7 - (days.length % 7)) % 7;
    const nextYear = m === 12 ? y + 1 : y;
    const nextMonth = m === 12 ? 1 : m + 1;
    for (let day = 1; day <= remaining; day++) {
      const dateStr = `${nextYear}-${pad(nextMonth)}-${pad(day)}`;
      days.push({
        dateStr,
        dayNum: day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
      });
    }

    return days;
  }, [selectedDate]);

  const monthDaySet = useMemo(() => new Set(monthDays.map((d) => d.dateStr)), [monthDays]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
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

      if (statusFilter !== 'todos' && apt.status !== statusFilter) {
        return false;
      }

      if (mode === 'hoje') {
        return apt.scheduled_at.startsWith(selectedDate);
      } else if (mode === 'semana') {
        const aptDate = apt.scheduled_at.split('T')[0];
        return weekDays.includes(aptDate);
      } else if (mode === 'mes') {
        const aptDate = apt.scheduled_at.split('T')[0];
        return monthDaySet.has(aptDate);
      }
      return true;
    });
  }, [appointments, searchQuery, statusFilter, mode, selectedDate, weekDays, monthDaySet]);

  // Statistics for Month Overview
  const monthStats = useMemo(() => {
    let concluded = 0;
    let scheduled = 0;
    let inProgress = 0;
    let totalValue = 0;

    filteredAppointments.forEach((apt) => {
      if (apt.status === 'concluido') concluded++;
      else if (apt.status === 'agendado' || apt.status === 'confirmado') scheduled++;
      else if (apt.status === 'em_andamento') inProgress++;

      if (apt.status !== 'cancelado') {
        totalValue += apt.final_amount ?? apt.estimated_amount ?? 0;
      }
    });

    return {
      total: filteredAppointments.length,
      concluded,
      scheduled,
      inProgress,
      totalValue,
    };
  }, [filteredAppointments]);

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="bg-white dark:bg-[#131D2E] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4 transition-colors">
        {/* Mode Switcher */}
        <div className="flex bg-slate-100 dark:bg-[#162235] p-1 rounded-lg">
          <button
            onClick={() => setMode('hoje')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'hoje'
                ? 'bg-white dark:bg-[#20314A] text-[#182C45] dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            Hoje
          </button>
          <button
            onClick={() => setMode('semana')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'semana'
                ? 'bg-white dark:bg-[#20314A] text-[#182C45] dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Semana
          </button>
          <button
            onClick={() => setMode('mes')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'mes'
                ? 'bg-white dark:bg-[#20314A] text-[#182C45] dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Mês
          </button>
          <button
            onClick={() => setMode('lista')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'lista'
                ? 'bg-white dark:bg-[#20314A] text-[#182C45] dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Lista
          </button>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1A263B] transition-colors cursor-pointer"
            title={mode === 'mes' ? 'Mês Anterior' : mode === 'semana' ? 'Semana Anterior' : 'Dia Anterior'}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1A263B] rounded-lg transition-colors cursor-pointer"
          >
            Hoje
          </button>

          {mode === 'mes' ? (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#162235] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{formattedMonthTitle}</span>
            </div>
          ) : (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 dark:bg-[#162235] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1A263B] transition-colors cursor-pointer"
            title={mode === 'mes' ? 'Próximo Mês' : mode === 'semana' ? 'Próxima Semana' : 'Próximo Dia'}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onNewAppointment(selectedDate)}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#182C45] dark:bg-blue-600 hover:bg-[#122237] dark:hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          + Novo Agendamento
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#131D2E] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Pesquisar por cliente, placa (ex: BRA2E19) ou serviço..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-[#162235] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none bg-white dark:bg-[#162235]"
          >
            <option value="todos">Todos os Status</option>
            <option value="agendado">Agendado</option>
            <option value="confirmado">Confirmado</option>
            <option value="em_andamento">Em andamento</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {/* MODE 1: HOJE (Day View) */}
      {mode === 'hoje' && (
        <div className="bg-white dark:bg-[#131D2E] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
          <div className="px-5 py-3.5 bg-slate-50 dark:bg-[#162235] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Agendamentos para {formatDate(selectedDate)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {filteredAppointments.length} agendamento(s)
            </span>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500">
              <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#182C45] dark:text-blue-400" />
              <p className="text-sm font-medium">Nenhum agendamento para este dia.</p>
              <button
                onClick={() => onNewAppointment(selectedDate)}
                className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-[#182C45] dark:bg-blue-600 rounded-lg shadow-xs transition-colors"
              >
                + Agendar agora
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAppointments.map((apt) => {
                const st = APPOINTMENT_STATUS_INFO[apt.status];
                const isCancelled = apt.status === 'cancelado';
                const isConcluded = apt.status === 'concluido';

                return (
                  <div
                    key={apt.id}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                      isCancelled
                        ? 'bg-slate-50/70 dark:bg-slate-900/40 opacity-60'
                        : 'hover:bg-slate-50/80 dark:hover:bg-[#18263D]'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Time pill */}
                      <div className="text-center w-16 shrink-0 py-2 bg-slate-50 dark:bg-[#18263D] border border-slate-200 dark:border-slate-700 rounded-lg">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block font-mono">
                          {formatTime(apt.scheduled_at)}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Horário</span>
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-sm font-bold text-slate-900 dark:text-slate-100 ${isCancelled ? 'line-through' : ''}`}>
                            {apt.client?.name || 'Cliente'}
                          </span>
                          {apt.vehicle && (
                            <button
                              type="button"
                              onClick={() => onSelectVehicleHistory && onSelectVehicleHistory(apt.vehicle_id)}
                              className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-900 text-white hover:bg-blue-900 rounded tracking-wider cursor-pointer"
                              title="Clique para ver histórico deste carro"
                            >
                              {formatPlate(apt.vehicle.plate)}
                            </button>
                          )}
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${st.bg} ${st.text} border ${st.border}`}
                          >
                            {st.label}
                          </span>
                        </div>

                        <div className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium">
                          {apt.vehicle?.model} • <span className="text-slate-900 dark:text-slate-100">{apt.service_name}</span>
                        </div>

                        {apt.observations && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 italic mt-1">
                            Obs: {apt.observations}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions & Price */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      <div className="text-left sm:text-right">
                        <span className="text-xs text-slate-400 block">
                          {apt.final_amount !== null && apt.final_amount !== undefined ? 'Valor Final' : 'Valor Previsto'}
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(apt.final_amount ?? apt.estimated_amount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isConcluded && !isCancelled && (
                          <button
                            type="button"
                            onClick={() => onCompleteAppointment(apt)}
                            className="px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Concluir
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onEditAppointment(apt)}
                          className="p-1.5 text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"
                          title="Editar informações do agendamento"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteAppointment(apt)}
                          className="p-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-800 transition-colors"
                          title="Excluir agendamento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {!isCancelled && !isConcluded && (
                          <button
                            type="button"
                            onClick={() => onCancelAppointment(apt)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                            title="Cancelar agendamento (mantém no histórico)"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODE 2: SEMANA (Week View) */}
      {mode === 'semana' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((dayStr) => {
            const dayAppointments = appointments.filter((a) => a.scheduled_at.startsWith(dayStr));
            const isToday = dayStr === new Date().toISOString().split('T')[0];
            const dateObj = new Date(`${dayStr}T12:00:00`);
            const weekdayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' });

            return (
              <div
                key={dayStr}
                className={`bg-white dark:bg-[#131D2E] rounded-xl border flex flex-col min-h-[380px] shadow-xs transition-colors ${
                  isToday
                    ? 'border-blue-500 ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div
                  className={`p-2.5 text-center border-b rounded-t-xl ${
                    isToday
                      ? 'bg-[#182C45] dark:bg-blue-600 text-white'
                      : 'bg-slate-50 dark:bg-[#162235] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="text-[11px] uppercase font-bold tracking-wider">{weekdayName}</div>
                  <div className="text-sm font-bold mt-0.5">{formatDate(dayStr).substring(0, 5)}</div>
                  <div className="text-[10px] opacity-80">{dayAppointments.length} agendado(s)</div>
                </div>

                <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[460px]">
                  {dayAppointments.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-300 dark:text-slate-600 text-[11px] p-2 text-center">
                      Sem horários
                    </div>
                  ) : (
                    dayAppointments.map((apt) => {
                      const st = APPOINTMENT_STATUS_INFO[apt.status];
                      return (
                        <div
                          key={apt.id}
                          onClick={() => onEditAppointment(apt)}
                          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-[#162235] hover:bg-white dark:hover:bg-[#1A263B] transition-all cursor-pointer text-xs space-y-1 group relative"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-[11px]">
                              {formatTime(apt.scheduled_at)}
                            </span>
                            <div className="flex items-center gap-1">
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${st.bg} ${st.text}`}
                              >
                                {st.label}
                              </span>
                              <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditAppointment(apt);
                                  }}
                                  className="p-0.5 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded"
                                  title="Editar"
                                >
                                  <Edit2 className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteAppointment(apt);
                                  }}
                                  className="p-0.5 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {apt.client?.name}
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                            {formatPlate(apt.vehicle?.plate)} • {apt.service_name}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => onNewAppointment(dayStr)}
                    className="w-full py-1 text-[11px] text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-semibold text-center hover:bg-slate-50 dark:hover:bg-[#162235] rounded"
                  >
                    + Adicionar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODE 3: MÊS (Microsoft Teams Inspired Month View) */}
      {mode === 'mes' && (
        <div className="bg-white dark:bg-[#131D2E] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors flex flex-col">
          {/* Month Summary Bar */}
          <div className="px-5 py-3.5 bg-slate-50 dark:bg-[#162235] border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#182C45] dark:bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  {formattedMonthTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {monthStats.total} agendamento(s) encontrado(s) para este período
                </p>
              </div>
            </div>

            {/* Teams-like Stats Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[#182C45] dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800/60">
                {monthStats.scheduled} previstos
              </span>
              <span className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800/60">
                {monthStats.inProgress} em andamento
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800/60">
                {monthStats.concluded} concluídos
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#1C2C45] text-slate-800 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700">
                {formatCurrency(monthStats.totalValue)}
              </span>
            </div>
          </div>

          {/* 7-Column Weekday Header (Microsoft Teams standard DOM - SÁB) */}
          <div className="grid grid-cols-7 bg-slate-50/90 dark:bg-[#162235] border-b border-slate-200 dark:border-slate-800 text-center text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase py-2.5">
            <span className="text-rose-600/80 dark:text-rose-400/80">DOM</span>
            <span>SEG</span>
            <span>TER</span>
            <span>QUA</span>
            <span>QUI</span>
            <span>SEX</span>
            <span className="text-blue-600/80 dark:text-blue-400/80">SÁB</span>
          </div>

          {/* Teams Calendar Month Grid */}
          <div className="grid grid-cols-7 border-t border-l border-slate-200 dark:border-slate-800 bg-slate-200 dark:bg-slate-800 gap-[1px]">
            {monthDays.map((day) => {
              const dayApts = filteredAppointments.filter((a) => a.scheduled_at.startsWith(day.dateStr));
              const isToday = day.isToday;
              const isCurrentMonth = day.isCurrentMonth;
              const visibleApts = dayApts.slice(0, 3);
              const remainingCount = dayApts.length - 3;

              return (
                <div
                  key={day.dateStr}
                  onClick={() => {
                    // Click on day cell sets selected date
                    setSelectedDate(day.dateStr);
                  }}
                  className={`min-h-[115px] sm:min-h-[132px] p-1.5 sm:p-2 flex flex-col justify-between group transition-colors relative ${
                    isCurrentMonth
                      ? 'bg-white dark:bg-[#131D2E] hover:bg-slate-50/80 dark:hover:bg-[#162235]'
                      : 'bg-slate-50/50 dark:bg-[#0E1624] text-slate-400 dark:text-slate-600 opacity-60'
                  } ${isToday ? 'bg-blue-50/25 dark:bg-blue-950/20' : ''}`}
                >
                  {/* Cell Top Bar: Day Number & Quick Add Button */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(day.dateStr);
                          setMode('hoje');
                        }}
                        className={`text-xs font-semibold cursor-pointer rounded-full transition-transform hover:scale-110 ${
                          isToday
                            ? 'w-6 h-6 rounded-full bg-[#182C45] dark:bg-blue-600 text-white font-bold flex items-center justify-center shadow-xs'
                            : 'px-1 py-0.5 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                        title="Ver agendamentos deste dia"
                      >
                        {day.dayNum}
                      </button>

                      {/* Hover Quick Add '+' button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNewAppointment(day.dateStr);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-all cursor-pointer"
                        title="Adicionar agendamento nesta data"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Event Chips List (Microsoft Teams Style) */}
                    <div className="space-y-1">
                      {visibleApts.map((apt) => {
                        const isConcluded = apt.status === 'concluido';
                        const isCancelled = apt.status === 'cancelado';
                        const isProgress = apt.status === 'em_andamento';

                        let badgeColor =
                          'border-blue-200 dark:border-blue-800/70 bg-blue-50/90 dark:bg-blue-950/50 text-[#182C45] dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/60';

                        if (isConcluded) {
                          badgeColor =
                            'border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/60';
                        } else if (isProgress) {
                          badgeColor =
                            'border-amber-200 dark:border-amber-800/70 bg-amber-50/90 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60';
                        } else if (isCancelled) {
                          badgeColor =
                            'border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-800/60 text-slate-400 line-through';
                        }

                        return (
                          <div
                            key={apt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditAppointment(apt);
                            }}
                            className={`text-[11px] px-1.5 py-1 rounded-md border transition-all cursor-pointer truncate flex items-center justify-between gap-1 shadow-2xs hover:shadow-xs hover:translate-x-0.5 ${badgeColor}`}
                            title={`${formatTime(apt.scheduled_at)} • ${apt.client?.name || 'Cliente'} (${formatPlate(apt.vehicle?.plate)}) - ${apt.service_name} • ${formatCurrency(apt.final_amount ?? apt.estimated_amount)}`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-mono font-bold text-[10px] shrink-0">
                                {formatTime(apt.scheduled_at)}
                              </span>
                              <span className="truncate font-medium">
                                {apt.client?.name ? apt.client.name.split(' ')[0] : 'Cliente'} • {apt.service_name}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cell Bottom: '+X mais' or Quick Add for empty cells */}
                  <div className="mt-1">
                    {remainingCount > 0 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedDayDate(day.dateStr);
                        }}
                        className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline px-1 py-0.5 block text-left cursor-pointer"
                      >
                        +{remainingCount} mais
                      </button>
                    ) : dayApts.length === 0 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNewAppointment(day.dateStr);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 py-0.5 px-1 rounded block text-left transition-opacity cursor-pointer"
                      >
                        + Agendar
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Month Footer Shortcut Bar */}
          <div className="px-5 py-3 bg-slate-50 dark:bg-[#162235] border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <span>💡 <strong>Dica Teams:</strong> Clique em qualquer dia para ver a agenda completa ou no <strong>+</strong> para agendar diretamente.</span>
            </div>
            <button
              type="button"
              onClick={() => onNewAppointment(selectedDate)}
              className="px-3 py-1.5 font-semibold text-xs text-white bg-[#182C45] dark:bg-blue-600 hover:bg-[#122237] dark:hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              + Novo Agendamento
            </button>
          </div>
        </div>
      )}

      {/* Teams-Style Day Details Dialog (When clicking '+X mais') */}
      {expandedDayDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#131D2E] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden transition-colors">
            {/* Pinned Header */}
            <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-[#182C45] text-white border-b border-white/10 shadow-xs z-10">
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="w-5 h-5 text-blue-300" />
                <div>
                  <h2 className="text-base font-semibold">
                    Agendamentos de {formatDate(expandedDayDate)}
                  </h2>
                  <p className="text-xs text-blue-200">
                    {filteredAppointments.filter((a) => a.scheduled_at.startsWith(expandedDayDate)).length} compromisso(s) registrado(s)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExpandedDayDate(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                title="Fechar janela (Esc)"
                aria-label="Fechar janela"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {filteredAppointments
                .filter((a) => a.scheduled_at.startsWith(expandedDayDate))
                .map((apt) => {
                  const st = APPOINTMENT_STATUS_INFO[apt.status];
                  const isConcluded = apt.status === 'concluido';
                  const isCancelled = apt.status === 'cancelado';

                  return (
                    <div
                      key={apt.id}
                      className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-[#18263D] hover:bg-white dark:hover:bg-[#1E2D44] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-center w-14 shrink-0 py-1.5 bg-white dark:bg-[#101928] border border-slate-200 dark:border-slate-700 rounded-md">
                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 block">
                            {formatTime(apt.scheduled_at)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                              {apt.client?.name || 'Cliente'}
                            </span>
                            {apt.vehicle && (
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-slate-900 text-white rounded">
                                {formatPlate(apt.vehicle.plate)}
                              </span>
                            )}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.bg} ${st.text} border ${st.border}`}>
                              {st.label}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                            {apt.vehicle?.model} • <span className="font-medium">{apt.service_name}</span>
                          </div>
                          {apt.observations && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-0.5">
                              {apt.observations}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(apt.final_amount ?? apt.estimated_amount)}
                        </span>
                        <div className="flex items-center gap-1">
                          {!isConcluded && !isCancelled && (
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedDayDate(null);
                                onCompleteAppointment(apt);
                              }}
                              className="px-2 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 rounded border border-emerald-300 dark:border-emerald-800 transition-colors"
                            >
                              Concluir
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedDayDate(null);
                              onEditAppointment(apt);
                            }}
                            className="p-1 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded border border-blue-200 dark:border-blue-800 transition-colors"
                            title="Editar agendamento"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedDayDate(null);
                              onDeleteAppointment(apt);
                            }}
                            className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded border border-rose-200 dark:border-rose-800 transition-colors"
                            title="Excluir agendamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Pinned Footer */}
            <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#101928]">
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(expandedDayDate);
                  setMode('hoje');
                  setExpandedDayDate(null);
                }}
                className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir na visualização diária
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const d = expandedDayDate;
                    setExpandedDayDate(null);
                    onNewAppointment(d);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#182C45] dark:bg-blue-600 hover:bg-[#122237] dark:hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                >
                  + Novo neste dia
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedDayDate(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 4: LISTA (Full Table View) */}
      {mode === 'lista' && (
        <div className="bg-white dark:bg-[#131D2E] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#162235] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4">Data & Horário</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Veículo</th>
                  <th className="py-3 px-4">Serviço</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      Nenhum agendamento encontrado com os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((apt) => {
                    const st = APPOINTMENT_STATUS_INFO[apt.status];
                    return (
                      <tr key={apt.id} className="hover:bg-slate-50/60 dark:hover:bg-[#18263D] transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-slate-100">
                          {formatDateTime(apt.scheduled_at)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          {apt.client?.name || 'Cliente'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 bg-slate-900 text-white rounded mr-1.5">
                            {formatPlate(apt.vehicle?.plate)}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400">{apt.vehicle?.model}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">{apt.service_name}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(apt.final_amount ?? apt.estimated_amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${st.bg} ${st.text} border ${st.border}`}
                          >
                            {st.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onEditAppointment(apt)}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded border border-blue-200 dark:border-blue-800 transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteAppointment(apt)}
                            className="px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded border border-rose-200 dark:border-rose-800 transition-colors"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
