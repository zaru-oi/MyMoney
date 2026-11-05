/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatRupiah,
  parseRupiahInput,
  calculateBalance,
  validateExpense,
  validateIncome,
  getExpenseCategoryBreakdown,
  getIncomeBreakdown,
} from './finance';
import {
  calculateMissedPeriods,
  createTransactionsForMissedPeriods,
  getNextIncomeInfo,
  getPeriodIdForDate,
} from './autoIncome';
import { Transaction, Settings, SavingsGoal } from '../types/finance';

test('formatRupiah formats values with Indonesian Rupiah dots', () => {
  assert.equal(formatRupiah(0), 'Rp0');
  assert.equal(formatRupiah(50000), 'Rp50.000');
  assert.equal(formatRupiah(100000), 'Rp100.000');
  assert.equal(formatRupiah(1500000), 'Rp1.500.000');
  assert.equal(formatRupiah(25000, { showSign: true, type: 'INCOME' }), '+ Rp25.000');
  assert.equal(formatRupiah(15000, { showSign: true, type: 'EXPENSE' }), '- Rp15.000');
});

test('parseRupiahInput cleans string input into valid integer IDR', () => {
  assert.equal(parseRupiahInput('Rp 50.000'), 50000);
  assert.equal(parseRupiahInput('100.000'), 100000);
  assert.equal(parseRupiahInput('1500000'), 1500000);
  assert.equal(parseRupiahInput(''), 0);
  assert.equal(parseRupiahInput('abc'), 0);
});

test('Verification of Section 16 Scenarios (Scenarios 1-6 & 10)', () => {
  let transactions: Transaction[] = [];
  const savingsGoals: SavingsGoal[] = [];

  // Initial State: Saldo awal Rp0
  let balance = calculateBalance(transactions, savingsGoals);
  assert.equal(balance.grossBalance, 0);
  assert.equal(balance.freeBalance, 0);

  // Skenario 1: Pemasukan otomatis mingguan Rp50.000 -> Saldo: Rp50.000
  const autoTx: Transaction = {
    id: 'tx_auto_1',
    amount: 50000,
    type: 'INCOME',
    category: 'Pemasukan Otomatis',
    description: 'Uang Mingguan',
    date: '2026-11-01',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    automaticPeriodId: 'auto_week_2026_11_01',
  };
  transactions.push(autoTx);
  balance = calculateBalance(transactions, savingsGoals);
  assert.equal(balance.grossBalance, 50000);
  assert.equal(balance.freeBalance, 50000);

  // Skenario 2: Pengguna menambahkan Rp20.000 -> Saldo: Rp70.000
  const manualIncomeTx: Transaction = {
    id: 'tx_manual_income_2',
    amount: 20000,
    type: 'INCOME',
    category: 'Uang tambahan',
    description: 'Bonus kerja sampingan',
    date: '2026-11-02',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  transactions.push(manualIncomeTx);
  balance = calculateBalance(transactions, savingsGoals);
  assert.equal(balance.grossBalance, 70000);
  assert.equal(balance.freeBalance, 70000);

  // Skenario 3: Pengguna mengurangi Rp15.000 -> Saldo: Rp55.000
  const expense1: Transaction = {
    id: 'tx_expense_1',
    amount: 15000,
    type: 'EXPENSE',
    category: 'Makanan dan minuman',
    description: 'Makan siang',
    date: '2026-11-03',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  transactions.push(expense1);
  balance = calculateBalance(transactions, savingsGoals);
  assert.equal(balance.grossBalance, 55000);
  assert.equal(balance.freeBalance, 55000);

  // Skenario 4: Pengguna mengurangi Rp10.000 -> Saldo: Rp45.000
  const expense2: Transaction = {
    id: 'tx_expense_2',
    amount: 10000,
    type: 'EXPENSE',
    category: 'Transportasi',
    description: 'Ongkos busway',
    date: '2026-11-03',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  transactions.push(expense2);
  balance = calculateBalance(transactions, savingsGoals);
  assert.equal(balance.grossBalance, 45000);
  assert.equal(balance.freeBalance, 45000);

  // Skenario 5: Pengguna mengedit pengeluaran Rp10.000 menjadi Rp5.000 -> Saldo harus berubah menjadi Rp50.000
  transactions = transactions.map((tx) =>
    tx.id === 'tx_expense_2' ? { ...tx, amount: 5000, updatedAt: Date.now() } : tx
  );
  balance = calculateBalance(transactions, savingsGoals);
  assert.equal(balance.grossBalance, 50000);
  assert.equal(balance.freeBalance, 50000);

  // Skenario 6: Pengguna menghapus transaksi pemasukan Rp20.000 -> Saldo harus berubah menjadi Rp30.000
  transactions = transactions.filter((tx) => tx.id !== 'tx_manual_income_2');
  balance = calculateBalance(transactions, savingsGoals);
  assert.equal(balance.grossBalance, 30000);
  assert.equal(balance.freeBalance, 30000);

  // Skenario 10: Pengguna mencoba melakukan pengeluaran lebih besar daripada saldo tersedia (Saldo: Rp30.000, mencoba Rp35.000)
  const validationOver = validateExpense(35000, balance.freeBalance);
  assert.equal(validationOver.isValid, false);
  assert.match(validationOver.error || '', /Saldo tidak mencukupi/);

  // Valid expense should pass (misal Rp15.000)
  const validationOk = validateExpense(15000, balance.freeBalance);
  assert.equal(validationOk.isValid, true);
});

test('Skenario 8: Duplication Prevention - opening multiple times never creates duplicate automatic income', () => {
  const settings: Settings = {
    weeklyAmount: 50000,
    weeklyDay: 0, // Sunday
    startDate: '2026-11-01', // Sunday Nov 1, 2026
    autoIncomeEnabled: true,
    currency: 'IDR',
    themeMode: 'light',
    lowBalanceAlert: true,
    lowBalanceThreshold: 20000,
    autoIncomeAlert: true,
    goalAlert: true,
    customIncomeCategories: [],
    customExpenseCategories: [],
  };

  const existingTransactions: Transaction[] = [];
  const currentDate = new Date(2026, 10, 1); // Nov 1, 2026

  // First opening on Sunday Nov 1
  const missed1 = calculateMissedPeriods(settings, existingTransactions, currentDate);
  assert.equal(missed1.length, 1);
  assert.equal(missed1[0].periodId, 'auto_week_2026_11_01');

  // Process it
  const createdTxs = createTransactionsForMissedPeriods(missed1, settings.weeklyAmount);
  existingTransactions.push(...createdTxs);

  // Second opening later the same day or week (e.g. Wednesday Nov 4)
  const wednesday = new Date(2026, 10, 4);
  const missed2 = calculateMissedPeriods(settings, existingTransactions, wednesday);
  assert.equal(missed2.length, 0); // NO DUPLICATION!

  // Third opening on Saturday Nov 7
  const saturday = new Date(2026, 10, 7);
  const missed3 = calculateMissedPeriods(settings, existingTransactions, saturday);
  assert.equal(missed3.length, 0); // STILL NO DUPLICATION!
});

test('Skenario 9: Catch-up Mechanism - app not opened for 3 weeks catches up cleanly', () => {
  const settings: Settings = {
    weeklyAmount: 50000,
    weeklyDay: 0, // Sunday
    startDate: '2026-11-01',
    autoIncomeEnabled: true,
    currency: 'IDR',
    themeMode: 'light',
    lowBalanceAlert: true,
    lowBalanceThreshold: 20000,
    autoIncomeAlert: true,
    goalAlert: true,
    customIncomeCategories: [],
    customExpenseCategories: [],
  };

  const existingTransactions: Transaction[] = [];

  // Opened 3 weeks later on Sunday Nov 22, 2026
  // Should detect 4 Sundays: Nov 1, Nov 8, Nov 15, Nov 22
  const threeWeeksLater = new Date(2026, 10, 22);
  const missed = calculateMissedPeriods(settings, existingTransactions, threeWeeksLater);

  assert.equal(missed.length, 4);
  assert.equal(missed[0].periodId, 'auto_week_2026_11_01');
  assert.equal(missed[1].periodId, 'auto_week_2026_11_08');
  assert.equal(missed[2].periodId, 'auto_week_2026_11_15');
  assert.equal(missed[3].periodId, 'auto_week_2026_11_22');

  const created = createTransactionsForMissedPeriods(missed, settings.weeklyAmount);
  existingTransactions.push(...created);

  const balance = calculateBalance(existingTransactions);
  // 4 weeks * 50.000 = 200.000
  assert.equal(balance.grossBalance, 200000);

  // Opening again immediately yields 0 missed
  const missedAfterCatchup = calculateMissedPeriods(settings, existingTransactions, threeWeeksLater);
  assert.equal(missedAfterCatchup.length, 0);
});

test('Savings Goals allocation protects money from being spent while retaining net worth', () => {
  const transactions: Transaction[] = [
    {
      id: 'tx_1',
      amount: 100000,
      type: 'INCOME',
      category: 'Gaji',
      description: 'Saldo awal',
      date: '2026-11-01',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  const goals: SavingsGoal[] = [
    {
      id: 'goal_1',
      name: 'Dana Darurat',
      targetAmount: 500000,
      currentAmount: 40000,
      createdAt: Date.now(),
    },
  ];

  const balance = calculateBalance(transactions, goals);
  assert.equal(balance.grossBalance, 100000); // Net worth is still 100k
  assert.equal(balance.totalSavings, 40000); // 40k locked in savings
  assert.equal(balance.freeBalance, 60000); // Only 60k free to spend

  // Trying to spend 70k fails because free balance is 60k
  const validation = validateExpense(70000, balance.freeBalance);
  assert.equal(validation.isValid, false);

  // Spending 50k succeeds
  const validationOk = validateExpense(50000, balance.freeBalance);
  assert.equal(validationOk.isValid, true);
});
