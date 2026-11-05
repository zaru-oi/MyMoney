/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  MinusCircle,
  Calendar,
  Tag,
  FileText,
  AlertTriangle,
  Wallet,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { TransactionType } from '../types/finance';
import { formatRupiah, parseRupiahInput } from '../utils/finance';

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000, 250000, 500000];

export const TransactionModal: React.FC = () => {
  const {
    activeTxModal,
    closeTxModal,
    editingTx,
    addTransaction,
    editTransaction,
    balance,
    settings,
  } = useFinance();

  const [type, setType] = useState<TransactionType>('INCOME');
  const [displayAmount, setDisplayAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (activeTxModal) {
      if (editingTx) {
        setType(editingTx.type);
        setDisplayAmount(editingTx.amount.toLocaleString('id-ID'));
        setCategory(editingTx.category);
        setDescription(editingTx.description);
        setDate(editingTx.date);
      } else {
        setType(activeTxModal);
        setDisplayAmount('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        // Default category
        if (activeTxModal === 'INCOME') {
          setCategory(settings.customIncomeCategories[0] || 'Uang tambahan');
        } else {
          setCategory(settings.customExpenseCategories[0] || 'Makanan dan minuman');
        }
      }
      setErrorMsg('');
    }
  }, [activeTxModal, editingTx, settings]);

  if (!activeTxModal) return null;

  const currentNumericAmount = parseRupiahInput(displayAmount);

  // Categories list based on active type
  const availableCategories =
    type === 'INCOME'
      ? settings.customIncomeCategories
      : settings.customExpenseCategories;

  // Available spending limit for expenses
  const effectiveFreeBalance =
    balance.freeBalance +
    (editingTx && editingTx.type === 'EXPENSE' ? editingTx.amount : 0);

  const isOverBalance =
    type === 'EXPENSE' && currentNumericAmount > effectiveFreeBalance;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const numeric = parseRupiahInput(val);
    if (numeric === 0) {
      setDisplayAmount(val === '' ? '' : '0');
    } else {
      setDisplayAmount(numeric.toLocaleString('id-ID'));
    }
    setErrorMsg('');
  };

  const handleQuickAdd = (amt: number) => {
    const newTotal = currentNumericAmount + amt;
    setDisplayAmount(newTotal.toLocaleString('id-ID'));
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentNumericAmount <= 0) {
      setErrorMsg('Masukkan nominal yang valid (lebih dari Rp0).');
      return;
    }

    if (isOverBalance) {
      setErrorMsg(
        `Saldo tidak mencukupi! Saldo bebas tersedia ${formatRupiah(
          effectiveFreeBalance
        )}.`
      );
      return;
    }

    const payload = {
      amount: currentNumericAmount,
      type,
      category: category || (type === 'INCOME' ? 'Uang tambahan' : 'Lainnya'),
      description: description.trim(),
      date,
    };

    if (editingTx) {
      const res = editTransaction(editingTx.id, payload);
      if (!res.success && res.error) {
        setErrorMsg(res.error);
      }
    } else {
      const res = addTransaction(payload);
      if (!res.success && res.error) {
        setErrorMsg(res.error);
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {type === 'INCOME' ? (
              <PlusCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <MinusCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            )}
            <h2 id="modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              {editingTx
                ? 'Edit Transaksi'
                : type === 'INCOME'
                ? 'Tambah Uang'
                : 'Kurangi Uang'}
            </h2>
          </div>
          <button
            onClick={closeTxModal}
            aria-label="Tutup form transaksi"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Type Toggle (Income vs Expense) */}
          {!editingTx && (
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setType('INCOME');
                  setCategory(settings.customIncomeCategories[0] || 'Uang tambahan');
                  setErrorMsg('');
                }}
                className={`py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  type === 'INCOME'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                Tambah (+)
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('EXPENSE');
                  setCategory(settings.customExpenseCategories[0] || 'Makanan dan minuman');
                  setErrorMsg('');
                }}
                className={`py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  type === 'EXPENSE'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <MinusCircle className="w-4 h-4" />
                Kurangi (-)
              </button>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <label
              htmlFor="tx-amount"
              className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block"
            >
              Nominal Uang (IDR)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-extrabold text-slate-400 dark:text-slate-500">
                Rp
              </span>
              <input
                id="tx-amount"
                type="text"
                inputMode="numeric"
                required
                placeholder="0"
                value={displayAmount}
                onChange={handleAmountChange}
                className={`w-full pl-14 pr-4 py-3.5 text-2xl font-extrabold rounded-2xl border transition-all focus:outline-none focus:ring-4 ${
                  isOverBalance
                    ? 'border-rose-400 dark:border-rose-600 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 focus:ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-emerald-500/20'
                }`}
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickAdd(amt)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-95 transition-all"
                >
                  +{amt >= 1000 ? `${amt / 1000}rb` : amt}
                </button>
              ))}
            </div>

            {/* Free balance indicator & warning */}
            {type === 'EXPENSE' && (
              <div
                className={`flex items-start gap-2 p-3 rounded-xl text-xs font-medium transition-all ${
                  isOverBalance
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {isOverBalance ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                ) : (
                  <Wallet className="w-4 h-4 shrink-0 text-slate-500 mt-0.5" />
                )}
                <div>
                  <p>
                    Saldo bebas tersedia:{' '}
                    <strong className="font-bold">{formatRupiah(effectiveFreeBalance)}</strong>
                  </p>
                  {isOverBalance && (
                    <p className="mt-0.5 font-semibold text-rose-600 dark:text-rose-400">
                      Pengeluaran melebihi saldo! Kurangi sebesar{' '}
                      {formatRupiah(currentNumericAmount - effectiveFreeBalance)}.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Category Selector */}
          <div className="space-y-2">
            <label
              htmlFor="tx-category"
              className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5" />
              Kategori
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
              {availableCategories.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-2 text-left rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? type === 'INCOME'
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30'
                          : 'border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/30'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note / Description */}
          <div className="space-y-2">
            <label
              htmlFor="tx-desc"
              className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              Keterangan (Opsional)
            </label>
            <input
              id="tx-desc"
              type="text"
              placeholder={
                type === 'INCOME'
                  ? 'Contoh: Bonus proyek, Hadiah ultah'
                  : 'Contoh: Makan siang nasi padang'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <label
              htmlFor="tx-date"
              className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              Tanggal Transaksi
            </label>
            <input
              id="tx-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit & Cancel Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={closeTxModal}
              className="w-1/3 py-3 px-4 rounded-2xl font-bold text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-98 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={currentNumericAmount <= 0 || isOverBalance}
              className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm text-white shadow-lg active:scale-98 transition-all ${
                currentNumericAmount <= 0 || isOverBalance
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed shadow-none'
                  : type === 'INCOME'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
              }`}
            >
              {editingTx
                ? 'Simpan Perubahan'
                : type === 'INCOME'
                ? `Simpan Pemasukan (+${formatRupiah(currentNumericAmount)})`
                : `Simpan Pengeluaran (-${formatRupiah(currentNumericAmount)})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
