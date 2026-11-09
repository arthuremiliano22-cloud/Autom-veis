import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, CreditCard, Tag, FileText, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { api } from '../services/api.ts';
import { TransactionType, PaymentMethod, Client } from '../types/index.ts';
import {
  PAYMENT_METHODS,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from '../utils/formatters.ts';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultType?: TransactionType;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultType = 'income',
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [isImmediatePaid, setIsImmediatePaid] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [clientId, setClientId] = useState('');
  const [notes, setNotes] = useState('');

  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      setDescription('');
      setCategory(defaultType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
      setAmount('');
      setDueDate(new Date().toISOString().split('T')[0]);
      setIsImmediatePaid(true);
      setPaymentMethod('pix');
      setClientId('');
      setNotes('');
      setError(null);

      // Load clients for dropdown in case of income
      api.getClients().then(setClients).catch(console.error);
    }
  }, [isOpen, defaultType]);

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

  // Adjust default category when type switches
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(newType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount.replace(',', '.')) || 0;
    if (numAmount <= 0) {
      setError('O valor do lançamento deve ser maior que zero.');
      return;
    }

    if (!description.trim()) {
      setError('A descrição do lançamento é obrigatória.');
      return;
    }

    setSaving(true);
    try {
      await api.createTransaction({
        type,
        description: description.trim(),
        category,
        amount: numAmount,
        due_date: dueDate,
        status: isImmediatePaid ? 'pago' : 'pendente',
        payment_method: paymentMethod,
        notes: notes.trim() || undefined,
        client_id: type === 'income' && clientId ? clientId : null,
        immediate_payment: isImmediatePaid
          ? {
              amount: numAmount,
              paid_at: dueDate,
              payment_method: paymentMethod,
              notes: 'Lançamento com liquidação imediata',
            }
          : undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar movimentação.');
    } finally {
      setSaving(false);
    }
  };

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#131D2E] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden transition-colors">
        {/* Pinned Header - Always visible at top */}
        <div
          className={`shrink-0 flex items-center justify-between px-6 py-4 text-white border-b border-white/10 shadow-xs z-10 ${
            type === 'income' ? 'bg-emerald-700' : 'bg-[#182C45]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {type === 'income' ? (
              <TrendingUp className="w-5 h-5 text-emerald-200" />
            ) : (
              <TrendingDown className="w-5 h-5 text-rose-300" />
            )}
            <div>
              <h2 className="text-base font-semibold">
                {type === 'income' ? 'Registrar Nova Receita' : 'Registrar Nova Despesa'}
              </h2>
              <p className="text-xs text-slate-200">
                {type === 'income'
                  ? 'Entrada no caixa ou valor a receber'
                  : 'Saída operacional, materiais ou fornecedores'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
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
            <div className="p-3 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg">
              {error}
            </div>
          )}

          {/* Type Selector Toggle */}
          <div className="flex bg-slate-100 dark:bg-[#18263D] p-1 rounded-lg">
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                type === 'income'
                  ? 'bg-white dark:bg-[#1E2D44] text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Receita (+ Entrada)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                type === 'expense'
                  ? 'bg-white dark:bg-[#1E2D44] text-rose-700 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              Despesa (- Saída)
            </button>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Descrição do Lançamento *
            </label>
            <input
              type="text"
              required
              placeholder={
                type === 'income'
                  ? 'Ex: Serviço de alinhamento ou Venda avulsa de óleo'
                  : 'Ex: Compra de lote de filtros de óleo LubriMax'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Amount & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                Valor (R$) *
              </label>
              <input
                type="text"
                required
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-sm font-bold text-slate-900 dark:text-slate-100 px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                Categoria *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Due Date */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                Data de Vencimento / Lançamento *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Client link (optional for income) */}
          {type === 'income' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Vincular a um Cliente (opcional)
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Nenhum cliente (venda avulsa / caixa geral)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Payment Status Switch */}
          <div className="p-3.5 bg-slate-50 dark:bg-[#101928] rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {type === 'income' ? 'Valor já foi recebido?' : 'Valor já foi pago?'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImmediatePaid(false)}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                    !isImmediatePaid
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60'
                      : 'bg-white dark:bg-[#18263D] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Pendente
                </button>
                <button
                  type="button"
                  onClick={() => setIsImmediatePaid(true)}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                    isImmediatePaid
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-[#18263D] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Sim, liquidado
                </button>
              </div>
            </div>

            {isImmediatePaid && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  Forma de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500"
                >
                  {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Observações / Comprovante (opcional)
            </label>
            <input
              type="text"
              placeholder="Número de nota fiscal, código de transação, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Actions - Pinned at bottom */}
        <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#101928]">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`px-5 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer ${
              type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#182C45] dark:bg-blue-600 hover:bg-[#122237] dark:hover:bg-blue-500'
            }`}
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {type === 'income' ? 'Salvar Receita' : 'Salvar Despesa'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};
