/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Plus,
  Minus,
  Sparkles,
  ChevronRight,
  Clock,
  CheckCircle2,
  CalendarDays,
  Target,
  BarChart2,
  RefreshCw,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatRupiah, filterTransactionsByPeriod, getCategoryColor } from '../utils/finance';
import { formatIndonesianDateString } from '../utils/autoIncome';

export const DashboardView: React.FC = () => {
  const {
    balance,
    transactions,
    savingsGoals,
    settings,
    autoIncomeStatus,
    isBalanceHidden,
    toggleBalanceHidden,
    openTxModal,
    setActiveTab,
    processAutoIncomeManually,
    triggerToast,
  } = useFinance();

  const [summaryPeriod, setSummaryPeriod] = useState<'today' | 'week' | 'month'>('month');

  // Filtered transactions for the summary cards
  const periodFilteredTxs = filterTransactionsByPeriod(transactions, summaryPeriod);

  let periodIncome = 0;
  let periodExpense = 0;
  for (const tx of periodFilteredTxs) {
    if (tx.type === 'INCOME') periodIncome += tx.amount;
    else periodExpense += tx.amount;
  }

  // Latest 6 transactions
  const recentTransactions = transactions.slice(0, 6);

  const handleManualClaim = () => {
    const processed = processAutoIncomeManually();
    if (processed === 0) {
      triggerToast('Pemasukan mingguan sudah tercatat untuk periode saat ini.', 'info');
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-250">
      {/* Total Saldo Card (Hero Fintech Card) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white p-6 shadow-xl shadow-emerald-950/20 border border-emerald-900/40">
        {/* Subtle decorative glow circles */}
        <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-300/80 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" />
              Total Saldo Utama
            </span>
            <button
              onClick={toggleBalanceHidden}
              className="text-xs text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-lg backdrop-blur-sm transition-all"
            >
              {isBalanceHidden ? 'Tampilkan' : 'Sembunyikan'}
            </button>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-emerald-400">
              {isBalanceHidden ? '••••••••' : formatRupiah(balance.grossBalance)}
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {balance.grossBalance >= 0
                ? 'Kondisi finansial Anda seimbang & tercatat'
                : 'Peringatan: Saldo defisit'}
            </p>
          </div>

          {/* Sub-breakdown: Saldo Bebas vs Saldo Tabungan */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
            <div className="bg-white/5 rounded-2xl p-2.5 backdrop-blur-sm">
              <span className="text-[11px] text-slate-300 block">Saldo Bebas (Siap Belanja)</span>
              <span className="text-sm font-bold text-white font-mono">
                {isBalanceHidden ? '••••••' : formatRupiah(balance.freeBalance)}
              </span>
            </div>
            <div className="bg-white/5 rounded-2xl p-2.5 backdrop-blur-sm">
              <span className="text-[11px] text-slate-300 block flex items-center gap-1">
                <PiggyBank className="w-3 h-3 text-teal-300" />
                Tabungan ({savingsGoals.length})
              </span>
              <span className="text-sm font-bold text-teal-300 font-mono">
                {isBalanceHidden ? '••••••' : formatRupiah(balance.totalSavings)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => openTxModal('INCOME')}
          aria-label="Tambah Uang"
          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 active:scale-98 transition-all"
        >
          <div className="p-1 rounded-lg bg-white/20">
            <Plus className="w-4 h-4 stroke-[3]" />
          </div>
          <span>Tambah Uang</span>
        </button>

        <button
          onClick={() => openTxModal('EXPENSE')}
          aria-label="Kurangi Uang"
          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-600/20 active:scale-98 transition-all"
        >
          <div className="p-1 rounded-lg bg-white/20">
            <Minus className="w-4 h-4 stroke-[3]" />
          </div>
          <span>Kurangi Uang</span>
        </button>

        <button
          onClick={() => setActiveTab('savings')}
          aria-label="Target Tabungan"
          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md shadow-sky-600/20 active:scale-98 transition-all"
        >
          <Target className="w-4 h-4" />
          <span>Target Tabungan</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          aria-label="Kalender Finansial"
          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 active:scale-98 transition-all"
        >
          <CalendarDays className="w-4 h-4" />
          <span>Kalender</span>
        </button>
      </div>

      {/* FITUR UTAMA: KARTU PEMASUKAN OTOMATIS MINGGUAN */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-slate-900/60 dark:to-emerald-950/30 rounded-3xl p-5 border border-emerald-200 dark:border-emerald-800/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                Sistem Pemasukan Otomatis
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Uang Mingguan
              </h3>
            </div>
          </div>

          <span
            className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 ${
              settings.autoIncomeEnabled
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                settings.autoIncomeEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            {settings.autoIncomeEnabled ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/80 rounded-2xl p-4 border border-emerald-100 dark:border-slate-800 space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Nominal Terjadwal:
            </span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {formatRupiah(settings.weeklyAmount)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Pemasukan Berikutnya:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {autoIncomeStatus.nextDate}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              Countdown:
            </span>
            <span className="font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              {autoIncomeStatus.countdownText}
            </span>
          </div>
        </div>

        {/* Action / Sync Button */}
        <div className="flex items-center justify-between text-xs pt-1">
          <button
            onClick={() => setActiveTab('settings')}
            className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
          >
            Ubah Jadwal & Nominal
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleManualClaim}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all active:scale-95 shadow-sm"
          >
            <RefreshCw className="w-3 h-3" />
            Periksa Sekarang
          </button>
        </div>
      </div>

      {/* Ringkasan Keuangan (Financial Summary) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-emerald-600" />
            Ringkasan Keuangan
          </h3>

          {/* Period selector */}
          <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            {(['today', 'week', 'month'] as const).map((p) => {
              const labels = { today: 'Hari Ini', week: 'Minggu Ini', month: 'Bulan Ini' };
              const isSel = summaryPeriod === p;
              return (
                <button
                  key={p}
                  onClick={() => setSummaryPeriod(p)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    isSel
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
              <TrendingUp className="w-3 h-3" />
              Pemasukan
            </div>
            <div className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {formatRupiah(periodIncome)}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 mb-1">
              <TrendingDown className="w-3 h-3" />
              Pengeluaran
            </div>
            <div className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">
              {formatRupiah(periodExpense)}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/40">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <Wallet className="w-3 h-3" />
              Saldo Bebas
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
              {isBalanceHidden ? '••••••' : formatRupiah(balance.freeBalance)}
            </div>
          </div>
        </div>
      </div>

      {/* Transaksi Terbaru (Recent Transactions) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Transaksi Terbaru
            </h3>
            <p className="text-xs text-slate-500">
              {transactions.length} total transaksi tersimpan
            </p>
          </div>
          <button
            onClick={() => setActiveTab('history')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            Lihat Semua
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Belum ada transaksi
            </p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Tekan tombol Tambah Uang atau aktifkan pemasukan otomatis mingguan untuk mulai mencatat keuangan Anda.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTransactions.map((tx) => {
              const isIncome = tx.type === 'INCOME';
              const catColor = getCategoryColor(tx.category);

              return (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-3 group hover:bg-slate-50/60 dark:hover:bg-slate-800/40 rounded-xl px-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 font-bold text-xs shadow-xs"
                      style={{ backgroundColor: catColor }}
                    >
                      {tx.category.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {tx.description || tx.category}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">
                          {tx.category}
                        </span>
                        <span>•</span>
                        <span>{formatIndonesianDateString(tx.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-extrabold font-mono ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatRupiah(tx.amount, { showSign: true, type: tx.type })}
                    </span>
                    {tx.automaticPeriodId && (
                      <span className="block text-[9px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400">
                        Otomatis
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
