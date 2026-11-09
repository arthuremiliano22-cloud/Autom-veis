import React from 'react';
import { LayoutDashboard, Calendar, Users, DollarSign, Wrench } from 'lucide-react';
import { NavPage } from './Sidebar.tsx';

interface MobileBottomNavProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activePage,
  onNavigate,
}) => {
  const items = [
    { id: 'visao_geral' as NavPage, label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'agenda' as NavPage, label: 'Agenda', icon: Calendar },
    { id: 'clientes' as NavPage, label: 'Clientes', icon: Users },
    { id: 'financeiro' as NavPage, label: 'Financeiro', icon: DollarSign },
    { id: 'servicos' as NavPage, label: 'Serviços', icon: Wrench },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-[#111A29] border-t border-slate-200 dark:border-slate-800 lg:hidden px-2 py-1 shadow-lg flex items-center justify-around transition-colors">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activePage === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg transition-colors ${
              isActive ? 'text-[#182C45] dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-[#182C45] dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
