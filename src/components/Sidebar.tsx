import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  DollarSign,
  Wrench,
  Settings,
  Car,
  Clock,
  ShieldCheck,
  X,
} from 'lucide-react';
import { StoreSettings, DashboardStats } from '../types/index.ts';

export type NavPage = 'visao_geral' | 'agenda' | 'clientes' | 'financeiro' | 'servicos' | 'configuracoes';

interface SidebarProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
  settings: StoreSettings | null;
  stats: DashboardStats | null;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  settings,
  stats,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'visao_geral' as NavPage,
      label: 'Visão Geral',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'agenda' as NavPage,
      label: 'Agenda',
      icon: Calendar,
      badge: stats?.today_appointments_count ? `${stats.today_appointments_count}` : null,
      badgeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'clientes' as NavPage,
      label: 'Clientes e Veículos',
      icon: Users,
      badge: null,
    },
    {
      id: 'financeiro' as NavPage,
      label: 'Financeiro',
      icon: DollarSign,
      badge: stats?.pending_transactions_count ? `${stats.pending_transactions_count}` : null,
      badgeColor: 'bg-amber-500 text-slate-900',
    },
    {
      id: 'servicos' as NavPage,
      label: 'Serviços e Histórico',
      icon: Wrench,
      badge: null,
    },
    {
      id: 'configuracoes' as NavPage,
      label: 'Configurações',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#182C45] text-white flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo & Brand Header */}
          <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-md">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white leading-none">
                  AutoGestor
                </h1>
                <span className="text-[10px] text-blue-200 uppercase font-medium tracking-wider">
                  SaaS Automotivo
                </span>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-slate-400 hover:text-white rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Store Badge */}
          <div className="px-4 py-3 mx-3 my-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-[11px] font-semibold text-blue-200 truncate">
              {settings?.business_name || 'Minha Loja de Carros'}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Operação em Tempo Real
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="px-3 py-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white/15 text-white shadow-xs font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-300' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        item.badgeColor || 'bg-blue-500 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              ADM
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">Administrador</div>
              <div className="text-[10px] text-slate-400 truncate">Painel de Gestão</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
