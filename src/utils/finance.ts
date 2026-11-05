/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, SavingsGoal, BalanceSummary } from '../types/finance';

/**
 * Format integer IDR into Indonesian Rupiah format: e.g. Rp50.000, Rp1.500.000
 */
export function formatRupiah(amount: number, options?: { showSign?: boolean; type?: 'INCOME' | 'EXPENSE' }): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp0';
  }

  const isNegative = amount < 0;
  const absVal = Math.round(Math.abs(amount));
  const formatted = absVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (options?.showSign && options.type) {
    const sign = options.type === 'INCOME' ? '+' : '-';
    return `${sign} Rp${formatted}`;
  }

  return `${isNegative ? '-' : ''}Rp${formatted}`;
}

/**
 * Parses user input string (e.g. "50.000", "50000", "Rp 50.000") into a clean positive integer.
 */
export function parseRupiahInput(value: string): number {
  if (!value) return 0;
  // Remove non-numeric characters
  const clean = value.replace(/[^\d]/g, '');
  const parsed = parseInt(clean, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculates current balance metrics:
 * - Gross Balance: Total Income minus Total Expense
 * - Total Savings: Sum of active savings in savings goals
 * - Free Balance: Gross Balance minus Total Savings (unallocated cash ready to spend)
 */
export function calculateBalance(
  transactions: Transaction[],
  savingsGoals: SavingsGoal[] = []
): BalanceSummary {
  let totalIncome = 0;
  let totalExpense = 0;

  for (const tx of transactions) {
    if (tx.type === 'INCOME') {
      totalIncome += Math.round(tx.amount);
    } else if (tx.type === 'EXPENSE') {
      totalExpense += Math.round(tx.amount);
    }
  }

  const grossBalance = totalIncome - totalExpense;

  let totalSavings = 0;
  for (const goal of savingsGoals) {
    totalSavings += Math.max(0, Math.round(goal.currentAmount || 0));
  }

  const freeBalance = grossBalance - totalSavings;

  return {
    grossBalance,
    freeBalance,
    totalIncome,
    totalExpense,
    totalSavings,
  };
}

/**
 * Validates an expense against the available free balance.
 * If editing an existing transaction, we adjust for the previous transaction amount.
 */
export function validateExpense(
  amount: number,
  currentFreeBalance: number,
  editingOriginalTx?: Transaction | null
): { isValid: boolean; error?: string } {
  if (!amount || amount <= 0) {
    return {
      isValid: false,
      error: 'Nominal pengeluaran harus lebih besar dari Rp0',
    };
  }

  // If editing an existing expense, the old expense amount is added back to available balance
  const effectiveAvailable =
    currentFreeBalance +
    (editingOriginalTx && editingOriginalTx.type === 'EXPENSE'
      ? editingOriginalTx.amount
      : 0);

  if (amount > effectiveAvailable) {
    return {
      isValid: false,
      error: `Saldo tidak mencukupi! Saldo bebas saat ini ${formatRupiah(
        effectiveAvailable
      )}, tetapi pengeluaran yang dimasukkan sebesar ${formatRupiah(amount)}.`,
    };
  }

  return { isValid: true };
}

/**
 * Validates income input.
 */
export function validateIncome(amount: number): { isValid: boolean; error?: string } {
  if (!amount || amount <= 0) {
    return {
      isValid: false,
      error: 'Nominal pemasukan harus lebih besar dari Rp0',
    };
  }
  return { isValid: true };
}

/**
 * Filters transactions by period: 'today', 'week', 'month', 'year', 'all'
 */
export function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: 'today' | 'week' | 'month' | 'year' | 'all',
  referenceDate: Date = new Date()
): Transaction[] {
  if (period === 'all') return transactions;

  const now = referenceDate;
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

  // Start of week (Monday or Sunday - let's treat Monday as start of week)
  const currentDay = now.getDay();
  const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday).getTime();

  // Start of month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  // Start of year
  const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

  return transactions.filter((tx) => {
    // tx.date is YYYY-MM-DD
    const [y, m, d] = tx.date.split('-').map(Number);
    const txTime = new Date(y, m - 1, d).getTime();

    switch (period) {
      case 'today':
        return txTime >= startOfDay && txTime <= endOfDay;
      case 'week':
        return txTime >= startOfWeek && txTime <= endOfDay;
      case 'month':
        return txTime >= startOfMonth && txTime <= endOfDay;
      case 'year':
        return txTime >= startOfYear && txTime <= endOfDay;
      default:
        return true;
    }
  });
}

/**
 * Gets expense breakdown by category with totals and percentages.
 */
export interface CategoryBreakdown {
  category: string;
  total: number;
  percentage: number;
  count: number;
  color: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Makanan dan minuman': '#F43F5E', // Rose
  'Transportasi': '#0EA5E9', // Sky
  'Pendidikan': '#8B5CF6', // Purple
  'Hiburan': '#F59E0B', // Amber
  'Belanja': '#EC4899', // Pink
  'Kebutuhan pribadi': '#10B981', // Emerald
  'Tagihan & Pulsa': '#6366F1', // Indigo
  'Kesehatan': '#14B8A6', // Teal
  'Lainnya': '#64748B', // Slate
  'Uang Mingguan': '#10B981',
  'Pemasukan Otomatis': '#059669',
  'Uang tambahan': '#3B82F6',
  'Hadiah': '#8B5CF6',
  'Uang saku': '#F59E0B',
  'Hasil penjualan': '#10B981',
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || '#64748B';
}

export function getExpenseCategoryBreakdown(transactions: Transaction[]): CategoryBreakdown[] {
  const expenseTxs = transactions.filter((tx) => tx.type === 'EXPENSE');
  const totals: Record<string, { total: number; count: number }> = {};
  let overallTotal = 0;

  for (const tx of expenseTxs) {
    if (!totals[tx.category]) {
      totals[tx.category] = { total: 0, count: 0 };
    }
    totals[tx.category].total += tx.amount;
    totals[tx.category].count += 1;
    overallTotal += tx.amount;
  }

  const breakdown: CategoryBreakdown[] = Object.keys(totals).map((cat) => {
    const total = totals[cat].total;
    const percentage = overallTotal > 0 ? Math.round((total / overallTotal) * 100) : 0;
    return {
      category: cat,
      total,
      percentage,
      count: totals[cat].count,
      color: getCategoryColor(cat),
    };
  });

  // Sort descending by total
  return breakdown.sort((a, b) => b.total - a.total);
}

/**
 * Breakdown of Automatic Income vs Manual Income
 */
export function getIncomeBreakdown(transactions: Transaction[]): {
  autoIncomeTotal: number;
  manualIncomeTotal: number;
  totalIncome: number;
  autoIncomeCount: number;
  manualIncomeCount: number;
} {
  const incomeTxs = transactions.filter((tx) => tx.type === 'INCOME');
  let autoIncomeTotal = 0;
  let manualIncomeTotal = 0;
  let autoIncomeCount = 0;
  let manualIncomeCount = 0;

  for (const tx of incomeTxs) {
    if (tx.automaticPeriodId || tx.category === 'Pemasukan Otomatis' || tx.description === 'Uang Mingguan') {
      autoIncomeTotal += tx.amount;
      autoIncomeCount += 1;
    } else {
      manualIncomeTotal += tx.amount;
      manualIncomeCount += 1;
    }
  }

  return {
    autoIncomeTotal,
    manualIncomeTotal,
    totalIncome: autoIncomeTotal + manualIncomeTotal,
    autoIncomeCount,
    manualIncomeCount,
  };
}
