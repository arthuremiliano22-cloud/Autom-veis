import React from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  AlertTriangle,
  Plus,
  ArrowRight,
  Car,
  User,
  CheckCircle,
  FileText,
  DollarSign,
  Edit2,
  Trash2,
} from 'lucide-react';
import { DashboardStats, Appointment, Transaction } from '../types/index.ts';
import {
  formatCurrency,
  formatDate,
  formatTime,
  formatPlate,
  APPOINTMENT_STATUS_INFO,
  TRANSACTION_STATUS_INFO,
} from '../utils/formatters.ts';

interface DashboardViewProps {
  stats: DashboardStats | null;
  todayAppointments: Appointment[];
  pendingTransactions: Transaction[];
  onOpenNewAppointment: () => void;
  onOpenNewIncome: () => void;
  onOpenNewExpense: () => void;
  onOpenQuickSearch: () => void;
  onSelectAppointment: (apt: Appointment) => void;
  onCompleteAppointment: (apt: Appointment) => void;
  onEditAppointment?: (apt: Appointment) => void;
  onDeleteAppointment?: (apt: Appointment) => void;
  onPayTransaction: (tx: Transaction) => void;
  onNavigateToAgenda: () => void;
  onNavigateToFinancial: () => void;
  onNavigateToClients: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  todayAppointments,
  pendingTransactions,
  onOpenNewAppointment,
  onOpenNewIncome,
  onOpenNewExpense,
  onOpenQuickSearch,
  onSelectAppointment,
  onCompleteAppointment,
  onEditAppointment,
  onDeleteAppointment,
  onPayTransaction,
  onNavigateToAgenda,
  onNavigateToFinancial,
  onNavigateToClients,
}) => {
  return (
    <div className="space-y-6">
      {/* Quick Action Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-[#131D2E] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Ações Rápidas de Operação</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Agilize o atendimento e o controle financeiro do dia a dia</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenNewAppointment}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#182C45] dark:bg-blue-600 hover:bg-[#122237] dark:hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            + Novo Agendamento
          </button>
          <button
            onClick={onOpenNewIncome}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            + Registrar Receita
          </button>
          <button
            onClick={onOpenNewExpense}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#1A263B] hover:bg-slate-200 dark:hover:bg-[#23334F] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            + Registrar Despesa
          </button>
        </div>
      </div>

      {/* 4 Main Indicator Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Saldo Atual */}
        <div className="bg-white dark:bg-[#131D2E] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Saldo Atual</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#182C45] dark:text-blue-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {formatCurrency(stats?.current_balance)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Caixa real: Saldo inicial + entradas pagas − saídas
            </p>
          </div>
        </div>

        {/* 2. Receitas do Mês */}
        <div className="bg-white dark:bg-[#131D2E] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Receitas do Mês</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tracking-tight">
              {formatCurrency(stats?.month_income)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Total efetivamente recebido no período
            </p>
          </div>
        </div>

        {/* 3. Despesas do Mês */}
        <div className="bg-white dark:bg-[#131D2E] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Despesas do Mês</span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-400 tracking-tight">
              {formatCurrency(stats?.month_expense)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Total de saídas pagas no período
            </p>
          </div>
        </div>

        {/* 4. Valores a Receber */}
        <div className="bg-white dark:bg-[#131D2E] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Valores a Receber</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 tracking-tight">
              {formatCurrency(stats?.receivables)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Contas pendentes ou com pagamento parcial
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Agenda de Hoje + Pendências Financeiras */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agenda de Hoje (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#131D2E] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col transition-colors">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#182C45] dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Agenda de Hoje</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {todayAppointments.length} agendamento(s)
              </span>
            </div>
            <button
              onClick={onNavigateToAgenda}
              className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 flex items-center gap-1"
            >
              Ver agenda completa <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 flex-1">
            {todayAppointments.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#182C45] dark:text-blue-400" />
                <p className="text-xs font-medium">Nenhum compromisso agendado para hoje.</p>
                <button
                  onClick={onOpenNewAppointment}
                  className="mt-3 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors"
                >
                  + Agendar cliente para hoje
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {todayAppointments.map((apt) => {
                  const st = APPOINTMENT_STATUS_INFO[apt.status];
                  return (
                    <div
                      key={apt.id}
                      onClick={() => onSelectAppointment(apt)}
                      className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#18263D] rounded-lg transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-center w-14 shrink-0 py-1 bg-slate-50 dark:bg-[#18263D] rounded border border-slate-200 dark:border-slate-700">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block font-mono">
                            {formatTime(apt.scheduled_at)}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase">Horário</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {apt.client?.name || 'Cliente'}
                            </span>
                            <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 bg-slate-900 text-white rounded">
                              {formatPlate(apt.vehicle?.plate)}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            {apt.vehicle?.model} • <span className="font-medium text-slate-700 dark:text-slate-300">{apt.service_name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.bg} ${st.text} border ${st.border}`}
                        >
                          {st.label}
                        </span>
                        {apt.status !== 'concluido' && apt.status !== 'cancelado' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCompleteAppointment(apt);
                            }}
                            className="hidden sm:inline-flex px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded transition-colors"
                          >
                            Concluir
                          </button>
                        )}
                        {onEditAppointment && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditAppointment(apt);
                            }}
                            className="p-1 text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                            title="Editar agendamento"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteAppointment && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteAppointment(apt);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                            title="Excluir agendamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pendências Financeiras (1 col) */}
        <div className="bg-white dark:bg-[#131D2E] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col transition-colors">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Pendências Financeiras</h3>
            </div>
            <button
              onClick={onNavigateToFinancial}
              className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 flex items-center gap-1"
            >
              Ver financeiro <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 flex-1">
            {pendingTransactions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs font-medium">Nenhum pagamento ou recebimento pendente!</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Todas as contas estão em dia.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingTransactions.map((tx) => {
                  const remaining = tx.amount - (tx.paid_amount || 0);
                  const isOverdue = tx.status === 'vencido';

                  return (
                    <div
                      key={tx.id}
                      className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-300 dark:hover:border-slate-700 transition-colors bg-slate-50/40 dark:bg-[#162235]"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            tx.type === 'income'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          {tx.type === 'income' ? 'A Receber' : 'A Pagar'}
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            isOverdue ? 'text-red-700 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          {formatCurrency(remaining)}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {tx.description}
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>
                          Venc: <strong className={isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}>{formatDate(tx.due_date)}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => onPayTransaction(tx)}
                          className="px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded transition-colors"
                        >
                          Dar Baixa
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
