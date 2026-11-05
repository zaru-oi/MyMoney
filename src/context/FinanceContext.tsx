/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Transaction,
  SavingsGoal,
  Settings,
  AppNotification,
  BalanceSummary,
  AutoIncomeStatus,
  TransactionType,
} from '../types/finance';
import {
  loadTransactions,
  saveTransactions,
  loadSavingsGoals,
  saveSavingsGoals,
  loadSettings,
  saveSettings,
  loadNotifications,
  saveNotifications,
  clearAllData,
  importBackupJSON,
} from '../utils/storage';
import {
  calculateBalance,
  validateExpense,
  validateIncome,
  formatRupiah,
} from '../utils/finance';
import {
  calculateMissedPeriods,
  createTransactionsForMissedPeriods,
  getNextIncomeInfo,
} from '../utils/autoIncome';

interface TransactionInput {
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
}

interface SavingsGoalInput {
  name: string;
  targetAmount: number;
  targetDate?: string;
  categoryIcon?: string;
  color?: string;
}

interface FinanceContextType {
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  settings: Settings;
  notifications: AppNotification[];
  unreadNotificationCount: number;
  balance: BalanceSummary;
  autoIncomeStatus: AutoIncomeStatus;
  isBalanceHidden: boolean;
  toggleBalanceHidden: () => void;
  isPinLocked: boolean;
  isPinUnlocked: boolean;
  unlockWithPin: (pin: string) => boolean;
  lockApp: () => void;
  // Transaction actions
  addTransaction: (input: TransactionInput) => { success: boolean; error?: string };
  editTransaction: (id: string, input: TransactionInput) => { success: boolean; error?: string };
  deleteTransaction: (id: string) => void;
  // Savings goals actions
  addSavingsGoal: (input: SavingsGoalInput) => { success: boolean; error?: string };
  updateSavingsGoal: (id: string, input: Partial<SavingsGoalInput>) => { success: boolean; error?: string };
  depositToSavingsGoal: (goalId: string, amount: number) => { success: boolean; error?: string };
  withdrawFromSavingsGoal: (goalId: string, amount: number) => { success: boolean; error?: string };
  deleteSavingsGoal: (goalId: string) => void;
  // Settings & System
  updateSettings: (newSettings: Settings) => void;
  processAutoIncomeManually: () => number;
  markNotificationsAsRead: () => void;
  clearNotifications: () => void;
  resetAllData: () => void;
  restoreFromBackup: (jsonStr: string) => { success: boolean; message: string };
  // Modal controllers
  activeTab: 'home' | 'transaction' | 'history' | 'statistics' | 'settings' | 'savings' | 'calendar';
  setActiveTab: (tab: 'home' | 'transaction' | 'history' | 'statistics' | 'settings' | 'savings' | 'calendar') => void;
  activeTxModal: TransactionType | null;
  openTxModal: (type: TransactionType, txToEdit?: Transaction | null) => void;
  closeTxModal: () => void;
  editingTx: Transaction | null;
  triggerToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => loadSavingsGoals());
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadNotifications());

  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(() => {
    return localStorage.getItem('mymoney_hide_balance') === 'true';
  });

  const [isPinUnlocked, setIsPinUnlocked] = useState<boolean>(() => {
    // If no pin is set in loaded settings, consider unlocked
    const currentSettings = loadSettings();
    return !currentSettings.securityPin;
  });

  const [activeTab, setActiveTab] = useState<'home' | 'transaction' | 'history' | 'statistics' | 'settings' | 'savings' | 'calendar'>('home');
  const [activeTxModal, setActiveTxModal] = useState<TransactionType | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const triggerToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(20);
      } catch {
        // Ignored in non-supporting contexts
      }
    }
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3200);
  }, []);

  const toggleBalanceHidden = useCallback(() => {
    setIsBalanceHidden((prev) => {
      const next = !prev;
      localStorage.setItem('mymoney_hide_balance', String(next));
      return next;
    });
  }, []);

  // Compute balance
  const balance = useMemo(() => {
    return calculateBalance(transactions, savingsGoals);
  }, [transactions, savingsGoals]);

  // Compute next auto income info
  const autoIncomeStatus = useMemo(() => {
    return getNextIncomeInfo(settings, transactions);
  }, [settings, transactions]);

  // Push in-app notification helper
  const addAppNotification = useCallback(
    (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
      const newNotif: AppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        isRead: false,
        ...notification,
      };
      setNotifications((prev) => {
        const updated = [newNotif, ...prev].slice(0, 50); // Keep last 50
        saveNotifications(updated);
        return updated;
      });
    },
    []
  );

  // Check and process automated weekly income
  const checkAndProcessAutoIncome = useCallback(
    (currentSettings: Settings, currentTxs: Transaction[]) => {
      if (!currentSettings.autoIncomeEnabled) return 0;

      const missed = calculateMissedPeriods(currentSettings, currentTxs, new Date());
      if (missed.length > 0) {
        const newTxs = createTransactionsForMissedPeriods(missed, currentSettings.weeklyAmount);
        const updated = [...newTxs, ...currentTxs];
        setTransactions(updated);
        saveTransactions(updated);

        const totalAdded = missed.length * currentSettings.weeklyAmount;
        const msg =
          missed.length === 1
            ? `Pemasukan otomatis mingguan ${formatRupiah(currentSettings.weeklyAmount)} berhasil masuk ke saldo Anda!`
            : `Mendeteksi ${missed.length} periode mingguan terlewat. Total ${formatRupiah(totalAdded)} berhasil ditambahkan ke saldo!`;

        triggerToast(msg, 'success');

        if (currentSettings.autoIncomeAlert) {
          addAppNotification({
            title: 'Pemasukan Otomatis Berhasil',
            message: msg,
            type: 'auto_income',
          });
        }

        return missed.length;
      }
      return 0;
    },
    [triggerToast, addAppNotification]
  );

  // Run auto income check on startup and when settings change
  useEffect(() => {
    checkAndProcessAutoIncome(settings, transactions);
  }, []); // Run on mount

  // Sync theme
  useEffect(() => {
    const isDark =
      settings.themeMode === 'dark' ||
      (settings.themeMode === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.themeMode]);

  // Lock status
  const isPinLocked = useMemo(() => {
    return Boolean(settings.securityPin && !isPinUnlocked);
  }, [settings.securityPin, isPinUnlocked]);

  const unlockWithPin = useCallback(
    (enteredPin: string): boolean => {
      if (!settings.securityPin || enteredPin === settings.securityPin) {
        setIsPinUnlocked(true);
        triggerToast('Aplikasi berhasil dibuka', 'success');
        return true;
      }
      triggerToast('PIN salah. Silakan coba lagi.', 'error');
      return false;
    },
    [settings.securityPin, triggerToast]
  );

  const lockApp = useCallback(() => {
    if (settings.securityPin) {
      setIsPinUnlocked(false);
    }
  }, [settings.securityPin]);

  // Modal handlers
  const openTxModal = useCallback((type: TransactionType, txToEdit?: Transaction | null) => {
    setActiveTxModal(type);
    setEditingTx(txToEdit || null);
  }, []);

  const closeTxModal = useCallback(() => {
    setActiveTxModal(null);
    setEditingTx(null);
  }, []);

  // Add Transaction
  const addTransaction = useCallback(
    (input: TransactionInput): { success: boolean; error?: string } => {
      // Validate
      if (input.type === 'INCOME') {
        const val = validateIncome(input.amount);
        if (!val.isValid) return { success: false, error: val.error };
      } else {
        const val = validateExpense(input.amount, balance.freeBalance);
        if (!val.isValid) return { success: false, error: val.error };
      }

      const newTx: Transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        amount: Math.round(input.amount),
        type: input.type,
        category: input.category || (input.type === 'INCOME' ? 'Uang tambahan' : 'Lainnya'),
        description: input.description.trim() || (input.type === 'INCOME' ? 'Pemasukan Manual' : 'Pengeluaran Manual'),
        date: input.date || new Date().toISOString().split('T')[0],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const updated = [newTx, ...transactions];
      setTransactions(updated);
      saveTransactions(updated);

      // Low balance warning check if enabled
      if (input.type === 'EXPENSE' && settings.lowBalanceAlert) {
        const newFreeBalance = balance.freeBalance - input.amount;
        if (newFreeBalance <= settings.lowBalanceThreshold && newFreeBalance >= 0) {
          addAppNotification({
            title: 'Peringatan Saldo Rendah',
            message: `Sisa saldo bebas Anda tersisa ${formatRupiah(newFreeBalance)}. Waspadai pengeluaran tambahan!`,
            type: 'warning',
          });
        }
      }

      triggerToast(
        input.type === 'INCOME'
          ? `Berhasil menambah ${formatRupiah(input.amount)}`
          : `Pengeluaran ${formatRupiah(input.amount)} tercatat`,
        'success'
      );

      closeTxModal();
      return { success: true };
    },
    [transactions, balance.freeBalance, settings, addAppNotification, triggerToast, closeTxModal]
  );

  // Edit Transaction
  const editTransaction = useCallback(
    (id: string, input: TransactionInput): { success: boolean; error?: string } => {
      const original = transactions.find((t) => t.id === id);
      if (!original) {
        return { success: false, error: 'Transaksi tidak ditemukan' };
      }

      if (input.type === 'EXPENSE') {
        const val = validateExpense(input.amount, balance.freeBalance, original);
        if (!val.isValid) return { success: false, error: val.error };
      } else {
        const val = validateIncome(input.amount);
        if (!val.isValid) return { success: false, error: val.error };
      }

      const updated = transactions.map((tx) => {
        if (tx.id === id) {
          return {
            ...tx,
            amount: Math.round(input.amount),
            type: input.type,
            category: input.category,
            description: input.description.trim(),
            date: input.date,
            updatedAt: Date.now(),
          };
        }
        return tx;
      });

      setTransactions(updated);
      saveTransactions(updated);

      triggerToast('Perubahan transaksi berhasil disimpan', 'success');
      closeTxModal();
      return { success: true };
    },
    [transactions, balance.freeBalance, triggerToast, closeTxModal]
  );

  // Delete Transaction
  const deleteTransaction = useCallback(
    (id: string) => {
      const target = transactions.find((t) => t.id === id);
      if (!target) return;

      const updated = transactions.filter((t) => t.id !== id);
      setTransactions(updated);
      saveTransactions(updated);

      triggerToast(`Transaksi ${formatRupiah(target.amount)} berhasil dihapus`, 'info');
    },
    [transactions, triggerToast]
  );

  // Add Savings Goal
  const addSavingsGoal = useCallback(
    (input: SavingsGoalInput): { success: boolean; error?: string } => {
      if (!input.name.trim()) {
        return { success: false, error: 'Nama target tabungan wajib diisi' };
      }
      if (!input.targetAmount || input.targetAmount <= 0) {
        return { success: false, error: 'Nominal target tabungan harus lebih dari Rp0' };
      }

      const newGoal: SavingsGoal = {
        id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: input.name.trim(),
        targetAmount: Math.round(input.targetAmount),
        currentAmount: 0,
        targetDate: input.targetDate || undefined,
        categoryIcon: input.categoryIcon || 'Target',
        color: input.color || '#10B981',
        createdAt: Date.now(),
      };

      const updated = [...savingsGoals, newGoal];
      setSavingsGoals(updated);
      saveSavingsGoals(updated);

      triggerToast(`Target "${newGoal.name}" berhasil dibuat`, 'success');
      return { success: true };
    },
    [savingsGoals, triggerToast]
  );

  // Update Savings Goal details
  const updateSavingsGoal = useCallback(
    (id: string, input: Partial<SavingsGoalInput>): { success: boolean; error?: string } => {
      const updated = savingsGoals.map((goal) => {
        if (goal.id === id) {
          return {
            ...goal,
            name: input.name !== undefined ? input.name.trim() : goal.name,
            targetAmount: input.targetAmount !== undefined ? Math.round(input.targetAmount) : goal.targetAmount,
            targetDate: input.targetDate !== undefined ? input.targetDate : goal.targetDate,
            color: input.color || goal.color,
          };
        }
        return goal;
      });

      setSavingsGoals(updated);
      saveSavingsGoals(updated);
      triggerToast('Target tabungan berhasil diperbarui', 'success');
      return { success: true };
    },
    [savingsGoals, triggerToast]
  );

  // Deposit money into a savings goal (moves from free balance into goal)
  const depositToSavingsGoal = useCallback(
    (goalId: string, amount: number): { success: boolean; error?: string } => {
      if (amount <= 0) {
        return { success: false, error: 'Nominal tabungan harus lebih dari Rp0' };
      }
      if (amount > balance.freeBalance) {
        return {
          success: false,
          error: `Saldo bebas tidak mencukupi! Tersedia: ${formatRupiah(balance.freeBalance)}`,
        };
      }

      let achievedGoalName: string | null = null;

      const updated = savingsGoals.map((g) => {
        if (g.id === goalId) {
          const newCurrent = g.currentAmount + amount;
          if (newCurrent >= g.targetAmount && g.currentAmount < g.targetAmount) {
            achievedGoalName = g.name;
          }
          return { ...g, currentAmount: newCurrent };
        }
        return g;
      });

      setSavingsGoals(updated);
      saveSavingsGoals(updated);

      triggerToast(`Berhasil menyisihkan ${formatRupiah(amount)} ke tabungan`, 'success');

      if (achievedGoalName && settings.goalAlert) {
        addAppNotification({
          title: 'Target Tabungan Tercapai! 🎉',
          message: `Selamat! Target tabungan "${achievedGoalName}" telah mencapai 100%!`,
          type: 'goal',
        });
      }

      return { success: true };
    },
    [savingsGoals, balance.freeBalance, settings.goalAlert, triggerToast, addAppNotification]
  );

  // Withdraw money from a savings goal (moves back into free balance)
  const withdrawFromSavingsGoal = useCallback(
    (goalId: string, amount: number): { success: boolean; error?: string } => {
      const goal = savingsGoals.find((g) => g.id === goalId);
      if (!goal) return { success: false, error: 'Target tabungan tidak ditemukan' };

      if (amount <= 0) {
        return { success: false, error: 'Nominal penarikan harus lebih dari Rp0' };
      }
      if (amount > goal.currentAmount) {
        return {
          success: false,
          error: `Jumlah tabungan tidak mencukupi! Tersimpan: ${formatRupiah(goal.currentAmount)}`,
        };
      }

      const updated = savingsGoals.map((g) => {
        if (g.id === goalId) {
          return { ...g, currentAmount: g.currentAmount - amount };
        }
        return g;
      });

      setSavingsGoals(updated);
      saveSavingsGoals(updated);

      triggerToast(`Berhasil menarik ${formatRupiah(amount)} kembali ke saldo bebas`, 'info');
      return { success: true };
    },
    [savingsGoals, triggerToast]
  );

  // Delete Savings Goal
  const deleteSavingsGoal = useCallback(
    (goalId: string) => {
      const goal = savingsGoals.find((g) => g.id === goalId);
      if (!goal) return;

      // Note: any currentAmount automatically flows back into freeBalance
      const updated = savingsGoals.filter((g) => g.id !== goalId);
      setSavingsGoals(updated);
      saveSavingsGoals(updated);

      triggerToast(
        goal.currentAmount > 0
          ? `Target dihapus. Dana ${formatRupiah(goal.currentAmount)} kembali ke saldo bebas.`
          : `Target "${goal.name}" berhasil dihapus`,
        'info'
      );
    },
    [savingsGoals, triggerToast]
  );

  // Update Settings
  const updateSettings = useCallback(
    (newSettings: Settings) => {
      setSettings(newSettings);
      saveSettings(newSettings);
      triggerToast('Pengaturan berhasil diperbarui', 'success');
      // If auto-income was just re-enabled, check immediately
      if (newSettings.autoIncomeEnabled) {
        checkAndProcessAutoIncome(newSettings, transactions);
      }
    },
    [checkAndProcessAutoIncome, transactions, triggerToast]
  );

  // Process auto-income manually (e.g. from countdown card or settings)
  const processAutoIncomeManually = useCallback((): number => {
    return checkAndProcessAutoIncome(settings, transactions);
  }, [checkAndProcessAutoIncome, settings, transactions]);

  const markNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, isRead: true }));
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    saveNotifications([]);
    triggerToast('Seluruh notifikasi telah dihapus', 'info');
  }, [triggerToast]);

  const resetAllData = useCallback(() => {
    clearAllData();
    const freshSettings = loadSettings();
    setTransactions([]);
    setSavingsGoals([]);
    setSettings(freshSettings);
    setNotifications([]);
    setIsPinUnlocked(true);
    triggerToast('Seluruh data aplikasi berhasil direset ke kondisi awal', 'info');
  }, [triggerToast]);

  const restoreFromBackup = useCallback(
    (jsonStr: string) => {
      const result = importBackupJSON(jsonStr);
      if (result.success) {
        setTransactions(loadTransactions());
        setSavingsGoals(loadSavingsGoals());
        setSettings(loadSettings());
        setNotifications(loadNotifications());
        triggerToast(result.message, 'success');
      } else {
        triggerToast(result.message, 'error');
      }
      return result;
    },
    [triggerToast]
  );

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        savingsGoals,
        settings,
        notifications,
        unreadNotificationCount,
        balance,
        autoIncomeStatus,
        isBalanceHidden,
        toggleBalanceHidden,
        isPinLocked,
        isPinUnlocked,
        unlockWithPin,
        lockApp,
        addTransaction,
        editTransaction,
        deleteTransaction,
        addSavingsGoal,
        updateSavingsGoal,
        depositToSavingsGoal,
        withdrawFromSavingsGoal,
        deleteSavingsGoal,
        updateSettings,
        processAutoIncomeManually,
        markNotificationsAsRead,
        clearNotifications,
        resetAllData,
        restoreFromBackup,
        activeTab,
        setActiveTab,
        activeTxModal,
        openTxModal,
        closeTxModal,
        editingTx,
        triggerToast,
        toast,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
