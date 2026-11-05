/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Sparkles,
  PieChart,
  BarChart3,
  Calendar,
  Layers,
  Info,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import {
  formatRupiah,
  filterTransactionsByPeriod,
  getExpenseCategoryBreakdown,
  getIncomeBreakdown,
} from '../utils/finance';

export const StatisticsView: React.FC = () => {
  const { transactions } = useFinance();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Filter transactions according to selected period
  const filteredTxs = useMemo(() => {
    return filterTransactionsByPeriod(transactions, period);
  }, [transactions, period]);

  // Income & Expense totals for period
  const { periodIncome, periodExpense, netDiff } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const tx of filteredTxs) {
      if (tx.type === 'INCOME') inc += tx.amount;
      else exp += tx.amount;
    }
    return {
      periodIncome: inc,
      periodExpense: exp,
      netDiff: inc - exp,
    };
  }, [filteredTxs]);

  // Category breakdown for expenses in this period
  const categoryBreakdown = useMemo(() => {
    return getExpenseCategoryBreakdown(filteredTxs);
  }, [filteredTxs]);

  // Income Breakdown: Auto vs Manual
  const incomeBreakdown = useMemo(() => {
    return getIncomeBreakdown(filteredTxs);
  }, [filteredTxs]);

  // Average daily spending
  const avgSpending = useMemo(() => {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    return periodExpense > 0 ? Math.round(periodExpense / days) : 0;
  }, [periodExpense, period]);

  // Largest expense category
  const largestCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

  // Generate data points for visual SVG cashflow comparison
  const maxBarValue = Math.max(periodIncome, periodExpense, 1);
  const incomeBarHeight = Math.round((periodIncome / maxBarValue) * 100);
  const expenseBarHeight = Math.round((periodExpense / maxBarValue) * 100);

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-200">
      {/* Period Filter Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-1.5 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
        {(['week', 'month', 'year'] as const).map((p) => {
          const labels = { week: 'Mingguan', month: 'Bulanan', year: 'Tahunan' };
          const isSel = period === p;
          return (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-xl transition-all ${
                isSel
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {labels[p]}
            </button>
          );
        })}
      </div>

      {/* Top Cards: Total Pemasukan, Total Pengeluaran, Selisih */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Total Pemasukan
            </span>
            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full font-bold">
              {filteredTxs.filter((t) => t.type === 'INCOME').length}x
            </span>
          </div>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {formatRupiah(periodIncome)}
          </div>
          <p className="text-[11px] text-slate-400">
            Periode {period === 'week' ? 'minggu ini' : period === 'month' ? 'bulan ini' : 'tahun ini'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-700 dark:text-rose-400">
            <span className="flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              Total Pengeluaran
            </span>
            <span className="text-[10px] bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full font-bold">
              {filteredTxs.filter((t) => t.type === 'EXPENSE').length}x
            </span>
          </div>
          <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
            {formatRupiah(periodExpense)}
          </div>
          <p className="text-[11px] text-slate-400">
            Rata-rata: {formatRupiah(avgSpending)}/hari
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-emerald-600" />
              Selisih Bersih
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                netDiff >= 0
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              {netDiff >= 0 ? 'Surplus' : 'Defisit'}
            </span>
          </div>
          <div
            className={`text-xl font-extrabold font-mono ${
              netDiff >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatRupiah(netDiff)}
          </div>
          <p className="text-[11px] text-slate-400">
            {netDiff >= 0 ? 'Finansial Anda surplus sehat' : 'Pengeluaran melebihi pemasukan'}
          </p>
        </div>
      </div>

      {/* Visual Chart 1: Pemasukan vs Pengeluaran Real-data Visualizer */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            Perbandingan Arus Kas
          </h3>
          <span className="text-xs text-slate-500 font-medium">Berdasarkan data tersimpan</span>
        </div>

        {periodIncome === 0 && periodExpense === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Belum ada aktivitas transaksi pada rentang waktu ini.
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Horizontal comparative visualization */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> Pemasukan
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatRupiah(periodIncome)}
                  </span>
                </div>
                <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(incomeBarHeight, 2)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-rose-700 dark:text-rose-400 flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" /> Pengeluaran
                  </span>
                  <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">
                    {formatRupiah(periodExpense)}
                  </span>
                </div>
                <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-red-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(expenseBarHeight, 2)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart 2: Pemasukan Otomatis vs Pemasukan Manual */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Distribusi Pemasukan
          </h3>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            Total {formatRupiah(incomeBreakdown.totalIncome)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Pemasukan Otomatis
            </div>
            <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              {formatRupiah(incomeBreakdown.autoIncomeTotal)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {incomeBreakdown.autoIncomeCount} transaksi mingguan
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 dark:text-sky-300">
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              Pemasukan Manual
            </div>
            <div className="text-base font-extrabold text-sky-600 dark:text-sky-400 font-mono mt-1">
              {formatRupiah(incomeBreakdown.manualIncomeTotal)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {incomeBreakdown.manualIncomeCount} transaksi manual
            </div>
          </div>
        </div>
      </div>

      {/* Kategori Pengeluaran Terbesar & Distribusi */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-rose-600" />
            Kategori Pengeluaran Terbesar
          </h3>
          {largestCategory && (
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              Utama: {largestCategory.category}
            </span>
          )}
        </div>

        {categoryBreakdown.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            Belum ada data pengeluaran pada periode ini.
          </div>
        ) : (
          <div className="space-y-3.5">
            {categoryBreakdown.map((item) => (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.category}
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatRupiah(item.total)}
                    </span>
                    <span className="text-slate-400 text-[11px] w-9 text-right font-semibold">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
