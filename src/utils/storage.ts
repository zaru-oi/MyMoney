/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, SavingsGoal, Settings, AppNotification } from '../types/finance';

const STORAGE_KEYS = {
  TRANSACTIONS: 'mymoney_transactions_v1',
  SAVINGS_GOALS: 'mymoney_savings_goals_v1',
  SETTINGS: 'mymoney_settings_v1',
  NOTIFICATIONS: 'mymoney_notifications_v1',
};

export const DEFAULT_INCOME_CATEGORIES = [
  'Uang tambahan',
  'Hadiah',
  'Uang saku',
  'Hasil penjualan',
  'Bonus',
  'Lainnya',
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Makanan dan minuman',
  'Transportasi',
  'Pendidikan',
  'Hiburan',
  'Belanja',
  'Kebutuhan pribadi',
  'Tagihan & Pulsa',
  'Kesehatan',
  'Lainnya',
];

export const DEFAULT_SETTINGS: Settings = {
  weeklyAmount: 50000,
  weeklyDay: 0, // 0 = Minggu (Sunday)
  startDate: new Date().toISOString().split('T')[0],
  autoIncomeEnabled: true,
  currency: 'IDR',
  themeMode: 'light',
  lowBalanceAlert: true,
  lowBalanceThreshold: 20000,
  autoIncomeAlert: true,
  goalAlert: true,
  securityPin: '',
  customIncomeCategories: DEFAULT_INCOME_CATEGORIES,
  customExpenseCategories: DEFAULT_EXPENSE_CATEGORIES,
};

export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error loading transactions from localStorage:', err);
    return [];
  }
}

export function saveTransactions(txs: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
  } catch (err) {
    console.error('Error saving transactions to localStorage:', err);
  }
}

export function loadSavingsGoals(): SavingsGoal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVINGS_GOALS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error loading savings goals from localStorage:', err);
    return [];
  }
}

export function saveSavingsGoals(goals: SavingsGoal[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(goals));
  } catch (err) {
    console.error('Error saving savings goals to localStorage:', err);
  }
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      customIncomeCategories: parsed.customIncomeCategories || DEFAULT_INCOME_CATEGORIES,
      customExpenseCategories: parsed.customExpenseCategories || DEFAULT_EXPENSE_CATEGORIES,
    };
  } catch (err) {
    console.error('Error loading settings from localStorage:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings to localStorage:', err);
  }
}

export function loadNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error loading notifications:', err);
    return [];
  }
}

export function saveNotifications(notifications: AppNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  } catch (err) {
    console.error('Error saving notifications:', err);
  }
}

export interface BackupData {
  version: number;
  timestamp: string;
  appName: string;
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  settings: Settings;
  notifications: AppNotification[];
}

export function exportBackupJSON(): string {
  const data: BackupData = {
    version: 1,
    timestamp: new Date().toISOString(),
    appName: 'MyMoney',
    transactions: loadTransactions(),
    savingsGoals: loadSavingsGoals(),
    settings: loadSettings(),
    notifications: loadNotifications(),
  };
  return JSON.stringify(data, null, 2);
}

export function importBackupJSON(jsonString: string): { success: boolean; message: string } {
  try {
    const parsed = JSON.parse(jsonString) as BackupData;
    if (!parsed || !Array.isArray(parsed.transactions)) {
      return { success: false, message: 'Format data backup tidak valid!' };
    }

    saveTransactions(parsed.transactions);
    if (Array.isArray(parsed.savingsGoals)) {
      saveSavingsGoals(parsed.savingsGoals);
    }
    if (parsed.settings && typeof parsed.settings === 'object') {
      saveSettings({
        ...DEFAULT_SETTINGS,
        ...parsed.settings,
      });
    }
    if (Array.isArray(parsed.notifications)) {
      saveNotifications(parsed.notifications);
    }

    return {
      success: true,
      message: `Berhasil memulihkan ${parsed.transactions.length} transaksi dan data lainnya.`,
    };
  } catch (err) {
    return {
      success: false,
      message: 'Gagal membaca berkas JSON: ' + (err instanceof Error ? err.message : String(err)),
    };
  }
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  localStorage.removeItem(STORAGE_KEYS.SAVINGS_GOALS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
}
