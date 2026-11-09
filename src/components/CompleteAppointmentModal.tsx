import React, { useState, useEffect } from 'react';
import { X, CheckCircle, DollarSign, Calendar, CreditCard, Loader2 } from 'lucide-react';
import { api } from '../services/api.ts';
import { Appointment, PaymentMethod } from '../types/index.ts';
import { formatCurrency, formatPlate, PAYMENT_METHODS } from '../utils/formatters.ts';

interface CompleteAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointment: Appointment;
}

export const CompleteAppointmentModal: React.FC<CompleteAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  appointment,
}) => {
  const [finalAmount, setFinalAmount] = useState(
    String(appointment.final_amount ?? appointment.estimated_amount ?? 0)
  );
  const [createTransaction, setCreateTransaction] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const numFinal = parseFloat(finalAmount.replace(',', '.')) || 0;
    if (numFinal < 0) {
      setError('O valor final do serviço não pode ser negativo.');
      return;
    }

    setSaving(true);
    try {
      await api.completeAppointment(appointment.id, {
        final_amount: numFinal,
        create_transaction: createTransaction,
        is_paid: isPaid,
        due_date: dueDate,
        paid_at: isPaid ? dueDate : undefined,
        payment_method: paymentMethod,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao concluir serviço.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#131D2E] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden transition-colors">
        {/* Header - Pinned at Top */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-emerald-700 text-white border-b border-white/10 shadow-xs z-10">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-200" />
            <div>
              <h2 className="text-base font-semibold">Concluir Serviço</h2>
              <p className="text-xs text-emerald-100">Finalização operacional e integração financeira</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
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

          {/* Service Summary */}
          <div className="p-3 bg-slate-50 dark:bg-[#101928] border border-slate-200 dark:border-slate-800 rounded-lg text-xs space-y-1">
            <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{appointment.service_name}</div>
            <div className="text-slate-600 dark:text-slate-400">
              Cliente: <span className="font-medium text-slate-800 dark:text-slate-200">{appointment.client?.name}</span>
            </div>
            <div className="text-slate-600 dark:text-slate-400">
              Veículo: <span className="font-medium text-slate-800 dark:text-slate-200">{appointment.vehicle?.model} ({formatPlate(appointment.vehicle?.plate)})</span>
            </div>
            <div className="text-slate-500 dark:text-slate-400 pt-1">
              Valor estimado inicial: {formatCurrency(appointment.estimated_amount)}
            </div>
          </div>

          {/* Final Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Valor Final Cobrado (R$) *
            </label>
            <input
              type="text"
              required
              value={finalAmount}
              onChange={(e) => setFinalAmount(e.target.value)}
              className="w-full text-base font-bold text-slate-900 dark:text-slate-100 px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Você pode ajustar caso tenham sido adicionadas peças ou serviços extras.
            </p>
          </div>

          {/* Financial Integration Switch */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createTransaction}
                onChange={(e) => setCreateTransaction(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-700 focus:ring-emerald-500"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Lançar automaticamente no Financeiro (Receita de Serviços)
              </span>
            </label>

            {createTransaction && (
              <div className="p-3.5 bg-slate-50 dark:bg-[#101928] rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Situação do Pagamento:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPaid(false)}
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                        !isPaid
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60'
                          : 'bg-white dark:bg-[#18263D] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      A Receber (Pendente)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPaid(true)}
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                        isPaid
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-[#18263D] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Pago no Ato
                    </button>
                  </div>
                </div>

                {isPaid ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      Forma de Recebimento
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      Data Prevista de Vencimento
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                )}
              </div>
            )}
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
            Voltar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Confirmar Conclusão
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};
