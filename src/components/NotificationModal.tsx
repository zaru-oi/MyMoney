/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Bell,
  X,
  Sparkles,
  AlertTriangle,
  Award,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Check,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { AppNotification } from '../types/finance';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    markNotificationsAsRead,
    clearNotifications,
  } = useFinance();

  if (!isOpen) return null;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'auto_income':
        return <Sparkles className="w-4 h-4 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'goal':
        return <Award className="w-4 h-4 text-sky-500" />;
      case 'transaction':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.toLocaleDateString('id-ID')} ${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Notifikasi Finansial
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-actions */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={markNotificationsAsRead}
              className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
            >
              <Check className="w-3.5 h-3.5" />
              Tandai Semua Dibaca
            </button>
            <button
              onClick={clearNotifications}
              className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold hover:underline"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Bersihkan
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Tidak ada notifikasi baru saat ini.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  notif.isRead
                    ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800/70'
                    : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatTime(notif.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
