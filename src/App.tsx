/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavPage } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { MobileBottomNav } from './components/MobileBottomNav.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { AgendaView } from './components/AgendaView.tsx';
import { ClientsView } from './components/ClientsView.tsx';
import { FinancialView } from './components/FinancialView.tsx';
import { ServicesView } from './components/ServicesView.tsx';
import { SettingsView } from './components/SettingsView.tsx';

// Modals
import { QuickSearchModal } from './components/QuickSearchModal.tsx';
import { AppointmentModal } from './components/AppointmentModal.tsx';
import { CompleteAppointmentModal } from './components/CompleteAppointmentModal.tsx';
import { ClientModal } from './components/ClientModal.tsx';
import { VehicleModal } from './components/VehicleModal.tsx';
import { ClientDetailsModal } from './components/ClientDetailsModal.tsx';
import { VehicleTimelineModal } from './components/VehicleTimelineModal.tsx';
import { TransactionModal } from './components/TransactionModal.tsx';
import { PaymentBaixaModal } from './components/PaymentBaixaModal.tsx';
import { ConfirmModal } from './components/ConfirmModal.tsx';

import { api } from './services/api.ts';
import {
  StoreSettings,
  DashboardStats,
  Client,
  Appointment,
  Transaction,
  Vehicle,
} from './types/index.ts';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState<NavPage>('visao_geral');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('automanager_theme');
    return (saved === 'light' ? 'light' : 'dark');
  });

  // Global Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    variant: 'danger' | 'warning' | 'primary';
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    variant: 'danger',
    action: async () => {},
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('automanager_theme', theme);
  }, [theme]);

  // Core Data State
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Modals State
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);

  // Appointment Modal
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [preselectedClientId, setPreselectedClientId] = useState<string | undefined>();
  const [preselectedVehicleId, setPreselectedVehicleId] = useState<string | undefined>();
  const [preselectedDate, setPreselectedDate] = useState<string | undefined>();

  // Complete Appointment Modal
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completingAppointment, setCompletingAppointment] = useState<Appointment | null>(null);

  // Client Modal
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Vehicle Modal
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleModalClientId, setVehicleModalClientId] = useState<string>('');
  const [vehicleModalClientName, setVehicleModalClientName] = useState<string>('');
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Client Details Modal
  const [isClientDetailsOpen, setIsClientDetailsOpen] = useState(false);
  const [viewingClientId, setViewingClientId] = useState<string | null>(null);

  // Vehicle Timeline Modal
  const [isVehicleTimelineOpen, setIsVehicleTimelineOpen] = useState(false);
  const [viewingVehicleId, setViewingVehicleId] = useState<string | null>(null);

  // Transaction Modal
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionModalType, setTransactionModalType] = useState<'income' | 'expense'>('income');

  // Payment Baixa Modal
  const [isPaymentBaixaOpen, setIsPaymentBaixaOpen] = useState(false);
  const [payingTransaction, setPayingTransaction] = useState<Transaction | null>(null);

  // Fetch all core data
  const fetchData = useCallback(async () => {
    try {
      const [dashData, clientsData, aptsData, txsData, settingsData] = await Promise.all([
        api.getDashboard(),
        api.getClients(),
        api.getAppointments(),
        api.getTransactions(),
        api.getSettings(),
      ]);

      setStats(dashData.stats);
      setTodayAppointments(dashData.todayAppointments);
      setPendingTransactions(dashData.pendingTransactions);
      setClients(clientsData);
      setAppointments(aptsData);
      setTransactions(txsData);
      setSettings(settingsData);
    } catch (err) {
      console.error('Error fetching application data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Global Shortcut: Ctrl+K or Cmd+K to open/toggle Quick Search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Appointment Helpers
  const handleOpenNewAppointment = (date?: string, clientId?: string, vehicleId?: string) => {
    setEditingAppointment(null);
    setPreselectedDate(date);
    setPreselectedClientId(clientId);
    setPreselectedVehicleId(vehicleId);
    setIsAppointmentModalOpen(true);
  };

  const handleEditAppointment = (apt: Appointment) => {
    setEditingAppointment(apt);
    setIsAppointmentModalOpen(true);
  };

  const handleStartCompleteAppointment = (apt: Appointment) => {
    setCompletingAppointment(apt);
    setIsCompleteModalOpen(true);
  };

  const handleCancelAppointment = (apt: Appointment) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancelar Agendamento',
      message: `Deseja realmente cancelar o agendamento de ${apt.client?.name || 'Cliente'} (${apt.service_name})? O registro permanecerá no histórico como cancelado.`,
      confirmText: 'Sim, Cancelar',
      variant: 'warning',
      action: async () => {
        await api.updateAppointment(apt.id, { status: 'cancelado' });
        await fetchData();
      },
    });
  };

  const handleDeleteAppointment = (apt: Appointment) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Agendamento',
      message: `Deseja realmente excluir permanentemente o agendamento de ${apt.client?.name || 'Cliente'} (${apt.service_name})? Esta ação não pode ser desfeita.`,
      confirmText: 'Sim, Excluir Definitivamente',
      variant: 'danger',
      action: async () => {
        await api.deleteAppointment(apt.id);
        await fetchData();
      },
    });
  };

  // Client Helpers
  const handleOpenNewClient = () => {
    setEditingClient(null);
    setIsClientModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsClientModalOpen(true);
  };

  const handleViewClientDetails = (client: Client) => {
    setViewingClientId(client.id);
    setIsClientDetailsOpen(true);
  };

  const handleOpenAddVehicle = (clientId: string, clientName?: string) => {
    setVehicleModalClientId(clientId);
    setVehicleModalClientName(clientName || '');
    setEditingVehicle(null);
    setIsVehicleModalOpen(true);
  };

  // Transaction Helpers
  const handleOpenNewIncome = () => {
    setTransactionModalType('income');
    setIsTransactionModalOpen(true);
  };

  const handleOpenNewExpense = () => {
    setTransactionModalType('expense');
    setIsTransactionModalOpen(true);
  };

  const handleOpenPaymentBaixa = (tx: Transaction) => {
    setPayingTransaction(tx);
    setIsPaymentBaixaOpen(true);
  };

  const handleDeleteTransaction = (tx: Transaction) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Lançamento Financeiro',
      message: `Deseja realmente excluir permanentemente o lançamento "${tx.description}" no valor de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}? Esta ação atualizará o saldo de caixa e não pode ser desfeita.`,
      confirmText: 'Sim, Excluir Lançamento',
      variant: 'danger',
      action: async () => {
        await api.deleteTransaction(tx.id);
        await fetchData();
      },
    });
  };

  // Vehicle Timeline
  const handleOpenVehicleTimeline = (vehicleId: string) => {
    setViewingVehicleId(vehicleId);
    setIsVehicleTimelineOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F3F6FA] dark:bg-[#0B1320] flex flex-col lg:flex-row antialiased text-slate-800 dark:text-slate-100 transition-colors duration-150">
      {/* Sidebar (Desktop fixed, Mobile sliding drawer) */}
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        settings={settings}
        stats={stats}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0 pb-16 lg:pb-8">
        {/* Header */}
        <Header
          activePage={activePage}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenQuickSearch={() => setIsQuickSearchOpen(true)}
          onNewAppointment={() => handleOpenNewAppointment()}
          onNewIncome={handleOpenNewIncome}
          onNewExpense={handleOpenNewExpense}
        />

        {/* Page Content */}
        <main className="p-4 sm:p-6 flex-1 max-w-7xl w-full mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-[#182C45] dark:text-blue-400 mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Carregando sistema AutoGestor...</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Conectando ao banco de dados</p>
            </div>
          ) : (
            <>
              {activePage === 'visao_geral' && (
                <DashboardView
                  stats={stats}
                  todayAppointments={todayAppointments}
                  pendingTransactions={pendingTransactions}
                  onOpenNewAppointment={() => handleOpenNewAppointment()}
                  onOpenNewIncome={handleOpenNewIncome}
                  onOpenNewExpense={handleOpenNewExpense}
                  onOpenQuickSearch={() => setIsQuickSearchOpen(true)}
                  onSelectAppointment={handleEditAppointment}
                  onEditAppointment={handleEditAppointment}
                  onDeleteAppointment={handleDeleteAppointment}
                  onCompleteAppointment={handleStartCompleteAppointment}
                  onPayTransaction={handleOpenPaymentBaixa}
                  onNavigateToAgenda={() => setActivePage('agenda')}
                  onNavigateToFinancial={() => setActivePage('financeiro')}
                  onNavigateToClients={() => setActivePage('clientes')}
                />
              )}

              {activePage === 'agenda' && (
                <AgendaView
                  appointments={appointments}
                  onNewAppointment={(date) => handleOpenNewAppointment(date)}
                  onEditAppointment={handleEditAppointment}
                  onDeleteAppointment={handleDeleteAppointment}
                  onCompleteAppointment={handleStartCompleteAppointment}
                  onCancelAppointment={handleCancelAppointment}
                  onSelectVehicleHistory={handleOpenVehicleTimeline}
                />
              )}

              {activePage === 'clientes' && (
                <ClientsView
                  clients={clients}
                  appointments={appointments}
                  onNewClient={handleOpenNewClient}
                  onEditClient={handleEditClient}
                  onViewClientDetails={handleViewClientDetails}
                  onAddVehicle={(client) => handleOpenAddVehicle(client.id, client.name)}
                  onNewAppointmentForClient={(client, vehicleId) =>
                    handleOpenNewAppointment(undefined, client.id, vehicleId)
                  }
                />
              )}

              {activePage === 'financeiro' && (
                <FinancialView
                  stats={stats}
                  transactions={transactions}
                  onNewIncome={handleOpenNewIncome}
                  onNewExpense={handleOpenNewExpense}
                  onPayTransaction={handleOpenPaymentBaixa}
                  onDeleteTransaction={handleDeleteTransaction}
                />
              )}

              {activePage === 'servicos' && (
                <ServicesView
                  appointments={appointments}
                  onOpenVehicleTimeline={handleOpenVehicleTimeline}
                  onEditAppointment={handleEditAppointment}
                  onDeleteAppointment={handleDeleteAppointment}
                  onCompleteAppointment={handleStartCompleteAppointment}
                />
              )}

              {activePage === 'configuracoes' && (
                <SettingsView
                  settings={settings}
                  stats={stats}
                  onRefreshAll={fetchData}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav activePage={activePage} onNavigate={setActivePage} />

      {/* --- ALL MODALS --- */}

      {/* Quick Search Modal (Plate / Client / Vehicle) */}
      <QuickSearchModal
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
        onSelectClient={(c) => {
          setViewingClientId(c.id);
          setIsClientDetailsOpen(true);
        }}
        onSelectVehicle={(v) => {
          setViewingVehicleId(v.id);
          setIsVehicleTimelineOpen(true);
        }}
        onSelectAppointment={(a) => {
          setEditingAppointment(a);
          setIsAppointmentModalOpen(true);
        }}
        onNewAppointmentWithVehicle={(v) => {
          handleOpenNewAppointment(undefined, v.client_id, v.id);
        }}
      />

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => {
          setIsAppointmentModalOpen(false);
          setEditingAppointment(null);
          setPreselectedClientId(undefined);
          setPreselectedVehicleId(undefined);
          setPreselectedDate(undefined);
        }}
        onSuccess={fetchData}
        initialAppointment={editingAppointment}
        preselectedClientId={preselectedClientId}
        preselectedVehicleId={preselectedVehicleId}
        preselectedDate={preselectedDate}
      />

      {/* Complete Appointment Modal */}
      {completingAppointment && (
        <CompleteAppointmentModal
          isOpen={isCompleteModalOpen}
          onClose={() => {
            setIsCompleteModalOpen(false);
            setCompletingAppointment(null);
          }}
          onSuccess={fetchData}
          appointment={completingAppointment}
        />
      )}

      {/* Client Modal */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => {
          setIsClientModalOpen(false);
          setEditingClient(null);
        }}
        onSuccess={fetchData}
        initialClient={editingClient}
      />

      {/* Vehicle Modal */}
      <VehicleModal
        isOpen={isVehicleModalOpen}
        onClose={() => {
          setIsVehicleModalOpen(false);
          setEditingVehicle(null);
        }}
        onSuccess={fetchData}
        clientId={vehicleModalClientId}
        clientName={vehicleModalClientName}
        initialVehicle={editingVehicle}
      />

      {/* Client Details Modal */}
      {viewingClientId && (
        <ClientDetailsModal
          isOpen={isClientDetailsOpen}
          onClose={() => {
            setIsClientDetailsOpen(false);
            setViewingClientId(null);
          }}
          clientId={viewingClientId}
          onNewAppointment={(clientId, vehicleId) => {
            handleOpenNewAppointment(undefined, clientId, vehicleId);
          }}
          onAddVehicle={(clientId) => {
            const c = clients.find((cli) => cli.id === clientId);
            handleOpenAddVehicle(clientId, c?.name);
          }}
          onEditClient={(c) => {
            handleEditClient(c);
          }}
        />
      )}

      {/* Vehicle Timeline Modal */}
      {viewingVehicleId && (
        <VehicleTimelineModal
          isOpen={isVehicleTimelineOpen}
          onClose={() => {
            setIsVehicleTimelineOpen(false);
            setViewingVehicleId(null);
          }}
          vehicleId={viewingVehicleId}
          onNewAppointment={(clientId, vehicleId) => {
            handleOpenNewAppointment(undefined, clientId, vehicleId);
          }}
        />
      )}

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSuccess={fetchData}
        defaultType={transactionModalType}
      />

      {/* Payment Baixa Modal */}
      {payingTransaction && (
        <PaymentBaixaModal
          isOpen={isPaymentBaixaOpen}
          onClose={() => {
            setIsPaymentBaixaOpen(false);
            setPayingTransaction(null);
          }}
          onSuccess={fetchData}
          transaction={payingTransaction}
        />
      )}

      {/* Confirmation Dialog Modal */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        isLoading={confirmLoading}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={async () => {
          setConfirmLoading(true);
          try {
            await confirmDialog.action();
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          } catch (err: any) {
            console.error('Action error:', err);
          } finally {
            setConfirmLoading(false);
          }
        }}
      />
    </div>
  );
}
