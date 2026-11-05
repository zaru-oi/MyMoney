/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Target,
  Plus,
  ArrowDownRight,
  ArrowUpLeft,
  Trash2,
  Edit3,
  Calendar,
  CheckCircle,
  AlertCircle,
  PiggyBank,
  Wallet,
  Sparkles,
  X,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { SavingsGoal } from '../types/finance';
import { formatRupiah, parseRupiahInput } from '../utils/finance';
import { formatIndonesianDateString } from '../utils/autoIncome';

export const SavingsGoalsView: React.FC = () => {
  const {
    savingsGoals,
    balance,
    addSavingsGoal,
    updateSavingsGoal,
    depositToSavingsGoal,
    withdrawFromSavingsGoal,
    deleteSavingsGoal,
  } = useFinance();

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [activeDepositGoal, setActiveDepositGoal] = useState<SavingsGoal | null>(null);
  const [activeWithdrawGoal, setActiveWithdrawGoal] = useState<SavingsGoal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);

  // Form states for creating / editing goal
  const [goalName, setGoalName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [goalError, setGoalError] = useState('');

  // Action amount state (for deposit/withdraw)
  const [actionAmountStr, setActionAmountStr] = useState('');
  const [actionError, setActionError] = useState('');

  const openCreateModal = () => {
    setGoalName('');
    setTargetAmountStr('');
    setTargetDate('');
    setGoalError('');
    setIsCreateModalOpen(true);
  };

  const openEditModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setGoalName(goal.name);
    setTargetAmountStr(goal.targetAmount.toLocaleString('id-ID'));
    setTargetDate(goal.targetDate || '');
    setGoalError('');
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAmt = parseRupiahInput(targetAmountStr);

    if (!goalName.trim()) {
      setGoalError('Nama target tabungan wajib diisi.');
      return;
    }
    if (targetAmt <= 0) {
      setGoalError('Target nominal harus lebih dari Rp0.');
      return;
    }

    if (editingGoal) {
      const res = updateSavingsGoal(editingGoal.id, {
        name: goalName,
        targetAmount: targetAmt,
        targetDate: targetDate || undefined,
      });
      if (res.success) {
        setEditingGoal(null);
      } else {
        setGoalError(res.error || 'Gagal mengubah target');
      }
    } else {
      const res = addSavingsGoal({
        name: goalName,
        targetAmount: targetAmt,
        targetDate: targetDate || undefined,
      });
      if (res.success) {
        setIsCreateModalOpen(false);
      } else {
        setGoalError(res.error || 'Gagal membuat target');
      }
    }
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDepositGoal) return;
    const amt = parseRupiahInput(actionAmountStr);
    const res = depositToSavingsGoal(activeDepositGoal.id, amt);
    if (res.success) {
      setActiveDepositGoal(null);
      setActionAmountStr('');
      setActionError('');
    } else {
      setActionError(res.error || 'Gagal menabung');
    }
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWithdrawGoal) return;
    const amt = parseRupiahInput(actionAmountStr);
    const res = withdrawFromSavingsGoal(activeWithdrawGoal.id, amt);
    if (res.success) {
      setActiveWithdrawGoal(null);
      setActionAmountStr('');
      setActionError('');
    } else {
      setActionError(res.error || 'Gagal menarik tabungan');
    }
  };

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-200">
      {/* Informative Header Banner */}
      <div className="bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/30 rounded-3xl p-5 border border-sky-100 dark:border-sky-900/40 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-sky-600 text-white shadow-xs">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Target Tabungan
              </h2>
              <p className="text-xs text-slate-500">
                Alokasi dana impian tanpa risiko terpakai belanja
              </p>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/25 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Target Baru
          </button>
        </div>

        {/* Balance overview summary */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="bg-white/90 dark:bg-slate-900/80 rounded-2xl p-3 border border-sky-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 block">Total Ditabung:</span>
            <span className="text-sm sm:text-base font-extrabold text-sky-600 dark:text-sky-400 font-mono">
              {formatRupiah(balance.totalSavings)}
            </span>
          </div>
          <div className="bg-white/90 dark:bg-slate-900/80 rounded-2xl p-3 border border-sky-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 block">Saldo Bebas Tersedia:</span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {formatRupiah(balance.freeBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* List of Goals */}
      {savingsGoals.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-14 h-14 rounded-3xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 flex items-center justify-center mx-auto">
            <Target className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Belum ada target tabungan
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Mulai rencanakan pembelian barang, dana darurat, atau liburan Anda. Setiap rupiah yang disisihkan tetap aman dan terpantau.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-600 text-white font-bold text-xs shadow-md shadow-sky-600/30 hover:bg-sky-700 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Buat Target Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {savingsGoals.map((goal) => {
            const percentage =
              goal.targetAmount > 0
                ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                : 0;
            const isCompleted = percentage >= 100;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:shadow-md transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 flex items-center justify-center font-bold text-lg shrink-0">
                      🎯
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          {goal.name}
                        </h4>
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                            <Sparkles className="w-3 h-3" />
                            Tercapai!
                          </span>
                        )}
                      </div>
                      {goal.targetDate && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          Target: {formatIndonesianDateString(goal.targetDate)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Edit / Delete actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(goal)}
                      aria-label={`Edit target ${goal.name}`}
                      className="p-2 rounded-xl text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setGoalToDelete(goal)}
                      aria-label={`Hapus target ${goal.name}`}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Amounts */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-semibold text-slate-500">Terkumpul:</span>
                    <span className="font-mono">
                      <strong className="text-sm font-extrabold text-sky-600 dark:text-sky-400">
                        {formatRupiah(goal.currentAmount)}
                      </strong>{' '}
                      <span className="text-slate-400">/ {formatRupiah(goal.targetAmount)}</span>
                    </span>
                  </div>

                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : 'bg-gradient-to-r from-sky-500 to-indigo-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span className="font-bold text-sky-700 dark:text-sky-300">
                      {percentage}% Tercapai
                    </span>
                    <span>
                      {isCompleted ? 'Target terpenuhi 🎉' : `Kurang ${formatRupiah(remaining)}`}
                    </span>
                  </div>
                </div>

                {/* Actions: Tambah Tabungan & Tarik Tabungan */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setActiveDepositGoal(goal);
                      setActionAmountStr('');
                      setActionError('');
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs active:scale-98 transition-all"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    Isi Tabungan (+)
                  </button>

                  <button
                    onClick={() => {
                      setActiveWithdrawGoal(goal);
                      setActionAmountStr('');
                      setActionError('');
                    }}
                    disabled={goal.currentAmount <= 0}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl font-bold text-xs active:scale-98 transition-all ${
                      goal.currentAmount <= 0
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    <ArrowUpLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                    Tarik Dana (-)
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create or Edit Goal */}
      {(isCreateModalOpen || editingGoal) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingGoal ? 'Edit Target Tabungan' : 'Target Tabungan Baru'}
              </h3>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingGoal(null);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Nama Target
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beli Laptop, Dana Darurat"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Target Nominal (IDR)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="Contoh: 1.500.000"
                  value={targetAmountStr}
                  onChange={(e) => {
                    const num = parseRupiahInput(e.target.value);
                    setTargetAmountStr(num === 0 ? '' : num.toLocaleString('id-ID'));
                  }}
                  className="w-full px-4 py-2.5 text-base font-extrabold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Target Waktu (Opsional)
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {goalError && (
                <p className="text-xs text-rose-600 font-semibold">{goalError}</p>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingGoal(null);
                  }}
                  className="py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl font-bold text-xs text-white bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/30"
                >
                  {editingGoal ? 'Simpan' : 'Buat Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Deposit into Goal */}
      {activeDepositGoal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Isi Tabungan: "{activeDepositGoal.name}"
            </h3>
            <p className="text-xs text-slate-500">
              Dana akan dipindahkan dari saldo bebas ke target tabungan ini.
            </p>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Nominal Simpanan:</span>
                  <span>Saldo Bebas: {formatRupiah(balance.freeBalance)}</span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="Contoh: 50.000"
                  value={actionAmountStr}
                  onChange={(e) => {
                    const num = parseRupiahInput(e.target.value);
                    setActionAmountStr(num === 0 ? '' : num.toLocaleString('id-ID'));
                    setActionError('');
                  }}
                  className="w-full px-4 py-3 text-lg font-extrabold rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {actionError && (
                <p className="text-xs text-rose-600 font-semibold">{actionError}</p>
              )}

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveDepositGoal(null)}
                  className="py-2.5 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 dark:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/30"
                >
                  Tambahkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Withdraw from Goal */}
      {activeWithdrawGoal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Tarik Dana: "{activeWithdrawGoal.name}"
            </h3>
            <p className="text-xs text-slate-500">
              Uang tabungan akan dikembalikan ke saldo bebas untuk digunakan.
            </p>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Nominal Penarikan:</span>
                  <span>Tersimpan: {formatRupiah(activeWithdrawGoal.currentAmount)}</span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="Contoh: 20.000"
                  value={actionAmountStr}
                  onChange={(e) => {
                    const num = parseRupiahInput(e.target.value);
                    setActionAmountStr(num === 0 ? '' : num.toLocaleString('id-ID'));
                    setActionError('');
                  }}
                  className="w-full px-4 py-3 text-lg font-extrabold rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {actionError && (
                <p className="text-xs text-rose-600 font-semibold">{actionError}</p>
              )}

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveWithdrawGoal(null)}
                  className="py-2.5 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 dark:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl font-bold text-xs text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/30"
                >
                  Tarik ke Saldo Bebas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Goal confirmation */}
      {goalToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Hapus Target Tabungan?
            </h3>
            <p className="text-xs text-slate-500">
              Apakah Anda yakin ingin menghapus target "{goalToDelete.name}"?
              {goalToDelete.currentAmount > 0 && (
                <strong className="block text-emerald-600 mt-1">
                  Seluruh dana tersimpan ({formatRupiah(goalToDelete.currentAmount)}) akan otomatis kembali ke saldo bebas Anda.
                </strong>
              )}
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setGoalToDelete(null)}
                className="py-2.5 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 dark:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteSavingsGoal(goalToDelete.id);
                  setGoalToDelete(null);
                }}
                className="py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700"
              >
                Hapus Target
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
