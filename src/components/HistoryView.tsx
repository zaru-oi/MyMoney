/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Sparkles,
  Inbox,
  AlertTriangle,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Transaction } from '../types/finance';
import { formatRupiah, getCategoryColor } from '../utils/finance';
import { formatIndonesianDateString } from '../utils/autoIncome';

export const HistoryView: React.FC = () => {
  const { transactions, openTxModal, deleteTransaction } = useFinance();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [monthFilter, setMonthFilter] = useState<string>('ALL'); // YYYY-MM
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  // Extract unique categories and months from actual transactions
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach((tx) => cats.add(tx.category));
    return Array.from(cats);
  }, [transactions]);

  const uniqueMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach((tx) => {
      const ym = tx.date.substring(0, 7); // YYYY-MM
      months.add(ym);
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  // Filtered list
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type
      if (typeFilter !== 'ALL' && tx.type !== typeFilter) return false;

      // Category
      if (categoryFilter !== 'ALL' && tx.category !== categoryFilter) return false;

      // Month
      if (monthFilter !== 'ALL' && !tx.date.startsWith(monthFilter)) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesDesc = tx.description?.toLowerCase().includes(query);
        const matchesCat = tx.category.toLowerCase().includes(query);
        const matchesDate = tx.date.includes(query);
        if (!matchesDesc && !matchesCat && !matchesDate) return false;
      }

      return true;
    });
  }, [transactions, typeFilter, categoryFilter, monthFilter, searchQuery]);

  const confirmDelete = () => {
    if (txToDelete) {
      deleteTransaction(txToDelete.id);
      setTxToDelete(null);
    }
  };

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-200">
      {/* Search and Top Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari transaksi berdasarkan nama, keterangan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />
        </div>

        {/* Filter Chips: All, Income, Expense */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`flex-1 py-1.5 rounded-xl transition-all ${
              typeFilter === 'ALL'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Semua ({transactions.length})
          </button>
          <button
            onClick={() => setTypeFilter('INCOME')}
            className={`flex-1 py-1.5 rounded-xl transition-all ${
              typeFilter === 'INCOME'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 dark:text-emerald-400 hover:opacity-80'
            }`}
          >
            Pemasukan (+)
          </button>
          <button
            onClick={() => setTypeFilter('EXPENSE')}
            className={`flex-1 py-1.5 rounded-xl transition-all ${
              typeFilter === 'EXPENSE'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 dark:text-rose-400 hover:opacity-80'
            }`}
          >
            Pengeluaran (-)
          </button>
        </div>

        {/* Secondary Filters: Category & Month dropdowns */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Filter Kategori:
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
            >
              <option value="ALL">Semua Kategori</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Filter Bulan:
            </label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
            >
              <option value="ALL">Semua Bulan</option>
              {uniqueMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Ditemukan {filteredTransactions.length} Transaksi
          </span>
          {(typeFilter !== 'ALL' || categoryFilter !== 'ALL' || monthFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setTypeFilter('ALL');
                setCategoryFilter('ALL');
                setMonthFilter('ALL');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Tidak ada transaksi ditemukan
            </p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Coba sesuaikan kata kunci pencarian atau bersihkan filter di atas.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTransactions.map((tx) => {
              const isIncome = tx.type === 'INCOME';
              const catColor = getCategoryColor(tx.category);

              return (
                <div
                  key={tx.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: catColor }}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {tx.description || tx.category}
                        </h4>
                        {tx.automaticPeriodId && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                            <Sparkles className="w-2.5 h-2.5" />
                            Otomatis
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {tx.category}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatIndonesianDateString(tx.date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left sm:text-right">
                      <div
                        className={`text-base font-extrabold font-mono ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {formatRupiah(tx.amount, { showSign: true, type: tx.type })}
                      </div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400">
                        {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openTxModal(tx.type, tx)}
                        aria-label={`Edit transaksi ${tx.description}`}
                        className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setTxToDelete(tx)}
                        aria-label={`Hapus transaksi ${tx.description}`}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Deletion */}
      {txToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hapus Transaksi?
              </h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus transaksi{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  "{txToDelete.description || txToDelete.category}"
                </strong>{' '}
                sebesar{' '}
                <span className="font-bold text-rose-600">
                  {formatRupiah(txToDelete.amount)}
                </span>
                ? Saldo dan statistik akan dihitung ulang secara otomatis.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setTxToDelete(null)}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/30 transition-all"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
