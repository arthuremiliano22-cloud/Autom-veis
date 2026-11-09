import React, { useState, useEffect } from 'react';
import {
  Store,
  Wallet,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Building2,
  Phone,
  MapPin,
  Save,
  Loader2,
  Database,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { StoreSettings, DashboardStats } from '../types/index.ts';
import { formatCurrency } from '../utils/formatters.ts';

interface SettingsViewProps {
  settings: StoreSettings | null;
  stats: DashboardStats | null;
  onRefreshAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  stats,
  onRefreshAll,
}) => {
  const [businessName, setBusinessName] = useState('');
  const [taxDocument, setTaxDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (settings) {
      setBusinessName(settings.business_name || '');
      setTaxDocument(settings.document || '');
      setPhone(settings.phone || '');
      setAddress(settings.address || '');
      setOpeningBalance(String(settings.opening_balance ?? 0));
    }
  }, [settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    const numOpening = parseFloat(openingBalance.replace(',', '.')) || 0;

    setSaving(true);
    try {
      await api.updateSettings({
        business_name: businessName.trim(),
        document: taxDocument.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        opening_balance: numOpening,
      });

      setSuccessMessage('Configurações da loja atualizadas com sucesso!');
      onRefreshAll();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const data = await api.exportBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_loja_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorMessage('Erro ao exportar backup: ' + err.message);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await api.restoreBackup(json);
        setSuccessMessage('Backup restaurado com sucesso! Dados atualizados.');
        onRefreshAll();
        setTimeout(() => setSuccessMessage(null), 4000);
      } catch (err: any) {
        setErrorMessage('Falha ao restaurar backup: formato JSON inválido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExecuteResetData = async () => {
    setIsResetting(true);
    try {
      await api.resetDefaultData();
      setShowResetConfirm(false);
      setSuccessMessage('Banco de dados restaurado para os dados padrão!');
      onRefreshAll();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage('Erro ao resetar: ' + err.message);
      setShowResetConfirm(false);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Messages */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-800 dark:text-red-200 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Store Settings Form */}
      <div className="bg-white dark:bg-[#131D2E] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="px-6 py-4 bg-slate-50 dark:bg-[#101928] border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Store className="w-4 h-4 text-[#182C45] dark:text-blue-400" />
            Dados Cadastrais da Loja e Parâmetros Financeiros
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Identificação do negócio e valor base para conciliação bancária
          </p>
        </div>

        <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                Nome da Loja / Razão Social *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                CNPJ ou CPF
              </label>
              <input
                type="text"
                placeholder="00.000.000/0001-00"
                value={taxDocument}
                onChange={(e) => setTaxDocument(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                Telefone de Contato / WhatsApp
              </label>
              <input
                type="text"
                placeholder="(11) 98765-4321"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                Endereço Físico
              </label>
              <input
                type="text"
                placeholder="Av. Principal, 1000 - Centro"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="max-w-xs">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                Saldo Inicial do Caixa (R$) *
              </label>
              <input
                type="text"
                required
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="w-full text-base font-bold text-slate-900 dark:text-slate-100 px-3 py-2 bg-white dark:bg-[#18263D] border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#182C45] dark:focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                O saldo atual é calculado rigorosamente somando este valor às receitas recebidas menos despesas pagas.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#182C45] hover:bg-[#122237] dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Salvar Configurações
            </button>
          </div>
        </form>
      </div>

      {/* Database & Backup Management */}
      <div className="bg-white dark:bg-[#131D2E] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="px-6 py-4 bg-slate-50 dark:bg-[#101928] border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-[#182C45] dark:text-blue-400" />
            Persistência e Backup de Dados
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Exporte o banco de dados completo em formato JSON ou restaure backups a qualquer momento
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Export */}
            <div className="p-4 bg-slate-50 dark:bg-[#18263D] rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Backup Completo</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Baixe um arquivo JSON com todos os clientes, veículos, agendamentos e finanças.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                className="mt-3 w-full py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-[#131D2E] hover:bg-slate-100 dark:hover:bg-[#1E2D44] border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar JSON
              </button>
            </div>

            {/* Import */}
            <div className="p-4 bg-slate-50 dark:bg-[#18263D] rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Restaurar Backup</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Importe um arquivo JSON salvo anteriormente para restabelecer os registros.
                </p>
              </div>
              <label className="mt-3 w-full py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-[#131D2E] hover:bg-slate-100 dark:hover:bg-[#1E2D44] border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                Carregar Arquivo
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>

            {/* Reset */}
            <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 rounded-lg border border-rose-200 dark:border-rose-900/40 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-rose-900 dark:text-rose-300 block">Dados de Demonstração</span>
                <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-1">
                  Restaura os dados originais de exemplo da loja caso queira recomeçar do zero.
                </p>
              </div>
              {showResetConfirm ? (
                <div className="mt-3 p-2.5 bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-900 rounded-lg space-y-2">
                  <p className="text-[11px] font-bold text-rose-900 dark:text-rose-200">
                    Confirmar restauração para os dados de exemplo?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExecuteResetData}
                      disabled={isResetting}
                      className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 rounded transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isResetting ? 'Restaurando...' : 'Sim, Restaurar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      disabled={isResetting}
                      className="px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="mt-3 w-full py-2 text-xs font-semibold text-rose-800 dark:text-rose-300 bg-white dark:bg-[#131D2E] hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-300 dark:border-rose-900/60 rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Resetar para Padrão
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
