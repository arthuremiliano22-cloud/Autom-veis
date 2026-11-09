import React, { useState, useEffect } from 'react';
import { X, CheckCircle, DollarSign, Calendar, CreditCard, History, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api.ts';
import { Transaction, PaymentMethod } from '../types/index.ts';
import { formatCurrency, formatDate, PAYMENT_METHODS } from '../utils/formatters.ts';

interface PaymentBaixaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction: Transaction;
}

export const PaymentBaixaModal: React.FC<PaymentBaixaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  transaction,
}) => {
  const totalAmount = transaction.amount;
  const alreadyPaid = transaction.paid_amount || 0;
  const remaining = Math.max(0, totalAmount - alreadyPaid);

  const [paymentAmount, setPaymentAmount] = useState(String(remaining));
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    transaction.payment_method || 'pix'
  );
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPaymentAmount(String(remaining));
      setPaidAt(new Date().toISOString().split('T')[0]);
      setNotes('');
      setError(null);
    }
  }, [isOpen, remaining]);

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numPayment = parseFloat(paymentAmount.replace(',', '.')) || 0;
    if (numPayment <= 0) {
      setError('O valor do pagamento deve ser maior que zero.');
      return;
    }

    if (numPayment > remaining + 0.01) {
      setError(`O valor informado (${formatCurrency(numPayment)}) excede o saldo restante a pagar (${formatCurrency(remaining)}).`);
      return;
    }

    setSaving(true);
    try {
      await api.addPayment(transaction.id, {
        amount: numPayment,
        paid_at: paidAt,
        payment_method: paymentMethod,
        notes: notes.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar baixa de pagamento.');
    } finally {
      setSaving(false);
    }
  };

  const isFullPayment = Math.abs((parseFloat(paymentAmount.replace(',', '.')) || 0) - remaining) < 0.01;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#131D2E] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden transition-colors">
        {/* Header - Pinned at Top */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-[#182C45] text-white border-b border-white/10 shadow-xs z-10">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-semibold">
                {transaction.type === 'income' ? 'Registrar Recebimento' : 'Registrar Pagamento'}
              </h2>
              <p className="text-xs text-blue-200">Baixa total ou parcial sem duplicação de saldo</p>
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

        {/* Form Body with scrollable content and pinned footer */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Transaction Summary Card */}
          <div className="p-3 bg-slate-50 dark:bg-[#101928] border border-slate-200 dark:border-slate-800 rounded-lg text-xs space-y-1.5">
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{transaction.description}</div>
            <div className="text-slate-600 dark:text-slate-400">Categoria: {transaction.category}</div>
            {transaction.client && (
              <div className="text-slate-600 dark:text-slate-400">Cliente: {transaction.client.name}</div>
            )}

            <div className="grid grid-cols-3 pt-2 mt-2 border-t border-slate-200 dark:border-slate-800 text-center">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Valor Total</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(totalAmount)}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Já Pago</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">{formatCurrency(alreadyPaid)}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Saldo Devedor</span>
                <span className="font-bold text-amber-700 dark:text-amber-400">{formatCurrency(remaining)}</span>
              </div>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                Valor Desta Baixa (R$) *
              </label>
              <button
                type="button"
                onClick={() => setPaymentAmount(String(remaining))}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                Quitar Saldo Total ({formatCurrency(remaining)})
              </button>
            </div>
            <input
              type="text"
              required
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full text-base font-bold text-slate-900 dark:text-slate-100 px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
            />
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">
                {isFullPayment ? '✓ Liquidação integral desta fatura' : '⚠️ Pagamento parcial'}
              </span>
              {!isFullPayment && (
                <span className="text-amber-800 dark:text-amber-400 font-medium">
                  Restará:{' '}
                  {formatCurrency(
                    Math.max(0, remaining - (parseFloat(paymentAmount.replace(',', '.')) || 0))
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Payment Method & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                Forma de Pagamento *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full text-xs px-2.5 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
              >
                {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                Data do Pagamento *
              </label>
              <input
                type="date"
                required
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="w-full text-xs px-2.5 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações / Comprovante (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Parcela 1/2 recebida no Pix do banco"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Previous Payments History */}
          {transaction.payments && transaction.payments.length > 0 && (
            <div className="p-3 bg-slate-50 dark:bg-[#101928] rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                <History className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                Baixas Anteriores Desta Transação ({transaction.payments.length})
              </span>
              <div className="space-y-1.5 max-h-24 overflow-y-auto">
                {transaction.payments.map((p) => (
                  <div key={p.id} className="flex justify-between items-center text-[11px] text-slate-600 dark:text-slate-400">
                    <span>
                      {formatDate(p.paid_at)} • {p.payment_method ? PAYMENT_METHODS[p.payment_method] : 'Outro'}
                    </span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Confirmar Recebimento / Pagamento
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};
