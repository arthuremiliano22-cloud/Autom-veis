import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  Plus,
  Filter,
  Calendar,
  CheckCircle,
  CreditCard,
  Download,
  Search,
  Trash2,
} from 'lucide-react';
import { Transaction, DashboardStats, TransactionType, TransactionStatus } from '../types/index.ts';
import {
  formatCurrency,
  formatDate,
  formatPlate,
  TRANSACTION_STATUS_INFO,
  PAYMENT_METHODS,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from '../utils/formatters.ts';

interface FinancialViewProps {
  stats: DashboardStats | null;
  transactions: Transaction[];
  onNewIncome: () => void;
  onNewExpense: () => void;
  onPayTransaction: (tx: Transaction) => void;
  onDeleteTransaction?: (tx: Transaction) => void;
  onPeriodChange?: (startDate: string, endDate: string) => void;
}

type PeriodFilter = 'este_mes' | 'mes_anterior' | 'ultimos_30' | 'este_ano' | 'tudo';

export const FinancialView: React.FC<FinancialViewProps> = ({
  stats,
  transactions,
  onNewIncome,
  onNewExpense,
  onPayTransaction,
  onDeleteTransaction,
  onPeriodChange,
}) => {
  const [period, setPeriod] = useState<PeriodFilter>('este_mes');
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate dates based on period
  const dateRange = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    if (period === 'este_mes') {
      const start = new Date(year, month, 1).toISOString().split('T')[0];
      const end = new Date(year, month + 1, 0).toISOString().split('T')[0];
      return { start, end };
    } else if (period === 'mes_anterior') {
      const start = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const end = new Date(year, month, 0).toISOString().split('T')[0];
      return { start, end };
    } else if (period === 'ultimos_30') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = now.toISOString().split('T')[0];
      return { start, end };
    } else if (period === 'este_ano') {
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;
      return { start, end };
    }
    return { start: '', end: '' };
  }, [period]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type
      if (typeFilter !== 'todos' && tx.type !== typeFilter) return false;

      // Status
      if (statusFilter !== 'todos' && tx.status !== statusFilter) return false;

      // Category
      if (categoryFilter !== 'todos' && tx.category !== categoryFilter) return false;

      // Date range
      if (dateRange.start && dateRange.end) {
        const txDate = (tx.due_date || tx.created_at).split('T')[0];
        if (txDate < dateRange.start || txDate > dateRange.end) return false;
      }

      // Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const desc = tx.description.toLowerCase();
        const clientName = tx.client?.name.toLowerCase() || '';
        const plate = tx.vehicle?.plate.toLowerCase() || '';
        if (!desc.includes(q) && !clientName.includes(q) && !plate.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, typeFilter, statusFilter, categoryFilter, dateRange, searchQuery]);

  // Export simple CSV report
  const handleExportCSV = () => {
    const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor Total', 'Valor Pago', 'Saldo', 'Status', 'Cliente'];
    const rows = filteredTransactions.map((tx) => [
      formatDate(tx.due_date || tx.created_at),
      tx.type === 'income' ? 'Receita' : 'Despesa',
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.category,
      tx.amount.toFixed(2),
      (tx.paid_amount || 0).toFixed(2),
      Math.max(0, tx.amount - (tx.paid_amount || 0)).toFixed(2),
      tx.status,
      tx.client?.name || '-',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_financeiro_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Period Selector */}
      <div className="bg-white dark:bg-[#131D2E] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4 transition-colors">
        {/* Period Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-[#18263D] p-1 rounded-lg">
          <button
            onClick={() => setPeriod('este_mes')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              period === 'este_mes'
                ? 'bg-white dark:bg-[#1E2D44] text-[#182C45] dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Este Mês
          </button>
          <button
            onClick={() => setPeriod('mes_anterior')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              period === 'mes_anterior'
                ? 'bg-white dark:bg-[#1E2D44] text-[#182C45] dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Mês Anterior
          </button>
          <button
            onClick={() => setPeriod('ultimos_30')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              period === 'ultimos_30'
                ? 'bg-white dark:bg-[#1E2D44] text-[#182C45] dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Últimos 30 Dias
          </button>
          <button
            onClick={() => setPeriod('este_ano')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              period === 'este_ano'
                ? 'bg-white dark:bg-[#1E2D44] text-[#182C45] dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Este Ano
          </button>
          <button
            onClick={() => setPeriod('tudo')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              period === 'tudo'
                ? 'bg-white dark:bg-[#1E2D44] text-[#182C45] dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Todo o Histórico
          </button>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#18263D] hover:bg-slate-50 dark:hover:bg-[#1E2D44] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            title="Exportar dados filtrados para CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            Exportar CSV
          </button>
          <button
            onClick={onNewIncome}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            + Nova Receita
          </button>
          <button
            onClick={onNewExpense}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#182C45] hover:bg-[#122237] dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            + Nova Despesa
          </button>
        </div>
      </div>

      {/* 6 Financial Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Saldo Atual */}
        <div className="bg-white dark:bg-[#131D2E] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Saldo Atual
          </span>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
            {formatCurrency(stats?.current_balance)}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">Caixa total disponível</span>
        </div>

        {/* 2. Saldo Inicial */}
        <div className="bg-white dark:bg-[#131D2E] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Saldo Inicial
          </span>
          <div className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-1">
            {formatCurrency(stats?.opening_balance)}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">Configurado na abertura</span>
        </div>

        {/* 3. Recebido no Período */}
        <div className="bg-white dark:bg-[#131D2E] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
            Recebido (Mês)
          </span>
          <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-1">
            {formatCurrency(stats?.month_income)}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-500 block mt-0.5">Entradas liquidadas</span>
        </div>

        {/* 4. Despesas Pagas */}
        <div className="bg-white dark:bg-[#131D2E] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
            Pagas (Mês)
          </span>
          <div className="text-lg font-bold text-rose-700 dark:text-rose-400 mt-1">
            {formatCurrency(stats?.month_expense)}
          </div>
          <span className="text-[10px] text-rose-600 dark:text-rose-500 block mt-0.5">Saídas liquidadas</span>
        </div>

        {/* 5. A Receber */}
        <div className="bg-white dark:bg-[#131D2E] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
            A Receber
          </span>
          <div className="text-lg font-bold text-amber-700 dark:text-amber-400 mt-1">
            {formatCurrency(stats?.receivables)}
          </div>
          <span className="text-[10px] text-amber-600 dark:text-amber-500 block mt-0.5">Receitas pendentes</span>
        </div>

        {/* 6. A Pagar */}
        <div className="bg-white dark:bg-[#131D2E] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider block">
            A Pagar
          </span>
          <div className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">
            {formatCurrency(stats?.payables)}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">Despesas pendentes</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-[#131D2E] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 transition-colors">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por descrição, cliente ou placa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-white dark:bg-[#18263D] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none bg-white dark:bg-[#18263D]"
          >
            <option value="todos">Todos os Tipos</option>
            <option value="income">Apenas Receitas (+)</option>
            <option value="expense">Apenas Despesas (-)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none bg-white dark:bg-[#18263D]"
          >
            <option value="todos">Todas as Situações</option>
            <option value="pago">Pago / Recebido</option>
            <option value="parcial">Parcialmente Pago</option>
            <option value="pendente">Pendente</option>
            <option value="vencido">Vencido</option>
            <option value="cancelado">Cancelado</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none bg-white dark:bg-[#18263D]"
          >
            <option value="todos">Todas as Categorias</option>
            <optgroup label="Receitas">
              {INCOME_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </optgroup>
            <optgroup label="Despesas">
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-[#131D2E] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-[#101928] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
          <span>Lançamentos Financeiros ({filteredTransactions.length})</span>
          <span className="text-slate-500 dark:text-slate-400 font-normal">
            Histórico de entradas, saídas e liquidações parciais
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-[#101928]/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Vencimento / Data</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Descrição do Lançamento</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-4 text-right">Valor Pago</th>
                <th className="py-3 px-4 text-right">Saldo Restante</th>
                <th className="py-3 px-4 text-center">Situação</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    {transactions.length === 0 ? (
                      <div className="max-w-md mx-auto space-y-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          Nenhum lançamento financeiro registrado
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Os dados fictícios foram removidos. O sistema financeiro está limpo e pronto para a operação real da sua loja.
                        </p>
                        <div className="pt-2 flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={onNewIncome}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            + Registrar Receita
                          </button>
                          <button
                            type="button"
                            onClick={onNewExpense}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#1A263B] hover:bg-slate-200 dark:hover:bg-[#23334F] border border-slate-300 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            + Registrar Despesa
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 text-xs">
                        Nenhuma movimentação financeira encontrada para os filtros selecionados.
                      </span>
                    )}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const alreadyPaid = tx.paid_amount || 0;
                  const remaining = Math.max(0, tx.amount - alreadyPaid);
                  const st = TRANSACTION_STATUS_INFO[tx.status];

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-[#1A273D]/60 transition-colors">
                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-800 dark:text-slate-300">
                        {formatDate(tx.due_date || tx.created_at)}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                            isIncome
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/40'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200/50 dark:border-rose-800/40'
                          }`}
                        >
                          {isIncome ? '+ Receita' : '- Despesa'}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{tx.description}</div>
                        {(tx.client || tx.vehicle) && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {tx.client?.name}{' '}
                            {tx.vehicle && `• ${tx.vehicle.model} (${formatPlate(tx.vehicle.plate)})`}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">{tx.category}</td>

                      {/* Amount */}
                      <td
                        className={`py-3.5 px-4 text-right font-bold ${
                          isIncome ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {formatCurrency(tx.amount)}
                      </td>

                      {/* Already Paid */}
                      <td className="py-3.5 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                        {formatCurrency(alreadyPaid)}
                      </td>

                      {/* Remaining */}
                      <td
                        className={`py-3.5 px-4 text-right font-bold ${
                          remaining > 0 ? (isIncome ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400') : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {formatCurrency(remaining)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block text-[10px] px-2 py-0.5 rounded font-semibold ${st.bg} ${st.text} border ${st.border}`}
                        >
                          {st.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {remaining > 0 && tx.status !== 'cancelado' ? (
                            <button
                              type="button"
                              onClick={() => onPayTransaction(tx)}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-800/60 rounded transition-colors whitespace-nowrap cursor-pointer"
                            >
                              Dar Baixa
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 italic mr-1">Quitado</span>
                          )}

                          {onDeleteTransaction && (
                            <button
                              type="button"
                              onClick={() => onDeleteTransaction(tx)}
                              title="Excluir lançamento"
                              className="p-1 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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
