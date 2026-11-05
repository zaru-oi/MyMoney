/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  toast: {
    message: string;
    type: 'success' | 'error' | 'info';
  } | null;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  if (!toast) return null;

  const bgStyles = {
    success: 'bg-emerald-800 text-white border-emerald-700 shadow-emerald-950/20',
    error: 'bg-rose-800 text-white border-rose-700 shadow-rose-950/20',
    info: 'bg-slate-800 text-white border-slate-700 shadow-slate-950/20',
  }[toast.type];

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  }[toast.type];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-14 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md pointer-events-none transition-all duration-200"
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md ${bgStyles}`}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium leading-snug">{toast.message}</span>
      </div>
    </div>
  );
};
