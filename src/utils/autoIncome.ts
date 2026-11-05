/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Settings, Transaction, AutoIncomeStatus } from '../types/finance';

export const INDONESIAN_DAYS = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

export const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/**
 * Format a Date object into Indonesian human date (e.g. "Minggu, 8 November 2026")
 */
export function formatIndonesianDate(date: Date): string {
  const dayName = INDONESIAN_DAYS[date.getDay()];
  const day = date.getDate();
  const monthName = INDONESIAN_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${day} ${monthName} ${year}`;
}

/**
 * Format ISO string YYYY-MM-DD to Indonesian date
 */
export function formatIndonesianDateString(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return formatIndonesianDate(date);
}

/**
 * Generates ISO week number string, e.g. "2026-W45"
 */
export function getISOWeekId(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Generates unique period ID for a scheduled income date, e.g. "auto_week_2026_11_08"
 */
export function getPeriodIdForDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `auto_week_${y}_${m}_${d}`;
}

export interface MissedPeriod {
  periodId: string;
  scheduledDate: Date;
  dateString: string; // YYYY-MM-DD
}

/**
 * Calculates any weekly occurrences between startDate and currentDate that have not yet
 * been processed into transactions.
 * Prevents any duplication by checking existing transaction.automaticPeriodId.
 */
export function calculateMissedPeriods(
  settings: Settings,
  existingTransactions: Transaction[],
  currentDate: Date = new Date()
): MissedPeriod[] {
  if (!settings.autoIncomeEnabled) {
    return [];
  }

  // Set of all existing automaticPeriodIds
  const processedPeriodIds = new Set<string>();
  for (const tx of existingTransactions) {
    if (tx.automaticPeriodId) {
      processedPeriodIds.add(tx.automaticPeriodId);
    }
  }

  const [startY, startM, startD] = settings.startDate.split('-').map(Number);
  const start = new Date(startY, startM - 1, startD, 0, 0, 0, 0);

  const targetDay = settings.weeklyDay; // 0 = Sunday, 1 = Monday, etc.

  // Find the first occurrence of targetDay on or after start
  const cursor = new Date(start);
  while (cursor.getDay() !== targetDay) {
    cursor.setDate(cursor.getDate() + 1);
  }

  const todayEnd = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
    23,
    59,
    59,
    999
  );

  const missed: MissedPeriod[] = [];

  // Iterate week by week until today
  while (cursor <= todayEnd) {
    const periodId = getPeriodIdForDate(cursor);

    if (!processedPeriodIds.has(periodId)) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, '0');
      const d = String(cursor.getDate()).padStart(2, '0');

      missed.push({
        periodId,
        scheduledDate: new Date(cursor),
        dateString: `${y}-${m}-${d}`,
      });
    }

    // Step forward 7 days
    cursor.setDate(cursor.getDate() + 7);
  }

  return missed;
}

/**
 * Generates transaction records for missed periods.
 */
export function createTransactionsForMissedPeriods(
  missedPeriods: MissedPeriod[],
  amount: number
): Transaction[] {
  return missedPeriods.map((period) => {
    const now = Date.now();
    return {
      id: `tx_${period.periodId}_${Math.random().toString(36).substring(2, 9)}`,
      amount,
      type: 'INCOME',
      category: 'Pemasukan Otomatis',
      description: 'Uang Mingguan',
      date: period.dateString,
      createdAt: period.scheduledDate.getTime(),
      updatedAt: now,
      automaticPeriodId: period.periodId,
    };
  });
}

/**
 * Calculates the next upcoming automatic income date and countdown details.
 */
export function getNextIncomeInfo(
  settings: Settings,
  existingTransactions: Transaction[],
  currentDate: Date = new Date()
): AutoIncomeStatus {
  const targetDay = settings.weeklyDay;
  const targetDayName = INDONESIAN_DAYS[targetDay];

  const now = new Date(currentDate);
  const todayDay = now.getDay();

  // Find next occurrence
  let daysUntil = (targetDay - todayDay + 7) % 7;

  // Check if today is the target day and if today's period is already processed
  const todayPeriodId = getPeriodIdForDate(now);
  const isTodayProcessed = existingTransactions.some(
    (tx) => tx.automaticPeriodId === todayPeriodId
  );

  if (daysUntil === 0) {
    if (isTodayProcessed) {
      // If already processed today, next is 7 days from now
      daysUntil = 7;
    } else {
      // Pending today!
      daysUntil = 0;
    }
  }

  const nextDate = new Date(now);
  nextDate.setDate(nextDate.getDate() + daysUntil);
  nextDate.setHours(9, 0, 0, 0);

  const formattedDate = formatIndonesianDate(nextDate);

  let countdownText = '';
  if (daysUntil === 0) {
    countdownText = isTodayProcessed ? 'Sudah diterima hari ini' : 'Hari ini (Siap diproses)';
  } else if (daysUntil === 1) {
    countdownText = 'Besok (1 hari lagi)';
  } else {
    countdownText = `${daysUntil} hari lagi`;
  }

  return {
    nextDate: formattedDate,
    nextDateRaw: nextDate,
    daysRemaining: daysUntil,
    countdownText,
    periodId: getPeriodIdForDate(nextDate),
    isPending: daysUntil === 0 && !isTodayProcessed,
  };
}
