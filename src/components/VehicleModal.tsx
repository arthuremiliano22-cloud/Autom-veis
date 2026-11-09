import React, { useState, useEffect } from 'react';
import { X, Car, Loader2 } from 'lucide-react';
import { api } from '../services/api.ts';
import { Vehicle } from '../types/index.ts';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId: string;
  clientName?: string;
  initialVehicle?: Vehicle | null;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  clientId,
  clientName,
  initialVehicle,
}) => {
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (initialVehicle) {
        setPlate(initialVehicle.plate);
        setModel(initialVehicle.model);
        setYear(initialVehicle.year || '');
        setColor(initialVehicle.color || '');
        setNotes(initialVehicle.notes || '');
      } else {
        setPlate('');
        setModel('');
        setYear('');
        setColor('');
        setNotes('');
      }
    }
  }, [isOpen, initialVehicle]);

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

    if (!plate.trim() || !model.trim()) {
      setError('Placa e modelo do veículo são obrigatórios.');
      return;
    }

    setSaving(true);
    try {
      if (initialVehicle) {
        await api.updateVehicle(initialVehicle.id, {
          plate: plate.trim(),
          model: model.trim(),
          year: year.trim() || undefined,
          color: color.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      } else {
        await api.createVehicle({
          client_id: clientId,
          plate: plate.trim(),
          model: model.trim(),
          year: year.trim() || undefined,
          color: color.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar veículo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#131D2E] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#182C45] text-white">
          <div className="flex items-center gap-2.5">
            <Car className="w-5 h-5 text-blue-200" />
            <div>
              <h2 className="text-base font-semibold">
                {initialVehicle ? 'Editar Veículo' : 'Novo Veículo do Cliente'}
              </h2>
              {clientName && (
                <p className="text-xs text-blue-200">Proprietário: {clientName}</p>
              )}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Placa do Carro *
              </label>
              <input
                type="text"
                required
                placeholder="BRA2E19"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                className="w-full text-sm uppercase px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ano de Fabricação
              </label>
              <input
                type="text"
                placeholder="Ex: 2023"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Modelo e Versão *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Toyota Corolla XEi 2.0 Flex"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Cor do Veículo
            </label>
            <input
              type="text"
              placeholder="Ex: Preto Cristal"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Observações Técnicas (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Especificação de óleo, medidas de pneus, avarias preexistentes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#182C45] hover:bg-[#122237] dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {initialVehicle ? 'Salvar Veículo' : 'Cadastrar Veículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
