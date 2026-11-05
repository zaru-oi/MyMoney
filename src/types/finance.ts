/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  amount: number; // Integer (in IDR)
  type: TransactionType;
  category: string;
  description: string;
  date: string; // ISO format YYYY-MM-DD
  createdAt: number;
  updatedAt: number;
  automaticPeriodId?: string | null; // e.g. "weekly_2026-W45"
  goalId?: string | null; // Associated savings goal if applicable
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number; // Integer
  currentAmount: number; // Integer
  targetDate?: string; // Optional YYYY-MM-DD
  categoryIcon?: string;
  color?: string;
  createdAt: number;
}

export interface Settings {
  weeklyAmount: number; // Default 50000
  weeklyDay: number; // 0 = Minggu (Sunday), 1 = Senin (Monday), etc. Default 0
  startDate: string; // YYYY-MM-DD
  lastProcessedPeriod?: string;
  autoIncomeEnabled: boolean;
  currency: string; // 'IDR'
  themeMode: 'light' | 'dark' | 'system';
  lowBalanceAlert: boolean;
  lowBalanceThreshold: number; // e.g. 20000
  autoIncomeAlert: boolean;
  goalAlert: boolean;
  securityPin?: string; // 4-digit PIN or empty
  customIncomeCategories: string[];
  customExpenseCategories: string[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'auto_income' | 'reminder' | 'goal' | 'transaction' | 'warning' | 'system';
  timestamp: number;
  isRead: boolean;
}

export interface BalanceSummary {
  grossBalance: number; // Total Income - Total Expense
  freeBalance: number; // grossBalance - totalSavingsAllocated
  totalIncome: number;
  totalExpense: number;
  totalSavings: number;
}

export interface AutoIncomeStatus {
  nextDate: string; // Formatted date in Indonesian
  nextDateRaw: Date;
  daysRemaining: number;
  countdownText: string;
  periodId: string;
  isPending: boolean;
}
