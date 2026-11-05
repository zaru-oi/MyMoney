/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Home,
  ArrowUpDown,
  History,
  BarChart3,
  Settings,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const AndroidBottomNav: React.FC = () => {
  const { activeTab, setActiveTab, openTxModal } = useFinance();

  const handleNavClick = (tabId: string) => {
    if (tabId === 'transaction') {
      // Direct prompt / options or open transaction modal
      openTxModal('INCOME');
      return;
    }
    setActiveTab(tabId as any);
  };

  const navItems = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'history', label: 'Riwayat', icon: History },
    { id: 'transaction', label: 'Transaksi', icon: ArrowUpDown, isAction: true },
    { id: 'statistics', label: 'Statistik', icon: BarChart3 },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <nav
      aria-label="Navigasi Utama Aplikasi"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/90 dark:border-slate-800 transition-colors pb-safe"
    >
      <div className="max-w-md mx-auto px-3 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isAction) {
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                aria-label="Catat Transaksi Baru"
                className="group flex flex-col items-center justify-center -mt-5 focus:outline-none"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 group-hover:scale-105 active:scale-95 transition-all">
                  <Icon className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                  Transaksi
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              aria-label={item.label}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-emerald-50 dark:bg-emerald-950/40' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              </div>
              <span className="text-[11px] tracking-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
