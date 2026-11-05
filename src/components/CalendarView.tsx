/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatRupiah, getCategoryColor } from '../utils/finance';
import {
  INDONESIAN_DAYS,
  INDONESIAN_MONTHS,
  formatIndonesianDate,
} from '../utils/autoIncome';

export const CalendarView: React.FC = () => {
  const { transactions, openTxModal } = useFinance();

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Group transactions by date string YYYY-MM-DD
  const dateMap = useMemo(() => {
    const map = new Map<
      string,
      {
        hasIncome: boolean;
        hasExpense: boolean;
        hasAutoIncome: boolean;
        incomeTotal: number;
        expenseTotal: number;
        count: number;
      }
    >();

    for (const tx of transactions) {
      const existing = map.get(tx.date) || {
        hasIncome: false,
        hasExpense: false,
        hasAutoIncome: false,
        incomeTotal: 0,
        expenseTotal: 0,
        count: 0,
      };

      if (tx.type === 'INCOME') {
        existing.hasIncome = true;
        existing.incomeTotal += tx.amount;
        if (tx.automaticPeriodId) {
          existing.hasAutoIncome = true;
        }
      } else {
        existing.hasExpense = true;
        existing.expenseTotal += tx.amount;
      }
      existing.count += 1;

      map.set(tx.date, existing);
    }

    return map;
  }, [transactions]);

  // Calendar matrix days calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{
      day: number;
      dateStr: string;
      isCurrentMonth: boolean;
      indicators?: {
        hasIncome: boolean;
        hasExpense: boolean;
        hasAutoIncome: boolean;
      };
    }> = [];

    // Empty slots before first day
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: 0, dateStr: '', isCurrentMonth: false });
    }

    // Days in current month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateStr = `${year}-${mStr}-${dStr}`;
      const info = dateMap.get(dateStr);

      days.push({
        day: d,
        dateStr,
        isCurrentMonth: true,
        indicators: info
          ? {
              hasIncome: info.hasIncome,
              hasExpense: info.hasExpense,
              hasAutoIncome: info.hasAutoIncome,
            }
          : undefined,
      });
    }

    return days;
  }, [year, month, dateMap]);

  // Selected date transactions
  const selectedTransactions = useMemo(() => {
    return transactions.filter((t) => t.date === selectedDateStr);
  }, [transactions, selectedDateStr]);

  const selectedDateSummary = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const tx of selectedTransactions) {
      if (tx.type === 'INCOME') inc += tx.amount;
      else exp += tx.amount;
    }
    return { inc, exp };
  }, [selectedTransactions]);

  const selectedDateObject = useMemo(() => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDateStr]);

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-200">
      {/* Calendar Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Month Selector */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-600" />
            {INDONESIAN_MONTHS[month]} {year}
          </h2>

          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              aria-label="Bulan sebelumnya"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMonth}
              aria-label="Bulan berikutnya"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-500 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Pemasukan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Pengeluaran</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span>Uang Mingguan Otomatis</span>
          </div>
        </div>

        {/* Day Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400">
          {INDONESIAN_DAYS.map((dayName, idx) => (
            <div key={dayName} className={idx === 0 ? 'text-rose-500 font-extrabold' : ''}>
              {dayName.substring(0, 3)}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {calendarDays.map((item, idx) => {
            if (!item.isCurrentMonth) {
              return <div key={`empty_${idx}`} className="h-10" />;
            }

            const isSelected = item.dateStr === selectedDateStr;
            const isToday =
              item.dateStr === new Date().toISOString().split('T')[0];

            return (
              <button
                key={item.dateStr}
                onClick={() => setSelectedDateStr(item.dateStr)}
                className={`h-11 rounded-2xl flex flex-col items-center justify-center relative transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-extrabold shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500/40'
                    : isToday
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-xs">{item.day}</span>

                {/* Colored dots indicators */}
                <div className="flex items-center gap-0.5 mt-0.5 h-1.5">
                  {item.indicators?.hasAutoIncome && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-sky-500'
                      }`}
                    />
                  )}
                  {item.indicators?.hasIncome && !item.indicators?.hasAutoIncome && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-emerald-500'
                      }`}
                    />
                  )}
                  {item.indicators?.hasExpense && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-rose-200' : 'bg-rose-500'
                      }`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Transaction Details */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {formatIndonesianDate(selectedDateObject)}
            </h3>
            <p className="text-xs text-slate-500">
              {selectedTransactions.length} aktivitas pada tanggal ini
            </p>
          </div>

          <div className="text-right text-xs">
            <span className="text-emerald-600 font-bold block">
              +{formatRupiah(selectedDateSummary.inc)}
            </span>
            <span className="text-rose-600 font-bold block">
              -{formatRupiah(selectedDateSummary.exp)}
            </span>
          </div>
        </div>

        {selectedTransactions.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Tidak ada transaksi pada tanggal ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {selectedTransactions.map((tx) => {
              const isIncome = tx.type === 'INCOME';
              const catColor = getCategoryColor(tx.category);

              return (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 font-bold text-xs"
                      style={{ backgroundColor: catColor }}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {tx.description || tx.category}
                        </span>
                        {tx.automaticPeriodId && (
                          <Sparkles className="w-3 h-3 text-emerald-500" />
                        )}
                      </div>
                      <span className="text-xs text-slate-400">{tx.category}</span>
                    </div>
                  </div>

                  <span
                    className={`text-sm font-bold font-mono ${
                      isIncome
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatRupiah(tx.amount, { showSign: true, type: tx.type })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
