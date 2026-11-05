/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Wifi,
  BatteryMedium,
  Bell,
  Eye,
  EyeOff,
  Lock,
  Moon,
  Sun,
  Smartphone,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

interface AndroidHeaderProps {
  onOpenNotifications: () => void;
  isSimulatorFrame: boolean;
  toggleSimulatorFrame: () => void;
}

export const AndroidHeader: React.FC<AndroidHeaderProps> = ({
  onOpenNotifications,
  isSimulatorFrame,
  toggleSimulatorFrame,
}) => {
  const {
    isBalanceHidden,
    toggleBalanceHidden,
    unreadNotificationCount,
    settings,
    updateSettings,
    lockApp,
    activeTab,
  } = useFinance();

  const [currentTime, setCurrentTime] = useState<string>('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const nextTheme = settings.themeMode === 'dark' ? 'light' : 'dark';
    updateSettings({ ...settings, themeMode: nextTheme });
  };

  const titles: Record<string, string> = {
    home: 'MyMoney',
    transaction: 'Catat Transaksi',
    history: 'Riwayat Transaksi',
    statistics: 'Analisis & Statistik',
    savings: 'Target Tabungan',
    calendar: 'Kalender Finansial',
    settings: 'Pengaturan',
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Android Status Bar */}
      <div className="flex items-center justify-between px-5 pt-2 pb-1 text-xs font-semibold text-slate-700 dark:text-slate-300 select-none">
        <span className="tracking-tight">{currentTime}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-wider font-bold text-emerald-600 dark:text-emerald-400">
            5G
          </span>
          <Wifi className="w-3.5 h-3.5" />
          <BatteryMedium className="w-4 h-4" />
        </div>
      </div>

      {/* Main Top Bar */}
      <div className="flex items-center justify-between px-5 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 font-extrabold text-sm tracking-tight">
            MM
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              {titles[activeTab] || 'MyMoney'}
            </h1>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Personal Finance IDR
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Hide / Reveal Balance */}
          <button
            onClick={toggleBalanceHidden}
            aria-label={isBalanceHidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
            title={isBalanceHidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
          >
            {isBalanceHidden ? <EyeOff className="w-4 h-4 text-emerald-600" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            aria-label="Ganti mode tema"
            title="Ganti mode tema"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
          >
            {settings.themeMode === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Device Simulator Toggle for Desktop users */}
          <button
            onClick={toggleSimulatorFrame}
            aria-label="Alihkan tampilan bingkai mobile/layar penuh"
            title="Alihkan tampilan bingkai mobile/layar penuh"
            className={`hidden sm:inline-flex p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all ${
              isSimulatorFrame ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : ''
            }`}
          >
            <Smartphone className="w-4 h-4" />
          </button>

          {/* Notifications */}
          <button
            onClick={onOpenNotifications}
            aria-label={`Notifikasi (${unreadNotificationCount} belum dibaca)`}
            title="Notifikasi"
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* App Lock if PIN is active */}
          {settings.securityPin && (
            <button
              onClick={lockApp}
              aria-label="Kunci aplikasi dengan PIN"
              title="Kunci aplikasi"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
            >
              <Lock className="w-4 h-4 text-amber-500" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
