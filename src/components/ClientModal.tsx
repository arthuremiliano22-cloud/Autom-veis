import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, FileText, Car, Loader2 } from 'lucide-react';
import { api } from '../services/api.ts';
import { Client } from '../types/index.ts';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (client?: Client) => void;
  initialClient?: Client | null;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialClient,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Initial vehicle fields (only when creating new client)
  const [hasVehicle, setHasVehicle] = useState(true);
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (initialClient) {
        setName(initialClient.name);
        setPhone(initialClient.phone || '');
        setEmail(initialClient.email || '');
        setNotes(initialClient.notes || '');
        setHasVehicle(false);
      } else {
        setName('');
        setPhone('');
        setEmail('');
        setNotes('');
        setHasVehicle(true);
        setVehiclePlate('');
        setVehicleModel('');
        setVehicleYear('');
        setVehicleColor('');
      }
    }
  }, [isOpen, initialClient]);

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

    if (!name.trim()) {
      setError('Nome do cliente é obrigatório.');
      return;
    }

    if (!initialClient && hasVehicle) {
      if (!vehiclePlate.trim() || !vehicleModel.trim()) {
        setError('Por favor, informe a placa e o modelo do veículo, ou desmarque a inclusão do veículo.');
        return;
      }
    }

    setSaving(true);
    try {
      if (initialClient) {
        const updated = await api.updateClient(initialClient.id, {
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        onSuccess(updated);
      } else {
        const created = await api.createClient({
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          notes: notes.trim() || undefined,
          vehiclePlate: hasVehicle ? vehiclePlate.trim() : undefined,
          vehicleModel: hasVehicle ? vehicleModel.trim() : undefined,
          vehicleYear: hasVehicle ? vehicleYear.trim() : undefined,
          vehicleColor: hasVehicle ? vehicleColor.trim() : undefined,
        });
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar cliente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#131D2E] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden transition-colors">
        {/* Pinned Header - Always visible at top */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-[#182C45] text-white border-b border-white/10 shadow-xs z-10">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-blue-200" />
            <div>
              <h2 className="text-base font-semibold">
                {initialClient ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
              </h2>
              <p className="text-xs text-blue-200">
                {initialClient ? 'Atualize os dados de contato' : 'Cadastre o cliente e associe o primeiro veículo'}
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

        {/* Form Body with scrollable content and pinned footer */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg">
              {error}
            </div>
          )}

          {/* Client Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Nome Completo do Cliente *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Carlos Eduardo Silveira"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                placeholder="(11) 99123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                E-mail (opcional)
              </label>
              <input
                type="email"
                placeholder="cliente@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Observações do Cliente (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Preferências, histórico de compras, particularidades..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* Initial Vehicle Registration (when creating new) */}
          {!initialClient && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-blue-500" />
                  Veículo do Cliente
                </span>
                <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasVehicle}
                    onChange={(e) => setHasVehicle(e.target.checked)}
                    className="w-3.5 h-3.5 text-[#182C45] dark:text-blue-500 rounded"
                  />
                  Cadastrar veículo agora
                </label>
              </div>

              {hasVehicle && (
                <div className="p-3 bg-slate-50 dark:bg-[#101928] border border-slate-200 dark:border-slate-800 rounded-lg space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Placa *
                      </label>
                      <input
                        type="text"
                        placeholder="BRA2E19 ou ABC-1234"
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                        className="w-full text-sm uppercase px-3 py-1.5 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Modelo do Carro *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Corolla XEi 2.0"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        className="w-full text-sm px-3 py-1.5 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Ano
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 2022"
                        value={vehicleYear}
                        onChange={(e) => setVehicleYear(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Cor
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Prata"
                        value={vehicleColor}
                        onChange={(e) => setVehicleColor(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
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
            className="px-5 py-2 text-xs font-semibold text-white bg-[#182C45] hover:bg-[#122237] dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {initialClient ? 'Salvar Cliente' : 'Cadastrar Cliente'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};
