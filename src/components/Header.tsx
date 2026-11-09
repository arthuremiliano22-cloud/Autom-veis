import React from 'react';
import { Menu, Search, Plus, TrendingUp, TrendingDown, Calendar, Moon, Sun } from 'lucide-react';
import { NavPage } from './Sidebar.tsx';

interface HeaderProps {
  activePage: NavPage;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenMobileSidebar: () => void;
  onOpenQuickSearch: () => void;
  onNewAppointment: () => void;
  onNewIncome: () => void;
  onNewExpense: () => void;
}

const PAGE_TITLES: Record<NavPage, { title: string; subtitle: string }> = {
  visao_geral: {
    title: 'Visão Geral',
    subtitle: 'Painel executivo, indicadores do dia e pendências',
  },
  agenda: {
    title: 'Agenda de Serviços',
    subtitle: 'Cronograma diário, semanal e controle de horários',
  },
  clientes: {
    title: 'Clientes e Veículos',
    subtitle: 'Base de dados cadastrais, telefones e frotas',
  },
  financeiro: {
    title: 'Controle Financeiro',
    subtitle: 'Fluxo de caixa, conciliação de receitas, despesas e baixas',
  },
  servicos: {
    title: 'Serviços e Histórico',
    subtitle: 'Linha do tempo operacional e histórico por placa',
  },
  configuracoes: {
    title: 'Configurações da Loja',
    subtitle: 'Dados da empresa, saldo inicial e backup do sistema',
  },
};

export const Header: React.FC<HeaderProps> = ({
  activePage,
  theme,
  onToggleTheme,
  onOpenMobileSidebar,
  onOpenQuickSearch,
  onNewAppointment,
  onNewIncome,
  onNewExpense,
}) => {
  const pageInfo = PAGE_TITLES[activePage] || { title: 'AutoGestor', subtitle: '' };

  const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const capitalizedDate = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-[#111A29] border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 shadow-2xs transition-colors">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile hamburger & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {pageInfo.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              {pageInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Center / Right: Quick Search + Theme Toggle + Date + Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search Button (Plate / Client) */}
          <button
            onClick={onOpenQuickSearch}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#162338] hover:bg-slate-100 dark:hover:bg-[#1E2F4A] border border-slate-200 dark:border-slate-700 rounded-lg transition-colors group cursor-pointer shadow-2xs"
            title="Buscar por placa ou cliente (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
            <span className="hidden md:inline font-medium text-slate-700 dark:text-slate-200">
              Buscar Placa ou Cliente...
            </span>
            <span className="md:hidden font-medium text-slate-700 dark:text-slate-200">Buscar Placa</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] text-slate-400 dark:text-slate-400 bg-white dark:bg-[#111A29] border border-slate-200 dark:border-slate-700 rounded">
              Ctrl K
            </kbd>
          </button>

          {/* Theme Switcher Toggle (Visual Comfort) */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-[#162338] hover:bg-slate-100 dark:hover:bg-[#1E2F4A] border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Ativar Modo Noturno / Conforto Visual'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="hidden xl:inline text-[11px] text-slate-300">Conforto Visual</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-600 shrink-0" />
                <span className="hidden xl:inline text-[11px] text-slate-600">Modo Escuro</span>
              </>
            )}
          </button>

          {/* Date Tag */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-[#162338] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>{capitalizedDate}</span>
          </div>

          {/* Direct Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onNewAppointment}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#182C45] dark:bg-blue-600 hover:bg-[#122237] dark:hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Novo Agendamento</span>
              <span className="sm:hidden">+ Agenda</span>
            </button>
            <button
              onClick={onNewIncome}
              className="hidden md:flex px-2.5 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-lg transition-colors items-center gap-1"
              title="Registrar nova receita"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Receita</span>
            </button>
            <button
              onClick={onNewExpense}
              className="hidden md:flex px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#1A263B] hover:bg-slate-200 dark:hover:bg-[#23334F] border border-slate-200 dark:border-slate-700 rounded-lg transition-colors items-center gap-1"
              title="Registrar nova despesa"
            >
              <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Despesa</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
